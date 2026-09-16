#!/usr/bin/env node
/**
 * Quet muc luc Poly Pizza -> `ke/poly-pizza.tsv`.
 *
 * KHAC HAI NGUON KIA: **do duoc, TAI KHONG DUOC**. `static.poly.pizza` - host cua moi
 * duong `Download` - tra `403` voi than `Just a moment...` cua Cloudflare, ke ca khi lai
 * Chromium (no nhan ra IP trung tam du lieu). Nen cot `cach_lay` ghi "tai bang may that".
 * Do 15/09 va do lai, dung mo lai bang `curl`.
 *
 * API KHONG CO DUONG DUYET HET: chi co `/v1.1/search/<tu khoa>`, `search/` tran tra 404,
 * `category/<ten>` cung 404. Nen muc luc nay quet theo BO TU KHOA, khong bao gio phu het
 * 10.400+ model - noi thang de phien sau khong tuong da du.
 *
 * Trung lap voi hai nguon kia rat nhieu: do 32 ket qua "house" thi Quaternius 9 ·
 * Poly by Google 7 · Kenney 4 - Quaternius/Kenney da nam o kho chung, Poly by Google da
 * nam trong muc luc Icosa. Gia tri con lai la vai tac gia rieng.
 *
 * Khoa: bien moi truong `POLY_PIZZA_KEY`, hay header do moi truong dam may gan san.
 * Lenh luon goi thu roi moi ket luan - gap `HTTP 401` moi bao la thieu khoa.
 *
 * Dung: node cong-cu/quet_polypizza.mjs
 */
import { execFile } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const chay_lenh = promisify(execFile);
const RA = 'ke/poly-pizza.tsv';
const SONG_SONG = 3;
const CACH_LAY = 'tai bang may that - static.poly.pizza tra 403 cua Cloudflare';

const TU_DIEN = join(import.meta.dirname, '..', '..', 'quoc-chien', 'tools', 'tu_dien_asset.json');
/** Tu khoa nen: thu game hay can. Cong them moi tu tieng Anh trong tu dien cua quoc-chien. */
const NEN = [
  'house', 'building', 'home', 'shop', 'castle', 'tower', 'church', 'factory', 'farm',
  'barn', 'hut', 'cottage', 'temple', 'windmill', 'city', 'road', 'bridge', 'wall', 'fence',
  'tree', 'rock', 'bush', 'grass', 'flower', 'mountain', 'water', 'boat', 'ship', 'cart',
  'car', 'truck', 'train', 'plane', 'barrel', 'crate', 'box', 'chest', 'table', 'chair',
  'bed', 'lamp', 'torch', 'fire', 'well', 'mine', 'anvil', 'forge', 'market', 'stall',
  'tent', 'flag', 'banner', 'statue', 'fountain', 'gate', 'door', 'window', 'stairs',
  'sword', 'shield', 'axe', 'bow', 'spear', 'armor', 'helmet', 'cannon', 'catapult',
  'knight', 'soldier', 'villager', 'farmer', 'king', 'people', 'character',
  'chicken', 'pig', 'sheep', 'cow', 'horse', 'goat', 'duck', 'dog', 'cat', 'fish',
  'wheat', 'corn', 'bread', 'meat', 'fruit', 'food', 'pot', 'basket', 'sack', 'coin',
];

const sach = (s) => String(s ?? '').replace(/[\t\r\n]+/g, ' ').trim();

async function goi(tuKhoa) {
  const { stdout } = await chay_lenh('curl', [
    '-s', '--http1.1', '--max-time', '90',
    '-H', `x-auth-token: ${process.env.POLY_PIZZA_KEY || ''}`,
    `https://api.poly.pizza/v1.1/search/${encodeURIComponent(tuKhoa)}?limit=100`,
  ], { encoding: 'utf8', maxBuffer: 1 << 26 });
  // Bo ngoai la `{ total, results }` - `results` VIET THUONG, lech voi cac khoa ben trong
  // (`Title`, `Licence`, `Tri Count`). Viet `j.Results` la ra mang rong ma khong bao loi.
  return JSON.parse(stdout);
}

const tuDien = existsSync(TU_DIEN) ? (JSON.parse(readFileSync(TU_DIEN, 'utf8')).tu || {}) : {};
// Bo tu khoa rut tu chinh muc luc Icosa (`cong-cu/rut_tu_khoa.mjs`): 73.626 ten model that
// noi ro kho co nhieu thu gi, sat hon danh sach tu nghi tay.
const TU_RUT = join(import.meta.dirname, 'tu_khoa.json');
const rut = existsSync(TU_RUT) ? (JSON.parse(readFileSync(TU_RUT, 'utf8')).tu || []) : [];
const tuKhoa = [...new Set([...NEN, ...Object.values(tuDien).flat(), ...rut])];
console.log(`${tuKhoa.length} tu khoa`);

const thay = new Map();
let i = 0, loi = 0;
const chay = async () => {
  for (;;) {
    const t = tuKhoa[i++];
    if (t === undefined) return;
    try {
      const j = await goi(t);
      if (j.error) throw new Error(j.error);
      for (const r of j.results || []) {
        if (!thay.has(r.ID)) thay.set(r.ID, { r, tu: t });
      }
    } catch (e) {
      loi++;
      console.log(`HONG "${t}": ${String(e.message).slice(0, 60)}`);
    }
  }
};
await Promise.all(Array.from({ length: SONG_SONG }, chay));

const dong = ['id\tten\ttac_gia\tlicense\tso_tam\tdinh_dang\ttag\tcach_lay'];
for (const { r, tu } of thay.values()) {
  const lic = sach(r.Licence);
  // Luat repo: CC-BY-SA va CC-BY-ND deu cam. Bo ngay o buoc quet.
  if (/-(sa|nd)\b|share.?alike|noderiv/i.test(lic)) continue;
  dong.push([
    r.ID, sach(r.Title), sach(r.Creator?.Username), lic || '?',
    r['Tri Count'] ?? '', 'glb', tu, CACH_LAY,
  ].join('\t'));
}
mkdirSync('ke', { recursive: true });
writeFileSync(RA, dong.join('\n') + '\n');
console.log(`Poly Pizza: ${dong.length - 1} model duy nhat · ${loi} tu khoa hong -> ${RA}`);
