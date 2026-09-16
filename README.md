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
# Dò trước, khỏi tải: bản kê nằm trong git nên grep được ngay
grep -io '[a-z0-9_ -]*chicken[a-z0-9_ -]*' ke/icosa.md | sort -u

# Lấy vài model trúng từ khoá — đừng kéo cả kho khi cần ba con gà
node cong-cu/lay.mjs icosa --loc chicken

# Lấy cả nguồn về thư mục của dự án khác
node cong-cu/lay.mjs icosa ../quoc-chien/assets_source
```

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

| Nguồn | Bản kê | Model | License |
|---|---|---:|---|
| Icosa Gallery (kho gương Google Poly) | `ke/icosa.md` | 1.671 | CC-BY |
