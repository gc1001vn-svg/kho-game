#!/usr/bin/env node
/**
 * Quet muc luc game-icons.net -> `ke/game-icons.tsv`. Bieu tuong cho cay cong nghe, the
 * chinh sach, nut giao dien - cho ma ca kho khong co nguon nao khac.
 *
 * LICENSE: **CC-BY 3.0** (vai tac gia de CC0). Doi ghi ten NGUOI VE, va sitemap chia theo
 * tac gia nen ten di kem san - khong phai mo tung trang nhu OpenGameArt.
 *
 * DUONG DI: trang la SPA React, `curl` chi thay khung; `/icons.json`, `/data/icons.json`,
 * `/static/icons.json` deu `404`, va bundle JS khong chua danh sach. Nhung ho co
 * **sitemap**: `/sitemap.xml` -> `/sitemaps/1x1/<tac-gia>.xml`, moi file la danh sach URL
 * tung icon. Khong can Chromium.
 *
 * Tai mot icon: `https://game-icons.net/icons/<mau-nen>/<mau-hinh>/1x1/<tac-gia>/<ten>.svg`
 * - vd `.../icons/ffffff/000000/1x1/lorc/broadsword.svg`. SVG nen doi mau tuy y.
 *
 * Dung: node cong-cu/quet_gameicons.mjs
 */
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';

const chay_lenh = promisify(execFile);
const RA = 'ke/game-icons.tsv';
const GOC = 'https://game-icons.net';

const lay = async (url) => (await chay_lenh('curl', [
  '-s', '--http1.1', '--max-time', '120', url,
], { encoding: 'utf8', maxBuffer: 1 << 28 })).stdout;

// Buoc 1: sitemap goc -> danh sach sitemap con, moi tac gia mot file.
const goc = await lay(`${GOC}/sitemap.xml`);
const conXml = [...goc.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1])
  .filter((u) => u.includes('/sitemaps/1x1/'));
console.log(`${conXml.length} tac gia`);

const dong = ['ten\ttac_gia\tlicense\tdinh_dang\ttrang\tcach_lay'];
for (const u of conXml) {
  const tacGia = (u.match(/1x1\/([^.]+)\.xml/) || [])[1] || '?';
  const xml = await lay(u);
  const ten = [...xml.matchAll(/<loc>[^<]*\/1x1\/[^/]+\/([^<.]+)\.html<\/loc>/g)].map((m) => m[1]);
  for (const t of ten) {
    dong.push([
      t, tacGia, 'CC-BY 3.0', 'svg,png',
      `${GOC}/1x1/${tacGia}/${t}.html`,
      `curl -O ${GOC}/icons/ffffff/000000/1x1/${tacGia}/${t}.svg`,
    ].join('\t'));
  }
  console.log(`${tacGia}: ${ten.length} icon`);
}

mkdirSync('ke', { recursive: true });
writeFileSync(RA, dong.join('\n') + '\n');
console.log(`game-icons: ${dong.length - 1} icon -> ${RA}`);
