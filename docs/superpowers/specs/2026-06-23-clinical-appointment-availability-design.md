# Clinical Appointment Availability Design

**Status:** Proposed for implementation

**Date:** 2026-06-23

## Objective

Make Clinical EMR the only source of truth for appointment availability and conflict validation. Booking, rescheduling, AI suggestions, and future frontend appointment screens must use the same service duration, clinic schedule, doctor schedule, room compatibility, patient conflict, and operational buffer rules.

## Scope

This change covers:

- Service-driven appointment duration.
- Required room type per service.
- One appointment per doctor, room, and patient during an occupied interval.
- A 15-minute arrival grace period followed by service time and a 10-minute doctor break.
- Server-generated availability.
- Shared create and reschedule validation.
- Transactional conflict protection and concurrent booking behavior.
- AI migration from local slot calculation to the Clinical availability API.
- Demo seed data required to exercise the production rules.
- Removal of the unused treatment-room `capacity` field.

This change does not redesign the chat UI, normal appointment frontend pages, notification delivery, payment workflows, or staff authorization roles.

## Business Rules

### Occupied Interval

An appointment's requested time is the beginning of the arrival grace period. The occupied interval is:

```text
occupied_start = appointment_date + appointment_time
care_start = occupied_start + 15 minutes
care_end = care_start + service.duration_minutes
occupied_end = care_end + 10 minutes
```

For a 60-minute service requested at `09:00`, the doctor, room, and patient are occupied from `09:00` through `10:25`. Intervals use half-open semantics `[start, end)`, so another appointment may begin at exactly `10:25`.

The entire occupied interval must fit inside one doctor work shift. It cannot cross the lunch closure between `12:00` and `13:30` or extend past the shift end.

### Duration Ownership

- `services.duration_minutes` is mandatory and must be positive.
- Booking and reschedule commands must include a `service_id`.
- Clinical EMR ignores client-supplied duration for normal booking and reschedule operations.
- The persisted appointment duration is copied from the selected service at commit time to preserve historical accuracy if the service definition later changes.

### Room Compatibility

- Treatment room types are normalized to `examination`, `surgery`, and `imaging`.
- Every bookable service must define one `required_room_type`.
- Every doctor schedule used for booking must reference one treatment room.
- The scheduled room must be active, belong to the selected clinic, and match the service's required room type.
- Missing or incompatible configuration is a domain configuration error. Clinical EMR returns no availability and refuses booking instead of falling back to an arbitrary room.
- Every room is exclusive: at most one active appointment can occupy a room at a time.

### Resource Conflicts

The following appointment statuses consume availability:

- `scheduled`
- `confirmed`
- `checked_in`
- `in_progress`

Cancelled, completed, and no-show appointments do not block future booking. A candidate interval is invalid when it overlaps an active appointment for any of these resources:

- The same doctor.
- The same treatment room.
- The same patient.

An appointment being rescheduled is excluded from its own conflict query.

### Slot Grid

- Candidate start times are generated every 15 minutes within each doctor work shift.
- A slot is returned only when its full occupied interval fits in the shift and all resource rules pass.
- Morning and afternoon shifts remain `09:00-12:00` and `13:30-17:30` in demo data.
- `doctor_schedules.max_patients` does not override interval conflicts. It remains schedule metadata until a separate daily quota requirement is approved.

## Data Model

### Services

Add a non-null `required_room_type` column using a PostgreSQL enum with values:

```text
examination
surgery
imaging
```

Existing rows are backfilled explicitly in the migration before the column becomes non-null. The seed assigns a valid room type to every demo service.

### Treatment Rooms

Convert `room_type` to the same enum and make it non-null after backfilling valid existing values. Remove `capacity` from the entity, create/update DTOs, schema, and database through a new forward migration. Historical migrations are not edited.

### Appointments

Replace the existing doctor-only generated range with a canonical generated `occupied_during` range based on:

```text
appointment start + 15 minutes + duration_minutes + 10 minutes
```

Add PostgreSQL GiST exclusion constraints for active appointments:

- `doctor_id` with `occupied_during` overlap.
- `room_id` with `occupied_during` overlap.
- `patient_id` with `occupied_during` overlap.

The constraints are partial and apply only to blocking statuses. `room_id` and `service_id` become required for normal booking paths. Outside-hours administrative booking remains out of this change unless it supplies the same required resources.

## Clinical API

### Availability Endpoint

Add:

```http
GET /api/v1/appointments/availability
```

Required query parameters:

- `patient_id`
- `service_id`
- `date_from`
- `date_to`

Optional query parameters:

- `clinic_id`
- `doctor_id`
- `time_of_day`: `morning` or `afternoon`

The date range is limited to 31 days. Past dates are rejected. The response groups slots for sequential selection without exposing internal IDs as user-facing labels:

```json
{
  "service": {
    "id": "uuid",
    "name": "Orthodontic consultation",
    "duration_minutes": 150,
    "required_room_type": "examination"
  },
  "dates": [
    {
      "date": "2026-06-30",
      "doctors": [
        {
          "doctor_id": "uuid",
          "room": {
            "room_id": "uuid",
            "room_name": "Examination Room 1"
          },
          "slots": [
            {
              "option_token": "opaque-signed-or-server-stored-token",
              "start_time": "09:00",
              "occupied_until": "11:55"
            }
          ]
        }
      ]
    }
  ]
}
```

`option_token` identifies the proposed service, patient, doctor, clinic, room, date, and start time. It is not authorization and does not reserve the slot. Commit always resolves and validates the option again.

### Booking Commit

Normal booking accepts the selected option token plus patient-owned appointment details such as `appointment_type`, `chief_complaint`, and `notes`. Clinical EMR resolves service duration and scheduling resources from the token and trusted records. It does not accept a client override for doctor, room, duration, or patient identity when an option token is used.

### Reschedule Commit

Reschedule accepts an appointment reference selected from the authenticated patient's appointments plus a new option token. It preserves non-scheduling fields and calls the same scheduling validator used by create. The current appointment is excluded from conflict evaluation.

### Error Contract

Clinical EMR returns stable domain error codes:

- `SERVICE_ROOM_TYPE_NOT_CONFIGURED`
- `DOCTOR_SCHEDULE_ROOM_REQUIRED`
- `ROOM_TYPE_MISMATCH`
- `OUTSIDE_DOCTOR_SHIFT`
- `SLOT_NO_LONGER_AVAILABLE`
- `DOCTOR_TIME_CONFLICT`
- `ROOM_TIME_CONFLICT`
- `PATIENT_TIME_CONFLICT`

Conflict responses use HTTP `409`. Invalid or missing domain configuration uses HTTP `422`. Missing resources use HTTP `404`.

## Internal Components

### Scheduling Policy

A focused scheduling policy module owns pure time calculations:

- Build occupied intervals.
- Generate 15-minute candidate starts.
- Check full containment inside a shift.
- Define blocking statuses and room type compatibility.

It does not access repositories.

### Availability Service

An application service loads the service, doctor schedules, shifts, rooms, and relevant appointments in bounded queries. It applies the scheduling policy and returns grouped availability DTOs.

### Appointment Command Validation

Create and reschedule use one validator inside a database transaction. It locks or otherwise serializes the relevant resource conflict check, then persists the appointment. PostgreSQL exclusion constraints remain the final race-condition guard. Constraint names map to stable domain error codes.

## AI Integration

`HttpDomainTools.find_booking_options` stops reading doctor schedules and calculating local slots. It calls the Clinical availability endpoint and converts returned option tokens into the existing graph-safe option shape.

AI behavior remains sequential:

1. Ask for service when missing.
2. Ask for date or date range when missing.
3. Optionally filter by clinic or doctor.
4. Present dates, then doctors, then available times in bounded groups.
5. Confirm one selected option.
6. Commit using the option token.

The AI never treats a displayed option as reserved and handles `SLOT_NO_LONGER_AVAILABLE` by refreshing availability.

## Demo Data

The Clinical seed becomes idempotent and creates:

- All normalized room types with exclusive rooms.
- A valid `required_room_type` for every demo service.
- Clinic-service associations for every service intended for demo booking.
- Doctor-specialty associations.
- Doctor schedules with explicit compatible rooms.
- Rolling work dates relative to seed execution, covering at least the next 14 days.
- Service durations that exercise short and long appointments, including a 150-minute service.

The seed does not create overlapping appointments. Existing synthetic appointments may be added only when clearly labelled and when they demonstrate unavailable slots.

## Concurrency And Transactions

Availability reads are advisory. At commit time Clinical EMR starts a transaction, reloads the service and schedule resources, verifies ownership and configuration, checks conflicts excluding the current appointment for reschedule, and inserts or updates the appointment. If two requests race for the same doctor, room, or patient interval, one transaction succeeds and the other receives a stable `409` conflict.

## Migration Safety

- Add new forward migrations; do not edit migrations that may already have run.
- Backfill and validate room types before enforcing enum/non-null constraints.
- Backfill service room requirements with an explicit mapping; abort migration if an unmapped service remains.
- Verify existing active appointments have service and room references before making normal scheduling paths strict.
- Replace old exclusion constraints in one migration transaction.
- Migration rollback restores prior columns and doctor-only exclusion behavior where PostgreSQL permits a lossless reversal.

## Testing Strategy

### Unit Tests

- Interval calculation for short and 150-minute services.
- Half-open boundary behavior.
- Shift containment and lunch break rejection.
- 15-minute slot generation.
- Room-type compatibility.
- Blocking and non-blocking statuses.
- Service duration overriding client duration.
- Reschedule excluding the current appointment.

### Clinical Service Tests

- Missing service room configuration returns `422`.
- Doctor schedule without room returns `422`.
- Incompatible room returns no availability and rejects commit.
- Doctor, room, and patient overlaps map to distinct conflicts.
- Create and reschedule use the same validator.
- Long services only appear where the full interval fits.

### PostgreSQL Integration Tests

- GiST constraints reject concurrent doctor overlap.
- GiST constraints reject concurrent room overlap.
- GiST constraints reject concurrent patient overlap.
- Adjacent half-open intervals are accepted.
- Cancelled appointments do not block.
- Two concurrent commits for one option produce one success and one conflict.

### AI Contract Tests

- Availability is sourced from Clinical EMR rather than locally generated.
- Returned option tokens survive selection and confirmation.
- A stale option conflict refreshes availability without reporting success.
- AI does not send client-defined duration or raw room selection.

## Acceptance Criteria

- A service cannot be booked without an explicit compatible room type and room-backed doctor schedule.
- Every normal appointment uses the service's configured duration.
- Grace and break buffers are included in all availability and conflict calculations.
- Doctor, room, and patient cannot be double-booked for overlapping occupied intervals.
- Booking and reschedule enforce identical scheduling rules.
- Concurrent requests cannot both commit the same constrained resources.
- AI displays only slots returned by Clinical EMR.
- Demo data supports service, date, doctor, slot, booking, reschedule, and cancel flows over a rolling future window.
- Treatment-room `capacity` is absent from runtime schema and contracts.

## Delivery Sequence

1. Add scheduling policy tests and implementation.
2. Add room type and service room requirement migrations and models.
3. Add canonical appointment interval and exclusion constraints.
4. Add Clinical availability query and grouped response.
5. Route create and reschedule through shared transactional validation.
6. Add PostgreSQL concurrency tests.
7. Replace AI local availability calculation with the Clinical API.
8. Update rolling demo seed data and run API smoke tests.
