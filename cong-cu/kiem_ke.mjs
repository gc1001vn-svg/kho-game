#!/usr/bin/env node
/**
 * KIEM KE ca kho: co bao nhieu thu, chia theo LOAI NOI DUNG va theo CHU DE.
 *
 * VI SAO CAN. `dem_model.mjs` tra loi "bao nhieu model NUONG DUOC" - mot con so. Cau khac
 * hay hoi hon: kho manh cai gi, yeu cai gi? Co du nha cua khong, co nguoi khong, co am
 * thanh khong? Truoc day phai mo README doc bang tay, ma bang do la so go tay nen lac hau.
 *
 * HAI CACH DEM, DUNG LAN:
 *   - MUC LE: dem tung model / tung file. Icosa, Openclipart, Freesound... ke le.
 *   - GOI: Kenney va itch.io ke theo GOI, moi goi hang chuc den hang tram file. **Khong
 *     cong goi vao muc le** - cong la so vo nghia.
 *
 * CHU DE chi la CHI DAU, khong phai so chinh xac:
 *   - Icosa dem theo cot `tag` that cua ho (`architecture`, `people`, `animals`...).
 *   - Nguon khac khong co tag -> do theo TEN model bang bo tu khoa duoi. Model ten
 *     `model`, `Project_20Name`, `untitled` thi khong chu de nao trung.
 *   - Mot model trung nhieu chu de thi dem nhieu lan. **Cong cac chu de KHONG ra tong.**
 *
 * Dung: node cong-cu/kiem_ke.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KE = join(import.meta.dirname, '..', 'ke');

const doc = (f) => {
  const dong = readFileSync(join(KE, f), 'utf8').split('\n').filter(Boolean);
  const cot = dong[0].split('\t');
  return dong.slice(1).map((d) => Object.fromEntries(d.split('\t').map((v, i) => [cot[i], v])));
};

const icosa = doc('icosa.tsv');
const polypizza = doc('poly-pizza.tsv');
const polyhaven = doc('polyhaven.tsv');
const qc = doc('quoc-chien-assets.tsv');
const tv = doc('tayvuc-kho-chung.tsv');
const oga = doc('opengameart.tsv');
const kenney = doc('kenney.tsv');
const itch = doc('itch.tsv');
const dem = (a, f) => a.filter(f).length;

console.log('KIEM KE KHO — muc le (khong cong goi vao)\n');

const loai = [
  ['Model 3D', [
    ['Icosa Gallery', icosa.length],
    ['Poly Pizza (tai khong duoc)', polypizza.length],
    ['quoc-chien/assets_source', qc.length],
    ['kho chung tayvuc', tv.length],
    ['OpenGameArt 3D Art', dem(oga, (r) => r.loai === '3D Art')],
    ['Poly Haven models', dem(polyhaven, (r) => r.loai === 'models')],
  ]],
  ['Anh 2D · bieu tuong', [
    ['Openclipart', doc('openclipart.tsv').length],
    ['OpenGameArt 2D Art', dem(oga, (r) => r.loai === '2D Art')],
    ['Openverse', doc('openverse.tsv').length],
    ['game-icons.net', doc('game-icons.tsv').length],
  ]],
  ['Am thanh', [
    ['Freesound', doc('freesound.tsv').length],
    ['OpenGameArt Sound Effect', dem(oga, (r) => r.loai === 'Sound Effect')],
  ]],
  ['Nhac', [['OpenGameArt Music', dem(oga, (r) => r.loai === 'Music')]]],
  ['Hoa tiet · HDRI', [
    ['Poly Haven hdris', dem(polyhaven, (r) => r.loai === 'hdris')],
    ['OpenGameArt Texture', dem(oga, (r) => r.loai === 'Texture')],
    ['Poly Haven textures', dem(polyhaven, (r) => r.loai === 'textures')],
  ]],
  ['Font', [['Google Fonts', doc('font.tsv').length]]],
  ['Ma nguon (hoc kien truc)', [['GitHub', doc('ma-nguon-mo.tsv').length]]],
];

let tong = 0;
for (const [ten, hang] of loai) {
  const t = hang.reduce((s, [, n]) => s + n, 0);
  tong += t;
  console.log(`${ten.padEnd(26)} ${String(t).padStart(7)}`);
  for (const [n, s] of hang.sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n.padEnd(26)} ${String(s).padStart(6)}`);
  }
}
console.log(`${''.padEnd(26)} ${String(tong).padStart(7)}  TONG MUC LE\n`);

const k2d = dem(kenney, (r) => /2D/.test(r.loai || ''));
const k3d = dem(kenney, (r) => /3D/.test(r.loai || ''));
console.log('Ke theo GOI, khong ke le tung file — dung cong vao tren:');
console.log(`  Kenney            ${kenney.length} goi (2D ${k2d} · 3D ${k3d}`
  + ` · Audio ${dem(kenney, (r) => /Audio/.test(r.loai || ''))}`
  + ` · Textures ${dem(kenney, (r) => /Textures/.test(r.loai || ''))})`);
console.log(`  itch.io CC0       ${itch.length} goi (3D ${dem(itch, (r) => /3d/i.test(r.tag || ''))}`
  + ` · 2D ${dem(itch, (r) => /2d/i.test(r.tag || ''))})\n`);

// --- Chu de ---
const CHU_DE = {
  'Nha cua · cong trinh': /\b(house|home|building|tower|castle|church|temple|shop|store|hut|cabin|barn|bridge|wall|fence|roof|door|window|stair|city|village|town|architect)/i,
  'Nguoi · nhan vat': /\b(man|woman|boy|girl|人|people|person|human|character|knight|soldier|wizard|warrior|villager|head|body|hand|face|hair|skeleton|zombie|orc|goblin)/i,
  'Con vat': /\b(animal|dog|cat|chicken|hen|rooster|cow|pig|sheep|horse|bird|fish|wolf|bear|deer|rabbit|mouse|snake|dragon|monster|insect|bee|butterfly)/i,
  'Cay coi · thien nhien': /\b(tree|plant|flower|grass|bush|forest|rock|stone|mountain|leaf|leaves|nature|mushroom|cactus|palm)/i,
  'Xe co · phuong tien': /\b(car|truck|bus|train|plane|aircraft|boat|ship|bike|bicycle|motorcycle|vehicle|wagon|cart|wheel)/i,
  'Vu khi · cong cu': /\b(sword|axe|bow|arrow|gun|rifle|pistol|shield|spear|hammer|knife|dagger|staff|wand|tool|pickaxe|shovel)/i,
  'Do dung · noi that': /\b(table|chair|bed|lamp|sofa|desk|shelf|barrel|crate|box|chest|pot|cup|bottle|book|sign|furniture|door)/i,
  'Do an': /\b(food|bread|meat|fruit|apple|cake|egg|fish|cheese|drink|coffee|pizza|burger)/i,
};

const nguon3d = [
  ['Icosa', icosa, (r) => `${r.ten} ${r.tag || ''}`],
  ['Poly Pizza', polypizza, (r) => `${r.ten} ${r.tag || ''}`],
  ['Poly Haven', polyhaven.filter((r) => r.loai === 'models'), (r) => `${r.ten} ${r.tag || ''}`],
  ['quoc-chien', qc, (r) => r.ten],
  ['kho chung', tv, (r) => r.ten],
];

console.log('MODEL 3D THEO CHU DE — do theo ten (va tag cua Icosa).');
console.log('Mot model trung nhieu chu de thi dem nhieu lan: CONG LAI KHONG RA TONG.\n');
const W = 12;
console.log(''.padEnd(24) + nguon3d.map(([n]) => n.padStart(W)).join('') + 'tong'.padStart(W));
for (const [ten, re] of Object.entries(CHU_DE)) {
  const so = nguon3d.map(([, ds, lay]) => dem(ds, (r) => re.test(lay(r))));
  console.log(ten.padEnd(24) + so.map((n) => String(n).padStart(W)).join('')
    + String(so.reduce((a, b) => a + b, 0)).padStart(W));
}

// Tag that cua Icosa: so dang tin hon do theo ten.
const tag = {};
for (const r of icosa) {
  for (const t of (r.tag || '').split(/[ ,;]+/)) if (t) tag[t.toLowerCase()] = (tag[t.toLowerCase()] || 0) + 1;
}
const CHINH = ['objects', 'architecture', 'people', 'animals', 'nature', 'tech', 'food', 'transport', 'scenes', 'art'];
console.log('\nIcosa — theo TAG THAT cua ho (dang tin hon do ten):');
console.log('  ' + CHINH.map((t) => `${t} ${tag[t] || 0}`).join(' · '));
console.log(`  khong tag nao trong ${CHINH.length} tag tren: `
  + dem(icosa, (r) => !CHINH.some((t) => new RegExp(`(^|[ ,;])${t}([ ,;]|$)`, 'i').test(r.tag || ''))));
