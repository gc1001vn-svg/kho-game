#!/usr/bin/env node
// Phan CHUNG cua moi hook: co bat/tat · thoat khong mat chu · tran ngu canh.
// Ban dung chung cho moi du an cua gc1001vn-svg. `cai_dat.mjs` chep vao scripts/.
//
// Y tuong lay tu affaan-m/ecc (MIT) — `scripts/lib/hook-flags.js` va cach thoat
// trong `scripts/hooks/run-with-flags.js` (#2222). Code viet lai tu dau, khong
// them thu vien nao.
//
// ---------------------------------------------------------------------------
// 1. CO BAT/TAT — ba tang, tang HEP thang tang RONG
//
//   moi du an  mac dinh trong file nay: muc "thuong", khong tat gi
//   mot du an  .claude/hook.json      (LEN git)   { "muc": "...", "tat": [...] }
//   mot phien  .claude/hook_phien.txt (gitignore) chet cung may ao
//
// VI SAO FILE, KHONG PHAI BIEN MOI TRUONG (do 18/09/2026):
//   `export X=1` trong mot lenh Bash KHONG song sang lenh Bash ke tiep — do
//   that: lenh 1 `export THU_BIEN=co_roi`, lenh 2 doc lai duoc chuoi rong. Hook
//   lai do chinh Claude Code spawn, khong phai shell, nen cang khong thay.
//   => GIUA PHIEN chi co FILE bat/tat duoc hook.
//   Bien moi truong van doc (GC_HOOK_MUC · GC_HOOK_TAT · GC_HOOK_THU) nhung chi
//   dat duoc o `.claude/settings.json` muc "env" — tuc la tang DU AN, va phai
//   mo lai phien moi an. Dung no cho mac dinh lau dai, dung cho viec tam.
//
// ---------------------------------------------------------------------------
// 2. THOAT KHONG MAT CHU
//
// `process.stdout.write(s); process.exit(0)` cat mat phan duoi khi `s` lon.
// Do 18/09 tren may ao nay (Node v22.22.2, stdout la pipe):
//
//   gui 146.176 byte -> nhan du
//   gui 147.456 byte -> nhan 146.176, MAT 1.280
//   gui   1 MB       -> nhan 146.176, MAT 902.400
//
// stderr y het. Tran dung 146.176 byte, khong phu thuoc ben doc nhanh hay cham.
// Harness doc phai JSON cut giua chung thi coi ca hook la HONG -> chan luon tool
// call. Hook lon nhat hien gio moi 973 byte (0,7% tran) nen day la BAO HIEM,
// chua phai loi dang chay. Chep tu ECC de khoi phai gap lai.
//
// ---------------------------------------------------------------------------
// Fail-open tuyet doi: moi duong loi trong file nay deu tra ve "cho chay tiep".

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

/** Muc hop le, tu long den chat. */
export const MUC_HOP_LE = ['nhe', 'thuong', 'chat'];

/** Tran byte cua mot lan ghi + `process.exit()`. Do that 18/09, xem dau file. */
export const TRAN_GHI = 146176;

/**
 * Tran KY TU cho phan hook chen vao ngu canh.
 *
 * Khac `TRAN_GHI`: cai kia la gioi han KY THUAT (mat chu), cai nay la gioi han
 * TIEN (ngu canh vao moi phien / moi luot). ECC dat 8.000; o day 4.000 vi kho
 * ghi-nho da co san va hook chi la cai nhac. Hook nao vuot thi bi cat, kem dau.
 */
export const TRAN_NGU_CANH = 4000;

/**
 * Thu muc repo cua hook = cha cua `scripts/` noi file nay nam (cai_dat chep vao `<repo>/scripts/`).
 *
 * VI SAO KHONG DUNG `CLAUDE_PROJECT_DIR`: phien cloud co HAI repo (luat dau phien `add_repo` kho
 * ghi-nho) chay o thu muc CHA cac ban clone, nen bien do la `/home/user` — hook tim `.claude/...`
 * o do, khong thay gi, im lang cho qua. Do 04/10: so lenh ngung ghi tu luot 2, sua `AGENTS.md`
 * (file khoa) lot qua ma 0. Bien la thu muc CHA cua repo chua script thi lay repo chua script;
 * con lai giu bien (phien mot repo; test tro bien vao mot repo gia o thu muc tam).
 */
export const goc = () => {
  const bien = resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
  const theoScript = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  return theoScript.startsWith(bien + sep) ? theoScript : bien;
};

function doc_json(duong) {
  try { return JSON.parse(readFileSync(duong, 'utf8')); } catch { return null; }
}

/**
 * Doc `.claude/hook_phien.txt`. Moi dong mot lenh, `#` la ghi chu:
 *
 *   muc=nhe        doi muc cho ca phien
 *   THU            chay thu — hook bao "toi se chay" roi cho qua, khong lam gi
 *   dung:chan-bao-xong    tat rieng hook do
 *   +cau:nhac-kho         bat lai hook do du muc dang tat no
 */
function doc_phien(root) {
  const ra = { muc: '', tat: new Set(), bat: new Set(), thu: false };
  let van;
  try { van = readFileSync(join(root, '.claude/hook_phien.txt'), 'utf8'); } catch { return ra; }
  for (const tho of van.split('\n')) {
    const d = tho.split('#')[0].trim();
    if (!d) continue;
    if (d.toUpperCase() === 'THU') { ra.thu = true; continue; }
    const m = /^muc\s*=\s*(\w+)$/i.exec(d);
    if (m) { ra.muc = m[1].toLowerCase(); continue; }
    if (d.startsWith('+')) ra.bat.add(d.slice(1).trim());
    else ra.tat.add(d.replace(/^-/, '').trim());
  }
  return ra;
}

/** Doc `.claude/hook.json` cua du an. */
function doc_du_an(root) {
  const o = doc_json(join(root, '.claude/hook.json'));
  return {
    muc: typeof o?.muc === 'string' ? o.muc.toLowerCase() : '',
    tat: new Set(Array.isArray(o?.tat) ? o.tat.map(String) : []),
  };
}

function tach_csv(s) {
  return new Set(String(s || '').split(',').map((x) => x.trim()).filter(Boolean));
}

/**
 * Tra ve trang thai day du — dung cho `check_hook.mjs` va cho ban than `bat()`.
 * Tach rieng de kiem tra duoc ma khong phai spawn hook that.
 */
export function trang_thai(id, mucCho, moi_truong = process.env, root = goc()) {
  const phien = doc_phien(root);
  const duAn = doc_du_an(root);

  const mucRaw = phien.muc || moi_truong.GC_HOOK_MUC || duAn.muc || 'thuong';
  const muc = MUC_HOP_LE.includes(mucRaw) ? mucRaw : 'thuong';

  const cho = (Array.isArray(mucCho) && mucCho.length ? mucCho : ['thuong', 'chat'])
    .map((x) => String(x).toLowerCase());

  const thu = phien.thu || moi_truong.GC_HOOK_THU === '1';
  const tatCsv = tach_csv(moi_truong.GC_HOOK_TAT);

  let batTat = cho.includes(muc);
  let vi = batTat ? `muc ${muc}` : `muc ${muc} khong goi hook nay (chi ${cho.join(',')})`;
  if (duAn.tat.has(id)) { batTat = false; vi = '.claude/hook.json tat'; }
  if (tatCsv.has(id)) { batTat = false; vi = 'GC_HOOK_TAT tat'; }
  if (phien.tat.has(id)) { batTat = false; vi = '.claude/hook_phien.txt tat'; }
  // `+id` o tang phien la tang HEP nhat — thang tat ca.
  if (phien.bat.has(id)) { batTat = true; vi = '.claude/hook_phien.txt bat lai'; }

  return { bat: batTat, muc, thu, vi };
}

/**
 * Hook nay co duoc chay khong.
 *
 * @param {string}   id      dinh danh, vd "dung:chan-bao-xong"
 * @param {string[]} mucCho  cac muc hook nay chay. Mac dinh ['thuong','chat'].
 *
 * Chay thu (THU) tra ve `false` va in mot dong vao stderr — dung de xem hook
 * SE lam gi ma khong phai chiu hau qua. Do 12/09: mot phien 13 lan chan thi 4
 * lan chan NHAM; muon go cai do thi phai nhin duoc truoc khi no chan.
 */
export function bat(id, mucCho) {
  let t;
  try { t = trang_thai(id, mucCho); } catch { return true; } // hong -> cu chay nhu cu
  if (t.thu && t.bat) {
    try { process.stderr.write(`[hook thu] ${id} SE chay (${t.vi}) — dang chay thu nen cho qua\n`); } catch { /* im */ }
    return false;
  }
  return t.bat;
}

/**
 * Thoat sau khi chu da ra het. Thay cho `process.exit()` o moi hook.
 *
 * @param {number} ma   0 cho qua · 2 chan. Ma khac harness coi la HOOK HONG.
 * @param {{ra?: string, loi?: string}} chu  stdout / stderr
 */
export function thoat(ma, chu = {}) {
  const ra = typeof chu.ra === 'string' ? chu.ra : '';
  const loi = typeof chu.loi === 'string' ? chu.loi : '';
  process.exitCode = ma;

  let cho = 1;
  const xong = () => { if (--cho === 0) process.exit(ma); };

  try {
    if (loi) { cho++; process.stderr.write(loi.endsWith('\n') ? loi : `${loi}\n`, xong); }
    if (ra) { cho++; process.stdout.write(ra, xong); }
  } catch { process.exit(ma); }

  // Luoi cuoi: ong dut (EPIPE) thi callback co the khong bao gio goi. `unref`
  // nen khi ghi xong binh thuong, tien trinh van thoat ngay, khong doi 2 giay.
  try { setTimeout(() => process.exit(ma), 2000).unref(); } catch { /* im */ }

  xong();
}

/**
 * Cat chuoi ngu canh cho vua tran, kem dau de biet la da bi cat.
 * Tra ve `{ van, tok, cat }` — `tok` uoc bang `uoc_tok` (byte/3).
 */
export function cat_tran(van, tran = TRAN_NGU_CANH) {
  const s = String(van ?? '');
  if (s.length <= tran) return { van: s, tok: uoc_tok(s), cat: false };
  const dau = `\n[cat bot — vuot tran ${tran} ky tu. Sua TRAN_NGU_CANH trong scripts/hook_chung.mjs neu that su can]`;
  const v = s.slice(0, Math.max(0, tran - dau.length)) + dau;
  return { van: v, tok: uoc_tok(v), cat: true };
}

/**
 * Uoc token: BYTE chia 3. Mot cong thuc duy nhat cho ca kho.
 *
 * Do 18/09, moc neo la repomix (bo tach tu that) tren 84 file `src`+`tests` cua
 * `quoc-chien`: that 134.317 token · `byte/3` ra 132.023 (**-1,7%**) ·
 * `ky tu/4` ra 98.721 (**-26,5%**). Thuc do 2,95 byte/token.
 *
 * Truoc 18/09 hai hook nay dung `ky tu/4` con cac thuoc (`check_token.mjs`,
 * `do_token.sh`, `check_kho.mjs`) dung `byte/3` — hai so canh nhau lech 60%+ ma
 * khong ai doi chieu duoc. Gio ca kho mot cong thuc.
 *
 * Van la UOC: moc neo do tren MA (ty le byte/ky tu 1,00). Van xuoi tieng Viet co
 * dau ty le 1,20-1,25, chua co moc neo that — dung tin so tuyet doi qua 10%.
 */
export function uoc_tok(s) {
  return Math.floor(Buffer.byteLength(String(s ?? ''), 'utf8') / 3);
}

/**
 * Skill nap moi phien ma CHUA co khoa trong `skillOverrides`, cung khong nam trong
 * `.claude/skill_bat.txt` (danh sach CO Y bat). Tra ve ten thu muc skill, da xep.
 *
 * Dung chung cho `dau_phien` (dau phien) va `check_hook` (lenh do). Vi sao hai cho: hook
 * dau phien co the chay TRUOC khi skill tai ve may — do 29/09 no im, chay lai sau vai phut
 * moi bao `google-workspace`. Lenh do chay sau nen bat chac.
 *
 * `skillOverrides` khop theo TEN THU MUC, khong theo `name:` trong frontmatter. Quet ca
 * `~/.claude/skills/<ten>/` lan `~/.claude/skills/synced/<bucket>/<ten>/`.
 */
export function skill_chua_khoa(root = goc(), thu_muc_skill = join(homedir(), '.claude/skills')) {
  const set = doc_json(join(root, '.claude/settings.json'));
  if (!set) return [];
  const khoa = set.skillOverrides ?? {};
  const bat_co_y = skill_bat(root);
  return [...ten_skill(thu_muc_skill)].filter((t) => !(t in khoa) && !bat_co_y.includes(t)).sort();
}

/**
 * Ten THU MUC moi skill co file tren dia (`~/.claude/skills/<ten>/` va `.../synced/<bucket>/<ten>/`).
 * Skill dung san cua harness (vd `plugin-authoring`) KHONG co file — ham nay khong thay, phai ghi
 * khoa tay vao ban mau. Dung chung cho `skill_chua_khoa` va `cai_dat.mjs`.
 */
export function ten_skill(thu_muc_skill = join(homedir(), '.claude/skills')) {
  const ten = new Set();
  const quet = (thu_muc, sau) => {
    let ds;
    try { ds = readdirSync(thu_muc, { withFileTypes: true }); } catch { return; }
    for (const m of ds) {
      if (!m.isDirectory()) continue;
      const con = join(thu_muc, m.name);
      if (existsSync(join(con, 'SKILL.md'))) ten.add(m.name);
      else if (sau > 1) quet(con, sau - 1);
    }
  };
  quet(thu_muc_skill, 3);
  return ten;
}

/** Ten trong `.claude/skill_bat.txt` (skill CO Y bat, `#` la ly do). Khong co file thi rong. */
export function skill_bat(root = goc()) {
  try {
    return readFileSync(join(root, '.claude/skill_bat.txt'), 'utf8')
      .split('\n').map((l) => l.split('#')[0].trim()).filter(Boolean);
  } catch { return []; } // khong co file: khong skill nao duoc mien
}

/** Ban mau khoa skill dung chung moi repo. `GC_BAN_MAU_KHOA` chi de thu, khong dong ban that. */
export const BAN_MAU_KHOA = process.env.GC_BAN_MAU_KHOA || '/home/user/ghi-nho/cong-cu/skill_overrides.json';

/**
 * TU TAT skill moi chua co khoa: ghi `"<ten>": "off"` vao ban mau kho (repo khac nhan qua
 * `cai_dat.mjs`) VA vao `skillOverrides` cua repo dang mo (thuoc `check:hook` xanh ngay, tu
 * phien sau het nap). Chi THEM khoa, khong sua khoa da co. Tra ve ten vua tat.
 *
 * VI SAO: 13/09 chu du an doi "tat skill khong lien quan phai TU CHAY", ban cu chi BAO —
 * 02/10 skill `docs` lot, tro ly dung lai hoi. Chu du an chot 02/10: hook tu ghi `off`.
 * Muon bat: go dong do khoi ban mau, hoac ghi ten vao `.claude/skill_bat.txt`.
 * Ban mau chi ghi khi kho ghi-nho co tren may; ghi xong con phai commit kho.
 */
export function tu_tat_skill_moi(root = goc(), thu_muc_skill = join(homedir(), '.claude/skills')) {
  const sot = skill_chua_khoa(root, thu_muc_skill);
  if (!sot.length) return [];
  const ghi_off = (p, lay) => {
    const obj = doc_json(p);
    if (!obj) return;
    const khoa = lay(obj);
    let doi = false;
    for (const t of sot) if (!(t in khoa)) { khoa[t] = 'off'; doi = true; }
    if (doi) writeFileSync(p, `${JSON.stringify(obj, null, 2)}\n`);
  };
  if (existsSync(BAN_MAU_KHOA)) ghi_off(BAN_MAU_KHOA, (m) => m);
  ghi_off(join(root, '.claude/settings.json'), (s) => (s.skillOverrides ??= {}));
  return sot;
}

/** Kho muc luc asset chung. Repo PUBLIC: clone doc-suong duoc, khong can `add_repo`. */
// `GC_KHO_GAME` chi de thu hook ma khong dong vao ban that.
export const KHO_GAME = process.env.GC_KHO_GAME || '/home/user/kho-game';
export const KHO_GAME_URL = 'https://github.com/gc1001vn-svg/kho-game';

/**
 * Repo nay co phai repo GAME khong — de `dau_phien` tu clone kho-game va `nhac_kho` tu
 * do asset theo cau chu du an go.
 *
 * VI SAO: 10/09 ghep coi xay gio bang tay nam luot nuong trong khi KayKit co san `mill`;
 * 28/09 kho-game chua clone, phien bo buoc do, ket luan sai "khong co ga". Luat "do
 * truoc khi tu lam" la CHU; hook thi chay moi cau, khong doi ai nho.
 *
 * Mot trong bon dau hieu la du: `.claude/repo_game` (tu dat) · `.gitignore` co
 * `assets_source` (luat hai kho) · `package.json` dung engine game · `CLAUDE.md`/`AGENTS.md`
 * co chu "game" trong 3.000 ky tu dau.
 */
export function la_repo_game(root = goc()) {
  try {
    if (existsSync(join(root, '.claude/repo_game'))) return true;
    const gi = join(root, '.gitignore');
    if (existsSync(gi) && /assets_source/.test(readFileSync(gi, 'utf8'))) return true;
    const pkg = doc_json(join(root, 'package.json'));
    if (pkg) {
      const dep = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
      if (dep.some((d) => /^(three|phaser|pixi\.js|@babylonjs\/core|kaplay|excalibur|littlejsengine|playcanvas)$/.test(d))) return true;
    }
    for (const f of ['CLAUDE.md', 'AGENTS.md']) {
      const p = join(root, f);
      if (existsSync(p) && /\bgame\b/i.test(readFileSync(p, 'utf8').slice(0, 3000))) return true;
    }
  } catch { /* doc hong thi coi nhu khong phai repo game — hook khong duoc chan viec */ }
  return false;
}
