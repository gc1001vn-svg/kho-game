#!/usr/bin/env node
/**
 * Quet Openverse -> `ke/openverse.tsv`. Openverse la BO GOP: no khong tu giu file nao, no
 * do khap Flickr, Wikimedia, Nappy, Rawpixel... va **loc license phia may chu** - dung
 * thu kho nay can. Kho no ~800 trieu muc, nen do theo TU KHOA, khong quet het (giong
 * `quet_freesound.mjs`).
 *
 * MAC DINH CHI LAY HINH VE (`category=illustration`). Do 17/09: khong loc thi `sword` ra
 * toan anh chup Flickr kieu "pen mightier than sword" - dung duoc cho game 2D thi gan nhu
 * khong. Can anh chup (lam hoa tiet) thi them `--anh`.
 *
 * BAY LON NHAT - **DO XONG MUC LUC VAN CHUA TAI DUOC**. Openverse chi tra ve URL tro ve
 * host GOC, ma host goc phai nam trong o **Allowed domains**. Do 17/09 tren 2.544 muc, chi
 * co BA host, va ca ba deu `000` + `connect_rejected`:
 *   upload.wikimedia.org   1.798 muc
 *   images.rawpixel.com      533 muc
 *   svgsilh.com              213 muc
 * Xin mo ba host do thi ca muc luc dung duoc. Quet duoc khong co nghia la lay duoc.
 *
 * LICENSE: lenh nay chi xin `license=cc0,by`. Luat kho chi nhan CC0 · CC-BY · MIT.
 * Cot `tac_gia` co san (khac OpenGameArt phai mo tung trang), va cot `ghi_cong` la chuoi
 * ghi cong Openverse soan san - CC-BY doi dung thu do.
 *
 * KHONG KHOA VAN CHAY, nhung CHAT. Do 17/09 tu header tra ve:
 *   x-ratelimit-limit-anon_burst: 20/min
 *   x-ratelimit-limit-anon_sustained: 200/day
 * Va `page_size` > 20 thi `401 {"detail":"page_size may not exceed 20 for anonymous
 * requests"}`. Khong khoa thi moi tu khoa toi da 12 trang x 20 = 240 muc.
 *
 * CO KHOA thi rong hon 50 lan. Do 18/09 tu header khi da xac minh email:
 *   x-ratelimit-limit-oauth2_client_credentials_burst: 100/min
 *   x-ratelimit-limit-oauth2_client_credentials_sustained: 10000/day
 * Va `page_size` toi da **50** (`401 {"detail":"page_size may not exceed 50 for
 * authenticated requests"}` neu xin 100).
 *
 * **DAT `OPENVERSE_CLIENT_ID` + `OPENVERSE_CLIENT_SECRET`, DUNG dat `OPENVERSE_TOKEN`.**
 * Token chi song **43.200 giay (12 tieng)** roi chet - nhet vao bien moi truong la mai sau
 * bo tay khong hieu vi sao lai tut ve muc khach. Co hai bien kia thi lenh nay **tu xin
 * token moi moi lan chay**. `OPENVERSE_TOKEN` van dung duoc, chi de chay tam trong phien.
 *
 * Lay khoa la **viec cua chu du an** (phai bam link xac minh trong email):
 *   1. POST https://api.openverse.org/v1/auth_tokens/register/  (json: `name`,
 *      `description`, `email`) -> tra ve `client_id` + `client_secret`.
 *      **Chi hien MOT LAN, khong lay lai duoc.**
 *   2. Bam link xac minh trong email -> `"Successfully verified email. Your OAuth2
 *      credentials are now active."`
 *   3. Dat lau dai: claude.ai/code -> nut ten moi truong -> **Edit cloud environment** ->
 *      o **Environment variables**, hai dong:
 *        OPENVERSE_CLIENT_ID=<client_id>
 *        OPENVERSE_CLIENT_SECRET=<client_secret>
 *      Phien dang mo KHONG nhan, phai mo phien moi.
 *
 * BAY: `GET /v1/rate_limit/` tra `"verified": false` **ngay ca khi da xac minh** va da
 * duoc cap muc 100/min - dung tin truong do, doc HEADER `x-ratelimit-limit-*` moi dung.
 * Va token xin TRUOC khi bam link xac minh thi van o muc khach: phai xin token MOI sau
 * khi xac minh xong.
 *
 * **KHOA LA MAT KHAU. Repo nay Public - khong bao gio commit khoa vao git.**
 *
 * Dung:
 *   node cong-cu/quet_openverse.mjs                  # bo tu khoa nen, tu chay tiep cho con do
 *   node cong-cu/quet_openverse.mjs sword castle     # chi may tu do
 *   node cong-cu/quet_openverse.mjs --trang 6        # 6 trang moi tu (ton quota hon)
 *   node cong-cu/quet_openverse.mjs --anh            # lay ca ANH CHUP, khong chi hinh ve
 *   node cong-cu/quet_openverse.mjs --lam-lai        # bo phan da quet, lam tu dau
 */
import { execFile } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';

const chay_lenh = promisify(execFile);
const RA = 'ke/openverse.tsv';
const API = 'https://api.openverse.org/v1/images/';
/** Sitemap-style so ghi nho, de dut giua chung chay tiep duoc. Khong len git. */
const SO_XONG = 'nguon/openverse_xong.txt';
const chay_lenh_som = promisify(execFile);
/** Xin token moi tu client_id/secret. Token song 12 tieng nen xin lai moi lan chay. */
const xin_token = async () => {
  const id = process.env.OPENVERSE_CLIENT_ID;
  const bi = process.env.OPENVERSE_CLIENT_SECRET;
  if (!id || !bi) return '';
  try {
    const { stdout } = await chay_lenh_som('curl', [
      '-sS', '--max-time', '60', '-X', 'POST',
      'https://api.openverse.org/v1/auth_tokens/token/',
      '-d', `client_id=${id}`, '-d', `client_secret=${bi}`,
      '-d', 'grant_type=client_credentials',
    ], { encoding: 'utf8' });
    return JSON.parse(stdout).access_token || '';
  } catch {
    console.error('Xin token hong - chay tiep o muc khach (20/min · 200/ngay).');
    return '';
  }
};
const token = process.env.OPENVERSE_TOKEN || await xin_token();
/** Khong khoa tran la 20; co khoa tran la 50 - xin 100 thi `401`. */
const MOI_TRANG = token ? 50 : 20;
/** Khong khoa: burst 20/min -> nghi 3,2s. Co khoa: 100/min -> nghi 700ms. */
const NGHI = token ? 700 : 3200;

/** Tu khoa nen cho game chien thuat 2D: dia hinh, cong trinh, quan, do, giao dien. */
const NEN = [
  'sword', 'shield', 'axe', 'bow', 'arrow', 'armor', 'knight', 'soldier', 'archer',
  'castle', 'tower', 'wall', 'gate', 'house', 'village', 'farm', 'windmill', 'barn',
  'grass', 'stone', 'wood', 'water', 'tree', 'forest', 'mountain', 'road', 'bridge',
  'wheat', 'barrel', 'cart', 'horse', 'sheep', 'anvil', 'forge', 'hammer', 'mine',
  'coin', 'crown', 'banner', 'flag', 'scroll', 'map', 'compass', 'shield icon',
];

const args = process.argv.slice(2);
const iTrang = args.indexOf('--trang');
const TRANG_TOI_DA = iTrang >= 0 ? Number(args[iTrang + 1]) : 3;
const lamLai = args.includes('--lam-lai');
const caAnh = args.includes('--anh');
const tuKhoa = args.filter((a, i) => !a.startsWith('--') && !(iTrang >= 0 && i === iTrang + 1));
const danhSach = tuKhoa.length ? tuKhoa : NEN;

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

/** Tra `{ ma, than }`. Tach ma ra vi `429` phai DUNG HAN, khong phai thu lai. */
const lay = async (url) => {
  const a = ['-sS', '--max-time', '120', '-w', '\\n%{http_code}'];
  if (token) a.push('-H', `Authorization: Bearer ${token}`);
  a.push(url);
  const { stdout } = await chay_lenh('curl', a, { encoding: 'utf8', maxBuffer: 1 << 28 });
  const i = stdout.lastIndexOf('\n');
  return { ma: stdout.slice(i + 1).trim(), than: stdout.slice(0, i) };
};

/** `cc0` -> `CC0`; `by` + `4.0` -> `CC-BY 4.0`. Giu dung chu de `do.mjs` loc duoc. */
const doiLicense = (l, v) => (l === 'cc0' ? 'CC0' : `CC-BY ${v || ''}`.trim());

mkdirSync('ke', { recursive: true });
mkdirSync('nguon', { recursive: true });
if (lamLai) { rmSync(SO_XONG, { force: true }); rmSync(RA, { force: true }); }
const daXong = new Set(existsSync(SO_XONG)
  ? readFileSync(SO_XONG, 'utf8').split('\n').filter(Boolean) : []);
const daCo = new Set(existsSync(RA)
  ? readFileSync(RA, 'utf8').split('\n').slice(1).filter(Boolean).map((d) => d.split('\t')[0]) : []);
if (!existsSync(RA)) {
  writeFileSync(RA, 'id\tten\ttac_gia\tlicense\tloai\tnguon\tdinh_dang\ttu_khoa\tghi_cong\tcach_lay\n');
}
console.log(`${danhSach.length} tu khoa x ${TRANG_TOI_DA} trang · ${MOI_TRANG} muc/trang`
  + ` · ${caAnh ? 'hinh ve + anh chup' : 'chi hinh ve'}`
  + ` · ${token ? 'CO khoa (100/min · 10.000/ngay)' : 'KHONG khoa (20/min · 200/ngay)'}`
  + ` · dang co ${daCo.size} muc`);

let goi = 0;
let hetQuota = false;
for (const tu of danhSach) {
  for (let trang = 1; trang <= TRANG_TOI_DA && !hetQuota; trang += 1) {
    const dau = `${tu}\t${trang}`;
    if (daXong.has(dau)) continue;
    const url = `${API}?q=${encodeURIComponent(tu)}&license=cc0,by`
      + `${caAnh ? '' : '&category=illustration'}`
      + `&page_size=${MOI_TRANG}&page=${trang}`;
    const { ma, than } = await lay(url);
    goi += 1;
    if (ma === '429') {
      console.error(`\n429 HET QUOTA sau ${goi} luot goi. Da ghi ${daCo.size} muc.`);
      console.error('Chay lai lenh nay ngay mai (hoac dat OPENVERSE_TOKEN) - phan da xong duoc bo qua.');
      hetQuota = true;
      break;
    }
    if (ma !== '200') {
      console.error(`  ${tu} trang ${trang}: HTTP ${ma} · ${than.slice(0, 120)}`);
      break;
    }
    let j;
    try { j = JSON.parse(than); } catch { console.error(`  ${tu} trang ${trang}: JSON hong`); break; }
    const ket = j.results || [];
    const them = [];
    for (const r of ket) {
      if (daCo.has(r.id)) continue;
      daCo.add(r.id);
      them.push([
        r.id,
        (r.title || '').replace(/\s+/g, ' ').trim() || '?',
        (r.creator || '?').replace(/\s+/g, ' ').trim(),
        doiLicense(r.license, r.license_version),
        r.category || '?',
        r.source || r.provider || '?',
        r.filetype || '?',
        tu,
        (r.attribution || '').replace(/\s+/g, ' ').trim(),
        `curl -O "${r.url}"`,
      ].join('\t'));
    }
    if (them.length) appendFileSync(RA, them.join('\n') + '\n');
    appendFileSync(SO_XONG, `${dau}\n`);
    console.log(`  ${tu} trang ${trang}/${Math.min(TRANG_TOI_DA, j.page_count || 1)}`
      + ` · +${them.length} · tong ${daCo.size}`);
    if (trang >= (j.page_count || 1)) break;
    await nghi(NGHI);
  }
  if (hetQuota) break;
}

console.log(`openverse: ${daCo.size} muc -> ${RA} (${goi} luot goi)`);
if (!hetQuota) console.log('Xong. Them tu khoa: node cong-cu/quet_openverse.mjs <tu> <tu>');
