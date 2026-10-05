#!/usr/bin/env node
// Hook PreToolUse + PostToolUse cho Claude Code: chan sua cac file phai hoi chu du an truoc.
// Ban dung chung cho moi du an cua gc1001vn-svg.
//
// Cai vao mot du an: `node /home/user/ghi-nho/cong-cu/cai_dat.mjs <repo>`. No gan file nay
// vao HAI moc: PreToolUse (`Edit|Write|NotebookEdit|Bash`) va PostToolUse (`Bash`).
// Danh sach khoa: <du-an>/.claude/file_khoa.txt, moi dong mot duong dan tuong doi goc
// repo. Dong ket thuc bang "/" = khoa ca thu muc. Dong bat dau bang "#" la ghi chu.
// Khong co file do thi dung MAC_DINH.
//
// ---------------------------------------------------------------------------
// NO CHAN DUOC GI VA KHONG CHAN DUOC GI - doc truoc khi tin vao no
//
// Hook nay chan duoc viec sua NHAM va sua QUEN HOI qua `Edit`/`Write`. No KHONG chan
// duoc mot tro ly co tinh di duong vong. No la mot cai NHAC, cong voi mot cuon so ghi
// lai ai da sua gi.
//
//   1. VE DUYET (`.claude/da_duyet.txt`): mot dong mot duong dan. Co ve thi `Edit` duoc
//      qua va dong ve bi XOA ngay - ve dung MOT LAN. Tro ly chi duoc ghi ve SAU khi chu
//      du an dong y.
//   2. SO GHI (`.claude/nhat_ky_file_khoa.log`, LEN git): moi lan file khoa bi dung toi.
//
// ---------------------------------------------------------------------------
// DUONG `Bash`: KHONG CHAN, CHI GHI SO - va chi ghi khi file khoa DOI THAT (29/09)
//
// 12/09 chu du an chot bo chan duong Bash (13 lan chan thi 4 lan chan nham), giu ghi so.
// Ban 12/09 doan "lenh nay co ghi khong" bang cach doc chuoi lenh — va doan nham: `git add`
// dinh mau `dd `, `node -e` chi DOC file cung bi coi la ghi. Moi dong so thua lam cay git
// ban (so nam trong git), hook Stop cua may ao bao "There are uncommitted changes" cuoi
// luot, phai de them commit chi de luu so. Do 29/09: ca hai dong so phien do deu la lenh doc.
//
// Ban nay KHONG doc chuoi lenh nua. Truoc lenh Bash (PreToolUse) chup mtime + co cua moi
// file khoa; sau lenh (PostToolUse) chup lai. Khac nhau moi ghi so. Lenh doc khong bao
// gio vao so; lenh ghi bang bat ky duong nao (`sed -i`, `python`, `>`, `cp`...) deu vao,
// ke ca file nam trong THU MUC khoa ma ban cu bo qua.
//
// Fail-open: doc loi hoac du lieu hong thi cho qua, khong lam treo phien.
// Y tuong co che hook lay tu MoonshotAI/kimi-code (MIT), code viet lai tu dau.

import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { bat, goc, thoat } from './hook_chung.mjs';

const ID = 'truoc:chan-file-khoa';

/** Danh sach khoa mac dinh khi du an khong co .claude/file_khoa.txt. */
const MAC_DINH = ['CLAUDE.md', '.claude/settings.json', '.github/workflows/'];

const DUONG_VE = '.claude/da_duyet.txt';
const DUONG_SO = '.claude/nhat_ky_file_khoa.log';

/** File chinh cac hook ghi moi luot — khoa ca `.claude/` thi chung khong duoc tinh la "sua". */
const BO_QUA = new Set([DUONG_SO, DUONG_VE, '.claude/so_lenh.log', '.claude/nhac_kho.log']);

/** Doc danh sach khoa cua du an, khong co thi tra ve MAC_DINH. */
function docDanhSach(root) {
  try {
    const dong = readFileSync(join(root, '.claude/file_khoa.txt'), 'utf8')
      .split('\n')
      .map((d) => d.trim())
      .filter((d) => d && !d.startsWith('#'));
    return { muc: dong, nguon: '.claude/file_khoa.txt' };
  } catch {
    return { muc: MAC_DINH, nguon: 'danh sach mac dinh' };
  }
}

/** Muc khoa trung voi `norm`, hay `undefined`. */
function timKhoa(muc, norm) {
  return muc.find((d) => (d.endsWith('/') ? norm.startsWith(d) : norm === d));
}

/** Moi file thuoc danh sach khoa: muc file giu nguyen, muc thu muc bung ra tung file. */
function fileKhoa(root, muc) {
  const ra = [];
  const bung = (rel) => {
    let ds;
    try { ds = readdirSync(join(root, rel), { withFileTypes: true }); } catch { return; }
    for (const m of ds) {
      const con = `${rel}${m.name}`;
      if (m.isDirectory()) bung(`${con}/`);
      else ra.push(con);
    }
  };
  for (const d of muc) {
    if (d.endsWith('/')) bung(d);
    else ra.push(d);
  }
  return ra.filter((f) => !BO_QUA.has(f));
}

/** Dau van tay moi file khoa: `mtime:co`, file khong co thi `null`. */
function chup(root, muc) {
  const anh = {};
  for (const f of fileKhoa(root, muc)) {
    try {
      const s = statSync(join(root, f));
      anh[f] = `${s.mtimeMs}:${s.size}`;
    } catch {
      anh[f] = null;
    }
  }
  return anh;
}

/** Cho cat anh chup giua PreToolUse va PostToolUse cua CUNG mot lenh. Ngoai repo: tam. */
function duongAnh(tho) {
  const sach = (s) => String(s).replace(/[^\w-]/g, '');
  return join(tmpdir(), 'chan-file-khoa', sach(tho?.session_id ?? 'phien'), `${sach(tho?.tool_use_id ?? 'bash')}.json`);
}

/**
 * Tieu mot ve duyet cho `norm`. Tra ve `true` neu co ve (va da xoa no di).
 *
 * Xoa NGAY khi dung: ve mot lan thi moi lan sua lai phai hoi lai. De nguyen thi
 * mot lan dong y thanh giay phep vinh vien - dung cai bay ma luat file khoa
 * sinh ra de tranh.
 */
function tieuVe(root, norm) {
  const duong = join(root, DUONG_VE);
  let dong;
  try {
    dong = readFileSync(duong, 'utf8').split('\n');
  } catch {
    return false;
  }
  const i = dong.findIndex((d) => d.trim() === norm);
  if (i < 0) return false;
  dong.splice(i, 1);
  try {
    writeFileSync(duong, dong.join('\n'));
  } catch {
    // Xoa khong duoc thi KHONG cho qua: ve khong tieu duoc la ve dung mai mai.
    return false;
  }
  return true;
}

/** Ghi mot dong vao so. Ghi hong thi thoi, khong lam treo phien. */
function ghiSo(root, van) {
  try {
    appendFileSync(join(root, DUONG_SO), `${new Date().toISOString()} ${van}\n`);
  } catch {
    /* fail-open */
  }
}

function chan(norm, khoa, nguon) {
  thoat(2, {
    loi:
      `File "${norm}" trung muc khoa "${khoa}" (${nguon}).\n` +
      `Phai HOI CHU DU AN va duoc dong y truoc khi sua.\n` +
      `Duoc dong y roi thi ghi mot dong "${norm}" vao ${DUONG_VE} roi sua lai — ` +
      `ve dung mot lan, va moi lan cho qua deu ghi vao ${DUONG_SO}.\n` +
      `CHUA duoc dong y thi KHONG duoc tu ghi ve. Duong Bash khong bi chan ` +
      `nhung file khoa doi la VAO SO — di duong do ma chua hoi thi chi la sua trom co dau vet.`,
  });
}

// FAIL-OPEN khi chinh hook hong. Chan la exit 2; moi ma thoat khac deu cho lenh
// di tiep. Nhung loi khong bat thi Node in ca vet stack ra stderr va vet do vao
// ngu canh — nen bat lay roi thoat 0 im lang.
process.on('uncaughtException', () => process.exit(0));
process.on('unhandledRejection', () => process.exit(0));

// Chay o CA BA muc. Day la lop bao ve, khong phai lop tien nghi.
// Muon tat that thi ghi ID vao .claude/hook_phien.txt — co ghi la co dau vet.
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
  const root = goc();
  const { muc, nguon } = docDanhSach(root);
  const tenCongCu = tho?.tool_name ?? '';

  // --- Bash: chup truoc, so sau, doi that moi ghi so ------------------------
  // Ve duyet la cua duong Edit/Write: duong Bash khong tieu ve, khong thi mot lenh
  // Bash se an mat cai ve dang cho dung cho Edit.
  if (tenCongCu === 'Bash') {
    const pAnh = duongAnh(tho);
    if (tho?.hook_event_name === 'PostToolUse') {
      let truoc;
      try { truoc = JSON.parse(readFileSync(pAnh, 'utf8')); } catch { process.exit(0); }
      try { rmSync(pAnh, { force: true }); } catch { /* anh thua nam trong thu muc tam, may ao tu xoa */ }
      const sau = chup(root, muc);
      const doi = [...new Set([...Object.keys(truoc), ...Object.keys(sau)])]
        .filter((f) => (truoc[f] ?? null) !== (sau[f] ?? null));
      if (doi.length) {
        // `git pull`/`merge`/`checkout -- f` cung doi mtime, nhung ket qua trung HEAD — la
        // thay doi DA nam trong lich su git, khong phai sua moi. Chi ghi file con KHAC HEAD.
        // Khong phai repo git (hay git hong) thi ghi het.
        let ban = null;
        try {
          ban = new Set(execFileSync('git', ['status', '--porcelain', '-z', '--', ...doi],
            { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
            .split('\0').filter((m) => m.length > 3).map((m) => m.slice(3)));
        } catch { /* khong phai repo git: ghi het */ }
        for (const f of doi) if (!ban || ban.has(f)) ghiSo(root, `GHI SO Bash -> ${f}`);
      }
      process.exit(0);
    }
    try {
      mkdirSync(dirname(pAnh), { recursive: true });
      writeFileSync(pAnh, JSON.stringify(chup(root, muc)));
    } catch { /* khong chup duoc thi lenh nay khong vao so — mat mot dong nhac, khong mat viec */ }
    process.exit(0);
  }

  // --- Edit / Write / NotebookEdit -------------------------------------------
  const filePath = tho?.tool_input?.file_path ?? '';
  if (!filePath) process.exit(0);
  const rel = isAbsolute(filePath) ? relative(root, filePath) : filePath;
  const norm = rel.split('\\').join('/');

  const khoa = timKhoa(muc, norm);
  if (!khoa) process.exit(0);

  if (tieuVe(root, norm)) {
    ghiSo(root, `CHO QUA (ve) ${tenCongCu} -> ${norm}`);
    process.exit(0);
  }
  ghiSo(root, `CHAN ${tenCongCu} -> ${norm}`);
  chan(norm, khoa, nguon);
});
