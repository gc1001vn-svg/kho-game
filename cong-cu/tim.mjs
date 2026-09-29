/**
 * LOI DO dung chung: dich tu khoa Viet -> Anh, khop moi ban ke `ke/*.tsv`.
 * Ba noi goi: `do.mjs` (lenh do), `thu_do.mjs` (bo de), `lay.mjs --loc`.
 *
 * VI SAO TACH RA. Truoc 29/09 do chi khop cot `ten` va tu dien co 30 tu khong dau:
 * `do.mjs hieu_ung` · `nhan_vat` · `cu_dong` deu ra 0 trong khi kho co 259 `effect`,
 * 1.094 `character`, 387 `animation` - va lenh in "Khong nguon nao co". Phien doc dong
 * do la ket luan "khong co" roi tu lam. Ba cho sua o day:
 *
 * 1. KHOA TU DIEN CO DAU. Tieng Viet bo dau thi dung nhau: lúa/lửa/lừa, đèn/đền,
 *    chó/chợ. Go co dau -> khop dung khoa do. Go khong dau -> gop moi khoa trung khi bo
 *    dau (rong hon, nhung khong hut).
 * 2. KHOP MOI COT CHU, tru cot trong `COT_BO`: `tag` cua Icosa/Poly Haven/itch, `loai`
 *    cua OpenGameArt, `tu_khoa` cua Freesound, `tac_gia`, duong goi. Cot `ten` van an
 *    diem hon khi xep.
 * 3. SO NHIEU TU KHOP: `house` trung ca `houses`, `box` trung `boxes`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const GOC = join(import.meta.dirname, '..');
export const KE = join(GOC, 'ke');
const TU_DIEN = join(import.meta.dirname, 'tu_dien.json');

/** Cot KHONG dem khi khop: license, duong lay, so, ma, URL. Khop vao do la do rac. */
const COT_BO = new Set(['license', 'cach_lay', 'ghi_cong', 'id', 'so_tam', 'dinh_dang', 'gia',
  'dai_giay', 'trang', 'repo', 'canh_bao', 'nguon']);

/** "Hiệu ứng" -> "hieu ung". Dung chung cong thuc voi hook `nhac_kho`. */
export const boDau = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D');

/** Mot dang duy nhat cho khoa: chu thuong, NFC, khoang trang / gach -> `_`. */
export const chuanKhoa = (s) => String(s).normalize('NFC').toLowerCase().trim()
  .replace(/[\s_-]+/g, '_');

let tuDienDaDoc = null;
/** Doc tu dien MOT lan: `dau` theo khoa co dau, `khong` theo khoa bo dau (gop). */
export function docTuDien() {
  if (tuDienDaDoc) return tuDienDaDoc;
  const j = existsSync(TU_DIEN) ? JSON.parse(readFileSync(TU_DIEN, 'utf8')) : {};
  const dau = new Map();
  const khong = new Map();
  for (const [k, v] of Object.entries(j.tu || {})) {
    const c = chuanKhoa(k);
    dau.set(c, v);
    const b = boDau(c);
    if (!khong.has(b)) khong.set(b, new Set());
    for (const x of v) khong.get(b).add(x);
  }
  // Hai tap cho hook: gom ca dang co dau lan bo dau, de cau go khong dau cung bat duoc.
  const tap = (a) => new Set((a || []).flatMap((x) => [chuanKhoa(x), boDau(chuanKhoa(x))]));
  tuDienDaDoc = { dau, khong, boQuaHookMo: tap(j._hook_bo_qua), cumThuongMo: tap(j._cum_thuong) };
  return tuDienDaDoc;
}

/**
 * Dich mot khoa. Khoa MOT am tiet co dau phai khop DUNG DAU: "cử" khong duoc thanh
 * "cu" roi trung "cú" (con cu), "mà" khong thanh "ma" (con ma). Go khong dau, hay cum
 * tu hai am tiet tro len, thi so ca khoa bo dau. Tra `null` neu khong dich duoc.
 */
export function dichMot(tu, { hook = false } = {}) {
  const td = docTuDien();
  const c = chuanKhoa(tu);
  if (td.dau.has(c)) return td.dau.get(c);
  const b = boDau(c);
  // Hook doc cau tu do: tieng Viet dung chinh ta cung co tu khong dau ("cho" = cho,
  // khong phai chợ/chó). Nen voi hook, MOT am tiet chi khop dung khoa co dau.
  if ((b !== c || hook) && !c.includes('_')) return null;
  return td.khong.has(b) ? [...td.khong.get(b)] : null;
}

/**
 * Cat mot chuoi thanh CUM theo tu dien, khop cum DAI NHAT truoc: "nhà kho" la mot cum,
 * khong phai "nhà" + "kho". Tra [{ cum, v }] - `v` null la khong dich duoc.
 *
 * `hook = true` (hook `nhac_kho`, doc cau chu du an go tu do): bo qua cum trong
 * `_cum_thuong` ("cá nhân", "đường dẫn" - khong phai asset) va tu trong `_hook_bo_qua`
 * ("kho" la kho-game, "đường" la duong dan). Lenh `do.mjs` thi khong bo: go ra la dang do.
 */
export function tachCum(chuoi, { hook = false } = {}) {
  const td = docTuDien();
  // Tach theo moi dau cau, GIU gach noi: "lúa," phai thanh "lúa", con "sci-fi" giu nguyen.
  const am = String(chuoi).normalize('NFC').toLowerCase().split(/[^\p{L}\p{N}-]+/u).filter(Boolean);
  const bo = (tap, cum) => tap.has(cum) || tap.has(boDau(cum));
  const ra = [];
  for (let i = 0; i < am.length;) {
    let buoc = 1;
    let v = null;
    let cum = am[i];
    for (let n = Math.min(4, am.length - i); n >= 1; n--) {
      const thu = am.slice(i, i + n).join('_');
      if (hook && bo(td.cumThuongMo, thu)) { buoc = n; cum = null; break; }
      const d = dichMot(thu, { hook });
      if (d && !(hook && bo(td.boQuaHookMo, thu))) { buoc = n; cum = thu; v = d; break; }
    }
    if (cum) ra.push({ cum, v });
    i += buoc;
  }
  return ra;
}

/**
 * Dich ca cau tu khoa. Tu dich duoc thi BO tu goc (khong ten model tieng Anh nao chua
 * "gà"); tu khong dich duoc thi giu nguyen - co the no da la tieng Anh.
 * Tra ca danh sach tu CHUA dich de lenh do nhac them vao tu dien, dung im.
 */
export function dich(tuKhoa) {
  const tra = new Set();
  const chuaDich = [];
  for (const { cum, v } of tachCum(tuKhoa.join(' '))) {
    if (v) for (const x of v) tra.add(x.toLowerCase());
    else {
      tra.add(cum.replace(/_/g, ' '));
      chuaDich.push(cum);
    }
  }
  return { tra: [...tra], chuaDich };
}

const thoatRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Khop TRON TU, cho phep so nhieu `s`/`es`; tu ghep nhieu chu thi chap dau cach/_/-. */
export const mau = (t) => new RegExp(
  `(^|[^a-z0-9])${thoatRe(t).replace(/ /g, '[ _-]')}(e?s)?([^a-z0-9]|$)`, 'i');

const CC0 = /cc0|publicdomain\/zero|creative_commons_0|public domain/i;

/**
 * Tach chu hoa dinh lien: `ChickenCoop` -> `Chicken Coop`, `TowerWindmill` -> `Tower Windmill`.
 * Ten model Quaternius/Kenney viet kieu nay - khop tron tu ma khong tach thi `coop` khong trung.
 */
const tachHoa = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2');

let banKe = null;
/** Doc moi ban ke MOT lan (33 MB) - bo de goi do nhieu lan thi khong doc lai. */
export function docBanKe() {
  if (banKe) return banKe;
  banKe = readdirSync(KE).filter((f) => f.endsWith('.tsv')).sort().map((f) => {
    const dong = readFileSync(join(KE, f), 'utf8').split('\n').filter(Boolean);
    const cot = dong[0].split('\t');
    return { nguon: f.replace(/\.tsv$/, ''), cot, than: dong.slice(1) };
  });
  return banKe;
}

/**
 * Khop `tra` (tu tieng Anh da dich) vao moi ban ke.
 * Tra ve [{ nguon, cot, trung: [{ o, diem }] }], moi nguon xep diem giam dan:
 * trung ten +2, CC0 +1 (khoi ghi cong), roi giu thu tu ban ke.
 */
export function timKiem(tra, { tranTam = 0, locNguon = null } = {}) {
  const re = tra.map(mau);
  const kq = [];
  for (const { nguon, cot, than } of docBanKe()) {
    if (locNguon && !nguon.includes(locNguon)) continue;
    const iKhop = cot.map((c, i) => (COT_BO.has(c) ? -1 : i)).filter((i) => i >= 0);
    const iTen = cot.indexOf('ten');
    const iTam = cot.indexOf('so_tam');
    const iLic = cot.indexOf('license');
    const trung = [];
    for (const d of than) {
      const o = d.split('\t');
      if (!re.some((r) => r.test(tachHoa(iKhop.map((i) => o[i] || '').join(' \t '))))) continue;
      if (tranTam > 0 && iTam >= 0 && Number(o[iTam]) > tranTam) continue;
      const diem = (re.some((r) => r.test(tachHoa(o[iTen] || ''))) ? 2 : 0) + (CC0.test(o[iLic] || '') ? 1 : 0);
      trung.push({ o, diem });
    }
    if (!trung.length) continue;
    trung.sort((a, b) => b.diem - a.diem);
    kq.push({ nguon, cot, trung });
  }
  return kq;
}

/** Ban ke nao la GOI (mot dong = mot goi nhieu file) thay vi muc le. */
export const LA_GOI = new Set(['kenney', 'itch', 'quaternius', '2d-assets']);

/** License rut gon de in: dem CC0 / CC-BY / con lai trong so dong trung. */
export function tomLicense(cot, trung) {
  const iLic = cot.indexOf('license');
  if (iLic < 0) return '';
  let cc0 = 0, by = 0, khac = 0;
  const ten = new Map();
  for (const { o } of trung) {
    const l = o[iLic] || '';
    if (CC0.test(l)) cc0++;
    else if (/by|attribution/i.test(l)) by++;
    else { khac++; ten.set(l.split(' ')[0], (ten.get(l.split(' ')[0]) || 0) + 1); }
  }
  const phan = [];
  if (cc0) phan.push(cc0 === trung.length ? 'CC0' : `CC0 ${cc0}`);
  if (by) phan.push(by === trung.length ? 'CC-BY' : `CC-BY ${by}`);
  if (khac) phan.push([...ten].sort((a, b) => b[1] - a[1]).map(([k, n]) => (n === trung.length ? k : `${k} ${n}`)).join(' '));
  return phan.join(' · ');
}

/**
 * Chi dem tac gia o nguon HINH (model, anh 2D, icon). Freesound/Openverse bo ra: 29/09
 * `farm` xep "Our World In Data" (bieu do) va mot nguoi thu am len dau - khong ai ghep
 * phong cach tu hai thu do.
 */
const NGUON_HINH = /^(icosa|poly-pizza|polyhaven|kenney|itch|quaternius|2d-assets|game-icons|quoc-chien-assets|tayvuc-kho-chung|3dtextures)$/;
/** Cung mot tac gia, hai ban ke ghi hai ten. */
const BI_DANH = { polybygoogle: 'google' };

/**
 * Tac gia nhieu trung nhat, gop moi nguon. CUNG TAC GIA ~ CUNG PHONG CACH: 29/09 ruong
 * trai `quoc-chien` "guong gao" vi ghep model nhieu tac gia; bang nay chi ra bo nao du
 * mon de lay tron mot tay. Bo `?` va ten rong.
 */
export function tacGiaNhieu(kq, soToiDa = 5) {
  const dem = new Map();
  for (const { nguon, cot, trung } of kq) {
    const i = cot.indexOf('tac_gia');
    if (i < 0 || !NGUON_HINH.test(nguon)) continue;
    for (const { o } of trung) {
      const t = (o[i] || '').trim();
      if (!t || t === '?') continue;
      const k0 = t.toLowerCase().replace(/\s+/g, '');
      const k = BI_DANH[k0] || k0;
      const cu = dem.get(k) || { ten: t, so: 0 };
      cu.so++;
      dem.set(k, cu);
    }
  }
  return [...dem.values()].sort((a, b) => b.so - a.so).slice(0, soToiDa);
}
