# Demo Test Guide

## Tài khoản demo

Mật khẩu chung: **`Password123!`**

| Email | Role |
|---|---|
| `admin@smile.com` | ADMIN |
| `doctor1@smile.com` | DOCTOR |
| `patient10@smile.com` | PATIENT |

Cả 3 tài khoản trên đã được **đăng nhập kiểm chứng trực tiếp trên UI** (2026-08-01).

Các role còn lại (nếu cần):

| Role | Email | Số tài khoản |
|---|---|---|
| ADMIN | `admin@smile.com` | 1 |
| DOCTOR | `doctor1@smile.com` … `doctor8@smile.com` | 8 |
| MANAGER | `manager1@smile.com` … `manager2@smile.com` | 2 |
| NURSE | `nurse1@smile.com` … `nurse5@smile.com` | 5 |
| RECEPTIONIST | `receptionist1@smile.com` … `receptionist4@smile.com` | 4 |
| PATIENT | `patient1@smile.com` … `patient40@smile.com` | 40 |

> ⚠️ **CẢNH BÁO — đừng dùng tài khoản trong `database/**/insert.sql`.**
> Các file `database/**/insert.sql` và `schema.sql` chỉ là **bản export tại một thời điểm**, **KHÔNG** được nối vào bất kỳ script khởi tạo nào. Database thật được tạo bằng đường TypeORM (xem mục dưới).
> Cụ thể, các email từng ghi trong tài liệu cũ — `dr.nguyenvana@smile.com`, `nguyenvana.pt@email.com`, `recep.levan@smile.com`, `nurse.dothih@smile.com` — **KHÔNG tồn tại** trong database seed bằng TypeORM. Đăng nhập bằng chúng sẽ luôn thất bại.

### Seed database (đường duy nhất có script)

Chạy theo thứ tự, mỗi service một lần:

```bash
# iam-service (2 database: auth + user)
cd backend/service/iam-service
bun run migration:run && bun run migration:run:user
bun run seed:run:relational && bun run seed:run:user

# clinical-emr-service (2 database: medical + clinic)
cd backend/service/clinical-emr-service
bun run migration:run && bun run migration:run:clinic
bun run seed:run:relational && bun run seed:run:clinic

# payment-service
cd backend/service/payment-service
bun run migration:run && bun run seed:run
```

Ngày đặt lịch hợp lệ (database hiện tại): **2026-07-15 → 2026-10-27** theo bảng `doctor_schedules` (1200/1440 dòng nằm từ hôm nay trở đi; Chủ nhật không có lịch).

> Lưu ý: mốc sinh lịch (`ANCHOR_DATE`) trước đây bị **hard-code**, nay đã sửa thành **tính theo ngày chạy seed** (`run-clinic-seed.ts`), giữ nguyên cửa sổ −14 ngày / +90 ngày. Nghĩa là **lần seed lại kế tiếp sẽ dịch cửa sổ này sang khoảng mới** (ngày chạy −14 → ngày chạy +90); con số 2026-07-15 → 2026-10-27 ở trên là của lần seed gần nhất, không phải hằng số.

---

## Auth & phân quyền (đã hoạt động)

**Flow:** ở trang `/login`, nhập email/password của 1 trong 3 tài khoản demo, ấn **"Login"** → được đưa về `/dashboard` — một URL chung, nội dung render theo role (patient/doctor/admin)
→ thử truy cập route không thuộc quyền (ví dụ patient gõ thẳng `/admin`) → bị redirect về `/unauthorized`, xác nhận RBAC chặn đúng.

**✅ Validation:**
- [ ] Login đúng → URL là `/dashboard` (không phải URL riêng theo role), nội dung dashboard khớp role đang login.
- [ ] Login sai password → hiện lỗi, KHÔNG redirect.
- [ ] Patient gõ `/admin` → về `/unauthorized`; admin vào `/admin` → vào bình thường.
- [ ] Logout xong gõ lại `/dashboard` → bị đẩy về `/login`.

---

## Đặt lịch & nhắc lịch (đã hoạt động)

**Flow:** login PATIENT → `/appointments/new` → wizard có **4 phương thức**: "At Facility" / "By Specialty" / "By Doctor" / "Outside Hours". Cả "At Facility" và "By Doctor" đều có **dropdown chọn bác sĩ** (lọc theo bác sĩ có lịch tại clinic đã chọn) — không phải nhập UUID tay. Demo chính nên dùng **"By Specialty"**: chọn clinic/specialty/ngày/giờ (**phương thức này không có bước chọn service**) → ấn **"Continue"** → **"Confirm Booking"** → đạt: appointment mới tạo, status `"scheduled"`
→ vào `/appointments/[id]` của lịch vừa tạo, ấn nút **"Send Reminder"** (icon chuông) → đạt: toast "Reminder sent", API trả 202.

> Có thể ấn thêm **"Send Confirmation"** (cũng trả 202) để test email confirm, và **"Confirm"** (chỉ hiện khi status `scheduled`) để chuyển status sang `confirmed`.

**✅ Validation:**
- [ ] Chọn ngày ngoài cửa sổ lịch hiện tại (2026-07-15 → 2026-10-27), hoặc một ngày Chủ nhật → không có slot nào để chọn.
- [ ] Sau "Confirm Booking": appointment xuất hiện trong danh sách với status badge `scheduled`.
- [ ] "Send Reminder" → DevTools Network: `POST /appointments/{id}/notifications/reminder` trả **202**.
- [ ] "Confirm" → status chuyển `confirmed`, nút "Confirm" biến mất.
- [ ] Thử "By Doctor": dropdown bác sĩ có dữ liệu sau khi chọn clinic (không có ô nhập UUID nào).

---

## Khám bệnh & hồ sơ bệnh án (đã hoạt động)

> `/examinations` chỉ **liệt kê session đã tạo**. Muốn tạo session mới phải qua `/examinations/new`, và appointment phải ở trạng thái **`checked_in`** mới chọn được — đây là bước xác nhận bệnh nhân đã tới, tách biệt khỏi "Confirm" ở phần Đặt lịch.

**Flow đầy đủ:**
1. Login ADMIN, RECEPTIONIST hoặc NURSE → vào `/appointments/[id]` → ấn nút **"Check In"** (xanh lá, icon log-in) → đạt: status chuyển `checked_in`. Nút hiện với cả appointment `scheduled` lẫn `confirmed` (không bắt buộc confirm trước). Lưu ý: nút hiển thị với mọi role (frontend không ẩn theo quyền) — nhưng backend chỉ cho ADMIN/RECEPTIONIST/NURSE thực thi.
2. Login DOCTOR (đúng bác sĩ của appointment đó) → `/examinations/new` → chỉnh **"Work date"** đúng ngày của appointment (mặc định là hôm nay) → dropdown **"Checked-in appointment"** hiện appointment vừa check-in → chọn → ấn **"Create session"** → tự động chuyển sang `/examinations/[id]`.
3. Trong `/examinations/[id]`: thêm symptom, thêm diagnosis — **mã ICD là ô nhập tay tự do** (ví dụ `K02.9`), không có tính năng search/lookup ICD → đạt: danh sách chẩn đoán hiển thị trong session.
4. **Bắt buộc**: cuộn tới card **"Clinical notes"**, điền ít nhất 1 trong 3 ô (Chief complaint / Present illness / Physical examination) → ấn **"Save notes"**. Đây là rule thật ở cả backend (`assertReadyToFinalize`) lẫn frontend — thiếu notes thì "Finalize encounter" luôn bị khoá. Card này PATCH được bất kỳ lúc nào trước khi finalize, nên bỏ trống lúc tạo session **không bị kẹt** — chỉ cần quay lại card điền bổ sung.
5. Cuối flow ấn **"Finalize encounter"** (có confirm dialog) → đạt: session status chuyển `in_progress` → `completed`, các nút tạo mới trong session bị disable.

**✅ Validation:**
- [ ] Appointment chưa check-in (`scheduled`/`confirmed`) → KHÔNG xuất hiện trong dropdown của `/examinations/new`.
- [ ] Work date khác ngày appointment → dropdown rỗng; đổi đúng ngày → appointment hiện ra.
- [ ] Chưa có diagnosis HOẶC chưa có clinical note → nút "Finalize encounter" disabled (cần **cả hai**: ≥1 diagnosis VÀ ≥1 trong 3 ô notes có nội dung).
- [ ] Điền 1 ô notes + Save → nút Finalize mở khoá ngay.
- [ ] Sau finalize: các ô Clinical notes + "Save notes" disabled, "Add symptom"/"Add diagnosis" disabled, nút Finalize hiện trạng thái "Finalized"/khoá.
- [ ] Login PATIENT thử "Check In" → backend trả lỗi quyền (nút có thể hiện nhưng call fail).

---

## Treatment plan & Đơn thuốc (đã hoạt động)

**Flow:** trong `/examinations/[id]`, tạo Treatment Plan draft →

> ⚠️ **Quan trọng**: phải điền đủ 4 field `estimated_cost` (số > 0), `quote_version`, `risk_disclosure`, `alternative_options` (thiếu 1 trường thì nút "Propose" sẽ no-op im lặng — chỉ hiện toast warning, không có network request, dễ tưởng nút chết).

→ ấn **"Propose"** → ấn **"Accept"** (confirm dialog) → đạt: plan status `"accepted"`
→ cùng trang, tạo Prescription draft → **"Add drug"** nhập tên thuốc/liều/đường dùng/tần suất/số ngày/số lượng/hướng dẫn (tất cả bắt buộc) → ấn **"Issue prescription"** (confirm dialog) → đạt: status `"issued"`, nút "Add drug" tự động disable sau khi issue.

**✅ Validation:**
- [ ] Bỏ trống 1 trong 4 field → ấn "Propose" → chỉ toast warning, DevTools Network KHÔNG có request nào.
- [ ] Điền đủ 4 field → "Propose" → `PATCH /treatment-plans/{id}/propose`, status chuyển `proposed`.
- [ ] "Accept" → confirm dialog → status `accepted`. (Backend chỉ cho accept từ `proposed` — thử accept plan còn `draft` phải fail.)
- [ ] "Add drug" thiếu bất kỳ field nào → form báo lỗi, không thêm được.
- [ ] Sau "Issue prescription": status badge `issued`, nút "Add drug" disabled, không sửa/xoá được drug đã thêm.

---

## Thanh toán — Payment (đã hoạt động)

**Flow:** login PATIENT → `/appointments/[id]` → phần "Payment" ấn nút **"Pay now"** → ở chế độ mock, hệ thống redirect **thẳng về trang callback của app** với mã thanh toán thành công gắn sẵn (không thực sự mở trang VNPay sandbox) → đạt: badge `payment_status` chuyển `"paid"`, record xuất hiện trong bảng payment history
→ ở cùng bảng đó (dòng payment status = paid), ấn nút **"Refund"** → đạt: `refund_status` chuyển `REQUESTED`, xuất hiện trong hàng đợi refund của admin (bước dưới).

> Lưu ý: phần "Payment" không bị giới hạn theo role — mọi user xem được appointment đều thấy. Demo vẫn nên thao tác bằng tài khoản PATIENT cho đúng kịch bản.

**✅ Validation:**
- [ ] "Pay now" → URL chuyển qua `/appointments/[id]/payment/callback?...vnp_ResponseCode=00...` → quay lại trang appointment: badge `paid`.
- [ ] Bảng payment history có record mới với amount đúng giá dịch vụ.
- [ ] Nút "Refund" CHỈ hiện trên dòng có status `paid`.
- [ ] Ấn "Refund" → `refund_status = REQUESTED`, ấn lần 2 phải fail/không hiện nút nữa.

---

## Lịch làm việc & nghỉ phép (đã hoạt động)

**Flow:** login DOCTOR → `/schedules/my-schedule` xem lịch làm việc cá nhân → vào `/schedules/leaves/new` (route này **không có trong nav**, vào qua `/schedules` → card "Leaves" → nút "Request Leave", hoặc gõ thẳng URL) → điền loại nghỉ/ngày/lý do → submit `POST /doctor-leaves` → đạt: leave request mới xuất hiện trong `/schedules/leaves` với status `PENDING`
→ login ADMIN → `/admin/facility` → card **"Leave Approvals"** (card này là **link dẫn sang `/schedules/leaves`**, không approve inline trong facility) → tại trang leaves, ấn **"Approve"** hoặc **"Reject"** trên request vừa tạo → đạt: status cập nhật, stat count trên cả 2 phía đồng bộ.

**✅ Validation:**
- [ ] Submit leave → redirect về `/schedules/leaves`, request mới status `PENDING`, stat card "Pending" +1.
- [ ] Nút Approve/Reject chỉ hiện trên request đang `PENDING` (request đã xử lý không còn action).
- [ ] Approve → status `APPROVED`; login lại DOCTOR → `/schedules/leaves` thấy status mới, stat đồng bộ.

---

## Admin console

### Quản lý user/role (đã hoạt động)

**Flow:** login ADMIN → `/admin/users-management` → search theo tên / filter theo gender, ấn nút **"Roles"** trên 1 user → modal tick/untick role → save → đạt: role của user cập nhật ngay trong bảng
→ `/admin/roles-management` → chọn 1 role → expand permission matrix (checkbox theo từng resource: appointments, medical records, payments, roles, users...) → tick/untick permission → đạt: ma trận quyền lưu lại đúng.

**✅ Validation:**
- [ ] Gán role mới cho user → bảng cập nhật không cần reload; bỏ role → mất ngay.
- [ ] Untick 1 permission của role → reload trang → checkbox vẫn giữ trạng thái mới (đã persist, không phải chỉ UI).
- [ ] User bị bỏ role tương ứng → login lại bằng user đó → mất quyền truy cập route liên quan.

### Phòng khám/phòng/dịch vụ — facility hub (đã hoạt động)

**Flow:** `/admin/facility` là **lưới card điều hướng** (không phải tabs): "Clinics & Treatment Rooms" (gộp chung 1 card), "Specialties", "Services & Pricing", "Work Shifts", "Doctor Schedules", "Leave Approvals" → click card → sang trang riêng (`/clinics`, `/specialties`, `/services`...) → ấn **"Add"/"New"** → điền form → save → đạt: item mới xuất hiện trong list, CRUD đầy đủ (create/edit/delete) đã verify thật, không phải mock.

> ⚠️ **Bug đã biết**: card **"Work Shifts"** trỏ tới `/schedules/shifts` — route này **chưa có page, sẽ 404**. Tránh click card này khi demo (hoặc fix trước).

**✅ Validation:**
- [ ] Từng card (trừ Work Shifts) dẫn tới trang đích không lỗi.
- [ ] Tạo mới 1 clinic/specialty/service → xuất hiện trong list; edit → giá trị đổi; delete → biến mất (reload vẫn đúng).
- [ ] Card "Work Shifts" → xác nhận 404 (để biết mà tránh, hoặc verify sau khi fix).

### Refund queue (đã hoạt động)

**Flow:** `/admin/refunds` → thấy request refund vừa tạo ở bước Payment (status `REQUESTED`) → ấn **"Approve"** → đạt: FSM chuyển thẳng sang `REFUNDED` (không có bước "processing" trung gian — enum có `REFUNDING` nhưng code không dùng)
→ `/admin/revenue-reports` → đạt: số liệu doanh thu/số lịch đã thanh toán tự động giảm tương ứng, xác nhận refund trừ đúng vào báo cáo tài chính (`net_revenue = total_revenue - refunded_amount`).

> Test nhánh reject: ấn **"Reject"** trên 1 request khác → modal nhập lý do (**bắt buộc** — nút confirm disabled khi lý do trống) → confirm → đạt: status `REJECTED`, không trừ vào doanh thu.

**✅ Validation:**
- [ ] Approve → status `REFUNDED` ngay lập tức (không có trạng thái trung gian nào xuất hiện).
- [ ] Sau approve: `/admin/revenue-reports` có `refunded_amount`/`refunded_count` tăng, `net_revenue` giảm đúng số tiền.
- [ ] Reject với lý do trống → nút confirm disabled; nhập lý do → confirm được → status `REJECTED`, doanh thu KHÔNG đổi.

### Audit log — RBAC & account actions (đã hoạt động)

**Flow:** `/admin/audit-logs` → thấy list các sự kiện login/thao tác admin → ấn **"Expand details"** trên 1 dòng → đạt: hiện chi tiết device/IP/JSON payload của event đó.

**✅ Validation:**
- [ ] Login bằng tài khoản bất kỳ → quay lại audit-logs → có event LOGIN mới nhất đúng email.
- [ ] Expand: cột IP có giá trị, Device parse từ user-agent, JSON payload hiển thị được.

### Báo cáo (đã hoạt động — nhưng gộp chung, không tách riêng "vận hành")

**Flow:** `/admin/revenue-reports` → chọn filter theo ngày/clinic → đạt: chart doanh thu theo ngày, breakdown theo dịch vụ và theo clinic, số liệu đã bao gồm điều chỉnh refund (báo cáo "doanh thu + refund" gộp làm một, không có trang "vận hành" riêng)
→ `/admin/performance` → đạt: bảng completion/cancellation rate theo từng bác sĩ, breakdown chi tiết
→ `/admin/kyc-management` → 4 thẻ số ở đầu trang (All submissions / Pending review / Verified / Rejected) — đây chính là "KYC stats", nằm chung trang quản lý KYC chứ không phải trang report riêng.

**✅ Validation:**
- [ ] Đổi filter ngày/clinic → chart và số liệu thay đổi tương ứng.
- [ ] Hoàn tất 1 examination (`completed`) → `/admin/performance`: completion rate của bác sĩ đó tăng.
- [ ] Sau khi approve 1 refund → revenue-reports phản ánh ngay (khớp mục Refund queue ở trên).

---

## KYC (chưa test sâu — ưu tiên các flow trên trước)

**Flow:** login PATIENT → `/profile` → tab KYC, upload ảnh mặt trước/sau CCCD, xác thực OTP số điện thoại, tick đồng ý điều khoản → ấn **"Submit KYC"** → đạt: status chuyển `"PENDING_REVIEW"`
→ login ADMIN → `/admin/kyc-management` → filter "Pending review" → mở 1 submission → ấn **"Approve"/"Reject"** (reject cần nhập lý do) → đạt: status patient cập nhật thành `VERIFIED`/`REJECTED`.

> ⚠️ **Lưu ý**: mới xác nhận trang này **không crash**, chưa test hết chain thật (OCR, upload ảnh thật, review chi tiết) — cần tự chạy thử full chain trước khi đưa vào demo chính thức.

**✅ Validation (khi test sâu):**
- [ ] Submit thiếu ảnh / chưa OTP / chưa tick điều khoản → nút Submit bị chặn hoặc báo lỗi.
- [ ] Submit đủ → status `PENDING_REVIEW`, form khoá không sửa được nữa.
- [ ] Admin approve → patient reload profile thấy `VERIFIED`; 4 thẻ stat trên kyc-management cập nhật đúng (Pending -1, Verified +1).

---

## Thông báo — Notification (đã hoạt động)

**Flow:** bất kỳ trang nào sau khi login, ấn icon **chuông** (NotificationBell) ở top-nav → đạt: dropdown hiện danh sách thông báo, badge đỏ đếm số chưa đọc
→ ấn vào 1 thông báo chưa đọc → đạt: đánh dấu đã đọc, badge giảm.

> Notification được sinh ra bởi: **"Send Reminder"/"Send Confirmation"** ở phần Đặt lịch, và các thao tác **assign/update/transfer lịch bác sĩ** (doctor schedules). **Refund approve KHÔNG sinh notification** (payment-service không gọi notification API) — đừng dùng nhánh refund để test chuông.

**✅ Validation:**
- [ ] Ấn "Send Reminder" xong → login PATIENT tương ứng → chuông có notification mới, badge +1.
- [ ] Click notification chưa đọc → chuyển trạng thái đã đọc, badge -1; reload vẫn giữ trạng thái đã đọc.
- [ ] Approve refund → xác nhận chuông KHÔNG có notification mới (đúng hành vi hiện tại, tránh hiểu nhầm là bug lúc demo).
