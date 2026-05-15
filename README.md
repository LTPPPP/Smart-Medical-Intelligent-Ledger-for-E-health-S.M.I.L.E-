# S.M.I.L.E: Smart Medical Intelligent Ledger for E-health

![Status](https://img.shields.io/badge/Status-Production-green)
![Version](https://img.shields.io/badge/Version-1.0-blue)
![License](https://img.shields.io/badge/License-MIT-lightgrey)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen)

## Abstract
**S.M.I.L.E** (Smart Medical Intelligent Ledger for E-health) is a next-generation Dental Practice Management System (DPMS) that bridges the gap between traditional healthcare operations and modern decentralized technologies. By integrating **Hyperledger Fabric** for immutable medical records and **Artificial Intelligence** for diagnostic assistance, S.M.I.L.E ensures data integrity, patient privacy, and operational excellence. It envisions a future where dental history is portable, secure, and verifiable, empowering both practitioners and patients.

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
        *   [B. Blockchain Ledger & Identity](#b-blockchain-ledger--identity)
        *   [C. Payment Gateway Integration](#c-payment-gateway-integration)
    *   [2.3 Data Model Strategy](#23-data-model-strategy)
3.  [API Reference](#3-api-reference)
4.  [Getting Started](#4-getting-started)
5.  [Contribution Guidelines](#5-contribution-guidelines)
6.  [License](#6-license)

---

## 1. System Requirement Specification (SRS)

### 1.1 Scope & Purpose
The system is designed to manage the end-to-end workflow of a multi-clinic dental network. It replaces paper-based records with a secure digital ledger and automates administrative tasks.
*   **Primary Goal**: Safeguard patient data integrity using blockchain.
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
S.M.I.L.E utilizes a **Microservices Architecture** orchestrated by Docker Compose. Communication is primarily synchronous (REST/OpenFeign) for user requests and asynchronous (RabbitMQ) for background tasks.

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
    
    subgraph "Decentralized Layer"
        Exam -.-> MQ[RabbitMQ]
        MQ --> BC_Svc[Blockchain Service (Go)]
        BC_Svc --> Fabrics[Hyperledger Fabric]
        BC_Svc --> IPFS[IPFS Cluster]
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

#### B. Blockchain Ledger & Identity
*   **Controller**: `BlockchainController` (Java) acts as the bridge.
*   **Verification Flow**:
    1.  Client requests verification of a record via `/api/v1/blockchain/records/{id}/verify`.
    2.  Service validates the request using a system DID (`did:health:vn:system`).
    3.  Service queries the **Hyperledger Fabric** chaincode to retrieve the immutable hash.
    4.  The on-chain hash is compared against the off-chain Postgres data to prove integrity.
*   **Storage**: Large files (DICOM) are stored on **IPFS**, with only the Content ID (CID) stored in the database.

#### C. Payment Gateway Integration
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
*   **Keep separate**: `gateway-service`, `notification-service`, `payment-service`, `blockchain-service`.
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
| **Blockchain** | `GET` | `/api/v1/blockchain/records/{id}/verify` | Verify record integrity via ledger |
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
    # Full infrastructure (DB, Redis, RabbitMQ, Services)
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
