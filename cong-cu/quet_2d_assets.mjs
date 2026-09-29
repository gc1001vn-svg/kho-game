#!/usr/bin/env node
/**
 * Nap muc luc `Tiddybub/2d-assets` -> `ke/2d-assets.tsv`: 1.101 goi 2D gan nhan CC0 (Kenney
 * 142 · OpenGameArt 959), nam trong MOT repo GitHub - tai bang `git` tung goi, ne duoc chan
 * cua itch/OpenGameArt (OGA o kho nay ghi "mo trang goc, tai tay").
 *
 * NHAN LICENSE CUA MIRROR KHONG DUOC TIN SUONG. Doi chieu 29/09 voi `ke/opengameart.tsv`:
 * 788 goi khop CC0 · **7 goi LECH** (ban goc ghi CC-BY 3.0) · 164 goi ban ke kho chua co.
 * Nen cot `license` o day lay theo BAN GOC khi kho co ban goc; lech thi ghi license ban goc
 * (CC-BY phai ghi ten); khong doi chieu duoc thi ghi ro "chua doi chieu".
 *
 * Doc `catalog.json` bang clone KHONG BLOB (vai MB), khong keo 62.000 file anh.
 *
 * Dung: node cong-cu/quet_2d_assets.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const GOC = join(import.meta.dirname, '..');
const RA = join(GOC, 'ke', '2d-assets.tsv');
const REPO = 'https://github.com/Tiddybub/2d-assets';
const TAM = join(tmpdir(), 'kho-game-2d-assets-quet');

rmSync(TAM, { recursive: true, force: true });
execFileSync('git', ['clone', '-q', '--depth', '1', '--filter=blob:none', '--no-checkout', REPO, TAM], { stdio: 'inherit', timeout: 300000 });
const bang = JSON.parse(execFileSync('git', ['-C', TAM, 'show', 'HEAD:catalog.json'], { encoding: 'utf8', maxBuffer: 1 << 26 }));
const muc = bang.assets ?? [];

// License ban goc OpenGameArt theo duong `/content/<slug>`.
const oga = new Map();
const pOga = join(GOC, 'ke', 'opengameart.tsv');
if (existsSync(pOga)) {
  const [dau, ...than] = readFileSync(pOga, 'utf8').split('\n').filter(Boolean);
  const cot = dau.split('\t');
  for (const d of than) {
    const o = d.split('\t');
    oga.set(o[cot.indexOf('duong_dan')], o[cot.indexOf('license')]);
  }
}

const sach = (s) => String(s ?? '').replace(/[\t\r\n]+/g, ' ').trim();
const dem = { khop: 0, lech: 0, chua: 0 };
const dong = ['id\tten\ttac_gia\tlicense\tloai\ttag\tduong\ttrang\tcach_lay'];
for (const a of muc) {
  let license = 'CC0 1.0';
  const m = String(a.source_page || '').match(/opengameart\.org(\/content\/[^?#]+)/);
  if (m) {
    const goc = oga.get(m[1]);
    if (goc === undefined) { license = 'CC0 (theo 2d-assets, chua doi chieu ban goc)'; dem.chua++; }
    else if (/cc0|publicdomain\/zero/i.test(goc)) dem.khop++;
    else { license = `${goc} (ban goc OpenGameArt; 2d-assets ghi CC0 - LECH, theo ban goc)`; dem.lech++; }
  }
  dong.push([a.id, a.title, a.credit || '?', license, '2D', [...(a.genres || []), ...(a.tags || [])].join(','),
    a.path, a.source_page, `node cong-cu/lay.mjs 2d-assets ${a.id}`].map(sach).join('\t'));
}
writeFileSync(RA, `${dong.join('\n')}\n`);
rmSync(TAM, { recursive: true, force: true });
console.log(`${muc.length} goi -> ke/2d-assets.tsv · OGA khop CC0 ${dem.khop} · LECH ${dem.lech} · chua doi chieu ${dem.chua}`);
