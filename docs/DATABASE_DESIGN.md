# Database Design

> Generated from actual code (TypeORM entities + `database/*/schema.sql` + migrations).
> Source of truth: entity files under `backend/service/*/src/**/entities/`.
> Where the entity and `schema.sql` disagree, the difference is noted explicitly.

## 2.1 Auth Service Database (`auth_service_db`)

Entities: `backend/service/iam-service/src/*/infrastructure/persistence/relational/entities/`

### 01. accounts

Primary key:
- `account_id`: UUID

Foreign keys:
- `account_id` → `account_service_db.users.user_id` (1:1 identity link) (logical, cross-DB)

Attributes:
- `username`: VARCHAR(50) (unique, nullable)
- `email`: VARCHAR(255) (unique, nullable) — entity nullable; `schema.sql` declares NOT NULL (drift)
- `phone`: VARCHAR(20) (unique, nullable)
- `full_name`: VARCHAR(255) (nullable)
- `gender`: SMALLINT (nullable, ISO 5218 code)
- `password_hash`: VARCHAR(60) (nullable) — entity nullable; `schema.sql` declares NOT NULL (drift)
- `role`: VARCHAR(12) (default: `PATIENT`)
- `status`: VARCHAR(11) (default: `ACTIVE`)
- `failed_login_attempts`: INT (default: 0)
- `locked_at`: TIMESTAMP (nullable)
- `locked_reason`: TEXT (nullable)
- `locked_by`: UUID (nullable) — FK → `accounts(account_id)` in `schema.sql` only
- `email_verified`: BOOLEAN (default: false)
- `phone_verified`: BOOLEAN (default: false)
- `last_login_at`: TIMESTAMP (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `created_by`: UUID (nullable)
- `updated_by`: UUID (nullable)

### 02. oauth_connections

Primary key:
- `connection_id`: UUID

Foreign keys:
- `account_id` → `accounts(account_id)` (nullable)

Attributes:
- `provider`: VARCHAR(8)
- `provider_user_id`: VARCHAR(255)
- `access_token`: TEXT (nullable)
- `refresh_token`: TEXT (nullable)
- `token_expires_at`: TIMESTAMP (nullable)
- `is_active`: BOOLEAN (default: true)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `created_by`: UUID (nullable) — in `schema.sql` only, missing from entity
- `updated_by`: UUID (nullable) — in `schema.sql` only, missing from entity

Constraints:
- UNIQUE(`provider`, `provider_user_id`)

### 03. otp_tokens

Primary key:
- `otp_id`: UUID

Foreign keys:
- `account_id` → `accounts(account_id)` (nullable)

Attributes:
- `otp_code`: CHAR(6)
- `otp_type`: VARCHAR(15)
- `expires_at`: TIMESTAMP
- `used_at`: TIMESTAMP (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `created_by`: UUID (nullable) — in `schema.sql` only, missing from entity
- `updated_by`: UUID (nullable) — in `schema.sql` only, missing from entity

### 04. refresh_tokens

Primary key:
- `token_id`: UUID

Foreign keys:
- `account_id` → `accounts(account_id)` (nullable)

Attributes:
- `token_hash`: CHAR(64)
- `expires_at`: TIMESTAMP
- `revoked_at`: TIMESTAMP (nullable)
- `device_info`: TEXT (nullable)
- `ip_address`: VARCHAR(45) (nullable)
- `created_at`: TIMESTAMP

## 2.2 Account Service Database (`account_service_db`)

Entities: `backend/service/iam-service/src/{users,roles,user-roles,permissions,kyc-verifications,audit-logs,notifications}/`

### 01. users

Primary key:
- `user_id`: UUID

Foreign keys:
- `user_id` → `auth_service_db.accounts.account_id` (1:1 identity link) (logical, cross-DB)

Attributes:
- `full_name`: VARCHAR(255)
- `email`: VARCHAR(255) (nullable)
- `phone`: VARCHAR(20) (nullable)
- `date_of_birth`: DATE (nullable)
- `gender`: SMALLINT (nullable, ISO 5218 code)
- `avatar_url`: TEXT (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `created_by`: UUID (nullable)
- `updated_by`: UUID (nullable)
- `is_banned`: BOOLEAN (default: false)
- `banned_at`: TIMESTAMPTZ (nullable)
- `ban_reason`: TEXT (nullable)

### 02. roles

Primary key:
- `role_id`: UUID

Foreign keys: — none

Attributes:
- `role_name`: VARCHAR(12) (unique)
- `description`: TEXT (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `created_by`: UUID (nullable)
- `updated_by`: UUID (nullable)

### 03. user_roles

Primary key:
- `id`: UUID

Foreign keys:
- `user_id` → `users(user_id)`
- `role_id` → `roles(role_id)`

Attributes:
- `assigned_at`: TIMESTAMP
- `assigned_by`: UUID (nullable)

Constraints:
- UNIQUE(`user_id`, `role_id`)

### 04. permissions

Primary key:
- `permission_id`: UUID

Foreign keys: — none

Attributes:
- `permission_name`: VARCHAR(100) (unique)
- `resource`: VARCHAR(50) (nullable) — entity nullable; `schema.sql` declares NOT NULL (drift)
- `action`: VARCHAR(20) (nullable) — entity nullable; `schema.sql` declares NOT NULL (drift)
- `description`: TEXT (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `created_by`: UUID (nullable)
- `updated_by`: UUID (nullable)

### 05. role_permissions

Primary key:
- `id`: UUID

Foreign keys:
- `role_id` → `roles(role_id)`
- `permission_id` → `permissions(permission_id)`

Attributes:
- `assigned_at`: TIMESTAMP
- `assigned_by`: UUID (nullable)

Constraints:
- UNIQUE(`role_id`, `permission_id`)

### 06. kyc_verifications

Primary key:
- `kyc_id`: UUID

Foreign keys:
- `user_id` → `users(user_id)`

Attributes:
- `id_type`: VARCHAR(50)
- `id_number`: VARCHAR(100)
- `full_name`: VARCHAR(255) (nullable)
- `date_of_birth`: DATE (nullable)
- `id_front_image`: TEXT (nullable)
- `id_back_image`: TEXT (nullable)
- `selfie_image`: TEXT (nullable)
- `verification_status`: VARCHAR(14) (entity default: `PENDING_REVIEW`; DB column default is still `pending` — migration never altered it; values: NOT_SUBMITTED, PENDING_REVIEW, VERIFIED, REJECTED)
- `ocr_status`: VARCHAR(10) (default: `PENDING`; values: PENDING, PROCESSING, SKIPPED, COMPLETED, FAILED)
- `ocr_confidence`: INT (nullable)
- `ocr_payload`: JSONB (nullable)
- `ocr_attempts`: INT (default: 0)
- `ocr_last_error`: TEXT (nullable)
- `ocr_processed_at`: TIMESTAMP (nullable)
- `document_hash`: CHAR(64) (nullable)
- `notes`: TEXT (nullable)
- `admin_notes`: TEXT (nullable)
- `rejection_reason`: TEXT (nullable)
- `submitted_at`: TIMESTAMP (nullable)
- `verified_at`: TIMESTAMP (nullable)
- `verified_by`: UUID (nullable)
- `decision_source`: VARCHAR(6) (nullable; values: AUTO, MANUAL)
- `decision_reason`: TEXT (nullable)
- `consent_version`: VARCHAR(50) (nullable)
- `consent_accepted_at`: TIMESTAMP (nullable)
- `document_storage_consent_accepted_at`: TIMESTAMP (nullable)
- `ocr_processing_consent_accepted_at`: TIMESTAMP (nullable)
- `no_marketing_consent_accepted_at`: TIMESTAMP (nullable)
- `processing_purpose`: VARCHAR(100) (default: `identity_verification_and_booking_safety`)
- `retention_policy_version`: VARCHAR(50) (nullable)
- `retention_expires_at`: TIMESTAMP (nullable)
- `deleted_at`: TIMESTAMP (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `created_by`: UUID (nullable)
- `updated_by`: UUID (nullable)

> Note: the OCR / consent / retention / decision columns were added by migrations
> (`1700000001000-EnhanceKycVerifications`, `1700000002000-HardenKycPrivacy`,
> `1700000003000-AddKycDecisionMetadata`) and are not yet reflected in
> `database/iam-service/user-service/schema.sql`.

### 07. audit_logs

Primary key:
- `log_id`: UUID

Foreign keys:
- `user_id` → `users(user_id)` (nullable)

Attributes:
- `action`: VARCHAR(100)
- `resource`: VARCHAR(100)
- `resource_id`: UUID (nullable)
- `ip_address`: VARCHAR(45) (nullable)
- `user_agent`: TEXT (nullable)
- `details`: JSONB (nullable)
- `created_at`: TIMESTAMP

### 08. notification_templates

Primary key:
- `template_id`: UUID

Foreign keys: — none

Attributes:
- `template_code`: VARCHAR(100) (unique)
- `name`: VARCHAR(255)
- `description`: TEXT (nullable)
- `subject_template`: TEXT (nullable)
- `body_template`: TEXT
- `channel`: VARCHAR(5)
- `is_active`: BOOLEAN (default: true)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 09. notifications

Primary key:
- `notification_id`: UUID

Foreign keys:
- `template_id` → `notification_templates(template_id)` (nullable)

Attributes:
- `recipient_id`: UUID
- `notification_type`: VARCHAR(50) (nullable)
- `channel`: VARCHAR(5)
- `subject`: VARCHAR(255) (nullable)
- `message`: TEXT
- `related_entity_id`: UUID (nullable)
- `related_entity_type`: VARCHAR(50) (nullable)
- `scheduled_at`: TIMESTAMP
- `sent_at`: TIMESTAMP (nullable)
- `read_at`: TIMESTAMP (nullable)
- `status`: VARCHAR(9) (default: `pending`)
- `retry_count`: INT (default: 0)
- `max_retries`: INT (default: 3)
- `next_retry_at`: TIMESTAMP (nullable)
- `error_message`: TEXT (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 10. notification_preferences

Primary key:
- `preference_id`: UUID

Foreign keys:
- `user_id` → `users(user_id)`

Attributes:
- `user_id`: UUID
- `notification_type`: VARCHAR(50)
- `channel`: VARCHAR(5)
- `is_enabled`: BOOLEAN (default: true)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

Constraints:
- UNIQUE(`user_id`, `notification_type`, `channel`)

### 11. notification_delivery_logs

Primary key:
- `log_id`: UUID

Foreign keys:
- `notification_id` → `notifications(notification_id)` (nullable, ON DELETE CASCADE)

Attributes:
- `gateway_name`: VARCHAR(100) (nullable)
- `gateway_response_id`: VARCHAR(255) (nullable)
- `status`: VARCHAR(20) (nullable)
- `error_payload`: JSONB (nullable)
- `created_at`: TIMESTAMP

### 12. digital_signatures

> No TypeORM entity — table defined only in migration
> `1700000000000-CreateUserServiceTables.ts` and `schema.sql`.

Primary key:
- `signature_id`: UUID

Foreign keys:
- `user_id` → `users(user_id)` (ON DELETE CASCADE)

Attributes:
- `signature_data`: TEXT
- `certificate_url`: TEXT (nullable)
- `status`: VARCHAR(20) (default: `ACTIVE`)
- `expires_at`: TIMESTAMP (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `created_by`: UUID (nullable)
- `updated_by`: UUID (nullable)

### 13. phone_verifications

> No TypeORM entity — table defined only in migration
> `1700000000000-CreateUserServiceTables.ts` and `schema.sql`.

Primary key:
- `verification_id`: UUID

Foreign keys:
- `user_id` → `users(user_id)` (ON DELETE CASCADE)

Attributes:
- `phone`: VARCHAR(20)
- `verified_at`: TIMESTAMP (nullable)
- `is_verified`: BOOLEAN (default: false)
- `created_at`: TIMESTAMP

## 2.3 Core Clinic Service Database (`core_clinic_service_db`)

Entities: `backend/service/clinical-emr-service/src/`

Custom type: `clinic_room_type` — PostgreSQL ENUM (`examination`, `surgery`, `imaging`).

### 01. clinics

Primary key:
- `clinic_id`: UUID

Foreign keys: — none

Attributes:
- `clinic_name`: VARCHAR(255)
- `clinic_code`: VARCHAR(50) (unique)
- `address`: TEXT
- `ward`: VARCHAR(100) (nullable)
- `district`: VARCHAR(100) (nullable)
- `city`: VARCHAR(100) (nullable)
- `phone`: VARCHAR(20) (nullable)
- `email`: VARCHAR(255) (nullable)
- `website`: VARCHAR(255) (nullable)
- `logo_url`: TEXT (nullable)
- `operating_hours`: JSONB (nullable)
- `status`: VARCHAR(11) (default: `ACTIVE`)
- `license_number`: VARCHAR(100) (nullable)
- `license_expiry`: DATE (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 02. treatment_rooms

Primary key:
- `room_id`: UUID

Foreign keys:
- `clinic_id` → `clinics(clinic_id)`

Attributes:
- `room_name`: VARCHAR(100)
- `room_code`: VARCHAR(50)
- `room_type`: `clinic_room_type` ENUM
- `floor_number`: INT (nullable)
- `equipment_list`: JSONB (nullable)
- `status`: VARCHAR(11) (default: `AVAILABLE`)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

Constraints:
- UNIQUE(`clinic_id`, `room_code`)

### 03. work_shifts

Primary key:
- `shift_id`: UUID

Foreign keys: — none

Attributes:
- `shift_name`: VARCHAR(100)
- `start_time`: TIME
- `end_time`: TIME
- `description`: TEXT (nullable)
- `created_at`: TIMESTAMP

### 04. specialties

Primary key:
- `specialty_id`: UUID

Foreign keys: — none

Attributes:
- `specialty_name`: VARCHAR(255)
- `specialty_code`: VARCHAR(50) (unique)
- `description`: TEXT (nullable)
- `icon_url`: TEXT (nullable)
- `is_active`: BOOLEAN (default: true)
- `display_order`: INT (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 05. doctor_specialties

Primary key (composite):
- `doctor_id`: UUID
- `specialty_id`: UUID

Foreign keys:
- `specialty_id` → `specialties(specialty_id)`
- `doctor_id` → `account_service_db.users.user_id` (logical, cross-DB)

Attributes:
- `certification_number`: VARCHAR(100) (nullable)
- `certified_date`: DATE (nullable)
- `is_primary`: BOOLEAN (default: false)
- `created_at`: TIMESTAMP

### 06. doctor_leaves

Primary key:
- `leave_id`: UUID

Foreign keys:
- `doctor_id` → `account_service_db.users.user_id` (logical, cross-DB)

Attributes:
- `leave_type`: VARCHAR(9) (nullable)
- `start_date`: DATE
- `end_date`: DATE
- `reason`: TEXT (nullable)
- `status`: VARCHAR(8) (default: `pending`)
- `approved_by`: UUID (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 07. doctor_schedules

Primary key:
- `schedule_id`: UUID

Foreign keys:
- `clinic_id` → `clinics(clinic_id)`
- `shift_id` → `work_shifts(shift_id)` (nullable)
- `room_id` → `treatment_rooms(room_id)` (nullable)
- `doctor_id` → `account_service_db.users.user_id` (logical, cross-DB)

Attributes:
- `work_date`: DATE
- `max_patients`: INT (default: 20)
- `status`: VARCHAR(9) (default: `scheduled`)
- `notes`: TEXT (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

Constraints:
- UNIQUE(`doctor_id`, `work_date`, `shift_id`)

### 08. schedule_changes

Primary key:
- `change_id`: UUID

Foreign keys:
- `schedule_id` → `doctor_schedules(schedule_id)`

Attributes:
- `changed_by`: UUID
- `change_type`: VARCHAR(14)
- `old_values`: JSONB (nullable)
- `new_values`: JSONB (nullable)
- `reason`: TEXT (nullable)
- `approved_by`: UUID (nullable)
- `approval_status`: VARCHAR(8) (default: `pending`)
- `created_at`: TIMESTAMP

### 09. service_categories

Primary key:
- `category_id`: UUID

Foreign keys:
- `parent_category_id` → `service_categories(category_id)`

Attributes:
- `category_name`: VARCHAR(255)
- `description`: TEXT (nullable)
- `is_active`: BOOLEAN (default: true)
- `display_order`: INT (nullable)
- `created_at`: TIMESTAMP

### 10. services

Primary key:
- `service_id`: UUID

Foreign keys:
- `category_id` → `service_categories(category_id)`
- `specialty_id` → `specialties(specialty_id)`

Attributes:
- `service_code`: VARCHAR(50) (unique)
- `service_name`: VARCHAR(255)
- `description`: TEXT (nullable)
- `duration_minutes`: INT (default: 30)
- `required_room_type`: `clinic_room_type` ENUM
- `base_price`: DECIMAL(10,2) (nullable)
- `currency`: CHAR(3) (default: `VND`)
- `is_active`: BOOLEAN (default: true)
- `requires_appointment`: BOOLEAN (default: true)
- `preparation_instructions`: TEXT (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 11. clinic_services

Primary key:
- `clinic_service_id`: UUID

Foreign keys:
- `clinic_id` → `clinics(clinic_id)`
- `service_id` → `services(service_id)`

Attributes:
- `custom_price`: DECIMAL(10,2) (nullable)
- `is_available`: BOOLEAN (default: true)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

Constraints:
- UNIQUE(`clinic_id`, `service_id`)

### 12. appointments

Primary key:
- `appointment_id`: UUID

Foreign keys:
- `clinic_id` → `clinics(clinic_id)`
- `room_id` → `treatment_rooms(room_id)` (nullable)
- `service_id` → `services(service_id)` (nullable)
- `patient_id` → `core_medical_service_db.patients.patient_id` (logical, cross-DB)
- `doctor_id` → `account_service_db.users.user_id` (logical, cross-DB)
- `payment_id` → `payment_service_db.payments.payment_id` (logical, cross-DB)

Attributes:
- `appointment_code`: VARCHAR(50) (unique)
- `appointment_date`: DATE
- `appointment_time`: TIME
- `duration_minutes`: INT (default: 30)
- `appointment_type`: VARCHAR(12) (nullable)
- `status`: VARCHAR(11) (default: `scheduled`)
- `chief_complaint`: TEXT (nullable)
- `notes`: TEXT (nullable)
- `session_id`: UUID (nullable)
- `treatment_plan_id`: UUID (nullable)
- `cancellation_reason`: TEXT (nullable)
- `cancelled_by`: UUID (nullable)
- `cancelled_at`: TIMESTAMP (nullable)
- `is_outside_hours`: BOOLEAN (default: false)
- `outside_hours_reason`: TEXT (nullable)
- `approved_by`: UUID (nullable)
- `payment_status`: VARCHAR(14) (default: `unpaid`)
- `created_by`: UUID
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `occupied_during`: TSRANGE (generated) — defined in `schema.sql` only, not mapped in the entity

Constraints (schema.sql only):
- EXCLUDE USING GIST — no overlapping `occupied_during` per doctor, per patient, per room (3 constraints)

### 13. appointment_status_history

Primary key:
- `history_id`: UUID

Foreign keys:
- `appointment_id` → `appointments(appointment_id)`

Attributes:
- `old_status`: VARCHAR(11) (nullable)
- `new_status`: VARCHAR(11) (nullable)
- `changed_by`: UUID
- `reason`: TEXT (nullable)
- `created_at`: TIMESTAMP

### 14. appointment_reminder_preferences

Primary key:
- `preference_id`: UUID

Foreign keys:
- `patient_id` → `core_medical_service_db.patients.patient_id` (logical, cross-DB)

Attributes:
- `channel`: VARCHAR(5) (default: `APP`)
- `enabled`: BOOLEAN (default: true)
- `reminder_minutes_before`: INT (default: 1440)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

Constraints:
- UNIQUE(`patient_id`, `channel`)

### 15. appointment_notification_logs

Primary key:
- `log_id`: UUID

Foreign keys:
- `appointment_id` → `appointments(appointment_id)`

Attributes:
- `notification_type`: VARCHAR(50)
- `channel`: VARCHAR(5) (default: `APP`)
- `status`: VARCHAR(20)
- `attempt_count`: INT (default: 0)
- `notification_id`: VARCHAR(100) (nullable)
- `preference_enabled`: BOOLEAN (nullable)
- `reminder_minutes_before`: INT (nullable)
- `last_attempt_at`: TIMESTAMP (nullable)
- `next_retry_at`: TIMESTAMP (nullable)
- `error_message`: TEXT (nullable)
- `read_at`: TIMESTAMP (nullable)
- `responded_at`: TIMESTAMP (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 16. diagnostic_orders

Primary key:
- `order_id`: UUID

Foreign keys:
- `appointment_id` → `appointments(appointment_id)`
- `patient_id` → `core_medical_service_db.patients.patient_id` (logical, cross-DB)
- `doctor_id` → `account_service_db.users.user_id` (logical, cross-DB)

Attributes:
- `order_code`: VARCHAR(50) (unique)
- `order_type`: VARCHAR(50) — entity 50; `schema.sql` 13 (drift)
- `description`: TEXT (nullable)
- `priority`: VARCHAR(20) (default: `routine`) — entity 20; `schema.sql` 7 (drift)
- `tooth_number`: VARCHAR(10) (nullable)
- `area`: VARCHAR(100) (nullable)
- `status`: VARCHAR(20) (default: `ordered`) — entity 20; `schema.sql` 11 (drift)
- `result_summary`: TEXT (nullable)
- `result_attachment_url`: TEXT (nullable)
- `notes`: TEXT (nullable)
- `ordered_at`: TIMESTAMP (nullable)
- `completed_at`: TIMESTAMP (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 17. idempotency_keys

Primary key:
- `idempotency_key`: VARCHAR(255)

Foreign keys: — none

Attributes:
- `method`: VARCHAR(7)
- `path`: VARCHAR(512)
- `status`: VARCHAR(11) (default: `in_progress`)
- `response_status`: INT (nullable)
- `response_body`: JSONB (nullable)
- `created_at`: TIMESTAMP
- `expires_at`: TIMESTAMP

## 2.4 Core Medical Service Database (`core_medical_service_db`)

Entities: `backend/service/clinical-emr-service/src/`

### 01. patients

Primary key:
- `patient_id`: UUID

Foreign keys:
- `user_id` → `account_service_db.users.user_id` (logical, cross-DB)

Attributes:
- `patient_code`: VARCHAR(50) (unique)
- `full_name`: VARCHAR(255)
- `date_of_birth`: DATE (nullable)
- `gender`: SMALLINT (nullable, ISO 5218 code)
- `phone`: VARCHAR(20) (nullable)
- `email`: VARCHAR(255) (nullable)
- `address`: TEXT (nullable)
- `ward`: VARCHAR(100) (nullable)
- `district`: VARCHAR(100) (nullable)
- `city`: VARCHAR(100) (nullable)
- `emergency_contact`: VARCHAR(255) (nullable)
- `emergency_phone`: VARCHAR(20) (nullable)
- `allergies`: TEXT[] (nullable)
- `chronic_diseases`: TEXT[] (nullable)
- `insurance_number`: VARCHAR(100) (nullable)
- `insurance_provider`: VARCHAR(255) (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

> Note: `blood_type` was dropped by migration `1784500000000-GenderToSmallintDropBloodType`.

### 02. patient_representatives

Primary key:
- `representative_id`: UUID

Foreign keys:
- `patient_id` → `patients(patient_id)`

Attributes:
- `full_name`: VARCHAR(255)
- `relationship`: VARCHAR(100)
- `phone`: VARCHAR(20)
- `email`: VARCHAR(255) (nullable)
- `legal_document_type`: VARCHAR(50) (nullable)
- `legal_document_number`: VARCHAR(100) (nullable)
- `is_primary`: BOOLEAN (default: false)
- `is_active`: BOOLEAN (default: true)
- `authorized_for_treatment`: BOOLEAN (default: false)
- `authorized_for_payment`: BOOLEAN (default: false)
- `authorized_for_records`: BOOLEAN (default: false)
- `verified_at`: TIMESTAMP (nullable)
- `verified_by`: UUID (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 03. medical_history

Primary key:
- `history_id`: UUID

Foreign keys:
- `patient_id` → `patients(patient_id)`

Attributes:
- `condition_name`: VARCHAR(255)
- `condition_type`: VARCHAR(50) (nullable)
- `diagnosed_date`: DATE (nullable)
- `treatment`: TEXT (nullable)
- `notes`: TEXT (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 04. medical_records

Primary key:
- `record_id`: UUID

Foreign keys:
- `patient_id` → `patients(patient_id)`
- `appointment_id` → `core_clinic_service_db.appointments.appointment_id` (logical, cross-DB)
- `clinic_id` → `core_clinic_service_db.clinics.clinic_id` (logical, cross-DB)
- `doctor_id` → `account_service_db.users.user_id` (logical, cross-DB)

Attributes:
- `visit_date`: DATE
- `chief_complaint`: TEXT (nullable)
- `diagnosis`: TEXT (nullable)
- `treatment_plan`: TEXT (nullable)
- `notes`: TEXT (nullable)
- `record_status`: VARCHAR(9) (default: `draft`)
- `record_hash`: VARCHAR(255) (nullable)
- `finalized_at`: TIMESTAMP (nullable)
- `finalized_by`: UUID (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 05. medical_record_versions

Primary key:
- `version_id`: UUID

Foreign keys:
- `record_id` → `medical_records(record_id)`

Attributes:
- `version_number`: INT
- `snapshot`: JSONB
- `changed_by`: UUID
- `change_reason`: TEXT (nullable)
- `created_at`: TIMESTAMP

### 06. examination_sessions

Primary key:
- `session_id`: UUID

Foreign keys:
- `record_id` → `medical_records(record_id)` (nullable)
- `patient_id` → `patients(patient_id)` (nullable)
- `doctor_id` → `account_service_db.users.user_id` (logical, cross-DB)
- `clinic_id` → `core_clinic_service_db.clinics.clinic_id` (logical, cross-DB)

Attributes:
- `appointment_id`: UUID (nullable)
- `session_date`: TIMESTAMP (default: now)
- `chief_complaint`: TEXT (nullable)
- `present_illness`: TEXT (nullable)
- `physical_examination`: TEXT (nullable)
- `vital_signs`: JSONB (nullable)
- `status`: VARCHAR(20) (default: `in_progress`)
- `started_at`: TIMESTAMP (default: now)
- `completed_at`: TIMESTAMP (nullable)
- `signed_at`: TIMESTAMP (nullable)
- `signed_by`: UUID (nullable)
- `created_at`: TIMESTAMP

### 07. examination_session_amendments

Primary key:
- `amendment_id`: UUID

Foreign keys:
- `session_id` → `examination_sessions(session_id)`
- `record_id` → `medical_records(record_id)`
- `patient_id` → `patients(patient_id)` (nullable, ON DELETE SET NULL — FK in `schema.sql` only)

Attributes:
- `doctor_id`: UUID
- `amendment_reason`: TEXT
- `amendment_text`: TEXT
- `amended_by`: UUID
- `created_at`: TIMESTAMP

### 08. diagnoses

Primary key:
- `diagnosis_id`: UUID

Foreign keys:
- `session_id` → `examination_sessions(session_id)`

Attributes:
- `icd_code`: VARCHAR(20) (nullable)
- `diagnosis_name`: VARCHAR(255)
- `diagnosis_type`: VARCHAR(50) (nullable)
- `severity`: VARCHAR(8) (nullable)
- `notes`: TEXT (nullable)
- `created_at`: TIMESTAMP

### 09. symptoms

Primary key:
- `symptom_id`: UUID

Foreign keys:
- `session_id` → `examination_sessions(session_id)` (nullable)
- `patient_id` → `patients(patient_id)` (nullable)

Attributes:
- `symptom_name`: VARCHAR(255)
- `body_location`: VARCHAR(100) (nullable)
- `severity`: VARCHAR(8) (nullable)
- `onset_date`: DATE (nullable)
- `duration`: VARCHAR(100) (nullable)
- `description`: TEXT (nullable)
- `recorded_by`: UUID
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 10. clinical_orders

Primary key:
- `order_id`: UUID

Foreign keys:
- `session_id` → `examination_sessions(session_id)` (nullable)
- `record_id` → `medical_records(record_id)` (nullable)
- `patient_id` → `patients(patient_id)`

Attributes:
- `ordered_by`: UUID
- `order_type`: VARCHAR(13)
- `test_type`: VARCHAR(100)
- `clinical_indication`: TEXT (nullable)
- `teeth_numbers`: INT[] (nullable)
- `urgency`: VARCHAR(7) (default: `routine`)
- `status`: VARCHAR(11) (default: `ordered`)
- `ordered_date`: TIMESTAMP (default: now)
- `scheduled_date`: TIMESTAMP (nullable)
- `completed_date`: TIMESTAMP (nullable)
- `result_url`: TEXT (nullable)
- `report`: TEXT (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 11. lab_test_results

Primary key:
- `result_id`: UUID

Foreign keys:
- `order_id` → `clinical_orders(order_id)`

Attributes:
- `test_name`: VARCHAR(255)
- `result_value`: TEXT (nullable)
- `result_unit`: VARCHAR(50) (nullable)
- `reference_range`: VARCHAR(100) (nullable)
- `is_abnormal`: BOOLEAN (default: false)
- `notes`: TEXT (nullable)
- `created_at`: TIMESTAMP

### 12. prescriptions

Primary key:
- `prescription_id`: UUID

Foreign keys:
- `session_id` → `examination_sessions(session_id)` (nullable)
- `record_id` → `medical_records(record_id)` (nullable)
- `patient_id` → `patients(patient_id)`
- `doctor_id` → `account_service_db.users.user_id` (logical, cross-DB)

Attributes:
- `prescription_date`: DATE (default: now)
- `status`: VARCHAR(9) (default: `draft`)
- `notes`: TEXT (nullable)
- `digital_signature_id`: UUID (nullable)
- `issued_at`: TIMESTAMP (nullable)
- `issued_by`: UUID (nullable)
- `minor_patient_at_issue`: BOOLEAN (nullable)
- `patient_age_years_at_issue`: INT (nullable)
- `patient_age_months_at_issue`: INT (nullable)
- `representative_id_snapshot`: UUID (nullable)
- `representative_name_snapshot`: VARCHAR(255) (nullable)
- `representative_relationship_snapshot`: VARCHAR(100) (nullable)
- `representative_phone_snapshot`: VARCHAR(20) (nullable)
- `cancelled_at`: TIMESTAMP (nullable)
- `cancellation_reason`: TEXT (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 13. prescription_items

Primary key:
- `item_id`: UUID

Foreign keys:
- `prescription_id` → `prescriptions(prescription_id)`

Attributes:
- `medication_name`: VARCHAR(255)
- `medication_code`: VARCHAR(50) (nullable)
- `dosage`: VARCHAR(100)
- `route`: VARCHAR(50) (nullable)
- `frequency`: VARCHAR(100)
- `duration_days`: INT (nullable)
- `quantity`: INT (nullable)
- `instructions`: TEXT (nullable)
- `created_at`: TIMESTAMP

### 14. treatment_plans

Primary key:
- `plan_id`: UUID

Foreign keys:
- `session_id` → `examination_sessions(session_id)` (nullable)
- `patient_id` → `patients(patient_id)`
- `record_id` → `medical_records(record_id)` (nullable)
- `accepted_representative_id` → `patient_representatives(representative_id)` (nullable, FK in `schema.sql` only)

Attributes:
- `plan_name`: VARCHAR(255) (nullable)
- `objectives`: TEXT (nullable)
- `duration_weeks`: INT (nullable)
- `status`: VARCHAR(18) (default: `draft`)
- `estimated_cost`: DECIMAL(12,2) (nullable)
- `quote_currency`: CHAR(3) (nullable)
- `quote_version`: VARCHAR(100) (nullable)
- `risk_disclosure`: TEXT (nullable)
- `alternative_options`: TEXT (nullable)
- `sent_at`: TIMESTAMP (nullable)
- `sent_to`: UUID (nullable)
- `sent_via`: VARCHAR(20) (nullable)
- `confirmed_at`: TIMESTAMP (nullable)
- `proposed_at`: TIMESTAMP (nullable)
- `accepted_at`: TIMESTAMP (nullable)
- `accepted_by`: UUID (nullable)
- `declined_at`: TIMESTAMP (nullable)
- `declined_by`: UUID (nullable)
- `decline_reason`: TEXT (nullable)
- `acceptance_scope`: VARCHAR(7) (nullable)
- `accepted_scope_note`: TEXT (nullable)
- `accepted_representative_name`: VARCHAR(255) (nullable)
- `accepted_representative_relationship`: VARCHAR(100) (nullable)
- `accepted_representative_phone`: VARCHAR(20) (nullable)
- `created_by`: UUID
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 15. treatment_history

Primary key:
- `treatment_id`: UUID

Foreign keys:
- `record_id` → `medical_records(record_id)`
- `patient_id` → `patients(patient_id)`

Attributes:
- `treatment_date`: DATE
- `tooth_numbers`: INT[] (nullable)
- `procedure_code`: VARCHAR(50) (nullable)
- `procedure_name`: VARCHAR(255)
- `description`: TEXT (nullable)
- `cost`: DECIMAL(10,2) (nullable)
- `status`: VARCHAR(20) (default: `completed`)
- `performed_by`: UUID
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 16. dental_charts

Primary key:
- `chart_id`: UUID

Foreign keys:
- `patient_id` → `patients(patient_id)`
- `record_id` → `medical_records(record_id)`

Attributes:
- `tooth_number`: INT
- `tooth_status`: VARCHAR(50) (nullable)
- `surfaces`: JSONB (nullable)
- `notes`: TEXT (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

Constraints:
- UNIQUE(`record_id`, `tooth_number`)

### 17. image_categories

Primary key:
- `category_id`: UUID

Foreign keys: — none

Attributes:
- `category_name`: VARCHAR(100)
- `description`: TEXT (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 18. dental_images

Primary key:
- `image_id`: UUID

Foreign keys:
- `patient_id` → `patients(patient_id)`
- `record_id` → `medical_records(record_id)`
- `category_id` → `image_categories(category_id)`

Attributes:
- `image_type`: VARCHAR(50)
- `image_url`: TEXT
- `thumbnail_url`: TEXT (nullable)
- `file_size_kb`: INT (nullable)
- `file_format`: VARCHAR(10) (nullable)
- `tooth_numbers`: INT[] (nullable)
- `view_angle`: VARCHAR(50) (nullable)
- `description`: TEXT (nullable)
- `tags`: TEXT[] (nullable)
- `metadata`: JSONB (nullable)
- `pacs_id`: VARCHAR(255) (nullable)
- `taken_date`: DATE (nullable)
- `taken_by`: UUID (nullable)
- `uploaded_by`: UUID
- `is_archived`: BOOLEAN (default: false)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 19. image_annotations

Primary key:
- `annotation_id`: UUID

Foreign keys:
- `image_id` → `dental_images(image_id)`

Attributes:
- `annotated_by`: UUID
- `annotation_type`: VARCHAR(50) (nullable)
- `annotation_data`: JSONB (nullable)
- `note`: TEXT (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 20. pacs_sync_logs

Primary key:
- `sync_id`: UUID

Foreign keys:
- `image_id` → `dental_images(image_id)`

Attributes:
- `sync_type`: VARCHAR(50) (nullable)
- `pacs_server`: VARCHAR(255) (nullable)
- `status`: VARCHAR(20) (nullable)
- `error_message`: TEXT (nullable)
- `synced_at`: TIMESTAMP (default: now)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 21. record_exports

Primary key:
- `export_id`: UUID

Foreign keys:
- `patient_id` → `patients(patient_id)`
- `record_id` → `medical_records(record_id)`

Attributes:
- `export_type`: VARCHAR(50) (nullable)
- `export_format`: VARCHAR(20) (nullable)
- `file_url`: TEXT (nullable)
- `exported_by`: UUID
- `expires_at`: TIMESTAMP (nullable)
- `created_at`: TIMESTAMP

## 2.5 Payment Service Database (`payment_service_db`)

Entity: `backend/service/payment-service/src/payments/entities/payment.entity.ts`

### 01. payments

Primary key:
- `payment_id`: UUID

Foreign keys:
- `appointment_id` → `core_clinic_service_db.appointments.appointment_id` (logical, cross-DB)

Attributes:
- `amount`: NUMERIC(12,2)
- `currency`: CHAR(3) (default: `VND`)
- `status`: VARCHAR(8) (default: `pending`; values: pending, paid, failed, refunded)
- `provider`: VARCHAR(30) (default: `vnpay`)
- `provider_txn_ref`: VARCHAR(100) (nullable)
- `order_info`: TEXT (nullable)
- `refund_amount`: NUMERIC(12,2) (nullable)
- `refunded_at`: TIMESTAMP (nullable)
- `refund_status`: VARCHAR(12) (nullable; REQUESTED → UNDER_REVIEW → APPROVED → REFUNDING → REFUNDED | REJECTED)
- `refund_reason`: TEXT (nullable)
- `refund_requested_by`: UUID (nullable)
- `refund_requested_at`: TIMESTAMP (nullable)
- `refund_reviewed_by`: UUID (nullable)
- `refund_reviewed_at`: TIMESTAMP (nullable)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
