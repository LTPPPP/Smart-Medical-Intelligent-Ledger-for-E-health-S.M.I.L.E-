# S.M.I.L.E — Database Tables Description

---

## a. users

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | user_id | uuid | - | ✓ | ✓ | PK | |
| 2 | full_name | varchar | 255 | | ✓ | | |
| 3 | email | varchar | 255 | ✓ | ✓ | | |
| 4 | phone | varchar | 20 | | | | |
| 5 | date_of_birth | date | - | | | | |
| 6 | gender | varchar | 20 | | | | |
| 7 | avatar_url | text | - | | | | |
| 8 | created_at | timestamp | - | | ✓ | | |
| 9 | updated_at | timestamp | - | | ✓ | | |
| 10 | created_by | uuid | - | | | FK → users(user_id) | |
| 11 | updated_by | uuid | - | | | FK → users(user_id) | |
| 12 | is_banned | boolean | - | | ✓ | | Default: false |
| 13 | banned_at | timestamp | - | | | | |
| 14 | ban_reason | text | - | | | | |

---

## b. accounts

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | account_id | uuid | - | ✓ | ✓ | PK | |
| 2 | username | varchar | 100 | ✓ | ✓ | | |
| 3 | email | varchar | 255 | ✓ | ✓ | | |
| 4 | phone | varchar | 20 | ✓ | | | |
| 5 | full_name | varchar | 255 | | ✓ | | |
| 6 | gender | varchar | 20 | | | | |
| 7 | password_hash | varchar | 255 | | | | Bcrypt hash |
| 8 | role | varchar | 50 | | ✓ | | |
| 9 | status | varchar | 50 | | ✓ | | active / inactive / locked |
| 10 | failed_login_attempts | integer | - | | ✓ | | Default: 0 |
| 11 | locked_at | timestamp | - | | | | |
| 12 | locked_reason | text | - | | | | |
| 13 | locked_by | uuid | - | | | FK → users(user_id) | |
| 14 | email_verified | boolean | - | | ✓ | | Default: false |
| 15 | phone_verified | boolean | - | | ✓ | | Default: false |
| 16 | last_login_at | timestamp | - | | | | |
| 17 | created_at | timestamp | - | | ✓ | | |
| 18 | updated_at | timestamp | - | | ✓ | | |
| 19 | created_by | uuid | - | | | FK → users(user_id) | |
| 20 | updated_by | uuid | - | | | FK → users(user_id) | |

---

## c. patients

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | patient_id | uuid | - | ✓ | ✓ | PK | |
| 2 | user_id | uuid | - | | ✓ | FK → users(user_id) | |
| 3 | patient_code | varchar | 50 | ✓ | ✓ | | Auto-generated |
| 4 | full_name | varchar | 255 | | ✓ | | |
| 5 | date_of_birth | date | - | | | | |
| 6 | gender | varchar | 20 | | | | |
| 7 | phone | varchar | 20 | | | | |
| 8 | email | varchar | 255 | | | | |
| 9 | address | text | - | | | | |
| 10 | ward | varchar | 100 | | | | |
| 11 | district | varchar | 100 | | | | |
| 12 | city | varchar | 100 | | | | |
| 13 | emergency_contact | varchar | 255 | | | | |
| 14 | emergency_phone | varchar | 20 | | | | |
| 15 | blood_type | varchar | 10 | | | | A / B / AB / O |
| 16 | allergies | text | - | | | | |
| 17 | chronic_diseases | text | - | | | | |
| 18 | insurance_number | varchar | 100 | | | | |
| 19 | insurance_provider | varchar | 255 | | | | |
| 20 | created_at | timestamp | - | | ✓ | | |
| 21 | updated_at | timestamp | - | | ✓ | | |

---

## d. clinics

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | clinic_id | uuid | - | ✓ | ✓ | PK | |
| 2 | clinic_name | varchar | 255 | | ✓ | | |
| 3 | clinic_code | varchar | 50 | ✓ | ✓ | | |
| 4 | address | text | - | | ✓ | | |
| 5 | ward | varchar | 100 | | | | |
| 6 | district | varchar | 100 | | | | |
| 7 | city | varchar | 100 | | | | |
| 8 | phone | varchar | 20 | | | | |
| 9 | email | varchar | 255 | | | | |
| 10 | website | varchar | 255 | | | | |
| 11 | logo_url | text | - | | | | |
| 12 | operating_hours | jsonb | - | | | | {Mon–Sun: open/close} |
| 13 | status | varchar | 50 | | ✓ | | active / inactive |
| 14 | license_number | varchar | 100 | ✓ | | | |
| 15 | license_expiry | date | - | | | | |
| 16 | created_at | timestamp | - | | ✓ | | |
| 17 | updated_at | timestamp | - | | ✓ | | |

---

## e. appointments

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | appointment_id | uuid | - | ✓ | ✓ | PK | |
| 2 | appointment_code | varchar | 50 | ✓ | ✓ | | |
| 3 | patient_id | uuid | - | | ✓ | FK → patients(patient_id) | |
| 4 | doctor_id | uuid | - | | ✓ | FK → users(user_id) | |
| 5 | clinic_id | uuid | - | | ✓ | FK → clinics(clinic_id) | |
| 6 | room_id | uuid | - | | | FK → treatment_rooms(room_id) | |
| 7 | service_id | uuid | - | | | FK → services(service_id) | |
| 8 | appointment_date | date | - | | ✓ | | |
| 9 | appointment_time | time | - | | ✓ | | |
| 10 | duration_minutes | integer | - | | | | Default: 30 |
| 11 | appointment_type | varchar | 50 | | ✓ | | walk-in / online / referral |
| 12 | status | varchar | 50 | | ✓ | | pending / confirmed / cancelled / completed |
| 13 | chief_complaint | text | - | | | | |
| 14 | notes | text | - | | | | |
| 15 | cancellation_reason | text | - | | | | |
| 16 | cancelled_by | uuid | - | | | FK → users(user_id) | |
| 17 | cancelled_at | timestamp | - | | | | |
| 18 | is_outside_hours | boolean | - | | ✓ | | Default: false |
| 19 | outside_hours_reason | text | - | | | | |
| 20 | approved_by | uuid | - | | | FK → users(user_id) | |
| 21 | payment_id | uuid | - | | | | Ref to payment_service_db |
| 22 | payment_status | varchar | 50 | | | | pending / paid / refunded |
| 23 | created_by | uuid | - | | | FK → users(user_id) | |
| 24 | created_at | timestamp | - | | ✓ | | |
| 25 | updated_at | timestamp | - | | ✓ | | |

---

## f. appointment_status_history

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | history_id | uuid | - | ✓ | ✓ | PK | |
| 2 | appointment_id | uuid | - | | ✓ | FK → appointments(appointment_id) | |
| 3 | old_status | varchar | 50 | | | | |
| 4 | new_status | varchar | 50 | | ✓ | | |
| 5 | changed_by | uuid | - | | ✓ | FK → users(user_id) | |
| 6 | reason | text | - | | | | |
| 7 | created_at | timestamp | - | | ✓ | | |

---

## g. diagnostic_orders

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | order_id | uuid | - | ✓ | ✓ | PK | |
| 2 | appointment_id | uuid | - | | ✓ | FK → appointments(appointment_id) | |
| 3 | patient_id | uuid | - | | ✓ | FK → patients(patient_id) | |
| 4 | doctor_id | uuid | - | | ✓ | FK → users(user_id) | |
| 5 | order_code | varchar | 50 | ✓ | ✓ | | |
| 6 | order_type | varchar | 50 | | ✓ | | xray / cbct / lab / clinical |
| 7 | description | text | - | | | | |
| 8 | priority | varchar | 20 | | ✓ | | routine / urgent / stat |
| 9 | tooth_number | varchar | 20 | | | | FDI notation |
| 10 | area | varchar | 100 | | | | |
| 11 | status | varchar | 50 | | ✓ | | pending / in_progress / completed |
| 12 | result_summary | text | - | | | | |
| 13 | result_attachment_url | text | - | | | | |
| 14 | notes | text | - | | | | |
| 15 | ordered_at | timestamp | - | | ✓ | | |
| 16 | completed_at | timestamp | - | | | | |
| 17 | created_at | timestamp | - | | ✓ | | |
| 18 | updated_at | timestamp | - | | ✓ | | |

---

## h. medical_records

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | record_id | uuid | - | ✓ | ✓ | PK | |
| 2 | patient_id | uuid | - | | ✓ | FK → patients(patient_id) | |
| 3 | appointment_id | uuid | - | | | FK → appointments(appointment_id) | |
| 4 | clinic_id | uuid | - | | ✓ | FK → clinics(clinic_id) | |
| 5 | doctor_id | uuid | - | | ✓ | FK → users(user_id) | |
| 6 | visit_date | date | - | | ✓ | | |
| 7 | chief_complaint | text | - | | | | |
| 8 | diagnosis | text | - | | | | |
| 9 | treatment_plan | text | - | | | | |
| 10 | notes | text | - | | | | |
| 11 | record_status | varchar | 50 | | ✓ | | draft / active / finalized / archived |
| 12 | record_hash | varchar | 64 | | | | SHA-256 of record content |
| 13 | blockchain_tx_id | uuid | - | | | | Hyperledger Fabric tx |
| 14 | finalized_at | timestamp | - | | | | |
| 15 | finalized_by | uuid | - | | | FK → users(user_id) | |
| 16 | created_at | timestamp | - | | ✓ | | |
| 17 | updated_at | timestamp | - | | ✓ | | |

---

## i. medical_record_versions

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | version_id | uuid | - | ✓ | ✓ | PK | |
| 2 | record_id | uuid | - | | ✓ | FK → medical_records(record_id) | |
| 3 | version_number | integer | - | | ✓ | | Auto-increment per record |
| 4 | snapshot | jsonb | - | | ✓ | | Full record state at this version |
| 5 | changed_by | uuid | - | | ✓ | FK → users(user_id) | |
| 6 | change_reason | text | - | | | | |
| 7 | created_at | timestamp | - | | ✓ | | |

---

## j. medical_history

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | history_id | uuid | - | ✓ | ✓ | PK | |
| 2 | patient_id | uuid | - | | ✓ | FK → patients(patient_id) | |
| 3 | condition_name | varchar | 255 | | ✓ | | |
| 4 | condition_type | varchar | 50 | | ✓ | | chronic / acute / allergy / surgery |
| 5 | diagnosed_date | date | - | | | | |
| 6 | treatment | text | - | | | | |
| 7 | notes | text | - | | | | |
| 8 | created_at | timestamp | - | | ✓ | | |
| 9 | updated_at | timestamp | - | | ✓ | | |

---

## k. record_exports

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | export_id | uuid | - | ✓ | ✓ | PK | |
| 2 | patient_id | uuid | - | | ✓ | FK → patients(patient_id) | |
| 3 | record_id | uuid | - | | ✓ | FK → medical_records(record_id) | |
| 4 | export_type | varchar | 50 | | ✓ | | full / summary / prescription |
| 5 | export_format | varchar | 20 | | ✓ | | PDF / CSV / JSON |
| 6 | file_url | text | - | | | | Signed download URL |
| 7 | exported_by | uuid | - | | ✓ | FK → users(user_id) | |
| 8 | expires_at | timestamp | - | | | | URL expiry |
| 9 | created_at | timestamp | - | | ✓ | | |

---

## l. examination_sessions

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | session_id | uuid | - | ✓ | ✓ | PK | |
| 2 | record_id | uuid | - | | ✓ | FK → medical_records(record_id) | |
| 3 | patient_id | uuid | - | | ✓ | FK → patients(patient_id) | |
| 4 | doctor_id | uuid | - | | ✓ | FK → users(user_id) | |
| 5 | clinic_id | uuid | - | | ✓ | FK → clinics(clinic_id) | |
| 6 | session_date | timestamp | - | | ✓ | | |
| 7 | chief_complaint | text | - | | | | |
| 8 | present_illness | text | - | | | | |
| 9 | physical_examination | text | - | | | | |
| 10 | vital_signs | jsonb | - | | | | {bp, pulse, temp, weight, spo2} |
| 11 | status | varchar | 50 | | ✓ | | in_progress / completed |
| 12 | started_at | timestamp | - | | | | |
| 13 | completed_at | timestamp | - | | | | |
| 14 | created_at | timestamp | - | | ✓ | | |

---

## m. diagnoses

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | diagnosis_id | uuid | - | ✓ | ✓ | PK | |
| 2 | session_id | uuid | - | | ✓ | FK → examination_sessions(session_id) | |
| 3 | icd_code | varchar | 10 | | | | ICD-10 standard code |
| 4 | diagnosis_name | varchar | 255 | | ✓ | | |
| 5 | diagnosis_type | varchar | 50 | | | | primary / secondary / differential |
| 6 | severity | varchar | 20 | | | | mild / moderate / severe |
| 7 | notes | text | - | | | | |
| 8 | created_at | timestamp | - | | ✓ | | |

---

## n. symptoms

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | symptom_id | uuid | - | ✓ | ✓ | PK | |
| 2 | session_id | uuid | - | | ✓ | FK → examination_sessions(session_id) | |
| 3 | patient_id | uuid | - | | ✓ | FK → patients(patient_id) | |
| 4 | symptom_name | varchar | 255 | | ✓ | | |
| 5 | body_location | varchar | 100 | | | | |
| 6 | severity | varchar | 20 | | | | mild / moderate / severe |
| 7 | onset_date | date | - | | | | |
| 8 | duration | varchar | 50 | | | | e.g. "3 days" |
| 9 | description | text | - | | | | |
| 10 | recorded_by | uuid | - | | | FK → users(user_id) | |
| 11 | created_at | timestamp | - | | ✓ | | |
| 12 | updated_at | timestamp | - | | ✓ | | |

---

## o. treatment_plans

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | plan_id | uuid | - | ✓ | ✓ | PK | |
| 2 | patient_id | uuid | - | | ✓ | FK → patients(patient_id) | |
| 3 | record_id | uuid | - | | ✓ | FK → medical_records(record_id) | |
| 4 | plan_name | varchar | 255 | | ✓ | | |
| 5 | objectives | text | - | | | | |
| 6 | duration_weeks | integer | - | | | | |
| 7 | status | varchar | 50 | | ✓ | | draft / active / completed / cancelled |
| 8 | sent_at | timestamp | - | | | | |
| 9 | sent_to | uuid | - | | | FK → users(user_id) | Patient / guardian ref |
| 10 | sent_via | varchar | 50 | | | | email / sms / app |
| 11 | confirmed_at | timestamp | - | | | | |
| 12 | created_by | uuid | - | | ✓ | FK → users(user_id) | |
| 13 | created_at | timestamp | - | | ✓ | | |
| 14 | updated_at | timestamp | - | | ✓ | | |

---

## p. treatment_history

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | treatment_id | uuid | - | ✓ | ✓ | PK | |
| 2 | record_id | uuid | - | | ✓ | FK → medical_records(record_id) | |
| 3 | patient_id | uuid | - | | ✓ | FK → patients(patient_id) | |
| 4 | treatment_date | date | - | | ✓ | | |
| 5 | tooth_numbers | integer | - | | | | FDI notation |
| 6 | procedure_code | varchar | 50 | | | | |
| 7 | procedure_name | varchar | 255 | | ✓ | | |
| 8 | description | text | - | | | | |
| 9 | cost | decimal | 10,2 | | ✓ | | Default: 0 |
| 10 | status | varchar | 50 | | ✓ | | planned / in_progress / completed |
| 11 | performed_by | uuid | - | | | FK → users(user_id) | |
| 12 | created_at | timestamp | - | | ✓ | | |
| 13 | updated_at | timestamp | - | | ✓ | | |

---

## q. dental_charts

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | chart_id | uuid | - | ✓ | ✓ | PK | |
| 2 | patient_id | uuid | - | | ✓ | FK → patients(patient_id) | |
| 3 | record_id | uuid | - | | ✓ | FK → medical_records(record_id) | |
| 4 | tooth_number | integer | - | | ✓ | | 1–32, FDI notation |
| 5 | tooth_status | varchar | 50 | | ✓ | | healthy / carious / missing / filled / crowned |
| 6 | surfaces | jsonb | - | | | | {mesial, distal, occlusal, buccal, lingual} |
| 7 | notes | text | - | | | | |
| 8 | created_at | timestamp | - | | ✓ | | |
| 9 | updated_at | timestamp | - | | ✓ | | |

---

## r. prescriptions

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | prescription_id | uuid | - | ✓ | ✓ | PK | |
| 2 | record_id | uuid | - | | ✓ | FK → medical_records(record_id) | |
| 3 | patient_id | uuid | - | | ✓ | FK → patients(patient_id) | |
| 4 | doctor_id | uuid | - | | ✓ | FK → users(user_id) | |
| 5 | prescription_date | date | - | | ✓ | | |
| 6 | status | varchar | 50 | | ✓ | | draft / issued / dispensed / cancelled |
| 7 | notes | text | - | | | | |
| 8 | digital_signature_id | uuid | - | | | | Blockchain key reference |
| 9 | created_at | timestamp | - | | ✓ | | |
| 10 | updated_at | timestamp | - | | ✓ | | |

---

## s. prescription_items

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | item_id | uuid | - | ✓ | ✓ | PK | |
| 2 | prescription_id | uuid | - | | ✓ | FK → prescriptions(prescription_id) | |
| 3 | medication_name | varchar | 255 | | ✓ | | |
| 4 | medication_code | varchar | 50 | | | | Drug registry code |
| 5 | dosage | varchar | 100 | | ✓ | | e.g. 500mg |
| 6 | route | varchar | 50 | | | | oral / topical / injection |
| 7 | frequency | varchar | 100 | | ✓ | | e.g. 3 times/day after meal |
| 8 | duration_days | integer | - | | | | |
| 9 | quantity | integer | - | | ✓ | | |
| 10 | instructions | text | - | | | | |
| 11 | created_at | timestamp | - | | ✓ | | |

---

## t. clinical_orders

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | order_id | uuid | - | ✓ | ✓ | PK | |
| 2 | record_id | uuid | - | | ✓ | FK → medical_records(record_id) | |
| 3 | patient_id | uuid | - | | ✓ | FK → patients(patient_id) | |
| 4 | ordered_by | uuid | - | | ✓ | FK → users(user_id) | |
| 5 | order_type | varchar | 50 | | ✓ | | xray / cbct / endodontic / lab |
| 6 | test_type | varchar | 100 | | | | |
| 7 | clinical_indication | text | - | | | | |
| 8 | teeth_numbers | integer | - | | | | |
| 9 | urgency | varchar | 20 | | ✓ | | routine / urgent / stat |
| 10 | status | varchar | 50 | | ✓ | | ordered / scheduled / completed / cancelled |
| 11 | ordered_date | timestamp | - | | ✓ | | |
| 12 | scheduled_date | timestamp | - | | | | |
| 13 | completed_date | timestamp | - | | | | |
| 14 | result_url | text | - | | | | |
| 15 | report | text | - | | | | |
| 16 | created_at | timestamp | - | | ✓ | | |
| 17 | updated_at | timestamp | - | | ✓ | | |

---

## u. lab_test_results

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | result_id | uuid | - | ✓ | ✓ | PK | |
| 2 | order_id | uuid | - | | ✓ | FK → clinical_orders(order_id) | |
| 3 | test_name | varchar | 255 | | ✓ | | |
| 4 | result_value | text | - | | | | |
| 5 | result_unit | varchar | 50 | | | | e.g. mg/dL |
| 6 | reference_range | varchar | 100 | | | | e.g. 70–110 |
| 7 | is_abnormal | boolean | - | | ✓ | | Default: false |
| 8 | notes | text | - | | | | |
| 9 | created_at | timestamp | - | | ✓ | | |

---

## v. dental_images

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | image_id | uuid | - | ✓ | ✓ | PK | |
| 2 | patient_id | uuid | - | | ✓ | FK → patients(patient_id) | |
| 3 | record_id | uuid | - | | | FK → medical_records(record_id) | |
| 4 | category_id | uuid | - | | | FK → image_categories(category_id) | |
| 5 | image_type | varchar | 50 | | ✓ | | xray / cbct / intraoral / extraoral |
| 6 | image_url | text | - | | ✓ | | |
| 7 | thumbnail_url | text | - | | | | |
| 8 | file_size_kb | integer | - | | | | |
| 9 | file_format | varchar | 20 | | | | JPEG / PNG / DICOM |
| 10 | tooth_numbers | integer | - | | | | |
| 11 | view_angle | varchar | 50 | | | | |
| 12 | description | text | - | | | | |
| 13 | tags | text | - | | | | Comma-separated |
| 14 | metadata | jsonb | - | | | | EXIF / acquisition params |
| 15 | pacs_id | uuid | - | | | | PACS system reference |
| 16 | taken_date | date | - | | | | |
| 17 | taken_by | uuid | - | | | FK → users(user_id) | |
| 18 | uploaded_by | uuid | - | | | FK → users(user_id) | |
| 19 | is_archived | boolean | - | | ✓ | | Default: false |
| 20 | created_at | timestamp | - | | ✓ | | |
| 21 | updated_at | timestamp | - | | ✓ | | |

---

## w. image_annotations

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | annotation_id | uuid | - | ✓ | ✓ | PK | |
| 2 | image_id | uuid | - | | ✓ | FK → dental_images(image_id) | |
| 3 | annotated_by | uuid | - | | ✓ | FK → users(user_id) | |
| 4 | annotation_type | varchar | 50 | | ✓ | | finding / measurement / label |
| 5 | annotation_data | jsonb | - | | ✓ | | Coordinates, shapes, bounding boxes |
| 6 | note | text | - | | | | |
| 7 | created_at | timestamp | - | | ✓ | | |
| 8 | updated_at | timestamp | - | | ✓ | | |

---

## x. image_categories

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | category_id | uuid | - | ✓ | ✓ | PK | |
| 2 | category_name | varchar | 100 | ✓ | ✓ | | |
| 3 | description | text | - | | | | |
| 4 | created_at | timestamp | - | | ✓ | | |
| 5 | updated_at | timestamp | - | | ✓ | | |

---

## y. pacs_sync_logs

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | sync_id | uuid | - | ✓ | ✓ | PK | |
| 2 | image_id | uuid | - | | ✓ | FK → dental_images(image_id) | |
| 3 | sync_type | varchar | 50 | | ✓ | | upload / download / verify |
| 4 | pacs_server | varchar | 255 | | ✓ | | |
| 5 | status | varchar | 50 | | ✓ | | success / failed / pending |
| 6 | error_message | text | - | | | | |
| 7 | synced_at | timestamp | - | | | | |
| 8 | created_at | timestamp | - | | ✓ | | |
| 9 | updated_at | timestamp | - | | ✓ | | |

---

## z. doctor_schedules

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | schedule_id | uuid | - | ✓ | ✓ | PK | |
| 2 | doctor_id | uuid | - | | ✓ | FK → users(user_id) | |
| 3 | clinic_id | uuid | - | | ✓ | FK → clinics(clinic_id) | |
| 4 | shift_id | uuid | - | | ✓ | FK → work_shifts(shift_id) | |
| 5 | work_date | date | - | | ✓ | | |
| 6 | room_id | uuid | - | | | FK → treatment_rooms(room_id) | |
| 7 | max_patients | integer | - | | | | Default: 20 |
| 8 | status | varchar | 50 | | ✓ | | active / cancelled / completed |
| 9 | notes | text | - | | | | |
| 10 | created_at | timestamp | - | | ✓ | | |
| 11 | updated_at | timestamp | - | | ✓ | | |

---

## aa. schedule_changes

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | change_id | uuid | - | ✓ | ✓ | PK | |
| 2 | schedule_id | uuid | - | | ✓ | FK → doctor_schedules(schedule_id) | |
| 3 | changed_by | uuid | - | | ✓ | FK → users(user_id) | |
| 4 | change_type | varchar | 50 | | ✓ | | reschedule / cancel / transfer |
| 5 | old_values | jsonb | - | | | | Snapshot before change |
| 6 | new_values | jsonb | - | | | | Snapshot after change |
| 7 | reason | text | - | | | | |
| 8 | approved_by | uuid | - | | | FK → users(user_id) | |
| 9 | approval_status | varchar | 50 | | | | pending / approved / rejected |
| 10 | created_at | timestamp | - | | ✓ | | |

---

## ab. doctor_leaves

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | leave_id | uuid | - | ✓ | ✓ | PK | |
| 2 | doctor_id | uuid | - | | ✓ | FK → users(user_id) | |
| 3 | leave_type | varchar | 50 | | ✓ | | annual / sick / emergency / unpaid |
| 4 | start_date | date | - | | ✓ | | |
| 5 | end_date | date | - | | ✓ | | |
| 6 | reason | text | - | | | | |
| 7 | status | varchar | 50 | | ✓ | | pending / approved / rejected |
| 8 | approved_by | uuid | - | | | FK → users(user_id) | |
| 9 | created_at | timestamp | - | | ✓ | | |
| 10 | updated_at | timestamp | - | | ✓ | | |

---

## ac. work_shifts

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | shift_id | uuid | - | ✓ | ✓ | PK | |
| 2 | shift_name | varchar | 100 | ✓ | ✓ | | e.g. Morning / Afternoon / Night |
| 3 | start_time | time | - | | ✓ | | |
| 4 | end_time | time | - | | ✓ | | |
| 5 | description | text | - | | | | |
| 6 | created_at | timestamp | - | | ✓ | | |

---

## ad. treatment_rooms

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | room_id | uuid | - | ✓ | ✓ | PK | |
| 2 | clinic_id | uuid | - | | ✓ | FK → clinics(clinic_id) | |
| 3 | room_name | varchar | 100 | | ✓ | | |
| 4 | room_code | varchar | 50 | ✓ | ✓ | | Unique per clinic |
| 5 | room_type | varchar | 50 | | ✓ | | general / surgery / imaging / sterilization |
| 6 | floor_number | integer | - | | | | |
| 7 | capacity | integer | - | | | | Default: 1 |
| 8 | equipment_list | jsonb | - | | | | List of equipment items |
| 9 | status | varchar | 50 | | ✓ | | active / maintenance / inactive |
| 10 | created_at | timestamp | - | | ✓ | | |
| 11 | updated_at | timestamp | - | | ✓ | | |

---

## ae. services

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | service_id | uuid | - | ✓ | ✓ | PK | |
| 2 | service_code | varchar | 50 | ✓ | ✓ | | |
| 3 | service_name | varchar | 255 | | ✓ | | |
| 4 | category_id | uuid | - | | | FK → service_categories(category_id) | |
| 5 | specialty_id | uuid | - | | | FK → specialties(specialty_id) | |
| 6 | description | text | - | | | | |
| 7 | duration_minutes | integer | - | | | | Default: 30 |
| 8 | base_price | decimal | 10,2 | | ✓ | | |
| 9 | currency | varchar | 10 | | ✓ | | Default: VND |
| 10 | is_active | boolean | - | | ✓ | | Default: true |
| 11 | requires_appointment | boolean | - | | ✓ | | Default: true |
| 12 | preparation_instructions | text | - | | | | |
| 13 | created_at | timestamp | - | | ✓ | | |
| 14 | updated_at | timestamp | - | | ✓ | | |

---

## af. service_categories

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | category_id | uuid | - | ✓ | ✓ | PK | |
| 2 | category_name | varchar | 100 | ✓ | ✓ | | |
| 3 | description | text | - | | | | |
| 4 | parent_category_id | uuid | - | | | FK → service_categories(category_id) | Self-referencing |
| 5 | is_active | boolean | - | | ✓ | | Default: true |
| 6 | display_order | integer | - | | | | Default: 0 |
| 7 | created_at | timestamp | - | | ✓ | | |

---

## ag. clinic_services

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | clinic_service_id | uuid | - | ✓ | ✓ | PK | |
| 2 | clinic_id | uuid | - | | ✓ | FK → clinics(clinic_id) | |
| 3 | service_id | uuid | - | | ✓ | FK → services(service_id) | |
| 4 | custom_price | decimal | 10,2 | | | | Overrides base_price for this clinic |
| 5 | is_available | boolean | - | | ✓ | | Default: true |
| 6 | created_at | timestamp | - | | ✓ | | |
| 7 | updated_at | timestamp | - | | ✓ | | |

---

## ah. specialties

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | specialty_id | uuid | - | ✓ | ✓ | PK | |
| 2 | specialty_name | varchar | 100 | | ✓ | | |
| 3 | specialty_code | varchar | 50 | ✓ | ✓ | | |
| 4 | description | text | - | | | | |
| 5 | icon_url | text | - | | | | |
| 6 | is_active | boolean | - | | ✓ | | Default: true |
| 7 | display_order | integer | - | | | | Default: 0 |
| 8 | created_at | timestamp | - | | ✓ | | |
| 9 | updated_at | timestamp | - | | ✓ | | |

---

## ai. doctor_specialties

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | doctor_id | uuid | - | | ✓ | PK, FK → users(user_id) | Composite PK |
| 2 | specialty_id | uuid | - | | ✓ | PK, FK → specialties(specialty_id) | Composite PK |
| 3 | certification_number | varchar | 100 | | | | |
| 4 | certified_date | date | - | | | | |
| 5 | is_primary | boolean | - | | ✓ | | Default: false |
| 6 | created_at | timestamp | - | | ✓ | | |

---

## aj. roles

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | role_id | uuid | - | ✓ | ✓ | PK | |
| 2 | role_name | varchar | 100 | ✓ | ✓ | | admin / doctor / nurse / receptionist |
| 3 | description | text | - | | | | |
| 4 | created_at | timestamp | - | | ✓ | | |
| 5 | updated_at | timestamp | - | | ✓ | | |
| 6 | created_by | uuid | - | | | FK → users(user_id) | |
| 7 | updated_by | uuid | - | | | FK → users(user_id) | |

---

## ak. permissions

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | permission_id | uuid | - | ✓ | ✓ | PK | |
| 2 | permission_name | varchar | 100 | ✓ | ✓ | | e.g. appointments:create |
| 3 | resource | varchar | 100 | | ✓ | | e.g. appointments |
| 4 | action | varchar | 50 | | ✓ | | create / read / update / delete |
| 5 | description | text | - | | | | |
| 6 | created_at | timestamp | - | | ✓ | | |
| 7 | updated_at | timestamp | - | | ✓ | | |
| 8 | created_by | uuid | - | | | FK → users(user_id) | |
| 9 | updated_by | uuid | - | | | FK → users(user_id) | |

---

## al. role_permissions

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | id | uuid | - | ✓ | ✓ | PK | |
| 2 | role_id | uuid | - | | ✓ | FK → roles(role_id) | |
| 3 | permission_id | uuid | - | | ✓ | FK → permissions(permission_id) | |
| 4 | assigned_at | timestamp | - | | ✓ | | |
| 5 | assigned_by | uuid | - | | | FK → users(user_id) | |

---

## am. user_roles

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | id | uuid | - | ✓ | ✓ | PK | |
| 2 | user_id | uuid | - | | ✓ | FK → users(user_id) | |
| 3 | role_id | uuid | - | | ✓ | FK → roles(role_id) | |
| 4 | assigned_at | timestamp | - | | ✓ | | |
| 5 | assigned_by | uuid | - | | | FK → users(user_id) | |

---

## an. oauth_connections

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | connection_id | uuid | - | ✓ | ✓ | PK | |
| 2 | account_id | uuid | - | | ✓ | FK → accounts(account_id) | |
| 3 | provider | varchar | 50 | | ✓ | | google / facebook / apple |
| 4 | provider_user_id | uuid | - | | ✓ | | Provider's internal user ID |
| 5 | access_token | text | - | | | | Encrypted at rest |
| 6 | refresh_token | text | - | | | | Encrypted at rest |
| 7 | token_expires_at | timestamp | - | | | | |
| 8 | is_active | boolean | - | | ✓ | | Default: true |
| 9 | created_at | timestamp | - | | ✓ | | |
| 10 | updated_at | timestamp | - | | ✓ | | |

---

## ao. otp_tokens

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | otp_id | uuid | - | ✓ | ✓ | PK | |
| 2 | account_id | uuid | - | | ✓ | FK → accounts(account_id) | |
| 3 | otp_code | varchar | 10 | | ✓ | | 6-digit numeric code |
| 4 | otp_type | varchar | 50 | | ✓ | | email_verify / phone_verify / login / reset_password |
| 5 | expires_at | timestamp | - | | ✓ | | |
| 6 | used_at | timestamp | - | | | | Null = not yet used |
| 7 | created_at | timestamp | - | | ✓ | | |
| 8 | updated_at | timestamp | - | | ✓ | | |

---

## ap. refresh_tokens

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | token_id | uuid | - | ✓ | ✓ | PK | |
| 2 | account_id | uuid | - | | ✓ | FK → accounts(account_id) | |
| 3 | token_hash | varchar | 255 | ✓ | ✓ | | SHA-256 of raw token |
| 4 | expires_at | timestamp | - | | ✓ | | |
| 5 | revoked_at | timestamp | - | | | | Null = still valid |
| 6 | device_info | text | - | | | | User-Agent / device name |
| 7 | ip_address | varchar | 45 | | | | Supports IPv6 |
| 8 | created_at | timestamp | - | | ✓ | | |

---

## aq. kyc_verifications

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | kyc_id | uuid | - | ✓ | ✓ | PK | |
| 2 | user_id | uuid | - | | ✓ | FK → users(user_id) | |
| 3 | id_type | varchar | 50 | | ✓ | | national_id / passport / driving_license |
| 4 | id_number | varchar | 50 | | ✓ | | |
| 5 | full_name | varchar | 255 | | ✓ | | As on ID document |
| 6 | date_of_birth | date | - | | ✓ | | |
| 7 | id_front_image | text | - | | | | Storage URL |
| 8 | id_back_image | text | - | | | | Storage URL |
| 9 | selfie_image | text | - | | | | Storage URL |
| 10 | verification_status | varchar | 50 | | ✓ | | pending / approved / rejected |
| 11 | ocr_status | varchar | 50 | | | | pending / processing / completed / failed |
| 12 | ocr_confidence | integer | - | | | | 0–100 percent |
| 13 | ocr_payload | jsonb | - | | | | Raw OCR extraction result |
| 14 | ocr_attempts | integer | - | | | | Default: 0 |
| 15 | ocr_last_error | text | - | | | | |
| 16 | ocr_processed_at | timestamp | - | | | | |
| 17 | document_hash | varchar | 64 | | | | SHA-256 of ID document |
| 18 | notes | text | - | | | | |
| 19 | admin_notes | text | - | | | | Internal reviewer notes |
| 20 | rejection_reason | text | - | | | | |
| 21 | submitted_at | timestamp | - | | | | |
| 22 | verified_at | timestamp | - | | | | |
| 23 | verified_by | uuid | - | | | FK → users(user_id) | Admin reviewer |
| 24 | consent_version | varchar | 20 | | | | |
| 25 | consent_accepted_at | timestamp | - | | | | |
| 26 | document_storage_consent_accepted_at | timestamp | - | | | | GDPR consent |
| 27 | ocr_processing_consent_accepted_at | timestamp | - | | | | GDPR consent |
| 28 | no_marketing_consent_accepted_at | timestamp | - | | | | GDPR consent |
| 29 | processing_purpose | varchar | 100 | | | | |
| 30 | retention_policy_version | varchar | 20 | | | | |
| 31 | retention_expires_at | timestamp | - | | | | Data retention deadline |
| 32 | deleted_at | timestamp | - | | | | Soft delete for GDPR right to erasure |
| 33 | created_at | timestamp | - | | ✓ | | |
| 34 | updated_at | timestamp | - | | ✓ | | |
| 35 | created_by | uuid | - | | | FK → users(user_id) | |
| 36 | updated_by | uuid | - | | | FK → users(user_id) | |

---

## ar. audit_logs

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | log_id | uuid | - | ✓ | ✓ | PK | |
| 2 | user_id | uuid | - | | | FK → users(user_id) | Null for system actions |
| 3 | action | varchar | 100 | | ✓ | | CREATE / READ / UPDATE / DELETE |
| 4 | resource | varchar | 100 | | ✓ | | e.g. appointments |
| 5 | resource_id | uuid | - | | | | ID of affected resource |
| 6 | ip_address | varchar | 45 | | | | Supports IPv6 |
| 7 | user_agent | text | - | | | | |
| 8 | details | jsonb | - | | | | Before / after snapshot |
| 9 | created_at | timestamp | - | | ✓ | | Immutable — no updated_at |

---

## as. notifications

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | notification_id | uuid | - | ✓ | ✓ | PK | |
| 2 | recipient_id | uuid | - | | ✓ | FK → users(user_id) | |
| 3 | template_id | uuid | - | | | FK → notification_templates(template_id) | |
| 4 | notification_type | varchar | 50 | | ✓ | | appointment / payment / system / reminder |
| 5 | channel | varchar | 50 | | ✓ | | email / sms / push / in_app |
| 6 | subject | varchar | 255 | | | | |
| 7 | message | text | - | | ✓ | | Rendered content |
| 8 | related_entity_id | uuid | - | | | | Polymorphic FK |
| 9 | related_entity_type | varchar | 100 | | | | e.g. appointments |
| 10 | scheduled_at | timestamp | - | | | | For future-scheduled sends |
| 11 | sent_at | timestamp | - | | | | |
| 12 | read_at | timestamp | - | | | | |
| 13 | status | varchar | 50 | | ✓ | | pending / sent / failed / read |
| 14 | retry_count | integer | - | | ✓ | | Default: 0 |
| 15 | max_retries | integer | - | | ✓ | | Default: 3 |
| 16 | next_retry_at | timestamp | - | | | | |
| 17 | error_message | text | - | | | | |
| 18 | created_at | timestamp | - | | ✓ | | |
| 19 | updated_at | timestamp | - | | ✓ | | |

---

## at. notification_templates

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | template_id | uuid | - | ✓ | ✓ | PK | |
| 2 | template_code | varchar | 100 | ✓ | ✓ | | e.g. APPT_REMINDER, KYC_APPROVED |
| 3 | name | varchar | 255 | | ✓ | | Human-readable label |
| 4 | description | text | - | | | | |
| 5 | subject_template | text | - | | | | Handlebars / Mustache |
| 6 | body_template | text | - | | ✓ | | Handlebars / Mustache |
| 7 | channel | varchar | 50 | | ✓ | | email / sms / push |
| 8 | is_active | boolean | - | | ✓ | | Default: true |
| 9 | created_at | timestamp | - | | ✓ | | |
| 10 | updated_at | timestamp | - | | ✓ | | |

---

## au. notification_delivery_logs

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | log_id | uuid | - | ✓ | ✓ | PK | |
| 2 | notification_id | uuid | - | | ✓ | FK → notifications(notification_id) | |
| 3 | gateway_name | varchar | 100 | | ✓ | | SendGrid / Twilio / FCM |
| 4 | gateway_response_id | uuid | - | | | | Provider message ID |
| 5 | status | varchar | 50 | | ✓ | | success / failed / bounced / deferred |
| 6 | error_payload | jsonb | - | | | | Raw error from gateway |
| 7 | created_at | timestamp | - | | ✓ | | Immutable — no updated_at |

---

## av. notification_preferences

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | preference_id | uuid | - | ✓ | ✓ | PK | |
| 2 | user_id | uuid | - | | ✓ | FK → users(user_id) | |
| 3 | notification_type | varchar | 50 | | ✓ | | appointment / payment / system |
| 4 | channel | varchar | 50 | | ✓ | | email / sms / push / in_app |
| 5 | is_enabled | boolean | - | | ✓ | | Default: true |
| 6 | created_at | timestamp | - | | ✓ | | |
| 7 | updated_at | timestamp | - | | ✓ | | |

---

## aw. file

| # | Field Name | Type | Size | Unique | Not Null | PK/FK | Notes |
|---|------------|------|------|--------|----------|-------|-------|
| 1 | id | uuid | - | ✓ | ✓ | PK | |
| 2 | path | varchar | 500 | | ✓ | | Relative path under storage root |
