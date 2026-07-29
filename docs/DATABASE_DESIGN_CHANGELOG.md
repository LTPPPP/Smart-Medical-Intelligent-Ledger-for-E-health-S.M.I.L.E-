# Database Design — Changelog (Doc vs Code)

> Kết quả đối chiếu tài liệu Database Design với code thực tế (TypeORM entities + `database/*/schema.sql` + migrations), ngày **2026-07-29**.
> Bản doc đã sửa: [`docs/DATABASE_DESIGN.md`](./DATABASE_DESIGN.md).
>
> Cách dùng: mỗi dòng là 1 thay đổi cần cập nhật vào tài liệu gốc (Word). Tick ✅ vào cột **Đã cập nhật** khi đã sửa xong. Mục "Code drift" cuối file là lỗi trong code, không phải lỗi doc — cần fix code, không sửa doc.

## Trạng thái tổng quan

| Service | Bảng khớp | Bảng lệch | Mức độ |
|---|---|---|---|
| 2.1 Auth | 0/4 | 4/4 | Trung bình |
| 2.2 Account | 5/13 | 8/13 | **Nặng (kyc_verifications)** |
| 2.3 Core Clinic | 4/17 | 13/17 | Nhẹ (chủ yếu độ dài) |
| 2.4 Core Medical | 13/21 | 8/21 | Trung bình |
| 2.5 Payment | 0/1 | 1/1 | Nhẹ |

---

## 2.1 Auth Service (`auth_service_db`)

### accounts

| # | Thay đổi | Doc cũ | Code thực tế | Nguồn | Đã cập nhật |
|---|---|---|---|---|---|
| 1 | Thêm cột `full_name` | — | VARCHAR(255) nullable | `account.entity.ts:31` | ☐ |
| 2 | Thêm cột `gender` | — | SMALLINT nullable (ISO 5218) | `account.entity.ts:34` | ☐ |
| 3 | Thêm cột `role` | — | VARCHAR(12) default `PATIENT` | `account.entity.ts:40-45` | ☐ |
| 4 | `password_hash` | VARCHAR | VARCHAR(60) | `account.entity.ts:37` | ☐ |
| 5 | `username` | VARCHAR | VARCHAR(50) | `schema.sql:8` | ☐ |
| 6 | `phone` | VARCHAR | VARCHAR(20) | `schema.sql:10` | ☐ |
| 7 | `status` | VARCHAR | VARCHAR(11) | `schema.sql:15` | ☐ |

### oauth_connections

| # | Thay đổi | Doc cũ | Code thực tế | Nguồn | Đã cập nhật |
|---|---|---|---|---|---|
| 1 | `provider` | VARCHAR(50) | VARCHAR(8) | `oauth-connection.entity.ts:33` | ☐ |
| 2 | `account_id` | FK (non-null) | FK nullable | `oauth-connection.entity.ts:23` | ☐ |
| 3 | Thêm constraint | — | UNIQUE(provider, provider_user_id) | entity + schema.sql | ☐ |

### otp_tokens

| # | Thay đổi | Doc cũ | Code thực tế | Nguồn | Đã cập nhật |
|---|---|---|---|---|---|
| 1 | `otp_code` | VARCHAR(10) | **CHAR(6)** | `otp-token.entity.ts:33` | ☐ |
| 2 | `otp_type` | VARCHAR(20) | VARCHAR(15) | `otp-token.entity.ts:36-41` | ☐ |
| 3 | `account_id` | FK (non-null) | FK nullable | `otp-token.entity.ts:23` | ☐ |

### refresh_tokens

| # | Thay đổi | Doc cũ | Code thực tế | Nguồn | Đã cập nhật |
|---|---|---|---|---|---|
| 1 | `token_hash` | VARCHAR(255) | **CHAR(64)** | `refresh-token.entity.ts:30` | ☐ |
| 2 | `account_id` | FK (non-null) | FK nullable | `refresh-token.entity.ts:20` | ☐ |

---

## 2.2 Account Service (`account_service_db`)

### users

| # | Thay đổi | Doc cũ | Code thực tế | Nguồn | Đã cập nhật |
|---|---|---|---|---|---|
| 1 | `gender` | VARCHAR(10) | **SMALLINT** (ISO 5218) | `user-profile.entity.ts:31`, migration `1700000007000-GenderToSmallint` | ☐ |

### roles

| # | Thay đổi | Doc cũ | Code thực tế | Nguồn | Đã cập nhật |
|---|---|---|---|---|---|
| 1 | `role_name` | VARCHAR(50) | **VARCHAR(12)** | `role.entity.ts:11`, migration `1700000008000-TightenColumnWidths` | ☐ |

### user_roles / role_permissions

| # | Thay đổi | Doc cũ | Code thực tế | Nguồn | Đã cập nhật |
|---|---|---|---|---|---|
| 1 | user_roles: thêm constraint | — | UNIQUE(user_id, role_id) | `schema.sql:57-64` | ☐ |
| 2 | role_permissions: thêm constraint | — | UNIQUE(role_id, permission_id) | `schema.sql:53` | ☐ |

### kyc_verifications — VIẾT LẠI TOÀN BỘ

| # | Thay đổi | Doc cũ | Code thực tế | Nguồn | Đã cập nhật |
|---|---|---|---|---|---|
| 1 | Xóa cột `blockchain_hash` | VARCHAR(255) | **Không tồn tại trong code** | grep toàn repo: 0 kết quả | ☐ |
| 2 | Thêm cột `document_hash` | — | CHAR(64) nullable | `kyc-verification.entity.ts:92` | ☐ |
| 3 | `verification_status` | VARCHAR(30) | VARCHAR(14) | `kyc-verification.entity.ts:63` | ☐ |
| 4 | Thêm `full_name` | — | VARCHAR(255) nullable | `:45` | ☐ |
| 5 | Thêm `date_of_birth` | — | DATE nullable | `:48` | ☐ |
| 6 | Thêm `ocr_status` | — | VARCHAR(10) default PENDING | `:72` | ☐ |
| 7 | Thêm `ocr_confidence` | — | INT nullable | `:77` | ☐ |
| 8 | Thêm `ocr_payload` | — | JSONB nullable | `:80` | ☐ |
| 9 | Thêm `ocr_attempts` | — | INT default 0 | `:83` | ☐ |
| 10 | Thêm `ocr_last_error` | — | TEXT nullable | `:86` | ☐ |
| 11 | Thêm `ocr_processed_at` | — | TIMESTAMP nullable | `:89` | ☐ |
| 12 | Thêm `rejection_reason` | — | TEXT nullable | `:101` | ☐ |
| 13 | Thêm `submitted_at` | — | TIMESTAMP nullable | `:104` | ☐ |
| 14 | Thêm `decision_source` | — | VARCHAR(6) nullable (AUTO/MANUAL) | `:113` | ☐ |
| 15 | Thêm `decision_reason` | — | TEXT nullable | `:116` | ☐ |
| 16 | Thêm `consent_version` | — | VARCHAR(50) nullable | `:119` | ☐ |
| 17 | Thêm `consent_accepted_at` | — | TIMESTAMP nullable | `:122` | ☐ |
| 18 | Thêm `document_storage_consent_accepted_at` | — | TIMESTAMP nullable | `:125` | ☐ |
| 19 | Thêm `ocr_processing_consent_accepted_at` | — | TIMESTAMP nullable | `:128` | ☐ |
| 20 | Thêm `no_marketing_consent_accepted_at` | — | TIMESTAMP nullable | `:131` | ☐ |
| 21 | Thêm `processing_purpose` | — | VARCHAR(100) default `identity_verification_and_booking_safety` | `:134-139` | ☐ |
| 22 | Thêm `retention_policy_version` | — | VARCHAR(50) nullable | `:142` | ☐ |
| 23 | Thêm `retention_expires_at` | — | TIMESTAMP nullable | `:145` | ☐ |
| 24 | Thêm `deleted_at` | — | TIMESTAMP nullable | `:148` | ☐ |
| 25 | Thêm `created_by` | — | UUID nullable | `:157` | ☐ |

### audit_logs

| # | Thay đổi | Doc cũ | Code thực tế | Nguồn | Đã cập nhật |
|---|---|---|---|---|---|
| 1 | `user_id` | FK (non-null) | UUID nullable | `audit-log.entity.ts:11` | ☐ |

### notification_templates

| # | Thay đổi | Doc cũ | Code thực tế | Nguồn | Đã cập nhật |
|---|---|---|---|---|---|
| 1 | `template_code` | VARCHAR | VARCHAR(100) | `notification-template.entity.ts:14` | ☐ |
| 2 | `name` | VARCHAR | VARCHAR(255) | entity | ☐ |
| 3 | `channel` | VARCHAR | VARCHAR(5) | `:29` | ☐ |

### notifications

| # | Thay đổi | Doc cũ | Code thực tế | Nguồn | Đã cập nhật |
|---|---|---|---|---|---|
| 1 | `related_entity_id` | VARCHAR | **UUID** nullable | `notification.entity.ts:46` | ☐ |
| 2 | `status` | VARCHAR | VARCHAR(9) | `:63` | ☐ |
| 3 | `channel` | VARCHAR | VARCHAR(5) | `:37` | ☐ |
| 4 | `subject` | VARCHAR | VARCHAR(255) | `:40` | ☐ |
| 5 | `notification_type` | VARCHAR | VARCHAR(50) | `:34` | ☐ |
| 6 | `related_entity_type` | VARCHAR | VARCHAR(50) | `:49` | ☐ |

### notification_preferences

| # | Thay đổi | Doc cũ | Code thực tế | Nguồn | Đã cập nhật |
|---|---|---|---|---|---|
| 1 | `user_id` | VARCHAR | **UUID** + FK → users | entity`:14`, migration `1700000006000-AddNotificationUserFks` | ☐ |
| 2 | `notification_type` | VARCHAR | VARCHAR(50) | `:17` | ☐ |
| 3 | `channel` | VARCHAR | VARCHAR(5) | `:20` | ☐ |
| 4 | Thêm constraint | — | UNIQUE(user_id, notification_type, channel) | `schema.sql:166` | ☐ |

### digital_signatures / phone_verifications

| # | Thay đổi | Doc cũ | Code thực tế | Nguồn | Đã cập nhật |
|---|---|---|---|---|---|
| 1 | Thêm ghi chú | (bảng bình thường) | Cột khớp 100% doc, nhưng **không có entity TypeORM** — chỉ tồn tại trong migration + schema.sql | migration `1700000000000-CreateUserServiceTables.ts:78-101` | ☐ |

---

## 2.3 Core Clinic Service (`core_clinic_service_db`)

Pattern chung: doc ghi VARCHAR(20)/(50) generic, code dùng độ dài khít giá trị enum dài nhất (migration TightenColumnWidths).

| # | Bảng | Cột | Doc cũ | Code thực tế | Đã cập nhật |
|---|---|---|---|---|---|
| 1 | clinics | `status` | VARCHAR(20) | VARCHAR(11) | ☐ |
| 2 | treatment_rooms | `room_type` | VARCHAR enum | **PG ENUM `clinic_room_type`** (examination/surgery/imaging) | ☐ |
| 3 | treatment_rooms | `status` | VARCHAR(20) | VARCHAR(11) | ☐ |
| 4 | treatment_rooms | constraint | — | + UNIQUE(clinic_id, room_code) | ☐ |
| 5 | doctor_leaves | `leave_type` | VARCHAR(50) | VARCHAR(9) | ☐ |
| 6 | doctor_leaves | `status` | VARCHAR(20) | VARCHAR(8) | ☐ |
| 7 | doctor_schedules | `status` | VARCHAR(20) | VARCHAR(9) | ☐ |
| 8 | doctor_schedules | `shift_id`, `room_id` | FK | FK nullable | ☐ |
| 9 | doctor_schedules | constraint | — | + UNIQUE(doctor_id, work_date, shift_id) | ☐ |
| 10 | schedule_changes | `change_type` | VARCHAR(50) | VARCHAR(14) | ☐ |
| 11 | schedule_changes | `approval_status` | VARCHAR(20) | VARCHAR(8) | ☐ |
| 12 | services | `required_room_type` | VARCHAR enum | **PG ENUM `clinic_room_type`**, NOT NULL | ☐ |
| 13 | services | `currency` | VARCHAR(10) | **CHAR(3)** | ☐ |
| 14 | clinic_services | constraint | — | + UNIQUE(clinic_id, service_id) | ☐ |
| 15 | appointments | `appointment_type` | VARCHAR(50) | VARCHAR(12) | ☐ |
| 16 | appointments | `status` | VARCHAR(20) | VARCHAR(11) | ☐ |
| 17 | appointments | `payment_status` | VARCHAR(20) | VARCHAR(14) | ☐ |
| 18 | appointments | constraint | — | + 3 EXCLUDE USING GIST trên `occupied_during` (doctor/patient/room, schema.sql:219-227) | ☐ |
| 19 | appointment_status_history | `old_status`, `new_status` | VARCHAR(20) | VARCHAR(11) | ☐ |
| 20 | appointment_reminder_preferences | `channel` | VARCHAR(20) | VARCHAR(5) | ☐ |
| 21 | appointment_reminder_preferences | constraint | — | + UNIQUE(patient_id, channel) | ☐ |
| 22 | appointment_notification_logs | `channel` | VARCHAR(20) | VARCHAR(5) | ☐ |
| 23 | idempotency_keys | `method` | VARCHAR(10) | VARCHAR(7) | ☐ |
| 24 | idempotency_keys | `status` | VARCHAR(20) | VARCHAR(11) | ☐ |

Khớp hoàn toàn: `work_shifts`, `specialties`, `doctor_specialties`, `service_categories`.

---

## 2.4 Core Medical Service (`core_medical_service_db`)

| # | Bảng | Cột | Doc cũ | Code thực tế | Đã cập nhật |
|---|---|---|---|---|---|
| 1 | patients | `blood_type` | VARCHAR(10) | **Đã xóa** (migration `1784500000000-GenderToSmallintDropBloodType`) | ☐ |
| 2 | patients | `gender` | VARCHAR(10) | **SMALLINT** (ISO 5218, có CHECK constraint) | ☐ |
| 3 | medical_records | `record_status` | VARCHAR(20) | VARCHAR(9) | ☐ |
| 4 | diagnoses | `severity` | VARCHAR(20) | VARCHAR(8) | ☐ |
| 5 | symptoms | `severity` | VARCHAR(20) | VARCHAR(8) | ☐ |
| 6 | clinical_orders | `order_type` | VARCHAR(50) | VARCHAR(13) | ☐ |
| 7 | clinical_orders | `urgency` | VARCHAR(20) | VARCHAR(7) | ☐ |
| 8 | clinical_orders | `status` | VARCHAR(20) | VARCHAR(11) | ☐ |
| 9 | prescriptions | `status` | VARCHAR(20) | VARCHAR(9) | ☐ |
| 10 | treatment_plans | `status` | VARCHAR(20) | VARCHAR(18) (dài nhất: `partially_accepted`) | ☐ |
| 11 | treatment_plans | `quote_currency` | VARCHAR(3) | CHAR(3) | ☐ |
| 12 | treatment_plans | `acceptance_scope` | VARCHAR(20) | VARCHAR(7) | ☐ |
| 13 | treatment_plans | `accepted_representative_id` | UUID thường | **FK → patient_representatives** (migration `1784400000000-AddTreatmentPlanRepresentativeFk`) | ☐ |
| 14 | dental_charts | constraint | — | + UNIQUE(record_id, tooth_number) | ☐ |

Khớp hoàn toàn: `patient_representatives`, `medical_history`, `medical_record_versions`, `examination_sessions`, `examination_session_amendments`, `lab_test_results`, `prescription_items`, `treatment_history`, `image_categories`, `dental_images`, `image_annotations`, `pacs_sync_logs`, `record_exports`.

---

## 2.5 Payment Service (`payment_service_db`)

| # | Cột | Doc cũ | Code thực tế | Nguồn | Đã cập nhật |
|---|---|---|---|---|---|
| 1 | `currency` | VARCHAR(10) | **CHAR(3)** | `payment.entity.ts:25` | ☐ |
| 2 | `status` | VARCHAR(20) | VARCHAR(8) (pending/paid/failed/refunded) | `payment.entity.ts:29` | ☐ |
| 3 | `refund_status` | VARCHAR(20) | VARCHAR(12) (REQUESTED→…→REFUNDED\|REJECTED) | `payment.entity.ts:50` | ☐ |

---

## ⚠️ Code drift — lỗi trong code, KHÔNG sửa doc

Entity ↔ schema.sql tự mâu thuẫn. Cần fix code / regenerate schema.sql:

| # | Vị trí | Vấn đề | Đã fix code |
|---|---|---|---|
| 1 | `accounts.email` | entity nullable vs schema.sql NOT NULL | ☐ |
| 2 | `accounts.password_hash` | entity nullable vs schema.sql NOT NULL | ☐ |
| 3 | `oauth_connections`, `otp_tokens` | `created_by`/`updated_by` có trong schema.sql, **thiếu trong entity** | ☐ |
| 4 | `permissions.resource`, `permissions.action` | entity nullable vs schema.sql NOT NULL | ☐ |
| 5 | `kyc_verifications` | schema.sql thiếu toàn bộ ~20 cột OCR/consent/retention (chỉ có trong migrations) → cần regenerate | ☐ |
| 6 | `appointments.occupied_during` | TSRANGE generated + 3 EXCLUDE constraint có trong schema.sql, **không map trong AppointmentEntity** | ☐ |
| 7 | `diagnostic_orders` | entity lengths 50/20/20 vs schema.sql 13/7/11 (`order_type`/`priority`/`status`) | ☐ |
| 8 | Clinic + Medical service (nhiều bảng) | FK columns: entity NOT NULL, schema.sql nullable — schema.sql là dump cũ trước khi entity siết chặt | ☐ |
| 9 | iam-service entities | Không có `@ManyToOne`/`@JoinColumn` — FK chỉ tồn tại ở DB level | ☐ (by design?) |

## Phát hiện thêm (khi update ERD/SQL, 2026-07-29)

Migration = trạng thái DB thật, khi lệch entity thì migration thắng:

| # | Vị trí | Vấn đề | Đã fix |
|---|---|---|---|
| 1 | `kyc_verifications.verification_status` | DB default thật là `'pending'` (create migration đặt, EnhanceKycVerifications chỉ update data, không ALTER DEFAULT) — entity default `PENDING_REVIEW`. Doc/entity nói PENDING_REVIEW nhưng DB nói khác | ☐ |
| 2 | `notifications.notification_type`, `related_entity_type` | Migration VARCHAR(100), entity VARCHAR(50) | ☐ |
| 3 | `notifications.subject` | Migration TEXT, entity VARCHAR(255) | ☐ |
| 4 | `notifications.scheduled_at` | Migration nullable, entity NOT NULL | ☐ |
| 5 | `notification_delivery_logs.gateway_name` | Migration VARCHAR(50), entity VARCHAR(100) | ☐ |
| 6 | `diagnostic_orders` | Entity vẫn 50/20/20 — DB đã siết 13/7/11 bởi `TightenColumnWidths1730000000008` (clinic-migrations). **Entity cần sửa theo DB** | ☐ |
| 7 | Clinic + Medical: 17+ cột FK | Entity NOT NULL, DB nullable — không migration nào có `SET NOT NULL`. Entity là bên sai | ☐ |
| 8 | Ghi chú path | Clinic migrations nằm ở `src/database/clinic-migrations/` (data source riêng), không phải `src/database/migrations/` (chỉ medical) | — |
