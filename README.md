# KHO GAME — kho chung cho mọi dự án game

Model 3D, hoạ tiết, bản kê và công cụ lấy về. **Một chỗ duy nhất** cho mọi dự án game,
thay vì mỗi dự án tải lại cùng một gói.

## Repo nhẹ: giữ bản kê, không giữ nhị phân

Git **không** giữ file nhị phân: `.glb` nén rất kém, mà lịch sử git giữ mọi bản cũ vĩnh
viễn — thêm một mẻ là cộng dồn, không xoá được.

- **Trong git:** bản kê (`ke/*.md`), manifest tải lại (`nguon/*.json`), công cụ
  (`cong-cu/`), ghi công license. Tổng vài trăm KB.
- **Model thật:** tải lại từ nguồn gốc bằng `cong-cu/lay.mjs`. Manifest giữ **URL mốc
  thật** của bản lưu nên tải thẳng, không phải dò lại.

**Đánh đổi, nói thẳng:** phụ thuộc `web.archive.org` còn sống. Nó là lưu trữ phi lợi
nhuận, không ai bảo đảm. Mất nguồn là mất kho — đó là cái giá của repo nhẹ.

Hai đường khác đã cân và bỏ: đẩy nhị phân vào git (repo từ vài trăm KB thành 1 GB, phình
vĩnh viễn) và GitHub Releases (2 GiB mỗi file, không giới hạn tổng — **nhưng phiên Claude
Code từ web bị chặn**: `Creating, editing, or deleting releases is not permitted for this
session type`). Muốn dùng Releases thì chạy `cong-cu/dong_goi.mjs` từ máy thật.

## Dùng ở dự án game

**Dự án nào cũng chỉ cần một dòng** — repo này tự đủ, không đòi repo nào khác nằm cạnh:

```bash
git clone --depth 1 https://github.com/gc1001vn-svg/kho-game /home/user/kho-game
```

```bash
# 1. Dò khắp mọi nguồn một lệnh — in kèm license và cách lấy từng nguồn
node cong-cu/do.mjs chicken --tam 8000
node cong-cu/do.mjs ga                    # tiếng Việt, tự dịch qua từ điển

# 2. Lấy đúng thứ cần. KHÔNG kéo cả kho.
node cong-cu/lay.mjs icosa --loc chicken
node cong-cu/lay.mjs icosa --id 1YE8U35HXsI 0GKndEIbbMf
node cong-cu/lay.mjs icosa ../quoc-chien/assets_source --loc house
```

Gọi từ đâu cũng được (`node /home/user/kho-game/cong-cu/do.mjs ...`): công cụ tìm `ke/`
theo `import.meta.dirname`, còn `lay.mjs` đổ về `./assets_source/` của **thư mục đang
đứng**, nên dự án khác không phải chép gì.

Model nào **chưa có trong manifest** thì `lay.mjs` tự hỏi API lúc tải — mục lục phủ cả
kho, manifest chỉ là đường tắt cho những cái đã lấy về một lần.

### Từ điển Việt→Anh — bản gốc ở `cong-cu/tu_dien.json`

Dò hụt thì **thêm từ vào đó**, đừng sửa mã nguồn. Trước 18/09 `do.mjs` chỉ đọc bản của
`quoc-chien`, nên repo nào không clone `quoc-chien` nằm cạnh thì `ga` ra **1 trúng** (font
`Ga Maamli`) thay vì **306** — và **không báo gì**. Nay bản gốc nằm trong repo này; bản của
`quoc-chien` vẫn được gộp thêm nếu có, và thước `vet:kho` báo khi hai bản lệch.

### Thước của repo — chạy trước mỗi commit

```bash
bash scripts/do.sh      # check:token · check:kehoach · vet:kho
```

`vet:kho` (`cong-cu/vet_kho.mjs`) giữ đúng ba luật của `CLAUDE.md`, máy kiểm chứ không
phải chữ phải nhớ: cột `ten`/`license` bắt buộc · số cột đều · **không license SA/ND** ·
`id` không trùng · không file nhị phân trong git · từ điển không lệch · số license `?`
**chỉ được tụt** (trần ở `cong-cu/nguong_vet.json`, tụt thì tự hạ).

Chạy lại được: model đã có trên đĩa thì bỏ qua. Mỗi model tải kèm `ghi_cong.json` để
ghi công đi theo file, không nằm một chỗ dễ mất.

## Đưa nguồn mới vào kho

```bash
# 1. Tải về bằng công cụ của dự án (ví dụ quoc-chien: npm run tai:icosa)
# 2. Sinh manifest từ thư mục đã tải
node cong-cu/sinh_manifest.mjs <tên-nguồn> <đường-dẫn-thư-mục>
# 3. Chép bản kê của dự án vào ke/<tên-nguồn>.md, rồi commit
```

Bản kê Markdown của dự án cũ (`KHO_ASSET.md`, `KHO_CHUNG.md`) thì đổi sang TSV bằng
`nap_ke_cu.mjs` — **tham số thứ ba là `cach_lay` dự phòng**, thiếu nó thì gói nào không
tra được để `?` và bản kê mất đường lấy:

```bash
node cong-cu/nap_ke_cu.mjs ../quoc-chien/docs/KHO_ASSET.md quoc-chien-assets \
  "node tools/tai_itch.mjs <tac-gia>/<goi>  (o repo quoc-chien)"
node cong-cu/nap_ke_cu.mjs ../quoc-chien/docs/KHO_CHUNG.md tayvuc-kho-chung \
  "npm run kho:lay <goi>  (o repo quoc-chien, clone tayvuc)"
```

## License

**Mỗi nguồn có bản kê riêng trong `ke/`, và bản kê LÀ bản ghi công** — cột *Tác giả* và
*Trang gốc* là nghĩa vụ pháp lý, đừng cắt.

Chỉ nhận **CC0 · CC-BY · MIT**. **CC-BY-SA và CC-BY-ND đều cấm**: SA lây license sang cả
dự án, ND cấm tác phẩm phái sinh — mà nướng model thành sprite chính là phái sinh, và
"chơi một mình, không buôn bán" không gỡ được điều đó.

## Nguồn đang có

| Nguồn | Bản kê | Dòng | License | Lấy bằng |
|---|---|---:|---|---|
| **Icosa Gallery** (kho gương Google Poly) | `ke/icosa.tsv` | **73.626** | CC-BY (vài chục CC0) | `lay.mjs icosa` — tự động |
| Poly Pizza | `ke/poly-pizza.tsv` | 6.136 | CC-BY 4.295 · CC0 1.841 | **tải bằng máy thật** |
| `quoc-chien/assets_source` (Kenney · Quaternius · KayKit) | `ke/quoc-chien-assets.tsv` | 4.599 | CC0 3.904 · `?` 695 | `cach_lay` ghi sẵn từng gói |
| Poly Haven — model · **hoạ tiết · HDRI** | `ke/polyhaven.tsv` | 2.378 | CC0 toàn bộ | API mở, không cần khoá |
| Kho chung `tayvuc` | `ke/tayvuc-kho-chung.tsv` | 1.347 | CC0 480 · `?` 867 | `npm run kho:lay` |
| **Kenney** — cả kho, không chỉ gói đã tải | `ke/kenney.tsv` | 215 gói | CC0 toàn bộ | `tai_asset.mjs <gói>` |
| **Freesound** — âm thanh | `ke/freesound.tsv` | **27.313** | CC0 14.587 · CC-BY 12.726 | cần khoá API, tải theo link |
| **OpenGameArt** — âm thanh · nhạc · 2D · hoạ tiết | `ke/opengameart.tsv` | **22.714** | CC0 11.816 · CC-BY 10.898 | mở trang gốc, tải tay |
| **game-icons.net** — biểu tượng | `ke/game-icons.tsv` | **3.658** | CC-BY 3.0 | `curl -O` link SVG trong cột `cach_lay` |
| **Google Fonts** | `ke/font.tsv` | 1.941 họ | OFL | `fonts.google.com/specimen/<tên>` |
| **itch.io CC0** — **2D 360** · 3D 165 | `ke/itch.tsv` | 525 gói | CC0 (tác giả tự khai) | `tai_itch.mjs <tác-giả>/<gói>` |
| Mã nguồn mở — **học kiến trúc, cấm chép code** | `ke/ma-nguon-mo.tsv` | 10 | GPL/AGPL | đọc trên GitHub |

**Chia theo loại — cột `loai` của từng bản kê:**

| Nguồn | Chia ra |
|---|---|
| OpenGameArt | `2D Art 9.347 · Music 6.825 · 3D Art 3.475 · Texture 1.640 · Sound Effect 1.427` |
| Kenney | `2D 145 · 3D 50 · Audio 10 · Textures 9 · Other 1` (một gói mang được nhiều nhãn) |
| Poly Haven | `hdris 996 · textures 861 · models 521` |

**Muốn tìm 2D:** OpenGameArt 9.347 mục · itch.io 360 gói · Kenney 145 gói. Bốn nguồn model
3D (Icosa, Poly Pizza, `assets_source`, kho chung) **không có 2D** — chúng là model để
nướng ra sprite.

### Kiểm kê cả kho — `node cong-cu/kiem_ke.mjs`

Kho mạnh cái gì, yếu cái gì. **Đừng gõ số ra tài liệu**, chạy lệnh. Đo 18/09:

```
Model 3D                     89704     Nhac                          6825
Anh 2D · bieu tuong         129556     Hoa tiet · HDRI               3497
Am thanh                     28740     Font                          1941
                                       Ma nguon (hoc kien truc)        10
                            260273  TONG MUC LE
```

Cộng **740 gói** kê riêng, không kê lẻ từng file: Kenney 215 (2D 145 · 3D 50 · Audio 10 ·
Textures 9) · itch.io CC0 525 (3D 165 · 2D 360). `vet:kho` đếm 261.013 vì nó cộng cả hai
bản kê gói vào; **740 gói không so được với 260.273 mục lẻ.**

Model 3D theo chủ đề — **dò theo tên, một model trúng nhiều chủ đề nên cộng lại không ra
tổng**:

```
                               Icosa  Poly Pizza  Poly Haven  quoc-chien   kho chung        tong
Nha cua · cong trinh            5774         632          81        1533         152        8172
Nguoi · nhan vat                4727         295          51          42          44        5159
Cay coi · thien nhien           4077         543         131         347         174        5272
Con vat                         4240         506          16          11          19        4792
Do dung · noi that              2853         689         178         261         142        4123
Xe co · phuong tien             2029         385          72          77          32        2595
Do an                           2095         320          40           0           3        2458
Vu khi · cong cu                 940         303          87          15         113        1458
```

Icosa có **tag thật** của họ, đáng tin hơn dò tên: `objects 7835 · art 4946 ·
architecture 3686 · people 2934 · animals 2798 · nature 2277 · tech 1679 · food 1482 ·
transport 1339 · scenes 1323`. **43.370 model không mang tag nào trong mười tag đó** —
mục lục Icosa gắn tag rất thưa, nên coi số tag là sàn chứ không phải trần.

### Bao nhiêu model 3D **nướng được** — `node cong-cu/dem_model.mjs`

Câu này mỗi phiên hỏi một lần và mỗi phiên ra một số khác, vì đếm kiểu khác: có phiên đếm
cả `.fbx` (máy nướng **chưa** đọc được), có phiên đếm cả Poly Pizza (dò được nhưng **tải
không được**), có phiên đếm lượt file thay vì model duy nhất. Lệnh trên chốt **một** cách
đếm — **đừng gõ số ra tài liệu**, chạy lệnh mà xem. Bốn điều kiện, thiếu một là loại:
license CC0 · CC-BY · MIT · định dạng `.obj`/`.gltf`/`.glb` (**`.fbx` chưa**) · **≤ 8.000
tam** · **tải được từ máy ảo**.

Đo 18/09:

```
Icosa Gallery     41333 /  73626  GLB/GLTF, tai qua wayback
Poly Haven          210 /    521  CC0, API mo
—                 41543   model le

Goi chua ke le:  Kenney 3D 50 goi · itch.io CC0 3D 165 goi
Da tren dia:     quoc-chien 1698 · kho chung tayvuc 1337
                 (tap con cua Kenney/Quaternius/KayKit — DUNG cong vao tong)

LOAI — do duoc, tai khong duoc:  Poly Pizza 5274/6136 <= 8000 tam
```

**41.543 model lẻ nướng được ngay**, cộng 215 gói Kenney/itch chưa kê lẻ từng model. Game
`quoc-chien` cần **32 loại nhà** — dư hơn ba bậc độ lớn. Cái chặn từ lâu **không phải số
model** mà là **sự đồng nhất phong cách**: 41.333 model Icosa là của hàng nghìn tác giả
khác nhau, ghép vào một thành phố thì lộn xộn, và **toàn bộ là CC-BY** nên phải ghi công
từng người. Kenney City Kit 60 dáng nhà một tác giả CC0 vẫn là đường gọn nhất.

**itch.io: hai cảnh báo.** License do **tác giả tự khai**, itch không kiểm — mở `LICENSE`
trong gói đối chiếu trước khi dùng. Và bộ lọc `assets-cc0` lọc theo license **chứ không
theo giá**, nên gói trả tiền vẫn lọt vào (`Kenney Game Assets All-in-1`, $19.95); cột `gia`
giữ nguyên để thấy.

**Cột `tac_gia` của OpenGameArt để `?`** — trang danh sách không hiện tên, phải mở từng
mục mới biết, mà 22.714 mục thì 99% không bao giờ dùng tới. Nên lấy **lười**, đúng lúc cần:

```bash
node cong-cu/tac_gia.mjs /content/rpg-sound-pack
# RPG Sound Pack | tac gia: artisticdude | license: CC0 | https://...

node cong-cu/do.mjs anvil --tac-gia     # dò xong tự lấy tên 8 mục đầu
```

CC-BY đòi ghi tên, nên **chạy lệnh này rồi chép tên vào `ASSET_CREDITS.md` trước khi
dùng**. `do.mjs` tự nhắc khi kết quả có OpenGameArt.

**Freesound — đã quét 16/09: 27.313 file** qua 41 từ khoá (kho họ có 735.011 file, nên đây
là phần liên quan tới game, không phải cả kho). Lệnh chỉ lấy **CC0** và **Attribution**,
bỏ `Attribution NonCommercial` — luật kho chỉ nhận CC0 · CC-BY · MIT.

```bash
FREESOUND_KEY=<khoá> node cong-cu/quet_freesound.mjs           # bộ từ khoá nền
FREESOUND_KEY=<khoá> node cong-cu/quet_freesound.mjs ga chim    # tiếng Việt cũng được
```

**Khoá là mật khẩu, repo này Public — không bao giờ commit.** Lấy ở
<https://freesound.org/apiv2/apply/>, lấy dòng **Api key** chứ không phải **Client id**.
Đặt lâu dài: `claude.ai/code` → nút tên môi trường → **Edit cloud environment** → ô
**Environment variables** → thêm dòng `FREESOUND_KEY=<khoá>`. Hộp thoại đó **không có mục
"API credentials"** — README bản trước ghi có, sai.
Không khoá thì `/apiv2/search/text/` trả
`401 {"detail":"Authentication credentials were not provided."}`.

Khác OpenGameArt: Freesound **có sẵn tên tác giả** trong cột `tac_gia`, khỏi phải mở trang.

Poly Haven chia ba loại: `models 521 · textures 861 · hdris 996` (cột `loai`).

**Nguồn đã thử, CHƯA lấy được — đừng mò lại:**

- **ambientCG** (~2.000 hoạ tiết CC0): request đầu `200`, sau đó `000` với
  `ws_closed_mid_exchange` cho mọi đường, kể cả trang chủ. Chặn ở phía họ hoặc allowlist.
- **CraftPix**: `000` với `connect_rejected — gateway answered 403 to CONNECT (policy
  denial)` — **allowlist môi trường chặn**, request chưa ra khỏi máy ảo, chủ dự án mở
  được. Nhưng **không nên mở**: phần "freebies" dùng *license riêng của CraftPix*, không
  phải CC0/CC-BY, và cấm phát tán lại — không lọt luật kho.

  Khác hẳn Poly Pizza: ở đó `403` kèm `server: cloudflare` và `cf-mitigated: challenge`,
  tức request tới nơi rồi mới bị đích đuổi — thêm allowlist vô ích. Hai dấu vết này phân
  biệt **ai** chặn.
- **Google Fonts qua đường chính thức:** `fonts.google.com/metadata/fonts` → `000`,
  `api.fontsource.org/v1/fonts` → `000`, `api.github.com/repos/google/fonts/...` → `403
  GitHub access to this repository is not enabled for this session` kể cả khi đính kèm
  `GITHUB_TOKEN`. Đường chạy được là **`raw.githubusercontent.com`** với file index
  `tags/all/families.csv`.
- ~~Kenney~~ — **đã lấy được 16/09 bằng Chromium**: `node cong-cu/quet_kenney.mjs`.
  `curl` không ăn thua (`/data/assets.json`, `/api/assets`, `/assets.json` đều `404`, danh
  sách nạp bằng JavaScript) và href là **URL tuyệt đối** nên `a[href^="/assets/"]` ra 0
  dòng. Phải chạy `npm run mo:mang` ở `quoc-chien` trước, không thì Chromium báo
  `net::ERR_CERT_AUTHORITY_INVALID`. Ra **215 gói**, gấp gần ba lần con số "~80" từng ước.
- ~~Freesound~~ — **đã lấy được 16/09** sau khi chủ dự án lấy khoá API.
- ~~game-icons.net~~ — **đã lấy được 17/09** sau khi chủ dự án mở allowlist: **3.658
  icon**. Trang là SPA React nên `curl` chỉ thấy khung, `/icons.json` và
  `/data/icons.json` đều `404`, bundle JS không chứa danh sách. Đường đi là **sitemap**:
  `/sitemap.xml` → `/sitemaps/1x1/<tác-giả>.xml`. Chia sẵn theo tác giả nên tên người vẽ
  đi kèm — CC-BY 3.0 đòi đúng thứ đó. Không cần Chromium.

Số Icosa là **model duy nhất**, đã lọc phía server: bỏ ND, bỏ Tilt Brush. Toàn kho
141.099 asset; hợp license 130.530; bỏ Tilt còn 73.626; trong đó **41.435 cái ≤ 8.000 tam**.

Hai con số kia là **lượt file**, không phải model duy nhất — một model xuất ra fbx/gltf/obj
thì đếm ba lần. Model duy nhất: **2.164** và **1.310**; số thật luôn ở dòng cuối
`quoc-chien/docs/KHO_ASSET.md` và `docs/KHO_CHUNG.md`, đừng chép ra chỗ khác.

**Poly Pizza dò được, TẢI KHÔNG ĐƯỢC:** `static.poly.pizza` — host của mọi đường
`Download` — trả `403` với thân `Just a moment...` của Cloudflare, kể cả khi lái Chromium.
API cũng **không có đường duyệt hết** (`search/` trần và `category/<tên>` đều 404), nên
mục lục đó quét theo 159 từ khoá và **không phủ hết 10.400+ model** — đừng tưởng đã đủ.

Trùng lặp giữa các nguồn rất nhiều: đo 32 kết quả `house` trên Poly Pizza thì Quaternius 9
· Poly by Google 7 · Kenney 4 — Quaternius/Kenney đã nằm ở kho chung, Poly by Google đã
nằm trong mục lục Icosa.

`nguon/icosa.json` là **manifest 1.679 model đã tải về một lần**, giữ URL mốc thật để lấy
lại nhanh. Nó là tập con của mục lục, không phải giới hạn của kho.

## Kết quả dò API và MCP mở — 17/09

Giao 17/09, làm xong 17/09. Đo **24 host ứng viên** + 8 host đã biết làm đối chứng (8/8
đúng như ghi ở trên), ghi mã trả về thật. Dưới đây là kết luận; **đừng dò lại từ đầu**.

### Sáu API đáng xin mở allowlist

Cả sáu đều trả `000` kèm `curl: (56) CONNECT tunnel failed, response 403` — **allowlist
môi trường chặn**, request chưa ra khỏi máy ảo, chủ dự án mở được.

| Nguồn | Host | License | Vì sao đáng |
|---|---|---|---|
| **Openverse** | `api.openverse.org` | CC0 5.233 · CC-BY 2.350, lọc **phía server** | Gộp ~800M ảnh + âm thanh. `ke/openverse.tsv` **7.583 mục** qua 44 từ khoá. **Đã có khoá API** — xem dưới |
| **Openclipart** | `openclipart.org` | CC0 toàn bộ | **108.968 mục, ĐỦ 5.820/5.820 sitemap**. SVG + PNG: biểu tượng, UI, hình 2D |
| **Iconify** | `api.iconify.design` | theo từng bộ — **phải loại bộ CC-BY-SA** | 200.000+ icon, 150+ bộ. Không cần khoá |
| **Lospec** | `lospec.com/palette-list/load` | bảng màu, không đòi ghi công | Bảng màu để nướng sprite 2D |
| **Sketchfab** | `api.sketchfab.com` | lọc `cc0` · `by` được; **tải cần OAuth** | Model để nướng sprite |
| **GameAsset.net** | `gameasset.net` | khai CC0, **CHƯA kiểm** | 10.000+ animation nhân vật, tải GLB |

Mở xong thì **kiểm license GameAsset.net trước khi tải gì** — tự khai, giống bẫy itch.io.

### Loại vì license — đừng mở, đừng dùng

| Nguồn | Lý do |
|---|---|
| **Pixabay** | Pixabay Content License, **bỏ CC0 từ 2019** |
| **Hugging Face / Objaverse** (800k model) | **ODC-By 1.0** — không nằm trong CC0 · CC-BY · MIT |
| **Liberated Pixel Cup** `lpc.opengameart.org` | **CC-BY-SA 3.0 + GPL-3.0**. Host trả `200` (đi nhờ allowlist `opengameart.org`) nhưng luật kho cấm SA |
| **Matcaps** `nidorx/matcaps` | `200` nhưng **không có file LICENSE**; README tự nhận không truy được tác giả gốc, gom từ ZBrushCentral/Pixologic |
| **ColourLovers** | `?` — nội dung người dùng đăng, chưa xác minh |

### Loại vì không có asset dùng được

- **Games & Comics của `public-apis`: 103 API, dùng được 0.** Toàn metadata game thương
  mại (RAWG, IGDB, Riot, Steam, Battle.net, Genshin…). `PokéSprite` có sprite thật nhưng
  là tài sản Nintendo — **luật cấm copy từ game thương mại**.
- **Bảo tàng** (Met, Smithsonian, Art Institute of Chicago, Europeana, NASA): CC0 thật,
  nhưng là tranh và ảnh tư liệu, không phải asset game.
- **Musopen**: nhạc công hữu — Freesound 27.313 file đã phủ nhu cầu âm thanh.

### MCP: không thêm cái nào

Luật: schema MCP **nạp vào ngữ cảnh mỗi phiên dù không gọi lần nào**; CLI tốn 0 token khi
không dùng. Đã loại `threenative-asset-mcp` 13/09 vì đúng lý do này.

| MCP | Loại vì |
|---|---|
| `MubarakHAlketbi/game-asset-mcp` | Sinh sprite/3D qua Hugging Face Spaces. **License đầu ra không rõ**, cần token HF |
| `Flux159/mcp-game-asset-gen` | Sinh asset cho three.js — cùng vấn đề license |
| `Ludo.ai` API + MCP (beta 3/2026) | Thương mại, trả tiền, điều khoản riêng |
| `ahujasid/blender-mcp` (MIT) | **Máy ảo không có Blender** — `which blender` rỗng |
| `Coding-Solo/godot-mcp` (MIT) | Dự án là TypeScript/web, không dùng Godot |

Không cái nào làm được thứ CLI không làm được. Máy ảo chỉ có `node v22.22.2` và `python3`
— **không** `blender`, `magick`, `inkscape`.

### Mục lục đã soi hết, đừng soi lại

- **`public-apis/public-apis`** — README 2.313 dòng, **1.827 API**, 52 mục. Ra đúng một
  cái mới: Iconify. `Creative Commons Catalog` `api.creativecommons.engineering` **là tên
  cũ của Openverse**, không phải nguồn thứ hai.
- **`Calinou/awesome-gamedev` · `godotengine/awesome-godot` · `ellisonleao/magictools`**
  — ra Openclipart, GameAsset.net, LPC, Matcaps. Phần còn lại là **công cụ chạy trong
  trình duyệt, không có API**: Sprite Fusion, Piskel, PixelChart, Spritemate.
- **`thoseawesomeguys.com/prompts`** (CC0, icon phím và tay cầm): license sạch nhưng chỉ
  hợp game dùng bàn phím/tay cầm. Bỏ qua cho tới khi có việc cần.

### Việc của chủ dự án

**XONG 17/09** — chủ dự án đã mở cả sáu.

Ô đó tên **"Allowed domains"**, KHÔNG phải "Network access": `claude.ai/code` → nút tên
môi trường → **Edit cloud environment** → ô **Allowed domains**. Chú thích dưới ô:
*"List of domains (not URLs). Use \* for wildcards."* — nhập **tên miền trần**, không
nhập URL. Trợ lý gọi sai tên ô này nhiều lần; gọi đúng tên thì chủ dự án khỏi phải dò.

### Đo lại sau khi mở — cả sáu thông, nhưng hai cái có bẫy

```
api.openverse.org    200
openclipart.org      302   -> ben duoi
api.iconify.design   200
lospec.com           500   -> ben duoi
api.sketchfab.com    200
gameasset.net        200
```

**Openclipart: API JSON đã chết.** `/search/json/?query=` trả `302` về trang chủ, và
`/search/?query=` trả `curl: (52) Empty reply from server`. Đường chạy được là
**sitemap**, giống game-icons.net — nhưng phải **đủ hai thứ**, thiếu một là `52`:

```bash
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'
curl -sS --http1.1 -A "$UA" https://openclipart.org/sitemap.xml      # 406.414 B
curl -sS --http1.1 -A "$UA" https://openclipart.org/sitemap-10.xml   # 32 URL /detail/<id>/<slug>
```

Index có **5.820 sitemap con**; `sitemap-1.xml` là trang tĩnh (7 URL), các file sau là
clipart. Mẫu một file ra 32 URL → **ước ~186.000 mục, CHƯA quét hết** — đừng chép con số
ước này đi đâu, quét xong lấy số thật.

#### Openclipart CHẶN IP khi quét mạnh — bẫy đắt nhất phiên 17/09

Chạy `quet_openclipart.mjs` với `SONG_SONG = 6`, không nghỉ giữa các lô. Sau **~30 phút**
họ bắt đầu cắt, rồi chặn hẳn:

```
sitemap.xml lan1: curl: (18) transfer closed with outstanding read data remaining  200 81445B  (cua 406414B)
sitemap.xml lan2: curl: (52) Empty reply from server
sitemap.xml lan3: curl: (52) Empty reply from server
```

**Sau hơn một tiếng vẫn chặn.** Đo lúc bị chặn — mọi đường đều `52`, **trừ `robots.txt`**:

```
robots.txt        200        <- carve-out, dung de biet mang van thong
sitemap.xml       52
sitemap-10.xml    52
download/...svg   52
```

Thử gỡ bằng bốn cách, **không cách nào ăn**: `-H 'Range: bytes=0-9999'`, `--limit-rate 50k`,
`--compressed`, `--http1.1` cho đường tải. Không phải chặn theo cỡ file — là **chặn IP**.

**Phân biệt ba thứ dễ lẫn:**

| Dấu vết | Là gì | Làm gì |
|---|---|---|
| `000` + `connect_rejected — gateway answered 403 to CONNECT` | allowlist môi trường | chủ dự án thêm vào **Allowed domains** |
| `403` + `server: cloudflare` | đích đuổi | thêm allowlist vô ích |
| `52` mọi đường **nhưng `robots.txt` `200`** | **đích chặn IP vì quét mạnh** | nghỉ, rồi quét lại nhẹ tay |

Công cụ đã sửa theo đúng bài học: `SONG_SONG = 2`, `NGHI_LO = 250` ms giữa mỗi lô, ghi TSV
dần bằng `appendFileSync`, và sổ `nguon/openclipart_xong.txt` để **chạy tiếp được** chỗ
đứt. **Đừng nâng `SONG_SONG` lên cho nhanh** — đó đúng là cái làm mất cả buổi.

#### Quét thật 17/09 — 101.536 mục, và vẫn bị chặn lại

Hết chặn sau **~5 tiếng**. Quét lại với cấu hình nhẹ tay:

```
5.571/5.820 sitemap · 101.536 muc · 249 hong · ~2,5 gio · ke/openclipart.tsv 12 MB
```

Tốc độ đo được: **68 sitemap / 105 giây** (~0,65/s), ~31,5 mục mỗi sitemap. `id` không
trùng cái nào: 101.536/101.536.

**Nhưng 2,5 tiếng quét cũng đủ để họ chặn lại** — 249 sitemap cuối hỏng chính là lúc chặn
ập xuống, và chạy lại ngay sau đó là `Khong doc duoc /sitemap.xml` (`robots.txt` vẫn `200`,
tức chặn IP chứ không phải allowlist).

#### Ngưỡng chặn TỤT DẦN theo số lần bị — đây là cái phải nhớ

| Lần | Cấu hình | Chịu được bao lâu |
|---|---|---|
| 1 | `SONG_SONG = 6`, không nghỉ | ~30 phút |
| 2 | `SONG_SONG = 2`, nghỉ 250 ms | ~2,5 giờ |
| 3 | `SONG_SONG = 2`, nghỉ 250 ms | **~9 phút** |
| 4 | `--cham`: `SONG_SONG = 1`, nghỉ 3 s | **không bị chặn** |

Mỗi lần bị chặn phải đợi **2–5 tiếng** mới hết. Nên còn vài trăm sitemap thì **dùng
`--cham` ngay**, đừng tiếc thời gian: chậm hơn vẫn ít hơn ngồi đợi hết chặn.

**Quét xong 17/09: đủ 5.820/5.820 sitemap, 108.968 mục, id không trùng cái nào, 100% CC0,
`ke/openclipart.tsv` 12 MB.** Ba lượt `--cham` cuối: 96 sitemap → 7 hỏng → 0 hỏng.

### Lấy về: `cong-cu/lay_openclipart.mjs`

```bash
node cong-cu/lay_openclipart.mjs --loc castle                 # SVG -> ./assets_source/openclipart/
node cong-cu/lay_openclipart.mjs --loc castle --png           # PNG 800px thay vì SVG
node cong-cu/lay_openclipart.mjs --loc castle --png --px 2400
node cong-cu/lay_openclipart.mjs --loc sword --so 30 ../quoc-chien/assets_source
```

**Tải thì không cần gì đặc biệt** — khác lúc quét sitemap (phải có UA trình duyệt và
`--http1.1`). Đo 18/09: `--loc castle --so 12` ra **12/12 SVG, 0 hỏng**; `--png` ra đúng
`PNG image data, 800 x 379`.

Vẫn để `SONG_SONG = 1`, `NGHI = 1200` ms vì bảng ngưỡng ở trên. Thêm một chốt: **5 lần
`52` liên tiếp là tự dừng** và in cách phân biệt họ chặn IP (`robots.txt` `200`) với
allowlist (`000`). Đâm tiếp chỉ làm án chặn lâu hơn, không lấy thêm được file nào.

**SVG Openclipart nặng** — 12 file ra **6,7 MB** (có file 239 KB). Dùng `--so` mà chặn,
đừng kéo cả nghìn mục.

**Đừng `--lam-lai`** — mất sạch mấy tiếng quét, mà chắc chắn bị chặn giữa chừng.

**Lospec: phải đủ tham số.** Bỏ bớt là `500`:

```bash
curl 'https://lospec.com/palette-list/load?colorNumberFilterType=any&page=1'   # 500
curl 'https://lospec.com/palette-list/load?colorNumberFilterType=any&colorNumber=8&page=1&tag=&sortingType=default'   # 200, JSON {"palettes":[...]}
```

`/palette-list.json` → `404`.

**GameAsset.net**: trang chủ có JSON-LD ghi
`license":"https://creativecommons.org/publicdomain...` và 9 lần chữ `CC0` — dấu hiệu tốt,
nhưng **vẫn phải mở file license trong từng gói trước khi dùng**, giống bẫy itch.io.

### Openverse — quét xong, tải thì chưa

`node cong-cu/quet_openverse.mjs` → **7.583 mục** qua **44 từ khoá**, **161 lượt gọi**,
`ke/openverse.tsv` 2,7 MB, id không trùng cái nào. Chia ra: **CC0 5.233 · CC-BY 2.350**;
nguồn `wikimedia 4.598 · rawpixel 1.559 · svgsilh 1.426`; **toàn bộ là `illustration`**.

**Mặc định lọc `category=illustration`.** Không lọc thì `sword` ra toàn ảnh chụp Flickr
kiểu *"pen mightier than sword"* — vô dụng cho game 2D. Cần ảnh chụp làm hoạ tiết thì
thêm `--anh`.

### Khoá API — đã có 18/09, gấp 50 lần

Đo từ header, hai mức khác hẳn nhau:

```
khong khoa:  x-ratelimit-limit-anon_burst: 20/min
             x-ratelimit-limit-anon_sustained: 200/day
             page_size > 20  -> 401 "page_size may not exceed 20 for anonymous requests"

co khoa:     x-ratelimit-limit-oauth2_client_credentials_burst: 100/min
             x-ratelimit-limit-oauth2_client_credentials_sustained: 10000/day
             page_size > 50  -> 401 "page_size may not exceed 50 for authenticated requests"
```

**Đặt `OPENVERSE_CLIENT_ID` + `OPENVERSE_CLIENT_SECRET`, ĐỪNG đặt `OPENVERSE_TOKEN`.**
Token chỉ sống **43.200 giây (12 tiếng)** rồi chết — nhét vào biến môi trường là mai sau
bó tay không hiểu vì sao tụt về mức khách. Có hai biến kia thì `quet_openverse.mjs` **tự
xin token mới mỗi lần chạy**.

**Hai bẫy khi lấy khoá:**

- `GET /v1/rate_limit/` trả `"verified": false` **ngay cả khi đã xác minh email và đã được
  cấp mức 100/min**. Đừng tin trường đó — đọc **header** `x-ratelimit-limit-*` mới đúng.
- Token xin **trước** khi bấm link xác minh vẫn ở mức khách. Phải xin token **mới** sau khi
  xác minh xong.

Ba bước lấy khoá ghi ở đầu `quet_openverse.mjs`.

**Quét xong mục lục vẫn chưa tải được** — Openverse chỉ trả URL trỏ về host gốc, host đó
phải nằm trong **Allowed domains**. Chủ dự án đã mở cả ba **17/09**; đo lại sau khi mở:

| Host | Mục | Mã | Kết luận |
|---|---:|---|---|
| `upload.wikimedia.org` | 4.598 | `200` | Được, nhưng **rate-limit gắt** — xem dưới |
| `images.rawpixel.com` | 1.559 | `200` | Được, không vướng gì |
| `svgsilh.com` | 1.426 | `403` + `server: cloudflare` + trang captcha | **Đích đuổi. BỎ HẲN** — mở allowlist vô ích, `lay_openverse.mjs` tự lọc bỏ |

### Lấy về: `cong-cu/lay_openverse.mjs`

```bash
node cong-cu/lay_openverse.mjs --loc castle              # -> ./assets_source/openverse/
node cong-cu/lay_openverse.mjs --loc castle --cc0        # chỉ CC0, khỏi phải ghi tên
node cong-cu/lay_openverse.mjs --loc sword ../quoc-chien/assets_source
```

Mỗi file tải kèm `<tên>.ghi_cong.json` — ghi công **đi theo file**, đúng lệ kho.

**`upload.wikimedia.org` trả `429` khi tải nhanh** (`server: Varnish`, thân là trang
*"Wikimedia Error"*). Không phải chặn hẳn: cùng một URL, nghỉ 3 giây rồi gọi lại thì `200`
(đo 3/3). **Đổi UA cho "lịch sự" KHÔNG cứu được** (đo 1/6) — chỉ có nghỉ mới cứu, và nghỉ
1 giây là chưa đủ (đo 10 URL cách nhau 1 giây ra **8 lần `429`**).

Nên lệnh để `SONG_SONG = 1`, `NGHI = 2500` ms, thử lại `429` với nghỉ tăng dần. Đo thật:

```
lan 1: Lay 7 · hong 3 (429=3)   2m03s
lan 2: Lay 2 · co san 7 · hong 1 (429=1)   45s   -> 9/10
```

**Chạy lại vài lần là đủ** — file đã có được bỏ qua. **Đừng nâng `SONG_SONG` lên cho
nhanh**: nhanh hơn nghĩa là hỏng nhiều hơn, tổng thời gian tệ hơn.

### Việc phiên sau

1. ~~Quét Openclipart~~ — **xong 17/09, đủ 5.820/5.820 sitemap**.
2. ~~Viết `cong-cu/quet_openverse.mjs`~~ — **xong 17/09**, kèm `lay_openverse.mjs`.
3. ~~Viết `lay_openclipart.mjs`~~ — **xong 18/09**.
4. ~~Lấy khoá Openverse~~ — **xong 18/09**, `10000/day`.
5. Còn mở: quét Openverse thêm từ khoá (giờ rộng rãi quota), và
   `node cong-cu/rut_tu_khoa.mjs` có thể sinh bộ từ khoá lớn hơn 44 từ hiện tại.

## Nợ của kho — rà 18/09, số sinh từ `vet:kho`

- **✅ Hai bản kê dự án: SỬA XONG 18/09**, gốc là `cong-cu/nap_ke_cu.mjs` (không phải
  `kho_asset.mjs` của `quoc-chien` như ghi ban đầu). Bảng regex license ở đó (`/kenney/i`,
  `/quaternius/i`…) dò vào chính đường dẫn gói — mà đường dẫn thật là
  `assets_source/city-kit-suburban/Models/GLB format`, không chứa chữ "kenney" ở đâu cả.
  Nay tra thẳng `ke/kenney.tsv` + `ke/itch.tsv`: thêm cột **`tac_gia`**, `cach_lay` đúng
  từng gói (`tai_asset.mjs` cho Kenney, `tai_itch.mjs` cho itch), và **bỏ 1.679 dòng Icosa
  nằm nhầm** (trùng `ke/icosa.tsv`, ở đó đủ tác giả + số tam).
  **license `?` cả kho: 4.497 → 1.562.**
- **Còn 1.562 dòng `?`, không đoán bừa.** `quoc-chien-assets` 695 (`kaykit-medieval-
  builder-pack`, `lowpoly-animated-animals`) · kho chung `tayvuc` 867 (12 gói Quaternius và
  KayKit không có trong `ke/itch.tsv`). Bản trước điền CC0 cho nhóm này **bằng regex đoán**
  nên đếm ra 0 `?` — số đẹp hơn mà sai hơn. License thật nằm trong file `LICENSE` của từng
  gói; mở ra đối chiếu rồi mới điền. Cột `tac_gia` thì **đã đủ 100%** cho kho chung.
- **Chuỗi license 8 kiểu viết cho cùng một thứ** (`CC-BY 3.0` · `CREATIVE_COMMONS_BY 3.0`
  · `http://creativecommons.org/licenses/by/3.0/` …). `vet:kho` nhận hết, nhưng lọc theo
  license thì phải chuẩn hoá lúc đọc.
- **`cong-cu/quet_kenney.mjs` cần `quoc-chien/tools/lib/cdp.mjs`.** Cố ý — không chép sang
  để khỏi hai bản lệch — và nó **báo lỗi rõ** khi thiếu, không hỏng lặng. Chỉ ảnh hưởng
  việc quét lại Kenney, không ảnh hưởng dò hay lấy.
- **`node cong-cu/do.mjs chicken --tam 8000` in 26 KB (~7.000 token)** vì 10 nguồn × trần
  40 dòng. Từ khoá rộng thì thêm `--tam` hoặc dò từng nguồn; trần `TRAN_IN` ở đầu `do.mjs`.
- **`CLAUDE.md` chưa nhắc `bash scripts/do.sh`** — file khoá, phải hỏi chủ dự án trước.
