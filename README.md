# S.M.I.L.E: Smart Medical Intelligent Ledger for E-health

![Status](https://img.shields.io/badge/Status-Demo-yellow)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

## Abstract
**S.M.I.L.E** is a dental practice management system covering the core clinical and
administrative workflow of a multi-clinic dental network: patient booking, clinical
examination (diagnosis, treatment plans, e-prescriptions, orders), mock online payment,
and admin oversight (RBAC, refunds, audit logs, reports). This README describes the
**stack as actually implemented and runnable today** — see [Roadmap / Not Implemented](#7-roadmap--not-implemented)
for what's aspirational or out of scope for the current demo.

---

## 📑 Table of Contents
1. [Tech Stack](#1-tech-stack)
2. [Architecture](#2-architecture)
3. [Data Model](#3-data-model)
4. [Core Features (Implemented)](#4-core-features-implemented)
5. [Getting Started](#5-getting-started)
6. [Seeding Test Data](#6-seeding-test-data)
7. [Roadmap / Not Implemented](#7-roadmap--not-implemented)
8. [License](#8-license)

---

## 1. Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend runtime** | [Bun](https://bun.sh) (not Node/JVM) |
| **Backend framework** | [NestJS](https://nestjs.com) 11 (TypeScript) |
| **ORM / DB** | TypeORM 0.3 over **PostgreSQL** (database-per-service) |
| **Cache** | Redis |
| **Frontend** | [Next.js](https://nextjs.org) 15 (App Router, Turbopack), React 19, React Query, Zustand, Tailwind |
| **Email (dev)** | Nodemailer → [MailDev](https://github.com/maildev/maildev) (local SMTP capture, no real email in dev) |
| **Payment** | VNPay integration — **mock/sandbox only**, no real production VNPay account |
| **KYC identity check** | Standalone Python OCR service (`ai/kyc_ocr_service`, Gradio-based) — real, working, supporting feature |
| **Auth** | JWT (HS256), shared secret across services, role + granular permission matrix |

There is **no Spring Boot, no Java, no Kubernetes, and no PyTorch/ML diagnostic model**
anywhere in this codebase — those were aspirational claims in an earlier version of this
document that did not match the implementation.

## 2. Architecture

Four NestJS backend services + a Next.js frontend, all Bun-native:

```
frontend (Next.js, :3000)
   │
   ▼
gateway-service (:8080)  — reverse proxy, Redis-backed rate limiting, aggregated Swagger docs
   │
   ├── iam-service (:8081)          — accounts, auth, roles/permissions, KYC, notifications
   ├── clinical-emr-service (:8082) — clinics, schedules, appointments, examinations,
   │                                   prescriptions, treatment plans, dental images, reports
   └── payment-service (:3006)      — mock VNPay payments + refund workflow
```

Each service owns its own Postgres database (`auth_service_db`, `account_service_db`,
`core_clinic_service_db`, `core_medical_service_db`, `payment_service_db`) — no shared
schema, no cross-database foreign keys. Cross-service calls go through the gateway or
direct service-to-service HTTP with a signed system-actor JWT.

Two ways to run it:
- **Full Docker Compose** (`docker-compose.yml`) — every service, including Postgres/
  Redis/MailDev/pgAdmin, runs in containers.
- **Hybrid dev mode** — only Postgres/Redis/MailDev in Docker; the 4 backend services and
  the frontend run natively via `bun run start:dev` / `bun run dev` for faster iteration.
  See [Getting Started](#5-getting-started).

There is no message broker (RabbitMQ or otherwise) in this codebase — notifications are
sent via direct HTTP calls between services, not an async queue.

## 3. Data Model

Database-per-service, each with its own migrations under `database/<service>/`:
- **iam-service**: `accounts`, `roles`, `permissions`, `user_roles`, `access_logs`,
  `kyc_verifications`, `notifications`.
- **clinical-emr-service**: `clinics`, `treatment_rooms`, `specialties`, `services`,
  `doctor_schedules`, `doctor_leaves`, `patients`, `appointments`, `examination_sessions`,
  `diagnoses`, `treatment_plans`, `prescriptions` (+ `prescription_items`), `diagnostic_orders`,
  `clinical_orders`, `dental_images`.
- **payment-service**: `payments` (with refund fields — status, reason, requested/reviewed by).

## 4. Core Features (Implemented)

Verified working end-to-end against a running instance:

- **Patient**: registration, login, browse clinics/specialties/services, book an
  appointment (with DB-level double-booking prevention), pay via mock VNPay, view
  appointment/payment history, in-app notifications (including email via MailDev).
- **Doctor**: manage own work schedule and leave requests, view assigned appointments,
  run a clinical examination — record diagnoses, propose/accept a treatment plan, issue an
  e-prescription with per-item dosing, place diagnostic and clinical/lab orders, finalize
  the encounter.
- **Admin**: user and role management (with a real permission matrix), facility management
  (clinics, treatment rooms, specialties, services, work shifts, doctor schedules, leave
  approvals), refund approval queue (request → approve/reject → refunded), audit log with
  drill-down detail, revenue and doctor-performance reports.
- **KYC**: OCR-based identity document verification (real, supporting feature — not part
  of the core booking/clinical flow).

## 5. Getting Started

### Prerequisites
- [Bun](https://bun.sh) (backend + frontend runtime)
- Docker (for Postgres/Redis/MailDev)

### Hybrid dev mode (recommended for local development)

```bash
# 1. Bring up infra
docker compose -f docker-compose.yml up -d postgres redis maildev

# 2. Load schema + seed data (see "Seeding Test Data" below)

# 3. Start each backend service natively (separate terminals)
cd backend/service/iam-service && bun install && bun run start:dev            # :8081
cd backend/service/clinical-emr-service && bun install && bun run start:dev   # :8082
cd backend/service/payment-service && bun install && bun run start:dev       # :3006
cd backend/service/gateway-service && bun install && bun run start:dev       # :8080

# 4. Start the frontend
cd frontend/web && bun install && bun run dev                                 # :3000
```

Each backend service needs its own `.env` (gitignored) with a shared `AUTH_JWT_SECRET`
across all four services — cross-service JWT verification will fail otherwise. The
frontend needs no `.env`; it defaults to `http://localhost:8080/api/v1` for the gateway.

**Note:** `compose.yaml` (no dash) silently shadows `docker-compose.yml` for plain
`docker compose` invocations — pass `-f docker-compose.yml` explicitly.

### Access
- Frontend: `http://localhost:3000`
- Gateway (aggregated Swagger): `http://localhost:8080/docs`
- MailDev inbox: `http://localhost:1080`

## 6. Seeding Test Data

Seed SQL lives under `database/<service>/insert.sql`, loaded via the standard Postgres
`psql` tooling against each database (`auth_service_db`, `account_service_db`,
`core_clinic_service_db`, `core_medical_service_db`). All seed UUIDs are v4-compliant.

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

## 7. Roadmap / Not Implemented

Explicitly **not** part of this codebase or out of scope for the current demo:
- **AI diagnostic model** (X-ray/panoramic analysis, cephalometric landmarks) — no such
  model exists in this repo. Dental image upload/gallery/annotation is real, working
  metadata-only CRUD (no ML inference).
- **Booking chatbot** — a standalone service exists (`ai/booking_langgraph_service`) but
  is disabled/unwired in the current build; do not enable it for the demo.
- **Real production VNPay** — payment is a mock/sandbox flow only.
- **Blockchain / distributed ledger** — despite "Ledger" in the product name, there is no
  blockchain component; "ledger" refers to the audit-logged relational data model.
- **Scheduled reminder jobs (`@nestjs/schedule`)** — not present. (Rate limiting *is*
  implemented — a custom Redis-backed middleware in the gateway, not the `@nestjs/throttler`
  package.)
- **Digital signatures** — dropped from scope; the `digital_signatures` table/seed is
  disabled.

## 8. License
This project is licensed under the **MIT License**.
