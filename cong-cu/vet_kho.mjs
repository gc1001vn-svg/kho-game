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
 *   2. Khong dong nao mang license SA/ND, NC, GPL hay "giu moi quyen" (luat 3; NC/GPL them 03/10), license la thi nhac. Rieng `ke/ma-nguon-mo.tsv` duoc mien:
 *      no ke MA NGUON de doc kien truc, khong phai asset de dung, va co cot `canh_bao`.
 *   3. Cot `id` (neu co) khong trung nhau.
 *   4. `?` license — dem, so voi tran o `cong-cu/nguong_vet.json`. CHI DUOC TUT.
 *   5. Khong file nhi phan trong git (luat 1).
 *   6. `cong-cu/tu_dien.json` con do (ban duy nhat tu 29/09 - `quoc-chien` goi sang day).
 *
 * Dung: node cong-cu/vet_kho.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { docTuDien } from './tim.mjs';

const GOC = join(import.meta.dirname, '..');
const KE = join(GOC, 'ke');
const NGUONG = join(GOC, 'cong-cu', 'nguong_vet.json');
/** Ban ke duoc mien luat SA/ND: ke ma nguon de HOC, khong phai asset de dung. */
const MIEN_SA_ND = new Set(['ma-nguon-mo.tsv']);
/** Luat 3: SA lay license sang ca du an, ND cam phai sinh. */
const CAM_SA_ND = /-SA|sharealike|-ND|noderiv/i;
/** Cung luat 3, them 03/10: YetiForce tu goi "ma nguon mo" roi doi sang license phi thuong mai.
 *  NC cam dung thuong mai, GPL lay license nhu SA, "giu moi quyen" la khong cho gi. */
const CAM_KHAC = /(^|[^a-z])NC([^a-z]|$)|non-?commercial|\bA?GPL|\bLGPL|all.rights.reserved/i;
/** Ho license da co trong kho (dem 03/10). Gap ho khac -> nhac xem tay, khong do. */
const QUEN = /CC-?0|public ?domain|publicdomain|CC.?BY|CREATIVE_COMMONS_BY|creativecommons\.org\/licenses\/by\/|MIT|OFL|Open Font|Apache|BSD|MPL|Unlicense|Zlib|Ubuntu Font|^\?$/i;
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
    const lic = (d) => d.split('\t')[iLic] || '';
    const xau = than.filter((d) => CAM_SA_ND.test(lic(d)));
    if (xau.length) loi.push(`${f}: ${xau.length} dong license SA/ND — luat 3 cam`);
    const cam = than.filter((d) => !CAM_SA_ND.test(lic(d)) && CAM_KHAC.test(lic(d)));
    if (cam.length) loi.push(`${f}: ${cam.length} dong license NC/GPL/giu moi quyen (vd \`${lic(cam[0]).slice(0, 40)}\`) — luat 3 chi nhan CC0 · CC-BY · MIT`);
    const la = than.filter((d) => !QUEN.test(lic(d)) && !CAM_SA_ND.test(lic(d)) && !CAM_KHAC.test(lic(d)));
    if (la.length) nhac.push(`${f}: ${la.length} dong license la (vd \`${lic(la[0]).slice(0, 40)}\`) — xem tay co hop luat 3 khong`);
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

// --- 6: tu dien con do ---
// 29/09 `quoc-chien` bo ban tu dien rieng, goi thang ban nay: chi con MOT ban, het lech.
const TU = join(GOC, 'cong-cu', 'tu_dien.json');
if (!existsSync(TU)) {
  loi.push('thieu cong-cu/tu_dien.json — `do.mjs` mat duong dich tieng Viet');
} else if (!docTuDien().dau.size) {
  loi.push('cong-cu/tu_dien.json rong — `do.mjs` mat duong dich tieng Viet');
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
