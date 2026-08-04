# SRS §3.1.c — Non-Screen Functions

<!-- GENERATED — python3 scripts/diagrams/gen_srs_tables.py -->

| # | Feature | System Function | Description |
|---|---|---|---|
| 1 | Account management | POST Auth RegisterUser(params) | Create a new account, validate unique email/phone/username, return JWT tokens. |
| 2 | Account management | POST Auth Login(params) | Authenticate by email/phone plus password and issue access and refresh tokens. |
| 3 | Account management | POST Auth RefreshToken(params) | Rotate the access token using a stored refresh token for session continuity. |
| 4 | Account management | POST Auth SendOtp(params) | Issue a one-time passcode for phone/email verification or password reset. |
| 5 | User administration | GET Users GetAll(params) | Return the paginated user list with filters for administrative operations. |
| 6 | KYC verification | POST KYC SubmitKyc(params) | Submit identity documents; files are stored AES-encrypted for the verification workflow. |
| 7 | KYC verification | PUT KYC ApproveKyc(params) | Record the reviewer decision on a pending KYC request and update verification status. |
| 8 | AI KYC OCR | POST KycOcr ExtractIdentityFields(params) | Extract CCCD fields from uploaded identity images (YOLOv11 + VietOCR) and return a KYC quality checklist. |
| 9 | Appointment management | POST Appointment CreateAtClinic(params) | Create a clinic appointment, enforce the no-double-booking exclusion constraints, and set status SCHEDULED. |
| 10 | Appointment management | PUT Appointment Cancel(params) | Cancel an appointment with a reason and audit cancelled_by/cancelled_at. |
| 11 | Availability service | GET Availability GetDoctorSlots(params) | Return the available time slots for a doctor on a given day. |
| 12 | Booking idempotency | POST Appointment IdempotentSubmit(params) | Deduplicate repeated booking submissions through stored idempotency keys. |
| 13 | AI booking orchestration | POST AIBooking CreateFromChat(params) | Convert an assistant conversation into a structured appointment booking request. |
| 14 | Payment integration | POST VNPay CreatePaymentUrl(params) | Build the signed VNPay checkout URL for an appointment payment. |
| 15 | Payment integration | GET VNPay Callback(params) | Verify the VNPay callback signature and reconcile payment status idempotently. |
| 16 | Payment integration | POST Payment Refund(params) | Raise a refund request and record its approval workflow against the payment. |
| 17 | Reminder service (background) | INTERVAL Reminder DispatchPendingReminders() | Periodically scan upcoming appointments and dispatch reminders, deduplicated per appointment, channel and start time. |
| 18 | Notification delivery | POST Notification Send(params) | Deliver a notification through the APP, EMAIL, SMS or PUSH gateway and log the attempt. |
| 19 | Patient profile | POST Patient CreatePatient(params) | Create the patient master profile with demographics, allergies and chronic conditions. |
| 20 | Medical record | POST MedicalRecord CreateRecord(params) | Create a visit record linked to patient, clinic, doctor and appointment. |
| 21 | Medical record | POST MedicalRecord Finalize(params) | Finalize a record, write an immutable snapshot to medical_record_versions, and emit an audit log entry. |
| 22 | Record export | POST RecordExport Create(params) | Generate an export file for a medical record and store it with an expiry. |
| 23 | Imaging service | POST Imaging UploadDentalImage(params) | Upload a dental image with metadata: category, tooth numbers and PACS identifier. |
| 24 | PACS integration worker | ASYNC PACS SyncImageJob(params) | Synchronize image records to the PACS server in the background and write pacs_sync_logs. |
| 25 | Schedule service | POST Schedule CreateDoctorSchedule(params) | Create a doctor shift schedule, unique per doctor, date and shift. |
| 26 | Audit logging | ASYNC Audit RecordEvent(params) | Append actor, action, timestamp and outcome for security and clinical data events. |
| 27 | Health monitoring | GET Health Readiness(params) | Service readiness checks (database and connectivity) for orchestration and deployment probes. |
| 28 | User administration | PATCH Users Ban(userId) | Lock a user account that violates system policy, recording who banned it and why. |
| 29 | User administration | PATCH Users Unban(userId) | Restore access to a previously banned account. |
| 30 | User administration | PUT UserRoles Assign(userId) | Assign or revoke the roles held by a user. |
| 31 | Role administration | POST/PUT/DELETE Roles Manage(params) | Create a role, update the permissions attached to it, or delete one no longer required. |
| 32 | Profile | POST Accounts ConfirmAvatar(params) | Confirm an uploaded avatar against its signature and attach it to the account. |
| 33 | Appointment management | PUT Appointment Confirm(id) | Confirm a scheduled appointment and lock the reserved slot. |
| 34 | Payment integration | PUT Payment ReviewRefund(id) | Approve or reject a pending refund request against a payment. |
| 35 | Clinic examination | POST Symptom/Diagnosis Manage(params) | Add, update or remove the symptoms and diagnoses recorded on an examination session. |
| 36 | Clinic examination | POST TreatmentPlan Manage(params) | Create, revise, delete or export a treatment plan while it is still editable. |
| 37 | Clinic examination | POST ClinicalOrder Create(params) | Raise an imaging, laboratory or clinical test order from an examination session. |
| 38 | Dental imaging | POST DentalImage Annotate(imageId) | Attach markup, measurements or notes to a stored dental image. |
| 39 | Service catalog | POST/PUT/DELETE Specialty Manage(params) | Maintain the specialty catalog and its per-clinic assignments. |
| 40 | Clinic management | POST/PUT/DELETE TreatmentRoom Manage(params) | Maintain treatment rooms, their type, equipment inventory and availability. |
| 41 | Schedule management | POST ScheduleChange Request(params) | Submit a change against a published schedule and track its approval. |
