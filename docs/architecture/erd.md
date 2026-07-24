# ERD — S.M.I.L.E Database Relationship Diagram

5 logical databases in 1 PostgreSQL instance, split per service (database-per-service). Source of truth: each service's TypeORM migration files (paths noted at the start of every section).

| Database | Owning service | Main tables |
|---|---|---|
| [`auth_service_db`](#1-auth_service_db--iam-service) | IAM | 4 |
| [`account_service_db`](#2-account_service_db--iam-service) | IAM | 12 |
| [`core_medical_service_db`](#3-core_medical_service_db--clinical-emr-service) | Clinical EMR | 18 |
| [`core_clinic_service_db`](#4-core_clinic_service_db--clinical-emr-service) | Clinical EMR | 14 |
| [`payment_service_db`](#5-payment_service_db--payment-service) | Payment | 1 |

## Cross-database relationships (logical FK)

Databases are separate, so there are no physical FKs between them — links are by UUID (logical FK):

```mermaid
erDiagram
    accounts ||--|| users : "account_id = user_id"
    users ||--o| patients : "patients.user_id"
    patients ||--o{ appointments : "appointments.patient_id"
    appointments ||--o| payments : "payments.appointment_id"
    appointments ||--o{ medical_records : "medical_records.appointment_id"
    clinics ||--o{ medical_records : "medical_records.clinic_id"
    digital_signatures ||--o{ prescriptions : "digital_signature_id"

    accounts { string db "auth_service_db" }
    users { string db "account_service_db" }
    digital_signatures { string db "account_service_db" }
    patients { string db "core_medical_service_db" }
    medical_records { string db "core_medical_service_db" }
    prescriptions { string db "core_medical_service_db" }
    appointments { string db "core_clinic_service_db" }
    clinics { string db "core_clinic_service_db" }
    payments { string db "payment_service_db" }
```

---

## 1. auth_service_db — IAM Service

Migration: `backend/service/iam-service/src/database/migrations/`

```mermaid
erDiagram
    accounts ||--o{ oauth_connections : "has"
    accounts ||--o{ refresh_tokens : "has"
    accounts ||--o{ otp_tokens : "has"

    accounts {
        uuid account_id PK
        varchar username UK
        varchar email UK
        varchar phone UK
        varchar password_hash
        varchar status "ACTIVE | INACTIVE | LOCKED | SUSPENDED"
        varchar role "PATIENT | DOCTOR | ADMIN | CLINIC_STAFF"
        int failed_login_attempts
        timestamp locked_at
        text locked_reason
        uuid locked_by
        boolean email_verified
        boolean phone_verified
        timestamp last_login_at
        timestamp created_at
        timestamp updated_at
    }
    oauth_connections {
        uuid connection_id PK
        uuid account_id FK
        varchar provider "google | facebook | apple"
        varchar provider_user_id UK
        text access_token
        text refresh_token
        timestamp token_expires_at
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    refresh_tokens {
        uuid token_id PK
        uuid account_id FK
        varchar token_hash
        timestamp expires_at
        timestamp revoked_at
        text device_info
        varchar ip_address
        timestamp created_at
    }
    otp_tokens {
        uuid otp_id PK
        uuid account_id FK
        varchar otp_code
        varchar otp_type "EMAIL_VERIFICATION | PHONE_VERIFICATION | PASSWORD_RESET | MFA"
        timestamp expires_at
        timestamp used_at
        timestamp created_at
        timestamp updated_at
    }
```

---

## 2. account_service_db — IAM Service

Migration: `backend/service/iam-service/src/database/user-migrations/`

### Users, RBAC & KYC

```mermaid
erDiagram
    users ||--o{ user_roles : "assigned"
    roles ||--o{ user_roles : "assigned"
    roles ||--o{ role_permissions : "grants"
    permissions ||--o{ role_permissions : "grants"
    users ||--o{ digital_signatures : "has"
    users ||--o{ phone_verifications : "has"
    users ||--o{ kyc_verifications : "has"
    users ||--o{ audit_logs : "writes"

    users {
        uuid user_id PK
        varchar full_name
        varchar email UK
        varchar phone
        date date_of_birth
        varchar gender "MALE | FEMALE | OTHER"
        text avatar_url
        timestamp created_at
        timestamp updated_at
    }
    roles {
        uuid role_id PK
        varchar role_name UK "PATIENT | DOCTOR | CLINIC_ADMIN | SYSTEM_ADMIN"
        text description
    }
    permissions {
        uuid permission_id PK
        varchar permission_name UK
        varchar resource
        varchar action "CREATE | READ | UPDATE | DELETE | APPROVE"
    }
    user_roles {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
        timestamp assigned_at
        uuid assigned_by
    }
    role_permissions {
        uuid id PK
        uuid role_id FK
        uuid permission_id FK
        timestamp assigned_at
        uuid assigned_by
    }
    digital_signatures {
        uuid signature_id PK
        uuid user_id FK
        text signature_data
        text certificate_url
        varchar status "ACTIVE | EXPIRED | REVOKED"
        timestamp expires_at
    }
    phone_verifications {
        uuid verification_id PK
        uuid user_id FK
        varchar phone
        boolean is_verified
        timestamp verified_at
    }
    kyc_verifications {
        uuid kyc_id PK
        uuid user_id FK
        varchar id_type "PASSPORT | NATIONAL_ID | DRIVER_LICENSE"
        varchar id_number
        varchar full_name
        date date_of_birth
        text id_front_image
        text id_back_image
        text selfie_image
        varchar verification_status "NOT_SUBMITTED | PENDING_REVIEW | VERIFIED | REJECTED"
        varchar ocr_status "PENDING | PROCESSING | SKIPPED | COMPLETED | FAILED"
        int ocr_confidence
        jsonb ocr_payload
        int ocr_attempts
        varchar document_hash
        text rejection_reason
        timestamp submitted_at
        timestamp verified_at
        uuid verified_by
        varchar decision_source "AUTO | MANUAL"
        varchar consent_version
        timestamp retention_expires_at
        timestamp deleted_at
    }
    audit_logs {
        uuid log_id PK
        uuid user_id FK
        varchar action
        varchar resource
        uuid resource_id
        varchar ip_address
        text user_agent
        jsonb details
        timestamp created_at
    }
```

### Notifications

```mermaid
erDiagram
    notification_templates ||--o{ notifications : "render"
    notifications ||--o{ notification_delivery_logs : "delivery log"

    notification_templates {
        uuid template_id PK
        varchar template_code UK
        varchar name
        text subject_template
        text body_template
        varchar channel "EMAIL | SMS | PUSH_NOTIFICATION | IN_APP"
        boolean is_active
    }
    notifications {
        uuid notification_id PK
        uuid recipient_id "logical FK users"
        uuid template_id FK
        varchar channel
        text subject
        text message
        varchar status "PENDING | SENT | DELIVERED | FAILED | READ"
        int retry_count
        timestamp scheduled_at
        timestamp sent_at
        timestamp read_at
    }
    notification_delivery_logs {
        uuid log_id PK
        uuid notification_id FK
        varchar gateway_name
        varchar gateway_response_id
        varchar status "SENT | FAILED | BOUNCED | DELIVERED"
        jsonb error_payload
    }
    notification_preferences {
        uuid preference_id PK
        varchar user_id "logical FK users"
        varchar notification_type
        varchar channel
        boolean is_enabled
    }
```

---

## 3. core_medical_service_db — Clinical EMR Service

Migration: `backend/service/clinical-emr-service/src/database/migrations/`

### Patients, medical records & examination sessions

```mermaid
erDiagram
    patients ||--o{ medical_history : "history"
    patients ||--o{ medical_records : "has"
    medical_records ||--o{ medical_record_versions : "version"
    medical_records ||--o{ examination_sessions : "examination"
    medical_records ||--o{ dental_charts : "dental chart"
    medical_records ||--o{ record_exports : "export"
    examination_sessions ||--o{ symptoms : "symptom"
    examination_sessions ||--o{ diagnoses : "diagnosis"

    patients {
        uuid patient_id PK
        uuid user_id "logical FK account_service_db.users"
        varchar patient_code UK
        varchar full_name
        date date_of_birth
        varchar gender
        varchar phone
        varchar email
        text address
        varchar emergency_contact
        varchar blood_type "O | A | B | AB"
        text_arr allergies
        text_arr chronic_diseases
        varchar insurance_number
        varchar insurance_provider
    }
    medical_history {
        uuid history_id PK
        uuid patient_id FK
        varchar condition_name
        varchar condition_type "PAST | CURRENT | FAMILY_HISTORY"
        date diagnosed_date
        text treatment
    }
    medical_records {
        uuid record_id PK
        uuid patient_id FK
        uuid appointment_id "logical FK clinic_db.appointments"
        uuid clinic_id "logical FK clinic_db.clinics"
        uuid doctor_id "logical FK"
        date visit_date
        text chief_complaint
        text diagnosis
        text treatment_plan
        varchar record_status "DRAFT | FINALIZED | ARCHIVED"
        varchar record_hash
        timestamp finalized_at
        uuid finalized_by
    }
    medical_record_versions {
        uuid version_id PK
        uuid record_id FK
        int version_number
        jsonb snapshot
        uuid changed_by
        text change_reason
    }
    examination_sessions {
        uuid session_id PK
        uuid record_id FK
        uuid patient_id FK
        uuid doctor_id "logical FK"
        uuid clinic_id "logical FK"
        timestamp session_date
        text chief_complaint
        text physical_examination
        jsonb vital_signs
        varchar status "IN_PROGRESS | COMPLETED | CANCELLED"
    }
    symptoms {
        uuid symptom_id PK
        uuid session_id FK
        uuid patient_id FK
        varchar symptom_name
        varchar body_location
        varchar severity "MILD | MODERATE | SEVERE"
        date onset_date
        uuid recorded_by
    }
    diagnoses {
        uuid diagnosis_id PK
        uuid session_id FK
        varchar icd_code "ICD-10"
        varchar diagnosis_name
        varchar diagnosis_type "PRIMARY | SECONDARY | DIFFERENTIAL"
        varchar severity
    }
    dental_charts {
        uuid chart_id PK
        uuid patient_id FK
        uuid record_id FK
        int tooth_number "1-32"
        varchar tooth_status "HEALTHY | CAVITY | FILLED | MISSING | IMPLANT | ROOT_CANAL"
        jsonb surfaces
    }
    record_exports {
        uuid export_id PK
        uuid patient_id FK
        uuid record_id FK
        varchar export_type "FULL | SUMMARY | DENTAL_CHART"
        varchar export_format "PDF | XML | JSON"
        text file_url
        uuid exported_by
        timestamp expires_at
    }
```

### Treatment, prescriptions, orders & dental imaging

```mermaid
erDiagram
    patients ||--o{ treatment_plans : "has"
    patients ||--o{ treatment_history : "has"
    patients ||--o{ prescriptions : "has"
    patients ||--o{ clinical_orders : "has"
    patients ||--o{ dental_images : "has"
    prescriptions ||--o{ prescription_items : "contains"
    clinical_orders ||--o{ lab_test_results : "result"
    image_categories ||--o{ dental_images : "categorizes"
    dental_images ||--o{ image_annotations : "annotation"
    dental_images ||--o{ pacs_sync_logs : "PACS sync"

    patients {
        uuid patient_id PK
    }
    treatment_plans {
        uuid plan_id PK
        uuid patient_id FK
        uuid record_id FK
        varchar plan_name
        text objectives
        int duration_weeks
        varchar status "ACTIVE | COMPLETED | ABANDONED | ON_HOLD"
        varchar sent_via "EMAIL | SMS | PRINT"
        uuid created_by
    }
    treatment_history {
        uuid treatment_id PK
        uuid record_id FK
        uuid patient_id FK
        date treatment_date
        int_arr tooth_numbers
        varchar procedure_code
        varchar procedure_name
        decimal cost
        varchar status "PLANNED | IN_PROGRESS | COMPLETED | CANCELLED"
        uuid performed_by
    }
    prescriptions {
        uuid prescription_id PK
        uuid record_id FK
        uuid patient_id FK
        uuid doctor_id "logical FK"
        date prescription_date
        varchar status "ACTIVE | FILLED | EXPIRED | CANCELLED"
        uuid digital_signature_id "logical FK account_db.digital_signatures"
    }
    prescription_items {
        uuid item_id PK
        uuid prescription_id FK
        varchar medication_name
        varchar medication_code
        varchar dosage
        varchar route "ORAL | IV | IM | TOPICAL | INHALATION"
        varchar frequency
        int duration_days
        int quantity
    }
    clinical_orders {
        uuid order_id PK
        uuid record_id FK
        uuid patient_id FK
        uuid ordered_by
        varchar order_type "LAB | IMAGING | XRAY | CONE_BEAM_CT"
        varchar test_type
        int_arr teeth_numbers
        varchar urgency "ROUTINE | URGENT | STAT"
        varchar status "ORDERED | SCHEDULED | COMPLETED | CANCELLED | APPROVED"
        text result_url
    }
    lab_test_results {
        uuid result_id PK
        uuid order_id FK
        varchar test_name
        text result_value
        varchar result_unit
        varchar reference_range
        boolean is_abnormal
    }
    image_categories {
        uuid category_id PK
        varchar category_name
    }
    dental_images {
        uuid image_id PK
        uuid patient_id FK
        uuid record_id FK
        uuid category_id FK
        varchar image_type "INTRAORAL | EXTRAORAL | XRAY | CBCT | PHOTO"
        text image_url
        text thumbnail_url
        varchar file_format "JPG | PNG | DICOM"
        int_arr tooth_numbers
        jsonb metadata
        varchar pacs_id
        uuid uploaded_by
        boolean is_archived
    }
    image_annotations {
        uuid annotation_id PK
        uuid image_id FK
        uuid annotated_by
        varchar annotation_type "MEASUREMENT | MARKING | DIAGNOSIS | NOTE"
        jsonb annotation_data
    }
    pacs_sync_logs {
        uuid sync_id PK
        uuid image_id FK
        varchar sync_type "UPLOAD | DOWNLOAD | DELETE | SYNC"
        varchar status "PENDING | SYNCED | FAILED"
    }
```

> Note: migration `1715028537217-CreateUser.ts` also creates a set of legacy boilerplate tables (`user`, `session`, `role`, `status`, `file`) — leftover from the NestJS template, not part of the business domain.

---

## 4. core_clinic_service_db — Clinical EMR Service

Migration: `backend/service/clinical-emr-service/src/database/clinic-migrations/`

### Clinics, services & staff

```mermaid
erDiagram
    clinics ||--o{ treatment_rooms : "has"
    clinics ||--o{ clinic_services : "provides"
    services ||--o{ clinic_services : "is sold"
    service_categories ||--o{ services : "categorizes"
    service_categories ||--o{ service_categories : "parent-child"
    specialties ||--o{ services : "belongs to"
    specialties ||--o{ doctor_specialties : "certification"

    clinics {
        uuid clinic_id PK
        varchar clinic_name
        varchar clinic_code UK
        text address
        varchar city
        varchar phone
        varchar email
        jsonb operating_hours
        varchar status "ACTIVE | INACTIVE | CLOSED"
        varchar license_number
        date license_expiry
    }
    treatment_rooms {
        uuid room_id PK
        uuid clinic_id FK
        varchar room_name
        varchar room_code UK
        varchar room_type "TREATMENT | EXAMINATION | IMAGING | SURGERY"
        int floor_number
        jsonb equipment_list
        varchar status "AVAILABLE | OCCUPIED | MAINTENANCE | CLOSED"
    }
    specialties {
        uuid specialty_id PK
        varchar specialty_name
        varchar specialty_code UK
        boolean is_active
    }
    service_categories {
        uuid category_id PK
        varchar category_name
        uuid parent_category_id FK
        boolean is_active
    }
    services {
        uuid service_id PK
        varchar service_code UK
        varchar service_name
        uuid category_id FK
        uuid specialty_id FK
        int duration_minutes
        decimal base_price
        varchar currency
        boolean is_active
        boolean requires_appointment
    }
    clinic_services {
        uuid clinic_service_id PK
        uuid clinic_id FK
        uuid service_id FK
        decimal custom_price
        boolean is_available
    }
    doctor_specialties {
        uuid doctor_id PK "logical FK, composite PK"
        uuid specialty_id PK
        varchar certification_number
        date certified_date
        boolean is_primary
    }
```

### Work schedules & appointments

```mermaid
erDiagram
    clinics ||--o{ doctor_schedules : "schedules"
    work_shifts ||--o{ doctor_schedules : "by shift"
    treatment_rooms ||--o{ doctor_schedules : "in room"
    doctor_schedules ||--o{ schedule_changes : "change"
    clinics ||--o{ appointments : "at"
    treatment_rooms ||--o{ appointments : "in room"
    services ||--o{ appointments : "service"
    appointments ||--o{ appointment_status_history : "history"
    appointments ||--o{ diagnostic_orders : "order"

    work_shifts {
        uuid shift_id PK
        varchar shift_name
        time start_time
        time end_time
    }
    doctor_schedules {
        uuid schedule_id PK
        uuid doctor_id "logical FK"
        uuid clinic_id FK
        uuid shift_id FK
        date work_date
        uuid room_id FK
        int max_patients
        varchar status "SCHEDULED | CANCELLED | COMPLETED | NO_SHOW"
    }
    schedule_changes {
        uuid change_id PK
        uuid schedule_id FK
        uuid changed_by
        varchar change_type "MODIFY | CANCEL | RESCHEDULE"
        jsonb old_values
        jsonb new_values
        varchar approval_status "PENDING | APPROVED | REJECTED"
    }
    doctor_leaves {
        uuid leave_id PK
        uuid doctor_id "logical FK"
        varchar leave_type "ANNUAL | SICK | MATERNITY | EMERGENCY"
        date start_date
        date end_date
        varchar status "PENDING | APPROVED | REJECTED | CANCELLED"
        uuid approved_by
    }
    appointments {
        uuid appointment_id PK
        varchar appointment_code UK
        uuid patient_id FK "physical FK to medical_db.patients"
        uuid doctor_id "logical FK"
        uuid clinic_id FK
        uuid room_id FK
        uuid service_id FK
        date appointment_date
        time appointment_time
        tsrange during "GENERATED, prevents double-booking"
        int duration_minutes
        varchar appointment_type "CONSULTATION | FOLLOW_UP | TREATMENT | EMERGENCY"
        varchar status "SCHEDULED | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW"
        text chief_complaint
        uuid payment_id "logical FK payment_db.payments"
        varchar payment_status "UNPAID | PENDING | PAID | FAILED | REFUNDED"
        boolean is_outside_hours
        uuid created_by
    }
    appointment_status_history {
        uuid history_id PK
        uuid appointment_id FK
        varchar old_status
        varchar new_status
        uuid changed_by
        text reason
    }
    diagnostic_orders {
        uuid order_id PK
        uuid appointment_id FK
        uuid patient_id "logical FK"
        uuid doctor_id "logical FK"
        varchar order_code UK
        varchar order_type "XRAY | CBCT | CLEANING | LAB"
        varchar priority "ROUTINE | URGENT | STAT"
        varchar status "ORDERED | IN_PROGRESS | COMPLETED | APPROVED | CANCELLED"
        text result_summary
    }
    idempotency_keys {
        varchar idempotency_key PK
        varchar method
        varchar path
        varchar status "IN_PROGRESS | COMPLETED | FAILED"
        int response_status
        jsonb response_body
        timestamp expires_at
    }
```

Notable constraint: `appointments` has an `appt_no_double_booking` constraint — `EXCLUDE (doctor_id WITH =, during WITH &&)` rules out overlapping bookings for the same doctor (except cancelled/no_show statuses).

---

## 5. payment_service_db — Payment Service

Migration: `backend/service/payment-service/src/database/migrations/`

```mermaid
erDiagram
    payments {
        uuid payment_id PK
        uuid appointment_id "logical FK clinic_db.appointments"
        decimal amount
        varchar currency "VND"
        varchar status "PENDING | PAID | FAILED | REFUNDED | CANCELLED"
        varchar provider "vnpay | momo | stripe"
        varchar provider_txn_ref
        text order_info
        decimal refund_amount
        timestamp refunded_at
        timestamp created_at
        timestamp updated_at
    }
```

---

## General notes

- Most tables have `created_at`, `updated_at` (some also have `created_by`, `updated_by` as UUID logical FKs) — omitted from the diagrams for brevity.
- **Logical FK** = a UUID column pointing to a table in another database, with no physical FK constraint (due to database-per-service split). No exceptions: the physical FK `appointments.patient_id → patients` was previously removed (migration `1730000000004-DropAppointmentPatientForeignKey.ts`) because Postgres does not support cross-database FKs; integrity is checked at the application layer (`AppointmentsService.resolveBookingPatientId` → `PatientsService.findOne`).
- The Booking LangGraph service uses PostgreSQL as checkpoint storage for conversation state (tables managed by LangGraph itself, not part of the business schema).
```
