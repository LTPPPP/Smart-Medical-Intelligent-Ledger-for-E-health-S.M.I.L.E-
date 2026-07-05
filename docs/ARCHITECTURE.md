# S.M.I.L.E Architecture Documentation

## 1. High-Level Architecture Overview

S.M.I.L.E is built upon a **Microservices Architecture** orchestrated via Docker Compose. The system integrates standard healthcare application components with advanced technologies like PyTorch (AI).

Communication between components happens through:
- **Synchronous HTTP/REST**: For client-to-gateway, gateway-to-service, and service-to-AI communication.

```mermaid
graph TB
    Client[Web / Mobile Clients] --> Gateway[API Gateway / Load Balancer]
    
    subgraph "Service Layer (NestJS / Spring Boot)"
        Gateway --> Auth[Auth Service]
        Gateway --> User[User Service]
        Gateway --> Clinic[Core Clinic Service]
        Gateway --> Appt[Medical Service]
        Gateway --> Notif[Notification Service]
        Gateway --> Pay[Payment Service]
    end
    
    subgraph "Intelligent Layer"
        Appt -->|HTTP - Image/Data| AI_Net[AI Service - MobileNetV3/PyTorch]
        AI_Net -->|Returns Analysis| Appt
    end
```

## 2. Component Deep Dive

### 2.1 API Gateway
- Routes all incoming requests to the appropriate microservices.
- Handles SSL termination, CORS, Rate Limiting, Request/Response Logging, and Centralized Exception Handling.
- Serves as the single entry point for all frontend applications.

### 2.2 Microservices
The backend follows the **Database-per-Service** pattern to maintain loose coupling:
1. **IAM Service (Phase 1 target)**: Consolidated identity domain that combines auth and user profile/RBAC capabilities.
2. **Clinical/EMR Service (Phase 1 target)**: Consolidated clinic and medical record domain for operational and clinical workflows.
3. **Notification Service**: Manages email, SMS, and push templates/deliveries.
4. **Payment Service**: Processes VNPay transactions, refunds, and manages invoices.

### 2.2.1 Consolidation Note (Phase 1)
- Runtime/process consolidation is preferred first.
- Data stores remain separated in Phase 1 to reduce migration risk:
  - `auth_service_db` and `account_service_db` for IAM
  - `core_clinic_service_db` and `core_medical_service_db` for Clinical/EMR
- API routes remain backward compatible through the gateway route mapping.

### 2.3 Intelligent Layer (AI Service)
- **Model**: Custom deep learning network (e.g., MobileNetV3-Large or HybridEncoder).
- **Function**: Simultaneous multi-objective analysis processing (Segmentation of teeth, pathology detection, cephalometric landmark prediction).
- **Communication**: Receives image data over HTTP from the Clinical/EMR service for inference.

## 3. Storage Strategy
- **PostgreSQL**: Primary relational datastore. Each service gets a dedicated logical database/schema (e.g., auth_db, clinic_db).
- **Redis**: Used for high-speed caching and temporary session data.

## 4. Security
- **Authentication**: JWT-based with Role-Based Access Control (RBAC).
- **Data Protection**: 
  - Rest: DB encryption and hashed credentials.
  - Transit: TLS across public boundaries.
- **Key Management**: HashiCorp Vault manages the cryptographic keys used for signing and data protection.
