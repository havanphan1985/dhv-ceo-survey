# Khảo sát Động lực & Văn hoá tổ chức dành cho CEO – DHV

Trang khảo sát tĩnh (GitHub Pages). Kết quả được gửi về Google Sheet qua Google Apps Script.

## Cấu trúc
- `index.html` – khảo sát + báo cáo. Cấu hình nằm trong khối `CONFIG` ở đầu phần `<script>`.
- `apps-script/Code.gs` – mã nhận dữ liệu, dán vào Apps Script của Google Sheet.

## Cài đặt
1. **Google Sheet**: tạo một Sheet mới (ví dụ "DHV – Kết quả khảo sát CEO").
2. **Apps Script**: trong Sheet chọn *Extensions → Apps Script*, xoá nội dung mặc định, dán toàn bộ `apps-script/Code.gs`, bấm Lưu.
   Chọn *Deploy → New deployment → Select type: Web app*.
   - Execute as: **Me**
   - Who has access: **Anyone**
   Bấm Deploy, cấp quyền, rồi sao chép **Web app URL** (dạng `https://script.google.com/macros/s/.../exec`).
3. **Calendly**: tạo sự kiện (ví dụ "Đọc kết quả khảo sát – 45 phút", địa điểm Google Meet). Trong *Booking questions*, đặt
   **câu hỏi 1 = "Tên công ty"**, **câu hỏi 2 = "Số điện thoại / Zalo"** – trang khảo sát tự điền sẵn hai câu này cùng tên và email.
4. **Cấu hình trang**: trong `index.html`, điền `CONFIG.SUBMIT_URL` = Web app URL, `CONFIG.BOOKING_URL` = link sự kiện Calendly.
5. **GitHub Pages**: *Settings → Pages → Source: Deploy from a branch → main / (root)*. Sau 1–2 phút trang có ở
   `https://<tài-khoản>.github.io/dhv-ceo-survey/`.

## Dùng dữ liệu
- Mỗi CEO là một dòng trong tab **Kết quả**: thông tin liên hệ, điểm tổng hợp, câu trả lời từng câu, câu hỏi mở.
- Cột **Link báo cáo** mở bản dành cho DHV (có trang câu hỏi mở) → bấm *Tải PDF*.
- **Bấm đặt lịch** / **Đã đặt lịch (Calendly)** / **Muốn khảo sát đội ngũ** ghi thời điểm CEO bấm CTA và đặt lịch xong.
- Trong Calendly, mỗi lịch hẹn có `utm_content` = ID của dòng trong Sheet. Cột **Trạng thái DHV** để DHV tự theo dõi.
- Mỗi bài nộp mới gửi email thông báo cho chủ Sheet (sửa hàm `notify_` để tắt).

Lưu ý: khi sửa `Code.gs`, phải *Deploy → Manage deployments → Edit → Version: New version* thì thay đổi mới có hiệu lực.
