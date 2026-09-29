#!/usr/bin/env node
/**
 * Do MOT LENH khap moi nguon trong `ke/*.tsv`, in ra thu trung kem license va cach lay.
 *
 * VI SAO CAN. Kho co nhieu nguon, moi nguon mot cach lay khac nhau. Nho lenh nay thi
 * chi can nho MOT cach do. Loi do (dich, khop, xep) nam o `tim.mjs`.
 *
 * VI SAO MAC DINH IN GON. Truoc 29/09 moi nguon in 40 dong: `farm` ra 35 KB, `character`
 * 34 KB (~12.000 token) - phien ngai chay, hoac `| head` roi sot. Nay mac dinh ~20 dong:
 * so trung moi nguon, license, 3 cai dau, va TAC GIA nhieu trung nhat (cung tac gia ~
 * cung phong cach). Can xem ky mot nguon thi `--nguon <ten>`.
 *
 * Dung:
 *   node cong-cu/do.mjs chicken
 *   node cong-cu/do.mjs "hiệu ứng"            # tieng Viet co dau hay khong dau deu duoc
 *   node cong-cu/do.mjs nha --nguon itch      # xem ky mot nguon (40 dong, --het de het)
 *   node cong-cu/do.mjs house --tam 8000      # chi model <= 8000 tam (nguon nao co cot do)
 *   node cong-cu/do.mjs house --het           # in het moi dong moi nguon
 *   node cong-cu/do.mjs ga --ngan             # 3-4 dong, cho hook `nhac_kho`
 *   node cong-cu/do.mjs anvil --nguon opengameart --tac-gia   # lay ten tac gia OGA
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { dich, timKiem, tomLicense, tacGiaNhieu, LA_GOI } from './tim.mjs';

/** Tran dong in moi nguon o che do chi tiet. */
const TRAN_IN = 40;
/** `--tac-gia` mo bao nhieu trang OpenGameArt. Moi muc mot luot goi mang, dung tham. */
const TRAN_TAC_GIA = 8;
/** Moi nguon in bay nhieu ten o che do gon, moi ten cat con bay nhieu ky tu. */
const TEN_GON = 3;
const DAI_TEN = 30;

const args = process.argv.slice(2);
const giaTri = (co) => { const i = args.indexOf(co); return i >= 0 ? args[i + 1] : undefined; };
const tranTam = Number(giaTri('--tam')) || 0;
const locNguon = giaTri('--nguon') || null;
const het = args.includes('--het');
const ngan = args.includes('--ngan');
const tacGia = args.includes('--tac-gia');
const coGiaTri = new Set(['--tam', '--nguon']);
const tuKhoa = args.filter((a, i) => !a.startsWith('--') && !coGiaTri.has(args[i - 1]));
if (!tuKhoa.length) {
  console.log('Dung: node cong-cu/do.mjs <tu khoa...> [--nguon <ten>] [--tam 8000] [--het] [--ngan] [--tac-gia]');
  process.exit(1);
}

const { tra, chuaDich } = dich(tuKhoa);
const kq = timKiem(tra, { tranTam, locNguon });
const tong = kq.reduce((s, x) => s + x.trung.length, 0);
const donVi = (n) => (LA_GOI.has(n) ? ' goi' : '');
const catTen = (s) => (s.length > DAI_TEN ? `${s.slice(0, DAI_TEN - 1)}…` : s);
const tenDong = (cot, o) => o[cot.indexOf('ten')] || o[0];

/** Nhac tu chua dich: 0 trung vi tu dien thieu KHONG phai "kho khong co". */
function nhacChuaDich() {
  const viet = chuaDich.filter((t) => /[^\x00-\x7f]/.test(t) || t.includes('_'));
  if (viet.length) {
    console.log(`Tu chua co trong tu dien: ${viet.join(' ')} — them vao cong-cu/tu_dien.json`
      + ' roi do lai. CHUA duoc ket luan "khong co".');
  }
}

if (!tong) {
  console.log(`Khong nguon nao co "${tuKhoa.join(' ')}" (do theo: ${tra.join(' · ')}).`);
  nhacChuaDich();
  console.log('Thu tu dong nghia tieng Anh truoc. Van khong co: dung tu ve - bao chu du an quyet.');
  process.exit(0);
}

const dong1 = `kho-game "${tuKhoa.join(' ')}"${tra.join(' ') !== tuKhoa.join(' ').toLowerCase()
  ? ` (dich: ${tra.slice(0, 8).join(' · ')}${tra.length > 8 ? ' …' : ''})` : ''}: ${tong} trung / ${kq.length} nguon`;
const tg = tacGiaNhieu(kq);
const dongTg = tg.length ? `tac gia nhieu nhat (cung tac gia ~ cung phong cach): ${tg.map((t) => `${t.ten} ${t.so}`).join(' · ')}` : '';

// --- `--ngan`: 3-4 dong cho hook. Chi so, khong ten - hook chen MOI cau go.
if (ngan) {
  console.log(dong1);
  if (dongTg) console.log(`  ${dongTg}`);
  console.log(`  ${kq.map((x) => `${x.nguon} ${x.trung.length}${donVi(x.nguon)}`).join(' · ')}`);
  console.log(`  xem: node /home/user/kho-game/cong-cu/do.mjs ${tuKhoa.map((t) => (/\s/.test(t) ? `"${t}"` : t)).join(' ')} [--nguon <ten>]`);
  process.exit(0);
}

// --- Mac dinh: gon, moi nguon mot dong ---
if (!locNguon && !het) {
  console.log(dong1);
  if (dongTg) console.log(dongTg);
  const rong = Math.max(...kq.map((x) => x.nguon.length));
  for (const { nguon, cot, trung } of kq) {
    const ten = trung.slice(0, TEN_GON).map(({ o }) => catTen(tenDong(cot, o))).join(' | ');
    console.log(`  ${nguon.padEnd(rong)} ${String(trung.length).padStart(5)}${donVi(nguon).padEnd(4)}`
      + ` ${tomLicense(cot, trung).padEnd(16)} ${ten}`);
  }
  nhacChuaDich();
  console.log('Xem ky: --nguon <ten> (40 dong, kem cach lay) · --het (moi dong).'
    + ' Lay ve: node cong-cu/lay.mjs <nguon> ...');
  if (kq.some((x) => x.nguon === 'opengameart')) {
    console.log('OpenGameArt khong hien tac gia o danh sach. Truoc khi DUNG: node cong-cu/tac_gia.mjs <duong_dan>');
  }
  process.exit(0);
}

// --- Chi tiet: `--nguon <ten>` hoac `--het` ---
console.log(dong1);
for (const { nguon, cot, trung } of kq) {
  console.log(`\n=== ${nguon} — ${trung.length} trúng${donVi(nguon)} · ${tomLicense(cot, trung)}`);
  for (const { o } of (het ? trung : trung.slice(0, TRAN_IN))) {
    console.log('  ' + cot.map((c, i) => (c === 'tag' ? null : o[i])).filter(Boolean).join(' | '));
  }
  if (!het && trung.length > TRAN_IN) console.log(`  ... con ${trung.length - TRAN_IN} dong, them --het de xem het`);

  // `--tac-gia`: OpenGameArt khong hien tac gia o trang danh sach, nen lay ngay day cho
  // may muc dau. Moi muc mot luot goi mang - nen CHAN o TRAN_TAC_GIA, dung goi ca trang.
  if (tacGia && nguon === 'opengameart') {
    const duong = trung.slice(0, TRAN_TAC_GIA).map(({ o }) => o[0]);
    console.log(`\n  -- tac gia (${duong.length} muc dau) --`);
    try {
      const ra = execFileSync('node', [join(import.meta.dirname, 'tac_gia.mjs'), ...duong], { encoding: 'utf8' });
      for (const l of ra.trim().split('\n')) console.log(`  ${l}`);
    } catch (e) {
      console.log(`  hong: ${String(e.message).slice(0, 70)}`);
    }
  }
}
nhacChuaDich();
if (kq.some((x) => x.nguon === 'opengameart')) {
  console.log('\nOpenGameArt khong hien tac gia o trang danh sach. Truoc khi DUNG: node cong-cu/tac_gia.mjs <duong_dan>');
}
