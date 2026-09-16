#!/usr/bin/env node
/**
 * Lay mot nguon asset ve `assets_source/<ten-nguon>/` theo manifest `nguon/<ten>.json`.
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
 * Dung:
 *   node cong-cu/lay.mjs icosa                       # -> ./assets_source/icosa/
 *   node cong-cu/lay.mjs icosa ../quoc-chien/assets_source
 *   node cong-cu/lay.mjs icosa --loc chicken         # chi lay model trung tu khoa
 */
import { execFile } from 'node:child_process';
import {
  existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

const chay_lenh = promisify(execFile);
const SONG_SONG = 4;

const args = process.argv.slice(2);
const ten = args.find((a) => !a.startsWith('--'));
const iLoc = args.indexOf('--loc');
const loc = iLoc >= 0 ? (args[iLoc + 1] || '').toLowerCase() : null;
const dich = args.filter((a) => !a.startsWith('--') && a !== ten && a !== args[iLoc + 1])[0]
  || 'assets_source';
if (!ten) {
  console.error('Dung: node cong-cu/lay.mjs <ten-nguon> [duong-dan-dich] [--loc <tu khoa>]');
  process.exit(1);
}

const goc = join(import.meta.dirname, '..');
const mf = join(goc, 'nguon', `${ten}.json`);
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

const iId = args.indexOf('--id');
let viec;
if (iId >= 0) {
  const ids = args.slice(iId + 1).filter((a) => !a.startsWith('--'));
  const keTheoId = new Map(dongKe.slice(1).map((d) => { const m = tuKe(d); return [m.id, m]; }));
  viec = ids.map((id) => theoId.get(id) || keTheoId.get(id)).filter(Boolean);
  if (viec.length !== ids.length) console.log(`(${ids.length - viec.length} id khong co trong kho)`);
} else if (loc) {
  const mau = new RegExp(`(^|[^a-z0-9])${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
  const trung = dongKe.slice(1).map(tuKe).filter((m) => mau.test(m.ten));
  viec = trung.map((m) => theoId.get(m.id) || m);
} else {
  viec = [...model];
}
if (!viec.length) {
  console.error(`Khong co gi de lay. Do truoc: node cong-cu/do.mjs <tu khoa>`);
  process.exit(1);
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
 * Model chua co trong manifest: hoi API lay danh sach ban, chon ban nhe nhat tai duoc.
 * Thu tu uu tien GLB (mot file, tu chua) roi GLTF2, GLTF1; wayback truoc, backblaze sau.
 */
async function tuApi(m) {
  const j = JSON.parse((await curl([`https://api.icosa.gallery/v1/assets/${m.id}`])).toString());
  for (const host of ['web.archive.org', 's3.us-east-005.backblazeb2.com']) {
    for (const loai of ['GLB', 'GLTF2', 'GLTF1']) {
      for (const f of j.formats || []) {
        if (f.formatType !== loai || !f.root?.url?.includes(host)) continue;
        const moc = await mocThat(f.root.url);
        if (!moc) continue;
        const phu = [];
        for (const r of f.resources || []) {
          const mr = await mocThat(r.url);
          if (mr) phu.push({ file: r.relativePath, url: mr });
        }
        const tep = (f.root.relativePath || decodeURIComponent(f.root.url.split('/').pop()))
          .replace(/[^\w.-]/g, '_');
        return { ...m, file: tep, url: moc, phu };
      }
    }
  }
  throw new Error('khong ban nao con luu');
}

let xong = 0, boQua = 0, hong = 0;
const chay = async () => {
  for (;;) {
    let m = viec.shift();
    if (m === undefined) return;
    const thuMuc = join(dich, ten, m.id);
    try {
      if (!m.url) m = await tuApi(m);
    } catch (loi) {
      hong++;
      console.log(`HONG ${m.ten} (${m.id}): ${String(loi.message).slice(0, 50)}`);
      continue;
    }
    const file = join(thuMuc, m.file);
    if (existsSync(file) && statSync(file).size > 0) { boQua++; continue; }
    mkdirSync(thuMuc, { recursive: true });
    try {
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
        await curl(['-o', pd, p.url]);
        // File phu rong la model hong am tham: `.gltf` van doc duoc, den luc nuong moi
        // gay `Invalid typed array length`. Bat ngay o day.
        if (!existsSync(pd) || statSync(pd).size === 0) {
          rmSync(pd, { force: true });
          rmSync(file, { force: true });
          throw new Error(`file phu rong: ${p.file}`);
        }
      }
      // Ghi cong di theo model, khong nam mot cho de roi mat.
      writeFileSync(
        join(thuMuc, 'ghi_cong.json'),
        JSON.stringify(
          { ten: m.ten, tac_gia: m.tac_gia, license: m.license, so_tam: m.so_tam, trang: m.trang, nguon: ten },
          null,
          1,
        ) + '\n',
      );
      xong++;
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
