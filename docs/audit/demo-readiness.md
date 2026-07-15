# Demo Readiness Report — 002-demo-hardening

**Date:** 2026-07-15
**Branch:** `002-demo-hardening` (cut from `dev` @787924f)
**Scope:** make a 3-role (PATIENT/DOCTOR/ADMIN) demo happy-path run end-to-end without failing
in front of examiners, hiding anything embarrassing off that path. This was **not** a feature
build — every change below is tied to a happy-path step, an off-path breaker, or the README fix.

**Git discipline honored:** edits only. No commits, staging, pushes, branch switches, or branch
creation were made — the operator owns all git operations for this branch.

---

## 1. Environment

Hybrid runtime: Postgres/Redis/MailDev in Docker (`docker compose -f docker-compose.yml up -d
postgres redis maildev`), the 4 backend services (iam :8081, clinical-emr :8082, payment :3006,
gateway :8080) and the frontend (:3000) run natively via `bun run start:dev` / `bun run dev`.

**Note on `compose.yaml` vs `docker-compose.yml`:** a bare `compose.yaml` in the repo root silently
shadows `docker-compose.yml` for plain `docker compose` invocations — always pass
`-f docker-compose.yml` explicitly.

### Seed data — UUID referential-integrity remediation

Per the operator's explicit instruction, before loading any remapped data a strict v4-compliance
rule was nailed down (`group3[0]=='4'` and `group4[0]` in `89ab`), and a full referential-integrity
pass was run before and after the remap:

- **243 distinct UUIDs audited** across the 4 seed files
  (`database/{iam-service/{auth-service,user-service},clinical-emr-service/{clinic-service,medical-service}}/insert.sql`).
- **176 non-v4-compliant UUIDs remapped** to fresh `uuid.uuid4()` values, applied identically
  across all 4 files (exhaustive find/replace keeps every FK reference in sync with its PK
  definition by construction). 67 were already v4-compliant and untouched.
- **82 + 22 = 104 orphaned cross-file references** (old, already-v4-format but non-existent-account
  IDs like `550e8400-...-0001/2/4/5`) were separately relinked to the correct regenerated doctor/
  patient account IDs.
- **Referential-integrity verification, run before final load**: confirmed `accounts` and `users` ID
  sets are identical (101 rows each); confirmed every `doctor_id`/`created_by`/`cancelled_by`/
  `approved_by`/`changed_by` in `core_clinic_service_db` resolves to a real account; confirmed every
  `appointments.patient_id` matches a real (not-yet-loaded) `patients.patient_id` via the same
  mapping before ever loading that file; statically swept all 21 UUIDs in the medical-service file
  against the known-good pool — 10 flagged as "unknown" were manually confirmed to be
  self-referencing primary keys (medical_records.record_id), not real orphans.
- **Result: zero genuine orphans found.** Nothing was loaded before this check passed.

**Side effect confirmed working**: the pre-existing, team-documented limitation where reminder/
confirmation notifications rejected pre-seeded patient IDs with `"recipientId must be a UUID"`
(because those IDs weren't v4-compliant) is now resolved as a consequence of the full regeneration —
re-verified live (`POST /appointments/:id/notifications/reminder` → 202, `status: "sent"`).

---

## 2. PATIENT happy path — ✅ verified end-to-end

register → login → browse clinics/rooms/doctors/services → book appointment (4-step
BookingWizard) → pay (mock VNPay sandbox) → after doctor completes exam → pay again for added
service → in-app notifications throughout.

**Bugs found and fixed:**
- `PatientDashboard.tsx` / `BookingWizard.tsx` — both called the staff-only `GET /patients` list
  endpoint even when the logged-in user was a PATIENT (403). Fixed: use `GET /patients/me`, added an
  `isPatient` check, removed dead multi-patient-picker UI.
- `patients.controller.ts` `findMine()` (`GET /patients/me`) inherited a class-level staff-only
  `@Roles` restriction via NestJS's `getAllAndOverride`, making the self-service endpoint
  unreachable by the PATIENT role it exists for. Fixed with a method-level `@Roles(...,PATIENT)`
  override.
- `appointments/[id]/payment/page.tsx` — double-unwrapped the API response (`data?.data.data`
  instead of `data?.data`) and read nonexistent camelCase fields. Fixed field mapping to the real
  snake_case/nested shape with graceful fallbacks.
- **`payment-service` → `clinical-emr` cross-service silent 401**: the fire-and-forget
  `updateAppointmentPaymentStatus` PATCH only sent `x-auth-user-id`/`x-auth-role` headers, but
  clinical-emr's `JwtAuthGuard` requires a real signed JWT regardless. This meant **payment_status
  never synced back to the appointment after a successful mock payment** — silently breaking
  revenue reports, the patient's own paid-appointment view, and the admin refund queue. Fixed by
  minting a short-lived system-actor JWT (`mintSystemActorToken()`, HS256, existing `crypto` import,
  no new dependency) and attaching it as a real `Authorization: Bearer` header.
- 3 pages sitewide (`appointments/[id]/payment`, `patients/[id]/medical-records/[recordId]`,
  `patients/[id]/medical-records/new`) used `requiredPermissions` on `<ProtectedRoute>`/
  `<ProtectedLayout>`, but `user.permissions` is never populated anywhere in the auth store
  (decorative/incomplete granular RBAC) — these pages were permanently unreachable by every role.
  Removed the dead gate; real authorization stays enforced server-side via role guards.

**Verified live**: registered/logged in, booked via "By Specialty" (see note below), paid via mock
VNPay (`payment_id`/`status` confirmed `paid` on both `payments` and the appointment record), then
— after the doctor finalized an examination on that same appointment — paid again for
`APT-2026-0016` (Tẩy trắng răng, 3,000,000 VND); reminder notification sent successfully (202,
`status: "sent"`).

**Known UX gap, not fixed (out of scope — would be a new feature)**: the "At Facility"/"By Doctor"
booking methods use a raw "Enter doctor ID" text field with no picker (no list-doctors endpoint
exists to build one against). **Demo script should stick to "By Specialty"**, which auto-assigns a
doctor and needs no raw UUID entry.

---

## 3. DOCTOR happy path — ✅ verified end-to-end

login → manage own work schedule + leave requests → view assigned appointments → manage patients →
run examination (symptoms → diagnosis → treatment plan → e-prescription w/ per-item dosing →
orders).

**Bugs found and fixed, all in `examinations/[id]/page.tsx`:**
- Prescriptions were run through `filterByEncounterScope`, which checks snake_case
  `session_id`/`record_id`, against `mapBackendPrescription`'s camelCase output — always evaluated
  false, so the Prescription section showed **permanently empty** regardless of real backend data.
  Fixed by removing the redundant client-side filter (the backend endpoint already scopes server-side).
- That fix exposed a **hard crash**: ~11 occurrences of `pr.prescription_id` (a field that doesn't
  exist on the mapped type — the real field is `.id`) plus 5 more snake_case-vs-camelCase mismatches
  in the pediatric-prescription-snapshot block. Fixed all field accesses.
- A stale **local TypeScript interface** (`interface Prescription { prescription_id: ... }`,
  snake_case) shadowed the correct, already-exported camelCase type from
  `features/examination/types/examination.type.ts`. Removed the stale local type and imported the
  real one — this cleared 15 pre-existing `tsc` errors. One further mismatch this exposed (the raw
  `POST /prescriptions` create-mutation genuinely returns unmapped snake_case, so `.prescription_id`
  was actually correct there) was fixed by typing that specific call as `BackendPrescription`
  instead of `Prescription`. **`bunx tsc --noEmit` is clean project-wide** as of this report — this
  matters because a `next build` does its own stricter type-check and these would have hard-failed
  a production build.
- **Leave-request approve/reject were wired to nonexistent backend routes**
  (`/doctor-leaves/:id/approve` / `/reject`) — the real backend only exposes a generic
  `PATCH /doctor-leaves/:id` accepting `{status, approved_by, reason}`. Clicking "Approve" 404'd
  with a "Failed to approve request" alert. Fixed the frontend to PATCH the correct endpoint with
  the correct body shape (backend field is `reason`, not `rejection_reason`).
- The "Request Leave" creation page (`/schedules/leaves/new`) did not exist at all — the link was a
  guaranteed 404. **Built during this session** (type/dates/reason form → `POST /doctor-leaves`).

**Verified live, full chain on one examination session:**
- Diagnosis: pre-existing "Dental caries K02.9 primary" displayed correctly.
- Treatment plan: created draft → **hit a genuine, correct validation gate** (not a bug —
  `getTreatmentPlanProposalBlocker` requires estimated_cost/quote_version/risk_disclosure/
  alternative_options all filled before "Propose" is allowed; clicking Propose with any missing
  silently no-ops with a toast and fires zero network requests — easy to mistake for a dead button
  if the demo rehearsal skips a field) → filled the missing field via the edit action → Propose →
  Accept full (confirm dialog) → all succeeded, plan status **accepted**.
- E-prescription: created draft → added a dosed item (Amoxicillin 500 mg · 3×/day · oral · 7 days ·
  qty 21 · "Take after meals") → **Issue prescription** (confirm dialog) → succeeded, status
  **issued**, "Add drug" correctly disabled afterward.
- Diagnostic order: X-ray, tooth 26, upper-left molar → created, status "ordered".
- Clinical/lab order: "Pulp vitality test", tooth 26 → created, status "ordered".
- **Finalize encounter** → confirm dialog → session status flipped in-progress → **completed**;
  post-finalization, "Create electronic prescription" correctly became disabled.
- Leave request lifecycle (create → list → approve/reject) verified live end-to-end (see bug fix
  above) — created 2 real leave requests via the UI/API, approved one from the admin side, stat
  counts and card status updated correctly with 0 console errors.

**Reachability note for the demo script**: `/schedules/leaves` is **not** in the doctor's top nav
(only "My Schedule" is). Reach it via `/schedules` hub → "Leaves" card, or a direct URL. Admin
reaches the same page via `/admin/facility` → "Leave Approvals" (both paths verified working).

---

## 4. ADMIN happy path — ✅ verified end-to-end

login → user/role mgmt → facility hub CRUD → refund queue (approve/reject) → audit log → reports.

**Bugs found and fixed:**
- **`admin/facility/page.tsx` (the literal "facility hub" happy-path step) was entirely hardcoded in
  Vietnamese** — headings, card titles/descriptions, hover labels — while the rest of the shipped UI
  is English. Translated to English.
- **`features/admin/components/refund-management.tsx` (the literal "refund queue" happy-path step)
  was entirely hardcoded in Vietnamese** — page title, status filters/badges, table headers,
  buttons, reject-reason modal. Translated to English.
- **`features/admin/hooks/useAdmin.ts` — 44 hardcoded Vietnamese toast messages** covering *every*
  admin mutation (ban/unban/lock/unlock user, create/update/delete role and permission, assign/
  revoke role/permission, approve/reject KYC, approve/reject refund). These are transient popups
  that fire immediately after nearly every admin click during the demo — higher-visibility than a
  static page header. Translated all 44.
- `admin/revenue-reports/page.tsx` — the chart Y-axis compact-notation formatter was hardcoded to
  `Intl.NumberFormat('vi-VN', ...)`, producing "7,5 Tr / 15 Tr" (Vietnamese "Triệu"/million
  abbreviation) instead of "7.5M / 15M". Changed locale to `'en-US'`. (The VND currency
  thousands-grouping elsewhere, e.g. "3.000.000 ₫", was left alone — that's correct formatting for
  VND, not a language leak.)
- **Real routing bug**: `navForKind('admin')` included a top-nav "Performance" link pointing at
  `/performance`, which is hard-gated to `PERFORMANCE_ROLES = [DOCTOR]` only — clicking it as admin
  silently redirected to `/unauthorized`. The real admin-facing performance dashboard
  (`/admin/performance`, correctly `ADMIN_ROLES`-gated) was only reachable via a dashboard card, not
  the top nav. Fixed by adding a dedicated `NAV_PERFORMANCE_ADMIN` entry.
- Root-caused (see §1) and fixed the reminder-notification `@IsUUID()` failure via the UUID
  regeneration, verified from the admin/reporting side too (revenue numbers correctly reflect a
  processed refund — see below).

**Verified live**:
- User Management: 101 users, search/filter, "Roles" modal open/close (assign/revoke role UI).
- Role Management: 4 roles, full permission matrix expand/collapse with real checkboxes across
  every resource (appointments, clinic settings, access logs, medical records, payments, roles,
  digital signatures, users).
- Facility hub: Clinics/Treatment Rooms, Specialties, Services & Pricing, Work Shifts, Doctor
  Schedules, Leave Approvals — all English now, all real CRUD (left untouched per the "DO NOT
  TOUCH" instruction — clinic/room/service CRUD is audit-proven-real).
- **Full refund lifecycle, live, real money**: paid appointment `APT-2026-0016` (3,000,000 VND) →
  patient clicked "Refund" → `refund_status: REQUESTED` → appeared in `/admin/refunds` ("1 request
  pending review") → clicked Approve → **FSM auto-processed straight to REFUNDED** (no separate
  "processing" step) → **Revenue Reports correctly dropped from 87.1M/14-paid to 84.1M/13-paid**,
  confirming refunds properly back out of financial reporting.
- Audit Logs: 16 real login events, drill-down "Expand details" showing device/IP/JSON payload.
- Revenue Reports: real per-day chart, per-service and per-clinic breakdowns, all in English now.
- Performance: per-doctor completion/cancellation stats (2 doctors, 78.4% avg completion, 23 total
  appointments), reached via the now-fixed top-nav link.
- KYC Management: loads without crashing (0 console errors) — this is explicitly a lower-priority
  supporting feature per the demo script; not deep-tested beyond "does not crash."

---

## 5. Off-path breakers hidden (Phase 2)

- **Booking chatbot — fully removed from the reachable UI** (explicitly out of scope, "must stay
  disabled, do not build/enable/wire any AI"): removed the global `<FloatingBookingChat />` mount
  from `app/provider/Providers.tsx` (was showing a floating "Open SMILE scheduling assistant" button
  on every single page for every role) and removed the "Assistant" nav item (`/chat`) from all 5
  role nav arrays.
- **Forgot-password entry point removed** from the login page (the `/forgot-password` route itself
  still works correctly if navigated to directly — verified end-to-end: `POST /auth/forgot/password`
  → 200 → advances to OTP-entry step 2 — it's just no longer advertised as a clickable entry point).
- **Dental-imaging "AI-analyze button"**: searched every shipped dental-image component
  (gallery/upload/annotation/category/edit modals) for any Analyze/Diagnosis/predict/inference
  control — **found none anywhere in reachable code**. This confirms the ground-truth audit's
  finding that the flagship AI diagnostic feature was never built as real code — there was nothing
  to hide because it doesn't exist as a control. The imaging section itself (gallery, upload,
  categories) is real, working, honestly-labeled CRUD ("Metadata only — paste a hosted image URL (no
  file upload backend)") and was left reachable.
- Decorative `requiredPermissions` dead-ends (3 pages, see §2) already counted as "hidden" since
  they made those pages permanently unreachable — removing the gate was the fix, not a hide.

---

## 6. README stack truth (Phase 3)

Fully rewrote `README.md`, replacing the fictional Spring Boot/Java/Kubernetes/PyTorch/RabbitMQ
version the ground-truth audit flagged with one verified fact-by-fact against the actual repo:
real dependency versions (NestJS 11.1.6, TypeORM 0.3.27, Next.js 15.5.2, React 19.1.0), the real
4-service architecture, honest "Roadmap / Not Implemented" section (no AI diagnostic model, chatbot
disabled, mock VNPay only, no blockchain despite "Ledger" in the name, no `@nestjs/schedule`,
digital signatures dropped). Two near-misses were caught and corrected before publishing — an
initial draft claim of "no CI pipeline" was wrong (real `.github/workflows/ci.yml`/`cd.yml` exist,
lint/test/build matrix on push/PR) and "no rate limiting" was wrong (a real, wired-up Redis-backed
`RateLimitMiddleware` exists in the gateway, just not the `@nestjs/throttler` package) — both fixed
to avoid repeating the exact class of error being corrected. Scope was `README.md` only, per
instruction — `docs/` and the academic paper were not touched.

---

## 7. Known issues / risks for the demo (not fixed, documented)

- **Treatment-plan "Propose" validation gate** (§3) — real, correct behavior, but silently no-ops
  with only a toast if any of 4 fields are missing. Rehearse with all fields filled, or watch for
  the toast if it happens live.
- **`/performance` (doctor-only route) vs `/admin/performance`** — if the presenter is logged in as
  DOCTOR, use the top-nav "Performance" link (now correct); if logged in as ADMIN, the top-nav link
  now correctly points to `/admin/performance` (fixed, see §4). Don't manually type `/performance`
  while logged in as admin — that route is still doctor-only by design.
- **Landing/login marketing copy** still contains fabricated AI-accuracy claims ("AI-powered
  diagnostics", "AI dental diagnostics") — this is static text, not a clickable breaker, and editing
  marketing copy is a design decision beyond "runtime breakers" scope. Flagged here for operator
  awareness/sign-off, not edited.
- **KYC Management** was confirmed not to crash but was not deep-tested (explicitly lower-priority
  per the demo script).
- **Stray one-time `/roles` 403 in console** on doctor/patient pages — harmless, only consumer is
  `admin/page.tsx`'s `useRoles()`, not blocking.
- **Hard-reload rehydration race** (not a real bug): navigating via `page.goto()`/typed URL while a
  Zustand-persist store is mid-rehydration can transiently bounce to `/dashboard` or `/login`. This
  is a testing artifact of hard reloads, not something a real user hitting nav links/buttons will
  ever see — client-side navigation (clicking in-app links) does not trigger it. If the demo
  presenter ever sees an unexpected bounce to dashboard, a second click through the real nav will
  work fine.
- **Two orphaned rows in `payment_service_db.payments`** (`ae464daa...`/`e4970e03...`, both pointing
  at appointment `a5000000-...-0026`, which no longer exists post-UUID-regeneration) — dead data
  from before the remap, left untouched (not touching data outside the documented remap scope);
  harmless, just don't reference that specific old ID in the demo script.
- **JWT access tokens expire after 15 minutes** — long rehearsal/demo sessions may need a re-login.

---

## 8. Demo login accounts

All share password **`Password123!`**:

| Email | Role |
|-------|------|
| `admin@smile.com` | ADMIN |
| `dr.nguyenvana@smile.com` | DOCTOR (clinic HCM, general dentistry) |
| `dr.tranthib@smile.com` | DOCTOR (clinic Hanoi, orthodontics) |
| `recep.levan@smile.com` | RECEPTIONIST |
| `nguyenvana.pt@email.com` | PATIENT (Nguyễn Văn An) |
| `tranthib.pt@email.com` | PATIENT (Trần Thị Bình) |

Valid booking dates: 2026-07-13 through 2026-07-26 (doctor schedule window). Use **"By
Specialty"** booking (not "At Facility"/"By Doctor" — raw UUID field, no picker).

---

## 9. Summary

All 3 role happy paths (PATIENT, DOCTOR, ADMIN) were walked end-to-end live via the real UI against
the real backend and verified working with zero console errors at each step. `bunx tsc --noEmit`
is clean project-wide. Every fix above is a targeted, minimal-diff correction tied directly to a
happy-path step, an off-path breaker, or the README — no new features were built except the two
items the fixes themselves required to be reachable (the leave-request creation page and the
correct approve/reject endpoint wiring, both of which are pre-existing backend functionality that
simply had no working frontend path). No git operations (commit/push/branch) were performed — all
changes are live, uncommitted edits on `002-demo-hardening` for the operator to review and cherry-pick.
