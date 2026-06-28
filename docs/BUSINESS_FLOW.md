# S.M.I.L.E — Luồng Nghiệp Vụ

> Hệ thống quản lý phòng khám nha khoa thông minh — Smart Medical Intelligent Ledger for E-health

---

## Mục tiêu dự án

Số hóa toàn bộ quy trình vận hành phòng khám nha khoa: từ đăng ký tài khoản, đặt lịch khám, khám bệnh, chẩn đoán, điều trị, đến thanh toán — kết hợp AI hỗ trợ đặt lịch và OCR xác minh danh tính.

---

## Vai trò người dùng

| Vai trò | Mô tả |
|---------|-------|
| **Patient** | Bệnh nhân — đặt lịch, xem hồ sơ, thanh toán |
| **Doctor/Dentist** | Bác sĩ — khám, chẩn đoán, kê đơn, lập kế hoạch điều trị |
| **Receptionist** | Lễ tân — tiếp nhận, check-in, quản lý lịch hẹn |
| **Nurse** | Y tá — hỗ trợ bác sĩ |
| **Admin** | Quản trị — quản lý người dùng, phòng khám, báo cáo |

---

## Luồng chính (Main Flow)

```
Đăng ký ──▶ Xác minh KYC ──▶ Đặt lịch ──▶ Check-in ──▶ Khám bệnh ──▶ Thanh toán
```

### 1. Đăng ký & Đăng nhập
- Đăng ký bằng email/username hoặc Google OAuth
- Xác nhận email (OTP)
- Đăng nhập → nhận JWT token

### 2. Xác minh danh tính (KYC)
- Upload CCCD/CMND (mặt trước + mặt sau) + ảnh selfie
- AI OCR tự động trích xuất & xác minh
- Trạng thái: `NOT_SUBMITTED → PENDING_REVIEW → VERIFIED / REJECTED`
- Bắt buộc trước khi đặt lịch

### 3. Đặt lịch khám (Booking)
- Chatbot AI (LangGraph) hỗ trợ đặt lịch qua hội thoại
- Hoặc đặt thủ công: chọn phòng khám → bác sĩ → dịch vụ → ngày giờ
- Kiểm tra slot trống, lịch nghỉ bác sĩ, giờ làm việc
- Thanh toán online (VNPay) khi đặt lịch

### 4. Check-in tại phòng khám
- Lễ tân xác nhận bệnh nhân đến
- Gán phòng khám (treatment room)

### 5. Khám bệnh (Examination)
- Bác sĩ tạo phiên khám (examination session)
- Ghi nhận: triệu chứng, khám lâm sàng, sinh hiệu
- Chẩn đoán (ICD code), sơ đồ răng (dental chart)
- Chỉ định cận lâm sàng (X-Ray, CBCT, xét nghiệm)
- Chụp/upload hình ảnh nha khoa

### 6. Kê đơn & Kế hoạch điều trị
- Kê đơn thuốc → gửi bệnh nhân
- Lập kế hoạch điều trị dài hạn

### 7. Thanh toán
- Tạo phiếu thanh toán (VNPay)
- Trạng thái: `pending → paid / failed / refunded`

### 8. Hoàn tất
- Finalize hồ sơ bệnh án
- Lưu hash lên blockchain (tính toàn vẹn)

---

## Luồng trạng thái lịch hẹn

```
SCHEDULED ──▶ CONFIRMED ──▶ CHECKED_IN ──▶ IN_PROGRESS ──▶ COMPLETED
    │              │              │              │
    ▼              ▼              ▼              ▼
CANCELLED      CANCELLED      CANCELLED      CANCELLED
    │
    ▼
 NO_SHOW
```

---

## Luồng phụ (Sub Flows)

### A. Luồng khám bệnh chi tiết

```
Tạo phiên khám
  ├── Ghi triệu chứng (chief complaint)
  ├── Khám lâm sàng (physical examination)
  ├── Đo sinh hiệu (vital signs)
  ├── Chẩn đoán (diagnosis + ICD code)
  ├── Sơ đồ răng (dental chart — theo từng răng)
  ├── Chỉ định cận lâm sàng ──▶ Luồng B
  ├── Chụp hình nha khoa
  ├── Kê đơn thuốc ──▶ Luồng C
  └── Lập kế hoạch điều trị ──▶ Luồng D
```

### B. Luồng chỉ định cận lâm sàng (Clinical Order)

```
ORDERED ──▶ IN_PROGRESS ──▶ COMPLETED
                              │
                              ▼
                         Kết quả xét nghiệm (lab results)
```

- Loại: X-Ray, CBCT, xét nghiệm máu, xét nghiệm lâm sàng
- Mức độ: routine / urgent / stat

### C. Luồng kê đơn thuốc (Prescription)

```
DRAFT ──▶ ISSUED ──▶ DISPENSED
                        │
                     CANCELLED
```

- Mỗi đơn gồm nhiều dòng thuốc (prescription items)
- Ký số (digital signature)

### D. Luồng kế hoạch điều trị (Treatment Plan)

```
DRAFT ──▶ SENT ──▶ ACCEPTED ──▶ IN_PROGRESS ──▶ COMPLETED
                      │
                   CANCELLED
```

- Gửi cho bệnh nhân duyệt trước khi thực hiện

### E. Luồng KYC (Xác minh danh tính)

```
NOT_SUBMITTED ──▶ PENDING_REVIEW ──▶ VERIFIED
                        │
                     REJECTED
```

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
|--------|-----------|
| **Booking LangGraph** | Chatbot AI hỗ trợ đặt lịch hẹn qua hội thoại tự nhiên |
| **KYC OCR** | Trích xuất thông tin CCCD/CMND tự động bằng OCR |
