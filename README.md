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

```bash
# 1. Dò khắp mọi nguồn một lệnh — in kèm license và cách lấy từng nguồn
node cong-cu/do.mjs chicken --tam 8000
node cong-cu/do.mjs ga                    # tiếng Việt, tự dịch qua từ điển

# 2. Lấy đúng thứ cần. KHÔNG kéo cả kho.
node cong-cu/lay.mjs icosa --loc chicken
node cong-cu/lay.mjs icosa --id 1YE8U35HXsI 0GKndEIbbMf
node cong-cu/lay.mjs icosa ../quoc-chien/assets_source --loc house
```

Model nào **chưa có trong manifest** thì `lay.mjs` tự hỏi API lúc tải — mục lục phủ cả
kho, manifest chỉ là đường tắt cho những cái đã lấy về một lần.

Chạy lại được: model đã có trên đĩa thì bỏ qua. Mỗi model tải kèm `ghi_cong.json` để
ghi công đi theo file, không nằm một chỗ dễ mất.

## Đưa nguồn mới vào kho

```bash
# 1. Tải về bằng công cụ của dự án (ví dụ quoc-chien: npm run tai:icosa)
# 2. Sinh manifest từ thư mục đã tải
node cong-cu/sinh_manifest.mjs <tên-nguồn> <đường-dẫn-thư-mục>
# 3. Chép bản kê của dự án vào ke/<tên-nguồn>.md, rồi commit
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
| `quoc-chien/assets_source` (Kenney · Quaternius · KayKit) | `ke/quoc-chien-assets.tsv` | 3.960 | CC0 | `tai_itch.mjs` ở repo đó |
| Poly Haven — model · **hoạ tiết · HDRI** | `ke/polyhaven.tsv` | 2.378 | CC0 toàn bộ | API mở, không cần khoá |
| Kho chung `tayvuc` | `ke/tayvuc-kho-chung.tsv` | 1.347 | CC0 (vài gói `?`) | `npm run kho:lay` |

Poly Haven chia ba loại: `models 521 · textures 861 · hdris 996` (cột `loai`).

**Nguồn đã thử, CHƯA lấy được — đừng mò lại:**

- **ambientCG** (~2.000 hoạ tiết CC0): request đầu `200`, sau đó `000` với
  `ws_closed_mid_exchange` cho mọi đường, kể cả trang chủ. Chặn ở phía họ hoặc allowlist.
- **Kenney** (~80 gói CC0): `kenney.nl/assets` trả `200` nhưng danh sách gói **nạp bằng
  JavaScript**; `/data/assets.json`, `/api/assets`, `/assets.json` đều `404`. Muốn quét
  phải lái Chromium (`npm run mo:mang` ở `quoc-chien`).
- **game-icons.net**: `raw.githubusercontent.com/game-icons/icons/master/icons.json` → `404`.

Số Icosa là **model duy nhất**, đã lọc phía server: bỏ ND, bỏ Tilt Brush. Toàn kho
141.099 asset; hợp license 130.530; bỏ Tilt còn 73.626; trong đó **41.435 cái ≤ 8.000 tam**.

Hai con số kia là **lượt file**, không phải model duy nhất — một model xuất ra fbx/gltf/obj
thì đếm ba lần. Model duy nhất: 1.222 và 1.310 (xem `KHO_ASSET.md`, `KHO_CHUNG.md` gốc).

**Poly Pizza dò được, TẢI KHÔNG ĐƯỢC:** `static.poly.pizza` — host của mọi đường
`Download` — trả `403` với thân `Just a moment...` của Cloudflare, kể cả khi lái Chromium.
API cũng **không có đường duyệt hết** (`search/` trần và `category/<tên>` đều 404), nên
mục lục đó quét theo 159 từ khoá và **không phủ hết 10.400+ model** — đừng tưởng đã đủ.

Trùng lặp giữa các nguồn rất nhiều: đo 32 kết quả `house` trên Poly Pizza thì Quaternius 9
· Poly by Google 7 · Kenney 4 — Quaternius/Kenney đã nằm ở kho chung, Poly by Google đã
nằm trong mục lục Icosa.

`nguon/icosa.json` là **manifest 1.679 model đã tải về một lần**, giữ URL mốc thật để lấy
lại nhanh. Nó là tập con của mục lục, không phải giới hạn của kho.
