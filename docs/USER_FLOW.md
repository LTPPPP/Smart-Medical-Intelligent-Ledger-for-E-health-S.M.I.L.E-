# S.M.I.L.E User Flows

This document details the step-by-step user flows for the primary personas traversing the S.M.I.L.E platform.

## 1. User Personas

| Persona | Primary Goals |
| :--- | :--- |
| **Patient** | Book clinic appointments, view medical history & digital prescriptions, pay invoices securely, manage data consent. |
| **Dentist** | View daily schedule, process examination sessions, upload X-rays for AI analysis, create treatment plans, sign off records representing immutable truth. |
| **Receptionist** | Manage patient check-ins/check-outs, mediate scheduling conflicts, oversee clinic payment statuses. |
| **Administrator**| System configuration, staff account management, clinic data management, oversee system health and audit logs. |

---

## 2. Key User Flows

### 2.1 Patient Registration & Authentication Flow

```mermaid
sequenceDiagram
    actor Patient
    participant Frontend
    participant Gateway
    participant Auth_Service
    participant User_DB

    Patient->>Frontend: Clicks "Register" / Fills form
    Frontend->>Gateway: POST /api/auth/register
    Gateway->>Auth_Service: Route request
    Auth_Service->>Auth_Service: Validate Email/Password
    Auth_Service->>User_DB: Save User Data (Hash Pwd)
    User_DB-->>Auth_Service: Success
    Auth_Service-->>Gateway: Return JWT
    Gateway-->>Frontend: Return JWT + User Profile
    Frontend->>Patient: Show Dashboard
```

### 2.2 Appointment Booking Flow (Patient)

```mermaid
sequenceDiagram
    actor Patient
    participant Frontend
    participant Gateway
    participant Clinic_Service
    participant Notification_Service

    Patient->>Frontend: Select "Book Appointment"
    Frontend->>Gateway: GET /api/doctors/schedule
    Gateway->>Clinic_Service: Fetch availability
    Clinic_Service-->>Frontend: Returns Time Slots
    Patient->>Frontend: Pick slot & confirm
    Frontend->>Gateway: POST /api/appointments
    Gateway->>Clinic_Service: Create Appointment Record
    Clinic_Service-->>Gateway: Appointment Confirmed
    Gateway->>Notification_Service: Trigger Confirmation MSG
    Notification_Service-->>Patient: Send Email/SMS
    Frontend->>Patient: Display Success Page
```

### 2.3 Examination & AI Analysis Flow (Dentist)

```mermaid
sequenceDiagram
    actor Dentist
    participant Frontend
    participant Medical_Service
    participant RabbitMQ
    participant AI_Service

    Dentist->>Frontend: Open Patient Record & Upload X-Ray
    Frontend->>Medical_Service: POST /api/images (Multipart)
    Medical_Service->>Medical_Service: Store Image Locally/S3
    Medical_Service->>RabbitMQ: Publish Image URL to Queue
    RabbitMQ->>AI_Service: Consume Async Message
    AI_Service->>AI_Service: Run MobileNetV3 Inference
    AI_Service->>RabbitMQ: Publish Results (JSON/Masks)
    RabbitMQ->>Medical_Service: Consume AI Findings
    Medical_Service->>Medical_Service: Update Examination Session
    Medical_Service-->>Frontend: Stream update (SSE/WebSocket) or Polling Returns
    Frontend->>Dentist: Display AI overlays (Caries, Landmarks)
```

### 2.4 Blockchain Record Anchoring & Verification

```mermaid
sequenceDiagram
    actor Dentist
    actor Patient
    participant Medical_Service
    participant Blockchain_Service
    participant FabricLedger
    participant IPFS

    %% Anchoring Flow
    Dentist->>Medical_Service: Complete & Sign Record
    Medical_Service->>Medical_Service: Generate Cryptographic Hash of Record
    Medical_Service->>Blockchain_Service: Send Hash + Large Assets
    Blockchain_Service->>IPFS: Upload DICOM/Assets
    IPFS-->>Blockchain_Service: Returns CID
    Blockchain_Service->>FabricLedger: Submit Transaction (Record Hash, CID, Metadata)
    FabricLedger-->>Blockchain_Service: Extracted TxID
    Blockchain_Service-->>Medical_Service: Anchored successfully

    %% Verification Flow
    Patient->>Blockchain_Service: GET Verification (Record ID)
    Blockchain_Service->>FabricLedger: Query State (TxID/Hash)
    FabricLedger-->>Blockchain_Service: On-chain Hash
    Blockchain_Service->>Medical_Service: Fetch Off-chain Hash
    Blockchain_Service->>Blockchain_Service: Compare Hashes
    Blockchain_Service-->>Patient: Returns Integrity Status (Valid/Tampered)
```

### 2.5 Payment Flow

```mermaid
sequenceDiagram
    actor Patient
    participant Frontend
    participant Payment_Service
    participant VNPay

    Patient->>Frontend: Clicks "Pay Invoice"
    Frontend->>Payment_Service: POST /api/payments/process
    Payment_Service->>Payment_Service: Generate Invoice & Signature
    Payment_Service-->>Frontend: Returns VNPay URL
    Frontend->>VNPay: Redirect Patient Browser
    Patient->>VNPay: Authenticate and Pay via Bank App
    VNPay-->>Frontend: Redirect back to frontend (/return)
    VNPay->>Payment_Service: Async IPN (Callback) Event
    Payment_Service->>Payment_Service: Verify Checksum + Update Status
    Payment_Service-->>VNPay: HTTP 200 OK
    Frontend->>Patient: Display "Payment Successful"
```
