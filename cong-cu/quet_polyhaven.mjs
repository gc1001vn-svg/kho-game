#!/usr/bin/env node
/**
 * Quet muc luc Poly Haven -> `ke/polyhaven.tsv`.
 *
 * `api.polyhaven.com` mo, KHONG can khoa, va **toan bo kho la CC0** - khong phai lo
 * ghi cong nhu Icosa. Do 15/09: 521 model. Manh o do dung (props, nature, containers),
 * YEU o nha (structures chi 26) - nen day la nguon bo sung, khong phai nguon chinh.
 *
 * `polycount` cua ho la so TAM GIAC cua ban goc; ban tai ve co nhieu muc phan giai.
 *
 * Dung: node cong-cu/quet_polyhaven.mjs
 */
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';

const chay_lenh = promisify(execFile);
const RA = 'ke/polyhaven.tsv';

/** `fetch` cua Node khong di CONNECT qua proxy phien -> `403 Blocked by egress policy`. */
const lay = async (url) => JSON.parse(
  (await chay_lenh('curl', ['-s', '--http1.1', '--max-time', '120', url], {
    encoding: 'utf8', maxBuffer: 1 << 28,
  })).stdout,
);

const sach = (s) => String(s ?? '').replace(/[\t\r\n]+/g, ' ').trim();

// Quet CA BA LOAI. Truoc chi lay `models` va bo sot hai loai kia - ma hoa tiet be mat la
// thu `quoc-chien` da dung that (bay o nen, ban do giay da), khong phai thu de danh.
const LOAI = [
  { t: 'models', dinhDang: 'gltf,blend,fbx' },
  { t: 'textures', dinhDang: 'jpg,png,exr (1k..8k)' },
  { t: 'hdris', dinhDang: 'hdr,exr (1k..16k)' },
];

const dong = ['id\tten\ttac_gia\tlicense\tso_tam\tdinh_dang\ttag\tloai'];
const dem = [];
for (const { t, dinhDang } of LOAI) {
  const ds = await lay(`https://api.polyhaven.com/assets?t=${t}`);
  for (const [id, a] of Object.entries(ds)) {
    dong.push([
      id,
      sach(a.name),
      sach(Object.keys(a.authors || {}).join(', ')),
      'CC0 1.0',
      a.polycount ?? '',
      dinhDang,
      [...(a.categories || []), ...(a.tags || [])].join(','),
      t,
    ].join('\t'));
  }
  dem.push(`${t} ${Object.keys(ds).length}`);
}
mkdirSync('ke', { recursive: true });
writeFileSync(RA, dong.join('\n') + '\n');
console.log(`Poly Haven: ${dong.length - 1} muc (${dem.join(' · ')}) -> ${RA}`);
