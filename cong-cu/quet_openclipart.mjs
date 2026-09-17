#!/usr/bin/env node
/**
 * Quet muc luc Openclipart -> `ke/openclipart.tsv`. Clipart SVG cho giao dien, bieu tuong,
 * hinh 2D - nguon 2D lon thu hai cua kho sau OpenGameArt.
 *
 * LICENSE: **CC0** toan bo (Openclipart bat buoc CC0 khi dang). Khong doi ghi ten, nen cot
 * `tac_gia` de `?`: trang chi tiet chap chon (xem duoi), mo 180k trang de lay thu khong
 * bat buoc la khong dang.
 *
 * DUONG DI - do 17/09, ba thu deu bi:
 *   - API JSON `/search/json/?query=` da CHET: tra `302` ve trang chu.
 *   - `/search/?query=` tra `curl: (52) Empty reply from server`.
 *   - Trang chi tiet `/detail/<id>/<slug>` CHAP CHON: do 3 lan duoc 1.
 * Duong chay duoc la **sitemap**, nhung phai du CA HAI: `--http1.1` va **UA trinh duyet**.
 * Thieu mot la `52`. Vi vay ham `lay()` duoi day luon gui ca hai, va thu lai khi gap `52`.
 *
 * `/sitemap.xml` -> 5.820 sitemap con. `sitemap-1.xml` la trang tinh (7 URL), cac file sau
 * moi la clipart, moi file ~32 URL dang `/detail/<id>/<slug>`.
 *
 * TAI VE thi KHONG can UA, khong can `--http1.1` - do 5 lan deu `200`:
 *   curl -O https://openclipart.org/download/356562/demon-hand-with-sign.svg   # image/svg+xml
 *   curl -O https://openclipart.org/image/800px/356562                         # image/png
 * Nen cot `cach_lay` de lenh tran, chay duoc ngay.
 *
 * HO CHAN KHI QUET MANH - do 17/09: chay `SONG_SONG = 6` khong nghi thi sau ~30 phut
 * `/sitemap.xml` bat dau tra `curl: (18) transfer closed with outstanding read data
 * remaining` (cat o 81.445B tren 406.414B) roi `52` lien tiep. Vi vay: **2 luong, nghi
 * giua moi lo**, va ghi TSV DAN DAN chu khong doi xong - dut o dau chay tiep o day.
 *
 * Dung:
 *   node cong-cu/quet_openclipart.mjs                  # quet, tu chay tiep cho con do
 *   node cong-cu/quet_openclipart.mjs --gioi-han 20    # 20 sitemap con, de thu nhanh
 *   node cong-cu/quet_openclipart.mjs --lam-lai        # bo phan da quet, lam tu dau
 */
import { execFile } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';

const chay_lenh = promisify(execFile);
const RA = 'ke/openclipart.tsv';
const GOC = 'https://openclipart.org';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko)'
  + ' Chrome/140.0 Safari/537.36';
/** Sitemap chay song song. 6 lam ho chan (xem dau file) - 2 la muc chay duoc ca buoi. */
const SONG_SONG = 2;
/** Nghi giua moi lo, ms. Bo di la nhanh hon lucdau roi dung han. */
const NGHI_LO = 250;
/** So lan thu lai mot sitemap khi gap `52`/`18`. Lan sau nghi lau hon (400ms * lan). */
const THU_LAI = 4;
/** Ghi nho sitemap da quet xong, de chay tiep khi dut. Khong len git. */
const SO_XONG = 'nguon/openclipart_xong.txt';

const args = process.argv.slice(2);
const iGioiHan = args.indexOf('--gioi-han');
const gioiHan = iGioiHan >= 0 ? Number(args[iGioiHan + 1]) : 0;
const lamLai = args.includes('--lam-lai');

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

/** Lay mot URL. `52` khong phai loi that - la cach ho chan, thu lai la duoc. */
const lay = async (url) => {
  for (let i = 1; i <= THU_LAI; i += 1) {
    try {
      const { stdout } = await chay_lenh('curl', [
        '-sS', '--http1.1', '-A', UA, '--max-time', '120', url,
      ], { encoding: 'utf8', maxBuffer: 1 << 28 });
      if (stdout) return stdout;
    } catch { /* thu lai */ }
    await nghi(400 * i);
  }
  return '';
};

// Buoc 1: sitemap goc -> danh sach sitemap con.
const goc = await lay(`${GOC}/sitemap.xml`);
let conXml = [...goc.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!conXml.length) {
  console.error('Khong doc duoc /sitemap.xml. Hai kha nang:');
  console.error('  1. `openclipart.org` chua co trong o **Allowed domains** cua moi truong.');
  console.error('  2. Ho DANG CHAN vi vua quet manh - dau hieu: `curl: (18) transfer closed'
    + ' with outstanding read data remaining` roi `52` lien tiep.');
  console.error('  Phan biet: `curl -sS -o /dev/null -w "%{http_code}" https://openclipart.org/robots.txt`'
    + ' -> `200` la mang thong, chi bi chan; `000` la allowlist.');
  console.error('  Bi chan thi NGHI vai chuc phut roi chay lai lenh nay - phan da quet duoc bo qua.');
  process.exit(1);
}
if (gioiHan > 0) conXml = conXml.slice(0, gioiHan);

// Buoc 2: bo phan da quet lan truoc. Dut giua chung la chuyen thuong o nguon nay.
mkdirSync('ke', { recursive: true });
mkdirSync('nguon', { recursive: true });
if (lamLai) { rmSync(SO_XONG, { force: true }); rmSync(RA, { force: true }); }
const daXong = new Set(existsSync(SO_XONG)
  ? readFileSync(SO_XONG, 'utf8').split('\n').filter(Boolean) : []);
const daCo = new Set(existsSync(RA)
  ? readFileSync(RA, 'utf8').split('\n').slice(1).filter(Boolean).map((d) => d.split('\t')[0]) : []);
if (!existsSync(RA)) writeFileSync(RA, 'id\tten\ttac_gia\tlicense\tdinh_dang\tcach_lay\n');
const canQuet = conXml.filter((u) => !daXong.has(u));
console.log(`${conXml.length} sitemap con · da xong ${daXong.size} · con ${canQuet.length}`
  + ` · dang co ${daCo.size} muc`);

// Buoc 3: moi sitemap con -> cac URL `/detail/<id>/<slug>`. Trung id thi bo (sitemap chong nhau).
let hong = 0;
let xong = 0;

const mot = async (u) => {
  const xml = await lay(u);
  if (!xml) { hong += 1; return; }
  const them = [];
  for (const m of xml.matchAll(/<loc>[^<]*\/detail\/(\d+)\/([^<]+)<\/loc>/g)) {
    const [, id, slug] = m;
    if (daCo.has(id)) continue;
    daCo.add(id);
    them.push([
      id, slug, '?', 'CC0', 'svg,png',
      `curl -O ${GOC}/download/${id}/${slug}.svg`,
    ].join('\t'));
  }
  // Ghi ngay, khong gom den cuoi: dut giua chung van giu duoc phan da lam.
  if (them.length) appendFileSync(RA, them.join('\n') + '\n');
  appendFileSync(SO_XONG, `${u}\n`);
};

for (let i = 0; i < canQuet.length; i += SONG_SONG) {
  await Promise.all(canQuet.slice(i, i + SONG_SONG).map(mot));
  xong += Math.min(SONG_SONG, canQuet.length - i);
  if (xong % 200 < SONG_SONG) console.log(`  ${xong}/${canQuet.length} sitemap · ${daCo.size} muc · ${hong} hong`);
  await nghi(NGHI_LO);
}

console.log(`openclipart: ${daCo.size} muc -> ${RA}`);
if (hong) {
  console.error(`CANH BAO: ${hong} sitemap khong doc duoc sau ${THU_LAI} lan thu - so tren THIEU.`);
  console.error('Chay lai lenh nay de quet not; phan da xong duoc bo qua.');
}
