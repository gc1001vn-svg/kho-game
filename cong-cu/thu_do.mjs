#!/usr/bin/env node
/**
 * BO DE cho lenh do: cau tieng Viet phai ra ket qua, lenh phai in GON, va hook khong
 * duoc bat nham cau noi chuyen viec.
 *
 * VI SAO LA THUOC, KHONG PHAI CHU. 29/09 `do.mjs hieu_ung` · `nhan_vat` · `cu_dong` ra 0
 * trong khi kho co hang nghin muc - tu dien chi co 30 tu, lenh chi khop cot `ten`. Phien
 * doc so 0 roi ket luan "khong co", tu ve lay. Sua xong ma khong co thuoc thi mot lan sua
 * tu dien sau lam hut lai cung khong ai hay.
 *
 * Nguong duoi (so trung toi thieu) dat THAP hon so do that 29/09 nhieu lan: ban ke doi
 * thi so doi, thuoc chi bat khi tut ve gan 0 - dung loi da xay ra.
 *
 * Dung: node cong-cu/thu_do.mjs
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { dich, timKiem, tachCum } from './tim.mjs';

/** [cau do, so trung toi thieu]. So do that 29/09 ghi o cuoi dong. */
const DE = [
  ['hiệu ứng', 200],   // 1.990
  ['hieu_ung', 200],
  ['nhân vật', 200],   // 1.914
  ['nhan_vat', 200],
  ['cử động', 200],    // 1.338
  ['cu_dong', 200],
  ['kĩ năng', 20],     // 127
  ['âm thanh', 200],   // 3.702
  ['ruộng', 100],      // 1.033
  ['lửa', 100],        // 1.723
  ['gà', 100],         // 1.000
  ['nhà kho', 50],     // 407
];

/** Cau noi chuyen viec: hook KHONG duoc rut ra tu asset nao. */
const CAU_VIEC = [
  'em chạy lệnh đo cho kho game rồi đẩy main',
  'đường dẫn cài đặt cá nhân bình thường',
  'sửa nút bấm gửi, thêm thư viện',
];
/** Cau hoi asset: hook PHAI rut dung cac cum nay. */
const CAU_ASSET = [
  ['cần hiệu ứng lửa cho phép thuật', ['hiệu_ứng', 'lửa', 'phép_thuật']],
  ['vẽ lại chuồng gà và ruộng lúa, thêm con gà.', ['chuồng_gà', 'ruộng_lúa', 'gà']],
];

/** Tran byte cua lenh do: mac dinh ~20 dong, `--ngan` cho hook. */
const TRAN = [[['farm'], 3000], [['nhân vật', '--ngan'], 700]];

const hong = [];
let tong = 0;

for (const [cau, toiThieu] of DE) {
  tong++;
  const { tra } = dich([cau]);
  const so = timKiem(tra).reduce((s, x) => s + x.trung.length, 0);
  if (so < toiThieu) hong.push(`"${cau}" ra ${so} trung < ${toiThieu} (dich: ${tra.join(' ')})`);
}

for (const cau of CAU_VIEC) {
  tong++;
  const rut = tachCum(cau, { hook: true }).filter((x) => x.v).map((x) => x.cum);
  if (rut.length) hong.push(`hook bat nham cau viec "${cau}": ${rut.join(' ')}`);
}
for (const [cau, can] of CAU_ASSET) {
  tong++;
  const rut = tachCum(cau, { hook: true }).filter((x) => x.v).map((x) => x.cum);
  if (rut.join(' ') !== can.join(' ')) hong.push(`hook rut "${cau}" ra [${rut.join(' ')}], can [${can.join(' ')}]`);
}

const DO = join(import.meta.dirname, 'do.mjs');
for (const [thamSo, tran] of TRAN) {
  tong++;
  const ra = execFileSync('node', [DO, ...thamSo], { encoding: 'utf8' });
  const byte = Buffer.byteLength(ra);
  if (byte > tran) hong.push(`do.mjs ${thamSo.join(' ')} in ${byte} byte > tran ${tran}`);
}

for (const h of hong) console.log(`  HONG: ${h}`);
console.log(`thu:do ${tong - hong.length}/${tong} dat`);
process.exit(hong.length ? 1 : 0);
