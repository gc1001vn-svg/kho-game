#!/usr/bin/env node
/**
 * Lay goi mien phi tu itch.io ve `<dich>/<goi>/` (mac dinh `./assets_source/<goi>/`).
 *
 * VI SAO O DAY. Truoc 29/09 nam o `quoc-chien/tools/tai_itch.mjs`, `cach_lay` cua
 * `ke/itch.tsv` ghi "(o repo quoc-chien)". Nay kho-game tu du; `quoc-chien` goi sang.
 * Quaternius cung tai qua duong nay: nut Download o quaternius.com mo trang itch.
 *
 * VI SAO PHUC TAP HON KENNEY: itch khong de duong dan file trong HTML. Nut Download chay
 * bon buoc, moi buoc doi ma chong gia mao (`csrf_token`) va cookie phien:
 *
 *   1. GET trang goi                    -> cookie `itchio_token`, ma csrf la chinh no
 *   2. POST <trang>/download_url        -> tra ve duong trang tai co khoa
 *   3. GET trang tai                    -> danh sach file, moi file mot `data-upload_id`
 *   4. POST <trang>/file/<upload_id>    -> duong dan that (co ky, het han sau vai phut)
 *
 * Buoc 4 phai goi vao duong KHONG co khoa; goi vao duong co khoa thi itch tra 404.
 * Cookie phai giu suot bon buoc. `fetch` cua Node di duoc itch.io (do 29/09: 200) - chi
 * `web.archive.org` moi can `curl`.
 *
 * LICENSE: trang phai noi CC0, khong thi DUNG - itch de tac gia tu khai, khong ai kiem;
 * mo `LICENSE` trong goi doi chieu truoc khi dung.
 *
 * Dung:
 *   node cong-cu/lay.mjs itch kaylousberg/kaykit-medieval-builder-pack
 *   node cong-cu/lay.mjs itch quaternius/universal-animation-library --dich ../game/assets_source
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const iDich = args.indexOf('--dich');
const DICH = iDich >= 0 ? args[iDich + 1] : 'assets_source';
const duAn = args.filter((a, i) => !a.startsWith('--') && i !== iDich + 1);
if (!duAn.length) {
  console.error('Dung: node cong-cu/lay.mjs itch <tac-gia>/<goi>... [--dich <thu-muc>]   (cot `goi` cua ke/itch.tsv)');
  process.exit(1);
}

/** Gom cookie tu header `set-cookie` cua moi luot goi. */
class Hu {
  constructor() { this.banh = new Map(); }
  nhan(res) {
    for (const d of res.headers.getSetCookie?.() ?? []) {
      const [c] = d.split(';');
      const k = c.indexOf('=');
      if (k > 0) this.banh.set(c.slice(0, k).trim(), c.slice(k + 1));
    }
  }
  get chuoi() { return [...this.banh].map(([k, v]) => `${k}=${v}`).join('; '); }
}

/** Itch chan toc do (429) khi goi lien tiep nhieu goi. Nghi roi thu lai, moi lan lau hon. */
async function goi(hu, duong, tuyChon = {}, conThu = 4) {
  const res = await fetch(duong, {
    ...tuyChon,
    redirect: 'follow',
    headers: { cookie: hu.chuoi, 'x-requested-with': 'XMLHttpRequest', ...(tuyChon.headers ?? {}) },
  });
  if (res.status === 429 && conThu > 0) {
    const cho = (5 - conThu) * 5 + 5;
    console.log(`itch chan toc do (429), nghi ${cho}s roi thu lai...`);
    await new Promise((xong) => setTimeout(xong, cho * 1000));
    return goi(hu, duong, tuyChon, conThu - 1);
  }
  hu.nhan(res);
  return res;
}

async function tai(maDuAn) {
  const [tacGia, ten] = maDuAn.split('/');
  const goc = `https://${tacGia}.itch.io/${ten}`;
  const dich = join(DICH, ten);
  if (existsSync(dich)) { console.log(`${ten}: da co ${dich}, bo qua.`); return; }

  const hu = new Hu();
  const trang = await goi(hu, goc);
  if (!trang.ok) throw new Error(`khong mo duoc ${goc}: HTTP ${trang.status}`);
  const html = await trang.text();
  if (!/CC0|Creative Commons Zero|public domain/i.test(html)) {
    throw new Error('trang khong noi CC0. Kiem license bang mat truoc khi tai.');
  }
  const csrf = decodeURIComponent(hu.banh.get('itchio_token') ?? '');
  if (csrf === '') throw new Error('itch khong dat cookie itchio_token');

  const traLoi = await goi(hu, `${goc}/download_url`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ csrf_token: csrf }),
  });
  const { url: trangTai } = await traLoi.json();
  if (typeof trangTai !== 'string') throw new Error('khong xin duoc trang tai (goi tra tien?)');

  const dsHtml = await (await goi(hu, trangTai)).text();
  const id = [...dsHtml.matchAll(/data-upload_id="(\d+)"/g)].map((m) => m[1]);
  const tenFile = [...dsHtml.matchAll(/title="([^"]+\.zip)"/g)].map((m) => m[1]);
  if (id.length === 0) throw new Error('khong thay file nao trong trang tai');

  mkdirSync(dich, { recursive: true });
  for (let i = 0; i < id.length; i += 1) {
    // Duong nay KHONG mang khoa; mang khoa vao la itch tra ve trang 404.
    const xin = await goi(hu, `${goc}/file/${id[i]}?source=game_download`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `csrf_token=${encodeURIComponent(csrf)}`,
    });
    const { url: duongThat } = await xin.json();
    if (typeof duongThat !== 'string') throw new Error(`khong xin duoc duong file ${id[i]}`);
    const byte = Buffer.from(await (await fetch(duongThat)).arrayBuffer());
    const zip = join(DICH, `${ten}-${i}.zip`);
    writeFileSync(zip, byte);
    console.log(`${ten}: ${tenFile[i] ?? id[i]} - ${(byte.length / 1e6).toFixed(1)} MB`);
    // Goi khong phai zip (file .glb le, .png le): giu nguyen file, khong giai nen.
    try {
      execFileSync('unzip', ['-o', '-q', zip, '-d', dich], { stdio: 'ignore' });
      rmSync(zip);
    } catch {
      execFileSync('mv', [zip, join(dich, tenFile[i] ?? `${id[i]}.bin`)]);
    }
  }
  writeFileSync(join(dich, 'ghi_cong.json'), `${JSON.stringify(
    { ten, tac_gia: tacGia, license: 'CC0 (trang itch tu khai - doi chieu LICENSE trong goi)', trang: goc, nguon: 'itch' },
    null, 1)}\n`);
  console.log(`${ten}: xong -> ${dich}`);
}

let hong = 0;
for (const d of duAn) {
  try { await tai(d); } catch (e) { hong++; console.log(`HONG ${d}: ${String(e.message).slice(0, 90)}`); }
}
process.exit(hong ? 1 : 0);
