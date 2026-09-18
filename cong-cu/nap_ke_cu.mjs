#!/usr/bin/env node
/**
 * Doi ban ke Markdown cua cac du an cu (`KHO_ASSET.md`, `KHO_CHUNG.md`) sang TSV cua kho
 * nay, de moi nguon do chung mot lenh `cong-cu/do.mjs`.
 *
 * Dang cua hai file do: moi goi mot khoi
 *
 *     **`<duong dan goi>`** — 41 model
 *
 *     `ten1` · `ten2` · `ten3`
 *
 * LICENSE VA TAC GIA: **tra tu `ke/kenney.tsv` va `ke/itch.tsv`**, khong doan, khong
 * regex tay. Ban truoc dung bang regex (`/kenney/i`, `/quaternius/i`, ...) do vao chinh
 * duong dan goi - ma duong dan that la `assets_source/city-kit-suburban/Models/GLB
 * format`, khong chua chu "kenney" o dau ca. Ket qua: **4.497/6.288 dong license `?`**,
 * khong dong nao co tac gia, tuc ban ke KHONG du tu cach ban ghi cong (luat 2 cua
 * `CLAUDE.md`). Tra bang thi Kenney nam san o `ke/kenney.tsv` voi ca `tac_gia`, `license`
 * lan `cach_lay` dung cua tung goi.
 *
 * CACH LAY: lay tu chinh hang cua goi do trong bang, **khong** phai mot chuoi ap cho ca
 * ban ke. Ban truoc dan `node tools/tai_itch.mjs ...` vao **ca 6.288 dong** - sai voi 4
 * goi Kenney (phai la `tai_asset.mjs`) va sai voi model Icosa (lay qua wayback).
 *
 * BO ICOSA. `assets_source/icosa/<id>` la model tai ve tu Icosa Gallery, da co ban ke
 * rieng `ke/icosa.tsv` DAY DU HON (co `tac_gia`, `license`, `so_tam`). Giu ca hai thi
 * `do.mjs` dem hai lan va ban xau hon che ban tot.
 *
 * Dung:
 *   node cong-cu/nap_ke_cu.mjs ../quoc-chien/docs/KHO_ASSET.md quoc-chien-assets
 *   node cong-cu/nap_ke_cu.mjs ../quoc-chien/docs/KHO_CHUNG.md tayvuc-kho-chung
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const KE = join(import.meta.dirname, '..', 'ke');

const [nguon, ten, cachLayDuPhong] = process.argv.slice(2);
if (!nguon || !ten) {
  console.error('Dung: node cong-cu/nap_ke_cu.mjs <file .md> <ten-nguon> [cach-lay du phong]');
  process.exit(1);
}

const sach = (s) => String(s ?? '').replace(/[\t\r\n]+/g, ' ').trim();

/** Doc mot ban ke thanh mang object. */
const doc = (f) => {
  const dong = readFileSync(join(KE, f), 'utf8').split('\n').filter(Boolean);
  const cot = dong[0].split('\t');
  return dong.slice(1).map((d) => Object.fromEntries(d.split('\t').map((v, i) => [cot[i], v])));
};

// Bang tra: khoa la SLUG goi. Kenney khoa thang; itch khoa ca `<tac-gia>/<goi>` lan `<goi>`
// vi `KHO_ASSET.md` chi giu ten thu muc, con `KHO_CHUNG.md` giu `<tac-gia>/<goi>`.
const bang = new Map();
for (const r of doc('kenney.tsv')) {
  bang.set(r.goi, { tac_gia: r.tac_gia, license: r.license, cach_lay: r.cach_lay });
}
for (const r of doc('itch.tsv')) {
  const v = { tac_gia: r.tac_gia, license: r.license, cach_lay: r.cach_lay };
  if (!bang.has(r.goi)) bang.set(r.goi, v);
  const cuoi = r.goi.split('/').pop();
  if (!bang.has(cuoi)) bang.set(cuoi, v);
}

/** Ten thu muc cap mot cua kho chung `tayvuc` -> ten tac gia tren itch. */
const TAC_GIA = { kaykit: 'kaylousberg', quaternius: 'quaternius', kenney: 'Kenney' };

/**
 * Tra bang theo slug, thu them may dang ten da biet la CUNG MOT GOI:
 * `kaykit/forest` tren kho chung chinh la `kaylousberg/kaykit-forest` tren itch.
 * Chi thu dung ten, khong doan license cho goi khong co trong bang nao.
 */
function traBang(s) {
  const cuoi = s.split('/').pop();
  const thu = [s, cuoi];
  if (s.startsWith('kaykit/')) thu.push(`kaylousberg/kaykit-${cuoi}`, `kaykit-${cuoi}`);
  const chu1 = s.includes('/') ? s.split('/')[0] : null;
  if (chu1 && TAC_GIA[chu1]) thu.push(`${TAC_GIA[chu1]}/${cuoi}`);
  for (const k of thu) if (bang.has(k)) return bang.get(k);
  return null;
}

const chu = readFileSync(nguon, 'utf8');
const dong = ['goi\tten\ttac_gia\tlicense\tcach_lay'];
let goi = null;
let slug = null;
let soGoi = 0;
let boIcosa = 0;
const chuaTra = new Set();

for (const d of chu.split('\n')) {
  const mGoi = d.match(/^\*\*`([^`]+)`\*\*\s+—/);
  if (mGoi) {
    goi = mGoi[1];
    // `assets_source/<slug>/...` -> `<slug>`; `<tac-gia>/<goi>` -> giu nguyen hai doan.
    const doan = goi.split('/');
    slug = doan[0] === 'assets_source' ? doan[1] : doan.slice(0, 2).join('/');
    soGoi++;
    continue;
  }
  if (!goi || !d.startsWith('`')) continue;
  if (/^assets_source\/icosa\//.test(goi)) { boIcosa++; continue; }
  const tens = [...d.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  if (!tens.length) continue;

  const tra = traBang(slug);
  if (!tra) chuaTra.add(slug);
  // Ten thu muc cua kho chung LA ten tac gia (`kaykit/forest`, `quaternius/nature`) - do
  // khong phai doan ma la cach kho do xep. License thi van de `?`: khong tra duoc thi
  // khong dien.
  const tacGiaDuong = slug.includes('/')
    ? TAC_GIA[slug.split('/')[0]]
    : (slug.startsWith('kaykit-') ? TAC_GIA.kaykit : null);
  for (const t of tens) {
    dong.push([
      sach(goi),
      sach(t),
      sach(tra?.tac_gia || tacGiaDuong || '?'),
      sach(tra?.license || '?'),
      sach(tra?.cach_lay || cachLayDuPhong || '?'),
    ].join('\t'));
  }
}

mkdirSync(KE, { recursive: true });
const ra = join(KE, `${ten}.tsv`);
writeFileSync(ra, `${dong.join('\n')}\n`);
const hoi = dong.slice(1).filter((d) => d.split('\t')[3] === '?').length;
console.log(`${soGoi} goi · ${dong.length - 1} model -> ${ra}`);
console.log(`  bo ${boIcosa} dong Icosa (da co ke/icosa.tsv day du hon)`);
console.log(`  license \`?\`: ${hoi}`);
if (chuaTra.size) console.log(`  chua tra duoc: ${[...chuaTra].join(' · ')}`);
