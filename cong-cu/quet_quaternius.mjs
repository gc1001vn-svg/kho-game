#!/usr/bin/env node
/**
 * Quet muc luc QUATERNIUS -> `ke/quaternius.tsv`. Moi dong mot GOI: mot tac gia, mot phong
 * cach, CC0 - dung thu `quoc-chien` thieu khi ghep model nhieu tac gia ("ruong trai guong
 * gao", 29/09).
 *
 * VI SAO. 29/09 quaternius.com co 83 goi ma kho chi thay dau vet ~45 (qua itch va hai kho
 * du an); 38 goi khong o ban ke nao, trong do co Farm Buildings, Ultimate Crops, Ultimate
 * Fantasy RTS.
 *
 * Goi de tren Google Drive thi liet ke luon TEN MODEL vao cot `mon` - `do.mjs "chuồng gà"`
 * ra `ChickenCoop` cua Farm Buildings. Goi de tren itch thi chua biet ten model (phai tai).
 * License: trang ghi CC0; `License.txt` trong goi Drive ghi "CC0 1.0 Universal" (do 29/09).
 *
 * Nhe tay: tuan tu, nghi 300 ms giua hai luot (bai hoc Openclipart chan IP, README).
 *
 * Dung: node cong-cu/quet_quaternius.mjs
 */
import { execFile } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { lietKe, maThuMuc } from './drive.mjs';

const chay = promisify(execFile);
const RA = join(import.meta.dirname, '..', 'ke', 'quaternius.tsv');
const GOC = 'https://quaternius.com';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const NGHI = 300;
/** Ten thu muc dinh dang trong goi Drive, theo thu tu uu tien khi lay ten model. */
const THU_MUC_MON = [/^gltf/i, /^glb/i, /^fbx/i, /^obj/i];

const lay = async (url) => (await chay('curl', ['-sS', '--http1.1', '-L', '-A', UA, '--max-time', '60', url],
  { encoding: 'utf8', maxBuffer: 1 << 24 })).stdout;
const doi = (ms) => new Promise((r) => setTimeout(r, ms));
const sach = (s) => String(s ?? '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

/** Ten model tu mot goi Drive: vao thu muc dinh dang uu tien, bo duoi file, bo trung. */
async function tenMon(maTM) {
  let tang = await lietKe(maTM);
  for (let sau = 0; sau < 2; sau++) {
    const tm = THU_MUC_MON.map((re) => tang.find((m) => m.laThuMuc && re.test(m.ten))).find(Boolean);
    if (tm) {
      await doi(NGHI);
      const con = await lietKe(tm.id);
      // Mot so goi con mot tang nua (FBX/Characters, FBX/Buildings...): gop ca tang do.
      const mon = [];
      for (const m of con) {
        if (!m.laThuMuc) { mon.push(m.ten); continue; }
        await doi(NGHI);
        for (const x of await lietKe(m.id)) if (!x.laThuMuc) mon.push(x.ten);
      }
      return [...new Set(mon.filter((t) => /\.(fbx|obj|gltf|glb)$/i.test(t)).map((t) => t.replace(/\.[^.]+$/, '')))];
    }
    const conDuyNhat = tang.filter((m) => m.laThuMuc);
    if (conDuyNhat.length !== 1) break;
    await doi(NGHI);
    tang = await lietKe(conDuyNhat[0].id);
  }
  return [];
}

const trangChu = await lay(`${GOC}/`);
const slug = [...new Set([...trangChu.matchAll(/packs\/([a-z0-9_-]+)\.html/g)].map((m) => m[1]))];
console.log(`${slug.length} goi tren ${GOC}`);

const dong = ['goi\tten\ttac_gia\tlicense\tloai\tdinh_dang\tso_mon\tmon\tmo_ta\ttai\ttrang\tcach_lay'];
let hong = 0, coMon = 0;
for (const s of slug) {
  const trang = `${GOC}/packs/${s}.html`;
  try {
    await doi(NGHI);
    const html = await lay(trang);
    const ten = sach((html.match(/<title>([^<]*)/) || [])[1]).replace(/^Quaternius\s*•\s*/, '') || s;
    const moTa = sach((html.match(/name="description"\s+content="([^"]*)"/i) || html.match(/og:description"\s+content="([^"]*)"/i) || [])[1]);
    if (!/CC0/i.test(html)) console.log(`  canh bao ${s}: trang khong ghi CC0`);
    const drive = (html.match(/https:\/\/drive\.google\.com\/drive\/folders\/[\w-]+/) || [])[0];
    const itch = (html.match(/https:\/\/quaternius\.itch\.io\/[\w-]+/) || [])[0];
    const tai = drive || itch || '';
    const dd = [...new Set((`${moTa} ${html}`.match(/\b(FBX|OBJ|glTF|GLB|Blend)\b/g) || []).map((x) => x.toLowerCase()))].join(',');
    let mon = [];
    if (drive) {
      try { mon = await tenMon(maThuMuc(drive)); } catch { /* khong liet ke duoc: de trong, van co dong goi */ }
    }
    if (mon.length) coMon++;
    dong.push([s, ten, 'Quaternius', 'CC0 1.0', '3D', dd, mon.length || '', mon.join(' ').slice(0, 3000), moTa,
      tai, trang, `node cong-cu/lay.mjs quaternius ${s}`].map(sach).join('\t'));
    console.log(`  ${s}: ${tai.includes('drive') ? 'drive' : tai ? 'itch' : 'KHONG CO LINK'} · ${mon.length} mon`);
  } catch (e) {
    hong++;
    console.log(`  HONG ${s}: ${String(e.message).slice(0, 80)}`);
  }
}
writeFileSync(RA, `${dong.join('\n')}\n`);
console.log(`Xong: ${dong.length - 1} goi (${coMon} goi co ten model) · hong ${hong} -> ke/quaternius.tsv`);
