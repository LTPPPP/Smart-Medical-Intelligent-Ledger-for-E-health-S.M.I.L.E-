# API Test Suite

End-to-end API tests for the S.M.I.L.E platform: authentication, role-based access control per business role, the full booking-to-refund business flow, and security assertions.

## Running

```bash
docker compose -f docker-compose.yml --profile frontend up -d   # stack must be healthy
bash tests/api/api-test.sh
```

Overrides: `SMILE_API_BASE` (default `http://localhost:8080/api/v1`), `SMILE_SEED_PASSWORD` (default `Password123!`).

Exit code is 0 only when every functional test passes. Security findings are reported separately and do **not** fail the run — they describe endpoints whose protection is missing, for a human to triage.

Dependencies: `bash`, `curl`, `python3` (JSON parsing only). No packages to install.

The suite creates its own clinic, treatment room, patient, and user account with a run-specific suffix, and deletes them on exit. Seed data is never modified.

## Test accounts

All seeded accounts use password `Password123!`:
`admin@`, `manager1@`, `doctor1@`, `doctor2@`, `receptionist1@`, `patient1@`, `patient2@` — all `@smile.com`.

## Coverage

### Suite A — Authentication (9 cases)
Token issuance for all six roles, rejection of a wrong password, `/accounts/me` with and without a token.

### Suite B — RBAC matrix (~55 cases)

Each case asserts the effective `@Roles` of the controller it targets. Denials are as important as grants — a `403` that becomes a `200` is a privilege escalation.

| Module | Write roles asserted | Denied roles asserted |
|---|---|---|
| Clinics (`clinics.controller.ts`) | ADMIN, MANAGER | DOCTOR, RECEPTIONIST, PATIENT |
| Treatment rooms (`treatment-rooms.controller.ts`) | ADMIN, MANAGER | DOCTOR, PATIENT |
| Patients — create/update (`patients.controller.ts`) | ADMIN, MANAGER, RECEPTIONIST | DOCTOR, PATIENT |
| Patients — directory read | ADMIN, MANAGER, DOCTOR, RECEPTIONIST, NURSE | PATIENT |
| Patients — delete | ADMIN, MANAGER | RECEPTIONIST |
| Payments — initiate (`payments.controller.ts`) | ADMIN, MANAGER, RECEPTIONIST, PATIENT | DOCTOR |
| Payments — list & refund queue | ADMIN, MANAGER | DOCTOR, RECEPTIONIST, PATIENT |
| Medical records / history / examinations / dental images | ADMIN, MANAGER, DOCTOR (+NURSE on reads) | PATIENT, RECEPTIONIST |
| Specialties, service categories | ADMIN, MANAGER | DOCTOR, PATIENT |
| Services | ADMIN, MANAGER, RECEPTIONIST | PATIENT |
| Work shifts, doctor schedules, doctor leaves | ADMIN, MANAGER, DOCTOR, RECEPTIONIST | PATIENT |
| Reports — revenue | ADMIN, MANAGER | — |
| Reports — doctor performance | ADMIN, MANAGER, DOCTOR | PATIENT |
| IAM roles / permissions / audit logs | ADMIN | MANAGER, DOCTOR, RECEPTIONIST |
| Account lifecycle (lock/unlock) | ADMIN | DOCTOR |

### Suite C — Business flow (17 cases)

The real front-desk sequence, executed against records the suite creates itself:

1. Receptionist registers a patient, then books an appointment on their behalf (`POST /appointments`)
2. Appointment detail is readable
3. Receptionist confirms it (`PATCH /:id/confirm`)
4. The confirmation notification reaches the patient's inbox (`GET /notifications/user/:id`)
5. The status transition is recorded in the appointment history (`GET /:id/history`)
6. Receptionist checks the patient in (`PATCH /:id/check-in`)
7. Payment is initiated, returning a VNPay URL (`POST /payments/initiate`)
8. Replaying the VNPay return query settles the payment; status becomes `paid`
9. Refund requested → appears in the admin refund queue → approved by admin; receptionist is denied approval
10. A second appointment is created and cancelled (`PATCH /:id/cancel`)
11. **Ownership isolation**: a patient cannot read or book against another patient's record

### Suite D — Security assertions

These assert the protection each endpoint *should* have. A `FINDING` means the endpoint is currently reachable without proper authorization.

| Assertion | Current behaviour |
|---|---|
| `POST /notifications` requires auth | **201 without any token** — anyone can inject notifications for any user |
| `GET /notifications/user/:id` requires auth | **200 without any token** — anyone can read any user's notifications |
| `GET /notifications/user/:id/unread-count` requires auth | **200 without any token** |
| `GET /notification-templates` requires auth | **200 without any token** |
| `GET /user-profiles/:id` requires auth | **200 without any token** — PII exposure |
| `GET /kyc/users/:id/status` requires auth | 403 (guarded differently, not by JWT) |
| `GET /accounts/me` must not return credentials | **returns `passwordHash`** (bcrypt) in the response body |

Root cause of the notification findings: `iam-service/src/notifications/notifications.controller.ts` has no `@UseGuards` at class or method level — all 18 endpoints across notifications, notification-templates, and notification-preferences are public.

## Known defects surfaced by the suite

**Seeded ids are not valid UUIDs.** `clinics`, `patients`, `services`, and `appointments` were seeded with ids whose version nibble is `0` (e.g. `c0000000-0000-0000-0000-000000000001`), so they are not RFC-4122 UUIDs. `CreateAppointmentDto` validates `@IsUUID()`, so **no appointment can be booked against any seeded clinic or patient through the API** — a patient trying to book at either seeded clinic gets `422`. Seed rows exist only because the migrations insert them straight into Postgres, bypassing validation.

Fix options: reseed with real v4 UUIDs, or relax the DTO to `@IsUUID('all')` — note `'all'` still rejects a `0` version nibble, so reseeding is the real fix.

Case `C0` in the suite asserts the desired behaviour (a patient can self-book with seeded ids) and is reported as a finding until the data is fixed.
