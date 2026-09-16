# KHO GAME — kho chung cho mọi dự án game

Model 3D, hoạ tiết, bản kê và công cụ lấy về. **Một chỗ duy nhất** cho mọi dự án game,
thay vì mỗi dự án tải lại cùng một gói.

## Repo nhẹ, asset nằm ở Releases

Git **không** giữ file nhị phân: `.glb` nén rất kém, mà lịch sử git giữ mọi bản cũ vĩnh
viễn. Nên:

- **Trong git:** bản kê (`ke/*.md`), công cụ (`cong-cu/`), ghi công license.
- **Ở Releases:** gói `.tar` của từng nguồn. GitHub cho **2 GiB mỗi file · 1.000 file mỗi
  release · không giới hạn tổng, không giới hạn băng thông** — trong khi repo thì khuyến
  nghị dưới 1 GB (trần mềm 5 GB) và **file trong git cứng 100 MB**.

## Dùng ở dự án game

```bash
# Dò trước, khỏi tải: bản kê nằm trong git nên grep được ngay
grep -io '[a-z0-9_ -]*chicken[a-z0-9_ -]*' ke/icosa.md | sort -u

# Trúng rồi mới lấy gói thật về ./assets_source/
node cong-cu/lay.mjs icosa
```

`lay.mjs` tải gói từ Releases rồi bung ra `assets_source/<nguồn>/`. Chạy lại được: có
rồi thì bỏ qua.

## Đưa nguồn mới vào kho

```bash
node cong-cu/dong_goi.mjs <đường-dẫn-thư-mục> <tên-nguồn>
```

Nó `tar` thư mục, cắt thành phần ≤ 1,5 GiB nếu cần, tạo release `kho-<tên-nguồn>` rồi
tải lên. Cần biến môi trường `GITHUB_TOKEN` (máy ảo Claude Code đã có sẵn).

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
