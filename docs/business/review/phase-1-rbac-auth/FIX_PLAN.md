# RBAC Fix Plan

Fixes the 8 Phase-1 findings ([FINDINGS.md](FINDINGS.md)) and aligns every role's permissions to the
business K2 matrix (BUSINESS_FLOW_SOURCE.md §K2, §I8, §J8, Final §4/§12).

Status legend: ⬜ TODO · 🔄 IN PROGRESS · ✅ DONE. Update as you work.

---

## 1. Current RBAC architecture (as-is)

There are **two parallel RBAC systems and only one is actually used**:

### System A — single-role enum (LIVE, drives all access)
- `accounts.role : RoleEnum` — one role per account (`account.entity.ts:43-45`).
  `RoleEnum = ADMIN | DOCTOR | PATIENT | RECEPTIONIST | NURSE` (`accounts/domain/account.ts:12-18`).
- Login signs a JWT with `{ accountId, email, role, status, jti }` — **single `role` string, no permissions**
  (`auth.service.ts:456-475`).
- Each service re-verifies the JWT (`clinical-emr/auth/actor.util.ts`, gateway `proxy.middleware.ts`)
  and enforces `@Roles(RoleEnum.X)` via a per-service `RolesGuard` that checks
  `actor.role ∈ requiredRoles` (`clinical-emr/auth/roles/roles.guard.ts`).
- `RoleEnum` is **duplicated** in 3 services (iam / clinical-emr / payment).

### System B — role→permission grant tables (EXISTS, but DEAD at runtime)
- Tables: `roles`, `permissions`, `role_permissions` (join = the "grant/tag"), `user_roles`
  (`iam-service/{roles,permissions,user-roles}/entities/*.ts`).
- Service methods already exist: `getPermissionsByRole(roleId)`, `assignPermissionToRole()`,
  `revokePermissionFromRole()` (`permissions.service.ts:78-103`), plus an Admin "Role Management" UI.
- Seeded catalog is **coarse — ~13 permissions only**: `patient:*`, `appointment:*`,
  `medical_record:{read,create,update}`, `payment:{read,create}`, `user:manage`, `system:admin`
  (`run-user-seed.ts:120-180`).
- Seed defines a **`MANAGER` role that isn't in `RoleEnum`** → drift.
- **Nothing reads `user_roles`/`role_permissions` at login; permissions never reach the JWT or any
  guard.** So assigning a permission to a role in the Admin UI has zero runtime effect. → **F1-003**.

### Frontend
- `roles.ts` uses `DENTIST/CLINIC_ADMIN/SUPER_ADMIN`; backend issues `DOCTOR` → clinical gates fail (**F1-004**).
- `ProtectedRoute` already checks `user.permissions` and `auth.ts:56-57` already maps
  `permissions: data.user.permissions ?? []` — **the frontend is half-ready for permission-based auth**;
  the backend just never sends permissions.

---

## 2. Root-cause → finding map

| Finding | Root cause | Fixed in |
|---------|-----------|----------|
| F1-001 notifications unguarded | controllers lack guards + gateway public | Stage 1 · RF-1.1 |
| F1-002 no ownership scoping | by-id routes trust URL param | Stage 1 · RF-1.2 |
| F1-003 grant table dead | JWT/guards are role-only, ignore permissions | Stage 2 · RF-2.x |
| F1-004 DOCTOR vs DENTIST | FE/BE role vocabulary drift | Stage 1 · RF-1.3 |
| F1-005 check-in role too broad | service allowlist includes DOCTOR/NURSE | Stage 1 · RF-1.4 |
| F1-006 FE guard presence-only | middleware + dead allowlists | Stage 1 · RF-1.5 |
| F1-007 NURSE no clinical grants | no @Roles(NURSE); wrong role sets | Stage 1 · RF-1.4 |
| F1-008 files/patient-reps no @Roles | missing decorators | Stage 1 · RF-1.1 |

---

## 3. Target design — RECOMMENDED: two-stage hybrid

> **Decision needed from you (see §7).** Recommendation below.

**Stage 1 — Harden the live role-based system NOW (model-agnostic, ships the security fixes).**
Keep `@Roles(RoleEnum.X)` but (a) guard every route, (b) correct every role set to the K2 matrix,
(c) add ownership scoping, (d) unify role names. This closes F1-001, -002, -004, -005, -006, -007,
-008 quickly and is valuable no matter what we do next.

**Stage 2 — Make the permission grants real (delivers F1-003 + custom roles).**
Wire System B into auth: expand the permission catalog to match the business matrix, resolve a
user's permissions at login, put them in the JWT (or a `/me/permissions` endpoint), add a
`@RequirePermissions(...)` guard, and migrate controllers from role checks to permission checks.
This is what lets Admin "add a permission tag to a role" and take effect, and enables custom roles
(K2: "Admin có thể tạo vai trò tùy biến").

**Why hybrid, not permission-only-now:** permission-first across 3 services + JWT changes + a full
catalog is a large, riskier change. Doing Stage 1 first stops the active security holes (F1-001 is a
🔴 unauth PHI leak) in days, while Stage 2 is designed and rolled out behind the same guards.

Alternative if you want to skip straight to permissions: do RF-2.1–2.4 first and express Stage 1's
corrected matrix directly as permission grants. Costs more up front, no interim role-based cleanup.

---

## 4. Canonical RBAC matrix (source of truth for both stages)

Derived from business §K2 + §I8 + §J8 + Final §4. `✅` allow · `⚠️` conditional (ownership/limit) ·
`–` deny. This table is what Stage 1 role sets and Stage 2 grants must both encode.

| Permission (proposed name) | Patient | Reception | Nurse | Doctor | Admin | Notes |
|----------------------------|:---:|:---:|:---:|:---:|:---:|-------|
| `appointment:create` | ✅own | ✅ | – | – | ✅ | patient books own |
| `appointment:read` | ✅own | ✅ | ✅ | ✅own | ✅ | ownership-scoped |
| `appointment:update/cancel` | ⚠️own | ✅ | – | – | ✅ | |
| `appointment:checkin` | – | ✅ | – | – | ✅ | **not** Doctor/Nurse (F1-005) |
| `examination:read` | – | – | ✅ | ✅own | ✅ | nurse read for support |
| `examination:write` (draft) | – | – | ⚠️draft | ✅ | – | nurse vitals draft (J2); Admin – |
| `examination:sign` | – | – | – | ✅ | – | doctor only |
| `diagnosis:write` | – | – | – | ✅ | – | |
| `prescription:write` (draft) | – | – | ⚠️draft | ✅ | – | |
| `prescription:issue/sign` | – | – | – | ✅ | – | TT26/2025 |
| `treatment_plan:write` | – | – | – | ✅ | – | |
| `treatment_plan:consent` | ⚠️own | – | – | ✅record | ✅ | patient accepts own |
| `dental_image:upload` | – | ⚠️ | ✅ | ✅ | ✅ | nurse assists (J-flow) |
| `dental_image:read` | ⚠️own | – | ✅care | ✅care | ✅ | ownership-scoped |
| `medical_record:read` | ⚠️own/summary | – clinical | ⚠️care | ✅assigned | ✅ | Reception = admin info only (I8) |
| `medical_record:sign/amend` | – | – | – | ✅ | – | post-sign amend only |
| `payment:collect` | – | ✅ | – | – | ✅ | Reception cashier |
| `payment:refund.request` | – | ✅ | – | – | ✅ | |
| `payment:refund.approve` | – | ⚠️limit | – | – | ✅ | Admin (K4) |
| `kyc:approve` | – | – | – | – | ✅ | Admin only (K3) — remove Reception |
| `report:view` | – | ⚠️ | – | ⚠️own | ✅ | scoped |
| `schedule:manage.own` / `leave:request` | – | – | ✅ | ✅ | ✅ | staff self |
| `leave:approve` | – | – | – | – | ✅ | manager/admin, not self (§K5) |
| `audit:view` | – | – | – | – | ✅ | |
| `user:manage` / `role:manage` | – | – | – | – | ✅ | |
| `notification:read.own` | ✅own | ✅ | ✅ | ✅ | ✅ | must be authed (F1-001) |

Open decisions embedded here → confirm in §7: Nurse `examination:write(draft)` & `dental_image:upload`;
strip Reception from `kyc:approve`; strip Doctor/Nurse from `appointment:checkin`.

---

## 5. Stage 1 tasks — role-based hardening

| ID | Task | Files | Fixes | Status |
|----|------|-------|-------|--------|
| RF-1.1 | **Guard every route.** ✅ Notifications guarded (create=internal-key guard, reads=JWT, templates=ADMIN); gateway now requires identity for notification prefixes; both internal publishers send `x-internal-api-key`. patient-representatives confirmed intentional (PATIENT needs access + service-layer ownership). ⏸️ `files/*` download deferred (needs signed-URL design — naive JWT breaks `<img src>`). ⏸️ full gateway default-true flip deferred (needs public-endpoint audit). | `iam/notifications/notifications.controller.ts`, `iam/auth/guards/internal-api-key.guard.ts` (new); `clinical/appointments/appointment-notification.publisher.ts`, `clinical/doctor-schedules/doctor-schedules.service.ts`; `gateway/proxy.middleware.ts:79-92` | F1-001 ✅, F1-008 partial | ✅ core / ⏸️ files |
| RF-1.2 | **Ownership scoping.** ✅ Shared helpers built (`auth/ownership.util.ts` + `auth/current-actor.decorator.ts`): DOCTOR pinned to own `doctor_id`, ADMIN unrestricted, undefined actor = trusted internal call. ✅ Wired into the 3 modules with a direct `doctor_id`: **examination-sessions, medical-records, prescriptions** (all read/list/update/finalize/amend paths). ⏸️ **treatment-plans, diagnoses** need join-to-session ownership (only have `session_id`); **dental-images** ownership is ambiguous (`uploaded_by` = nurse or doctor) — needs a product decision. All done modules typecheck clean. | new `clinical/auth/ownership.util.ts`, `clinical/auth/current-actor.decorator.ts`; `clinical/{examination-sessions,medical-records,prescriptions}/*.{controller,service}.ts` | F1-002 (3/6 modules) | 🔄 partial |
| RF-1.3 | **Unify role vocabulary.** Pick canonical set = backend `RoleEnum` (ADMIN, DOCTOR, PATIENT, RECEPTIONIST, NURSE) + decide MANAGER/CLINIC_ADMIN. Map FE `DENTIST→DOCTOR` (alias at auth boundary or replace usages in `roles.ts`, `config/navigation.ts`, `CLINICAL_ROLES`). Extract one shared role enum or document the single source. | FE `shared/constants/roles.ts`, `config/navigation.ts`, `nav.ts`; BE 3× `roles.enum.ts` | F1-004, enum drift | ⬜ |
| RF-1.4 | **Correct role sets to the §4 matrix.** Remove DOCTOR/NURSE from check-in path (`appointments.service.ts:286-320`); remove RECEPTIONIST from `kyc-verifications` `@Roles`; add NURSE where the matrix grants it (examination read/draft, dental-image upload — pair with a `draft`-only service rule); split `leave:approve` (Admin) from `leave:request` (staff). | `appointments.service.ts`; `iam/kyc-verifications.controller.ts`; clinical `examination-sessions`, `dental-images`, `doctor-leaves` controllers/services | F1-005, F1-007 | ⬜ |
| RF-1.5 | **Frontend defense-in-depth.** Either delete the dead `DOCTOR_ROUTES/RECEPTIONIST_ROUTES/NURSE_ROUTES` allowlists or wire them into `middleware.ts`; wrap clinical page groups in `ProtectedRoute` with correct roles; keep API as the real gate. Document that middleware is presence-only (server can't validate signature without the secret) and API is authoritative. | `frontend/web/src/middleware.ts`, `shared/constants/routes.ts`, `(pages)/*/layout.tsx` | F1-006 | ⬜ |
| RF-1.6 | **Regression tests** for the corrected matrix (drive the §12 validation matrix + T1.4 A/B/C/O rows). | new e2e/integration tests | verifies all | ⬜ |

---

## 6. Stage 2 tasks — make permission grants real (F1-003 + custom roles)

| ID | Task | Files | Status |
|----|------|-------|--------|
| RF-2.1 | **Expand the permission catalog** in seeds to the §4 matrix (add examination/diagnosis/prescription/treatment_plan/dental_image/kyc/refund/audit/leave/report perms with `resource:action` names). Backfill `role_permissions` per the matrix. Add migration. | `run-user-seed.ts`, new migration | ⬜ |
| RF-2.2 | **Resolve permissions at login** and embed them. Use existing `getPermissionsByRole` (extend to resolve via `user_roles` → `role_permissions`). Add `permissions: string[]` to the JWT payload **or** expose `GET /api/v1/auth/me/permissions` (JWT-size tradeoff — recommend endpoint + short cache to keep tokens small). | `auth.service.ts:456-475`, `jwt-payload.type.ts`, `permissions.service.ts` | ⬜ |
| RF-2.3 | **`@RequirePermissions()` guard.** New decorator + guard checking `actor.permissions ⊇ required`. Ship alongside `RolesGuard` (both can coexist during migration). Put it in a shared lib or replicate per service (match current pattern). | new `auth/permissions.decorator.ts` + `permissions.guard.ts` in each service | ⬜ |
| RF-2.4 | **Migrate controllers** from `@Roles` → `@RequirePermissions` incrementally, module by module, starting with the clinical write paths. Ownership checks from RF-1.2 stay. | all `*.controller.ts` | ⬜ |
| RF-2.5 | **Frontend consumes permissions.** Populate `user.permissions` from RF-2.2; switch `ProtectedRoute`/nav gating from role-lists to permission checks (component already supports `requiredPermissions`). | `features/auth/*`, `ProtectedRoute.tsx`, `nav.ts` | ⬜ |
| RF-2.6 | **Custom roles.** Admin creates a role + assigns permissions (UI + methods already exist); once RF-2.2–2.4 land, custom roles work end-to-end. Add `user_roles` as the account↔role source of truth or keep `accounts.role` as primary + `user_roles` for extra grants (decide in §7). | `roles`/`user-roles` modules, admin UI | ⬜ |

---

## 7. Decisions — CONFIRMED 08/07/2026

1. ✅ **Target model:** Two-stage hybrid. Stage 1 (role-based hardening) ships first; Stage 2
   (permission-grant wiring) follows.
2. ✅ **Single role per user.** Keep one `accounts.role`; `user_roles` stays for future/Stage-2 extra
   grants but is not the source of truth. Guards keep handling a single role string.
3. ⏳ **Permissions transport (Stage 2 detail):** recommend `GET /api/v1/auth/me/permissions` +
   short client cache (small token, always fresh). Confirm at RF-2.2.
4. ✅ **Nurse scope:** grant `examination:write(draft)` + `dental_image:upload`; still no
   diagnose/prescribe/sign. Requires a `draft`-only service rule (nurse-authored entries stay
   unsigned until a doctor confirms). Matrix in §4 already reflects this.
5. ✅ **Role vocabulary:** alias `DENTIST → DOCTOR` at the auth boundary (single normalization point);
   keep existing frontend code working. Do not mass-rename now.
6. ⏳ **MANAGER role (Stage 2 detail):** recommend removing from seed unless a Manager persona is
   needed; if kept, add to `RoleEnum`. Confirm at RF-2.1. Not blocking Stage 1.

---

## 8. Suggested sequencing

1. **RF-1.1 + RF-1.2** first — they close the 🔴/🟠 security holes (unauth notifications, cross-doctor
   reads). Ship as one security PR.
2. **RF-1.3 + RF-1.4 + RF-1.5** — correctness/consistency PR (role names + matrix + FE guards).
3. **RF-1.6** — lock it with tests.
4. **Stage 2** — after decisions in §7; land RF-2.1→2.5 behind the now-correct guards, migrate
   module-by-module so nothing breaks mid-flight.

Effort estimate: Stage 1 ≈ 2–3 focused days (mostly mechanical + ownership helper + tests);
Stage 2 ≈ 1–1.5 weeks (catalog + login change + guard + incremental migration + FE).
