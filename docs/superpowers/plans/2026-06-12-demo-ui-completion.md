# S.M.I.L.E Demo UI Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all frontend domains supported by the current backend backlog while preserving current auth, KYC, API contracts, and design-system work.

**Architecture:** Recover missing realized feature modules from the local `smile_tmp` reference through a read-only Git remote, then reconcile each domain against the current repository. Pages remain thin composition layers; feature folders own types, API calls, hooks, schemas, and components. Shared role-aware layout and validation utilities keep behavior consistent.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, TanStack Query, Zustand, React Hook Form, Zod, Tailwind CSS, Iconify/Lucide, Playwright.

---

### Task 1: Establish Baseline And Reference

**Files:**
- Modify: Git configuration only
- Inspect: `frontend/web/package.json`
- Inspect: `frontend/web/src/shared/api/endpoint.ts`
- Inspect: `frontend/web/src/shared/constants/routes.ts`

- [ ] Add the local reference repository as remote `demo-reference` and fetch `001-smile-to-demo`.
- [ ] Install frontend dependencies with `npm ci`.
- [ ] Run `npm run type-check` and save the missing-module/type-error baseline.
- [ ] Confirm all commands exclude `offline/**`.

### Task 2: Recover Missing Domain Modules

**Files:**
- Create: `frontend/web/src/features/appointment/**`
- Create: `frontend/web/src/features/payment/**`
- Create: `frontend/web/src/features/patient/**`
- Create: `frontend/web/src/features/schedule/**`

- [ ] Restore only these feature folders from `demo-reference/001-smile-to-demo`.
- [ ] Run `npm run type-check` to expose contract drift.
- [ ] Commit the exact reference recovery before reconciliation.

### Task 3: Shared Contracts, Access, And Validation

**Files:**
- Modify: `frontend/web/src/shared/constants/routes.ts`
- Modify: `frontend/web/src/shared/constants/roles.ts`
- Modify: `frontend/web/src/shared/api/endpoint.ts`
- Modify: `frontend/web/src/shared/components/auth/ProtectedRoute.tsx`
- Modify: `frontend/web/src/shared/components/layout/AppNavigation.tsx`
- Create: `frontend/web/src/shared/lib/validation.ts`
- Test: `frontend/web/tests/validation.test.mjs`

- [ ] Write failing tests for Vietnamese phone, future-date, and date-range validation.
- [ ] Run the tests and verify the expected failures.
- [ ] Implement the shared pure validation helpers.
- [ ] Reconcile routes/endpoints without removing current KYC contracts.
- [ ] Add explicit role/permission filtering to navigation and protected routes.
- [ ] Run tests and type-check.
- [ ] Commit shared contracts and access control.

### Task 4: Appointment And Payment

**Files:**
- Modify: `frontend/web/src/features/appointment/**`
- Modify: `frontend/web/src/features/payment/**`
- Modify: `frontend/web/src/app/(pages)/appointments/page.tsx`
- Modify: `frontend/web/src/app/(pages)/appointments/new/page.tsx`
- Modify: `frontend/web/src/app/(pages)/appointments/[id]/page.tsx`
- Modify: `frontend/web/src/app/(pages)/appointments/[id]/edit/page.tsx`
- Modify: `frontend/web/src/app/(pages)/appointments/[id]/payment/page.tsx`
- Modify: `frontend/web/src/app/(pages)/appointments/[id]/payment/callback/page.tsx`
- Test: `frontend/web/tests/appointment-rules.test.mjs`

- [ ] Write failing tests for lifecycle action visibility and booking eligibility.
- [ ] Reconcile appointment types/API/hooks with current backend endpoints and response envelopes.
- [ ] Replace the placeholder appointment page with list/calendar/filter states.
- [ ] Complete the guided booking flow and preserve phone/KYC eligibility checks.
- [ ] Add field-level validation, pending states, conflict feedback, and confirmation dialogs.
- [ ] Integrate payment initiation, callback, history, and refundable-state presentation.
- [ ] Run targeted tests, type-check, and targeted lint.
- [ ] Commit appointment and payment.

### Task 5: Patient Records

**Files:**
- Modify: `frontend/web/src/features/patient/**`
- Modify: `frontend/web/src/app/(pages)/patients/**`
- Test: `frontend/web/tests/patient-validation.test.mjs`

- [ ] Write failing tests for date-of-birth and patient-contact validation.
- [ ] Reconcile patient API/types/hooks with current backend contracts.
- [ ] Complete patient list/search/dashboard and create/edit/detail pages.
- [ ] Connect medical history, medical records, treatment timeline, images, and export.
- [ ] Restore explicit permission guards and patient-own-record restrictions.
- [ ] Add confirmation, loading, empty, error, and retry states.
- [ ] Run targeted tests, type-check, and targeted lint.
- [ ] Commit patient records.

### Task 6: Scheduling

**Files:**
- Modify: `frontend/web/src/features/schedule/**`
- Modify: `frontend/web/src/app/(pages)/schedules/**`
- Test: `frontend/web/tests/schedule-validation.test.mjs`

- [ ] Write failing tests for invalid ranges and required rejection reasons.
- [ ] Reconcile schedule API/types/hooks with current backend contracts.
- [ ] Complete doctor schedule list/calendar, personal schedule, and leave workflows.
- [ ] Add create/edit surfaces where routes are supported.
- [ ] Add conflict, pending, empty, error, and permission states.
- [ ] Run targeted tests, type-check, and targeted lint.
- [ ] Commit scheduling.

### Task 7: Clinical Examination

**Files:**
- Modify: `frontend/web/src/features/examination/**`
- Modify: `frontend/web/src/app/(pages)/examinations/page.tsx`
- Modify: `frontend/web/src/app/(pages)/examinations/new/page.tsx`
- Modify: `frontend/web/src/app/(pages)/examinations/[id]/page.tsx`
- Test: `frontend/web/tests/examination-validation.test.mjs`

- [ ] Write failing tests for vital-sign bounds, medication items, and order indication.
- [ ] Build a real examination index with status/patient/date filters.
- [ ] Complete session creation and detail workspace composition.
- [ ] Integrate symptoms, diagnoses, treatment plans, prescriptions, imaging orders, and lab orders.
- [ ] Add confirmation and permission handling for finalize/delete/send actions.
- [ ] Run targeted tests, type-check, and targeted lint.
- [ ] Commit clinical examination.

### Task 8: Dental Imaging, Clinic, And Service Integration

**Files:**
- Modify: `frontend/web/src/features/dental-image/**`
- Modify: `frontend/web/src/app/(pages)/patients/[id]/images/page.tsx`
- Modify: `frontend/web/src/features/clinic/**`
- Modify: `frontend/web/src/app/(pages)/clinics/**`
- Modify: `frontend/web/src/features/service/**`
- Modify: `frontend/web/src/app/(pages)/services/**`
- Modify: `frontend/web/src/app/(pages)/specialties/page.tsx`
- Test: `frontend/web/tests/dental-image-validation.test.mjs`

- [ ] Write failing tests for upload type/size validation.
- [ ] Connect imaging library/upload/annotation/tooth chart to patient and examination contexts.
- [ ] Reconcile clinic and service selectors used by booking and examination.
- [ ] Normalize role-aware mutation controls and operational page states.
- [ ] Run targeted tests, type-check, and targeted lint.
- [ ] Commit integration polish.

### Task 9: Full Verification And Delivery

**Files:**
- No committed QA artifacts

- [ ] Run all frontend tests.
- [ ] Run `npm run type-check`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Start the frontend on an available port.
- [ ] Use Playwright to verify desktop and mobile workflows, screenshots, console health, interaction states, and horizontal overflow.
- [ ] Inspect screenshots with `view_image`.
- [ ] Run `git diff --check`, `git diff --stat`, and `git status --short`.
- [ ] Push `feat/fe/demo-ui` only after verification; document backend/runtime blockers precisely.
