#!/usr/bin/env node
/**
 * Quet muc luc 3dtextures.me -> `ke/3dtextures.tsv`. Hoa tiet PBR lien mach, TOAN BO CC0
 * (trang `3dtextures.me/about`: "All textures are CC0"). Host da nam trong Allowed domains
 * tu truoc ma kho chua co dong nao (29/09).
 *
 * Duong doc: API WordPress `wp-json/wp/v2/posts` (29/09: 1.503 bai, 16 trang x 100) + ten the
 * o `wp/v2/tags` (794). Moi bai mot hoa tiet, link tai la THU MUC Google Drive (100/100 bai
 * trang dau; bai 2019 de `open?id=`) - `lay_3dtextures.mjs` tai bang `drive.mjs`.
 *
 * Nhe tay: tuan tu, nghi 500 ms giua hai trang.
 *
 * Dung: node cong-cu/quet_3dtextures.mjs
 */
import { execFile } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const chay = promisify(execFile);
const RA = join(import.meta.dirname, '..', 'ke', '3dtextures.tsv');
const API = 'https://3dtextures.me/wp-json/wp/v2';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const doi = (ms) => new Promise((r) => setTimeout(r, ms));
const lay = async (url) => JSON.parse((await chay('curl', ['-sS', '--http1.1', '-A', UA, '--max-time', '120', url],
  { encoding: 'utf8', maxBuffer: 1 << 27 })).stdout);
const sach = (s) => String(s ?? '').replace(/&#8211;|&#8212;/g, '-').replace(/&#8217;/g, "'").replace(/&amp;/g, '&')
  .replace(/<[^>]*>/g, ' ').replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

/** Doc het cac trang cua mot duong API (dung khi trang tra mang rong hay loi). */
async function ca(duong, truong) {
  const ra = [];
  for (let p = 1; p < 100; p++) {
    let j;
    try { j = await lay(`${API}/${duong}?per_page=100&page=${p}&_fields=${truong}`); } catch { break; }
    if (!Array.isArray(j) || !j.length) break;
    ra.push(...j);
    process.stdout.write(`\r${duong}: ${ra.length}`);
    await doi(500);
  }
  process.stdout.write('\n');
  return ra;
}

const the = new Map((await ca('tags', 'id,name')).map((t) => [t.id, t.name]));
const bai = await ca('posts', 'id,slug,title,link,tags,content');
const dong = ['id\tten\ttac_gia\tlicense\tloai\ttag\ttai\ttrang\tcach_lay'];
let khongLink = 0;
for (const b of bai) {
  // Bai moi: `/drive/folders/<ma>`; bai cu (2019): `open?id=<ma>`. Bai khong co link Drive
  // nao la trang gioi thieu (Patreon, huong dan) - khong phai hoa tiet, bo.
  const tai = (b.content?.rendered?.match(/https:\/\/drive\.google\.com\/(?:drive\/folders\/|open\?id=|file\/d\/)[\w-]+/) || [])[0] || '';
  if (!tai) { khongLink++; continue; }
  const tag = (b.tags || []).map((i) => the.get(i)).filter((t) => t && !/^(3dtextures|cc0|free|pbr|texture|textures|seamless)$/i.test(t));
  dong.push([b.slug, sach(b.title?.rendered), '3dtextures.me', 'CC0 1.0', 'textures', tag.join(','), tai, b.link,
    `node cong-cu/lay.mjs 3dtextures ${b.slug}`].map(sach).join('\t'));
}
writeFileSync(RA, `${dong.join('\n')}\n`);
console.log(`${dong.length - 1} hoa tiet -> ke/3dtextures.tsv (bo ${khongLink} bai khong co link Drive: trang gioi thieu)`);
