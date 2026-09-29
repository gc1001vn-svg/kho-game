#!/usr/bin/env node
// Hook PreToolUse: chan `Read` TRON mot file lon (uoc tren ~10.000 token).
// Ban dung chung cho moi du an cua gc1001vn-svg.
//
// Cai vao mot du an: `node /home/user/ghi-nho/cong-cu/cai_dat.mjs <repo>`.
//
// ---------------------------------------------------------------------------
// VI SAO CO FILE NAY
//
// Luat "file uoc tren ~10.000 token thi cam `Read` tron" nam o `so-thich.md` tu
// lau, nhung chi la CHU — khong gi bat. "Buoc nao may kiem duoc thi de may kiem."
// Doc tron mot file lon thi ca file nam lai trong ngu canh, va MOI luot goi sau
// gui lai no (du tu cache, re 1/10, van la khoan lon nhat — do 21/09).
//
// Y tuong lay tu plugin `shunt` cua Spotify (Apache-2.0,
// `spotify/portal-ai-plugins/plugins/shunt/hooks/check-file-size`): hook chan
// `Read` file lon, day sang model re. Shunt can Portal cua Spotify nen khong
// dung duoc — ban nay viet lai tu dau, day sang `hoi_gemini.mjs` da co san.
//
// ---------------------------------------------------------------------------
// CHO QUA KHONG HOI
//   - `Read` co `offset` hoac `limit` — da la doc co dich.
//   - Anh, PDF, notebook — Read xu ly rieng, khong tinh theo byte.
//   - File khong doc duoc (khong ton tai...) — de Read tu bao loi.
//
// KHONG CHAN `cat`: dau phien PHAI `cat` tron ba file kho (luat cung). Chan `cat`
// la chan nham dung luat do. Day la cai NHAC, khong phai cai khoa.
//
// GIA: moi lan chan ton them MOT luot goi. Chi dang khi file du lon — nen san
// dat o 10.000 token chu khong thap (shunt dat 350 dong, qua thap cho kho nay).

import { statSync } from 'node:fs';
import { extname } from 'node:path';
import { bat, thoat } from './hook_chung.mjs';

const ID = 'chan_doc_lon';

// Uoc token = byte/3, mot cong thuc cho ca kho (`hook_chung.mjs` ham `uoc_tok`).
// 10.000 lay tu luat o `so-thich.md` muc "Doc file lon". Doi san thi doi CA luat.
const SAN_TOK = Number(process.env.GC_DOC_LON_TOK) || 10000;

/** Read tu xu ly theo kieu rieng, byte khong phan anh token. */
const BO_QUA_DUOI = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico',
  '.pdf', '.ipynb']);

process.on('uncaughtException', () => process.exit(0));
process.on('unhandledRejection', () => process.exit(0));

if (!bat(ID, ['thuong', 'chat'])) process.exit(0);

let raw = '';
process.stdin.on('error', () => process.exit(0));
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let tho;
  try {
    tho = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  if (tho.tool_name !== 'Read') process.exit(0);
  const vao = tho.tool_input ?? {};
  const duong = typeof vao.file_path === 'string' ? vao.file_path : '';
  if (!duong) process.exit(0);
  if (vao.offset !== undefined || vao.limit !== undefined) process.exit(0);
  if (BO_QUA_DUOI.has(extname(duong).toLowerCase())) process.exit(0);

  let soByte;
  try { soByte = statSync(duong).size; } catch { process.exit(0); }
  const tok = Math.floor(soByte / 3);
  if (tok <= SAN_TOK) process.exit(0);

  thoat(2, {
    loi:
      `${duong}: ${soByte.toLocaleString('vi-VN')} byte, uoc ~${tok.toLocaleString('vi-VN')} token ` +
      `— vuot san ${SAN_TOK.toLocaleString('vi-VN')}. Doc tron thi ca file o lai trong ngu canh, ` +
      'moi luot sau gui lai no.\nChon mot:\n' +
      `  1. Dan bai roi doc dung doan: \`grep -n '^#' ${duong}\` (hoac \`grep -n '<tu khoa>'\`), ` +
      'roi `Read` voi `offset`/`limit`.\n' +
      '  2. Can tra loi mot cau ve ca file (dau vao to, dau ra nho): ' +
      `\`node /home/user/ghi-nho/cong-cu/hoi_gemini.mjs "<cau hoi>" ${duong}\`. ` +
      'Repo private no tu chan; log loi thi dung — dung `grep` lay nguyen van.\n' +
      '  3. Phai doc het (vd sap sua ca file): `Read` tung doan voi `offset`/`limit`.\n' +
      'Muon tat lop nhac nay trong phien thi ghi `chan_doc_lon` vao `.claude/hook_phien.txt`.',
  });
});
