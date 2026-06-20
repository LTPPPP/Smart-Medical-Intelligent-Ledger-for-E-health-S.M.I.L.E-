# Use Case List — S.M.I.L.E Platform

Reference list for Sequence Diagrams and Class Diagrams.

## 1. Authentication

| UC# | Use Case | Sequence Diagram | Class Diagram |
|-----|----------|-----------------|---------------|
| UC-001 | Signup | UC01_Signup | UC01_Signup |
| UC-002 | Login | UC02_Login | UC02_Login |
| UC-003 | Logout | UC03_Logout | UC03_Logout |
| UC-004 | Login with Google | UC04_LoginWithGoogle | UC04_LoginWithGoogle |
| UC-005 | Reset Password | UC05_ResetPassword | UC05_ResetPassword |
| UC-006 | Forgot Password | UC06_ForgotPassword | UC06_ForgotPassword |
| UC-007 | Change Password | UC07_ChangePassword | UC07_ChangePassword |

## 2. User Management

| UC# | Use Case | Sequence Diagram | Class Diagram |
|-----|----------|-----------------|---------------|
| UC-008 | View Profile | UC08_ViewProfile | UC08_ViewProfile |
| UC-009 | Update Profile | UC09_UpdateProfile | UC09_UpdateProfile |
| UC-010 | Send OTP | UC10_SendOTP | UC10_SendOTP |
| UC-011 | View Role | UC11_ViewRole | UC11_ViewRole |
| UC-012 | Update Role | UC12_UpdateRole | UC12_UpdateRole |
| UC-013 | Create Permission | UC13_CreatePermission | UC13_CreatePermission |
| UC-014 | View Permissions | UC14_ViewPermissions | UC14_ViewPermissions |
| UC-015 | Update Role Permissions | UC15_UpdateRolePermissions | UC15_UpdateRolePermissions |
| UC-016 | Assign Role | UC16_AssignRole | UC16_AssignRole |
| UC-017 | Revoke Role | UC17_RevokeRole | UC17_RevokeRole |
| UC-018 | Access Audit Log | UC18_AccessAuditLog | UC18_AccessAuditLog |
| UC-019 | Verify Identity KYC (Phone Number) | UC19_VerifyIdentityKYC | UC19_VerifyIdentityKYC |
| UC-020 | View User List | UC20_ViewUserList | UC20_ViewUserList |
| UC-021 | Lock/Ban User Account | UC21_LockBanUserAccount | UC21_LockBanUserAccount |
| UC-022 | Unlock/Unban User Account | UC22_UnlockUnbanUserAccount | UC22_UnlockUnbanUserAccount |

## 3. Clinic Management

| UC# | Use Case | Sequence Diagram | Class Diagram |
|-----|----------|-----------------|---------------|
| UC-023 | View Clinic Information | UC23_ViewClinicInformation | UC23_ViewClinicInformation |
| UC-024 | View Clinic Details | UC24_ViewClinicDetails | UC24_ViewClinicDetails |
| UC-025 | Update Clinic Information | UC25_UpdateClinicInformation | UC25_UpdateClinicInformation |
| UC-026 | Add Treatment Room | UC26_AddTreatmentRoom | UC26_AddTreatmentRoom |
| UC-027 | View Treatment Room | UC27_ViewTreatmentRoom | UC27_ViewTreatmentRoom |
| UC-028 | Update Treatment Room | UC28_UpdateTreatmentRoom | UC28_UpdateTreatmentRoom |
| UC-029 | Delete Treatment Room | UC29_DeleteTreatmentRoom | UC29_DeleteTreatmentRoom |

## 4. Schedule Management

| UC# | Use Case | Sequence Diagram | Class Diagram |
|-----|----------|-----------------|---------------|
| UC-030 | Create Work Schedule / On-Call Schedule | UC30_CreateWorkSchedule | UC30_CreateWorkSchedule |
| UC-031 | Update Work Schedule / On-Call Schedule | UC31_UpdateWorkSchedule | UC31_UpdateWorkSchedule |
| UC-032 | View Personal Schedule - Examination | UC32_ViewPersonalSchedule | UC32_ViewPersonalSchedule |
| UC-033 | Register Personal Schedule - Examination | UC33_RegisterPersonalSchedule | UC33_RegisterPersonalSchedule |
| UC-034 | Update Personal Schedule - Examination | UC34_UpdatePersonalSchedule | UC34_UpdatePersonalSchedule |
| UC-035 | Notify Schedule Change | UC35_NotifyScheduleChange | UC35_NotifyScheduleChange |
| UC-036 | Notify Shift Transfer | UC36_NotifyShiftTransfer | UC36_NotifyShiftTransfer |

## 5. Patient Management

| UC# | Use Case | Sequence Diagram | Class Diagram |
|-----|----------|-----------------|---------------|
| UC-037 | Add Patient Profile | UC37_AddPatientProfile | UC37_AddPatientProfile |
| UC-038 | View Patient Profile | UC38_ViewPatientProfile | UC38_ViewPatientProfile |
| UC-039 | Update Patient Profile | UC39_UpdatePatientProfile | UC39_UpdatePatientProfile |
| UC-040 | Add Medical History | UC40_AddMedicalHistory | UC40_AddMedicalHistory |
| UC-041 | View Medical Record | UC41_ViewMedicalRecord | UC41_ViewMedicalRecord |
| UC-042 | Update Medical Record | UC42_UpdateMedicalRecord | UC42_UpdateMedicalRecord |
| UC-043 | Delete Medical Record | UC43_DeleteMedicalRecord | UC43_DeleteMedicalRecord |
| UC-044 | Add Treatment Profile | UC44_AddTreatmentProfile | UC44_AddTreatmentProfile |
| UC-045 | View Treatment Profile | UC45_ViewTreatmentProfile | UC45_ViewTreatmentProfile |
| UC-046 | Update Treatment Profile | UC46_UpdateTreatmentProfile | UC46_UpdateTreatmentProfile |
| UC-047 | Export Medical Record Profile | UC47_ExportMedicalRecord | UC47_ExportMedicalRecord |

## 6. Appointment Management

| UC# | Use Case | Sequence Diagram | Class Diagram |
|-----|----------|-----------------|---------------|
| UC-048 | Create Appointment at Facility | UC48_CreateAppointmentAtFacility | UC48_CreateAppointmentAtFacility |
| UC-049 | Create Appointment by Specialty | UC49_CreateAppointmentBySpecialty | UC49_CreateAppointmentBySpecialty |
| UC-050 | Create Appointment by Doctor | UC50_CreateAppointmentByDoctor | UC50_CreateAppointmentByDoctor |
| UC-051 | Create Appointment Outside Working Hours | UC51_CreateAppointmentOutsideWorkingHours | UC51_CreateAppointmentOutsideWorkingHours |
| UC-052 | View Appointment | UC52_ViewAppointment | UC52_ViewAppointment |
| UC-053 | Edit Appointment | UC53_EditAppointment | UC53_EditAppointment |
| UC-054 | Cancel Appointment | UC54_CancelAppointment | UC54_CancelAppointment |
| UC-055 | Confirm Appointment | UC55_ConfirmAppointment | UC55_ConfirmAppointment |
| UC-056 | Send Appointment Confirmation | UC56_SendAppointmentConfirmation | UC56_SendAppointmentConfirmation |
| UC-057 | Send Appointment Reminder | UC57_SendAppointmentReminder | UC57_SendAppointmentReminder |
| UC-058 | Initiate Payment | UC58_InitiatePayment | UC58_InitiatePayment |
| UC-059 | Confirm Payment / View Payment History | UC59_ConfirmPaymentViewHistory | UC59_ConfirmPaymentViewHistory |
| UC-060 | Refund / Cancel Payment | UC60_RefundCancelPayment | UC60_RefundCancelPayment |
| UC-061 | Chatbot Support for Booking | UC61_ChatbotSupportForBooking | UC61_ChatbotSupportForBooking |

## 7. Service Catalog Management

| UC# | Use Case | Sequence Diagram | Class Diagram |
|-----|----------|-----------------|---------------|
| UC-062 | View Specialty | UC62_ViewSpecialty | UC62_ViewSpecialty |
| UC-063 | Add Specialty | UC63_AddSpecialty | UC63_AddSpecialty |
| UC-064 | Update Specialty | UC64_UpdateSpecialty | UC64_UpdateSpecialty |
| UC-065 | Delete Specialty | UC65_DeleteSpecialty | UC65_DeleteSpecialty |

## 8. Clinical Examination

| UC# | Use Case | Sequence Diagram | Class Diagram |
|-----|----------|-----------------|---------------|
| UC-066 | Enter Symptoms | UC66_EnterSymptoms | UC66_EnterSymptoms |
| UC-067 | View Symptoms | UC67_ViewSymptoms | UC67_ViewSymptoms |
| UC-068 | Edit Symptoms | UC68_EditSymptoms | UC68_EditSymptoms |
| UC-069 | Delete Symptoms | UC69_DeleteSymptoms | UC69_DeleteSymptoms |
| UC-070 | Create Treatment Plan | UC70_CreateTreatmentPlan | UC70_CreateTreatmentPlan |
| UC-071 | View Treatment Plan | UC71_ViewTreatmentPlan | UC71_ViewTreatmentPlan |
| UC-072 | Edit Treatment Plan | UC72_EditTreatmentPlan | UC72_EditTreatmentPlan |
| UC-073 | Send Treatment Plan | UC73_SendTreatmentPlan | UC73_SendTreatmentPlan |
| UC-074 | Delete Treatment Plan | UC74_DeleteTreatmentPlan | UC74_DeleteTreatmentPlan |
| UC-075 | Create Electronic Prescription | UC75_CreateElectronicPrescription | UC75_CreateElectronicPrescription |
| UC-076 | Order X-ray/CBCT | UC76_OrderXrayCBCT | UC76_OrderXrayCBCT |
| UC-077 | Order Laboratory Test Service | UC77_OrderLaboratoryTestService | UC77_OrderLaboratoryTestService |
| UC-078 | Order Clinical Test | UC78_OrderClinicalTest | UC78_OrderClinicalTest |

## 9. Dental Imaging

| UC# | Use Case | Sequence Diagram | Class Diagram |
|-----|----------|-----------------|---------------|
| UC-079 | Upload Endodontic Image | UC79_UploadEndodonticImage | UC79_UploadEndodonticImage |
| UC-080 | Upload X-ray/CBCT Image | UC80_UploadXrayCBCTImage | UC80_UploadXrayCBCTImage |
| UC-081 | View Dental Image Library | UC81_ViewDentalImageLibrary | UC81_ViewDentalImageLibrary |
| UC-082 | Attach Image to Treatment Profile | UC82_AttachImageToTreatmentProfile | UC82_AttachImageToTreatmentProfile |
| UC-083 | Edit Image by Treatment Profile | UC83_EditImageByTreatmentProfile | UC83_EditImageByTreatmentProfile |

## 10. Performance Management

| UC# | Use Case | Sequence Diagram | Class Diagram |
|-----|----------|-----------------|---------------|
| UC-084 | View Doctor Performance Report | UC84_ViewDoctorPerformanceReport | UC84_ViewDoctorPerformanceReport |
| UC-085 | View Dashboard by Doctor | UC85_ViewDashboardByDoctor | UC85_ViewDashboardByDoctor |
| UC-086 | View Dashboard by Customer | UC86_ViewDashboardByCustomer | UC86_ViewDashboardByCustomer |
| UC-087 | Revenue / Financial Report | UC87_RevenueFinancialReport | UC87_RevenueFinancialReport |

## Summary

| Status | Count |
|--------|-------|
| Total Use Cases | 87 |
| Sequence Diagrams Created | 87 (1:1 mapping) |
| Sequence Diagrams Missing | 0 |
| Class Diagrams Created | 87 (1:1 mapping) |
| Class Diagrams Missing | 0 |
