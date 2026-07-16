# Demo Test Guide

## Tài khoản demo

Mật khẩu chung: **`Password123!`**

| Email | Role |
|---|---|
| `admin@smile.com` | ADMIN |
| `dr.nguyenvana@smile.com` | DOCTOR |
| `nguyenvana.pt@email.com` | PATIENT |

Ngày đặt lịch hợp lệ: **2026-07-13 → 2026-07-26**.

---

## Auth & phân quyền (đã hoạt động)

**Flow:** ở trang `/login`, nhập email/password của 1 trong 6 tài khoản demo, ấn **"Login"** → được redirect vào dashboard đúng theo role (patient/doctor/admin)
→ ở top-nav, thử click 1 link không thuộc quyền (ví dụ patient gõ thẳng `/admin`) → bị redirect về `/unauthorized`, xác nhận RBAC chặn đúng.

---

## Đặt lịch & nhắc lịch (đã hoạt động)

**Flow:** login PATIENT → `/appointments/new` → chọn phương thức **"By Specialty"** (không dùng "At Facility"/"By Doctor" vì 2 cái đó bắt nhập UUID bác sĩ thủ công, chưa có picker) → chọn clinic/specialty/service/ngày/giờ → ấn **"Continue"** → ấn **"Confirm Booking"** → đạt: appointment mới tạo, status `"scheduled"`
→ vào `/appointments/[id]` của lịch vừa tạo, ấn nút **"Send Reminder"** (icon chuông) → đạt: toast "Reminder sent", API trả 202.

> Có thể ấn thêm **"Send Confirmation"** tương tự để test email confirm, và **"Confirm"** để chuyển status sang `confirmed`.

---

## Khám bệnh & hồ sơ bệnh án (đã hoạt động)

> ⚠️ **Đã sửa lại flow này** — bản trước ghi sai. `/examinations` chỉ **liệt kê session đã tạo** (không có appointment nào ở đó để chọn). Muốn tạo session mới phải qua `/examinations/new`, và appointment phải ở trạng thái **`checked_in`** (không phải `confirmed`) mới chọn được — đây là bước lễ tân/admin xác nhận bệnh nhân đã tới, tách biệt hoàn toàn khỏi "Confirm" ở phần Đặt lịch.

**Flow đầy đủ:**
1. Login ADMIN hoặc RECEPTIONIST → vào `/appointments/[id]` của appointment đã `confirmed` → ấn nút **"Check In"** (xanh lá, icon log-in) → đạt: status chuyển `checked_in`.
2. Login DOCTOR (đúng bác sĩ của appointment đó) → `/examinations/new` → chỉnh **"Work date"** đúng ngày của appointment (mặc định là hôm nay, không tự đổi được nếu appointment ở ngày khác) → dropdown **"Checked-in appointment"** sẽ hiện appointment vừa check-in → chọn nó → ấn **"Create session"** → tự động chuyển sang `/examinations/[id]`.
3. Trong `/examinations/[id]`: thêm symptom, chọn/nhập diagnosis (ICD) → đạt: danh sách chẩn đoán hiển thị trong session.
4. **Bắt buộc**: cuộn tới card **"Clinical notes"** (mới thêm), điền ít nhất 1 trong 3 ô (Chief complaint / Present illness / Physical examination) → ấn **"Save notes"**. Đây là rule thật ở cả backend (`assertReadyToFinalize`) lẫn frontend — thiếu bước này, "Finalize encounter" sẽ luôn bị khoá (cursor disabled) dù đã có diagnosis, và **không có cách nào sửa được** ngoài card này (3 field này chỉ set được lúc tạo session ở `/examinations/new`, nếu bỏ trống lúc đó thì kẹt luôn).
5. Cùng trang, cuối flow ấn **"Finalize encounter"** (có confirm dialog) → đạt: session status chuyển `in-progress` → `completed`, các nút tạo mới trong session bị disable đúng.

---

## Treatment plan & Đơn thuốc (đã hoạt động)

**Flow:** trong `/examinations/[id]`, tạo Treatment Plan draft →

> ⚠️ **Quan trọng**: phải điền đủ 4 field `estimated_cost`, `quote_version`, `risk_disclosure`, `alternative_options` (thiếu 1 trường thì nút "Propose" sẽ no-op im lặng, chỉ hiện toast, không có network request — dễ tưởng nút chết).

→ ấn **"Propose"** → ấn **"Accept"** (confirm dialog) → đạt: plan status `"accepted"`
→ cùng trang, tạo Prescription draft → **"Add drug"** nhập tên thuốc/liều/tần suất/số ngày/số lượng/hướng dẫn → ấn **"Issue prescription"** (confirm dialog) → đạt: status `"issued"`, nút "Add drug" tự động disable sau khi issue.

---

## Thanh toán — Payment (đã hoạt động)

**Flow:** login PATIENT → `/appointments/[id]` → phần "Payment" ấn nút **"Pay now"** → redirect sang mock VNPay sandbox, hoàn tất thanh toán giả lập → quay lại app → đạt: badge `payment_status` chuyển `"paid"`, record xuất hiện trong bảng payment history
→ ở cùng bảng đó (dòng payment status = paid), ấn nút **"Refund"** → đạt: `refund_status` chuyển `REQUESTED`, xuất hiện trong hàng đợi refund của admin (bước dưới).

---

## Lịch làm việc & nghỉ phép (đã hoạt động)

**Flow:** login DOCTOR → `/schedules/my-schedule` xem lịch làm việc cá nhân → vào `/schedules/leaves/new` (route này **không có trong top-nav**, phải vào qua `/schedules` → card "Leaves", hoặc gõ thẳng URL) → điền loại nghỉ/ngày/lý do → submit `POST /doctor-leaves` → đạt: leave request mới xuất hiện trong `/schedules/leaves` với status `"pending"`
→ login ADMIN → `/admin/facility` → card **"Leave Approvals"** → ấn **"Approve"** hoặc **"Reject"** trên leave request vừa tạo → đạt: status cập nhật, stat count trên cả 2 phía đồng bộ.

---

## Admin console

### Quản lý user/role (đã hoạt động)

**Flow:** login ADMIN → `/admin/users-management` → search/filter user, ấn vào 1 user → mở modal **"Roles"** → tick/untick role → save → đạt: role của user cập nhật ngay trong bảng
→ `/admin/roles-management` → chọn 1 role → expand permission matrix (checkbox theo từng resource: appointments, medical records, payments, roles, users...) → tick/untick permission → đạt: ma trận quyền lưu lại đúng.

### Phòng khám/phòng/dịch vụ — facility hub (đã hoạt động)

**Flow:** `/admin/facility` → chọn tab "Clinics" (hoặc Treatment Rooms / Specialties / Services & Pricing / Work Shifts / Doctor Schedules) → ấn **"Add"/"New"** → điền form → save → đạt: item mới xuất hiện trong list, CRUD đầy đủ (create/edit/delete) đã verify thật, không phải mock.

### Refund queue (đã hoạt động)

**Flow:** `/admin/refunds` → thấy request refund vừa tạo ở bước Payment (status `REQUESTED`) → ấn **"Approve"** → đạt: FSM tự chuyển thẳng sang `REFUNDED` (không có bước "processing" trung gian)
→ `/admin/revenue-reports` → đạt: số liệu doanh thu/số lịch đã thanh toán tự động giảm tương ứng, xác nhận refund trừ đúng vào báo cáo tài chính.

> Test nhánh reject: ấn **"Reject"** trên 1 request khác → modal nhập lý do → confirm → đạt: status `REJECTED`, không trừ vào doanh thu.

### Audit log — RBAC & account actions (đã hoạt động)

**Flow:** `/admin/audit-logs` → thấy list các sự kiện login/thao tác admin → ấn **"Expand details"** trên 1 dòng → đạt: hiện chi tiết device/IP/JSON payload của event đó.

### Báo cáo (đã hoạt động — nhưng gộp chung, không tách riêng "vận hành")

**Flow:** `/admin/revenue-reports` → chọn filter theo ngày/clinic → đạt: chart doanh thu theo ngày, breakdown theo dịch vụ và theo clinic, số liệu đã bao gồm điều chỉnh refund (đây chính là báo cáo "doanh thu + refund" gộp làm một, không có trang "vận hành" riêng)
→ `/admin/performance` → đạt: bảng completion/cancellation rate theo từng bác sĩ, breakdown chi tiết
→ `/admin/kyc-management` → nhìn 4 thẻ số ở đầu trang (All submissions / Pending review / Verified / Rejected) → đạt: đây chính là phần "KYC stats" bạn liệt kê, không phải trang report riêng mà nằm chung trang quản lý KYC.

---

## KYC (chưa test sâu — đúng như bạn ghi "ưu tiên các flow trên trước")

**Flow:** login PATIENT → `/profile` → phần KYC, upload ảnh mặt trước/sau CCCD, xác thực OTP số điện thoại, tick đồng ý điều khoản → ấn **"Submit KYC"** → đạt: status chuyển `"PENDING_REVIEW"`
→ login ADMIN → `/admin/kyc-management` → filter "Pending review" → mở 1 submission → ấn **"Approve"/"Reject"** → đạt: status patient cập nhật thành `VERIFIED`/`REJECTED`.

> ⚠️ **Lưu ý**: báo cáo audit chỉ xác nhận trang này **không crash**, chưa test hết chain thật (OCR, upload ảnh thật, review chi tiết) — nên bạn cần tự chạy thử full chain này trước khi đưa vào demo chính thức.

---

## Thông báo — Notification (đã hoạt động)

**Flow:** bất kỳ trang nào sau khi login, ấn icon **chuông** (NotificationBell) ở top-nav → đạt: dropdown hiện danh sách thông báo, badge đỏ đếm số chưa đọc
→ ấn vào 1 thông báo chưa đọc → đạt: đánh dấu đã đọc, badge giảm.

> Notification thật sự được sinh ra khi có action như "Send Reminder"/"Send Confirmation" ở bước Đặt lịch, hoặc khi refund được approve — nên test tốt nhất là làm xong 1 trong các flow trên rồi quay lại kiểm tra chuông.
