#!/usr/bin/env node
/**
 * Lay mot nguon asset tu Releases ve `assets_source/<ten-nguon>/`.
 *
 * Chay lai duoc: thu muc da co thi bo qua, khong tai lai 1 GB.
 *
 * KHONG can token: repo Public nen `browser_download_url` tai thang duoc. Nhung van phai
 * `--http1.1` va `-L` (Releases chuyen huong sang `objects.githubusercontent.com`).
 *
 * Dung:
 *   node cong-cu/lay.mjs icosa
 *   node cong-cu/lay.mjs icosa /duong/dan/khac
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REPO = 'gc1001vn-svg/kho-game';
const TAM = '/tmp/kho-game-goi';

const [ten, dichNgoai] = process.argv.slice(2);
if (!ten) {
  console.error('Dung: node cong-cu/lay.mjs <ten-nguon> [duong-dan-dich]');
  process.exit(1);
}
const dich = dichNgoai || 'assets_source';
if (existsSync(join(dich, ten)) && readdirSync(join(dich, ten)).length) {
  console.log(`${join(dich, ten)} da co - bo qua. Muon tai lai thi xoa thu muc do truoc.`);
  process.exit(0);
}

const curl = (args) => execFileSync('curl', ['-s', '-L', '--http1.1', '--max-time', '3600', ...args], {
  encoding: 'utf8',
  maxBuffer: 1 << 26,
});

const rel = JSON.parse(curl([`https://api.github.com/repos/${REPO}/releases/tags/kho-${ten}`]));
if (!rel.assets?.length) {
  console.error(`Khong thay release kho-${ten}. Co gi trong kho: xem ke/`);
  process.exit(1);
}

mkdirSync(TAM, { recursive: true });
mkdirSync(dich, { recursive: true });
const phan = [];
for (const a of rel.assets.sort((x, y) => x.name.localeCompare(y.name))) {
  const p = join(TAM, a.name);
  if (existsSync(p) && statSync(p).size === a.size) { console.log(`co san ${a.name}`); phan.push(p); continue; }
  console.log(`tai ${a.name} (${(a.size / 1024 ** 2).toFixed(0)} MB)`);
  curl(['-o', p, a.browser_download_url]);
  phan.push(p);
}

// Nhieu phan thi noi lai truoc khi bung - `split` cat giua dong byte, tar khong doc roi le.
// KHONG dung `--strip-components`: goi da co san thu muc goc ten `<ten-nguon>/`.
const tar = join(TAM, `${ten}.tar`);
if (phan.length === 1 && phan[0].endsWith('.tar')) {
  execFileSync('tar', ['-xf', phan[0], '-C', dich]);
} else {
  execFileSync('bash', ['-c', `cat ${phan.map((p) => `'${p}'`).join(' ')} > '${tar}'`]);
  execFileSync('tar', ['-xf', tar, '-C', dich]);
  rmSync(tar, { force: true });
}
console.log(`Xong -> ${join(dich, ten)}`);
