#!/usr/bin/env node
/**
 * Lay hoa tiet PBR CC0 cua 3dtextures.me ve `<dich>/3dtextures/<ma>/` (du bo map: mau,
 * phap tuyen, nham, AO, do cao...). Moi hoa tiet mot thu muc Google Drive - tai bang
 * `drive.mjs`, khong khoa API.
 *
 * Dung:
 *   node cong-cu/lay.mjs 3dtextures tiles-073 terracotta-floor-tiles-009
 *   node cong-cu/lay.mjs 3dtextures tiles-073 --dich ../game-moi/assets_source
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { maThuMuc, taiFile, taiThuMuc } from './drive.mjs';

const args = process.argv.slice(2);
const iDich = args.indexOf('--dich');
const DICH = iDich >= 0 ? args[iDich + 1] : 'assets_source';
const ma = args.filter((a, i) => !a.startsWith('--') && i !== iDich + 1);
if (!ma.length) {
  console.error('Dung: node cong-cu/lay.mjs 3dtextures <ma...> [--dich <thu-muc>]   (cot `id` cua ke/3dtextures.tsv)');
  process.exit(1);
}

const [dau, ...than] = readFileSync(join(import.meta.dirname, '..', 'ke', '3dtextures.tsv'), 'utf8').split('\n').filter(Boolean);
const cot = dau.split('\t');
const bang = new Map(than.map((d) => {
  const o = d.split('\t');
  return [o[cot.indexOf('id')], Object.fromEntries(cot.map((c, i) => [c, o[i]]))];
}));

let hong = 0;
for (const x of ma) {
  const r = bang.get(x);
  if (!r?.tai) { hong++; console.log(`HONG ${x}: khong co trong ke/3dtextures.tsv hay khong co link Drive`); continue; }
  const dich = join(DICH, '3dtextures', x);
  try {
    const maDrive = maThuMuc(r.tai);
    let { so, byte } = await taiThuMuc(maDrive, dich);
    // Liet ke rong: `open?id=` tro mot FILE (zip bai cu), khong phai thu muc.
    if (!so && !existsSync(dich)) {
      const zip = join(DICH, '3dtextures', `${x}.zip`);
      byte = await taiFile(maDrive, zip);
      mkdirSync(dich, { recursive: true });
      try { execFileSync('unzip', ['-o', '-q', zip, '-d', dich]); rmSync(zip); } catch { renameSync(zip, join(dich, `${x}.zip`)); }
      so = 1;
    }
    if (!existsSync(dich)) mkdirSync(dich, { recursive: true });
    writeFileSync(join(dich, 'ghi_cong.json'), `${JSON.stringify(
      { ten: r.ten, tac_gia: r.tac_gia, license: r.license, trang: r.trang, nguon: '3dtextures.me' }, null, 1)}\n`);
    console.log(`${x}: ${so} file · ${(byte / 1e6).toFixed(1)} MB -> ${dich}`);
  } catch (e) {
    hong++;
    console.log(`HONG ${x}: ${String(e.message).slice(0, 90)}`);
  }
}
process.exit(hong ? 1 : 0);
