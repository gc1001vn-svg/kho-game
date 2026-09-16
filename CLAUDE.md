# CLAUDE.md — KHO GAME

Kho chung cho mọi dự án game. **Đây là MỤC LỤC, không phải chỗ chứa file.** Repo giữ bản
kê + manifest + công cụ; model thật tải về khi cần rồi thôi.

## Đầu phiên — đọc kho ghi nhớ trước hết

Ba file, **đọc HẾT, cấm `head`/`tail`/`sed -n`**:

```bash
git -C /home/user/ghi-nho pull -q 2>/dev/null \
  || git clone --depth 1 https://github.com/gc1001vn-svg/ghi-nho /home/user/ghi-nho
cat /home/user/ghi-nho/{so-thich,du-an,trang-thai}.md
node /home/user/ghi-nho/cong-cu/cai_dat.mjs
```

Kho đó **Private**; clone hỏng thì `add_repo` với `access: read`, **đừng xin `push`**.
Bảy bước đầu phiên · cách trả lời · luật báo "xong": **ĐỀU Ở KHO**.

## Ba luật của repo này

1. **Không commit file nhị phân.** `.glb` nén kém, lịch sử git giữ mọi bản cũ vĩnh viễn —
   thêm một mẻ là cộng dồn, không xoá được. `assets_source/` đã nằm trong `.gitignore`.
2. **Bản kê LÀ bản ghi công.** Cột *Tác giả*, *License*, *Trang gốc* là nghĩa vụ pháp lý
   của CC-BY, không phải trang trí. Cắt cột là vi phạm license.
3. **License chỉ nhận CC0 · CC-BY · MIT.** **CC-BY-SA và CC-BY-ND đều cấm** — SA lây
   license sang cả dự án, ND cấm phái sinh mà nướng sprite chính là phái sinh. Lọc ngay ở
   bước quét, đừng để lọt vào mục lục rồi lọc sau.

## Lệnh

| Lệnh | Việc |
|---|---|
| `node cong-cu/do.mjs <từ khoá> [--tam N]` | dò khắp mọi nguồn, in kèm license và cách lấy |
| `node cong-cu/lay.mjs icosa --loc <từ khoá>` | kéo model trúng về `assets_source/` |
| `node cong-cu/lay.mjs icosa --id <id>...` | kéo đúng mấy model |
| `node cong-cu/quet_icosa.mjs` | quét lại mục lục Icosa (~90 phút) |
| `node cong-cu/quet_polyhaven.mjs` · `quet_polypizza.mjs` | quét hai nguồn kia |
| `node cong-cu/sinh_manifest.mjs <nguồn> <thư mục>` | ghi URL mốc thật cho thứ đã tải |

## Ba bẫy mạng, đã đo — đừng "tối ưu" lại

1. **`fetch` của Node không tải được `web.archive.org`** → `403 Blocked by egress policy`
   (nó không đi CONNECT qua proxy phiên). Phải gọi `curl`.
2. **Phải `--http1.1`** — HTTP/2 qua proxy đứt `ws_closed_mid_exchange` sau ~11 giây.
3. **Cấm tải thẳng URL API trả về.** Mốc giả `20250101010101id_/…` trả 302, chờ
   `cdx.remote` ~16 giây thì tunnel đã đứt. `curl -I` lấy `location` mốc thật rồi mới GET.

Hai chỗ máy ảo chặn, khỏi thử lại: tạo repo (`403 sessions are bound to their configured
repositories`) và tạo/sửa release (`Creating, editing, or deleting releases is not
permitted for this session type`).

## Quy ước

- Comment tiếng Việt; tên biến, tên hàm tiếng Anh.
- Commit tiếng Việt **không dấu**, mỗi việc một commit.
- Bản kê trong `ke/` và manifest trong `nguon/` **sinh tự động** — sửa tay là mất.
