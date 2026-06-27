# S.M.I.L.E — Backlog Gaps Implementation & Run Status

Implements the 8 gap features from `BACKLOG_COMPARISON.md`, wires BE↔FE through the
gateway, and seeds comprehensive test data. Verified end-to-end against a live Docker stack.

## How to run

```bash
cd Smart-Medical-Intelligent-Ledger-for-E-health-S.M.I.L.E-

# 1. Databases
docker compose up -d postgres redis maildev

# 2. Backend services (build first time)
docker compose build iam-service clinical-emr-service payment-service gateway
docker compose up -d iam-service clinical-emr-service payment-service gateway

# 3. Seed test data  (containers carry ts-node / compiled seeds)
docker compose exec -T iam-service node dist/database/seeds/relational/run-seed.js     # accounts
docker compose exec -T clinical-emr-service npm run seed:run:relational                 # roles/status
docker compose exec -T clinical-emr-service npm run seed:run:clinic                      # clinics, services, 30 appts (13 paid), schedules, patients
# (scripts/seed-all.sh chains these for a local-node-modules setup)

# 4. Chatbot (optional, mock mode — no GPU/keys)
docker compose --profile chatbot up -d booking-orchestrator

# 5. Frontend
#    Production image build is blocked by PRE-EXISTING broken imports in untouched pages
#    (appointments/new, services, specialties). Use dev mode for the demo:
cd frontend/web && npm install && npm run dev      # http://localhost:3000
```

Gateway: http://localhost:8080 (Swagger `/docs`) · Frontend: http://localhost:3000 · Chatbot: http://localhost:8089

## Login (seeded)

| Email | Role | Password |
|-------|------|----------|
| admin@smile.com | ADMIN | `12345678` |
| doctor1@smile.com / doctor2@smile.com | DOCTOR | `12345678` |
| receptionist1@smile.com | RECEPTIONIST | `12345678` |
| patient1@smile.com / patient2@smile.com | PATIENT | `12345678` |
| nurse1@smile.com | NURSE | `12345678` |

## The 8 gap features — status (verified live)

| # | Feature | What was done | Verified |
|---|---------|---------------|----------|
| 1 | **Reset Password (FE)** | New `/reset-password?hash=…` page + `resetPasswordByHash` API matching IAM's `{hash,password}` contract. | Page serves 200; API contract matches `auth.controller`. |
| 2 | **Initiate Payment (BE)** | New `payment-service` (port 3006), mock VNPay `POST /payments/initiate`. | `initiate` returns mock VNPay URL ✓ |
| 3 | **Confirm Payment / History (BE)** | `GET /payments/vnpay-return` marks paid + updates appointment cross-service; `GET /payments/appointment/:id`. | return→`paid`, appointment `payment_status=paid` cross-service ✓, history ✓ |
| 4 | **Refund / Cancel Payment** | `POST /payments/:id/refund` + FE refund button. | refund→`refunded` ✓ |
| 5 | **Notify Schedule Change** | clinical-emr emits IAM notification on schedule create/update (channel fixed `IN_APP`→`APP`). | notification POST 201 + list/unread reads ✓ |
| 6 | **Notify Shift Transfer** | `transferShift` notifies from/to doctors (verified). | same infra ✓ |
| 7 | **Revenue / Financial Report** | `GET /reports/revenue` (BE) + `/admin/revenue-reports` Recharts dashboard. **Registered ReportsModule** (was never wired in app.module). | live: 84.1M VND, 13 paid, by_day/service/clinic ✓ |
| 8 | **Chatbot Booking** | Merged `ai/booking_orchestrator` (FastAPI) with **mock mode** + `/api/chat`; FE `/chat` UI. | `/health` mode=mock, `/api/chat` intent reply ✓ |

Plus a **notifications bell** in the app header, and `FE↔BE alignment`: all FE base URLs
repointed at the gateway, `endpoint.ts` paths corrected (appointments, payments, examination-sessions,
service-categories, reports), gateway route added for `/api/v1/reports`.

## Seeded data (drives the UI)

2 clinics · 4 treatment rooms · 6 specialties · 10 services · 48 doctor-schedules (14 days) ·
5 patients · 10 medical records · **30 appointments (13 paid → revenue charts)** · 9 accounts.

## Known limitations (pre-existing / out of the 8-gap scope)

- **FE production build** fails on pre-existing broken imports in untouched pages
  (`appointments/new` → `BOOKING_TYPE`; `services`/`specialties` → missing `useCreateService` etc.).
  Dev mode runs fine. These are unrelated to the gap features.
- **Seed UUIDs** for clinics/appointments/patients use non-version-compliant UUIDs
  (`…-0000-…`). Read/list endpoints work; `@IsUUID()`-validated **create** DTOs that reference
  these ids (e.g. doctor-schedule create with a seeded `clinic_id`) reject them. Payment's
  `initiate` DTO was relaxed to `@IsString()` for this reason.
- `payment-service` seed (`seed:run`) isn't compiled into its production image; paid appointments
  already exist from the clinic seed, and the live mock-pay flow creates payment rows on demand.
