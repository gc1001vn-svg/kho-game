#!/usr/bin/env node
/**
 * Quet muc luc font Google Fonts -> `ke/font.tsv`. Gan het la **OFL**, dung duoc.
 *
 * BA DUONG DA THU, chi mot cai chay:
 * - `fonts.google.com/metadata/fonts` -> `000` (chan).
 * - `api.fontsource.org/v1/fonts` -> `000` (chan).
 * - `api.github.com/repos/google/fonts/...` -> `403 GitHub access to this repository is
 *   not enabled for this session` - ke ca khi dinh kem `GITHUB_TOKEN`.
 * - **`raw.githubusercontent.com` thi `200`** -> lay file index `tags/all/families.csv`
 *   cua chinh repo `google/fonts`.
 *
 * File do la bang `<ten font>,,<the>,<diem>` - mot font nhieu dong the khac nhau, nen
 * phai gom lai theo ten.
 *
 * KHONG lay license tung font o day: `METADATA.pb` nam trong tung thu muc, hoi 1.900 lan
 * la 1.900 luot goi. Thu muc cha da noi license: `ofl/` = SIL Open Font License,
 * `apache/` = Apache 2.0, `ufl/` = Ubuntu Font License. Cot `license` ghi theo do khi
 * biet duong dan, khong thi de `OFL (pho bien nhat, kiem lai truoc khi dung)`.
 *
 * Dung: node cong-cu/quet_font.mjs
 */
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';

const chay_lenh = promisify(execFile);
const RA = 'ke/font.tsv';
const CSV = 'https://raw.githubusercontent.com/google/fonts/main/tags/all/families.csv';

const lay = async (url) => (await chay_lenh('curl', [
  '-s', '--http1.1', '--max-time', '120', url,
], { encoding: 'utf8', maxBuffer: 1 << 28 })).stdout;

const sach = (s) => String(s ?? '').replace(/[\t\r\n]+/g, ' ').trim();
const csv = await lay(CSV);

/** ten font -> tap the (bo diem so, giu chu). */
const font = new Map();
for (const d of csv.split('\n')) {
  if (!d.trim()) continue;
  const o = d.split(',');
  const ten = sach(o[0]);
  if (!ten) continue;
  const the = sach(o[2] || '').replace(/^\//, '').replace(/\//g, ' ');
  if (!font.has(ten)) font.set(ten, new Set());
  if (the) font.get(ten).add(the);
}

const dong = ['ten\ttac_gia\tlicense\tthe\tcach_lay'];
for (const [ten, the] of [...font.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  dong.push([
    ten,
    '?',
    'OFL (kiem lai METADATA.pb cua font do truoc khi dung)',
    [...the].slice(0, 12).join(','),
    `https://fonts.google.com/specimen/${encodeURIComponent(ten).replace(/%20/g, '+')}`,
  ].join('\t'));
}

mkdirSync('ke', { recursive: true });
writeFileSync(RA, dong.join('\n') + '\n');
console.log(`Font: ${dong.length - 1} ho font -> ${RA}`);
