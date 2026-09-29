#!/usr/bin/env node
/**
 * Lay goi QUATERNIUS (CC0) ve `<dich>/<goi>/`. Ten goi: cot `goi` cua `ke/quaternius.tsv`.
 *
 * Hai duong, tuy goi: goi cu de tren Google Drive -> tai thu muc (`drive.mjs`); goi moi de
 * tren itch -> chuyen sang `lay_itch.mjs`. Thu muc `Blend` BO QUA mac dinh: may ao khong
 * co Blender, ma no nang nhat goi. Nhieu goi chi co FBX/OBJ: FBX thi doi sang GLB bang
 * `node cong-cu/mo_hinh.mjs fbx <thu-muc>`.
 *
 * Dung:
 *   node cong-cu/lay.mjs quaternius farmbuildings ultimatecrops
 *   node cong-cu/lay.mjs quaternius farmbuildings --chi obj     # chi mot dinh dang
 *   node cong-cu/lay.mjs quaternius farmbuildings --dich ../quoc-chien/assets_source
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { maThuMuc, taiThuMuc } from './drive.mjs';

const args = process.argv.slice(2);
const gt = (co) => { const i = args.indexOf(co); return i >= 0 ? args[i + 1] : undefined; };
const DICH = gt('--dich') || 'assets_source';
const chi = (gt('--chi') || '').toLowerCase();
const layBlend = args.includes('--blend');
const coGiaTri = new Set(['--dich', '--chi']);
const goi = args.filter((a, i) => !a.startsWith('--') && !coGiaTri.has(args[i - 1]));
if (!goi.length) {
  console.error('Dung: node cong-cu/lay.mjs quaternius <goi...> [--chi fbx|obj|gltf] [--blend] [--dich <thu-muc>]');
  process.exit(1);
}

const KE = join(import.meta.dirname, '..', 'ke', 'quaternius.tsv');
const bang = new Map();
if (existsSync(KE)) {
  const [dau, ...than] = readFileSync(KE, 'utf8').split('\n').filter(Boolean);
  const cot = dau.split('\t');
  for (const d of than) {
    const o = d.split('\t');
    bang.set(o[cot.indexOf('goi')], { ten: o[cot.indexOf('ten')], tai: o[cot.indexOf('tai')], trang: o[cot.indexOf('trang')] });
  }
}

/** Thu muc dinh dang: `--chi fbx` thi bo moi thu muc dinh dang khac; Blend bo tru khi `--blend`. */
const DINH_DANG = /^(fbx|obj|gltf|glb|blend|unity|unreal|godot|source)/i;
const boQua = (ten) => {
  if (/^blend/i.test(ten) && !layBlend) return true;
  return Boolean(chi) && DINH_DANG.test(ten) && !ten.toLowerCase().startsWith(chi);
};

let hong = 0;
for (const g of goi) {
  const r = bang.get(g);
  if (!r?.tai) { hong++; console.log(`HONG ${g}: khong co trong ke/quaternius.tsv (chay quet_quaternius.mjs?)`); continue; }
  if (r.tai.includes('itch.io')) {
    const itch = `quaternius/${r.tai.split('/').pop()}`;
    console.log(`${g}: goi de tren itch -> lay.mjs itch ${itch}`);
    const k = spawnSync('node', [join(import.meta.dirname, 'lay_itch.mjs'), itch, '--dich', DICH], { stdio: 'inherit' });
    if (k.status) hong++;
    continue;
  }
  const dich = join(DICH, g);
  try {
    const { so, byte } = await taiThuMuc(maThuMuc(r.tai), dich, { boQua });
    mkdirSync(dich, { recursive: true });
    writeFileSync(join(dich, 'ghi_cong.json'), `${JSON.stringify(
      { ten: r.ten, tac_gia: 'Quaternius', license: 'CC0 1.0', trang: r.trang, nguon: 'quaternius' }, null, 1)}\n`);
    console.log(`${g}: ${so} file moi · ${(byte / 1e6).toFixed(1)} MB -> ${dich}`);
  } catch (e) {
    hong++;
    console.log(`HONG ${g}: ${String(e.message).slice(0, 90)}`);
  }
}
process.exit(hong ? 1 : 0);
