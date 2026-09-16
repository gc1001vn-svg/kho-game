#!/usr/bin/env node
/**
 * Sinh `nguon/<ten>.json` - manifest tai lai: moi model mot dong gom URL MOC THAT cua
 * wayback (hay URL backblaze), kem ten tac gia va license de ghi cong di theo.
 *
 * VI SAO CAN. Releases bi chan o loai phien nay
 * (`Creating, editing, or deleting releases is not permitted for this session type`),
 * ma day 1 GB nhi phan vao git thi lich su phinh vinh vien. Nen kho giu manifest, may
 * nao can thi `lay.mjs` tai lai tu nguon goc.
 *
 * VI SAO GIU MOC THAT, khong giu URL cua API. URL API la moc gia
 * `20250101010101id_/...`: wayback phai tra 302 sang moc that, cho `cdx.remote` ~16 giay
 * thi tunnel dut. Giai san moc that mot lan o day thi `lay.mjs` GET thang, nhanh gap boi.
 *
 * Dung:
 *   node cong-cu/sinh_manifest.mjs icosa /home/user/quoc-chien/assets_source/icosa
 */
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const chay_lenh = promisify(execFile);
const API = 'https://api.icosa.gallery/v1/assets';
const SONG_SONG = 4;

const [ten, duong] = process.argv.slice(2);
if (!ten || !duong) {
  console.error('Dung: node cong-cu/sinh_manifest.mjs <ten-nguon> <duong-dan-thu-muc>');
  process.exit(1);
}

const doi = (ms) => new Promise((r) => setTimeout(r, ms));

/** `fetch` cua Node khong di CONNECT qua proxy phien -> `403 Blocked by egress policy`. */
async function curl(args, lan = 3) {
  for (let i = 0; i < lan; i++) {
    try {
      const r = await chay_lenh('curl', ['-s', '--http1.1', '--max-time', '90', ...args], {
        encoding: 'utf8',
        maxBuffer: 1 << 26,
      });
      return r.stdout;
    } catch (loi) {
      if (i === lan - 1) throw loi;
      await doi(2 ** i * 1000);
    }
  }
}

/** Moc gia -> moc that. URL backblaze khong chuyen huong nen ve thang qua nhanh 200. */
async function mocThat(url) {
  const dau = await curl(['-I', url]);
  const loc = (dau.match(/^location: (\S+)/im) || [])[1];
  if (loc) return loc;
  const ma = (dau.match(/^HTTP\/[\d.]+ (\d{3})/gm) || []).pop() || '';
  return ma.endsWith('200') ? url : null;
}

// Chay lai duoc: giu nguyen nhung model da giai moc that, chi lam not cho con thieu.
// Lan dau chay het 1.671 model mat ~30 phut, 20 cai truot vi `curl -I` dut - khong co
// cho nay thi vot 20 cai do phai lam lai ca me.
const cuTatCa = existsSync(join('nguon', `${ten}.json`))
  ? JSON.parse(readFileSync(join('nguon', `${ten}.json`), 'utf8')).model
  : [];
// Ban cu giu moc GIA cho file phu -> phai lam lai, khong thi `lay.mjs` keo ve 0 byte.
const conMocGia = (m) => (m.phu || []).some((p) => p.url.includes('20250101010101'));
const cu = cuTatCa.filter((m) => !conMocGia(m));
const daCo = new Set(cu.map((m) => m.id));

const ds = readdirSync(duong).filter((d) => existsSync(join(duong, d, 'ghi_cong.json')));
console.log(`${ds.length} model tren dia, ${daCo.size} da co trong manifest`);

const viec = ds.filter((d) => !daCo.has(d));
const ra = [...cu];
let hong = 0;
const chay = async () => {
  for (;;) {
    const id = viec.shift();
    if (id === undefined) return;
    const gc = JSON.parse(readFileSync(join(duong, id, 'ghi_cong.json'), 'utf8'));
    const file = readdirSync(join(duong, id)).find((x) => /\.(glb|gltf)$/i.test(x));
    try {
      const asset = JSON.parse(await curl([`${API}/${id}`]));
      // Chon dung ban da tai: so ten file, khong doan theo formatType.
      const f = (asset.formats || []).find((x) => {
        const t = (x.root.relativePath || decodeURIComponent(x.root.url.split('/').pop()) || '')
          .replace(/[^\w.-]/g, '_');
        return t === file;
      }) || (asset.formats || []).find((x) => x.formatType === gc.format);
      if (!f) throw new Error('khong khop format');
      const moc = await mocThat(f.root.url);
      if (!moc) throw new Error('khong con ban luu');
      // File phu (.bin, anh) CUNG phai giai moc that. Giu moc gia thi `lay.mjs` tai ve
      // 0 byte va model gay `Invalid typed array length` - do that, khong phai gia dinh.
      const phu = [];
      for (const r of f.resources || []) {
        const m = await mocThat(r.url);
        if (m) phu.push({ file: r.relativePath, url: m });
      }
      ra.push({
        id,
        ten: gc.ten,
        tac_gia: gc.tac_gia,
        license: gc.license,
        so_tam: gc.so_tam,
        file,
        url: moc,
        phu,
        trang: gc.trang,
      });
    } catch (loi) {
      hong++;
      console.log(`HONG ${id}: ${String(loi.message).slice(0, 50)}`);
    }
    if ((ra.length + hong) % 50 === 0) console.log(`... ${ra.length + hong}/${ds.length}`);
    await doi(0);
  }
};
await Promise.all(Array.from({ length: SONG_SONG }, chay));

mkdirSync('nguon', { recursive: true });
ra.sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(
  join('nguon', `${ten}.json`),
  JSON.stringify({ nguon: ten, tao_ngay: new Date().toISOString().slice(0, 10), model: ra }, null, 1) + '\n',
);
console.log(`Manifest: ${ra.length} model, ${hong} hong -> nguon/${ten}.json`);
