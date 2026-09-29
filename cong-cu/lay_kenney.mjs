#!/usr/bin/env node
/**
 * Lay goi CC0 cua Kenney ve `<dich>/<goi>/` (mac dinh `./assets_source/<goi>/`).
 *
 * VI SAO O DAY. Truoc 29/09 cong cu nay nam o `quoc-chien/tools/tai_asset.mjs`, va cot
 * `cach_lay` cua `ke/kenney.tsv` ghi "(o repo quoc-chien)" - repo game khac khong co
 * `quoc-chien` thi khong lay duoc goi nao, de tu viet lai. Nay kho-game tu du; ban o
 * `quoc-chien` chi con goi sang day.
 *
 * VI SAO PHAI DO HTML: trang Kenney giau duong zip, nut Download la `javascript:void(0)`.
 * Duong that nam o `https://kenney.nl/media/pages/assets/<goi>/<ma>/...zip`, ma bam + dau
 * thoi gian doi moi lan Kenney cap nhat goi -> khong ghi cung duoc.
 *
 * Bo cuc thu muc GIU Y NHU ban cu (`assets_source/<goi>/`): me nuong cua `quoc-chien` tro
 * thang vao duong do, doi la gay.
 *
 * Dung:
 *   node cong-cu/lay.mjs kenney city-kit-suburban fantasy-town-kit
 *   node cong-cu/lay.mjs kenney particle-pack --dich ../game-moi/assets_source
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const iDich = args.indexOf('--dich');
const DICH = iDich >= 0 ? args[iDich + 1] : 'assets_source';
const goi = args.filter((a, i) => !a.startsWith('--') && i !== iDich + 1);
if (!goi.length) {
  console.error('Dung: node cong-cu/lay.mjs kenney <goi...> [--dich <thu-muc>]   (ten goi: cot `goi` cua ke/kenney.tsv)');
  process.exit(1);
}

async function timDuongZip(slug) {
  const trang = `https://kenney.nl/assets/${slug}`;
  const res = await fetch(trang);
  if (!res.ok) throw new Error(`khong mo duoc ${trang}: HTTP ${res.status}`);
  const bat = (await res.text()).match(new RegExp(`https://kenney\\.nl/media/pages/assets/${slug}/[^'"\\s]+\\.zip`));
  if (!bat) throw new Error(`khong thay duong zip trong ${trang}`);
  return { zip: bat[0], trang };
}

let hong = 0;
for (const slug of goi) {
  const dich = join(DICH, slug);
  if (existsSync(dich)) { console.log(`${slug}: da co ${dich}, bo qua.`); continue; }
  try {
    const { zip, trang } = await timDuongZip(slug);
    const res = await fetch(zip);
    if (!res.ok) throw new Error(`tai hong ${zip}: HTTP ${res.status}`);
    const byte = Buffer.from(await res.arrayBuffer());
    mkdirSync(dich, { recursive: true });
    const tam = join(DICH, `${slug}.zip`);
    writeFileSync(tam, byte);
    execFileSync('unzip', ['-o', '-q', tam, '-d', dich], { stdio: 'inherit' });
    rmSync(tam);
    // Ghi cong di theo goi, dung le kho: khong nam mot cho de roi mat.
    writeFileSync(join(dich, 'ghi_cong.json'), `${JSON.stringify(
      { ten: slug, tac_gia: 'Kenney', license: 'CC0 1.0', trang, nguon: 'kenney' }, null, 1)}\n`);
    console.log(`${slug}: ${(byte.length / 1e6).toFixed(1)} MB -> ${dich}`);
  } catch (e) {
    hong++;
    console.log(`HONG ${slug}: ${String(e.message).slice(0, 90)}`);
  }
}
process.exit(hong ? 1 : 0);
