# Complete English Seed Data Design

**Date:** 2026-07-29
**Branch:** `feat/retest-main-flow`

## Goal

Create a deterministic, production-like local dataset for the main S.M.I.L.E
workflows. All business-facing values must be natural English and all records
must remain relationally consistent across IAM, Clinical EMR, and Payment.

The seeded database must not contain technical authorship labels or fixture
labels such as `codex`, `test`, `sample`, `mock`, `smoke`, `dummy`, or
`placeholder` in business-facing text, names, emails, codes, notes, or payment
references.

## Canonical Source

Service TypeScript seed runners are the single source of truth:

1. IAM auth accounts.
2. IAM user profiles, roles, and permissions.
3. Clinical clinic and medical data.
4. Payment records linked to Clinical appointments.

The reset workflow will recreate only the five named local service databases,
apply current migrations, run the canonical seeds in dependency order, and
restart the affected services. The old SQL inserts will no longer be used by
the reset workflow because they contain stale Vietnamese values and duplicate
application seed logic.

## Dataset

### IAM

- 60 active accounts:
  - 1 administrator
  - 2 clinic managers
  - 8 doctors
  - 4 receptionists
  - 5 nurses
  - 40 patients
- Matching user profiles and role assignments for every account.
- Complete role and permission mappings.
- Stable login accounts with deterministic IDs and the existing shared local
  password policy.
- Natural personal names and role-specific email addresses without fixture
  terminology.

### Clinic Operations

- 4 clinics in Ho Chi Minh City, Hanoi, Da Nang, and Can Tho.
- 24 treatment rooms distributed across examination, surgery, imaging, and
  consultation room types.
- 8 dental specialties.
- 5 service categories.
- 24 dental services with realistic English names, duration, room type, and VND
  pricing.
- Doctor-specialty and clinic-service mappings.
- Standard work shifts.
- Approximately 45 days of doctor schedules around the current date.
- 16 leave requests covering approved, pending, and rejected states.

### Patient and Medical Data

- 40 patient profiles linked one-to-one with IAM patient accounts.
- Complete contact, emergency contact, allergy, chronic condition, and
  insurance fields using synthetic but natural English values.
- 240 appointments distributed across the previous 120 days and next 45 days.
- A deterministic mix of scheduled, confirmed, completed, cancelled, and
  no-show outcomes.
- Completed visits receive coherent English complaints, diagnoses, treatment
  plans, clinical notes, and related medical records.
- Where the current schema supports them, examination sessions, symptoms,
  prescriptions, and treatment plan records are linked to the same patient,
  doctor, clinic, service, and appointment.

### Payments

- Payment records are created only for appointments that exist in Clinical.
- Statuses cover paid, pending, failed, refund requested, and refunded records
  where supported by the current schema.
- Amounts match the linked dental service price.
- Transaction references use normal VNPay-style business identifiers without
  fixture terminology.
- Revenue and performance dashboards receive enough historical data for daily,
  monthly, doctor, clinic, and service breakdowns.

### KYC

- Patients receive no KYC records and do not see KYC UI.
- Staff accounts are eligible to use the real KYC submission workflow.
- No citizen ID numbers, identity images, OCR payloads, or fabricated identity
  documents are inserted by the seed.

## Runtime and VNPay

The seed inserts linked payment history directly and never contacts VNPay.
Runtime payment mode is controlled by the ignored local `.env` file:
`VNPAY_MOCK=true` keeps the local simulated flow, while the exact value
`VNPAY_MOCK=false` enables signed sandbox requests when matching merchant
credentials are present.

No KYC image rebuild is required for this work.

## Reset and Load Flow

1. Confirm the Compose project and the five exact local database names.
2. Stop application services that hold database connections.
3. Drop and recreate only:
   - `auth_service_db`
   - `account_service_db`
   - `core_clinic_service_db`
   - `core_medical_service_db`
   - `payment_service_db`
4. Apply current IAM, Clinical, and Payment migrations.
5. Run seeds in cross-service dependency order.
6. Run the same seeds a second time to prove idempotency.
7. Restart IAM, Clinical, Payment, and Gateway.

## Verification

- Confirm all affected services build successfully.
- Confirm Compose configuration is valid and service health endpoints respond.
- Count every major seeded table and compare it with the expected dataset.
- Verify cross-database account, patient, appointment, service, and payment IDs.
- Verify payment amounts match service prices.
- Verify patients have no KYC records.
- Search business-facing database columns case-insensitively for every banned
  fixture term and require zero matches.
- Verify representative role logins and one authenticated read flow for each
  major role without exposing passwords, tokens, hashes, or identity data.
- Verify the second seed run does not increase deterministic row counts.

## Boundaries

- Local Docker databases only.
- No LangGraph or chatbot data.
- No real personal identity information.
- No generated screenshots, OCR artifacts, model weights, or secrets.
- No commit or push is performed unless separately requested.
