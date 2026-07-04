# Doctor Flow Desloppify Backlog

Scan target: current `feat/nhan/doctor-examination-flow` branch.

Rules for this file:
- This is a cleanup backlog, not an implementation plan that has already been approved.
- Items are appended as the scan discovers them.
- No production code changes are made during the scan.
- Each item should say where it is, why it matters, what to change, and whether it is safe to fix now.

## Critical Issues

### C1. Patient representative API has no auth or ownership boundary [RESOLVED]

- Where:
  - `backend/service/clinical-emr-service/src/patient-representatives/patient-representatives.controller.ts`
  - `backend/service/gateway-service/src/config/services.config.ts`
- Why it matters:
  - The controller exposes create/list/detail/update for legal representatives without requiring `x-auth-user-id`, role, or patient/doctor ownership.
  - The gateway now proxies `/api/v1/patient-representatives`, but unlike `/api/v1/appointments`, this route is not currently in the gateway trusted-identity path. In production this could expose guardian PII and consent metadata across patients.
- Recommended change:
  - Add gateway identity injection/authorization for this route or move it under a protected clinical route group.
  - Pass actor id/role into the clinical controller and service.
  - Enforce allowed roles: assigned doctor, privileged clinical/admin staff, or the matching patient/guardian relationship once patient middleware exists.
  - Add denied-access tests for another doctor/patient.
- Safe to fix now:
  - Safe to add service/controller authorization tests now.
  - Full policy should align with the upcoming middleware work, so implementation should be coordinated with the auth/middleware pass.
- Cleanup pass result:
  - Gateway now requires trusted JWT identity for `/api/v1/patient-representatives`.
  - Clinical controller requires `x-auth-user-id` and passes actor role into service methods.
  - Service enforces matching patient access or clinical staff roles (`ADMIN`, `RECEPTIONIST`, `NURSE`, `DOCTOR`).
  - Added controller/service/gateway tests for required actor, allowed clinical access, matching patient access, and denied patient mismatch.

### C2. Reminder read/responded/log endpoints bypass appointment ownership checks [RESOLVED]

- Where:
  - `backend/service/clinical-emr-service/src/appointments/appointments.controller.ts`
  - `backend/service/clinical-emr-service/src/appointments/appointments.service.ts`
- Why it matters:
  - `sendReminder`, `retryReminder`, and `setReminderPreferenceForAppointment` call `getExistingAppointment(id, actorUserId, actorRole)`.
  - `markReminderRead`, `markReminderResponded`, and `findNotificationLogs` do not take actor headers and directly operate on logs by `appointment_id`.
  - Any authenticated caller routed through gateway appointment auth could potentially read or mutate notification log state for another appointment.
- Recommended change:
  - Make controller methods require `x-auth-user-id` and `x-auth-role`, matching the other notification methods.
  - In service, load the appointment through `getExistingAppointment(id, actorUserId, actorRole)` before log lookup/mutation.
  - Add tests for assigned doctor allowed and unrelated doctor/patient denied.
- Safe to fix now:
  - Safe and should be fixed before enabling stricter middleware or demoing multi-user access.
- Cleanup pass result:
  - Fixed controller routes to require `x-auth-user-id`.
  - Fixed service methods to load appointments through ownership checks before log read/mutation.
  - Added controller/service tests for delegated actor headers and denied patient access.

### C3. Frontend route guard is globally disabled

- Where:
  - `frontend/web/src/middleware.ts`
- Why it matters:
  - `DISABLE_AUTH_GUARD = true` means all frontend pages are reachable without route-level protection.
  - This was useful for happy-case testing, but it can hide role boundary regressions in Doctor/Admin/Patient navigation and makes manual QA less representative of production.
- Recommended change:
  - Re-enable middleware guard behind an environment variable, for example `NEXT_PUBLIC_DISABLE_AUTH_GUARD`.
  - Default the guard to enabled outside local demo.
  - Add a small route-protection smoke checklist for Doctor pages.
- Safe to fix now:
  - Should wait until the team is ready to add middleware back, but track as critical before final demo/release.

### C4. Legal representative verification can be self-attested by payload [RESOLVED]

- Where:
  - `backend/service/clinical-emr-service/src/patient-representatives/dto/create-patient-representative.dto.ts`
  - `backend/service/clinical-emr-service/src/patient-representatives/dto/update-patient-representative.dto.ts`
  - `backend/service/clinical-emr-service/src/patient-representatives/patient-representatives.service.ts`
  - `frontend/web/src/features/examination/components/EncounterLegalReminderPanel.tsx`
- Why it matters:
  - `verified_by` is accepted directly from the request body.
  - The service sets `verified_at` whenever `verified_by` exists.
  - The UI sends `verified_by: actorId || null` when saving a representative, so creation and verification are effectively one action with no separate review/audit transition.
  - For legal consent, "recorded representative" and "verified representative" should be distinct states.
- Recommended change:
  - Remove `verified_by` from create/update body for ordinary representative edits.
  - Add a dedicated `POST/PATCH /patient-representatives/:id/verify` action that derives verifier from trusted auth headers.
  - Store verifier role/source and optionally verification note/document metadata.
  - Update prescription/treatment plan consent checks to require the dedicated verified state.
- Safe to fix now:
  - Safe after C1 auth boundary is implemented; otherwise the verify endpoint would still trust weak identity.
- Cleanup pass result:
  - `verified_by` is no longer accepted through create/update DTOs or sent from the doctor UI save form.
  - Create/update now keep representatives unverified until a dedicated verify action is called.
  - Added `POST /patient-representatives/:id/verify`, deriving verifier from trusted actor headers.
  - Patient self-verification is rejected; clinical staff/doctor verification is allowed.
  - Doctor UI now exposes a verify button for unverified representatives.

### C5. Clinical migration registration spec is stale and fails [RESOLVED]

- Where:
  - `backend/service/clinical-emr-service/src/database/clinic-data-source.spec.ts`
  - `backend/service/clinical-emr-service/src/database/clinic-data-source.ts`
- Why it matters:
  - `clinic-data-source.ts` now registers 7 clinic migrations, including `AppointmentReminderTracking1730000000005`.
  - `clinic-data-source.spec.ts` still expects exactly 6 migrations.
  - Running `npm test -- clinic-data-source.spec.ts -- --runInBand` fails, so a broader clinical test/CI run will fail even though focused doctor tests pass.
- Recommended change:
  - Update the spec to expect 7 migrations or, better, assert that the specific expected migration classes are present and no `.spec` files are loaded.
  - Include `AppointmentReminderTracking1730000000005` in the expected list.
- Safe to fix now:
  - Safe and should be the first cleanup task because it is a verified failing test.
- Cleanup pass result:
  - Updated the spec to expect 7 clinic migrations.
  - Added an explicit assertion for `AppointmentReminderTracking1730000000005`.

## Medium Cleanup Items

### M1. Examination workspace page is becoming a God component

- Where:
  - `frontend/web/src/app/(pages)/examinations/[id]/page.tsx`
- Why it matters:
  - The page owns session loading, patient lookup, symptoms, diagnoses, treatment plans, prescriptions, prescription items, diagnostic orders, clinical orders, dental charts, follow-ups, amendments, and legal/reminder panels.
  - It defines local API response interfaces and dozens of mutations directly in the page.
  - This makes every doctor-flow change risky because unrelated clinical sections share state, styles, query keys, and invalidation helpers in one file.
- Recommended change:
  - Split by clinical domain into focused panels/hooks:
    - `useExaminationSession`
    - `useEncounterClinicalSections`
    - `SymptomsPanel`
    - `DiagnosesPanel`
    - `TreatmentPlansPanel`
    - `PrescriptionsPanel`
    - `OrdersPanel`
    - `DentalChartPanel`
    - `FollowUpPanel`
    - `AmendmentsPanel`
  - Move local interfaces into feature types or API adapter types.
  - Keep the page as orchestration/layout only.
- Safe to fix now:
  - Safe if done incrementally one panel at a time with existing tests preserved.
  - Do not combine with new backend behavior.

### M2. Doctor UI mixes API client calls with feature API adapters

- Where:
  - `frontend/web/src/app/(pages)/examinations/[id]/page.tsx`
  - `frontend/web/src/features/examination/api/examination.ts`
- Why it matters:
  - Some flows use `examinationApi`, while many others call `apiClient.get/post/patch/delete` directly from the page.
  - Payload mapping, response unwrapping, validation, and endpoint construction are split across page code and API adapters.
  - This increases the chance that backend contract fixes are applied in one flow but missed in another.
- Recommended change:
  - Move all examination workspace network calls behind `examinationApi`.
  - Add API unit tests for each adapter method before moving page calls.
  - Keep page mutations using adapter methods only.
- Safe to fix now:
  - Safe and high leverage, but should be done in small batches: symptoms/diagnoses first, then orders, then dental charts.

### M3. EncounterLegalReminderPanel is too large and owns two unrelated workflows

- Where:
  - `frontend/web/src/features/examination/components/EncounterLegalReminderPanel.tsx`
- Why it matters:
  - The component contains legal representative querying/form/editing, reminder preference form, reminder lifecycle buttons, log rendering, styling constants, validation, and formatting in one file.
  - Legal representative consent and recall reminders will likely evolve separately; keeping them coupled makes later changes harder.
- Recommended change:
  - Split into:
    - `LegalRepresentativePanel`
    - `LegalRepresentativeForm`
    - `RecallReminderPanel`
    - `ReminderLogList`
    - shared `encounterPanelStyles` or design-system utilities
  - Move `getRepresentativeFormBlocker` and `formatDateTime` to tested utilities.
- Safe to fix now:
  - Safe after C1/C2 are fixed, because auth shape may affect props and actions.

### M4. Reminder preference UI cannot load existing preference [RESOLVED]

- Where:
  - `frontend/web/src/features/examination/components/EncounterLegalReminderPanel.tsx`
  - `backend/service/clinical-emr-service/src/appointments/appointments.controller.ts`
  - `backend/service/clinical-emr-service/src/appointments/appointments.service.ts`
- Why it matters:
  - UI initializes reminder preference to enabled + 1 day every time.
  - Backend supports updating preference but does not expose a read endpoint scoped to the appointment/patient.
  - A doctor can unknowingly overwrite an existing patient preference without seeing current state.
- Recommended change:
  - Add `GET /appointments/:id/notifications/reminder-preference`.
  - Load current preference into the UI before rendering the form.
  - Add loading/dirty state so save only sends intentional changes.
- Safe to fix now:
  - Safe and useful after C2 ownership checks are applied.
- Cleanup pass result:
  - Added `GET /appointments/:id/notifications/reminder-preference`.
  - Added `examinationApi.getReminderPreference()`.
  - Hydrated the doctor reminder form from the backend preference before save.

### M5. Legal representative primary selection is not constrained [RESOLVED]

- Where:
  - `backend/service/clinical-emr-service/src/patient-representatives/patient-representatives.service.ts`
  - `backend/service/clinical-emr-service/src/patient-representatives/entities/patient-representative.entity.ts`
  - `backend/service/clinical-emr-service/src/database/migrations/1783000600000-CreatePatientRepresentatives.ts`
- Why it matters:
  - Multiple active representatives can be marked `is_primary = true` for the same patient.
  - `findAuthorizedRepresentative()` asks for `is_primary: true` and orders by `verified_at`/`created_at`, so the selected legal signer can become nondeterministic if multiple primaries exist.
- Recommended change:
  - Add service logic or a partial unique index so only one active primary representative exists per patient.
  - When a representative is made primary, demote other active primaries for the same patient inside a transaction.
  - Add tests for creating/updating a second primary representative.
- Safe to fix now:
  - Safe and recommended before real multi-representative test data grows.
- Cleanup pass result:
  - Creating a new active primary representative now demotes existing active primaries for the same patient.
  - Updating an active representative to primary now demotes other active primaries, excluding the updated representative.
  - Added service tests for create/update primary demotion.

### M6. Representative field validation is too loose for legal/PII data [RESOLVED]

- Where:
  - `backend/service/clinical-emr-service/src/patient-representatives/dto/create-patient-representative.dto.ts`
  - `backend/service/clinical-emr-service/src/patient-representatives/dto/update-patient-representative.dto.ts`
  - `frontend/web/src/features/examination/components/EncounterLegalReminderPanel.tsx`
- Why it matters:
  - Backend validates phone/email/legal document fields mostly as generic strings.
  - Frontend only checks name, relationship, phone, and at least one scope.
  - Invalid email, malformed phone, overly long strings, or empty document metadata can enter consent records and later become hard to reconcile.
- Recommended change:
  - Add `@IsEmail`, length limits, phone pattern, relationship enum/options, and document type enum if business rules are known.
  - Mirror the same validation in frontend form utilities with tests.
  - Keep document number optional only if the legal/business doc allows unverified representatives.
- Safe to fix now:
  - Safe, but relationship/document type choices should be confirmed with the team.
- Cleanup pass result:
  - Added DTO validation for representative email, phone format, string length limits, legal document type format, and legal document number format.
  - Added focused DTO tests for valid representative metadata and malformed PII/legal fields.

### M7. Stale reminder endpoint remains in appointment API [RESOLVED]

- Where:
  - `frontend/web/src/shared/api/endpoint.ts`
  - `frontend/web/src/features/appointment/api/appointment.api.ts`
- Why it matters:
  - `API_ENDPOINTS.REMINDER.SEND` points to `/appointments/reminders/send`.
  - Backend currently exposes reminder send as `/appointments/:id/notifications/reminder`.
  - New doctor/examination flow uses the correct endpoint, but older appointment API code can still call a route that no longer exists.
- Recommended change:
  - Remove `API_ENDPOINTS.REMINDER.SEND` if unused.
  - Update `appointmentApi.sendReminder` to accept `appointmentId` and use `API_ENDPOINTS.APPOINTMENT.SEND_REMINDER(id)`.
  - Add a frontend API unit test so this route cannot drift again.
- Safe to fix now:
  - Safe and small.
- Cleanup pass result:
  - Removed stale `API_ENDPOINTS.REMINDER.SEND`.
  - Updated `appointmentApi.sendReminder()` to use `APPOINTMENT.SEND_REMINDER(id)`.
  - Added a frontend API unit test for the appointment-scoped reminder route.

### M8. Doctor workspace still uses browser-native confirm/prompt flows

- Where:
  - `frontend/web/src/app/(pages)/examinations/[id]/page.tsx`
- Why it matters:
  - Finalize, delete, treatment acceptance, partial acceptance notes, decline reasons, prescription cancellation, and dental chart deletion still use `confirm()`/`prompt()`.
  - Native browser dialogs are hard to style, hard to validate, inconsistent with the inline workspace direction, and easy to bypass with accidental Enter/Escape behavior.
- Recommended change:
  - Replace high-risk dialogs with inline confirmation panels or existing app confirmation components.
  - Use structured forms for partial acceptance, decline reason, cancellation reason, and amendment reason.
  - Keep browser confirm only as a temporary fallback for low-risk deletes if needed.
- Safe to fix now:
  - Safe, but should be done one action group at a time to avoid regressions.

### M9. Clinical migrations are split across two sources with weak discoverability

- Where:
  - `backend/service/clinical-emr-service/src/database/migrations`
  - `backend/service/clinical-emr-service/src/database/clinic-migrations`
  - `backend/service/clinical-emr-service/package.json`
- Why it matters:
  - Doctor flow changes now span both medical migrations and clinic migrations.
  - Developers must remember `migration:run:all`; running only `migration:run` or only `migration:run:clinic` leaves the database partially updated.
  - `clinic-data-source.ts` manually imports each clinic migration, while normal migrations are glob-loaded. This asymmetry is easy to miss.
- Recommended change:
  - Document which data source owns which tables in `DESLOPPIFY` follow-up or service docs.
  - Add CI/preflight command that runs `migration:run:all` against a disposable DB.
  - Consider converging on one migration discovery pattern or a wrapper script that refuses partial migration in local demo setup.
- Safe to fix now:
  - Documentation/preflight is safe now.
  - Restructuring migration layout should wait until after current PR stabilizes.

### M10. Treatment-plan-only follow-up validation does not anchor doctor/clinic context [RESOLVED]

- Where:
  - `backend/service/clinical-emr-service/src/appointments/appointments.service.ts`
- Why it matters:
  - Follow-up creation linked to a session validates patient, doctor, and clinic against the session.
  - Follow-up creation linked only to a treatment plan validates patient and accepted status, but not the doctor/clinic from the treatment plan's originating session.
  - A valid accepted plan could be used to create a follow-up for the same patient with an unrelated doctor/clinic unless another scheduling rule catches it.
- Recommended change:
  - When `treatment_plan_id` is supplied, load its linked session if `session_id` exists.
  - Validate follow-up doctor/clinic against that session unless the business explicitly allows transfer-of-care.
  - If transfer is allowed, require an explicit transfer reason or reception/admin role.
- Safe to fix now:
  - Safe after writing focused appointment service tests for accepted-plan follow-ups with mismatched doctor/clinic.
- Cleanup pass result:
  - Treatment-plan-only follow-ups now load the originating examination session when present.
  - The service validates doctor/clinic/patient context against that session before accepting the follow-up link.
  - Added a rejection test for accepted treatment-plan follow-up with mismatched doctor context.

### M11. Appointment DTO still treats several UUID fields as plain strings [RESOLVED]

- Where:
  - `backend/service/clinical-emr-service/src/appointments/dto/create-appointment.dto.ts`
- Why it matters:
  - `patient_id`, `doctor_id`, `clinic_id`, `room_id`, `service_id`, `approved_by`, and `created_by` are validated as strings instead of UUIDs.
  - Follow-up fields recently added use `@IsUUID`, so validation behavior is inconsistent within the same DTO.
  - Bad IDs can travel deeper into service/database code and produce less useful errors.
- Recommended change:
  - Convert ID fields to `@IsUUID()` where they are UUIDs.
  - Add DTO validation tests for bad IDs.
  - Coordinate with any legacy client payloads before tightening validation.
- Safe to fix now:
  - Safe if current seed/demo data uses UUIDs; otherwise wait until appointment client payloads are audited.
- Cleanup pass result:
  - Converted appointment ID fields from string validation to UUID validation: `patient_id`, `doctor_id`, `clinic_id`, `room_id`, `service_id`, `approved_by`, and `created_by`.
  - Updated appointment DTO tests to use valid UUIDs and reject non-UUID actor/resource IDs.

### M12. Doctor identity assumes IAM account id equals clinical doctor id

- Where:
  - `backend/service/clinical-emr-service/src/appointments/appointments.service.ts`
  - `frontend/web/src/app/(pages)/examinations/[id]/page.tsx`
- Why it matters:
  - Appointment ownership checks compare `actorUserId` directly to `appointment.doctor_id`.
  - The examination page uses `currentUser?.userId ?? session?.doctor_id` as the acting id.
  - This works only if the IAM account UUID and clinical doctor UUID are intentionally the same. If the system later introduces doctor profiles mapped to accounts, doctor access will break or become over-permissive.
- Recommended change:
  - Define a clear identity contract: `account_id`, `doctor_profile_id`, and `patient_id`.
  - Have gateway or clinical service resolve doctor profile id from account id before ownership checks.
  - Update frontend to use a `currentDoctorId` selector/API instead of assuming `userId`.
- Safe to fix now:
  - Should wait for middleware/role work, but document the assumption before adding more role gates.

## Nice-To-Have Polish

### N1. Old examination components may now be unused or only type sources

- Where:
  - `frontend/web/src/features/examination/components/Diagnosisform.tsx`
  - `frontend/web/src/features/examination/components/ExaminationDetail.tsx`
  - `frontend/web/src/features/examination/components/Examinationsessionform.tsx`
  - `frontend/web/src/features/examination/components/Prescriptionform.tsx`
  - modal components under `frontend/web/src/features/examination/components/*Modal.tsx`
- Why it matters:
  - The current `/examinations/[id]` workspace renders most forms inline.
  - Several older components still use `alert()`/`confirm()` and older API assumptions.
  - Some modal files are imported only for TypeScript form value types, which keeps UI code around even when the component itself is no longer used.
- Recommended change:
  - Run an explicit usage audit.
  - Move form value interfaces into `features/examination/types` or `utils`.
  - Delete genuinely unused components after type migration and route smoke.
- Safe to fix now:
  - Safe after frontend type-check confirms no imports remain.

### N2. Hardcoded demo doctor constants remain in schedule feature

- Where:
  - `frontend/web/src/features/schedule/scheduleConstants.ts`
- Why it matters:
  - Doctor workspace has moved toward authenticated doctor context, but schedule constants still contain demo doctor ids/names.
  - This can confuse future tests or fallback UI when real IAM/doctor data exists.
- Recommended change:
  - Replace static doctor constants with API-driven doctor options or mark them clearly as seed-only fixtures.
  - Keep fixtures inside test/seed helpers, not shared runtime constants.
- Safe to fix now:
  - Safe if schedule pages already have an authenticated doctor fallback; otherwise wait for schedule role cleanup.

### N3. Product text still advertises paused AI features

- Where:
  - `frontend/web/src/app/layout.tsx`
  - landing/auth marketing components under `frontend/web/src/features/landing` and `frontend/web/src/features/auth`
- Why it matters:
  - AI and KYC are intentionally paused for the current doctor happy-case phase.
  - Public-facing text still emphasizes AI diagnostics, which can confuse demo expectations.
- Recommended change:
  - For this phase, adjust marketing copy to clinical workflow/secure records unless AI routes are re-enabled.
  - Alternatively hide AI copy behind a feature flag.
- Safe to fix now:
  - Nice-to-have; wait unless the demo includes landing/auth pages.

### N4. Reminder channel/status values are raw strings

- Where:
  - `backend/service/clinical-emr-service/src/appointments/dto/update-reminder-preference.dto.ts`
  - `backend/service/clinical-emr-service/src/appointments/entities/appointment-notification-log.entity.ts`
  - `backend/service/clinical-emr-service/src/appointments/entities/appointment-reminder-preference.entity.ts`
- Why it matters:
  - `channel` and notification log `status` are generic strings.
  - The current flow is APP-only, but future SMS/email/push/retry workers will be easier to break with typos or unsupported values.
- Recommended change:
  - Introduce enums for reminder channel and notification log status.
  - Validate DTO channel with `@IsEnum`.
  - Reuse the enum in frontend types and badges.
- Safe to fix now:
  - Nice-to-have; safe after reminder ownership and preference read endpoint are done.

## Scan Notes

- Created immediately before code review per prompt.
- Cleanup pass orientation: branch `feat/nhan/doctor-examination-flow`, remote `origin` = `git@github-work:LTPPPP/Smart-Medical-Intelligent-Ledger-for-E-health-S.M.I.L.E-.git`, git identity `hugebenevolence <nhantd.dev@gmail.com>`.
- Docker compose in this worktree had no running services during this cleanup pass.
