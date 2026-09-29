#!/usr/bin/env node
// Hook SessionStart: in gon trang thai dau phien. KHONG chay gi nang.
//
// Vi sao: bay buoc dau phien (`so-thich.md`) la chu, tro ly phai TU NHO lam.
// Do 13/09: 4 trong 7 buoc chi ton tai duoi dang chu. Buoc nao MAY kiem duoc
// thi de may kiem — con lai moi phai nho.
//
// Bon thu file nay tu kiem: nhanh git · thu vien da cai chua · skillOverrides
// co khop khong · lenh do cua repo la gi.
//
// TRAN: output phai duoi ~10 dong. No vao ngu canh MOI phien, dai la phan tac
// dung — chinh cai dang di chong.

import { existsSync, readFileSync } from 'node:fs';
import { execSync, spawn } from 'node:child_process';
import { resolve } from 'node:path';
import {
  bat, thoat, cat_tran, skill_chua_khoa, la_repo_game, KHO_GAME, KHO_GAME_URL,
} from './hook_chung.mjs';

const ID = 'phien:dau-phien';

// Hook nay chi BAO CAO. No hong thi phien van phai chay binh thuong — khong co
// luoi nay thi mot loi khong ai ngo do ra ca vet stack vao ngu canh moi phien.
process.on('uncaughtException', () => process.exit(0));
process.on('unhandledRejection', () => process.exit(0));

// Muc `nhe` bo khoi nay: no la thu DUY NHAT o day chen chu vao ngu canh moi
// phien. Can mot phien that re thi ha muc, khong phai go hook ra khoi settings.
if (!bat(ID, ['thuong', 'chat'])) process.exit(0);

const chay = (c) => { try { return execSync(c, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim(); } catch { return ''; } };
const d = [];

// --- git: nhanh, so voi remote, con gi chua commit ---------------------------
const nhanh = chay('git rev-parse --abbrev-ref HEAD');
if (nhanh) {
  const ban = chay('git status --porcelain').split('\n').filter(Boolean).length;
  const lech = chay(`git rev-list --count origin/${nhanh}..${nhanh} 2>/dev/null`) || '0';
  const phan = [`nhanh ${nhanh}`];
  if (ban) phan.push(`${ban} file chua commit`);
  if (lech !== '0') phan.push(`${lech} commit chua day`);
  d.push(`git: ${phan.join(' · ')}`);
}

// --- thu vien da cai chua ----------------------------------------------------
if (existsSync('package.json') && !existsSync('node_modules')) d.push('CHUA `npm ci` — chay truoc khi lam gi');
if (existsSync('requirements.txt')) {
  const co = chay('python3 -c "import fastapi" 2>&1');
  if (co) d.push('CHUA cai thu vien python — `pip install -r requirements.txt`');
}

// --- skillOverrides ----------------------------------------------------------
// Khoa cu KHONG tu phu skill moi. Anthropic them mot skill dung san, hoac chu du
// an tai len skill moi, la no lot vao ngu canh moi phien ma khong ai bao.
// Doan duoi bat duoc phan skill DONG BO (co file tren dia). Skill dung san thi
// khong co file — phan do van phai do A/B, xem `so-thich.md`.
const pSet = '.claude/settings.json';
if (existsSync(pSet)) {
  try {
    const khoa = JSON.parse(readFileSync(pSet, 'utf8')).skillOverrides || {};
    const n = Object.keys(khoa).length;
    if (n === 0) {
      d.push('skillOverrides TRONG — moi phien phi ~12.500 ky tu. Chay cong-cu/cai_dat.mjs');
    } else {
      // Ham dung chung voi `check_hook` (lenh do): hook nay co the chay truoc khi skill
      // tai ve may va sot, lenh do chay sau bat lai. Sua o BAN MAU kho — `cai_dat.mjs`
      // ghi de `skillOverrides` cua repo moi dau phien, sua thang settings.json la mat.
      const sot = skill_chua_khoa();
      if (sot.length) d.push(`skill CHUA co khoa: ${sot.join(' ')} — them vao /home/user/ghi-nho/cong-cu/skill_overrides.json roi chay cai_dat.mjs; co y bat thi ghi .claude/skill_bat.txt`);
    }
  } catch { d.push(`${pSet} hong dinh dang`); }
} else if (existsSync('.git')) {
  d.push('CHUA co .claude/settings.json — chay `node /home/user/ghi-nho/cong-cu/cai_dat.mjs`');
}

// --- phien truoc co ghi nhat ky khong ----------------------------------------
// Lo hong duy nhat con lai (do 13/09): may KHONG cuong che duoc ba viec cuoi
// phien — ghi nhat ky, ghi de tien do, cap nhat trang-thai. Hook `chan_bao_xong`
// chi doi dong "So do:", khong kiem da ghi chua. Mot phien lam xong roi quen ghi
// thi phien sau KHONG BIET chuyen do tung xay ra — dung cai chu du an lam kho
// ghi nho de chong.
//
// Khong chan giua phien (lam code truoc, ghi nhat ky sau la binh thuong). Bat o
// DAU phien sau: commit code moi hon commit tai lieu thi phien truoc da quen.
if (nhanh && existsSync('docs/NHAT_KY')) {
  const ngay = (c) => chay(c).slice(0, 10);
  const code = ngay(`git log -1 --format=%cd --date=short -- . ':(exclude)docs' ':(exclude).claude' 2>/dev/null`);
  const tl = ngay(`git log -1 --format=%cd --date=short -- docs/NHAT_KY docs/TIEN_DO.md 2>/dev/null`);
  if (code && tl && code > tl) {
    d.push(`phien truoc sua code ${code} ma nhat ky/tien do dung o ${tl} — doc git log roi ghi bu`);
  }
}

// --- kho-game: repo game thi kho phai CO SAN, khong doi ai nho -----------------
// 28/09 `quoc-chien` chua clone kho-game, lenh do chi in dong nhac, phien bo qua roi ket
// luan sai "khong co ga". Nay clone NEN ngay dau phien (khong doi, hook van xong ngay);
// co roi thi keo ban moi, cung nen. Chinh repo kho-game thi khong dung vao.
if (la_repo_game() && resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd()) !== resolve(KHO_GAME)) {
  const co = existsSync(`${KHO_GAME}/cong-cu/do.mjs`);
  const lenh = co ? ['-C', KHO_GAME, 'pull', '-q', '--ff-only'] : ['clone', '-q', '--depth', '1', KHO_GAME_URL, KHO_GAME];
  try { spawn('git', lenh, { detached: true, stdio: 'ignore' }).unref(); } catch { /* git hong: dong duoi van nhac */ }
  d.push(`kho-game: ${co ? 'co san' : 'dang clone nen (~1 phut)'} — do asset TRUOC khi tu ve/tu viet: node ${KHO_GAME}/cong-cu/do.mjs <tu khoa>`);
}

// --- lenh do cua repo --------------------------------------------------------
let lenhDo = '';
if (existsSync('package.json')) {
  try { if (JSON.parse(readFileSync('package.json', 'utf8')).scripts?.do) lenhDo = 'npm run do'; } catch { /* bo qua */ }
}
if (!lenhDo && existsSync('scripts/do.sh')) lenhDo = 'bash scripts/do.sh';
d.push(lenhDo ? `lenh do: ${lenhDo}` : 'repo CHUA co lenh do — dung mot cai truoc khi lam viec moi');

// --- gia cua chinh khoi nay --------------------------------------------------
// Luat kho: so lieu phai SINH TU LENH, dung go tay vao tai lieu. Khoi nay vao
// ngu canh moi phien ma truoc gio khong ai biet no ton bao nhieu — tran "duoi
// ~10 dong" la uoc bang mat. In ra thi lan sau cat hay giu deu co so ma cai.
// Uoc bang `uoc_tok` (byte/3) — cung cong thuc voi moi thuoc trong kho.
const tho = `[dau phien] ${d.join('\n[dau phien] ')}`;
const { van, tok, cat } = cat_tran(tho);
thoat(0, { ra: `${van}\n[dau phien] khoi nay: ${d.length} dong · ~${tok} tok${cat ? ' (DA CAT)' : ''}\n` });
