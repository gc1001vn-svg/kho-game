#!/usr/bin/env node
/**
 * Lay goi 2D tu `Tiddybub/2d-assets` ve `<dich>/2d-assets/<id>/` - chi dung thu muc goi do
 * (git sparse-checkout, clone khong blob), khong keo ca 62.000 file.
 *
 * License: doc cot `license` cua `ke/2d-assets.tsv` TRUOC - no theo ban goc khi kho co ban
 * goc (29/09: 7 goi mirror ghi CC0 ma ban goc ghi CC-BY). Moi goi co `SOURCE.md` ghi tac gia
 * va trang goc; `ghi_cong.json` chep lai dong ban ke.
 *
 * Dung:
 *   node cong-cu/lay.mjs 2d-assets animal-pack oga-ghosts
 *   node cong-cu/lay.mjs 2d-assets animal-pack --dich ../game-moi/assets_source
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const iDich = args.indexOf('--dich');
const DICH = iDich >= 0 ? args[iDich + 1] : 'assets_source';
const id = args.filter((a, i) => !a.startsWith('--') && i !== iDich + 1);
if (!id.length) {
  console.error('Dung: node cong-cu/lay.mjs 2d-assets <id...> [--dich <thu-muc>]   (cot `id` cua ke/2d-assets.tsv)');
  process.exit(1);
}

const KE = join(import.meta.dirname, '..', 'ke', '2d-assets.tsv');
const [dau, ...than] = readFileSync(KE, 'utf8').split('\n').filter(Boolean);
const cot = dau.split('\t');
const bang = new Map(than.map((d) => {
  const o = d.split('\t');
  return [o[cot.indexOf('id')], Object.fromEntries(cot.map((c, i) => [c, o[i]]))];
}));

const thieu = id.filter((x) => !bang.has(x));
if (thieu.length) console.log(`(khong co trong ban ke: ${thieu.join(' ')})`);
const viec = id.filter((x) => bang.has(x) && !existsSync(join(DICH, '2d-assets', x)));
if (!viec.length) { console.log('Khong co gi moi de lay.'); process.exit(thieu.length ? 1 : 0); }

const KHO = join(tmpdir(), 'kho-game-2d-assets');
const git = (...a) => execFileSync('git', ['-C', KHO, ...a], { stdio: 'inherit', timeout: 600000 });
if (!existsSync(join(KHO, '.git'))) {
  execFileSync('git', ['clone', '-q', '--depth', '1', '--filter=blob:none', '--sparse',
    'https://github.com/Tiddybub/2d-assets', KHO], { stdio: 'inherit', timeout: 600000 });
}
// `add` cong don vao tap da lay o lan truoc; lan dau `--sparse` chi co file o goc repo.
git('sparse-checkout', 'add', ...viec.map((x) => bang.get(x).duong));

for (const x of viec) {
  const r = bang.get(x);
  const dich = join(DICH, '2d-assets', x);
  mkdirSync(dich, { recursive: true });
  cpSync(join(KHO, r.duong), dich, { recursive: true });
  writeFileSync(join(dich, 'ghi_cong.json'), `${JSON.stringify(
    { ten: r.ten, tac_gia: r.tac_gia, license: r.license, trang: r.trang, nguon: '2d-assets (Tiddybub)' }, null, 1)}\n`);
  console.log(`${x}: ${r.license} -> ${dich}`);
}
