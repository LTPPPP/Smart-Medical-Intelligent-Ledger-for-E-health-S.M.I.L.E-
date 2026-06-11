# KYC Auto-Verification and UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically verify trustworthy Vietnamese citizen-ID submissions, keep uncertain cases reviewable, and improve patient/admin KYC behavior without redesigning the existing Profile Identity UI.

**Architecture:** Add a pure server-side auto-verification policy and invoke it only after OCR assessment has been persisted. Separate patient-safe KYC responses from authorized admin diagnostics, keep encrypted document storage unchanged, and extend the existing React Query APIs with a dedicated admin history workspace.

**Tech Stack:** NestJS 11, TypeORM, PostgreSQL, Jest, Next.js 15, React 19, TanStack Query, TypeScript, Docker Compose.

---

### Task 1: Decision metadata and auto-verification policy

**Files:**
- Create: `backend/service/iam-service/src/kyc-verifications/kyc-auto-verification.service.ts`
- Create: `backend/service/iam-service/src/kyc-verifications/kyc-auto-verification.service.spec.ts`
- Create: `backend/service/iam-service/src/database/user-migrations/1700000003000-AddKycDecisionMetadata.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/entities/kyc-verification.entity.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-verifications.module.ts`

- [ ] **Step 1: Write failing policy tests**

Add tests that construct a complete low-risk citizen-ID OCR result and assert `evaluate()` returns `eligible: true`. Add table-driven tests proving missing confidence, confidence below 80, wrong document type, wrong front/back side, field mismatches, `WARNING`, `FAIL`, and non-pending records return `eligible: false`.

- [ ] **Step 2: Run the policy spec and verify RED**

Run:

```powershell
npm test -- --runInBand kyc-auto-verification.service.spec.ts
```

Expected: FAIL because `KycAutoVerificationService` and decision metadata do not exist.

- [ ] **Step 3: Implement the pure policy and schema metadata**

Add:

```ts
export enum KycDecisionSource {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

export interface KycAutoVerificationDecision {
  eligible: boolean;
  reason: string;
  failedCriteria: string[];
}
```

Read `KYC_AUTO_VERIFY_CONFIDENCE` with default `80`. Require OCR `COMPLETED`, finite confidence at or above the threshold, low risk, citizen-ID document type, front/back side agreement, normalized ID/name/DOB equality, and all checks `PASS`. The migration adds nullable `decision_source` and `decision_reason`, then backfills terminal legacy decisions as `MANUAL`.

- [ ] **Step 4: Run the policy spec and verify GREEN**

Run:

```powershell
npm test -- --runInBand kyc-auto-verification.service.spec.ts
```

Expected: all policy tests PASS.

### Task 2: Poller auto-transition, idempotency, and audit

**Files:**
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-ocr-poller.service.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-ocr-poller.service.spec.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-verifications.service.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-verifications.service.spec.ts`

- [ ] **Step 1: Add failing transition tests**

Extend poller tests to assert a fully eligible result becomes `VERIFIED`, records `decision_source=AUTO`, sets `verified_at`, leaves `verified_by` null, and writes `KYC_AUTO_VERIFIED`. Add tests that warning/mismatch/failure remains `PENDING_REVIEW`, records a safe reason, and never overwrites terminal/manual decisions.

- [ ] **Step 2: Run focused specs and verify RED**

Run:

```powershell
npm test -- --runInBand kyc-ocr-poller.service.spec.ts kyc-verifications.service.spec.ts
```

Expected: FAIL on missing policy invocation and decision metadata.

- [ ] **Step 3: Implement the transition**

After OCR assessment, call the policy once. For eligible pending submissions, persist the automatic terminal decision and audit it. For ineligible submissions, keep `PENDING_REVIEW` and persist only safe failed criteria. Manual approve/reject writes `decision_source=MANUAL` and does not expose OCR internals.

- [ ] **Step 4: Run focused specs and verify GREEN**

Run:

```powershell
npm test -- --runInBand kyc-ocr-poller.service.spec.ts kyc-verifications.service.spec.ts
```

Expected: all focused tests PASS.

### Task 3: Citizen-ID-only submission, privacy-safe responses, and admin filters

**Files:**
- Modify: `backend/service/iam-service/src/kyc-verifications/dto/submit-kyc.dto.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/dto/query-kyc.dto.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/dto/kyc-response.dto.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-verifications.controller.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-verifications.controller.spec.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-verifications.service.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-verifications.service.spec.ts`

- [ ] **Step 1: Add failing API behavior tests**

Assert new submissions accept only `idFront` and `idBack`, reject unsupported document types, require exactly 12 digits, and do not persist a selfie. Assert patient current/history responses omit raw OCR payload and technical errors. Assert admin queries compose search, verification status, OCR status, decision source, date range, and pagination.

- [ ] **Step 2: Run focused specs and verify RED**

Run:

```powershell
npm test -- --runInBand kyc-verifications.controller.spec.ts kyc-verifications.service.spec.ts
```

Expected: FAIL on current selfie requirement, broad document validation, and unredacted response behavior.

- [ ] **Step 3: Implement DTO, controller, service, and response changes**

Fix `idType` to `CITIZEN_ID`, validate `idNumber` with `/^\d{12}$/`, remove selfie from the upload interceptor, and make the new submission file type `{ idFront; idBack; selfie? }` for legacy compatibility. Split patient-safe and admin response mapping. Use a TypeORM query builder for composable admin filters and masked list output.

- [ ] **Step 4: Run focused specs and IAM build**

Run:

```powershell
npm test -- --runInBand kyc-verifications.controller.spec.ts kyc-verifications.service.spec.ts
npm run build
```

Expected: focused tests PASS and IAM build exits 0.

### Task 4: Preserve Profile Identity UI while improving behavior

**Files:**
- Modify: `frontend/web/src/features/auth/types/auth.type.ts`
- Modify: `frontend/web/src/features/auth/api/auth.ts`
- Modify: `frontend/web/src/app/(pages)/(user)/profile/page.tsx`
- Create: `frontend/web/src/features/auth/utils/kyc-message.ts`
- Create: `frontend/web/src/features/auth/utils/kyc-message.test.ts`

- [ ] **Step 1: Add failing patient message tests**

Test stable mappings for invalid front/back image, invalid 12-digit number, OCR failure, manual review, rejection, and automatic verification. Explicitly assert strings containing `ECONNREFUSED`, IP addresses, ports, stack traces, or service names are never returned.

- [ ] **Step 2: Run the message test and verify RED**

Run:

```powershell
npx vitest run src/features/auth/utils/kyc-message.test.ts
```

If Vitest is not installed, run the helper through the TypeScript test harness selected from existing frontend tooling; expected initial result is failure because the helper does not exist.

- [ ] **Step 3: Implement the patient changes without altering layout tokens**

Remove the document selector and selfie upload card, keep the current Identity section structure/classes, submit `CITIZEN_ID` with two images, validate exactly 12 digits, and render safe English processing/manual/verified/rejected guidance. Continue displaying history, but never render raw backend errors.

- [ ] **Step 4: Run targeted frontend checks**

Run:

```powershell
npx eslint "src/app/(pages)/(user)/profile/page.tsx" "src/features/auth/api/auth.ts" "src/features/auth/types/auth.type.ts" "src/features/auth/utils/kyc-message.ts"
npm run type-check
```

Expected: targeted lint passes. Record any pre-existing unrelated type-check failures separately.

### Task 5: Dedicated admin KYC management workspace

**Files:**
- Create: `frontend/web/src/app/(pages)/admin/kyc-management/page.tsx`
- Create: `frontend/web/src/features/admin/components/kyc-management.tsx`
- Modify: `frontend/web/src/features/admin/types/admin.type.ts`
- Modify: `frontend/web/src/features/admin/api/admin.ts`
- Modify: `frontend/web/src/features/admin/hooks/useAdmin.ts`
- Modify: `frontend/web/src/shared/constants/routes.ts`
- Modify: `frontend/web/src/app/(pages)/admin/layout.tsx`
- Modify: `frontend/web/src/app/(pages)/admin/page.tsx`

- [ ] **Step 1: Extend typed query contracts**

Add `search`, `ocrStatus`, `decisionSource`, `fromDate`, and `toDate` to `AdminKycQueryParams`, plus decision metadata and safe diagnostics to the admin record types.

- [ ] **Step 2: Build the workspace using existing admin design**

Create `/admin/kyc-management` with summary counts, search, filters, paginated history, loading/empty/error states, and a detail dialog for front/back comparison, structured OCR checks, approve, and reject. Add a sidebar item. Replace the dashboard’s full review surface with a compact pending summary and link.

- [ ] **Step 3: Run targeted frontend checks**

Run:

```powershell
npx eslint "src/app/(pages)/admin/kyc-management/page.tsx" "src/features/admin/components/kyc-management.tsx" "src/app/(pages)/admin/page.tsx" "src/app/(pages)/admin/layout.tsx"
npm run type-check
```

Expected: targeted lint passes. Record any unrelated global type-check failures.

### Task 6: Integration, browser verification, and delivery

**Files:**
- Modify only if verification exposes a defect in files already listed above.

- [ ] **Step 1: Run complete affected-service verification**

Run:

```powershell
Set-Location backend/service/iam-service
npm test -- --runInBand
npm run build
Set-Location ../../../frontend/web
npm run type-check
npm run lint
```

Expected: IAM tests/build pass; frontend failures, if any, are proven unrelated or fixed.

- [ ] **Step 2: Start or refresh the Docker stack and smoke test**

Run the repository Compose profile described in `D:/DAI_NHAN/Skills/capstone/references/operations.md`, verify service health with `docker compose ps`, then submit front/back test images through the UI. Confirm an eligible result auto-verifies and a mismatch remains reviewable.

- [ ] **Step 3: Verify patient and admin UX in a real browser**

Check Profile Identity on desktop/mobile, ensure no selfie/document selector appears, inspect safe messages, verify admin search/filter/detail/approve/reject, and confirm no relevant console errors or exposed infrastructure text.

- [ ] **Step 4: Inspect and deliver the change**

Run:

```powershell
git diff --check
git diff --stat
git status --short
```

Stage only KYC plan/backend/frontend files, excluding the unrelated Clinical EMR and Gateway lockfiles. Commit coherent backend and frontend changes, then push the current `feat/be/nhan/kyc` branch using the configured SSH remote.
