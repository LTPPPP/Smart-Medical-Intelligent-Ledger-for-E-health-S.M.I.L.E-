# Overall System Architecture

## 1. Architecture Overview

S.M.I.L.E (Smart Medical Intelligent Ledger for E-health) adopts a **Microservices Architecture** with five distinct layers. Each layer has a clear responsibility, enabling independent development, deployment, and scaling of individual components.

| Layer | Responsibility | Technology |
|-------|---------------|------------|
| Presentation | User interface, client-side state | Next.js 15, React 19, Tailwind CSS, shadcn/ui, TanStack Query, Zustand |
| API Gateway | Routing, CORS, logging, Swagger aggregation | NestJS (Gateway Service) |
| Service | Business logic, data access, domain modules | NestJS, TypeORM |
| Intelligent | AI/ML inference for KYC and dental analysis | Python, PaddleOCR, YOLOv8, VietOCR, PyTorch |
| Data | Persistence, caching | PostgreSQL 16, Redis 7 |

## 2. Presentation Layer

The frontend is a **Next.js 15** web application using React 19 with the App Router pattern.

| Component | Technology | Purpose |
|-----------|-----------|---------|
| UI Framework | shadcn/ui + Tailwind CSS 4 | Responsive, accessible component library |
| State Management | Zustand | Client-side global state (auth, UI) |
| Server State | TanStack React Query | API caching, synchronization, pagination |
| Data Table | TanStack React Table | Sortable, filterable data grids |
| HTTP Client | Axios | REST API communication with interceptors |
| Internationalization | en / vi locales | Vietnamese and English language support |

The application is organized by feature modules: `auth`, `admin`, `clinic`, `examination`, and `landing`.

## 3. API Gateway Layer

The **Gateway Service** (port 3000) is the single entry point for all client requests. It acts as a reverse proxy, forwarding requests to downstream microservices.

| Feature | Description |
|---------|-------------|
| Reverse Proxy | Routes requests to IAM (3001), Clinical EMR (8082), Payment (3006) |
| CORS | Configurable allowed origins for cross-domain requests |
| Swagger Aggregation | Merges OpenAPI specs from all downstream services into a unified API documentation |
| Health Check | Monitors availability of all downstream services |
| Logging Interceptor | Logs all proxied requests and responses with timing |
| Exception Filter | Returns standardized error responses (502 Bad Gateway for unavailable services) |

## 4. Service Layer

The backend consists of three NestJS microservices, each owning its own domain and database schema.

### 4.1 IAM Service (Port 3001)

Handles identity, authentication, and access management.

| Module | Responsibility |
|--------|---------------|
| Auth | JWT-based login/register, token refresh, password reset |
| Auth Google | Google OAuth 2.0 social login |
| Accounts | Account CRUD, status management, locking |
| Users | User profile management, banning |
| Roles & Permissions | Role-Based Access Control (RBAC) with granular permissions |
| User Roles | User-role assignment and revocation |
| KYC Verifications | Identity document verification with AI-powered OCR |
| Notifications | In-app, email, and push notification management |
| Audit Logs | System-wide action logging for compliance |
| Mail | Transactional email via SMTP (Nodemailer) |
| OAuth Connections | Third-party OAuth provider linking |
| OTP Tokens | One-time password generation and validation |
| Refresh Tokens | Secure token rotation for session management |

**Databases**: `auth_service_db`, `account_service_db`

### 4.2 Clinical EMR Service (Port 8082)

Manages all clinical and Electronic Medical Record (EMR) workflows.

| Module | Responsibility |
|--------|---------------|
| Appointments | Booking, rescheduling, cancellation, status tracking |
| Medical Records | Patient visit records, versioning, export |
| Examination Sessions | Doctor examination workflow with vital signs |
| Diagnoses | ICD-coded diagnosis recording per session |
| Symptoms | Patient symptom documentation |
| Prescriptions | Medication prescriptions with line items |
| Clinical Orders | Lab and diagnostic test ordering |
| Lab Test Results | Laboratory result recording |
| Dental Charts | Tooth-by-tooth charting with surface conditions |
| Dental Images | DICOM/image upload with PACS integration |
| Image Annotations | Radiologist/dentist annotations on images |
| Image Categories | Classification taxonomy for dental images |
| PACS Sync Logs | Picture Archiving sync tracking |
| Patients | Patient demographics and registration |
| Clinics | Multi-clinic management |
| Services & Categories | Dental service catalog with pricing |
| Specialties | Medical specialty definitions |
| Doctor Schedules | Shift-based scheduling with room assignment |
| Doctor Leaves | Leave request and approval |
| Treatment Plans | Multi-visit treatment planning |
| Treatment History | Completed treatment logging |
| Treatment Rooms | Room availability management |
| Work Shifts | Configurable shift definitions |
| Diagnostic Orders | Radiology and lab order management |
| Record Exports | Medical record export (PDF, HL7) |

**Databases**: `core_clinic_service_db`, `core_medical_service_db`

### 4.3 Payment Service (Port 3006)

Processes financial transactions for appointment payments.

| Feature | Description |
|---------|-------------|
| VNPay Integration | Vietnamese payment gateway processing |
| Invoice Management | Invoice generation and tracking |
| Refund Processing | Payment reversal handling |

## 5. Intelligent Layer

Python-based AI/ML services for automated analysis.

### 5.1 KYC OCR Service

Automated identity document verification for patient/doctor onboarding.

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Card Detection | YOLOv8 | Detects and localizes ID card corners in uploaded images |
| Perspective Correction | OpenCV | Corrects skewed/rotated card images |
| Text Recognition | PaddleOCR + VietOCR | Extracts Vietnamese text fields (name, DOB, ID number) |
| Image Enhancement | OpenCV | Upscaling, denoising for better OCR accuracy |
| CCCD Parser | Custom | Parses Vietnamese Citizen Identity Card (CCCD) fields |
| Quality Check | Custom | Validates image quality (blur, resolution, lighting) |

### 5.2 AI Dental Analysis

Deep learning models for dental image analysis.

| Feature | Technology | Purpose |
|---------|-----------|---------|
| Tooth Segmentation | MobileNetV3 / PyTorch | Identifies individual teeth in panoramic X-rays |
| Pathology Detection | CNN | Detects cavities, fractures, periodontal disease |
| Cephalometric Landmarks | Custom Model | Predicts anatomical landmarks for orthodontic planning |

Communication is over HTTP from the Clinical EMR service.

## 6. Data Layer

### 6.1 PostgreSQL 16

Primary relational database with per-service schema isolation.

| Database | Service | Content |
|----------|---------|---------|
| auth_service_db | IAM | Accounts, OAuth, OTP, refresh tokens |
| account_service_db | IAM | Users, roles, permissions, notifications, audit logs, KYC |
| core_clinic_service_db | Clinical EMR | Clinics, services, schedules, rooms, specialties |
| core_medical_service_db | Clinical EMR | Appointments, records, sessions, prescriptions, images |
| payment_service_db | Payment | Payments, refunds |

Total: **49 tables** across 5 databases.

### 6.2 Redis 7

In-memory data store for high-speed operations.

| Use Case | Description |
|----------|-------------|
| Session Cache | JWT session data and refresh token lookup |
| OTP Storage | Time-limited OTP codes with TTL |
| Query Cache | Frequently accessed API response caching |
| Rate Limiting | Request throttling counters |

## 7. Infrastructure

| Component | Development | Production |
|-----------|-------------|------------|
| Orchestration | Docker Compose | Docker Swarm |
| CI/CD | GitHub Actions | GitHub Actions |
| Email Testing | MailDev (port 1080) | SMTP Provider |
| Networking | smile-network (bridge) | Overlay network |
| Storage Volumes | Local volumes | Persistent volumes |

## 8. Communication Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| Synchronous REST | Client-Gateway-Service | Patient books appointment via API |
| HTTP Proxy | Gateway to microservice | Gateway forwards `/api/v1/appointments` to Clinical EMR |
| WebSocket | Real-time notifications | In-app notification delivery to connected clients |
| SMTP | Email notifications | Appointment confirmation email via MailDev/SMTP |

## 9. Security Architecture

| Layer | Mechanism |
|-------|-----------|
| Authentication | JWT access + refresh token with rotation |
| Authorization | Role-Based Access Control (RBAC) with granular permissions |
| Social Login | Google OAuth 2.0 via ID token / access token verification |
| Identity Verification | AI-powered KYC with Vietnamese CCCD document OCR |
| Data at Rest | PostgreSQL encryption, bcrypt password hashing |
| Data in Transit | TLS/HTTPS across public boundaries |
| Audit | Comprehensive audit logging of all system actions |
