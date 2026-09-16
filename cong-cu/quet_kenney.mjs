#!/usr/bin/env node
/**
 * Quet muc luc Kenney -> `ke/kenney.tsv`. Toan bo kho cua ho la **CC0**.
 *
 * PHAI LAI CHROMIUM, khong `curl` duoc: `kenney.nl/assets` tra `200` nhung danh sach goi
 * NAP BANG JAVASCRIPT - `curl` chi thay khung trang, `grep 'href="/assets/'` ra 0 dong.
 * Da thu va deu `404`: `/data/assets.json` · `/api/assets` · `/assets.json`.
 *
 * TRUOC KHI CHAY: `npm run mo:mang` o repo `quoc-chien` - no nap CA cua proxy phien vao
 * kho NSS. Khong co buoc do thi Chromium bao `net::ERR_CERT_AUTHORITY_INVALID` cho moi
 * trang ngoai, va thuoc `khoi:dong` van xanh nen loi song sot rat lau.
 *
 * Bo dieu khien Chromium dung chung voi `quoc-chien/tools/lib/cdp.mjs` - khong chep sang
 * day de khoi co hai ban lech nhau.
 *
 * Dung: node cong-cu/quet_kenney.mjs [so trang toi da]
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CDP = '/home/user/quoc-chien/tools/lib/cdp.mjs';
const CHROMIUM = process.env.CHROMIUM ?? '/opt/pw-browsers/chromium';
const RA = 'ke/kenney.tsv';
const TRANG_TOI_DA = Number(process.argv[2]) || 40;

if (!existsSync(CDP)) {
  console.error(`Khong thay ${CDP}. Clone repo quoc-chien canh day truoc.`);
  process.exit(1);
}
const { TrinhDuyet } = await import(CDP);

const sach = (s) => String(s ?? '').replace(/[\t\r\n]+/g, ' ').trim();
const tb = new TrinhDuyet(CHROMIUM, 9333);
await tb.mo();

/**
 * Di theo TUNG LOAI, khong quet chung mot danh sach: co vay moi biet goi nao la 2D, goi
 * nao 3D, goi nao am thanh. Ban dau quet chung, muc luc co 215 goi ma khong ai biet
 * `tiny-factory` la sprite 2D hay model 3D.
 */
const LOAI = ['2D', '3D', 'Audio', 'Textures', 'Other'];

const thay = new Map();
try {
  for (const loai of LOAI) {
  for (let trang = 1; trang <= TRANG_TOI_DA; trang += 1) {
    await tb.moTrang(`https://kenney.nl/assets/category:${loai}/page:${trang}`);
    // Trang nap bang JS, va href la URL TUYET DOI (`https://kenney.nl/assets/<goi>`) chu
    // khong phai duong dan tuong doi - selector `a[href^="/assets/"]` ra 0 dong.
    const LOC = `[...document.querySelectorAll('a[href*="kenney.nl/assets/"]')]
      .map((a) => ({
        slug: a.href.split('/assets/')[1] || '',
        ten: (a.querySelector('h3, .name, strong')?.textContent || a.textContent || '').trim(),
      }))
      .filter((x) => x.slug && !x.slug.includes('/') && !x.slug.includes(':'))`;
    const co = await tb.choDen(`(${LOC}).length > 0`, 20000);
    if (!co) { console.log(`trang ${trang}: khong co goi nao - dung`); break; }
    const ds = await tb.doc(LOC);
    // Moi goi co HAI the `a`: mot boc anh (textContent rong), mot boc ten. Giu ban co
    // chu dai hon, khong thi cot `ten` chi la slug chep lai.
    let moi = 0;
    for (const g of ds || []) {
      const cu = thay.get(g.slug);
      // Mot goi nam o nhieu loai (vd kit vua co sprite vua co model) - gom nhan lai.
      const nhan = new Set([...(cu?.loai || []), loai]);
      if (cu && (cu.ten || '').length >= (g.ten || '').length) { cu.loai = nhan; continue; }
      if (!cu) moi += 1;
      thay.set(g.slug, { ...g, loai: nhan });
    }
    console.log(`${loai} trang ${trang}: ${(ds || []).length} the · moi ${moi} · tong ${thay.size}`);
    // Het goi moi nghia la da di qua trang cuoi - Kenney lap lai trang cuoi thay vi 404.
    if (moi === 0) break;
  }
  }
} finally {
  await tb.dong?.();
}

const dong = ['goi\tten\ttac_gia\tlicense\tloai\tdinh_dang\tcach_lay'];
const dem = {};
for (const g of thay.values()) {
  const loai = [...(g.loai || [])].sort();
  for (const l of loai) dem[l] = (dem[l] || 0) + 1;
  dong.push([
    g.slug,
    sach(g.ten) || g.slug,
    'Kenney',
    'CC0 1.0',
    loai.join(','),
    loai.includes('Audio') ? 'ogg,wav' : loai.includes('3D') ? 'obj,fbx,gltf,png' : 'png,svg',
    `node tools/tai_asset.mjs ${g.slug}  (o repo quoc-chien)`,
  ].join('\t'));
}
console.log('Theo loai: ' + Object.entries(dem).map(([k, v]) => `${k} ${v}`).join(' · '));
mkdirSync('ke', { recursive: true });
writeFileSync(join(RA), dong.join('\n') + '\n');
console.log(`Kenney: ${dong.length - 1} goi -> ${RA}`);
