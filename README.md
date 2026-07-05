# S.M.I.L.E: Smart Medical Intelligent Ledger for E-health

![Status](https://img.shields.io/badge/Status-Production-green)
![Version](https://img.shields.io/badge/Version-1.0-blue)
![License](https://img.shields.io/badge/License-MIT-lightgrey)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen)

## Abstract
**S.M.I.L.E** (Smart Medical Intelligent Ledger for E-health) is a next-generation Dental Practice Management System (DPMS) that bridges the gap between traditional healthcare operations and modern digital technologies. Built as an audit-friendly electronic health records system with **Artificial Intelligence** for diagnostic assistance, S.M.I.L.E ensures data integrity, patient privacy, and operational excellence. It envisions a future where dental history is portable, secure, and verifiable, empowering both practitioners and patients.

---

## 📑 Table of Contents
1.  [System Requirement Specification (SRS)](#1-system-requirement-specification-srs)
    *   [1.1 Scope & Purpose](#11-scope--purpose)
    *   [1.2 User Personas](#12-user-personas)
    *   [1.3 Functional Requirements](#13-functional-requirements)
    *   [1.4 Non-Functional Requirements](#14-non-functional-requirements)
2.  [System Design Specification (SDS)](#2-system-design-specification-sds)
    *   [2.1 High-Level Architecture](#21-high-level-architecture)
    *   [2.2 Component Deep Dive](#22-component-deep-dive)
        *   [A. Specialized AI Core](#a-specialized-ai-core)
        *   [B. Payment Gateway Integration](#b-payment-gateway-integration)
    *   [2.3 Data Model Strategy](#23-data-model-strategy)
3.  [API Reference](#3-api-reference)
4.  [Getting Started](#4-getting-started)
5.  [Contribution Guidelines](#5-contribution-guidelines)
6.  [License](#6-license)

---

## 1. System Requirement Specification (SRS)

### 1.1 Scope & Purpose
The system is designed to manage the end-to-end workflow of a multi-clinic dental network. It replaces paper-based records with a secure digital ledger and automates administrative tasks.
*   **Primary Goal**: Safeguard patient data integrity with a secure, audit-friendly records system.
*   **Secondary Goal**: Assist dentists with AI-driven preliminary diagnosis.
*   **Tertiary Goal**: Optimize clinic scheduling and resource allocation.

### 1.2 User Personas
| Role | Access Level | Responsibilities |
| :--- | :--- | :--- |
| **Patient** | User | Book appointments, view medical history, managing consent, process payments. |
| **Dentist** | Staff | View schedules, perform examinations, write digital prescriptions, analyze X-rays with AI. |
| **Receptionist** | Staff | Check-in patients, manage schedule conflicts, handle billing. |
| **Administrator** | Admin | Manage clinics, services, staff accounts, and system configuration. |

### 1.3 Functional Requirements
*   **Identity**: Role-Based Access Control (RBAC) via JWT. Registration via Email or Google OAuth.
*   **Clinical**: Creation of Examination Sessions, Digital Prescriptions, and Treatment Plans.
*   **Financial**: Integration with **VNPay** for real-time payments and refunds.
*   **Intelligence**: Automated analysis of Panoramic/Cephalometric X-rays to detect pathologies.

---

## 2. System Design Specification (SDS)

### 2.1 High-Level Architecture
S.M.I.L.E utilizes a **Microservices Architecture** orchestrated by Docker Compose. Communication is synchronous (REST via the API Gateway) between clients and services.

```mermaid
graph TB
    Client[Web / Mobile Clients] --> Gateway[API Gateway / Load Balancer]
    
    subgraph "Service Layer (Spring Boot)"
        Gateway --> Auth[Account Service :8081]
        Gateway --> Patient[Patient Service :8084]
        Gateway --> Clinic[Clinic Service :8082]
        Gateway --> Appt[Appointment Service :8083]
        Gateway --> Exam[Examination Service :8087]
        Gateway --> Media[Dental Image Service :8088]
    end
    
    subgraph "Intelligent Layer"
        Media --> AI_Net[DentalMultiTaskNet (Python)]
        Appt --> NLP[Booking Orchestrator]
    end
```

### 2.2 Component Deep Dive

#### A. Specialized AI Core
The heart of the diagnostic system is the **`DentalMultiTaskNet`**, a custom PyTorch model designed for simultaneous multi-objective analysis.

*   **Architecture**:
    *   **Backbone**: `HybridEncoder` combining a lightweight CNN (for local features) with Transformer blocks (for global context).
    *   **Heads**:
        1.  **Segmentation Decoder**: Generates pixel-wise masks for teeth and jaw structures.
        2.  **Regression Head**: Predicts 19 cephalometric landmarks and 4 clinical angles (SNA, SNB, ANB, Gonial).
*   **Technique**: Uses uncertainty-based Multi-Task Learning (MTL) to dynamically weight losses between segmentation and regression during training.
*   **Performance**: Optimized for CPU inference (< 300ms for 512x512 images) with < 8M parameters.

#### B. Payment Gateway Integration
*   **Provider**: VNPay.
*   **Controller**: `VnPayController`.
*   **Security**:
    *   **IP Validation**: Captures client IP (`X-Forwarded-For`) to prevent replay attacks from different locations.
    *   **Checksum**: Validates `vnp_SecureHash` on all callbacks to ensure data hasn't been tampered with.
*   **Flow**:
    1.  User clicks "Pay" -> `createPaymentUrl` generates a signed VNPay link.
    2.  User pays on VNPay portal.
    3.  VNPay redirects browser to Frontend (`/return`).
    4.  VNPay server calls Backend (`/callback`) asynchronously to confirm transaction status.

### 2.3 Data Model Strategy
We use the **Database-per-Service** pattern.
*   **Account DB**: `users`, `roles`, `access_logs`.
*   **Clinic DB**: `clinics`, `treatment_rooms`, `equipment`.
*   **Appointment DB**: `appointments`, `payments` (linked to VNPay transaction IDs).
*   **Examination DB**: `examination_sessions`, `prescriptions`, `diagnoses`.

### 2.4 Consolidation Roadmap (Phase 1)
To reduce duplicated runtime boilerplate and cross-service chatter while preserving compatibility:

*   **IAM Service (active)**: consolidated runtime for legacy `auth-service` + `user-service`.
*   **Clinical/EMR Service (active)**: consolidated runtime for legacy `core-clinic-service` + `medical-service`.
*   **Keep separate**: `gateway-service`, `notification-service`, `payment-service`.
*   **Risk control**: keep existing databases separate in Phase 1 (`auth_service_db`, `account_service_db`, `core_clinic_service_db`, `core_medical_service_db`) and preserve existing gateway routes.

---

## 3. API Reference

| Service | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/account/auth/login` | Authenticate user & issue JWT |
| **Appointment** | `GET` | `/api/appointment/slots` | Get available time slots |
| **Payment** | `POST` | `/api/appointment/vnpay/create-payment` | Generate VNPay payment URL |
| **Payment** | `GET` | `/api/appointment/vnpay/callback` | IPN Callback from VNPay |
| **Clinical** | `POST` | `/api/examination/sessions` | specific Create new exam session |
| **AI** | `POST` | `/api/dental-image/analyze` | Submit X-ray for AI analysis |

---

## 4. Getting Started

### Prerequisites
*   **Docker Desktop** (with Kubernetes enabled recommended for prod)
*   **Java 17 JDK**
*   **Node.js 18+**

### Quick Start
1.  **Clone**: `git clone https://github.com/your-org/S.M.I.L.E.git`
2.  **Environment**: Copy `.env.example` to `.env` in each service folder.
3.  **Launch**:
    ```bash
    # Full infrastructure (DB, Redis, Services)
    docker-compose -f docker-compose.dev.yml up -d --build
    ```
4.  **Access**:
    *   Frontend: `http://localhost:3000`
    *   Gateway: `http://localhost:8080`
    *   Swagger (Appointment): `http://localhost:8083/swagger-ui.html`

---

## 5. Contribution Guidelines

### Workflow
1.  **Branching**: Use `feature/` or `fix/` prefixes.
2.  **Commits**: Follow **Conventional Commits** (e.g., `feat(ai): add transformer backbone`).
3.  **Testing**:
    *   **Backend**: Run `./mvnw test` (Junit 5).
    *   **AI**: Run `python -m pytest` in `ai/` directory.

### Standards
*   **Java**: Use Lombok for boilerplate. Always return DTOs, never Entities.
*   **Python**: Type hints are mandatory (`def forward(self, x: torch.Tensor) -> Dict:`).
*   **Frontend**: Use Tailwind utility classes; avoid inline styles.

---

## 6. License
This project is licensed under the **MIT License**.

---

## Seeding test data

Populate every database with realistic, idempotent demo data so all UI screens
(dashboards, schedules, patients, and the `/admin/revenue-reports` charts) render
with non-empty data. All seeds use fixed UUIDs + `ON CONFLICT` upserts, so they
are **safe to re-run**.

### 1. Bring up the databases

```bash
docker compose up -d postgres redis maildev
```

### 2. Run migrations + seeds

Each backend service has its own `node_modules` — install per service first
(`cd backend/service/<svc> && npm install`) if you have not already. Then from
the repo root:

```bash
bash scripts/seed-all.sh
```

This runs, in order:

1. **iam-service** — `migration:run` (+ `migration:run:user`) then
   `seed:run:relational` (+ `seed:run:user`) → 7 login accounts.
2. **clinical-emr-service** — `migration:run:all` then `seed:run:relational`,
   `seed:run:clinic` (+ `seed:run:document`) → clinics, treatment rooms,
   specialties, services, doctor schedules (next 14 days), patients, medical
   records, and **30 appointments** spread over the last 30 days + upcoming with
   a realistic mix of statuses and ~19 `paid` rows for the revenue report.
3. **payment-service** — `seed:run` (sample paid payments; placeholder
   appointment ids, warnings are expected and harmless).

### 3. Start services + frontend

Start the backend services and the frontend as usual (e.g.
`docker compose up -d` or per-service `npm run start:dev`, then the frontend
dev server).

### Seeded login accounts

All accounts share the password **`Password123!`**:

| Email | Role |
|-------|------|
| `admin@smile.com` | ADMIN |
| `doctor1@smile.com` | DOCTOR |
| `doctor2@smile.com` | DOCTOR |
| `receptionist1@smile.com` | RECEPTIONIST |
| `patient1@smile.com` | PATIENT |
| `patient2@smile.com` | PATIENT |
| `nurse1@smile.com` | NURSE |
