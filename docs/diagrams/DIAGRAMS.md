# S.M.I.L.E — SRS diagrams

<!-- GENERATED — python3 scripts/diagrams/gen_mermaid.py -->

Rendered inline by GitHub. The PlantUML copies in this folder are the same
diagrams for the Word report; regenerate both with `make diagrams`.

## Entity relationship — overview

All 57 tables across the five service databases, primary keys only.
Solid links are enforced foreign keys; the cross-database ones are logical
references, since each service owns its own database.

```mermaid
erDiagram
  accounts ||--o{ oauth_connections : "account_id"
  accounts ||--o{ refresh_tokens : "account_id"
  accounts ||--o{ otp_tokens : "account_id"
  accounts ||--o{ users : "user_id"
  roles ||--o{ role_permissions : "role_id"
  permissions ||--o{ role_permissions : "permission_id"
  users ||--o{ user_roles : "user_id"
  roles ||--o{ user_roles : "role_id"
  users ||--o{ phone_verifications : "user_id"
  users ||--o{ kyc_verifications : "user_id"
  users ||--o{ kyc_verifications : "verified_by"
  users ||--o{ audit_logs : "user_id"
  users ||--o{ notification_preferences : "user_id"
  users ||--o{ notifications : "recipient_id"
  notification_templates ||--o{ notifications : "template_id"
  notifications ||--o{ notification_delivery_logs : "notification_id"
  users ||--o{ notification_push_subscriptions : "user_id"
  users ||--o{ patients : "user_id"
  patients ||--o{ patient_representatives : "patient_id"
  patients ||--o{ medical_history : "patient_id"
  patients ||--o{ medical_records : "patient_id"
  appointments ||--o{ medical_records : "appointment_id"
  clinics ||--o{ medical_records : "clinic_id"
  users ||--o{ medical_records : "doctor_id"
  medical_records ||--o{ medical_record_versions : "record_id"
  patients ||--o{ record_exports : "patient_id"
  medical_records ||--o{ record_exports : "record_id"
  appointments ||--o{ examination_sessions : "appointment_id"
  medical_records ||--o{ examination_sessions : "record_id"
  patients ||--o{ examination_sessions : "patient_id"
  users ||--o{ examination_sessions : "doctor_id"
  clinics ||--o{ examination_sessions : "clinic_id"
  examination_sessions ||--o{ examination_session_amendments : "session_id"
  medical_records ||--o{ examination_session_amendments : "record_id"
  patients ||--o{ examination_session_amendments : "patient_id"
  examination_sessions ||--o{ symptoms : "session_id"
  patients ||--o{ symptoms : "patient_id"
  examination_sessions ||--o{ diagnoses : "session_id"
  patients ||--o{ dental_charts : "patient_id"
  medical_records ||--o{ dental_charts : "record_id"
  patients ||--o{ dental_images : "patient_id"
  medical_records ||--o{ dental_images : "record_id"
  image_categories ||--o{ dental_images : "category_id"
  dental_images ||--o{ image_annotations : "image_id"
  dental_images ||--o{ pacs_sync_logs : "image_id"
  examination_sessions ||--o{ clinical_orders : "session_id"
  medical_records ||--o{ clinical_orders : "record_id"
  patients ||--o{ clinical_orders : "patient_id"
  clinical_orders ||--o{ lab_test_results : "order_id"
  examination_sessions ||--o{ treatment_plans : "session_id"
  patients ||--o{ treatment_plans : "patient_id"
  medical_records ||--o{ treatment_plans : "record_id"
  patient_representatives ||--o{ treatment_plans : "accepted_representative_id"
  medical_records ||--o{ treatment_history : "record_id"
  patients ||--o{ treatment_history : "patient_id"
  examination_sessions ||--o{ prescriptions : "session_id"
  medical_records ||--o{ prescriptions : "record_id"
  patients ||--o{ prescriptions : "patient_id"
  prescriptions ||--o{ prescription_items : "prescription_id"
  clinics ||--o{ treatment_rooms : "clinic_id"
  users ||--o{ doctor_specialties : "doctor_id"
  specialties ||--o{ doctor_specialties : "specialty_id"
  clinics ||--o{ clinic_specialties : "clinic_id"
  specialties ||--o{ clinic_specialties : "specialty_id"
  service_categories ||--o{ services : "category_id"
  specialties ||--o{ services : "specialty_id"
  clinics ||--o{ clinic_services : "clinic_id"
  services ||--o{ clinic_services : "service_id"
  users ||--o{ doctor_schedules : "doctor_id"
  clinics ||--o{ doctor_schedules : "clinic_id"
  work_shifts ||--o{ doctor_schedules : "shift_id"
  treatment_rooms ||--o{ doctor_schedules : "room_id"
  users ||--o{ doctor_leaves : "doctor_id"
  doctor_schedules ||--o{ schedule_changes : "schedule_id"
  patients ||--o{ appointments : "patient_id"
  users ||--o{ appointments : "doctor_id"
  clinics ||--o{ appointments : "clinic_id"
  treatment_rooms ||--o{ appointments : "room_id"
  services ||--o{ appointments : "service_id"
  appointments ||--o{ appointment_status_history : "appointment_id"
  appointments ||--o{ appointment_notification_logs : "appointment_id"
  appointments ||--o{ diagnostic_orders : "appointment_id"
  patients ||--o{ diagnostic_orders : "patient_id"
  users ||--o{ diagnostic_orders : "doctor_id"
  appointments ||--o{ payments : "appointment_id"
  users ||--o{ payments : "refund_requested_by"
  users ||--o{ payments : "refund_reviewed_by"
  accounts {
    uuid account_id PK
  }
  oauth_connections {
    uuid connection_id PK
  }
  refresh_tokens {
    uuid token_id PK
  }
  otp_tokens {
    uuid otp_id PK
  }
  users {
    uuid user_id PK
  }
  roles {
    uuid role_id PK
  }
  permissions {
    uuid permission_id PK
  }
  role_permissions {
    uuid id PK
  }
  user_roles {
    uuid id PK
  }
  phone_verifications {
    uuid verification_id PK
  }
  kyc_verifications {
    uuid kyc_id PK
  }
  audit_logs {
    uuid log_id PK
  }
  notification_templates {
    uuid template_id PK
  }
  notification_preferences {
    uuid preference_id PK
  }
  notifications {
    uuid notification_id PK
  }
  notification_delivery_logs {
    uuid log_id PK
  }
  notification_push_subscriptions {
    uuid subscription_id PK
  }
  patients {
    uuid patient_id PK
  }
  patient_representatives {
    uuid representative_id PK
  }
  medical_history {
    uuid history_id PK
  }
  medical_records {
    uuid record_id PK
  }
  medical_record_versions {
    uuid version_id PK
  }
  record_exports {
    uuid export_id PK
  }
  examination_sessions {
    uuid session_id PK
  }
  examination_session_amendments {
    uuid amendment_id PK
  }
  symptoms {
    uuid symptom_id PK
  }
  diagnoses {
    uuid diagnosis_id PK
  }
  dental_charts {
    uuid chart_id PK
  }
  image_categories {
    uuid category_id PK
  }
  dental_images {
    uuid image_id PK
  }
  image_annotations {
    uuid annotation_id PK
  }
  pacs_sync_logs {
    uuid sync_id PK
  }
  clinical_orders {
    uuid order_id PK
  }
  lab_test_results {
    uuid result_id PK
  }
  treatment_plans {
    uuid plan_id PK
  }
  treatment_history {
    uuid treatment_id PK
  }
  prescriptions {
    uuid prescription_id PK
  }
  prescription_items {
    uuid item_id PK
  }
  clinics {
    uuid clinic_id PK
  }
  treatment_rooms {
    uuid room_id PK
  }
  specialties {
    uuid specialty_id PK
  }
  doctor_specialties {
    uuid doctor_id PK
    uuid specialty_id PK
  }
  clinic_specialties {
    uuid clinic_id PK
    uuid specialty_id PK
  }
  work_shifts {
    uuid shift_id PK
  }
  service_categories {
    uuid category_id PK
  }
  services {
    uuid service_id PK
  }
  clinic_services {
    uuid clinic_service_id PK
  }
  doctor_schedules {
    uuid schedule_id PK
  }
  doctor_leaves {
    uuid leave_id PK
  }
  schedule_changes {
    uuid change_id PK
  }
  appointments {
    uuid appointment_id PK
  }
  appointment_status_history {
    uuid history_id PK
  }
  appointment_reminder_preferences {
    uuid preference_id PK
  }
  appointment_notification_logs {
    uuid log_id PK
  }
  diagnostic_orders {
    uuid order_id PK
  }
  idempotency_keys {
    varchar idempotency_key PK
  }
  payments {
    uuid payment_id PK
  }
```

## Entity relationship — Auth

`auth_service_db`

```mermaid
erDiagram
  accounts ||--o{ oauth_connections : "account_id"
  accounts ||--o{ refresh_tokens : "account_id"
  accounts ||--o{ otp_tokens : "account_id"
  accounts {
    uuid account_id PK
    varchar username 
    varchar email 
    varchar phone 
    varchar password_hash 
    varchar full_name 
    smallint gender 
    varchar role 
    varchar status 
    integer failed_login_attempts 
    timestamp locked_at 
    text locked_reason 
    uuid locked_by FK
    boolean email_verified 
    boolean phone_verified 
    timestamp last_login_at 
    timestamp created_at 
    timestamp updated_at 
    uuid created_by 
    uuid updated_by 
  }
  oauth_connections {
    uuid connection_id PK
    uuid account_id FK
    varchar provider 
    varchar provider_user_id 
    text access_token 
    text refresh_token 
    timestamp token_expires_at 
    boolean is_active 
    timestamp created_at 
    timestamp updated_at 
    uuid created_by 
    uuid updated_by 
  }
  refresh_tokens {
    uuid token_id PK
    uuid account_id FK
    char token_hash 
    timestamp expires_at 
    timestamp revoked_at 
    text device_info 
    varchar ip_address 
    timestamp created_at 
  }
  otp_tokens {
    uuid otp_id PK
    uuid account_id FK
    char otp_code 
    varchar otp_type 
    timestamp expires_at 
    timestamp used_at 
    timestamp created_at 
    timestamp updated_at 
    uuid created_by 
    uuid updated_by 
  }
```

## Entity relationship — Account & Identity

`account_service_db`

```mermaid
erDiagram
  roles ||--o{ role_permissions : "role_id"
  permissions ||--o{ role_permissions : "permission_id"
  users ||--o{ user_roles : "user_id"
  roles ||--o{ user_roles : "role_id"
  users ||--o{ phone_verifications : "user_id"
  users ||--o{ kyc_verifications : "user_id"
  users ||--o{ kyc_verifications : "verified_by"
  users ||--o{ audit_logs : "user_id"
  users ||--o{ notification_preferences : "user_id"
  users ||--o{ notifications : "recipient_id"
  notification_templates ||--o{ notifications : "template_id"
  notifications ||--o{ notification_delivery_logs : "notification_id"
  users ||--o{ notification_push_subscriptions : "user_id"
  users {
    uuid user_id PK
    varchar full_name 
    varchar email 
    varchar phone 
    date date_of_birth 
    smallint gender 
    text avatar_url 
    timestamp created_at 
    timestamp updated_at 
    uuid created_by 
    uuid updated_by 
    boolean is_banned 
    timestamptz banned_at 
    text ban_reason 
  }
  roles {
    uuid role_id PK
    varchar role_name 
    text description 
    timestamp created_at 
    timestamp updated_at 
    uuid created_by 
    uuid updated_by 
  }
  permissions {
    uuid permission_id PK
    varchar permission_name 
    varchar resource 
    varchar action 
    text description 
    timestamp created_at 
    timestamp updated_at 
    uuid created_by 
    uuid updated_by 
  }
  role_permissions {
    uuid id PK
    uuid role_id FK
    uuid permission_id FK
    timestamp assigned_at 
    uuid assigned_by 
  }
  user_roles {
    uuid id PK
    uuid user_id FK
    uuid role_id FK
    timestamp assigned_at 
    uuid assigned_by 
  }
  phone_verifications {
    uuid verification_id PK
    uuid user_id FK
    varchar phone 
    timestamp verified_at 
    boolean is_verified 
    timestamp created_at 
  }
  kyc_verifications {
    uuid kyc_id PK
    uuid user_id FK
    varchar id_type 
    varchar id_number 
    varchar full_name 
    date date_of_birth 
    text id_front_image 
    text id_back_image 
    text selfie_image 
    varchar verification_status 
    varchar ocr_status 
    integer ocr_confidence 
    jsonb ocr_payload 
    integer ocr_attempts 
    text ocr_last_error 
    timestamp ocr_processed_at 
    timestamp verified_at 
    uuid verified_by FK
    varchar decision_source 
    text decision_reason 
    text rejection_reason 
    timestamp submitted_at 
    char document_hash 
    text notes 
    text admin_notes 
    varchar consent_version 
    timestamp consent_accepted_at 
    timestamp document_storage_consent_accepted_at 
    timestamp ocr_processing_consent_accepted_at 
    timestamp no_marketing_consent_accepted_at 
    varchar processing_purpose 
    varchar retention_policy_version 
    timestamp retention_expires_at 
    timestamp deleted_at 
    timestamp created_at 
    timestamp updated_at 
    uuid created_by 
    uuid updated_by 
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
  notification_templates {
    uuid template_id PK
    varchar template_code 
    varchar name 
    text description 
    text subject_template 
    text body_template 
    varchar channel 
    boolean is_active 
    timestamp created_at 
    timestamp updated_at 
  }
  notification_preferences {
    uuid preference_id PK
    uuid user_id FK
    varchar notification_type 
    varchar channel 
    boolean is_enabled 
    timestamp created_at 
    timestamp updated_at 
  }
  notifications {
    uuid notification_id PK
    uuid recipient_id FK
    uuid template_id FK
    varchar notification_type 
    varchar channel 
    text subject 
    text message 
    uuid related_entity_id 
    varchar related_entity_type 
    timestamp scheduled_at 
    timestamp sent_at 
    timestamp read_at 
    varchar status 
    int retry_count 
    int max_retries 
    timestamp next_retry_at 
    text error_message 
    timestamp created_at 
    timestamp updated_at 
  }
  notification_delivery_logs {
    uuid log_id PK
    uuid notification_id FK
    varchar gateway_name 
    varchar gateway_response_id 
    varchar status 
    jsonb error_payload 
    timestamp created_at 
  }
  notification_push_subscriptions {
    uuid subscription_id PK
    uuid user_id FK
    text endpoint 
    varchar p256dh 
    varchar auth 
    varchar user_agent 
    timestamp created_at 
    timestamp updated_at 
  }
```

## Entity relationship — Medical Records

`core_medical_service_db`

```mermaid
erDiagram
  patients ||--o{ patient_representatives : "patient_id"
  patients ||--o{ medical_history : "patient_id"
  patients ||--o{ medical_records : "patient_id"
  medical_records ||--o{ medical_record_versions : "record_id"
  patients ||--o{ record_exports : "patient_id"
  medical_records ||--o{ record_exports : "record_id"
  medical_records ||--o{ examination_sessions : "record_id"
  patients ||--o{ examination_sessions : "patient_id"
  examination_sessions ||--o{ examination_session_amendments : "session_id"
  medical_records ||--o{ examination_session_amendments : "record_id"
  patients ||--o{ examination_session_amendments : "patient_id"
  examination_sessions ||--o{ symptoms : "session_id"
  patients ||--o{ symptoms : "patient_id"
  examination_sessions ||--o{ diagnoses : "session_id"
  patients ||--o{ dental_charts : "patient_id"
  medical_records ||--o{ dental_charts : "record_id"
  patients ||--o{ dental_images : "patient_id"
  medical_records ||--o{ dental_images : "record_id"
  image_categories ||--o{ dental_images : "category_id"
  dental_images ||--o{ image_annotations : "image_id"
  dental_images ||--o{ pacs_sync_logs : "image_id"
  examination_sessions ||--o{ clinical_orders : "session_id"
  medical_records ||--o{ clinical_orders : "record_id"
  patients ||--o{ clinical_orders : "patient_id"
  clinical_orders ||--o{ lab_test_results : "order_id"
  examination_sessions ||--o{ treatment_plans : "session_id"
  patients ||--o{ treatment_plans : "patient_id"
  medical_records ||--o{ treatment_plans : "record_id"
  patient_representatives ||--o{ treatment_plans : "accepted_representative_id"
  medical_records ||--o{ treatment_history : "record_id"
  patients ||--o{ treatment_history : "patient_id"
  examination_sessions ||--o{ prescriptions : "session_id"
  medical_records ||--o{ prescriptions : "record_id"
  patients ||--o{ prescriptions : "patient_id"
  prescriptions ||--o{ prescription_items : "prescription_id"
  patients {
    uuid patient_id PK
    uuid user_id FK
    varchar patient_code 
    varchar full_name 
    date date_of_birth 
    smallint gender 
    varchar phone 
    varchar email 
    text address 
    varchar ward 
    varchar district 
    varchar city 
    varchar emergency_contact 
    varchar emergency_phone 
    text allergies 
    text chronic_diseases 
    varchar insurance_number 
    varchar insurance_provider 
    timestamp created_at 
    timestamp updated_at 
  }
  patient_representatives {
    uuid representative_id PK
    uuid patient_id FK
    varchar full_name 
    varchar relationship 
    varchar phone 
    varchar email 
    varchar legal_document_type 
    varchar legal_document_number 
    boolean is_primary 
    boolean is_active 
    boolean authorized_for_treatment 
    boolean authorized_for_payment 
    boolean authorized_for_records 
    timestamp verified_at 
    uuid verified_by 
    timestamp created_at 
    timestamp updated_at 
  }
  medical_history {
    uuid history_id PK
    uuid patient_id FK
    varchar condition_name 
    varchar condition_type 
    date diagnosed_date 
    text treatment 
    text notes 
    timestamp created_at 
    timestamp updated_at 
  }
  medical_records {
    uuid record_id PK
    uuid patient_id FK
    uuid appointment_id FK
    uuid clinic_id FK
    uuid doctor_id FK
    date visit_date 
    text chief_complaint 
    text diagnosis 
    text treatment_plan 
    text notes 
    varchar record_status 
    varchar record_hash 
    timestamp finalized_at 
    uuid finalized_by 
    timestamp created_at 
    timestamp updated_at 
  }
  medical_record_versions {
    uuid version_id PK
    uuid record_id FK
    integer version_number 
    jsonb snapshot 
    uuid changed_by 
    text change_reason 
    timestamp created_at 
  }
  record_exports {
    uuid export_id PK
    uuid patient_id FK
    uuid record_id FK
    varchar export_type 
    varchar export_format 
    text file_url 
    uuid exported_by 
    timestamp expires_at 
    timestamp created_at 
  }
  examination_sessions {
    uuid session_id PK
    uuid appointment_id FK
    uuid record_id FK
    uuid patient_id FK
    uuid doctor_id FK
    uuid clinic_id FK
    timestamp session_date 
    text chief_complaint 
    text present_illness 
    text physical_examination 
    jsonb vital_signs 
    varchar status 
    timestamp started_at 
    timestamp completed_at 
    timestamp signed_at 
    uuid signed_by 
    timestamp created_at 
  }
  examination_session_amendments {
    uuid amendment_id PK
    uuid session_id FK
    uuid record_id FK
    uuid patient_id FK
    uuid doctor_id 
    text amendment_reason 
    text amendment_text 
    uuid amended_by 
    timestamp created_at 
  }
  symptoms {
    uuid symptom_id PK
    uuid session_id FK
    uuid patient_id FK
    varchar symptom_name 
    varchar body_location 
    varchar severity 
    date onset_date 
    varchar duration 
    text description 
    uuid recorded_by 
    timestamp created_at 
    timestamp updated_at 
  }
  diagnoses {
    uuid diagnosis_id PK
    uuid session_id FK
    varchar icd_code 
    varchar diagnosis_name 
    varchar diagnosis_type 
    varchar severity 
    text notes 
    timestamp created_at 
  }
  dental_charts {
    uuid chart_id PK
    uuid patient_id FK
    uuid record_id FK
    integer tooth_number 
    varchar tooth_status 
    jsonb surfaces 
    text notes 
    timestamp created_at 
    timestamp updated_at 
  }
  image_categories {
    uuid category_id PK
    varchar category_name 
    text description 
    timestamp created_at 
    timestamp updated_at 
  }
  dental_images {
    uuid image_id PK
    uuid patient_id FK
    uuid record_id FK
    uuid category_id FK
    varchar image_type 
    text image_url 
    text thumbnail_url 
    integer file_size_kb 
    varchar file_format 
    integer tooth_numbers 
    varchar view_angle 
    text description 
    text tags 
    jsonb metadata 
    varchar pacs_id 
    date taken_date 
    uuid taken_by 
    uuid uploaded_by 
    boolean is_archived 
    timestamp created_at 
    timestamp updated_at 
  }
  image_annotations {
    uuid annotation_id PK
    uuid image_id FK
    uuid annotated_by 
    varchar annotation_type 
    jsonb annotation_data 
    text note 
    timestamp created_at 
    timestamp updated_at 
  }
  pacs_sync_logs {
    uuid sync_id PK
    uuid image_id FK
    varchar sync_type 
    varchar pacs_server 
    varchar status 
    text error_message 
    timestamp synced_at 
    timestamp created_at 
    timestamp updated_at 
  }
  clinical_orders {
    uuid order_id PK
    uuid session_id FK
    uuid record_id FK
    uuid patient_id FK
    uuid ordered_by 
    varchar order_type 
    varchar test_type 
    text clinical_indication 
    integer teeth_numbers 
    varchar urgency 
    varchar status 
    timestamp ordered_date 
    timestamp scheduled_date 
    timestamp completed_date 
    text result_url 
    text report 
    timestamp created_at 
    timestamp updated_at 
  }
  lab_test_results {
    uuid result_id PK
    uuid order_id FK
    varchar test_name 
    text result_value 
    varchar result_unit 
    varchar reference_range 
    boolean is_abnormal 
    text notes 
    timestamp created_at 
  }
  treatment_plans {
    uuid plan_id PK
    uuid session_id FK
    uuid patient_id FK
    uuid record_id FK
    varchar plan_name 
    text objectives 
    integer duration_weeks 
    varchar status 
    numeric estimated_cost 
    char quote_currency 
    timestamp sent_at 
    uuid sent_to 
    varchar sent_via 
    timestamp confirmed_at 
    timestamp proposed_at 
    timestamp accepted_at 
    uuid accepted_by 
    timestamp declined_at 
    uuid declined_by 
    text decline_reason 
    uuid created_by 
    timestamp created_at 
    timestamp updated_at 
    varchar quote_version 
    text risk_disclosure 
    text alternative_options 
    varchar acceptance_scope 
    text accepted_scope_note 
    uuid accepted_representative_id FK
    varchar accepted_representative_name 
    varchar accepted_representative_relationship 
    varchar accepted_representative_phone 
  }
  treatment_history {
    uuid treatment_id PK
    uuid record_id FK
    uuid patient_id FK
    date treatment_date 
    integer tooth_numbers 
    varchar procedure_code 
    varchar procedure_name 
    text description 
    numeric cost 
    varchar status 
    uuid performed_by 
    timestamp created_at 
    timestamp updated_at 
  }
  prescriptions {
    uuid prescription_id PK
    uuid session_id FK
    uuid record_id FK
    uuid patient_id FK
    uuid doctor_id 
    date prescription_date 
    varchar status 
    text notes 
    timestamp issued_at 
    uuid issued_by 
    timestamp cancelled_at 
    text cancellation_reason 
    timestamp created_at 
    timestamp updated_at 
    boolean minor_patient_at_issue 
    integer patient_age_years_at_issue 
    integer patient_age_months_at_issue 
    varchar representative_name_snapshot 
    varchar representative_phone_snapshot 
    uuid representative_id_snapshot 
    varchar representative_relationship_snapshot 
  }
  prescription_items {
    uuid item_id PK
    uuid prescription_id FK
    varchar medication_name 
    varchar medication_code 
    varchar dosage 
    varchar route 
    varchar frequency 
    integer duration_days 
    integer quantity 
    text instructions 
    timestamp created_at 
  }
```

## Entity relationship — Clinic & Appointments

`core_clinic_service_db`

```mermaid
erDiagram
  clinics ||--o{ treatment_rooms : "clinic_id"
  specialties ||--o{ doctor_specialties : "specialty_id"
  clinics ||--o{ clinic_specialties : "clinic_id"
  specialties ||--o{ clinic_specialties : "specialty_id"
  service_categories ||--o{ services : "category_id"
  specialties ||--o{ services : "specialty_id"
  clinics ||--o{ clinic_services : "clinic_id"
  services ||--o{ clinic_services : "service_id"
  clinics ||--o{ doctor_schedules : "clinic_id"
  work_shifts ||--o{ doctor_schedules : "shift_id"
  treatment_rooms ||--o{ doctor_schedules : "room_id"
  doctor_schedules ||--o{ schedule_changes : "schedule_id"
  clinics ||--o{ appointments : "clinic_id"
  treatment_rooms ||--o{ appointments : "room_id"
  services ||--o{ appointments : "service_id"
  appointments ||--o{ appointment_status_history : "appointment_id"
  appointments ||--o{ appointment_notification_logs : "appointment_id"
  appointments ||--o{ diagnostic_orders : "appointment_id"
  clinics {
    uuid clinic_id PK
    varchar clinic_name 
    varchar clinic_code 
    text address 
    varchar ward 
    varchar district 
    varchar city 
    varchar phone 
    varchar email 
    varchar website 
    text logo_url 
    jsonb operating_hours 
    varchar status 
    varchar license_number 
    date license_expiry 
    timestamp created_at 
    timestamp updated_at 
  }
  treatment_rooms {
    uuid room_id PK
    uuid clinic_id FK
    varchar room_name 
    varchar room_code 
    clinic_room_type room_type 
    integer floor_number 
    jsonb equipment_list 
    varchar status 
    timestamp created_at 
    timestamp updated_at 
  }
  specialties {
    uuid specialty_id PK
    varchar specialty_name 
    varchar specialty_code 
    text description 
    text icon_url 
    boolean is_active 
    integer display_order 
    timestamp created_at 
    timestamp updated_at 
  }
  doctor_specialties {
    uuid doctor_id PK
    uuid specialty_id PK
    varchar certification_number 
    date certified_date 
    boolean is_primary 
    timestamp created_at 
  }
  clinic_specialties {
    uuid clinic_id PK
    uuid specialty_id PK
    timestamp created_at 
  }
  work_shifts {
    uuid shift_id PK
    varchar shift_name 
    time start_time 
    time end_time 
    text description 
    timestamp created_at 
  }
  service_categories {
    uuid category_id PK
    varchar category_name 
    text description 
    uuid parent_category_id FK
    boolean is_active 
    integer display_order 
    timestamp created_at 
  }
  services {
    uuid service_id PK
    varchar service_code 
    varchar service_name 
    uuid category_id FK
    uuid specialty_id FK
    text description 
    integer duration_minutes 
    numeric base_price 
    char currency 
    boolean is_active 
    boolean requires_appointment 
    text preparation_instructions 
    timestamp created_at 
    timestamp updated_at 
    clinic_room_type required_room_type 
  }
  clinic_services {
    uuid clinic_service_id PK
    uuid clinic_id FK
    uuid service_id FK
    numeric custom_price 
    boolean is_available 
    timestamp created_at 
    timestamp updated_at 
  }
  doctor_schedules {
    uuid schedule_id PK
    uuid doctor_id FK
    uuid clinic_id FK
    uuid shift_id FK
    date work_date 
    uuid room_id FK
    integer max_patients 
    varchar status 
    text notes 
    timestamp created_at 
    timestamp updated_at 
  }
  doctor_leaves {
    uuid leave_id PK
    uuid doctor_id FK
    varchar leave_type 
    date start_date 
    date end_date 
    text reason 
    varchar status 
    uuid approved_by 
    timestamp created_at 
    timestamp updated_at 
  }
  schedule_changes {
    uuid change_id PK
    uuid schedule_id FK
    uuid changed_by 
    varchar change_type 
    jsonb old_values 
    jsonb new_values 
    text reason 
    uuid approved_by 
    varchar approval_status 
    timestamp created_at 
  }
  appointments {
    uuid appointment_id PK
    varchar appointment_code 
    uuid patient_id FK
    uuid doctor_id FK
    uuid clinic_id FK
    uuid room_id FK
    uuid service_id FK
    date appointment_date 
    time appointment_time 
    integer duration_minutes 
    varchar appointment_type 
    varchar status 
    text chief_complaint 
    text notes 
    text cancellation_reason 
    boolean cancellation_requested 
    uuid cancelled_by 
    timestamp cancelled_at 
    boolean is_outside_hours 
    text outside_hours_reason 
    uuid approved_by 
    uuid payment_id 
    varchar payment_status 
    uuid created_by 
    timestamp created_at 
    timestamp updated_at 
    tsrange occupied_during 
    uuid session_id 
    uuid treatment_plan_id 
  }
  appointment_status_history {
    uuid history_id PK
    uuid appointment_id FK
    varchar old_status 
    varchar new_status 
    uuid changed_by 
    text reason 
    timestamp created_at 
  }
  appointment_reminder_preferences {
    uuid preference_id PK
    uuid patient_id 
    varchar channel 
    boolean enabled 
    integer reminder_minutes_before 
    timestamp created_at 
    timestamp updated_at 
  }
  appointment_notification_logs {
    uuid log_id PK
    uuid appointment_id FK
    varchar notification_type 
    varchar channel 
    varchar status 
    integer attempt_count 
    varchar notification_id 
    boolean preference_enabled 
    integer reminder_minutes_before 
    timestamp last_attempt_at 
    timestamp next_retry_at 
    text error_message 
    timestamp read_at 
    timestamp responded_at 
    timestamp scheduled_for 
    timestamp created_at 
    timestamp updated_at 
  }
  diagnostic_orders {
    uuid order_id PK
    uuid appointment_id FK
    uuid patient_id FK
    uuid doctor_id FK
    varchar order_code 
    varchar order_type 
    text description 
    varchar priority 
    varchar tooth_number 
    varchar area 
    varchar status 
    text result_summary 
    text result_attachment_url 
    text notes 
    timestamp ordered_at 
    timestamp completed_at 
    timestamp created_at 
    timestamp updated_at 
  }
  idempotency_keys {
    varchar idempotency_key PK
    varchar method 
    varchar path 
    varchar status 
    integer response_status 
    jsonb response_body 
    timestamp created_at 
    timestamp expires_at 
  }
```

## Entity relationship — Payment

`payment_service_db`

```mermaid
erDiagram
  payments {
    uuid payment_id PK
    uuid appointment_id FK
    numeric amount 
    char currency 
    varchar status 
    varchar provider 
    varchar provider_txn_ref 
    text order_info 
    numeric refund_amount 
    timestamp refunded_at 
    varchar refund_status 
    text refund_reason 
    uuid refund_requested_by FK
    timestamp refund_requested_at 
    uuid refund_reviewed_by FK
    timestamp refund_reviewed_at 
    timestamp created_at 
    timestamp updated_at 
  }
```

## Screen flow — Guest

```mermaid
flowchart LR
  S_["Landing Page"]
  S_register["Register"]
  S_clinics["Clinic Page"]
  S_clinics_id["Clinic Detail"]
  S_specialties["Specialty"]

  S_ -->|"Click 'Clinics'"| S_clinics
  S_ -->|"Click 'Register'"| S_register
  S_ -->|"Click 'Specialties'"| S_specialties
  S_clinics -->|"Click a clinic card"| S_clinics_id
```

## Screen flow — Patient

```mermaid
flowchart LR
  S_["Landing Page"]
  S_login["Login"]
  S_forgot_password["Forgot Password"]
  S_reset_password["Reset Password"]
  S_google_callback["Google Sign-in"]
  S_auth_google_callback["Google OAuth Callback"]
  S_unauthorized["Unauthorized"]
  S_dashboard["Dashboard"]
  S_dashboards_patient["Patient Dashboard"]
  S_profile["Profile Page"]
  S_chat["Booking Assistant"]
  S_appointments["Appointment List"]
  S_appointments_new["Create Appointment"]
  S_appointments_id["Appointment Detail"]
  S_appointments_id_edit["Update Appointment"]
  S_appointments_id_payment["Payment"]
  S_appointments_id_payment_callback["Payment Result"]
  S_prescriptions["Prescription List"]
  S_clinics["Clinic Page"]
  S_clinics_id["Clinic Detail"]
  S_services["Service"]
  S_specialties["Specialty"]

  S_ -->|"Click 'Login'"| S_login
  S_appointments -->|"Click 'Create'"| S_appointments_new
  S_appointments -->|"Select an appointment"| S_appointments_id
  S_appointments_id -->|"Click 'Edit'"| S_appointments_id_edit
  S_appointments_id -->|"Click 'Pay'"| S_appointments_id_payment
  S_appointments_id_payment -->|"VNPay redirect"| S_appointments_id_payment_callback
  S_clinics -->|"Click a clinic card"| S_clinics_id
  S_dashboard -->|"Click 'Profile'"| S_profile
  S_dashboard -->|"Click 'Services'"| S_services
  S_dashboard -->|"Click 'Specialties'"| S_specialties
  S_dashboard -->|"Open the assistant bubble"| S_chat
  S_dashboard -->|"Resolved for PATIENT"| S_dashboards_patient
  S_dashboard -->|"Role check fails"| S_unauthorized
  S_dashboard -->|"Sidebar"| S_appointments
  S_dashboard -->|"Sidebar"| S_clinics
  S_dashboard -->|"Sidebar"| S_prescriptions
  S_forgot_password -->|"Submit reset code"| S_reset_password
  S_google_callback -->|"Google redirect"| S_auth_google_callback
  S_login -->|"Click 'Continue with Google'"| S_google_callback
  S_login -->|"Click 'Forgot password'"| S_forgot_password
  S_login -->|"Login successfully"| S_dashboard
```

## Screen flow — Doctor

```mermaid
flowchart LR
  S_["Landing Page"]
  S_login["Login"]
  S_forgot_password["Forgot Password"]
  S_reset_password["Reset Password"]
  S_google_callback["Google Sign-in"]
  S_auth_google_callback["Google OAuth Callback"]
  S_unauthorized["Unauthorized"]
  S_dashboard["Dashboard"]
  S_dashboards_doctor["Doctor Dashboard"]
  S_profile["Profile Page"]
  S_chat["Booking Assistant"]
  S_appointments["Appointment List"]
  S_appointments_new["Create Appointment"]
  S_appointments_id["Appointment Detail"]
  S_patients["Patient Directory"]
  S_patients_id["Patient Profile"]
  S_patients_id_images["Patient Images"]
  S_patients_id_medical_records_new["Create Medical Record"]
  S_patients_id_medical_records_recordid["Medical Record Detail"]
  S_examinations["Examination List"]
  S_examinations_new["Create Examination"]
  S_examinations_id["Examination Detail"]
  S_dental_images["Dental Image Library"]
  S_prescriptions["Prescription List"]
  S_clinics["Clinic Page"]
  S_clinics_id["Clinic Detail"]
  S_services["Service"]
  S_specialties["Specialty"]
  S_schedules["Schedule Page"]
  S_schedules_leaves["Doctor Leave"]
  S_schedules_leaves_new["Request Leave"]
  S_schedules_shifts["Work Shift"]
  S_schedules_my_schedule["My Schedule"]

  S_ -->|"Click 'Login'"| S_login
  S_appointments -->|"Click 'Create'"| S_appointments_new
  S_appointments -->|"Select an appointment"| S_appointments_id
  S_clinics -->|"Click a clinic card"| S_clinics_id
  S_dashboard -->|"Click 'Clinics'"| S_clinics
  S_dashboard -->|"Click 'Prescriptions'"| S_prescriptions
  S_dashboard -->|"Click 'Profile'"| S_profile
  S_dashboard -->|"Click 'Schedules'"| S_schedules
  S_dashboard -->|"Click 'Services'"| S_services
  S_dashboard -->|"Click 'Specialties'"| S_specialties
  S_dashboard -->|"Open the assistant bubble"| S_chat
  S_dashboard -->|"Resolved for DOCTOR"| S_dashboards_doctor
  S_dashboard -->|"Role check fails"| S_unauthorized
  S_dashboard -->|"Sidebar"| S_appointments
  S_dashboard -->|"Sidebar"| S_dental_images
  S_dashboard -->|"Sidebar"| S_examinations
  S_dashboard -->|"Sidebar"| S_patients
  S_dashboard -->|"Sidebar"| S_schedules_my_schedule
  S_examinations -->|"Click 'New examination'"| S_examinations_new
  S_examinations -->|"Select a session"| S_examinations_id
  S_forgot_password -->|"Submit reset code"| S_reset_password
  S_google_callback -->|"Google redirect"| S_auth_google_callback
  S_login -->|"Click 'Continue with Google'"| S_google_callback
  S_login -->|"Click 'Forgot password'"| S_forgot_password
  S_login -->|"Login successfully"| S_dashboard
  S_patients -->|"Select a patient"| S_patients_id
  S_patients_id -->|"Click 'Images'"| S_patients_id_images
  S_patients_id -->|"Click 'New record'"| S_patients_id_medical_records_new
  S_patients_id -->|"Select a record"| S_patients_id_medical_records_recordid
  S_schedules -->|"Click 'Leave'"| S_schedules_leaves
  S_schedules -->|"Click 'Shifts'"| S_schedules_shifts
  S_schedules_leaves -->|"Click 'Request leave'"| S_schedules_leaves_new
```

## Screen flow — Nurse

```mermaid
flowchart LR
  S_["Landing Page"]
  S_login["Login"]
  S_forgot_password["Forgot Password"]
  S_reset_password["Reset Password"]
  S_google_callback["Google Sign-in"]
  S_auth_google_callback["Google OAuth Callback"]
  S_unauthorized["Unauthorized"]
  S_dashboard["Dashboard"]
  S_profile["Profile Page"]
  S_chat["Booking Assistant"]
  S_appointments["Appointment List"]
  S_appointments_id["Appointment Detail"]
  S_patients["Patient Directory"]
  S_patients_id["Patient Profile"]
  S_patients_id_images["Patient Images"]
  S_patients_id_medical_records_new["Create Medical Record"]
  S_patients_id_medical_records_recordid["Medical Record Detail"]
  S_examinations["Examination List"]
  S_examinations_id["Examination Detail"]
  S_dental_images["Dental Image Library"]
  S_prescriptions["Prescription List"]
  S_clinics["Clinic Page"]
  S_clinics_id["Clinic Detail"]
  S_services["Service"]
  S_specialties["Specialty"]
  S_schedules_my_schedule["My Schedule"]

  S_ -->|"Click 'Login'"| S_login
  S_appointments -->|"Select an appointment"| S_appointments_id
  S_clinics -->|"Click a clinic card"| S_clinics_id
  S_dashboard -->|"Click 'Clinics'"| S_clinics
  S_dashboard -->|"Click 'Prescriptions'"| S_prescriptions
  S_dashboard -->|"Click 'Profile'"| S_profile
  S_dashboard -->|"Click 'Services'"| S_services
  S_dashboard -->|"Open the assistant bubble"| S_chat
  S_dashboard -->|"Role check fails"| S_unauthorized
  S_dashboard -->|"Sidebar"| S_appointments
  S_dashboard -->|"Sidebar"| S_dental_images
  S_dashboard -->|"Sidebar"| S_examinations
  S_dashboard -->|"Sidebar"| S_patients
  S_dashboard -->|"Sidebar"| S_schedules_my_schedule
  S_dashboard -->|"Sidebar"| S_specialties
  S_examinations -->|"Select a session"| S_examinations_id
  S_forgot_password -->|"Submit reset code"| S_reset_password
  S_google_callback -->|"Google redirect"| S_auth_google_callback
  S_login -->|"Click 'Continue with Google'"| S_google_callback
  S_login -->|"Click 'Forgot password'"| S_forgot_password
  S_login -->|"Login successfully"| S_dashboard
  S_patients -->|"Select a patient"| S_patients_id
  S_patients_id -->|"Click 'Images'"| S_patients_id_images
  S_patients_id -->|"Click 'New record'"| S_patients_id_medical_records_new
  S_patients_id -->|"Select a record"| S_patients_id_medical_records_recordid
```

## Screen flow — Receptionist

```mermaid
flowchart LR
  S_["Landing Page"]
  S_login["Login"]
  S_forgot_password["Forgot Password"]
  S_reset_password["Reset Password"]
  S_google_callback["Google Sign-in"]
  S_auth_google_callback["Google OAuth Callback"]
  S_unauthorized["Unauthorized"]
  S_dashboard["Dashboard"]
  S_profile["Profile Page"]
  S_chat["Booking Assistant"]
  S_appointments["Appointment List"]
  S_appointments_new["Create Appointment"]
  S_appointments_id["Appointment Detail"]
  S_appointments_id_edit["Update Appointment"]
  S_appointments_id_payment["Payment"]
  S_appointments_id_payment_callback["Payment Result"]
  S_patients["Patient Directory"]
  S_patients_new["Add Patient Profile"]
  S_patients_id["Patient Profile"]
  S_patients_id_edit["Update Patient Profile"]
  S_patients_id_images["Patient Images"]
  S_patients_id_medical_records_new["Create Medical Record"]
  S_patients_id_medical_records_recordid["Medical Record Detail"]
  S_prescriptions["Prescription List"]
  S_clinics["Clinic Page"]
  S_clinics_id["Clinic Detail"]
  S_services["Service"]
  S_specialties["Specialty"]
  S_schedules["Schedule Page"]
  S_schedules_leaves["Doctor Leave"]
  S_schedules_leaves_new["Request Leave"]
  S_schedules_shifts["Work Shift"]

  S_ -->|"Click 'Login'"| S_login
  S_appointments -->|"Click 'Create'"| S_appointments_new
  S_appointments -->|"Select an appointment"| S_appointments_id
  S_appointments_id -->|"Click 'Edit'"| S_appointments_id_edit
  S_appointments_id -->|"Click 'Pay'"| S_appointments_id_payment
  S_appointments_id_payment -->|"VNPay redirect"| S_appointments_id_payment_callback
  S_clinics -->|"Click a clinic card"| S_clinics_id
  S_dashboard -->|"Click 'Prescriptions'"| S_prescriptions
  S_dashboard -->|"Click 'Profile'"| S_profile
  S_dashboard -->|"Click 'Services'"| S_services
  S_dashboard -->|"Click 'Specialties'"| S_specialties
  S_dashboard -->|"Open the assistant bubble"| S_chat
  S_dashboard -->|"Role check fails"| S_unauthorized
  S_dashboard -->|"Sidebar"| S_appointments
  S_dashboard -->|"Sidebar"| S_clinics
  S_dashboard -->|"Sidebar"| S_patients
  S_dashboard -->|"Sidebar"| S_schedules
  S_forgot_password -->|"Submit reset code"| S_reset_password
  S_google_callback -->|"Google redirect"| S_auth_google_callback
  S_login -->|"Click 'Continue with Google'"| S_google_callback
  S_login -->|"Click 'Forgot password'"| S_forgot_password
  S_login -->|"Login successfully"| S_dashboard
  S_patients -->|"Click 'Add patient'"| S_patients_new
  S_patients -->|"Select a patient"| S_patients_id
  S_patients_id -->|"Click 'Edit'"| S_patients_id_edit
  S_patients_id -->|"Click 'Images'"| S_patients_id_images
  S_patients_id -->|"Click 'New record'"| S_patients_id_medical_records_new
  S_patients_id -->|"Select a record"| S_patients_id_medical_records_recordid
  S_schedules -->|"Click 'Leave'"| S_schedules_leaves
  S_schedules -->|"Click 'Shifts'"| S_schedules_shifts
  S_schedules_leaves -->|"Click 'Request leave'"| S_schedules_leaves_new
```

## Screen flow — Clinic Manager

```mermaid
flowchart LR
  S_["Landing Page"]
  S_login["Login"]
  S_forgot_password["Forgot Password"]
  S_reset_password["Reset Password"]
  S_google_callback["Google Sign-in"]
  S_auth_google_callback["Google OAuth Callback"]
  S_unauthorized["Unauthorized"]
  S_dashboard["Dashboard"]
  S_profile["Profile Page"]
  S_chat["Booking Assistant"]
  S_appointments["Appointment List"]
  S_appointments_id["Appointment Detail"]
  S_appointments_id_payment["Payment"]
  S_appointments_id_payment_callback["Payment Result"]
  S_patients["Patient Directory"]
  S_patients_new["Add Patient Profile"]
  S_patients_id["Patient Profile"]
  S_patients_id_edit["Update Patient Profile"]
  S_patients_id_images["Patient Images"]
  S_patients_id_medical_records_new["Create Medical Record"]
  S_patients_id_medical_records_recordid["Medical Record Detail"]
  S_examinations["Examination List"]
  S_examinations_new["Create Examination"]
  S_examinations_id["Examination Detail"]
  S_dental_images["Dental Image Library"]
  S_prescriptions["Prescription List"]
  S_clinics["Clinic Page"]
  S_clinics_new["Create Clinic"]
  S_clinics_id["Clinic Detail"]
  S_clinics_id_edit["Update Clinic"]
  S_services["Service"]
  S_specialties["Specialty"]
  S_schedules["Schedule Page"]
  S_schedules_doctors["Doctor Schedule"]
  S_schedules_doctors_new["Create Schedule"]
  S_schedules_doctors_edit_scheduleid["Update Schedule"]
  S_schedules_leaves["Doctor Leave"]
  S_schedules_leaves_new["Request Leave"]
  S_schedules_shifts["Work Shift"]

  S_ -->|"Click 'Login'"| S_login
  S_appointments -->|"Select an appointment"| S_appointments_id
  S_appointments_id -->|"Click 'Pay'"| S_appointments_id_payment
  S_appointments_id_payment -->|"VNPay redirect"| S_appointments_id_payment_callback
  S_clinics -->|"Click 'Add clinic'"| S_clinics_new
  S_clinics -->|"Click a clinic card"| S_clinics_id
  S_clinics_id -->|"Click 'Edit'"| S_clinics_id_edit
  S_dashboard -->|"Click 'Prescriptions'"| S_prescriptions
  S_dashboard -->|"Click 'Profile'"| S_profile
  S_dashboard -->|"Click 'Services'"| S_services
  S_dashboard -->|"Open the assistant bubble"| S_chat
  S_dashboard -->|"Role check fails"| S_unauthorized
  S_dashboard -->|"Sidebar"| S_appointments
  S_dashboard -->|"Sidebar"| S_clinics
  S_dashboard -->|"Sidebar"| S_dental_images
  S_dashboard -->|"Sidebar"| S_examinations
  S_dashboard -->|"Sidebar"| S_patients
  S_dashboard -->|"Sidebar"| S_schedules
  S_dashboard -->|"Sidebar"| S_specialties
  S_examinations -->|"Click 'New examination'"| S_examinations_new
  S_examinations -->|"Select a session"| S_examinations_id
  S_forgot_password -->|"Submit reset code"| S_reset_password
  S_google_callback -->|"Google redirect"| S_auth_google_callback
  S_login -->|"Click 'Continue with Google'"| S_google_callback
  S_login -->|"Click 'Forgot password'"| S_forgot_password
  S_login -->|"Login successfully"| S_dashboard
  S_patients -->|"Click 'Add patient'"| S_patients_new
  S_patients -->|"Select a patient"| S_patients_id
  S_patients_id -->|"Click 'Edit'"| S_patients_id_edit
  S_patients_id -->|"Click 'Images'"| S_patients_id_images
  S_patients_id -->|"Click 'New record'"| S_patients_id_medical_records_new
  S_patients_id -->|"Select a record"| S_patients_id_medical_records_recordid
  S_schedules -->|"Click 'Doctor schedules'"| S_schedules_doctors
  S_schedules -->|"Click 'Leave'"| S_schedules_leaves
  S_schedules -->|"Click 'Shifts'"| S_schedules_shifts
  S_schedules_doctors -->|"Click 'Create'"| S_schedules_doctors_new
  S_schedules_doctors -->|"Click 'Edit'"| S_schedules_doctors_edit_scheduleid
  S_schedules_leaves -->|"Click 'Request leave'"| S_schedules_leaves_new
```

## Screen flow — Admin

```mermaid
flowchart LR
  S_["Landing Page"]
  S_login["Login"]
  S_forgot_password["Forgot Password"]
  S_reset_password["Reset Password"]
  S_google_callback["Google Sign-in"]
  S_auth_google_callback["Google OAuth Callback"]
  S_unauthorized["Unauthorized"]
  S_dashboard["Dashboard"]
  S_profile["Profile Page"]
  S_chat["Booking Assistant"]
  S_appointments["Appointment List"]
  S_appointments_new["Create Appointment"]
  S_appointments_id["Appointment Detail"]
  S_appointments_id_payment["Payment"]
  S_appointments_id_payment_callback["Payment Result"]
  S_patients["Patient Directory"]
  S_patients_id["Patient Profile"]
  S_patients_id_images["Patient Images"]
  S_patients_id_medical_records_new["Create Medical Record"]
  S_patients_id_medical_records_recordid["Medical Record Detail"]
  S_examinations["Examination List"]
  S_examinations_new["Create Examination"]
  S_examinations_id["Examination Detail"]
  S_dental_images["Dental Image Library"]
  S_prescriptions["Prescription List"]
  S_clinics["Clinic Page"]
  S_clinics_new["Create Clinic"]
  S_clinics_id["Clinic Detail"]
  S_clinics_id_edit["Update Clinic"]
  S_services["Service"]
  S_services_new["Add Service"]
  S_services_id_edit["Update Service"]
  S_specialties["Specialty"]
  S_schedules["Schedule Page"]
  S_schedules_doctors["Doctor Schedule"]
  S_schedules_doctors_new["Create Schedule"]
  S_schedules_doctors_edit_scheduleid["Update Schedule"]
  S_schedules_leaves["Doctor Leave"]
  S_schedules_leaves_new["Request Leave"]
  S_schedules_shifts["Work Shift"]
  S_admin["Admin Home"]
  S_admin_users_management["User Management Page"]
  S_admin_roles_management["Role Page"]
  S_admin_kyc_management["KYC Management"]
  S_admin_audit_logs["Audit Log"]
  S_admin_performance["Doctor Performance"]
  S_admin_revenue_reports["Financial Report"]
  S_admin_refunds["Refund Management"]

  S_ -->|"Click 'Login'"| S_login
  S_appointments -->|"Click 'Create'"| S_appointments_new
  S_appointments -->|"Select an appointment"| S_appointments_id
  S_appointments_id -->|"Click 'Pay'"| S_appointments_id_payment
  S_appointments_id_payment -->|"VNPay redirect"| S_appointments_id_payment_callback
  S_clinics -->|"Click 'Add clinic'"| S_clinics_new
  S_clinics -->|"Click a clinic card"| S_clinics_id
  S_clinics_id -->|"Click 'Edit'"| S_clinics_id_edit
  S_dashboard -->|"Click 'Administration'"| S_admin
  S_dashboard -->|"Click 'Prescriptions'"| S_prescriptions
  S_dashboard -->|"Click 'Profile'"| S_profile
  S_dashboard -->|"Click 'Services'"| S_services
  S_dashboard -->|"Open the assistant bubble"| S_chat
  S_dashboard -->|"Role check fails"| S_unauthorized
  S_dashboard -->|"Sidebar"| S_admin_audit_logs
  S_dashboard -->|"Sidebar"| S_admin_kyc_management
  S_dashboard -->|"Sidebar"| S_admin_performance
  S_dashboard -->|"Sidebar"| S_admin_refunds
  S_dashboard -->|"Sidebar"| S_admin_revenue_reports
  S_dashboard -->|"Sidebar"| S_admin_roles_management
  S_dashboard -->|"Sidebar"| S_admin_users_management
  S_dashboard -->|"Sidebar"| S_appointments
  S_dashboard -->|"Sidebar"| S_clinics
  S_dashboard -->|"Sidebar"| S_dental_images
  S_dashboard -->|"Sidebar"| S_examinations
  S_dashboard -->|"Sidebar"| S_patients
  S_dashboard -->|"Sidebar"| S_schedules
  S_dashboard -->|"Sidebar"| S_specialties
  S_examinations -->|"Click 'New examination'"| S_examinations_new
  S_examinations -->|"Select a session"| S_examinations_id
  S_forgot_password -->|"Submit reset code"| S_reset_password
  S_google_callback -->|"Google redirect"| S_auth_google_callback
  S_login -->|"Click 'Continue with Google'"| S_google_callback
  S_login -->|"Click 'Forgot password'"| S_forgot_password
  S_login -->|"Login successfully"| S_dashboard
  S_patients -->|"Select a patient"| S_patients_id
  S_patients_id -->|"Click 'Images'"| S_patients_id_images
  S_patients_id -->|"Click 'New record'"| S_patients_id_medical_records_new
  S_patients_id -->|"Select a record"| S_patients_id_medical_records_recordid
  S_schedules -->|"Click 'Doctor schedules'"| S_schedules_doctors
  S_schedules -->|"Click 'Leave'"| S_schedules_leaves
  S_schedules -->|"Click 'Shifts'"| S_schedules_shifts
  S_schedules_doctors -->|"Click 'Create'"| S_schedules_doctors_new
  S_schedules_doctors -->|"Click 'Edit'"| S_schedules_doctors_edit_scheduleid
  S_schedules_leaves -->|"Click 'Request leave'"| S_schedules_leaves_new
  S_services -->|"Click 'Add service'"| S_services_new
  S_services -->|"Click 'Edit'"| S_services_id_edit
```
