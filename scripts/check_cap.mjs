#!/usr/bin/env node
// Thuoc: hai file phai khop nhau thi khong duoc sua mot ben roi bo quen ben kia.
//
// Vi sao co thuoc nay: luat "moi luat dung mot cho" giai duoc chuyen CHEP, nhung
// khong giai duoc chuyen HAI FILE PHU THUOC NHAU. `GAME_SPEC.md` doi mot con so
// thi `TECH_SPEC.md` co the sai theo, va AGENTS.md doi bay buoc dau phien thi
// `docs/DAU_PHIEN.md` sai theo. Khong ai nho doi chieu — may nho duoc.
//
// Cach lam chep tu `Human-Agent-Society/reef` (Apache-2.0):
// `.github/scripts/check_readme_i18n.py` + `README.i18n.yaml` giu hash cua cap
// `README.md`/`README.zh.md` lan cuoi NGUOI xac nhan da khop. Sua mot ben la
// hash lech, thuoc do, buoc doc lai ca hai roi ghi lai hash.
//
// Thuoc nay KHONG doc noi dung, khong biet the nao la "khop" — viec do la cua
// nguoi. No chi bat dung bo quen.
//
//   node scripts/check_cap.mjs         # do
//   node scripts/check_cap.mjs --ghi   # da doc lai CA HAI va thay khop -> ghi moc moi

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const DS_CAP = '.claude/cap_file.txt';
const MOC = '.claude/cap_file.hash';

const ghi = process.argv.includes('--ghi');

if (!existsSync(DS_CAP)) {
  console.log(`${DS_CAP} khong ton tai — bo qua`);
  process.exit(0);
}

/** Moi dong `a|b`, dong `#` la ghi chu. */
const cap = [];
for (const dong of readFileSync(DS_CAP, 'utf8').split('\n')) {
  const sach = dong.trim();
  if (!sach || sach.startsWith('#')) continue;
  const ve = sach.split('|').map((x) => x.trim());
  if (ve.length !== 2 || !ve[0] || !ve[1]) {
    console.error(`HONG: dong sai khuon trong ${DS_CAP}: ${sach}\n  Khuon dung: duong/dan/a.md | duong/dan/b.md`);
    process.exit(1);
  }
  cap.push(ve);
}

const bam = (p) => createHash('sha1').update(readFileSync(p)).digest('hex').slice(0, 12);

/** Moc cu: moi dong `duong/dan sha`. */
const cu = new Map();
if (existsSync(MOC)) {
  for (const dong of readFileSync(MOC, 'utf8').split('\n')) {
    const sach = dong.trim();
    if (!sach || sach.startsWith('#')) continue;
    const [p, h] = sach.split(/\s+/);
    cu.set(p, h);
  }
}

const thieu = [];
const lech = [];
const moi = new Map();

for (const [a, b] of cap) {
  for (const p of [a, b]) {
    if (!existsSync(p)) {
      thieu.push(p);
      continue;
    }
    moi.set(p, bam(p));
  }
  if (thieu.length) continue;
  const doiA = cu.get(a) !== moi.get(a);
  const doiB = cu.get(b) !== moi.get(b);
  const trangThai = doiA && doiB ? 'ca hai doi' : doiA ? `chi ${a} doi` : doiB ? `chi ${b} doi` : 'y moc';
  console.log(`  ${a} | ${b}  — ${trangThai}`);
  if (doiA || doiB) lech.push({ a, b, doiA, doiB });
}

if (thieu.length) {
  console.error(`HONG: khong tim thay file: ${thieu.join(', ')}\n  Sua ${DS_CAP} hoac tao file.`);
  process.exit(1);
}

if (ghi) {
  const noiDung =
    '# Hash cua cac cap file lan cuoi NGUOI doc lai ca hai va thay khop.\n' +
    '# Ghi lai bang: node scripts/check_cap.mjs --ghi\n' +
    [...moi].map(([p, h]) => `${p} ${h}`).join('\n') +
    '\n';
  writeFileSync(MOC, noiDung);
  console.log(`Da ghi moc moi vao ${MOC} cho ${moi.size} file.`);
  process.exit(0);
}

console.log(`${DS_CAP}: ${cap.length} cap`);

if (lech.length) {
  console.error(
    'HONG: cap file da lech moc — mot ben doi ma chua ai xac nhan ben kia con dung:\n' +
      lech.map((l) => `  ${l.a} | ${l.b}`).join('\n') +
      '\n  Doc lai CA HAI file trong cap. Sua cho nao con lech.\n' +
      '  Thay da khop thi ghi moc moi: node scripts/check_cap.mjs --ghi',
  );
  process.exit(1);
}
