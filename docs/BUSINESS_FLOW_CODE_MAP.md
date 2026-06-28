# S.M.I.L.E — Ánh xạ Luồng Nghiệp Vụ ↔ Mã nguồn

> Tài liệu chứng minh mỗi mục trong [BUSINESS_FLOW.md](./BUSINESS_FLOW.md) đều có code tương ứng trong codebase.

Viết tắt đường dẫn:
- `IAM` = `backend/service/iam-service/src`
- `EMR` = `backend/service/clinical-emr-service/src`
- `PAY` = `backend/service/payment-service/src`
- `AI` = `ai`
- `WEB` = `frontend/web/src`

---

## Luồng chính 1 — Đăng ký & Đăng nhập

| Nghiệp vụ | Code |
|---|---|
| Đăng ký email/username | Controller: `IAM/auth/auth.controller.ts:61` — `POST /v1/auth/email/register` |
| | Service: `IAM/auth/auth.service.ts:207` — `register()` |
| | DTO: `IAM/auth/dto/auth-register-login.dto.ts:10` — `AuthRegisterLoginDto` |
| Đăng ký Google OAuth | Controller: `IAM/auth-google/auth-google.controller.ts:34` — `POST /v1/auth/google` |
| | Service: `IAM/auth/auth.service.ts:124` — `validateSocialLogin()` (tạo account nếu chưa có) |
| Xác nhận email | Controller: `IAM/auth/auth.controller.ts:80` — `POST /v1/auth/email/confirm` |
| | Service: `IAM/auth/auth.service.ts:246` — `confirmEmail()` |
| Xác minh SĐT (OTP) | Controller: `IAM/accounts/accounts.controller.ts:96` — `POST /v1/accounts/me/phone/send-otp` |
| | Controller: `IAM/accounts/accounts.controller.ts:104` — `POST /v1/accounts/me/verify-phone` |
| | Service OTP: `IAM/otp-tokens/otp-tokens.service.ts:31` — `create()` (mã 6 số) |
| Đăng nhập email | Controller: `IAM/auth/auth.controller.ts:43` — `POST /v1/auth/email/login` |
| | Service: `IAM/auth/auth.service.ts:44` — `validateLogin()` (bcrypt, auto-lock sau 5 lần sai) |
| JWT token | Service: `IAM/auth/auth.service.ts:459` — `getTokensData()` (ký JWT + refresh token) |
| | Strategy: `IAM/auth/strategies/jwt.strategy.ts:9` — `JwtStrategy` |
| Refresh token | Controller: `IAM/auth/auth.controller.ts:122` — `POST /v1/auth/refresh` |
| | Service: `IAM/auth/auth.service.ts:414` — `refreshToken()` |
| Quên mật khẩu | Controller: `IAM/auth/auth.controller.ts:87` — `POST /v1/auth/forgot/password` |
| Đặt lại mật khẩu | Controller: `IAM/auth/auth.controller.ts:94` — `POST /v1/auth/reset/password` |
| Đăng xuất | Controller: `IAM/auth/auth.controller.ts:133` — `POST /v1/auth/logout` |
| Vai trò (enum) | `IAM/accounts/domain/account.ts:10` — `RoleEnum`: ADMIN, DOCTOR, PATIENT, RECEPTIONIST, NURSE |
| Trạng thái tài khoản | `IAM/accounts/domain/account.ts:4` — `AccountStatus`: ACTIVE, LOCKED, SUSPENDED |
| Entity tài khoản | `IAM/accounts/infrastructure/persistence/relational/entities/account.entity.ts:15` |
| **Frontend** | |
| Trang đăng nhập | `WEB/app/(pages)/(auth)/login/page.tsx` — render `LoginForm` trong `PublicRoute` |
| Trang đăng ký | `WEB/app/(pages)/(auth)/register/page.tsx` — render `RegisterForm` |
| Quên mật khẩu | `WEB/app/(pages)/(auth)/forgot-password/page.tsx` |
| Đặt lại mật khẩu | `WEB/app/(pages)/(auth)/reset-password/page.tsx` |
| Google callback | `WEB/app/(pages)/(auth)/google-callback/page.tsx` |
| Middleware bảo vệ route | `WEB/middleware.ts` — kiểm tra `access_token` cookie |

---

## Luồng chính 2 — Xác minh danh tính (KYC)

| Nghiệp vụ | Code |
|---|---|
| Upload CCCD + selfie | Controller: `IAM/kyc-verifications/kyc-verifications.controller.ts:46` — `POST /v1/kyc/me/submit` |
| | Service: `IAM/kyc-verifications/kyc-verifications.service.ts:47` — `submitForCurrentUser()` |
| | DTO: `IAM/kyc-verifications/dto/submit-kyc.dto.ts:11` — `SubmitKycDto` |
| AI OCR trích xuất | Service: `IAM/kyc-verifications/kyc-ocr.service.ts:22` — `extractIdentity()` (gọi AI OCR) |
| | Poller: `IAM/kyc-verifications/kyc-ocr-poller.service.ts:85` — `processOne()` |
| Tự động xác minh | Service: `IAM/kyc-verifications/kyc-auto-verification.service.ts:26` — `evaluate()` |
| | Đánh giá rủi ro: `IAM/kyc-verifications/kyc-ocr-assessment.service.ts` |
| Admin duyệt thủ công | Controller: `IAM/kyc-verifications/kyc-verifications.controller.ts:151` — `POST /v1/kyc/:id/approve` |
| Admin từ chối | Controller: `IAM/kyc-verifications/kyc-verifications.controller.ts:158` — `POST /v1/kyc/:id/reject` |
| Kiểm tra đủ điều kiện đặt lịch | Controller: `IAM/kyc-verifications/kyc-verifications.controller.ts:108` — `GET /v1/kyc/users/:userId/status` |
| Trạng thái KYC (enum) | `IAM/kyc-verifications/entities/kyc-verification.entity.ts:10` — `KycStatus`: NOT_SUBMITTED, PENDING_REVIEW, VERIFIED, REJECTED |
| Trạng thái OCR (enum) | `IAM/kyc-verifications/entities/kyc-verification.entity.ts:17` — `KycOcrStatus`: PENDING, PROCESSING, SKIPPED, COMPLETED, FAILED |
| Nguồn quyết định (enum) | `IAM/kyc-verifications/entities/kyc-verification.entity.ts:25` — `KycDecisionSource`: AUTO, MANUAL |
| **Frontend** | |
| Trang profile (KYC timeline) | `WEB/app/(pages)/(user)/profile/page.tsx` — `KycStatusTimeline`, OTP verify |
| Admin duyệt KYC | `WEB/app/(pages)/admin/kyc-management/page.tsx` — `KycManagement` component |

---

## Luồng chính 3 — Đặt lịch khám (Booking)

| Nghiệp vụ | Code |
|---|---|
| Đặt lịch cơ bản | Controller: `EMR/appointments/appointments.controller.ts:49` — `POST /appointments` |
| Đặt theo chuyên khoa | Controller: `EMR/appointments/appointments.controller.ts:63` — `POST /appointments/by-specialty` |
| Đặt theo bác sĩ | Controller: `EMR/appointments/appointments.controller.ts:84` — `POST /appointments/by-doctor` |
| Đặt theo option (slot) | Controller: `EMR/appointments/appointments.controller.ts:101` — `POST /appointments/book-option` |
| Đặt ngoài giờ | Controller: `EMR/appointments/appointments.controller.ts:117` — `POST /appointments/outside-hours` |
| Service tạo lịch | `EMR/appointments/appointments.service.ts:255` — `create()` |
| Kiểm tra slot trống | `EMR/appointments/appointment-availability.service.ts:69` — `findAvailability()` |
| Chính sách lịch (grace, break, step) | `EMR/appointments/scheduling-policy.ts:1-3` — `ARRIVAL_GRACE=15`, `BREAK=10`, `STEP=15` |
| Gửi thông báo xác nhận | `EMR/appointments/appointment-notification.publisher.ts:25` — `sendAppointmentConfirmation()` |
| Entity lịch hẹn | `EMR/appointments/entities/appointment.entity.ts:17` — 25+ fields |
| Loại lịch hẹn (enum) | `EMR/utils/enums/appointment-type.enum.ts` — REGULAR, EMERGENCY, FOLLOW_UP, CONSULTATION |
| **Frontend** | |
| Danh sách lịch hẹn | `WEB/app/(pages)/appointments/page.tsx` — filter theo status, payment |
| Booking wizard | `WEB/app/(pages)/appointments/new/page.tsx` — `BookingWizard` multi-step |
| Chi tiết lịch hẹn | `WEB/app/(pages)/appointments/[id]/page.tsx` — status badge, cancel modal |
| Chỉnh sửa lịch hẹn | `WEB/app/(pages)/appointments/[id]/edit/page.tsx` |
| AI Chatbot đặt lịch | `AI/booking_langgraph_service/src/main.py:101` — `POST /chat` |
| | Graph: `AI/booking_langgraph_service/src/graph.py:146` — `_build_graph()` |
| | Nodes: `extract_command`, `booking_flow`, `cancel_flow`, `reschedule_flow`, `confirmation_flow` |
| Trang chat (UI) | `WEB/app/(pages)/chat/page.tsx` — floating chat bubble |

---

## Luồng trạng thái lịch hẹn

| Nghiệp vụ | Code |
|---|---|
| State machine (SCHEDULED→CONFIRMED→...) | `EMR/appointments/appointment-status.machine.ts:5-28` — bảng TRANSITIONS |
| Hàm kiểm tra chuyển trạng thái | `EMR/appointments/appointment-status.machine.ts:30` — `canTransition()` |
| Hàm assert (throw nếu sai) | `EMR/appointments/appointment-status.machine.ts:34` — `assertTransition()` |
| Enum trạng thái | `EMR/utils/enums/appointment-status.enum.ts` — 7 trạng thái |
| Xác nhận (confirm) | Controller: `EMR/appointments/appointments.controller.ts:250` — `PATCH /:id/confirm` |
| | Service: `EMR/appointments/appointments.service.ts:465` — `confirm()` |
| Hủy (cancel) | Controller: `EMR/appointments/appointments.controller.ts:273` — `PATCH /:id/cancel` |
| | Service: `EMR/appointments/appointments.service.ts:483` — `cancel()` |
| Check-in | Controller: `EMR/appointments/appointments.controller.ts:289` — `PATCH /:id/check-in` |
| | Service: `EMR/appointments/appointments.service.ts:573` — `checkIn()` |
| Đổi trạng thái (chung) | Controller: `EMR/appointments/appointments.controller.ts:229` — `PATCH /:id/status` |
| | Service: `EMR/appointments/appointments.service.ts:531` — `changeStatus()` |
| Lịch sử trạng thái | Controller: `EMR/appointments/appointments.controller.ts:314` — `GET /:id/history` |
| | Entity: `EMR/appointments/entities/appointment-status-history.entity.ts:12` |
| Trạng thái thanh toán (enum) | `EMR/utils/enums/payment-status.enum.ts` — UNPAID, PAID, PARTIALLY_PAID |

---

## Luồng phụ A — Khám bệnh chi tiết

| Nghiệp vụ | Code (chứng minh) |
|---|---|
| **Tạo phiên khám** | Controller: `EMR/examination-sessions/examination-sessions.controller.ts:27` — `POST /examination-sessions` |
| | Service: `EMR/examination-sessions/examination-sessions.service.ts:15` — `create()` |
| | Entity: `EMR/examination-sessions/entities/examination-session.entity.ts` |
| Ghi triệu chứng (chief complaint) | Entity field: `examination-session.entity.ts:40` — `chief_complaint: text` |
| | Module triệu chứng riêng: `EMR/symptoms/symptoms.controller.ts:21` — `POST /symptoms` |
| | Entity: `EMR/symptoms/entities/symptom.entity.ts:13` |
| Bệnh sử hiện tại (present illness) | Entity field: `examination-session.entity.ts:43` — `present_illness: text` |
| **Khám lâm sàng** (physical examination) | Entity field: `examination-session.entity.ts:46` — `physical_examination: text` |
| **Đo sinh hiệu** (vital signs) | Entity field: `examination-session.entity.ts:49` — `vital_signs: jsonb` |
| Trạng thái phiên (in_progress → completed) | Entity field: `examination-session.entity.ts:52` — `status`, default `'in_progress'` |
| | `completed_at`: `examination-session.entity.ts:58` |
| | Update: `EMR/examination-sessions/examination-sessions.controller.ts:52` — `PATCH /:session_id` |
| **Chẩn đoán** (ICD code) | Controller: `EMR/diagnoses/diagnoses.controller.ts:21` — `POST /diagnoses` |
| | Entity: `EMR/diagnoses/entities/diagnosis.entity.ts` — `icd_code` (L23), `diagnosis_name` (L26), `severity` (L32) |
| | Tìm theo session: `EMR/diagnoses/diagnoses.controller.ts:36` — `GET /diagnoses/session/:session_id` |
| | Tìm theo ICD: `EMR/diagnoses/diagnoses.controller.ts:41` — `GET /diagnoses/icd/:icd_code` |
| **Sơ đồ răng** (dental chart) | Controller: `EMR/dental-charts/dental-charts.controller.ts:21` — `POST /dental-charts` |
| | Entity: `EMR/dental-charts/entities/dental-chart.entity.ts` — `tooth_number` (L34), `tooth_status` (L37), `surfaces` jsonb (L40) |
| | Unique constraint: `[record_id, tooth_number]` (L15) |
| **Chụp hình nha khoa** | Controller: `EMR/dental-images/dental-images.controller.ts:21` — `POST /dental-images` |
| | Entity: `EMR/dental-images/entities/dental-image.entity.ts` — `image_type` (L40), `pacs_id` (L70) |
| | Annotations: `EMR/image-annotations/image-annotations.controller.ts:23` — `POST` |
| | PACS sync: `EMR/pacs-sync-logs/pacs-sync-logs.controller.ts:22` — `POST` |
| **Frontend** | |
| Danh sách phiên khám | `WEB/app/(pages)/examinations/page.tsx` |
| Tạo phiên khám | `WEB/app/(pages)/examinations/new/page.tsx` |
| Chi tiết (symptoms, treatment, prescription, orders) | `WEB/app/(pages)/examinations/[id]/page.tsx` — `SymptomModal`, `TreatmentPlanModal`, `PrescriptionModal`, `DiagnosticOrderModal`, `ClinicalOrderModal` |
| Quản lý hình nha khoa | `WEB/app/(pages)/dental-images/page.tsx` — `UploadImageModal`, `AnnotationModal`, `CategoryModal` |

---

## Luồng phụ B — Chỉ định cận lâm sàng (Clinical Order)

| Nghiệp vụ | Code |
|---|---|
| Tạo chỉ định | Controller: `EMR/clinical-orders/clinical-orders.controller.ts:21` — `POST /clinical-orders` |
| | Service: `EMR/clinical-orders/clinical-orders.service.ts:15` — `create()` |
| Entity | `EMR/clinical-orders/entities/clinical-order.entity.ts` |
| Loại (order_type) | Entity field L35 — varchar 50 |
| Enum loại | `EMR/utils/enums/order-type.enum.ts` — X_RAY, CBCT, LAB_TEST, CLINICAL_TEST |
| Mức độ (urgency) | Entity field L47 — default `'routine'` |
| Enum mức độ | `EMR/utils/enums/order-priority.enum.ts` — ROUTINE, URGENT, STAT |
| Trạng thái (status) | Entity field L50 — default `'ordered'` |
| Enum trạng thái | `EMR/utils/enums/order-status.enum.ts` — ORDERED, IN_PROGRESS, COMPLETED, CANCELLED |
| **Kết quả xét nghiệm** | Controller: `EMR/lab-test-results/lab-test-results.controller.ts:21` — `POST /lab-test-results` |
| | Entity: `EMR/lab-test-results/entities/lab-test-result.entity.ts` — `test_name` (L23), `result_value` (L26), `reference_range` (L32), `is_abnormal` (L35) |
| | Tìm bất thường: Controller L31 — `GET /lab-test-results/abnormal` |

---

## Luồng phụ C — Kê đơn thuốc (Prescription)

| Nghiệp vụ | Code |
|---|---|
| Tạo đơn thuốc | Controller: `EMR/prescriptions/prescriptions.controller.ts:21` — `POST /prescriptions` |
| | Service: `EMR/prescriptions/prescriptions.service.ts:15` — `create()` |
| Entity đơn thuốc | `EMR/prescriptions/entities/prescription.entity.ts` — `status` (L38), `digital_signature_id` (L44) |
| Enum trạng thái | `EMR/utils/enums/prescription-status.enum.ts` — DRAFT, ISSUED, DISPENSED, CANCELLED |
| **Dòng thuốc** (prescription items) | Controller: `EMR/prescription-items/prescription-items.controller.ts:23` — `POST` |
| | Entity: `EMR/prescription-items/entities/prescription-item.entity.ts` — `medication_name` (L23), `dosage` (L29), `frequency` (L35), `quantity` (L41) |

---

## Luồng phụ D — Kế hoạch điều trị (Treatment Plan)

| Nghiệp vụ | Code |
|---|---|
| Tạo kế hoạch | Controller: `EMR/treatment-plans/treatment-plans.controller.ts:24` — `POST /treatment-plans` |
| | Service: `EMR/treatment-plans/treatment-plans.service.ts:15` — `create()` |
| Entity | `EMR/treatment-plans/entities/treatment-plan.entity.ts` |
| Trạng thái | Entity field L41 — `status`, default `'active'` |
| Enum trạng thái | `EMR/utils/enums/plan-status.enum.ts` — DRAFT, SENT, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED |
| Gửi cho bệnh nhân | Entity field L44 — `sent_at`, L47 — `sent_to`, L50 — `sent_via` |
| Bệnh nhân xác nhận | Entity field L53 — `confirmed_at` |

---

## Luồng phụ E — KYC (đã trình bày ở Luồng chính 2)

> Xem mục "Luồng chính 2" ở trên.

---

## Luồng phụ F — Quản trị (Admin)

| Nghiệp vụ | Code |
|---|---|
| **Quản lý tài khoản** | |
| Khóa tài khoản | Controller: `IAM/accounts/accounts.controller.ts:145` — `POST /v1/accounts/:id/lock` |
| Mở khóa tài khoản | Controller: `IAM/accounts/accounts.controller.ts:160` — `POST /v1/accounts/:id/unlock` |
| CRUD tài khoản | Controller: `IAM/accounts/accounts.controller.ts` — GET/PATCH/DELETE |
| **Quản lý phòng khám** | |
| CRUD phòng khám | Controller: `EMR/clinics/clinics.controller.ts:21` — POST/GET/PATCH/DELETE |
| Enum trạng thái | `EMR/utils/enums/clinic-status.enum.ts` — ACTIVE, INACTIVE, MAINTENANCE |
| **Quản lý phòng điều trị** | |
| CRUD phòng | Controller: `EMR/treatment-rooms/treatment-rooms.controller.ts:24` — POST/GET/PATCH/DELETE |
| Enum trạng thái phòng | `EMR/utils/enums/room-status.enum.ts` — AVAILABLE, OCCUPIED, MAINTENANCE |
| Enum loại phòng | `EMR/utils/enums/room-type.enum.ts` — EXAMINATION, SURGERY, IMAGING |
| **Quản lý vai trò & phân quyền** | |
| CRUD vai trò | Controller: `IAM/roles/roles.controller.ts:19` — POST/GET/PATCH/DELETE |
| CRUD quyền | Controller: `IAM/permissions/permissions.controller.ts:21` — POST/GET/PATCH/DELETE |
| Gán quyền cho vai trò | Controller: `IAM/permissions/permissions.controller.ts:76` — `POST /role/:roleId` |
| Thu hồi quyền | Controller: `IAM/permissions/permissions.controller.ts:96` — `DELETE /role/:roleId/:permissionId` |
| **Audit logs** | |
| Tạo log | Controller: `IAM/audit-logs/audit-logs.controller.ts:17` — `POST /v1/audit-logs` |
| Truy vấn log | Controller: `IAM/audit-logs/audit-logs.controller.ts:25` — `GET /v1/audit-logs` |
| Entity | `IAM/audit-logs/entities/audit-log.entity.ts:5` — action, resource_type, ip_address, metadata |
| Ghi log tự động khi login/logout | `IAM/auth/auth.controller.ts:50` (login), `:139` (logout) — gọi `auditLogsService.create()` |
| **Thông báo** | |
| CRUD thông báo | Controller: `IAM/notifications/notifications.controller.ts:29` |
| Template thông báo | Controller: `IAM/notifications/notifications.controller.ts:113` |
| Kênh gửi | `IAM/notifications/gateways/` — email, in-app, push, sms |
| Gửi email | `IAM/mail/mail.service.ts` — `userSignUp()` (L22), `forgotPassword()` (L42) |
| **Báo cáo** | |
| Báo cáo doanh thu | `WEB/app/(pages)/admin/revenue-reports/page.tsx` — `useRevenue` + recharts |
| Hiệu suất bác sĩ | `WEB/app/(pages)/admin/performance/page.tsx` — recharts |
| **Frontend admin** | |
| Quản lý users | `WEB/app/(pages)/admin/users-management/page.tsx` — `ManageRolesDialog`, `BanDialog` |
| Quản lý vai trò | `WEB/app/(pages)/admin/roles-management/page.tsx` — `CreateRoleDialog`, `CreatePermissionDialog` |
| Audit logs viewer | `WEB/app/(pages)/admin/audit-logs/page.tsx` — filterable, paginated |
| Navigation phân quyền | `WEB/config/navigation.ts` — `getNavigationForRole()` lọc menu theo role |

---

## Luồng phụ G — Lịch bác sĩ

| Nghiệp vụ | Code |
|---|---|
| **Ca làm việc (Work Shifts)** | |
| CRUD ca | Controller: `EMR/work-shifts/work-shifts.controller.ts:20` — POST/GET/PATCH/DELETE |
| Entity | `EMR/work-shifts/entities/work-shift.entity.ts:8` — `name`, `start_time`, `end_time` |
| **Lịch làm việc (Doctor Schedules)** | |
| Tạo lịch | Controller: `EMR/doctor-schedules/doctor-schedules.controller.ts:33` — `POST` |
| Xem theo bác sĩ | Controller: `EMR/doctor-schedules/doctor-schedules.controller.ts:59` — `GET /doctor/:doctorId` |
| Chuyển ca | Controller: `EMR/doctor-schedules/doctor-schedules.controller.ts:89` — `POST /:id/transfer` |
| Lịch sử thay đổi | Controller: `EMR/doctor-schedules/doctor-schedules.controller.ts:80` — `GET /:id/changes` |
| Enum trạng thái | `EMR/utils/enums/schedule-status.enum.ts` — SCHEDULED, COMPLETED, CANCELLED |
| Enum loại thay đổi | `EMR/utils/enums/change-type.enum.ts` — SHIFT_SWAP, CANCELLATION, RESCHEDULING, SHIFT_TRANSFER |
| **Nghỉ phép (Doctor Leaves)** | |
| Tạo đơn nghỉ | Controller: `EMR/doctor-leaves/doctor-leaves.controller.ts:28` — `POST` |
| Duyệt/từ chối | Controller: `EMR/doctor-leaves/doctor-leaves.controller.ts:65` — `PATCH /:id` |
| Entity | `EMR/doctor-leaves/entities/doctor-leave.entity.ts:10` — `leave_type` (L17), `status` default `'pending'` (L29), `approved_by` (L32) |
| Enum loại nghỉ | `EMR/utils/enums/leave-type.enum.ts` — ANNUAL, SICK, EMERGENCY |
| Enum trạng thái duyệt | `EMR/utils/enums/approval-status.enum.ts` — PENDING, APPROVED, REJECTED |
| **Frontend** | |
| Lịch cá nhân | `WEB/app/(pages)/schedules/my-schedule/page.tsx` — `ScheduleForm` |
| Lịch tất cả bác sĩ | `WEB/app/(pages)/schedules/doctors/page.tsx` — `TransferModal`, `ChangesModal` |
| Quản lý nghỉ phép | `WEB/app/(pages)/schedules/leaves/page.tsx` — tabs PENDING/APPROVED/REJECTED |

---

## Thanh toán (Payment)

| Nghiệp vụ | Code |
|---|---|
| Tạo URL thanh toán VNPay | Controller: `PAY/payments/payments.controller.ts:25` — `POST /v1/payments/initiate` |
| | Service: `PAY/payments/payments.service.ts:106` — `initiate()` |
| | Service: `PAY/payments/payments.service.ts:62` — `buildPaymentUrl()` |
| IPN callback (VNPay trả kết quả) | Controller: `PAY/payments/payments.controller.ts:35` — `GET /v1/payments/vnpay-return` |
| | Service: `PAY/payments/payments.service.ts:126` — `handleVnpayReturn()` |
| Ký HMAC-SHA512 | Service: `PAY/payments/payments.service.ts:48` — `signParams()` |
| Hoàn tiền | Controller: `PAY/payments/payments.controller.ts:70` — `POST /v1/payments/:id/refund` |
| | Service: `PAY/payments/payments.service.ts:181` — `refund()` |
| Entity | `PAY/payments/entities/payment.entity.ts` — `status` (L26): pending/paid/failed/refunded, `provider` (L29): vnpay |
| Cập nhật payment_status lên appointment | Service: `PAY/payments/payments.service.ts:36` — `updateAppointmentPaymentStatus()` |
| **Frontend** | |
| Trang thanh toán | `WEB/app/(pages)/appointments/[id]/payment/page.tsx` — `createPayment` |
| Callback VNPay | `WEB/app/(pages)/appointments/[id]/payment/callback/page.tsx` — đọc `vnp_ResponseCode` |

---

## Hoàn tất hồ sơ (Medical Records)

| Nghiệp vụ | Code |
|---|---|
| Tạo hồ sơ bệnh án | Controller: `EMR/medical-records/medical-records.controller.ts:25` — `POST /medical-records` |
| Entity | `EMR/medical-records/entities/medical-record.entity.ts` |
| Trạng thái (record_status) | Entity field L48 — default `'draft'` |
| Finalize hồ sơ | Entity field L57 — `finalized_at`, L60 — `finalized_by` |
| Hash toàn vẹn | Entity field L51 — `record_hash` |
| Blockchain TX | Entity field L54 — `blockchain_tx_id` |
| Lịch sử phiên bản | Controller: `EMR/medical-records/medical-records.controller.ts:45` — `GET /:record_id/versions` |
| | Entity: `EMR/medical-records/entities/medical-record-version.entity.ts` |
| Xuất hồ sơ | Controller: `EMR/record-exports/record-exports.controller.ts:19` — CRUD |
| **Frontend** | |
| Tạo hồ sơ mới | `WEB/app/(pages)/patients/[id]/medical-records/new/page.tsx` |
| Chi tiết hồ sơ (finalize/delete) | `WEB/app/(pages)/patients/[id]/medical-records/[recordId]/page.tsx` |

---

## Quản lý bệnh nhân (Patients)

| Nghiệp vụ | Code |
|---|---|
| CRUD bệnh nhân | Controller: `EMR/patients/patients.controller.ts:28` — POST/GET/PATCH/DELETE |
| Entity | `EMR/patients/entities/patient.entity.ts` — `patient_code` (L19), `blood_type` (L55), `allergies` text[] (L58), `chronic_diseases` text[] (L61), `insurance_number` (L64) |
| Tiền sử bệnh | Controller: `EMR/medical-history/medical-history.controller.ts:19` — `patients/:patient_id/history` |
| | Entity: `EMR/medical-history/entities/medical-history.entity.ts` — `condition_name`, `condition_type`, `treatment` |
| Lịch sử điều trị | Controller: `EMR/treatment-history/treatment-history.controller.ts:19` — CRUD |
| | Tìm theo răng: Controller L51 — `GET /tooth/:tooth_number` |
| **Frontend** | |
| Danh sách bệnh nhân | `WEB/app/(pages)/patients/page.tsx` |
| Tạo bệnh nhân | `WEB/app/(pages)/patients/new/page.tsx` — `PatientFormDark` |
| Chi tiết (history, records) | `WEB/app/(pages)/patients/[id]/page.tsx` — `MedicalHistoryModal`, `MedicalRecordModal`, `TreatmentModal` |
| Ảnh nha khoa bệnh nhân | `WEB/app/(pages)/patients/[id]/images/page.tsx` — `ImageUpload`, `ImageGallery` |

---

## Dịch vụ & Chuyên khoa

| Nghiệp vụ | Code |
|---|---|
| CRUD dịch vụ | Controller: `EMR/services/services.controller.ts:26` — POST/GET/PATCH/DELETE |
| Gán dịch vụ cho phòng khám | Controller: `EMR/services/services.controller.ts:71` — `POST /clinics/:clinicId/services/:serviceId` |
| Danh mục dịch vụ | Controller: `EMR/service-categories/service-categories.controller.ts:18` — tree structure |
| CRUD chuyên khoa | Controller: `EMR/specialties/specialties.controller.ts:19` — POST/GET/PATCH/DELETE |
| Gán chuyên khoa cho bác sĩ | Controller: `EMR/doctor-specialties/doctor-specialties.controller.ts:25` — `POST` |
| **Frontend** | |
| Catalog dịch vụ | `WEB/app/(pages)/services/page.tsx` — `ServiceCard`, `SpecialtyCard` |
| Quản lý chuyên khoa | `WEB/app/(pages)/specialties/page.tsx` — `SpecialtyModalDark` |

---

## Module AI

| Nghiệp vụ | Code |
|---|---|
| **Booking LangGraph** | |
| API entry | `AI/booking_langgraph_service/src/main.py:101` — `POST /chat` |
| Graph builder | `AI/booking_langgraph_service/src/graph.py:146` — `_build_graph()` |
| Các node | `extract_command` (L148), `booking_flow` (L150), `cancel_flow` (L151), `reschedule_flow` (L152), `confirmation_flow` (L153), `fallback_flow` (L155) |
| Routing logic | `AI/booking_langgraph_service/src/graph.py:251` — `_route_after_extract()` |
| **KYC OCR** | |
| API entry | `AI/kyc_ocr_service/src/main.py:45` — `POST /v1/ocr/cccd` |
| OCR service | `AI/kyc_ocr_service/src/service.py:15` — `CccdOcrService` |
| Phân tích mặt trước | `AI/kyc_ocr_service/src/service.py:27` — `analyze_front()` |
| Phân tích mặt sau | `AI/kyc_ocr_service/src/service.py:30` — `analyze_back()` |
| Đánh giá chất lượng | `AI/kyc_ocr_service/src/service.py:68` — `_normalize_quality_checks()` |
| Đánh giá rủi ro | `AI/kyc_ocr_service/src/service.py:147` — `_merge_document_risk()` |
