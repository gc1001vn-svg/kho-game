#!/usr/bin/env node
/**
 * Quet muc luc Freesound -> `ke/freesound.tsv`. Kho am thanh lon nhat dang co duong vao:
 * ~600.000 file, nhung phan lon la thu am doi thuc chu khong phai hieu ung game - nen do
 * theo TU KHOA, khong quet het.
 *
 * CAN KHOA. `freesound.org` tra `200`, con `/apiv2/search/text/` khong khoa thi
 * `401 {"detail":"Authentication credentials were not provided."}`.
 * Lay khoa: https://freesound.org/apiv2/apply/ (dang nhap -> dien ten ung dung -> copy
 * "API key"), roi mot trong hai:
 *   a) `FREESOUND_KEY=<khoa> node cong-cu/quet_freesound.mjs`   (tam, het khi dong phien)
 *   b) API credential cua moi truong dam may - khoa khong bao gio vao phien, an toan hon:
 *      claude.ai/code -> bo chon moi truong -> Update cloud environment -> API credentials
 *      -> host `freesound.org`, header `Authorization`, prefix `Token `
 * **KHOA LA MAT KHAU. Repo nay Public - khong bao gio commit khoa vao git.**
 *
 * LICENSE: chi lay **CC0** va **Attribution** (CC-BY). BO "Attribution NonCommercial" -
 * luat repo chi nhan CC0 · CC-BY · MIT, va NC troi tay neu sau nay doi y ve thuong mai.
 *
 * Dung:
 *   node cong-cu/quet_freesound.mjs                 # bo tu khoa nen
 *   node cong-cu/quet_freesound.mjs sword arrow     # chi may tu do
 */
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const chay_lenh = promisify(execFile);
const RA = 'ke/freesound.tsv';
const API = 'https://freesound.org/apiv2/search/text/';
const MOI_TRANG = 150;
/** So trang moi tu khoa. 150 x 4 = 600 file mot tu - qua du cho mot game. */
const TRANG_TOI_DA = 4;
const LICENSE = ['Creative Commons 0', 'Attribution'];

const khoa = process.env.FREESOUND_KEY || '';

/** Tu khoa nen cho game chien thuat: tieng danh nhau, xay dung, thien nhien, giao dien. */
const NEN = [
  'sword', 'arrow', 'bow', 'axe', 'shield', 'armor', 'battle', 'march', 'horse',
  'hammer', 'saw', 'build', 'construction', 'forge', 'anvil', 'chop wood', 'mine',
  'coin', 'market', 'crowd', 'village', 'bell', 'horn', 'drum', 'fanfare',
  'fire', 'rain', 'wind', 'water', 'thunder', 'bird', 'sheep', 'pig', 'chicken',
  'click', 'button', 'menu', 'notification', 'success', 'error', 'upgrade',
];

const lay = async (url) => {
  const args = ['-s', '--http1.1', '--max-time', '120'];
  // Khong co khoa thi van goi thu: moi truong dam may co the gan header sau khi request
  // roi may ao, luc do khoa khong he di qua phien. Gap 401 moi ket luan la thieu khoa.
  if (khoa) args.push('-H', `Authorization: Token ${khoa}`);
  args.push(url);
  const { stdout } = await chay_lenh('curl', args, { encoding: 'utf8', maxBuffer: 1 << 28 });
  return JSON.parse(stdout);
};

const sach = (s) => String(s ?? '').replace(/[\t\r\n]+/g, ' ').trim();
const tuDien = join(import.meta.dirname, '..', '..', 'quoc-chien', 'tools', 'tu_dien_asset.json');
const bo = existsSync(tuDien) ? (JSON.parse(readFileSync(tuDien, 'utf8')).tu || {}) : {};
const xin = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const tuKhoa = xin.length
  ? xin.flatMap((t) => (bo[t]?.length ? bo[t] : [t]))
  : NEN;

const thay = new Map();
let hong = 0;
for (const tu of tuKhoa) {
  for (const lic of LICENSE) {
    for (let trang = 1; trang <= TRANG_TOI_DA; trang += 1) {
      const url = `${API}?query=${encodeURIComponent(tu)}`
        + `&filter=${encodeURIComponent(`license:"${lic}"`)}`
        + `&fields=${encodeURIComponent('id,name,username,license,duration,type')}`
        + `&page_size=${MOI_TRANG}&page=${trang}`;
      let j;
      try {
        j = await lay(url);
      } catch (e) {
        hong += 1;
        console.log(`HONG "${tu}" (${lic}): ${String(e.message).slice(0, 60)}`);
        break;
      }
      if (j.detail && /Authentication|credentials/i.test(j.detail)) {
        console.error('HTTP 401 - chua co khoa. Xem huong dan o dau file nay.');
        process.exit(1);
      }
      for (const r of j.results || []) {
        if (!thay.has(r.id)) thay.set(r.id, { r, tu });
      }
      if (!j.next) break;
    }
  }
  console.log(`"${tu}": gio giu ${thay.size}`);
}

const dong = ['id\tten\ttac_gia\tlicense\tdai_giay\tdinh_dang\ttu_khoa\tcach_lay'];
for (const { r, tu } of thay.values()) {
  dong.push([
    r.id, sach(r.name), sach(r.username), sach(r.license),
    (r.duration ?? 0).toFixed ? r.duration.toFixed(1) : '', sach(r.type), tu,
    `https://freesound.org/s/${r.id}/`,
  ].join('\t'));
}
mkdirSync('ke', { recursive: true });
writeFileSync(RA, dong.join('\n') + '\n');
console.log(`Freesound: ${dong.length - 1} file duy nhat · ${hong} luot hong -> ${RA}`);
