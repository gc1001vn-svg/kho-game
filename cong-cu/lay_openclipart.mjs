#!/usr/bin/env node
/**
 * Lay file tu `ke/openclipart.tsv` ve `assets_source/openclipart/`. Khong dung `lay.mjs`
 * vi nguon nay khong co manifest `nguon/*.json` - ban ke TSV chinh la manifest, moi dong
 * du de dung URL that.
 *
 * HO CHAN IP KHI LAY MANH. Day la thu chi phoi toan bo cach viet lenh nay. Do 17/09 khi
 * quet muc luc, **nguong tut dan theo so lan bi**:
 *   lan 1  6 luong, khong nghi   ~30 phut
 *   lan 2  2 luong, nghi 250 ms  ~2,5 gio
 *   lan 3  2 luong, nghi 250 ms  ~9 phut
 *   lan 4  1 luong, nghi 3 s     khong bi chan
 * Moi lan bi chan phai doi **2-5 tieng**. Vi vay lenh nay mac dinh `SONG_SONG = 1`,
 * `NGHI = 1200` ms, va **TU DUNG khi thay dau hieu bi chan** thay vi co dam vao - dam
 * tiep chi lam an chan lau hon, khong lay them duoc file nao.
 *
 * DAU HIEU BI CHAN: moi duong tra `curl: (52) Empty reply from server`, rieng
 * `/robots.txt` van `200`. Do `000` kem `connect_rejected` thi la **allowlist** chu khong
 * phai ho chan - khi do them `openclipart.org` vao o **Allowed domains**.
 *
 * TAI THI KHONG CAN gi dac biet - khac luc quet sitemap (phai co UA trinh duyet va
 * `--http1.1`). Do 5 lan deu `200`:
 *   curl -O https://openclipart.org/download/356768/jester-colour-remix.svg  # image/svg+xml
 *   curl -O https://openclipart.org/image/800px/356768                      # image/png
 *
 * LICENSE: ca kho la **CC0**, khong doi ghi ten. Van ghi `<ten>.ghi_cong.json` di theo
 * file de biet lay tu dau - de lan sau khoi phai do lai.
 *
 * Dung:
 *   node cong-cu/lay_openclipart.mjs --loc castle                 # SVG -> ./assets_source/openclipart/
 *   node cong-cu/lay_openclipart.mjs --loc castle --png           # PNG 800px thay vi SVG
 *   node cong-cu/lay_openclipart.mjs --loc castle --png --px 2400
 *   node cong-cu/lay_openclipart.mjs --loc sword --so 30 ../quoc-chien/assets_source
 */
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const chay_lenh = promisify(execFile);
const KE = join(import.meta.dirname, '..', 'ke', 'openclipart.tsv');
const GOC = 'https://openclipart.org';
/** MOT luong. Xem bang nguong o dau file - dung nang len. */
const SONG_SONG = 1;
/** Nghi giua moi file, ms. */
const NGHI = 1200;
const THU_LAI = 3;
/** Bao nhieu lan `52` LIEN TIEP thi coi la bi chan va dung han. */
const TRAN_BI_CHAN = 5;

const args = process.argv.slice(2);
const iLoc = args.indexOf('--loc');
const loc = iLoc >= 0 ? (args[iLoc + 1] || '').toLowerCase() : null;
const iSo = args.indexOf('--so');
const tran = iSo >= 0 ? Number(args[iSo + 1]) : 0;
const iPx = args.indexOf('--px');
const px = iPx >= 0 ? Number(args[iPx + 1]) : 800;
const layPng = args.includes('--png');
const dich = args.filter((a, i) => !a.startsWith('--')
  && !(iLoc >= 0 && i === iLoc + 1) && !(iSo >= 0 && i === iSo + 1)
  && !(iPx >= 0 && i === iPx + 1))[0] || 'assets_source';

if (!loc) {
  console.error('Dung: node cong-cu/lay_openclipart.mjs --loc <tu khoa> [duong-dan-dich]'
    + ' [--png] [--px 800] [--so 30]');
  console.error('Do xem co gi truoc: node cong-cu/do.mjs <tu khoa>');
  process.exit(1);
}
if (!existsSync(KE)) {
  console.error(`Chua co ${KE}. Quet truoc: node cong-cu/quet_openclipart.mjs`);
  process.exit(1);
}

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));
const ten_an_toan = (s) => s.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 90);

const dong = readFileSync(KE, 'utf8').trim().split('\n');
const cot = dong[0].split('\t');
const iId = cot.indexOf('id');
const iTen = cot.indexOf('ten');
const iLicense = cot.indexOf('license');

// Ten Openclipart la slug gach ngang (`castle-gate`), nen do theo chuoi con la du.
let viec = dong.slice(1).map((d) => d.split('\t')).filter((o) => o[iTen].toLowerCase().includes(loc));
if (tran > 0) viec = viec.slice(0, tran);
if (!viec.length) {
  console.log(`Khong co muc nao trung "${loc}". Do rong hon: node cong-cu/do.mjs ${loc}`);
  process.exit(0);
}

const thuMuc = join(dich, 'openclipart');
mkdirSync(thuMuc, { recursive: true });
console.log(`${viec.length} muc · ${layPng ? `PNG ${px}px` : 'SVG'} -> ${thuMuc}`);

let xong = 0;
let boQua = 0;
let hong = 0;
let lienTiep52 = 0;
let biChan = false;
const maHong = {};
const demHong = (ma) => { maHong[ma] = (maHong[ma] || 0) + 1; hong += 1; };

const mot = async (o) => {
  const id = o[iId];
  const slug = o[iTen];
  const url = layPng ? `${GOC}/image/${px}px/${id}` : `${GOC}/download/${id}/${slug}.svg`;
  const file = join(thuMuc, `${ten_an_toan(slug)}.${id}.${layPng ? 'png' : 'svg'}`);
  if (existsSync(file) && statSync(file).size > 0) { boQua += 1; return; }

  for (let lan = 1; lan <= THU_LAI; lan += 1) {
    let ma = '';
    try {
      const { stdout } = await chay_lenh('curl', [
        '-sSL', '--max-time', '120', '-o', file, '-w', '%{http_code}', url,
      ], { encoding: 'utf8' });
      ma = stdout.trim();
    } catch {
      // `curl` thoat khac 0 - gan nhu luon la `52` cua ho.
      ma = '52';
    }
    if (ma === '200' && existsSync(file) && statSync(file).size > 0) {
      lienTiep52 = 0;
      writeFileSync(`${file}.ghi_cong.json`, JSON.stringify({
        ten: slug, tac_gia: '?', license: o[iLicense],
        trang: `${GOC}/detail/${id}/${slug}`, url, nguon: 'openclipart',
      }, null, 1) + '\n');
      xong += 1;
      return;
    }
    rmSync(file, { force: true });
    if (ma === '52' || ma === '000') {
      lienTiep52 += 1;
      if (lienTiep52 >= TRAN_BI_CHAN) { biChan = true; demHong(ma); return; }
      await nghi(2000 * lan);
      continue;
    }
    // `404` la URL chet o muc luc - khong thu lai.
    demHong(ma);
    return;
  }
  demHong('52');
};

let i = 0;
const chay = async () => {
  while (i < viec.length && !biChan) {
    const o = viec[i]; i += 1;
    await mot(o);
    const d = xong + boQua + hong;
    if (d % 25 === 0) console.log(`... ${d}/${viec.length}`);
    await nghi(NGHI);
  }
};
await Promise.all(Array.from({ length: SONG_SONG }, chay));

console.log(`Lay ${xong} · co san ${boQua} · hong ${hong} -> ${thuMuc}`);
if (hong) console.log(`hong theo ma: ${Object.entries(maHong).map(([m, n]) => `${m}=${n}`).join(' · ')}`);
if (biChan) {
  console.error(`\nDUNG SOM: ${TRAN_BI_CHAN} lan \`52\` lien tiep - openclipart.org dang chan IP nay.`);
  console.error('Kiem: curl -sS -o /dev/null -w "%{http_code}" https://openclipart.org/robots.txt');
  console.error('  `200` -> ho chan IP, DOI 2-5 TIENG roi chay lai (file da co duoc bo qua).');
  console.error('  `000` -> them `openclipart.org` vao o **Allowed domains** cua moi truong.');
  console.error('Dam tiep chi lam an chan lau hon, khong lay them duoc file nao.');
}
