# S.M.I.L.E — Ground-Truth Feature Matrix

**Audit date:** 2026-07-14 · **Branch:** `dev` · **Mode:** read-only, evidence-cited
**Method:** every backlog status treated as a hypothesis to falsify. Classifications come from reading
controllers/services/entities/migrations/tests, not from the backlog or the README.

**Stack (verified reality, not what README.md says):** NestJS + TypeScript + Bun microservices
(iam-service, clinical-emr-service, payment-service, gateway-service) · TypeORM 0.3.27 + Postgres ·
Redis · MailDev · Next.js (App Router) frontend · two Python AI services (a LangGraph booking chatbot
and a PaddleOCR/VietOCR KYC-OCR service). README.md's "Spring Boot / Java 17 / PyTorch DentalMultiTaskNet /
real VNPay / RabbitMQ" is **aspirational fiction** — see the gap analysis.

Legend — **BE/FE actual:** Implemented = handler/page + real logic + wired to persistence/API ·
Partial = stub / not-wired / mock / missing-piece · Missing = absent.
**Test:** Covered = real assertions exercising the feature · Thin · None.
**Verdict:** ✅ MATCH · ⬆️ UNDER-CLAIM (better than backlog) · ⬇️ OVER-CLAIM (worse than backlog/README) · ⚠️ MIXED.

---

## Master matrix

| Module | Feature | Owner | BE claim | BE actual | FE claim | FE actual | Test | Evidence (paths) | Verdict |
|---|---|---|---|---|---|---|---|---|
| Landing + Auth | Login / register / JWT / refresh / logout | Khoa | Done | **Implemented** | Done | **Implemented** | None (BE) | `iam auth/auth.service.ts:51,197,394,456`; blacklist `jwt.strategy.ts:30`; FE `features/auth/api/auth.ts:40` | ✅ |
| Landing + Auth | Google OAuth | Khoa | Done | **Implemented** | Done | **Implemented** | None | `auth-google/auth-google.service.ts:24`; FE `auth.ts:226` (env-gated button) | ✅ |
| Landing + Auth | **Reset / Forgot password** | Khoa | Todo (sub) | **Partial** | Done | **Implemented** | None | Handler+token real `auth.service.ts:271-340` **but no email sent** → `console.log('Password reset link…')` `auth.service.ts:295`; MailService never injected | ⬇️ |
| Landing + Auth | Email delivery (nodemailer→Mailhog) | Khoa | — | **Implemented** but mis-wired | — | n/a | None | Real `mail/mail.service.ts:11`; **only** consumer = notifications, auth bypasses it | ⚠️ |
| Landing + Auth | OTP | Khoa | Done | **Implemented** (phone/KYC only) | — | n/a | Covered | `accounts.service.ts:172`; email-OTP-login DTOs are **dead code** | ⚠️ |
| User Mgmt | Ban / lock / deactivate / force-logout | Khoa | Done | **Implemented** | Done | **Implemented** | Thin | `accounts.service.ts:119-151`, `accounts.controller.ts:150-282` `@Roles(ADMIN)`+audit; FE `admin/api/admin.ts:53` | ✅ |
| User Mgmt | Coarse RBAC (single `account.role`) | Khoa | Done | **Implemented** | Done | **Implemented** | None | `auth/roles/roles.guard.ts:38` `requiredRoles.includes(user.role)`; **5 roles** ADMIN/DOCTOR/PATIENT/RECEPTIONIST/NURSE `account.ts:12` | ✅ |
| User Mgmt | **Granular permissions / role_permissions / user_roles** | Khoa | Done | **Partial (decorative)** | Done | Implemented (CRUD UI) | None | Full CRUD `permissions.service.ts:37-110` **but no guard ever reads it** — no PermissionsGuard anywhere; assigning a permission changes no access | ⬇️ |
| User Mgmt | KYC verification | Khoa | Done | **Implemented (over-delivered)** | Done | **Implemented** | **Covered (10 specs)** | AES file crypto `kyc-file-storage.service.ts:44`; real env-gated OCR call `kyc-ocr.service.ts:44`; FE `features/profile/.../KycSubmit.tsx` | ⬆️ |
| User Mgmt | Audit logs | Khoa | Done | **Implemented** | Done | **Implemented** | Indirect | `audit-logs.service.ts:21`; consumed across auth/accounts/roles/kyc; FE `admin/audit-logs/page.tsx:67` | ✅ |
| Clinic Mgmt | Clinics + treatment rooms (CRUD) | Phat | Done | **Implemented** | Done | **Implemented** | **None** | `clinics.service.ts:17`, `treatment-rooms.service.ts:21`; RBAC `clinics.controller.ts:34` `@Roles(ADMIN)`; FE `clinics/{new,[id],[id]/edit}` | ✅ |
| Schedule Mgmt | Doctor schedules / shifts / leaves + transfer | Phat | Done | **Implemented** | Done | **Implemented** | **Covered** (schedules 8, leaves 8) | `doctor-schedules.service.ts:59,173,240`; notif→iam `:50` (real, fire-and-forget); FE `schedules/*` | ✅ |
| Schedule Mgmt | Double-booking / conflict guard | Phat | Done | **Partial** | — | n/a | Covered | Only DB `@Unique(doctor_id,work_date,shift_id)` + app check `doctor-schedules.service.ts:73`; **no time-overlap/room check; null shift_id bypasses both** | ⚠️ |
| Patient Mgmt | Patients / medical-records / history / representatives | Phat | Done | **Implemented** | Done | **Implemented** | **Covered** (records 10, hist 4, reps 13) | `patients.service.ts:15`; record draft→finalize FSM+versioning `medical-records.service.ts:64,85`; rep ownership `:263`; FE `patients/*` | ✅ |
| Appointment | Book / confirm / cancel / reschedule | Nhan | Done | **Implemented** | Todo | **Implemented** | **Covered** (postgres+10 specs) | `appointments.service.ts:403,617,638,1010`; FE 4-step `BookingWizard.tsx:110` | ⬆️ (FE) |
| Appointment | Double-booking prevention | Nhan | Done | **Implemented (DB-hardened)** | — | n/a | **Covered** | 3 GIST `EXCLUDE` doctor/room/patient `CanonicalAppointmentAvailability.ts:99`; `23P01`→409 `service.ts:435`; idempotency-keys + status FSM | ⬆️ |
| Appointment | **Reminder (auto)** | Nhan | Done | **Partial (manual only)** | Todo | Implemented (button) | Covered | **No `@nestjs/schedule`/cron anywhere**; reminders fire only on manual `POST :id/notifications/reminder`; booking sends nothing (`// TODO UC-054/055` `service.ts:457`) | ⬇️ |
| Payment | Initiate / confirm / refund | Nhan | Todo | **Partial** | Todo | **Implemented** | **None (0 tests)** | Real entity/refund-FSM `payments.service.ts:329`, cross-svc update `:67`; **VNPay mock** `:42`, **no `vnp_SecureHash`/IP check** `:240`; FE `appointments/[id]/payment` | ⚠️ BE better than "Todo", security worse than README |
| Chatbot | Booking assistant | Nhan | Todo | **Implemented (gated)** | Todo | **Implemented** | **Covered (~25)** | Real LangGraph `graph.py:9`, real BE calls `http_tools.py:125,366`; gateway route **off unless `AI_ROUTES_ENABLED=true`** `services.config.ts:130`; FE `FloatingBookingChat.tsx` | ⬆️ |
| Service Catalog | Specialties / services / categories CRUD | Chinh | Done | **Implemented** | Todo | **Implemented** | **None** | `specialties.service.ts:24`, `services.service.ts:24` `@Roles(ADMIN)`; FE `services/*`, `specialties/page.tsx:62` (`useCreateService` exists) | ⬆️ (FE) |
| Clinical Examination | Sessions / diagnoses / e-Rx / orders / plans | Chinh | Done | **Implemented (all 10 sub-modules)** | Todo | **Implemented** | **Covered** (every sub-module) | Orchestrator `examination-sessions.service.ts:39,237`; e-Rx draft→issue `prescriptions.service.ts:124,273`; FE `examinations/[id]/page.tsx:425` | ⬆️ (FE) |
| Dental Imaging | Upload / view / annotate X-rays | Chinh | Done | **Partial** | Todo | **Partial** | Covered (images/charts/annotations) | Metadata CRUD real `dental-images.service.ts`; **byte upload in orphaned `FilesModule` (not mounted)**; **PACS = log table, no sync**; FE `uploadImage` sends **no binary** `dental-image.ts:101` | ⚠️ |
| Dental Imaging | **AI X-ray analysis** | Chinh | Done (README) | **Missing** | Todo | **Missing (stub)** | None | **No model, no `/analyze` route** anywhere; FE `analyzeImage` `dental-image.ts:240` calls a route that 404s and **no component invokes it** | ⬇️ |
| Performance Mgmt | Dashboards + revenue report | Nhan | Done | **Implemented** | Todo | **Implemented** | **None** | Real SQL agg `reports.service.ts:172` `SUM(base_price)`, net_revenue w/ refunds; `ReportsModule` registered `app.module.ts:151`; FE `DoctorDashboard.tsx:64`, `revenue.api.ts:7` | ⬆️ (FE) |
| Notifications | In-app bell | (n/a) | — | **Implemented** | — | **Implemented (limited)** | None (BE) | iam notifications module; FE poll `notification.api.ts:15` (30s); dropdown-only, single markRead | ⚠️ |
| **AI research model** | **Dental Multi-task Transformer-CNN** | (research) | Done (README/paper) | **Missing (paper only)** | — | **Missing** | None | **Zero model code / weights / notebooks / training / inference.** Paper `docs/paper/main.tex` has placeholder results (`XXXX%`); README `DentalMultiTaskNet` is fiction | ⬇️⬇️ |

---

## Per-module rollup

| Module | BE actual | FE actual | Tests | Backlog verdict |
|---|---|---|---|---|
| Landing + Auth | Implemented (reset/forgot **Partial** — no email) | Implemented | None (BE) | Mostly ✅; reset-pwd ⬇️ |
| User Management | Implemented; **granular RBAC decorative**; KYC over-delivered | Implemented | KYC Covered, rest None | ⚠️ MIXED |
| Clinic Management | Implemented | Implemented | **None** | ✅ (tests missing) |
| Schedule Management | Implemented; conflict guard duplicate-only | Implemented | Covered | ✅ |
| Patient Management | Implemented | Implemented | Covered | ✅ |
| Appointment | Implemented + DB-hardened; **reminders manual** | Implemented | Covered | ⬆️ (FE was "Todo"); reminder ⬇️ |
| Payment | **Partial** — real module, **mock VNPay, no checksum/IP, 0 tests** | Implemented (FE) | **None** | ⚠️ BE undersold, security oversold |
| Chatbot | Implemented (gated off by default) | Implemented (FE) | Covered | ⬆️ ("Todo" false) |
| Service Catalog | Implemented | Implemented | **None** | ⬆️ (FE was "Todo") |
| Clinical Examination | Implemented (10/10) | Implemented | Covered | ⬆️ (FE was "Todo") |
| Dental Imaging | **Partial** (metadata only; no AI; upload unwired; PACS log-only) | **Partial** (upload no-binary; AI/download stubs) | Covered (subset) | ⚠️ |
| Performance Management | Implemented | Implemented | **None** | ⬆️ (FE was "Todo") |
| **AI research model** | **Missing (paper only)** | Missing | None | ⬇️⬇️ biggest gap |

---

## Overall REAL % complete (auditor's estimate, from verified code — not the backlog)

| Layer | Real completion | Basis |
|---|---|---|
| **Backend** | **~88%** of the claimed feature surface is genuinely built and persistence-wired | 10 of 12 backlog modules Implemented; Payment Partial (mock/untested); Dental-Imaging Partial (metadata only). **The flagship AI model = 0% (non-existent as code)** — excluded from the 88% and tracked separately because it is the capstone's headline research deliverable. |
| **Frontend** | **~90%** built and wired to the gateway | 11 of 13 surfaces Implemented; Dental Imaging Partial; Notifications limited. Payment/Chatbot FE complete but depend on a mock/gated backend at runtime. Previously build-blocking imports (`BOOKING_TYPE`, `useCreateService`) are **resolved on `dev`**. |
| **Tests** | **~45–55% effective** | Strong, real suites for appointment, examination, KYC, booking-agent, OCR, medical-records, schedules. **None** for payment-service (0 files), service-catalog, reports, clinics/rooms, auth, RBAC. CI runs tests for **only 2 of ~7 packages** (`iam` + `clinical-emr`) with `--passWithNoTests` and **no coverage gate**; the two strongest suites (Python AI) never run in CI. |

**Backlog vs reality, one line:** the backlog **undercounts** delivery on the frontend and on Payment/Chatbot BE
(6 of 7 "Todo" items are actually built), while it — and especially README.md — **massively overclaims** the
one thing that matters most for a research capstone: the AI diagnostic model, which does not exist as code.

---

## Claim-vs-reality mismatches (explicit)

**OVER-CLAIMS (claimed done / real, but not):**
1. **AI dental model** — README §2.2A `DentalMultiTaskNet` with benchmarked perf; paper with results. Reality: **no code, placeholder paper**. (`README.md:87`, `docs/paper/main.tex` `XXXX%`)
2. **Payment security** — README: "Validates `vnp_SecureHash` on all callbacks" + IP validation. Reality: **neither is performed**; VNPay is a mock success-redirect. (`README.md:101-102` vs `payments.service.ts:240`)
3. **Reset/forgot password "Done"** at module level — reality: **no email is ever sent**. (`auth.service.ts:295`)
4. **Granular RBAC "Done"** — reality: **decorative**, never enforced. (`roles.guard.ts:38`)
5. **Auto "reminder"** — reality: **manual endpoint only, no scheduler**. (`appointments.controller.ts:447`)
6. **README architecture** — claims Spring Boot/Java/RabbitMQ. Reality: NestJS/Bun; RabbitMQ not even in `docker-compose.yml`.

**UNDER-CLAIMS (marked Todo / undersold, but actually built):**
1. **Appointment FE, Payment FE, Chatbot FE, Service-Catalog FE, Examination FE, Performance/Dashboards FE** — all marked "Todo", all built and wired.
2. **Payment BE** — marked "Todo"; is a real service with a refund FSM (just mock-gateway + untested).
3. **Chatbot BE** — marked "Todo"; is a real, tested LangGraph agent.
4. **Testing** — backlog implies ~8%/mostly-Todo; several packages have substantive, real suites.
5. **Design docs** — backlog columns blank; live OpenAPI (all 4 services), a 702-line ERD, mermaid + PlantUML architecture, and 8 sequence diagrams **do exist** (class diagrams + formal SRS/SDS + ADRs do not).
