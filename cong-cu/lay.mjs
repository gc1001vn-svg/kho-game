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
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
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

const mf = join(dirname(new URL(import.meta.url).pathname), '..', 'nguon', `${ten}.json`);
if (!existsSync(mf)) {
  console.error(`Khong thay manifest ${mf}. Co gi trong kho: xem ke/`);
  process.exit(1);
}
const { model } = JSON.parse(readFileSync(mf, 'utf8'));
const viec = loc
  ? model.filter((m) => `${m.ten} ${m.file}`.toLowerCase().includes(loc))
  : [...model];
console.log(`${viec.length}/${model.length} model se lay -> ${join(dich, ten)}`);

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

let xong = 0, boQua = 0, hong = 0;
const chay = async () => {
  for (;;) {
    const m = viec.shift();
    if (m === undefined) return;
    const thuMuc = join(dich, ten, m.id);
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
      console.log(`HONG ${m.ten} (${m.id}): ${String(loi.message).slice(0, 50)}`);
    }
    if ((xong + boQua + hong) % 50 === 0) console.log(`... ${xong + boQua + hong}/${viec.length + xong + boQua + hong}`);
    await doi(0);
  }
};
await Promise.all(Array.from({ length: SONG_SONG }, chay));
console.log(`Lay ${xong} · co san ${boQua} · hong ${hong} -> ${join(dich, ten)}`);
