# User

# S.M.I.L.E — Luồng Nghiệp Vụ

Hệ thống quản lý phòng khám nha khoa thông minh — Smart Medical Intelligent Ledger for E-health

---

## Mục tiêu dự án

Số hóa toàn bộ quy trình vận hành phòng khám nha khoa: từ đăng ký tài khoản, đặt lịch khám, khám bệnh, chẩn đoán, điều trị, đến thanh toán — kết hợp AI hỗ trợ đặt lịch và OCR xác minh danh tính.

---

## Vai trò người dùng

| Vai trò | Mô tả |
| :---- | :---- |
| **Patient** | Bệnh nhân — đặt lịch, xem hồ sơ, thanh toán |
| **Doctor/Dentist** | Bác sĩ — khám, chẩn đoán, kê đơn, lập kế hoạch điều trị |
| **Receptionist** | Lễ tân — tiếp nhận, check-in, quản lý lịch hẹn |
| **Nurse** | Y tá — hỗ trợ bác sĩ |
| **Admin** | Quản trị — quản lý người dùng, phòng khám, báo cáo |

---

## Luồng chính (Main Flow)

Đăng ký ──▶ Đặt lịch ──▶ Check-in ──▶ Khám bệnh ──▶ Thanh toán

### 1\. Đăng ký & Đăng nhập

- Đăng ký bằng email/username hoặc Google OAuth  
- Xác nhận email (OTP)  
- Đăng nhập → nhận JWT token

### 2\. Đặt lịch khám (Booking)

- Chatbot AI (LangGraph) hỗ trợ đặt lịch qua hội thoại  
- Hoặc đặt thủ công: chọn phòng khám → bác sĩ → dịch vụ → ngày giờ  
- Kiểm tra slot trống, lịch nghỉ bác sĩ, giờ làm việc  
- Thanh toán online (VNPay) khi đặt lịch

### 3\. Check-in tại phòng khám

- Lễ tân xác nhận bệnh nhân đến  
- Gán phòng khám (treatment room)

### 4\. Khám bệnh (Examination)

- Bác sĩ tạo phiên khám (examination session)  
- Ghi nhận: triệu chứng, khám lâm sàng, sinh hiệu  
- Chẩn đoán (ICD code), sơ đồ răng (dental chart)  
- Chỉ định cận lâm sàng (X-Ray, CBCT, xét nghiệm)  
- Chụp/upload hình ảnh nha khoa

### 5\. Kê đơn & Kế hoạch điều trị

- Kê đơn thuốc → gửi bệnh nhân  
- Lập kế hoạch điều trị dài hạn

### 6\. Thanh toán

- Tạo phiếu thanh toán (VNPay)  
- Trạng thái: `pending → paid / failed / refunded`

### 7\. Hoàn tất

- Finalize hồ sơ bệnh án  
- Lưu hash lên blockchain (tính toàn vẹn)

---

## Luồng trạng thái lịch hẹn

SCHEDULED ──▶ CONFIRMED ──▶ CHECKED\_IN ──▶ IN\_PROGRESS ──▶ COMPLETED

    │              │              │              │

    ▼              ▼              ▼              ▼

CANCELLED      CANCELLED      CANCELLED      CANCELLED

    │

    ▼

 NO\_SHOW

---

## Luồng phụ (Sub Flows)

### A. Luồng khám bệnh chi tiết

Tạo phiên khám

  ├── Ghi triệu chứng (chief complaint)

  ├── Khám lâm sàng (physical examination)

  ├── Đo sinh hiệu (vital signs)

  ├── Chẩn đoán (diagnosis \+ ICD code)

  ├── Sơ đồ răng (dental chart — theo từng răng)

  ├── Chỉ định cận lâm sàng ──▶ Luồng B

  ├── Chụp hình nha khoa

  ├── Kê đơn thuốc ──▶ Luồng C

  └── Lập kế hoạch điều trị ──▶ Luồng D

### B. Luồng chỉ định cận lâm sàng (Clinical Order)

ORDERED ──▶ IN\_PROGRESS ──▶ COMPLETED

                              │

                              ▼

                         Kết quả xét nghiệm (lab results)

- Loại: X-Ray, CBCT, xét nghiệm máu, xét nghiệm lâm sàng  
- Mức độ: routine / urgent / stat

### C. Luồng kê đơn thuốc (Prescription)

DRAFT ──▶ ISSUED ──▶ DISPENSED

                        │

                     CANCELLED

- Mỗi đơn gồm nhiều dòng thuốc (prescription items)  
- Ký số (digital signature)

### D. Luồng kế hoạch điều trị (Treatment Plan)

DRAFT ──▶ SENT ──▶ ACCEPTED ──▶ IN\_PROGRESS ──▶ COMPLETED

                      │

                   CANCELLED

- Gửi cho bệnh nhân duyệt trước khi thực hiện

### E. Luồng KYC (Xác minh danh tính)

NOT\_SUBMITTED ──▶ PENDING\_REVIEW ──▶ VERIFIED

                        │

                     REJECTED

- OCR: `PENDING → PROCESSING → COMPLETED / FAILED / SKIPPED`  
- Quyết định: tự động (AUTO) hoặc thủ công (MANUAL)

### F. Luồng quản trị (Admin)

- Quản lý tài khoản người dùng (CRUD, khóa/mở)  
- Quản lý phòng khám, phòng điều trị, ca làm việc  
- Duyệt KYC  
- Quản lý vai trò & phân quyền  
- Xem audit logs  
- Báo cáo doanh thu & hiệu suất

### G. Luồng lịch bác sĩ

- Tạo ca làm việc (work shifts)  
- Đăng ký lịch nghỉ phép: `PENDING → APPROVED / REJECTED`  
- Loại nghỉ: annual / sick / emergency

---

## Module AI

| Module | Chức năng |
| :---- | :---- |
| **Booking LangGraph** | Chatbot AI hỗ trợ đặt lịch hẹn qua hội thoại tự nhiên |
| **KYC OCR** | Trích xuất thông tin CCCD/CMND tự động bằng OCR |

# Receptionist

# **02 — Luồng Lễ Tân (Receptionist)**

Bổ sung cho vai trò **Receptionist**. Tài liệu gốc chỉ nêu "lễ tân xác nhận bệnh nhân đến, gán phòng". Phần này mô tả đầy đủ nghiệp vụ quầy.

## **Phạm vi**

Tiếp đón, check-in, quản lý hàng đợi & lịch hẹn cả phòng khám, đặt lịch hộ (walk-in), thu ngân tại quầy, điều phối phòng/bác sĩ.

Tiếp đón ──▶ Check-in ──▶ Hàng đợi ──▶ Điều phối phòng/bác sĩ ──▶ (sau khám) Thu ngân ──▶ Tiễn khách

---

## **I1. Bảng điều khiển ngày (Front-desk dashboard)**

Lễ tân mở đầu ngày với màn hình tổng hợp:

* Danh sách lịch hẹn trong ngày theo bác sĩ/phòng/khung giờ.  
* Trạng thái mỗi appointment (SCHEDULED → … → COMPLETED).  
* Cảnh báo: bệnh nhân trễ hẹn, bác sĩ nghỉ đột xuất (liên kết luồng G gốc), phòng đang vệ sinh.

---

## **I2. Check-in chi tiết (mở rộng luồng chính)**

Bệnh nhân đến quầy  
        │  
        ▼  
 Tra cứu lịch hẹn (theo SĐT / mã hẹn / tên / QR)  
        │  
   ┌────┴───────────────┐  
   ▼                    ▼  
 Có lịch (CONFIRMED)   Không có lịch ──▶ Luồng I4 (Walk-in)  
   │  
   ▼  
 Xác minh danh tính & cập nhật thông tin cần thiết  
   │  
   ▼  
 Xác nhận đã thanh toán đặt cọc? ──▶ nếu chưa: thu tại quầy (I6)  
   │  
   ▼  
 CHECKED\_IN  \+  đẩy vào HÀNG ĐỢI (I3)  
   │  
   ▼  
 Gán phòng điều trị (nếu phòng AVAILABLE) & thông báo bác sĩ/y tá

---

## **I3. Quản lý hàng đợi (Queue — luồng mới)**

State machine của một mục trong hàng đợi:

WAITING ──▶ CALLED ──▶ IN\_ROOM ──▶ DONE  
   │           │  
   ▼           ▼  
 SKIPPED   (gọi lại) WAITING

* Sắp thứ tự theo: giờ hẹn, mức ưu tiên (cấp cứu/STAT), thời gian chờ.  
* Khi bác sĩ/y tá sẵn sàng → `CALLED` → hiển thị màn hình gọi số/loa.  
* `SKIPPED` nếu bệnh nhân vắng mặt khi gọi → cho phép gọi lại cuối hàng.  
* Đồng bộ với trạng thái phòng (`TreatmentRoom.status`):

AVAILABLE ──▶ OCCUPIED ──▶ CLEANING ──▶ AVAILABLE

---

## **I4. Đặt lịch hộ / Khách vãng lai (Walk-in)**

Khách không có lịch  
        │  
        ▼  
 Có hồ sơ? ──┬─ Có ─▶ chọn bệnh nhân  
             └─ Không ─▶ tạo hồ sơ nhanh (quick-register) cho bệnh nhân  
        │  
        ▼  
 Kiểm tra slot trống ngay trong ngày (giờ làm việc, lịch nghỉ bác sĩ)  
        │  
   ┌────┴────┐  
   ▼         ▼  
 Có slot    Hết slot ──▶ thêm vào danh sách chờ / hẹn ngày khác  
   │  
   ▼  
 Tạo appointment ──▶ thu phí/đặt cọc (I6) ──▶ CHECKED\_IN ──▶ Hàng đợi

---

## **I5. Đổi / Hủy lịch hộ bệnh nhân**

* **Đổi lịch**: khi bệnh nhân quá hạn tự đổi (xem luồng `01` H2.2) hoặc gọi điện → lễ tân chọn slot mới, giải phóng slot cũ.  
* **Hủy**: cập nhật `CANCELLED`; nếu đã thanh toán → mở `RefundRequest` (luồng `01` H5.2) trong hạn mức quầy hoặc chuyển Admin.  
* **Bác sĩ nghỉ đột xuất** (liên kết luồng G): hệ thống đánh dấu các lịch bị ảnh hưởng → lễ tân liên hệ bệnh nhân để đổi bác sĩ/đổi giờ.

---

## **I6. Thu ngân tại quầy (luồng mới)**

Phiếu thanh toán (PENDING)  
        │  
   ┌────┴───────────────┐  
   ▼                    ▼  
 Online (VNPay)      Tại quầy (tiền mặt / thẻ POS)  
   │                    │  
   ▼                    ▼  
 PAID                Ghi nhận PAID \+ xuất biên lai  
        │  
        ▼  
 In hóa đơn / e-invoice ──▶ cập nhật trạng thái

* Đối soát cuối ca: tổng tiền mặt/thẻ/online thu trong ca, bàn giao quỹ.  
* Hạn mức hoàn tiền tại quầy do Admin cấu hình; vượt hạn mức → chuyển Admin duyệt.

---

## **I7. Tiễn khách & hậu khám**

* Sau khi phiên khám `COMPLETED` & đã thanh toán → cập nhật hàng đợi `DONE`, phòng `CLEANING`.  
* Đặt lịch tái khám nếu Doctor có chỉ định.  
* Phát đơn thuốc bản in (nếu cần) / hướng dẫn lấy thuốc tại quầy thuốc.

---

## **I8. Quyền & ràng buộc**

| Hành động | Receptionist được phép | Ghi chú |
| ----- | ----- | ----- |
| Tạo/đổi/hủy lịch | ✅ | Mọi bệnh nhân của phòng khám |
| Check-in / gán phòng | ✅ |  |
| Quản lý hàng đợi | ✅ |  |
| Thu ngân, xuất biên lai | ✅ |  |
| Hoàn tiền | ⚠️ | Chỉ trong hạn mức cấu hình |
| Xem nội dung bệnh án/chẩn đoán | 🚫/⚠️ | Chỉ thông tin hành chính, không xem chi tiết y khoa (theo phân quyền) |
| Duyệt KYC | 🚫 | Thuộc Admin |

---

## **I9. Màn hình gợi ý (Reception app)**

| Màn hình | Chức năng |
| ----- | ----- |
| Dashboard ngày | Lịch hẹn, cảnh báo, KPI quầy |
| Tra cứu & Check-in | Tìm bệnh nhân, xác nhận đến |
| Hàng đợi | Bảng queue real-time, gọi số |
| Sơ đồ phòng | Trạng thái các treatment room |
| Đặt lịch nhanh | Walk-in / đổi / hủy |
| Thu ngân | Thanh toán quầy, biên lai, đối soát ca |

# Nurse

# **03 — Luồng Y Tá (Nurse)**

Bổ sung cho vai trò **Nurse**. Tài liệu gốc chỉ ghi "hỗ trợ bác sĩ". Phần này mô tả đầy đủ vai trò y tá trong quy trình lâm sàng nha khoa.

## **Phạm vi**

Chuẩn bị phòng & dụng cụ, đo sinh hiệu trước khám, hỗ trợ bác sĩ trong buổi điều trị, vô trùng dụng cụ, quản lý vật tư tiêu hao, chăm sóc/hướng dẫn hậu điều trị.

Chuẩn bị phòng ──▶ Đón bệnh nhân & sinh hiệu ──▶ Hỗ trợ khám/điều trị ──▶ Hậu điều trị ──▶ Vô trùng & dọn phòng

---

## **J1. Chuẩn bị phòng điều trị (Pre-visit)**

Nhận thông tin lịch từ hàng đợi (Receptionist) / dashboard  
        │  
        ▼  
 Kiểm tra phòng: TreatmentRoom.status \= AVAILABLE?  
        │  
        ▼  
 Chuẩn bị theo loại dịch vụ (ví dụ: nhổ răng / lấy cao / trám)  
        │  
        ▼  
 Set up khay dụng cụ \+ vật tư tiêu hao (kiểm tra Inventory — J5)  
        │  
        ▼  
 Đánh dấu phòng OCCUPIED khi bệnh nhân vào

---

## **J2. Đo sinh hiệu & tiền khám (liên kết luồng A gốc)**

Y tá thực hiện bước "đo sinh hiệu (vital signs)" trước khi bác sĩ khám:

Gọi bệnh nhân từ hàng đợi (queue: CALLED → IN\_ROOM)  
        │  
        ▼  
 Đo: huyết áp, mạch, nhiệt độ, SpO2 (tùy quy định)  
        │  
        ▼  
 Ghi nhận vào phiên khám (examination session) ──▶ hiển thị cho Doctor  
        │  
        ▼  
 Rà soát cảnh báo từ hồ sơ (dị ứng / bệnh nền — khai báo ở luồng 01 H1)

* Nếu sinh hiệu bất thường (ví dụ huyết áp quá cao) → gắn cờ cảnh báo cho Doctor cân nhắc hoãn thủ thuật.

---

## **J3. Hỗ trợ bác sĩ trong buổi khám/điều trị**

* Phụ tá bốn tay (four-handed dentistry): hút nước bọt, truyền dụng cụ, trộn vật liệu.  
* Hỗ trợ chụp X-Ray/CBCT khi Doctor chỉ định cận lâm sàng (luồng B gốc).  
* Ghi chú điều dưỡng vào phiên khám (nếu được phân quyền ghi).  
* Theo dõi phản ứng bệnh nhân trong thủ thuật, báo Doctor khi có dấu hiệu bất thường.

---

## **J4. Hậu điều trị (Post-visit)**

Doctor kết thúc thủ thuật  
        │  
        ▼  
 Hướng dẫn chăm sóc tại nhà (giấy/QR) — vệ sinh, kiêng cữ, dấu hiệu cần quay lại  
        │  
        ▼  
 Hỗ trợ cấp phát thuốc (đối chiếu đơn DISPENSED — luồng C gốc) nếu mô hình có quầy thuốc nội bộ  
        │  
        ▼  
 Cập nhật queue: DONE ──▶ phòng chuyển CLEANING  
        │  
        ▼  
 Bàn giao bệnh nhân về quầy (Receptionist) để thanh toán/đặt tái khám

---

## **J5. Quản lý vật tư tiêu hao (Inventory — luồng mới)**

Mỗi thủ thuật tiêu hao vật tư (gauze, kim, thuốc tê, vật liệu trám…)  
        │  
        ▼  
 Trừ tồn kho theo định mức ──▶ cập nhật Inventory  
        │  
        ▼  
 Tồn ≤ ngưỡng cảnh báo? ──▶ tạo yêu cầu nhập (Restock Request)  
        │  
        ▼  
 RESTOCK: REQUESTED ──▶ APPROVED (Admin) ──▶ RECEIVED ──▶ cập nhật tồn

* Theo dõi hạn dùng (expiry) → cảnh báo vật tư sắp hết hạn.  
* Báo cáo tiêu hao theo ngày/dịch vụ → phục vụ báo cáo chi phí (Admin, luồng `04`).

---

## **J6. Vô trùng dụng cụ (Sterilization — luồng mới)**

Dụng cụ đã dùng  
        │  
        ▼  
 DIRTY ──▶ CLEANING ──▶ STERILIZING ──▶ STERILE ──▶ STORED  
                                          │  
                                          ▼  
                                   (lỗi chu trình) FAILED ──▶ lặp lại

* Mỗi chu trình (`SterilizationCycle`) ghi: mẻ (batch), thiết bị (autoclave), thông số, người phụ trách, kết quả test sinh học.  
* Truy xuất: từ dụng cụ dùng cho bệnh nhân ↔ ngược về mẻ vô trùng (phục vụ kiểm soát nhiễm khuẩn & audit).

---

## **J7. Dọn & tái sẵn sàng phòng**

Phòng CLEANING  
        │  
        ▼  
 Khử khuẩn bề mặt \+ thay vật tư \+ bổ sung khay  
        │  
        ▼  
 TreatmentRoom.status ──▶ AVAILABLE (sẵn sàng cho bệnh nhân tiếp theo)

---

## **J8. Quyền & ràng buộc**

| Hành động | Nurse được phép | Ghi chú |
| ----- | ----- | ----- |
| Đo & ghi sinh hiệu | ✅ | Ghi vào phiên khám |
| Hỗ trợ chụp X-Ray/CBCT | ✅ | Theo chỉ định Doctor |
| Ghi chú điều dưỡng | ⚠️ | Theo phân quyền |
| Chẩn đoán / kê đơn | 🚫 | Thuộc Doctor |
| Quản lý vật tư & vô trùng | ✅ |  |
| Cấp phát thuốc | ⚠️ | Đối chiếu đơn đã ISSUED/DISPENSED |
| Xem toàn bộ bệnh án | ⚠️ | Phần liên quan chăm sóc |

---

## **J9. Màn hình gợi ý (Nurse app)**

| Màn hình | Chức năng |
| ----- | ----- |
| Lịch & hàng đợi | Bệnh nhân cần chuẩn bị, gọi vào phòng |
| Sinh hiệu | Nhập vital signs vào phiên khám |
| Hỗ trợ phiên khám | Ghi chú điều dưỡng, chỉ định cận lâm sàng |
| Vật tư (Inventory) | Tồn kho, trừ định mức, yêu cầu nhập |
| Vô trùng | Quản lý mẻ/chu trình, trạng thái dụng cụ |
| Phòng điều trị | Trạng thái & dọn phòng |

# Admin

# **04 — Luồng Quản Trị Chi Tiết (Admin)**

Mở rộng **luồng F** trong tài liệu gốc. Tài liệu gốc liệt kê tóm tắt các chức năng admin; phần này chi tiết hóa từng nghiệp vụ và bổ sung cấu hình hệ thống.

## **Phạm vi**

Quản lý người dùng & phân quyền (RBAC), duyệt KYC & hoàn tiền, quản lý phòng khám/phòng/ca, cấu hình hệ thống, audit & báo cáo.

---

## **K1. Quản lý người dùng (User Management)**

Tạo / sửa / khóa / mở / xóa mềm tài khoản  
        │  
        ▼  
 Trạng thái user: ACTIVE ──▶ SUSPENDED ──▶ ACTIVE  
                     │  
                     ▼  
                  DEACTIVATED (xóa mềm)

* Gán vai trò (Patient/Doctor/Nurse/Receptionist/Admin), gán vào phòng khám.  
* Reset mật khẩu, buộc đăng xuất phiên, bật/tắt 2FA bắt buộc theo vai trò.  
* Mời nhân sự nội bộ qua email (invite flow).

---

## **K2. Phân quyền RBAC (Role & Permission)**

Ma trận `RolePermission` — Admin cấu hình quyền theo vai trò:

| Quyền (ví dụ) | Patient | Reception | Nurse | Doctor | Admin |
| ----- | ----- | ----- | ----- | ----- | ----- |
| `appointment.create` | ✅ | ✅ | – | – | ✅ |
| `appointment.cancel.any` | – | ✅ | – | – | ✅ |
| `examination.write` | – | – | ⚠️ | ✅ | – |
| `prescription.issue` | – | – | – | ✅ | – |
| `payment.collect` | – | ✅ | – | – | ✅ |
| `refund.approve` | – | ⚠️ | – | – | ✅ |
| `kyc.approve` | – | – | – | – | ✅ |
| `report.view` | – | ⚠️ | – | ⚠️ | ✅ |
| `user.manage` | – | – | – | – | ✅ |

⚠️ \= quyền giới hạn theo điều kiện/hạn mức. Admin có thể tạo vai trò tùy biến (custom role).

---

## **K3. Duyệt KYC (liên kết luồng E gốc)**

Hàng chờ KYC: PENDING\_REVIEW  
        │  
        ▼  
 Đối chiếu ảnh CCCD ↔ OCR ↔ hồ sơ  
        │  
   ┌────┴────┐  
   ▼         ▼  
 VERIFIED  REJECTED (chọn lý do chuẩn hóa)

* Lọc theo nguồn quyết định: AUTO (đã tự duyệt) vs MANUAL (cần người duyệt).  
* Xử lý case OCR `FAILED`/`SKIPPED` → nhập tay & xác minh.

---

## **K4. Duyệt hoàn tiền (RefundRequest — liên kết luồng `01` H5.2)**

REQUESTED ──▶ UNDER\_REVIEW ──┬─▶ APPROVED ──▶ REFUNDING ──▶ REFUNDED  
                             └─▶ REJECTED

* Kiểm tra: phiếu gốc PAID, lý do hợp lệ, đối chiếu giao dịch VNPay.  
* Ghi `AuditLog`: ai duyệt, số tiền, thời điểm.

---

## **K5. Quản lý cơ sở vật chất**

* **Phòng khám (Clinic)**: thông tin, giờ làm việc mặc định, dịch vụ cung cấp.  
* **Phòng điều trị (TreatmentRoom)**: số phòng, loại ghế/thiết bị, trạng thái.  
* **Ca làm việc (Work shift)** (liên kết luồng G gốc): tạo ca, gán bác sĩ/y tá/lễ tân.  
* **Lịch nghỉ phép**: duyệt đơn nghỉ — `PENDING → APPROVED / REJECTED` (annual/sick/emergency).  
* **Dịch vụ & bảng giá**: CRUD dịch vụ, gắn giá, thời lượng slot mặc định.

---

## **K6. Quản lý vật tư (liên kết luồng `03` J5)**

* Duyệt yêu cầu nhập vật tư: `REQUESTED → APPROVED → RECEIVED`.  
* Thiết lập ngưỡng cảnh báo tồn kho, theo dõi hạn dùng.  
* Báo cáo tiêu hao theo phòng khám/dịch vụ.

---

## **K7. Cấu hình hệ thống (System Config)**

| Nhóm cấu hình | Ví dụ tham số |
| ----- | ----- |
| Đặt lịch | Hạn đổi/hủy (N giờ), số slot/giờ, yêu cầu KYC trước khi đặt |
| Thanh toán | Bật/tắt VNPay, tỉ lệ đặt cọc, hạn mức hoàn tiền quầy |
| Thông báo | Mốc nhắc lịch (T-24h/T-2h), kênh mặc định |
| AI | Bật chatbot LangGraph, ngưỡng tự duyệt KYC (OCR confidence) |
| Bảo mật | Bắt buộc 2FA theo vai trò, thời hạn JWT, chính sách mật khẩu |
| Blockchain | Bật lưu hash khi finalize hồ sơ |

---

## **K8. Audit & Nhật ký (AuditLog)**

Mọi thao tác nhạy cảm ──▶ ghi AuditLog  
   (ai • làm gì • đối tượng • thời điểm • IP • trước/sau)

* Đối tượng theo dõi: đăng nhập, thay đổi quyền, sửa bệnh án, hoàn tiền, duyệt KYC, finalize hồ sơ (kèm hash blockchain).  
* Tìm kiếm/lọc theo người dùng, loại hành động, khoảng thời gian; xuất file phục vụ thanh tra.

---

## **K9. Báo cáo & Dashboard quản trị**

| Báo cáo | Nội dung |
| ----- | ----- |
| Doanh thu | Theo ngày/tháng, phòng khám, dịch vụ, hình thức thanh toán; refund |
| Vận hành | Số lịch hẹn, tỉ lệ NO\_SHOW/CANCELLED, thời gian chờ trung bình (queue) |
| Hiệu suất bác sĩ | Số ca, đánh giá (Feedback — luồng `01` H7), tỉ lệ hoàn tất kế hoạch điều trị |
| Lâm sàng | Phân bố chẩn đoán (ICD), tỉ lệ cận lâm sàng, đơn thuốc |
| KYC | Tỉ lệ AUTO vs MANUAL, tỉ lệ REJECTED, thời gian xử lý |
| Vật tư | Tiêu hao, tồn kho, vật tư sắp hết hạn |

---

## **K10. Màn hình gợi ý (Admin console)**

| Màn hình | Chức năng |
| ----- | ----- |
| Người dùng & vai trò | CRUD user, RBAC |
| Hàng chờ KYC | Duyệt/từ chối |
| Hoàn tiền | Duyệt refund |
| Cơ sở & lịch | Phòng khám, phòng, ca, nghỉ phép, dịch vụ/giá |
| Vật tư | Tồn kho, yêu cầu nhập |
| Cấu hình | Tham số hệ thống |
| Audit logs | Tra cứu nhật ký |
| Báo cáo | Dashboard & xuất báo cáo |

# Doctor

# Review luồng nghiệp vụ Doctor cho hệ thống S.M.I.L.E

Ngày rà soát: 30/06/2026  
Phạm vi: role **Doctor/Dentist** trong hệ thống quản lý nha khoa/Răng Hàm Mặt tại Việt Nam.  
Mục tiêu: kiểm chứng flow nghiệp vụ hiện tại, đối chiếu pháp lý Việt Nam, kiểm tra mức độ kết nối của code hiện tại, và lập plan để cập nhật/implement.

Ghi chú: tài liệu này là research nghiệp vụ/kỹ thuật để nhóm validate. Không thay thế tư vấn pháp lý chính thức.

Cập nhật refine lần 2: bổ sung mốc hiệu lực pháp luật, use case Doctor chi tiết, RACI, data model/API contract đề xuất, validation matrix, và bằng chứng code theo dòng để tiện tạo issue.

## 1\. Nguồn đã đối chiếu

### 1.1 Tài liệu nội bộ

| Nguồn | Nội dung dùng để kiểm chứng |
| :---- | :---- |
| `docs/research/BUSINESS_FLOW.md.docx` | Flow business hiện tại của hệ thống: đăng ký, KYC, đặt lịch, check-in, khám, đơn thuốc, treatment plan, payment, blockchain. |
| `docs/research/vn-dental-clinic-business-legal-research.md` | Research pháp lý/nghiệp vụ trước đó cho phòng khám nha khoa tại Việt Nam. |
| Code hiện tại trong repo | Frontend Next.js và backend NestJS cho appointment, examination, schedule, dental image, prescription, treatment plan, gateway/auth. |
| `origin/dev` | Đã chạy `git fetch origin dev`. Không merge/rebase vì working tree đang có nhiều thay đổi sẵn, tránh ghi đè code của nhóm. |

### 1.2 Nguồn pháp lý chính

| Mã | Văn bản | Link kiểm chứng | Phần liên quan trực tiếp đến Doctor |
| :---- | :---- | :---- | :---- |
| L01 | Luật Khám bệnh, chữa bệnh 15/2023/QH15 | [https://xaydungchinhsach.chinhphu.vn/toan-van-luat-15-2023-qh15-kham-benh-chua-benh-119231127164453959.htm](https://xaydungchinhsach.chinhphu.vn/toan-van-luat-15-2023-qh15-kham-benh-chua-benh-119231127164453959.htm) | Quyền người bệnh, hành nghề đúng phạm vi, hồ sơ bệnh án, bảo mật, giá dịch vụ. |
| L02 | Nghị định 96/2023/NĐ-CP | [https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-quy-dinh-chi-tiet-mot-so-dieu-cua-luat-kham-benh-chua-benh-119240115115947657.htm](https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-quy-dinh-chi-tiet-mot-so-dieu-cua-luat-kham-benh-chua-benh-119240115115947657.htm) | Điều kiện hoạt động cơ sở KCB, phòng khám chuyên khoa, quản lý hành nghề. |
| L03 | Thông tư 32/2023/TT-BYT | [https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Thong-tu-32-2023-TT-BYT-huong-dan-Luat-Kham-benh-chua-benh-593360.aspx](https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Thong-tu-32-2023-TT-BYT-huong-dan-Luat-Kham-benh-chua-benh-593360.aspx) | Ghi chép hồ sơ bệnh án, thời gian/người ghi, phạm vi hành nghề. |
| L04 | Thông tư 13/2025/TT-BYT về hồ sơ bệnh án điện tử | [https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Thong-tu-13-2025-TT-BYT-huong-dan-trien-khai-ho-so-benh-an-dien-tu-660113.aspx](https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Thong-tu-13-2025-TT-BYT-huong-dan-trien-khai-ho-so-benh-an-dien-tu-660113.aspx) | Lập, cập nhật, hiển thị, ký/xác nhận, lưu trữ, khai thác EMR. |
| L05 | Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 | [https://thuvienphapluat.vn/van-ban/Bo-may-hanh-chinh/Luat-Bao-ve-du-lieu-ca-nhan-2025-so-91-2025-QH15-625628.aspx](https://thuvienphapluat.vn/van-ban/Bo-may-hanh-chinh/Luat-Bao-ve-du-lieu-ca-nhan-2025-so-91-2025-QH15-625628.aspx) | Xử lý dữ liệu cá nhân, dữ liệu sức khỏe, đồng ý, quyền chủ thể dữ liệu, sự cố dữ liệu. |
| L06 | Nghị định 356/2025/NĐ-CP | [https://vanban.chinhphu.vn/?classid=1\&docid=214590\&pageid=27160\&typegroupid=3](https://vanban.chinhphu.vn/?classid=1&docid=214590&pageid=27160&typegroupid=3) | Hướng dẫn Luật BVDLCN, cần theo dõi khi thiết kế hồ sơ tuân thủ. |
| L07 | Thông tư 26/2025/TT-BYT về đơn thuốc ngoại trú | [https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Thong-tu-26-2025-TT-BYT-don-thuoc-va-viec-ke-don-thuoc-hoa-duoc-trong-dieu-tri-ngoai-tru-643684.aspx](https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Thong-tu-26-2025-TT-BYT-don-thuoc-va-viec-ke-don-thuoc-hoa-duoc-trong-dieu-tri-ngoai-tru-643684.aspx) | Kê đơn thuốc hóa dược/sinh phẩm trong điều trị ngoại trú. |

Mốc hiệu lực cần nhớ khi review:

- Luật Khám bệnh, chữa bệnh 15/2023/QH15 có hiệu lực từ **01/01/2024**.  
- Thông tư 13/2025/TT-BYT về hồ sơ bệnh án điện tử có hiệu lực từ **21/07/2025**.  
- Thông tư 26/2025/TT-BYT về đơn thuốc ngoại trú có hiệu lực từ **01/07/2025**.  
- Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 có hiệu lực từ **01/01/2026**.

### 1.3 Hệ thống nha khoa tại Việt Nam đã dùng làm benchmark

| Hệ thống | Link | Chức năng nổi bật có liên quan Doctor |
| :---- | :---- | :---- |
| DentalFlow | [https://dentalflow.vn/tinh-nang](https://dentalflow.vn/tinh-nang) | Bệnh án điện tử, khách hàng, lịch hẹn, kho/vật tư, chi nhánh, CSKH, báo cáo, phân quyền. |
| SimlyDent | [https://simlydent.vn/](https://simlydent.vn/) | EMR, CRM, Omni Chat, AI Agent, kế toán, hoa hồng bác sĩ, nhân sự, kho, labo. |
| MayDental | [https://maydental.vn/phan-mem-nha-khoa.html](https://maydental.vn/phan-mem-nha-khoa.html) | Bệnh nhân, lịch hẹn/tái khám, timeline điều trị, labo, thu chi, công nợ, CSKH. |
| TDental | [https://tdental.vn/](https://tdental.vn/) | Lịch hẹn/tái khám, công nợ, chi nhánh, báo cáo, công đoạn bệnh, phân quyền, labo/nhà cung cấp. |
| Edental | [https://edental.vn/](https://edental.vn/) | Lịch hẹn online, công nợ, hồ sơ điều trị, SMS marketing, doanh thu/lợi nhuận, kho, nhân sự. |

## 2\. Kết luận nhanh

Flow Doctor hiện tại có hướng đúng ở phần **khám, chẩn đoán, kê đơn, lập kế hoạch điều trị**, nhưng chưa đủ chặt cho phòng khám nha khoa tại Việt Nam. Vấn đề lớn nhất không phải thiếu màn hình riêng lẻ, mà là các đối tượng nghiệp vụ chưa được nối thành một chuỗi hợp pháp và có kiểm soát:

Checked-in appointment

\-\> Doctor worklist

\-\> Examination/encounter có appointment\_id \+ record\_id

\-\> Dental chart \+ diagnosis \+ clinical orders \+ images

\-\> Treatment plan \+ quote \+ consent

\-\> Prescription nếu cần

\-\> Doctor sign/finalize

\-\> Appointment/treatment session completed

\-\> Follow-up/recall \+ record export/audit

Các điểm cần raise với nhóm:

1. `KYC bắt buộc trước booking` trong flow hiện tại không nên là cổng bắt buộc cho khám/đặt lịch thông thường. Với dữ liệu CCCD, Luật BVDLCN 2025 yêu cầu tối thiểu hóa, đúng mục đích, minh bạch.  
2. `Appointment -> Examination` trong code chưa nối bằng `appointment_id`. Đây là gap nghiệp vụ nghiêm trọng vì bác sĩ không có một encounter được trace trực tiếp từ lịch đã check-in.  
3. Role Doctor hiện có nhiều màn hình nhưng scope dữ liệu chưa đúng: danh sách appointments/examinations đang có xu hướng load toàn bộ, chưa lọc theo bác sĩ đang đăng nhập.  
4. Các endpoint clinical quan trọng có decorator `@Roles` không đồng đều, và clinical service chưa thấy `RolesGuard`/`APP_GUARD` để enforce role. Gateway chỉ bắt buộc token cho booking/appointments, còn medical routes chỉ inject identity nếu có token.  
5. EMR hiện còn kiểu CRUD; chưa đủ vòng đời `draft -> signed/finalized -> amendment/version -> export`, trong khi hồ sơ bệnh án phải ghi chính xác, đầy đủ, có thời gian/người ghi, bảo mật và không sửa sai lệch.  
6. Dental image frontend/backend đang mismatch endpoint (`/images` so với `/dental-images`), chưa có flow upload/download/analyze đúng với storage private, audit và link vào encounter/record.  
7. Treatment plan thiếu consent/quote/risk disclosure; prescription thiếu issue/sign/cancel rõ ràng; schedule/leave cho doctor còn lẫn giữa “bác sĩ xem/đăng ký lịch” và “quản lý duyệt lịch nghỉ”.

## 3\. Baseline pháp lý cho role Doctor

### 3.1 Quyền người bệnh và tư vấn trước điều trị

| Điều luật | Ý nghĩa với Doctor flow | Yêu cầu hệ thống |
| :---- | :---- | :---- |
| Luật KCB 2023 \- Điều 9 | Người bệnh có quyền được cung cấp/thông tin giải thích về tình trạng sức khỏe, phương pháp điều trị, dịch vụ và giá dịch vụ. | Màn hình Doctor cần ghi được chẩn đoán, phương án điều trị, lựa chọn thay thế, rủi ro, chi phí dự kiến. |
| Luật KCB 2023 \- Điều 11 | Người bệnh có quyền lựa chọn phương pháp khám chữa bệnh sau khi được tư vấn đầy đủ. | Treatment plan phải có trạng thái bệnh nhân đồng ý/từ chối/từng phần, timestamp, người xác nhận. |
| Luật KCB 2023 \- Điều 13 | Người bệnh có quyền từ chối khám chữa bệnh và rời cơ sở KCB, trừ trường hợp luật định. | Cần use case `PatientDeclinedPlan` hoặc `RefusalOfTreatment`, lưu lý do và người ghi nhận. |
| Luật KCB 2023 \- Điều 17 | Người bệnh có nghĩa vụ cung cấp trung thực thông tin liên quan tình trạng sức khỏe. | Reception/Doctor cần có tiền sử, dị ứng, thuốc đang dùng, cảnh báo y khoa; Doctor phải thấy trước khi điều trị/kê đơn. |

### 3.2 Hành nghề đúng phạm vi và trách nhiệm bác sĩ

| Điều luật | Ý nghĩa với Doctor flow | Yêu cầu hệ thống |
| :---- | :---- | :---- |
| Luật KCB 2023 \- Điều 7.7 | Cấm hành nghề không đúng phạm vi hành nghề hoặc không đúng thời gian/địa điểm đăng ký. | Doctor chỉ được thao tác ca khám thuộc chi nhánh/lịch/phạm vi được phân công; không cho tài khoản khác ký thay. |
| Thông tư 32/2023/TT-BYT \- phần phạm vi hành nghề | Có phạm vi hành nghề cho bác sĩ Răng Hàm Mặt. | User profile bác sĩ nên lưu license/practice scope/specialty; backend check khi gán dịch vụ/chỉ định/ký hồ sơ. |

### 3.3 Hồ sơ bệnh án và bệnh án điện tử

| Điều luật | Ý nghĩa với Doctor flow | Yêu cầu hệ thống |
| :---- | :---- | :---- |
| Luật KCB 2023 \- Điều 69.1 | Người bệnh điều trị ngoại trú vẫn phải được lập/cập nhật hồ sơ bệnh án; hồ sơ giấy và điện tử có giá trị pháp lý như nhau. | Không dùng appointment thay cho medical record. Mỗi lần khám cần `Encounter/ExaminationSession` gắn `MedicalRecord`. |
| Luật KCB 2023 \- Điều 69.2 | Hồ sơ bệnh án phải được lưu giữ và giữ bí mật. | Ảnh nha khoa, X-quang, đơn thuốc, chỉ định, note phải private, có RBAC và audit access. |
| Luật KCB 2023 \- Điều 69.4 | Người bệnh được đọc/xem/sao chụp/ghi chép hồ sơ và được cung cấp tóm tắt khi có yêu cầu hợp lệ. | Cần `RecordAccessRequest`, `RecordExport`, `ClinicalSummary`, workflow approve/log. |
| Luật KCB 2023 \- Điều 7.10 | Cấm tẩy xóa/sửa chữa hồ sơ bệnh án làm sai lệch thông tin. | Sau khi bác sĩ ký/finalize, không update đè; chỉ cho amendment/version có lý do. |
| Thông tư 32/2023 \- Điều 52 | Hồ sơ bệnh án phải ghi chính xác, trung thực, đầy đủ, thể hiện rõ thời gian và người ghi. | Mọi clinical entry cần `created_by`, `created_at`, `signed_by`, `signed_at`, `amended_from`, audit trail. |
| Thông tư 13/2025 \- Điều 1 | Hướng dẫn lập, cập nhật, hiển thị, ký, lưu trữ, quản lý, sử dụng, khai thác EMR. | EMR cần vòng đời đầy đủ, không chỉ CRUD. |
| Thông tư 13/2025 \- Điều 2 | Cơ sở triển khai EMR cần hạ tầng máy tính, mạng, máy chủ, lưu trữ, bảo mật, sao lưu, phục hồi, truy xuất. | Cần backup/restore, encryption, retention, monitoring, disaster recovery cho clinical data/file. |
| Thông tư 13/2025 \- Điều 3 | EMR sử dụng chữ ký điện tử hợp pháp, sinh trắc học hoặc hình thức xác nhận điện tử khác. | Doctor cần thao tác ký/xác nhận hồ sơ; patient cần xác nhận consent/treatment plan. |
| Thông tư 13/2025 \- Điều 4 | Cơ sở KCB khác, không phải bệnh viện, hoàn thành EMR chậm nhất 31/12/2026. | Nên định vị S.M.I.L.E là `EMR-ready` theo TT13/2025. |

### 3.4 Dữ liệu cá nhân, dữ liệu sức khỏe và AI/file upload

| Điều luật | Ý nghĩa với Doctor flow | Yêu cầu hệ thống |
| :---- | :---- | :---- |
| Luật BVDLCN 2025 \- Điều 3 | Xử lý dữ liệu cá nhân phải đúng mục đích, tối thiểu, minh bạch, bảo mật. | Không bắt buộc CCCD/KYC nếu chỉ đặt lịch/khám thông thường; chỉ thu khi có mục đích rõ. |
| Luật BVDLCN 2025 \- Điều 4 | Chủ thể dữ liệu có quyền với dữ liệu cá nhân. | Patient portal cần request xem/cung cấp/chỉnh sửa dữ liệu; riêng bệnh án phải đi qua amendment/audit. |
| Luật BVDLCN 2025 \- Điều 11 | Sự đồng ý của chủ thể dữ liệu. | Tách consent điều trị, consent nhắc lịch, consent marketing, consent chia sẻ bên thứ ba. |
| Luật BVDLCN 2025 \- Điều 19 | Một số trường hợp xử lý dữ liệu không cần đồng ý. | Hệ thống cần lưu legal basis: điều trị, nghĩa vụ pháp lý, hợp đồng, cấp cứu, consent. |
| Luật BVDLCN 2025 \- Điều 21 | Đánh giá tác động xử lý dữ liệu cá nhân. | Với dữ liệu sức khỏe, nên có artifact DPIA/compliance nội bộ. |
| Luật BVDLCN 2025 \- Điều 23 | Thông báo vi phạm dữ liệu trong 72 giờ nếu có nguy cơ nghiêm trọng. | Cần incident/breach workflow và audit sự cố. |
| Luật BVDLCN 2025 \- Điều 26 | Xử lý dữ liệu cá nhân trong lĩnh vực sức khỏe; không cung cấp dữ liệu cho bên thứ ba nếu không có yêu cầu bằng văn bản/căn cứ luật. | AI dental image/OCR/cloud storage/third-party integration phải có consent/legal basis và log chia sẻ. |

### 3.5 Kê đơn ngoại trú

| Điều luật | Ý nghĩa với Doctor flow | Yêu cầu hệ thống |
| :---- | :---- | :---- |
| Thông tư 26/2025 \- Điều 2 đến Điều 6 | Quy định kê đơn thuốc hóa dược, sinh phẩm trong điều trị ngoại trú. | Prescription cần bác sĩ kê đơn, chẩn đoán/clinical context, thuốc, liều, đường dùng, số ngày, hướng dẫn, ngày kê, chữ ký/xác nhận. |
| Luật KCB 2023 \- Điều 69 | Đơn thuốc/chỉ định là thành phần của hồ sơ bệnh án. | Prescription phải link với `encounter/record`, không chỉ link patient/doctor rời rạc. |

## 4\. Flow Doctor nên có sau khi refine

### 4.1 Actor liên quan

| Actor | Vai trò trong flow Doctor | Ranh giới trách nhiệm |
| :---- | :---- | :---- |
| Doctor/Dentist | Khám, chẩn đoán, lập kế hoạch điều trị, chỉ định, kê đơn, ký/xác nhận hồ sơ. | Chỉ thao tác ca thuộc phân công/phạm vi hành nghề; không làm thay lễ tân/phòng thu ngân. |
| Receptionist | Tiếp nhận, check-in, xác nhận thông tin hành chính, điều phối phòng/ghế, thu tiền. | Không final diagnosis, không final prescription. |
| Nurse/Dental assistant | Hỗ trợ ghế khám, nhập nháp thủ thuật, upload ảnh, ghi vật tư/labo theo phân quyền. | Có thể draft, bác sĩ phải xác nhận phần clinical quan trọng. |
| Patient | Cung cấp thông tin sức khỏe, nhận tư vấn, đồng ý/từ chối treatment plan, nhận đơn thuốc/tóm tắt. | Có quyền xem/yêu cầu cung cấp hồ sơ theo luật, nhưng không thấy internal note/audit. |
| Admin/Clinic manager | Phân quyền, lịch làm việc, phê duyệt nghỉ, cấu hình dịch vụ/giá, audit. | Không sửa nội dung lâm sàng đã ký nếu không có amendment hợp lệ. |

### 4.2 Luồng Doctor chuẩn đề xuất

1\. Doctor login

2\. Hệ thống xác thực role, license/scope, clinic scope

3\. Doctor mở dashboard/worklist

4\. Hệ thống chỉ hiển thị:

   \- lịch hôm nay của chính doctor

   \- appointment đã CHECKED\_IN/IN\_PROGRESS

   \- bệnh nhân đang thuộc quan hệ điều trị

5\. Doctor mở appointment đã check-in

6\. Hệ thống tạo hoặc mở examination session:

   \- bắt buộc appointment\_id

   \- bắt buộc patient\_id

   \- bắt buộc doctor\_id \= current doctor hoặc doctor được ủy quyền hợp lệ

   \- bắt buộc clinic\_id/room\_id nếu có điều phối phòng

   \- bắt buộc record\_id hoặc tạo record nếu chưa có

7\. Doctor ghi nhận khám:

   \- chief complaint

   \- present illness

   \- medical alerts/allergies/current medications

   \- clinical examination

   \- dental chart

   \- diagnosis

   \- clinical orders/lab/X-ray nếu có

   \- dental images/attachments nếu có

8\. Doctor lập treatment plan:

   \- phương án

   \- rủi ro

   \- chi phí dự kiến/quote

   \- số buổi

   \- vật tư/labo nếu có

   \- patient consent/decline

9\. Doctor kê đơn nếu cần:

   \- chỉ tạo trong scope điều trị ngoại trú

   \- bác sĩ ký/xác nhận

10\. Doctor final/sign encounter

11\. Hệ thống khóa clinical note chính, chỉ cho amendment/version

12\. Appointment hoặc treatment session chuyển COMPLETED

13\. Tạo follow-up/recall nếu cần

14\. Hồ sơ, ảnh, đơn thuốc, chỉ định, treatment plan nằm trong EMR và audit được

### 4.3 State machine đề xuất

#### Appointment cho Doctor worklist

SCHEDULED

\-\> CONFIRMED

\-\> CHECKED\_IN

\-\> IN\_PROGRESS

\-\> COMPLETED

Nhánh phụ:

SCHEDULED/CONFIRMED \-\> CANCELLED

SCHEDULED/CONFIRMED/CHECKED\_IN \-\> NO\_SHOW

Validation:

- Doctor chỉ được `Start examination` khi appointment là `CHECKED_IN`.  
- Khi session được tạo từ appointment, appointment chuyển `IN_PROGRESS`.  
- Khi doctor ký/finalize encounter, appointment hoặc treatment session chuyển `COMPLETED`.  
- Receptionist xử lý `CHECKED_IN`, `NO_SHOW`, payment; doctor không nên là actor chính cho các thao tác này.

#### Examination session

DRAFT

\-\> IN\_PROGRESS

\-\> READY\_TO\_SIGN

\-\> SIGNED/COMPLETED

\-\> AMENDED

Nhánh phụ:

DRAFT/IN\_PROGRESS \-\> CANCELLED

SIGNED \-\> AMENDMENT\_REQUESTED \-\> AMENDED

Validation:

- `DRAFT`: có thể auto tạo khi appointment check-in.  
- `IN_PROGRESS`: doctor bắt đầu khám.  
- `READY_TO_SIGN`: đủ dữ liệu bắt buộc.  
- `SIGNED/COMPLETED`: khóa nội dung chính, không update đè.  
- `AMENDED`: sửa hợp lệ bằng bản ghi bổ sung, có lý do/người sửa/thời gian.

#### Treatment plan

DRAFT

\-\> PROPOSED

\-\> ACCEPTED / PARTIALLY\_ACCEPTED / DECLINED

\-\> IN\_PROGRESS

\-\> COMPLETED

Nhánh phụ:

PROPOSED/ACCEPTED/IN\_PROGRESS \-\> CANCELLED

Validation:

- Phải có diagnosis/clinical reason.  
- Phải có chi phí dự kiến hoặc link quotation.  
- Phải có consent/decline của bệnh nhân trước khi thực hiện hạng mục không khẩn cấp.  
- Nha khoa thường điều trị nhiều buổi, nên cần `treatment plan item` và `treatment session`.

#### Prescription

DRAFT

\-\> ISSUED/SIGNED

\-\> CANCELLED

`DISPENSED` nếu giữ thì nên thuộc pharmacy/clinic inventory flow, không phải action mặc định của Doctor.

Validation:

- Bắt buộc doctor ký/xác nhận.  
- Bắt buộc link với encounter/record.  
- Bắt buộc thông tin thuốc, liều, đường dùng, thời gian dùng, hướng dẫn.  
- Không cho nurse/receptionist final prescription.

#### Dental images/attachments

UPLOADED

\-\> LINKED\_TO\_ENCOUNTER/RECORD

\-\> REVIEWED/ANNOTATED

\-\> ARCHIVED

Validation:

- File phải private.  
- Download/view phải có signed access hoặc auth check.  
- Mỗi lần xem/tải/sửa phải audit.  
- Nếu dùng AI analysis, phải hiển thị là gợi ý; bác sĩ chịu trách nhiệm final.

## 5\. Đối chiếu flow hiện tại trong BUSINESS\_FLOW.md.docx

### 5.1 Những phần đang hợp lý

| Phần trong DOCX | Đánh giá |
| :---- | :---- |
| Có role Doctor/Dentist: khám, chẩn đoán, kê đơn, lập treatment plan | Đúng hướng với phòng khám nha khoa. |
| Có flow `Check-in -> Khám bệnh -> Thanh toán` | Đúng khung tổng quát, nhưng cần thêm treatment plan, consent, nhiều buổi điều trị, follow-up. |
| Examination có symptoms, physical exam, vital signs, diagnosis, dental chart, clinical orders, dental images | Đúng nhóm chức năng cần có. |
| Prescription có trạng thái draft/issued/dispensed/cancelled | Có baseline, nhưng cần sửa actor của `dispensed` và thêm ký/xác nhận. |
| Treatment plan có sent/accepted/in\_progress/completed | Đúng hướng, nhưng thiếu quote, consent, decline/partial acceptance. |
| Doctor schedule/leave | Cần cho vận hành, nhưng phải tách rõ doctor request và manager/admin approval. |

### 5.2 Những điểm chưa phù hợp hoặc cần sửa

| Vấn đề | Vì sao chưa phù hợp | Đề xuất sửa |
| :---- | :---- | :---- |
| Flow đặt `KYC bắt buộc trước booking` | Không phải core flow phổ biến của phòng khám nha khoa; CCCD là dữ liệu định danh nhạy cảm, cần tối thiểu hóa theo Luật BVDLCN 2025 Điều 3\. | KYC nên optional hoặc dùng cho tạo portal account, thanh toán/biên nhận, yêu cầu bản sao hồ sơ, hoặc EMR identity proofing. |
| Main flow kết thúc ở payment/blockchain | Với Doctor, điểm kết thúc nghiệp vụ phải là hồ sơ khám được ký/xác nhận, treatment/follow-up, EMR audit. | Đưa `Doctor sign/finalize encounter` và `record version/export` thành core. Blockchain nếu có chỉ là lớp integrity bổ sung. |
| Payment đặt sau khám một dòng tuyến tính | Nha khoa thường có đặt cọc, trả theo plan, công nợ, nhiều buổi, refund/discount. | Tách payment appointment-level và treatment-plan-level; Doctor chỉ xem financial context cần thiết. |
| Check-in và assign room chưa tách actor | Đây là nghiệp vụ lễ tân/operation; doctor chỉ nhận ca đã check-in. | Doctor worklist chỉ nhận appointment `CHECKED_IN`. |
| Vital signs được đặt ngang hàng core dental | Nha khoa cần medical alerts/allergies/current medications/dental chart nhiều hơn. | Giữ vital signs optional; thêm medical alerts, dị ứng, thuốc đang dùng, chống chỉ định. |
| Treatment plan thiếu consent/quote/risk | Luật KCB 2023 Điều 9 và Điều 11 yêu cầu tư vấn thông tin/phương án/giá và quyền lựa chọn. | Thêm `TreatmentConsent`, `Quote`, `RiskDisclosure`, trạng thái `PARTIALLY_ACCEPTED`, `DECLINED`. |
| Prescription có `DISPENSED` trong flow Doctor | Doctor thường kê đơn; dispensing nếu có thuộc kho/nhà thuốc/thu ngân/phụ tá theo quy trình riêng. | Doctor flow dừng ở `ISSUED/SIGNED`; `DISPENSED` là module inventory/pharmacy nếu triển khai. |
| Clinical order chưa nối rõ result | Chỉ định phải có kết quả/lab/image/labo trả về và bác sĩ review. | Thêm `OrderResult`, `ReviewedByDoctor`, link session/record. |
| Hồ sơ chưa có amendment/version bắt buộc | Luật KCB 2023 Điều 7.10 và TT32 Điều 52 không phù hợp với update đè clinical note. | Sau signed, chỉ amendment append-only, có reason/audit. |

## 6\. Đối chiếu code hiện tại theo nhóm chức năng Doctor

### 6.1 Auth, role và navigation

| Thành phần | Hiện trạng trong code | Gap/rủi ro |
| :---- | :---- | :---- |
| `frontend/web/src/middleware.ts` | `DISABLE_AUTH_GUARD = true`, middleware server-side đang bypass auth. | Route protected không được chặn ở server middleware. Dữ liệu clinical nhạy cảm không nên dựa vào UI-only. |
| `frontend/web/src/shared/components/auth/ProtectedRoute.tsx` | Có check `accessToken`, `user`, `requiredRoles`, `requiredPermissions`. | Chỉ có tác dụng nếu page được wrap đúng. Nhiều page AppShell/page hiện chưa thấy required role rõ ràng. |
| `frontend/web/src/shared/constants/nav.ts` | Doctor nav có Dashboard, Appointments, Patients, Imaging, Examinations, My Schedule, Performance, Assistant. | Nhóm màn hình hợp lý, nhưng cần scope dữ liệu và action theo role. |
| `frontend/web/src/shared/constants/routes.ts` | `DOCTOR_ROUTES = [MY_SCHEDULE, DOCTOR_LEAVES]`. | Không khớp với nav Doctor; thiếu appointments, patients, imaging, examinations, performance/chat nếu dùng route allowlist. |
| `frontend/web/src/shared/components/layout/AppNavigation.tsx` | Một navigation cũ có nhiều item không bật required roles. | Có nguy cơ role nào cũng thấy các mục nhạy cảm nếu component này còn được dùng. |
| `backend/service/gateway-service/src/proxy/proxy.middleware.ts` | Gateway xác thực JWT và inject `x-auth-user-id`, `x-patient-id`, `x-auth-role`. | `requiresTrustedIdentity()` chỉ bắt buộc token cho booking-langgraph và `/api/v1/appointments`; medical routes khác có thể đi qua nếu không có token. |
| `backend/service/clinical-emr-service/src/auth/roles/roles.decorator.ts` | Có decorator `@Roles`. | Chưa thấy `RolesGuard`/`APP_GUARD` trong clinical service; decorator có thể chỉ là metadata chưa enforce. |

Kết luận: trước khi bàn UX flow, cần harden auth/role. Doctor là role xử lý dữ liệu sức khỏe; mọi API clinical phải yêu cầu trusted identity và enforce role \+ relation-to-patient.

### 6.2 Doctor dashboard

| Thành phần | Hiện trạng | Gap/rủi ro |
| :---- | :---- | :---- |
| `frontend/web/src/features/dashboard/components/DoctorDashboard.tsx` | Có dashboard Doctor, gọi report theo `doctor_id`. Có selector chọn doctor từ seed `DOCTORS`. | Demo tốt nhưng nghiệp vụ thật không nên cho doctor tự chọn doctor khác. Cần lấy doctor\_id từ user hiện tại hoặc assignment hợp lệ. |
| Report endpoint | Có `REPORTS.DASHBOARD_DOCTOR`. | Cần đảm bảo backend chỉ trả dữ liệu của doctor hiện tại, không tin `doctor_id` từ client. |

### 6.3 Appointments trong Doctor flow

| Thành phần | Hiện trạng | Gap/rủi ro |
| :---- | :---- | :---- |
| `frontend/web/src/app/(pages)/appointments/page.tsx` | Load `useAppointmentsList({ limit: 50 })`, filter status ở frontend. | Doctor nên chỉ thấy appointments của mình/chi nhánh được phân công. Hiện chưa thấy filter `doctor_id=currentUser`. |
| Appointment detail | Có confirm/cancel/reminder/payment/refund. | Nhiều action thuộc receptionist/payment, không phải Doctor. Doctor cần action chính là `Start/Open examination` khi appointment `CHECKED_IN`. |
| Backend appointment | Có routes by-doctor, check-in, history. | Cần dùng đúng route `by-doctor` cho Doctor worklist và chặn start exam nếu appointment chưa check-in. |

### 6.4 Appointment \-\> Examination

| Thành phần | Hiện trạng | Gap/rủi ro |
| :---- | :---- | :---- |
| `frontend/web/src/app/(pages)/examinations/new/page.tsx` | Chọn appointment, autofill patient/doctor/clinic, tạo session `POST /examination-sessions`. | Payload không gửi `appointment_id`. |
| `backend/service/clinical-emr-service/src/examination-sessions/entities/examination-session.entity.ts` | Entity có `record_id`, `patient_id`, `doctor_id`, `clinic_id`, status, started/completed. | Không có `appointment_id`, không có room\_id, không có signed/finalized/amendment fields. |
| `CreateExaminationSessionDto` | Không có `appointment_id`. | Không thể trace trực tiếp ca khám từ lịch đã check-in. Đây là gap lớn nhất của Doctor flow. |
| `ExaminationSessionsController` | CRUD, `findByPatientId`, `findByDoctorId`. | Không có route `appointment/:appointment_id`, trong khi frontend endpoint có `EXAMINATION.BY_APPOINTMENT`. Không có `complete`, `cancel`, `sign`, `finalize`. |

Khuyến nghị: thêm `appointment_id` vào DB/entity/DTO, unique rule theo appointment nếu mỗi lịch chỉ có một encounter chính, và flow tạo session phải xuất phát từ checked-in appointment.

### 6.5 Examination workspace

| Thành phần | Hiện trạng | Gap/rủi ro |
| :---- | :---- | :---- |
| `frontend/web/src/app/(pages)/examinations/page.tsx` | Load toàn bộ `/examination-sessions`. | Doctor nên thấy session của mình hoặc ca được ủy quyền, không load toàn bộ. |
| `frontend/web/src/app/(pages)/examinations/[id]/page.tsx` | Có workspace tương đối giàu: symptoms, treatment plans, prescriptions, diagnostic orders, clinical orders. | Nhiều dữ liệu đang query theo patient thay vì theo session/record; có thể trộn dữ liệu nhiều lần khám. |
| `frontend/web/src/features/examination/api/examination.ts` | Có wrapper cho session/diagnosis/prescription/treatment plan. | Một số endpoint stale: `completeSession`, `cancelSession` gọi backend route chưa có; imaging/lab order dùng hardcoded old path. |
| Backend controllers | Có nhiều module clinical: symptoms, diagnoses, prescriptions, treatment plans, orders, lab results, images. | Thiếu orchestration workflow cho một encounter hoàn chỉnh; phần lớn là CRUD rời rạc. |

### 6.6 Diagnosis, prescription, treatment plan

| Module | Hiện trạng | Gap/rủi ro |
| :---- | :---- | :---- |
| `DiagnosesController` | CRUD, find by session/icd. | Không có `@Roles`; route `GET ':diagnosis_id'` đặt trước `GET 'session/:session_id'` có nguy cơ shadow route. |
| `PrescriptionsController` | CRUD, find by patient/doctor/record. | Không có `@Roles`; không có `issue/sign/cancel`; route static đặt sau dynamic có nguy cơ shadow route; chưa enforce link encounter/record. |
| `TreatmentPlansController` | Có `@Roles(ADMIN, DOCTOR)`, CRUD, find by patient/record. | Không có explicit `propose/accept/decline/complete/cancel`; thiếu consent/quote/risk; route static đặt sau dynamic có nguy cơ shadow route. |
| `MedicalRecordsService.createVersion()` | Có entity version nhưng `versionNumber = 1`. | Chưa tăng version thực tế; chưa được gọi trong update/sign/amendment flow. |

### 6.7 Dental image / upload / AI

| Thành phần | Hiện trạng | Gap/rủi ro |
| :---- | :---- | :---- |
| `frontend/web/src/shared/api/endpoint.ts` | DENTAL\_IMAGE dùng `/images/upload`, `/images/patient/:id`, `/images/:id/analyze`, IMAGE\_CATEGORY dùng `/categories`. | Không khớp backend clinical routes. |
| `DentalImagesController` | Backend controller là `/dental-images`, có CRUD/find/archive. | Không có upload/download/analyze route; không có `@Roles`; route `:image_id` trước `patient/:patient_id` có nguy cơ shadow. |
| Gateway routes | Medical routes có `/api/v1/dental-images`, `/api/v1/image-categories`. | Frontend đang gọi `/images` và `/categories`, dễ 404/mismatch. |

Khuyến nghị: thống nhất endpoint `/api/v1/dental-images`, thêm upload/download signed URL, link image với `record_id/session_id`, audit view/download, và AI analysis chỉ là decision support.

### 6.8 Dental chart

| Thành phần | Hiện trạng | Gap/rủi ro |
| :---- | :---- | :---- |
| Backend | Có module `dental-charts`. | Cần verify UI đã gắn trực tiếp vào examination workspace chưa; nếu chỉ nằm trong imaging hoặc CRUD riêng thì chưa đủ core nha khoa. |
| Business requirement | Dental chart là trung tâm của khám nha khoa. | Doctor workspace nên đặt dental chart cạnh diagnosis/treatment plan, không phải tính năng phụ. |

### 6.9 Schedule và leave

| Thành phần | Hiện trạng | Gap/rủi ro |
| :---- | :---- | :---- |
| `frontend/web/src/app/(pages)/schedules/my-schedule/page.tsx` | Doctor có thể chọn doctor từ seed `DOCTORS`. | Doctor thật chỉ nên xem lịch của mình; admin/manager mới chọn doctor khác. |
| `frontend/web/src/app/(pages)/schedules/leaves/page.tsx` | Page thiên về quản lý/duyệt leave, có `approvedBy: 'CURRENT_USER_ID'`. | Với Doctor, flow đúng là tạo request nghỉ và xem trạng thái. Duyệt/từ chối thuộc admin/manager. |
| `DoctorSchedulesController`, `DoctorLeavesController` | Có routes tạo/list/update/by doctor. | Một số static routes đặt sau dynamic routes có nguy cơ shadow; cần actor check theo current user. |

## 7\. Danh sách gap cần bổ sung cho role Doctor

### 7.1 Must-have để flow đúng nghiệp vụ/pháp lý

| Mã | Thiếu/gap | Validation cần có |
| :---- | :---- | :---- |
| D-M01 | Doctor worklist theo lịch hôm nay và appointment `CHECKED_IN`. | Query theo `doctor_id=currentUser`, clinic scope, date/status. |
| D-M02 | `appointment_id` trong examination session. | Không tạo session nếu appointment chưa `CHECKED_IN`; không tạo trùng session active cho cùng appointment. |
| D-M03 | Link session với `medical_record`. | Nếu patient chưa có record thì tạo record; session phải có `record_id`. |
| D-M04 | Doctor role/scope enforcement ở backend. | Mọi clinical API yêu cầu auth; check role Doctor/Admin; check relation-to-patient. |
| D-M05 | Ký/finalize encounter. | Chỉ doctor assigned/authorized được sign; sau sign không update đè. |
| D-M06 | Amendment/versioning. | Sửa hồ sơ đã ký phải tạo version/amendment, bắt buộc reason, actor, timestamp. |
| D-M07 | Dental chart trong examination workspace. | Chart bắt buộc hoặc strongly recommended trước treatment plan; link session/record. |
| D-M08 | Diagnosis gắn session. | Diagnosis phải link `session_id`; không chỉ patient-level. |
| D-M09 | Prescription issue/sign. | Bắt buộc diagnosis/context, thuốc/liều/đường dùng/thời gian/hướng dẫn, doctor signature. |
| D-M10 | Treatment plan có quote/consent. | Trước `IN_PROGRESS` phải có patient accepted/partially accepted, quote/estimated cost, risk disclosure. |
| D-M11 | Dental image upload private. | File private, signed access, audit view/download, link session/record. |
| D-M12 | Medical alerts trước kê đơn/thủ thuật. | Doctor phải thấy dị ứng, bệnh nền, thuốc đang dùng; cảnh báo khi kê đơn. |
| D-M13 | Record export/summary request. | Patient request phải được log/approve/export đúng phạm vi. |

### 7.2 Should-have cho nha khoa thực tế tại Việt Nam

| Mã | Thiếu/gap | Lý do |
| :---- | :---- | :---- |
| D-S01 | Treatment session nhiều buổi. | Nha khoa thường điều trị theo plan nhiều lần, không chỉ một appointment. |
| D-S02 | Labo order/handoff. | Chỉnh nha, phục hình, mão/răng giả thường cần labo. |
| D-S03 | Inventory/material usage trong treatment session. | Quản lý vật tư và cost/stock là nhu cầu thực tế. |
| D-S04 | Follow-up/recall sau điều trị. | Benchmark VN đều nhấn mạnh tái khám/CSKH. |
| D-S05 | Doctor performance/commission nhưng giới hạn dữ liệu. | Có nhu cầu quản trị, nhưng doctor chỉ xem phần của mình. |
| D-S06 | AI note summary hoặc AI dental image support. | Chỉ nên gợi ý, không auto-final diagnosis/prescription. |

## 8\. Plan implement đề xuất

### Phase 0 \- Chốt lại flow và quyền

1. Cập nhật business flow Doctor theo sequence: `Doctor worklist -> checked-in appointment -> examination session -> clinical entries -> treatment plan/consent -> prescription/orders/images -> sign/finalize -> follow-up`.  
2. Gỡ KYC khỏi cổng bắt buộc của booking/doctor flow; chuyển thành optional verification theo mục đích rõ.  
3. Chốt role matrix:  
   - Doctor: xem/khám/ký ca được phân công.  
   - Receptionist: check-in/payment/room ops.  
   - Nurse: hỗ trợ/draft/upload.  
   - Admin/Manager: schedule/leave approval/audit.

### Phase 1 \- Auth/RBAC và route hardening

1. Re-enable hoặc thay thế frontend middleware auth guard nếu backend đã sẵn sàng.  
2. Chuẩn hóa `DOCTOR_ROUTES` để khớp nav Doctor: dashboard, appointments, patients scoped, dental images, examinations, my schedule, chat/performance nếu hợp lệ.  
3. Gateway: bắt buộc trusted identity cho toàn bộ medical routes, không chỉ appointments/booking.  
4. Clinical service: thêm `RolesGuard`/guard đọc `x-auth-user-id`, `x-auth-role`; enforce `@Roles`.  
5. Backend: sửa route order static trước dynamic trong các controller:  
   - examination sessions  
   - diagnoses  
   - prescriptions  
   - treatment plans  
   - dental images  
   - dental charts  
   - diagnostic orders  
   - lab test results  
   - doctor schedules/leaves  
6. Thêm relation-to-patient/doctor ownership check cho Doctor.

### Phase 2 \- Nối Appointment với Examination

1. DB migration: thêm `appointment_id` vào `examination_sessions`.  
2. Entity/DTO/service/controller: support `appointment_id`.  
3. Backend route:  
   - `GET /examination-sessions/appointment/:appointment_id`  
   - `POST /appointments/:id/start-examination` hoặc service orchestration tương đương.  
4. Validation:  
   - appointment phải `CHECKED_IN`.  
   - appointment doctor phải là current doctor hoặc được ủy quyền.  
   - không tạo trùng active session.  
5. Frontend:  
   - Appointment detail thêm CTA `Start examination` chỉ khi `CHECKED_IN`.  
   - Examinations new chỉ hiển thị appointment hợp lệ của doctor hiện tại.

### Phase 3 \- Refine Doctor examination workspace

1. Chuyển workspace sang session-centric:  
   - chief complaint/present illness/clinical exam  
   - medical alerts/allergies/current meds  
   - dental chart  
   - diagnosis  
   - clinical/diagnostic orders  
   - images/attachments  
   - prescription  
   - treatment plan  
2. Mọi tab query theo `session_id` hoặc `record_id`, tránh patient-level lẫn dữ liệu nhiều encounter.  
3. Thêm checklist `Ready to sign`:  
   - có clinical note cơ bản  
   - có diagnosis hoặc reason nếu chưa chẩn đoán  
   - đã review alerts  
   - orders/images đã link nếu có  
   - prescription/treatment plan hợp lệ nếu có

### Phase 4 \- Legal hardening cho EMR

1. Thêm `signed_at`, `signed_by`, `signature_id`, `finalized_at`, `finalized_by` cho session/clinical entries phù hợp.  
2. Thêm amendment/version:  
   - không update đè hồ sơ đã ký  
   - tạo version tăng dần  
   - bắt buộc reason  
3. Audit log:  
   - view record  
   - download/export  
   - upload image  
   - sign/finalize  
   - amend  
4. Record export/summary:  
   - request  
   - approve/deny  
   - generate  
   - log mục đích.

### Phase 5 \- Treatment plan, prescription, images

1. Treatment plan:  
   - thêm quote/cost estimate  
   - risk disclosure  
   - patient consent/decline/partial accept  
   - treatment plan item/session.  
2. Prescription:  
   - thêm issue/sign/cancel endpoints  
   - enforce doctor-only final  
   - link encounter/record.  
3. Dental images:  
   - thống nhất endpoint frontend/backend `/api/v1/dental-images`  
   - upload/download signed access  
   - link session/record/category  
   - audit view/download  
   - AI result chỉ là draft suggestion.

### Phase 6 \- Schedule/leave theo đúng role

1. Doctor My Schedule:  
   - chỉ xem lịch của mình  
   - không selector doctor khác trừ admin mode.  
2. Doctor leave:  
   - doctor tạo leave request, xem status  
   - admin/manager approve/reject  
   - bỏ hardcode `CURRENT_USER_ID`.  
3. Appointment availability:  
   - chặn lịch nghỉ/ngoài giờ/phòng không khả dụng.

### Phase 7 \- Verification/tests

| Nhóm test | Kịch bản cần có |
| :---- | :---- |
| Backend unit/integration | Doctor không xem/sửa session của doctor khác; không start exam nếu appointment chưa check-in; signed record không update đè. |
| API contract | Frontend endpoint dental images/examinations/prescriptions khớp backend thật. |
| Frontend flow | Doctor login \-\> worklist \-\> start checked-in appointment \-\> ghi khám \-\> treatment plan \-\> prescription \-\> sign complete. |
| Negative tests | Nurse/receptionist không final prescription/diagnosis; patient không gọi được clinical endpoints nội bộ; unauthenticated không vào medical routes. |
| Legal/audit tests | View/download/export/modify clinical data đều tạo audit log; amendment tạo version. |

## 9\. Backlog cụ thể để tạo issue

| Priority | Issue | Module |
| :---- | :---- | :---- |
| P0 | Enforce auth cho toàn bộ medical routes qua gateway và clinical guard. | Gateway, clinical-emr |
| P0 | Thêm `appointment_id` vào examination session và start exam từ checked-in appointment. | Clinical-emr, frontend appointments/examinations |
| P0 | Scope appointment/examination list theo current doctor. | Frontend, backend |
| P0 | Sửa route order static-before-dynamic trong các controller clinical. | Clinical-emr |
| P0 | Tạo sign/finalize encounter và chặn update đè sau khi ký. | Clinical-emr, frontend |
| P1 | Session-centric examination workspace, không query patient-level tùy tiện. | Frontend, clinical-emr |
| P1 | Treatment plan consent/quote/risk/partial decline. | Clinical-emr, frontend |
| P1 | Prescription issue/sign/cancel, doctor-only final. | Clinical-emr, frontend |
| P1 | Đồng bộ dental image endpoints và thêm upload/download private. | Clinical-emr, frontend, file service |
| P1 | Audit log cho clinical access/update/export. | IAM/audit, clinical-emr |
| P2 | Treatment sessions nhiều buổi, follow-up/recall. | Clinical-emr, appointment |
| P2 | Labo/material usage/inventory handoff. | Clinical-emr, inventory/labo |
| P2 | AI dental image support với disclaimer và doctor confirmation. | AI, clinical-emr, frontend |

## 10\. Checklist review lại với nhóm

Khi nhóm review flow Doctor, nên hỏi các câu sau:

1. Doctor có bắt đầu từ `appointment đã check-in` không, hay có thể tự tạo ca khám rời rạc?  
2. Mỗi ca khám có `appointment_id`, `record_id`, `patient_id`, `doctor_id`, `clinic_id` rõ ràng không?  
3. Doctor có chỉ nhìn thấy bệnh nhân/ca khám thuộc trách nhiệm của mình không?  
4. Dental chart có nằm trong luồng khám chính không?  
5. Diagnosis, orders, images, prescription, treatment plan có link với cùng session/record không?  
6. Treatment plan có giải thích phương án, rủi ro, chi phí và consent không?  
7. Đơn thuốc có bác sĩ ký/xác nhận và đủ trường theo TT26/2025 không?  
8. Hồ sơ sau khi ký có bị update đè không, hay dùng amendment/version?  
9. File ảnh/X-quang có private storage, signed access và audit không?  
10. Nếu có AI, kết quả AI có được đánh dấu là gợi ý và cần bác sĩ xác nhận không?  
11. KYC/CCCD có đang bị thu quá sớm/quá mức so với mục đích không?  
12. Payment có đang ép về appointment-level, trong khi nha khoa cần treatment plan/công nợ/nhiều đợt không?

## 11\. Refine chuyên sâu lần 2

Phần này chuyển các nhận định ở trên thành đặc tả có thể dùng để review với BA/mentor và tách backlog triển khai.

### 11.1 Luồng Doctor nên được hiểu là luồng ngoại trú nha khoa

Không nên mô tả Doctor flow như một CRUD page `examinations`. Với phòng khám nha khoa, Doctor flow là một chuỗi lâm sàng ngoại trú:

Lịch đã được tiếp nhận

\-\> Bác sĩ nhận ca

\-\> Ghi nhận bệnh án/encounter

\-\> Khám răng miệng \+ dental chart

\-\> Chẩn đoán/chỉ định/ảnh

\-\> Tư vấn phương án \+ chi phí \+ rủi ro

\-\> Bệnh nhân đồng ý/từ chối

\-\> Điều trị/kê đơn/chỉ định tái khám

\-\> Bác sĩ ký hoàn tất

\-\> Hồ sơ được lưu, khóa, audit và có thể trích xuất theo yêu cầu hợp lệ

Điểm cần nhấn mạnh khi review: **Doctor không bắt đầu từ "tạo examination tự do"**, mà bắt đầu từ **worklist các ca đã được check-in hoặc được phân công**. Việc cho doctor tự chọn bất kỳ appointment/patient dễ tạo hồ sơ rời rạc, sai scope dữ liệu và khó audit.

### 11.2 RACI cho các bước lớn

| Bước nghiệp vụ | Responsible | Accountable | Consulted | Informed | Ghi chú refine |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Đặt lịch | Patient/Receptionist/AI booking | Receptionist/Clinic ops | Doctor nếu cần chọn chuyên khoa | Patient | Doctor không nên quản lý toàn bộ booking. |
| Check-in | Receptionist | Receptionist/Clinic ops | Nurse nếu điều phối ghế | Doctor | Doctor chỉ thấy ca sau check-in. |
| Nhận ca khám | Doctor | Doctor | Nurse | Receptionist | Chỉ doctor được phân công hoặc được ủy quyền. |
| Ghi clinical note | Doctor | Doctor | Nurse có thể draft phần hỗ trợ | Patient | Draft của nurse phải được doctor xác nhận. |
| Dental chart | Doctor | Doctor | Nurse hỗ trợ nhập liệu | Patient | Đây là core của nha khoa, không nên để phụ trong Imaging. |
| Diagnosis | Doctor | Doctor | AI chỉ gợi ý nếu có | Patient | Không auto-final bằng AI. |
| Clinical/diagnostic order | Doctor | Doctor | Nurse/labo/radiology | Receptionist nếu cần điều phối | Kết quả phải quay về encounter. |
| Upload ảnh/X-quang | Doctor/Nurse | Doctor | IT/storage | Patient theo quyền | File là dữ liệu sức khỏe, cần private/audit. |
| Treatment plan | Doctor | Doctor | Receptionist/finance cho giá | Patient | Phải có quote/risk/consent. |
| Đồng ý/từ chối plan | Patient | Patient | Doctor giải thích | Receptionist | Lưu timestamp, người ghi nhận, chữ ký/xác nhận nếu có. |
| Prescription | Doctor | Doctor | Nurse có thể chuẩn bị draft | Patient | Doctor ký/xác nhận, không cho lễ tân final. |
| Payment/công nợ | Receptionist/Cashier | Clinic ops | Doctor chỉ cần xem context | Patient | Doctor không refund/thu tiền nếu không có role kiêm nhiệm. |
| Finalize encounter | Doctor | Doctor | Nurse nếu cần bổ sung | Patient | Sau finalize chỉ amendment/version. |
| Export/tóm tắt hồ sơ | Admin/Authorized staff | Clinic | Doctor khi cần tóm tắt chuyên môn | Patient | Bám Luật KCB Điều 69.4. |

### 11.3 Use case Doctor chi tiết

| ID | Use case | Trigger | Actor chính | Pre-condition | Main success scenario | Validation bắt buộc | Output |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| D-UC01 | Xem worklist hôm nay | Doctor vào dashboard | Doctor | Đã login, role Doctor, có lịch làm việc | Hệ thống load appointment theo doctor/date/status | Chỉ appointment của doctor hiện tại hoặc được ủy quyền; không load toàn bộ clinic | Worklist gồm checked-in/in-progress/upcoming |
| D-UC02 | Mở ca đã check-in | Doctor chọn appointment | Doctor | Appointment `CHECKED_IN`, đúng doctor/clinic | Hệ thống mở session đã có hoặc cho tạo session | Không cho mở nếu cancelled/no-show/not checked-in; audit access | Encounter context |
| D-UC03 | Tạo examination session từ appointment | Bấm Start examination | Doctor | Appointment `CHECKED_IN`; patient có hồ sơ hoặc tạo được record | Tạo session có `appointment_id`, `record_id`, `patient_id`, `doctor_id`, `clinic_id` | Không trùng active session; appointment chuyển `IN_PROGRESS`; actor \= doctor hiện tại | Session `IN_PROGRESS` |
| D-UC04 | Ghi thông tin khám | Doctor nhập note | Doctor | Session `IN_PROGRESS` | Lưu chief complaint, present illness, exam, alerts reviewed | Required fields tối thiểu; lưu `created_by/updated_by`; chưa signed thì được sửa | Clinical note draft |
| D-UC05 | Cập nhật dental chart | Doctor mở chart | Doctor | Session tồn tại | Đánh dấu tooth/surface/condition/procedure planned | Chart link session/record; không ghi đè chart đã signed nếu encounter finalized | Dental chart version |
| D-UC06 | Ghi chẩn đoán | Doctor nhập diagnosis | Doctor | Có clinical context | Lưu diagnosis/ICD nếu có | Diagnosis phải link `session_id`; doctor-only final; audit | Diagnosis record |
| D-UC07 | Tạo chỉ định/ảnh | Doctor tạo order hoặc upload image | Doctor/Nurse | Session active | Order/image link session/record | File private; order result phải quay về order/session; AI chỉ gợi ý | Order/image metadata |
| D-UC08 | Lập treatment plan | Doctor lập plan | Doctor | Có diagnosis hoặc clinical reason | Tạo phương án, item, số buổi, chi phí dự kiến, rủi ro | Plan link session/record; có quote/risk; chưa điều trị nếu patient chưa consent | Plan `PROPOSED` |
| D-UC09 | Ghi nhận consent/refusal | Patient đồng ý/từ chối | Patient/Doctor ghi nhận | Patient đã được tư vấn | Lưu accepted/partial/declined, chữ ký/xác nhận, timestamp | Không dùng consent marketing thay consent điều trị; lưu người chứng kiến nếu có | Consent record |
| D-UC10 | Kê đơn | Doctor tạo prescription | Doctor | Có encounter và diagnosis/context | Lưu thuốc, liều, đường dùng, thời gian, hướng dẫn | Doctor ký/xác nhận; không cho role khác final; link encounter/record | Prescription `ISSUED/SIGNED` |
| D-UC11 | Hoàn tất/ký ca khám | Doctor bấm Sign/Finalize | Doctor | Session đủ dữ liệu required | Ký session, set completed/signed | Không update đè sau signed; appointment/treatment session chuyển completed nếu phù hợp | Signed encounter |
| D-UC12 | Sửa hồ sơ sau ký | Phát hiện cần bổ sung | Doctor/Admin theo quyền | Encounter đã signed | Tạo amendment có lý do | Không sửa trực tiếp bản signed; version tăng; audit | Amendment/version |
| D-UC13 | Xem lịch cá nhân | Doctor vào My Schedule | Doctor | Login Doctor | Xem lịch làm việc/nghỉ của mình | Không selector doctor khác nếu không phải admin/manager | Personal schedule |
| D-UC14 | Gửi yêu cầu nghỉ | Doctor tạo leave request | Doctor | Có ngày nghỉ hợp lệ | Gửi request pending | Không tự approve; không trùng lịch đã khóa nếu policy không cho | Leave request |

### 11.4 Data model tối thiểu nên có cho Doctor flow

| Entity | Quan hệ bắt buộc | Trạng thái/field quan trọng | Ghi chú |
| :---- | :---- | :---- | :---- |
| `Appointment` | `patient_id`, `doctor_id`, `clinic_id`, `room_id?` | `SCHEDULED`, `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW` | Là đầu vào vận hành, không thay thế hồ sơ bệnh án. |
| `MedicalRecord` | `patient_id` | `record_status`, `created_by`, `updated_by` | Hồ sơ mẹ của bệnh nhân. |
| `Encounter/ExaminationSession` | `appointment_id`, `record_id`, `patient_id`, `doctor_id`, `clinic_id` | `DRAFT`, `IN_PROGRESS`, `READY_TO_SIGN`, `SIGNED`, `AMENDED`, `CANCELLED`; `signed_at`, `signed_by` | Đây là object trung tâm của Doctor flow. |
| `ClinicalNote` | `session_id`, `record_id` | chief complaint, present illness, physical exam, alerts reviewed | Có thể gộp vào session phase đầu, nhưng về lâu dài nên tách note/version. |
| `DentalChart` | `session_id`, `record_id`, `patient_id` | tooth, surface, condition, planned/performed procedure, version | Core nha khoa. |
| `Diagnosis` | `session_id`, `record_id`, `doctor_id` | diagnosis text, ICD code nếu có, status, signed flag | Không nên chỉ query patient-level. |
| `ClinicalOrder/DiagnosticOrder` | `session_id`, `appointment_id?`, `record_id` | type, priority, status, result, reviewed\_by | Result phải quay về session. |
| `DentalImage` | `session_id`, `record_id`, `patient_id`, `uploaded_by` | storage key, category, visibility, archived, ai\_result? | Không lưu public URL trực tiếp nếu có PHI. |
| `TreatmentPlan` | `session_id`, `record_id`, `patient_id`, `doctor_id` | proposed/accepted/declined/in\_progress/completed | Cần quote/risk/consent. |
| `TreatmentPlanItem` | `plan_id`, `service_id?`, `tooth?` | quantity, expected sessions, estimated price | Nha khoa cần điều trị nhiều hạng mục. |
| `TreatmentConsent` | `plan_id`, `patient_id` | accepted/partial/declined, signed\_at, signed\_by, witness? | Tách khỏi marketing/data consent. |
| `Prescription` | `session_id`, `record_id`, `doctor_id` | draft/issued/signed/cancelled, signature\_id | Kê đơn ngoại trú theo TT26/2025. |
| `RecordAmendment` | `record_id`, `session_id?`, `previous_version_id` | reason, changed\_by, changed\_at | Chống update đè hồ sơ đã ký. |
| `AuditLog` | actor, target\_type, target\_id | view/create/update/sign/download/export/amend | Cần cho dữ liệu sức khỏe. |

Mapping với code hiện tại:

- `ExaminationSessionEntity` hiện có `record_id`, `patient_id`, `doctor_id`, `clinic_id`, `status`, `completed_at`, nhưng **chưa có `appointment_id`, `signed_at`, `signed_by`, `amended_from`**.  
- `MedicalRecordsService.update()` đang `Object.assign(item, dto)` rồi save; `createVersion()` đang hardcode `versionNumber = 1`, chưa đủ cho amendment/version thật.  
- Frontend `ExaminationsPage` đã type `appointment_id?: string | null`, nhưng backend entity/DTO chưa có field này, cho thấy UI đang kỳ vọng một field chưa được model hóa.

### 11.5 API contract đề xuất cho phase P0/P1

| API | Method | Actor | Mục đích | Validation |
| :---- | :---- | :---- | :---- | :---- |
| `/api/v1/doctors/me/worklist?date=YYYY-MM-DD` | GET | Doctor | Lấy worklist của bác sĩ hiện tại | Auth required, role Doctor, scope theo current user. |
| `/api/v1/appointments/:id/start-examination` | POST | Doctor | Tạo/mở session từ appointment | Appointment `CHECKED_IN`, đúng doctor, không trùng active session. |
| `/api/v1/examination-sessions/appointment/:appointment_id` | GET | Doctor/Admin | Tìm session theo appointment | Static route đặt trước `:session_id`, scope check. |
| `/api/v1/examination-sessions/:id/ready-to-sign` | POST | Doctor | Validate checklist trước ký | Required fields, diagnosis/context, alerts reviewed. |
| `/api/v1/examination-sessions/:id/sign` | POST | Doctor | Ký/finalize encounter | Doctor assigned, session not signed, signature/xác nhận hợp lệ. |
| `/api/v1/examination-sessions/:id/amendments` | POST | Doctor/Admin theo quyền | Tạo amendment sau ký | Session signed, bắt buộc reason, tạo version mới. |
| `/api/v1/examination-sessions/:id/dental-chart` | GET/PUT | Doctor | Quản lý dental chart trong encounter | Chỉ sửa khi session chưa signed hoặc qua amendment. |
| `/api/v1/examination-sessions/:id/diagnoses` | GET/POST | Doctor | Diagnosis theo session | Không query patient-level cho flow chính. |
| `/api/v1/examination-sessions/:id/treatment-plans` | GET/POST | Doctor | Plan theo session | Có diagnosis/context, quote/risk. |
| `/api/v1/treatment-plans/:id/consent` | POST | Patient/Doctor ghi nhận | Đồng ý/từ chối plan | Tách consent điều trị; lưu timestamp/signature. |
| `/api/v1/examination-sessions/:id/prescriptions` | GET/POST | Doctor | Kê đơn theo session | Draft trước, sign riêng. |
| `/api/v1/prescriptions/:id/sign` | POST | Doctor | Issue prescription | Đủ trường theo TT26/2025, doctor-only. |
| `/api/v1/examination-sessions/:id/dental-images` | GET/POST | Doctor/Nurse | Upload/list ảnh theo session | Private storage, audit, content type/size check. |

Điểm kỹ thuật nên chọn: đặt orchestration `start-examination` ở appointment module hoặc một application service trung gian. Không nên để frontend tự POST rời rạc vào `/examination-sessions` rồi tự cập nhật appointment status, vì dễ sai transaction.

### 11.6 Validation matrix chi tiết

| Nhóm validation | Rule | Vì sao cần |
| :---- | :---- | :---- |
| Auth | Mọi medical route yêu cầu trusted identity | Dữ liệu sức khỏe nhạy cảm; gateway hiện chưa bắt token cho toàn bộ medical routes. |
| Role | Doctor mới final diagnosis/prescription/session | Trách nhiệm chuyên môn thuộc bác sĩ. |
| Ownership | Doctor chỉ xem ca của mình hoặc ca được ủy quyền | Tránh lộ hồ sơ giữa bác sĩ/chi nhánh. |
| Appointment status | Chỉ start exam từ `CHECKED_IN` | Đúng luồng tiếp đón phòng khám. |
| Idempotency | Start exam lần 2 trả session hiện có | Tránh tạo nhiều encounter cho cùng appointment. |
| Record linkage | Session phải có `record_id` | Luật KCB Điều 69 yêu cầu hồ sơ bệnh án. |
| Session linkage | Diagnosis/prescription/order/image/plan phải link session/record | Tránh lẫn dữ liệu nhiều lần khám. |
| Required clinical data | Không sign nếu thiếu minimum clinical note hoặc lý do không chẩn đoán | TT32 Điều 52 yêu cầu đầy đủ/trung thực. |
| Signature/finalize | Sau signed không update đè | Luật KCB Điều 7.10. |
| Amendment | Sửa sau ký phải có reason/version/actor/time | Audit và chống sai lệch hồ sơ. |
| Consent | Treatment plan cần patient accepted/declined/partial | Luật KCB Điều 9, 11, 13\. |
| Prescription | Thuốc/liều/đường dùng/thời gian/hướng dẫn/ngày kê/bác sĩ ký | TT26/2025. |
| File upload | Private, size/type scan, signed URL, audit download | Luật KCB Điều 69.2 và Luật BVDLCN. |
| AI | AI output phải là suggestion, doctor confirm final | Trách nhiệm lâm sàng thuộc bác sĩ. |
| KYC | Không bắt CCCD cho booking thường nếu không có mục đích rõ | Tối thiểu hóa dữ liệu theo Luật BVDLCN Điều 3\. |

### 11.7 Evidence code theo dòng đã kiểm tra

| Nhận định | Bằng chứng code |
| :---- | :---- |
| Frontend middleware đang bypass auth | `frontend/web/src/middleware.ts:15` có `DISABLE_AUTH_GUARD = true`; `middleware.ts:18` return `NextResponse.next()`. |
| Gateway chỉ bắt trusted identity bắt buộc cho appointment/booking | `backend/service/gateway-service/src/proxy/proxy.middleware.ts:79-82` chỉ check booking-langgraph và `/api/v1/appointments`; identity header được set ở `:171-174`. |
| Examination session chưa có `appointment_id` | Entity có `record_id` ở `examination-session.entity.ts:18`, `patient_id` ở `:25`, `doctor_id` ở `:32`, `status` ở `:53`, `completed_at` ở `:59`; không thấy `appointment_id`. DTO cũng chỉ có `record_id`, `patient_id`, `doctor_id`. |
| Route `appointment/:id` frontend kỳ vọng nhưng backend chưa có | Frontend endpoint có `EXAMINATION.BY_APPOINTMENT` tại `frontend/web/src/shared/api/endpoint.ts:353-355`; `ExaminationSessionsController` chỉ có `@Get(':session_id')`, `patient/:patient_id`, `doctor/:doctor_id`. |
| Examinations new load appointment không scope Doctor | `frontend/web/src/app/(pages)/examinations/new/page.tsx:51` gọi `/appointments` với `limit: 50`. |
| Examinations new tạo session không gửi `appointment_id` | POST `/examination-sessions` tại `examinations/new/page.tsx:87`; payload có `doctor_id` ở `:89`, `status: 'in_progress'` ở `:93`, không có `appointment_id`. |
| Examinations list load toàn bộ sessions | `frontend/web/src/app/(pages)/examinations/page.tsx:42` gọi `/examination-sessions`. |
| Appointments page load list chung | `frontend/web/src/app/(pages)/appointments/page.tsx:56` gọi `useAppointmentsList({ limit: 50 })`. |
| Dental image endpoint mismatch | Frontend dùng `/images/upload`, `/images/patient`, `/images/:id/analyze` tại `endpoint.ts:390-404`; backend controller là `@Controller('dental-images')` tại `dental-images.controller.ts:17`. |
| Static route có nguy cơ bị dynamic route shadow | Ví dụ `dental-images.controller.ts:36` `@Get(':image_id')` đứng trước `patient/:patient_id` ở `:41`; `diagnoses.controller.ts:31` `:diagnosis_id` trước `session/:session_id`; `prescriptions.controller.ts:31` `:prescription_id` trước `patient/:patient_id`; `treatment-plans.controller.ts:34` `:plan_id` trước `patient/:patient_id`. |
| Medical record version chưa đủ | `medical-records.service.ts:36-39` update đè bằng `Object.assign`; `createVersion()` hardcode `versionNumber = 1` ở `:57`. |

### 11.8 Quyết định thiết kế nên raise

| Quyết định | Khuyến nghị | Lý do |
| :---- | :---- | :---- |
| Doctor có được tạo examination không qua appointment không? | Chỉ cho trong case walk-in/emergency/manual admin override, phải ghi reason. | Bình thường phải trace từ check-in appointment. |
| `appointment_id` có nullable không? | Nullable ở DB giai đoạn migrate, nhưng required ở flow chuẩn. | Tránh break dữ liệu cũ, nhưng enforce business rule ở service. |
| Một appointment có nhiều session không? | Mặc định 1 encounter chính; nhiều treatment session nên nằm dưới treatment plan. | Tránh nhầm giữa khám ban đầu và điều trị nhiều buổi. |
| Payment có nằm trong Doctor workspace không? | Doctor chỉ xem estimate/payment status tối thiểu; action thu/refund thuộc receptionist/cashier. | Tách trách nhiệm và giảm rủi ro quyền. |
| `DISPENSED` trong prescription xử lý ở đâu? | Không thuộc Doctor final flow; để pharmacy/inventory nếu có. | Doctor kê đơn/ký, không mặc định cấp phát. |
| AI dental image có được ghi diagnosis không? | Không. AI tạo suggestion, doctor confirm mới thành diagnosis. | Trách nhiệm lâm sàng và dữ liệu sức khỏe. |
| Blockchain có phải core EMR không? | Không. Chỉ dùng hash/integrity sau khi record signed nếu cần demo. | Luật yêu cầu EMR hợp lệ, không yêu cầu blockchain. |

### 11.9 P0 implementation slice hợp lý nhất

Nếu chỉ được chọn một lát cắt để làm trước cho Doctor, nên chọn:

Doctor scoped worklist

\-\> Start examination từ checked-in appointment

\-\> Create/open session có appointment\_id \+ record\_id

\-\> Ghi note/diagnosis cơ bản

\-\> Sign/finalize session

\-\> Appointment completed

Scope này đủ chứng minh flow hợp lý và có tính pháp lý hơn hiện tại. Chưa cần làm ngay toàn bộ labo/inventory/AI/blockchain.

Acceptance criteria cho P0:

1. Doctor A không thấy appointment/session của Doctor B.  
2. Doctor không start exam nếu appointment chưa `CHECKED_IN`.  
3. Start exam tạo đúng một session cho appointment.  
4. Session có `appointment_id`, `record_id`, `patient_id`, `doctor_id`, `clinic_id`.  
5. Doctor ký/finalize được session khi đủ dữ liệu tối thiểu.  
6. Sau signed, update thường bị chặn; muốn sửa phải tạo amendment.  
7. Appointment chuyển `IN_PROGRESS` khi start và `COMPLETED` khi finalize.  
8. Audit log ghi ít nhất view/start/sign/update/amend.

### 11.10 Test cases nên tạo ngay

| Test ID | Test | Expected |
| :---- | :---- | :---- |
| T-DOC-001 | Doctor gọi worklist | Chỉ trả ca của current doctor. |
| T-DOC-002 | Doctor start exam appointment `SCHEDULED` | 400/409, message cần check-in trước. |
| T-DOC-003 | Doctor start exam appointment của doctor khác | 403\. |
| T-DOC-004 | Start exam hai lần cùng appointment | Lần hai trả session hiện có, không tạo trùng. |
| T-DOC-005 | Tạo diagnosis không có session\_id | 400\. |
| T-DOC-006 | Nurse final prescription | 403\. |
| T-DOC-007 | Sign session thiếu clinical minimum | 422/400 với checklist lỗi. |
| T-DOC-008 | Update session đã signed bằng PATCH thường | 409, yêu cầu amendment. |
| T-DOC-009 | Upload dental image rồi download không token | 401\. |
| T-DOC-010 | Doctor xem image của patient không thuộc ca mình | 403\. |
| T-DOC-011 | Treatment plan chuyển `IN_PROGRESS` khi chưa consent | 409\. |
| T-DOC-012 | Record version sau amendment | Version tăng, có reason/actor/time. |

## 12\. Kết luận cho role Doctor

Role Doctor hiện tại **có nền module khá nhiều**, nhưng flow đang thiếu liên kết nghiệp vụ và guard pháp lý. Việc ưu tiên nên làm trước không phải thêm màn hình mới, mà là:

1. Khóa lại auth/RBAC/scope dữ liệu.  
2. Nối appointment đã check-in với examination bằng `appointment_id`.  
3. Chuyển workspace khám sang session-centric.  
4. Thêm ký/xác nhận, version/amendment, audit.  
5. Refine treatment plan/prescription/image theo yêu cầu pháp lý và thực tế nha khoa Việt Nam.

Sau khi xử lý các điểm này, flow Doctor sẽ phù hợp hơn với một phòng khám nha khoa ngoại trú tại Việt Nam và dễ mở rộng sang treatment session, labo, inventory, recall, và báo cáo hiệu suất bác sĩ.

# Link

# **05 — Tương Tác & Bàn Giao Liên Vai Trò**

Phần này nối các luồng đơn lẻ (`01`–`04`) thành bức tranh tổng thể: ai bàn giao cho ai, ở điểm nào, đồng bộ trạng thái gì.

---

## **L1. Sơ đồ swimlane — Một lượt khám hoàn chỉnh**

PATIENT        RECEPTION         NURSE            DOCTOR           ADMIN/SYSTEM  
───────        ─────────         ─────            ──────           ────────────  
Đăng ký ─────────────────────────────────────────────────────────▶ tạo tài khoản  
Nộp KYC ─────────────────────────────────────────────────────────▶ OCR/duyệt → VERIFIED  
Đặt lịch ──────▶ (hỗ trợ nếu cần)                                   slot/VNPay  
   │  
   ▼  
Đến KK ───────▶ Check-in  
                CHECKED\_IN  
                \+ vào hàng đợi ──▶ gọi vào phòng  
                                  Đo sinh hiệu ─────▶ Khám & chẩn đoán  
                                  Phụ tá thủ thuật     (ICD, dental chart)  
                                                       Chỉ định cận LS ─┐  
                                  Hỗ trợ chụp X-Ray ◀────────────────────┘  
                                                       Kê đơn ──▶ Patient  
                                                       Lập kế hoạch ──▶ Patient duyệt  
Duyệt KH ◀───────────────────────────────────────────┘  
                                  Hậu điều trị  
                ◀── bàn giao ───  (queue: DONE)  
Thanh toán ───▶ Thu ngân (quầy)                                     PAID  
   │            hoặc VNPay ───────────────────────────────────────▶  
   ▼  
Đặt tái khám ─▶ tạo lịch mới  
Đánh giá ────────────────────────────────────────────────────────▶ tổng hợp báo cáo  
                                                       Finalize ──▶ lưu hash blockchain

---

## **L2. Bảng các điểm bàn giao (Handoff points)**

| \# | Từ | Đến | Sự kiện bàn giao | Trạng thái thay đổi |
| ----- | ----- | ----- | ----- | ----- |
| 1 | Patient | System | Nộp KYC | KYC: `PENDING_REVIEW` |
| 2 | System | Admin | KYC cần duyệt tay | KYC: `PENDING_REVIEW → VERIFIED/REJECTED` |
| 3 | Patient | Reception | Đến phòng khám | Appt: `CONFIRMED → CHECKED_IN` |
| 4 | Reception | Nurse | Gán phòng, đẩy hàng đợi | Queue: `WAITING → CALLED`; Room: `AVAILABLE → OCCUPIED` |
| 5 | Nurse | Doctor | Đo xong sinh hiệu | Exam session: tạo & gắn vital signs |
| 6 | Doctor | Nurse | Chỉ định cận lâm sàng | ClinicalOrder: `ORDERED → IN_PROGRESS` |
| 7 | Doctor | Patient | Gửi đơn thuốc | Prescription: `ISSUED` |
| 8 | Doctor | Patient | Gửi kế hoạch điều trị | TreatmentPlan: `SENT` |
| 9 | Patient | Doctor | Duyệt kế hoạch | TreatmentPlan: `ACCEPTED/CANCELLED` |
| 10 | Doctor | Nurse | Kết thúc thủ thuật | Queue: `IN_ROOM → DONE`; Room: `OCCUPIED → CLEANING` |
| 11 | Nurse | Reception | Bàn giao bệnh nhân | — |
| 12 | Reception | Patient | Thu ngân | Payment: `PENDING → PAID` |
| 13 | Patient | Admin | Yêu cầu hoàn tiền | Refund: `REQUESTED → … → REFUNDED` |
| 14 | System | All | Nhắc lịch/tái khám | Notification gửi đi |

---

## **L3. Đồng bộ trạng thái chéo (state coupling)**

Các trạng thái phải đồng bộ giữa nhiều thực thể; thay đổi một bên kéo theo bên kia:

Appointment.CHECKED\_IN   ⇄  Queue: thêm WAITING  
Queue.CALLED             ⇄  Room: AVAILABLE → OCCUPIED  
Appointment.COMPLETED    ⇄  Queue: DONE ⇄ Room: CLEANING  
Payment.PAID/refunded    ⇄  Appointment: cho phép finalize hồ sơ  
TreatmentPlan.ACCEPTED   ⇄  sinh sub-appointment cho từng buổi  
Refund.REFUNDED          ⇄  Payment gốc: → refunded  
KYC.VERIFIED             ⇄  mở khóa các dịch vụ yêu cầu KYC

---

## **L4. Luồng thông báo liên vai trò (Notification)**

| Sự kiện kích hoạt | Người nhận | Kênh |
| ----- | ----- | ----- |
| Đặt lịch thành công | Patient | email/SMS/in-app |
| Nhắc lịch T-24h / T-2h | Patient | push/SMS |
| Check-in xong | Nurse, Doctor | in-app |
| Có chỉ định cận lâm sàng | Nurse | in-app |
| Kế hoạch điều trị gửi tới | Patient | email/in-app |
| Patient duyệt/từ chối kế hoạch | Doctor | in-app |
| Thanh toán thành công/thất bại | Patient, Reception | in-app/email |
| Yêu cầu hoàn tiền mới | Admin | in-app/email |
| Bác sĩ nghỉ đột xuất | Reception, Patient bị ảnh hưởng | in-app/SMS |
| Vật tư dưới ngưỡng | Admin, Nurse | in-app |
| KYC cần duyệt tay | Admin | in-app |

---

## **L5. Ma trận trạng thái phòng & hàng đợi (tham chiếu nhanh)**

TreatmentRoom:  AVAILABLE ─▶ OCCUPIED ─▶ CLEANING ─▶ AVAILABLE  
Queue item:     WAITING ─▶ CALLED ─▶ IN\_ROOM ─▶ DONE  
                   └─▶ SKIPPED ─▶ (gọi lại) WAITING

---

## **L6. Gợi ý triển khai kỹ thuật (tùy chọn)**

* Đồng bộ trạng thái chéo nên dùng **event-driven** (publish/subscribe) để tránh lệch trạng thái giữa Appointment ↔ Queue ↔ Room.  
* Hàng đợi & trạng thái phòng nên cập nhật **real-time** (WebSocket/SSE) cho dashboard lễ tân & y tá.  
* Mọi handoff ở bảng L2 nên ghi `AuditLog` để truy vết.  
* Notification nên tách thành service riêng, nhận event và fan-out theo cấu hình kênh của từng người dùng.

# Final

# Tổng hợp luồng nghiệp vụ chuẩn cho hệ thống quản lý nha khoa S.M.I.L.E

Ngày lập: 01/07/2026  
Phạm vi: hệ thống quản lý phòng khám nha khoa/Răng Hàm Mặt tại Việt Nam.  
Mục tiêu: xác định luồng nghiệp vụ đúng chuẩn, căn cứ pháp lý liên quan, danh sách chức năng/use case, đối chiếu hiện trạng hệ thống và đề xuất các điểm cần cải thiện để có một flow hoàn chỉnh.

Tài liệu này dùng cho phân tích nghiệp vụ/kỹ thuật nội bộ. Không thay thế tư vấn pháp lý chính thức. Khi chốt đặc tả cuối, nhóm nên nhờ người phụ trách pháp chế hoặc chuyên gia vận hành phòng khám xác nhận lại.

## 1\. Quyết định phạm vi hiện tại

| Hạng mục | Quyết định |
| :---- | :---- |
| Core flow P0/P1 | Tập trung vào đặt lịch, nhắc lịch, tiếp đón, check-in, khám, hồ sơ bệnh án, kế hoạch điều trị, kê đơn nếu có, thanh toán, tái khám, audit. |
| KYC/CCCD | Tạm ngưng khỏi core flow. Không dùng KYC làm cổng bắt buộc để đặt lịch, check-in hoặc khám thông thường. Chỉ để phase sau nếu có mục đích rõ như xác minh tài khoản, yêu cầu bản sao hồ sơ, đối soát thanh toán/hóa đơn hoặc định danh EMR. Chỉ dùng tính năng này cho các role mà làm việc ( doctor, recp,... ) để xác minh về giấy tờ và các thông tin bằng cấp của họ.  |
| AI | Tạm ngưng khỏi core flow. Không dùng AI để tự động chẩn đoán, kê đơn hoặc quyết định điều trị. Nếu mở lại phase sau, AI chỉ là gợi ý, bác sĩ chịu trách nhiệm chuyên môn cuối cùng. |
| Kế toán/Cashier riêng | Không tách role riêng trong scope hiện tại. Lễ tân đảm nhiệm thanh toán, biên lai, hoàn tiền theo quyền, và đối soát ca. |
| Kho/vật tư | Không đưa quản lý kho/vật tư vào scope hiện tại. Nếu cần về sau, chỉ xem là phase mở rộng, không phải điều kiện để flow khám chạy đúng. |
| Người bệnh dưới 18 tuổi | Phải hỗ trợ người đại diện hợp pháp/người giám hộ trong đặt lịch, xác nhận treatment plan, thanh toán và yêu cầu hồ sơ. Đây là scope nghiệp vụ nên có vì nha khoa thường có trẻ em. |

## 2\. Căn cứ pháp lý cần bám khi thiết kế

| Mã | Văn bản | Link kiểm chứng | Ý nghĩa thiết kế |
| :---- | :---- | :---- | :---- |
| PL-01 | Luật Khám bệnh, chữa bệnh 15/2023/QH15, hiệu lực 01/01/2024 | [https://vanban.chinhphu.vn/?docid=207396\&pageid=27160](https://vanban.chinhphu.vn/?docid=207396&pageid=27160) | Khung chính cho quyền người bệnh, nghĩa vụ người hành nghề, hồ sơ bệnh án, bảo mật hồ sơ, phạm vi hành nghề. |
| PL-02 | Nghị định 96/2023/NĐ-CP, hiệu lực 01/01/2024 | [https://vanban.chinhphu.vn/?docid=209491\&pageid=27160](https://vanban.chinhphu.vn/?docid=209491&pageid=27160) | Quy định chi tiết về giấy phép hành nghề, giấy phép hoạt động, quản lý hoạt động khám chữa bệnh. |
| PL-03 | Thông tư 32/2023/TT-BYT, hiệu lực 01/01/2024 | [https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Thong-tu-32-2023-TT-BYT-huong-dan-Luat-Kham-benh-chua-benh-593360.aspx](https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Thong-tu-32-2023-TT-BYT-huong-dan-Luat-Kham-benh-chua-benh-593360.aspx) | Phạm vi hành nghề, mẫu hồ sơ bệnh án, nguyên tắc ghi hồ sơ, thời gian/người ghi. |
| PL-04 | Thông tư 13/2025/TT-BYT về hồ sơ bệnh án điện tử, hiệu lực 21/07/2025 | [https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Thong-tu-13-2025-TT-BYT-huong-dan-trien-khai-ho-so-benh-an-dien-tu-660113.aspx](https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Thong-tu-13-2025-TT-BYT-huong-dan-trien-khai-ho-so-benh-an-dien-tu-660113.aspx) | EMR phải được lập, cập nhật, hiển thị, ký, lưu trữ, quản lý, khai thác bằng phương tiện điện tử; cơ sở khác bệnh viện hoàn thành EMR chậm nhất 31/12/2026. |
| PL-05 | Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15, hiệu lực 01/01/2026 | [https://vanban.chinhphu.vn/?classid=1\&docid=214590\&orggroupid=1\&pageid=27160](https://vanban.chinhphu.vn/?classid=1&docid=214590&orggroupid=1&pageid=27160) | Dữ liệu sức khỏe là dữ liệu nhạy cảm; yêu cầu xử lý đúng mục đích, tối thiểu, minh bạch, bảo mật, có căn cứ xử lý và xử lý sự cố dữ liệu. |
| PL-06 | Thông tư 26/2025/TT-BYT về đơn thuốc ngoại trú, hiệu lực 01/07/2025 | [https://vanban.chinhphu.vn/?classid=1\&docid=214386\&orggroupid=4\&pageid=27160](https://vanban.chinhphu.vn/?classid=1&docid=214386&orggroupid=4&pageid=27160) | Quy định thẩm quyền kê đơn, mẫu đơn thuốc và kê đơn thuốc hóa dược/sinh phẩm trong điều trị ngoại trú. |
| PL-07 | Nghị định 70/2025/NĐ-CP về hóa đơn, chứng từ, hiệu lực 01/06/2025 | [https://vanban.chinhphu.vn/?docid=213179\&pageid=27160](https://vanban.chinhphu.vn/?docid=213179&pageid=27160) | Cần đối chiếu khi triển khai hóa đơn điện tử, hóa đơn từ máy tính tiền, đối soát thanh toán. |

## 3\. Nguyên tắc nghiệp vụ chuẩn

1. `Appointment` không thay thế `Encounter/Examination session`. Lịch hẹn chỉ là cam kết thời gian; ca khám mới là đối tượng lâm sàng.  
2. Mọi dữ liệu lâm sàng phải có ngữ cảnh: `patient_id`, `doctor_id`, `clinic_id`, `appointment_id`, `record_id/session_id`, thời gian tạo, người tạo, người ký/xác nhận.  
3. Bác sĩ chỉ thao tác ca thuộc phạm vi hành nghề, lịch làm việc, chi nhánh và phân công hợp lệ.  
4. Lễ tân điều phối tiếp nhận, check-in, queue, thanh toán; không final diagnosis, không final prescription.  
5. Điều dưỡng/phụ tá nha khoa có thể hỗ trợ nhập nháp, upload ảnh, chuẩn bị phòng; bác sĩ phải xác nhận phần lâm sàng quan trọng.  
6. Hồ sơ đã ký/finalize không được update đè. Sửa sau ký phải dùng amendment/version có lý do, người sửa, thời gian sửa và audit.  
7. Treatment plan phải có tư vấn phương án, rủi ro, chi phí dự kiến/quote và trạng thái đồng ý/từ chối của người bệnh trước khi thực hiện hạng mục không khẩn cấp.  
8. Nhắc lịch và tái khám là chức năng lõi, không phải tiện ích phụ. Nha khoa thường điều trị nhiều buổi, nên hệ thống cần recall/follow-up.  
9. Dữ liệu sức khỏe, ảnh nha khoa, X-quang, đơn thuốc, bệnh án phải private, có RBAC, audit truy cập, download/export có kiểm soát.  
10. Thông báo chăm sóc điều trị và marketing phải tách riêng. Nhắc lịch khám/tái khám là thông báo dịch vụ; quảng cáo/khuyến mãi cần consent/preference riêng.  
11. Với người bệnh chưa thành niên hoặc người không tự xác nhận được, các bước tư vấn, đồng ý điều trị, thanh toán và yêu cầu hồ sơ phải gắn người đại diện hợp pháp/người giám hộ.  
12. Giá dịch vụ/quote cần có version hoặc hiệu lực thời gian để tránh lệch giữa lúc tư vấn, bệnh nhân đồng ý và lúc thanh toán.

    ## 4\. Actor chuẩn của hệ thống

| Actor | Trách nhiệm chính | Không nên làm |
| :---- | :---- | :---- |
| Patient/Người bệnh | Đặt lịch, nhận nhắc lịch, cung cấp thông tin sức khỏe, xác nhận/từ chối kế hoạch điều trị, thanh toán, yêu cầu xem/cấp bản sao/tóm tắt hồ sơ. Với người bệnh dưới 18 tuổi, thao tác xác nhận chính cần qua người đại diện hợp pháp/người giám hộ. | Không xem dữ liệu nội bộ, audit log, ghi chú không thuộc phạm vi cung cấp cho người bệnh. |
| Receptionist/Lễ tân | Tạo/xác nhận lịch, check-in, điều phối queue/phòng/ghế, nhắc lịch thủ công khi cần, thanh toán, biên lai, hoàn tiền theo quyền, đối soát ca. | Không chẩn đoán, không kê đơn, không ký hồ sơ bệnh án, không sửa nội dung lâm sàng đã ký. |
| Nurse/Dental assistant | Chuẩn bị phòng, ghi dấu hiệu sinh tồn/tiền sử cơ bản, hỗ trợ bác sĩ, upload ảnh theo phân quyền. | Không final diagnosis, không final prescription, không ký encounter thay bác sĩ. |
| Doctor/Dentist | Khám, chẩn đoán, dental chart, chỉ định, lập treatment plan, kê đơn, ký/finalize encounter, chỉ định tái khám. | Không tự ý xem/sửa ca không thuộc trách nhiệm; không finalize khi thiếu dữ liệu bắt buộc. |
| Admin/Clinic manager | Quản trị người dùng/RBAC, chi nhánh, phòng, dịch vụ/giá, lịch làm việc, duyệt nghỉ, audit, báo cáo. | Không sửa đè nội dung lâm sàng đã ký. |
| System/Notification worker | Gửi nhắc lịch, xác nhận, tái khám, cảnh báo vận hành, ghi delivery log. | Không gửi marketing khi chưa có consent/preference phù hợp. |

    ## 5\. Flow tổng thể chuẩn

    Patient/Receptionist tạo lịch

    

    \-\> Hệ thống kiểm tra lịch bác sĩ, phòng, dịch vụ, trùng slot

    

    \-\> Nếu người bệnh dưới 18 tuổi: ghi nhận người đại diện hợp pháp/người giám hộ

    

    \-\> Appointment SCHEDULED/CONFIRMED

    

    \-\> Gửi xác nhận và lên lịch reminder

    

    \-\> Receptionist check-in khi bệnh nhân đến

    

    \-\> Queue/room assignment

    

    \-\> Nurse chuẩn bị phòng, nhập dữ liệu tiền khám nếu có

    

    \-\> Doctor mở worklist và start examination

    

    \-\> Tạo/mở examination session gắn appointment \+ record

    

    \-\> Ghi khám, dental chart, diagnosis, orders/images

    

    \-\> Lập treatment plan \+ quote \+ consent/decline

    

    \-\> Kê đơn nếu cần

    

    \-\> Doctor sign/finalize encounter

    

    \-\> Receptionist thu tiền, ghi biên lai, đối soát ca

    

    \-\> Tạo follow-up/recall/tái khám

    

    \-\> Hồ sơ lưu trữ, audit, export khi có yêu cầu hợp lệ

    ### 5.1 State machine Appointment

    DRAFT/REQUESTED

    

    \-\> SCHEDULED

    

    \-\> CONFIRMED

    

    \-\> REMINDED

    

    \-\> CHECKED\_IN

    

    \-\> WAITING

    

    \-\> IN\_SERVICE

    

    \-\> COMPLETED

    

    Nhánh phụ:

    

    SCHEDULED/CONFIRMED/REMINDED \-\> RESCHEDULED

    

    SCHEDULED/CONFIRMED/REMINDED \-\> CANCELLED

    

    SCHEDULED/CONFIRMED/REMINDED/CHECKED\_IN \-\> NO\_SHOW

    

    Validation:

    

- Chỉ tạo lịch nếu slot nằm trong lịch làm việc, bác sĩ không nghỉ, phòng/ghế khả dụng, không trùng appointment active.  
- Không yêu cầu KYC để đặt lịch thường.  
- `CHECKED_IN` do lễ tân hoặc actor được phân quyền tiếp nhận.  
- Nếu người bệnh dưới 18 tuổi, check-in/treatment consent/record request cần có người đại diện hợp pháp/người giám hộ hoặc thông tin người đưa trẻ theo quy trình phòng khám.  
- `IN_SERVICE` chỉ khi có examination session active.  
- `COMPLETED` không phụ thuộc bắt buộc vào payment; hoàn tất lâm sàng và hoàn tất tài chính là hai state khác nhau.

  ### 5.2 Flow nhắc lịch và tái khám

  Appointment CONFIRMED  
    
  \-\> Tạo reminder jobs: T-24h, T-2h hoặc cấu hình theo phòng khám  
    
  \-\> Kiểm tra notification preference và kênh hợp lệ  
    
  \-\> Gửi APP/Email/SMS/Zalo nếu được cấu hình  
    
  \-\> Ghi delivery log: pending/sent/failed/read/responded  
    
  \-\> Patient xác nhận, đổi lịch hoặc hủy  
    
  \-\> Receptionist thấy phản hồi trên appointment detail/worklist  
    
  \-\> Nếu quá giờ chưa đến: mark NO\_SHOW  
    
  \-\> Sau khám: Doctor/Reception tạo follow-up/recall  
    
  \-\> Reminder tái khám chạy theo ngày hẹn tiếp theo  
    
  Thiết kế dựa trên:  
    
- PL-05 Điều 3/11/26: xử lý dữ liệu cá nhân đúng mục đích, minh bạch, có căn cứ xử lý; dữ liệu sức khỏe cần bảo vệ chặt.  
- PL-01 Điều 9 và Điều 17: người bệnh cần được cung cấp thông tin liên quan dịch vụ và có nghĩa vụ hợp tác/cung cấp thông tin khi khám chữa bệnh.  
    
  Validation:  
    
- Nhắc lịch khám/tái khám là thông báo dịch vụ, không trộn với marketing.  
- Marketing, khuyến mãi, chăm sóc ngoài điều trị phải có consent/preference riêng.  
- Mỗi notification có `recipient_id`, `appointment_id`, `channel`, `template_id`, `status`, `sent_at`, `failure_reason`.  
- Không gửi thông tin nhạy cảm quá mức trong SMS/Zalo/email; nội dung nên tối thiểu: thời gian, địa điểm, hướng dẫn liên hệ.

  ### 5.3 Flow tiếp đón, queue và phòng

  Receptionist mở lịch hôm nay  
    
  \-\> Xác minh thông tin hành chính tối thiểu  
    
  \-\> Check-in appointment  
    
  \-\> Gán queue number/phòng/ghế nếu có  
    
  \-\> Nurse nhận task chuẩn bị phòng  
    
  \-\> Room AVAILABLE \-\> OCCUPIED  
    
  \-\> Doctor start examination  
    
  \-\> Sau khám/điều trị: Room CLEANING  
    
  \-\> Room AVAILABLE  
    
  Validation:  
    
- Không check-in lịch đã cancelled/no-show/completed.  
- Nếu walk-in, lễ tân tạo appointment tại quầy trước rồi check-in.  
- Queue phải gắn clinic/room/service/priority.  
- Room state cần ít nhất `AVAILABLE`, `OCCUPIED`, `CLEANING`, `MAINTENANCE`.

  ### 5.4 Flow khám của Doctor

  Doctor login  
    
  \-\> Xem worklist ca CHECKED\_IN/WAITING của chính mình  
    
  \-\> Start examination  
    
  \-\> Hệ thống tạo/mở session:  
    
     appointment\_id, patient\_id, doctor\_id, clinic\_id, record\_id  
    
  \-\> Doctor review medical alerts/allergies/current medications  
    
  \-\> Ghi chief complaint, present illness, clinical exam  
    
  \-\> Cập nhật dental chart  
    
  \-\> Ghi diagnosis  
    
  \-\> Tạo diagnostic/clinical orders, upload/link image nếu có  
    
  \-\> Treatment plan/quote/consent  
    
  \-\> Prescription nếu cần  
    
  \-\> Ready to sign checklist  
    
  \-\> Doctor sign/finalize  
    
  \-\> Session SIGNED/COMPLETED, appointment IN\_SERVICE/COMPLETED  
    
  Thiết kế dựa trên:  
    
- PL-01 Điều 7.7: cấm hành nghề không đúng phạm vi hành nghề hoặc không đúng thời gian/địa điểm đã đăng ký.  
- PL-02 và PL-03: cần bám điều kiện hành nghề, phạm vi hành nghề, phân công chuyên môn và quản lý người hành nghề.  
- PL-01 Điều 69: người bệnh ngoại trú vẫn phải được lập/cập nhật hồ sơ bệnh án; hồ sơ phải lưu giữ, giữ bí mật; người bệnh có quyền được đọc/xem/cung cấp tóm tắt theo điều kiện luật định.  
- PL-03 Điều 52: hồ sơ bệnh án phải ghi chính xác, trung thực, đầy đủ, thể hiện thời gian và người ghi.  
- PL-04 Điều 1, 2, 3, 4: EMR cần lập/cập nhật/ký/lưu trữ/quản lý/khai thác bằng phương tiện điện tử, có hạ tầng bảo mật/lưu trữ/backup, có ký hoặc xác nhận điện tử.  
    
  Validation:  
    
- Doctor không được start ca chưa check-in.  
- Doctor không được start ca của bác sĩ khác nếu không có ủy quyền.  
- Không tạo nhiều active session cho cùng appointment.  
- Không sign nếu thiếu clinical note tối thiểu hoặc thiếu diagnosis/reason.  
- Sau sign không update đè; chỉ amendment.

  ### 5.5 Flow treatment plan

  Doctor tạo treatment plan DRAFT  
    
  \-\> Thêm diagnosis/reason, hạng mục, số buổi, chi phí dự kiến  
    
  \-\> Tư vấn rủi ro, lựa chọn thay thế, thời gian điều trị  
    
  \-\> PROPOSED  
    
  \-\> Patient ACCEPTED/PARTIALLY\_ACCEPTED/DECLINED  
    
  \-\> Nếu accepted: tạo treatment sessions/follow-up appointments  
    
  \-\> IN\_PROGRESS  
    
  \-\> COMPLETED/CANCELLED  
    
  Thiết kế dựa trên:  
    
- PL-01 Điều 9: người bệnh có quyền được cung cấp/thông tin giải thích về tình trạng sức khỏe, phương pháp điều trị, dịch vụ và giá dịch vụ.  
- PL-01 Điều 11: người bệnh có quyền lựa chọn phương pháp khám chữa bệnh sau khi được tư vấn.  
- PL-01 Điều 13: người bệnh có quyền từ chối khám chữa bệnh trong phạm vi luật cho phép.  
    
  Validation:  
    
- Treatment plan phải link `session_id` hoặc `record_id`.  
- Phải có estimated cost/quote trước khi bệnh nhân hoặc người đại diện hợp pháp xác nhận.  
- Phải lưu trạng thái consent/decline, timestamp, actor xác nhận.  
- Nếu patient decline, lưu lý do nếu họ cung cấp, không ép bắt buộc lý do nhạy cảm.

  ### 5.6 Flow prescription

  Doctor tạo prescription DRAFT  
    
  \-\> Thêm diagnosis/context  
    
  \-\> Thêm thuốc, hàm lượng, liều, đường dùng, tần suất, số ngày, hướng dẫn  
    
  \-\> Nếu là trẻ nhỏ: ghi tuổi/tháng tuổi, cân nặng nếu cần và thông tin người đại diện/người đưa trẻ theo mẫu áp dụng  
    
  \-\> Review allergy/current meds  
    
  \-\> Doctor ISSUE/SIGN  
    
  \-\> Prescription ISSUED  
    
  \-\> Patient nhận đơn/in/export  
    
  \-\> CANCEL nếu có sai sót trước khi dùng hoặc theo quy trình amendment  
    
  Thiết kế dựa trên:  
    
- PL-06 Điều 1, 2, 3 và các điều về kê đơn ngoại trú: người có thẩm quyền là bác sĩ/y sĩ có giấy phép hành nghề phù hợp; đơn thuốc phải theo mẫu/quy định.  
- PL-01 Điều 69: đơn thuốc là một phần của hồ sơ bệnh án.  
    
  Validation:  
    
- Nurse/receptionist không final prescription.  
- Prescription phải link encounter/record, không chỉ patient-level.  
- Với trẻ nhỏ, prescription cần đủ dữ liệu định danh/tuổi hoặc tháng tuổi/người đại diện theo mẫu đơn thuốc áp dụng; hệ thống không nên chỉ lưu `patient_id` chung chung.  
- Không cho `DISPENSED` là action mặc định của Doctor. Nếu có cấp phát thuốc tại phòng khám, đó là flow vận hành riêng và không nằm trong scope hiện tại.  
- Đơn sau ký không sửa đè; tạo bản hủy/sửa có lý do.

  ### 5.7 Flow ảnh nha khoa, X-quang, file upload

  Upload private file  
    
  \-\> Scan/validate file type/size  
    
  \-\> Link patient \+ record \+ session/order/category  
    
  \-\> Doctor review/annotate  
    
  \-\> Ghi audit view/download/update/archive  
    
  \-\> Archive hoặc export khi có yêu cầu hợp lệ  
    
  Thiết kế dựa trên:  
    
- PL-01 Điều 69.2: hồ sơ bệnh án phải lưu giữ và giữ bí mật.  
- PL-05 Điều 3, 21, 23, 26: dữ liệu sức khỏe là dữ liệu cá nhân nhạy cảm; cần bảo mật, đánh giá tác động khi cần, xử lý vi phạm trong thời hạn luật định, không chia sẻ bên thứ ba nếu không có căn cứ.  
- PL-04 Điều 2: EMR cần hạ tầng lưu trữ, bảo mật, sao lưu, phục hồi, truy xuất.  
    
  Validation:  
    
- Không public URL trực tiếp cho ảnh bệnh nhân.  
- Download/view qua auth hoặc signed URL ngắn hạn.  
- Log đầy đủ: ai xem, lúc nào, mục đích, file nào.  
- Nếu phase sau mở AI image analysis, kết quả chỉ là gợi ý và phải có doctor confirmation.

  ### 5.8 Flow thanh toán, biên lai và đối soát ca

  Appointment/treatment plan có charge item  
    
  \-\> Tạo invoice/payment request  
    
  \-\> Patient thanh toán online/tại quầy  
    
  \-\> Payment PAID/FAILED/PENDING/REFUNDED  
    
  \-\> Receptionist ghi biên lai/receipt  
    
  \-\> Cuối ca Receptionist đối soát tiền mặt/chuyển khoản/online payment  
    
  \-\> Admin/Manager xem báo cáo và xử lý lệch đối soát nếu có  
    
  Thiết kế dựa trên:  
    
- PL-01 Điều 9: người bệnh có quyền được cung cấp thông tin về dịch vụ và giá dịch vụ.  
- PL-01 Điều 18: người bệnh có nghĩa vụ chi trả chi phí khám chữa bệnh theo quy định.  
- PL-07: cần đối chiếu khi triển khai hóa đơn điện tử chính thức.  
    
  Validation:  
    
- Payment không được chặn bác sĩ finalize hồ sơ lâm sàng.  
- Lễ tân là actor chính cho thanh toán tại quầy, biên lai, hoàn tiền theo quyền và đối soát ca.  
- Nên hỗ trợ tối thiểu: unpaid, pending, paid, failed, refunded, receipt number, payment method, shift/reconciliation batch.  
- Refund phải có reason, actor, timestamp, approval nếu vượt ngưỡng.

  ### 5.9 Flow hồ sơ bệnh án, export và audit

  Medical record được tạo khi patient bắt đầu quan hệ khám chữa bệnh  
    
  \-\> Mỗi encounter/session ghi vào record  
    
  \-\> Doctor sign/finalize encounter  
    
  \-\> Record version/amendment nếu sửa sau ký  
    
  \-\> Patient yêu cầu xem/cấp tóm tắt/bản sao  
    
  \-\> Staff có thẩm quyền approve/export  
    
  \-\> Audit mọi view/download/export/amendment  
    
  Thiết kế dựa trên:  
    
- PL-01 Điều 69.1, 69.2, 69.4: lập/cập nhật, lưu giữ, bảo mật hồ sơ; người bệnh được đọc/xem/sao chụp/ghi chép và được cung cấp tóm tắt khi có yêu cầu hợp lệ.  
- PL-01 Điều 7.10: cấm tẩy xóa/sửa chữa hồ sơ bệnh án làm sai lệch thông tin.  
- PL-03 Điều 52: ghi hồ sơ chính xác, trung thực, đầy đủ, rõ thời gian và người ghi.  
    
  Validation:  
    
- Không expose internal note/audit raw cho patient nếu không thuộc phạm vi cung cấp.  
- Export phải có request, approver, reason, scope, generated file, expiry.  
- Audit log không cho sửa/xóa thường quy bởi operator.

  ### 5.10 Flow người bệnh dưới 18 tuổi/người đại diện

  Patient dưới 18 tuổi được tạo hồ sơ/đặt lịch  
    
  \-\> Ghi nhận guardian/representative: họ tên, quan hệ, số điện thoại, giấy tờ nếu phòng khám yêu cầu  
    
  \-\> Reminder gửi cho người đại diện hoặc kênh liên hệ đã xác nhận  
    
  \-\> Receptionist check-in và xác nhận người đưa trẻ  
    
  \-\> Doctor tư vấn treatment plan cho người đại diện  
    
  \-\> Người đại diện ACCEPT/DECLINE/PARTIALLY\_ACCEPT  
    
  \-\> Prescription nếu có phải đủ thông tin trẻ nhỏ theo mẫu áp dụng  
    
  \-\> Payment/receipt đứng theo người thanh toán/người đại diện nếu cần  
    
  \-\> Record export request do người đại diện hợp lệ thực hiện  
    
  Thiết kế dựa trên:  
    
- PL-01 về quyền/nghĩa vụ người bệnh, người đại diện hợp pháp và quyền được cung cấp thông tin, lựa chọn/từ chối phương pháp khám chữa bệnh.  
- PL-05 về dữ liệu cá nhân, dữ liệu sức khỏe và dữ liệu của trẻ em; hệ thống phải xử lý đúng mục đích, tối thiểu và có căn cứ.  
- PL-06 về đơn thuốc ngoại trú, đặc biệt các trường thông tin bổ sung khi kê đơn cho trẻ nhỏ theo mẫu áp dụng.  
    
  Validation:  
    
- Không cho trẻ dưới 18 tuổi tự xác nhận treatment plan nếu chính sách phòng khám yêu cầu người đại diện.  
- Consent/decline phải lưu `confirmed_by`, `relationship_to_patient`, `confirmed_at`.  
- Reminder/record export phải gửi hoặc cấp cho đúng người có quyền.  
- Không dùng một guardian chung cho mọi lần khám nếu không có xác nhận quan hệ hoặc ủy quyền hợp lệ.

  ## 6\. Danh sách use case chính

| UC | Actor chính | Use case | Căn cứ pháp lý cần lưu ý | Validation tối thiểu |
| :---- | :---- | :---- | :---- | :---- |
| UC-01 | Patient/Receptionist | Tạo lịch khám | PL-05 Điều 3/11; PL-01 Điều 9 | Không bắt KYC; thu dữ liệu tối thiểu; kiểm tra slot/bác sĩ/phòng. |
| UC-02 | System | Gửi xác nhận lịch | PL-05 Điều 3 | Nội dung tối thiểu, log delivery, không trộn marketing. |
| UC-03 | System/Receptionist | Nhắc lịch trước giờ khám | PL-05 Điều 3/11/26 | Có preference, delivery log, retry/failure handling. |
| UC-04 | Patient/Receptionist | Đổi lịch/hủy lịch | PL-05 Điều 4 về quyền chủ thể dữ liệu; nguyên tắc minh bạch | Chỉ cho đổi/hủy trong trạng thái hợp lệ, lưu history/reason. |
| UC-05 | Receptionist | Check-in | PL-01 Điều 17 | Xác minh hành chính tối thiểu; không check-in lịch invalid. |
| UC-06 | Receptionist/Nurse | Queue và gán phòng | NĐ 96 về điều kiện hoạt động cơ sở KCB | Phòng/ghế còn khả dụng, state room chính xác. |
| UC-07 | Nurse | Nhập tiền sử/dị ứng/vital/pre-exam | PL-03 Điều 52 | Có người ghi, thời gian ghi; doctor review trước sign. |
| UC-08 | Doctor | Start examination | PL-01 Điều 7.7; PL-02; PL-03 | Doctor đúng phân công, appointment đã check-in, tạo session có appointment\_id/record\_id. |
| UC-09 | Doctor | Ghi khám và dental chart | PL-01 Điều 69; PL-03 Điều 52 | Ghi đầy đủ, chính xác, timestamp, creator; link session. |
| UC-10 | Doctor | Chẩn đoán | PL-01 Điều 7.7; PL-03 | Doctor-only final; link session/record; không dùng AI làm final. |
| UC-11 | Doctor/Nurse | Upload ảnh/file lâm sàng | PL-01 Điều 69.2; PL-05 Điều 26 | Private storage, file validation, audit view/download, link session/record. |
| UC-12 | Doctor | Chỉ định cận lâm sàng | PL-01 Điều 7.7; PL-03 | Có clinical reason, result, reviewed\_by, reviewed\_at. |
| UC-13 | Doctor \+ Patient | Treatment plan và consent | PL-01 Điều 9/11/13 | Quote/risk/alternative/consent/decline, partial accept. |
| UC-14 | Doctor | Kê đơn ngoại trú | PL-06; PL-01 Điều 69 | Doctor sign, đủ thông tin thuốc, link encounter/record. |
| UC-15 | Doctor | Sign/finalize encounter | PL-04 Điều 3; PL-03 Điều 52 | Checklist đủ dữ liệu; sau sign khóa update đè. |
| UC-16 | Doctor/Admin | Amendment/version sau ký | PL-01 Điều 7.10; PL-03 Điều 52 | Bắt buộc reason, tạo version, audit. |
| UC-17 | Receptionist/Patient | Thanh toán, biên lai, đối soát ca | PL-01 Điều 9/18; PL-07 | Không chặn finalize lâm sàng; có receipt, method, actor, refund reason, reconciliation batch. |
| UC-18 | Doctor/Receptionist | Tạo lịch tái khám/recall | PL-01 Điều 9/17; PL-05 | Link treatment plan/session, reminder job, preference. |
| UC-19 | Patient/Admin | Yêu cầu xem/cấp tóm tắt hồ sơ | PL-01 Điều 69.4; PL-05 Điều 4 | Request/approve/export/audit, đúng phạm vi. |
| UC-20 | Admin | RBAC, phân quyền, audit | PL-01 Điều 69.2; PL-05 | Least privilege, audit access, no shared account. |
| UC-21 | Admin/Doctor | Lịch làm việc/nghỉ phép bác sĩ | PL-01 Điều 7.7; PL-02 | Không cho đặt lịch ngoài scope/lịch/ngày nghỉ; duyệt nghỉ bởi manager. |
| UC-22 | Admin/System | Backup/restore/incident | PL-04 Điều 2; PL-05 Điều 23 | Backup định kỳ, restore test, breach notification workflow 72h khi thuộc trường hợp luật định. |
| UC-23 | Receptionist/Patient/Guardian | Người bệnh dưới 18 tuổi và người đại diện | PL-01; PL-05; PL-06 | Lưu guardian/relationship/contact; consent/record request/payment phải gắn người xác nhận hợp lệ. |
| UC-24 | Admin/Receptionist/Doctor | Bảng giá dịch vụ và quote version | PL-01 Điều 9; PL-07 | Quote dùng đúng version giá; payment không lệch quote đã được tư vấn/xác nhận nếu chưa có amendment. |
| UC-25 | Admin/System | Privacy notice, consent/preference thông báo | PL-05 Điều 3/11/26 | Tách nhắc lịch điều trị với marketing; lưu mục đích, kênh, trạng thái đồng ý/từ chối. |

  ## 7\. Benchmark chức năng từ hệ thống nha khoa tại Việt Nam

| Hệ thống | Link | Nhóm chức năng đáng học |
| :---- | :---- | :---- |
| DentalFlow | [https://dentalflow.vn/](https://dentalflow.vn/) | Bệnh án điện tử, lịch hẹn, hóa đơn điện tử, chi nhánh, CSKH đa kênh, báo cáo, phân quyền. Hệ thống có thêm kho/labo nhưng S.M.I.L.E tạm không lấy scope này. |
| SimlyDent | [https://simlydent.vn/ho-so-dien-tu](https://simlydent.vn/ho-so-dien-tu) | EMR theo cấu trúc bệnh án, ký điện tử, backup, in mẫu, CRM/omni chat. Hệ thống có thêm labo/kho nhưng S.M.I.L.E tạm không lấy scope này. |
| MayDental | [https://maydental.vn/](https://maydental.vn/) | Đặt lịch, CSKH SMS/Email, công nợ, thu chi, báo cáo. |
| TDental | [https://tdental.vn/](https://tdental.vn/) | Hồ sơ khách hàng, y bác sĩ, lịch hẹn/tái khám, công nợ, nhiều chi nhánh, công đoạn điều trị. |
| Edental | [https://edental.vn/](https://edental.vn/) | Lịch hẹn online, tự động nhắc lịch, quản lý công nợ, hồ sơ điều trị, SMS marketing, báo cáo. |


  Kết luận benchmark:


- Nhắc lịch/tái khám xuất hiện thường xuyên trong các phần mềm nha khoa Việt Nam, nên đưa vào core.  
- Treatment plan nhiều buổi, công nợ/biên lai/đối soát ca là nghiệp vụ thực tế nên giữ trong scope. Labo và kho/vật tư có thể phổ biến ở sản phẩm lớn, nhưng không thuộc scope hiện tại của S.M.I.L.E.  
- EMR, chữ ký/xác nhận, backup, bảo mật và audit đang trở thành điểm bắt buộc do lộ trình EMR 2025-2026.  
- KYC/AI không phải core phổ biến của phần mềm nha khoa. Nếu dùng, phải có phạm vi rõ.

  ## 8\. Chức năng hiện có trong hệ thống

| Nhóm | Hiện có | Đánh giá |
| :---- | :---- | :---- |
| Auth/User/RBAC | Login/register, user/profile, roles/permissions, protected route frontend, admin users/roles. | Có nền tảng, nhưng frontend middleware đang bypass guard; backend clinical cần enforce role/ownership đồng đều. |
| Appointment | Tạo lịch, availability, book option, book by specialty/doctor, outside hours, confirm, cancel, check-in, status history, by patient/doctor, reminder endpoint. | Khá mạnh cho booking; cần chuẩn hóa state `WAITING/IN_SERVICE/REMINDED`, auto reminder scheduler, queue, ownership theo role. |
| Notification | Có notification service, notification bell, template/preference/delivery log ở IAM. | Có nền, nhưng cần nối event appointment confirmed/reminder/follow-up/no-show và tách service reminder với marketing. |
| Patient | Danh sách, chi tiết, tạo/sửa, medical history, profile. | Có nền; cần patient portal scope rõ và request xem/cấp hồ sơ. |
| Guardian/Representative | Chưa thấy module rõ cho người đại diện hợp pháp/người giám hộ. | Cần nếu hỗ trợ bệnh nhân dưới 18 tuổi: guardian profile, relationship, consent actor, record request actor. |
| Medical record/EMR | Medical records, versions, record exports, treatment history. | Có module nhưng còn CRUD; cần sign/finalize, amendment version tăng đúng, audit view/export. |
| Examination | Examination sessions, symptoms, diagnoses, clinical orders, diagnostic orders, lab results. | Có module nhưng chưa nối chặt appointment \-\> examination; session thiếu `appointment_id`, sign/finalize, ownership. |
| Doctor workspace | Có màn examinations detail với symptoms, treatment plan, prescription, orders. | Giao diện có nhiều mảnh, nhưng đang query nhiều dữ liệu theo patient-level, dễ trộn nhiều lần khám; cần session-centric. |
| Treatment plan | Có treatment plans CRUD/status. | Cần quote, consent, risk disclosure, partial accept/decline, treatment sessions nhiều buổi. |
| Prescription | Có prescriptions và prescription items. | Cần issue/sign/cancel rõ, đủ trường theo TT26/2025, doctor-only final, link encounter/record. |
| Dental images | Có dental images, categories, annotations, PACS sync logs, frontend imaging page. | Frontend/backend endpoint đang lệch `/images` và `/dental-images`; upload/download/analyze chưa khớp core legal storage/audit. |
| Schedule/leave | Có doctor schedules, leaves, work shifts, schedule changes. | Cần tách doctor self-service và admin approval; chặn đặt lịch khi nghỉ/ngoài giờ. |
| Room/facility | Có clinics, treatment rooms. | Cần queue và room lifecycle `AVAILABLE -> OCCUPIED -> CLEANING -> AVAILABLE`. |
| Payment | Có VNPay/mock payment, payment history, refund, payment status appointment. | Phù hợp demo; cần gắn vào workflow lễ tân: thu tiền tại quầy/online, biên lai, refund theo quyền, đối soát ca. |
| Admin/report/audit | Admin dashboard, audit logs, revenue, doctor performance. | Có nền; cần clinical audit chi tiết và kiểm soát quyền xem dữ liệu sức khỏe. |
| KYC | Có nhiều module KYC/OCR/admin KYC. | Tạm ngưng khỏi core flow; không được gate booking/check-in/exam. |
| AI | Có booking chat, chat page, một số endpoint analyze image ở frontend. | Tạm ngưng khỏi core flow; không dùng cho diagnosis/prescription P0/P1. |

  ## 9\. Nếu ghép chức năng hiện có lại, flow đã hoàn chỉnh chưa?

  ### 9.1 Patient flow

| Bước chuẩn | Hiện trạng | Gap |
| :---- | :---- | :---- |
| Đặt lịch theo dịch vụ/bác sĩ/khung giờ | Có availability và booking. | Cần bỏ mọi gate KYC nếu còn tồn tại ở UI/logic; cần form thông tin tối thiểu. |
| Nhận xác nhận và nhắc lịch | Có endpoint confirmation/reminder và notification service. | Chưa thấy scheduler auto T-24h/T-2h; chưa có preference/consent mapping rõ cho reminder vs marketing. |
| Đổi/hủy lịch | Có cancel/reschedule option. | Cần state history nhất quán và rule deadline/cancellation policy. |
| Check-in | Có check-in endpoint. | Patient portal chưa cần tự check-in nếu chưa thiết kế; lễ tân là actor chính. |
| Xem kết quả/đơn/tóm tắt hồ sơ | Có record export module. | Cần workflow request/approve/export theo PL-01 Điều 69.4. |
| Người bệnh dưới 18 tuổi | Chưa thấy guardian/representative flow rõ. | Cần ghi người đại diện khi đặt lịch/check-in/consent/treatment plan/payment/record export. |


  Kết luận: Patient flow có nền đặt lịch/thanh toán, nhưng thiếu reminder tự động, recall, patient record request và phân tách consent thông báo.

  ### 9.2 Receptionist flow

| Bước chuẩn | Hiện trạng | Gap |
| :---- | :---- | :---- |
| Quản lý lịch hôm nay | Có appointments page/detail. | Cần receptionist dashboard theo ngày/clinic, filter status, queue. |
| Check-in | Có endpoint và UI action. | Cần rule chỉ receptionist/authorized staff, room/queue assignment. |
| Walk-in | Có create appointment tại quầy có thể dùng lại. | Cần flow riêng: tạo nhanh patient/appointment \-\> check-in. |
| Nhắc lịch thủ công | Appointment detail có send reminder. | Cần log delivery, template, failure/retry. |
| No-show/reschedule/cancel | Có status/cancel. | Cần policy và trigger follow-up. |
| Thanh toán/hoàn tiền/biên lai | Có payment/refund. | Không cần cashier role riêng; cần receptionist permission, receipt number, payment method, shift reconciliation. |


  Kết luận: Receptionist flow chưa thành một workspace vận hành hoàn chỉnh vì thiếu queue, room assignment, màn thanh toán/biên lai/đối soát ca và recall.

  ### 9.3 Nurse/Dental assistant flow

| Bước chuẩn | Hiện trạng | Gap |
| :---- | :---- | :---- |
| Nhận queue/phòng cần chuẩn bị | Có treatment rooms nhưng chưa rõ queue task. | Cần nurse worklist. |
| Nhập tiền sử/vital/pre-exam | Có medical history/vital trong examination. | Cần phân quyền nurse draft và doctor review. |
| Upload ảnh/hỗ trợ điều trị | Có dental images module. | Endpoint mismatch, storage/audit chưa đủ. |
| Reset phòng/sterilization cơ bản | Chưa thấy module rõ. | Chỉ cần room state và checklist vệ sinh/khử khuẩn cơ bản nếu nhóm muốn thể hiện vận hành; không cần quản lý kho/vật tư. |


  Kết luận: Nurse hiện mới có mảnh dữ liệu, chưa có actor flow độc lập.

  ### 9.4 Doctor flow

| Bước chuẩn | Hiện trạng | Gap |
| :---- | :---- | :---- |
| Worklist ca checked-in của chính doctor | Có appointment by doctor nhưng UI thường load list rộng. | Cần scope theo current doctor, date, status `CHECKED_IN/WAITING`. |
| Start examination từ appointment | Có create examination session. | Session thiếu `appointment_id`, không enforce appointment đã check-in. |
| Ghi khám session-centric | Có examination workspace. | Dữ liệu treatment plan/prescription/order nhiều chỗ query theo patient, dễ trộn encounter. |
| Dental chart | Có backend dental-charts. | Cần đưa vào core workspace và link session/record. |
| Treatment plan | Có CRUD. | Thiếu quote/consent/risk/partial/decline/treatment session. |
| Prescription | Có CRUD/items. | Thiếu sign/issue/cancel, đủ trường TT26, doctor-only final. |
| Sign/finalize encounter | Chưa rõ endpoint/flow. | Gap pháp lý lớn: cần sign, lock, amendment. |
| Follow-up/recall | Có thể tạo appointment mới. | Cần use case rõ sau khám/treatment plan. |


  Kết luận: Doctor có nhiều màn hình/module nhất, nhưng thiếu liên kết nghiệp vụ quan trọng. Đây là role cần ưu tiên hardening trước.

  ### 9.5 Admin/Manager flow

| Bước chuẩn | Hiện trạng | Gap |
| :---- | :---- | :---- |
| Quản lý user/role/permission | Có. | Cần enforce backend clinical và permission matrix theo actor. |
| Cấu hình clinic/room/service/price | Có clinic/room/service. | Cần price/quote version, effective date. |
| Lịch làm việc/nghỉ phép | Có schedule/leave. | Cần tách request của doctor và approval của manager. |
| Audit/report | Có audit/reports. | Cần clinical access audit, export audit, incident workflow. |
| KYC | Có. | Tạm ngưng khỏi core. |


  Kết luận: Admin có nền quản trị, nhưng RBAC/audit phải đi sâu vào dữ liệu lâm sàng thì mới đạt chuẩn.

  ## 10\. Gap quan trọng cần bổ sung

| Priority | Gap | Vì sao quan trọng | Validation |
| :---- | :---- | :---- | :---- |
| P0 | Bắt buộc auth cho toàn bộ medical routes qua gateway/clinical guard | Dữ liệu sức khỏe nhạy cảm, không thể dựa vào UI-only. | Unauthenticated gọi `/patients`, `/medical-records`, `/examination-sessions`, `/dental-images` phải 401\. |
| P0 | Role/ownership backend cho clinical data | Doctor/nurse/receptionist/admin có phạm vi khác nhau. | Doctor A không xem/sửa session Doctor B nếu không có ủy quyền. |
| P0 | `appointment_id` trong examination session | Trace ca khám từ lịch đã check-in. | Không start exam nếu appointment chưa `CHECKED_IN`; không tạo trùng active session. |
| P0 | Doctor worklist scoped | Tránh lộ dữ liệu và sai workflow. | Doctor chỉ thấy ca hôm nay/của mình/được phân công. |
| P0 | Sign/finalize encounter | Yêu cầu EMR và hồ sơ bệnh án. | Sau sign, update clinical note phải bị chặn; amendment tạo version. |
| P0 | Reminder tự động và manual reminder có log | Đặt lịch mà không nhắc lịch là thiếu flow vận hành. | Appointment confirmed tạo reminder job; gửi thành công/thất bại có delivery log. |
| P0 | Bảng giá/quote tối thiểu | Treatment plan và payment cần cùng một nguồn giá để tránh tư vấn một giá, thu một giá. | Quote phải lưu service, price, effective version, created\_by, accepted\_by. |
| P1 | Session-centric workspace | Tránh trộn dữ liệu nhiều lần khám. | Diagnosis/order/prescription/treatment plan query theo session/record. |
| P1 | Treatment plan consent/quote/risk | Phù hợp quyền được tư vấn và lựa chọn của người bệnh. | Không chuyển `IN_PROGRESS` nếu chưa accepted/partial accepted. |
| P1 | Prescription issue/sign/cancel | Phù hợp TT26/2025. | Chỉ doctor ký; đủ trường thuốc; link encounter. |
| P1 | Guardian/representative flow | Nha khoa thường có trẻ em; consent và record request cần actor hợp lệ. | Người bệnh dưới 18 tuổi phải có guardian khi confirm treatment/payment/export. |
| P1 | Dental image private upload/download/audit | Ảnh/X-quang là dữ liệu sức khỏe. | Không public URL; view/download tạo audit. |
| P1 | Record export request | Người bệnh có quyền xem/cấp tóm tắt hồ sơ. | Request/approve/export/audit, scope rõ. |
| P2 | Treatment sessions nhiều buổi | Nha khoa thường điều trị theo plan nhiều lần. | Mỗi buổi link treatment plan item \+ appointment \+ session. |
| P2 | Receipt/e-invoice nâng cao | Cần khi vận hành thật hoặc muốn mô phỏng pháp lý tài chính kỹ hơn. | Charge item \-\> receipt/invoice \-\> payment \-\> reconciliation. |
| Out of scope | Kho/vật tư | Nhóm hiện không làm quản lý kho/vật tư. | Không đưa vào P0/P1/P2 trừ khi đổi scope. |

  ## 11\. Flow mới đề xuất để implement

  ### Phase P0 \- Flow khám ngoại trú tối thiểu nhưng đúng

  1\. Patient hoặc Receptionist tạo appointment


  2\. Hệ thống kiểm tra availability


  3\. Nếu patient dưới 18 tuổi, ghi guardian/representative


  4\. Appointment CONFIRMED


  5\. System tạo reminder jobs


  6\. System gửi reminder T-24h/T-2h, ghi delivery log


  7\. Receptionist check-in


  8\. Appointment CHECKED\_IN/WAITING


  9\. Doctor thấy ca trong worklist của mình


  10\. Doctor start examination


  11\. Hệ thống tạo examination session có appointment\_id \+ record\_id


  12\. Doctor ghi khám, diagnosis, treatment plan/prescription nếu cần


  13\. Treatment plan dùng quote từ bảng giá/version hiện hành


  14\. Doctor sign/finalize encounter


  15\. Receptionist xử lý payment/biên lai nếu có


  16\. Doctor/Reception tạo follow-up/recall


  17\. System gửi reminder tái khám theo lịch


  P0 cần đủ:


- Auth/role/ownership.  
- Appointment state đủ cho check-in và doctor start.  
- Reminder job/log.  
- Examination session link appointment.  
- Sign/finalize và không update đè.  
- Guardian/representative tối thiểu cho người bệnh dưới 18 tuổi.  
- Quote/price version tối thiểu cho treatment plan và payment.  
- Payment cơ bản không chặn clinical finalize.

  ### Phase P1 \- Flow nha khoa vận hành tốt

  Treatment plan nhiều hạng mục  
    
  \-\> Quote/estimated cost  
    
  \-\> Consent/partial accept/decline  
    
  \-\> Treatment sessions nhiều buổi  
    
  \-\> Follow-up appointments  
    
  \-\> Biên lai/payment status/đối soát ca  
    
  \-\> Record export request  
    
  P1 cần đủ:  
    
- Dental chart trong workspace.  
- Prescription chuẩn TT26/2025.  
- Dental image private storage/audit.  
- Record export.  
- Notification preference.  
- Room/queue cơ bản.

  ### Phase P2 \- Flow phòng khám nha khoa hoàn chỉnh

  Room cleaning/sterilization checklist  
    
  \-\> Doctor commission/performance  
    
  \-\> E-invoice/receipt reporting nếu cần  
    
  \-\> Advanced compliance dashboard  
    
  \-\> Optional KYC/AI with legal basis rõ ràng  
    
  P2 mới nên mở lại:  
    
- KYC nếu cần identity proofing/export/portal.  
- AI nếu có consent/legal basis, risk control và doctor confirmation.  
- Blockchain nếu dùng cho integrity proof, không thay thế EMR.

  ## 12\. Validation matrix theo actor

| Actor | Rule cần test | Expected |
| :---- | :---- | :---- |
| Guest/Unauthenticated | Gọi medical routes | 401\. |
| Patient | Xem appointment/record của người khác | 403/404 scoped. |
| Patient | Đặt lịch không KYC | Thành công nếu dữ liệu tối thiểu và slot hợp lệ. |
| Patient dưới 18 tuổi | Confirm treatment plan/export record không có guardian | Bị chặn hoặc yêu cầu bổ sung người đại diện hợp lệ. |
| Receptionist | Check-in appointment hợp lệ | Status `CHECKED_IN`, history ghi actor/time. |
| Receptionist | Ký diagnosis/prescription | Bị chặn. |
| Nurse | Upload ảnh/nhập draft | Thành công nếu được phân quyền và link session/record. |
| Nurse | Final prescription/encounter | Bị chặn. |
| Doctor | Xem worklist của mình | Chỉ thấy ca assigned/authorized. |
| Doctor | Start appointment chưa check-in | Bị chặn. |
| Doctor | Sign encounter thiếu dữ liệu | Bị chặn với checklist lỗi. |
| Doctor | Sửa encounter đã sign | Bị chặn; phải dùng amendment. |
| Admin | Xem audit clinical | Chỉ admin/manager có quyền; mọi access được audit. |
| Admin/Receptionist | Sửa giá dịch vụ sau khi quote đã accepted | Không làm lệch quote đã accepted; nếu cần thì tạo quote/amendment mới. |
| System | Gửi reminder | Tạo delivery log và không gửi marketing nếu chưa consent. |
| Receptionist | Refund/void payment | Cần reason, actor, timestamp; nếu vượt ngưỡng cần approval. |

  ## 13\. Checklist để nhóm review nghiệp vụ

1. Đặt lịch có tạo reminder tự động chưa?  
2. Reminder có tách khỏi marketing chưa?  
3. Appointment có state `CHECKED_IN`, `WAITING`, `IN_SERVICE`, `COMPLETED`, `NO_SHOW` chưa?  
4. Doctor có bắt đầu từ worklist ca đã check-in không?  
5. Examination session có `appointment_id`, `record_id`, `patient_id`, `doctor_id`, `clinic_id` không?  
6. Mọi clinical data có link session/record không?  
7. Dental chart có nằm trong flow khám chính không?  
8. Treatment plan có quote/risk/consent/decline/partial accept không?  
9. Prescription có doctor sign và đủ thông tin theo TT26/2025 không?  
10. Encounter sau ký có bị update đè không?  
11. File ảnh/X-quang có private access và audit không?  
12. Patient có workflow yêu cầu xem/cấp hồ sơ theo PL-01 Điều 69.4 không?  
13. Payment có tách khỏi clinical finalize không?  
14. Doctor/nurse/receptionist/admin có backend permission rõ không?  
15. KYC/AI có đang vô tình chặn core flow không?  
16. Người bệnh dưới 18 tuổi có guardian/representative trong booking, consent, payment và record export không?  
17. Quote/treatment plan có khóa version giá tại thời điểm bệnh nhân/người đại diện xác nhận không?  
18. Prescription cho trẻ nhỏ có đủ thông tin tuổi/tháng tuổi/người đại diện theo mẫu áp dụng không?

    ## 14\. Kết luận

    Hệ thống hiện có nhiều module đúng hướng, đặc biệt là appointment, payment, patient, examination, treatment plan, prescription, dental images, schedule, notification và admin. Tuy nhiên, các module này hiện chưa tạo thành một luồng nghiệp vụ nha khoa hoàn chỉnh vì thiếu các điểm nối cốt lõi:  
      
1. Appointment chưa nối chặt với examination session bằng `appointment_id`.  
2. Doctor workspace chưa hoàn toàn session-centric.  
3. Reminder/recall chưa thành một flow tự động có log/preference rõ.  
4. EMR chưa đủ sign/finalize/amendment/audit.  
5. Treatment plan/prescription/image chưa đủ validation pháp lý.  
6. RBAC/ownership ở backend clinical cần được harden trước khi mở rộng chức năng.  
7. Flow người bệnh dưới 18 tuổi/người đại diện chưa được thể hiện rõ trong code hiện tại.  
8. Quote/bảng giá chưa được khóa version xuyên suốt từ tư vấn đến thanh toán.  
     
   Đường đi hợp lý là implement P0 trước: đặt lịch không KYC, guardian tối thiểu cho người bệnh dưới 18 tuổi, nhắc lịch, check-in, doctor worklist, start examination từ appointment, quote/version giá tối thiểu, sign/finalize, payment/biên lai cơ bản do lễ tân xử lý, đối soát ca và follow-up. Sau khi P0 chạy đúng, P1/P2 mới mở rộng sang treatment nhiều buổi, consent/quote đầy đủ, image storage/audit, record export, receipt/e-invoice nâng cao, rồi mới cân nhắc KYC/AI.  
   

# Flow mermaid

\# S.M.I.L.E \- Mermaid flows only

\#\# 5\. Flow tổng thể chuẩn  
\#\#\# Mermaid \- Flow tổng thể chuẩn

\`\`\`mermaid  
flowchart TD  
   A\["Patient/Receptionist tạo lịch"\]  
   B\["Hệ thống kiểm tra lịch bác sĩ, phòng, dịch vụ, trùng slot"\]  
   C{"Người bệnh dưới 18 tuổi?"}  
   D\["Ghi nhận người đại diện hợp pháp/người giám hộ"\]  
   E\["Appointment SCHEDULED/CONFIRMED"\]  
   F\["Gửi xác nhận và lên lịch reminder"\]  
   G\["Receptionist check-in khi bệnh nhân đến"\]  
   H\["Queue/room assignment"\]  
   I\["Nurse chuẩn bị phòng, nhập dữ liệu tiền khám nếu có"\]  
   J\["Doctor mở worklist và start examination"\]  
   K\["Tạo/mở examination session gắn appointment \+ record"\]  
   L\["Ghi khám, dental chart, diagnosis, orders/images"\]  
   M\["Lập treatment plan \+ quote \+ consent/decline"\]  
   N\["Kê đơn nếu cần"\]  
   O\["Doctor sign/finalize encounter"\]  
   P\["Receptionist thu tiền, ghi biên lai, đối soát ca"\]  
   Q\["Tạo follow-up/recall/tái khám"\]  
   R\["Hồ sơ lưu trữ, audit, export khi có yêu cầu hợp lệ"\]

   A \--\> B \--\> C  
   C \-- Có \--\> D \--\> E  
   C \-- Không \--\> E  
   E \--\> F \--\> G \--\> H \--\> I \--\> J \--\> K \--\> L \--\> M \--\> N \--\> O \--\> P \--\> Q \--\> R  
\`\`\`

\#\# 5.1 State machine Appointment  
\#\#\# Mermaid \- State machine Appointment

\`\`\`mermaid  
stateDiagram-v2  
   \[\*\] \--\> DRAFT  
   DRAFT \--\> REQUESTED  
   REQUESTED \--\> SCHEDULED  
   SCHEDULED \--\> CONFIRMED  
   CONFIRMED \--\> REMINDED  
   REMINDED \--\> CHECKED\_IN  
   CHECKED\_IN \--\> WAITING  
   WAITING \--\> IN\_SERVICE  
   IN\_SERVICE \--\> COMPLETED  
   COMPLETED \--\> \[\*\]

   SCHEDULED \--\> RESCHEDULED  
   CONFIRMED \--\> RESCHEDULED  
   REMINDED \--\> RESCHEDULED

   SCHEDULED \--\> CANCELLED  
   CONFIRMED \--\> CANCELLED  
   REMINDED \--\> CANCELLED

   SCHEDULED \--\> NO\_SHOW  
   CONFIRMED \--\> NO\_SHOW  
   REMINDED \--\> NO\_SHOW  
   CHECKED\_IN \--\> NO\_SHOW  
\`\`\`

\#\# 5.2 Flow nhắc lịch và tái khám  
\#\#\# Mermaid \- Flow nhắc lịch và tái khám

\`\`\`mermaid  
flowchart TD  
   A\["Appointment CONFIRMED"\]  
   B\["Tạo reminder jobs: T-24h, T-2h hoặc cấu hình theo phòng khám"\]  
   C\["Kiểm tra notification preference và kênh hợp lệ"\]  
   D\["Gửi APP/Email/SMS/Zalo nếu được cấu hình"\]  
   E\["Ghi delivery log: pending/sent/failed/read/responded"\]  
   F{"Patient phản hồi?"}  
   G\["Patient xác nhận"\]  
   H\["Patient đổi lịch"\]  
   I\["Patient hủy"\]  
   J\["Receptionist thấy phản hồi trên appointment detail/worklist"\]  
   K{"Quá giờ chưa đến?"}  
   L\["Mark NO\_SHOW"\]  
   M\["Sau khám: Doctor/Reception tạo follow-up/recall"\]  
   N\["Reminder tái khám chạy theo ngày hẹn tiếp theo"\]

   A \--\> B \--\> C \--\> D \--\> E \--\> F  
   F \-- Xác nhận \--\> G \--\> J  
   F \-- Đổi lịch \--\> H \--\> J  
   F \-- Hủy \--\> I \--\> J  
   J \--\> K  
   K \-- Có \--\> L  
   K \-- Không \--\> M \--\> N  
\`\`\`

\#\# 5.3 Flow tiếp đón, queue và phòng  
\#\#\# Mermaid \- Flow tiếp đón, queue và phòng

\`\`\`mermaid  
flowchart TD  
   A\["Receptionist mở lịch hôm nay"\]  
   B\["Xác minh thông tin hành chính tối thiểu"\]  
   C\["Check-in appointment"\]  
   D\["Gán queue number/phòng/ghế nếu có"\]  
   E\["Nurse nhận task chuẩn bị phòng"\]  
   F\["Room AVAILABLE"\]  
   G\["Room OCCUPIED"\]  
   H\["Doctor start examination"\]  
   I\["Sau khám/điều trị"\]  
   J\["Room CLEANING"\]  
   K\["Room AVAILABLE"\]

   A \--\> B \--\> C \--\> D \--\> E \--\> F \--\> G \--\> H \--\> I \--\> J \--\> K  
\`\`\`

\#\# 5.4 Flow khám của Doctor  
\#\#\# Mermaid \- Flow khám của Doctor

\`\`\`mermaid  
flowchart TD  
   A\["Doctor login"\]  
   B\["Xem worklist ca CHECKED\_IN/WAITING của chính mình"\]  
   C\["Start examination"\]  
   D\["Hệ thống tạo/mở session"\]  
   E\["appointment\_id"\]  
   F\["patient\_id"\]  
   G\["doctor\_id"\]  
   H\["clinic\_id"\]  
   I\["record\_id"\]  
   J\["Doctor review medical alerts/allergies/current medications"\]  
   K\["Ghi chief complaint, present illness, clinical exam"\]  
   L\["Cập nhật dental chart"\]  
   M\["Ghi diagnosis"\]  
   N\["Tạo diagnostic/clinical orders, upload/link image nếu có"\]  
   O\["Treatment plan/quote/consent"\]  
   P\["Prescription nếu cần"\]  
   Q\["Ready to sign checklist"\]  
   R\["Doctor sign/finalize"\]  
   S\["Session SIGNED/COMPLETED"\]  
   T\["Appointment IN\_SERVICE/COMPLETED"\]

   A \--\> B \--\> C \--\> D  
   D \--\> E  
   D \--\> F  
   D \--\> G  
   D \--\> H  
   D \--\> I  
   D \--\> J \--\> K \--\> L \--\> M \--\> N \--\> O \--\> P \--\> Q \--\> R \--\> S \--\> T  
\`\`\`

\#\# 5.5 Flow treatment plan  
\#\#\# Mermaid \- Flow treatment plan

\`\`\`mermaid  
flowchart TD  
   A\["Doctor tạo treatment plan DRAFT"\]  
   B\["Thêm diagnosis/reason, hạng mục, số buổi, chi phí dự kiến"\]  
   C\["Tư vấn rủi ro, lựa chọn thay thế, thời gian điều trị"\]  
   D\["PROPOSED"\]  
   E{"Patient phản hồi"}  
   F\["ACCEPTED"\]  
   G\["PARTIALLY\_ACCEPTED"\]  
   H\["DECLINED"\]  
   I\["Tạo treatment sessions/follow-up appointments"\]  
   J\["IN\_PROGRESS"\]  
   K\["COMPLETED"\]  
   L\["CANCELLED"\]

   A \--\> B \--\> C \--\> D \--\> E  
   E \-- Accepted \--\> F \--\> I \--\> J  
   E \-- Partial \--\> G \--\> I \--\> J  
   E \-- Declined \--\> H \--\> L  
   J \--\> K  
   J \--\> L  
\`\`\`

\#\# 5.6 Flow prescription  
\#\#\# Mermaid \- Flow prescription

\`\`\`mermaid  
flowchart TD  
   A\["Doctor tạo prescription DRAFT"\]  
   B\["Thêm diagnosis/context"\]  
   C\["Thêm thuốc, hàm lượng, liều, đường dùng, tần suất, số ngày, hướng dẫn"\]  
   D{"Là trẻ nhỏ?"}  
   E\["Ghi tuổi/tháng tuổi, cân nặng nếu cần và thông tin người đại diện/người đưa trẻ"\]  
   F\["Review allergy/current meds"\]  
   G\["Doctor ISSUE/SIGN"\]  
   H\["Prescription ISSUED"\]  
   I\["Patient nhận đơn/in/export"\]  
   J{"Có sai sót?"}  
   K\["CANCEL theo quy trình amendment"\]  
   L\["Kết thúc"\]

   A \--\> B \--\> C \--\> D  
   D \-- Có \--\> E \--\> F  
   D \-- Không \--\> F  
   F \--\> G \--\> H \--\> I \--\> J  
   J \-- Có \--\> K \--\> L  
   J \-- Không \--\> L  
\`\`\`

\#\# 5.7 Flow ảnh nha khoa, X-quang, file upload  
\#\#\# Mermaid \- Flow ảnh nha khoa, X-quang, file upload

\`\`\`mermaid  
flowchart TD  
   A\["Upload private file"\]  
   B\["Scan/validate file type/size"\]  
   C\["Link patient \+ record \+ session/order/category"\]  
   D\["Doctor review/annotate"\]  
   E\["Ghi audit view/download/update/archive"\]  
   F\["Archive hoặc export khi có yêu cầu hợp lệ"\]

   A \--\> B \--\> C \--\> D \--\> E \--\> F  
\`\`\`

\#\# 5.8 Flow thanh toán, biên lai và đối soát ca  
\#\#\# Mermaid \- Flow thanh toán, biên lai và đối soát ca

\`\`\`mermaid  
flowchart TD  
   A\["Appointment/treatment plan có charge item"\]  
   B\["Tạo invoice/payment request"\]  
   C\["Patient thanh toán online/tại quầy"\]  
   D{"Payment status"}  
   E\["PAID"\]  
   F\["FAILED"\]  
   G\["PENDING"\]  
   H\["REFUNDED"\]  
   I\["Receptionist ghi biên lai/receipt"\]  
   J\["Cuối ca Receptionist đối soát tiền mặt/chuyển khoản/online payment"\]  
   K\["Admin/Manager xem báo cáo"\]  
   L{"Có lệch đối soát?"}  
   M\["Xử lý lệch đối soát nếu có"\]  
   N\["Kết thúc"\]

   A \--\> B \--\> C \--\> D  
   D \-- PAID \--\> E \--\> I  
   D \-- FAILED \--\> F \--\> N  
   D \-- PENDING \--\> G \--\> N  
   D \-- REFUNDED \--\> H \--\> I  
   I \--\> J \--\> K \--\> L  
   L \-- Có \--\> M \--\> N  
   L \-- Không \--\> N  
\`\`\`

\#\# 5.9 Flow hồ sơ bệnh án, export và audit  
\#\#\# Mermaid \- Flow hồ sơ bệnh án, export và audit

\`\`\`mermaid  
flowchart TD  
   A\["Medical record được tạo khi patient bắt đầu quan hệ khám chữa bệnh"\]  
   B\["Mỗi encounter/session ghi vào record"\]  
   C\["Doctor sign/finalize encounter"\]  
   D{"Sửa sau ký?"}  
   E\["Record version/amendment nếu sửa sau ký"\]  
   F\["Patient yêu cầu xem/cấp tóm tắt/bản sao"\]  
   G\["Staff có thẩm quyền approve/export"\]  
   H\["Audit mọi view/download/export/amendment"\]

   A \--\> B \--\> C \--\> D  
   D \-- Có \--\> E \--\> H  
   D \-- Không \--\> F  
   F \--\> G \--\> H  
\`\`\`

\#\# 5.10 Flow người bệnh dưới 18 tuổi/người đại diện  
\#\#\# Mermaid \- Flow người bệnh dưới 18 tuổi/người đại diện

\`\`\`mermaid  
flowchart TD  
   A\["Patient dưới 18 tuổi được tạo hồ sơ/đặt lịch"\]  
   B\["Ghi nhận guardian/representative: họ tên, quan hệ, số điện thoại, giấy tờ nếu phòng khám yêu cầu"\]  
   C\["Reminder gửi cho người đại diện hoặc kênh liên hệ đã xác nhận"\]  
   D\["Receptionist check-in và xác nhận người đưa trẻ"\]  
   E\["Doctor tư vấn treatment plan cho người đại diện"\]  
   F{"Người đại diện phản hồi"}  
   G\["ACCEPT"\]  
   H\["DECLINE"\]  
   I\["PARTIALLY\_ACCEPT"\]  
   J\["Prescription nếu có phải đủ thông tin trẻ nhỏ theo mẫu áp dụng"\]  
   K\["Payment/receipt đứng theo người thanh toán/người đại diện nếu cần"\]  
   L\["Record export request do người đại diện hợp lệ thực hiện"\]

   A \--\> B \--\> C \--\> D \--\> E \--\> F  
   F \-- Accept \--\> G \--\> J  
   F \-- Decline \--\> H \--\> K  
   F \-- Partial \--\> I \--\> J  
   J \--\> K \--\> L  
\`\`\`

\#\# 9.1 Patient flow  
\#\#\# Mermaid \- Patient flow đề xuất

\`\`\`mermaid  
flowchart TD  
   A\["Patient đặt lịch"\]  
   B\["Nhận xác nhận và nhắc lịch"\]  
   C\["Đổi lịch/hủy lịch nếu cần"\]  
   D\["Check-in"\]  
   E\["Khám/điều trị"\]  
   F\["Thanh toán"\]  
   G\["Tái khám/recall"\]  
   H\["Yêu cầu xem/cấp hồ sơ nếu cần"\]  
   I{"Người bệnh dưới 18 tuổi?"}  
   J\["Thao tác qua guardian/representative"\]

   A \--\> I  
   I \-- Có \--\> J \--\> B  
   I \-- Không \--\> B  
   B \--\> C \--\> D \--\> E \--\> F \--\> G \--\> H  
\`\`\`

\#\# 9.2 Receptionist flow  
\#\#\# Mermaid \- Receptionist flow đề xuất

\`\`\`mermaid  
flowchart TD  
   A\["Receptionist quản lý lịch hôm nay"\]  
   B{"Walk-in?"}  
   C\["Tạo nhanh patient/appointment tại quầy"\]  
   D\["Check-in appointment"\]  
   E\["Gán queue/phòng"\]  
   F\["Nhắc lịch thủ công nếu cần"\]  
   G\["Xử lý no-show/reschedule/cancel"\]  
   H\["Thanh toán/hoàn tiền/biên lai"\]  
   I\["Đối soát ca"\]

   A \--\> B  
   B \-- Có \--\> C \--\> D  
   B \-- Không \--\> D  
   D \--\> E \--\> F \--\> G \--\> H \--\> I  
\`\`\`

\#\# 9.3 Nurse/Dental assistant flow  
\#\#\# Mermaid \- Nurse/Dental assistant flow đề xuất

\`\`\`mermaid  
flowchart TD  
   A\["Nurse/Dental assistant nhận queue/phòng cần chuẩn bị"\]  
   B\["Nhập tiền sử/vital/pre-exam"\]  
   C\["Upload ảnh/hỗ trợ điều trị"\]  
   D\["Doctor review dữ liệu draft"\]  
   E\["Reset phòng/sterilization cơ bản"\]  
   F\["Room AVAILABLE"\]

   A \--\> B \--\> C \--\> D \--\> E \--\> F  
\`\`\`

\#\# 9.4 Doctor flow  
\#\#\# Mermaid \- Doctor flow đề xuất

\`\`\`mermaid  
flowchart TD  
   A\["Doctor xem worklist ca checked-in của chính mình"\]  
   B\["Start examination từ appointment"\]  
   C\["Ghi khám session-centric"\]  
   D\["Cập nhật dental chart"\]  
   E\["Tạo treatment plan"\]  
   F\["Kê prescription nếu cần"\]  
   G\["Sign/finalize encounter"\]  
   H\["Tạo follow-up/recall"\]

   A \--\> B \--\> C \--\> D \--\> E \--\> F \--\> G \--\> H  
\`\`\`

\#\# 9.5 Admin/Manager flow  
\#\#\# Mermaid \- Admin/Manager flow đề xuất

\`\`\`mermaid  
flowchart TD  
   A\["Admin/Manager quản lý user/role/permission"\]  
   B\["Cấu hình clinic/room/service/price"\]  
   C\["Quản lý lịch làm việc/nghỉ phép"\]  
   D\["Duyệt leave request nếu cần"\]  
   E\["Theo dõi audit/report"\]  
   F\["Incident/backup/export governance"\]

   A \--\> B \--\> C \--\> D \--\> E \--\> F  
\`\`\`

\#\# Phase P0 \- Flow khám ngoại trú tối thiểu nhưng đúng  
\#\#\# Mermaid \- Phase P0

\`\`\`mermaid  
flowchart TD  
   A\["Patient hoặc Receptionist tạo appointment"\]  
   B\["Hệ thống kiểm tra availability"\]  
   C{"Patient dưới 18 tuổi?"}  
   D\["Ghi guardian/representative"\]  
   E\["Appointment CONFIRMED"\]  
   F\["System tạo reminder jobs"\]  
   G\["System gửi reminder T-24h/T-2h, ghi delivery log"\]  
   H\["Receptionist check-in"\]  
   I\["Appointment CHECKED\_IN/WAITING"\]  
   J\["Doctor thấy ca trong worklist của mình"\]  
   K\["Doctor start examination"\]  
   L\["Hệ thống tạo examination session có appointment\_id \+ record\_id"\]  
   M\["Doctor ghi khám, diagnosis, treatment plan/prescription nếu cần"\]  
   N\["Treatment plan dùng quote từ bảng giá/version hiện hành"\]  
   O\["Doctor sign/finalize encounter"\]  
   P\["Receptionist xử lý payment/biên lai nếu có"\]  
   Q\["Doctor/Reception tạo follow-up/recall"\]  
   R\["System gửi reminder tái khám theo lịch"\]

   A \--\> B \--\> C  
   C \-- Có \--\> D \--\> E  
   C \-- Không \--\> E  
   E \--\> F \--\> G \--\> H \--\> I \--\> J \--\> K \--\> L \--\> M \--\> N \--\> O \--\> P \--\> Q \--\> R  
\`\`\`

\#\# Phase P1 \- Flow nha khoa vận hành tốt  
\#\#\# Mermaid \- Phase P1

\`\`\`mermaid  
flowchart TD  
   A\["Treatment plan nhiều hạng mục"\]  
   B\["Quote/estimated cost"\]  
   C\["Consent/partial accept/decline"\]  
   D\["Treatment sessions nhiều buổi"\]  
   E\["Follow-up appointments"\]  
   F\["Biên lai/payment status/đối soát ca"\]  
   G\["Record export request"\]

   A \--\> B \--\> C \--\> D \--\> E \--\> F \--\> G  
\`\`\`

\#\# Phase P2 \- Flow phòng khám nha khoa hoàn chỉnh  
\#\#\# Mermaid \- Phase P2

\`\`\`mermaid  
flowchart TD  
   A\["Room cleaning/sterilization checklist"\]  
   B\["Doctor commission/performance"\]  
   C\["E-invoice/receipt reporting nếu cần"\]  
   D\["Advanced compliance dashboard"\]  
   E\["Optional KYC/AI with legal basis rõ ràng"\]

   A \--\> B \--\> C \--\> D \--\> E  
\`\`\`

