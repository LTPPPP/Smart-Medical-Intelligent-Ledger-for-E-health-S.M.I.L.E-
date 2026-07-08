# Phase 2 — Main Flow Trace 🔴 P0 (starts after Phase 1)

**Goal:** trace the P0 standard flow end-to-end against code:
`booking (no KYC gate) → confirmation + reminder → check-in → doctor worklist → start examination
(appointment_id + record_id) → clinical entries → sign/finalize → payment (Receptionist) → follow-up/recall`

**Source:** BUSINESS_FLOW_SOURCE.md Final §5 (flow tổng thể + state machines), §5.1–5.10,
§11.9 (P0 acceptance criteria — 8 items), §10 (P0 gaps).

## Planned tasks (expand into T2.x files when phase starts)

| ID | Task | Key checks | Status |
|----|------|-----------|--------|
| T2.1 | Appointment state machine vs spec | `REMINDED/WAITING/IN_SERVICE` exist? `COMPLETED` decoupled from payment? transition guards + history actor/time | ⬜ |
| T2.2 | Booking validation | slot vs work-shift/leave/room; no KYC gate anywhere in booking UI/API; minimal data only (PL-05 Đ3) | ⬜ |
| T2.3 | Reminder & recall flow | auto T-24h/T-2h scheduler exists? delivery log? reminder vs marketing separation; follow-up/recall creation | ⬜ |
| T2.4 | Check-in flow | receptionist-only actor; invalid-state check-in blocked; queue/room assignment | ⬜ |
| T2.5 | Appointment → Examination link | 🟢 pre-verified fields/routes exist — now verify **behavior**: start-exam requires `CHECKED_IN`, correct doctor, no duplicate active session, record_id auto-link, appointment → IN_PROGRESS/COMPLETED sync | ⬜ |
| T2.6 | Sign/finalize & amendment | `finalize` + `amendments` routes exist — verify: post-sign updates blocked (PATCH → 409), amendment requires reason, version increments (doc: `createVersion()` hardcoded `versionNumber = 1`), audit written | ⬜ |
| T2.7 | Payment & receipt (main-flow slice) | payment doesn't block clinical finalize; receipt fields; VNPay status transitions `pending→paid/failed/refunded` | ⬜ |
| T2.8 | Guardian (<18) in main flow | patient-representatives module wired into booking/check-in/consent? | ⬜ |

## P0 acceptance criteria to test verbatim (doc §11.9)

1. Doctor A doesn't see Doctor B's appointments/sessions
2. No start-exam unless appointment `CHECKED_IN`
3. Start-exam creates exactly one session per appointment (2nd call returns existing)
4. Session carries `appointment_id`, `record_id`, `patient_id`, `doctor_id`, `clinic_id`
5. Doctor can sign/finalize when minimum data present
6. Post-sign plain updates blocked; amendment path required
7. Appointment `IN_PROGRESS` on start, `COMPLETED` on finalize
8. Audit log on view/start/sign/update/amend

## Findings → `FINDINGS.md` (create when phase starts)
