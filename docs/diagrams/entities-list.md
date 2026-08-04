# SRS §2.1.e — Entities List

<!-- GENERATED — python3 scripts/diagrams/gen_srs_tables.py -->

| # | Entity | Description |
|---|---|---|
| 1 | Account | Login credentials, primary role and account status |
| 2 | OAuthConnection | Linked external identity provider accounts (Google, etc.) |
| 3 | RefreshToken | Issued refresh tokens for session renewal and revocation |
| 4 | OtpToken | One-time passcodes for phone/email verification and password reset |
| 5 | User | User profile: name, contact, date of birth, gender, avatar |
| 6 | Role | RBAC role definition |
| 7 | Permission | RBAC action/resource permission |
| 8 | RolePermission | Assignment of permissions to roles |
| 9 | UserRole | Assignment of roles to users |
| 10 | PhoneVerification | Phone-number verification state per user |
| 11 | KycVerification | Identity verification workflow with AES-encrypted documents |
| 12 | AuditLog | Tamper-evident log of security and clinical data events |
| 13 | NotificationTemplate | Reusable message templates per notification type and channel |
| 14 | NotificationPreference | Per-user opt-in/opt-out settings by channel |
| 15 | Notification | In-app/push notification instance delivered to a user |
| 16 | NotificationDeliveryLog | Delivery attempts, status and provider responses |
| 17 | PushSubscription | Web push endpoints registered per device |
| 18 | Patient | Core patient demographic profile |
| 19 | PatientRepresentative | Guardian or legal representative authorized to act for a patient |
| 20 | MedicalHistory | Historical conditions, allergies and medications by patient |
| 21 | MedicalRecord | Visit-level clinical record; immutable once finalized |
| 22 | MedicalRecordVersion | Version snapshots of a medical record for amendment tracking |
| 23 | RecordExport | Generated record export files with expiry for patient/compliance download |
| 24 | ExaminationSession | Clinical examination encounter |
| 25 | ExaminationSessionAmendment | Post-finalization corrections to an examination session |
| 26 | Symptom | Reported symptoms with body location, severity and onset |
| 27 | Diagnosis | Diagnoses attached to an examination session |
| 28 | DentalChart | Per-tooth status and surface findings for a patient record |
| 29 | ImageCategory | Image classification taxonomy |
| 30 | DentalImage | Uploaded diagnostic images |
| 31 | ImageAnnotation | Markup and measurement comments on images |
| 32 | PacsSyncLog | Synchronization attempts between stored images and the PACS server |
| 33 | ClinicalOrder | Lab/imaging order raised from an examination session |
| 34 | LabTestResult | Result values, units, reference ranges and abnormal flags for an order |
| 35 | TreatmentPlan | Therapy plan, steps, quote and patient consent |
| 36 | TreatmentHistory | Performed procedures by tooth, with code, cost and status |
| 37 | Prescription | Prescribed medications issued from a session |
| 38 | PrescriptionItem | Medication lines in a prescription |
| 39 | Clinic | Clinic branch metadata |
| 40 | TreatmentRoom | Rooms in clinic branches, including equipment inventory |
| 41 | Specialty | Clinical specialty taxonomy |
| 42 | DoctorSpecialty | Specialties held by each doctor |
| 43 | ClinicSpecialty | Specialties offered at each clinic branch |
| 44 | WorkShift | Named shift definitions with start and end times |
| 45 | ServiceCategory | Grouping of dental services |
| 46 | Service | Dental services catalog |
| 47 | ClinicService | Per-clinic service availability and pricing |
| 48 | DoctorSchedule | Doctor shift schedule by date, clinic and room |
| 49 | DoctorLeave | Approved or requested leave blocking availability |
| 50 | ScheduleChange | Audit trail of edits to a published schedule |
| 51 | Appointment | Booking and attendance object |
| 52 | AppointmentStatusHistory | Status transition trail for an appointment |
| 53 | AppointmentReminderPreference | Reminder channels and lead time chosen per appointment |
| 54 | AppointmentNotificationLog | Reminder dispatch attempts, channel and delivery state |
| 55 | DiagnosticOrder | Requested diagnostic study with priority, tooth/area and result summary |
| 56 | IdempotencyKey | Deduplication keys preventing duplicate booking requests |
| 57 | Payment | Payment transaction with status, currency and gateway reference |
