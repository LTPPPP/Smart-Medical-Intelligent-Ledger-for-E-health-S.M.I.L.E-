# Giải thích kích thước trường dữ liệu (Data Field Sizes)

Tài liệu này giải thích **vì sao** mỗi cột trong database SMILE được đặt kích thước như hiện tại (ví dụ tại sao `gender` là `VARCHAR(10)`, tiền là `NUMERIC(12,2)`...). Áp dụng cho các schema trong `database/**/schema.sql` và các migration TypeORM tương ứng.

---

## 0. Nguyên tắc quan trọng nhất về `VARCHAR(n)` trong PostgreSQL

Trước khi đọc bảng bên dưới, cần hiểu điều then chốt:

> Trong PostgreSQL, `VARCHAR(n)` **KHÔNG** cấp phát trước `n` byte. Nó lưu đúng bằng độ dài chuỗi thực tế (giống hệt `TEXT`), cộng thêm 1 phép **kiểm tra ràng buộc độ dài** khi ghi. Không có khác biệt hiệu năng hay dung lượng giữa `VARCHAR(50)` và `VARCHAR(500)` cho cùng một chuỗi.

Vì vậy con số `n` ở đây **không phải để tiết kiệm ổ đĩa** — nó là một **guardrail nghiệp vụ (business validation)**:

1. **Chặn rác / tấn công** — không cho ai nhét 10MB vào ô "tên".
2. **Diễn đạt ý nghĩa** — `n` cho lập trình viên biết trường này kỳ vọng dữ liệu dạng gì (mã ngắn vs đoạn văn).
3. **Đồng bộ với validation ở tầng ứng dụng** (DTO / class-validator) và UI (`maxLength`).
4. Khi thực sự cần chuỗi dài / không giới hạn → dùng thẳng `TEXT` (xem mục 6).

Do đó việc chọn `n` = "khoảng thực tế tối đa hợp lý **cộng biên an toàn**", không phải tính toán byte chi ly.

---

## 1. Enum ngắn / trạng thái — `VARCHAR(10)` và `VARCHAR(20)`

Đây là các trường chỉ nhận một tập giá trị cố định, viết dạng chữ.

| Cột | Kiểu | Giá trị thực tế | Vì sao kích thước này |
|-----|------|-----------------|------------------------|
| `gender` | `VARCHAR(10)` | `MALE` (4), `FEMALE` (6), `OTHER` (5) | Giá trị dài nhất là `FEMALE` = 6 ký tự. Chọn **10** để vừa khít + còn biên cho khả năng đổi cách viết (vd `UNKNOWN` = 7) mà không cần migration. Không cần lớn hơn vì đây là enum đóng. |
| `blood_type` | `VARCHAR(10)` | `AB+`, `O-`, `A+`... | Nhóm máu tối đa 3 ký tự (`AB+`). Để 10 cho an toàn (vd `AB+ (rare)` hay ghi chú hệ Rh). |
| `status` (nhiều bảng) | `VARCHAR(20)` | `ACTIVE`, `SUSPENDED`, `in_progress`, `cancelled` | Trạng thái dài nhất ~ `SUSPENDED`/`in_progress` (11). Chọn **20** làm chuẩn chung cho mọi cột status để đồng nhất và dư chỗ cho trạng thái mới. |
| `action` (permissions) | `VARCHAR(20)` | `create`, `read`, `update`, `delete`, `manage` | Động từ CRUD, dài nhất 6 ký tự. 20 là dư dả. |
| `otp_type`, `priority`, `urgency`, `severity`, `channel` | `VARCHAR(20)` | `login`, `routine`, `APP`, `SMS`... | Cùng nhóm enum ngắn → theo chuẩn 20. |
| `currency` (payment/service) | `VARCHAR(3)` hoặc `VARCHAR(10)` | `VND`, `USD` | Chuẩn **ISO 4217 = đúng 3 ký tự** → `VARCHAR(3)` là chính xác nhất (dùng ở `treatment_plans.quote_currency`). Chỗ để `VARCHAR(10)` (`services.currency`) là nới lỏng hơn — **nên chuẩn hoá về (3)** để nhất quán. |

**Điểm mấu chốt Gender = 10:** giá trị dài nhất chỉ 6 ký tự, nhưng đặt 10 để có biên an toàn nhỏ mà vẫn báo rõ "đây là mã ngắn, không phải văn bản tự do". Không đặt (6) sát nút để tránh phải migration nếu sau này thêm giá trị.

---

## 2. Mã định danh nghiệp vụ (business codes) — `VARCHAR(50)` / `VARCHAR(100)`

Các mã do hệ thống hoặc nghiệp vụ sinh ra, có tiền tố + số.

| Cột | Kiểu | Vì sao |
|-----|------|--------|
| `patient_code`, `appointment_code`, `clinic_code`, `service_code`, `order_code`, `specialty_code` | `VARCHAR(50)` | Dạng `APPT-20260724-0001` / `PT-000123`. Thực tế < 25 ký tự; **50** dư gấp đôi cho tiền tố dài + timestamp + sequence. |
| `username` | `VARCHAR(50)` | Tên đăng nhập, giới hạn UX phổ biến 30–50. Đủ dài, đủ chặn spam. |
| `role_name` | `VARCHAR(50)` | `RECEPTIONIST` (12) là dài nhất. 50 dư cho role mới. |
| `permission_name` | `VARCHAR(100)` | Dạng `medical_record.update` / `appointment.cancel` — ghép resource + action nên dài hơn mã thường → 100. |
| `insurance_number`, `id_number`, `license_number`, `certification_number` | `VARCHAR(100)` | Số giấy tờ pháp lý / bảo hiểm có định dạng đa dạng theo quốc gia → nới rộng 100. |
| `template_code`, `gateway_name` | `VARCHAR(100)` | `APPOINTMENT_REMINDER`, tên cổng `SendGrid`/`Firebase` → 100 an toàn. |

---

## 3. Tên người & địa chỉ hành chính — `VARCHAR(100)` / `VARCHAR(255)`

| Cột | Kiểu | Vì sao |
|-----|------|--------|
| `full_name`, `clinic_name`, `service_name`, `specialty_name`, `medication_name`, `diagnosis_name` | `VARCHAR(255)` | **255** là "số magic" kinh điển: trước Postgres 9.1 nó là ngưỡng lưu 1 byte length header. Ngày nay chỉ còn là quy ước phổ biến cho "chuỗi tên tự do nhưng có giới hạn". Tên người/tổ chức tiếng Việt có dấu vẫn thoải mái. |
| `ward`, `district`, `city`, `relationship`, `body_location` | `VARCHAR(100)` | Tên đơn vị hành chính / quan hệ ("Phường Bến Nghé", "con ruột") — 100 quá đủ. |
| `email` | `VARCHAR(255)` | **RFC 5321** giới hạn địa chỉ email tối đa 254 ký tự → 255 là chuẩn đúng. |

---

## 4. Số điện thoại & mạng — `VARCHAR(20)` / `VARCHAR(45)`

| Cột | Kiểu | Vì sao |
|-----|------|--------|
| `phone`, `emergency_phone` | `VARCHAR(20)` | Số E.164 tối đa 15 chữ số + tiền tố `+` + có thể dấu cách/`-`. **20** phủ hết mọi định dạng quốc tế. |
| `ip_address` | `VARCHAR(45)` | **45** = độ dài tối đa của một địa chỉ **IPv6** ở dạng IPv4-mapped (`0000:0000:...:255.255.255.255` = 45 ký tự). Đây là con số chuẩn để lưu IP dạng text. |
| `otp_code` | `VARCHAR(10)` | Mã OTP 4–8 chữ số → 10 dư. |

---

## 5. Tiền tệ & số đo — `NUMERIC(p,s)`

Tiền **không bao giờ** dùng `FLOAT/DOUBLE` (sai số nhị phân) → luôn `NUMERIC(precision, scale)`.

| Cột | Kiểu | Vì sao |
|-----|------|--------|
| `amount`, `refund_amount` (payment) | `NUMERIC(12,2)` | `precision=12, scale=2` → tối đa **9.999.999.999,99** (10 chữ số phần nguyên). Đủ cho hoá đơn nha khoa tính bằng VND (hàng chục–trăm triệu, có biên tới chục tỷ). `scale=2` cho 2 số thập phân. *Lưu ý:* VND thực tế không có phần lẻ, nhưng để (12,2) cho linh hoạt đa tiền tệ (USD có cent). Cổng VNPay nhân ×100 khi gửi. |
| `estimated_cost` (treatment_plan) | `NUMERIC(12,2)` | Báo giá cả liệu trình → dùng precision lớn giống payment. |
| `base_price`, `custom_price`, `cost` (từng dịch vụ/thủ thuật) | `NUMERIC(10,2)` | Giá **một** dịch vụ nhỏ hơn tổng hoá đơn → `precision=10` (tối đa ~99.999.999,99) là đủ, tiết kiệm hơn (12,2). |

Quy tắc: `precision` = tổng số chữ số; `scale` = số chữ số sau dấu phẩy. `NUMERIC(12,2)` ⇒ 10 chữ số nguyên + 2 chữ số lẻ.

---

## 6. Khi nào dùng `TEXT` thay vì `VARCHAR(n)`

Dùng `TEXT` cho nội dung dài / không đoán trước được độ dài — không đặt giới hạn vô nghĩa:

| Cột | Vì sao TEXT |
|-----|-------------|
| `address` | Địa chỉ đầy đủ có thể rất dài, nhiều dòng. |
| `notes`, `description`, `reason`, `chief_complaint`, `diagnosis`, `treatment_plan`, `present_illness`, `physical_examination` | Ghi chú lâm sàng / mô tả tự do — bác sĩ nhập bao nhiêu tuỳ ý. |
| `access_token`, `refresh_token`, `logo_url`, `image_url`, `file_url`, `thumbnail_url` | Token/URL độ dài biến thiên lớn (URL có query, presigned link rất dài). |
| `allergies`, `chronic_diseases`, `tags` | `TEXT[]` — mảng nhiều phần tử, mỗi phần tử tự do. |

Nguyên tắc: **có ngưỡng nghiệp vụ rõ ràng → `VARCHAR(n)`; nội dung mở → `TEXT`.**

---

## 7. Các kiểu cố định khác

| Cột | Kiểu | Vì sao |
|-----|------|--------|
| `*_id` khoá chính/ngoại | `UUID` | Chống đoán ID, an toàn khi sinh phân tán giữa các microservice (không cần khoá tăng dần tập trung). Cross-service không đặt FK cứng. |
| `date_of_birth`, ngày làm việc | `DATE` | Chỉ cần ngày, không giờ. |
| `created_at`, `updated_at` | `TIMESTAMP` | Mốc thời gian đầy đủ, mặc định `CURRENT_TIMESTAMP`. |
| `is_primary`, `email_verified`, `phone_verified` | `BOOLEAN` | Cờ nhị phân. |
| `retry_count`, `max_retries` | `INT` | Bộ đếm nhỏ, `INT` (2 tỷ) là quá đủ, không cần `BIGINT`. |
| `timestamp` (typeorm_metadata) | `BIGINT` | Epoch milliseconds (13 chữ số) vượt tầm `INT` → phải `BIGINT`. |
| `record_hash`, `token_hash`, `blockchain_hash`, `pacs_id`, `provider_user_id` | `VARCHAR(255)` | Hash/định danh ngoài có độ dài cố định-ish (SHA-256 hex = 64) nhưng để 255 dự phòng thuật toán khác. |
| `icd_code` | `VARCHAR(20)` | Mã **ICD-10/11** dài nhất ~7–8 ký tự (`S52.501A`) → 20 dư an toàn. |
| `tooth_number` | `VARCHAR(10)` | Ký hiệu răng FDI (2 chữ số) hoặc phạm vi → 10 đủ. |
| `file_format`, `view_angle` | `VARCHAR(10)`/`(50)` | `JPEG`, `DICOM`, góc chụp `panoramic` → mã ngắn. |
| `method` (idempotency) | `VARCHAR(10)` | HTTP verb: `DELETE` (6) dài nhất → 10. |
| `path` (idempotency) | `VARCHAR(512)` | Đường dẫn URL API có thể dài (nhiều segment + id) → 512. |

---

## 8. Tóm tắt "công thức" chọn size

| Loại dữ liệu | Kích thước chuẩn dùng trong SMILE |
|--------------|-----------------------------------|
| Enum/trạng thái rất ngắn | `VARCHAR(10)` (gender, blood_type, otp_code, tooth_number) |
| Enum/trạng thái thường | `VARCHAR(20)` (status, channel, severity, action) |
| Mã nghiệp vụ | `VARCHAR(50)` |
| Mã ghép / số giấy tờ | `VARCHAR(100)` |
| Số điện thoại | `VARCHAR(20)` |
| IP | `VARCHAR(45)` |
| Email | `VARCHAR(255)` (RFC 5321) |
| Tên người / tổ chức | `VARCHAR(255)` |
| Tiền — tổng hoá đơn | `NUMERIC(12,2)` |
| Tiền — đơn giá | `NUMERIC(10,2)` |
| Tiền tệ (ISO) | `VARCHAR(3)` |
| Văn bản tự do / URL / token | `TEXT` |
| ID | `UUID` |

> Nhắc lại: với PostgreSQL, các con số này là **ràng buộc hợp lệ dữ liệu**, không phải tối ưu dung lượng. Mục tiêu là "đủ rộng để không chặn dữ liệu thật, đủ hẹp để chặn rác", và **nhất quán** giữa các bảng.

---

## 9. Điểm chưa nhất quán nên rà lại (ghi chú)

- `currency`: chỗ `VARCHAR(3)` (đúng ISO 4217), chỗ `VARCHAR(10)` — nên chuẩn hoá về `(3)`.
- `name VARCHAR` (không có `n`, bảng `migrations` của TypeORM) — do TypeORM tự sinh, bỏ qua.
- `accounts.role` là `VARCHAR(20)` (migration) — đã bổ sung `CHECK` constraint để chỉ nhận đúng 6 giá trị RoleEnum.

---

# PHẦN B — Liệt kê ĐẦY ĐỦ mọi bảng & cột

Dưới đây là toàn bộ 58 bảng trong 5 database, liệt kê **mọi cột** kèm kiểu và lý do.

## Quy ước dùng chung (không lặp lại ở từng bảng)

Các cột "boilerplate" xuất hiện ở hầu hết bảng, lý do cố định:

| Cột | Kiểu | Lý do |
|-----|------|-------|
| `*_id` (PK) | `UUID` | Khoá chính, chống đoán, sinh phân tán giữa microservice. |
| `*_id` (FK / tham chiếu) | `UUID` | Tham chiếu bảng khác. Cross-service **không** đặt FK cứng. |
| `created_at`, `updated_at` | `TIMESTAMP` | Audit mốc tạo/sửa, mặc định `CURRENT_TIMESTAMP`. |
| `created_by`, `updated_by`, `approved_by`, `changed_by`, `*_by` | `UUID` | Tham chiếu người thực hiện (user/account id). |
| `is_*`, `has_*`, `*_verified`, `enabled` | `BOOLEAN` | Cờ nhị phân. |
| `*_at` (khác) | `TIMESTAMP` | Mốc thời gian sự kiện. |
| `*_date` | `DATE` | Chỉ ngày, không giờ. |
| `metadata`, `*_values`, `snapshot`, `vital_signs`, `operating_hours`, `equipment_list`, `details`, `*_payload`, `surfaces`, `annotation_data` | `JSONB` | Dữ liệu bán cấu trúc, truy vấn được. |
| `*_count`, `*_number`, `*_order`, `duration_*`, `quantity`, `floor_number`, `max_*`, `file_size_kb` | `INTEGER` | Số đếm nhỏ (< 2 tỷ). |
| `allergies`, `chronic_diseases`, `tags`, `tooth_numbers`, `teeth_numbers` | `TEXT[]` / `INTEGER[]` | Mảng nhiều phần tử. |

Bên dưới chỉ ghi rõ **cột có kích thước** (`VARCHAR/NUMERIC/TEXT`) và các cột đặc biệt; cột boilerplate ghi ngắn.

---

## DB 1 — `auth_service_db` (iam-service / auth)

### accounts
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| account_id | UUID PK | — |
| username | VARCHAR(50) | Tên đăng nhập, chuẩn UX 30–50. |
| email | VARCHAR(255) | RFC 5321 (≤254). |
| phone | VARCHAR(20) | E.164 (≤15 số) + tiền tố/định dạng. |
| password_hash | VARCHAR(255) | bcrypt hash 60 ký tự; 255 dự phòng thuật toán khác. |
| status | VARCHAR(20) | Enum: ACTIVE/LOCKED/SUSPENDED. Chuẩn 20. |
| failed_login_attempts | INTEGER | Bộ đếm. |
| locked_at, last_login_at, created_at, updated_at | TIMESTAMP | Audit. |
| locked_reason | TEXT | Lý do tự do. |
| locked_by, created_by, updated_by | UUID | Tham chiếu. |
| email_verified, phone_verified | BOOLEAN | Cờ. |

### oauth_connections
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| connection_id, account_id | UUID | — |
| provider | VARCHAR(50) | google/facebook/apple — tên provider ngắn. |
| provider_user_id | VARCHAR(255) | ID bên thứ 3, độ dài đa dạng → 255. |
| access_token, refresh_token | TEXT | Token dài, biến thiên. |
| token_expires_at, created_at, updated_at | TIMESTAMP | — |
| is_active | BOOLEAN | Cờ. |

### refresh_tokens
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| token_id, account_id | UUID | — |
| token_hash | VARCHAR(255) | Hash token, 255 dự phòng. |
| expires_at, revoked_at, created_at | TIMESTAMP | — |
| device_info | TEXT | User-agent/thiết bị dài. |
| ip_address | VARCHAR(45) | Max IPv6. |

### otp_tokens
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| otp_id, account_id | UUID | — |
| otp_code | VARCHAR(10) | Mã 4–8 số → 10. |
| otp_type | VARCHAR(20) | Enum: login/password_reset/identity_verify. |
| expires_at, used_at, created_at, updated_at | TIMESTAMP | — |

---

## DB 2 — `account_service_db` (iam-service / user)

### users
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| user_id | UUID PK | Trùng account_id bên auth. |
| full_name | VARCHAR(255) | Tên người (có dấu). |
| email | VARCHAR(255) | RFC 5321 (denormalized). |
| phone | VARCHAR(20) | E.164 (denormalized). |
| gender | **VARCHAR(10)** | Enum MALE/FEMALE/OTHER (dài nhất 6) + biên. |
| date_of_birth | DATE | — |
| avatar_url, ban_reason | TEXT | URL / lý do tự do. |
| is_banned | BOOLEAN | Cờ. |
| banned_at | TIMESTAMPTZ | Có timezone (khác các cột TIMESTAMP thường). |

### roles
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| role_id | UUID PK | — |
| role_name | VARCHAR(50) | ADMIN/…/MANAGER, dài nhất RECEPTIONIST(12). |
| description | TEXT | Mô tả tự do. |

### permissions
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| permission_id | UUID PK | — |
| permission_name | VARCHAR(100) | resource.action ghép → 100. |
| resource | VARCHAR(50) | appointment/medical_record… |
| action | VARCHAR(20) | create/read/update/delete/manage. |
| description | TEXT | — |

### role_permissions
| Cột | Kiểu | Lý do |
|-----|------|-------|
| id, role_id, permission_id, assigned_by | UUID | Bảng nối. |
| assigned_at | TIMESTAMP | — |

### user_roles
| Cột | Kiểu | Lý do |
|-----|------|-------|
| id, user_id, role_id, assigned_by | UUID | Bảng nối. |
| assigned_at | TIMESTAMP | — |

### digital_signatures
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| signature_id, user_id | UUID | — |
| signature_data | TEXT | Ảnh chữ ký base64 (rất dài). |
| certificate_url | TEXT | URL. |
| status | VARCHAR(20) | ACTIVE/EXPIRED/REVOKED. |
| expires_at, created_at, updated_at | TIMESTAMP | — |

### phone_verifications
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| verification_id, user_id | UUID | — |
| phone | VARCHAR(20) | E.164. |
| is_verified | BOOLEAN | Cờ. |
| verified_at, created_at | TIMESTAMP | — |

### kyc_verifications
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| kyc_id, user_id, verified_by | UUID | — |
| id_type | VARCHAR(50) | passport/national_id/driver_license. |
| id_number | VARCHAR(100) | Số giấy tờ đa quốc gia → 100. |
| id_front_image, id_back_image, selfie_image | TEXT | URL/base64 ảnh. |
| verification_status | VARCHAR(20) | pending/approved/rejected. |
| blockchain_hash | VARCHAR(255) | Hash on-chain, 255 dự phòng. |
| notes, admin_notes | TEXT | Ghi chú tự do. |
| verified_at, created_at, updated_at | TIMESTAMP | — |

### audit_logs
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| log_id, user_id, resource_id | UUID | — |
| action | VARCHAR(100) | Tên hành động (có thể ghép). |
| resource | VARCHAR(100) | Tên tài nguyên. |
| ip_address | VARCHAR(45) | Max IPv6. |
| user_agent | TEXT | Chuỗi UA dài. |
| details | JSONB | Payload chi tiết. |
| created_at | TIMESTAMP | — |

### notification_templates
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| template_id | UUID PK | — |
| template_code | VARCHAR(100) | APPOINTMENT_REMINDER… mã ghép. |
| name | VARCHAR(255) | Tên template. |
| description, subject_template, body_template | TEXT | Nội dung template (Handlebars). |
| channel | VARCHAR(20) | SMS/EMAIL/PUSH/APP. |
| is_active | BOOLEAN | Cờ. |

### notification_preferences
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| preference_id, user_id | UUID | — |
| notification_type | VARCHAR(50) | PROMO/APPOINTMENT/SYSTEM. |
| channel | VARCHAR(20) | SMS/EMAIL/PUSH/APP. |
| is_enabled | BOOLEAN | Cờ. |

### notifications
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| notification_id, recipient_id, template_id, related_entity_id | UUID | — |
| notification_type | VARCHAR(50) | Loại thông báo. |
| channel | VARCHAR(20) | SMS/EMAIL/PUSH/APP. |
| subject | VARCHAR(255) | Tiêu đề. |
| message, error_message | TEXT | Nội dung/ lỗi dài. |
| related_entity_type | VARCHAR(50) | appointment/payment… |
| status | VARCHAR(20) | pending/sent/failed/read/cancelled. |
| retry_count, max_retries | INT | Bộ đếm retry. |
| scheduled_at, sent_at, read_at, next_retry_at | TIMESTAMP | — |

### notification_delivery_logs
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| log_id, notification_id | UUID | — |
| gateway_name | VARCHAR(100) | Twilio/SendGrid/Firebase. |
| gateway_response_id | VARCHAR(255) | ID phản hồi cổng, đa dạng → 255. |
| status | VARCHAR(20) | success/failed. |
| error_payload | JSONB | — |

---

## DB 3 — `core_clinic_service_db` (clinical-emr / clinic)

> Có `ENUM clinic_room_type` = examination/surgery/imaging (dùng cho `room_type`, `required_room_type`) — kiểu enum PG, không cần size.

### clinics
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| clinic_id | UUID PK | — |
| clinic_name | VARCHAR(255) | Tên phòng khám. |
| clinic_code | VARCHAR(50) | Mã. |
| address | TEXT | Địa chỉ dài. |
| ward, district, city | VARCHAR(100) | Đơn vị hành chính. |
| phone | VARCHAR(20) | E.164. |
| email | VARCHAR(255) | RFC 5321. |
| website | VARCHAR(255) | URL ngắn. |
| logo_url | TEXT | URL. |
| operating_hours | JSONB | Giờ mở cửa cấu trúc. |
| status | VARCHAR(20) | ACTIVE… |
| license_number | VARCHAR(100) | Số giấy phép. |
| license_expiry | DATE | — |

### treatment_rooms
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| room_id, clinic_id | UUID | — |
| room_name | VARCHAR(100) | Tên phòng. |
| room_code | VARCHAR(50) | Mã phòng. |
| room_type | clinic_room_type | ENUM. |
| floor_number | INTEGER | — |
| equipment_list | JSONB | — |
| status | VARCHAR(20) | AVAILABLE… |

### specialties
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| specialty_id | UUID PK | — |
| specialty_name | VARCHAR(255) | Tên chuyên khoa. |
| specialty_code | VARCHAR(50) | Mã. |
| description, icon_url | TEXT | — |
| is_active | BOOLEAN | — |
| display_order | INTEGER | — |

### doctor_specialties
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| doctor_id, specialty_id | UUID (PK ghép) | — |
| certification_number | VARCHAR(100) | Số chứng chỉ. |
| certified_date | DATE | — |
| is_primary | BOOLEAN | — |

### work_shifts
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| shift_id | UUID PK | — |
| shift_name | VARCHAR(100) | Tên ca (Sáng/Chiều…). |
| start_time, end_time | TIME | Giờ trong ngày. |
| description | TEXT | — |

### service_categories
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| category_id, parent_category_id | UUID | Tự tham chiếu (cây). |
| category_name | VARCHAR(255) | Tên nhóm dịch vụ. |
| description | TEXT | — |
| is_active | BOOLEAN | — |
| display_order | INTEGER | — |

### services
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| service_id, category_id, specialty_id | UUID | — |
| service_code | VARCHAR(50) | Mã dịch vụ. |
| service_name | VARCHAR(255) | Tên dịch vụ. |
| description, preparation_instructions | TEXT | — |
| duration_minutes | INTEGER | Thời lượng. |
| base_price | NUMERIC(10,2) | Đơn giá dịch vụ. |
| currency | VARCHAR(10) | *Nên chuẩn hoá về (3) ISO.* |
| is_active, requires_appointment | BOOLEAN | — |
| required_room_type | clinic_room_type | ENUM. |

### clinic_services
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| clinic_service_id, clinic_id, service_id | UUID | — |
| custom_price | NUMERIC(10,2) | Giá tuỳ chỉnh theo clinic. |
| is_available | BOOLEAN | — |

### doctor_schedules
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| schedule_id, doctor_id, clinic_id, shift_id, room_id | UUID | — |
| work_date | DATE | — |
| max_patients | INTEGER | Giới hạn bệnh nhân/ca. |
| status | VARCHAR(20) | scheduled… |
| notes | TEXT | — |

### doctor_leaves
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| leave_id, doctor_id, approved_by | UUID | — |
| leave_type | VARCHAR(50) | Loại nghỉ. |
| start_date, end_date | DATE | — |
| reason | TEXT | — |
| status | VARCHAR(20) | pending… |

### schedule_changes
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| change_id, schedule_id, changed_by, approved_by | UUID | — |
| change_type | VARCHAR(50) | Loại thay đổi. |
| old_values, new_values | JSONB | Diff. |
| reason | TEXT | — |
| approval_status | VARCHAR(20) | pending… |

### appointments
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| appointment_id, patient_id, doctor_id, clinic_id, room_id, service_id, cancelled_by, approved_by, payment_id, created_by, session_id, treatment_plan_id | UUID | — |
| appointment_code | VARCHAR(50) | Mã lịch hẹn. |
| appointment_date | DATE / appointment_time TIME | — |
| duration_minutes | INTEGER | — |
| appointment_type | VARCHAR(50) | Loại khám. |
| status | VARCHAR(20) | scheduled/confirmed/checked_in/in_progress… |
| chief_complaint, notes, cancellation_reason, outside_hours_reason | TEXT | Tự do. |
| is_outside_hours | BOOLEAN | — |
| payment_status | VARCHAR(20) | unpaid… |
| occupied_during | TSRANGE (generated) | Khoảng thời gian chống trùng lịch (EXCLUDE gist). |
| cancelled_at | TIMESTAMP | — |

### appointment_status_history
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| history_id, appointment_id, changed_by | UUID | — |
| old_status, new_status | VARCHAR(20) | Trạng thái. |
| reason | TEXT | — |

### appointment_reminder_preferences
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| preference_id, patient_id | UUID | — |
| channel | VARCHAR(20) | APP mặc định. |
| enabled | BOOLEAN | — |
| reminder_minutes_before | INTEGER | Phút trước hẹn (mặc định 1440 = 1 ngày). |

### appointment_notification_logs
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| log_id, appointment_id | UUID | — |
| notification_type | VARCHAR(50) | — |
| channel | VARCHAR(20) | — |
| status | VARCHAR(20) | — |
| attempt_count | INTEGER | — |
| notification_id | VARCHAR(100) | ID thông báo ngoài. |
| preference_enabled | BOOLEAN | — |
| reminder_minutes_before | INTEGER | — |
| error_message | TEXT | — |
| last_attempt_at, next_retry_at, read_at, responded_at | TIMESTAMP | — |

### diagnostic_orders
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| order_id, appointment_id, patient_id, doctor_id | UUID | — |
| order_code | VARCHAR(50) | Mã chỉ định. |
| order_type | VARCHAR(50) | Loại. |
| description, result_summary, result_attachment_url, notes | TEXT | — |
| priority | VARCHAR(20) | routine… |
| tooth_number | VARCHAR(10) | Ký hiệu răng FDI. |
| area | VARCHAR(100) | Vùng. |
| status | VARCHAR(20) | ordered… |
| ordered_at, completed_at | TIMESTAMP | — |

### migrations (TypeORM)
| Cột | Kiểu | Lý do |
|-----|------|-------|
| id | SERIAL | Auto. |
| timestamp | BIGINT | Epoch ms (13 số) → vượt INT. |
| name | VARCHAR (no n) | TypeORM tự sinh. |

### idempotency_keys
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| idempotency_key | VARCHAR(255) PK | Khoá idempotency (UUID/hash). |
| method | VARCHAR(10) | HTTP verb (DELETE=6). |
| path | VARCHAR(512) | URL API nhiều segment → 512. |
| status | VARCHAR(20) | in_progress… |
| response_status | INTEGER | HTTP code. |
| response_body | JSONB | — |
| created_at, expires_at | TIMESTAMP | — |

---

## DB 4 — `core_medical_service_db` (clinical-emr / medical)

### patients
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| patient_id, user_id | UUID | — |
| patient_code | VARCHAR(50) | Mã bệnh nhân. |
| full_name | VARCHAR(255) | Tên. |
| gender | **VARCHAR(10)** | Enum giới tính + biên. |
| date_of_birth | DATE | — |
| phone, emergency_phone | VARCHAR(20) | E.164. |
| email | VARCHAR(255) | RFC 5321. |
| address | TEXT | — |
| ward, district, city | VARCHAR(100) | Hành chính. |
| emergency_contact | VARCHAR(255) | Tên người liên hệ khẩn. |
| blood_type | VARCHAR(10) | AB+ … (≤3) + biên. |
| allergies, chronic_diseases | TEXT[] | Mảng. |
| insurance_number | VARCHAR(100) | Số BHYT. |
| insurance_provider | VARCHAR(255) | Tên đơn vị BH. |

### patient_representatives
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| representative_id, patient_id, verified_by | UUID | — |
| full_name | VARCHAR(255) | Tên người đại diện. |
| relationship | VARCHAR(100) | Quan hệ (con/vợ…). |
| phone | VARCHAR(20) | E.164. |
| email | VARCHAR(255) | RFC 5321. |
| legal_document_type | VARCHAR(50) | Loại giấy tờ. |
| legal_document_number | VARCHAR(100) | Số giấy tờ. |
| is_primary, is_active, authorized_for_treatment/payment/records | BOOLEAN | Cờ uỷ quyền. |
| verified_at | TIMESTAMP | — |

### medical_history
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| history_id, patient_id | UUID | — |
| condition_name | VARCHAR(255) | Tên bệnh nền. |
| condition_type | VARCHAR(50) | Loại. |
| diagnosed_date | DATE | — |
| treatment, notes | TEXT | — |

### medical_records
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| record_id, patient_id, appointment_id, clinic_id, doctor_id, finalized_by | UUID | — |
| visit_date | DATE | — |
| chief_complaint, diagnosis, treatment_plan, notes | TEXT | Lâm sàng tự do. |
| record_status | VARCHAR(20) | draft… |
| record_hash | VARCHAR(255) | Hash toàn vẹn hồ sơ (SHA-256=64) + dự phòng. |
| finalized_at | TIMESTAMP | — |

### medical_record_versions
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| version_id, record_id, changed_by | UUID | — |
| version_number | INTEGER | Số phiên bản. |
| snapshot | JSONB | Bản chụp hồ sơ. |
| change_reason | TEXT | — |

### record_exports
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| export_id, patient_id, record_id, exported_by | UUID | — |
| export_type | VARCHAR(50) | Loại export. |
| export_format | VARCHAR(20) | PDF/JSON… |
| file_url | TEXT | URL file. |
| expires_at | TIMESTAMP | — |

### examination_sessions
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| session_id, appointment_id, record_id, patient_id, doctor_id, clinic_id, signed_by | UUID | — |
| session_date, started_at, completed_at, signed_at | TIMESTAMP | — |
| chief_complaint, present_illness, physical_examination | TEXT | Lâm sàng. |
| vital_signs | JSONB | Sinh hiệu. |
| status | VARCHAR(20) | in_progress… |

### examination_session_amendments
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| amendment_id, session_id, record_id, patient_id, doctor_id, amended_by | UUID | — |
| amendment_reason, amendment_text | TEXT | Nội dung bổ chính. |

### symptoms
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| symptom_id, session_id, patient_id, recorded_by | UUID | — |
| symptom_name | VARCHAR(255) | Tên triệu chứng. |
| body_location | VARCHAR(100) | Vị trí cơ thể. |
| severity | VARCHAR(20) | mild/moderate/severe. |
| onset_date | DATE | — |
| duration | VARCHAR(100) | Mô tả thời lượng ("3 ngày"). |
| description | TEXT | — |

### diagnoses
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| diagnosis_id, session_id | UUID | — |
| icd_code | VARCHAR(20) | Mã ICD-10/11 (≤8). |
| diagnosis_name | VARCHAR(255) | Tên chẩn đoán. |
| diagnosis_type | VARCHAR(50) | primary/secondary… |
| severity | VARCHAR(20) | — |
| notes | TEXT | — |

### dental_charts
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| chart_id, patient_id, record_id | UUID | — |
| tooth_number | INTEGER | Số răng (ở bảng này là INT, khác `diagnostic_orders.tooth_number` VARCHAR). |
| tooth_status | VARCHAR(50) | Tình trạng răng. |
| surfaces | JSONB | Mặt răng. |
| notes | TEXT | — |

### image_categories
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| category_id | UUID PK | — |
| category_name | VARCHAR(100) | Tên nhóm ảnh. |
| description | TEXT | — |

### dental_images
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| image_id, patient_id, record_id, category_id, taken_by, uploaded_by | UUID | — |
| image_type | VARCHAR(50) | X-ray/photo… |
| image_url, thumbnail_url, description | TEXT | URL/mô tả. |
| file_size_kb | INTEGER | Dung lượng KB. |
| file_format | VARCHAR(10) | JPEG/DICOM. |
| tooth_numbers | INTEGER[] | Mảng số răng. |
| view_angle | VARCHAR(50) | Góc chụp. |
| tags | TEXT[] | — |
| metadata | JSONB | — |
| pacs_id | VARCHAR(255) | ID hệ PACS. |
| taken_date | DATE | — |
| is_archived | BOOLEAN | — |

### image_annotations
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| annotation_id, image_id, annotated_by | UUID | — |
| annotation_type | VARCHAR(50) | Loại chú thích. |
| annotation_data | JSONB | Toạ độ/hình. |
| note | TEXT | — |

### pacs_sync_logs
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| sync_id, image_id | UUID | — |
| sync_type | VARCHAR(50) | push/pull. |
| pacs_server | VARCHAR(255) | Host PACS. |
| status | VARCHAR(20) | — |
| error_message | TEXT | — |
| synced_at | TIMESTAMP | — |

### clinical_orders
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| order_id, session_id, record_id, patient_id, ordered_by | UUID | — |
| order_type | VARCHAR(50) | Loại y lệnh. |
| test_type | VARCHAR(100) | Loại xét nghiệm. |
| clinical_indication, result_url, report | TEXT | — |
| teeth_numbers | INTEGER[] | Mảng răng. |
| urgency | VARCHAR(20) | routine… |
| status | VARCHAR(20) | ordered… |
| ordered_date, scheduled_date, completed_date | TIMESTAMP | — |

### lab_test_results
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| result_id, order_id | UUID | — |
| test_name | VARCHAR(255) | Tên xét nghiệm. |
| result_value | TEXT | Kết quả (có thể dài/đa dòng). |
| result_unit | VARCHAR(50) | Đơn vị (mg/dL…). |
| reference_range | VARCHAR(100) | Khoảng tham chiếu. |
| is_abnormal | BOOLEAN | — |
| notes | TEXT | — |

### treatment_plans
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| plan_id, session_id, patient_id, record_id, sent_to, accepted_by, declined_by, created_by, accepted_representative_id | UUID | — |
| plan_name | VARCHAR(255) | Tên kế hoạch. |
| objectives, decline_reason, risk_disclosure, alternative_options, accepted_scope_note | TEXT | Tự do. |
| duration_weeks | INTEGER | Số tuần. |
| status | VARCHAR(20) | draft… |
| estimated_cost | NUMERIC(12,2) | Báo giá cả liệu trình (precision lớn). |
| quote_currency | VARCHAR(3) | ISO 4217 (chuẩn đúng). |
| sent_via | VARCHAR(20) | email/sms… |
| quote_version | VARCHAR(100) | Phiên bản báo giá. |
| acceptance_scope | VARCHAR(20) | full/partial. |
| accepted_representative_name | VARCHAR(255) | Tên người đại diện ký. |
| accepted_representative_relationship | VARCHAR(100) | Quan hệ. |
| accepted_representative_phone | VARCHAR(20) | E.164. |
| sent_at, confirmed_at, proposed_at, accepted_at, declined_at | TIMESTAMP | — |

### treatment_history
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| treatment_id, record_id, patient_id, performed_by | UUID | — |
| treatment_date | DATE | — |
| tooth_numbers | INTEGER[] | — |
| procedure_code | VARCHAR(50) | Mã thủ thuật. |
| procedure_name | VARCHAR(255) | Tên thủ thuật. |
| description | TEXT | — |
| cost | NUMERIC(10,2) | Chi phí một thủ thuật (đơn giá). |
| status | VARCHAR(20) | completed… |

### prescriptions
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| prescription_id, session_id, record_id, patient_id, doctor_id, digital_signature_id, issued_by, representative_id_snapshot | UUID | — |
| prescription_date | DATE | — |
| status | VARCHAR(20) | draft… |
| notes, cancellation_reason | TEXT | — |
| minor_patient_at_issue | BOOLEAN | Cờ bệnh nhân vị thành niên. |
| patient_age_years_at_issue, patient_age_months_at_issue | INTEGER | Tuổi tại thời điểm kê. |
| representative_name_snapshot | VARCHAR(255) | Snapshot tên đại diện. |
| representative_phone_snapshot | VARCHAR(20) | E.164. |
| representative_relationship_snapshot | VARCHAR(100) | Quan hệ. |
| issued_at, cancelled_at | TIMESTAMP | — |

### prescription_items
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| item_id, prescription_id | UUID | — |
| medication_name | VARCHAR(255) | Tên thuốc. |
| medication_code | VARCHAR(50) | Mã thuốc. |
| dosage | VARCHAR(100) | Liều ("500mg"). |
| route | VARCHAR(50) | Đường dùng (uống/tiêm). |
| frequency | VARCHAR(100) | Tần suất ("2 lần/ngày"). |
| duration_days, quantity | INTEGER | — |
| instructions | TEXT | Hướng dẫn. |

---

## DB 5 — `payment_service_db` (payment-service)

### payments
| Cột | Kiểu | Lý do size |
|-----|------|-----------|
| payment_id, appointment_id | UUID | — |
| amount | NUMERIC(12,2) | Số tiền thanh toán (tổng, precision lớn). |
| currency | VARCHAR(10) | Mặc định VND. *Nên chuẩn hoá (3).* |
| status | VARCHAR(20) | pending… |
| provider | VARCHAR(30) | Cổng TT (vnpay). 30 vừa đủ tên cổng. |
| provider_txn_ref | VARCHAR(100) | Mã giao dịch cổng. |
| order_info | TEXT | Mô tả đơn. |
| refund_amount | NUMERIC(12,2) | Số tiền hoàn. |
| refunded_at, created_at, updated_at | TIMESTAMP | — |

---

## Ghi chú khác biệt cần lưu ý (rà lại)

- `tooth_number` **không nhất quán kiểu**: `dental_charts.tooth_number` là `INTEGER`, còn `diagnostic_orders.tooth_number` là `VARCHAR(10)`.
- `currency`: `treatment_plans.quote_currency` = `VARCHAR(3)` (đúng ISO), nhưng `services.currency` và `payments.currency` = `VARCHAR(10)`.
- `banned_at` là `TIMESTAMPTZ` (có timezone) trong khi đa số cột thời gian khác là `TIMESTAMP` (không timezone).
- Cột `provider` ở payments dùng `VARCHAR(30)` — hẹp hơn chuẩn enum (20/50) của các service khác.

---

## 10. Các cột đã thêm CHECK constraint (tối ưu bằng toàn vẹn dữ liệu)

> Nhắc lại: thu nhỏ `VARCHAR(n)` KHÔNG tiết kiệm byte trong PostgreSQL. "Tối ưu" cho cột tập giá trị đóng = **CHECK constraint** (chỉ nhận giá trị hợp lệ). Độ dài `VARCHAR` giữ nguyên (đổi length ép rewrite bảng, vô ích). Giá trị được chuẩn hoá UPPERCASE cả ở data cũ (migration) lẫn input mới (DTO `@Transform` + `@IsIn`).

| Cột (bảng) | Constraint | Giá trị cho phép |
|---|---|---|
| `accounts.role` | `chk_accounts_role` | 6 RoleEnum |
| `users.gender`, `patients.gender` | `chk_*_gender` | MALE, FEMALE, OTHER |
| `patients.blood_type` | `chk_patients_blood_type` | A+, A-, B+, B-, AB+, AB-, O+, O- |
| `services.currency`, `payments.currency`, `treatment_plans.quote_currency` | `chk_*_currency` | VND, USD, EUR, JPY |
| `notifications/notification_preferences/notification_templates.channel`, `appointment_notification_logs.channel`, `appointment_reminder_preferences.channel` | `chk_*_channel` | SMS, EMAIL, PUSH, APP |

Migration: `AddEnumCheckConstraints` trong mỗi datasource (iam-user, emr-medical, emr-clinic, payment). Enum TS dùng lại: `clinical-emr-service/src/utils/enums/{gender,blood-type,currency,notification-channel}.enum.ts` và `iam-service/.../notifications/domain/notification-template.ts` (NotificationChannel).

*Chưa áp CHECK* cho các cột status/priority/urgency/severity (tập giá trị lớn, hay đổi — cân nhắc sau).
*Phantom* `accounts.gender`: entity map nhưng DB không có cột → không constraint được, cần rà migration riêng.
