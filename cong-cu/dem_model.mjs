#!/usr/bin/env node
/**
 * Dem MODEL 3D NUONG DUOC trong kho. In ra so, dung de chep vao tai lieu.
 *
 * VI SAO CAN. "Kho co bao nhieu model" la cau hoi moi phien deu hoi, va moi phien deu
 * tra loi bang mot con so khac vi dem kieu khac: co phien dem ca FBX (may nuong chua doc
 * duoc), co phien dem ca Poly Pizza (do duoc nhung TAI KHONG DUOC), co phien dem luot
 * file thay vi model duy nhat. Lenh nay chot MOT cach dem, in ra ca thu bi loai va vi sao.
 *
 * BON DIEU KIEN de goi la "nuong duoc", thieu mot la loai:
 *   1. License CC0 · CC-BY · MIT (luat 3). SA/ND da bi loai tu buoc quet.
 *   2. Dinh dang may nuong doc duoc: `.obj` · `.gltf` · `.glb`. **`.fbx` thi CHUA.**
 *   3. <= 8.000 tam giac (tran cua may nuong sprite).
 *   4. TAI DUOC tu may ao. Poly Pizza dut o day: `static.poly.pizza` tra 403 cua
 *      Cloudflare, ke ca khi lai Chromium.
 *
 * Dung: node cong-cu/dem_model.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KE = join(import.meta.dirname, '..', 'ke');
const TRAN_TAM = 8000;

const doc = (f) => {
  const dong = readFileSync(join(KE, f), 'utf8').split('\n').filter(Boolean);
  const cot = dong[0].split('\t');
  return dong.slice(1).map((d) => Object.fromEntries(d.split('\t').map((v, i) => [cot[i], v])));
};
const soTamDat = (v) => v !== '' && Number(v) > 0 && Number(v) <= TRAN_TAM;

const ra = [];

// --- Icosa: nguon lon nhat, tai duoc that (da do 1.671 model tren dia 15/09) ---
const icosa = doc('icosa.tsv');
const icosaOk = icosa.filter((r) => /GLB|GLTF/.test(r.dinh_dang || '') && soTamDat(r.so_tam));
ra.push(['Icosa Gallery', icosaOk.length, icosa.length, 'GLB/GLTF, tai qua wayback']);

// --- Poly Haven: CC0 toan bo, API mo khong can khoa ---
const ph = doc('polyhaven.tsv').filter((r) => r.loai === 'models');
const phOk = ph.filter((r) => soTamDat(r.so_tam));
ra.push(['Poly Haven', phOk.length, ph.length, 'CC0, API mo']);

// --- Hai ban ke duoi la GOI, khong ke le tung model ---
const kenney3d = doc('kenney.tsv').filter((r) => /3D/.test(r.loai || '')).length;
const itch3d = doc('itch.tsv').filter((r) => /3D|3d/.test(r.tag || '')).length;

// --- Da nam tren dia / kho chung: TAP CON cua Kenney · Quaternius · KayKit, dung cong ---
// Bo 1.689 dong Icosa nam nham trong ban ke du an truoc khi dem, khong thi cong hai lan.
const tren_dia = new Set(doc('quoc-chien-assets.tsv')
  .filter((r) => !r.goi.includes('/icosa/'))
  .map((r) => `${r.goi.split('/')[1]}\t${r.ten}`)).size;
const kho_chung = new Set(doc('tayvuc-kho-chung.tsv')
  .map((r) => `${r.goi.split('/').slice(0, 2).join('/')}\t${r.ten}`)).size;

// --- Loai: do duoc nhung tai khong duoc ---
const pp = doc('poly-pizza.tsv');
const ppTam = pp.filter((r) => soTamDat(r.so_tam)).length;

let tong = 0;
console.log(`Model 3D NUONG DUOC — <= ${TRAN_TAM} tam, dinh dang .obj/.gltf/.glb, tai duoc\n`);
for (const [ten, ok, ca, ghi] of ra) {
  tong += ok;
  console.log(`  ${ten.padEnd(16)} ${String(ok).padStart(6)} / ${String(ca).padStart(6)}  ${ghi}`);
}
console.log(`  ${'—'.padEnd(16)} ${String(tong).padStart(6)}   model le\n`);
console.log(`  Goi chua ke le:  Kenney 3D ${kenney3d} goi · itch.io CC0 3D ${itch3d} goi`);
console.log(`  Da tren dia:     quoc-chien ${tren_dia} · kho chung tayvuc ${kho_chung}`);
console.log(`                   (tap con cua Kenney/Quaternius/KayKit — DUNG cong vao tong)\n`);
console.log(`  LOAI — do duoc, tai khong duoc:  Poly Pizza ${ppTam}/${pp.length} <= ${TRAN_TAM} tam`);
console.log('                   static.poly.pizza tra 403 cua Cloudflare, ke ca khi lai Chromium');
