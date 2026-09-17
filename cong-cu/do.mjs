#!/usr/bin/env node
/**
 * Do MOT LENH khap moi nguon trong `ke/*.tsv`, in ra thu trung kem license va cach lay.
 *
 * VI SAO CAN. Kho co nhieu nguon, moi nguon mot cach lay khac nhau: Icosa tai qua
 * wayback, kho chung `tayvuc` phai clone repo do, goi itch thi tai lai tu itch.io. Nho
 * lenh nay thi chi can nho MOT cach do, khong phai nho ba.
 *
 * Do theo CHU, khong theo nghia: `ga` khong tu ra `chicken`. Tu dien Viet->Anh dung chung
 * voi `quoc-chien/tools/tu_dien_asset.json` neu repo do nam canh.
 *
 * Dung:
 *   node cong-cu/do.mjs chicken
 *   node cong-cu/do.mjs ga                 # tieng Viet, neu co tu dien
 *   node cong-cu/do.mjs house --tam 8000   # chi model <= 8000 tam (nguon nao co cot do)
 *   node cong-cu/do.mjs house --het        # in het, khong cat o 40 dong moi nguon
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const KE = join(import.meta.dirname, '..', 'ke');
const TU_DIEN = join(import.meta.dirname, '..', '..', 'quoc-chien', 'tools', 'tu_dien_asset.json');
/** Tran dong in moi nguon. Dai hon la tu khoa qua rong - hep lai con hon do output. */
const TRAN_IN = 40;
/** `--tac-gia` mo bao nhieu trang OpenGameArt. Moi muc mot luot goi mang, dung tham. */
const TRAN_TAC_GIA = 8;

const args = process.argv.slice(2);
const iTam = args.indexOf('--tam');
const tranTam = iTam >= 0 ? Number(args[iTam + 1]) : 0;
const het = args.includes('--het');
const tacGia = args.includes('--tac-gia');
const tuKhoa = args.filter((a, i) => !a.startsWith('--') && !(iTam >= 0 && i === iTam + 1));
if (!tuKhoa.length) {
  console.log('Dung: node cong-cu/do.mjs <tu khoa...> [--tam 8000] [--het] [--tac-gia]');
  process.exit(1);
}

// Tu dien cua `quoc-chien` de cac khoa duoi `tu`, khong de o goc.
const tuDien = existsSync(TU_DIEN) ? (JSON.parse(readFileSync(TU_DIEN, 'utf8')).tu || {}) : {};
const tra = [...new Set(tuKhoa.flatMap((t) => (tuDien[t]?.length ? tuDien[t] : [t])))]
  .map((t) => t.toLowerCase());
// Khop theo RANH GIOI TU, khong phai chuoi con: `ga` tung trung ca `Gazer` va `Gaia`.
// `[^a-z0-9]` thay `\b` vi ten model day dau gach duoi va gach ngang.
const mau = tra.map((t) => new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i'));
if (tra.join(' ') !== tuKhoa.join(' ').toLowerCase()) console.log(`(dich: ${tra.join(' · ')})`);

let tongTrung = 0;
let coOga = false;
for (const f of readdirSync(KE).filter((x) => x.endsWith('.tsv')).sort()) {
  const dong = readFileSync(join(KE, f), 'utf8').split('\n').filter(Boolean);
  const cot = dong[0].split('\t');
  const iTen = cot.indexOf('ten');
  const iTamCot = cot.indexOf('so_tam');
  const trung = dong.slice(1).filter((d) => {
    const o = d.split('\t');
    if (!mau.some((re) => re.test(o[iTen] || ''))) return false;
    if (tranTam > 0 && iTamCot >= 0 && Number(o[iTamCot]) > tranTam) return false;
    return true;
  });
  if (!trung.length) continue;
  tongTrung += trung.length;
  if (f.startsWith('opengameart')) coOga = true;
  console.log(`\n=== ${f.replace('.tsv', '')} — ${trung.length} trúng`);
  for (const d of (het ? trung : trung.slice(0, TRAN_IN))) {
    const o = d.split('\t');
    console.log('  ' + cot.map((c, i) => (c === 'tag' ? null : o[i])).filter(Boolean).join(' | '));
  }
  if (!het && trung.length > TRAN_IN) console.log(`  ... con ${trung.length - TRAN_IN} dong, them --het de xem het`);

  // `--tac-gia`: OpenGameArt khong hien tac gia o trang danh sach, nen lay ngay day cho
  // may muc dau. Moi muc mot luot goi mang - nen CHAN o TRAN_TAC_GIA, dung goi ca trang.
  if (tacGia && f.startsWith('opengameart')) {
    const duong = trung.slice(0, TRAN_TAC_GIA).map((d) => d.split('\t')[0]);
    console.log(`\n  -- tac gia (${duong.length} muc dau) --`);
    try {
      const ra = execFileSync('node', [join(import.meta.dirname, 'tac_gia.mjs'), ...duong],
        { encoding: 'utf8' });
      for (const l of ra.trim().split('\n')) console.log(`  ${l}`);
    } catch (e) {
      console.log(`  hong: ${String(e.message).slice(0, 70)}`);
    }
  }
}
if (!tongTrung) {
  console.log('Khong nguon nao co. Dung tu ve - bao chu du an quyet (luat ba buoc).');
} else {
  console.log(`\nTong ${tongTrung} trung. Lay ve: node cong-cu/lay.mjs <nguon> --loc <tu khoa>`);
  // Cot `tac_gia` cua OpenGameArt de `?` (xem `tac_gia.mjs`) - nhac dung lenh lay ten,
  // vi CC-BY doi ghi ten ma khong ai nho khi dang doi asset.
  if (coOga) {
    console.log('OpenGameArt khong hien tac gia o trang danh sach.'
      + ' Truoc khi DUNG: node cong-cu/tac_gia.mjs <duong_dan>');
  }
}
