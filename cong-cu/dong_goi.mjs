#!/usr/bin/env node
/**
 * Dong goi mot thu muc asset roi day len GitHub Releases cua chinh repo nay.
 *
 * VI SAO O RELEASES, KHONG TRONG GIT. File trong git cung 100 MB - `.glb` 1 GB thi chia
 * cach nao cung vuong. Releases cho 2 GiB moi file, 1.000 file moi release, khong gioi
 * han tong va khong gioi han bang thong. Git lai giu moi ban cu vinh vien: thay mot me
 * asset la repo phinh them ca me cu.
 *
 * BA BAY:
 *
 * 1. `POST /user/repos` bi chan tu may ao: `403 sessions are bound to their configured
 *    repositories`. Repo phai do chu du an tao tay; duong `repos/{owner}/{repo}/...` thi
 *    chay binh thuong.
 * 2. `api.github.com` doi `Content-Type: application/json`, thieu la `415`.
 * 3. Tai len phai vao `uploads.github.com`, khong phai `api.github.com`, va duong dan lay
 *    tu `upload_url` cua release (bo phan `{?name,label}`).
 *
 * Dung:
 *   node cong-cu/dong_goi.mjs ../quoc-chien/assets_source/icosa icosa
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const REPO = 'gc1001vn-svg/kho-game';
const TAM = '/home/user/goi';
/** Tran moi phan. Releases cho 2 GiB; 1,5 GiB de chua cho sai so. */
const TRAN_PHAN = 1.5 * 1024 ** 3;

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  console.error('Thieu GITHUB_TOKEN.');
  process.exit(1);
}

const [duong, ten] = process.argv.slice(2);
if (!duong || !ten) {
  console.error('Dung: node cong-cu/dong_goi.mjs <duong-dan-thu-muc> <ten-nguon>');
  process.exit(1);
}
if (!existsSync(duong)) {
  console.error(`Khong thay ${duong}`);
  process.exit(1);
}

function api(duongApi, tuyChon = {}) {
  const args = [
    '-s', '--http1.1', '--max-time', '120',
    '-H', `Authorization: Bearer ${token}`,
    '-H', 'Accept: application/vnd.github+json',
    '-H', 'Content-Type: application/json',
    duongApi.startsWith('http') ? duongApi : `https://api.github.com${duongApi}`,
  ];
  if (tuyChon.body) args.push('-X', tuyChon.method || 'POST', '-d', tuyChon.body);
  const ra = execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  return ra ? JSON.parse(ra) : {};
}

// Buoc 1: tar thu muc, cat thanh phan neu vuot tran.
mkdirSync(TAM, { recursive: true });
const tar = join(TAM, `${ten}.tar`);
if (existsSync(tar)) unlinkSync(tar);
console.log(`tar ${duong} -> ${tar}`);
execFileSync('tar', ['-cf', tar, '-C', dirname(duong), basename(duong)]);
const co = statSync(tar).size;

let phan = [tar];
if (co > TRAN_PHAN) {
  console.log(`${(co / 1024 ** 3).toFixed(2)} GiB - cat thanh phan`);
  execFileSync('split', ['-b', String(TRAN_PHAN), '-d', tar, `${tar}.phan`]);
  unlinkSync(tar);
  phan = readdirSync(TAM).filter((f) => f.startsWith(`${ten}.tar.phan`)).sort()
    .map((f) => join(TAM, f));
}

// Buoc 2: tao release (co roi thi dung lai), roi tai tung phan len.
const tag = `kho-${ten}`;
let rel = api(`/repos/${REPO}/releases/tags/${tag}`);
if (!rel.upload_url) {
  rel = api(`/repos/${REPO}/releases`, {
    body: JSON.stringify({
      tag_name: tag,
      name: `Kho ${ten}`,
      body: `Goi asset nguon \`${ten}\`. Lay ve: \`node cong-cu/lay.mjs ${ten}\`.`,
    }),
  });
}
if (!rel.upload_url) {
  console.error('Khong tao duoc release:', JSON.stringify(rel).slice(0, 300));
  process.exit(1);
}

const dangCo = new Set((rel.assets || []).map((a) => a.name));
const url = rel.upload_url.replace(/\{.*\}$/, '');
for (const p of phan) {
  const ten_ = basename(p);
  if (dangCo.has(ten_)) { console.log(`co san ${ten_}`); continue; }
  const mb = (statSync(p).size / 1024 ** 2).toFixed(0);
  console.log(`tai len ${ten_} (${mb} MB)`);
  const ra = execFileSync('curl', [
    '-s', '--http1.1', '--max-time', '3600',
    '-H', `Authorization: Bearer ${token}`,
    '-H', 'Content-Type: application/octet-stream',
    '--data-binary', `@${p}`,
    `${url}?name=${encodeURIComponent(ten_)}`,
  ], { encoding: 'utf8', maxBuffer: 1 << 26 });
  const j = ra ? JSON.parse(ra) : {};
  console.log(j.browser_download_url ? `xong ${j.size} byte` : `HONG: ${JSON.stringify(j).slice(0, 200)}`);
}
console.log(`Release: https://github.com/${REPO}/releases/tag/${tag}`);
