#!/usr/bin/env node
/**
 * Thuoc RA KHO: kiem `ke/*.tsv` con dung luat cua repo nay khong.
 *
 * VI SAO CAN. Truoc 18/09 `scripts/do.sh` chi co `check:token` va `check:kehoach` —
 * hai thuoc mac dinh cua `cai_dat.mjs`, KHONG dong toi ban ke. Tuc thu quan trong nhat
 * cua repo (14 ban ke, 262.702 muc) khong co thuoc nao giu. Ba luat o `CLAUDE.md` chi la
 * chu phai nho, ma chu phai nho thi hong lang.
 *
 * Kiem sau thu, ba thu dau HONG la thoat 1:
 *   1. Moi `ke/*.tsv` co header, co cot `ten` va `license`, so cot moi dong deu nhau.
 *   2. Khong dong nao mang license SA/ND (luat 3). Rieng `ke/ma-nguon-mo.tsv` duoc mien:
 *      no ke MA NGUON de doc kien truc, khong phai asset de dung, va co cot `canh_bao`.
 *   3. Cot `id` (neu co) khong trung nhau.
 *   4. `?` license — dem, so voi tran o `cong-cu/nguong_vet.json`. CHI DUOC TUT.
 *   5. Khong file nhi phan trong git (luat 1).
 *   6. `cong-cu/tu_dien.json` khong lech voi ban cua `quoc-chien` neu repo do nam canh.
 *
 * Dung: node cong-cu/vet_kho.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const GOC = join(import.meta.dirname, '..');
const KE = join(GOC, 'ke');
const NGUONG = join(GOC, 'cong-cu', 'nguong_vet.json');
/** Ban ke duoc mien luat SA/ND: ke ma nguon de HOC, khong phai asset de dung. */
const MIEN_SA_ND = new Set(['ma-nguon-mo.tsv']);
/** Duoi file nhi phan — luat 1 cam commit vao repo nay. */
const NHI_PHAN = /\.(glb|gltf|bin|fbx|obj|png|jpe?g|webp|zip|7z|tar|gz|wav|mp3|ogg|ttf|otf|woff2?)$/i;

const loi = [];
const nhac = [];

// --- 1..4: tung ban ke ---
let tongDong = 0;
let tongHoi = 0;
const tsv = readdirSync(KE).filter((f) => f.endsWith('.tsv')).sort();
if (!tsv.length) loi.push('ke/ khong co ban ke nao');

for (const f of tsv) {
  const dong = readFileSync(join(KE, f), 'utf8').split('\n').filter(Boolean);
  if (dong.length < 2) { loi.push(`${f}: rong`); continue; }
  const cot = dong[0].split('\t');
  for (const c of ['ten', 'license']) {
    if (!cot.includes(c)) loi.push(`${f}: thieu cot bat buoc \`${c}\``);
  }
  const iLic = cot.indexOf('license');
  const iId = cot.indexOf('id');
  const than = dong.slice(1);
  tongDong += than.length;

  const lech = than.filter((d) => d.split('\t').length !== cot.length).length;
  if (lech) loi.push(`${f}: ${lech} dong lech so cot (header ${cot.length})`);

  if (iLic >= 0 && !MIEN_SA_ND.has(f)) {
    const xau = than.filter((d) => /-SA|sharealike|-ND|noderiv/i.test(d.split('\t')[iLic] || ''));
    if (xau.length) loi.push(`${f}: ${xau.length} dong license SA/ND — luat 3 cam`);
  }

  if (iId >= 0) {
    const thay = new Set();
    let trung = 0;
    for (const d of than) {
      const id = d.split('\t')[iId];
      if (thay.has(id)) trung++; else thay.add(id);
    }
    if (trung) loi.push(`${f}: ${trung} \`id\` trung`);
  }

  if (iLic >= 0) tongHoi += than.filter((d) => (d.split('\t')[iLic] || '').trim() === '?').length;
}

// --- 5: nhi phan trong git ---
try {
  const theoDoi = execFileSync('git', ['-C', GOC, 'ls-files'], { encoding: 'utf8' }).split('\n');
  const xau = theoDoi.filter((p) => p && NHI_PHAN.test(p));
  if (xau.length) loi.push(`git dang giu ${xau.length} file nhi phan (luat 1): ${xau.slice(0, 3).join(' ')}`);
} catch {
  nhac.push('khong chay duoc `git ls-files` — bo qua kiem nhi phan');
}

// --- 6: tu dien lech ---
const TU = join(GOC, 'cong-cu', 'tu_dien.json');
const TU_PHU = join(GOC, '..', 'quoc-chien', 'tools', 'tu_dien_asset.json');
if (!existsSync(TU)) {
  loi.push('thieu cong-cu/tu_dien.json — `do.mjs` mat duong dich tieng Viet');
} else if (existsSync(TU_PHU)) {
  const a = JSON.parse(readFileSync(TU, 'utf8')).tu || {};
  const b = JSON.parse(readFileSync(TU_PHU, 'utf8')).tu || {};
  const thieu = Object.keys(b).filter((k) => !a[k]);
  if (thieu.length) nhac.push(`tu_dien.json thieu ${thieu.length} tu so voi quoc-chien: ${thieu.slice(0, 6).join(' ')}`);
}

// --- 4: tran `?` chi duoc tut ---
const nguong = existsSync(NGUONG) ? JSON.parse(readFileSync(NGUONG, 'utf8')) : {};
const tranHoi = Number.isFinite(nguong.thieu_ghi_cong) ? nguong.thieu_ghi_cong : tongHoi;
if (tongHoi > tranHoi) {
  loi.push(`license \`?\`: ${tongHoi} > tran ${tranHoi}. Luat 2: ban ke LA ban ghi cong`);
} else if (tongHoi < tranHoi) {
  writeFileSync(NGUONG, `${JSON.stringify({ ...nguong, thieu_ghi_cong: tongHoi }, null, 2)}\n`);
  nhac.push(`license \`?\` tut ${tranHoi} -> ${tongHoi}, da ha tran`);
}

console.log(`${tsv.length} ban ke · ${tongDong} muc · license \`?\` ${tongHoi}/${tranHoi}`);
for (const n of nhac) console.log(`  nhac: ${n}`);
for (const l of loi) console.log(`  HONG: ${l}`);
process.exit(loi.length ? 1 : 0);
