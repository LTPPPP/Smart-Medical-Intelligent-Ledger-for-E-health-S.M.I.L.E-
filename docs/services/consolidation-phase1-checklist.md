# Phase 1 Service Consolidation Checklist

## Goal
Consolidate runtime processes while keeping existing databases unchanged:

- `auth-service` + `user-service` -> `iam-service`
- `core-clinic-service` + `medical-service` -> `clinical-emr-service`

Out of scope for Phase 1:

- Cross-database schema merge
- Data migration between databases
- Breaking API changes for frontend clients

## Target Runtime Topology

- Keep separate edge and infrastructure services:
  - `gateway-service`
  - `notification-service`
  - `payment-service`
  - `blockchain-service`
- Add two consolidated business services:
  - `iam-service`
  - `clinical-emr-service`
- Keep existing databases:
  - `auth_service_db`
  - `account_service_db`
  - `core_clinic_service_db`
  - `core_medical_service_db`

## Workstream A: IAM Service

### A1. Bootstrap service skeleton
- [x] Create `backend/service/iam-service/` from `backend/service/auth-service/` baseline
- [x] Update service metadata and scripts in `backend/service/iam-service/package.json`
- [x] Update `backend/service/iam-service/src/main.ts` logs and Swagger title

### A2. Bring user profile and RBAC modules in-process
- [x] Copy modules from `backend/service/user-service/src/` into `backend/service/iam-service/src/`:
  - `users/`
  - `roles/`
  - `permissions/`
  - `user-roles/`
  - `digital-signatures/`
  - `audit-logs/`
- [x] Wire modules into `backend/service/iam-service/src/app.module.ts`

### A3. Keep dual database ownership (no merge)
- [x] Keep auth modules connected to `auth_service_db`
- [x] Add a second TypeORM connection for user modules to `account_service_db`
- [x] Ensure each module explicitly binds to the intended connection

### A4. Backward-compatible API paths
- [x] Preserve current auth endpoints (`/v1/auth/*`)
- [x] Preserve current user endpoints (`/v1/user-profiles/*`, `/v1/roles/*`, etc.)

## Workstream B: Clinical/EMR Service

### B1. Bootstrap service skeleton
- [x] Create `backend/service/clinical-emr-service/` from `backend/service/medical-service/` baseline
- [x] Update service metadata and scripts in `backend/service/clinical-emr-service/package.json`
- [x] Update `backend/service/clinical-emr-service/src/main.ts` docs title and logs

### B2. Bring clinic modules in-process
- [x] Copy modules from `backend/service/core-clinic-service/src/` into `backend/service/clinical-emr-service/src/`:
  - `clinics/`
  - `treatment-rooms/`
  - `specialties/`
  - `service-categories/`
  - `services/`
  - `doctor-specialties/`
  - `work-shifts/`
  - `doctor-schedules/`
  - `doctor-leaves/`
  - `appointments/`
  - `diagnostic-orders/`
- [x] Resolve overlap modules before wiring:
  - `symptoms/`
  - `treatment-plans/`
  - `prescriptions/`

### B3. Keep dual database ownership (no merge)
- [x] Keep medical modules connected to `core_medical_service_db`
- [x] Add second TypeORM connection for clinic modules to `core_clinic_service_db`
- [x] Ensure each repository and entity is attached to the correct connection

### B4. Backward-compatible API paths
- [x] Preserve clinic endpoints currently served from `/v1/*`
- [x] Preserve medical endpoints currently served from `/api/v1/*` via gateway rewrite rules

## Workstream C: Gateway Routing and Health

### C1. New environment keys and fallbacks
- [x] Update `backend/service/gateway-service/.env.example`:
  - add `IAM_SERVICE_URL`
  - add `CLINICAL_EMR_SERVICE_URL`
  - keep legacy keys for transition fallback

### C2. Route consolidation
- [x] Update `backend/service/gateway-service/src/config/services.config.ts`:
  - auth + user route groups target `IAM_SERVICE_URL`
  - core-clinic + medical route groups target `CLINICAL_EMR_SERVICE_URL`
  - maintain old rewrite behavior so clients do not break

### C3. Health/readiness update
- [x] Update `backend/service/gateway-service/src/health/health.controller.ts`:
  - readiness probe should check `iam-service` as critical auth dependency

### C4. Gateway docs alignment
- [x] Update service naming and descriptions in `backend/service/gateway-service/src/main.ts`

## Workstream D: Docker Compose (Dev)

- [x] Update `docker-compose.yml`:
  - add `iam-service`
  - add `clinical-emr-service`
  - switch gateway env to new service URLs
  - update gateway `depends_on` to new services
- [x] Keep old service definitions disabled or transitional until cutover complete

## Workstream E: Docker Compose (Prod)

- [x] Update `infra/docker/prod/compose.build.yaml`:
  - add build targets for `iam-service` and `clinical-emr-service`
  - remove or deprecate old auth/user/core-clinic/medical build targets after cutover
- [x] Update `infra/docker/prod/compose.yaml`:
  - service definitions for `iam-service` and `clinical-emr-service`
  - gateway downstream URLs to consolidated services
  - keep non-consolidated services unchanged

## Workstream F: Database Init and Infra SQL

- [x] Keep `database/init/01_init_all_databases.sh` as-is for Phase 1
- [x] No DDL merge in `infra/database/*` during Phase 1
- [x] Add note in docs that runtime merged, data stores still split

## Workstream G: Documentation

- [x] Update architecture and workflow docs:
  - `README.md`
  - `docs/ARCHITECTURE.md`
  - `docs/WORKFLOW.md`
  - `docs/PROJECT_WORKFLOW.md`
  - `docs/services/iam-service.md`
  - `docs/services/clinical-emr-service.md`
- [x] Add explicit migration note: legacy route contracts are preserved

## Validation Checklist

### Local build and startup
- [x] `npm run build` in `backend/service/iam-service`
- [x] `npm run build` in `backend/service/clinical-emr-service`
- [x] `npm run build` in `backend/service/gateway-service`
- [x] `docker compose up -d --build`

### Runtime checks
- [x] Gateway liveness: `GET /health/live`
- [x] Gateway readiness: `GET /health/ready`
- [x] Auth flow works through IAM route group
- [x] User profile and RBAC endpoints work through IAM route group
- [x] Clinic endpoints work through Clinical/EMR route group
- [x] Medical endpoints work through Clinical/EMR route group

### Regression checks
- [ ] Notification flow unaffected
- [ ] Payment flow unaffected
- [ ] Blockchain flow unaffected

## Cutover and Rollback

### Cutover
- [ ] Deploy consolidated services in parallel with old services
- [ ] Point gateway to consolidated services
- [ ] Run smoke tests and monitor logs/errors
- [x] Decommission old services only after stable window

### Rollback
- [ ] Revert gateway URLs to old service endpoints
- [ ] Restart gateway
- [ ] Keep consolidated services running for diagnostics if needed

## Phase 2 (Future)

- Evaluate DB/schema merge only after Phase 1 is stable
- Introduce migration scripts, backfill jobs, and data validation reports
- Remove legacy env keys and transitional route aliases
