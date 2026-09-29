#!/usr/bin/env node
// Hook PreToolUse: chan lenh Bash co vong lap KHONG CO TRAN.
// Ban dung chung cho moi du an cua gc1001vn-svg.
//
// Cai vao mot du an: `node /home/user/ghi-nho/cong-cu/cai_dat.mjs <repo>`.
//
// ---------------------------------------------------------------------------
// VI SAO CO FILE NAY
//
// 21/09/2026: mot vong `until ... curl ... sleep 15 ... done` cho CI xong. URL
// dung SHA NGAN, GitHub tra mang rong chu khong bao loi, nen dieu kien thoat
// khong bao gio dung. Treo 40 phut, ~160 `curl` thua, va chi phat hien khi chu
// du an gui anh man hinh "Running 40m 01s". Chu du an noi lan nay la TAI DIEN.
//
// Bai hoc KHONG phai "nho dung SHA du 40 ky tu" — no la mot truong hop. Cai
// hong that: mot vong lap doi dieu kien ngoai (mang, API, file) ma khong co
// tran thi bat ky thay doi nao ben ngoai cung lam no treo mai. Ghi mot dong vao
// tai lieu da thu roi, va no van tai dien. Nen chan bang may.
//
// LUAT: vong lap phai co MOT trong hai thu —
//   1. `timeout <giay>` boc ngoai, hoac
//   2. so vong dem duoc (`for i in $(seq 1 N)`, `for i in {1..N}`).
// Khong co thi chan, va bao ra hai cach thay the re hon.
//
// KHONG CHAN DUOC GI: shell co nhieu cach viet vong lap ma doc chuoi khong bat
// het (`xargs`, script roi, `watch`, de quy). Day la cai NHAC bat duoc dung cai
// khuon da lam hong that, khong phai cai khoa.

import { bat, thoat } from './hook_chung.mjs';

const ID = 'chan_vong_vo_han';

/** Vong lap khong co dieu kien thoat tu than no. */
const VONG_HO = [
  /\bwhile\s+true\b/,
  /\bwhile\s+:\s*;/,
  /\buntil\s+/,
  /\bwhile\s+\[/,
  /\bwhile\s+\[\[/,
];

/** Co tran thi cho qua. */
const CO_TRAN = [
  /\btimeout\s+\d+/,           // timeout 600 bash -c '...'
  /\bfor\s+\w+\s+in\s+\$\(seq/, // for i in $(seq 1 55)
  /\bfor\s+\w+\s+in\s+\{\d+\.\.\d+\}/, // for i in {1..55}
];

/** Chi doi khi vong lap CHO thu gi do — ngu, goi mang, doc file. */
const CO_CHO = [/\bsleep\b/, /\bcurl\b/, /\bwget\b/, /\bgit\s+(fetch|ls-remote)\b/];

/**
 * Bo than heredoc truoc khi do. Than heredoc la DU LIEU, khong phai lenh:
 * `git commit -F - <<'EOF' ... EOF` mang ca doan van ta cai vong lap hong, va
 * ban dau file nay chan dung cai commit tao ra chinh no (21/09). Chan nham la
 * cach nhanh nhat de mot lop bao ve bi tat han.
 */
function boHeredoc(lenh) {
  const dong = lenh.split('\n');
  const giu = [];
  let ket = null;
  for (const d of dong) {
    if (ket !== null) {
      if (d.trim() === ket) ket = null;
      continue;
    }
    const khop = /<<-?\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_][\w]*))/.exec(d);
    giu.push(d);
    if (khop) ket = khop[1] ?? khop[2] ?? khop[3];
  }
  return giu.join('\n');
}

process.on('uncaughtException', () => process.exit(0));
process.on('unhandledRejection', () => process.exit(0));

if (!bat(ID, ['nhe', 'thuong', 'chat'])) process.exit(0);

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

  if (tho.tool_name !== 'Bash') process.exit(0);
  const tho_lenh = typeof tho.tool_input?.command === 'string' ? tho.tool_input.command : '';
  if (!tho_lenh) process.exit(0);
  const lenh = boHeredoc(tho_lenh);

  const coVong = VONG_HO.some((r) => r.test(lenh));
  if (!coVong) process.exit(0);
  if (!CO_CHO.some((r) => r.test(lenh))) process.exit(0);
  if (CO_TRAN.some((r) => r.test(lenh))) process.exit(0);

  thoat(2, {
    loi:
      'Vong lap nay khong co tran: dieu kien thoat doi thu ben ngoai (mang, API, file) ma ' +
      'khong co gi bat no dung. Dieu kien sai mot chut la treo mai — 21/09 mot vong ' +
      '`until ... curl ... sleep` treo 40 phut vi URL dung SHA ngan, API tra mang rong.\n' +
      'Chon mot trong ba:\n' +
      '  1. Hoi thang mot lan, khong vong lap. Trang thai CI doc bang ' +
      '`mcp__github__actions_list` voi `workflow_runs_filter`; muon cho thi hoi lai o luot sau.\n' +
      '  2. Dat tran so vong: `for i in $(seq 1 40); do <kiem> && break; sleep 15; done`.\n' +
      '  3. Boc `timeout`: `timeout 600 bash -c \'until <kiem>; do sleep 15; done\'`.\n' +
      'Muon tat lop nhac nay thi ghi `chan_vong_vo_han` vao `.claude/hook_phien.txt` — ' +
      'co ghi la co dau vet.',
  });
});
