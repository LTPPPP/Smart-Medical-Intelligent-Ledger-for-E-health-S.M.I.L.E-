# IAM Service (phase-1 target)

## 1. Introduction
The IAM Service is the consolidation target for identity management in S.M.I.L.E. It combines the runtime responsibilities of `auth-service` and `user-service` into one process to reduce cross-service calls and duplicated infrastructure setup.

## 2. Scope in Phase 1
- Consolidated runtime process for:
  - authentication and session lifecycle
  - account/profile management
  - role/permission management (RBAC)
  - digital signatures and access audit logs
- Backward-compatible API contracts via gateway:
  - `/api/v1/auth/*`
  - `/api/v1/user-profiles/*`
  - `/api/v1/roles/*`
  - `/api/v1/permissions/*`
  - `/api/v1/user-roles/*`
  - `/api/v1/digital-signatures/*`
  - `/api/v1/audit-logs/*`

## 3. Data Strategy (Phase 1)
Database merge is intentionally deferred. IAM keeps existing stores:

- `auth_service_db` for auth/session and OAuth artifacts
- `account_service_db` for profile/RBAC/signature/audit artifacts

This preserves existing data boundaries and minimizes migration risk during cutover.

## 4. Why this consolidation
- Reduce auth/profile round-trips between services
- Remove duplicated NestJS boilerplate and deployment overhead
- Keep scale and compliance options open by preserving database boundaries in Phase 1

## 5. Non-goals in Phase 1
- No schema merge between auth and account databases
- No forced endpoint contract changes for clients
- No replacement of gateway, notification, payment, or blockchain boundaries
