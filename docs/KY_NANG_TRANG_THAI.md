# KỸ NĂNG, TRẠNG THÁI, HIỆU ỨNG — cho game đẹp hơn và dễ chơi hơn

> Tra 30/09/2026, dùng cho **mọi dự án game**. Đọc cùng `DO_HOA.md` (kỹ thuật vẽ: hậu kỳ, hạt,
> đèn). File này nói **luật chơi** của kỹ năng và trạng thái, và **ngôn ngữ hình** để báo chúng
> cho người chơi. Mục 8 là kế hoạch thử ở `quoc-chien` — anh duyệt 30/09, **cả 3 đợt xong 30/09**.

## 1. Mười hai bài học — mỗi bài một game

| # | Bài học | Game | Dùng vào đâu |
|---|---|---|---|
| 1 | **Tách phần TÍNH khỏi phần NHÌN**: hiệu ứng chỉ phát "tín hiệu", bộ vẽ tự chọn hạt, màu, tiếng | Unreal Engine — GameplayCue của Gameplay Ability System | Mọi game. `quoc-chien` đã có luật "mô phỏng tách khỏi vẽ" — thêm bảng tín hiệu |
| 2 | **Báo trước mọi đòn** — người chơi thấy hết, thua là tự mình sai | Into the Breach | Báo trước thẻ quyết định, nổi loạn, vỡ trận |
| 3 | **Hiện ý định và con số ngay chỗ quyết định** | Slay the Spire: ký hiệu ý định trên đầu địch; số trên lá bài tự đổi theo trạng thái | Thẻ quyết định |
| 4 | **Xem trước chỉ số nào đổi**, không cần nói hết | Reigns: chấm nhỏ trên thanh chỉ số, chấm to = đổi nhiều, không nói tăng hay giảm | Thẻ quyết định |
| 5 | **Tách nguồn từng con số** | Crusader Kings 3: tooltip lồng tooltip; 2–3 tầng là vừa | Chính sách, đặc tính nước |
| 6 | **Trạng thái có bậc, có cờ** | Total War: hăng hái → vững → lung lay → dao động (cờ nháy) → tháo chạy (cờ trắng) → tan vỡ (không tập hợp lại được) | Trận |
| 7 | **Ngưỡng tạo khoảnh khắc** | Darkest Dungeon: căng thẳng tới 100 → thử thách → suy sụp hoặc anh dũng; 200 → đau tim | Bất ổn, sĩ khí |
| 8 | **Hai thang, hai nghĩa** | Frostpunk: hy vọng (tương lai) và bất mãn (hiện tại) — đầy, cạn cùng lúc được | Bất ổn và thịnh vượng |
| 9 | **Tương tác qua nhãn**, không viết luật cho từng cặp | Divinity: Original Sin 2: lửa + dầu/độc → nổ · nước + điện → điện giật rồi choáng · nước + băng → mặt băng, dễ ngã · lửa + nước → hơi | Hoả công, mưa dập lửa |
| 10 | **Khống chế phải có kháng, giảm dần, giải** | WoW: cùng loại khống chế lần 2 còn ½, lần 3 còn ¼, rồi miễn một lúc · LoL: tenacity, không dưới 0,3 giây · Dota 2: kháng trạng thái, giải thường / giải mạnh | Game có choáng, trói |
| 11 | **Icon vấn đề trên nhà; đỏ = sắp mất** | Cities: Skylines: thiếu thợ, thiếu nguyên liệu, không ai mua; icon đỏ không sửa → bỏ hoang | Kho đầy, thiếu hàng |
| 12 | **Điều khiển gián tiếp cần phản hồi rõ** | Majesty: cờ thưởng tấn công, khám phá; Majesty 2 thêm cờ bảo vệ, cờ sợ hãi | Cho thấy Governor định làm gì |

**Game tự chơi thì trạng thái là cách DUY NHẤT người chơi hiểu vì sao** (Majesty, `quoc-chien`).
Đầu tư vào báo trạng thái lợi hơn đầu tư vào hiệu ứng đẹp.

## 2. Khung dữ liệu chung — học Unreal GAS

Năm khái niệm: **chỉ số** (máu, sĩ khí, lương thực) · **hiệu ứng** (thay chỉ số, có thời hạn) ·
**nhãn** (gắn lên đối tượng khi hiệu ứng còn: `fire`, `wet`, `stunned`) · **kỹ năng** (điều kiện
+ chi phí + hồi chiêu → áp hiệu ứng) · **tín hiệu** (tên cho bộ vẽ, không mang số).

| Trường của hiệu ứng | Nghĩa | Ghi chú |
|---|---|---|
| `kind` | tức thì · có hạn · vĩnh viễn | GAS: Instant / Duration / Infinite |
| `duration` | giây hoặc lượt | |
| `period` | mỗi N giây áp một lần (độc, hồi máu) | Hiệu ứng theo nhịp vừa "gắn" vừa "chạy" |
| `stacking` | không chồng (lấy mạnh hơn) · làm mới thời gian · cộng thời gian · cộng cường độ (có trần) | **Ghi rõ từng hiệu ứng.** Slay the Spire: Dễ tổn thương chồng *thời gian*, mức 50 % cố định |
| `modifiers` | chỉ số nào, cộng hay nhân | Chốt thứ tự: gốc → cộng các "% tăng" với nhau → nhân các "% thêm" (Path of Exile tách *increased* với *more*) |
| `tags` · `blockedBy` | nhãn gắn lên; nhãn chặn | `wet` chặn `burning` |
| `cue` | tên tín hiệu | GAS: có hạn thì bật/tắt, tức thì thì phát một lần; có tuỳ chọn cho lớp chồng thêm không phát lại |

```json
{ "id": "burning", "kind": "duration", "duration": 12, "period": 2, "stacking": "refresh",
  "modifiers": [{ "stat": "hp", "add": -3 }], "tags": ["fire"], "blockedBy": ["wet"], "cue": "burning" }
```

Bảng tín hiệu — **bên vẽ đọc, bên tính không biết**:

```json
{ "burning": { "tint": "#ff8a3c", "particles": "fire_small", "icon": "fire", "sound": "burn_loop" } }
```

Số nằm trong file dữ liệu, không nằm trong mã (`quoc-chien` GAME_SPEC mục 12). Tên trường theo
quy ước từng repo — mẫu trên dùng tên của GAS để dễ tra chéo.

## 3. Mười luật thiết kế trạng thái

1. **Ít mà rõ.** Mỗi trạng thái đúng một icon, một màu, một chuyển động. Hai trạng thái na ná → gộp.
2. **Tốt xanh/lam, xấu đỏ/tím** — và khác cả **hình** (tốt tròn, xấu lục giác) cho người khó
   phân biệt màu; tốt xếp trái, xấu xếp phải.
3. **Chọn chồng thời gian hay chồng cường độ**, ghi ra, cả game theo một kiểu cho cùng loại.
4. **Con số tác động hiện ngay chỗ quyết định**, đã tính sẵn trạng thái (Slay the Spire).
5. **Mọi khống chế có đường ra**: kháng, giảm dần, giải. Dota 2: giải lên đồng minh chỉ xoá cái
   xấu, lên địch chỉ xoá cái tốt.
6. **Báo trước** mọi thứ gây thua (Into the Breach, ý định của Slay the Spire).
7. **Ngưỡng tạo kịch** — tới ngưỡng thì có khoảnh khắc lớn, không chỉ trừ số (Darkest Dungeon).
8. **Tương tác qua nhãn**, không viết luật từng cặp (Divinity 2).
9. **Trạng thái của nhà, thành: chỉ hiện khi kéo dài**; đỏ là sắp mất (Cities: Skylines).
10. **Mỗi trạng thái có tiếng** — tiếng là một nửa cảm giác.

## 4. Ngôn ngữ hình

**Ba nhịp của mọi hiệu ứng:** báo trước → **trúng** (nhiều phần tử nhất, tương phản và bão hoà
cao nhất) → tan (nhạt, mờ, **ngắn** — báo xong là biến, đừng làm rối màn).

**Riot (League of Legends VFX Style Guide):** bốn mục tiêu — rõ luật chơi · bớt rối · hợp chủ đề ·
bất ngờ thú vị. **Phần tử chính**: tương phản cao, viền rõ, đậm, chuyển động mạnh. **Phần tử phụ**:
nhỏ, mờ, nhạt, chuyển động nhẹ. Màu gợi nghĩa (VFX Apprentice): cam là lửa, đỏ là nguy hiểm.

**Khựng khung (hit-stop)** — Sakurai (Smash Bros): cả hai bên khựng một chút khi trúng; đạn khựng
ít hơn đòn gần; **có trần**, đòn mạnh mấy cũng không khựng quá trần; đòn kết liễu thì nên khựng.

**Số bay:** nảy lên; co lại nhưng không nhỏ tới mức không đọc được; hồi máu khác màu, bay chậm
hơn; đừng để ngập "+1".

**Icon trạng thái:** viền rút dần theo thời gian còn lại (xanh tốt, đỏ xấu), số lớp ở góc dưới
phải; số giây đừng to che icon.

**Bảng cách hiện — rẻ trước:**

| Trạng thái | Loại | Hiện ra sao |
|---|---|---|
| Cháy | xấu, theo nhịp | Nhuốm cam nhấp nháy + hạt lửa + khói; icon ngọn lửa |
| Độc | xấu, theo nhịp | Nhuốm xanh lá, bọt nhỏ bay lên |
| Choáng | khống chế | Sao hoặc chim xoay trên đầu, đứng im |
| Chậm, băng | khống chế | Nhuốm lam, hạt tuyết, chuyển động chậm lại thật |
| Khiên | tốt | Vòng mờ quanh người, chớp sáng khi đỡ đòn |
| Nhanh | tốt | Vệt bóng mờ kéo sau lưng |
| Tàng hình | tốt | Trong suốt 30–50 %, méo nhẹ |
| Hồi máu | tốt, theo nhịp | Hạt xanh vàng bay lên, số xanh bay chậm |
| Tháo chạy | xấu | Cờ trắng, chạy ngược, nhạt màu |
| Hăng hái | tốt | Cờ sáng, bụi dưới chân dày |
| Đang xây (nhà) | — | Móng → giàn giáo → xong; xong thì nảy lên + bụi toả |
| Kho đầy / thiếu hàng | xấu | Icon bong bóng trên mái; nhà đứng im, hết khói |
| Cháy nhà | xấu | Lửa + khói đen, nhuốm đỏ; người chạy tới |
| Dịch bệnh | xấu | Nhuốm xanh xám, ít người đi |
| Bất ổn → nổi loạn | xấu, có bậc | Khói đen lác đác → đám đông, cờ → lửa |
| Thịnh vượng, lên bậc | tốt | Lấp lánh vàng, nhà đổi mẫu |

## 5. Kỹ năng mẫu cho game chiến thuật xem được, không điều khiển

| Kỹ năng | Khi nào | Tác dụng | Ba nhịp hình |
|---|---|---|---|
| Bắn loạt | Cung, súng, trong tầm | Sát thương xa; bộ binh địch mất ít sĩ khí | Giương cung → mưa tên vòng cung / khói súng → tên cắm, bụi lắng |
| Xung phong | Kỵ binh có đà | Thưởng ở lần chạm đầu (Total War: chỉ tính khi chạm cận chiến) | Bụi dài → rung màn nhẹ + khựng khung khi chạm → bụi tan |
| Tường khiên | Bộ binh khiên | Giảm sát thương xa | Khiên khép hàng → chớp khi đỡ |
| Pháo kích | Pháo | Nổ vùng, mất nhiều sĩ khí | **Vòng đỏ báo trước** → nổ + chớp sáng + đèn điểm (HD-2D) → khói |
| Hoả công | Có lửa và nhãn `wood`/`oil` | Cháy theo nhịp, lan theo nhãn | Tia lửa → cháy lan → khói đen |
| Phục kích | Rừng | Địch mất sĩ khí khi bị đánh sườn | **Chim bay tán loạn khỏi rừng** (báo trước) → quân lao ra |
| Tập hợp lại | Tướng ở gần | Lính tháo chạy quay lại | Cờ dựng lại + tiếng kèn |

Tên và số là khung — nội dung thật phải nguyên gốc (`quoc-chien` GAME_SPEC mục 12).

## 6. Có sẵn trong kho — dò trước khi tự vẽ

- **Icon kỹ năng, trạng thái:** game-icons.net, **CC-BY 3.0 — phải ghi tác giả** (lorc,
  delapouite…). `node cong-cu/do.mjs <từ> --nguon game-icons`. Dò 30/09: có đủ icon độc, khiên,
  đầu lâu, cờ.
- **Hạt:** Kenney Particle Pack, Smoke Particles (CC0). Nhiều thứ sinh bằng số, không cần ảnh
  (bảng thử trong `DO_HOA.md` mục 1).
- **Tiếng:** `freesound` trong kho (CC0/CC-BY) · `zzfx` (MIT, sinh tiếng bằng số) · `howler` (MIT).
- Từ điển thêm 30/09 để dò bằng tiếng Việt: trạng thái, choáng, chất độc, đám cháy, dịch bệnh,
  nổi loạn, bất ổn, cờ trắng, sĩ khí, làm chậm, tàng hình (hồi máu, mũi tên, tia lửa, biểu tượng có từ trước).

## 7. Cho game khác sau này

Làm theo thứ tự: **khung dữ liệu mục 2** (một lần, dùng mãi) → bảng tín hiệu → mỗi trạng thái
mới chỉ thêm một dòng dữ liệu + một dòng tín hiệu. Game 3D (`tayvuc`): cùng khung, bên vẽ dùng
`three.quarks` (MIT) cho hạt.

## 8. Thử ở `quoc-chien` — anh duyệt cả 3 đợt 30/09

Móc có sẵn trong mã (đọc 30/09, commit `df5a07c`):

| Hệ | Chỗ trong mã | Dùng cho |
|---|---|---|
| Trận: 5 loại cảnh | `src/sim/campaign/BattleScript.ts` — `tien` · `ban` · `giap_la_ca` · `vo` · `ket_thuc` | Gắn tín hiệu hình cho từng cảnh |
| Nhà tắc: kho đầy / thiếu hàng vào | `src/sim/city/City.ts` (bộ đếm `tac`, `day`…), `Cham.ts` (lý do) | Icon trạng thái trên nhà |
| Bất ổn: điểm, yên / nổi loạn / sụp | `src/sim/campaign/BatOn.ts` | Báo trước trong thành phố |
| Hậu quả thẻ quyết định | `src/sim/decision/HauQua.ts` | Xem trước kiểu Reigns |
| Thẻ chính sách | `src/sim/meta/TheChinhSach.ts` | Tách nguồn con số |

| Đợt | Làm | Đo | Lùi |
|---|---|---|---|
| **Thử 1 — thành phố** | Lớp hậu kỳ + khói bếp + chim (chép shader bảng thử) · icon "kho đầy / thiếu hàng" trên nhà, chỉ hiện khi kéo dài | fps iPhone trước/sau (anh đo) · lệnh vẽ ≤ 4 · test: nhà tắc thì có icon | Cờ URL tắt |
| **Thử 2 — trận** | 5 cảnh có tín hiệu: bụi · tên / khói súng · chớp + tia · cờ trắng + nhạt màu · cờ bên thắng; khựng khung ngắn lúc vỡ trận | Chụp từng cảnh · fps | Cờ URL tắt |
| **Thử 3 — dễ chơi** | Bất ổn thấy được trong thành phố trước khi ra thẻ · thẻ quyết định có chấm xem trước · bảng tách nguồn chính sách | Anh chơi thử: có hiểu vì sao thẻ ra không | Cờ URL tắt |

**Luật khi thử:** chỉ ĐỌC số từ mô phỏng, không sửa — kết quả trận, cân bằng giữ nguyên;
`sim:van`, `sim:tran` phải ra y như trước. Mỗi đợt một phiên mở ở `quoc-chien` (hook, thước của
repo đó chỉ chạy khi phiên mở ở đó). Chạy được thì ghi kết quả về mục này.

**Kết quả Thử 1 (30/09, bản `30/09 17:33`):** anh đo iPhone **59 fps cả có lẫn không hiệu ứng**, "nhìn ổn hơn bản
gốc". 3 lệnh vẽ (cảnh + lô hạt + quad hậu kỳ), 0 trang atlas thêm; `sim:van`/`sim:tran` y như trước. Học được:
bộ đếm `tac`/`doi` ở `City.ts` gom **theo loại nhà mỗi giờ** — icon cần 2 số đếm chỉ-đọc **từng nhà** trong `ThuNha`;
chỗ ống khói phải đo trên ảnh chụp (đoán theo khung sprite lệch hẳn); icon SVG nhúng vào gói JS thì khỏi đụng
cấu hình PWA. Chi tiết: `quoc-chien/docs/NHAT_KY/THU_1_30_09.md`.

**Kết quả Thử 2 (30/09, bản `30/09 18:53`):** anh đo iPhone **59 fps cả `?tran=1`, `?tran=2` lẫn `?tat=het`**. 2 lệnh vẽ (cảnh + lô hạt Thử 1), `?tat=het` 1;
0 trang atlas; `sim:van`/`sim:tran` y như trước. Cờ, bụi, khói, chớp sinh bằng shader (kiểu 8 "cờ" trong `Hat.ts`).
Học được: lớp diễn thiếu `doi`/`dang` của từng lính (dáng chỉ nằm trong tên sprite) → thêm 2 trường chỉ-đọc ở
`LinhVe`, không đụng `sim/`; màn dọc zoom vừa khít trận chỉ **0,18×** → cờ phải có cỡ tối thiểu theo điểm CSS;
khựng khung = dừng ĐỒNG HỒ PHÁT ngay tại mốc (không phải dừng vẽ), mỗi bước tối đa một mốc.
Chi tiết: `quoc-chien/docs/NHAT_KY/THU_2_30_09.md`.

**Kết quả Thử 3 (30/09, bản `30/09 20:08`):** anh chơi thử iPhone: **59 fps, "mọi thứ ok"** — hiểu được vì sao thẻ ra. 3 lệnh
vẽ, `?tat=het` 1; 0 trang atlas; `sim:van`/`sim:tran` y như trước. Bất ổn 3 bậc (khói đen ≥ 50 % ngưỡng thẻ → đám đông + cờ
đỏ ≥ 80 % → lửa khi thẻ mở), chữ ⚠ đổi màu theo bậc · chấm Reigns 🏠 📦 ⚙ đọc từ `HauQua` · bảng tách nguồn nghiên cứu, điểm/giờ,
trần nhà/kho. Học được: **đám đông dùng lại sprite người có sẵn**, trộn vào dòng xếp trục sâu thì không đi xuyên nhà, 0 ảnh mới;
chọn nhà theo **tỉ lệ khung** chứ không theo lề cố định (zoom gần là không nhà nào lọt); hạt nhỏ cần **cỡ tối thiểu theo điểm
CSS** (lửa 5 px ở 0,8× là không thấy); tách nguồn chỉ cần 2 getter chỉ-đọc. Chi tiết: `quoc-chien/docs/NHAT_KY/THU_3_30_09.md`.
**Cả 3 đợt thử xong.**

## 9. Nguồn (tra 30/09/2026)

- Unreal GAS: [Gameplay Effects](https://dev.epicgames.com/documentation/en-us/unreal-engine/gameplay-effects-for-the-gameplay-ability-system-in-unreal-engine) ·
  [GASDocumentation](https://github.com/Clubbable/GASDocumentation)
- Slay the Spire: [Intent](https://slay-the-spire.fandom.com/wiki/Intent) · [Vulnerable](https://slaythespire.wiki.gg/wiki/Vulnerable)
- Into the Breach: [Game Developer — Road to the IGF](https://www.gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-) ·
  [GDC Vault — Design Postmortem](https://gdcvault.com/play/1026333/-Into-the-Breach-Design)
- Reigns: [The Sixth Axis](https://www.thesixthaxis.com/2016/08/25/reigns-review/) ·
  [Android Central — cỡ chấm là mức đổi](https://www.androidcentral.com/reigns-beginners-guide)
- Crusader Kings 3: [Dev Diary #16](https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/) ·
  [Tooltips in tooltips](https://philip.design/blog/tooltips-in-tooltips/)
- Total War: [Morale](https://totalwar.fandom.com/wiki/Morale) ·
  [Shogun 2 Encyclopedia](https://shogun2-encyclopedia.com/how_to_play/052_enc_manual_battle_conflict_morale.html)
- Darkest Dungeon: [Game Developer — Affliction System](https://www.gamedeveloper.com/design/game-design-deep-dive-i-darkest-dungeon-s-i-affliction-system)
- Frostpunk: [PC Gamer — hope, misery](https://www.pcgamer.com/frostpunk-developers-on-hope-misery-and-the-ultimately-terrifying-book-of-laws/)
- Divinity: Original Sin 2: [Environmental Effects](https://divinityoriginalsin2.wiki.fextralife.com/Environmental+Effects)
- Khống chế: [WoW — Diminishing returns](https://warcraft.wiki.gg/wiki/Diminishing_returns) ·
  [LoL — Tenacity](https://leagueoflegends.fandom.com/wiki/Tenacity) · [Dota 2 — Dispel](https://liquipedia.net/dota2/Dispel)
- Cities: Skylines: [Notifications](https://skylines.paradoxwikis.com/Notifications)
- Majesty: [Indirect Control](https://majesty2.fandom.com/wiki/Indirect_Control)
- VFX: [League VFX Style Guide](https://nexus.leagueoflegends.com/en-us/2017/10/dev-leagues-vfx-style-guide/) ·
  [VFX Apprentice — timing](https://www.vfxapprentice.com/blog/the-soul-of-effects-what-is-timing-in-vfx) ·
  [80.lv — shape, color, motion](https://80.lv/articles/vfx-staples-shape-color-and-motion)
- Hit-stop: [Sakurai — Thinking About Hitstop](https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/)
- Số bay, icon: [Damage numbers in RPGs](https://shweep.medium.com/damage-numbers-in-rpgs-1f0e3b1bc23a) ·
  [Last Epoch — buff indicators](https://forum.lastepoch.com/t/lets-talk-buff-and-debuff-visual-indicators/15301)

Phần lớn nguồn trên đọc qua `WebSearch` (tóm tắt), chưa mở trọn từng trang.
