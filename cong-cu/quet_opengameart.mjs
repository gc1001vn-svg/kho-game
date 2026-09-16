#!/usr/bin/env node
/**
 * Quet muc luc OpenGameArt -> `ke/opengameart.tsv`. Day la nguon bu CHO LOAI CON THIEU:
 * am thanh, nhac, bieu tuong 2D - ba thu ca kho chua co nguon nao.
 *
 * KHONG CAN CHROMIUM: trang `art-search-advanced` dung ra o may chu, `curl` doc duoc
 * (khac Kenney). `/api/entity/node` thi `404` - dung mo lai.
 *
 * LOC O QUERY, khong loc o nha: `field_art_licenses_tid[]` nhan **4** = CC0 · **2** =
 * CC-BY 3.0 · **17981** = CC-BY 4.0. KHONG lay 3 va 17982 (CC-BY-SA) - luat repo cam SA.
 * `field_art_type_tid[]`: 9 = 2D Art · 10 = 3D Art · 14 = Texture · 12 = Music ·
 * 13 = Sound Effect. Ma lay tu chinh form cua ho, dung doan.
 *
 * License hien o TRANG LIST duoi dang anh `oga-license-*.png`, khong phai chu - nen doc
 * ten file anh de biet license, khoi phai mo tung node (dat gap 20 lan).
 *
 * Dung:
 *   node cong-cu/quet_opengameart.mjs          # het cac loai
 *   node cong-cu/quet_opengameart.mjs 12 13    # chi nhac va am thanh
 */
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';

const chay_lenh = promisify(execFile);
const RA = 'ke/opengameart.tsv';
const GOC = 'https://opengameart.org/art-search-advanced';
/** Ma license lay tu chinh form cua ho. KHONG lay 3 va 17982 (CC-BY-SA) - luat repo cam. */
const LICENSE = { 4: 'CC0', 2: 'CC-BY 3.0', 17981: 'CC-BY 4.0' };
const LOAI = {
  9: '2D Art', 10: '3D Art', 14: 'Texture', 12: 'Music', 13: 'Sound Effect',
};
/** Trang toi da moi loai. 144 muc/trang, 40 trang = 5.760 muc - du cho kho cua ho. */
const TRANG_TOI_DA = 40;
const MOI_TRANG = 144;

const lay = async (url) => (await chay_lenh('curl', [
  '-s', '--http1.1', '--max-time', '120', url,
], { encoding: 'utf8', maxBuffer: 1 << 28 })).stdout;

const sach = (s) => String(s ?? '')
  .replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"')
  .replace(/<[^>]*>/g, ' ').replace(/[\t\r\n]+/g, ' ').trim();

const loaiXin = process.argv.slice(2).filter((a) => LOAI[a]);
const dsLoai = loaiXin.length ? loaiXin : Object.keys(LOAI);

const dong = ['duong_dan\tten\ttac_gia\tlicense\tloai\tcach_lay'];
const thay = new Set();
for (const loai of dsLoai) {
  let so = 0;
  for (const [ma, ten_lic] of Object.entries(LICENSE)) {
    for (let trang = 0; trang < TRANG_TOI_DA; trang += 1) {
      // Query phai dung CHI SO `[0]`, khong phai `[]`: viet `field_art_type_tid%5B%5D=13`
      // thi trang van tra 200 nhung khong loc gi, chi ra 8 muc sidebar dien dan.
      const url = `${GOC}?field_art_type_tid%5B0%5D=${loai}`
        + `&field_art_licenses_tid%5B0%5D=${ma}`
        + `&sort_by=count&items_per_page=${MOI_TRANG}&page=${trang}`;
      const html = await lay(url);
      // Trang list KHONG hien license - nen quet rieng tung license roi gan theo query.
      const muc = [...html.matchAll(/<a href="(\/content\/[^"]+)">([^<]*)/g)];
      let moi = 0;
      for (const m of muc) {
        const duong = m[1];
        if (thay.has(duong)) continue;
        thay.add(duong);
        dong.push([duong, sach(m[2]) || duong.replace('/content/', ''), '?', ten_lic,
          LOAI[loai], `mo https://opengameart.org${duong} roi tai tay`].join('\t'));
        moi += 1;
        so += 1;
      }
      if (moi === 0) break;
    }
  }
  console.log(`${LOAI[loai]}: ${so} muc`);
}

mkdirSync('ke', { recursive: true });
writeFileSync(RA, dong.join('\n') + '\n');
console.log(`OpenGameArt: ${dong.length - 1} muc -> ${RA}`);
