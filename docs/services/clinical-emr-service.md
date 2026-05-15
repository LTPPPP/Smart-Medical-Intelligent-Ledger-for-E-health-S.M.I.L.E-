# Clinical/EMR Service (phase-1 target)

## 1. Introduction
The Clinical/EMR Service is the consolidation target for care delivery workflows in S.M.I.L.E. It combines `core-clinic-service` and `medical-service` runtime responsibilities to reduce domain split friction between appointments, records, prescriptions, and examination flows.

## 2. Scope in Phase 1
- Consolidated runtime process for:
  - clinic operations and scheduling
  - appointment lifecycle
  - patient and EMR management
  - examination sessions, diagnoses, prescriptions, imaging, and exports
- Backward-compatible API contracts via gateway, including both route groups currently mapped from core clinic and medical domains.

## 3. Data Strategy (Phase 1)
Database merge is intentionally deferred. Clinical/EMR keeps existing stores:

- `core_clinic_service_db` for clinic/schedule/appointment aggregates
- `core_medical_service_db` for patient/record/examination/imaging aggregates

This avoids high-risk schema migration in the initial consolidation cutover.

## 4. Why this consolidation
- Reduce cross-service orchestration overhead in tightly coupled clinical workflows
- Minimize duplicated operational setup and deployment complexity
- Enable faster feature delivery across appointment-to-record lifecycle

## 5. Non-goals in Phase 1
- No immediate schema/database merge
- No breaking route changes for frontend/mobile clients
- No consolidation of gateway, notification, payment, or blockchain services
