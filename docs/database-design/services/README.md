# DB Diagrams by Service

Each diagram shows only the tables owned by that service group, with referenced tables shown as stubs (`<<ref>>`).

---

## IAM Service

| Diagram | NestJS Services | Tables (owned) |
|---------|----------------|----------------|
| [iam-auth.puml](iam-auth.puml) | `accounts` · `oauth-connections` · `otp-tokens` · `refresh-tokens` | `accounts`, `oauth_connections`, `otp_tokens`, `refresh_tokens` |
| [iam-identity.puml](iam-identity.puml) | `user-profiles` · `kyc-verifications` | `users`, `kyc_verifications` |
| [iam-rbac.puml](iam-rbac.puml) | `roles` · `permissions` · `user-roles` | `roles`, `permissions`, `role_permissions`, `user_roles` |
| [iam-notifications.puml](iam-notifications.puml) | `notifications` | `notifications`, `notification_templates`, `notification_delivery_logs`, `notification_preferences` |
| [iam-audit.puml](iam-audit.puml) | `audit-logs` | `audit_logs` |

---

## Clinical EMR Service

| Diagram | NestJS Services | Tables (owned) |
|---------|----------------|----------------|
| [emr-patients.puml](emr-patients.puml) | `patients` · `medical-history` | `patients`, `medical_history` |
| [emr-appointments.puml](emr-appointments.puml) | `appointments` · `diagnostic-orders` | `appointments`, `appointment_status_history`, `diagnostic_orders` |
| [emr-clinics.puml](emr-clinics.puml) | `clinics` · `services` (clinic_services) | `clinics`, `treatment_rooms`, `clinic_services` |
| [emr-medical-records.puml](emr-medical-records.puml) | `medical-records` · `record-exports` · `examination-sessions` | `medical_records`, `medical_record_versions`, `record_exports`, `examination_sessions` |
| [emr-clinical.puml](emr-clinical.puml) | `diagnoses` · `symptoms` · `treatment-plans` · `treatment-history` | `diagnoses`, `symptoms`, `treatment_plans`, `treatment_history` |
| [emr-prescriptions.puml](emr-prescriptions.puml) | `prescriptions` · `prescription-items` | `prescriptions`, `prescription_items` |
| [emr-orders.puml](emr-orders.puml) | `clinical-orders` · `lab-test-results` | `clinical_orders`, `lab_test_results` |
| [emr-dental.puml](emr-dental.puml) | `dental-images` · `dental-charts` · `image-annotations` · `image-categories` · `pacs-sync-logs` | `dental_images`, `dental_charts`, `image_annotations`, `image_categories`, `pacs_sync_logs` |
| [emr-scheduling.puml](emr-scheduling.puml) | `doctor-schedules` · `work-shifts` · `doctor-leaves` · `treatment-rooms` | `doctor_schedules`, `schedule_changes`, `work_shifts`, `doctor_leaves`, `treatment_rooms` |
| [emr-catalog.puml](emr-catalog.puml) | `services` · `service-categories` · `specialties` · `doctor-specialties` | `services`, `service_categories`, `specialties`, `doctor_specialties`, `clinic_services` |
| [emr-files.puml](emr-files.puml) | `files` | `file` |
