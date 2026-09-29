#!/usr/bin/env node
/**
 * Lay tu Poly Haven (toan bo CC0: https://polyhaven.com/license) theo ma trong
 * `ke/polyhaven.tsv`. Tu nhan loai qua API `/info/<ma>`:
 *
 *   hoa tiet -> `<dich>/hoa_tiet/<ma>.jpg`   anh mau (Diffuse). `--du`: moi map vao
 *               `<dich>/hoa_tiet/<ma>/` (nor_gl, rough, arm, disp...).
 *   model    -> `<dich>/polyhaven/<ma>/`     `.gltf` + `.bin` + hoa tiet kem theo
 *   hdri     -> `<dich>/hdri/<ma>.hdr`
 *
 * VI SAO O DAY. Hoa tiet truoc 29/09 lay bang `quoc-chien/tools/tai_hoa_tiet.mjs`; model
 * va hdri thi chua co lenh nao. Nay mot cua. Bo cuc `hoa_tiet/<ma>.jpg` GIU Y ban cu:
 * may nuong cua `quoc-chien` tro thang vao do.
 *
 * Dung:
 *   node cong-cu/lay.mjs polyhaven leafy_grass brown_mud_dry          # hoa tiet 1k
 *   node cong-cu/lay.mjs polyhaven cobblestone_01 --do-phan-giai 2k
 *   node cong-cu/lay.mjs polyhaven ArmChair_01                        # model
 *   node cong-cu/lay.mjs polyhaven ... --dich ../game-moi/assets_source
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const API = 'https://api.polyhaven.com';
const args = process.argv.slice(2);
const gt = (co, macDinh) => { const i = args.indexOf(co); return i >= 0 ? args[i + 1] : macDinh; };
const DICH = gt('--dich', 'assets_source');
const CO = gt('--do-phan-giai', '1k');
const du = args.includes('--du');
const coGiaTri = new Set(['--dich', '--do-phan-giai']);
const ma = args.filter((a, i) => !a.startsWith('--') && !coGiaTri.has(args[i - 1]));
if (!ma.length) {
  console.error('Dung: node cong-cu/lay.mjs polyhaven <ma...> [--do-phan-giai 1k|2k|4k] [--du] [--dich <thu-muc>]');
  process.exit(1);
}

const json = async (duong) => {
  const r = await fetch(duong);
  if (!r.ok) throw new Error(`${duong}: HTTP ${r.status}`);
  return r.json();
};
const taiFile = async (url, dich) => {
  if (existsSync(dich)) return 0;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  const b = Buffer.from(await r.arrayBuffer());
  mkdirSync(dirname(dich), { recursive: true });
  writeFileSync(dich, b);
  return b.length;
};
/** Chon co anh: co dung co xin thi lay, khong thi lay co nho nhat co san. */
const chonCo = (bo) => bo[CO] ?? bo[Object.keys(bo).sort((a, b) => parseInt(a, 10) - parseInt(b, 10))[0]];
const ghiCong = (thuMuc, id, info) => writeFileSync(join(thuMuc, `${id}.ghi_cong.json`), `${JSON.stringify(
  { ten: info.name, tac_gia: Object.keys(info.authors || {}).join(', '), license: 'CC0 1.0',
    trang: `https://polyhaven.com/a/${id}`, nguon: 'polyhaven' }, null, 1)}\n`);

async function lay(id) {
  const info = await json(`${API}/info/${id}`);
  const tep = await json(`${API}/files/${id}`);
  let byte = 0;
  if (info.type === 1) {
    // Hoa tiet. Uu tien jpg: nho hon png nhieu lan, o nen khong can kenh trong suot.
    const thuMuc = join(DICH, 'hoa_tiet');
    const mau = tep.Diffuse ?? tep.diffuse ?? tep.Color;
    if (!du) {
      if (!mau) throw new Error('khong co anh mau (Diffuse)');
      const f = chonCo(mau);
      const duoi = f.jpg ? 'jpg' : 'png';
      byte += await taiFile((f.jpg ?? f.png).url, join(thuMuc, `${id}.${duoi}`));
    } else {
      for (const [loai, bo] of Object.entries(tep)) {
        if (['blend', 'gltf', 'mtlx'].includes(loai) || typeof bo !== 'object') continue;
        const f = chonCo(bo);
        const x = f?.jpg ?? f?.png ?? f?.exr;
        if (x?.url) byte += await taiFile(x.url, join(thuMuc, id, `${loai}.${x.url.split('.').pop()}`));
      }
    }
    mkdirSync(thuMuc, { recursive: true });
    ghiCong(thuMuc, id, info);
  } else if (info.type === 2) {
    // Model: file .gltf kem `include` (bin + hoa tiet) theo duong tuong doi.
    const thuMuc = join(DICH, 'polyhaven', id);
    const g = chonCo(tep.gltf ?? {})?.gltf;
    if (!g) throw new Error('khong co ban gltf');
    byte += await taiFile(g.url, join(thuMuc, g.url.split('/').pop()));
    for (const [duong, f] of Object.entries(g.include ?? {})) byte += await taiFile(f.url, join(thuMuc, duong));
    ghiCong(thuMuc, id, info);
  } else if (info.type === 0) {
    const thuMuc = join(DICH, 'hdri');
    const h = chonCo(tep.hdri ?? {})?.hdr;
    if (!h) throw new Error('khong co ban hdr');
    byte += await taiFile(h.url, join(thuMuc, `${id}.hdr`));
    ghiCong(thuMuc, id, info);
  } else {
    throw new Error(`loai la: ${info.type}`);
  }
  return byte;
}

let hong = 0;
for (const id of ma) {
  try {
    const b = await lay(id);
    console.log(`${id}: ${b ? `${(b / 1e6).toFixed(1)} MB` : 'da co, bo qua'}`);
  } catch (e) {
    hong++;
    console.log(`HONG ${id}: ${String(e.message).slice(0, 90)}`);
  }
}
process.exit(hong ? 1 : 0);
