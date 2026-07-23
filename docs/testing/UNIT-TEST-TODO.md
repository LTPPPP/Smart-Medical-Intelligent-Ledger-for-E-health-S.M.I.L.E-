# Unit Test TODO — S.M.I.L.E

**372 functions / 1425 test cases** in `SMILE_UnitTest.xlsx`. Ordered by main-flow importance. Codes & sheet ids match the Excel 1:1.
Regenerate anytime (no LLM): `cd scripts/testgen && npm i && npm run gen`.


## v1.0 · main flow (auth, accounts, OTP, KYC, appointments, payments) · 2026-07-17 — 94 fn / 488 cases


### [P1] AccountsService
- [ ] `UT-IAM-ACCOUNTS-create` (F001) create() — 10 cases

### [P1] AuthService
- [ ] `UT-IAM-AUTH-confirmEmail` (F002) confirmEmail() — 4 cases
- [ ] `UT-IAM-AUTH-register` (F003) register() — 6 cases
- [ ] `UT-IAM-AUTH-validateLogin` (F004) validateLogin() — 8 cases
- [ ] `UT-IAM-AUTH-validateSocialLogin` (F005) validateSocialLogin() — 3 cases

### [P1] OtpTokensService
- [ ] `UT-IAM-OTPTOKENS-create` (F006) create() — 4 cases

### [P1] PaymentsService
- [ ] `UT-PAY-PAYMENTS-approveRefund` (F007) approveRefund() — 6 cases

### [P1] RefreshTokensService
- [ ] `UT-IAM-REFRESHTOKENS-create` (F008) create() — 2 cases

### [P1] AccountsService
- [ ] `UT-IAM-ACCOUNTS-lockAccount` (F009) lockAccount() — 5 cases
- [ ] `UT-IAM-ACCOUNTS-setPassword` (F010) setPassword() — 4 cases
- [ ] `UT-IAM-ACCOUNTS-unlockAccount` (F011) unlockAccount() — 3 cases
- [ ] `UT-IAM-ACCOUNTS-update` (F012) update() — 5 cases
- [ ] `UT-IAM-ACCOUNTS-updateFailedLoginAttempt` (F013) updateFailedLoginAttempts() — 4 cases
- [ ] `UT-IAM-ACCOUNTS-updateLastLogin` (F014) updateLastLogin() — 3 cases
- [ ] `UT-IAM-ACCOUNTS-verifyEmail` (F015) verifyEmail() — 3 cases
- [ ] `UT-IAM-ACCOUNTS-verifyPhone` (F016) verifyPhone() — 3 cases
- [ ] `UT-IAM-ACCOUNTS-verifyPhoneWithOtp` (F017) verifyPhoneWithOtp() — 5 cases

### [P1] AuthService
- [ ] `UT-IAM-AUTH-resetPassword` (F018) resetPassword() — 5 cases
- [ ] `UT-IAM-AUTH-update` (F019) update() — 9 cases

### [P1] PaymentsService
- [ ] `UT-PAY-PAYMENTS-rejectRefund` (F020) rejectRefund() — 5 cases

### [P1] RefreshTokensService
- [ ] `UT-IAM-REFRESHTOKENS-revoke` (F021) revoke() — 2 cases
- [ ] `UT-IAM-REFRESHTOKENS-revokeByAccountId` (F022) revokeByAccountId() — 3 cases

### [P1] AccountsService
- [ ] `UT-IAM-ACCOUNTS-deactivate` (F023) deactivate() — 3 cases
- [ ] `UT-IAM-ACCOUNTS-findByEmail` (F024) findByEmail() — 3 cases
- [ ] `UT-IAM-ACCOUNTS-findById` (F025) findById() — 3 cases
- [ ] `UT-IAM-ACCOUNTS-findByUsername` (F026) findByUsername() — 3 cases
- [ ] `UT-IAM-ACCOUNTS-reactivate` (F027) reactivate() — 3 cases

### [P1] AuthService
- [ ] `UT-IAM-AUTH-forgotPassword` (F028) forgotPassword() — 3 cases
- [ ] `UT-IAM-AUTH-logout` (F029) logout() — 4 cases
- [ ] `UT-IAM-AUTH-me` (F030) me() — 3 cases
- [ ] `UT-IAM-AUTH-refreshToken` (F031) refreshToken() — 5 cases

### [P1] OtpTokensService
- [ ] `UT-IAM-OTPTOKENS-findById` (F032) findById() — 3 cases
- [ ] `UT-IAM-OTPTOKENS-findValidByAccountAndCo` (F033) findValidByAccountAndCode() — 6 cases
- [ ] `UT-IAM-OTPTOKENS-markAsUsed` (F034) markAsUsed() — 2 cases

### [P1] PaymentsService
- [ ] `UT-PAY-PAYMENTS-findAll` (F035) findAll() — 3 cases
- [ ] `UT-PAY-PAYMENTS-findByAppointment` (F036) findByAppointment() — 4 cases
- [ ] `UT-PAY-PAYMENTS-findById` (F037) findById() — 3 cases
- [ ] `UT-PAY-PAYMENTS-handleVnpayReturn` (F038) handleVnpayReturn() — 4 cases
- [ ] `UT-PAY-PAYMENTS-listRefunds` (F039) listRefunds() — 2 cases
- [ ] `UT-PAY-PAYMENTS-requestRefund` (F040) requestRefund() — 6 cases

### [P1] RefreshTokensService
- [ ] `UT-IAM-REFRESHTOKENS-findByAccountId` (F041) findByAccountId() — 4 cases
- [ ] `UT-IAM-REFRESHTOKENS-findById` (F042) findById() — 3 cases
- [ ] `UT-IAM-REFRESHTOKENS-findByTokenHash` (F043) findByTokenHash() — 3 cases

### [P1] AccountsService
- [ ] `UT-IAM-ACCOUNTS-remove` (F044) remove() — 2 cases

### [P1] AuthService
- [ ] `UT-IAM-AUTH-softDelete` (F045) softDelete() — 3 cases

### [P1] OtpTokensService
- [ ] `UT-IAM-OTPTOKENS-deleteExpired` (F046) deleteExpired() — 1 cases

### [P1] RefreshTokensService
- [ ] `UT-IAM-REFRESHTOKENS-deleteExpired` (F047) deleteExpired() — 1 cases

### [P2] AuthGoogleService
- [ ] `UT-IAM-AUTHGOOGLE-validateLogin` (F048) validateLogin() — 5 cases

### [P1] KycVerificationsService
- [ ] `UT-IAM-KYCVERIFICATIONS-approve` (F049) approve() — 6 cases
- [ ] `UT-IAM-KYCVERIFICATIONS-submitForCurrent` (F050) submitForCurrentUser() — 22 cases

### [P2] OauthConnectionsService
- [ ] `UT-IAM-OAUTHCONNECTIONS-create` (F051) create() — 2 cases

### [P1] KycVerificationsService
- [ ] `UT-IAM-KYCVERIFICATIONS-reject` (F052) reject() — 6 cases

### [P2] OauthConnectionsService
- [ ] `UT-IAM-OAUTHCONNECTIONS-update` (F053) update() — 3 cases

### [P1] KycVerificationsService
- [ ] `UT-IAM-KYCVERIFICATIONS-assertInternalAp` (F054) assertInternalApiKey() — 3 cases
- [ ] `UT-IAM-KYCVERIFICATIONS-findMine` (F055) findMine() — 4 cases
- [ ] `UT-IAM-KYCVERIFICATIONS-findMineHistory` (F056) findMineHistory() — 4 cases
- [ ] `UT-IAM-KYCVERIFICATIONS-findOne` (F057) findOne() — 3 cases
- [ ] `UT-IAM-KYCVERIFICATIONS-findOneResponse` (F058) findOneResponse() — 3 cases
- [ ] `UT-IAM-KYCVERIFICATIONS-getBookingEligib` (F059) getBookingEligibility() — 4 cases
- [ ] `UT-IAM-KYCVERIFICATIONS-getPrivateFilePa` (F060) getPrivateFilePath() — 4 cases
- [ ] `UT-IAM-KYCVERIFICATIONS-getStats` (F061) getStats() — 1 cases

### [P2] OauthConnectionsService
- [ ] `UT-IAM-OAUTHCONNECTIONS-findByAccountId` (F062) findByAccountId() — 4 cases
- [ ] `UT-IAM-OAUTHCONNECTIONS-findById` (F063) findById() — 3 cases
- [ ] `UT-IAM-OAUTHCONNECTIONS-findByProviderAn` (F064) findByProviderAndUserId() — 5 cases

### [P1] KycVerificationsService
- [ ] `UT-IAM-KYCVERIFICATIONS-removeTemporaryF` (F065) removeTemporaryFile() — 2 cases

### [P2] OauthConnectionsService
- [ ] `UT-IAM-OAUTHCONNECTIONS-delete` (F066) delete() — 2 cases
- [ ] `UT-IAM-OAUTHCONNECTIONS-deleteByAccountI` (F067) deleteByAccountId() — 3 cases

### [P1] AppointmentsService
- [ ] `UT-EMR-APPOINTMENTS-confirm` (F068) confirm() — 4 cases
- [ ] `UT-EMR-APPOINTMENTS-create` (F069) create() — 24 cases
- [ ] `UT-EMR-APPOINTMENTS-createByDoctor` (F070) createByDoctor() — 13 cases
- [ ] `UT-EMR-APPOINTMENTS-createByOption` (F071) createByOption() — 11 cases
- [ ] `UT-EMR-APPOINTMENTS-createBySpecialty` (F072) createBySpecialty() — 12 cases
- [ ] `UT-EMR-APPOINTMENTS-createOutsideHours` (F073) createOutsideHours() — 14 cases

### [P2] AppointmentOptionTokenService
- [ ] `UT-EMR-APPOINTMENTOPTIONTOKEN-verify` (F074) verify() — 3 cases

### [P1] AppointmentsService
- [ ] `UT-EMR-APPOINTMENTS-cancel` (F075) cancel() — 7 cases
- [ ] `UT-EMR-APPOINTMENTS-changeStatus` (F076) changeStatus() — 9 cases
- [ ] `UT-EMR-APPOINTMENTS-setReminderPreferenc` (F077) setReminderPreferenceForAppointment() — 7 cases
- [ ] `UT-EMR-APPOINTMENTS-update` (F078) update() — 11 cases

### [P2] AppointmentOptionTokenService
- [ ] `UT-EMR-APPOINTMENTOPTIONTOKEN-sign` (F079) sign() — 2 cases

### [P1] AppointmentsService
- [ ] `UT-EMR-APPOINTMENTS-checkIn` (F080) checkIn() — 5 cases
- [ ] `UT-EMR-APPOINTMENTS-findByCode` (F081) findByCode() — 6 cases
- [ ] `UT-EMR-APPOINTMENTS-findByDoctor` (F082) findByDoctor() — 9 cases
- [ ] `UT-EMR-APPOINTMENTS-findById` (F083) findById() — 6 cases
- [ ] `UT-EMR-APPOINTMENTS-findByPatient` (F084) findByPatient() — 9 cases
- [ ] `UT-EMR-APPOINTMENTS-findDoctorWorklist` (F085) findDoctorWorklist() — 10 cases
- [ ] `UT-EMR-APPOINTMENTS-findNotificationLogs` (F086) findNotificationLogs() — 6 cases
- [ ] `UT-EMR-APPOINTMENTS-getReminderPreferenc` (F087) getReminderPreferenceForAppointment() — 6 cases
- [ ] `UT-EMR-APPOINTMENTS-getStatusHistory` (F088) getStatusHistory() — 7 cases
- [ ] `UT-EMR-APPOINTMENTS-markReminderRead` (F089) markReminderRead() — 5 cases
- [ ] `UT-EMR-APPOINTMENTS-markReminderResponde` (F090) markReminderResponded() — 5 cases
- [ ] `UT-EMR-APPOINTMENTS-rescheduleByOption` (F091) rescheduleByOption() — 9 cases
- [ ] `UT-EMR-APPOINTMENTS-retryReminder` (F092) retryReminder() — 7 cases
- [ ] `UT-EMR-APPOINTMENTS-sendConfirmation` (F093) sendConfirmation() — 5 cases
- [ ] `UT-EMR-APPOINTMENTS-sendReminder` (F094) sendReminder() — 5 cases

## v1.1 · clinical core (examination, records, prescriptions, treatment, orders, patients) · 2026-07-21 — 107 fn / 374 cases


### [P2] DiagnosesService
- [ ] `UT-EMR-DIAGNOSES-create` (F095) create() — 4 cases

### [P1] ExaminationSessionsService
- [ ] `UT-EMR-EXAMINATIONSESSIONS-create` (F096) create() — 15 cases
- [ ] `UT-EMR-EXAMINATIONSESSIONS-createAmendme` (F097) createAmendment() — 8 cases

### [P2] MedicalHistoryService
- [ ] `UT-EMR-MEDICALHISTORY-create` (F098) create() — 4 cases

### [P1] MedicalRecordsService
- [ ] `UT-EMR-MEDICALRECORDS-create` (F099) create() — 7 cases
- [ ] `UT-EMR-MEDICALRECORDS-createVersion` (F100) createVersion() — 5 cases

### [P1] PrescriptionsService
- [ ] `UT-EMR-PRESCRIPTIONS-create` (F101) create() — 10 cases

### [P2] SymptomsService
- [ ] `UT-EMR-SYMPTOMS-create` (F102) create() — 5 cases

### [P1] TreatmentPlansService
- [ ] `UT-EMR-TREATMENTPLANS-create` (F103) create() — 15 cases

### [P2] DiagnosesService
- [ ] `UT-EMR-DIAGNOSES-update` (F104) update() — 2 cases

### [P1] ExaminationSessionsService
- [ ] `UT-EMR-EXAMINATIONSESSIONS-update` (F105) update() — 2 cases

### [P2] MedicalHistoryService
- [ ] `UT-EMR-MEDICALHISTORY-update` (F106) update() — 4 cases

### [P1] MedicalRecordsService
- [ ] `UT-EMR-MEDICALRECORDS-update` (F107) update() — 2 cases

### [P1] PrescriptionsService
- [ ] `UT-EMR-PRESCRIPTIONS-cancel` (F108) cancel() — 5 cases
- [ ] `UT-EMR-PRESCRIPTIONS-update` (F109) update() — 2 cases

### [P2] SymptomsService
- [ ] `UT-EMR-SYMPTOMS-update` (F110) update() — 2 cases

### [P1] TreatmentPlansService
- [ ] `UT-EMR-TREATMENTPLANS-update` (F111) update() — 3 cases

### [P2] DiagnosesService
- [ ] `UT-EMR-DIAGNOSES-findAll` (F112) findAll() — 1 cases
- [ ] `UT-EMR-DIAGNOSES-findByIcdCode` (F113) findByIcdCode() — 3 cases
- [ ] `UT-EMR-DIAGNOSES-findBySessionId` (F114) findBySessionId() — 3 cases
- [ ] `UT-EMR-DIAGNOSES-findOne` (F115) findOne() — 3 cases

### [P1] ExaminationSessionsService
- [ ] `UT-EMR-EXAMINATIONSESSIONS-finalize` (F116) finalize() — 5 cases
- [ ] `UT-EMR-EXAMINATIONSESSIONS-findAll` (F117) findAll() — 1 cases
- [ ] `UT-EMR-EXAMINATIONSESSIONS-findAmendment` (F118) findAmendments() — 3 cases
- [ ] `UT-EMR-EXAMINATIONSESSIONS-findByAppoint` (F119) findByAppointmentId() — 3 cases
- [ ] `UT-EMR-EXAMINATIONSESSIONS-findByDoctorI` (F120) findByDoctorId() — 3 cases
- [ ] `UT-EMR-EXAMINATIONSESSIONS-findByPatient` (F121) findByPatientId() — 3 cases
- [ ] `UT-EMR-EXAMINATIONSESSIONS-findOne` (F122) findOne() — 3 cases

### [P2] MedicalHistoryService
- [ ] `UT-EMR-MEDICALHISTORY-findAll` (F123) findAll() — 1 cases
- [ ] `UT-EMR-MEDICALHISTORY-findByPatient` (F124) findByPatient() — 3 cases
- [ ] `UT-EMR-MEDICALHISTORY-findOne` (F125) findOne() — 3 cases

### [P1] MedicalRecordsService
- [ ] `UT-EMR-MEDICALRECORDS-finalize` (F126) finalize() — 4 cases
- [ ] `UT-EMR-MEDICALRECORDS-findAll` (F127) findAll() — 1 cases
- [ ] `UT-EMR-MEDICALRECORDS-findByPatient` (F128) findByPatient() — 3 cases
- [ ] `UT-EMR-MEDICALRECORDS-findOne` (F129) findOne() — 3 cases
- [ ] `UT-EMR-MEDICALRECORDS-getVersions` (F130) getVersions() — 3 cases

### [P1] PrescriptionsService
- [ ] `UT-EMR-PRESCRIPTIONS-findAll` (F131) findAll() — 1 cases
- [ ] `UT-EMR-PRESCRIPTIONS-findByDoctorId` (F132) findByDoctorId() — 3 cases
- [ ] `UT-EMR-PRESCRIPTIONS-findByPatientId` (F133) findByPatientId() — 3 cases
- [ ] `UT-EMR-PRESCRIPTIONS-findByRecordId` (F134) findByRecordId() — 3 cases
- [ ] `UT-EMR-PRESCRIPTIONS-findBySessionId` (F135) findBySessionId() — 3 cases
- [ ] `UT-EMR-PRESCRIPTIONS-findOne` (F136) findOne() — 3 cases
- [ ] `UT-EMR-PRESCRIPTIONS-issue` (F137) issue() — 3 cases

### [P2] SymptomsService
- [ ] `UT-EMR-SYMPTOMS-findAll` (F138) findAll() — 1 cases
- [ ] `UT-EMR-SYMPTOMS-findByPatientId` (F139) findByPatientId() — 3 cases
- [ ] `UT-EMR-SYMPTOMS-findBySessionId` (F140) findBySessionId() — 3 cases
- [ ] `UT-EMR-SYMPTOMS-findOne` (F141) findOne() — 3 cases

### [P1] TreatmentPlansService
- [ ] `UT-EMR-TREATMENTPLANS-accept` (F142) accept() — 7 cases
- [ ] `UT-EMR-TREATMENTPLANS-decline` (F143) decline() — 6 cases
- [ ] `UT-EMR-TREATMENTPLANS-findAll` (F144) findAll() — 1 cases
- [ ] `UT-EMR-TREATMENTPLANS-findByPatientId` (F145) findByPatientId() — 3 cases
- [ ] `UT-EMR-TREATMENTPLANS-findByRecordId` (F146) findByRecordId() — 3 cases
- [ ] `UT-EMR-TREATMENTPLANS-findBySessionId` (F147) findBySessionId() — 3 cases
- [ ] `UT-EMR-TREATMENTPLANS-findOne` (F148) findOne() — 3 cases
- [ ] `UT-EMR-TREATMENTPLANS-propose` (F149) propose() — 7 cases

### [P2] DiagnosesService
- [ ] `UT-EMR-DIAGNOSES-remove` (F150) remove() — 2 cases

### [P1] ExaminationSessionsService
- [ ] `UT-EMR-EXAMINATIONSESSIONS-remove` (F151) remove() — 2 cases

### [P2] MedicalHistoryService
- [ ] `UT-EMR-MEDICALHISTORY-remove` (F152) remove() — 2 cases

### [P1] MedicalRecordsService
- [ ] `UT-EMR-MEDICALRECORDS-remove` (F153) remove() — 2 cases

### [P1] PrescriptionsService
- [ ] `UT-EMR-PRESCRIPTIONS-remove` (F154) remove() — 2 cases

### [P2] SymptomsService
- [ ] `UT-EMR-SYMPTOMS-remove` (F155) remove() — 2 cases

### [P1] TreatmentPlansService
- [ ] `UT-EMR-TREATMENTPLANS-remove` (F156) remove() — 2 cases

### [P1] ClinicalOrdersService
- [ ] `UT-EMR-CLINICALORDERS-create` (F157) create() — 13 cases

### [P1] DiagnosticOrdersService
- [ ] `UT-EMR-DIAGNOSTICORDERS-create` (F158) create() — 10 cases

### [P2] LabTestResultsService
- [ ] `UT-EMR-LABTESTRESULTS-create` (F159) create() — 3 cases

### [P2] PatientsService
- [ ] `UT-EMR-PATIENTS-create` (F160) create() — 6 cases

### [P2] PrescriptionItemsService
- [ ] `UT-EMR-PRESCRIPTIONITEMS-create` (F161) create() — 11 cases

### [P2] TreatmentHistoryService
- [ ] `UT-EMR-TREATMENTHISTORY-create` (F162) create() — 7 cases

### [P1] ClinicalOrdersService
- [ ] `UT-EMR-CLINICALORDERS-update` (F163) update() — 2 cases

### [P1] DiagnosticOrdersService
- [ ] `UT-EMR-DIAGNOSTICORDERS-update` (F164) update() — 5 cases

### [P2] LabTestResultsService
- [ ] `UT-EMR-LABTESTRESULTS-update` (F165) update() — 2 cases

### [P2] PatientsService
- [ ] `UT-EMR-PATIENTS-update` (F166) update() — 2 cases

### [P2] PrescriptionItemsService
- [ ] `UT-EMR-PRESCRIPTIONITEMS-update` (F167) update() — 3 cases

### [P2] TreatmentHistoryService
- [ ] `UT-EMR-TREATMENTHISTORY-update` (F168) update() — 2 cases

### [P1] ClinicalOrdersService
- [ ] `UT-EMR-CLINICALORDERS-findAll` (F169) findAll() — 1 cases
- [ ] `UT-EMR-CLINICALORDERS-findByOrderedBy` (F170) findByOrderedBy() — 3 cases
- [ ] `UT-EMR-CLINICALORDERS-findByPatientId` (F171) findByPatientId() — 3 cases
- [ ] `UT-EMR-CLINICALORDERS-findByRecordId` (F172) findByRecordId() — 3 cases
- [ ] `UT-EMR-CLINICALORDERS-findBySessionId` (F173) findBySessionId() — 3 cases
- [ ] `UT-EMR-CLINICALORDERS-findByStatus` (F174) findByStatus() — 3 cases
- [ ] `UT-EMR-CLINICALORDERS-findOne` (F175) findOne() — 3 cases

### [P1] DiagnosticOrdersService
- [ ] `UT-EMR-DIAGNOSTICORDERS-findByAppointmen` (F176) findByAppointment() — 4 cases
- [ ] `UT-EMR-DIAGNOSTICORDERS-findByCode` (F177) findByCode() — 3 cases
- [ ] `UT-EMR-DIAGNOSTICORDERS-findById` (F178) findById() — 3 cases
- [ ] `UT-EMR-DIAGNOSTICORDERS-findByPatient` (F179) findByPatient() — 4 cases

### [P2] LabTestResultsService
- [ ] `UT-EMR-LABTESTRESULTS-findAbnormalResult` (F180) findAbnormalResults() — 1 cases
- [ ] `UT-EMR-LABTESTRESULTS-findAll` (F181) findAll() — 1 cases
- [ ] `UT-EMR-LABTESTRESULTS-findByOrderId` (F182) findByOrderId() — 3 cases
- [ ] `UT-EMR-LABTESTRESULTS-findOne` (F183) findOne() — 3 cases

### [P2] PatientsService
- [ ] `UT-EMR-PATIENTS-findAll` (F184) findAll() — 1 cases
- [ ] `UT-EMR-PATIENTS-findByCode` (F185) findByCode() — 3 cases
- [ ] `UT-EMR-PATIENTS-findByUserId` (F186) findByUserId() — 4 cases
- [ ] `UT-EMR-PATIENTS-findOne` (F187) findOne() — 3 cases

### [P2] PrescriptionItemsService
- [ ] `UT-EMR-PRESCRIPTIONITEMS-findAll` (F188) findAll() — 1 cases
- [ ] `UT-EMR-PRESCRIPTIONITEMS-findByPrescript` (F189) findByPrescriptionId() — 3 cases
- [ ] `UT-EMR-PRESCRIPTIONITEMS-findOne` (F190) findOne() — 3 cases

### [P2] TreatmentHistoryService
- [ ] `UT-EMR-TREATMENTHISTORY-findAll` (F191) findAll() — 1 cases
- [ ] `UT-EMR-TREATMENTHISTORY-findByPatientId` (F192) findByPatientId() — 3 cases
- [ ] `UT-EMR-TREATMENTHISTORY-findByRecordId` (F193) findByRecordId() — 3 cases
- [ ] `UT-EMR-TREATMENTHISTORY-findByToothNumbe` (F194) findByToothNumber() — 3 cases
- [ ] `UT-EMR-TREATMENTHISTORY-findOne` (F195) findOne() — 3 cases

### [P1] ClinicalOrdersService
- [ ] `UT-EMR-CLINICALORDERS-remove` (F196) remove() — 2 cases

### [P1] DiagnosticOrdersService
- [ ] `UT-EMR-DIAGNOSTICORDERS-remove` (F197) remove() — 3 cases

### [P2] LabTestResultsService
- [ ] `UT-EMR-LABTESTRESULTS-remove` (F198) remove() — 2 cases

### [P2] PatientsService
- [ ] `UT-EMR-PATIENTS-remove` (F199) remove() — 2 cases

### [P2] PrescriptionItemsService
- [ ] `UT-EMR-PRESCRIPTIONITEMS-remove` (F200) remove() — 2 cases

### [P2] TreatmentHistoryService
- [ ] `UT-EMR-TREATMENTHISTORY-remove` (F201) remove() — 2 cases

## v1.2 · supporting (images, clinic/schedule admin, roles, notifications, reports) · 2026-07-23 — 171 fn / 563 cases


### [P2] DentalChartsService
- [ ] `UT-EMR-DENTALCHARTS-create` (F202) create() — 6 cases

### [P2] DentalImagesService
- [ ] `UT-EMR-DENTALIMAGES-create` (F203) create() — 6 cases

### [P2] DoctorSchedulesService
- [ ] `UT-EMR-DOCTORSCHEDULES-create` (F204) create() — 9 cases

### [P2] PatientRepresentativesService
- [ ] `UT-EMR-PATIENTREPRESENTATIVES-create` (F205) create() — 11 cases

### [P1] PermissionsService
- [ ] `UT-IAM-PERMISSIONS-create` (F206) create() — 3 cases

### [P2] RecordExportsService
- [ ] `UT-EMR-RECORDEXPORTS-create` (F207) create() — 6 cases

### [P1] RolesService
- [ ] `UT-IAM-ROLES-create` (F208) create() — 2 cases

### [P2] UserProfilesService
- [ ] `UT-IAM-USERPROFILES-create` (F209) create() — 5 cases

### [P2] DentalChartsService
- [ ] `UT-EMR-DENTALCHARTS-update` (F210) update() — 2 cases

### [P2] DentalImagesService
- [ ] `UT-EMR-DENTALIMAGES-update` (F211) update() — 2 cases

### [P2] DoctorSchedulesService
- [ ] `UT-EMR-DOCTORSCHEDULES-update` (F212) update() — 5 cases

### [P2] PatientRepresentativesService
- [ ] `UT-EMR-PATIENTREPRESENTATIVES-update` (F213) update() — 6 cases
- [ ] `UT-EMR-PATIENTREPRESENTATIVES-verify` (F214) verify() — 6 cases

### [P1] PermissionsService
- [ ] `UT-IAM-PERMISSIONS-assignPermissionToRol` (F215) assignPermissionToRole() — 7 cases
- [ ] `UT-IAM-PERMISSIONS-revokePermissionFromR` (F216) revokePermissionFromRole() — 5 cases
- [ ] `UT-IAM-PERMISSIONS-update` (F217) update() — 3 cases

### [P2] RecordExportsService
- [ ] `UT-EMR-RECORDEXPORTS-update` (F218) update() — 2 cases

### [P1] RolesService
- [ ] `UT-IAM-ROLES-update` (F219) update() — 3 cases

### [P2] UserProfilesService
- [ ] `UT-IAM-USERPROFILES-update` (F220) update() — 3 cases

### [P1] UserRolesService
- [ ] `UT-IAM-USERROLES-assignRole` (F221) assignRole() — 7 cases
- [ ] `UT-IAM-USERROLES-revokeRole` (F222) revokeRole() — 5 cases

### [P2] DentalChartsService
- [ ] `UT-EMR-DENTALCHARTS-findAll` (F223) findAll() — 1 cases
- [ ] `UT-EMR-DENTALCHARTS-findByPatientId` (F224) findByPatientId() — 3 cases
- [ ] `UT-EMR-DENTALCHARTS-findByRecordId` (F225) findByRecordId() — 3 cases
- [ ] `UT-EMR-DENTALCHARTS-findOne` (F226) findOne() — 3 cases

### [P2] DentalImagesService
- [ ] `UT-EMR-DENTALIMAGES-archive` (F227) archive() — 2 cases
- [ ] `UT-EMR-DENTALIMAGES-findAll` (F228) findAll() — 1 cases
- [ ] `UT-EMR-DENTALIMAGES-findArchived` (F229) findArchived() — 1 cases
- [ ] `UT-EMR-DENTALIMAGES-findByCategoryId` (F230) findByCategoryId() — 3 cases
- [ ] `UT-EMR-DENTALIMAGES-findByPacsId` (F231) findByPacsId() — 3 cases
- [ ] `UT-EMR-DENTALIMAGES-findByPatientId` (F232) findByPatientId() — 3 cases
- [ ] `UT-EMR-DENTALIMAGES-findByRecordId` (F233) findByRecordId() — 3 cases
- [ ] `UT-EMR-DENTALIMAGES-findByUploadedBy` (F234) findByUploadedBy() — 3 cases
- [ ] `UT-EMR-DENTALIMAGES-findOne` (F235) findOne() — 3 cases

### [P2] DoctorSchedulesService
- [ ] `UT-EMR-DOCTORSCHEDULES-findByDoctor` (F236) findByDoctor() — 6 cases
- [ ] `UT-EMR-DOCTORSCHEDULES-findById` (F237) findById() — 3 cases
- [ ] `UT-EMR-DOCTORSCHEDULES-getChangeHistory` (F238) getChangeHistory() — 4 cases

### [P2] PatientRepresentativesService
- [ ] `UT-EMR-PATIENTREPRESENTATIVES-findAuthor` (F239) findAuthorizedRepresentative() — 5 cases
- [ ] `UT-EMR-PATIENTREPRESENTATIVES-findByPati` (F240) findByPatient() — 7 cases
- [ ] `UT-EMR-PATIENTREPRESENTATIVES-findOne` (F241) findOne() — 6 cases

### [P1] PermissionsService
- [ ] `UT-IAM-PERMISSIONS-findAll` (F242) findAll() — 1 cases
- [ ] `UT-IAM-PERMISSIONS-findById` (F243) findById() — 3 cases
- [ ] `UT-IAM-PERMISSIONS-getPermissionsByRole` (F244) getPermissionsByRole() — 4 cases

### [P2] RecordExportsService
- [ ] `UT-EMR-RECORDEXPORTS-findAll` (F245) findAll() — 1 cases
- [ ] `UT-EMR-RECORDEXPORTS-findByRecordId` (F246) findByRecordId() — 3 cases
- [ ] `UT-EMR-RECORDEXPORTS-findOne` (F247) findOne() — 3 cases

### [P1] RolesService
- [ ] `UT-IAM-ROLES-findAll` (F248) findAll() — 2 cases
- [ ] `UT-IAM-ROLES-findById` (F249) findById() — 3 cases

### [P2] UserProfilesService
- [ ] `UT-IAM-USERPROFILES-ban` (F250) ban() — 3 cases
- [ ] `UT-IAM-USERPROFILES-findById` (F251) findById() — 3 cases
- [ ] `UT-IAM-USERPROFILES-unban` (F252) unban() — 2 cases

### [P1] UserRolesService
- [ ] `UT-IAM-USERROLES-getRolesByUser` (F253) getRolesByUser() — 4 cases
- [ ] `UT-IAM-USERROLES-getUsersByRole` (F254) getUsersByRole() — 4 cases

### [P2] DentalChartsService
- [ ] `UT-EMR-DENTALCHARTS-remove` (F255) remove() — 2 cases

### [P2] DentalImagesService
- [ ] `UT-EMR-DENTALIMAGES-remove` (F256) remove() — 2 cases

### [P1] PermissionsService
- [ ] `UT-IAM-PERMISSIONS-remove` (F257) remove() — 2 cases

### [P2] RecordExportsService
- [ ] `UT-EMR-RECORDEXPORTS-remove` (F258) remove() — 2 cases

### [P1] RolesService
- [ ] `UT-IAM-ROLES-remove` (F259) remove() — 2 cases

### [P2] UserProfilesService
- [ ] `UT-IAM-USERPROFILES-remove` (F260) remove() — 2 cases

### [P2] AuditLogsService
- [ ] `UT-IAM-AUDITLOGS-create` (F261) create() — 5 cases

### [P2] ClinicsService
- [ ] `UT-EMR-CLINICS-create` (F262) create() — 7 cases

### [P2] DoctorLeavesService
- [ ] `UT-EMR-DOCTORLEAVES-create` (F263) create() — 9 cases

### [P2] DoctorSpecialtiesService
- [ ] `UT-EMR-DOCTORSPECIALTIES-create` (F264) create() — 7 cases

### [P2] ImageAnnotationsService
- [ ] `UT-EMR-IMAGEANNOTATIONS-create` (F265) create() — 3 cases

### [P2] ImageCategoriesService
- [ ] `UT-EMR-IMAGECATEGORIES-create` (F266) create() — 2 cases

### [P2] MailService
- [ ] `UT-IAM-MAIL-confirmNewEmail` (F267) confirmNewEmail() — 2 cases

### [P2] NotificationsService
- [ ] `UT-IAM-NOTIFICATIONS-createNotification` (F268) createNotification() — 9 cases
- [ ] `UT-IAM-NOTIFICATIONS-createPreference` (F269) createPreference() — 6 cases
- [ ] `UT-IAM-NOTIFICATIONS-createTemplate` (F270) createTemplate() — 6 cases

### [P2] PacsSyncLogsService
- [ ] `UT-EMR-PACSSYNCLOGS-create` (F271) create() — 2 cases

### [P2] ServiceCategoriesService
- [ ] `UT-EMR-SERVICECATEGORIES-create` (F272) create() — 3 cases

### [P2] ServicesService
- [ ] `UT-EMR-SERVICES-create` (F273) create() — 9 cases

### [P2] SpecialtiesService
- [ ] `UT-EMR-SPECIALTIES-create` (F274) create() — 3 cases

### [P2] TreatmentRoomsService
- [ ] `UT-EMR-TREATMENTROOMS-create` (F275) create() — 8 cases

### [P2] WorkShiftsService
- [ ] `UT-EMR-WORKSHIFTS-create` (F276) create() — 4 cases

### [P2] ClinicsService
- [ ] `UT-EMR-CLINICS-update` (F277) update() — 6 cases

### [P2] DoctorLeavesService
- [ ] `UT-EMR-DOCTORLEAVES-update` (F278) update() — 5 cases

### [P2] ImageAnnotationsService
- [ ] `UT-EMR-IMAGEANNOTATIONS-update` (F279) update() — 2 cases

### [P2] ImageCategoriesService
- [ ] `UT-EMR-IMAGECATEGORIES-update` (F280) update() — 2 cases

### [P2] NotificationsService
- [ ] `UT-IAM-NOTIFICATIONS-updateNotification` (F281) updateNotification() — 4 cases
- [ ] `UT-IAM-NOTIFICATIONS-updatePreference` (F282) updatePreference() — 2 cases
- [ ] `UT-IAM-NOTIFICATIONS-updateTemplate` (F283) updateTemplate() — 3 cases

### [P2] PacsSyncLogsService
- [ ] `UT-EMR-PACSSYNCLOGS-update` (F284) update() — 2 cases

### [P2] ServiceCategoriesService
- [ ] `UT-EMR-SERVICECATEGORIES-update` (F285) update() — 3 cases

### [P2] ServicesService
- [ ] `UT-EMR-SERVICES-assignServiceToClinic` (F286) assignServiceToClinic() — 6 cases
- [ ] `UT-EMR-SERVICES-update` (F287) update() — 3 cases
- [ ] `UT-EMR-SERVICES-updateClinicService` (F288) updateClinicService() — 5 cases

### [P2] SpecialtiesService
- [ ] `UT-EMR-SPECIALTIES-update` (F289) update() — 3 cases

### [P2] TreatmentRoomsService
- [ ] `UT-EMR-TREATMENTROOMS-update` (F290) update() — 3 cases

### [P2] WorkShiftsService
- [ ] `UT-EMR-WORKSHIFTS-update` (F291) update() — 3 cases

### [P2] AuditLogsService
- [ ] `UT-IAM-AUDITLOGS-findById` (F292) findById() — 3 cases

### [P2] ClinicsService
- [ ] `UT-EMR-CLINICS-findByCode` (F293) findByCode() — 3 cases
- [ ] `UT-EMR-CLINICS-findById` (F294) findById() — 3 cases

### [P2] DoctorLeavesService
- [ ] `UT-EMR-DOCTORLEAVES-findByDoctor` (F295) findByDoctor() — 5 cases
- [ ] `UT-EMR-DOCTORLEAVES-findById` (F296) findById() — 3 cases

### [P2] DoctorSpecialtiesService
- [ ] `UT-EMR-DOCTORSPECIALTIES-findByDoctor` (F297) findByDoctor() — 4 cases
- [ ] `UT-EMR-DOCTORSPECIALTIES-findBySpecialty` (F298) findBySpecialty() — 4 cases

### [P2] FilesService
- [ ] `UT-EMR-FILES-findById` (F299) findById() — 3 cases
- [ ] `UT-EMR-FILES-findByIds` (F300) findByIds() — 3 cases

### [P2] ImageAnnotationsService
- [ ] `UT-EMR-IMAGEANNOTATIONS-findAll` (F301) findAll() — 1 cases
- [ ] `UT-EMR-IMAGEANNOTATIONS-findByAnnotatedB` (F302) findByAnnotatedBy() — 3 cases
- [ ] `UT-EMR-IMAGEANNOTATIONS-findByImageId` (F303) findByImageId() — 3 cases
- [ ] `UT-EMR-IMAGEANNOTATIONS-findByType` (F304) findByType() — 3 cases
- [ ] `UT-EMR-IMAGEANNOTATIONS-findOne` (F305) findOne() — 3 cases

### [P2] ImageCategoriesService
- [ ] `UT-EMR-IMAGECATEGORIES-findAll` (F306) findAll() — 1 cases
- [ ] `UT-EMR-IMAGECATEGORIES-findByName` (F307) findByName() — 3 cases
- [ ] `UT-EMR-IMAGECATEGORIES-findOne` (F308) findOne() — 3 cases

### [P2] KycAutoVerificationService
- [ ] `UT-IAM-KYCAUTOVERIFICATION-evaluate` (F309) evaluate() — 2 cases

### [P2] KycFileAccessAuditService
- [ ] `UT-IAM-KYCFILEACCESSAUDIT-logView` (F310) logView() — 2 cases

### [P2] KycFileStorageService
- [ ] `UT-IAM-KYCFILESTORAGE-decryptToTempFile` (F311) decryptToTempFile() — 2 cases
- [ ] `UT-IAM-KYCFILESTORAGE-resolvePrivatePath` (F312) resolvePrivatePath() — 3 cases
- [ ] `UT-IAM-KYCFILESTORAGE-save` (F313) save() — 6 cases

### [P2] KycOcrAssessmentService
- [ ] `UT-IAM-KYCOCRASSESSMENT-assess` (F314) assess() — 2 cases

### [P2] KycOcrPollerService
- [ ] `UT-IAM-KYCOCRPOLLER-onModuleDestroy` (F315) onModuleDestroy() — 1 cases
- [ ] `UT-IAM-KYCOCRPOLLER-onModuleInit` (F316) onModuleInit() — 1 cases
- [ ] `UT-IAM-KYCOCRPOLLER-processPendingOnce` (F317) processPendingOnce() — 1 cases

### [P2] KycOcrService
- [ ] `UT-IAM-KYCOCR-extractIdentity` (F318) extractIdentity() — 2 cases

### [P2] KycRetentionService
- [ ] `UT-IAM-KYCRETENTION-cleanupExpired` (F319) cleanupExpired() — 2 cases
- [ ] `UT-IAM-KYCRETENTION-onModuleDestroy` (F320) onModuleDestroy() — 1 cases
- [ ] `UT-IAM-KYCRETENTION-onModuleInit` (F321) onModuleInit() — 1 cases

### [P2] MailService
- [ ] `UT-IAM-MAIL-forgotPassword` (F322) forgotPassword() — 2 cases
- [ ] `UT-IAM-MAIL-sendNotificationEmail` (F323) sendNotificationEmail() — 2 cases
- [ ] `UT-IAM-MAIL-userSignUp` (F324) userSignUp() — 2 cases

### [P2] NotificationsService
- [ ] `UT-IAM-NOTIFICATIONS-findAllTemplates` (F325) findAllTemplates() — 1 cases
- [ ] `UT-IAM-NOTIFICATIONS-findNotificationByI` (F326) findNotificationById() — 3 cases
- [ ] `UT-IAM-NOTIFICATIONS-findNotificationsWi` (F327) findNotificationsWithPagination() — 5 cases
- [ ] `UT-IAM-NOTIFICATIONS-findPreferencesByUs` (F328) findPreferencesByUserId() — 4 cases
- [ ] `UT-IAM-NOTIFICATIONS-findTemplateByCode` (F329) findTemplateByCode() — 3 cases
- [ ] `UT-IAM-NOTIFICATIONS-findTemplateById` (F330) findTemplateById() — 3 cases
- [ ] `UT-IAM-NOTIFICATIONS-getUnreadCount` (F331) getUnreadCount() — 4 cases
- [ ] `UT-IAM-NOTIFICATIONS-markAsRead` (F332) markAsRead() — 2 cases

### [P2] PacsSyncLogsService
- [ ] `UT-EMR-PACSSYNCLOGS-findAll` (F333) findAll() — 1 cases
- [ ] `UT-EMR-PACSSYNCLOGS-findByImageId` (F334) findByImageId() — 3 cases
- [ ] `UT-EMR-PACSSYNCLOGS-findByPacsServer` (F335) findByPacsServer() — 3 cases
- [ ] `UT-EMR-PACSSYNCLOGS-findByStatus` (F336) findByStatus() — 3 cases
- [ ] `UT-EMR-PACSSYNCLOGS-findBySyncType` (F337) findBySyncType() — 3 cases
- [ ] `UT-EMR-PACSSYNCLOGS-findFailed` (F338) findFailed() — 1 cases
- [ ] `UT-EMR-PACSSYNCLOGS-findOne` (F339) findOne() — 3 cases
- [ ] `UT-EMR-PACSSYNCLOGS-findRecent` (F340) findRecent() — 3 cases

### [P2] ReportsService
- [ ] `UT-EMR-REPORTS-getDoctorDashboard` (F341) getDoctorDashboard() — 3 cases
- [ ] `UT-EMR-REPORTS-getDoctorPerformance` (F342) getDoctorPerformance() — 2 cases
- [ ] `UT-EMR-REPORTS-getOperationalReport` (F343) getOperationalReport() — 2 cases
- [ ] `UT-EMR-REPORTS-getPatientDashboard` (F344) getPatientDashboard() — 3 cases
- [ ] `UT-EMR-REPORTS-getRevenue` (F345) getRevenue() — 2 cases

### [P2] ServiceCategoriesService
- [ ] `UT-EMR-SERVICECATEGORIES-findAll` (F346) findAll() — 1 cases
- [ ] `UT-EMR-SERVICECATEGORIES-findById` (F347) findById() — 3 cases
- [ ] `UT-EMR-SERVICECATEGORIES-findRoots` (F348) findRoots() — 1 cases

### [P2] ServicesService
- [ ] `UT-EMR-SERVICES-findById` (F349) findById() — 3 cases
- [ ] `UT-EMR-SERVICES-findClinicServices` (F350) findClinicServices() — 4 cases

### [P2] SpecialtiesService
- [ ] `UT-EMR-SPECIALTIES-findAll` (F351) findAll() — 3 cases
- [ ] `UT-EMR-SPECIALTIES-findById` (F352) findById() — 3 cases

### [P2] TreatmentRoomsService
- [ ] `UT-EMR-TREATMENTROOMS-findById` (F353) findById() — 3 cases

### [P2] WorkShiftsService
- [ ] `UT-EMR-WORKSHIFTS-findAll` (F354) findAll() — 1 cases
- [ ] `UT-EMR-WORKSHIFTS-findById` (F355) findById() — 3 cases

### [P2] ClinicsService
- [ ] `UT-EMR-CLINICS-remove` (F356) remove() — 3 cases

### [P2] DoctorLeavesService
- [ ] `UT-EMR-DOCTORLEAVES-remove` (F357) remove() — 3 cases

### [P2] DoctorSpecialtiesService
- [ ] `UT-EMR-DOCTORSPECIALTIES-remove` (F358) remove() — 6 cases

### [P2] ImageAnnotationsService
- [ ] `UT-EMR-IMAGEANNOTATIONS-remove` (F359) remove() — 2 cases

### [P2] ImageCategoriesService
- [ ] `UT-EMR-IMAGECATEGORIES-remove` (F360) remove() — 2 cases

### [P2] KycFileStorageService
- [ ] `UT-IAM-KYCFILESTORAGE-deleteMany` (F361) deleteMany() — 2 cases
- [ ] `UT-IAM-KYCFILESTORAGE-removeTempFile` (F362) removeTempFile() — 2 cases

### [P2] NotificationsService
- [ ] `UT-IAM-NOTIFICATIONS-deleteNotification` (F363) deleteNotification() — 2 cases
- [ ] `UT-IAM-NOTIFICATIONS-deletePreference` (F364) deletePreference() — 2 cases
- [ ] `UT-IAM-NOTIFICATIONS-deleteTemplate` (F365) deleteTemplate() — 2 cases

### [P2] PacsSyncLogsService
- [ ] `UT-EMR-PACSSYNCLOGS-remove` (F366) remove() — 2 cases

### [P2] ServiceCategoriesService
- [ ] `UT-EMR-SERVICECATEGORIES-remove` (F367) remove() — 3 cases

### [P2] ServicesService
- [ ] `UT-EMR-SERVICES-remove` (F368) remove() — 3 cases
- [ ] `UT-EMR-SERVICES-removeClinicService` (F369) removeClinicService() — 3 cases

### [P2] SpecialtiesService
- [ ] `UT-EMR-SPECIALTIES-remove` (F370) remove() — 3 cases

### [P2] TreatmentRoomsService
- [ ] `UT-EMR-TREATMENTROOMS-remove` (F371) remove() — 3 cases

### [P2] WorkShiftsService
- [ ] `UT-EMR-WORKSHIFTS-remove` (F372) remove() — 3 cases