# Booking Schedule Coverage Design

## Goal

Prevent staff booking from incorrectly reporting that a doctor has no schedule
when the matching doctor, clinic, and date schedule exists outside the first
page of the clinic schedule response. Extend the English demo schedule horizon
to support booking tests for the next 90 days.

## Current Problem

`BookingWizard` uses one clinic schedule query for two different jobs:

- deriving the doctors shown for a clinic; and
- locating the exact room and shift for the selected doctor and date.

The query is limited to 50 rows. A clinic already has more than 50 seeded
schedule rows, so an exact date can be absent from the response even though it
exists in PostgreSQL. Adding more seed rows alone would make this pagination
problem worse.

## Design

### Clinic doctor roster

Keep the existing clinic-level schedule query to derive the doctor choices.
It remains a lightweight roster source and does not decide whether a selected
date is valid.

### Exact schedule lookup

Add a second schedule query that is enabled only after clinic, doctor, and date
are selected. It sends all three filters to the existing schedule endpoint:

- `clinic_id`
- `doctor_id`
- `work_date`

`matchedDoctorSchedule` will read from this exact response. The selected room
and room type therefore come from the requested date instead of an arbitrary
page of clinic schedules.

Loading and request failures must not be presented as a valid no-schedule
result. Validation will block progression with the existing semantic feedback
until the lookup succeeds or the user chooses another date.

### Seed horizon

Extend the deterministic schedule loop from 30 to 90 days after the existing
anchor date. Preserve:

- eight doctors;
- each doctor's primary clinic and suitable room type;
- morning and afternoon shifts;
- Sunday exclusion;
- deterministic UUIDs and `ON CONFLICT` upserts.

No cross-clinic double-booking or unrealistic same-time schedules will be
introduced.

## Data Flow

1. User selects a clinic.
2. The clinic roster response supplies valid doctor choices.
3. User selects a doctor and date.
4. The exact schedule query fetches only that doctor-clinic-date combination.
5. Booking validation uses the returned room and shift.
6. The existing appointment API performs its authoritative schedule and
   overlap validation on submission.

## Verification

- A focused `BookingWizard` test proves a selected date succeeds even when it
  is absent from the clinic roster page but present in the exact-date response.
- A seed test proves the 90-day schedule horizon and deterministic output.
- Clinical EMR type/build checks pass.
- Run the clinical seed twice to prove idempotency.
- Verify schedule counts and the maximum work date in PostgreSQL.
- Run one authenticated staff booking preflight through the gateway.

## Out of Scope

- Changing doctor primary clinic assignments.
- Scheduling one doctor at multiple clinics during overlapping shifts.
- Replacing the schedule endpoint or increasing its global pagination limit.
- Changing patient availability-token behavior, which already uses the
  canonical availability endpoint.
