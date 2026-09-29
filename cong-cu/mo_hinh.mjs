#!/usr/bin/env node
/**
 * Cong cu MODEL: doi FBX -> GLB, dem tam giac, giam tam giac.
 *
 * VI SAO. Hai cua chan lau nay cua kho: (1) may nuong chi doc `.obj/.gltf/.glb` - goi nao
 * chi co FBX (nhieu goi Quaternius, KayKit, OpenGameArt) la bo; (2) tran 8.000 tam - model
 * dep ma nang hon la loai. Do 29/09 tren may ao: `fbx2gltf` (BSD-3) doi FBX Kenney sang GLB
 * mat 0,044 giay, giu ca clip chuyen dong (`Root|Run`); glTF-Transform (MIT) + meshoptimizer
 * (MIT) doc/dem/giam tam thuan JS.
 *
 * Thu vien nam o `cong-cu/mo_hinh/` (khong o goc repo: goc co `package.json` thi hook dau
 * phien bat moi phien kho-game `npm ci`, trong khi chi viec model moi can). Lan dau goi lenh
 * nay thi TU `npm ci` (~10 giay).
 *
 * Dung:
 *   node cong-cu/mo_hinh.mjs fbx assets_source/farmbuildings        # moi .fbx -> .glb canh no
 *   node cong-cu/mo_hinh.mjs tam assets_source/farmbuildings        # dem tam tung model
 *   node cong-cu/mo_hinh.mjs giam Barn.glb --tam 8000               # -> Barn_giam.glb
 *   node cong-cu/mo_hinh.mjs giam Barn.glb --tam 4000 --ra nho.glb --sai-so 0.05   # sai so 5% kich thuoc
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const MH = join(import.meta.dirname, 'mo_hinh');
const TRAN_TAM = 8000;

const [lenh, ...con] = process.argv.slice(2);
const gt = (co) => { const i = con.indexOf(co); return i >= 0 ? con[i + 1] : undefined; };
const coGiaTri = new Set(['--tam', '--ra', '--sai-so']);
const duong = con.filter((a, i) => !a.startsWith('--') && !coGiaTri.has(con[i - 1]));
if (!['fbx', 'tam', 'giam'].includes(lenh) || !duong.length) {
  console.error('Dung: node cong-cu/mo_hinh.mjs fbx|tam <duong...>   ·   giam <file.glb> [--tam 8000] [--sai-so 0.02] [--ra <file>]');
  process.exit(1);
}

/** Cai thu vien lan dau. `npm ci` theo lock: dung phien ban da do, khong tu nang. */
function canThuVien() {
  if (existsSync(join(MH, 'node_modules', '@gltf-transform', 'core'))) return;
  console.log('Lan dau: cai thu vien vao cong-cu/mo_hinh/ (npm ci)...');
  const r = spawnSync('npm', ['ci', '--no-audit', '--no-fund', '--prefix', MH], { stdio: 'inherit' });
  if (r.status) { console.error('npm ci hong - khong lam tiep duoc'); process.exit(1); }
}
const yeuCau = createRequire(join(MH, 'package.json'));
const nap = async (ten) => import(pathToFileURL(yeuCau.resolve(ten)).href);

/** Moi file co duoi `duoi` duoi cac duong da cho (de quy). */
function tim(ds, duoi) {
  const ra = [];
  const di = (p) => {
    if (!existsSync(p)) return;
    if (statSync(p).isDirectory()) { for (const x of readdirSync(p)) di(join(p, x)); return; }
    if (duoi.includes(extname(p).toLowerCase())) ra.push(p);
  };
  for (const p of ds) di(p);
  return ra.sort();
}

async function mo() {
  const { NodeIO } = await nap('@gltf-transform/core');
  const { ALL_EXTENSIONS } = await nap('@gltf-transform/extensions');
  return new NodeIO().registerExtensions(ALL_EXTENSIONS);
}

/** So tam giac: primitive TRIANGLES (mode 4); co chi so thi dem chi so, khong thi dem dinh. */
function demTam(doc) {
  let tam = 0;
  for (const m of doc.getRoot().listMeshes()) {
    for (const p of m.listPrimitives()) {
      if (p.getMode() !== 4) continue;
      const n = p.getIndices()?.getCount() ?? p.getAttribute('POSITION')?.getCount() ?? 0;
      tam += Math.floor(n / 3);
    }
  }
  return tam;
}

canThuVien();

if (lenh === 'fbx') {
  const bin = join(MH, 'node_modules', 'fbx2gltf', 'bin', 'Linux', 'FBX2glTF');
  let xong = 0, coSan = 0, hong = 0;
  for (const f of tim(duong, ['.fbx'])) {
    const ra = join(dirname(f), basename(f, extname(f)));
    if (existsSync(`${ra}.glb`)) { coSan++; continue; }
    const r = spawnSync(bin, ['--binary', '--input', f, '--output', ra], { encoding: 'utf8' });
    if (r.status || !existsSync(`${ra}.glb`)) { hong++; console.log(`HONG ${f}: ${(r.stderr || r.stdout || '').trim().slice(0, 80)}`); } else xong++;
  }
  console.log(`FBX -> GLB: ${xong} moi · ${coSan} co san · ${hong} hong`);
  process.exit(hong ? 1 : 0);
}

const io = await mo();

if (lenh === 'tam') {
  let dat = 0, tong = 0;
  for (const f of tim(duong, ['.glb', '.gltf'])) {
    try {
      const t = demTam(await io.read(f));
      tong++;
      if (t <= TRAN_TAM) dat++;
      console.log(`${String(t).padStart(8)} tam  ${t > TRAN_TAM ? 'QUA TRAN ' : ''}${f}`);
    } catch (e) {
      console.log(`    HONG  ${f}: ${String(e.message).slice(0, 70)}`);
    }
  }
  console.log(`${dat}/${tong} model <= ${TRAN_TAM} tam. Qua tran thi: node cong-cu/mo_hinh.mjs giam <file> --tam ${TRAN_TAM}`);
}

if (lenh === 'giam') {
  const { weld, simplify, prune, unweld, normals } = await nap('@gltf-transform/functions');
  const { MeshoptSimplifier } = await nap('meshoptimizer');
  await MeshoptSimplifier.ready;
  const dich = Number(gt('--tam')) || TRAN_TAM;
  const f = duong[0];
  const doc = await io.read(f);
  const truoc = demTam(doc);
  if (truoc <= dich) { console.log(`${f}: ${truoc} tam, da duoi ${dich} - khong can giam`); process.exit(0); }
  // Model da giac thap to PHANG: moi mat mot phap tuyen rieng -> dinh trung vi tri van
  // khac phap tuyen, `weld` khong gop duoc, meshopt khong giam duoc (do 29/09: 7.827 -> 7.773).
  // Nen bo NORMAL truoc, gop dinh theo vi tri, giam, roi TACH dinh + tinh lai phap tuyen
  // phang - giu dung ve phang cua model. `saiSo` la sai so cho phep theo kich thuoc model.
  const saiSo = Number(gt('--sai-so')) || 0.02;
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) p.setAttribute('NORMAL', null);
  await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: dich / truoc, error: saiSo }),
    unweld(), normals({ overwrite: true }), prune());
  const sau = demTam(doc);
  const ra = gt('--ra') || join(dirname(f), `${basename(f, extname(f))}_giam.glb`);
  await io.write(ra, doc);
  console.log(`${f}: ${truoc} -> ${sau} tam -> ${ra}${sau > dich ? ` (CHUA toi ${dich}: dung o sai so ${saiSo} - tang --sai-so, xem hinh truoc khi dung)` : ''}`);
}
