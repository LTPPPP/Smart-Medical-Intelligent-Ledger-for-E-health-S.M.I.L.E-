# Clinical Appointment Availability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Clinical EMR the canonical source for service-duration availability, buffered doctor/room/patient conflict checks, booking, and rescheduling.

**Architecture:** A pure scheduling policy calculates occupied intervals and candidate starts. A Clinical availability service loads service, schedule, shift, room, and appointment data; appointment commands reuse the same validator inside transactions, while PostgreSQL exclusion constraints protect races. Booking LangGraph consumes opaque Clinical options instead of generating slots locally.

**Tech Stack:** NestJS 11, TypeORM 0.3, PostgreSQL 16 range/GiST constraints, Jest, FastAPI/Python, httpx, pytest.

---

## File Map

- Create `backend/service/clinical-emr-service/src/utils/enums/room-type.enum.ts`: canonical room types.
- Create `backend/service/clinical-emr-service/src/appointments/scheduling-policy.ts`: pure interval and slot-grid rules.
- Create `backend/service/clinical-emr-service/src/appointments/scheduling-policy.spec.ts`: time-policy regression tests.
- Create `backend/service/clinical-emr-service/src/appointments/dto/query-appointment-availability.dto.ts`: validated availability query.
- Create `backend/service/clinical-emr-service/src/appointments/appointment-availability.service.ts`: repository-backed availability and command validation.
- Create `backend/service/clinical-emr-service/src/appointments/appointment-option-token.service.ts`: signed, expiring option tokens.
- Create `backend/service/clinical-emr-service/src/appointments/appointment-availability.service.spec.ts`: service configuration and conflict tests.
- Create `backend/service/clinical-emr-service/src/database/clinic-migrations/1730000000002-CanonicalAppointmentAvailability.ts`: room/service schema and exclusion constraints.
- Create `backend/service/clinical-emr-service/test/appointment-scheduling.e2e-spec.ts`: real PostgreSQL conflict and concurrency tests.
- Modify service/room/appointment entities and DTOs to use the canonical contract.
- Modify appointment module/controller/service so create, availability, and reschedule share validation.
- Modify `ai/booking_langgraph_service/src/http_tools.py` and payload tests to consume Clinical availability.
- Modify clinic seed to provide complete rolling demo schedules and service-room configuration.

### Task 1: Establish GitNexus Boundary And Pure Scheduling Policy

**Files:**
- Create: `backend/service/clinical-emr-service/src/appointments/scheduling-policy.ts`
- Create: `backend/service/clinical-emr-service/src/appointments/scheduling-policy.spec.ts`

- [ ] **Step 1: Record impact before changing symbols**

Run GitNexus impact/context for `AppointmentsService.create`, `AppointmentsService.update`, `AppointmentsService.createByDoctor`, `HttpDomainTools.find_booking_options`, `ServiceEntity`, and `TreatmentRoomEntity`. If symbol lookup fails, record the failure and use:

```powershell
rg -n "createByDoctor|find_booking_options|ServiceEntity|TreatmentRoomEntity" backend/service/clinical-emr-service/src ai/booking_langgraph_service/src
```

Expected: API-boundary risk is high; callers stay inside Clinical appointment controllers/services and booking AI.

- [ ] **Step 2: Write failing interval and slot tests**

Create tests asserting:

```ts
const interval = buildOccupiedInterval('2026-06-30', '09:00', 60);
expect(interval.start.toISOString()).toContain('2026-06-30T09:00:00');
expect(interval.careStart.toISOString()).toContain('2026-06-30T09:15:00');
expect(interval.end.toISOString()).toContain('2026-06-30T10:25:00');

expect(generateCandidateStarts('09:00', '12:00', 150)).toEqual(['09:00']);
expect(overlaps(
  buildOccupiedInterval('2026-06-30', '09:00', 60),
  buildOccupiedInterval('2026-06-30', '10:25', 30),
)).toBe(false);
```

Also assert a 150-minute service cannot start when its occupied end exceeds `12:00`, and slot starts advance by 15 minutes.

- [ ] **Step 3: Verify RED**

Run:

```powershell
npm test -- --runInBand src/appointments/scheduling-policy.spec.ts
```

Expected: FAIL because `scheduling-policy.ts` does not exist.

- [ ] **Step 4: Implement the minimal pure policy**

Export constants `ARRIVAL_GRACE_MINUTES = 15`, `DOCTOR_BREAK_MINUTES = 10`, `SLOT_STEP_MINUTES = 15`; implement `buildOccupiedInterval`, `generateCandidateStarts`, `containsInterval`, and half-open `overlaps`. Use explicit clinic-local date/time parsing and avoid `Date.parse` of locale-dependent strings.

- [ ] **Step 5: Verify GREEN and commit**

Run the targeted spec, then:

```powershell
git add backend/service/clinical-emr-service/src/appointments/scheduling-policy.ts backend/service/clinical-emr-service/src/appointments/scheduling-policy.spec.ts
git commit -m "feat(clinical): add appointment scheduling policy"
```

### Task 2: Normalize Room Types, Service Requirements, And Remove Capacity

**Files:**
- Create: `backend/service/clinical-emr-service/src/utils/enums/room-type.enum.ts`
- Create: `backend/service/clinical-emr-service/src/database/clinic-migrations/1730000000002-CanonicalAppointmentAvailability.ts`
- Modify: `backend/service/clinical-emr-service/src/services/entities/service.entity.ts`
- Modify: `backend/service/clinical-emr-service/src/services/dto/create-service.dto.ts`
- Modify: `backend/service/clinical-emr-service/src/treatment-rooms/entities/treatment-room.entity.ts`
- Modify: `backend/service/clinical-emr-service/src/treatment-rooms/dto/create-treatment-room.dto.ts`

- [ ] **Step 1: Write failing metadata tests**

Add DTO/entity-focused tests that require `required_room_type` on services, accept only `examination`, `surgery`, or `imaging`, reject arbitrary room type strings, and verify treatment-room DTO metadata no longer exposes `capacity`.

- [ ] **Step 2: Verify RED**

Run the new focused Jest specs. Expected: FAIL because `RoomType` and `required_room_type` do not exist and capacity is still present.

- [ ] **Step 3: Implement enum and model contract**

Define:

```ts
export enum RoomType {
  EXAMINATION = 'examination',
  SURGERY = 'surgery',
  IMAGING = 'imaging',
}
```

Use `@IsEnum(RoomType)` in DTOs. Add non-null `required_room_type` to `ServiceEntity`; make `TreatmentRoomEntity.room_type` non-null; remove `capacity` from entity and DTO.

- [ ] **Step 4: Implement forward migration**

The migration must create enum type `clinic_room_type`, normalize/backfill known room strings, and map `ORAL-CHECK`, `KHAM-TQ`, `TU-VAN`, `CAO-VR`, `TRAM-R`, `TAY-T`, `BOC-SU`, and `NIENG-R` to `examination`; `NHO-R` and `IMPLANT` to `surgery`; and `CHUP-XQ` to `imaging`. Abort when any unmapped service remains, convert room/service columns to the enum, and drop `treatment_rooms.capacity`. Do not edit migration `1700000000000`.

- [ ] **Step 5: Verify and commit**

Run focused specs and `npm run build`, then stage only the enum/entity/DTO/migration files and commit:

```powershell
git commit -m "feat(clinical): require service room configuration"
```

### Task 3: Add Canonical Database Conflict Constraints

**Files:**
- Modify: `backend/service/clinical-emr-service/src/database/clinic-migrations/1730000000002-CanonicalAppointmentAvailability.ts`
- Modify: `backend/service/clinical-emr-service/src/appointments/entities/appointment.entity.ts`
- Test: `backend/service/clinical-emr-service/src/appointments/appointments.service.spec.ts`

- [ ] **Step 1: Write failing migration assertions**

Assert generated migration SQL contains a canonical `occupied_during` `tsrange` ending at `duration_minutes + 25 minutes`, partial constraints for blocking statuses, and separate named exclusions for doctor, room, and patient.

- [ ] **Step 2: Verify RED**

Run the migration/appointment spec. Expected: FAIL because only doctor `during` exists.

- [ ] **Step 3: Implement constraints**

Drop the prior doctor constraint and `during` column, add generated `occupied_during`, then add:

```sql
EXCLUDE USING gist (doctor_id WITH =, occupied_during WITH &&)
EXCLUDE USING gist (room_id WITH =, occupied_during WITH &&)
EXCLUDE USING gist (patient_id WITH =, occupied_during WITH &&)
WHERE (status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress'))
```

Use distinct constraint names so application errors map to doctor, room, or patient conflicts.

- [ ] **Step 4: Verify and commit**

Run focused specs and build. Commit migration/entity changes as:

```powershell
git commit -m "feat(clinical): enforce buffered appointment conflicts"
```

### Task 4: Implement Clinical Availability API

**Files:**
- Create: `backend/service/clinical-emr-service/src/appointments/dto/query-appointment-availability.dto.ts`
- Create: `backend/service/clinical-emr-service/src/appointments/appointment-availability.service.ts`
- Create: `backend/service/clinical-emr-service/src/appointments/appointment-option-token.service.ts`
- Create: `backend/service/clinical-emr-service/src/appointments/appointment-availability.service.spec.ts`
- Modify: `backend/service/clinical-emr-service/src/appointments/appointments.module.ts`
- Modify: `backend/service/clinical-emr-service/src/appointments/appointments.controller.ts`

- [ ] **Step 1: Write failing availability tests**

Tests must prove: service duration is authoritative; date range is at most 31 days; past dates fail; schedules without rooms fail with `DOCTOR_SCHEDULE_ROOM_REQUIRED`; incompatible room type fails with `ROOM_TYPE_MISMATCH`; doctor, room, and patient appointments remove overlapping candidates; and a 150-minute service only returns fully-contained slots.

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm test -- --runInBand src/appointments/appointment-availability.service.spec.ts
```

Expected: FAIL because the service and DTO do not exist.

- [ ] **Step 3: Implement bounded repository queries**

Load one service, matching active doctor schedules with `shift` and `room`, and active appointments in `[date_from, date_to]`. Generate candidate starts through `scheduling-policy.ts`. Return grouped dates/doctors/rooms/slots. `AppointmentOptionTokenService` signs patient, service, doctor, clinic, room, date, and start-time claims with `JwtService`, `APPOINTMENT_OPTION_TOKEN_SECRET`, issuer `clinical-emr`, audience `appointment-option`, and a 10-minute expiry. The token is opaque to the UI, is never treated as authorization, and every claim is revalidated at commit.

- [ ] **Step 4: Add controller route**

Add `GET /api/v1/appointments/availability` before `/:id`, validate trusted patient ownership and query DTO, and return stable `404`, `409`, or `422` error codes from typed domain exceptions.

- [ ] **Step 5: Verify and commit**

Run availability and controller specs plus `npm run build`. Commit:

```powershell
git commit -m "feat(clinical): expose canonical appointment availability"
```

### Task 5: Reuse Validation For Booking And Reschedule

**Files:**
- Modify: `backend/service/clinical-emr-service/src/appointments/appointment-availability.service.ts`
- Modify: `backend/service/clinical-emr-service/src/appointments/appointments.service.ts`
- Modify: `backend/service/clinical-emr-service/src/appointments/appointments.controller.ts`
- Modify: booking/update DTOs under `backend/service/clinical-emr-service/src/appointments/dto/`
- Modify: `backend/service/clinical-emr-service/src/appointments/appointments.service.spec.ts`

- [ ] **Step 1: Write failing command tests**

Assert create and reschedule resolve one option token, overwrite client duration with service duration, reject changed patient/doctor/room/service fields, exclude the current appointment during reschedule, and map each named exclusion constraint to its stable conflict code.

- [ ] **Step 2: Verify RED**

Run appointment service specs. Expected failures: current create accepts duration and update bypasses scheduling validation.

- [ ] **Step 3: Implement one transactional validator**

Create `validateOptionForCommit(optionToken, actorUserId, excludeAppointmentId?)`. Within the same transaction reload option/service/schedule/room, re-run interval checks, query conflicts, persist service duration, and rely on GiST as the final race guard. Both create-by-doctor and reschedule delegate to this path.

- [ ] **Step 4: Verify and commit**

Run all appointment specs and Clinical build. Commit:

```powershell
git commit -m "fix(clinical): validate booking and reschedule atomically"
```

### Task 6: Prove PostgreSQL Conflict And Concurrency Behavior

**Files:**
- Create: `backend/service/clinical-emr-service/test/appointment-scheduling.e2e-spec.ts`
- Modify: `backend/service/clinical-emr-service/test/jest-e2e.json` only if the existing matcher excludes the file.

- [ ] **Step 1: Write PostgreSQL integration tests**

Seed isolated UUID rows and assert doctor overlap, room overlap, and patient overlap each reject; adjacent `[start,end)` intervals pass; cancelled appointments do not block; and `Promise.allSettled` for two same-slot commits yields exactly one fulfilled and one rejected result.

- [ ] **Step 2: Verify RED against local Docker PostgreSQL**

Run migrations and the focused e2e spec. Expected: tests fail before canonical constraints/transaction wiring are active.

- [ ] **Step 3: Fix only integration defects revealed by the tests**

Adjust constraint SQL or transaction boundaries without adding alternate scheduling logic.

- [ ] **Step 4: Verify and commit**

Run the focused e2e spec twice to detect data leakage, then commit:

```powershell
git commit -m "test(clinical): cover appointment scheduling races"
```

### Task 7: Replace AI Local Slot Calculation With Clinical Availability

**Files:**
- Modify: `ai/booking_langgraph_service/src/http_tools.py`
- Modify: `ai/booking_langgraph_service/src/tools.py`
- Modify: `ai/booking_langgraph_service/tests/test_real_payloads.py`
- Modify: `ai/booking_langgraph_service/tests/test_graph_core_flows.py`

- [ ] **Step 1: Write failing HTTP contract tests**

Assert `find_booking_options` calls `/api/v1/appointments/availability` with patient, service, date range, clinic/doctor filters; does not call `/doctor-schedules`; preserves `option_token`; and commit sends token without `duration_minutes` or a client-selected room.

- [ ] **Step 2: Verify RED**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_real_payloads.py -q
```

Expected: FAIL because `HttpDomainTools` still calculates slots locally.

- [ ] **Step 3: Implement the thin adapter**

Delete local business-window, overlap, and duration calculations from `HttpDomainTools`. Normalize Clinical grouped results into graph options, cache only token/display metadata, and map `SLOT_NO_LONGER_AVAILABLE` to a refreshable domain conflict.

- [ ] **Step 4: Verify and commit**

Run all booking LangGraph tests, then commit only AI adapter/test files:

```powershell
git commit -m "refactor(ai): consume clinical appointment availability"
```

### Task 8: Complete Rolling Demo Seed And End-To-End Verification

**Files:**
- Modify: `backend/service/clinical-emr-service/src/database/seeds/relational/clinic/run-clinic-seed.ts`
- Test: existing Clinical seed/build and booking API smoke scripts.

- [ ] **Step 1: Write failing seed assertions**

Extract or test seed builders so every service has a required room type, every demo schedule has a compatible room, doctor-specialty and clinic-service links exist, dates cover the next 14 days, and one service lasts 150 minutes.

- [ ] **Step 2: Verify RED**

Run the seed-focused spec. Expected: FAIL because schedules use fixed dates and service-room mappings are incomplete.

- [ ] **Step 3: Implement idempotent rolling seed**

Use dates derived from the seed run date, preserve deterministic UUIDs, create compatible rooms and associations, and omit `capacity`. Do not insert real identities or credentials.

- [ ] **Step 4: Run full verification**

Run:

```powershell
npm test -- --runInBand
npm run build
.\.venv\Scripts\python.exe -m pytest tests -q
npx gitnexus detect-changes --scope unstaged
git diff --check
git diff --stat
git status --short
```

Also run Clinical migrations/seed against the confirmed local Docker database, smoke availability, book, stale-option conflict, reschedule, and cancel routes without printing tokens or private data.

- [ ] **Step 5: Commit final seed and smoke adjustments**

Stage explicit seed/test paths and commit:

```powershell
git commit -m "test(booking): seed rolling appointment availability"
```

## Completion Review

- [ ] Confirm every spec acceptance criterion maps to a passing test from Tasks 1-8.
- [ ] Confirm no frontend, IAM, KYC, model, generated GitNexus, or unrelated dirty files are staged.
- [ ] Confirm Git author is `hugebenevolence <nhantd.dev@gmail.com>` and no commit contains a co-author trailer.
- [ ] Do not push unless the user explicitly requests it.
