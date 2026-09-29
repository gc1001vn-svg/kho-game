/**
 * Doc va tai THU MUC Google Drive cong khai - khong khoa API, khong dang nhap.
 * Dung cho Quaternius (goi cu de tren Drive) va 3dtextures.me (moi hoa tiet mot thu muc).
 *
 * HAI DUONG, do 29/09 tu may ao (ca ba host deu trong Allowed domains):
 *   liet ke: `drive.google.com/embeddedfolderview?id=<thu-muc>` - HTML tinh, moi muc mot
 *            `id="entry-<id>"` + `flip-entry-title">ten`; thu muc con co link `/drive/folders/`.
 *   tai:     `drive.usercontent.google.com/download?id=<file>&export=download&confirm=t`
 *            - `confirm=t` bo qua trang canh bao "file lon khong quet virus duoc".
 *
 * Goi bang `curl --http1.1` nhu moi cong cu tai trong kho (bay HTTP/2 qua proxy, CLAUDE.md).
 */
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

const chay = promisify(execFile);
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

const curl = async (args) => (await chay('curl', ['-sS', '--http1.1', '-L', '-A', UA, '--max-time', '300', ...args],
  { encoding: 'utf8', maxBuffer: 1 << 26 })).stdout;

const go = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();

/** Ma thu muc tu link Drive bat ky (`/drive/folders/<id>?usp=...`). */
export const maThuMuc = (url) => (String(url).match(/(?:folders\/|open\?id=|file\/d\/)([\w-]+)/) || [])[1] || null;

/**
 * Tai MOT file Drive ve `dich` (duong day du). Bai cu cua 3dtextures.me de `open?id=<ma>` -
 * ma do co the la thu muc hay mot file zip; `lay_3dtextures.mjs` thu liet ke truoc, rong thi
 * coi la file.
 */
export async function taiFile(maF, dich) {
  mkdirSync(dirname(dich), { recursive: true });
  await curl(['-o', dich, `https://drive.usercontent.google.com/download?id=${maF}&export=download&confirm=t`]);
  return existsSync(dich) ? statSync(dich).size : 0;
}

/** Liet ke mot tang: [{ id, ten, laThuMuc }]. */
export async function lietKe(maTM) {
  const html = await curl([`https://drive.google.com/embeddedfolderview?id=${maTM}`]);
  const ra = [];
  for (const m of html.matchAll(/id="entry-([\w-]+)"[\s\S]*?flip-entry-title">([^<]*)/g)) {
    ra.push({ id: m[1], ten: go(m[2]), laThuMuc: html.includes(`/drive/folders/${m[1]}`) });
  }
  return ra;
}

/**
 * Tai ca cay thu muc ve `dich`, giu ten thu muc con.
 * `boQua(tenThuMucCon)` tra true thi khong vao (vd `Blend` - file .blend vo dung khi may ao
 * khong co Blender, ma nang nhat goi).
 */
export async function taiThuMuc(maTM, dich, { boQua = () => false, sau = 3 } = {}) {
  let so = 0, byte = 0;
  for (const m of await lietKe(maTM)) {
    if (m.laThuMuc) {
      if (sau <= 0 || boQua(m.ten)) continue;
      const r = await taiThuMuc(m.id, join(dich, m.ten), { boQua, sau: sau - 1 });
      so += r.so; byte += r.byte;
      continue;
    }
    const f = join(dich, m.ten.replace(/[\\/]/g, '_'));
    if (existsSync(f) && statSync(f).size > 0) continue;
    mkdirSync(dich, { recursive: true });
    await curl(['-o', f, `https://drive.usercontent.google.com/download?id=${m.id}&export=download&confirm=t`]);
    so++;
    byte += existsSync(f) ? statSync(f).size : 0;
  }
  return { so, byte };
}
