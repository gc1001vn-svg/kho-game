#!/usr/bin/env node
/**
 * MOT CUA lay asset ve `./assets_source/` (hay `--dich <thu-muc>`), moi nguon cua kho.
 *
 * Nguon co lenh rieng -> chuyen sang `lay_<nguon>.mjs`, giu nguyen tham so (bang
 * `LENH_RIENG`). Truoc 29/09 Kenney, itch, hoa tiet Poly Haven chi lay duoc bang cong cu
 * nam o `quoc-chien` - repo game khac khong co thi tu viet lai. Icosa xu ly ngay duoi day,
 * theo manifest `nguon/<ten>.json` + muc luc `ke/<ten>.tsv`.
 *
 * VI SAO TAI LAI CHU KHONG CHUA SAN. Releases bi chan o loai phien nay
 * (`Creating, editing, or deleting releases is not permitted for this session type`), ma
 * day nhi phan vao git thi lich su phinh vinh vien - them me sau la cong don, khong xoa
 * duoc. Manifest chi vai tram KB, tai lai thi mat hang chuc phut nhung chi lam khi can.
 *
 * DANH DOI, noi thang: phu thuoc `web.archive.org` con song. No la luu tru phi loi nhuan,
 * khong ai bao dam. Mat nguon thi mat kho - do la cai gia cua repo nhe.
 *
 * BA BAY:
 * 1. `fetch` cua Node khong di CONNECT qua proxy phien -> `403 Blocked by egress policy`.
 *    Phai goi `curl`.
 * 2. Phai `--http1.1`: HTTP/2 qua proxy dut `ws_closed_mid_exchange` sau ~11 giay.
 * 3. Manifest giu MOC THAT nen GET thang duoc. Dung "toi uu" thanh tai URL cua API.
 *
 * GLTF1 BO QUA mac dinh (`--gltf1` de lay): bo doc cua `quoc-chien` chi hieu glTF 2.0 -
 * ban 1.0 de `buffers` la OBJECT, gay `(j.buffers ?? []).map is not a function` (do 16/09).
 *
 * Dung:
 *   node cong-cu/lay.mjs icosa --loc chicken                   # -> ./assets_source/icosa/<id>/
 *   node cong-cu/lay.mjs icosa --loc "gà" --tam 8000 --thu     # tieng Viet; chi in se lay gi
 *   node cong-cu/lay.mjs icosa --id 1YE8U35HXsI 0GKndEIbbMf --dich ../quoc-chien/assets_source
 *   node cong-cu/lay.mjs kenney city-kit-suburban              # xem dau lay_kenney.mjs
 *   node cong-cu/lay.mjs itch quaternius/universal-animation-library
 *   node cong-cu/lay.mjs polyhaven leafy_grass cobblestone_01
 */
import { execFile, spawnSync } from 'node:child_process';
import {
  existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { dich as dichTu, mau as mauTu } from './tim.mjs';

/** Nguon co lenh rieng. Them nguon moi: them file `lay_<nguon>.mjs` va mot dong o day. */
const LENH_RIENG = {
  kenney: 'lay_kenney.mjs',
  itch: 'lay_itch.mjs',
  polyhaven: 'lay_polyhaven.mjs',
  quaternius: 'lay_quaternius.mjs',
  '2d-assets': 'lay_2d_assets.mjs',
  '3dtextures': 'lay_3dtextures.mjs',
  openclipart: 'lay_openclipart.mjs',
  openverse: 'lay_openverse.mjs',
};
const ten = process.argv[2];
if (LENH_RIENG[ten]) {
  const r = spawnSync('node', [join(import.meta.dirname, LENH_RIENG[ten]), ...process.argv.slice(3)], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}

const chay_lenh = promisify(execFile);
const SONG_SONG = 4;

const args = process.argv.slice(3);
const gt = (co) => { const i = args.indexOf(co); return i >= 0 ? args[i + 1] : undefined; };
const loc = gt('--loc') ?? null;
const tranTam = Number(gt('--tam')) || 0;
const thu = args.includes('--thu');
const loaiDuoc = args.includes('--gltf1') ? ['GLB', 'GLTF2', 'GLTF1'] : ['GLB', 'GLTF2'];
const iId = args.indexOf('--id');
const coGiaTri = new Set(['--loc', '--tam', '--dich']);
// Duong dich vi tri chi nhan TRUOC `--id`: ban cu lay nham id dau tien lam thu muc dich
// (`--id A B` -> tai vao `./A/icosa/`).
const viTri = args.slice(0, iId >= 0 ? iId : args.length)
  .filter((a, i) => !a.startsWith('--') && !coGiaTri.has(args[i - 1]));
const dich = gt('--dich') || viTri[0] || 'assets_source';
if (!ten) {
  console.error(`Dung: node cong-cu/lay.mjs <nguon> ...   nguon: icosa, ${Object.keys(LENH_RIENG).join(', ')}`);
  console.error('  icosa: [--loc <tu khoa>] [--id <id...>] [--tam 8000] [--thu] [--dich <thu-muc>] [--gltf1]');
  process.exit(1);
}

const goc = join(import.meta.dirname, '..');
const mf = join(goc, 'nguon', `${ten}.json`);
if (!existsSync(mf) && !existsSync(join(goc, 'ke', `${ten}.tsv`))) {
  console.error(`Nguon "${ten}" khong co. Co: icosa, ${Object.keys(LENH_RIENG).join(', ')}`);
  process.exit(1);
}
const model = existsSync(mf) ? JSON.parse(readFileSync(mf, 'utf8')).model : [];
const theoId = new Map(model.map((m) => [m.id, m]));

// Muc luc `ke/<ten>.tsv` phu CA KHO (73.626 model Icosa), con manifest chi co nhung cai
// da tai. Nen do o muc luc, thay id nao chua co manifest thi hoi API luc tai.
const ke = join(goc, 'ke', `${ten}.tsv`);
const dongKe = existsSync(ke) ? readFileSync(ke, 'utf8').split('\n').filter(Boolean) : [];
const cot = dongKe.length ? dongKe[0].split('\t') : [];
const tuKe = (d) => {
  const o = d.split('\t');
  const lay = (c) => o[cot.indexOf(c)];
  return { id: lay('id'), ten: lay('ten'), tac_gia: lay('tac_gia'), license: lay('license'),
    so_tam: Number(lay('so_tam')) || 0, trang: `https://icosa.gallery/view/${lay('id')}` };
};

let viec;
if (iId >= 0) {
  const ids = [];
  for (const a of args.slice(iId + 1)) { if (a.startsWith('--')) break; ids.push(a); }
  const keTheoId = new Map(dongKe.slice(1).map((d) => { const m = tuKe(d); return [m.id, m]; }));
  viec = ids.map((id) => theoId.get(id) || keTheoId.get(id)).filter(Boolean);
  if (viec.length !== ids.length) console.log(`(${ids.length - viec.length} id khong co trong kho)`);
} else if (loc) {
  // Cung loi do voi `do.mjs`: tieng Viet dich qua tu dien, khop ca ten lan tag.
  const re = dichTu([loc]).tra.map(mauTu);
  const iTag = cot.indexOf('tag');
  const trung = dongKe.slice(1).filter((d) => {
    const o = d.split('\t');
    return re.some((r) => r.test(`${o[cot.indexOf('ten')]} ${iTag >= 0 ? o[iTag] : ''}`));
  }).map(tuKe);
  viec = trung.map((m) => theoId.get(m.id) || m);
} else {
  viec = [...model];
}
if (tranTam > 0) viec = viec.filter((m) => !m.so_tam || m.so_tam <= tranTam);
if (!viec.length) {
  console.error(`Khong co gi de lay. Do truoc: node cong-cu/do.mjs <tu khoa>`);
  process.exit(1);
}
if (thu) {
  console.log(`${viec.length} model SE lay (--thu: chua tai gi) -> ${join(dich, ten)}`);
  for (const m of viec.slice(0, 40)) console.log(`  ${m.id} | ${m.ten} | ${m.tac_gia} | ${m.license} | ${m.so_tam} tam`);
  if (viec.length > 40) console.log(`  ... con ${viec.length - 40}`);
  process.exit(0);
}
const sanUrl = viec.filter((m) => m.url).length;
console.log(`${viec.length} model se lay -> ${join(dich, ten)}`
  + ` (${sanUrl} co san URL trong manifest, ${viec.length - sanUrl} phai hoi API)`);

const doi = (ms) => new Promise((r) => setTimeout(r, ms));

async function curl(argsCurl, lan = 4) {
  for (let i = 0; i < lan; i++) {
    try {
      return (await chay_lenh('curl', ['-s', '--http1.1', '--max-time', '180', ...argsCurl], {
        encoding: 'buffer',
        maxBuffer: 1 << 28,
      })).stdout;
    } catch (loi) {
      if (i === lan - 1) throw loi;
      await doi(2 ** i * 1000);
    }
  }
}

/** Moc gia cua wayback -> moc that. URL backblaze khong chuyen huong nen ve thang. */
async function mocThat(url) {
  const dau = (await curl(['-I', url])).toString();
  const l = (dau.match(/^location: (\S+)/im) || [])[1];
  if (l) return l;
  const ma = (dau.match(/^HTTP\/[\d.]+ (\d{3})/gm) || []).pop() || '';
  return ma.endsWith('200') ? url : null;
}

/**
 * Model chua co trong manifest, hay ban manifest (wayback) tai hong: hoi API lay danh sach
 * ban, chon ban nhe nhat tai duoc. Uu tien GLB (mot file, tu chua) roi GLTF2, GLTF1;
 * BACKBLAZE TRUOC, wayback sau — 28-29/09 `web.archive.org` qua proxy may ao dut
 * `ws_closed_mid_exchange` ca 21/21 lan, backblaze thi tai duoc.
 */
async function tuApi(m) {
  const j = JSON.parse((await curl([`https://api.icosa.gallery/v1/assets/${m.id}`])).toString());
  for (const host of ['s3.us-east-005.backblazeb2.com', 'web.archive.org']) {
    for (const loai of loaiDuoc) {
      for (const f of j.formats || []) {
        if (f.formatType !== loai || !f.root?.url?.includes(host)) continue;
        let moc = null;
        try { moc = await mocThat(f.root.url); } catch { /* host nay dut: thu ban ke tiep */ }
        if (!moc) continue;
        const phu = [];
        for (const r of f.resources || []) {
          // Ban backblaze van khai `resources` tro sang wayback. Wayback dut thi bo qua o day:
          // `layTheoGltf` suy URL tu chinh file `.gltf` (cung thu muc backblaze) va lay thay.
          let mr = null;
          try { mr = await mocThat(r.url); } catch { /* host dut: layTheoGltf lay thay */ }
          if (mr) phu.push({ file: r.relativePath || decodeURIComponent(r.url.split('/').pop()), url: mr });
        }
        const tep = (f.root.relativePath || decodeURIComponent(f.root.url.split('/').pop()))
          .replace(/[^\w.-]/g, '_');
        return { ...m, file: tep, url: moc, phu };
      }
    }
  }
  throw new Error('khong ban nao con luu');
}

/**
 * Keo file `.bin` va anh ma ban `.gltf` tro toi, lay o CUNG THU MUC voi file goc.
 *
 * API KHONG LUON KHAI `resources`, va khai thi hay tro sang wayback (qua proxy may ao dut).
 * Nen doc thang `buffers`/`images` trong `.gltf`. Buoc nay co trong
 * `quoc-chien/tools/tai_icosa.mjs` cu; ban gop sang day 29/09 danh roi no - 30/09 model ve chi
 * co `.gltf` ma van bao lay duoc, den luc nuong moi `ENOENT model.bin`.
 */
async function layTheoGltf(m, file, thuMuc) {
  const j = JSON.parse(readFileSync(file, 'utf8'));
  // glTF 1.0 de `buffers` la OBJECT chu khong phai mang.
  const ds = [...(Array.isArray(j.buffers) ? j.buffers : Object.values(j.buffers || {})),
    ...(Array.isArray(j.images) ? j.images : Object.values(j.images || {}))];
  for (const uri of ds.map((x) => x.uri).filter(Boolean)) {
    // `data:` nam san trong file. URL tuyet doi la tham chieu ngoai (model Tilt Brush tro
    // sang shader o `tiltbrush.com`) - khong phai file phu, bo qua chu dung bao hong.
    if (uri.startsWith('data:') || /^https?:\/\//i.test(uri)) continue;
    const pd = join(thuMuc, decodeURIComponent(uri).replace(/[^\w./-]/g, '_'));
    if (existsSync(pd) && statSync(pd).size > 0) continue;
    mkdirSync(dirname(pd), { recursive: true });
    try {
      const moc = await mocThat(m.url.replace(/[^/]*$/, encodeURI(uri)));
      if (moc) await curl(['-o', pd, moc]);
    } catch { /* host dut: bao hong ngay duoi */ }
    if (!existsSync(pd) || statSync(pd).size === 0) {
      rmSync(pd, { force: true });
      rmSync(file, { force: true });
      throw new Error(`thieu file phu ${uri}`);
    }
  }
}

/**
 * Tai mot model ve `thuMuc` theo `m.url` (+ file phu), kiem la model that, ghi ghi cong.
 * Tra ve 'co_san' neu da co tren dia, 'xong' neu vua tai. Hong thi nem loi.
 */
async function taiVe(m, thuMuc) {
  const file = join(thuMuc, m.file);
  if (existsSync(file) && statSync(file).size > 0) {
    // Ban tai truoc 30/09 co the co `.gltf` ma thieu `.bin`: lay bu roi moi coi la co san.
    if (file.toLowerCase().endsWith('.gltf')) await layTheoGltf(m, file, thuMuc);
    return 'co_san';
  }
  mkdirSync(thuMuc, { recursive: true });
  await curl(['-o', file, m.url]);
  const dau = readFileSync(file).subarray(0, 5).toString();
  if (!(dau.startsWith('glTF') || dau.trimStart().startsWith('{'))) {
    rmSync(file, { force: true });
    throw new Error('khong phai model: ' + dau);
  }
  for (const p of m.phu || []) {
    const pd = join(thuMuc, (p.file || '').replace(/[^\w./-]/g, '_'));
    if (existsSync(pd) && statSync(pd).size > 0) continue;
    mkdirSync(dirname(pd), { recursive: true });
    // Host file phu dut thi khong nem loi o day: `layTheoGltf` lay thay tu thu muc file goc,
    // va bao hong neu van thieu.
    try { await curl(['-o', pd, p.url]); } catch { /* layTheoGltf lay thay */ }
    if (existsSync(pd) && statSync(pd).size === 0) rmSync(pd, { force: true });
  }
  if (file.toLowerCase().endsWith('.gltf')) await layTheoGltf(m, file, thuMuc);
  // Ghi cong di theo model, khong nam mot cho de roi mat.
  writeFileSync(
    join(thuMuc, 'ghi_cong.json'),
    JSON.stringify(
      { ten: m.ten, tac_gia: m.tac_gia, license: m.license, so_tam: m.so_tam, trang: m.trang, nguon: ten },
      null,
      1,
    ) + '\n',
  );
  return 'xong';
}

let xong = 0, boQua = 0, hong = 0;
const chay = async () => {
  for (;;) {
    const m = viec.shift();
    if (m === undefined) return;
    const thuMuc = join(dich, ten, m.id);
    try {
      let kq;
      try {
        kq = await taiVe(m.url ? m : await tuApi(m), thuMuc);
      } catch (loi) {
        // Ban manifest la wayback ma tai hong (28-29/09: hong 21/21 qua proxy may ao)
        // -> hoi API lay ban backblaze, thu lai MOT lan. Khong phai wayback thi bao hong.
        if (!m.url?.includes('web.archive.org')) throw loi;
        kq = await taiVe(await tuApi(m), thuMuc);
      }
      if (kq === 'co_san') boQua++;
      else xong++;
    } catch (loi) {
      hong++;
      // Dong thu muc rong lai - de no nam do thi lan sau tuong da co, va lenh dem
      // model theo so thu muc se dem thua.
      if (existsSync(thuMuc) && !readdirSync(thuMuc).length) rmSync(thuMuc, { recursive: true, force: true });
      console.log(`HONG ${m.ten} (${m.id}): ${String(loi.message).slice(0, 50)}`);
    }
    if ((xong + boQua + hong) % 50 === 0) console.log(`... ${xong + boQua + hong}/${viec.length + xong + boQua + hong}`);
    await doi(0);
  }
};
await Promise.all(Array.from({ length: SONG_SONG }, chay));
console.log(`Lay ${xong} · co san ${boQua} · hong ${hong} -> ${join(dich, ten)}`);
