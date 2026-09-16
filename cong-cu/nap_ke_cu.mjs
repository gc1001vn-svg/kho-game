#!/usr/bin/env node
/**
 * Doi ban ke Markdown cua cac du an cu (`KHO_ASSET.md`, `KHO_CHUNG.md`) sang TSV cua kho
 * nay, de moi nguon do chung mot lenh `cong-cu/do.mjs`.
 *
 * Dang cua hai file do: moi goi mot khoi
 *
 *     **`<duong dan goi>`** — 41 model
 *
 *     `ten1` · `ten2` · `ten3`
 *
 * LICENSE: KHONG doan. Chi dien khi goi nam trong bang duoi (lay tu `ASSET_CREDITS.md`
 * cua `quoc-chien`); con lai de `?` - luat repo: khong ro thi in `?`, dung doan.
 *
 * Dung:
 *   node cong-cu/nap_ke_cu.mjs ../quoc-chien/docs/KHO_ASSET.md quoc-chien-assets \
 *     "npm run tai:itch <goi> o repo quoc-chien"
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const LICENSE = [
  [/kenney/i, 'CC0 1.0'],
  [/quaternius/i, 'CC0 1.0'],
  [/kaykit|kaylousberg/i, 'CC0 1.0'],
  [/polyhaven/i, 'CC0 1.0'],
  [/city-builder-bits|medieval-hexagon|medieval-builder/i, 'CC0 1.0'],
];

const [nguon, ten, cachLay] = process.argv.slice(2);
if (!nguon || !ten) {
  console.error('Dung: node cong-cu/nap_ke_cu.mjs <file .md> <ten-nguon> [cach-lay]');
  process.exit(1);
}

const sach = (s) => String(s ?? '').replace(/[\t\r\n]+/g, ' ').trim();
const chu = readFileSync(nguon, 'utf8');
const dong = ['goi\tten\tlicense\tcach_lay'];
let goi = null;
let soGoi = 0;

for (const d of chu.split('\n')) {
  const mGoi = d.match(/^\*\*`([^`]+)`\*\*\s+—/);
  if (mGoi) { goi = mGoi[1]; soGoi++; continue; }
  // Dong ten model: chuoi cac `ten` noi bang dau cham giua.
  if (!goi || !d.startsWith('`')) continue;
  const tens = [...d.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  if (!tens.length) continue;
  const lic = (LICENSE.find(([re]) => re.test(goi)) || [null, '?'])[1];
  for (const t of tens) dong.push([sach(goi), sach(t), lic, sach(cachLay || '')].join('\t'));
}

mkdirSync('ke', { recursive: true });
const ra = join('ke', `${ten}.tsv`);
writeFileSync(ra, dong.join('\n') + '\n');
console.log(`${soGoi} goi · ${dong.length - 1} model -> ${ra}`);
