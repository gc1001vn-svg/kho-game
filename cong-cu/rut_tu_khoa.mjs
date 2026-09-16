#!/usr/bin/env node
/**
 * Rut bo tu khoa pho bien tu chinh muc luc Icosa (73.626 ten model) -> `cong-cu/tu_khoa.json`.
 *
 * VI SAO. Poly Pizza chi co `/v1.1/search/<tu khoa>`, khong co duong duyet het kho, nen
 * muc luc cua no chi rong bang bo tu khoa dem vao. Tu nghi tay duoc ~160 tu va no phan anh
 * tri nho cua nguoi viet, khong phan anh kho. Dem tu trong ten model that thi ra dung thu
 * kho co nhieu.
 *
 * Dung: node cong-cu/rut_tu_khoa.mjs [so tu, mac dinh 400]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const KE = join(import.meta.dirname, '..', 'ke', 'icosa.tsv');
const RA = join(import.meta.dirname, 'tu_khoa.json');
const SO_TU = Number(process.argv[2]) || 400;
/**
 * Tu khong mang nghia do. Ba nhom, deu do that tren `ke/icosa.tsv`:
 * mao tu va tu chung chung · DUOI FILE lot vao ten (`fbx` 580 lan, `obj` 566, `gltf`) ·
 * TIEN TO cua mot bo suu tap (`totc` 1.186 lan, `tfx` 943, `pre` 978, `pro` 737) - chung
 * dung dau bang dem nhung do ra chi mot bo, khong phai mot loai do vat.
 */
const BO = new Set(`the a an of and or my his her its for with without in on at to from by
test low poly lowpoly high untitled new old first second final version copy remix render
model models scene object thing stuff simple basic my3d 3d 2d one two three four five
free sample demo project final2 wip draft edit edited fixed done
fbx obj glb gltf dae blend max png jpg jpeg mtl zip
totc tfx pre pro comb mod ver alt tmp temp asset assets item items part parts set
untitled1 untitled2 export exported import imported`.split(/\s+/));

if (!existsSync(KE)) {
  console.error(`Khong thay ${KE}. Chay \`node cong-cu/quet_icosa.mjs\` truoc.`);
  process.exit(1);
}

const dem = new Map();
const dong = readFileSync(KE, 'utf8').split('\n');
const cot = dong[0].split('\t');
const iTen = cot.indexOf('ten');
for (const d of dong.slice(1)) {
  if (!d) continue;
  const ten = (d.split('\t')[iTen] || '').toLowerCase();
  // Tach theo ky tu khong phai chu; bo tu ngan va tu trong danh sach bo.
  for (const t of ten.split(/[^a-z]+/)) {
    if (t.length < 3 || t.length > 18 || BO.has(t)) continue;
    dem.set(t, (dem.get(t) || 0) + 1);
  }
}

const top = [...dem.entries()].sort((a, b) => b[1] - a[1]).slice(0, SO_TU);
writeFileSync(RA, JSON.stringify({
  _: 'Sinh tu dong boi cong-cu/rut_tu_khoa.mjs - dem tu trong ten model cua ke/icosa.tsv.',
  tu: top.map(([t]) => t),
}, null, 1) + '\n');
console.log(`${dem.size} tu khac nhau · giu ${top.length} tu pho bien nhat -> ${RA}`);
console.log('10 tu dau:', top.slice(0, 10).map(([t, n]) => `${t}(${n})`).join(' '));
