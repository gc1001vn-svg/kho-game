# ĐỒ HOẠ — học từ game 3D và 2D giả 3D

> Tra 30/09/2026, dùng cho **mọi dự án game**. Đọc trước khi làm hiệu ứng, hậu kỳ, chuyển động.
> Phong cách, màu, đèn nướng của `quoc-chien` đã chốt ở `quoc-chien/docs/ART_BIBLE.md` — file
> này **không lặp lại**; nó nói **kỹ thuật**: làm sao cho cảnh sống, có chiều sâu, bấm thấy
> sướng tay. Ảnh game thương mại **không lên repo** (repo công khai) — chỉ để link.
> **Kỹ năng, trạng thái** (luật chơi + cách báo cho người chơi): `KY_NANG_TRANG_THAI.md`.

## 1. `quoc-chien` 30/09 — vì sao "chán"

Chụp máy ảo bản `30/09 11:23`: `?me=co_dai` (zoom 0,6 và 1,6), `?me=tuong_lai`, `?man=ban-do`,
`?tran=1`. Sáu điều, **xếp theo mức gây chán**:

1. **Lặp một mẫu.** Gần như mọi nhà ở màn cổ đại là **cùng một model, cùng hướng**, đứng thành
   lưới đều → nhìn như giấy dán tường. Art bible có luật bậc nhà (luật 10) nhưng **chưa luật
   nào cấm hai nhà cạnh nhau giống hệt**.
2. **Nền bàn cờ.** Ô cỏ sáng/tối xen nhau, ô sỏi lốm đốm, đường là dải sỏi thẳng → nền giành mắt
   với nhà (art bible luật 7 đã ghi, chưa sửa).
3. **Không địa hình, không điểm nhấn.** Phẳng tuyệt đối: không sông, đồi, rừng, bờ biển, không
   công trình cao làm mốc cho mắt dừng.
4. **Không gì động ngoài người đi.** Không khói, mây, chim, nước, cây lay.
5. **Không hậu kỳ.** Shader mảnh chỉ lấy màu atlas + chớp sáng lúc lên đời (`src/render/Shader.ts`).
6. **Màn trận trống nhất.** Tấm cỏ phẳng trên nền đen, lính là chấm ở zoom 0,37; không bụi, tên
   bay, khói súng, địa hình.

**Nói thẳng:** hiệu ứng (mục 3) là **lớp phủ** — làm cảnh sống hơn nhưng không chữa được 1–3.
Giữ lưới nhà giống hệt mà thêm hiệu ứng thì vẫn là giấy dán tường, chỉ là có khói.

**Đề xuất thứ tự (CHƯA DUYỆT — anh chốt):**

| Bậc | Việc | Vì sao ở bậc này |
|---|---|---|
| 1 | Hậu kỳ: chỉnh màu + viền tối + mây trôi + tilt-shift nhẹ · khói bếp · chim và bóng chim | Không nướng lại, không đụng atlas — thấy ngay |
| 2 | **Sửa gốc**: biến thể nhà (mục 3 #1), nền liền (#2), địa hình và điểm nhấn | Chữa 1–3; cần anh chốt art bible bước 2–3 và nướng lại |
| 3 | Sống động: cây lay, cối xay quay, nước động · juice khi xây, thu, lên đời | Cần thêm thuộc tính đỉnh, sprite khung động |
| 4 | Ngày/đêm + đèn (lightmap) · thời tiết | Thêm một FBO |
| 5 | Normal map + đèn động | Đắt nhất: atlas gấp đôi, vượt trần 4 trang |
| — | Màn trận: địa hình, bụi hành quân, tên bay/khói súng, rung màn khi pháo nổ | Đi cùng bậc 1–3, đúng hướng mốc E (bản đồ giấy) |

**Bảng thử hiệu ứng** (30/09): https://claude.ai/artifact/GjetBjmjHyW6x6dejA1iGh — ảnh chụp thật màn
cổ đại, bật/tắt chỉnh màu, tilt-shift, mây, khói, chim, lá, đêm + đèn, mưa, sương, bloom; kéo
thanh để so với ảnh gốc. Riêng tư: chủ dự án mở được; phiên sau đọc mã bằng tool `Artifact`
(`action: read`). Shader viết **GLSL ES 1.0** như bộ vẽ `quoc-chien` — chép sang được: lượt hậu
kỳ (tilt-shift, bloom, chỉnh màu, viền tối) · lượt cảnh (mây, lightmap đêm, sương, mưa) · hạt
khói/lá/chim/mưa sinh hình bằng số, không cần ảnh. Chỗ ống khói, cửa sổ trong bảng **đo trên
ảnh chụp**, vào game thì lấy từ toạ độ nhà.

## 2. Năm cách làm "2D giả 3D" — ai làm, lấy gì

| Cách | Game | Làm thế nào | Với `quoc-chien` |
|---|---|---|---|
| **Nướng sprite từ model 3D** | Age of Empires II DE, Factorio, StarCraft | Dựng 3D, chụp góc cố định thành ảnh phẳng. Factorio ghép **nhiều lớp** mỗi vật, và sửa mặt nạ tay (Multiply/Screen) để **tăng tương phản, rõ mép** | **Đang làm** (`tools/nuong_sprite.mjs`). Học Factorio: tách lớp thân · bóng · phần động · đèn thay vì một ảnh |
| **Nướng thêm normal map / depth** | Dead Cells: mỗi khung một PNG + normal map, tô bằng toon shader; nhân vật trong game cao ~50 px. Pillars of Eternity: cảnh nướng 4 lớp final · depth · normal · albedo | Đèn động chiếu lên ảnh phẳng (đuốc, nổ, ngày/đêm); depth để vật động khuất đúng sau ảnh | Bậc 5 — đắt nhất |
| **HD-2D** | Octopath Traveler I–II, Triangle Strategy (Square Enix, Unreal Engine) | Sprite 2D đứng trong cảnh 3D + **tilt-shift** + **bloom** + **bật đèn điểm cùng lúc với hiệu ứng** để nhân vật đổ bóng lên cảnh → cảm giác sa bàn | Lấy **hậu kỳ** và đèn điểm khi nổ, không lấy cảnh 3D |
| **Pixel 2.5D** | Songs of Conquest (Unity) | Sprite pixel vẽ tay trên địa hình 3D; shader đèn hướng, **phản chiếu trên nước**, hạt sương/tia lửa/bụi, bloom mềm | Art bible cấm pixel art → chỉ lấy shader nước và hạt |
| **3D thật, phong cách hoá** | Townscaper: viền = lưới phóng to, chỉ thấy mặt sau. Tiny Glade: chiếu sáng toàn cục dò tia bằng phần mềm | Model low-poly + AO + viền + đèn toàn cục | Dành cho game 3D (mục 6) |

Chung một điều: **game nào cũng có địa hình và công trình khác nhau trước, hiệu ứng sau.**

## 3. Bảng hiệu ứng cho game 2D isometric chạy iPhone

Tốn máy: **rẻ** = vài phép tính mỗi điểm ảnh, không thêm lệnh vẽ · **vừa** = thêm một lượt vẽ
toàn màn hoặc một lô · **đắt** = đổi cách nướng, hoặc đọc nhiều ảnh mỗi điểm.

| # | Hiệu ứng | Nhìn ra sao | Game mẫu | Tốn | Cách làm |
|---|---|---|---|---|---|
| 1 | **Biến thể công trình** | Nhà cạnh nhau khác mái, khác màu, lật gương, khác bậc | Rise of Nations — thiếu chỗ thì đổi mái và màu trước, đổi model sau (art bible mục 7) | rẻ | Chọn biến thể theo băm toạ độ ô; lật gương = đảo `u` trong đỉnh; màu mái = nướng thêm biến thể |
| 2 | **Nền liền, mép mềm** | Cỏ một tông, chuyển sang đất/sỏi bằng mép loang | mọi city builder | rẻ | Ô chuyển tiếp (autotile 16 hoặc 47 ô) hoặc trộn 2 hoạ tiết theo mặt nạ; hạ tương phản giữa các ô |
| 3 | **Chỉnh màu (LUT) + viền tối** | Cả cảnh một không khí: sáng ấm, bóng hơi lạnh; mép màn tối dần kéo mắt vào giữa | gần như mọi game thương mại | vừa | Vẽ cảnh vào FBO → một quad toàn màn tra bảng màu 3D. Đổi LUT = đổi giờ trong ngày, đổi đời |
| 4 | **Tilt-shift (sa bàn)** | Nhoè trên và dưới, nét ở giữa → não đọc thành mô hình thu nhỏ | SimCity (2013); Cities: Skylines (mục "Legacy" trong Depth of Field); HD-2D | vừa | Độ nhoè tăng theo khoảng cách tới dải nét; đọc 16–32 điểm/điểm ảnh → trên iPhone làm ở **nửa độ phân giải** |
| 5 | **Bóng mây trôi** | Mảng tối mềm lướt qua thành phố | có mẫu sẵn ở Godot, Unity | rẻ | Nhiễu cuộn theo thời gian, nhân tối ~20–40 % — gộp chung lượt #3 |
| 6 | **Khói, lửa, bụi (hạt)** | Khói bếp, lò rèn, bụi khi xây | Factorio, city builder di động | rẻ–vừa | Hạt thường: sprite trong cùng atlas, cùng lô → **0 lệnh vẽ thêm**. Hạt cộng sáng (lửa, đèn): lô riêng |
| 7 | **Cây lay gió** | Ngọn cây, cỏ, cờ đung đưa | có mẫu sẵn ở Godot, Unity | rẻ | Shader đỉnh: 2 đỉnh trên của sprite lệch theo `sin(thời gian + vị trí)`; cần 1 thuộc tính đỉnh "độ mềm" |
| 8 | **Ngày/đêm + đèn** | Đêm xanh sẫm, cửa sổ vàng ấm, quầng đèn loang xuống đất | Stardew Valley | vừa | **Lightmap**: FBO tô màu môi trường, cộng quad đèn tròn mềm, nhân vào cảnh (`SimpleLightmapFilter` của pixi-filters làm đúng thế) |
| 9 | **Nước động** | Sông gợn, bọt ở bờ, phản chiếu | Songs of Conquest, Kingdom Two Crowns | vừa | UV méo theo nhiễu + dải bọt theo khoảng cách tới bờ; phản chiếu = lật ảnh + méo (`ReflectionFilter`) |
| 10 | **Thời tiết** | Mưa, tuyết, lá rơi, sương sớm | — | rẻ | Hạt phủ màn hình + chỉnh màu #3 |
| 11 | **Độ sướng tay (juice)** | Nhà nảy lên khi xây xong, bụi toả, số bay lên khi thu, chớp khi lên đời, rung màn khi pháo nổ, khựng khung khi trúng | "Juice it or lose it" (GDC 2012); "The Art of Screenshake" (INDIGO Classes 2013, 30 chỉnh nhỏ) | rẻ | Chỉ là đổi toạ độ, cỡ, màu theo đường cong mượt (easing) — không cần asset |
| 12 | **Bloom** | Chỗ sáng nhất toả quầng | HD-2D, Songs of Conquest | vừa | Lọc phần sáng → làm mờ ở ½ hoặc ¼ độ phân giải → cộng lại. Dùng ít: đèn đêm, lửa, phép |
| 13 | **Viền chọn** | Nhà/lính đang chọn có viền sáng | mọi RTS | rẻ | Đọc 4–8 điểm alpha xung quanh → viền; chỉ bật cho sprite đang chọn |
| 14 | **Normal map + đèn động** | Đuốc, nổ chiếu sáng thật lên tường, bóng đổi theo giờ | Dead Cells, Pillars of Eternity | đắt | Nướng thêm atlas normal cùng chỗ xếp; shader đọc 2 ảnh mỗi điểm |

**Liều lượng:** một bài hướng dẫn city builder isometric khuyên **3–5 chi tiết động mỗi khu
phố** là đủ thấy "sống"; nhiều hơn thành rối (Sunstrike Studios, mục 7).

## 4. Gắn vào bộ vẽ tự viết của `quoc-chien`

Hiện trạng (`TECH_SPEC.md` mục 2, 4): **1 lệnh vẽ** cho cả thành phố, trần **4 lệnh vẽ** và
**4 trang atlas**, vẽ theo thứ tự sâu, không depth buffer, **không thư viện ngoài**.

| Việc | Đụng chỗ nào | Lệnh vẽ thêm |
|---|---|---|
| Hậu kỳ #3 #4 #5 #12 | Vẽ cảnh vào FBO, thêm một quad toàn màn (`Gl.ts` + shader mới) | +1 |
| Lightmap #8 | Thêm một FBO đèn | +1 nữa |
| Hạt thường #6 #10 | Sprite hạt vào atlas, sinh trong lô chung | 0 — nhưng **tính chỗ atlas trước**: mẻ trung cổ 2× đã hết chỗ |
| Hạt cộng sáng, đèn | Lô riêng, `blendFunc(ONE, ONE)` | +1 |
| Cây lay #7 | Thêm thuộc tính đỉnh ở `Gl.ts`, sửa `MA_DINH` trong `Shader.ts` | 0 |
| Juice #11 | Mô phỏng không đổi; lớp vẽ nội suy toạ độ, cỡ theo thời gian (luật 1 TECH_SPEC: mô phỏng tách khỏi vẽ) | 0 |
| Normal map #14 | `tools/lib/trang_nuong.js` xuất thêm lớp normal; số trang atlas gấp đôi → **vượt trần 4 trang** | 0, nhưng phải xin nới trần |

**iPhone:** màn dọc 1179×2556 là ~3 triệu điểm ảnh. Một lượt toàn màn đọc một ảnh thì nhẹ; làm
mờ (tilt-shift, bloom) đọc hàng chục ảnh mỗi điểm → làm ở ½ hoặc ¼ độ phân giải rồi phóng lên.
**Chưa đo trên iPhone** — đo fps trước/sau như Phase 0 rồi mới chốt.

**Mã để học (MIT — chép thì ghi công):** `pixijs/filters` — `TiltShiftFilter`,
`AdvancedBloomFilter`, `ColorMapFilter` (LUT), `SimpleLightmapFilter`, `ReflectionFilter`,
`GodrayFilter` · three.js `examples/jsm/shaders` — `HorizontalTiltShiftShader`,
`VerticalTiltShiftShader`. Cài thư viện vào game vẫn phải hỏi chủ dự án (`TECH_SPEC.md` mục 9).

## 5. Asset hiệu ứng — dò trước khi tự vẽ

Phần lớn mục 3 **sinh bằng shader, không cần asset**: mây, sương, mưa, lá, đèn, viền, juice.
Cần ảnh thì dò `node cong-cu/do.mjs <từ>` với `smoke` `fire` `explosion` `cloud` `bird` `rain`
`water` `hiệu_ứng` — **đừng chép số trúng vào đây**.

Thấy 30/09: Kenney **Particle Pack** và **Smoke Particles** (CC0) · Golgotha Effects Textures
(`2d-assets`, CC0) · OpenGameArt nhiều gói khói, nổ — **lọc CC0/CC-BY, bỏ pixel art** (art bible
cấm) · `three.quarks` (MIT) chỉ dùng được với three.js.

## 6. Cho game 3D (`tayvuc`) sau này

Danh sách mục 3 vẫn đúng, làm trên cảnh 3D: AO (nướng sẵn hoặc SSAO) · viền lưới phóng to kiểu
Townscaper · độ sâu trường ảnh · bloom · hạt `three.quarks` · hậu kỳ `postprocessing` (Zlib —
license thư viện mã kho nhận, `CLAUDE.md` luật 3; cài vào game vẫn hỏi anh). Tiny Glade là **trần** của đèn toàn cục, không phải mốc cho iPhone.

## 7. Nguồn (tra 30/09/2026)

- HD-2D: [Wikipedia](https://en.wikipedia.org/wiki/HD-2D) ·
  [Unreal — Octopath Traveler](https://www.unrealengine.com/spotlights/octopath-traveler-s-hd-2d-art-style-and-story-make-for-a-jrpg-dream-come-true) ·
  [Unreal — Octopath Traveler II](https://www.unrealengine.com/en-US/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style)
- Dead Cells: [Game Developer — 3D pipeline for 2D animation](https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-)
- Pillars of Eternity: [Update #79 — Graphics and Rendering](https://eternity.obsidian.net/eternity/news/update--79-graphics-and-rendering-) ·
  [Projection Space](https://projectionspace.wordpress.com/2016/05/06/pillars-of-eternitys-rendering-techniques/)
- Factorio: [FFF #146 — The GFX workflow](https://factorio.com/blog/post/fff-146)
- Age of Empires II DE: [ageofempires.com — 3D hay 2D](https://www.ageofempires.com/news/age-empires-definitive-edition-3d-2d-game/)
- Songs of Conquest: [Steam — the evolution of our artstyle](https://store.steampowered.com/news/app/867210/view/3222896627775797950) ·
  [80.lv — 2D billboards trong môi trường 3D](https://80.lv/articles/mixing-2d-billboards-and-3d-environments-in-a-game)
- Townscaper trên WebGL: [reindernijhoff.net](https://reindernijhoff.net/2021/11/townscapers-rendering-style-in-webgl/) ·
  Tiny Glade: [Wikipedia](https://en.wikipedia.org/wiki/Tiny_Glade)
- Tilt-shift: [Miniature faking](https://en.wikipedia.org/wiki/Miniature_faking) ·
  [Cities: Skylines — Tilt Shift thành Depth of Field](https://steamcommunity.com/app/255710/discussions/0/483366528918058758/)
- Juice: [Juice it or lose it](https://roblog.co.uk/2024/03/juicy-games/) ·
  [The Art of Screenshake](https://www.youtube.com/watch?v=AJdEqssNZ-U)
- City builder: [Sunstrike Studios — isometric city builder art](https://sunstrikestudios.com/en/blog/isometric-city-builder-art/)
- Shader mẫu: [pixijs/filters](https://github.com/pixijs/filters) ·
  [three.js shaders](https://github.com/mrdoob/three.js/tree/master/examples/jsm/shaders) ·
  [Godot — 2D wind sway](https://godotshaders.com/shader/2d-wind-sway/) ·
  [Godot — cloud shadows](https://godotshaders.com/shader/topdown-game-2d-cloud-shader/)

**Máy ảo 30/09:** `WebFetch` bị chặn ở `unrealengine.com`, `reindernijhoff.net`,
`sunstrikestudios.com` — nội dung ba nguồn đó lấy qua `WebSearch`, chưa đọc trọn trang.
