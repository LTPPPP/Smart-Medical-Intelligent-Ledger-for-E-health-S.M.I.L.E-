# Schedule Coverage and Refund Dialog Implementation Plan

## Scope

Implement the approved booking schedule coverage and refund request dialog
designs without changing refund authorization, refund state transitions, or
KYC services.

## Task 1: Schedule seed horizon (RED → GREEN)

Files:

- Create `backend/service/clinical-emr-service/src/database/seeds/relational/clinic/clinic-seed-schedules.ts`
- Create `backend/service/clinical-emr-service/src/database/seeds/relational/clinic/clinic-seed-schedules.spec.ts`
- Modify `backend/service/clinical-emr-service/src/database/seeds/relational/clinic/run-clinic-seed.ts`

Steps:

1. Add a failing unit test for deterministic work dates from 14 days before the
   anchor through 90 days after it, excluding Sundays.
2. Add the smallest pure schedule-date helper that satisfies the test.
3. Replace the hard-coded seed loop bounds with the helper.
4. Run only the new seed test, then the Clinical EMR build.

## Task 2: Exact doctor-clinic-date lookup (RED → GREEN)

Files:

- Modify `frontend/web/src/features/appointment/components/BookingWizard.tsx`
- Modify `frontend/web/src/features/appointment/components/BookingWizard.test.tsx`

Steps:

1. Add a failing focused test for constructing and using an exact schedule
   lookup with `doctor_id`, `clinic_id`, and `work_date`.
2. Keep the clinic schedule response only for the doctor roster.
3. Add an exact-date query enabled after all three values are selected.
4. Derive `matchedDoctorSchedule` only from the exact response.
5. Distinguish loading/failure from a confirmed empty schedule result.
6. Run the focused BookingWizard test.

## Task 3: Shared refund request dialog (RED → GREEN)

Files:

- Create `frontend/web/src/features/appointment/components/RefundRequestDialog.tsx`
- Create `frontend/web/src/features/appointment/components/RefundRequestDialog.test.tsx`
- Modify `frontend/web/src/features/i18n/dictionaries/en/payments.json`
- Modify `frontend/web/src/features/i18n/dictionaries/vi/payments.json`

Steps:

1. Add failing tests proving cancel performs no mutation, invalid inputs do not
   submit, and valid confirmation submits trimmed reason plus amount once.
2. Build the dialog from existing Dialog, Button, Input/Textarea, ErrorMessage,
   currency formatting, and theme tokens.
3. Default amount to the full captured amount and require a reason.
4. Preserve inputs and show API errors while submission fails.
5. Lock closing and duplicate submission while pending.
6. Run only the dialog tests.

## Task 4: Wire both refund entry points (RED → GREEN)

Files:

- Modify `frontend/web/src/app/(pages)/appointments/[id]/page.tsx`
- Modify `frontend/web/src/app/(pages)/appointments/[id]/payment/callback/page.tsx`
- Modify `frontend/web/src/app/(pages)/appointments/[id]/payment/callback/page.test.tsx`
- Add or extend the focused appointment-detail payment test if an existing
  harness is available.

Steps:

1. Replace immediate refund mutations with `refundTarget` dialog state.
2. Pass the confirmed `{ amount, reason }` payload to the existing refund hook
   or mutation.
3. Refresh payment data and close only after success.
4. Keep current open-refund status/duplicate guards.
5. Run the two focused page test files.

## Task 5: Static verification

1. Run frontend type-check.
2. Run the focused frontend tests only.
3. Run the seed tests and Clinical EMR build.
4. Run `git diff --check`, inspect the targeted diff, and confirm no KYC files
   were touched by this batch.

## Task 6: Local runtime verification

1. Rebuild only Clinical EMR and frontend; do not rebuild KYC.
2. Run the clinical seed twice with the existing local environment.
3. Query PostgreSQL for schedule count, distinct doctors/clinics, and maximum
   work date.
4. Verify all affected containers and health endpoints.
5. Use demo accounts for one exact-date schedule API lookup and one paid-payment
   refund request flow; redact tokens and do not approve a refund unless a
   disposable seeded payment is selected.
6. Confirm recent core-service logs contain no new errors.
