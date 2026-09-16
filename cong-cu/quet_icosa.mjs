#!/usr/bin/env node
/**
 * Quet TOAN BO kho Icosa thanh muc luc `ke/icosa.tsv` - chi ten va license, KHONG tai
 * model. Do gio tra bang `grep`, thay nao can moi `lay.mjs` keo ve.
 *
 * VI SAO TSV, khong phai bang Markdown. Kho co ~141.000 asset: bang Markdown thi moi dong
 * cong them `| ` bon lan va khong ai mo noi file; TSV `grep` thang, nhe hon, va `cut -f`
 * lay dung cot can.
 *
 * VI SAO KHONG LUU URL TAI. URL tai la moc gia cua wayback, phai giai moc that moi dung
 * duoc (xem `lay.mjs`), ma giai san 141.000 cai thi mat nhieu ngay va phan lon khong bao
 * gio dung toi. `lay.mjs` hoi `/v1/assets/<id>` dung luc tai - them mot luot goi cho moi
 * model that su lay ve.
 *
 * LICENSE: bo thang ND va SA ngay o day. ND cam tac pham phai sinh, ma nuong sprite la
 * phai sinh; SA lay license sang ca du an.
 *
 * Dung:
 *   node cong-cu/quet_icosa.mjs            # quet het
 *   node cong-cu/quet_icosa.mjs 50         # chi 50 trang dau, de thu
 */
import { execFile } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';

const chay_lenh = promisify(execFile);
const API = 'https://api.icosa.gallery/v1/assets';
const MOI_TRANG = 100;
const RA = 'ke/icosa.tsv';

const args = process.argv.slice(2);
const tranTrang = Number(args.find((a) => /^\d+$/.test(a))) || Infinity;
/**
 * LOC O PHIA SERVER, dung keo ve roi loc o nha. Do 15/09 bang `pageSize=1`:
 * toan kho 141.099 · `license=REMIXABLE` (CC-BY + CC0, bo ND) 130.530 ·
 * them `format=-TILT` 73.626 · them `triangleCountMax=8000` 41.435.
 * Bo TILT vi do la tranh ve trong VR - tung net co la mot khoi hinh, khong phai do vat.
 */
const LOC = ['license=REMIXABLE', args.includes('--ca-tilt') ? null : 'format=-TILT']
  .filter(Boolean).join('&');
const doi = (ms) => new Promise((r) => setTimeout(r, ms));

/** `fetch` cua Node khong di CONNECT qua proxy phien -> `403 Blocked by egress policy`. */
async function lay(url, lan = 7) {
  for (let i = 0; i < lan; i++) {
    try {
      const r = await chay_lenh('curl', ['-s', '--http1.1', '--max-time', '120', url], {
        encoding: 'utf8',
        maxBuffer: 1 << 28,
      });
      // Bi doi thi API tra trang HTML chu khong tra JSON loi:
      // `SyntaxError: Unexpected token '<', "<!DOCTYPE "...`. Do o 8 luong.
      return JSON.parse(r.stdout);
    } catch (loi) {
      if (i === lan - 1) throw loi;
      await doi(2 ** i * 2000); // 2s · 4s · 8s · 16s · 32s · 64s
    }
  }
}

mkdirSync('ke', { recursive: true });
const sach = (s) => String(s ?? '').replace(/[\t\r\n]+/g, ' ').trim();

// `pageToken` la SO TRANG (do: token 500 tra ve trang 500, next 501), khong phai con tro
// mu. Nho vay quet song song duoc: tuan tu het ~6 gio, tam luong con ~45 phut.
const SONG_SONG = 4;

// Trang 1 tra ve `totalSize` -> biet truoc co bao nhieu trang, khong phai mo mam.
const dau = await lay(`${API}?pageSize=${MOI_TRANG}&${LOC}`);
const tongAsset = dau.totalSize || 0;
const soTrang = Math.min(Math.ceil(tongAsset / MOI_TRANG), tranTrang);
console.log(`${tongAsset} asset · ${soTrang} trang · ${SONG_SONG} luong · loc: ${LOC}`);

const ketQua = new Array(soTrang).fill(null);
let xong = 0, tong = 0, giu = 0, boLicense = 0;
let ke = 0;

const chay = async () => {
  for (;;) {
    const i = ke++;
    if (i >= soTrang) return;
    const j = i === 0 ? dau : await lay(`${API}?pageSize=${MOI_TRANG}&${LOC}&pageToken=${i + 1}`);
    const dong = [];
    for (const a of j.assets || []) {
      tong++;
      const l = a.license || '';
      if (l.includes('_ND') || l.includes('_SA') || !l) { boLicense++; continue; }
      const dd = [...new Set((a.formats || []).map((f) => f.formatType))].join(',');
      dong.push([
        a.assetId,
        sach(a.displayName),
        sach(a.authorName),
        `${l} ${a.licenseVersion || ''}`.trim(),
        a.triangleCount ?? '',
        dd,
        (a.tags || []).join(','),
      ].join('\t'));
      giu++;
    }
    ketQua[i] = dong;
    xong++;
    if (xong % 50 === 0) console.log(`${xong}/${soTrang} trang · quet ${tong} · giu ${giu} · bo ${boLicense}`);
  }
};
await Promise.all(Array.from({ length: SONG_SONG }, chay));

// Ghi mot lan, theo dung thu tu trang - de `git diff` lan sau doc duoc.
writeFileSync(RA, 'id\tten\ttac_gia\tlicense\tso_tam\tdinh_dang\ttag\n');
for (const dong of ketQua) if (dong?.length) appendFileSync(RA, dong.join('\n') + '\n');
console.log(`Xong: quet ${tong} asset · giu ${giu} · bo ${boLicense} (ND/SA hay khong ro) -> ${RA}`);
if (!existsSync(RA)) process.exit(1);
