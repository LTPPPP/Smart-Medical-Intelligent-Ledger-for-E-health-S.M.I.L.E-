# Class Specification

This document lists all classes used in the system's class diagrams, with their attributes, methods, and descriptions.

## Entity Classes

### 4.1. Account Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | accountId | string | Unique identifier of the account |
| 2 | username | string \| null | Username for login |
| 3 | email | string \| null | Email address |
| 4 | phone | string \| null | Phone number |
| 5 | fullName | string \| null | Full name of the user |
| 6 | gender | GenderEnum \| null | Gender of the user |
| 7 | passwordHash | string \| null | Hashed password for authentication |
| 8 | status | AccountStatus | Current status of the record |
| 9 | failedLoginAttempts | number | Number of consecutive failed login attempts |
| 10 | lockedAt | Date \| null | Timestamp when the account was locked |
| 11 | lockedReason | string \| null | Reason why the account was locked |
| 12 | lockedBy | string \| null | ID of the admin who locked the account |
| 13 | emailVerified | boolean | Whether the email has been verified |
| 14 | phoneVerified | boolean | Whether the phone number has been verified |
| 15 | lastLoginAt | Date \| null | Timestamp of the last successful login |
| 16 | createdAt | Date | Timestamp when the record was created |
| 17 | updatedAt | Date | Timestamp when the record was last updated |
| 18 | createdBy | string \| null | ID of the user who created the record |
| 19 | updatedBy | string \| null | ID of the user who last updated the record |

### 4.2. Appointment Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | appointment_id | string | Unique identifier of the appointment |
| 2 | appointment_code | string | Unique appointment code for reference |
| 3 | patient_id | string | ID of the associated patient |
| 4 | doctor_id | string | ID of the associated doctor |
| 5 | clinic_id | string | ID of the associated clinic |
| 6 | room_id | string \| null | ID of the treatment room |
| 7 | service_id | string \| null | ID of the associated service |
| 8 | appointment_date | Date | Date of the appointment |
| 9 | appointment_time | string | Scheduled time of the appointment |
| 10 | duration_minutes | number | Duration of the appointment in minutes |
| 11 | appointment_type | string \| null | Type of appointment (e.g., regular, follow-up) |
| 12 | status | string | Current status of the record |
| 13 | chief_complaint | string \| null | Primary reason for the visit |
| 14 | notes | string \| null | Additional notes or comments |
| 15 | cancellation_reason | string \| null | Reason for appointment cancellation |
| 16 | cancelled_by | string \| null | ID of the user who cancelled the appointment |
| 17 | cancelled_at | Date \| null | Timestamp when the appointment was cancelled |
| 18 | is_outside_hours | boolean | Whether the appointment is outside working hours |
| 19 | outside_hours_reason | string \| null | Reason for scheduling outside working hours |
| 20 | approved_by | string \| null | ID of the user who approved the request |
| 21 | payment_id | string \| null | Reference to the associated payment |
| 22 | payment_status | string | Current payment status (e.g., PENDING, COMPLETED) |
| 23 | created_by | string | ID of the user who created the record |
| 24 | created_at | Date | Timestamp when the record was created |
| 25 | updated_at | Date | Timestamp when the record was last updated |

### 4.3. Appointment Status History Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | history_id | string | ID of the history record |
| 2 | appointment_id | string | ID of the associated appointment |
| 3 | old_status | string \| null | Previous status before the change |
| 4 | new_status | string \| null | New status after the change |
| 5 | changed_by | string | ID of the user who made the change |
| 6 | reason | string \| null | Reason for the action |
| 7 | created_at | Date | Timestamp when the record was created |

### 4.4. Audit Log Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | log_id | string | Unique identifier of the audit log entry |
| 2 | user_id | string \| null | ID of the associated user |
| 3 | action | string | Action that was performed (e.g., LOGIN, CREATE, UPDATE) |
| 4 | resource | string | Resource that was affected (e.g., auth, appointment) |
| 5 | resource_id | string \| null | ID of the affected resource |
| 6 | ip_address | string \| null | IP address of the client |
| 7 | user_agent | string \| null | User agent string of the client browser |
| 8 | details | Record<string, any> \| null | Additional details in JSON format |
| 9 | created_at | Date | Timestamp when the record was created |

### 4.5. Clinic Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | clinic_id | string | ID of the associated clinic |
| 2 | clinic_name | string | Name of the clinic |
| 3 | clinic_code | string | Unique code of the clinic |
| 4 | address | string | Physical address |
| 5 | ward | string \| null | The ward value |
| 6 | district | string \| null | District name |
| 7 | city | string \| null | City name |
| 8 | phone | string \| null | Phone number |
| 9 | email | string \| null | Email address |
| 10 | website | string \| null | The website value |
| 11 | logo_url | string \| null | URL of the logo |
| 12 | operating_hours | Record<string, string> \| null | The operating hours value |
| 13 | status | string | Current status of the record |
| 14 | license_number | string \| null | The license number value |
| 15 | license_expiry | Date \| null | The license expiry value |
| 16 | created_at | Date | Timestamp when the record was created |
| 17 | updated_at | Date | Timestamp when the record was last updated |

### 4.6. Clinic Service Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | clinic_service_id | string | ID of the clinic-service association |
| 2 | clinic_id | string | ID of the associated clinic |
| 3 | service_id | string | ID of the associated service |
| 4 | custom_price | number \| null | Customized price for a specific clinic |
| 5 | is_available | boolean | Whether the record is available |
| 6 | created_at | Date | Timestamp when the record was created |
| 7 | updated_at | Date | Timestamp when the record was last updated |

### 4.7. Clinical Order Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | order_id | string | ID of the order |
| 2 | record_id | string \| null | ID of the associated medical record |
| 3 | patient_id | string | ID of the associated patient |
| 4 | ordered_by | string | ID of the doctor who placed the order |
| 5 | order_type | string | Type of order (e.g., LAB, CLINICAL, IMAGING) |
| 6 | test_type | string | Type classification of the record |
| 7 | clinical_indication | string \| null | The clinical indication value |
| 8 | teeth_numbers | number[] \| null | The teeth numbers value |
| 9 | urgency | string | The urgency value |
| 10 | status | string | Current status of the record |
| 11 | ordered_date | Date | Date of ordered |
| 12 | scheduled_date | Date \| null | Date of scheduled |
| 13 | completed_date | Date \| null | Date of completed |
| 14 | result_url | string \| null | URL of the result |
| 15 | report | string \| null | The report value |
| 16 | created_at | Date | Timestamp when the record was created |
| 17 | updated_at | Date | Timestamp when the record was last updated |

### 4.8. Dental Image Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | image_id | string | ID of the dental image |
| 2 | patient_id | string | ID of the associated patient |
| 3 | record_id | string \| null | ID of the associated medical record |
| 4 | category_id | string \| null | ID of the image category |
| 5 | image_type | string | Type classification of the record |
| 6 | image_url | string | URL of the stored image |
| 7 | thumbnail_url | string \| null | URL of the thumbnail |
| 8 | file_size_kb | number \| null | The file size kb value |
| 9 | file_format | string \| null | The file format value |
| 10 | tooth_numbers | number[] \| null | The tooth numbers value |
| 11 | view_angle | string \| null | The view angle value |
| 12 | tags | string[] \| null | The tags value |
| 13 | metadata | Record<string, unknown> \| null | The metadata value |
| 14 | pacs_id | string \| null | ID of the associated pacs |
| 15 | taken_date | Date \| null | Date of taken |
| 16 | taken_by | string \| null | ID of the user who performed taken |
| 17 | uploaded_by | string | ID of the user who performed uploaded |
| 18 | is_archived | boolean | Whether the record is archived |
| 19 | created_at | Date | Timestamp when the record was created |
| 20 | updated_at | Date | Timestamp when the record was last updated |

### 4.9. Diagnostic Order Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | order_id | string | ID of the order |
| 2 | appointment_id | string | ID of the associated appointment |
| 3 | patient_id | string | ID of the associated patient |
| 4 | doctor_id | string | ID of the associated doctor |
| 5 | order_code | string | Unique code of the order |
| 6 | order_type | string | Type of order (e.g., LAB, CLINICAL, IMAGING) |
| 7 | priority | string | Priority level of the record |
| 8 | tooth_number | string \| null | Tooth number in dental notation |
| 9 | area | string \| null | The area value |
| 10 | status | string | Current status of the record |
| 11 | result_summary | string \| null | The result summary value |
| 12 | result_attachment_url | string \| null | URL of the result attachment |
| 13 | notes | string \| null | Additional notes or comments |
| 14 | ordered_at | Date \| null | Timestamp when the order was placed |
| 15 | completed_at | Date \| null | Timestamp when completed occurred |
| 16 | created_at | Date | Timestamp when the record was created |
| 17 | updated_at | Date | Timestamp when the record was last updated |

### 4.10. Doctor Schedule Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | schedule_id | string | ID of the doctor schedule |
| 2 | doctor_id | string | ID of the associated doctor |
| 3 | clinic_id | string | ID of the associated clinic |
| 4 | shift_id | string \| null | ID of the work shift |
| 5 | work_date | Date | Scheduled working date |
| 6 | room_id | string \| null | ID of the treatment room |
| 7 | max_patients | number | Maximum number of patients for this schedule |
| 8 | status | string | Current status of the record |
| 9 | notes | string \| null | Additional notes or comments |
| 10 | created_at | Date | Timestamp when the record was created |
| 11 | updated_at | Date | Timestamp when the record was last updated |

### 4.11. Doctor Specialty Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | doctor_id | string | ID of the associated doctor |
| 2 | specialty_id | string | ID of the medical specialty |
| 3 | certification_number | string \| null | The certification number value |
| 4 | certified_date | Date \| null | Date of certified |
| 5 | is_primary | boolean | Whether the record is primary |
| 6 | created_at | Date | Timestamp when the record was created |

### 4.12. Examination Session Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | session_id | string | ID of the associated examination session |
| 2 | record_id | string \| null | ID of the associated medical record |
| 3 | patient_id | string \| null | ID of the associated patient |
| 4 | doctor_id | string | ID of the associated doctor |
| 5 | clinic_id | string | ID of the associated clinic |
| 6 | session_date | Date | Date of session |
| 7 | chief_complaint | string \| null | Primary reason for the visit |
| 8 | present_illness | string \| null | The present illness value |
| 9 | physical_examination | string \| null | The physical examination value |
| 10 | vital_signs | Record<string, unknown> \| null | The vital signs value |
| 11 | status | string | Current status of the record |
| 12 | started_at | Date | Timestamp when started occurred |
| 13 | completed_at | Date \| null | Timestamp when completed occurred |
| 14 | created_at | Date | Timestamp when the record was created |

### 4.13. Image Annotation Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | annotation_id | string | ID of the image annotation |
| 2 | image_id | string | ID of the dental image |
| 3 | annotated_by | string | ID of the user who created the annotation |
| 4 | annotation_type | string \| null | Type of annotation (e.g., marker, region) |
| 5 | annotation_data | Record<string, unknown> \| null | The annotation data value |
| 6 | note | string \| null | Additional notes or comments |
| 7 | created_at | Date | Timestamp when the record was created |
| 8 | updated_at | Date | Timestamp when the record was last updated |

### 4.14. Image Category Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | category_id | string | ID of the image category |
| 2 | category_name | string | Name of the image category |
| 3 | created_at | Date | Timestamp when the record was created |
| 4 | updated_at | Date | Timestamp when the record was last updated |

### 4.15. Kyc Verification Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | kyc_id | string | Unique identifier of the KYC verification |
| 2 | user_id | string | ID of the associated user |
| 3 | id_type | string | Type of identity document (e.g., CITIZEN_ID, PASSPORT) |
| 4 | id_number | string | Identity document number |
| 5 | full_name | string \| null | Full name of the user |
| 6 | date_of_birth | string \| null | Date of birth |
| 7 | id_front_image | string \| null | Encrypted path to the front image of the ID document |
| 8 | id_back_image | string \| null | Encrypted path to the back image of the ID document |
| 9 | selfie_image | string \| null | Encrypted path to the selfie image |
| 10 | verification_status | KycStatus | Current KYC verification status |
| 11 | ocr_status | KycOcrStatus | Status of OCR processing |
| 12 | ocr_confidence | number \| null | Confidence score of OCR extraction (0-100) |
| 13 | ocr_payload | Record<string, unknown> \| null | Raw OCR extraction results in JSON |
| 14 | ocr_attempts | number | Number of OCR processing attempts |
| 15 | ocr_last_error | string \| null | Last OCR processing error message |
| 16 | ocr_processed_at | Date \| null | Timestamp when OCR processing completed |
| 17 | document_hash | string \| null | Hash of the uploaded document for integrity check |
| 18 | notes | string \| null | Additional notes or comments |
| 19 | admin_notes | string \| null | Notes added by the admin reviewer |
| 20 | rejection_reason | string \| null | Reason for KYC rejection |
| 21 | submitted_at | Date \| null | Timestamp when KYC was submitted |
| 22 | verified_at | Date \| null | Timestamp when KYC was verified |
| 23 | verified_by | string \| null | ID of the admin who verified the KYC |
| 24 | consent_version | string \| null | Version of the consent agreement |
| 25 | consent_accepted_at | Date \| null | Timestamp when consent was accepted |
| 26 | document_storage_consent_accepted_at | Date \| null | Timestamp when document storage consent was accepted |
| 27 | ocr_processing_consent_accepted_at | Date \| null | Timestamp when OCR processing consent was accepted |
| 28 | no_marketing_consent_accepted_at | Date \| null | Timestamp when no-marketing consent was accepted |
| 29 | processing_purpose | string | Stated purpose for data processing |
| 30 | retention_policy_version | string \| null | Version of the data retention policy |
| 31 | retention_expires_at | Date \| null | Timestamp when data retention expires |
| 32 | deleted_at | Date \| null | Timestamp when the record was soft-deleted |
| 33 | created_at | Date | Timestamp when the record was created |
| 34 | updated_at | Date | Timestamp when the record was last updated |
| 35 | created_by | string \| null | ID of the user who created the record |
| 36 | updated_by | string \| null | ID of the user who last updated the record |

### 4.16. Lab Test Result Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | result_id | string | ID of the test result |
| 2 | order_id | string | ID of the order |
| 3 | test_name | string | Name of the laboratory test |
| 4 | result_value | string \| null | Value of the test result |
| 5 | result_unit | string \| null | The result unit value |
| 6 | reference_range | string \| null | Normal reference range for the test |
| 7 | is_abnormal | boolean | Whether the result is outside normal range |
| 8 | notes | string \| null | Additional notes or comments |
| 9 | created_at | Date | Timestamp when the record was created |

### 4.17. Medical History Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | history_id | string | ID of the history record |
| 2 | patient_id | string | ID of the associated patient |
| 3 | condition_name | string | Name of the medical condition |
| 4 | condition_type | string \| null | Type classification of the record |
| 5 | diagnosed_date | Date \| null | Date of diagnosed |
| 6 | treatment | string \| null | The treatment value |
| 7 | notes | string \| null | Additional notes or comments |
| 8 | created_at | Date | Timestamp when the record was created |
| 9 | updated_at | Date | Timestamp when the record was last updated |

### 4.18. Medical Record Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | record_id | string | ID of the associated medical record |
| 2 | patient_id | string | ID of the associated patient |
| 3 | appointment_id | string \| null | ID of the associated appointment |
| 4 | clinic_id | string | ID of the associated clinic |
| 5 | doctor_id | string | ID of the associated doctor |
| 6 | visit_date | Date | Date of visit |
| 7 | chief_complaint | string \| null | Primary reason for the visit |
| 8 | diagnosis | string \| null | The diagnosis value |
| 9 | treatment_plan | string \| null | The treatment plan value |
| 10 | notes | string \| null | Additional notes or comments |
| 11 | record_status | string | The record status value |
| 12 | record_hash | string \| null | The record hash value |
| 13 | blockchain_tx_id | string \| null | ID of the associated blockchain_tx |
| 14 | finalized_at | Date \| null | Timestamp when finalized occurred |
| 15 | finalized_by | string \| null | ID of the user who performed finalized |
| 16 | created_at | Date | Timestamp when the record was created |
| 17 | updated_at | Date | Timestamp when the record was last updated |

### 4.19. Medical Record Version Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | version_id | string | ID of the record version |
| 2 | record_id | string | ID of the associated medical record |
| 3 | version_number | number | Version number of the record |
| 4 | snapshot | Record<string, unknown> | The snapshot value |
| 5 | changed_by | string | ID of the user who made the change |
| 6 | change_reason | string \| null | Reason for the change |
| 7 | created_at | Date | Timestamp when the record was created |

### 4.20. O Auth Connection Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | connectionId | string | Unique identifier of the OAuth connection |
| 2 | accountId | string \| null | Unique identifier of the account |
| 3 | provider | string | OAuth provider name (e.g., google) |
| 4 | providerUserId | string | User ID from the OAuth provider |
| 5 | accessToken | string \| null | OAuth access token |
| 6 | refreshToken | string \| null | JWT refresh token for session renewal |
| 7 | tokenExpiresAt | Date \| null | Expiration time of the OAuth token |
| 8 | isActive | boolean | Whether the connection is currently active |
| 9 | createdAt | Date | Timestamp when the record was created |
| 10 | updatedAt | Date | Timestamp when the record was last updated |

### 4.21. Otp Token Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | otpId | string | Unique identifier of the OTP token |
| 2 | accountId | string \| null | Unique identifier of the account |
| 3 | otpCode | string | The OTP code value |
| 4 | otpType | OtpType | Type of OTP (e.g., login, password_reset, identity_verify) |
| 5 | expiresAt | Date | Expiration timestamp of the token |
| 6 | usedAt | Date \| null | Timestamp when the OTP was used |
| 7 | createdAt | Date | Timestamp when the record was created |
| 8 | updatedAt | Date | Timestamp when the record was last updated |

### 4.22. Patient Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | patient_id | string | ID of the associated patient |
| 2 | user_id | string \| null | ID of the associated user |
| 3 | patient_code | string | Unique code of the patient |
| 4 | full_name | string | Full name of the user |
| 5 | date_of_birth | Date \| null | Date of birth |
| 6 | gender | string \| null | Gender of the user |
| 7 | phone | string \| null | Phone number |
| 8 | email | string \| null | Email address |
| 9 | address | string \| null | Physical address |
| 10 | ward | string \| null | The ward value |
| 11 | district | string \| null | District name |
| 12 | city | string \| null | City name |
| 13 | emergency_contact | string \| null | The emergency contact value |
| 14 | emergency_phone | string \| null | The emergency phone value |
| 15 | blood_type | string \| null | Type classification of the record |
| 16 | allergies | string[] \| null | The allergies value |
| 17 | chronic_diseases | string[] \| null | The chronic diseases value |
| 18 | insurance_number | string \| null | The insurance number value |
| 19 | insurance_provider | string \| null | The insurance provider value |
| 20 | created_at | Date | Timestamp when the record was created |
| 21 | updated_at | Date | Timestamp when the record was last updated |

### 4.23. Permission Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | permission_id | string | ID of the permission |
| 2 | permission_name | string | Unique name of the permission (e.g., patient.record.read) |
| 3 | resource | string \| null | Resource that was affected (e.g., auth, appointment) |
| 4 | action | string \| null | Action that was performed (e.g., LOGIN, CREATE, UPDATE) |
| 5 | created_at | Date | Timestamp when the record was created |
| 6 | updated_at | Date | Timestamp when the record was last updated |
| 7 | created_by | string \| null | ID of the user who created the record |
| 8 | updated_by | string \| null | ID of the user who last updated the record |

### 4.24. Prescription Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | prescription_id | string | ID of the prescription |
| 2 | record_id | string \| null | ID of the associated medical record |
| 3 | patient_id | string | ID of the associated patient |
| 4 | doctor_id | string | ID of the associated doctor |
| 5 | prescription_date | Date | Date of prescription |
| 6 | status | string | Current status of the record |
| 7 | notes | string \| null | Additional notes or comments |
| 8 | digital_signature_id | string \| null | ID of the associated digital_signature |
| 9 | created_at | Date | Timestamp when the record was created |
| 10 | updated_at | Date | Timestamp when the record was last updated |

### 4.25. Prescription Item Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | item_id | string | ID of the prescription item |
| 2 | prescription_id | string | ID of the prescription |
| 3 | medication_name | string | Name of the prescribed medication |
| 4 | medication_code | string \| null | Unique code identifier |
| 5 | dosage | string | Dosage instructions |
| 6 | route | string \| null | The route value |
| 7 | frequency | string | Administration frequency |
| 8 | duration_days | number \| null | Duration of medication in days |
| 9 | quantity | number \| null | Quantity to dispense |
| 10 | instructions | string \| null | The instructions value |
| 11 | created_at | Date | Timestamp when the record was created |

### 4.26. Record Export Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | patient_id | string | ID of the associated patient |
| 2 | record_id | string | ID of the associated medical record |
| 3 | file_url | string \| null | URL of the file |
| 4 | expires_at | Date \| null | Timestamp when expires occurred |
| 5 | created_at | Date | Timestamp when the record was created |

### 4.27. Refresh Token Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | tokenId | string | Unique identifier of the token |
| 2 | accountId | string \| null | Unique identifier of the account |
| 3 | tokenHash | string | Hashed value of the refresh token |
| 4 | expiresAt | Date | Expiration timestamp of the token |
| 5 | revokedAt | Date \| null | Timestamp when the token was revoked |
| 6 | deviceInfo | string \| null | Information about the device used |
| 7 | ipAddress | string \| null | IP address of the client |
| 8 | createdAt | Date | Timestamp when the record was created |

### 4.28. Role Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | role_id | string | ID of the associated role |
| 2 | role_name | string | Name of the role |
| 3 | created_at | Date | Timestamp when the record was created |
| 4 | updated_at | Date | Timestamp when the record was last updated |
| 5 | created_by | string \| null | ID of the user who created the record |
| 6 | updated_by | string \| null | ID of the user who last updated the record |

### 4.29. Role Permission Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | id | string | The id value |
| 2 | role_id | string | ID of the associated role |
| 3 | permission_id | string | ID of the permission |
| 4 | assigned_at | Date | Timestamp when the assignment was made |
| 5 | assigned_by | string \| null | ID of the user who made the assignment |

### 4.30. Schedule Change Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | change_id | string | ID of the associated change |
| 2 | schedule_id | string | ID of the doctor schedule |
| 3 | changed_by | string | ID of the user who made the change |
| 4 | change_type | string | Type of schedule change |
| 5 | old_values | Record<string, any> \| null | Previous values before the change |
| 6 | new_values | Record<string, any> \| null | New values after the change |
| 7 | reason | string \| null | Reason for the action |
| 8 | approved_by | string \| null | ID of the user who approved the request |
| 9 | approval_status | string | The approval status value |
| 10 | created_at | Date | Timestamp when the record was created |

### 4.31. Service Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | service_id | string | ID of the associated service |
| 2 | service_code | string | Unique code identifier |
| 3 | service_name | string | Name of the service |
| 4 | category_id | string \| null | ID of the image category |
| 5 | specialty_id | string \| null | ID of the medical specialty |
| 6 | duration_minutes | number | Duration of the appointment in minutes |
| 7 | base_price | number \| null | Base price of the service |
| 8 | currency | string | Currency code (e.g., VND, USD) |
| 9 | is_active | boolean | Whether the record is currently active |
| 10 | requires_appointment | boolean | The requires appointment value |
| 11 | preparation_instructions | string \| null | The preparation instructions value |
| 12 | created_at | Date | Timestamp when the record was created |
| 13 | updated_at | Date | Timestamp when the record was last updated |

### 4.32. Specialty Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | specialty_id | string | ID of the medical specialty |
| 2 | specialty_name | string | Name of the medical specialty |
| 3 | specialty_code | string | Unique code of the medical specialty |
| 4 | icon_url | string \| null | URL of the icon |
| 5 | is_active | boolean | Whether the record is currently active |
| 6 | display_order | number \| null | The display order value |
| 7 | created_at | Date | Timestamp when the record was created |
| 8 | updated_at | Date | Timestamp when the record was last updated |

### 4.33. Symptom Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | symptom_id | string | Unique identifier of the symptom |
| 2 | session_id | string | ID of the associated examination session |
| 3 | patient_id | string \| null | ID of the associated patient |
| 4 | symptom_name | string | Name of the symptom |
| 5 | body_location | string \| null | The body location value |
| 6 | severity | string \| null | The severity value |
| 7 | onset_date | Date \| null | Date of onset |
| 8 | duration | string \| null | The duration value |
| 9 | recorded_by | string | ID of the user who performed recorded |
| 10 | created_at | Date | Timestamp when the record was created |
| 11 | updated_at | Date | Timestamp when the record was last updated |

### 4.34. Treatment History Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | treatment_id | string | ID of the treatment record |
| 2 | record_id | string | ID of the associated medical record |
| 3 | patient_id | string | ID of the associated patient |
| 4 | treatment_date | Date | Date when treatment was performed |
| 5 | tooth_numbers | number[] \| null | The tooth numbers value |
| 6 | procedure_code | string \| null | Unique code identifier |
| 7 | procedure_name | string | Name of the procedure |
| 8 | cost | number \| null | The cost value |
| 9 | status | string | Current status of the record |
| 10 | performed_by | string | ID of the user who performed performed |
| 11 | created_at | Date | Timestamp when the record was created |
| 12 | updated_at | Date | Timestamp when the record was last updated |

### 4.35. Treatment Plan Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | plan_id | string | ID of the treatment plan |
| 2 | patient_id | string | ID of the associated patient |
| 3 | record_id | string \| null | ID of the associated medical record |
| 4 | plan_name | string \| null | Name of the treatment plan |
| 5 | objectives | string \| null | Objectives of the treatment plan |
| 6 | duration_weeks | number \| null | Planned duration in weeks |
| 7 | status | string | Current status of the record |
| 8 | sent_at | Date \| null | Timestamp when sent occurred |
| 9 | sent_to | string \| null | The sent to value |
| 10 | sent_via | string \| null | The sent via value |
| 11 | confirmed_at | Date \| null | Timestamp when confirmed occurred |
| 12 | created_by | string | ID of the user who created the record |
| 13 | created_at | Date | Timestamp when the record was created |
| 14 | updated_at | Date | Timestamp when the record was last updated |

### 4.36. Treatment Room Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | room_id | string | ID of the treatment room |
| 2 | clinic_id | string | ID of the associated clinic |
| 3 | room_name | string | Name of the treatment room |
| 4 | room_code | string | Unique code of the treatment room |
| 5 | room_type | string \| null | Type of the treatment room |
| 6 | floor_number | number \| null | Floor number where the room is located |
| 7 | capacity | number \| null | Maximum capacity of the room |
| 8 | equipment_list | Record<string, any> \| null | List of equipment available in the room |
| 9 | status | string | Current status of the record |
| 10 | created_at | Date | Timestamp when the record was created |
| 11 | updated_at | Date | Timestamp when the record was last updated |

### 4.37. User Profile Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | user_id | string | ID of the associated user |
| 2 | full_name | string | Full name of the user |
| 3 | email | string \| null | Email address |
| 4 | phone | string \| null | Phone number |
| 5 | date_of_birth | Date \| null | Date of birth |
| 6 | gender | string \| null | Gender of the user |
| 7 | avatar_url | string \| null | URL of the user avatar image |
| 8 | created_at | Date | Timestamp when the record was created |
| 9 | updated_at | Date | Timestamp when the record was last updated |
| 10 | created_by | string \| null | ID of the user who created the record |
| 11 | updated_by | string \| null | ID of the user who last updated the record |
| 12 | is_banned | boolean | Whether the user is banned |
| 13 | banned_at | Date \| null | Timestamp when the user was banned |
| 14 | ban_reason | string \| null | Reason for the ban |

### 4.38. User Role Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | id | string | The id value |
| 2 | user_id | string | ID of the associated user |
| 3 | role_id | string | ID of the associated role |
| 4 | assigned_at | Date | Timestamp when the assignment was made |
| 5 | assigned_by | string \| null | ID of the user who made the assignment |

### 4.39. Work Shift Entity

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | shift_id | string | ID of the work shift |
| 2 | shift_name | string | Name of the shift |
| 3 | start_time | string | The start time value |
| 4 | end_time | string | The end time value |
| 5 | created_at | Date | Timestamp when the record was created |

## Data Transfer Object (DTO) Classes

### 4.40. Assign Permission DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | permission_id | string | ID of the permission |

### 4.41. Assign Role DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | role_id | string | ID of the associated role |

### 4.42. Auth Email Login DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | email | string | Email address |
| 2 | password | string | Password for authentication |

### 4.43. Auth Forgot Password DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | email | string | Email address |

### 4.44. Auth Google Login DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | token | string | JWT access token |

### 4.45. Auth Register Login DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | email | string | Email address |
| 2 | password | string | Password for authentication |
| 3 | username (optional) | string | Username for login |
| 4 | phone (optional) | string | Phone number |
| 5 | fullName (optional) | string | Full name of the user |
| 6 | gender (optional) | GenderEnum | Gender of the user |

### 4.46. Auth Reset Password DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | hash | string | Verification hash token |
| 2 | password | string | Password for authentication |

### 4.47. Auth Update DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | username (optional) | string \| null | Username for login |
| 2 | email (optional) | string \| null | Email address |
| 3 | phone (optional) | string \| null | Phone number |
| 4 | password (optional) | string | Password for authentication |
| 5 | oldPassword (optional) | string | Current password for verification |

### 4.48. Book By Doctor DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | doctor_id | string | ID of the associated doctor |
| 2 | patient_id | string | ID of the associated patient |
| 3 | clinic_id | string | ID of the associated clinic |
| 4 | room_id (optional) | string | ID of the treatment room |
| 5 | service_id (optional) | string | ID of the associated service |
| 6 | appointment_date | string | Date of the appointment |
| 7 | appointment_time | string | Scheduled time of the appointment |
| 8 | duration_minutes (optional) | number | Duration of the appointment in minutes |
| 9 | appointment_type (optional) | string | Type of appointment (e.g., regular, follow-up) |
| 10 | chief_complaint (optional) | string | Primary reason for the visit |
| 11 | notes (optional) | string | Additional notes or comments |
| 12 | created_by | string | ID of the user who created the record |

### 4.49. Book By Specialty DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | specialty_id | string | ID of the medical specialty |
| 2 | patient_id | string | ID of the associated patient |
| 3 | clinic_id | string | ID of the associated clinic |
| 4 | preferred_date (optional) | string | Preferred date for the appointment |
| 5 | preferred_time (optional) | string | Preferred time for the appointment |
| 6 | duration_minutes (optional) | number | Duration of the appointment in minutes |
| 7 | chief_complaint (optional) | string | Primary reason for the visit |
| 8 | notes (optional) | string | Additional notes or comments |
| 9 | created_by | string | ID of the user who created the record |

### 4.50. Book Outside Hours DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | doctor_id | string | ID of the associated doctor |
| 2 | patient_id | string | ID of the associated patient |
| 3 | clinic_id | string | ID of the associated clinic |
| 4 | room_id (optional) | string | ID of the treatment room |
| 5 | service_id (optional) | string | ID of the associated service |
| 6 | appointment_date | string | Date of the appointment |
| 7 | appointment_time | string | Scheduled time of the appointment |
| 8 | duration_minutes (optional) | number | Duration of the appointment in minutes |
| 9 | appointment_type (optional) | string | Type of appointment (e.g., regular, follow-up) |
| 10 | chief_complaint (optional) | string | Primary reason for the visit |
| 11 | outside_hours_reason | string | Reason for scheduling outside working hours |
| 12 | approved_by (optional) | string | ID of the user who approved the request |
| 13 | notes (optional) | string | Additional notes or comments |
| 14 | created_by | string | ID of the user who created the record |

### 4.51. Cancel Appointment DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | cancelled_by | string | ID of the user who cancelled the appointment |
| 2 | cancellation_reason (optional) | string | Reason for appointment cancellation |

### 4.52. Change Appointment Status DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | status | string | Current status of the record |
| 2 | changed_by | string | ID of the user who made the change |
| 3 | reason (optional) | string | Reason for the action |

### 4.53. Create Appointment DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | patient_id | string | ID of the associated patient |
| 2 | doctor_id | string | ID of the associated doctor |
| 3 | clinic_id | string | ID of the associated clinic |
| 4 | room_id (optional) | string | ID of the treatment room |
| 5 | service_id (optional) | string | ID of the associated service |
| 6 | appointment_date | string | Date of the appointment |
| 7 | appointment_time | string | Scheduled time of the appointment |
| 8 | duration_minutes (optional) | number | Duration of the appointment in minutes |
| 9 | appointment_type (optional) | string | Type of appointment (e.g., regular, follow-up) |
| 10 | chief_complaint (optional) | string | Primary reason for the visit |
| 11 | notes (optional) | string | Additional notes or comments |
| 12 | is_outside_hours (optional) | boolean | Whether the appointment is outside working hours |
| 13 | outside_hours_reason (optional) | string | Reason for scheduling outside working hours |
| 14 | approved_by (optional) | string | ID of the user who approved the request |
| 15 | created_by | string | ID of the user who created the record |

### 4.54. Create Clinical Order DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | record_id (optional) | string | ID of the associated medical record |
| 2 | patient_id | string | ID of the associated patient |
| 3 | ordered_by | string | ID of the doctor who placed the order |
| 4 | order_type | string | Type of order (e.g., LAB, CLINICAL, IMAGING) |
| 5 | test_type | string | Type classification of the record |
| 6 | clinical_indication (optional) | string | The clinical indication value |
| 7 | teeth_numbers (optional) | number[] | The teeth numbers value |
| 8 | urgency (optional) | string | The urgency value |
| 9 | status (optional) | string | Current status of the record |
| 10 | ordered_date (optional) | string | Date of ordered |
| 11 | scheduled_date (optional) | string | Date of scheduled |
| 12 | completed_date (optional) | string | Date of completed |
| 13 | result_url (optional) | string | URL of the result |
| 14 | report (optional) | string | The report value |

### 4.55. Create Dental Image DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | patient_id | string | ID of the associated patient |
| 2 | record_id (optional) | string | ID of the associated medical record |
| 3 | category_id (optional) | string | ID of the image category |
| 4 | image_type | string | Type classification of the record |
| 5 | image_url | string | URL of the stored image |
| 6 | thumbnail_url (optional) | string | URL of the thumbnail |
| 7 | file_size_kb (optional) | number | The file size kb value |
| 8 | file_format (optional) | string | The file format value |
| 9 | tooth_numbers (optional) | number[] | The tooth numbers value |
| 10 | view_angle (optional) | string | The view angle value |
| 11 | tags (optional) | string[] | The tags value |
| 12 | metadata (optional) | Record<string, unknown> | The metadata value |
| 13 | pacs_id (optional) | string | ID of the associated pacs |
| 14 | taken_date (optional) | string | Date of taken |
| 15 | taken_by (optional) | string | ID of the user who performed taken |
| 16 | uploaded_by | string | ID of the user who performed uploaded |
| 17 | is_archived (optional) | boolean | Whether the record is archived |

### 4.56. Create Diagnostic Order DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | appointment_id | string | ID of the associated appointment |
| 2 | patient_id | string | ID of the associated patient |
| 3 | doctor_id | string | ID of the associated doctor |
| 4 | order_type | string | Type of order (e.g., LAB, CLINICAL, IMAGING) |
| 5 | priority (optional) | string | Priority level of the record |
| 6 | tooth_number (optional) | string | Tooth number in dental notation |
| 7 | area (optional) | string | The area value |
| 8 | notes (optional) | string | Additional notes or comments |

### 4.57. Create Doctor Schedule DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | doctor_id | string | ID of the associated doctor |
| 2 | clinic_id | string | ID of the associated clinic |
| 3 | shift_id (optional) | string \| null | ID of the work shift |
| 4 | work_date | string | Scheduled working date |
| 5 | room_id (optional) | string \| null | ID of the treatment room |
| 6 | max_patients (optional) | number | Maximum number of patients for this schedule |
| 7 | notes (optional) | string \| null | Additional notes or comments |
| 8 | status (optional) | ScheduleStatus | Current status of the record |

### 4.58. Create Image Annotation DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | image_id | string | ID of the dental image |
| 2 | annotated_by | string | ID of the user who created the annotation |
| 3 | annotation_type (optional) | string | Type of annotation (e.g., marker, region) |
| 4 | annotation_data (optional) | Record<string, unknown> | The annotation data value |
| 5 | note (optional) | string | Additional notes or comments |

### 4.59. Create Medical History DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | patient_id | string | ID of the associated patient |
| 2 | condition_name | string | Name of the medical condition |
| 3 | condition_type (optional) | string | Type classification of the record |
| 4 | diagnosed_date (optional) | string | Date of diagnosed |
| 5 | treatment (optional) | string | The treatment value |
| 6 | notes (optional) | string | Additional notes or comments |
| 7 | condition_name (optional) | string | Name of the medical condition |
| 8 | condition_type (optional) | string | Type classification of the record |
| 9 | diagnosed_date (optional) | string | Date of diagnosed |
| 10 | treatment (optional) | string | The treatment value |
| 11 | notes (optional) | string | Additional notes or comments |

### 4.60. Create Patient DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | user_id (optional) | string | ID of the associated user |
| 2 | patient_code | string | Unique code of the patient |
| 3 | full_name | string | Full name of the user |
| 4 | date_of_birth (optional) | string | Date of birth |
| 5 | gender (optional) | string | Gender of the user |
| 6 | phone (optional) | string | Phone number |
| 7 | email (optional) | string | Email address |
| 8 | address (optional) | string | Physical address |
| 9 | ward (optional) | string | The ward value |
| 10 | district (optional) | string | District name |
| 11 | city (optional) | string | City name |
| 12 | emergency_contact (optional) | string | The emergency contact value |
| 13 | emergency_phone (optional) | string | The emergency phone value |
| 14 | blood_type (optional) | string | Type classification of the record |
| 15 | allergies (optional) | string[] | The allergies value |
| 16 | chronic_diseases (optional) | string[] | The chronic diseases value |
| 17 | insurance_number (optional) | string | The insurance number value |
| 18 | insurance_provider (optional) | string | The insurance provider value |

### 4.61. Create Permission DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | permission_name | string | Unique name of the permission (e.g., patient.record.read) |
| 2 | resource (optional) | string | Resource that was affected (e.g., auth, appointment) |
| 3 | action (optional) | string | Action that was performed (e.g., LOGIN, CREATE, UPDATE) |

### 4.62. Create Prescription DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | record_id (optional) | string | ID of the associated medical record |
| 2 | patient_id | string | ID of the associated patient |
| 3 | doctor_id | string | ID of the associated doctor |
| 4 | prescription_date (optional) | string | Date of prescription |
| 5 | status (optional) | string | Current status of the record |
| 6 | notes (optional) | string | Additional notes or comments |
| 7 | digital_signature_id (optional) | string | ID of the associated digital_signature |

### 4.63. Create Prescription Item DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | prescription_id | string | ID of the prescription |
| 2 | medication_name | string | Name of the prescribed medication |
| 3 | medication_code (optional) | string | Unique code identifier |
| 4 | dosage | string | Dosage instructions |
| 5 | route (optional) | string | The route value |
| 6 | frequency | string | Administration frequency |
| 7 | duration_days (optional) | number | Duration of medication in days |
| 8 | quantity (optional) | number | Quantity to dispense |
| 9 | instructions (optional) | string | The instructions value |

### 4.64. Create Record Export DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | patient_id | string | ID of the associated patient |
| 2 | record_id | string | ID of the associated medical record |
| 3 | file_url (optional) | string | URL of the file |
| 4 | expires_at (optional) | Date | Timestamp when expires occurred |

### 4.65. Create Specialty DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | specialty_name | string | Name of the medical specialty |
| 2 | specialty_code | string | Unique code of the medical specialty |
| 3 | icon_url (optional) | string \| null | URL of the icon |
| 4 | is_active (optional) | boolean | Whether the record is currently active |
| 5 | display_order (optional) | number \| null | The display order value |

### 4.66. Create Symptom DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | session_id | string | ID of the associated examination session |
| 2 | patient_id (optional) | string | ID of the associated patient |
| 3 | symptom_name | string | Name of the symptom |
| 4 | body_location (optional) | string | The body location value |
| 5 | severity (optional) | string | The severity value |
| 6 | onset_date (optional) | string | Date of onset |
| 7 | duration (optional) | string | The duration value |
| 8 | recorded_by | string | ID of the user who performed recorded |

### 4.67. Create Treatment History DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | record_id | string | ID of the associated medical record |
| 2 | patient_id | string | ID of the associated patient |
| 3 | treatment_date | string | Date when treatment was performed |
| 4 | tooth_numbers (optional) | number[] | The tooth numbers value |
| 5 | procedure_code (optional) | string | Unique code identifier |
| 6 | procedure_name | string | Name of the procedure |
| 7 | cost (optional) | number | The cost value |
| 8 | status (optional) | string | Current status of the record |
| 9 | performed_by | string | ID of the user who performed performed |

### 4.68. Create Treatment Plan DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | patient_id | string | ID of the associated patient |
| 2 | record_id (optional) | string | ID of the associated medical record |
| 3 | plan_name (optional) | string | Name of the treatment plan |
| 4 | objectives (optional) | string | Objectives of the treatment plan |
| 5 | duration_weeks (optional) | number | Planned duration in weeks |
| 6 | status (optional) | string | Current status of the record |
| 7 | sent_at (optional) | Date | Timestamp when sent occurred |
| 8 | sent_to (optional) | string | The sent to value |
| 9 | sent_via (optional) | string | The sent via value |
| 10 | confirmed_at (optional) | Date | Timestamp when confirmed occurred |
| 11 | created_by | string | ID of the user who created the record |

### 4.69. Create Treatment Room DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | room_name | string | Name of the treatment room |
| 2 | room_code | string | Unique code of the treatment room |
| 3 | room_type (optional) | string \| null | Type of the treatment room |
| 4 | floor_number (optional) | number \| null | Floor number where the room is located |
| 5 | capacity (optional) | number \| null | Maximum capacity of the room |
| 6 | equipment_list (optional) | Record<string, any> \| null | List of equipment available in the room |
| 7 | status (optional) | string | Current status of the record |

### 4.70. Lock Account DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | reason | string | Reason for the action |

### 4.71. Login Response DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | token | string | JWT access token |
| 2 | refreshToken | string | JWT refresh token for session renewal |
| 3 | tokenExpires | number | Expiration timestamp for the access token |
| 4 | user | Account | Account information of the authenticated user |
| 5 | userProfile | UserProfileEntity \| null | User profile linked to the account |

### 4.72. Query Appointment DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | page (optional) | number = 1 | Page number for pagination |
| 2 | limit (optional) | number = 10 | Maximum number of items per page |
| 3 | patient_id (optional) | string | ID of the associated patient |
| 4 | doctor_id (optional) | string | ID of the associated doctor |
| 5 | clinic_id (optional) | string | ID of the associated clinic |
| 6 | status (optional) | string | Current status of the record |
| 7 | appointment_type (optional) | string | Type of appointment (e.g., regular, follow-up) |
| 8 | appointment_date (optional) | string | Date of the appointment |
| 9 | date_from (optional) | string | The date from value |
| 10 | date_to (optional) | string | The date to value |
| 11 | is_outside_hours (optional) | boolean | Whether the appointment is outside working hours |
| 12 | payment_status (optional) | string | Current payment status (e.g., PENDING, COMPLETED) |

### 4.73. Query Audit Log DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | user_id (optional) | string | ID of the associated user |
| 2 | action (optional) | string | Action that was performed (e.g., LOGIN, CREATE, UPDATE) |
| 3 | resource (optional) | string | Resource that was affected (e.g., auth, appointment) |
| 4 | from_date (optional) | string | Start date for filtering |
| 5 | to_date (optional) | string | End date for filtering |
| 6 | page (optional) | number | Page number for pagination |
| 7 | limit (optional) | number | Maximum number of items per page |

### 4.74. Query Clinic DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | page (optional) | number = 1 | Page number for pagination |
| 2 | limit (optional) | number = 10 | Maximum number of items per page |
| 3 | clinic_name (optional) | string | Name of the clinic |
| 4 | city (optional) | string | City name |
| 5 | district (optional) | string | District name |
| 6 | status (optional) | string | Current status of the record |

### 4.75. Query Role DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | page (optional) | number = 1 | Page number for pagination |
| 2 | limit (optional) | number = 10 | Maximum number of items per page |
| 3 | search (optional) | string | Search keyword for filtering |

### 4.76. Query Treatment Room DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | page (optional) | number = 1 | Page number for pagination |
| 2 | limit (optional) | number = 10 | Maximum number of items per page |
| 3 | room_type (optional) | string | Type of the treatment room |
| 4 | status (optional) | string | Current status of the record |

### 4.77. Query User Profile DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | page (optional) | number = 1 | Page number for pagination |
| 2 | limit (optional) | number = 10 | Maximum number of items per page |
| 3 | email (optional) | string | Email address |
| 4 | phone (optional) | string | Phone number |
| 5 | full_name (optional) | string | Full name of the user |
| 6 | gender (optional) | string | Gender of the user |

### 4.78. Submit Kyc DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | idType | string | Type of identity document |
| 2 | idNumber | string | Identity document number |
| 3 | fullName | string | Full name of the user |
| 4 | dateOfBirth | string | The date of birth value |
| 5 | consentAccepted | string | Whether the user accepted the consent terms |
| 6 | documentStorageConsentAccepted | string | The document storage consent accepted value |
| 7 | ocrProcessingConsentAccepted | string | The ocr processing consent accepted value |
| 8 | noMarketingConsentAccepted | string | The no marketing consent accepted value |
| 9 | consentVersion (optional) | string | The consent version value |
| 10 | retentionPolicyVersion (optional) | string | The retention policy version value |
| 11 | notes (optional) | string | Additional notes or comments |

### 4.79. Transfer Schedule DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | to_doctor_id | string | ID of the associated to_doctor |
| 2 | transferred_by | string | ID of the user who performed transferred |
| 3 | reason | string | Reason for the action |
| 4 | notes (optional) | string | Additional notes or comments |

### 4.80. Update Appointment DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | room_id (optional) | string | ID of the treatment room |
| 2 | service_id (optional) | string | ID of the associated service |
| 3 | appointment_date (optional) | string | Date of the appointment |
| 4 | appointment_time (optional) | string | Scheduled time of the appointment |
| 5 | appointment_type (optional) | string | Type of appointment (e.g., regular, follow-up) |
| 6 | duration_minutes (optional) | number | Duration of the appointment in minutes |
| 7 | chief_complaint (optional) | string | Primary reason for the visit |
| 8 | notes (optional) | string | Additional notes or comments |
| 9 | payment_status (optional) | string | Current payment status (e.g., PENDING, COMPLETED) |
| 10 | payment_id (optional) | string | Reference to the associated payment |

### 4.81. Update Clinic DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | clinic_name (optional) | string | Name of the clinic |
| 2 | address (optional) | string | Physical address |
| 3 | ward (optional) | string \| null | The ward value |
| 4 | district (optional) | string \| null | District name |
| 5 | city (optional) | string \| null | City name |
| 6 | phone (optional) | string \| null | Phone number |
| 7 | email (optional) | string \| null | Email address |
| 8 | website (optional) | string \| null | The website value |
| 9 | logo_url (optional) | string \| null | URL of the logo |
| 10 | operating_hours (optional) | Record<string, string> \| null | The operating hours value |
| 11 | status (optional) | string | Current status of the record |
| 12 | license_number (optional) | string \| null | The license number value |
| 13 | license_expiry (optional) | string \| null | The license expiry value |

### 4.82. Update Dental Image DTO

*Extends PartialType(CreateDentalImageDto) — all fields are optional.*

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | patient_id (optional) | string | ID of the associated patient |
| 2 | record_id (optional) | string | ID of the associated medical record |
| 3 | category_id (optional) | string | ID of the image category |
| 4 | image_type (optional) | string | Type classification of the image |
| 5 | image_url (optional) | string | URL of the stored image |
| 6 | thumbnail_url (optional) | string | URL of the thumbnail image |
| 7 | file_size_kb (optional) | number | Size of the file in kilobytes |
| 8 | file_format (optional) | string | Format of the image file |
| 9 | tooth_numbers (optional) | number[] | Tooth numbers in dental notation |
| 10 | view_angle (optional) | string | Angle of the dental image view |
| 11 | description (optional) | string | Human-readable description |
| 12 | tags (optional) | string[] | Tags for categorization |
| 13 | pacs_id (optional) | string | PACS system identifier |
| 14 | taken_date (optional) | string | Date the image was taken |
| 15 | taken_by (optional) | string | ID of the user who took the image |
| 16 | uploaded_by (optional) | string | ID of the user who uploaded the image |
| 17 | is_archived (optional) | boolean | Whether the image is archived |

### 4.83. Update Doctor Schedule DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | shift_id (optional) | string \| null | ID of the work shift |
| 2 | room_id (optional) | string \| null | ID of the treatment room |
| 3 | max_patients (optional) | number | Maximum number of patients for this schedule |
| 4 | status (optional) | string | Current status of the record |
| 5 | notes (optional) | string \| null | Additional notes or comments |
| 6 | changed_by | string | ID of the user who made the change |
| 7 | change_reason (optional) | string | Reason for the change |

### 4.84. Update Medical Record DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | chief_complaint (optional) | string | Primary reason for the visit |
| 2 | diagnosis (optional) | string | Diagnosis details |
| 3 | treatment_plan (optional) | string | Treatment plan description |
| 4 | notes (optional) | string | Additional notes or comments |
| 5 | record_status (optional) | string | Current status of the record |
| 6 | record_hash (optional) | string | Hash for data integrity verification |
| 7 | blockchain_tx_id (optional) | string | Blockchain transaction ID for audit trail |

### 4.85. Update Patient DTO

*Extends PartialType(CreatePatientDto) — all fields are optional.*

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | user_id (optional) | string | Linked IAM/user profile ID |
| 2 | patient_code (optional) | string | Unique patient code for reference |
| 3 | full_name (optional) | string | Full name of the patient |
| 4 | date_of_birth (optional) | string | Date of birth |
| 5 | gender (optional) | string | Gender of the patient |
| 6 | phone (optional) | string | Phone number |
| 7 | email (optional) | string | Email address |

### 4.86. Update Role DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | role_name (optional) | string | Name of the role |

### 4.87. Update Specialty DTO

*Extends PartialType(CreateSpecialtyDto) — all fields are optional.*

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | specialty_name (optional) | string | Name of the medical specialty |
| 2 | specialty_code (optional) | string | Unique code of the medical specialty |
| 3 | description (optional) | string \| null | Human-readable description |
| 4 | icon_url (optional) | string \| null | URL of the specialty icon |
| 5 | is_active (optional) | boolean | Whether the specialty is currently active |
| 6 | display_order (optional) | number \| null | Display order for sorting |

### 4.88. Update Symptom DTO

*Extends PartialType(CreateSymptomDto) — all fields are optional.*

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | session_id (optional) | string | ID of the associated examination session |
| 2 | patient_id (optional) | string | ID of the associated patient |
| 3 | symptom_name (optional) | string | Name of the symptom |
| 4 | body_location (optional) | string | Location on the body |
| 5 | severity (optional) | string | Severity level of the symptom |
| 6 | onset_date (optional) | string | Date when the symptom started |
| 7 | duration (optional) | string | Duration of the symptom |
| 8 | description (optional) | string | Human-readable description |
| 9 | recorded_by (optional) | string | ID of the user who recorded the symptom |

### 4.89. Update Treatment History DTO

*Extends PartialType(CreateTreatmentHistoryDto) — all fields are optional.*

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | record_id (optional) | string | ID of the associated medical record |
| 2 | patient_id (optional) | string | ID of the associated patient |
| 3 | treatment_date (optional) | string | Date when treatment was performed |
| 4 | tooth_numbers (optional) | number[] | Tooth numbers in dental notation |
| 5 | procedure_code (optional) | string | Code of the dental procedure |
| 6 | procedure_name (optional) | string | Name of the dental procedure |
| 7 | description (optional) | string | Human-readable description |
| 8 | cost (optional) | number | Cost of the treatment |
| 9 | status (optional) | string | Current status of the record |
| 10 | performed_by (optional) | string | ID of the doctor who performed the treatment |

### 4.90. Update Treatment Plan DTO

*Extends PartialType(CreateTreatmentPlanDto) — all fields are optional.*

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | patient_id (optional) | string | ID of the associated patient |
| 2 | record_id (optional) | string | ID of the associated medical record |
| 3 | plan_name (optional) | string | Name of the treatment plan |
| 4 | objectives (optional) | string | Objectives of the treatment plan |
| 5 | duration_weeks (optional) | number | Planned duration in weeks |
| 6 | status (optional) | string | Current status of the plan |
| 7 | sent_at (optional) | Date | Timestamp when the plan was sent |
| 8 | sent_to (optional) | string | Recipient of the sent plan |
| 9 | sent_via (optional) | string | Channel used to send the plan |
| 10 | confirmed_at (optional) | Date | Timestamp when the plan was confirmed |
| 11 | created_by (optional) | string | ID of the user who created the plan |

### 4.91. Update Treatment Room DTO

*Extends PartialType(CreateTreatmentRoomDto) — all fields are optional.*

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | room_name (optional) | string | Name of the treatment room |
| 2 | room_code (optional) | string | Unique code of the treatment room |
| 3 | room_type (optional) | string \| null | Type of the treatment room |
| 4 | floor_number (optional) | number \| null | Floor number where the room is located |
| 5 | capacity (optional) | number \| null | Maximum capacity of the room |
| 6 | equipment_list (optional) | Record \| null | List of equipment available in the room |
| 7 | status (optional) | string | Current status of the room |

### 4.92. Update User Profile DTO

| No | Attribute | Type | Description |
|---|---|---|---|
| 1 | full_name (optional) | string | Full name of the user |
| 2 | email (optional) | string \| null | Email address |
| 3 | phone (optional) | string \| null | Phone number |
| 4 | date_of_birth (optional) | string \| null | Date of birth |
| 5 | gender (optional) | string \| null | Gender of the user |
| 6 | avatar_url (optional) | string \| null | URL of the user avatar image |

## Controller & Service Classes

### 4.93. Accounts Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new accounts record |
| 2 | me() | Returns the currently authenticated user profile |
| 3 | updateMe() | Updates the currently authenticated user profile |
| 4 | removeMe() | Deletes the currently authenticated user account |
| 5 | sendPhoneOtp() | Sends OTP to the user's phone number |
| 6 | verifyPhone() | Verifies phone number using OTP |
| 7 | findById() | Retrieves a single accounts by ID |
| 8 | update() | Updates an existing accounts record |
| 9 | remove() | Deletes an account record |
| 10 | unlockAccount() | Unlocks a previously locked user account |

### 4.94. Appointments Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new appointments record |
| 2 | createBySpecialty() | Creates by specialty |
| 3 | createByDoctor() | Creates by doctor |
| 4 | createOutsideHours() | Creates outside hours |
| 5 | findAll() | Retrieves a paginated list of appointments records |
| 6 | findByCode() | Finds appointments records by code |
| 7 | update() | Updates an existing appointments record |
| 8 | confirm() | Confirms an appointment |
| 9 | cancel() | Cancels an appointment |
| 10 | getStatusHistory() | Retrieves status change history |
| 11 | findOne() | Retrieves a single appointments by ID |
| 12 | sendConfirmation() | Sends appointment confirmation notification |
| 13 | sendReminder() | Sends appointment reminder notification |

### 4.95. Audit Logs Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new audit logs record |
| 2 | findAll() | Retrieves a paginated list of audit logs records |
| 3 | findOne() | Retrieves a single audit logs by ID |

### 4.96. Auth Controller

| No | Method | Description |
|---|---|---|
| 1 | register() | Registers a new account with email and password |
| 2 | confirmEmail() | Confirms email address using verification hash |
| 3 | forgotPassword() | Sends password reset email to the user |
| 4 | resetPassword() | Resets the password using a verification token |

### 4.97. Auth Google Controller

| No | Method | Description |
|---|---|---|
| 1 | login(loginDto: AuthGoogleLoginDto): Promise<LoginResponseDto> | Authenticates user via Google OAuth token |

### 4.98. Clinical Orders Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new clinical orders record |
| 2 | findAll() | Retrieves a paginated list of clinical orders records |
| 3 | findOne() | Retrieves a single clinical orders by ID |
| 4 | findByPatientId() | Finds clinical orders records by patient id |
| 5 | findByRecordId() | Finds clinical orders records by record id |
| 6 | findByOrderedBy() | Finds clinical orders records by ordered by |
| 7 | findByStatus() | Finds clinical orders records by status |
| 8 | remove() | Deletes a clinical orders record |

### 4.99. Clinics Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new clinics record |
| 2 | findAll() | Retrieves a paginated list of clinics records |
| 3 | findOne() | Retrieves a single clinics by ID |
| 4 | findByCode() | Finds clinics records by code |
| 5 | remove() | Deletes a clinics record |

### 4.100. Dental Images Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new dental images record |
| 2 | findAll() | Retrieves a paginated list of dental images records |
| 3 | findArchived() | Finds dental images by archived |
| 4 | findOne() | Retrieves a single dental images by ID |
| 5 | findByPatientId() | Finds dental images records by patient id |
| 6 | findByRecordId() | Finds dental images records by record id |
| 7 | findByCategoryId() | Finds dental images records by category id |
| 8 | findByUploadedBy() | Finds dental images records by uploaded by |
| 9 | findByPacsId() | Finds dental images records by pacs id |
| 10 | archive() | Archives a dental image |
| 11 | remove() | Deletes a dental images record |

### 4.101. Diagnostic Orders Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new diagnostic orders record |
| 2 | findOne() | Retrieves a single diagnostic orders by ID |
| 3 | findByCode() | Finds diagnostic orders records by code |
| 4 | findByPatient() | Finds diagnostic orders records by patient |
| 5 | remove() | Deletes a diagnostic orders record |

### 4.102. Doctor Schedules Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new doctor schedules record |
| 2 | findAll() | Retrieves a paginated list of doctor schedules records |
| 3 | findOne() | Retrieves a single doctor schedules by ID |
| 4 | update() | Updates an existing doctor schedules record |
| 5 | getChangeHistory() | Retrieves change history for a schedule |

### 4.103. Image Annotations Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new image annotations record |
| 2 | findAll() | Retrieves a paginated list of image annotations records |
| 3 | findOne() | Retrieves a single image annotations by ID |
| 4 | findByImageId() | Finds image annotations records by image id |
| 5 | findByType() | Finds image annotations records by type |
| 6 | remove() | Deletes an image annotation record |

### 4.104. Kyc Verifications Controller

| No | Method | Description |
|---|---|---|
| 1 | submitMine() | submit Mine |
| 2 | findMine() | Retrieves the current user's KYC status |
| 3 | findMineHistory() | Retrieves the current user's KYC submission history |
| 4 | findAll() | Retrieves a paginated list of kyc verifications records |
| 5 | findOne() | Retrieves a single kyc verifications by ID |
| 6 | approve() | Approves a pending request |
| 7 | reject() | Rejects a pending request |

### 4.105. Medical History Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new medical history record |
| 2 | findAll() | Retrieves a paginated list of medical history records |
| 3 | findOne() | Retrieves a single medical history by ID |
| 4 | remove() | Deletes a medical history record |

### 4.106. Medical Records Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new medical records record |
| 2 | findAll() | Retrieves a paginated list of medical records records |
| 3 | findByPatient() | Finds medical records records by patient |
| 4 | findOne() | Retrieves a single medical records by ID |
| 5 | getVersions() | Retrieves versions |
| 6 | remove() | Deletes a medical records record |

### 4.107. Patients Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new patients record |
| 2 | findAll() | Retrieves a paginated list of patients records |
| 3 | findOne() | Retrieves a single patients by ID |
| 4 | findByCode() | Finds patients records by code |
| 5 | remove() | Deletes a patients record |

### 4.108. Permissions Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new permissions record |
| 2 | findAll(): Promise<PermissionEntity[]> | Retrieves a paginated list of permissions records |
| 3 | getPermissionsByRole() | Retrieves all permissions for a role |
| 4 | assignToRole() | Assigns permissions to a target |
| 5 | revokeFromRole() | Revokes a permission from a role |
| 6 | findOne() | Retrieves a single permissions by ID |
| 7 | update() | Updates an existing permissions record |
| 8 | remove() | Deletes a permissions record |

### 4.109. Prescription Items Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new prescription items record |
| 2 | findAll() | Retrieves a paginated list of prescription items records |
| 3 | findOne() | Retrieves a single prescription items by ID |
| 4 | remove() | Deletes a prescription items record |

### 4.110. Prescriptions Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new prescriptions record |
| 2 | findAll() | Retrieves a paginated list of prescriptions records |
| 3 | findOne() | Retrieves a single prescriptions by ID |
| 4 | findByPatientId() | Finds prescriptions records by patient id |
| 5 | findByDoctorId() | Finds prescriptions records by doctor id |
| 6 | findByRecordId() | Finds prescriptions records by record id |
| 7 | remove() | Deletes a prescriptions record |

### 4.111. Record Exports Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new record exports record |
| 2 | findAll() | Retrieves a paginated list of record exports records |
| 3 | findOne() | Retrieves a single record exports by ID |
| 4 | findByRecordId() | Finds record exports records by record id |
| 5 | remove() | Deletes a record exports record |

### 4.112. Reports Controller

| No | Method | Description |
|---|---|---|
| 1 | getPatientDashboard() | Retrieves dashboard data for a patient |

### 4.113. Roles Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new roles record |
| 2 | findAll() | Retrieves a paginated list of roles records |
| 3 | findOne() | Retrieves a single roles by ID |
| 4 | update() | Updates an existing roles record |
| 5 | remove() | Deletes a roles record |

### 4.114. Specialties Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new specialties record |
| 2 | findAll() | Retrieves a paginated list of specialties records |
| 3 | findOne() | Retrieves a single specialties by ID |
| 4 | update() | Updates an existing specialties record |
| 5 | remove() | Deletes a specialties record |

### 4.115. Symptoms Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new symptoms record |
| 2 | findAll() | Retrieves a paginated list of symptoms records |
| 3 | findOne() | Retrieves a single symptoms by ID |
| 4 | findBySessionId() | Finds symptoms records by session id |
| 5 | findByPatientId() | Finds symptoms records by patient id |
| 6 | remove() | Deletes a symptoms record |

### 4.116. Treatment History Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new treatment history record |
| 2 | findAll() | Retrieves a paginated list of treatment history records |
| 3 | findOne() | Retrieves a single treatment history by ID |
| 4 | findByPatientId() | Finds treatment history records by patient id |
| 5 | findByRecordId() | Finds treatment history records by record id |
| 6 | findByToothNumber() | Finds treatment history records by tooth number |
| 7 | parseInt(tooth_number, 10) | parse Int |
| 8 | remove() | Deletes a treatment history record |

### 4.117. Treatment Plans Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new treatment plans record |
| 2 | findAll() | Retrieves a paginated list of treatment plans records |
| 3 | findOne() | Retrieves a single treatment plans by ID |
| 4 | findByPatientId() | Finds treatment plans records by patient id |
| 5 | findByRecordId() | Finds treatment plans records by record id |
| 6 | remove() | Deletes a treatment plans record |

### 4.118. Treatment Rooms Controller

| No | Method | Description |
|---|---|---|
| 1 | findOne() | Retrieves a single treatment rooms by ID |
| 2 | update() | Updates an existing treatment rooms record |
| 3 | remove() | Deletes a treatment rooms record |

### 4.119. User Profiles Controller

| No | Method | Description |
|---|---|---|
| 1 | create() | Creates a new user profiles record |
| 2 | findAll() | Retrieves a paginated list of user profiles records |
| 3 | findOne() | Retrieves a single user profiles by ID |
| 4 | update() | Updates an existing user profiles record |
| 5 | remove() | Deletes a user profile record |
| 6 | unban() | Unbans a previously banned user profile |

### 4.120. User Roles Controller

| No | Method | Description |
|---|---|---|
| 1 | getRolesByUser() | Retrieves all roles assigned to a user |
| 2 | assignRole() | Assigns a role to a user |
| 3 | revokeRole() | Revokes a role from a user |
| 4 | getUsersByRole() | Retrieves all users with a specific role |


### 4.121. Accounts Service

| No | Method | Description |
|---|---|---|
| 1 | create(createAccountDto: CreateAccountDto): Promise<Account> | Creates a new accounts record |
| 2 | findById(id: string): Promise<NullableType<Account>> | Retrieves a single accounts by ID |
| 3 | findByEmail(email: string): Promise<NullableType<Account>> | Finds an account by email address |
| 4 | findByUsername(username: string): Promise<NullableType<Account>> | Finds an account by username |
| 5 | update(id: string, updateAccountDto: UpdateAccountDto): Promise<Account \| null> | Updates an existing accounts record |
| 6 | remove(id: string): Promise<void> | Deletes an account record |
| 7 | updateFailedLoginAttempts(accountId: string, attempts: number): Promise<void> | Updates failed login attempts |
| 8 | updateLastLogin(accountId: string): Promise<void> | Updates last login timestamp |
| 9 | lockAccount(accountId: string, reason: string, lockedBy: string \| null): Promise<void> | Locks a user account with a reason |
| 10 | unlockAccount(accountId: string): Promise<void> | Unlocks a previously locked user account |
| 11 | verifyEmail(accountId: string): Promise<void> | Marks an account's email as verified |
| 12 | verifyPhone(accountId: string): Promise<void> | Marks an account's phone as verified |
| 13 | verifyPhoneWithOtp(accountId: string, otp: string): Promise<void> | Verifies phone number using OTP code |

### 4.122. Appointments Service

| No | Method | Description |
|---|---|---|
| 1 | create(dto: CreateAppointmentDto): Promise<AppointmentEntity> | Creates a new appointments record |
| 2 | findById(id: string): Promise<NullableType<AppointmentEntity>> | Retrieves a single appointments by ID |
| 3 | findByCode(code: string): Promise<NullableType<AppointmentEntity>> | Finds appointments records by code |
| 4 | confirm(id: string, changedBy: string): Promise<AppointmentEntity> | Confirms an appointment |
| 5 | createBySpecialty(dto: BookBySpecialtyDto): Promise<AppointmentEntity> | Creates by specialty |
| 6 | createByDoctor(dto: BookByDoctorDto): Promise<AppointmentEntity> | Creates by doctor |
| 7 | sendConfirmation(id: string) | Sends appointment confirmation notification |
| 8 | sendReminder(id: string) | Sends appointment reminder notification |

### 4.123. Audit Logs Service

| No | Method | Description |
|---|---|---|
| 1 | create(dto: CreateAuditLogDto): Promise<AuditLogEntity> | Creates a new audit logs record |
| 2 | findAll(query: QueryAuditLogDto) | Retrieves a paginated list of audit logs records |
| 3 | findById(id: string): Promise<AuditLogWithUser \| null> | Retrieves a single audit logs by ID |

### 4.124. Auth Google Service

| No | Method | Description |
|---|---|---|
| 1 | validateLogin(loginDto: AuthGoogleLoginDto): Promise<SocialInterface> | Validates Google OAuth token and returns user social data |

### 4.125. Auth Service

| No | Method | Description |
|---|---|---|
| 1 | validateLogin(loginDto: AuthEmailLoginDto): Promise<LoginResponseDto> | Validates login credentials and returns tokens |
| 2 | register(dto: AuthRegisterLoginDto) | Registers a new account with email and password |
| 3 | confirmEmail(hash: string) | Confirms email address using verification hash |
| 4 | forgotPassword(email: string) | Sends password reset email to the user |
| 5 | me(accountId: string): Promise<Account \| null> | Returns the currently authenticated user profile |
| 6 | logout(accountId: string): Promise<void> | Revokes refresh tokens and logs out the user |
| 7 | softDelete(accountId: string): Promise<void> | Soft-deletes an auth record |

### 4.126. Clinical Orders Service

| No | Method | Description |
|---|---|---|
| 1 | findAll(): Promise<ClinicalOrderEntity[]> | Retrieves a paginated list of clinical orders records |
| 2 | findOne(order_id: string): Promise<ClinicalOrderEntity> | Retrieves a single clinical orders by ID |
| 3 | findByPatientId(patient_id: string): Promise<ClinicalOrderEntity[]> | Finds clinical orders records by patient id |
| 4 | findByRecordId(record_id: string): Promise<ClinicalOrderEntity[]> | Finds clinical orders records by record id |
| 5 | findByOrderedBy(ordered_by: string): Promise<ClinicalOrderEntity[]> | Finds clinical orders records by ordered by |
| 6 | findByStatus(status: string): Promise<ClinicalOrderEntity[]> | Finds clinical orders records by status |
| 7 | remove(order_id: string): Promise<void> | Deletes a clinical orders record |

### 4.127. Clinics Service

| No | Method | Description |
|---|---|---|
| 1 | create(dto: CreateClinicDto): Promise<ClinicEntity> | Creates a new clinics record |
| 2 | findById(id: string): Promise<NullableType<ClinicEntity>> | Retrieves a single clinics by ID |
| 3 | findByCode(code: string): Promise<NullableType<ClinicEntity>> | Finds clinics records by code |
| 4 | update(id: string, dto: UpdateClinicDto): Promise<ClinicEntity> | Updates an existing clinics record |
| 5 | remove(id: string): Promise<void> | Deletes a clinics record |

### 4.128. Dental Images Service

| No | Method | Description |
|---|---|---|
| 1 | findAll(): Promise<DentalImageEntity[]> | Retrieves a paginated list of dental images records |
| 2 | findOne(image_id: string): Promise<DentalImageEntity> | Retrieves a single dental images by ID |
| 3 | findByPatientId(patient_id: string): Promise<DentalImageEntity[]> | Finds dental images records by patient id |
| 4 | findByRecordId(record_id: string): Promise<DentalImageEntity[]> | Finds dental images records by record id |
| 5 | findByCategoryId(category_id: string): Promise<DentalImageEntity[]> | Finds dental images records by category id |
| 6 | findByUploadedBy(uploaded_by: string): Promise<DentalImageEntity[]> | Finds dental images records by uploaded by |
| 7 | findByPacsId(pacs_id: string): Promise<DentalImageEntity[]> | Finds dental images records by pacs id |
| 8 | findArchived(): Promise<DentalImageEntity[]> | Finds dental images by archived |
| 9 | remove(image_id: string): Promise<void> | Deletes a dental images record |
| 10 | archive(image_id: string): Promise<DentalImageEntity> | Archives a dental image |

### 4.129. Diagnostic Orders Service

| No | Method | Description |
|---|---|---|
| 1 | create(dto: CreateDiagnosticOrderDto): Promise<DiagnosticOrderEntity> | Creates a new diagnostic orders record |
| 2 | findById(id: string): Promise<NullableType<DiagnosticOrderEntity>> | Retrieves a single diagnostic orders by ID |
| 3 | findByCode(code: string): Promise<NullableType<DiagnosticOrderEntity>> | Finds diagnostic orders records by code |
| 4 | findByPatient(patientId: string): Promise<DiagnosticOrderEntity[]> | Finds diagnostic orders records by patient |
| 5 | remove(id: string): Promise<void> | Deletes a diagnostic orders record |

### 4.130. Doctor Schedules Service

| No | Method | Description |
|---|---|---|
| 1 | create(dto: CreateDoctorScheduleDto): Promise<DoctorScheduleEntity> | Creates a new doctor schedules record |
| 2 | findById(id: string): Promise<NullableType<DoctorScheduleEntity>> | Retrieves a single doctor schedules by ID |
| 3 | getChangeHistory(scheduleId: string): Promise<ScheduleChangeEntity[]> | Retrieves change history for a schedule |

### 4.131. Image Annotations Service

| No | Method | Description |
|---|---|---|
| 1 | findAll(): Promise<ImageAnnotationEntity[]> | Retrieves a paginated list of image annotations records |
| 2 | findOne(annotation_id: string): Promise<ImageAnnotationEntity> | Retrieves a single image annotations by ID |
| 3 | findByImageId(image_id: string): Promise<ImageAnnotationEntity[]> | Finds image annotations records by image id |
| 4 | findByType(annotation_type: string): Promise<ImageAnnotationEntity[]> | Finds image annotations records by type |
| 5 | remove(annotation_id: string): Promise<void> | Deletes an image annotation record |

### 4.132. Kyc File Storage Service

| No | Method | Description |
|---|---|---|
| 1 | resolvePrivatePath(relativePath: string): string | Resolves the private file path for KYC documents |
| 2 | decryptToTempFile(relativePath: string): Promise<string> | Decrypts an encrypted KYC file to a temporary path |
| 3 | removeTempFile(path: string): Promise<void> | Removes a temporary decrypted file |
| 4 | deleteMany(relativePaths: Array<string \| null \| undefined>): Promise<void> | Deletes multiple KYC files |

### 4.133. Kyc Ocr Service

| No | Method | Description |
|---|---|---|
| 1 | extractIdentity(input: KycOcrInput): Promise<KycOcrResult> | Extracts identity data from document using OCR |

### 4.134. Kyc Verifications Service

| No | Method | Description |
|---|---|---|
| 1 | findMine(userId: string): Promise<KycResponseDto> | Retrieves the current user's KYC status |
| 2 | findMineHistory(userId: string): Promise<KycResponseDto[]> | Retrieves the current user's KYC submission history |
| 3 | findAll(query: QueryKycDto) | Retrieves a paginated list of kyc verifications records |
| 4 | findOne(id: string): Promise<KycVerificationEntity> | Retrieves a single kyc verifications by ID |
| 5 | findOneResponse(id: string): Promise<KycResponseDto> | Finds kyc verifications by one response |
| 6 | approve(id: string, reviewerId: string, dto: ApproveKycDto): Promise<KycResponseDto> | Approves a pending request |
| 7 | reject(id: string, reviewerId: string, dto: RejectKycDto): Promise<KycResponseDto> | Rejects a pending request |
| 8 | getBookingEligibility(userId: string): Promise<KycBookingEligibilityDto> | Retrieves booking eligibility |
| 9 | getPrivateFilePath(id: string, kind: KycFileKind): Promise<string> | Retrieves private file path |
| 10 | removeTemporaryFile(path: string): Promise<void> | Removes a temporary decrypted file |
| 11 | assertInternalApiKey(value: string \| undefined): void | Validates the internal API key for inter-service calls |

### 4.135. Mail Service

| No | Method | Description |
|---|---|---|
| 1 | userSignUp(mailData: MailDataInterface): Promise<void> | Sends sign-up confirmation email |
| 2 | forgotPassword(mailData: MailDataInterface): Promise<void> | Sends password reset email to the user |
| 3 | confirmNewEmail(mailData: MailDataInterface): Promise<void> | Sends email change confirmation email |
| 4 | sendNotificationEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> | Sends notification email |

### 4.136. Medical History Service

| No | Method | Description |
|---|---|---|
| 1 | create(dto: CreateMedicalHistoryDto) | Creates a new medical history record |
| 2 | findAll() | Retrieves a paginated list of medical history records |
| 3 | findByPatient(patient_id: string) | Finds medical history records by patient |
| 4 | findOne(history_id: string) | Retrieves a single medical history by ID |
| 5 | update(history_id: string, dto: UpdateMedicalHistoryDto) | Updates an existing medical history record |
| 6 | remove(history_id: string) | Deletes a medical history record |

### 4.137. Medical Records Service

| No | Method | Description |
|---|---|---|
| 1 | create(dto: CreateMedicalRecordDto) | Creates a new medical records record |
| 2 | findAll() | Retrieves a paginated list of medical records records |
| 3 | findByPatient(patient_id: string) | Finds medical records records by patient |
| 4 | findOne(record_id: string) | Retrieves a single medical records by ID |
| 5 | update(record_id: string, dto: UpdateMedicalRecordDto) | Updates an existing medical records record |
| 6 | remove(record_id: string) | Deletes a medical records record |
| 7 | getVersions(record_id: string) | Retrieves versions |

### 4.138. Notifications Service

| No | Method | Description |
|---|---|---|
| 1 | createNotification(createDto: CreateNotificationDto): Promise<Notification> | Creates and dispatches a new notification |
| 2 | findNotificationById(id: string): Promise<NullableType<Notification>> | Finds notifications by notification by id |
| 3 | updateNotification(id: string, updateDto: UpdateNotificationDto): Promise<NullableType<Notification>> | Updates notification |
| 4 | deleteNotification(id: string): Promise<void> | Deletes notification |
| 5 | createTemplate(createDto: CreateNotificationTemplateDto): Promise<NotificationTemplate> | Creates template |
| 6 | findTemplateById(id: string): Promise<NullableType<NotificationTemplate>> | Finds notifications by template by id |
| 7 | findTemplateByCode(code: string): Promise<NullableType<NotificationTemplate>> | Finds notifications by template by code |
| 8 | findAllTemplates(): Promise<NotificationTemplate[]> | Finds notifications by all templates |
| 9 | deleteTemplate(id: string): Promise<void> | Deletes template |
| 10 | createPreference(createDto: CreateNotificationPreferenceDto): Promise<NotificationPreference> | Creates preference |
| 11 | findPreferencesByUserId(userId: string): Promise<NotificationPreference[]> | Finds notifications by preferences by user id |
| 12 | deletePreference(id: string): Promise<void> | Deletes preference |
| 13 | markAsRead(id: string): Promise<void> | Marks a notification as read |
| 14 | getUnreadCount(recipientId: string): Promise<number> | Retrieves unread count |

### 4.139. O Auth Connections Service

| No | Method | Description |
|---|---|---|
| 1 | findById(id: string): Promise<NullableType<OAuthConnection>> | Retrieves a single o auth connections by ID |
| 2 | findByAccountId(accountId: string): Promise<OAuthConnection[]> | Finds o auth connections records by account id |
| 3 | create(data: Partial<OAuthConnection>): Promise<OAuthConnection> | Creates a new o auth connections record |
| 4 | delete(id: string): Promise<void> | Deletes an OAuth connection record |
| 5 | deleteByAccountId(accountId: string): Promise<void> | Deletes by account id |

### 4.140. Otp Tokens Service

| No | Method | Description |
|---|---|---|
| 1 | findById(id: string): Promise<NullableType<OtpToken>> | Retrieves a single otp tokens by ID |
| 2 | markAsUsed(id: string): Promise<void> | Marks a token as used |
| 3 | deleteExpired(): Promise<void> | Deletes all expired tokens |

### 4.141. Patients Service

| No | Method | Description |
|---|---|---|
| 1 | create(createPatientDto: CreatePatientDto): Promise<PatientEntity> | Creates a new patients record |
| 2 | findAll(): Promise<PatientEntity[]> | Retrieves a paginated list of patients records |
| 3 | findOne(patient_id: string): Promise<PatientEntity> | Retrieves a single patients by ID |
| 4 | findByCode(patient_code: string): Promise<PatientEntity> | Finds patients records by code |
| 5 | remove(patient_id: string): Promise<void> | Deletes a patients record |

### 4.142. Permissions Service

| No | Method | Description |
|---|---|---|
| 1 | create(dto: CreatePermissionDto): Promise<PermissionEntity> | Creates a new permissions record |
| 2 | findAll(): Promise<PermissionEntity[]> | Retrieves a paginated list of permissions records |
| 3 | findById(id: string): Promise<PermissionEntity \| null> | Retrieves a single permissions by ID |
| 4 | update(id: string, updateData: Partial<PermissionEntity>): Promise<PermissionEntity \| null> | Updates an existing permissions record |
| 5 | remove(id: string): Promise<void> | Deletes a permissions record |
| 6 | assignPermissionToRole(roleId: string, permissionId: string, assignedBy?: string): Promise<RolePermissionEntity> | Assigns a permission to a role |
| 7 | revokePermissionFromRole(roleId: string, permissionId: string): Promise<void> | Revokes a permission from a role |
| 8 | getPermissionsByRole(roleId: string): Promise<PermissionEntity[]> | Retrieves all permissions for a role |

### 4.143. Prescription Items Service

| No | Method | Description |
|---|---|---|
| 1 | findAll(): Promise<PrescriptionItemEntity[]> | Retrieves a paginated list of prescription items records |
| 2 | findOne(item_id: string): Promise<PrescriptionItemEntity> | Retrieves a single prescription items by ID |
| 3 | remove(item_id: string): Promise<void> | Deletes a prescription items record |

### 4.144. Prescriptions Service

| No | Method | Description |
|---|---|---|
| 1 | findAll(): Promise<PrescriptionEntity[]> | Retrieves a paginated list of prescriptions records |
| 2 | findOne(prescription_id: string): Promise<PrescriptionEntity> | Retrieves a single prescriptions by ID |
| 3 | findByPatientId(patient_id: string): Promise<PrescriptionEntity[]> | Finds prescriptions records by patient id |
| 4 | findByDoctorId(doctor_id: string): Promise<PrescriptionEntity[]> | Finds prescriptions records by doctor id |
| 5 | findByRecordId(record_id: string): Promise<PrescriptionEntity[]> | Finds prescriptions records by record id |
| 6 | remove(prescription_id: string): Promise<void> | Deletes a prescriptions record |

### 4.145. Record Exports Service

| No | Method | Description |
|---|---|---|
| 1 | findAll(): Promise<RecordExportEntity[]> | Retrieves a paginated list of record exports records |
| 2 | findOne(export_id: string): Promise<RecordExportEntity> | Retrieves a single record exports by ID |
| 3 | findByRecordId(record_id: string): Promise<RecordExportEntity[]> | Finds record exports records by record id |
| 4 | remove(export_id: string): Promise<void> | Deletes a record exports record |

### 4.146. Refresh Tokens Service

| No | Method | Description |
|---|---|---|
| 1 | findById(id: string): Promise<NullableType<RefreshToken>> | Retrieves a single refresh tokens by ID |
| 2 | findByAccountId(accountId: string): Promise<RefreshToken[]> | Finds refresh tokens records by account id |
| 3 | findByTokenHash(tokenHash: string): Promise<NullableType<RefreshToken>> | Finds refresh tokens records by token hash |
| 4 | create(data: Partial<RefreshToken>): Promise<RefreshToken> | Creates a new refresh tokens record |
| 5 | revoke(id: string): Promise<void> | Revokes a refresh token |
| 6 | revokeByAccountId(accountId: string): Promise<void> | Revokes all refresh tokens for an account |
| 7 | deleteExpired(): Promise<void> | Deletes all expired tokens |

### 4.147. Reports Service

| No | Method | Description |
|---|---|---|
| 1 | getDoctorPerformance(query: DoctorPerformanceQuery) | Generates doctor performance report |
| 2 | SUM(CASE WHEN apt.status = 'completed' THEN 1 ELSE 0 END) | S U M |
| 3 | NULLIF(COUNT(apt.appointment_id) | N U L L I F |
| 4 | SUM(CASE WHEN apt.status = 'cancelled' THEN 1 ELSE 0 END) | S U M |
| 5 | NULLIF(COUNT(apt.appointment_id) | N U L L I F |
| 6 | getDoctorDashboard(query: DoctorDashboardQuery) | Retrieves dashboard data for a doctor |
| 7 | getPatientDashboard(query: PatientDashboardQuery) | Retrieves dashboard data for a patient |

### 4.148. Roles Service

| No | Method | Description |
|---|---|---|
| 1 | create(createRoleDto: CreateRoleDto): Promise<RoleEntity> | Creates a new roles record |
| 2 | findAll(query: QueryRoleDto): Promise<RolesPageResult> | Retrieves a paginated list of roles records |
| 3 | findById(id: string): Promise<NullableType<RoleEntity>> | Retrieves a single roles by ID |
| 4 | update(id: string, updateData: Partial<RoleEntity>): Promise<RoleEntity \| null> | Updates an existing roles record |
| 5 | remove(id: string): Promise<void> | Deletes a roles record |

### 4.149. Specialties Service

| No | Method | Description |
|---|---|---|
| 1 | create(dto: CreateSpecialtyDto): Promise<SpecialtyEntity> | Creates a new specialties record |
| 2 | findAll(activeOnly: boolean = false): Promise<SpecialtyEntity[]> | Retrieves a paginated list of specialties records |
| 3 | findById(id: string): Promise<NullableType<SpecialtyEntity>> | Retrieves a single specialties by ID |
| 4 | update(id: string, dto: UpdateSpecialtyDto): Promise<SpecialtyEntity> | Updates an existing specialties record |
| 5 | remove(id: string): Promise<void> | Deletes a specialties record |

### 4.150. Symptoms Service

| No | Method | Description |
|---|---|---|
| 1 | create(createSymptomDto: CreateSymptomDto): Promise<SymptomEntity> | Creates a new symptoms record |
| 2 | findAll(): Promise<SymptomEntity[]> | Retrieves a paginated list of symptoms records |
| 3 | findOne(symptom_id: string): Promise<SymptomEntity> | Retrieves a single symptoms by ID |
| 4 | findBySessionId(session_id: string): Promise<SymptomEntity[]> | Finds symptoms records by session id |
| 5 | findByPatientId(patient_id: string): Promise<SymptomEntity[]> | Finds symptoms records by patient id |
| 6 | remove(symptom_id: string): Promise<void> | Deletes a symptoms record |

### 4.151. Treatment History Service

| No | Method | Description |
|---|---|---|
| 1 | findAll(): Promise<TreatmentHistoryEntity[]> | Retrieves a paginated list of treatment history records |
| 2 | findOne(treatment_id: string): Promise<TreatmentHistoryEntity> | Retrieves a single treatment history by ID |
| 3 | findByPatientId(patient_id: string): Promise<TreatmentHistoryEntity[]> | Finds treatment history records by patient id |
| 4 | findByRecordId(record_id: string): Promise<TreatmentHistoryEntity[]> | Finds treatment history records by record id |
| 5 | remove(treatment_id: string): Promise<void> | Deletes a treatment history record |

### 4.152. Treatment Plans Service

| No | Method | Description |
|---|---|---|
| 1 | findAll(): Promise<TreatmentPlanEntity[]> | Retrieves a paginated list of treatment plans records |
| 2 | findOne(plan_id: string): Promise<TreatmentPlanEntity> | Retrieves a single treatment plans by ID |
| 3 | findByPatientId(patient_id: string): Promise<TreatmentPlanEntity[]> | Finds treatment plans records by patient id |
| 4 | findByRecordId(record_id: string): Promise<TreatmentPlanEntity[]> | Finds treatment plans records by record id |
| 5 | remove(plan_id: string): Promise<void> | Deletes a treatment plans record |

### 4.153. Treatment Rooms Service

| No | Method | Description |
|---|---|---|
| 1 | findById(id: string): Promise<NullableType<TreatmentRoomEntity>> | Retrieves a single treatment rooms by ID |
| 2 | remove(id: string): Promise<void> | Deletes a treatment rooms record |

### 4.154. User Profiles Service

| No | Method | Description |
|---|---|---|
| 1 | create(createUserProfileDto: CreateUserProfileDto, userId?: string): Promise<UserProfileEntity> | Creates a new user profiles record |
| 2 | findAll(query: QueryUserProfileDto) | Retrieves a paginated list of user profiles records |
| 3 | findById(id: string): Promise<NullableType<UserProfileEntity>> | Retrieves a single user profiles by ID |
| 4 | update(id: string, updateData: Partial<UserProfileEntity>): Promise<UserProfileEntity \| null> | Updates an existing user profiles record |
| 5 | ban(id: string, reason?: string): Promise<UserProfileEntity \| null> | Bans a user profile |
| 6 | unban(id: string): Promise<UserProfileEntity \| null> | Unbans a previously banned user profile |
| 7 | remove(id: string): Promise<void> | Deletes a user profile record |

### 4.155. User Roles Service

| No | Method | Description |
|---|---|---|
| 1 | assignRole(userId: string, roleId: string, assignedBy?: string): Promise<UserRoleEntity> | Assigns a role to a user |
| 2 | revokeRole(userId: string, roleId: string): Promise<void> | Revokes a role from a user |
| 3 | getRolesByUser(userId: string): Promise<RoleEntity[]> | Retrieves all roles assigned to a user |
| 4 | getUsersByRole(roleId: string): Promise<UserRoleEntity[]> | Retrieves all users with a specific role |


### 4.156. Accounts Repository

| No | Method | Description |
|---|---|---|
| 1 | findById(id: string): Promise<NullableType<Account>> | Retrieves a single accounts by ID |
| 2 | findByEmail(email: string): Promise<NullableType<Account>> | Finds an account by email address |
| 3 | findByUsername(username: string): Promise<NullableType<Account>> | Finds an account by username |
| 4 | findByPhone(phone: string): Promise<NullableType<Account>> | Finds accounts records by phone |
| 5 | create(data: Partial<Account>): Promise<Account> | Creates a new accounts record |
| 6 | update(id: string, data: Partial<Account>): Promise<Account \| null> | Updates an existing accounts record |
| 7 | remove(id: string): Promise<void> | Deletes an account record |

### 4.157. Otp Tokens Repository

| No | Method | Description |
|---|---|---|
| 1 | findById(id: string): Promise<NullableType<OtpToken>> | Retrieves a single otp tokens by ID |
| 2 | create(data: Partial<OtpToken>): Promise<OtpToken> | Creates a new otp tokens record |
| 3 | markAsUsed(id: string): Promise<void> | Marks a token as used |
| 4 | deleteExpired(): Promise<void> | Deletes all expired tokens |

### 4.158. Refresh Tokens Repository

| No | Method | Description |
|---|---|---|
| 1 | findById(id: string): Promise<NullableType<RefreshToken>> | Retrieves a single refresh tokens by ID |
| 2 | findByAccountId(accountId: string): Promise<RefreshToken[]> | Finds refresh tokens records by account id |
| 3 | findByTokenHash(tokenHash: string): Promise<NullableType<RefreshToken>> | Finds refresh tokens records by token hash |
| 4 | create(data: Partial<RefreshToken>): Promise<RefreshToken> | Creates a new refresh tokens record |
| 5 | revoke(id: string): Promise<void> | Revokes a refresh token |
| 6 | revokeByAccountId(accountId: string): Promise<void> | Revokes all refresh tokens for an account |
| 7 | deleteExpired(): Promise<void> | Deletes all expired tokens |


### 4.159. Appointment Notification Publisher

| No | Method | Description |
|---|---|---|
| 1 | sendAppointmentConfirmation(payload: AppointmentNotificationPayload): Promise<AppointmentNotificationPayload> | Sends appointment confirmation notification |
| 2 | sendAppointmentReminder(payload: AppointmentNotificationPayload): Promise<AppointmentNotificationPayload> | Sends appointment reminder notification |
| 3 | buildPayload(appointment: AppointmentEntity, notificationType: AppointmentNotificationType): AppointmentNotificationPayload | Builds the notification payload from an appointment entity |
