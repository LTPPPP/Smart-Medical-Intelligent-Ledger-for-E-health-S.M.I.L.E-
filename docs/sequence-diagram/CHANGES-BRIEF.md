# Sequence Diagram — Changes Brief

What changed, and which files you need to open to finish the job.
Full analysis is in [REVIEW-NOTES.md](./REVIEW-NOTES.md).

---

## 1. Diagram files changed (27 — all need images regenerated)

### UC-10 became a sub-flow

`UC-10 Send OTP` is now a sub-flow that UC-05 and UC-06 point at.

UC05 and UC06 use a UML **`ref` frame** — `ref over authSvc, otpSvc, otpEntity, db : UC-10 Send OTP`.
The frame is a reference only: **none of UC-10's internal steps are drawn inside
it**. The four lifelines it spans are exactly the four participants UC-10 has, so
the frame width matches the sub-flow it points at.

| File | What it now shows |
|---|---|
| [UC06_ForgotPassword.puml](./UC06_ForgotPassword.puml) | Enter email/phone → `Click "Send Reset Code"` → **`ref` UC-10** → switch to OTP step. 19 steps |
| [UC05_ResetPassword.puml](./UC05_ResetPassword.puml) | Enter OTP + new password → `Click "Reset Password"` → verify OTP → `markAsUsed` → hash → `revokeByAccountId`. **`ref` UC-10 appears again** on the `Click "Resend code"` branch when the OTP is invalid/expired. 53 steps |
| [UC10_SendOTP.puml](./UC10_SendOTP.puml) | **Rewritten as the referenced sub-flow.** 4 lifelines (caller → `OtpTokensService` → `OtpTokenEntity` → PostgreSQL), 9 steps: `create(accountId, otpType)` → `generateOtpCode()` → `expiresAt` → `INSERT` → dispatch. Parameterised on `otpType`, so it serves **both** `PASSWORD_RESET` (UC-05/UC-06) and `IDENTITY_VERIFY` (phone verification) — the phone/KYC flow is not lost |

### Missing action step added (3)

| File | Added |
|---|---|
| [UC15_UpdateRolePermissions.puml](./UC15_UpdateRolePermissions.puml) | `2. Click "Assign Permission"` + validate step, renumbered to 20 steps |
| [UC16_AssignRole.puml](./UC16_AssignRole.puml) | `2. Click "Assign Role"` + validate step, renumbered to 24 steps |
| [UC19_VerifyIdentityKYC.puml](./UC19_VerifyIdentityKYC.puml) | Admin side: select submission → `Click "Approve"` + validate step, renumbered to 40 steps |

### Vague `validate input` replaced with the real rules (21)

Rules are written **in the step message itself**, no notes. Sources: the form
component where one exists, otherwise the class-validator DTO.

| File | Rules taken from |
|---|---|
| [UC01_Signup.puml](./UC01_Signup.puml) | `RegisterForm.tsx` (step 1 also fixed — it was missing `username` and `gender`) |
| [UC02_Login.puml](./UC02_Login.puml) | `LoginForm.tsx` |
| [UC07_ChangePassword.puml](./UC07_ChangePassword.puml) | `ChangePassword.tsx` |
| [UC09_UpdateProfile.puml](./UC09_UpdateProfile.puml) | `UpdateUserProfileDto` |
| [UC30_CreateWorkSchedule.puml](./UC30_CreateWorkSchedule.puml) | `CreateDoctorScheduleDto` |
| [UC33_RegisterPersonalSchedule.puml](./UC33_RegisterPersonalSchedule.puml) | `CreateDoctorScheduleDto` |
| [UC37_AddPatientProfile.puml](./UC37_AddPatientProfile.puml) | `CreatePatientDto` |
| [UC48_CreateAppointmentAtFacility.puml](./UC48_CreateAppointmentAtFacility.puml) | `CreateAppointmentDto` |
| [UC49_CreateAppointmentBySpecialty.puml](./UC49_CreateAppointmentBySpecialty.puml) | `BookBySpecialtyDto` |
| [UC50_CreateAppointmentByDoctor.puml](./UC50_CreateAppointmentByDoctor.puml) | `BookByDoctorDto` |
| [UC51_CreateAppointmentOutsideWorkingHours.puml](./UC51_CreateAppointmentOutsideWorkingHours.puml) | `BookOutsideHoursDto` |
| [UC54_CancelAppointment.puml](./UC54_CancelAppointment.puml) | `CancelAppointmentDto` |
| [UC63_AddSpecialty.puml](./UC63_AddSpecialty.puml) | `CreateSpecialtyDto` |
| [UC66_EnterSymptoms.puml](./UC66_EnterSymptoms.puml) | `CreateSymptomDto` |
| [UC70_CreateTreatmentPlan.puml](./UC70_CreateTreatmentPlan.puml) | `CreateTreatmentPlanDto` |
| [UC75_CreateElectronicPrescription.puml](./UC75_CreateElectronicPrescription.puml) | `CreatePrescriptionDto` |
| [UC76_OrderXrayCBCT.puml](./UC76_OrderXrayCBCT.puml) | `CreateDiagnosticOrderDto` |
| [UC77_OrderLaboratoryTestService.puml](./UC77_OrderLaboratoryTestService.puml) | `CreateClinicalOrderDto` |
| [UC78_OrderClinicalTest.puml](./UC78_OrderClinicalTest.puml) | `CreateClinicalOrderDto` |
| [UC79_UploadEndodonticImage.puml](./UC79_UploadEndodonticImage.puml) | `CreateDentalImageDto` — see caveat below |
| [UC80_UploadXrayCBCTImage.puml](./UC80_UploadXrayCBCTImage.puml) | `CreateDentalImageDto` — see caveat below |

> Caveat on UC79 / UC80: there is **no file-type or file-size check anywhere in
> the code**. `CreateDentalImageDto` receives an already-uploaded `image_url`
> plus optional `file_size_kb` / `file_format`. The diagrams say "accepted image
> type" and "within the upload limit" without naming values, because there are no
> values to name yet. Pin down the real limits and I will write them in.

Checked after editing: all 87 diagrams have balanced `alt` / `group` / `end`
frames and strictly sequential step numbering.

---

## 2. Files you need to open to fix the code

### A. Make the backend match the new UC05 / UC06 (required)

UC05/UC06 now document **OTP-based** password recovery. The backend still does
the **JWT-link** flow. Everything needed already exists except the wiring.

| File | What to change |
|---|---|
| [auth.service.ts](../../backend/service/iam-service/src/auth/auth.service.ts) | `forgotPassword()` at **line 271** — replace the `jwtService.signAsync({ forgotAccountId })` block with `otpTokensService.create(accountId, OtpType.PASSWORD_RESET)` and dispatch the code. `resetPassword()` at **line 302** — replace `verifyAsync(hash)` with `findValidByAccountAndCode(accountId, otp, PASSWORD_RESET)` + `markAsUsed(otpId)`; keep the existing `accountsService.update` and `refreshTokensService.revokeByAccountId` calls |
| [auth-reset-password.dto.ts](../../backend/service/iam-service/src/auth/dto/auth-reset-password.dto.ts) | Currently `{ hash, password }`. Needs `{ emailOrPhone, otp, newPassword }` |
| [auth-forgot-password.dto.ts](../../backend/service/iam-service/src/auth/dto/auth-forgot-password.dto.ts) | Currently `@IsEmail() email`. Frontend sends a field that may be a **phone number**, so `@IsEmail()` rejects it |
| [auth.controller.ts](../../backend/service/iam-service/src/auth/auth.controller.ts) | **Lines 87-98** — update the two handler bodies to pass the new DTO fields through |

Already correct, no change needed — the diagrams call these exact methods:
[otp-tokens.service.ts](../../backend/service/iam-service/src/otp-tokens/otp-tokens.service.ts)
(`create`, `findValidByAccountAndCode`, `markAsUsed`) and
[otp-token.ts](../../backend/service/iam-service/src/otp-tokens/domain/otp-token.ts)
(`OtpType.PASSWORD_RESET`, line 6 — declared but never used today).

### B. The frontend bug this uncovered (required)

| File | Problem |
|---|---|
| [ForgotPasswordForm.tsx](../../frontend/web/src/features/auth/components/ForgotPasswordForm.tsx) | **Line 103** posts `{ emailOrPhone, otp, newPassword }` to `/auth/reset/password`. The backend expects `{ hash, password }`, so **this path 422s on every attempt today**. Fixing section A makes this work as written |
| [auth.ts](../../frontend/web/src/features/auth/api/auth.ts) | **Line 107** `resetPassword` (OTP body) and **line 116** `resetPasswordByHash` (link body) both POST to the *same* endpoint. Once A is done, decide whether to keep the hash variant at all |
| [ResetPasswordForm.tsx](../../frontend/web/src/features/auth/components/ResetPasswordForm.tsx) | The `?hash=` link flow. Currently the **only working** reset path. If you drop the link flow, this page and its route go too |

### C. Diagram-vs-code bugs still unfixed (your call)

| File | Problem |
|---|---|
| [UC07_ChangePassword.puml](./UC07_ChangePassword.puml) | Omits `refreshTokensService.revokeByAccountId(accountId)` — the code **does** revoke all refresh tokens on password change ([auth.service.ts](../../backend/service/iam-service/src/auth/auth.service.ts) line 387). Also missing the `missingOldPassword` branch and the "Google-only account has no passwordHash" branch |
| [UC01_Signup.puml](./UC01_Signup.puml) | Steps 34-36 show the user typing an **OTP** to confirm email, but `confirmEmail()` takes a **JWT hash**, not a 6-digit code. Same confusion UC-10 had. Also missing the `already verified` → 404 branch |

---

## 3. Suggested order

1. Section A — backend OTP wiring, so UC05/UC06 become as-built instead of spec.
2. Section B — the frontend then works end to end with no further change.
3. Section C — patch UC07 and UC01, which are wrong-logic bugs in the diagrams.
4. Pin the real image type/size limits for UC79 / UC80.
