#!/usr/bin/env node
/**
 * Lay file tu `ke/openverse.tsv` ve `assets_source/openverse/`. Khong dung `lay.mjs` vi
 * nguon nay khong co manifest `nguon/*.json` - ban ke TSV chinh la manifest, moi dong da
 * giu URL that.
 *
 * BA THU DO 17/09, dung bo:
 * 1. **`upload.wikimedia.org` tra `429` khi tai nhanh** - day la cai chi phoi toan bo cach
 *    viet lenh nay. `server: Varnish`, than la trang "Wikimedia Error". Khong phai chan
 *    han: cung mot URL, nghi 3 giay roi goi lai thi `200` (do 3/3). Doi UA cho "lich su"
 *    KHONG cuu duoc (do 1/6). **Chi co nghi moi cuu**, va nghi 1 giay la chua du: do 10
 *    URL cach nhau 1 giay ra 8 lan `429`. Vi vay `SONG_SONG = 1` va `NGHI = 2500`.
 *    **Dung nang len cho nhanh** - nhanh hon la hong nhieu hon, tong thoi gian te hon.
 * 2. **`svgsilh.com` BO HAN**: `403` kem `server: cloudflare` va trang captcha - dich duoi,
 *    them allowlist vo ich. 213 muc cua nguon do bi bo, lenh nay tu loc.
 * 3. **Vai URL da chet** (`404`) - muc luc Openverse cu hon file that. Lenh in bang ma
 *    HTTP cuoi cung de phan biet `404` (chet han) voi `429` (nghi chua du).
 *
 * GHI CONG. CC-BY doi ghi ten. Moi file tai ve kem `<ten>.ghi_cong.json` lay tu cot
 * `ghi_cong` Openverse soan san - giu ghi cong DI THEO file, dung gom mot cho de roi mat.
 *
 * Dung:
 *   node cong-cu/lay_openverse.mjs --loc castle              # -> ./assets_source/openverse/
 *   node cong-cu/lay_openverse.mjs --loc castle --cc0        # chi CC0, khoi phai ghi ten
 *   node cong-cu/lay_openverse.mjs --loc sword ../quoc-chien/assets_source
 *   node cong-cu/lay_openverse.mjs --loc shield --so 20      # tran 20 file
 */
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const chay_lenh = promisify(execFile);
const KE = join(import.meta.dirname, '..', 'ke', 'openverse.tsv');
/** MOT luong. 2 luong da du lam Wikimedia tra `429` (do 4/10 hong). */
const SONG_SONG = 1;
/** Nghi giua moi file, ms. Do: 1000 ms ra 8/10 `429`; 2500 ms thi troi. */
const NGHI = 2500;
const THU_LAI = 4;
/** Host dich duoi - tai bao nhieu lan cung `403`. */
const BO_HAN = ['svgsilh.com'];

const args = process.argv.slice(2);
const iLoc = args.indexOf('--loc');
const loc = iLoc >= 0 ? (args[iLoc + 1] || '').toLowerCase() : null;
const iSo = args.indexOf('--so');
const tran = iSo >= 0 ? Number(args[iSo + 1]) : 0;
const chiCc0 = args.includes('--cc0');
const dich = args.filter((a, i) => !a.startsWith('--')
  && !(iLoc >= 0 && i === iLoc + 1) && !(iSo >= 0 && i === iSo + 1))[0] || 'assets_source';

if (!loc) {
  console.error('Dung: node cong-cu/lay_openverse.mjs --loc <tu khoa> [duong-dan-dich]'
    + ' [--cc0] [--so 20]');
  console.error('Do xem co gi truoc: node cong-cu/do.mjs <tu khoa>');
  process.exit(1);
}
if (!existsSync(KE)) {
  console.error(`Chua co ${KE}. Quet truoc: node cong-cu/quet_openverse.mjs`);
  process.exit(1);
}

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));
/** Ten file an toan tren dia, giu duoi goc. */
const ten_an_toan = (s) => s.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 90);

const dong = readFileSync(KE, 'utf8').trim().split('\n');
const cot = dong[0].split('\t');
const iId = cot.indexOf('id');
const iTen = cot.indexOf('ten');
const iTacGia = cot.indexOf('tac_gia');
const iLicense = cot.indexOf('license');
const iNguon = cot.indexOf('nguon');
const iGhiCong = cot.indexOf('ghi_cong');
const iCachLay = cot.indexOf('cach_lay');

let boChan = 0;
let viec = dong.slice(1).map((d) => d.split('\t')).filter((o) => {
  if (!`${o[iTen]} ${o[iId]}`.toLowerCase().includes(loc)) return false;
  if (chiCc0 && o[iLicense] !== 'CC0') return false;
  const url = (o[iCachLay].match(/"([^"]+)"/) || [])[1] || '';
  if (BO_HAN.some((h) => url.includes(h))) { boChan += 1; return false; }
  return true;
});
if (tran > 0) viec = viec.slice(0, tran);
if (boChan) console.log(`bo ${boChan} muc o host bi dich duoi (${BO_HAN.join(', ')})`);
if (!viec.length) {
  console.log('Khong co muc nao trung. Do rong hon: node cong-cu/do.mjs ' + loc);
  process.exit(0);
}

const thuMuc = join(dich, 'openverse');
mkdirSync(thuMuc, { recursive: true });
console.log(`${viec.length} muc -> ${thuMuc}`);

let xong = 0;
let boQua = 0;
let hong = 0;
let i = 0;
/** Ma HTTP cuoi cung cua nhung file hong, de biet la `404` hay `429`. */
const maHong = {};
const demHong = (ma) => { maHong[ma] = (maHong[ma] || 0) + 1; hong += 1; };

const mot = async (o) => {
  const url = (o[iCachLay].match(/"([^"]+)"/) || [])[1];
  if (!url) { hong += 1; return; }
  const duoi = (url.match(/\.([A-Za-z0-9]{2,4})(?:\?|$)/) || [])[1] || 'bin';
  const ten = `${ten_an_toan(o[iTen])}.${o[iId].slice(0, 8)}.${duoi}`;
  const file = join(thuMuc, ten);
  if (existsSync(file) && statSync(file).size > 0) { boQua += 1; return; }

  for (let lan = 1; lan <= THU_LAI; lan += 1) {
    try {
      const { stdout } = await chay_lenh('curl', [
        '-sSL', '--http1.1', '--max-time', '120', '-o', file, '-w', '%{http_code}', url,
      ], { encoding: 'utf8' });
      const ma = stdout.trim();
      if (ma === '200' && existsSync(file) && statSync(file).size > 0) {
        // Ghi cong DI THEO file. CC-BY doi ghi ten; CC0 thi giu cho biet lay tu dau.
        writeFileSync(`${file}.ghi_cong.json`, JSON.stringify({
          ten: o[iTen], tac_gia: o[iTacGia], license: o[iLicense],
          nguon: o[iNguon], ghi_cong: o[iGhiCong], url, qua: 'openverse',
        }, null, 1) + '\n');
        xong += 1;
        return;
      }
      rmSync(file, { force: true });
      // `429` la Wikimedia bao nhanh qua - nghi lau hon roi thu lai. `404` la chet han.
      if (ma !== '429') { demHong(ma); return; }
      if (lan === THU_LAI) { demHong('429'); return; }
      await nghi(3000 * lan);
    } catch {
      rmSync(file, { force: true });
      if (lan === THU_LAI) { demHong('curl-loi'); return; }
      await nghi(1500 * lan);
    }
  }
};

const chay = async () => {
  while (i < viec.length) {
    const o = viec[i]; i += 1;
    await mot(o);
    const d = xong + boQua + hong;
    if (d % 25 === 0) console.log(`... ${d}/${viec.length}`);
    await nghi(NGHI);
  }
};
await Promise.all(Array.from({ length: SONG_SONG }, chay));
console.log(`Lay ${xong} · co san ${boQua} · hong ${hong} -> ${thuMuc}`);
if (hong) {
  console.log(`hong theo ma: ${Object.entries(maHong).map(([m, n]) => `${m}=${n}`).join(' · ')}`);
  console.log('`404` la URL chet o muc luc Openverse. Con `429` la nghi chua du -'
    + ' chay lai lenh nay, file da co duoc bo qua.');
}
