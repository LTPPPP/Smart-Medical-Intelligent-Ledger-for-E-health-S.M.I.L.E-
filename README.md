# S.M.I.L.E: Smart Medical Intelligent Ledger for E-health

![Status](https://img.shields.io/badge/Status-Demo-yellow)
![License](https://img.shields.io/badge/License-MIT-lightgrey)
![Backend](https://img.shields.io/badge/Backend-NestJS%20%2B%20Bun-e0234e)
![Frontend](https://img.shields.io/badge/Frontend-Next.js%2015-black)

## Abstract

**S.M.I.L.E** is a dental practice management system covering the core clinical and
administrative workflow of a multi-clinic dental network: patient booking, clinical
examination (diagnosis, treatment plans, e-prescriptions, orders), mock online payment,
and admin oversight (RBAC, refunds, audit logs, reports). This README describes the
**stack, architecture, and features as actually implemented in this repository** — see
[Roadmap / Not Implemented](#9-roadmap--not-implemented) for what's aspirational or out
of scope for the current demo.

---

## 📑 Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Architecture](#2-architecture)
3. [Services](#3-services)
4. [Core Features](#4-core-features)
5. [Pros & Cons](#5-pros--cons)
6. [Data Model](#6-data-model)
7. [How to Run](#7-how-to-run)
8. [Database Migrations](#8-database-migrations)
9. [Roadmap / Not Implemented](#9-roadmap--not-implemented)
10. [Demo](#10-demo)
11. [License](#11-license)

---

## 1. Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend runtime** | [Bun](https://bun.sh) (not Node/JVM) |
| **Backend framework** | [NestJS](https://nestjs.com) 11 (TypeScript) |
| **ORM / DB** | TypeORM 0.3 over **PostgreSQL** (database-per-bounded-context, 5 logical DBs) |
| **Cache / idempotency** | Redis (per-service logical DB, e.g. payment idempotency on DB 4) |
| **Frontend** | [Next.js](https://nextjs.org) 15 (App Router, Turbopack), React 19, React Query, Zustand, Tailwind CSS |
| **Frontend tests** | [Vitest](https://vitest.dev) — 37 spec files |
| **Backend tests** | Jest (ts-jest) — 108 spec files across the 4 NestJS services |
| **Email (dev)** | Nodemailer → [MailDev](https://github.com/maildev/maildev) (local SMTP capture, no real email sent in dev) |
| **Payment** | VNPay integration — **mock/sandbox only**, falls back to a mock QR flow when no real sandbox credentials are configured |
| **KYC identity check** | Standalone Python OCR service (`ai/kyc_ocr_service`, Gradio-based) — real, working, with its own pytest suite (13 files) |
| **AI booking assistant** | LangGraph + FastAPI service (`ai/app`, package `smile-ai-booking-agent`) — real code, gateway-routed and frontend-wired, but needs its own OpenAI/NVIDIA LLM + Qdrant vector-store credentials and is **not** in `docker-compose.yml` (see [Services](#3-services)) |
| **Vector store** | [Qdrant](https://qdrant.tech) — used only by the AI booking assistant, for policy/document retrieval |
| **Auth** | JWT (HS256), one shared secret across all backend services, role + granular permission matrix |
| **Containerization** | Docker Compose (local dev) + Docker Swarm stack (`docker-stack.yml`, production-style deploy) |

There is **no Spring Boot, no Java, no Kubernetes, and no PyTorch/ML diagnostic model**
anywhere in this codebase, and despite "Ledger" in the product name there is **no
blockchain component** — "ledger" refers to the audit-logged relational data model.

## 2. Architecture

Four NestJS backend services (Bun runtime) + a Next.js frontend + two standalone Python
services, fronted by a single gateway:

```
frontend (Next.js, :3000)
   │  (browser calls the frontend's own /api/v1/* route handler,
   │   which server-side-proxies to the gateway via BACKEND_URL)
   ▼
gateway-service (:8080)  — reverse proxy, Redis-backed rate limiting, aggregated Swagger docs
   │
   ├── iam-service (:8081)              — accounts, auth, roles/permissions, KYC, notifications
   ├── clinical-emr-service (:8082)     — clinics, schedules, appointments, examinations,
   │                                       prescriptions, treatment plans, dental images, reports
   ├── payment-service (:3006)          — mock VNPay payments + refund workflow
   └── ai/app (:8030, FastAPI, optional) — booking chatbot (LangGraph) + document ingestion;
                                            routed at /api/v1/ai/booking-chat but NOT started
                                            by docker-compose.yml — run it separately if needed

kyc-ocr-service (Python/Gradio, :8010) — called directly by iam-service for ID OCR
```

Each **bounded context** owns its own Postgres database — not literally one DB per
service, but one per data domain (`auth_service_db`, `account_service_db` for IAM;
`core_clinic_service_db`, `core_medical_service_db` for Clinical EMR;
`payment_service_db` for Payment) — 5 logical databases total, no shared schema, no
cross-database foreign keys. Cross-service reads/writes go through the gateway (for
frontend traffic) or direct service-to-service HTTP with a signed system-actor JWT (for
backend-to-backend calls, e.g. payment-service checking appointment ownership against
clinical-emr-service).

There is **no message broker** (RabbitMQ or otherwise) — notifications and cross-service
status syncs are sent via direct, fire-and-forget HTTP calls between services, not an
async queue. That is a deliberate simplicity trade-off for this demo scope — see
[Pros & Cons](#5-pros--cons).

Two ways to run it:
- **Full Docker Compose** (`docker-compose.yml`) — every service, including Postgres/
  Redis/MailDev/pgAdmin, runs in containers.
- **Hybrid dev mode** — only Postgres/Redis/MailDev in Docker; the 4 backend services and
  the frontend run natively via `bun run start:dev` / `bun run dev` for faster iteration.
  See [How to Run](#7-how-to-run).

## 3. Services

| Service | Path | Port (native / Docker) | Responsibility | Owns DB(s) |
| :--- | :--- | :--- | :--- | :--- |
| **gateway-service** | `backend/service/gateway-service` | `8080` / `8088→8080` | Reverse proxy, Redis-backed rate limiting, aggregated Swagger UI at `/docs`, correlation IDs | — (no DB) |
| **iam-service** | `backend/service/iam-service` | `8081` / `8081` | Signup/login/logout, Google OAuth, password reset, roles & granular permissions, RBAC assignment, audit log, KYC submission/approval, account lock/ban, notifications | `auth_service_db`, `account_service_db` |
| **clinical-emr-service** | `backend/service/clinical-emr-service` | `8082` / `8082` | Clinics, treatment rooms, specialties, doctor schedules/leaves, patient profiles, appointments (by clinic/specialty/doctor), examinations, diagnoses, treatment plans, e-prescriptions, diagnostic/lab/clinical orders, dental images, reports & dashboards | `core_clinic_service_db`, `core_medical_service_db` |
| **payment-service** | `backend/service/payment-service` | `3006` / `3006` | Mock VNPay payment initiation (QR or redirect), VNPay return handling, refund request/approve/reject workflow, payment history | `payment_service_db` |
| **kyc-ocr-service** | `ai/kyc_ocr_service` | `8010` / `8010` | Standalone Python (Gradio) OCR service — extracts and validates ID document fields for KYC | — (stateless) |
| **ai/app** (booking agent, optional) | `ai/app` | `8030` (not in `docker-compose.yml`) | LangGraph-based booking chatbot + policy Q&A + document ingestion pipeline; gateway already routes `/api/v1/ai/booking-chat` to it, but it must be started manually and needs its own OpenAI/NVIDIA + Qdrant credentials — see [`ai/docs/booking-agent.md`](ai/docs/booking-agent.md) | — (uses clinical-emr/iam via HTTP + Qdrant) |
| **frontend** | `frontend/web` | `3000` / `3000` | Next.js App Router UI for all roles (patient, doctor, receptionist, admin) | — (calls its own `/api/v1/*` proxy route, which forwards to the gateway) |

## 4. Core Features

Grouped by role, verified against the actual controllers/use-cases and their test
coverage in this repository:

- **Patient**: sign up / log in (incl. Google OAuth), reset/forgot password, view/update
  profile, KYC identity verification, browse clinics/specialties, book an appointment
  at a facility / by specialty / by doctor (with DB-level double-booking prevention),
  pay via mock VNPay (QR or sandbox redirect), view payment history, request a refund,
  view/cancel own appointments, chat with the booking assistant (only when `ai/app` is
  running separately — see [Services](#3-services)), in-app + email notifications (via
  MailDev in dev).
- **Doctor**: manage own work schedule (on-call schedule) and shift transfers, view
  personal/examination schedule, run a clinical examination — record symptoms and
  diagnoses, create/propose/edit a treatment plan, issue an e-prescription with
  per-item dosing, order X-ray/CBCT/lab/clinical tests, upload and annotate dental
  images, finalize the encounter, view own performance dashboard.
- **Receptionist**: create/edit/confirm/cancel appointments on behalf of patients,
  book outside normal working hours, send appointment confirmations/reminders, manage
  patient profiles, view clinic/treatment-room availability.
- **Admin**: user and role management with a real granular permission matrix (assign/
  revoke role, view/update role permissions), facility management (clinics, treatment
  rooms, specialties, services), lock/unlock (ban/unban) user accounts, refund approval
  queue (request → approve/reject → refunded), full audit log with drill-down detail,
  revenue/financial report, operational report (no-show/cancellation/completion rates),
  doctor-performance report, per-role dashboards.
- **KYC**: OCR-based identity document verification (phone-number-linked, real working
  supporting feature — not part of the core booking/clinical flow, but gates booking
  eligibility).

## 5. Pros & Cons

### ✅ Pros

- **Real database-per-bounded-context isolation** — 5 logical Postgres DBs, no shared
  schema, no cross-DB foreign keys; cross-service integrity is enforced at the
  application layer via signed system-actor JWTs, which keeps each service
  independently deployable.
- **Substantial automated test coverage** — 108 backend Jest spec files (unit + a few
  integration specs) across the 4 NestJS services, 37 frontend Vitest spec files, and a
  dedicated pytest suite (13 files) for the KYC OCR service. Coverage spans not just
  happy paths but ownership/ACL checks, idempotency, and finalized-record locking rules.
- **Real, working KYC OCR pipeline** — not a stub; it does real document parsing and
  field validation and gates booking eligibility.
- **Granular RBAC with full audit trail** — role + permission matrix (not just role
  checks), every privileged action logged to an audit log with drill-down detail.
- **Idempotency-safe payments** — payment initiation is protected by a Redis-backed
  idempotency key so retried requests never double-charge; VNPay return handling has a
  signature-verified, replay-guarded success path.
- **Mock-first design lets the core flow run without external dependencies** — booking →
  pay → treat can be demoed end-to-end with zero real bank, SMS, or email accounts
  (MailDev captures email locally, VNPay defaults to mock mode). The AI booking chatbot
  is the one exception — it needs real OpenAI/NVIDIA + Qdrant credentials (see below).
- **Fast local iteration** — Bun runtime for install/start, hybrid dev mode lets you run
  only infra in Docker and the services natively for quick reload cycles.
- **Docs generated from the schema, not hand-maintained** — `scripts/diagrams/` and the
  `diagrams-check` CI gate regenerate ERDs/screen-flow diagrams from the actual
  migrations and fail CI if they drift from the repo.

### ⚠️ Cons / Limitations

- **No real AI diagnostic model** — despite dental-image upload/gallery/annotation being
  fully working, there is no X-ray/panoramic analysis or cephalometric-landmark ML model
  behind it; it's metadata-only CRUD over uploaded images.
- **Payment is mock/sandbox only** — no real production VNPay merchant account; not
  production-payment-ready as-is.
- **No message broker** — cross-service notifications and status syncs are synchronous,
  fire-and-forget HTTP calls. If the receiving service is down, the call is logged as a
  warning and silently dropped rather than retried or queued.
- **No scheduled/cron reminder jobs** — `@nestjs/schedule` is not wired in, so appointment
  reminders must be triggered by an explicit API call rather than firing automatically on
  a timer. (Rate limiting *is* implemented — a custom Redis-backed gateway middleware, not
  `@nestjs/throttler`.)
- **Digital signatures were removed from scope** — the `digital_signatures` table, the
  `prescriptions.digital_signature_id` column, and all related code/UI have been dropped;
  e-prescriptions are not cryptographically signed.
- **Single shared JWT secret across all backend services** — simple to run locally, but
  it means a leaked `AUTH_JWT_SECRET` compromises inter-service trust everywhere at once.
- **No Kubernetes manifests** — only Docker Compose (dev) and a Docker Swarm stack file
  (`docker-stack.yml`) are provided; deploying to a k8s cluster would require writing
  new manifests.
- **AI booking chatbot needs real third-party credentials and isn't containerized** —
  `ai/app` requires live OpenAI/NVIDIA LLM and Qdrant API keys, is absent from
  `docker-compose.yml`, and has zero automated test coverage (the frontend chat widget
  has UI-wiring tests, but the LangGraph graph/tools/router do not).

## 6. Data Model

Database-per-bounded-context, each with its own TypeORM migrations under
`backend/service/<service>/src/database/`:

| Database | Owning service | Main tables |
|---|---|---|
| `auth_service_db` | iam-service | accounts, refresh_tokens, otp_tokens, oauth_connections |
| `account_service_db` | iam-service | users, roles, permissions, user_roles, access_logs, kyc_verifications, notifications |
| `core_clinic_service_db` | clinical-emr-service | clinics, treatment_rooms, specialties, doctor_schedules, doctor_leaves, appointments |
| `core_medical_service_db` | clinical-emr-service | patients, examination_sessions, diagnoses, symptoms, treatment_plans, treatment_history, prescriptions (+ items), diagnostic_orders, clinical_orders, dental_images, medical_records |
| `payment_service_db` | payment-service | payments (with refund fields — status, reason, requested/reviewed by) |

Full entity-relationship detail (all columns, FKs, and a cross-database logical-FK
diagram) lives in [`docs/architecture/erd.md`](docs/architecture/erd.md).

## 7. How to Run

### Prerequisites

- [Bun](https://bun.sh) (backend + frontend runtime)
- Docker (for Postgres/Redis/MailDev, or for the full stack)
- Python 3.11+ (only if running `ai/app` or `ai/kyc_ocr_service` natively — see their
  `pyproject.toml` / `requirements.txt`)

### Option A — Full Docker Compose

```bash
# everything: infra + all 4 backend services + kyc-ocr-service
docker compose up -d

# + frontend (separate profile)
docker compose --profile frontend up -d

# or use the Makefile shortcuts
make up          # infra + backend services
make all          # + frontend
make monitoring   # + pgAdmin / RedisInsight
make logs         # tail everything
make health       # container status
```

### Option B — Hybrid dev mode (recommended for local development)

```bash
# 1. Bring up infra only
docker compose -f docker-compose.yml up -d postgres redis maildev
# (equivalent: make db)

# 2. Run migrations + seed data (see "Database Migrations" below)

# 3. Start each backend service natively (separate terminals)
cd backend/service/iam-service && bun install && bun run start:dev            # :8081
cd backend/service/clinical-emr-service && bun install && bun run start:dev   # :8082
cd backend/service/payment-service && bun install && bun run start:dev        # :3006
cd backend/service/gateway-service && bun install && bun run start:dev        # :8080

# 4. Start the frontend
cd frontend/web && bun install && bun run dev                                 # :3000
```

Each backend service needs its own `.env` (gitignored, see `.env.example` at repo root
for the full variable list) with a shared `AUTH_JWT_SECRET` across all four services —
cross-service JWT verification will fail otherwise. The **frontend also needs a `.env`**
(see `frontend/web/.env.example`) with `BACKEND_URL` pointing at the gateway (e.g.
`http://localhost:8080` in hybrid mode, `http://gateway:8080` in Docker Compose) — the
browser always calls the frontend's own `/api/v1/*` route handler
(`src/app/api/v1/[...path]/route.ts`), which server-side-proxies to `BACKEND_URL`; there
is no client-side default, so a missing `BACKEND_URL` makes every API call fail with a
500.

**Note:** the production deploy file is `docker-stack.yml` (Docker Swarm); plain
`docker compose` commands use `docker-compose.yml` (the local dev stack) by default.

### Running tests

```bash
# per backend service (Jest)
cd backend/service/<service-name> && bun run test

# frontend (Vitest)
cd frontend/web && bun run test

# KYC OCR service (pytest)
cd ai/kyc_ocr_service && pip install -r requirements-dev.txt && pytest
```

### Access once running

- Frontend: `http://localhost:3000`
- Gateway (aggregated Swagger): `http://localhost:8080/docs`
- MailDev inbox: `http://localhost:1080`
- pgAdmin (if using `make monitoring`): `http://localhost:5050`

## 8. Database Migrations

Each backend service manages its own migrations independently via TypeORM's CLI
(`npm run typeorm --`, works the same under Bun). Run these **after** infra is up and
**before** starting a service for the first time.

```bash
# iam-service — two data sources: default + user-service
cd backend/service/iam-service
bun run migration:run             # auth_service_db
bun run migration:run:user        # account_service_db
bun run seed:run:relational       # seed auth_service_db
bun run seed:run:user             # seed account_service_db

# clinical-emr-service — two data sources: default + clinic
cd backend/service/clinical-emr-service
bun run migration:run:all         # runs default (core_medical_service_db)
                                   # then clinic (core_clinic_service_db)

# payment-service — single data source
cd backend/service/payment-service
bun run migration:run             # payment_service_db
bun run seed:run                  # optional seed data
```

Useful variants (per service, same naming convention everywhere):

| Command | Effect |
| :--- | :--- |
| `migration:generate` | Diff entities vs. DB, write a new migration file |
| `migration:create` | Scaffold an empty migration file |
| `migration:run` | Apply pending migrations |
| `migration:revert` | Roll back the last applied migration |
| `schema:drop` | ⚠️ Drop the entire schema — destructive, dev only |

Seed SQL/TS lives under `database/<service>/insert.sql` and
`src/database/seeds/relational/` per backend service. All seed UUIDs are v4-compliant.

To reset everything from scratch: `make db-reset` (⚠️ destroys all container volumes),
then re-run migrations and seeds above.

### Seeded login accounts

All accounts share the password **`Password123!`**:

| Email | Role |
|-------|------|
| `admin@smile.com` | ADMIN |
| `dr.nguyenvana@smile.com` | DOCTOR |
| `dr.tranthib@smile.com` | DOCTOR |
| `recep.levan@smile.com` | RECEPTIONIST |
| `nguyenvana.pt@email.com` | PATIENT |
| `tranthib.pt@email.com` | PATIENT |

## 9. Roadmap / Not Implemented

Explicitly **not** part of this codebase or out of scope for the current demo:

- **AI diagnostic model** (X-ray/panoramic analysis, cephalometric landmarks) — no such
  model exists in this repo. Dental image upload/gallery/annotation is real, working
  metadata-only CRUD (no ML inference).
- **AI booking chatbot is code-complete but not part of the automated demo stack** — it
  is not started by `docker-compose.yml` and needs its own OpenAI/NVIDIA + Qdrant
  credentials to run; treat it as an optional, separately-run component.
- **Real production VNPay** — payment is a mock/sandbox flow only.
- **Blockchain / distributed ledger** — despite "Ledger" in the product name, there is no
  blockchain component; "ledger" refers to the audit-logged relational data model.
- **Scheduled reminder jobs (`@nestjs/schedule`)** — not present; reminders are sent on
  explicit API call, not on a timer. (Rate limiting *is* implemented — a custom
  Redis-backed middleware in the gateway, not the `@nestjs/throttler` package.)
- **Digital signatures** — dropped from scope; the `digital_signatures` table, the
  `prescriptions.digital_signature_id` column, and all related code/UI have been removed.
- **Kubernetes manifests** — only Docker Compose and a Docker Swarm stack are provided.

## 10. Demo

📹 **Demo video:** [Watch on Google Drive](https://drive.google.com/file/d/15THYsxpzw4V96NG4to_Cb8DDrgaQ63WF/view?usp=drive_link)

The demo walks through the full booking → clinical exam → payment → admin-oversight
loop using the [seeded accounts](#seeded-login-accounts) above. For a written walkthrough
of each flow (onboarding, booking, visit, payment, administration), see the flow
diagrams under [`docs/diagrams/`](docs/diagrams/DIAGRAMS.md).

## 11. License

This project is licensed under the **MIT License**.
