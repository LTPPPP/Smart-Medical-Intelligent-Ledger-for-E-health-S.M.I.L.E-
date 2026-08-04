# Demo Test Guide

## Tài khoản demo

Mật khẩu chung: **`Password123!`**

| Email | Role | Tên hiển thị (đã seed sẵn) |
|---|---|---|
| `admin@smile.com` | ADMIN | Nguyễn Văn Quản Lý |
| `dr.nguyenvana@smile.com` | DOCTOR | BS. Nguyễn Văn A |
| `nguyenvana.pt@email.com` | PATIENT | Nguyễn Văn An |
| `nurse.dothih@smile.com`  | NURSE  | Đỗ Thị H |
| `recep.levan@smile.com`   | RECEPTIONIST | Lê Văn Tiếp Nhận |

Bác sĩ phụ (đã seed sẵn, dùng để demo "chuyển ca"/"gán vai trò"): `dr.tranthib@smile.com` — **BS. Trần Thị B**.

Dữ liệu nền đã seed sẵn (dùng để xem/sửa, không cần tạo lại): 2 phòng khám **"Nha Khoa S.M.I.L.E - Hồ Chí Minh"** (mã `SMILE-HCM`) và **"Nha Khoa S.M.I.L.E - Hà Nội"** (mã `SMILE-HN`); 6 chuyên khoa **Nha khoa tổng quát, Chỉnh nha, Nội nha, Nha chu, Phẫu thuật hàm mặt, Nha khoa thẩm mỹ**; các dịch vụ **Khám tổng quát (200.000đ), Tư vấn điều trị (100.000đ), Cạo vôi răng (300.000đ), Trám răng (500.000đ), Điều trị tủy răng (1.200.000đ), Nhổ răng (800.000đ), Tẩy trắng răng (3.000.000đ), Bọc răng sứ (5.000.000đ), Cấy ghép Implant (15.000.000đ)**.

---

## Lưu ý chung trước khi quay

- App mặc định hiển thị tiếng Việt, nhưng một số trang **viết cứng tiếng Anh** (không qua i18n) — sẽ được đánh dấu ⚠ ngay dưới bước liên quan để không bị bất ngờ khi quay: `/register`, `/profile`, `/patients` (danh sách), `/dental-images`, `/patients/[id]/images`, `/admin/refunds`, `/admin/performance`, `/admin/revenue-reports`, `/examinations/new`, một vài dialog xóa (Delete symptom?/Delete treatment plan?).
- **Chatbot đặt lịch** (`/chat`): widget chat nổi đã code xong nhưng **chưa được mount vào app** ở bản build hiện tại — trang chỉ hiện giới thiệu tĩnh, không bấm được. Bỏ qua hoặc quay như "tính năng sắp ra mắt".
- **"Notify Schedule Change"** không có trang riêng (`/schedules/changes` là route chết) — thể hiện qua toast + chuông thông báo + modal "Lịch sử thay đổi" trên `/schedules/doctors`.
- **"Treatment Plan"** (kế hoạch điều trị, trong phiên khám `/examinations/[id]`) và **"Treatment Profile"** (hồ sơ điều trị/thủ thuật, trong `/patients/[id]`) là hai khái niệm khác nhau, đừng nhầm khi quay.
- Có 2 luồng "Medical Record": dùng đúng luồng trong `/patients/[id]` cho demo. Các trang `/patients/[id]/medical-records/new` và `/patients/[id]/medical-records/[recordId]` là code cũ, không có link điều hướng tới trong app — không quay.
- Có 2 luồng Dental Image: dùng `/dental-images` (đầy đủ category/annotate/archive/gắn treatment profile) làm luồng chính; `/patients/[id]/images` là luồng phụ hỗ trợ upload file thật (luồng chính chỉ dán URL ảnh có sẵn).
- Không có tài khoản demo role MANAGER — mọi quyền yêu cầu MANAGER trong code đều đi kèm ADMIN, nên cứ dùng `admin@smile.com` thay thế, trừ "Add/Edit Patient Profile" chỉ chấp nhận MANAGER hoặc RECEPTIONIST → dùng `recep.levan@smile.com`.
- **KYC tự phục vụ** (tab "Identity Verification" trong `/profile`) chỉ dành cho **DOCTOR, RECEPTIONIST, ADMIN** thực hiện — PATIENT và NURSE không có tab này, không demo bằng 2 role đó.
- Các ví dụ điền form dưới đây dùng chung một mạch dữ liệu xuyên suốt 8 chuỗi (cùng 1 phòng khám mới "Cần Thơ", cùng 1 bệnh nhân mới "Trần Thị Mai", cùng 1 lịch hẹn...) để khi quay video, dữ liệu tạo ở chuỗi trước xuất hiện lại ở chuỗi sau — cứ điền đúng như ví dụ, đừng đổi tên khác sẽ bị lệch mạch.

### Các phát hiện sau khi test lại thực tế toàn bộ 8 chuỗi (đã sửa 5 lỗi backend, còn lại là hạn chế cần lưu ý khi quay)

**Đã sửa trong code (không cần đổi cách quay):**
- Thiếu biến môi trường `INTERNAL_SERVICE_TOKEN` ở `iam-service` và `clinical-emr-service` khiến "Gửi xác nhận"/"Gửi nhắc lịch" lỗi 503/500 — đã thêm token khớp nhau ở cả 2 service.
- Thiếu cột `scheduled_for` trong bảng `appointment_notification_logs` (migration chưa từng chạy trên DB dev) khiến "Gửi nhắc lịch" crash 500 — đã bổ sung cột + index.
- Lỗi `Number.isFinite` trên chuỗi số ở `payment-service` khiến ADMIN bấm **"Approve"** hoàn tiền (không nhập số tiền) luôn lỗi "Refund amount must be greater than zero" — đã sửa để ép kiểu số trước khi kiểm tra. Đây là lỗi 100% tái diễn qua UI thật vì UI không bao giờ gửi kèm amount khi Approve.
- Nút **"Xuất"** hồ sơ bệnh án luôn lỗi 409 "must be finalized" vì không có nút nào để chốt (finalize) hồ sơ trước — đã sửa để tự động finalize ngay khi bấm Xuất.
- (Từ phiên trước) Duplicate config `KYC_FILE_ENCRYPTION_KEY` rỗng đè lên key thật trong `.env` của `iam-service` khiến mọi lần nộp KYC lỗi — đã xóa block trùng.

**Hạn chế thật của hệ thống, cần né hoặc lưu ý khi quay (chưa sửa trong lần test này):**
- **Giới hạn 1 lịch hẹn/ngày/bệnh nhân**: backend chặn cứng "Only one booking per day is allowed" — 4 lịch hẹn tạo liên tiếp ở Chuỗi 5 Bước 5-8 **không thể cùng "ngày mai"** như bản gốc, phải rải ra các ngày khác nhau (đã sửa ngày cụ thể ở từng bước dưới).
- **Sửa lịch hẹn (Edit Appointment) hiện đang hỏng hoàn toàn**: trang `/appointments/{id}/edit` luôn gửi kèm `appointment_date`/`appointment_time` trong mọi lần lưu (dù không đổi giờ), nhưng backend giờ luôn từ chối các field lịch (ngày/giờ/phòng/dịch vụ) trong request PATCH chung với lỗi `SCHEDULING_UPDATE_REQUIRES_OPTION_TOKEN` — nghĩa là **Bước 10 của Chuỗi 5 sẽ luôn lỗi 400 nếu bấm "Lưu thay đổi"**. Đây là bug thật của frontend (chưa sửa trong lần test này vì cần xây lại luồng chọn slot mới, không phải 1 dòng), nên khi quay: chỉ demo việc mở form sửa và đổi giá trị trên UI, đừng bấm "Lưu thay đổi" thật, hoặc nói rõ "tính năng đang lỗi, đang chờ fix".
- **"Xuất" hồ sơ bệnh án không thực sự tạo file**: sau khi sửa lỗi 409 ở trên, bấm Xuất sẽ thành công và hiện toast, nhưng backend chưa có tính năng sinh PDF thật (`file_url` luôn trả về `null`) — sẽ **không có tab mới nào mở ra**. Chỉ nên quay tới bước thấy toast "Đã xuất hồ sơ", không nói "mở file" như bản gốc.
- **Upload ảnh nha khoa qua `/dental-images` không nhận URL công khai**: dán URL kiểu `https://picsum.photos/...` như ví dụ dưới đây sẽ bị backend chặn với lỗi "Dental image URL must be a private storage key, not a public URL." (có vẻ là cơ chế chống SSRF được thêm sau, cố ý — không nên gỡ). Muốn Bước 24-25 chạy được qua API thật, phải dán một chuỗi dạng key nội bộ không có `http(s)://` (ví dụ `dental-images/{patient_id}/demo-endo.jpg`) — ảnh sẽ không hiển thị thật vì không có file thật phía sau, nhưng bản ghi vẫn tạo được để tiếp tục minh họa các bước sau (list/edit).
- Sau khi RECEPTIONIST xác nhận hủy lịch hẹn ở Chuỗi 5 Bước 12, hồ sơ bệnh nhân **tự động chuyển sang "Đang bị chặn đặt lịch hẹn mới"** (tính năng thật, có nút "Gỡ chặn đặt lịch" trên `/patients/{id}`) — nếu không muốn video xuất hiện banner này mà không giải thích, có thể demo luôn nút gỡ chặn ngay sau Bước 12, hoặc nói rõ đây là tính năng an toàn tự động.
- Chuỗi 4 (chuyển ca từ BS. Trần Thị B sang BS. Nguyễn Văn A) làm BS. Trần Thị B — bác sĩ duy nhất có chuyên khoa "Phẫu thuật hàm mặt" tại cơ sở Hồ Chí Minh — mất lịch làm việc ở đó, nên Chuỗi 5 Bước 8 (đặt lịch ngoài giờ theo chuyên khoa) **không thể dùng "Phẫu thuật hàm mặt"** nữa (lỗi "No doctors ... are affiliated with clinic"); đã đổi ví dụ sang chuyên khoa "Nha khoa tổng quát" ở bước tương ứng.
- Chuỗi 7 Bước 1 nói lịch hẹn "đã check-in ở Chuỗi 5" nhưng bản gốc không có bước nào thực hiện check-in — đã bổ sung bước check-in (RECEPTIONIST gán bác sĩ/dịch vụ + check-in) vào cuối Chuỗi 5.
- Chuỗi 7 Bước 11 ("Đề xuất" kế hoạch điều trị) yêu cầu điền field **"Quote version"** (tiếng Anh, ở form tạo/sửa kế hoạch) — nếu bỏ trống như bản gốc, bấm "Đề xuất" sẽ lỗi 400 "quote_version is required". Đã bổ sung field này vào Bước 8 (Create Treatment Plan).
- Đã sắp lại toàn bộ thứ tự bước trong Chuỗi 7 theo đúng thứ tự hiện trên màn hình trong code (trước đây các bước nhảy qua lại lộn xộn giữa 2 trang, và bỏ sót hẳn 2 mục): làm hết các mục trên `/examinations/{id}` theo đúng thứ tự từ trên xuống (Ghi chú lâm sàng → Symptoms → Diagnoses → Treatment Plans → Prescription → Sơ đồ răng → Diagnostic Orders → Clinical/Lab Orders), rồi mới chuyển sang `/patients/{id}` và làm hết các mục theo đúng thứ tự từ trên xuống ở đó (Medical History → Medical Records → Treatment Profile). Riêng bước **"Xuất hồ sơ bệnh án"** vẫn cố ý đặt ở cuối cùng (sau Treatment Profile, dù về vị trí hiển thị mục "Hồ sơ bệnh án" nằm trên mục "Hồ sơ điều trị") vì lý do kỹ thuật: sau khi Export (tự động finalize) hồ sơ, backend không cho thêm Treatment Profile mới vào hồ sơ đã finalize ("Finalized medical records cannot change treatment history").

---

## Chuỗi 1 — Auth & Onboarding

**Tài khoản:** tài khoản tự đăng ký mới, sau đó `dr.nguyenvana@smile.com` (DOCTOR) cho đoạn KYC tự phục vụ (KYC chỉ dành cho DOCTOR, RECEPTIONIST, ADMIN — PATIENT và NURSE không có tab này).

Bước 1: Vào `/register` → điền **First Name: `Minh`**, **Last Name: `Trần Quang`**, chọn **Gender: Male**, **Username: `tranquangminh`**, **Email: `tranquangminh99@gmail.com`**, **Phone: `0987654321`** (tùy chọn), **Password: `Demo@123456`**, **Confirm Password: `Demo@123456`** → bấm **"Create Account"** (Signup).
> ⚠ Trang này viết cứng tiếng Anh.

Bước 2 (nhánh phụ): Tại `/register`, bấm **"Continue with Google"** để demo đăng ký bằng Google thay cho form thủ công.

Bước 3: Vào `/login`, điền **"Email hoặc số điện thoại": `tranquangminh99@gmail.com`** + **"Mật khẩu": `Demo@123456`**, tick **"Ghi nhớ đăng nhập"** (tùy chọn) → bấm **"Đăng nhập"** (Login).

Bước 4 (nhánh phụ): Tại `/login`, bấm **"Tiếp tục với Google"** → chọn tài khoản trên popup Google → đăng nhập thẳng, không cần qua `/google-callback` (Login with Google).

Bước 5: Gõ sai mật khẩu một lần (ví dụ `SaiMatKhau123`) để minh họa lỗi đăng nhập, sau đó bấm link **"Quên mật khẩu"**.

Bước 6: Tại `/forgot-password`, bước 1/3 "Xác minh": điền **`tranquangminh99@gmail.com`** → bấm **"Gửi mã đặt lại"** (Send OTP, Forgot Password).

Bước 7: Bước 2/3 "Đặt lại": điền mã OTP 6 số (lấy từ email/log, ví dụ `123456`), **"Mật khẩu mới": `Demo@2026!`**, **"Xác nhận mật khẩu": `Demo@2026!`** → bấm **"Đặt lại mật khẩu"**.

Bước 8: Bước 3/3 "Hoàn tất": bấm **"Quay lại đăng nhập"** → đăng nhập lại bằng `tranquangminh99@gmail.com` / `Demo@2026!` để xác nhận đổi thành công (Reset Password).

Bước 9: Sau khi đăng nhập, vào `/profile` → tab **"Profile Info"** để xem hồ sơ (View Profile).

Bước 11: Chuyển tab **"Edit Profile"** → sửa **Họ tên: `Trần Quang Minh`**, **Ngày sinh: `12/08/1999`**, **Giới tính: Nam**, **Địa chỉ: `12 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM`** *(field Địa chỉ hiện chỉ có trên UI, không được lưu xuống backend — `PATCH /accounts/me` không nhận field address, nên đừng nhấn mạnh "đã lưu địa chỉ" khi quay)* → bấm **"Save Changes"** (Update Profile). Có thể bấm icon camera trên avatar để đổi ảnh đại diện.

Bước 12: Chuyển tab **"Change Password"** → điền **New Password: `Demo@2027!`**, **Confirm Password: `Demo@2027!`** (checklist độ mạnh mật khẩu cập nhật trực tiếp) → bấm **"Change Password"** (Change Password).

## Chuỗi 1.1: Đăng Ký KyC

Bước 1: Đăng nhập bằng `dr.nguyenvana@smile.com` (DOCTOR) — KYC chỉ dành cho DOCTOR, RECEPTIONIST, ADMIN thực hiện (PATIENT, NURSE không có tab này). Vào `/profile` → tab **"Identity Verification"** → bấm nút gửi OTP số điện thoại → nhập mã 6 số để xác minh SĐT (Send OTP, lần 2 — dùng cho KYC).

Bước 14: Vẫn ở tab Identity Verification: điền **"ID Number": `079080012345`** (12 số), upload/chụp ảnh CCCD **mặt trước** và **mặt sau** (dùng ảnh mẫu bất kỳ), tick đồng ý điều khoản lưu trữ giấy tờ → bấm **"Submit KYC"** (Verify Identity KYC, phía người dùng).

Bước 15: Bấm **"Submission history"** để mở modal xem lại lịch sử các lần nộp KYC.

Bước 16: Cuối chuỗi, ở sidebar bấm nút đỏ **"Đăng xuất"** (icon log-out) → bấm **lần 2** trong vòng 3 giây để xác nhận thật (Logout — có cơ chế bấm 2 lần để tránh đăng xuất nhầm).

---

## Chuỗi 2 — IAM Admin

**Tài khoản:** `admin@smile.com` (ADMIN) — toàn chuỗi này chỉ ADMIN truy cập được.

Bước 1: Đăng nhập bằng `admin@smile.com`. Sidebar bấm **"Quản lý người dùng"** → `/admin/users-management` (View User List).

Bước 2: Dùng ô **"Tìm theo tên..."** gõ **`Trần Thị B`** để tìm nhanh bác sĩ phụ dùng demo bên dưới, hoặc dropdown giới tính để lọc; bấm **"Làm mới"** để tải lại danh sách.

Bước 3: Trên dòng **"BS. Trần Thị B" (`dr.tranthib@smile.com`)**, bấm **"Ban"** → dialog **"Cấm người dùng"** mở ra → điền Reason: **`Tài khoản demo tạm khóa để kiểm tra tính năng`** (tùy chọn) → bấm **"Xác nhận cấm"** (Lock/Ban User Account).

Bước 4: Trên chính dòng "BS. Trần Thị B" vừa ban, bấm **"Unban"** ngay trên dòng (không có dialog xác nhận) (Unlock/Unban User Account).

Bước 5: Trên dòng "BS. Trần Thị B", bấm **"Vai trò"** (icon shield) → mở dialog **"Quản lý vai trò"**.

Bước 6: Trong dialog, bật switch **"RECEPTIONIST"** để **gán tạm** (Assign Role) minh họa 1 tài khoản có 2 vai trò, sau đó tắt lại switch đó để **thu hồi** (Revoke Role) — áp dụng ngay khi bấm switch, không cần lưu riêng → bấm **"Done"** để đóng.

Bước 7: Sidebar bấm **"Quản lý vai trò"** → `/admin/roles-management` (View Role).

Bước 8: Bấm **"Tạo vai trò"** → dialog "Create Role" → điền **Role Name: `TRIAGE_NURSE`**, **Description: `Điều dưỡng phân loại bệnh nhân tại khu tiếp nhận`** → bấm **"Create Role"** (Update Role, phần tạo mới).

Bước 9: Bấm **"Quyền mới"** → dialog "Create Permission" → điền **Resource: `prescription`**, **Action: `sign`** (Permission Name tự điền `prescription.sign`), **Description: `Cho phép ký số đơn thuốc điện tử`** → bấm **"Create"** (Create Permission).

Bước 10: Trong bảng vai trò, bấm vào dòng **"TRIAGE_NURSE"** vừa tạo (hoặc chevron mở rộng) → hiện ma trận quyền theo nhóm resource → tick checkbox **`medical_record.read`** để gán quyền xem hồ sơ bệnh án cho vai trò này (View Permissions / Update Role Permissions).

Bước 11: Bấm icon thùng rác trên vai trò **"TRIAGE_NURSE"** (vai trò demo vừa tạo, xóa an toàn không ảnh hưởng dữ liệu khác) → confirm dialog "Xóa vai trò "TRIAGE_NURSE"? Không thể hoàn tác." → bấm **"Xóa"** để xóa hẳn.

Bước 12: Sidebar bấm **"Nhật ký hệ thống"** → `/admin/audit-logs` (Access Audit Log).

Bước 13: Dùng ô tìm kiếm gõ **`tranthib`**, dropdown hành động chọn **"UPDATE"**, dropdown tài nguyên chọn **"user"**, chọn khoảng ngày là hôm nay để lọc; bấm **"Làm mới"**; bấm chevron trên dòng log "Ban/Unban BS. Trần Thị B" vừa tạo ở Bước 3-4 để xem chi tiết Resource ID/Device/Details (JSON).

Bước 14: Sidebar bấm **"Quản lý KYC"** → `/admin/kyc-management` — đây là nơi duyệt hồ sơ KYC đã nộp ở Chuỗi 1, Bước 14 (tìm theo tên **"BS. Nguyễn Văn A"** hoặc 4 số cuối CCCD **`2345`**).

Bước 15: Bấm **"Review"** trên hồ sơ đang trạng thái **Pending review** → panel trượt ra bên phải "KYC Review", hiện ảnh CCCD 2 mặt + bảng so sánh OCR (loại giấy tờ, số ID OCR `079080012345`, họ tên OCR "Nguyễn Văn A", ngày sinh OCR, mức rủi ro).

Bước 16: Bấm **"Approve"** để duyệt, hoặc điền lý do (tối thiểu 3 ký tự, ví dụ **`Ảnh CCCD mờ, không đọc được số`**) vào **"Reason required for rejection"** rồi bấm **"Reject"** để từ chối (Verify Identity KYC, phía admin).
> ⚠ Panel review + nút Approve/Reject viết cứng tiếng Anh; phần filter/thống kê xung quanh vẫn là tiếng Việt.

---

## Chuỗi 3 — Facility Setup

**Tài khoản:** `admin@smile.com` (ADMIN) — Add/Edit/Delete clinic, room, specialty yêu cầu ADMIN hoặc MANAGER, dùng ADMIN thay thế.

Bước 1: Vào `/clinics` — xem lưới card danh sách phòng khám, đã có sẵn 2 chi nhánh **"Nha Khoa S.M.I.L.E - Hồ Chí Minh"** và **"Nha Khoa S.M.I.L.E - Hà Nội"** (View Clinic Information).

Bước 2: Bấm **"Add Clinic"** → `/clinics/new` → điền **Clinic name: `Nha Khoa S.M.I.L.E - Cần Thơ`**, **Clinic code: `SMILE-CT`**, **Address: `789 Đường 3 Tháng 2`**, **Ward: `An Khánh`**, **District: `Ninh Kiều`**, **City: `Cần Thơ`**, **Phone: `0292-345-6789`**, **Email: `cantho@smile.vn`**, **Website: `https://smile.vn/cantho`** → bấm **"Create clinic"**.

Bước 3: Trên danh sách, bấm **"Xem chi tiết"** trên card **"Nha Khoa S.M.I.L.E - Hồ Chí Minh"** → `/clinics/{id}` (View Clinic Details).

Bước 4: Bấm **"Edit"** → `/clinics/{id}/edit` → sửa **Phone: `028-1234-9999`** (số mới) → bấm **"Save changes"** (Update Clinic Information).

Bước 5: Mở chi tiết chi nhánh **"Nha Khoa S.M.I.L.E - Cần Thơ"** vừa tạo ở Bước 2, cuộn tới mục **"Treatment rooms"** → bấm **"Add room"** → điền **Room name: `Phòng Khám 2`**, **Room code: `PK-02`**, **Room type: examination**, **Floor: `1`**, **Capacity: `1`**, **Status: AVAILABLE** → submit (Add Treatment Room).

Bước 6: Xem lưới phòng vừa tạo hiện ngay dưới mục — chi nhánh HCM đã có sẵn "Phòng Khám 1" (PK-01), "Phòng Phẫu Thuật 1" (PT-01), "Phòng X-Quang" (XQ-01); chi nhánh Cần Thơ giờ có "Phòng Khám 2" (PK-02) (View Treatment Room).

Bước 7: Hover room card **"Phòng Khám 2"**, bấm icon bút → sửa **Floor: `2`** → **Save** (Update Treatment Room).

Bước 8: Bấm icon thùng rác trên **"Phòng Khám 2"** → confirm "Delete room?" → xác nhận xóa (Delete Treatment Room).

Bước 9: Sidebar bấm **"Chuyên khoa"** → `/specialties` (View Specialty) — đã có sẵn 6 chuyên khoa: Nha khoa tổng quát, Chỉnh nha, Nội nha, Nha chu, Phẫu thuật hàm mặt, Nha khoa thẩm mỹ.

Bước 10: Bấm **"Add Specialty"** → dialog → điền **Tên: `Nha khoa trẻ em`**, **Mã: `PEDO`**, **Mô tả: `Khám và điều trị răng miệng cho trẻ em (Pediatric Dentistry)`**, bật cờ active, chọn clinic liên kết: cả 3 chi nhánh (HCM, Hà Nội, Cần Thơ) → submit (Add Specialty).

Bước 11: Bấm **"Edit"** trên card **"Nha khoa trẻ em"** → sửa Mô tả thêm **`, áp dụng cho bệnh nhân dưới 12 tuổi`** → **Save** (Update Specialty).

Bước 12: Bấm **"Delete"** trên card **"Nha khoa trẻ em"** → confirm "Delete specialty?" → xác nhận (Delete Specialty).

---

## Chuỗi 4 — Doctor Scheduling

**Tài khoản:** `admin@smile.com` (ADMIN) cho phần xếp ca; `dr.nguyenvana@smile.com` (DOCTOR) cho phần lịch cá nhân.

Bước 1: (ADMIN) Vào `/schedules/doctors` ("Lịch làm việc & trực") → bấm **"Tạo lịch mới"**.

Bước 2: Điền **Doctor: `BS. Trần Thị B`**, **Clinic: `Nha Khoa S.M.I.L.E - Hồ Chí Minh`**, **Work date: ngày mai**, **Shift: `Ca sáng (08:00–12:00)`**, **Max patients: `10`**, **Notes: `Trực buổi sáng thay ca`** → bấm **"Create schedule"** → toast "Đã tạo lịch làm việc — bác sĩ đã được thông báo" (Create Work Schedule - On-Call Schedule).

Bước 3: Trên danh sách, bấm icon bút ở dòng "BS. Trần Thị B" vừa tạo → `/schedules/doctors/edit/{id}` → sửa **Max patients: `12`** → **"Save changes"** → toast "Đã cập nhật... — bác sĩ đã được thông báo" (Update Work Schedule - On-Call Schedule).

Bước 4: Trên cùng dòng, bấm icon lịch sử (tooltip "Lịch sử thay đổi") → modal liệt kê change_type/reason/changed_by/timestamp (Notify Schedule Change — không có trang riêng, thể hiện qua toast + chuông + modal này).

Bước 5: Bấm icon chuyển ca (tooltip "Chuyển ca") trên dòng "BS. Trần Thị B" → dialog "Chuyển ca": chọn **"Transfer to": `BS. Nguyễn Văn A`**, điền **"Lý do": `Bác sĩ B nghỉ đột xuất`** (bắt buộc), **"Ghi chú": `Đã thông báo bệnh nhân đổi bác sĩ`** (tùy chọn) → bấm **"Transfer"** → toast "Đã chuyển ca — bác sĩ đã được thông báo" (Notify Shift Transfer).

Bước 6: Đăng xuất, đăng nhập lại bằng `dr.nguyenvana@smile.com` (DOCTOR). Vào `/schedules/my-schedule` ("Lịch của tôi") (View Personal Schedule - Examination).

Bước 7: Bấm **"Đăng ký lịch"** → panel "Đăng ký lịch cá nhân" mở ngay trong trang (không chuyển trang) → điền **Clinic: `Nha Khoa S.M.I.L.E - Hồ Chí Minh`**, **Work date: ngày mai**, **Shift: `Ca chiều (13:00–17:00)`**, **Max patients: `8`** (bác sĩ tự động là chính mình) → bấm **"Đăng ký"** → toast "Đã đăng ký lịch cá nhân" (Register Personal Schedule - Examination).

Bước 8: Bấm vào ngày vừa đăng ký trên calendar → dialog liệt kê lịch của ngày đó → bấm **"Cập nhật"** → chuyển tới `/schedules/doctors/edit/{id}` → sửa **Notes: `Đổi sang ca chiều mở rộng, nhận thêm 2 bệnh nhân`** để sửa (Update Personal Schedule - Examination).

---

## Chuỗi 5 — Patient Booking

**Tài khoản:** `recep.levan@smile.com` (RECEPTIONIST) cho tạo hồ sơ bệnh nhân; `nguyenvana.pt@email.com` (PATIENT, đã có sẵn bệnh nhân "Nguyễn Văn An") cho phần đặt lịch tự phục vụ.

Bước 1: (RECEPTIONIST) Vào `/patients` → bấm **"Add Patient"** → `/patients/new` → điền **Mã bệnh nhân: `PT-000101`**, **Họ và tên: `Trần Thị Mai`**, **Ngày sinh: `20/08/1998`**, **Giới tính: Nữ**, **SĐT: `0912345678`**, **Email: `mai.tran98@gmail.com`**, **Địa chỉ: `45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM`**, **Dị ứng: `Penicillin`**, **Bệnh mãn tính: `Không`** → bấm **"Tạo bệnh nhân"** (Add Patient Profile).
> ⚠ Trang danh sách `/patients` viết cứng tiếng Anh; riêng trang `/patients/new` là tiếng Việt.

Bước 2: Trên danh sách `/patients`, bấm **"View"** trên dòng **"Trần Thị Mai"** → `/patients/{id}` (View Patient Profile).

Bước 3: Bấm **"Edit"** → sửa **Địa chỉ: `45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM (gần chợ Bến Thành)`** → bấm **"Lưu thay đổi"** (Update Patient Profile).

Bước 4: Đăng xuất, đăng nhập bằng `nguyenvana.pt@email.com` (PATIENT — bệnh nhân "Nguyễn Văn An"). Vào `/appointments` → bấm **"Đặt lịch hẹn mới"** → `/appointments/new`.

> ⚠ **Backend chặn tối đa 1 lịch hẹn/ngày cho mỗi bệnh nhân** ("Only one booking per day is allowed") — 4 lịch hẹn ở Bước 5-8 dưới đây phải nằm ở **4 ngày khác nhau**, không thể cùng "ngày mai" như một mạch. Dùng đúng ngày ví dụ ở từng bước.

Bước 5: Ở màn chọn phương thức, chọn card **"Tại cơ sở"** → chọn Clinic **`Nha Khoa S.M.I.L.E - Hồ Chí Minh`** → chọn **Ngày: ngày mai (mai +1)**, **Giờ: `09:00`** (chưa cần chọn bác sĩ, lễ tân sẽ phân công khi check-in) → điền ghi chú **`Đau răng hàm dưới bên trái, muốn khám tổng quát`** → bấm **"Xác nhận đặt lịch"** (Create Appointment at Facility).

Bước 6: Lặp lại, lần này chọn card **"Theo chuyên khoa"** → chọn Specialty **`Nha khoa tổng quát`** → chọn Clinic **`Nha Khoa S.M.I.L.E - Hồ Chí Minh`** (đã lọc theo chuyên khoa) + **Ngày: mai + 2 ngày**, **Giờ: `10:00`** → xác nhận (Create Appointment by Specialty).

Bước 7: Lặp lại, chọn card **"Theo bác sĩ"** → chọn Clinic **`Nha Khoa S.M.I.L.E - Hồ Chí Minh`** → chọn Doctor **`BS. Nguyễn Văn A`** + Service **`Khám tổng quát`** → chọn khung giờ trống thật trên lưới "Available slots" ở **ngày mai + 3 ngày**, ví dụ **`14:00 - 14:30`** → điền lý do khám **`Đau răng số 7 hàm dưới trái`** → xác nhận (Create Appointment by Doctor). *(Đây là lịch hẹn chính dùng tiếp ở Chuỗi 6 và Chuỗi 7.)*

Bước 8: Lặp lại, chọn card **"Ngoài giờ"** → chọn Specialty **`Nha khoa tổng quát`** *(không chọn "Phẫu thuật hàm mặt" — sau khi chuyển ca ở Chuỗi 4, không còn bác sĩ chuyên khoa này trực tại cơ sở Hồ Chí Minh nữa, chọn sẽ lỗi "No doctors ... are affiliated with clinic")* → chọn **Ngày: mai + 4 ngày**, **Giờ: `21:00`** (ngoài giờ hoạt động 08:00–20:00, có banner cảnh báo cần phê duyệt thêm) → điền **"Ghi chú (lý do khám ngoài giờ)": `Đau răng khôn cấp, sưng má, cần khám gấp ngoài giờ`** (bắt buộc) → xác nhận (Create Appointment Outside Working Hours).

Bước 9: Vào `/appointments`, bấm icon mắt trên dòng lịch hẹn với **BS. Nguyễn Văn A (14:00)** tạo ở Bước 7 → `/appointments/{id}` (View Appointment).

Bước 10 ⚠ (tính năng đang lỗi, chỉ nên demo mở form, không bấm lưu thật): Bấm icon bút (chỉ hiện với PATIENT/RECEPTIONIST) → `/appointments/{id}/edit` → sửa **Giờ: `10:30`** (đổi từ 14:00) trên UI để minh họa form, nhưng **không bấm "Lưu thay đổi"** — trang này hiện luôn gửi kèm ngày/giờ trong mọi lần lưu và bị backend từ chối 400 (`SCHEDULING_UPDATE_REQUIRES_OPTION_TOKEN`), kể cả khi không đổi giờ. Nếu muốn quay cảnh lưu thành công, cần đợi fix luồng chọn lại slot mới (Edit Appointment).

Bước 11: Ở trang chi tiết lịch hẹn "Tại cơ sở" tạo ở Bước 5, PATIENT bấm nút pill **"Hủy lịch hẹn"** → điền lý do **`Bận việc đột xuất, xin dời lịch khác`** trong modal → gửi → toast "Đã gửi yêu cầu hủy — lễ tân sẽ xác nhận" (Cancel Appointment, phía patient chỉ tạo yêu cầu).

Bước 12: Đăng xuất, đăng nhập lại `recep.levan@smile.com` (RECEPTIONIST). Mở lại lịch hẹn vừa bị yêu cầu hủy ở Bước 11 → bấm nút **"Xác nhận hủy"** để lễ tân xác nhận hủy thật (Cancel Appointment, phía staff). *(Sau bước này, hồ sơ "Nguyễn Văn An" sẽ tự động hiện banner "Đang bị chặn đặt lịch hẹn mới" trên `/patients/{id}` — tính năng an toàn thật, có thể demo tiếp nút "Gỡ chặn đặt lịch" ngay tại đây nếu muốn giải thích banner này trong video.)*

Bước 13: Trên lịch hẹn "Theo chuyên khoa" (Bước 6) đang trạng thái "scheduled", RECEPTIONIST bấm icon dấu tick **"Xác nhận"** → toast "Đã xác nhận lịch hẹn" (Confirm Appointment).

Bước 14: Bấm icon mail-check **"Gửi xác nhận"** trên cùng lịch hẹn → toast "Đã gửi xác nhận" (Send Appointment Confirmation).

Bước 15: Bấm icon chuông **"Gửi nhắc lịch"** → toast "Đã gửi nhắc lịch" (Send Appointment Reminder).

Bước 16: Trên lịch hẹn "Theo bác sĩ" (14:00, Bước 7) — lịch hẹn chính dùng tiếp ở Chuỗi 6/7 — RECEPTIONIST bấm icon check-in, chọn lại **Doctor: `BS. Nguyễn Văn A`** + **Service: `Khám tổng quát`** → bấm **"Check-in"** → trạng thái chuyển thành "Checked-in" (Check-in Appointment — bắt buộc phải làm bước này thì Chuỗi 7 Bước 1 mới có lịch hẹn "checked_in" để chọn).

Bước 17 (nhánh phụ, có thể bỏ qua): Vào `/chat` — hiện chỉ là trang tĩnh giới thiệu chatbot, nút chat nổi chưa được mount vào app nên không bấm được (Chatbot Support for Booking — ghi chú "chưa khả dụng trong bản build hiện tại" nếu vẫn muốn nhắc tới trong video).

---

## Chuỗi 6 — Payment

**Tài khoản:** `nguyenvana.pt@email.com` (PATIENT) cho phần thanh toán/hoàn tiền; `admin@smile.com` (ADMIN) cho phần duyệt hoàn tiền.

Bước 1: (PATIENT) Từ `/appointments`, bấm icon thẻ tín dụng **"Pay"** trên lịch hẹn với **BS. Nguyễn Văn A (14:00, Khám tổng quát)** tạo ở Chuỗi 5 Bước 7 → `/appointments/{id}/payment` (Initiate Payment).

Bước 2: Xem **"Tóm tắt thanh toán"** (mã lịch hẹn, ngày giờ `14:00`, dịch vụ `Khám tổng quát` — `200.000đ`, bác sĩ `BS. Nguyễn Văn A`, phòng khám `Nha Khoa S.M.I.L.E - Hồ Chí Minh`); ở **"Phương thức thanh toán"** chỉ VNPay khả dụng (MoMo/ZaloPay hiện nhãn "Sắp có").

Bước 3: Bấm **"Tiếp tục đến VNPay"** → *(⚠ khác với mô tả gốc: build hiện tại là VNPay **mock hoàn toàn**, không có redirect ra cổng VNPay thật, không có màn nhập số thẻ/OTP)* → app tự chuyển thẳng tới `/appointments/{id}/payment/callback` với mã phản hồi thành công đã có sẵn, không cần nhập thông tin thẻ gì cả.

Bước 4: VNPay tự redirect về `/appointments/{id}/payment/callback` (không cần bấm gì) → hiện "Đang xử lý thanh toán" rồi "Thanh toán thành công!" → tự chuyển về trang chi tiết lịch hẹn sau 6 giây (Confirm Payment).

Bước 5: Trên trang callback hoặc trang chi tiết lịch hẹn, xem bảng **"Lịch sử thanh toán"** — dòng `200.000đ`, trạng thái `Paid` (View Payment History — không có trang tổng hợp riêng cho tất cả lịch hẹn, chỉ xem theo từng lịch hẹn).

Bước 6: Trên dòng thanh toán `200.000đ` đã "paid", bấm **"Yêu cầu hoàn tiền"** → dialog: điền **"Số tiền hoàn (VND)": `200000`** (mặc định là toàn bộ số đã trả), **"Lý do hoàn tiền": `Đặt lịch nhầm ngày, không thể đến khám`** (bắt buộc) → bấm **"Gửi yêu cầu"** → toast "Đã gửi yêu cầu hoàn tiền" (Refund / Cancel Payment, phía patient).

Bước 7: Đăng xuất, đăng nhập `admin@smile.com` (ADMIN). Vào `/admin/refunds`.

Bước 8: Lọc theo pill trạng thái Pending/Under Review → tìm yêu cầu hoàn `200.000đ` của "Nguyễn Văn An" → bấm **"Approve"** để duyệt ngay, hoặc bấm **"Reject"** → điền "Rejection reason": **`Yêu cầu quá thời hạn hoàn tiền theo chính sách`** (bắt buộc) → **"Confirm rejection"** để từ chối (Refund, phía admin duyệt/từ chối).
> ⚠ Trang `/admin/refunds` viết cứng hoàn toàn tiếng Anh.

---

## Chuỗi 7 — Clinical / EMR (khám bệnh)

**Tài khoản:** `dr.nguyenvana@smile.com` (DOCTOR) là chính; `nurse.dothih@smile.com` (NURSE) chỉ xem được, không tạo được phiên khám mới (EXAMINATION_CREATE_ROLES không gồm NURSE).

Bước 1: Đăng nhập DOCTOR. Vào `/examinations` → bấm **"Phiên khám mới"** → `/examinations/new` → chọn "Checked-in appointment" là lịch hẹn **14:00 — Nguyễn Văn An — Khám tổng quát** (đã check-in ở Chuỗi 5 Bước 16) → bấm **"Create session"** → chuyển tới `/examinations/{id}`.
> ⚠ Trang `/examinations/new` viết cứng tiếng Anh.

*(Các bước 2-18 dưới đây làm hết trên trang `/examinations/{id}`, theo đúng thứ tự các mục xuất hiện từ trên xuống trên màn hình: Ghi chú lâm sàng → Triệu chứng → Chẩn đoán → Kế hoạch điều trị → Đơn thuốc → Sơ đồ răng → Chỉ định cận lâm sàng → Chỉ định lâm sàng/xét nghiệm.)*

Bước 2: Ngay đầu trang, mục **"Ghi chú lâm sàng"** (có nhãn "Bắt buộc để hoàn tất" — phải điền ít nhất 1 trong 3 trường dưới đây thì mới hoàn tất được phiên khám) → điền **"Lý do khám": `Đau răng số 7 hàm dưới trái`**, **"Bệnh sử hiện tại": `Đau âm ỉ 3 ngày, tăng khi ăn đồ lạnh hoặc nhai`**, **"Khám thực thể": `Răng 37 có lỗ sâu lớn, gõ nhẹ có phản ứng đau`** → bấm **"Lưu ghi chú"** (Update Clinical Notes).

Bước 3: Cuộn tới mục **"Triệu chứng"** → bấm **"Nhập triệu chứng"** → điền **Tên triệu chứng: `Đau răng số 37`**, **Vị trí: `Răng 37 (hàm dưới trái)`**, **Mức độ: `Trung bình (Moderate)`**, **Ngày bắt đầu: `3 ngày trước`**, **Thời gian kéo dài: `3 ngày`**, **Mô tả: `Đau âm ỉ, tăng khi ăn đồ lạnh hoặc nhai`** → bấm **"Thêm triệu chứng"** (Enter Symptoms).

Bước 4: Xem danh sách triệu chứng hiện ngay dưới form (View Symptoms).

Bước 5: Bấm icon bút trên triệu chứng vừa tạo → panel đổi thành "Sửa triệu chứng" → sửa **Mức độ: `Nặng (Severe)`** → bấm **"Lưu triệu chứng"** (Edit Symptoms).

Bước 6: Bấm icon thùng rác → confirm dialog (tiêu đề tiếng Anh "Delete symptom?") → xác nhận xóa (Delete Symptoms).

Bước 7: Cuộn xuống mục **"Chẩn đoán"** (có dấu `*` — bắt buộc phải có ít nhất 1 chẩn đoán thì mới hoàn tất được phiên khám) → bấm **"Thêm chẩn đoán"** → điền **Tên chẩn đoán: `Sâu răng độ 3, nghi viêm tủy răng 37`** (bắt buộc), **Mã ICD: `K02.9`**, **Loại: `Chính`**, **Mức độ: `Nặng`** → bấm **"Thêm chẩn đoán"** (Add Diagnosis).

Bước 8: Cuộn xuống mục **"Kế hoạch điều trị"** → bấm **"Tạo kế hoạch"** → điền **Tên kế hoạch: `Điều trị tủy răng 37`**, **Thời gian: `2 tuần`**, **Chi phí dự kiến: `1200000`**, **Đơn vị tiền tệ: VND**, **Quote version: `PLAN-2026-08`** *(bắt buộc phải điền field này — bỏ trống sẽ khiến Bước 11 "Đề xuất" lỗi 400 "quote_version is required")*, **Mục tiêu: `Bảo tồn răng 37, giảm đau và viêm tủy`**, **Công bố rủi ro: `Có thể cần bọc răng sứ sau điều trị tủy`**, **Phương án thay thế: `Nhổ răng 37 và cấy ghép Implant`** → bấm **"Tạo kế hoạch"** (Create Treatment Plan).

Bước 9: Xem card kế hoạch **"Điều trị tủy răng 37"** vừa tạo với trạng thái draft (View Treatment Plan).

Bước 10: Bấm icon bút → "Sửa kế hoạch điều trị" → sửa **Chi phí dự kiến: `1350000`** (cập nhật giá sau khảo sát) → lưu (Edit Treatment Plan).

Bước 11: Bấm **"Đề xuất"** để gửi kế hoạch **"Điều trị tủy răng 37"** cho bệnh nhân xem/duyệt (Send Treatment Plan) — minh họa thêm các nút **"Chấp nhận toàn bộ"** / **"Chấp nhận một phần"** / **"Từ chối"** xuất hiện sau khi đề xuất. *(Các nút này chỉ hiện và chỉ bấm được với DOCTOR/ADMIN/MANAGER — dùng để nhân viên ghi nhận quyết định bệnh nhân đã đồng ý ngoài đời, không phải bệnh nhân tự bấm qua tài khoản của họ.)*

Bước 12 (nhánh phụ): Bấm icon thùng rác trên kế hoạch (chỉ khi còn ở trạng thái editable) → confirm (tiêu đề tiếng Anh "Delete treatment plan?") → xóa (Delete Treatment Plan) — *bỏ qua nếu muốn giữ lại kế hoạch để minh họa tiếp ở các chuỗi sau.*

Bước 13: Cuộn xuống mục **"Đơn thuốc"** → bấm **"Tạo đơn thuốc điện tử"** → điền **Ngày kê đơn: hôm nay**, **Ghi chú: `Uống sau ăn, tái khám sau 5 ngày`** → bấm **"Tạo đơn thuốc"** (Create Electronic Prescription).

Bước 14: Bấm **"Thêm thuốc"** trên đơn vừa tạo → điền **Tên thuốc: `Amoxicillin 500mg`**, **Liều lượng: `2 viên/ngày x 5 ngày, sau ăn`** → **"Thêm thuốc"** → lặp lại thêm **`Paracetamol 500mg — khi đau, tối đa 3 viên/ngày`**; sau khi có thuốc, bấm **"Phát hành đơn thuốc"** → xác nhận prompt (tiếng Anh "Issue and sign this prescription?") → dialog "Đã phát hành đơn thuốc" hiện ra.

Bước 15 ⚠ (thông báo lỗi validate của form này hiện bằng tiếng Anh dù giao diện còn lại là tiếng Việt): Cuộn xuống mục **"Sơ đồ răng"** → bấm **"Ghi nhận răng"** → điền **Số răng: `37`** (bắt buộc, theo ký hiệu FDI: 11-18/21-28/31-38/41-48), **Trạng thái: `Điều trị tủy (Root canal)`**, **Ghi chú: `Đang điều trị tủy, theo dõi thêm`** → bấm **"Lưu mục sơ đồ răng"** (Chart Tooth Condition).

Bước 16: Mục **"Chỉ định cận lâm sàng — X-quang / CBCT"** → bấm **"Chỉ định X-quang / CBCT"** → chọn **Loại: X-quang**, **Độ ưu tiên: `Thường quy (Routine)`**, **Số răng: `37`**, **Vùng: `Hàm dưới trái`**, **Mô tả: `Kiểm tra tình trạng tủy răng 37 trước khi điều trị`** → bấm **"Tạo chỉ định"** (Order X-ray/CBCT).

Bước 17: Mục **"Chỉ định lâm sàng / xét nghiệm"** → bấm **"Chỉ định xét nghiệm"** → điền **Loại xét nghiệm: `Xét nghiệm máu tổng quát`**, **Chỉ định (indication): `Chuẩn bị điều trị tủy, kiểm tra đông máu`**, **Độ ưu tiên: `Thường quy`** → bấm **"Tạo chỉ định"** (Order Laboratory Test Service).

Bước 18: Cùng mục, bấm **"Chỉ định lâm sàng"** (order_type khác) → điền **Loại: `Test độ nhạy tủy răng (Vitality test)`**, **Chỉ định: `Nghi viêm tủy răng 37`**, **Độ ưu tiên: `Khẩn (Urgent)`** → bấm **"Tạo chỉ định"** (Order Clinical Test).

*(Các bước 19-26 dưới đây chuyển sang trang `/patients/{id}` của "Nguyễn Văn An", theo đúng thứ tự các mục xuất hiện từ trên xuống trên màn hình: Tiền sử bệnh → Hồ sơ bệnh án → Hồ sơ điều trị. Bước "Xuất" cố ý đặt cuối cùng — xem giải thích ở Bước 26.)*

Bước 19: Chuyển sang `/patients/{id}` của **Nguyễn Văn An** → mục **"Tiền sử bệnh"** → bấm nút thêm → dialog "Thêm tiền sử bệnh" → điền **`Từng nhổ răng khôn năm 2022, không biến chứng`** → lưu (Add Medical History).

Bước 20: Mục **"Hồ sơ bệnh án"** → bấm **"Thêm hồ sơ"** → dialog "Thêm hồ sơ bệnh án" → điền **Chief complaint: `Đau răng số 7 hàm dưới trái`**, **Diagnosis: `Sâu răng độ 3, nghi viêm tủy răng 37`**, **Plan: `Chụp X-quang, điều trị tủy nếu cần thiết`** → lưu (Add Medical Record — dùng đúng luồng này trong `/patients/[id]`, không dùng route `/patients/[id]/medical-records/new`).

Bước 21: Bấm icon bút trên hồ sơ vừa tạo → dialog "Chỉnh sửa hồ sơ bệnh án" → sửa **Plan: `Chụp X-quang, điều trị tủy răng 37, hẹn tái khám sau 1 tuần`** → lưu (Update Medical Record).

Bước 22: Bấm icon thùng rác trên hồ sơ → confirm → xóa (Delete Medical Record) — *chỉ demo nếu muốn minh họa; nếu cần dùng lại hồ sơ này ở các bước sau (Bước 23-26, gồm cả bước Export) thì bỏ qua bước xóa.*

Bước 23: Mục **"Hồ sơ điều trị"** → bấm **"Thêm điều trị"** (yêu cầu đã có ít nhất 1 hồ sơ bệnh án **chưa finalize** — dùng hồ sơ tạo ở Bước 20, đừng Export nó trước khi làm bước này) → dialog → điền **Procedure: `Điều trị tủy răng`**, **Cost: `1200000`**, **Teeth: `37`**, **Status: `Đang thực hiện`** → lưu (Add Treatment Profile).

Bước 24: Xem danh sách thủ thuật **"Điều trị tủy răng — Răng 37"** trong mục "Hồ sơ điều trị" (View Treatment Profile).

Bước 25: Bấm icon bút trên thủ thuật vừa tạo → dialog "Chỉnh sửa điều trị" → sửa **Status: `Hoàn thành`** → lưu (Update Treatment Profile).

Bước 26: Quay lại mục **"Hồ sơ bệnh án"** ở trên, bấm **"Xuất"** (icon download) trên hồ sơ **"Sâu răng độ 3, nghi viêm tủy răng 37"** → toast "Đã xuất hồ sơ" (Export Medical Record Profile). *(Đặt bước Export ở đây, SAU Treatment Profile dù mục "Hồ sơ bệnh án" nằm trên "Hồ sơ điều trị" trên màn hình — nút Xuất giờ tự động "finalize" hồ sơ trước khi xuất, và hồ sơ đã finalize thì không thể thêm Treatment Profile mới vào nữa. Ngoài ra: sẽ không có tab mới nào mở ra sau toast, vì backend chưa sinh file PDF thật, `file_url` luôn `null` — chỉ nên quay tới lúc thấy toast thành công.)*

Bước 27 ⚠ (URL công khai sẽ bị chặn — xem "Lưu ý chung"): Vào `/dental-images` → chọn bệnh nhân **"Nguyễn Văn An"** trong dropdown "Select a patient…" → bấm **"Upload image"** → chọn **Image type: Endodontic** → dán **Image URL: `dental-images/{patient_id}/demo-endo-37.jpg`** (chuỗi key nội bộ, KHÔNG bắt đầu bằng `http://`/`https://` — dán URL công khai như picsum.photos sẽ lỗi 400 "must be a private storage key"), chọn **Tooth numbers: `37`**, **View angle: `Periapical`**, **Category: `Nội nha`**, chọn **"Attach to treatment profile"** = hồ sơ bệnh án **"Sâu răng độ 3, nghi viêm tủy răng 37"** tạo ở Bước 20 → bấm **"Upload"** (Upload Endodontic Image + Attach Image to Treatment Profile cùng lúc). *(Vì không có file thật phía sau key này, card ảnh sẽ không hiển thị được — chỉ minh họa được luồng tạo bản ghi, không minh họa được ảnh hiển thị thật.)*
> ⚠ Trang `/dental-images` viết cứng tiếng Anh; đây là dán URL ảnh có sẵn, không upload file thật (muốn upload file thật thì dùng tab "Upload New" ở `/patients/{id}/images`).

Bước 28: Lặp lại upload, lần này chọn **Image type: X-ray**, **Image URL: `dental-images/{patient_id}/demo-xray-37.jpg`**, **Tooth numbers: `37`** (Upload X-ray/CBCT Image).

Bước 29: Xem lưới ảnh theo bệnh nhân **"Nguyễn Văn An"**, mỗi card hiện type/teeth/view angle/category/link hồ sơ đính kèm (View Dental Image Library).

Bước 30: Bấm **"Edit"** trên ảnh Endodontic vừa tạo → sửa **Category: `Nội nha — trước điều trị`** → lưu (Edit Image by Treatment Profile).

---

## Chuỗi 8 — Reporting & Dashboard

**Tài khoản:** `dr.nguyenvana@smile.com` (DOCTOR), `nguyenvana.pt@email.com` (PATIENT), `admin@smile.com` (ADMIN) — đổi tài khoản để xem từng dashboard theo role.

Bước 1: Đăng nhập DOCTOR → sidebar bấm **"Tổng quan"** → `/dashboard` → tự động hiện `DoctorDashboard`: "Chào mừng trở lại, BS. Nguyễn Văn A", mục lịch làm việc sắp tới (7 ngày, gồm ca chiều đăng ký ở Chuỗi 4), lịch hẹn sắp tới (gồm lịch hẹn 14:00 với Nguyễn Văn An) (View Dashboard by Doctor).

Bước 2: Đăng xuất, đăng nhập PATIENT → sidebar bấm **"Tổng quan"** → `/dashboard` → tự động hiện `PatientDashboard`: "Chào mừng trở lại, Nguyễn Văn An", tổng quan lịch hẹn của bạn (gồm các lịch hẹn tạo ở Chuỗi 5) + nút đặt lịch nhanh (View Dashboard by Customer).

Bước 3: Đăng xuất, đăng nhập ADMIN → sidebar bấm **"Hiệu suất"** → `/admin/performance` → xem bảng Doctor/Total/Completed/Cancelled/No-show/Completion %/Cancellation %/Avg Dur — tìm dòng **"BS. Nguyễn Văn A"** để thấy số liệu vừa tạo, chart "Completion vs Cancellation Rate" (View Doctor Performance Report).
> ⚠ Trang này viết cứng tiếng Anh.

Bước 4: Sidebar bấm **"Doanh thu"** → `/admin/revenue-reports` → xem Total Revenue (đã cộng thêm `200.000đ` từ Chuỗi 6), Paid Appointments, các chart Revenue by Day/Revenue by Service (nổi bật "Khám tổng quát")/Revenue by Clinic (Revenue / Financial Report).
> ⚠ Trang này viết cứng tiếng Anh.
