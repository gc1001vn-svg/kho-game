#!/usr/bin/env node
/**
 * Lay TEN TAC GIA va license that cua mot muc OpenGameArt, bang cach mo trang goc.
 *
 * VI SAO LAM LUOI, khong quet san. Trang danh sach cua ho KHONG hien tac gia, phai mo
 * tung muc - 22.714 muc la 22.714 luot goi, ma 99% khong bao gio dung toi. Nen cot
 * `tac_gia` trong `ke/opengameart.tsv` de `?`, va lenh nay lay dung cai dang can.
 *
 * CC-BY DOI GHI TEN. Truoc khi dung bat cu thu gi tu OpenGameArt: chay lenh nay, chep ten
 * tac gia vao `docs/ASSET_CREDITS.md` cua du an.
 *
 * Dung:
 *   node cong-cu/tac_gia.mjs /content/rpg-sound-pack
 *   node cong-cu/tac_gia.mjs rpg-sound-pack 512-sound-effects-8-bit-style
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const chay_lenh = promisify(execFile);
const GOC = 'https://opengameart.org';

const duong = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!duong.length) {
  console.error('Dung: node cong-cu/tac_gia.mjs <duong-dan hay slug>...');
  process.exit(1);
}

const lay = async (url) => (await chay_lenh('curl', [
  '-s', '--http1.1', '--max-time', '90', url,
], { encoding: 'utf8', maxBuffer: 1 << 26 })).stdout;

const go = (s) => String(s ?? '')
  .replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"')
  .replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

for (const d of duong) {
  const url = `${GOC}${d.startsWith('/') ? d : `/content/${d}`}`;
  const html = await lay(url);

  // Tac gia nam trong khoi ngay sau chu "Author:". Trang con nhieu link `/users/` khac -
  // moi nguoi BINH LUAN la mot cai - nen chi cat 400 ky tu sau "Author:" va lay MOT ten
  // dau tien. Lay het thi ra "artisticdude, HaelDB, haeldb, tebruno99" trong khi tac gia
  // that chi la nguoi dau.
  const iAuthor = html.indexOf('Author:');
  const khoi = iAuthor < 0 ? '' : html.slice(iAuthor, iAuthor + 400);
  const m = khoi.match(/<a href="\/users\/([^"]+)"[^>]*>([^<]*)/);
  const tacGia = m ? [go(m[2]) || m[1]] : [];

  // License hien bang ANH + chu: `<span class='license-name'>CC0</span>`.
  const lic = [...html.matchAll(/license-name'>([^<]+)/g)].map((x) => go(x[1]));
  // Ten muc lay tu <title>, khong phai <h2>: <h2> dau tien la khung dang nhap o sidebar,
  // nen ban cu in ra "User login" cho moi muc.
  const ten = go((html.match(/<title>([^<]*)/) || [])[1] || '').replace(/\s*\|\s*OpenGameArt\.org$/, '');

  console.log([
    ten || d,
    `tac gia: ${tacGia[0] || "?"}`,
    `license: ${[...new Set(lic)].join(', ') || '?'}`,
    url,
  ].join(' | '));
}
