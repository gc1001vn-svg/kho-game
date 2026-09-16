#!/usr/bin/env node
/**
 * Quet muc luc goi asset CC0 tren itch.io -> `ke/itch.tsv`. Bu cho cho kho **yeu nhat: 2D**
 * - bon nguon model 3D khong co sprite nao, chi co OpenGameArt va Kenney.
 *
 * KHONG CAN CHROMIUM cho buoc NAY: trang duyet `itch.io/game-assets/assets-cc0/tag-2d` ra
 * o may chu, `curl` doc duoc ten va tac gia. (Khac buoc TAI: trang tai cua itch nap danh
 * sach file bang JS, do la ly do `quoc-chien/tools/tai_itch.mjs` phai lai Chromium.)
 *
 * LOC CC0 O DUONG DAN, khong loc o nha: `assets-cc0` la bo loc cua ho. Van de lai cot
 * `license` ghi `CC0 (theo bo loc cua itch, kiem lai LICENSE trong goi truoc khi dung)` -
 * itch de tac gia tu khai, khong ai kiem.
 *
 * GIA CO THE KHAC 0: `assets-cc0` loc theo license chu khong theo gia, nen goi tra tien
 * van lot vao (vd `Kenney Game Assets All-in-1`, $19.95). Cot `gia` giu nguyen de biet.
 *
 * Dung:
 *   node cong-cu/quet_itch.mjs              # tag-2d va tag-3d
 *   node cong-cu/quet_itch.mjs 2d           # chi mot tag
 */
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';

const chay_lenh = promisify(execFile);
const RA = 'ke/itch.tsv';
const GOC = 'https://itch.io/game-assets/assets-cc0';
const TRANG_TOI_DA = 30;

const lay = async (url) => (await chay_lenh('curl', [
  '-s', '--http1.1', '--max-time', '120', url,
], { encoding: 'utf8', maxBuffer: 1 << 28 })).stdout;

const go = (s) => String(s ?? '')
  .replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"')
  .replace(/<[^>]*>/g, ' ').replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

const tag = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const dsTag = tag.length ? tag : ['2d', '3d'];

const thay = new Map();
for (const t of dsTag) {
  let so = 0;
  for (let trang = 1; trang <= TRANG_TOI_DA; trang += 1) {
    const html = await lay(`${GOC}/tag-${t}?page=${trang}`);
    // Mot muc: <a class="title game_link" href="https://<tac-gia>.itch.io/<goi>">Ten</a>
    const muc = [...html.matchAll(/class="title game_link"[^>]*href="(https:\/\/([^.]+)\.itch\.io\/([^"]+))"[^>]*>([^<]*)/g)];
    let moi = 0;
    for (const m of muc) {
      const id = `${m[2]}/${m[3]}`;
      if (thay.has(id)) continue;
      // Gia nam ngay sau, trong `<div class="price_value">$19.95</div>`.
      const gan = html.slice(m.index, m.index + 400);
      const gia = (gan.match(/price_value">([^<]*)/) || [])[1] || 'mien phi';
      thay.set(id, { id, ten: go(m[4]), tacGia: m[2], link: m[1], gia: go(gia), tag: t });
      moi += 1;
      so += 1;
    }
    if (moi === 0) break;
  }
  console.log(`tag-${t}: ${so} goi`);
}

const dong = ['goi\tten\ttac_gia\tlicense\tgia\ttag\tcach_lay'];
for (const g of thay.values()) {
  dong.push([
    g.id, g.ten, g.tacGia,
    'CC0 (theo bo loc itch - kiem lai LICENSE trong goi)',
    g.gia, g.tag,
    `node tools/tai_itch.mjs ${g.id}  (o repo quoc-chien)`,
  ].join('\t'));
}
mkdirSync('ke', { recursive: true });
writeFileSync(RA, dong.join('\n') + '\n');
console.log(`itch.io: ${dong.length - 1} goi -> ${RA}`);
