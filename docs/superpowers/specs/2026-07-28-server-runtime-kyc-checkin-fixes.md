# Server Runtime, Staff KYC, and Check-in Fixes

## Scope

- Make the IAM and Clinical EMR services start from the repository's native
  Docker Compose configuration without runtime overrides.
- Require KYC for staff roles only; patients are exempt.
- Hide KYC from the patient profile UI and avoid patient-side KYC API calls.
- Reject check-in for appointments scheduled after the current calendar date.

## Design

### Docker runtime

Both backend images use Bun, so their startup scripts will invoke Bun directly
for TypeORM migrations and application startup. IAM will use its migrator image
and provide the compiled `@auth/*` alias at runtime. TypeORM schema
synchronization will be disabled because migrations own schema changes.

### KYC policy

IAM is the source of truth for the policy:

- `PATIENT`: booking eligibility does not depend on phone verification or KYC.
- `ADMIN`, `MANAGER`, `DOCTOR`, `RECEPTIONIST`, `NURSE`: phone verification and
  verified KYC are required.
- Patient accounts cannot call the self-service KYC endpoints.

Clinical EMR will check the authenticated staff account when staff create an
appointment. Patient-created appointments will not call the KYC eligibility
service.

The profile UI will retain the existing visual system. It will omit the KYC tab,
section, history modal, and KYC queries for patient-only accounts.

### Check-in date

Check-in remains staff-only. After loading the appointment, the service compares
its date-only value with today's date-only value and returns a bad request for a
future appointment.

## Verification

- Focused IAM and appointment Jest tests, including new policy regressions.
- Frontend type-check, tests, and production build.
- Backend builds.
- Native Docker Compose rebuild/recreate without temporary overrides.
- Health and role-based API smoke tests.
