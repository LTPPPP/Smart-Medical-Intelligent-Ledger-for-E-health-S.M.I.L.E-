# QA Recon — S.M.I.L.E backend/frontend, read-only investigation

Investigator scope: read-only. No source edits, no git writes. Commands mutating state (Docker
up, `bun install`, DB inserts, migrations) were not run — the exact command is given instead
wherever one would have been needed.

## Update — spreadsheet provenance confirmed, second workbook found

A later request asked to point recon at `docs/OneDrive_1_8-1-2026/Report5_Unit Test.xlsx`
specifically, believing it hadn't been inspected yet. It had — this is the same file §2 already
used as its source (see §2's provenance note); no other `.xlsx` exists in this location or
elsewhere in the repo (`rg --files -g '*.xlsx'` → exactly 2 files, both under
`docs/OneDrive_1_8-1-2026/`, this one and `Report5_TestReport.xlsx`, checked below). Re-parsing
`Report5_Unit Test.xlsx`'s `Functions` sheet (header row 10, rows 11–97, 87 rows) confirms it is
byte-identical in structure/content to what §2 already resolved — **no change to the 87-row
symbol map or to `qa-recon-symbols.json`**, both stand as originally reported (76 EXACT / 11
MISMAPPED / 0 RENAMED / 0 MISSING).

What §2 did NOT originally cover, and this pass adds:

- **The workbook has 90 sheets total, not just `Functions`.** `Cover` + `Functions` +
  `Statistics` are metadata; the other **87 sheets are one-per-function** (named by the
  `Functions` sheet's `Sheet Name` column), each holding that function's individual test cases
  as a decision table (one column per `UTCID##`, rows = input params + expected
  exception/message, marked with `O`). `Statistics` sheet row 99 sub-totals **431** test cases
  across all 87 sheets (`Passed: 431, Failed: 0, Untested: 0`) — not 398. §2.1 below explains why
  both numbers are legitimate (different rounds of the same document lineage).
- **`Report5_TestReport.xlsx`** (the sibling file, not previously opened) — characterized in
  §2.2 below.
- **§3 addendum** (inserted at the end of the existing §3, before §4) — a 19-string spot-check of
  claimed validation/exception messages across 9 sheets spanning Auth, User Management, Clinic,
  Appointment, Clinical, and IAM-roles, cross-referenced against the real DTOs/services. 11 of 19
  matched exactly; 8 did not, falling into two distinct failure patterns — see the addendum for
  detail. This matters directly for anyone auto-generating assertions from this spreadsheet: the
  literal `Log message` cells are **not uniformly verbatim**.

### §2.1 — Why 398 vs. 431 are both real, and where the number comes from

`Report5_TestReport.xlsx`'s `Cover` sheet (`docs/OneDrive_1_8-1-2026/Report5_TestReport.xlsx`,
row 10) is the origin of the "398" figure quoted in earlier task briefs: *"Initial system test
report — built 398 test cases across 10 features / 87 functions and executed Round 1"* (dated
2026-07-17), and cites `docs/testing/fix/SMILE_UnitTest_UC.xlsx` as its reference path — the
exact path an earlier recon brief guessed and correctly reported as absent from this checkout;
it's real, just not present at that path here, only under the OneDrive extract. Rows 11–12 of
the same sheet record Round 2 (2026-07-21, "rewrote each test case as a user flow with
step-by-step UI procedures and refreshed the expected results") and Round 3 (2026-07-23,
"regression; all three rounds executed with no pending cases; finalized results"). The **431**
figure in `Report5_Unit Test.xlsx` (version `1.2`, issue date 2026-07-23 — same date as Round 3)
is the current, final count after two rounds of test-case growth/rewrite from the original 398.
Both numbers are accurate for their respective document version; 431 is the live, current one.

### §2.2 — `Report5_TestReport.xlsx` — what it is

13 sheets: `Cover`, `Test Cases`, `Test Statistics`, then 10 feature-module sheets (`Authentication`,
`User Management`, `Clinic Management`, `Schedule Management`, `Patient Management`, `Appointment
Management`, `Service Catalog Management`, `Clinical Examination`, `Dental Imaging`, `Performance
Management`). This is a **manual UI-level test execution log**, distinct in format and purpose
from `Report5_Unit Test.xlsx`'s per-function decision tables: each module sheet lists test cases
as `Test Case ID` (e.g. `UC01_01`), `Test Case Description`, a numbered **UI click-path
procedure** ("1. Go to the Signup page. 2. Enter email: ... 8. Click the Sign Up button."),
`Expected Results`, `Actual Result`, and three execution rounds (`Round 1/2/3`, each with its own
Passed/Failed/Pending/N/A column, test date, and tester — all "ChinhBCCE181383", all three rounds).
`Test Statistics` (rows 11+) sub-totals per module — spot-checked `Authentication`: 41/41/41
passed across all 3 rounds, 0 failed/pending in any round, matching the module sheet's own
per-row Round columns. **Not independently verified by this recon** — every row across all three
rounds is self-reported "Passed" by the same single author; this recon did not re-run any of
these UI procedures to confirm. Flagging as a self-reported execution log, not corroborated
evidence, in case that distinction matters for how this document gets used or cited.

## 0. Repo state

- `git rev-parse --abbrev-ref HEAD` → `dev`
- `git status -sb` → `## dev...origin/dev`, plus:
  - `M docs/guide.md`
  - `?? docs/OneDrive_1_8-1-2026/` (contains the unit-test spreadsheet used in §2)
  - `?? docs/auth-service.mmd`, `docs/clinic-service.mmd`, `docs/cross-service-overview.mmd`, `docs/medical-service.mmd`, `docs/user-service.mmd`
  - Total uncommitted/untracked entries: 7 (`git status --porcelain | wc -l`)
- Last 15 commits (`git log --oneline -15`), HEAD → oldest:
  ```
  e96aa4c5 Merge pull request #129 from LTPPPP/feat/connect-flow
  9cf25549 chore(frontend): shorten code comments to terse labels
  074feb7d chore(payment-service,gateway-service): shorten code comments to terse labels
  f05e2140 chore(iam-service): shorten code comments to terse labels
  279cee2d chore(clinical-emr-service): shorten code comments to terse labels
  2e112380 Merge branch 'dev' into feat/connect-flow
  09981de1 Merge pull request #137 from LTPPPP/feat/phat/deploy-add-infisical
  8562d368 feat(deploy): update Infisical environment for staging and add production database configuration
  4743e8d9 Merge pull request #136 from LTPPPP/feat/retest-main-flow
  b69be694 docs: add schedule and refund plan
  4bbb89dd refactor(ui): standardize dialogs and feedback
  fe5a9820 feat(payments): add refund review flow
  7660ec91 fix(booking): use exact schedule availability
  7e10de6a feat(seed): expand clinical demo coverage
  d83155be refactor(kyc): remove PaddleOCR fallback
  ```
- `git branch --merged` (run while on `dev`) → only `* dev`. **`002-demo-hardening` is NOT merged
  into `dev`.** It is a separate local branch (`git log --oneline -3 002-demo-hardening` →
  `e2ce731d fix(demo): harden PATIENT/DOCTOR/ADMIN happy paths for pre-defense demo` →
  `787924f6 Merge pull request #87 from LTPPPP/feat/admin-flow` → `1e13fab3 fix(): db name and
  layout, middleware for role`), diverged from `dev` at `787924f6`.
- **Correction to task assumptions:** the brief stated `docs/audit/` already contains
  `demo-readiness.md`, `feature-matrix.md`, `gap-analysis.md`. On the currently-checked-out `dev`
  branch, `docs/audit/` did not exist (`ls docs/audit/` → No such file or directory) — those files
  exist only on the uncommitted-to-`dev` `002-demo-hardening` branch. Created `docs/audit/` fresh
  to hold this recon's two output files; did not touch anything from the other branch.

## 1. Test infrastructure

| Service | Runner | Config | `test` script (package.json) |
|---|---|---|---|
| iam-service | Jest 30.1.3 + ts-jest 29.4.5 | inline `"jest": {...}` block, `backend/service/iam-service/package.json` (rootDir `src`, testRegex `.*\.spec\.ts$`) | `"test": "jest"` |
| clinical-emr-service | Jest 30.1.3 + ts-jest 29.4.5 | inline block, `backend/service/clinical-emr-service/package.json` | `"test": "jest"` |
| payment-service | Jest 30.1.3 + ts-jest 29.4.5 | inline block, `backend/service/payment-service/package.json` | `"test": "jest"` |
| gateway-service | Jest ^30.1.3 + ts-jest ^29.4.5 | inline block, `backend/service/gateway-service/package.json` | `"test": "jest --passWithNoTests"` |
| frontend/web | Vitest ^3.2.4 (NOT Jest — the spreadsheet's "Test Environment Setup" note claiming Jest/ts-jest everywhere is wrong for the frontend) | `"test": "vitest run"` | `"test": "vitest run"` |

`@nestjs/testing` 11.1.6 in all 4 backend `package.json` dependencies (declared but the canonical
spec file in this repo does NOT use `Test.createTestingModule` — see below). `node --version` could
not be read in this shell (an nvm wrapper function in the shell rc crashed the invocation — not a
repo issue); `bun --version` → `1.3.14`.

### Existing spec/test files

| Service | count | 
|---|---|
| iam-service | 21 `*.spec.ts` |
| clinical-emr-service | 45 `*.spec.ts` |
| payment-service | 5 `*.spec.ts` |
| gateway-service | 9 `*.spec.ts` |
| frontend/web | 37 `*.test.ts(x)` on disk (vitest discovered 38 — see failure below) |
| **Total** | **117** |

Full file lists captured; omitted here for length — reproduce with:
`find backend/service/<svc>/src -name "*.spec.ts"` / `find frontend/web/src -name "*.test.ts*"`.

### Suite runs (read-only, `bun run test` in each service dir)

| Service | command | exit | suites | tests | time |
|---|---|---|---|---|---|
| iam-service | `bun run test` | 1 | 3 failed / 18 passed / 21 total | 89 passed, 0 failed | 7.427s |
| clinical-emr-service | `bun run test` | 0 | 1 skipped / 44 passed / 45 total | 379 passed, 6 skipped, 385 total | 9.554s |
| payment-service | `bun run test` | 0 | 5 passed / 5 total | 33 passed, 33 total | 2.813s |
| gateway-service | `bun run test` | 0 | 9 passed / 9 total | 42 passed, 42 total | 4.706s |
| frontend/web | `bun run test` | 1 | 12 failed / 26 passed / 38 total | 13 failed, 139 passed, 152 total | 4.36s |

**iam-service failure (first lines):**
```
FAIL notifications/gateways/notification-gateways.logging-privacy.spec.ts
  ● Test suite failed to run
    src/notifications/gateways/push.gateway.ts:3:26 - error TS2307: Cannot find module 'web-push'
    or its corresponding type declarations.
    3 import * as webpush from 'web-push';
FAIL notifications/notifications.service.spec.ts   — same TS2307
FAIL notifications/notifications.ownership.spec.ts — same TS2307
```
Root cause (§8): `web-push` is declared in `backend/service/iam-service/package.json:66` and
`@types/web-push` at line 82, but neither is installed (`node_modules/web-push` absent). Fix
command (not run): `cd backend/service/iam-service && bun install`.

**clinical-emr-service skipped suite:** `src/appointments/appointment-scheduling.postgres.spec.ts:1-5`
gates itself on `process.env.RUN_POSTGRES_INTEGRATION === 'true'` (`describe.skip` otherwise). This
suite INSERTs real rows against a live `core_clinic_service_db` to exercise the GIST EXCLUDE
constraints (§4) — did not run it under the hard "no state-mutating commands" rule. Command that
would run it: `RUN_POSTGRES_INTEGRATION=true CLINIC_DATABASE_HOST=localhost bun run test -- appointment-scheduling.postgres.spec.ts`
(requires the Postgres container up first — see §7, it is currently NOT running in this
environment: `docker ps` / `docker ps -a` show zero SMILE-related containers).

**frontend/web failure (first ~20 lines, transform error):**
```
⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  src/app/(pages)/appointments/[id]/payment/page.test.tsx
Error: Transform failed with 3 errors:
frontend/web/src/app/(pages)/appointments/[id]/payment/page.tsx:140:7: ERROR: Unexpected closing
"Button" tag does not match opening "button" tag
frontend/web/src/app/(pages)/appointments/[id]/payment/page.tsx:285:8: ERROR: The character "}"
is not valid inside a JSX element
frontend/web/src/app/(pages)/appointments/[id]/payment/page.tsx:286:7: ERROR: Unexpected closing
"dl" tag does not match opening "div" tag
```
This is a real, currently-existing bug, not a test artifact: `frontend/web/src/app/(pages)/appointments/[id]/payment/page.tsx:133`
opens `<button ...>` (lowercase) and `page.tsx:140` closes it `</Button>` (capitalized) — esbuild's
JSX parser then desyncs the rest of the tag tree, producing the two cascading errors at 285/286.
This blocks `vitest` from transforming the file at all (1 of the 12 failed suites) and would
equally block a production build of that route (`next build`) — not verified further since running
`next build` here would write `.next/` build artifacts (state mutation), so this is flagged, not
executed. Command to verify independently: `cd frontend/web && bunx tsc --noEmit` (JSX-in-`.tsx` is
checked by the TS compiler too) or `bun run build`.

The other 12 vitest failures (full list, `grep 'FAIL ' <run output>`):
```
 FAIL  src/app/provider/Providers.test.tsx > renders app content without mounting the removed booking chat
 FAIL  src/features/booking-chat/api.test.ts > routes requests through the gateway LangGraph proxy
 FAIL  src/features/booking-chat/conversation.test.ts > removes legacy global storage and falls back for corrupt patient storage
 FAIL  src/features/schedule/scheduleAccess.test.ts > does not expose inaccessible schedule links
 FAIL  src/shared/api/client.test.ts > apiClient 401 handling > refreshes once for concurrent 401s and replays both requests
 FAIL  src/shared/api/client.test.ts > apiClient 401 handling > clears the session when there is no refresh token
 FAIL  src/shared/api/endpoint.test.ts > API_ENDPOINTS > builds the doctor worklist appointment endpoint
 FAIL  src/shared/lib/toast.test.ts > getApiErrorMetadata > keeps only sanitized diagnostics
 FAIL  src/features/appointment/components/BookingWizard.test.tsx > DoctorSlotPicker > labels server-backed date/time availability
 FAIL  src/features/booking-chat/components/FloatingBookingChat.test.tsx > does not restore legacy global transcripts
 FAIL  src/features/booking-chat/components/FloatingBookingChat.test.tsx > shows a chat-style assistant status bubble while pending
 FAIL  src/app/(pages)/(auth)/unauthorized/page.test.tsx > explains the denied page and provides deterministic exits
 FAIL  src/app/(pages)/appointments/[id]/payment/callback/page.test.tsx > shows a failure and never redirects when signature verification fails
```
These were not individually root-caused beyond the syntax-error one above — out of scope depth for
this recon pass; each would need its own `vitest run <file> --reporter=verbose` read.

### Coverage

No coverage was generated by default `bun run test`. `test:cov` scripts exist for iam-service,
clinical-emr-service, gateway-service (`jest --coverage`, writing to `coverageDirectory:
"../coverage"` per each inline jest config) — NOT present for payment-service (no `test:cov`
script in `backend/service/payment-service/package.json`) and NOT present for frontend/web (no
`--coverage` flag wired to any script). Did not run `--coverage` variants (extra, unrequested
command) — command to reproduce: `bun run test:cov` in each of the 3 services that have it.

### Canonical passing spec template

A real, currently-passing example that mocks a TypeORM repository as a plain object (no
`Test.createTestingModule`, no `@nestjs/testing` used) —
`backend/service/clinical-emr-service/src/medical-history/medical-history.service.spec.ts` (91
lines, verbatim):

```typescript
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MedicalHistoryService } from './medical-history.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((value) => Promise.resolve(value)),
    remove: jest.fn(),
  };
}

describe('MedicalHistoryService', () => {
  const historyId = '11111111-1111-4111-8111-111111111111';
  const patientId = '22222222-2222-4222-8222-222222222222';

  function createService() {
    const repository = createRepositoryMock();
    const service = new MedicalHistoryService(repository as any);
    return { service, repository };
  }

  it('should create medical history for a patient', async () => {
    const { service, repository } = createService();
    const result = await service.create({
      patient_id: patientId,
      condition_name: 'Diabetes',
      condition_type: 'chronic',
    });
    expect(result).toEqual(
      expect.objectContaining({ patient_id: patientId, condition_name: 'Diabetes' }),
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ patient_id: patientId, condition_name: 'Diabetes' }),
    );
  });

  it('should reject changing medical history patient context', async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      history_id: historyId, patient_id: patientId, condition_name: 'Diabetes',
    });
    await expect(
      service.update(historyId, { patient_id: '33333333-3333-4333-8333-333333333333' }),
    ).rejects.toThrow(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should update medical history clinical fields', async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      history_id: historyId, patient_id: patientId, condition_name: 'Diabetes',
    });
    const result = await service.update(historyId, { notes: 'Controlled' });
    expect(result).toEqual(expect.objectContaining({ patient_id: patientId, notes: 'Controlled' }));
  });

  it('should throw not found when medical history is missing', async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue(null);
    await expect(service.findOne(historyId)).rejects.toThrow(NotFoundException);
  });
});
```

This pattern (constructor called directly with a hand-rolled jest.fn() repo mock, `as any` cast, no
NestJS DI container spin-up) is used by essentially every backend `*.service.spec.ts` in this repo
— it is the template to reuse for auto-generated unit tests, not a `Test.createTestingModule()`
pattern.

## 2. Symbol map

Source spreadsheet: **`docs/OneDrive_1_8-1-2026/Report5_Unit Test.xlsx`** (untracked, not at the
path the brief guessed — `docs/testing/fix/SMILE_UnitTest_UC.xlsx` does not exist:
`rg --files -g '*.xlsx'` found exactly 2 files, both under `docs/OneDrive_1_8-1-2026/`). Parsed with
python3 + openpyxl (openpyxl was not installed; installed via the pre-authorized
`pip install --break-system-packages openpyxl`). `Functions` sheet, header row 10, data rows
11–97 → 87 rows, matching the brief's count exactly.

### Status counts

| status | count |
|---|---|
| EXACT | 76 |
| MISMAPPED | 11 |
| RENAMED | 0 |
| MISSING | 0 |
| **Total** | **87** |

All 27 distinct claimed classes exist in the codebase (none MISSING at the class level); all 76
EXACT rows have a literal, case-sensitive method-name match on the claimed class (verified by
extracting every method (line, constructor deps, `throw new X(...)` calls) from the 27 class files
via a paren-balance-aware Python parser, then joining against the 87 claimed `Class.method()`
pairs — see `qa-recon-symbols.json` for the full per-row detail: file, line, signature,
constructorDeps, throws, notes).

### The 12 suspected MISMAPPED rows — individually confirmed/refuted

| Sheet | Verdict | Real implementation |
|---|---|---|
| Access Audit Log | **CONFIRMED mismapped** | `AuditLogsService.findAll()` — `backend/service/iam-service/src/audit-logs/audit-logs.service.ts:35` |
| View User List | **CONFIRMED mismapped** | `UserProfilesService.findAll()` — `backend/service/iam-service/src/users/user-profiles.service.ts:36` |
| View Clinic Information | **CONFIRMED mismapped** | `ClinicsService.findAll()` — `backend/service/clinical-emr-service/src/clinics/clinics.service.ts:25` |
| View Treatment Room | **CONFIRMED mismapped** | `TreatmentRoomsService.findAllByClinic()` — `backend/service/clinical-emr-service/src/treatment-rooms/treatment-rooms.service.ts:28` (note: clinic-scoped, not a bare `findAll`) |
| View Appointment | **CONFIRMED mismapped** | `AppointmentsService.findAll()` — `backend/service/clinical-emr-service/src/appointments/appointments.service.ts:528` (detail view: `findById()` at line 610) |
| Confirm Appointment | **CONFIRMED mismapped** | `AppointmentsService.confirm()` — `backend/service/clinical-emr-service/src/appointments/appointments.service.ts:745` |
| Confirm Payment | **CONFIRMED mismapped** | `PaymentsService.handleVnpayReturn()` (confirm, VNPay callback) — `backend/service/payment-service/src/payments/payments.service.ts:331`; view = `findByIdForActor()` at line 421 |
| View Profile | **CONFIRMED mismapped** | `AuthService.me()` — `backend/service/iam-service/src/auth/auth.service.ts:343` (`GET /auth/me`); extended-profile companion `UserProfilesService.findById()` at `users/user-profiles.service.ts:67` |
| Notify Shift Transfer | **CONFIRMED mismapped** | `DoctorSchedulesService.transferShift()` — `backend/service/clinical-emr-service/src/doctor-schedules/doctor-schedules.service.ts:241` |
| Initiate Payment | **CONFIRMED mismapped** | `PaymentsService.initiate()` — `backend/service/payment-service/src/payments/payments.service.ts:232` (spreadsheet pointed at `KycVerificationsService` in iam-service, wrong service entirely) |
| Refund/Cancel Payment | **CONFIRMED mismapped** | `PaymentsService.requestRefund()` — `backend/service/payment-service/src/payments/payments.service.ts:525` (`approveRefund`/`rejectRefund` at lines 565/607 complete the admin side) |
| Chatbot Support for Booking | **REFUTED — not mismapped** | The claimed `AppointmentsService.findByPatient()` (`appointments.service.ts:1028`) IS correct: `appointments.controller.ts:300` explicitly tags this route `@ApiOperation({summary: 'UC-061: Get appointments by patient (chatbot)'})`. It's the backend data endpoint an AI booking-chat orchestrator would call (gateway prefix `/api/v1/ai/booking-chat` → `backend/service/gateway-service/src/config/services.config.ts:116`, target service lives in the out-of-scope `ai/` tree per this recon's instructions). |

### All non-EXACT rows

| # | Sheet | Claimed | Status | Actual |
|---|---|---|---|---|
| 8 | View Profile | KycVerificationsService.findOne() | MISMAPPED | AuthService.auth.service.ts:343 |
| 18 | Access Audit Log | PermissionsService.findAll() | MISMAPPED | AuditLogsService.audit-logs.service.ts:35 |
| 20 | View User List | PermissionsService.findAll() | MISMAPPED | UserProfilesService.user-profiles.service.ts:36 |
| 23 | View Clinic Information | PermissionsService.findAll() | MISMAPPED | ClinicsService.clinics.service.ts:25 |
| 27 | View Treatment Room | PermissionsService.findAll() | MISMAPPED | TreatmentRoomsService.treatment-rooms.service.ts:28 |
| 36 | Notify Shift Transfer | KycVerificationsService.findOne() | MISMAPPED | DoctorSchedulesService.doctor-schedules.service.ts:241 |
| 52 | View Appointment | PermissionsService.findAll() | MISMAPPED | AppointmentsService.appointments.service.ts:528 |
| 55 | Confirm Appointment | PermissionsService.findAll() | MISMAPPED | AppointmentsService.appointments.service.ts:745 |
| 58 | Initiate Payment | KycVerificationsService.findOne() | MISMAPPED | PaymentsService.payments.service.ts:232 |
| 59 | Confirm Payment - View Payment | PermissionsService.findAll() | MISMAPPED | PaymentsService.payments.service.ts:331 |
| 60 | Refund - Cancel Payment | KycVerificationsService.findOne() | MISMAPPED | PaymentsService.payments.service.ts:525 |

Full 87-row detail (file, line, signature, constructorDeps, throws, notes for every row) is in
`docs/audit/qa-recon-symbols.json`.

## 3. Validation contract

### ValidationPipe — per service (NOT uniform — this matters for an auto-generated harness)

| Service | `whitelist` | `forbidNonWhitelisted` | `transform` | error shape | HTTP status |
|---|---|---|---|---|---|
| iam-service | `true` | **`true`** | `true` | default Nest ValidationPipe (raw `message: string[]` array, no custom `exceptionFactory`) | **400** Bad Request (default) — `backend/service/iam-service/src/main.ts:18-26` |
| clinical-emr-service | `true` | **absent (false)** | `true` | custom: `{ status: 422, errors: { field: 'joined constraint messages' } }` | **422** `UnprocessableEntityException` — `backend/service/clinical-emr-service/src/utils/validation-options.ts:21-31`, wired at `src/main.ts:43` |
| payment-service | `true` | **absent (false)** | `true` | same custom shape as clinical-emr-service (near-identical file) | **422** — `backend/service/payment-service/src/utils/validation-options.ts:21-31`, wired at `src/main.ts:26` |
| gateway-service | `true` | **`true`** | `true` | default Nest ValidationPipe (only applies to gateway's own routes, e.g. none currently use DTOs — proxied routes bypass this entirely) | **400** — `backend/service/gateway-service/src/main.ts:69-78` |

Practical effect for a test harness: an unknown field in a request body is **rejected with 400**
against iam-service/gateway-service, but **silently stripped (200/201, no error)** against
clinical-emr-service/payment-service — `forbidNonWhitelisted` is only set on 2 of 4 services.
Validation failures on clinical-emr-service/payment-service come back as
`{status:422, errors:{field: "..."}}`; on iam-service/gateway-service as Nest's default
`{statusCode:400, message: ["field constraint text", ...], error:"Bad Request"}` — different
shape entirely, so a shared assertion helper across all 4 services needs two branches.

### Exception → HTTP status (no custom global filter changes this on iam/clinical-emr/payment;
gateway has one — see below)

| Exception class | HTTP status |
|---|---|
| `NotFoundException` | 404 |
| `BadRequestException` | 400 |
| `ConflictException` | 409 |
| `ForbiddenException` | 403 |
| `UnauthorizedException` | 401 |
| `UnprocessableEntityException` | 422 |
| Custom `Error` (uncaught) | 500 (Nest default) |

Gateway has a global `@Catch()` filter — `backend/service/gateway-service/src/common/filters/gateway-exception.filter.ts:13-59` — but it only intercepts exceptions thrown by the gateway's OWN handlers (health, swagger aggregation); it does NOT rewrite responses that `http-proxy-middleware` streams back from a proxied downstream call, so a 422 from clinical-emr-service still arrives at the client as a raw 422 through the gateway.

### Error-message source

Raw string literals, not an enum or i18n keys. Confirmed via
`rg -n "incorrectPassword|notFound.:|emailNotExists" backend/service/iam-service/src --type ts -l`
→ only `auth/auth.service.ts` (e.g. `errors: { password: 'incorrectPassword' }` inline at
auth.service.ts:52-119, see qa-recon-symbols.json row 2 `throws`). No `i18n`/`locales` directory
exists anywhere under `backend/service` (`find ... -iname "*i18n*"` / `-path "*locales*"` → 0
hits). These magic strings are hand-duplicated on the frontend in
`frontend/web/src/shared/lib/toast.ts:39-92` (`PUBLIC_ERROR_MESSAGES` map, keys like
`incorrectPassword`, `accountIsINACTIVE`) — nothing enforces the two stay in sync; a backend
rename silently degrades to the frontend's generic per-status fallback (`toast.ts:94-127`).

### DTOs used by the resolved methods — class-validator decorators, file:line

44 distinct `*Dto` classes appear in the signatures resolved in §2. `@ApiProperty` (Swagger-only,
no runtime validation) decorators are omitted below; every remaining decorator is a real
class-validator constraint. Two DTOs are the spreadsheet's own literal examples (Signup/Login) —
shown first as the exact assertions the spreadsheet's error strings correspond to:

**`AuthEmailLoginDto`** (`backend/service/iam-service/src/auth/dto/auth-email-login.dto.ts`) — the
DTO behind row 2 (Login):
- `email`: `@IsEmail()`, `@IsNotEmpty()` → class-validator's default messages are `"email must be an email"` / `"email should not be empty"`, exactly the spreadsheet's asserted strings.
- `password`: `@IsNotEmpty()` → `"password should not be empty"`.

**`AuthRegisterLoginDto`** (`backend/service/iam-service/src/auth/dto/auth-register-login.dto.ts`) — row 1 (Signup):
- `email`: `@IsEmail()`
- `password`: `@MinLength(8)`
- `username`, `phone`, `fullName`: `@IsOptional()`, `@IsString()`
- `gender`: `@IsOptional()`, `@Transform(genderCodeTransformer)`, `@IsInt()`, `@IsIn(GENDER_VALUES)`

Remaining 42 DTOs (field, line, decorators):


**AuthEmailLoginDto** — `backend/service/iam-service/src/auth/dto/auth-email-login.dto.ts`

| field | line | decorators |
|---|---|---|
| email | 8 | @IsEmail(); @IsNotEmpty() |
| password | 12 | @IsNotEmpty() |

**AuthGoogleLoginDto** — `backend/service/iam-service/src/auth-google/dto/auth-google-login.dto.ts`

| field | line | decorators |
|---|---|---|
| token | 7 | @IsNotEmpty() |

**AuthRegisterLoginDto** — `backend/service/iam-service/src/auth/dto/auth-register-login.dto.ts`

| field | line | decorators |
|---|---|---|
| email | 13 | @IsEmail() |
| password | 17 | @MinLength(8) |
| username | 22 | @IsOptional(); @IsString() |
| phone | 27 | @IsOptional(); @IsString() |
| fullName | 32 | @IsOptional(); @IsString() |
| gender | 43 | @IsOptional(); @Transform(genderCodeTransformer); @IsInt(); @IsIn(GENDER_VALUES) |

**AuthUpdateDto** — `backend/service/iam-service/src/auth/dto/auth-update.dto.ts`

| field | line | decorators |
|---|---|---|
| username | 8 | @IsOptional(); @IsString() |
| email | 13 | @IsOptional(); @IsEmail() |
| phone | 18 | @IsOptional(); @IsString() |
| password | 24 | @IsOptional(); @IsString(); @MinLength(8) |
| oldPassword | 29 | @IsOptional(); @IsString() |

**BookByDoctorDto** — `backend/service/clinical-emr-service/src/appointments/dto/book-by-doctor.dto.ts`

| field | line | decorators |
|---|---|---|
| doctor_id | 15 | @IsString() |
| patient_id | 19 | @IsString() |
| clinic_id | 23 | @IsString() |
| room_id | 28 | @IsOptional(); @IsString() |
| service_id | 33 | @IsOptional(); @IsString() |
| appointment_date | 37 | @IsDateString() |
| appointment_time | 41 | @IsString() |
| duration_minutes | 47 | @IsOptional(); @IsInt(); @Min(5) |
| appointment_type | 52 | @IsOptional(); @IsEnum(AppointmentType) |
| chief_complaint | 57 | @IsOptional(); @IsString() |
| notes | 62 | @IsOptional(); @IsString() |
| created_by | 66 | @IsString() |

**BookBySpecialtyDto** — `backend/service/clinical-emr-service/src/appointments/dto/book-by-specialty.dto.ts`

| field | line | decorators |
|---|---|---|
| specialty_id | 13 | @IsString() |
| patient_id | 17 | @IsString() |
| clinic_id | 21 | @IsString() |
| preferred_date | 30 | @IsOptional(); @IsDateString() |
| preferred_time | 39 | @IsOptional(); @IsString() |
| duration_minutes | 45 | @IsOptional(); @IsInt(); @Min(5) |
| chief_complaint | 50 | @IsOptional(); @IsString() |
| notes | 55 | @IsOptional(); @IsString() |
| created_by | 59 | @IsString() |

**BookOutsideHoursDto** — `backend/service/clinical-emr-service/src/appointments/dto/book-outside-hours.dto.ts`

| field | line | decorators |
|---|---|---|
| doctor_id | 17 | @IsOptional(); @IsString() |
| specialty_id | 25 | @IsOptional(); @IsString() |
| patient_id | 29 | @IsString() |
| clinic_id | 33 | @IsString() |
| room_id | 38 | @IsOptional(); @IsString() |
| service_id | 43 | @IsOptional(); @IsString() |
| appointment_date | 47 | @IsDateString() |
| appointment_time | 51 | @IsString() |
| duration_minutes | 57 | @IsOptional(); @IsInt(); @Min(5) |
| appointment_type | 62 | @IsOptional(); @IsEnum(AppointmentType) |
| chief_complaint | 67 | @IsOptional(); @IsString() |
| outside_hours_reason | 73 | @IsString() |
| approved_by | 81 | @IsOptional(); @IsString() |
| notes | 86 | @IsOptional(); @IsString() |
| created_by | 90 | @IsString() |

**CancelAppointmentDto** — `backend/service/clinical-emr-service/src/appointments/dto/cancel-appointment.dto.ts`

| field | line | decorators |
|---|---|---|
| cancelled_by | 7 | @IsString() |
| cancellation_reason | 12 | @IsOptional(); @IsString() |

**CreateAppointmentDto** — `backend/service/clinical-emr-service/src/appointments/dto/create-appointment.dto.ts`

| field | line | decorators |
|---|---|---|
| patient_id | 17 | @IsUUID() |
| doctor_id | 21 | @IsUUID() |
| clinic_id | 25 | @IsUUID() |
| room_id | 30 | @IsOptional(); @IsUUID() |
| service_id | 35 | @IsOptional(); @IsUUID() |
| appointment_date | 39 | @IsDateString() |
| appointment_time | 43 | @IsString() |
| duration_minutes | 49 | @IsOptional(); @IsInt(); @Min(5) |
| appointment_type | 54 | @IsOptional(); @IsEnum(AppointmentType) |
| chief_complaint | 59 | @IsOptional(); @IsString() |
| notes | 64 | @IsOptional(); @IsString() |
| session_id | 72 | @IsOptional(); @IsUUID() |
| treatment_plan_id | 80 | @IsOptional(); @IsUUID() |
| is_outside_hours | 86 | @IsOptional(); @IsBoolean() |
| outside_hours_reason | 91 | @IsOptional(); @IsString() |
| approved_by | 99 | @IsOptional(); @IsUUID() |
| created_by | 103 | @IsUUID() |

**CreateClinicalOrderDto** — `backend/service/clinical-emr-service/src/clinical-orders/dto/create-clinical-order.dto.ts`

| field | line | decorators |
|---|---|---|
| session_id | 16 | @IsString(); @IsOptional() |
| record_id | 20 | @IsString(); @IsOptional() |
| patient_id | 23 | @IsString() |
| ordered_by | 26 | @IsString() |
| order_type | 29 | @IsEnum(OrderType) |
| test_type | 32 | @IsString() |
| clinical_indication | 36 | @IsString(); @IsOptional() |
| teeth_numbers | 41 | @IsArray(); @IsInt({ each: true }); @IsOptional() |
| urgency | 45 | @IsEnum(OrderPriority); @IsOptional() |
| status | 49 | @IsEnum(OrderStatus); @IsOptional() |
| ordered_date | 53 | @IsDateString(); @IsOptional() |
| scheduled_date | 57 | @IsDateString(); @IsOptional() |
| completed_date | 61 | @IsDateString(); @IsOptional() |
| result_url | 65 | @IsString(); @IsOptional() |
| report | 69 | @IsString(); @IsOptional() |

**CreateDentalImageDto** — `backend/service/clinical-emr-service/src/dental-images/dto/create-dental-image.dto.ts`

| field | line | decorators |
|---|---|---|
| patient_id | 13 | @IsString() |
| record_id | 17 | @IsString(); @IsOptional() |
| category_id | 21 | @IsString(); @IsOptional() |
| image_type | 24 | @IsString() |
| image_url | 27 | @IsString() |
| thumbnail_url | 31 | @IsString(); @IsOptional() |
| file_size_kb | 35 | @IsInt(); @IsOptional() |
| file_format | 39 | @IsString(); @IsOptional() |
| tooth_numbers | 44 | @IsArray(); @IsInt({ each: true }); @IsOptional() |
| view_angle | 48 | @IsString(); @IsOptional() |
| description | 52 | @IsString(); @IsOptional() |
| tags | 57 | @IsArray(); @IsString({ each: true }); @IsOptional() |
| metadata | 61 | @IsObject(); @IsOptional() |
| pacs_id | 65 | @IsString(); @IsOptional() |
| taken_date | 69 | @IsDateString(); @IsOptional() |
| taken_by | 73 | @IsString(); @IsOptional() |
| uploaded_by | 76 | @IsString() |
| is_archived | 80 | @IsBoolean(); @IsOptional() |

**CreateDiagnosticOrderDto** — `backend/service/clinical-emr-service/src/diagnostic-orders/dto/create-diagnostic-order.dto.ts`

| field | line | decorators |
|---|---|---|
| appointment_id | 9 | @IsString() |
| patient_id | 13 | @IsString() |
| doctor_id | 17 | @IsString() |
| order_type | 21 | @IsEnum(OrderType) |
| description | 26 | @IsOptional(); @IsString() |
| priority | 31 | @IsOptional(); @IsEnum(OrderPriority) |
| tooth_number | 36 | @IsOptional(); @IsString() |
| area | 41 | @IsOptional(); @IsString() |
| notes | 46 | @IsOptional(); @IsString() |

**CreateDoctorScheduleDto** — `backend/service/clinical-emr-service/src/doctor-schedules/dto/create-doctor-schedule.dto.ts`

| field | line | decorators |
|---|---|---|
| doctor_id | 18 | @IsString(); @IsNotEmpty() |
| clinic_id | 23 | @IsString(); @IsNotEmpty() |
| shift_id | 28 | @IsOptional(); @IsString() |
| work_date | 32 | @IsDateString() |
| room_id | 37 | @IsOptional(); @IsString() |
| max_patients | 43 | @IsOptional(); @IsInt(); @Min(1) |
| notes | 48 | @IsOptional(); @IsString() |
| status | 53 | @IsOptional(); @IsEnum(ScheduleStatus) |

**CreateMedicalHistoryDto** — `backend/service/clinical-emr-service/src/medical-history/dto/create-medical-history.dto.ts`

| field | line | decorators |
|---|---|---|
| patient_id | 5 | @IsString() |
| condition_name | 8 | @IsString() |
| condition_type | 12 | @IsString(); @IsOptional() |
| diagnosed_date | 16 | @IsDateString(); @IsOptional() |
| treatment | 20 | @IsString(); @IsOptional() |
| notes | 24 | @IsString(); @IsOptional() |
| condition_name | 30 | @IsString(); @IsOptional() |
| condition_type | 34 | @IsString(); @IsOptional() |
| diagnosed_date | 38 | @IsDateString(); @IsOptional() |
| treatment | 42 | @IsString(); @IsOptional() |
| notes | 46 | @IsString(); @IsOptional() |

**CreatePatientDto** — `backend/service/clinical-emr-service/src/patients/dto/create-patient.dto.ts`

| field | line | decorators |
|---|---|---|
| user_id | 25 | @IsUUID(); @IsOptional() |
| patient_code | 34 | @IsString(); @IsOptional() |
| full_name | 41 | @IsString() |
| date_of_birth | 49 | @IsDateString(); @IsOptional() |
| gender | 61 | @IsOptional(); @Transform(genderCodeTransformer); @IsInt(); @IsIn(GENDER_VALUES) |
| phone | 69 | @IsString(); @IsOptional() |
| email | 77 | @IsEmail(); @IsOptional() |
| address | 85 | @IsString(); @IsOptional() |
| ward | 92 | @IsString(); @IsOptional() |
| district | 99 | @IsString(); @IsOptional() |
| city | 106 | @IsString(); @IsOptional() |
| emergency_contact | 114 | @IsString(); @IsOptional() |
| emergency_phone | 122 | @IsString(); @IsOptional() |
| allergies | 131 | @IsArray(); @IsOptional() |
| chronic_diseases | 140 | @IsArray(); @IsOptional() |
| insurance_number | 147 | @IsString(); @IsOptional() |
| insurance_provider | 154 | @IsString(); @IsOptional() |

**CreatePermissionDto** — `backend/service/iam-service/src/permissions/dto/create-permission.dto.ts`

| field | line | decorators |
|---|---|---|
| permission_name | 12 | @IsNotEmpty(); @IsString(); @MaxLength(100) |
| resource | 22 | @IsOptional(); @IsString(); @MaxLength(50) |
| action | 32 | @IsOptional(); @IsString(); @MaxLength(20) |
| description | 41 | @IsOptional(); @IsString() |

**CreatePrescriptionDto** — `backend/service/clinical-emr-service/src/prescriptions/dto/create-prescription.dto.ts`

| field | line | decorators |
|---|---|---|
| session_id | 7 | @IsUUID(); @IsOptional() |
| record_id | 11 | @IsUUID(); @IsOptional() |
| patient_id | 14 | @IsUUID() |
| doctor_id | 17 | @IsUUID() |
| prescription_date | 21 | @IsDateString(); @IsOptional() |
| status | 25 | @IsString(); @IsOptional() |
| notes | 29 | @IsString(); @IsOptional() |

**CreateRecordExportDto** — `backend/service/clinical-emr-service/src/record-exports/dto/create-record-export.dto.ts`

| field | line | decorators |
|---|---|---|
| patient_id | 5 | @IsString() |
| record_id | 8 | @IsString() |
| export_type | 11 | @IsString() |
| export_format | 14 | @IsString() |
| file_url | 18 | @IsString(); @IsOptional() |
| exported_by | 21 | @IsString() |
| expires_at | 24 | @IsOptional() |

**CreateSpecialtyDto** — `backend/service/clinical-emr-service/src/specialties/dto/create-specialty.dto.ts`

| field | line | decorators |
|---|---|---|
| specialty_name | 16 | @IsString(); @MaxLength(255) |
| specialty_code | 21 | @IsString(); @MaxLength(50) |
| description | 26 | @IsOptional(); @IsString() |
| icon_url | 31 | @IsOptional(); @IsString() |
| is_active | 36 | @IsOptional(); @IsBoolean() |
| display_order | 41 | @IsOptional(); @IsInt() |
| clinic_ids | 51 | @IsOptional(); @IsArray(); @IsUUID('4', { each: true }) |

**CreateSymptomDto** — `backend/service/clinical-emr-service/src/symptoms/dto/create-symptom.dto.ts`

| field | line | decorators |
|---|---|---|
| session_id | 6 | @IsString() |
| patient_id | 10 | @IsString(); @IsOptional() |
| symptom_name | 13 | @IsString() |
| body_location | 17 | @IsString(); @IsOptional() |
| severity | 21 | @IsString(); @IsOptional() |
| onset_date | 25 | @IsDateString(); @IsOptional() |
| duration | 29 | @IsString(); @IsOptional() |
| description | 33 | @IsString(); @IsOptional() |
| recorded_by | 36 | @IsString() |

**CreateTreatmentHistoryDto** — `backend/service/clinical-emr-service/src/treatment-history/dto/create-treatment-history.dto.ts`

| field | line | decorators |
|---|---|---|
| record_id | 11 | @IsString() |
| patient_id | 14 | @IsString() |
| treatment_date | 17 | @IsDateString() |
| tooth_numbers | 21 | @IsArray(); @IsOptional() |
| procedure_code | 25 | @IsString(); @IsOptional() |
| procedure_name | 28 | @IsString() |
| description | 32 | @IsString(); @IsOptional() |
| cost | 36 | @IsNumber(); @IsOptional() |
| status | 40 | @IsString(); @IsOptional() |
| performed_by | 43 | @IsString() |

**CreateTreatmentPlanDto** — `backend/service/clinical-emr-service/src/treatment-plans/dto/create-treatment-plan.dto.ts`

| field | line | decorators |
|---|---|---|
| session_id | 8 | @IsUUID(); @IsOptional() |
| patient_id | 11 | @IsUUID() |
| record_id | 15 | @IsUUID(); @IsOptional() |
| plan_name | 19 | @IsString(); @IsOptional() |
| objectives | 23 | @IsString(); @IsOptional() |
| duration_weeks | 27 | @IsInt(); @IsOptional() |
| status | 31 | @IsString(); @IsOptional() |
| estimated_cost | 34 | @IsOptional() |
| quote_currency | 38 | @IsString(); @IsOptional() |
| quote_version | 42 | @IsString(); @IsOptional() |
| risk_disclosure | 46 | @IsString(); @IsOptional() |
| alternative_options | 50 | @IsString(); @IsOptional() |
| sent_at | 53 | @IsOptional() |
| sent_to | 57 | @IsUUID(); @IsOptional() |
| sent_via | 61 | @IsString(); @IsOptional() |
| confirmed_at | 64 | @IsOptional() |
| proposed_at | 67 | @IsOptional() |
| accepted_at | 70 | @IsOptional() |
| accepted_by | 74 | @IsUUID(); @IsOptional() |
| declined_at | 77 | @IsOptional() |
| declined_by | 81 | @IsUUID(); @IsOptional() |
| decline_reason | 85 | @IsString(); @IsOptional() |
| acceptance_scope | 89 | @IsString(); @IsOptional() |
| accepted_scope_note | 93 | @IsString(); @IsOptional() |
| created_by | 96 | @IsUUID() |

**CreateTreatmentRoomDto** — `backend/service/clinical-emr-service/src/treatment-rooms/dto/create-treatment-room.dto.ts`

| field | line | decorators |
|---|---|---|
| room_name | 17 | @IsString(); @MaxLength(100) |
| room_code | 22 | @IsString(); @MaxLength(50) |
| room_type | 26 | @IsEnum(RoomType) |
| floor_number | 31 | @IsOptional(); @IsInt() |
| equipment_list | 36 | @IsOptional(); @IsObject() |
| status | 45 | @IsOptional(); @IsEnum(RoomStatus) |

**InitiatePaymentDto** — `backend/service/payment-service/src/payments/dto/initiate-payment.dto.ts`

| field | line | decorators |
|---|---|---|
| appointmentId | 9 | @IsString(); @IsNotEmpty() |
| amount | 14 | @IsNumber(); @Min(0) |
| orderInfo | 19 | @IsOptional(); @IsString() |

**QueryAppointmentDto** — `backend/service/clinical-emr-service/src/appointments/dto/query-appointment.dto.ts`

| field | line | decorators |
|---|---|---|
| page | 24 | @IsOptional(); @Type(() => Number); @IsNumber(); @Min(1) |
| limit | 32 | @IsOptional(); @Type(() => Number); @IsNumber(); @Min(1); @Max(50) |
| patient_id | 37 | @IsOptional(); @IsString() |
| doctor_id | 42 | @IsOptional(); @IsString() |
| clinic_id | 47 | @IsOptional(); @IsString() |
| status | 52 | @IsOptional(); @IsEnum(AppointmentStatus) |
| appointment_type | 57 | @IsOptional(); @IsEnum(AppointmentType) |
| session_id | 62 | @IsOptional(); @IsUUID() |
| treatment_plan_id | 67 | @IsOptional(); @IsUUID() |
| appointment_date | 72 | @IsOptional(); @IsDateString() |
| date_from | 77 | @IsOptional(); @IsDateString() |
| date_to | 82 | @IsOptional(); @IsDateString() |
| is_outside_hours | 88 | @IsOptional(); @Type(() => Boolean); @IsBoolean() |
| payment_status | 93 | @IsOptional(); @IsEnum(PaymentStatus) |

**QueryAuditLogDto** — `backend/service/iam-service/src/audit-logs/dto/query-audit-log.dto.ts`

| field | line | decorators |
|---|---|---|
| user_id | 7 | @IsOptional(); @IsUUID() |
| action | 11 | @IsOptional(); @IsString() |
| resource | 15 | @IsOptional(); @IsString() |
| from_date | 19 | @IsOptional(); @IsDateString() |
| to_date | 23 | @IsOptional(); @IsDateString() |
| page | 29 | @IsOptional(); @Type(() => Number); @IsInt(); @Min(1) |
| limit | 35 | @IsOptional(); @Type(() => Number); @IsInt(); @Min(1) |

**QueryClinicDto** — `backend/service/clinical-emr-service/src/clinics/dto/query-clinic.dto.ts`

| field | line | decorators |
|---|---|---|
| page | 19 | @IsOptional(); @Type(() => Number); @IsNumber(); @Min(1) |
| limit | 27 | @IsOptional(); @Type(() => Number); @IsNumber(); @Min(1); @Max(50) |
| clinic_name | 32 | @IsOptional(); @IsString() |
| city | 37 | @IsOptional(); @IsString() |
| district | 42 | @IsOptional(); @IsString() |
| status | 47 | @IsOptional(); @IsEnum(ClinicStatus) |

**QueryRoleDto** — `backend/service/iam-service/src/roles/dto/query-role.dto.ts`

| field | line | decorators |
|---|---|---|
| page | 11 | @IsOptional(); @Type(() => Number); @IsNumber(); @Min(1) |
| limit | 19 | @IsOptional(); @Type(() => Number); @IsNumber(); @Min(1); @Max(100) |
| search | 24 | @IsOptional(); @IsString() |

**QueryTreatmentRoomDto** — `backend/service/clinical-emr-service/src/treatment-rooms/dto/query-treatment-room.dto.ts`

| field | line | decorators |
|---|---|---|
| page | 13 | @IsOptional(); @Type(() => Number); @IsNumber(); @Min(1) |
| limit | 21 | @IsOptional(); @Type(() => Number); @IsNumber(); @Min(1); @Max(50) |
| room_type | 26 | @IsOptional(); @IsEnum(RoomType) |
| status | 31 | @IsOptional(); @IsEnum(RoomStatus) |

**QueryUserProfileDto** — `backend/service/iam-service/src/users/dto/query-user-profile.dto.ts`

| field | line | decorators |
|---|---|---|
| page | 22 | @IsOptional(); @Type(() => Number); @IsNumber(); @Min(1) |
| limit | 30 | @IsOptional(); @Type(() => Number); @IsNumber(); @Min(1); @Max(50) |
| email | 35 | @IsOptional(); @IsString() |
| phone | 40 | @IsOptional(); @IsString() |
| full_name | 45 | @IsOptional(); @IsString() |
| gender | 57 | @IsOptional(); @Transform(genderCodeTransformer); @IsInt(); @IsIn(GENDER_VALUES) |

**RefundPaymentDto** — `backend/service/payment-service/src/payments/dto/refund-payment.dto.ts`

| field | line | decorators |
|---|---|---|
| amount | 12 | @IsOptional(); @IsNumber({ maxDecimalPlaces: 2 }); @IsPositive() |
| reason | 17 | @IsOptional(); @IsString() |

**TransferScheduleDto** — `backend/service/clinical-emr-service/src/doctor-schedules/dto/transfer-schedule.dto.ts`

| field | line | decorators |
|---|---|---|
| to_doctor_id | 8 | @IsString(); @IsNotEmpty() |
| transferred_by | 13 | @IsString(); @IsNotEmpty() |
| reason | 18 | @IsString(); @MaxLength(500) |
| notes | 24 | @IsOptional(); @IsString(); @MaxLength(1000) |

**UpdateAppointmentDto** — `backend/service/clinical-emr-service/src/appointments/dto/update-appointment.dto.ts`

| field | line | decorators |
|---|---|---|
| room_id | 18 | @IsOptional(); @IsString() |
| service_id | 23 | @IsOptional(); @IsString() |
| appointment_date | 28 | @IsOptional(); @IsDateString() |
| appointment_time | 33 | @IsOptional(); @IsString() |
| appointment_type | 38 | @IsOptional(); @IsEnum(AppointmentType) |
| duration_minutes | 44 | @IsOptional(); @IsInt(); @Min(5) |
| chief_complaint | 49 | @IsOptional(); @IsString() |
| notes | 54 | @IsOptional(); @IsString() |
| payment_status | 59 | @IsOptional(); @IsEnum(PaymentStatus) |
| payment_id | 64 | @IsOptional(); @IsString() |
| updated_by | 72 | @IsOptional(); @IsUUID() |

**UpdateClinicDto** — `backend/service/clinical-emr-service/src/clinics/dto/update-clinic.dto.ts`

| field | line | decorators |
|---|---|---|
| clinic_name | 18 | @IsOptional(); @IsString(); @MaxLength(255) |
| address | 23 | @IsOptional(); @IsString() |
| ward | 29 | @IsOptional(); @IsString(); @MaxLength(100) |
| district | 35 | @IsOptional(); @IsString(); @MaxLength(100) |
| city | 41 | @IsOptional(); @IsString(); @MaxLength(100) |
| phone | 47 | @IsOptional(); @IsString(); @MaxLength(20) |
| email | 53 | @IsOptional(); @IsEmail(); @MaxLength(255) |
| website | 59 | @IsOptional(); @IsString(); @MaxLength(255) |
| logo_url | 64 | @IsOptional(); @IsString() |
| operating_hours | 72 | @IsOptional(); @IsObject() |
| status | 77 | @IsOptional(); @IsEnum(ClinicStatus) |
| license_number | 83 | @IsOptional(); @IsString(); @MaxLength(100) |
| license_expiry | 88 | @IsOptional(); @IsDateString() |

**UpdateDentalImageDto** — `backend/service/clinical-emr-service/src/dental-images/dto/update-dental-image.dto.ts`

| field | line | decorators |
|---|---|---|

**UpdateDoctorScheduleDto** — `backend/service/clinical-emr-service/src/doctor-schedules/dto/update-doctor-schedule.dto.ts`

| field | line | decorators |
|---|---|---|
| shift_id | 9 | @IsOptional(); @IsString() |
| room_id | 14 | @IsOptional(); @IsString() |
| max_patients | 20 | @IsOptional(); @IsInt(); @Min(1) |
| status | 25 | @IsOptional(); @IsEnum(ScheduleStatus) |
| notes | 30 | @IsOptional(); @IsString() |
| changed_by | 35 | @IsOptional(); @IsString() |
| change_reason | 40 | @IsOptional(); @IsString() |

**UpdateImageAnnotationDto** — `backend/service/clinical-emr-service/src/image-annotations/dto/update-image-annotation.dto.ts`

| field | line | decorators |
|---|---|---|

**UpdateMedicalRecordDto** — `backend/service/clinical-emr-service/src/medical-records/dto/update-medical-record.dto.ts`

| field | line | decorators |
|---|---|---|

**UpdatePatientDto** — `backend/service/clinical-emr-service/src/patients/dto/update-patient.dto.ts`

| field | line | decorators |
|---|---|---|

**UpdateSpecialtyDto** — `backend/service/clinical-emr-service/src/specialties/dto/update-specialty.dto.ts`

| field | line | decorators |
|---|---|---|

**UpdateSymptomDto** — `backend/service/clinical-emr-service/src/symptoms/dto/update-symptom.dto.ts`

| field | line | decorators |
|---|---|---|

**UpdateTreatmentHistoryDto** — `backend/service/clinical-emr-service/src/treatment-history/dto/update-treatment-history.dto.ts`

| field | line | decorators |
|---|---|---|

**UpdateTreatmentPlanDto** — `backend/service/clinical-emr-service/src/treatment-plans/dto/update-treatment-plan.dto.ts`

| field | line | decorators |
|---|---|---|

**UpdateTreatmentRoomDto** — `backend/service/clinical-emr-service/src/treatment-rooms/dto/update-treatment-room.dto.ts`

| field | line | decorators |
|---|---|---|

### §3 addendum — spot-check of claimed `Log message` strings across 9 sheets, vs. real code

19 strings checked (not exhaustive — the workbook has 431 test cases across 87 sheets; this is a
diverse spread across Auth, User Management, Clinic, Appointment, Clinical, and IAM-roles, picked
to cover both custom business-exception messages and class-validator-generated ones). Method:
each string's owning sheet/field traced to its real DTO or service (grep + read), then compared
literally against either the decorator's actual class-validator default message or the exact
`throw new X('...')` call.

**11 exact matches** — spreadsheet string is verbatim what the code produces:

| sheet | claimed message | source |
|---|---|---|
| Login | `accountIs${account.status}` | `backend/service/iam-service/src/auth/auth.service.ts:68` |
| Login | `incorrectPassword` | `backend/service/iam-service/src/auth/auth.service.ts:77,95` |
| Login / Signup | `email must be an email` | `@IsEmail()` default, `email` field real on both DTOs |
| Login / Signup | `email should not be empty` | `@IsNotEmpty()` default, `email` field real on both DTOs |
| Lock-Ban User Account | `reason should not be empty` | `@IsNotEmpty()`, `LockAccountDto.reason` — `backend/service/iam-service/src/accounts/dto/lock-account.dto.ts:6-8` |
| Create Treatment Plan | `Treatment plan patient does not match session` | `backend/service/clinical-emr-service/src/treatment-plans/treatment-plans.service.ts:67` |
| Create Electronic Prescription | `A session_id is required to create a prescription.` | `backend/service/clinical-emr-service/src/prescriptions/prescriptions.service.ts:40` |
| Create Electronic Prescription | `New prescriptions must start as draft.` | `backend/service/clinical-emr-service/src/prescriptions/prescriptions.service.ts:47` |
| Chatbot Support for Booking | `The authenticated user can only read their own appointment records.` | `backend/service/clinical-emr-service/src/appointments/appointments.service.ts:543,1037` |
| Chatbot Support for Booking | `A trusted patient or staff role is required for patient appointment records.` | `backend/service/clinical-emr-service/src/appointments/appointments.service.ts:1042` |
| Assign Role | `Role already assigned to this user` (ConflictException) | `backend/service/iam-service/src/user-roles/user-roles.service.ts:22` |

**8 mismatches, two distinct failure patterns** — matters for anyone codegening assertions
straight from this workbook:

**Pattern 1 — paraphrased, not literal, for validators with a computed default message.**
class-validator generates these from `$property` + the decorator's constraint at runtime; they
were never a hardcoded string in source, so a literal-string grep will never find the
spreadsheet's exact wording. Real defaults, no `message:` override present in any of these 4
DTOs:

| sheet | spreadsheet says | decorator (file:line) | actual class-validator default |
|---|---|---|---|
| Signup | `password shorter than 8` | `@MinLength(8)` on `password` — `backend/service/iam-service/src/auth/dto/auth-register-login.dto.ts:16` | `password must be longer than or equal to 8 characters` |
| Signup | `gender not in enum` | `@IsIn(GENDER_VALUES)` on `gender` (not `@IsEnum`) — same file:43 | `gender must be one of the following values: ...` |
| Add Treatment Room | `room_type not in enum` | `@IsEnum(RoomType)` — `backend/service/clinical-emr-service/src/treatment-rooms/dto/create-treatment-room.dto.ts:25-26` | `room_type must be a valid enum value` |
| Enter Symptoms | `onset_date invalid date` | `@IsDateString()` — `backend/service/clinical-emr-service/src/symptoms/dto/create-symptom.dto.ts:23-24` | `onset_date must be a valid ISO 8601 date string` |

**Pattern 2 — claimed validation that would never actually fire, because the real DTO field is
missing `@IsNotEmpty()` (or doesn't exist at all).** These are the more consequential findings —
not wording drift, a behavioral gap: submitting an empty string for these fields passes real
validation today.

- **Cancel Appointment** — sheet claims `cancelled_by should not be empty`. Real
  `CancelAppointmentDto.cancelled_by` (`backend/service/clinical-emr-service/src/appointments/dto/cancel-appointment.dto.ts:6-7`)
  has only `@IsString()`, no `@IsNotEmpty()` — an empty string satisfies `@IsString()`, so this
  exception would never throw as described.
- **Enter Symptoms** — sheet claims `session_id should not be empty`, `symptom_name should not
  be empty`, `recorded_by should not be empty` (3 of the 4 error rows on this sheet). Real
  `CreateSymptomDto` (`backend/service/clinical-emr-service/src/symptoms/dto/create-symptom.dto.ts:6-7,13-14,32-33`)
  has `@IsString()` only on all three fields, same gap.
- **Lock-Ban User Account** — sheet claims `accountId should not be empty` and `lockedBy should
  not be empty`. Real `LockAccountDto` (`backend/service/iam-service/src/accounts/dto/lock-account.dto.ts`)
  has exactly one field, `reason` — there is no `accountId` or `lockedBy` property on this DTO at
  all (the account ID is a route param, not validated by this class), so these two claimed
  validation errors don't correspond to any real DTO-level check.

**Net takeaway for the auto-generated harness:** don't derive assertion strings from this
spreadsheet's `Log message` column by literal copy — for `@IsNotEmpty`/`@IsEmail` cases it is
reliable, but for `@MinLength`/`@IsEnum`/`@IsIn`/`@IsDateString` cases it paraphrases, and for at
least 3 fields across 2 sheets it asserts a validation path that the current DTOs don't actually
implement. Read the real decorator (or absence of one) per-field before generating each
assertion; this spot-check (19 of 431) is not exhaustive, so treat any given un-checked row with
the same caution until verified the same way.

## 4. State machines (from code)

### appointment status — full FSM, explicit transition table

Enum: `AppointmentStatus` — `backend/service/clinical-emr-service/src/utils/enums/appointment-status.enum.ts:1-9`
(`SCHEDULED | CONFIRMED | CHECKED_IN | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW`).

Transition table (`backend/service/clinical-emr-service/src/appointments/appointment-status.machine.ts:5-28`,
enforced by `assertTransition()` at lines 34-48, called from `AppointmentsService.changeStatus()` at
`appointments.service.ts:863`):

```
SCHEDULED  → CONFIRMED, CHECKED_IN, CANCELLED, NO_SHOW
CONFIRMED  → CHECKED_IN, CANCELLED, NO_SHOW
CHECKED_IN → IN_PROGRESS, CANCELLED
IN_PROGRESS→ COMPLETED, CANCELLED
COMPLETED  → (terminal)
CANCELLED  → (terminal)
NO_SHOW    → (terminal)
```
Same-state transition (`from === to`) throws `ConflictException("Appointment is already '{from}'.")`
before the table lookup even runs (`appointment-status.machine.ts:35-37`). Illegal transitions throw
`ConflictException` listing the allowed set (lines 39-46).

**3 GIST EXCLUDE constraints** — canonical current definition, `database/clinical-emr-service/clinic-service/schema.sql:234-241`
(created by migration `backend/service/clinical-emr-service/src/database/clinic-migrations/1730000000002-CanonicalAppointmentAvailability.ts:97-124`,
column widths later tightened by `.../1730000000008-TightenColumnWidths.ts:93-186` which drops and
recreates all three verbatim):
```sql
CONSTRAINT appointments_doctor_occupied_excl  EXCLUDE USING gist (doctor_id  WITH =, occupied_during WITH &&) WHERE (status IN ('scheduled','confirmed','checked_in','in_progress'))
CONSTRAINT appointments_patient_occupied_excl EXCLUDE USING gist (patient_id WITH =, occupied_during WITH &&) WHERE (status IN ('scheduled','confirmed','checked_in','in_progress'))
CONSTRAINT appointments_room_occupied_excl    EXCLUDE USING gist (room_id    WITH =, occupied_during WITH &&) WHERE (status IN ('scheduled','confirmed','checked_in','in_progress'))
```
`occupied_during` is a generated `TSRANGE` column (`schema.sql:223-229`) computed from
`appointment_date + appointment_time` through `+ duration_minutes` (default 30). **Code-documented
drift**: `schema.sql:221-222` carries an explicit comment — "entity drift — `occupied_during` and
the three EXCLUDE constraints are not mapped in `AppointmentEntity`; they exist only at DB level" —
meaning a TypeORM `.save()` triggers these constraints implicitly (Postgres enforces them
regardless of what the entity maps), but nothing in application code can introspect or unit-test
them without a raw SQL / live-DB integration test. That's exactly why
`appointment-scheduling.postgres.spec.ts` exists and talks to `pg.Pool` directly instead of the
TypeORM repository (§1).

**Idempotency-key mechanism**: table `idempotency_keys` (migration
`backend/service/clinical-emr-service/src/database/clinic-migrations/1730000000001-CreateIdempotencyKeys.ts:7-17`
— PK `idempotency_key varchar(255)`, `status` default `'in_progress'`, `expires_at`). Enforced by
`IdempotencyInterceptor` — `backend/service/clinical-emr-service/src/appointments/idempotency.interceptor.ts:21-60` —
applied via `@UseInterceptors(IdempotencyInterceptor)` at the top of `AppointmentsController`
(`appointments.controller.ts:44`). Only actlooks at the `Idempotency-Key` request header on
mutating verbs (`POST/PUT/PATCH/DELETE`, line 18). Behavior: existing key + `COMPLETED` + not
expired → replays the cached `response_body`/`response_status` (no re-execution); existing key +
`IN_PROGRESS` + not expired → `ConflictException('A request with this Idempotency-Key is already
being processed.')` (line 51-54); expired key → deletes and re-processes. TTL 24h (`TTL_MS`, line
17).

### examination session status — NOT an enum

`status: string` — `backend/service/clinical-emr-service/src/examination-sessions/entities/examination-session.entity.ts:58`.
No `union type`/enum backs this column; the only type safety is in
`examination-sessions.service.ts`: `activeStatuses = ['in_progress']` (line 23),
`lockedStatuses = ['completed', 'signed']` (line 24). Observed literal values actually assigned in
code: `'in_progress'` (default on create, line 105), `'completed'` (set by finalize, line 261).
`'signed'` appears in `lockedStatuses` but **no assignment site was found** in this service —
likely a dead/future state (digital signatures are out of scope per this repo's project docs).
Guard: create/update reject unless `status === 'in_progress'` (lines 50, 407).

### treatment plan status

Enum `PlanStatus` — `backend/service/clinical-emr-service/src/utils/enums/plan-status.enum.ts:2-12`:
`DRAFT | SENT | PROPOSED | ACCEPTED | PARTIALLY_ACCEPTED | DECLINED | IN_PROGRESS | COMPLETED |
CANCELLED`. Guards live in `treatment-plans.service.ts` as named `assert*` methods (not a single
transition table): `assertStatusUpdateAllowed` (line 372), `assertAcceptedPlanUpdate` (line 408),
`assertPlanEditable`/`assertPlanUpdatable` (lines 304/320) — `propose()` (line 192), `accept()`
(line 224), `decline()` (line 267) are the explicit lifecycle-mutating methods.

### prescription status

Enum `PrescriptionStatus` — `.../utils/enums/prescription-status.enum.ts:1-6`: `DRAFT | ISSUED |
DISPENSED | CANCELLED`. `PrescriptionsService.issue()` (line 130) and `.cancel()` (line 154) are
the lifecycle methods; `assertPrescriptionMutable`/`assertPrescriptionSessionMutable` (lines
225/234) gate edits.

### clinical order status

Enum `OrderStatus` — `.../utils/enums/order-status.enum.ts:1-6`: `ORDERED | IN_PROGRESS |
COMPLETED | CANCELLED`. Used by both `ClinicalOrderEntity.status` (`clinical-orders/entities/clinical-order.entity.ts:63`)
and (separately declared, same values) diagnostic orders.

### dental image status — DOES NOT EXIST as a state machine

`DentalImageEntity` (`dental-images/entities/dental-image.entity.ts:14-88`) has **no status
column**. The closest concept is a one-way boolean: `is_archived: boolean` (default `false`, line
81-82). `DentalImagesService.archive()` (line 109-114) sets it `true`; nothing sets it back to
`false` — no unarchive path exists in this service. `findArchived()` (line 86) filters
`WHERE is_archived = true`. Do not model this as an enum in generated tests — model it as a single
boolean flip with no reverse transition.

### payment status — TWO DIFFERENT ENUMS, different value sets, cross-service

`backend/service/clinical-emr-service/src/utils/enums/payment-status.enum.ts:1-6` (denormalized
copy on the `appointments.payment_status` column):
`UNPAID | PAID | PARTIALLY_PAID | REFUNDED`.

`backend/service/payment-service/src/payments/payment-status.enum.ts:2-7` (the actual payment
record's status, source of truth):
`PENDING | PAID | FAILED | REFUNDED`.

These are NOT the same enum — `UNPAID`/`PARTIALLY_PAID` exist only in clinical-emr-service;
`PENDING`/`FAILED` exist only in payment-service. Whatever process keeps
`appointments.payment_status` synced with the real payment record (webhook / callback in
`PaymentsService.handleVnpayReturn`, `payments.service.ts:331`) has to translate between two
disjoint vocabularies by hand — a real cross-service drift risk, and exactly the kind of thing an
auto-generated test should assert explicitly (e.g., "a `FAILED` payment-service status must map to
some defined clinical-emr `payment_status`, not silently pass through the string").

### refund status

Enum `RefundStatus` — `backend/service/payment-service/src/payments/refund-status.enum.ts:2-9`:
`REQUESTED | UNDER_REVIEW | APPROVED | REFUNDING | REFUNDED | REJECTED` (note: UPPERCASE values,
unlike every other enum in this codebase which uses lowercase string values — inconsistent
convention, not a bug). `OPEN_REFUND_STATES` (lines 12-17) and `REVIEWABLE_REFUND_STATES` (lines
20-23) are the two derived subsets guards check against; `PaymentsService.requestRefund()` (line
525), `.approveRefund()` (565), `.rejectRefund()` (607) are the lifecycle methods.

### leave request (doctor leave) status

Enum `ApprovalStatus` — `backend/service/clinical-emr-service/src/utils/enums/approval-status.enum.ts:1-5`:
`PENDING | APPROVED | REJECTED` (lowercase values `'pending'|'approved'|'rejected'`). Single generic
`PATCH /doctor-leaves/:id` endpoint (`UpdateDoctorLeaveDto`) drives all transitions — there are no
separate `/approve`/`/reject` sub-routes in this service (confirms the finding from the prior
demo-hardening session's fix to the frontend, which had been calling a nonexistent sub-route).

## 5. HTTP surface

Route-prefix mapping through the gateway (`:8080`) — `backend/service/gateway-service/src/config/services.config.ts:29-134`:

| gateway prefix(es) | target service | target default (overridden by `backend/service/gateway-service/.env:7-9`) | `pathRewrite` |
|---|---|---|---|
| `/api/v1/auth` | iam-service | `http://localhost:3001` (stale default) → actual `http://localhost:8081` | `^/api/v1/auth` → `/v1/auth` |
| `/api/v1/{accounts,user-profiles,roles,permissions,user-roles,kyc,audit-logs,notifications,notification-templates,notification-preferences}` | iam-service | same as above | `^/api/v1` → `/v1` |
| `/api/v1/{clinics,treatment-rooms,specialties,service-categories,services,doctor-specialties,work-shifts,doctor-schedules,doctor-leaves,clinic-services,appointments,reports,diagnostic-orders}` | clinical-emr-service | `http://localhost:8082` | none (kept as-is) — these controllers all declare `version:'1'` |
| `/api/v1/{patients,patient-representatives,medical-records,dental-images,image-categories,image-annotations,examination-sessions,clinical-orders,symptoms,treatment-plans,prescriptions,dental-charts,diagnoses,treatment-history,prescription-items,lab-test-results,pacs-sync-logs,record-exports}` | clinical-emr-service | same | `^/api/v1` → `/api` — these controllers declare NO version (verified: `PatientsController` = `@Controller('patients')`, no `version`, vs. `ClinicsController` = `@Controller({path:'clinics',version:'1'})`) |
| `/api/v1/ai/booking-chat` | booking-langgraph-service (OUT OF SCOPE, only mounted if `AI_ROUTES_ENABLED=true`, `services.config.ts:130-134`) | `http://localhost:8030` | strips the whole prefix |
| `/api/v1/payments` | payment-service | `http://localhost:3006` | none |

**Absolute URL recipe through the gateway**: `http://localhost:8080` + gateway prefix, e.g.
`POST http://localhost:8080/api/v1/auth/email/login`,
`GET http://localhost:8080/api/v1/patients` (note: NOT `/api/v1/patients` on the service itself —
the service's own bind is `http://localhost:8082/api/patients`, no `v1`).

**Direct-to-service ports** (bypassing gateway, from `backend/service/<svc>/.env:2` `APP_PORT`):
iam-service `:8081` (no global prefix — routes are bare `/v1/...`), clinical-emr-service `:8082`
(`apiPrefix='api'`, routes `/api/...` or `/api/v1/...` depending on per-controller `version` tag),
payment-service `:3006` (`apiPrefix='api'`, all controllers versioned → `/api/v1/payments/...`),
gateway `:8080`.

**Full per-service route tables** (356 routes across 47 controllers, extracted from every
`@Get/@Post/@Patch/@Put/@Delete` + its class/method `@UseGuards`/`@Roles`/`@Public` + request DTO
+ `@HttpCode`):


### iam-service


**AccountsController** — `backend/service/iam-service/src/accounts/accounts.controller.ts` — base path: `accounts`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `AccountsController#create` (L51) | (none found) | - | CREATED |
| GET | `me` | `AccountsController#me` (L62) | AuthGuard('jwt' [ADMIN] | - | OK/200 (default) |
| PATCH | `me` | `AccountsController#updateMe` (L73) | AuthGuard('jwt' | - | OK/200 (default) |
| POST | `me/avatar/signature` | `AccountsController#getAvatarSignature` (L114) | (none found) | - | CREATED |
| POST | `me/avatar/confirm` | `AccountsController#confirmAvatar` (L126) | AuthGuard('jwt' | - | CREATED |
| DELETE | `me` | `AccountsController#removeMe` (L155) | (none found) | - | NO_CONTENT |
| POST | `me/phone/send-otp` | `AccountsController#sendPhoneOtp` (L164) | AuthGuard('jwt' | - | OK |
| POST | `me/verify-phone` | `AccountsController#verifyPhone` (L173) | AuthGuard('jwt' | - | OK |
| GET | `:id` | `AccountsController#findById` (L184) | AuthGuard('jwt' | - | OK/200 (default) |
| PATCH | `:id` | `AccountsController#update` (L194) | AuthGuard('jwt' [ADMIN,DOCTOR] | - | OK/200 (default) |
| DELETE | `:id` | `AccountsController#remove` (L204) | AuthGuard('jwt' [ADMIN] | - | NO_CONTENT |
| POST | `:id/lock` | `AccountsController#lockAccount` (L214) | AuthGuard('jwt' [ADMIN] | - | OK |
| POST | `:id/unlock` | `AccountsController#unlockAccount` (L239) | (none found) | - | OK |
| POST | `:id/deactivate` | `AccountsController#deactivateAccount` (L259) | (none found) | - | OK |
| POST | `:id/reactivate` | `AccountsController#reactivateAccount` (L281) | (none found) | - | OK |
| POST | `:id/reset-password` | `AccountsController#resetPassword` (L301) | (none found) | - | OK |
| POST | `:id/force-logout` | `AccountsController#forceLogout` (L327) | (none found) | - | OK |

**AuditLogsController** — `backend/service/iam-service/src/audit-logs/audit-logs.controller.ts` — base path: `audit-logs`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `AuditLogsController#create` (L23) | AuthGuard('jwt' [ADMIN] | - | CREATED |
| GET | `(root)` | `AuditLogsController#findAll` (L31) | AuthGuard('jwt' [ADMIN] | - | OK |
| GET | `:id` | `AuditLogsController#findOne` (L69) | AuthGuard('jwt' [ADMIN] | - | OK |

**AuthGoogleController** — `backend/service/iam-service/src/auth-google/auth-google.controller.ts` — base path: `auth/google`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `AuthGoogleController#login` (L29) | (none found) | AuthGoogleLoginDto | OK |

**AuthController** — `backend/service/iam-service/src/auth/auth.controller.ts` — base path: `auth`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `email/login` | `AuthController#login` (L43) | (none found) | AuthEmailLoginDto | OK |
| POST | `email/register` | `AuthController#register` (L61) | (none found) | - | OK |
| POST | `email/confirm` | `AuthController#confirmEmail` (L80) | (none found) | - | OK |
| POST | `forgot/password` | `AuthController#forgotPassword` (L87) | (none found) | - | OK |
| POST | `reset/password` | `AuthController#resetPassword` (L94) | (none found) | - | OK |
| GET | `me` | `AuthController#me` (L105) | AuthGuard('jwt') | - | OK |
| POST | `refresh` | `AuthController#refresh` (L122) | AuthGuard('jwt-refresh') | - | OK |
| POST | `logout` | `AuthController#logout` (L133) | AuthGuard('jwt') | - | NO_CONTENT |
| PATCH | `me` | `AuthController#update` (L155) | AuthGuard('jwt') | AuthUpdateDto | OK |
| DELETE | `me` | `AuthController#delete` (L166) | AuthGuard('jwt') | - | NO_CONTENT |

**HealthController** — `backend/service/iam-service/src/health/health.controller.ts` — base path: `health`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| GET | `(root)` | `HealthController#check` (L19) | (none found) | - | OK |

**KycVerificationsController** — `backend/service/iam-service/src/kyc-verifications/kyc-verifications.controller.ts` — base path: `kyc`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `me/submit` | `KycVerificationsController#submitMine` (L55) | AuthGuard('jwt' [...KYC_STAFF_ROLES] | - | CREATED |
| GET | `me` | `KycVerificationsController#findMine` (L95) | AuthGuard('jwt' [...KYC_STAFF_ROLES] | - | OK/200 (default) |
| GET | `me/history` | `KycVerificationsController#findMineHistory` (L104) | AuthGuard('jwt' [...KYC_STAFF_ROLES] | - | OK/200 (default) |
| GET | `(root)` | `KycVerificationsController#findAll` (L113) | AuthGuard('jwt' [ADMIN,RECEPTIONIST] | - | OK/200 (default) |
| GET | `stats` | `KycVerificationsController#getStats` (L121) | AuthGuard('jwt' [ADMIN] | - | OK/200 (default) |
| GET | `users/:userId/status` | `KycVerificationsController#getBookingEligibility` (L126) | (none found) | - | OK/200 (default) |
| GET | `:id` | `KycVerificationsController#findOne` (L139) | AuthGuard('jwt' [ADMIN,RECEPTIONIST] | - | OK/200 (default) |
| GET | `:id/files/:kind` | `KycVerificationsController#getFile` (L147) | AuthGuard('jwt' [ADMIN] | - | OK/200 (default) |
| POST | `:id/approve` | `KycVerificationsController#approve` (L170) | AuthGuard('jwt' [ADMIN] | - | CREATED |
| POST | `:id/reject` | `KycVerificationsController#reject` (L179) | AuthGuard('jwt' [ADMIN,RECEPTIONIST] | - | CREATED |

**NotificationsController** — `backend/service/iam-service/src/notifications/notifications.controller.ts` — base path: `notifications`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `NotificationsController#createNotification` (L67) | (none found) | - | CREATED |
| GET | `(root)` | `NotificationsController#findAllNotifications` (L75) | InternalServiceGuard | - | OK |
| GET | `vapid-public-key` | `NotificationsController#getVapidPublicKey` (L92) | AuthGuard('jwt' | - | OK |
| POST | `push-subscriptions` | `NotificationsController#registerPushSubscription` (L101) | (none found) | - | CREATED |
| DELETE | `push-subscriptions` | `NotificationsController#unregisterPushSubscription` (L118) | AuthGuard('jwt' | - | NO_CONTENT |
| GET | `:id` | `NotificationsController#findOneNotification` (L132) | AuthGuard('jwt'+AuthGuard('jwt' | - | OK |
| PATCH | `:id` | `NotificationsController#updateNotification` (L145) | AuthGuard('jwt' | - | OK |
| DELETE | `:id` | `NotificationsController#removeNotification` (L163) | AuthGuard('jwt' | - | NO_CONTENT |
| POST | `:id/read` | `NotificationsController#markAsRead` (L175) | AuthGuard('jwt' | - | NO_CONTENT |
| GET | `user/:userId` | `NotificationsController#findNotificationsByUser` (L188) | AuthGuard('jwt' | - | OK |
| GET | `user/:userId/unread-count` | `NotificationsController#getUnreadCount` (L207) | AuthGuard('jwt' | - | OK |
| POST | `(root)` | `NotificationsController#createTemplate` (L228) | InternalServiceGuard | - | CREATED |
| GET | `(root)` | `NotificationsController#findAllTemplates` (L235) | (none found) | - | OK |
| GET | `code/:code` | `NotificationsController#findTemplateByCode` (L242) | (none found) | - | OK |
| GET | `:id` | `NotificationsController#findOneTemplate` (L250) | (none found) | - | OK |
| PATCH | `:id` | `NotificationsController#updateTemplate` (L258) | (none found) | - | OK |
| DELETE | `:id` | `NotificationsController#removeTemplate` (L269) | (none found) | - | NO_CONTENT |
| POST | `(root)` | `NotificationsController#createPreference` (L287) | AuthGuard('jwt' | - | CREATED |
| GET | `user/:userId` | `NotificationsController#findPreferencesByUser` (L300) | (none found) | - | OK |
| PATCH | `:id` | `NotificationsController#updatePreference` (L314) | (none found) | - | OK |
| DELETE | `:id` | `NotificationsController#removePreference` (L330) | (none found) | - | NO_CONTENT |

**PermissionsController** — `backend/service/iam-service/src/permissions/permissions.controller.ts` — base path: `permissions`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `PermissionsController#create` (L38) | AuthGuard('jwt' [ADMIN] | - | CREATED |
| GET | `(root)` | `PermissionsController#findAll` (L79) | AuthGuard('jwt' [ADMIN] | - | OK |
| GET | `role/:roleId` | `PermissionsController#getPermissionsByRole` (L87) | AuthGuard('jwt' [ADMIN] | - | OK |
| POST | `role/:roleId` | `PermissionsController#assignToRole` (L96) | AuthGuard('jwt' [ADMIN] | - | CREATED |
| DELETE | `role/:roleId/:permissionId` | `PermissionsController#revokeFromRole` (L126) | AuthGuard('jwt' [ADMIN] | - | NO_CONTENT |
| GET | `:id` | `PermissionsController#findOne` (L145) | AuthGuard('jwt' [ADMIN] | - | OK |
| PATCH | `:id` | `PermissionsController#update` (L154) | AuthGuard('jwt' [ADMIN] | - | OK |
| DELETE | `:id` | `PermissionsController#remove` (L185) | AuthGuard('jwt' [ADMIN] | - | NO_CONTENT |

**RolesController** — `backend/service/iam-service/src/roles/roles.controller.ts` — base path: `roles`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `RolesController#create` (L36) | AuthGuard('jwt' [ADMIN] | - | CREATED |
| GET | `(root)` | `RolesController#findAll` (L54) | AuthGuard('jwt' [ADMIN] | - | OK |
| GET | `:id` | `RolesController#findOne` (L61) | AuthGuard('jwt' [ADMIN] | - | OK |
| PATCH | `:id` | `RolesController#update` (L70) | AuthGuard('jwt' [ADMIN] | - | OK |
| DELETE | `:id` | `RolesController#remove` (L89) | AuthGuard('jwt' [ADMIN] | - | NO_CONTENT |

**UserRolesController** — `backend/service/iam-service/src/user-roles/user-roles.controller.ts` — base path: `user-roles`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| GET | `user/:userId` | `UserRolesController#getRolesByUser` (L35) | AuthGuard('jwt' [ADMIN] | - | OK |
| POST | `user/:userId` | `UserRolesController#assignRole` (L44) | AuthGuard('jwt' [ADMIN] | - | CREATED |
| DELETE | `user/:userId/role/:roleId` | `UserRolesController#revokeRole` (L63) | AuthGuard('jwt' [ADMIN] | - | NO_CONTENT |
| GET | `role/:roleId` | `UserRolesController#getUsersByRole` (L82) | AuthGuard('jwt' [ADMIN] | - | OK |

**UserProfilesController** — `backend/service/iam-service/src/users/user-profiles.controller.ts` — base path: `user-profiles`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `UserProfilesController#create` (L37) | (none found) | - | CREATED |
| GET | `(root)` | `UserProfilesController#findAll` (L47) | AuthGuard('jwt' [ADMIN] | - | OK |
| GET | `:id` | `UserProfilesController#findOne` (L79) | (none found) | - | OK |
| PATCH | `:id` | `UserProfilesController#update` (L94) | (none found) | - | OK |
| DELETE | `:id` | `UserProfilesController#remove` (L105) | AuthGuard('jwt' [ADMIN] | - | NO_CONTENT |
| POST | `:id/ban` | `UserProfilesController#ban` (L116) | AuthGuard('jwt' [ADMIN] | - | OK |
| POST | `:id/unban` | `UserProfilesController#unban` (L142) | (none found) | - | OK |


### clinical-emr-service


**AppointmentsController** — `backend/service/clinical-emr-service/src/appointments/appointments.controller.ts` — base path: `appointments`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `AppointmentsController#create` (L58) | JwtAuthGuard | - | CREATED |
| POST | `by-clinic` | `AppointmentsController#createByClinic` (L65) | JwtAuthGuard | - | CREATED |
| POST | `by-specialty` | `AppointmentsController#createBySpecialty` (L79) | JwtAuthGuard | - | CREATED |
| POST | `by-doctor` | `AppointmentsController#createByDoctor` (L96) | JwtAuthGuard | - | CREATED |
| POST | `book-option` | `AppointmentsController#createByOption` (L110) | JwtAuthGuard | - | CREATED |
| POST | `outside-hours` | `AppointmentsController#createOutsideHours` (L126) | JwtAuthGuard | - | CREATED |
| GET | `(root)` | `AppointmentsController#findAll` (L142) | JwtAuthGuard | - | OK |
| GET | `availability` | `AppointmentsController#findAvailability` (L149) | JwtAuthGuard | - | OK |
| GET | `code/:code` | `AppointmentsController#findByCode` (L159) | JwtAuthGuard | - | OK |
| PATCH | `:id/reschedule-option` | `AppointmentsController#rescheduleByOption` (L178) | JwtAuthGuard | - | OK |
| PATCH | `:id` | `AppointmentsController#update` (L197) | JwtAuthGuard | - | OK |
| PATCH | `:id/status` | `AppointmentsController#changeStatus` (L214) | JwtAuthGuard | - | OK |
| PATCH | `:id/confirm` | `AppointmentsController#confirm` (L231) | JwtAuthGuard | - | OK |
| PATCH | `:id/cancel` | `AppointmentsController#cancel` (L239) | JwtAuthGuard | - | OK |
| PATCH | `:id/check-in` | `AppointmentsController#checkIn` (L256) | JwtAuthGuard | - | OK |
| PATCH | `:id/check-in-assign` | `AppointmentsController#checkInAndAssign` (L266) | JwtAuthGuard | - | OK |
| GET | `:id/history` | `AppointmentsController#getStatusHistory` (L286) | JwtAuthGuard | - | OK |
| GET | `patient/:patientId` | `AppointmentsController#findByPatient` (L298) | JwtAuthGuard | - | OK |
| GET | `doctor/:doctorId/worklist` | `AppointmentsController#findDoctorWorklist` (L316) | JwtAuthGuard | - | OK |
| GET | `doctor/:doctorId` | `AppointmentsController#findByDoctor` (L335) | JwtAuthGuard | - | OK |
| GET | `:id` | `AppointmentsController#findOne` (L352) | JwtAuthGuard | - | OK |
| POST | `:id/notifications/confirmation` | `AppointmentsController#sendConfirmation` (L368) | JwtAuthGuard | - | ACCEPTED |
| POST | `:id/notifications/reminder` | `AppointmentsController#sendReminder` (L380) | JwtAuthGuard | - | ACCEPTED |
| POST | `:id/notifications/reminder/retry` | `AppointmentsController#retryReminder` (L392) | JwtAuthGuard | - | ACCEPTED |
| PATCH | `:id/notifications/reminder-preference` | `AppointmentsController#updateReminderPreference` (L404) | JwtAuthGuard | - | OK/200 (default) |
| GET | `:id/notifications/reminder-preference` | `AppointmentsController#getReminderPreference` (L420) | JwtAuthGuard | - | OK/200 (default) |
| PATCH | `:id/notifications/reminder/read` | `AppointmentsController#markReminderRead` (L431) | JwtAuthGuard | - | OK/200 (default) |
| PATCH | `:id/notifications/reminder/responded` | `AppointmentsController#markReminderResponded` (L441) | JwtAuthGuard | - | OK/200 (default) |
| GET | `:id/notifications/logs` | `AppointmentsController#findNotificationLogs` (L451) | JwtAuthGuard | - | OK/200 (default) |

**ClinicalOrdersController** — `backend/service/clinical-emr-service/src/clinical-orders/clinical-orders.controller.ts` — base path: `clinical-orders`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `ClinicalOrdersController#create` (L31) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `(root)` | `ClinicalOrdersController#findAll` (L36) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `patient/:patient_id` | `ClinicalOrdersController#findByPatientId` (L41) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `session/:session_id` | `ClinicalOrdersController#findBySessionId` (L46) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `record/:record_id` | `ClinicalOrdersController#findByRecordId` (L51) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `ordered-by/:ordered_by` | `ClinicalOrdersController#findByOrderedBy` (L56) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `status/:status` | `ClinicalOrdersController#findByStatus` (L61) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `:order_id` | `ClinicalOrdersController#findOne` (L68) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:order_id` | `ClinicalOrdersController#update` (L73) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| DELETE | `:order_id` | `ClinicalOrdersController#remove` (L81) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |

**ClinicsController** — `backend/service/clinical-emr-service/src/clinics/clinics.controller.ts` — base path: `clinics`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `ClinicsController#create` (L35) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | CREATED |
| GET | `(root)` | `ClinicsController#findAll` (L43) | JwtAuthGuard, RolesGuard | - | OK |
| GET | `:id` | `ClinicsController#findOne` (L59) | JwtAuthGuard, RolesGuard | - | OK |
| GET | `code/:code` | `ClinicsController#findByCode` (L70) | JwtAuthGuard, RolesGuard | - | OK |
| PATCH | `:id` | `ClinicsController#update` (L78) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK |
| DELETE | `:id` | `ClinicsController#remove` (L90) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK |

**DentalChartsController** — `backend/service/clinical-emr-service/src/dental-charts/dental-charts.controller.ts` — base path: `dental-charts`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `DentalChartsController#create` (L29) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `(root)` | `DentalChartsController#findAll` (L34) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `:chart_id` | `DentalChartsController#findOne` (L39) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `patient/:patient_id` | `DentalChartsController#findByPatientId` (L44) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `record/:record_id` | `DentalChartsController#findByRecordId` (L49) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:chart_id` | `DentalChartsController#update` (L54) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| DELETE | `:chart_id` | `DentalChartsController#remove` (L62) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |

**DentalImagesController** — `backend/service/clinical-emr-service/src/dental-images/dental-images.controller.ts` — base path: `dental-images`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `DentalImagesController#create` (L30) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `(root)` | `DentalImagesController#findAll` (L36) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,NURSE] | - | OK/200 (default) |
| GET | `archived` | `DentalImagesController#findArchived` (L42) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,NURSE] | - | OK/200 (default) |
| GET | `:image_id` | `DentalImagesController#findOne` (L47) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `patient/:patient_id` | `DentalImagesController#findByPatientId` (L53) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,NURSE] | - | OK/200 (default) |
| GET | `record/:record_id` | `DentalImagesController#findByRecordId` (L59) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,NURSE] | - | OK/200 (default) |
| GET | `category/:category_id` | `DentalImagesController#findByCategoryId` (L65) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,NURSE] | - | OK/200 (default) |
| GET | `uploaded-by/:uploaded_by` | `DentalImagesController#findByUploadedBy` (L71) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,NURSE] | - | OK/200 (default) |
| GET | `pacs/:pacs_id` | `DentalImagesController#findByPacsId` (L76) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:image_id` | `DentalImagesController#update` (L81) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:image_id/archive` | `DentalImagesController#archive` (L90) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,NURSE] | - | OK/200 (default) |
| DELETE | `:image_id` | `DentalImagesController#remove` (L95) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |

**DiagnosesController** — `backend/service/clinical-emr-service/src/diagnoses/diagnoses.controller.ts` — base path: `diagnoses`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `DiagnosesController#create` (L29) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `(root)` | `DiagnosesController#findAll` (L34) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `:diagnosis_id` | `DiagnosesController#findOne` (L39) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `session/:session_id` | `DiagnosesController#findBySessionId` (L44) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `icd/:icd_code` | `DiagnosesController#findByIcdCode` (L49) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:diagnosis_id` | `DiagnosesController#update` (L54) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| DELETE | `:diagnosis_id` | `DiagnosesController#remove` (L62) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |

**DiagnosticOrdersController** — `backend/service/clinical-emr-service/src/diagnostic-orders/diagnostic-orders.controller.ts` — base path: `diagnostic-orders`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `DiagnosticOrdersController#create` (L37) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `code/:code` | `DiagnosticOrdersController#findByCode` (L47) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK |
| GET | `appointment/:appointmentId` | `DiagnosticOrdersController#findByAppointment` (L61) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK |
| GET | `patient/:patientId` | `DiagnosticOrdersController#findByPatient` (L71) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK |
| GET | `:id` | `DiagnosticOrdersController#findOne` (L79) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK |
| PATCH | `:id` | `DiagnosticOrdersController#update` (L91) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK |
| DELETE | `:id` | `DiagnosticOrdersController#remove` (L104) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | NO_CONTENT |

**DoctorLeavesController** — `backend/service/clinical-emr-service/src/doctor-leaves/doctor-leaves.controller.ts` — base path: `doctor-leaves`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `DoctorLeavesController#create` (L42) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST,] | - | CREATED |
| GET | `(root)` | `DoctorLeavesController#findAll` (L49) | JwtAuthGuard, RolesGuard | - | OK |
| GET | `:id` | `DoctorLeavesController#findOne` (L56) | JwtAuthGuard, RolesGuard | - | OK |
| GET | `doctor/:doctorId` | `DoctorLeavesController#findByDoctor` (L68) | JwtAuthGuard, RolesGuard | - | OK |
| PATCH | `:id` | `DoctorLeavesController#update` (L86) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST,] | - | OK |
| DELETE | `:id` | `DoctorLeavesController#remove` (L100) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST,] | - | NO_CONTENT |

**DoctorSchedulesController** — `backend/service/clinical-emr-service/src/doctor-schedules/doctor-schedules.controller.ts` — base path: `doctor-schedules`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `DoctorSchedulesController#create` (L42) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST,] | - | CREATED |
| GET | `(root)` | `DoctorSchedulesController#findAll` (L49) | JwtAuthGuard, RolesGuard | - | OK |
| GET | `:id` | `DoctorSchedulesController#findOne` (L56) | JwtAuthGuard, RolesGuard | - | OK |
| GET | `doctor/:doctorId` | `DoctorSchedulesController#findByDoctor` (L68) | JwtAuthGuard, RolesGuard | - | OK |
| PATCH | `:id` | `DoctorSchedulesController#update` (L86) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST,] | - | OK |
| GET | `:id/changes` | `DoctorSchedulesController#getChangeHistory` (L94) | JwtAuthGuard, RolesGuard | - | OK |
| POST | `:id/transfer` | `DoctorSchedulesController#transferShift` (L108) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST,] | - | OK |

**DoctorSpecialtiesController** — `backend/service/clinical-emr-service/src/doctor-specialties/doctor-specialties.controller.ts` — base path: `doctor-specialties`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `DoctorSpecialtiesController#create` (L32) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,RECEPTIONIST] | - | CREATED |
| GET | `doctor/:doctorId` | `DoctorSpecialtiesController#findByDoctor` (L39) | JwtAuthGuard, RolesGuard | - | OK |
| GET | `specialty/:specialtyId` | `DoctorSpecialtiesController#findBySpecialty` (L46) | JwtAuthGuard, RolesGuard | - | OK |
| DELETE | `:doctorId/:specialtyId` | `DoctorSpecialtiesController#remove` (L54) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,RECEPTIONIST] | - | NO_CONTENT |

**ExaminationSessionsController** — `backend/service/clinical-emr-service/src/examination-sessions/examination-sessions.controller.ts` — base path: `examination-sessions`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `ExaminationSessionsController#create` (L32) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `(root)` | `ExaminationSessionsController#findAll` (L38) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `patient/:patient_id` | `ExaminationSessionsController#findByPatientId` (L44) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,NURSE] | - | OK/200 (default) |
| GET | `doctor/:doctor_id` | `ExaminationSessionsController#findByDoctorId` (L50) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,NURSE] | - | OK/200 (default) |
| GET | `appointment/:appointment_id` | `ExaminationSessionsController#findByAppointmentId` (L56) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,NURSE] | - | OK/200 (default) |
| GET | `:session_id` | `ExaminationSessionsController#findOne` (L64) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,NURSE] | - | OK/200 (default) |
| GET | `:session_id/amendments` | `ExaminationSessionsController#findAmendments` (L70) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,NURSE] | - | OK/200 (default) |
| POST | `:session_id/amendments` | `ExaminationSessionsController#createAmendment` (L75) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| PATCH | `:session_id/finalize` | `ExaminationSessionsController#finalize` (L83) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:session_id` | `ExaminationSessionsController#update` (L88) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| DELETE | `:session_id` | `ExaminationSessionsController#remove` (L100) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,NURSE] | - | OK/200 (default) |

**HealthController** — `backend/service/clinical-emr-service/src/health/health.controller.ts` — base path: `health`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| GET | `(root)` | `HealthController#check` (L14) | (none found) | - | OK |

**ImageAnnotationsController** — `backend/service/clinical-emr-service/src/image-annotations/image-annotations.controller.ts` — base path: `image-annotations`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `ImageAnnotationsController#create` (L31) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `(root)` | `ImageAnnotationsController#findAll` (L36) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `:annotation_id` | `ImageAnnotationsController#findOne` (L41) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `image/:image_id` | `ImageAnnotationsController#findByImageId` (L46) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `annotated-by/:annotated_by` | `ImageAnnotationsController#findByAnnotatedBy` (L51) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `type/:annotation_type` | `ImageAnnotationsController#findByType` (L58) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:annotation_id` | `ImageAnnotationsController#update` (L63) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| DELETE | `:annotation_id` | `ImageAnnotationsController#remove` (L74) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |

**ImageCategoriesController** — `backend/service/clinical-emr-service/src/image-categories/image-categories.controller.ts` — base path: `image-categories`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `ImageCategoriesController#create` (L30) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | CREATED |
| GET | `(root)` | `ImageCategoriesController#findAll` (L35) | JwtAuthGuard, RolesGuard | - | OK/200 (default) |
| GET | `:category_id` | `ImageCategoriesController#findOne` (L40) | JwtAuthGuard, RolesGuard | - | OK/200 (default) |
| GET | `name/:category_name` | `ImageCategoriesController#findByName` (L45) | JwtAuthGuard, RolesGuard | - | OK/200 (default) |
| PATCH | `:category_id` | `ImageCategoriesController#update` (L51) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK/200 (default) |
| DELETE | `:category_id` | `ImageCategoriesController#remove` (L63) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK/200 (default) |

**LabTestResultsController** — `backend/service/clinical-emr-service/src/lab-test-results/lab-test-results.controller.ts` — base path: `lab-test-results`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `LabTestResultsController#create` (L29) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `(root)` | `LabTestResultsController#findAll` (L34) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `abnormal` | `LabTestResultsController#findAbnormalResults` (L39) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `:result_id` | `LabTestResultsController#findOne` (L44) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `order/:order_id` | `LabTestResultsController#findByOrderId` (L49) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:result_id` | `LabTestResultsController#update` (L54) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| DELETE | `:result_id` | `LabTestResultsController#remove` (L62) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |

**MedicalHistoryController** — `backend/service/clinical-emr-service/src/medical-history/medical-history.controller.ts` — base path: `patients/:patient_id/history`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `MedicalHistoryController#create` (L28) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `(root)` | `MedicalHistoryController#findAll` (L34) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `:history_id` | `MedicalHistoryController#findOne` (L40) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,NURSE] | - | OK/200 (default) |
| PATCH | `:history_id` | `MedicalHistoryController#update` (L46) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,NURSE] | - | OK/200 (default) |
| DELETE | `:history_id` | `MedicalHistoryController#remove` (L54) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |

**MedicalRecordsController** — `backend/service/clinical-emr-service/src/medical-records/medical-records.controller.ts` — base path: `medical-records`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `MedicalRecordsController#create` (L35) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `(root)` | `MedicalRecordsController#findAll` (L40) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `patient/:patient_id` | `MedicalRecordsController#findByPatient` (L45) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `me` | `MedicalRecordsController#findMine` (L51) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `me/:record_id` | `MedicalRecordsController#findMineOne` (L60) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,PATIENT] | - | OK/200 (default) |
| GET | `:record_id` | `MedicalRecordsController#findOne` (L72) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,PATIENT] | - | OK/200 (default) |
| GET | `:record_id/versions` | `MedicalRecordsController#getVersions` (L77) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:record_id/finalize` | `MedicalRecordsController#finalize` (L82) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:record_id` | `MedicalRecordsController#update` (L90) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| DELETE | `:record_id` | `MedicalRecordsController#remove` (L98) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |

**PacsSyncLogsController** — `backend/service/clinical-emr-service/src/pacs-sync-logs/pacs-sync-logs.controller.ts` — base path: `pacs-sync-logs`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `PacsSyncLogsController#create` (L30) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | CREATED |
| GET | `(root)` | `PacsSyncLogsController#findAll` (L35) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK/200 (default) |
| GET | `failed` | `PacsSyncLogsController#findFailed` (L40) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK/200 (default) |
| GET | `recent` | `PacsSyncLogsController#findRecent` (L45) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK/200 (default) |
| GET | `:sync_id` | `PacsSyncLogsController#findOne` (L51) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK/200 (default) |
| GET | `image/:image_id` | `PacsSyncLogsController#findByImageId` (L56) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK/200 (default) |
| GET | `sync-type/:sync_type` | `PacsSyncLogsController#findBySyncType` (L61) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK/200 (default) |
| GET | `pacs-server/:pacs_server` | `PacsSyncLogsController#findByPacsServer` (L66) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK/200 (default) |
| GET | `status/:status` | `PacsSyncLogsController#findByStatus` (L71) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK/200 (default) |
| PATCH | `:sync_id` | `PacsSyncLogsController#update` (L76) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK/200 (default) |
| DELETE | `:sync_id` | `PacsSyncLogsController#remove` (L84) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK/200 (default) |

**PatientRepresentativesController** — `backend/service/clinical-emr-service/src/patient-representatives/patient-representatives.controller.ts` — base path: `patient-representatives`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `PatientRepresentativesController#create` (L27) | JwtAuthGuard | - | CREATED |
| GET | `patient/:patientId` | `PatientRepresentativesController#findByPatient` (L39) | JwtAuthGuard | - | OK/200 (default) |
| GET | `:id` | `PatientRepresentativesController#findOne` (L51) | JwtAuthGuard | - | OK/200 (default) |
| PATCH | `:id` | `PatientRepresentativesController#update` (L60) | JwtAuthGuard | - | OK/200 (default) |
| POST | `:id/verify` | `PatientRepresentativesController#verify` (L74) | JwtAuthGuard | - | CREATED |

**PatientsController** — `backend/service/clinical-emr-service/src/patients/patients.controller.ts` — base path: `patients`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `PatientsController#create` (L32) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST] | - | CREATED |
| GET | `(root)` | `PatientsController#findAll` (L39) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST,MANAGER,RECEPTIONIST] | - | OK/200 (default) |
| GET | `me` | `PatientsController#findMine` (L52) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST,ADMIN,MANAGER,DOCTOR,RECEPTIONIST,NURSE,] | - | OK/200 (default) |
| POST | `me` | `PatientsController#createMine` (L66) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST,ADMIN,MANAGER,DOCTOR,RECEPTIONIST,NURSE,PATIENT,] | - | CREATED |
| GET | `:patient_id` | `PatientsController#findOne` (L79) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST,ADMIN,MANAGER,DOCTOR,RECEPTIONIST,NURSE,PATIENT,] | - | OK/200 (default) |
| GET | `code/:patient_code` | `PatientsController#findByCode` (L91) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST,ADMIN,MANAGER,DOCTOR,RECEPTIONIST,NURSE,] | - | OK/200 (default) |
| PATCH | `:patient_id` | `PatientsController#update` (L103) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST,ADMIN,MANAGER,DOCTOR,RECEPTIONIST,NURSE,] | - | OK/200 (default) |
| DELETE | `:patient_id` | `PatientsController#remove` (L112) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST,ADMIN,MANAGER,RECEPTIONIST] | - | OK/200 (default) |
| PATCH | `:patient_id/unblock-booking` | `PatientsController#unblockBooking` (L119) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST,ADMIN,MANAGER] | - | OK/200 (default) |

**PrescriptionItemsController** — `backend/service/clinical-emr-service/src/prescription-items/prescription-items.controller.ts` — base path: `prescription-items`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `PrescriptionItemsController#create` (L31) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `(root)` | `PrescriptionItemsController#findAll` (L36) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `prescription/:prescription_id` | `PrescriptionItemsController#findByPrescriptionId` (L41) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `:item_id` | `PrescriptionItemsController#findOne` (L48) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:item_id` | `PrescriptionItemsController#update` (L53) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| DELETE | `:item_id` | `PrescriptionItemsController#remove` (L64) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |

**PrescriptionsController** — `backend/service/clinical-emr-service/src/prescriptions/prescriptions.controller.ts` — base path: `prescriptions`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `PrescriptionsController#create` (L35) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `me` | `PrescriptionsController#findMine` (L41) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `(root)` | `PrescriptionsController#findAll` (L49) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,ADMIN,MANAGER,DOCTOR,PATIENT] | - | OK/200 (default) |
| GET | `patient/:patient_id` | `PrescriptionsController#findByPatientId` (L54) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `doctor/:doctor_id` | `PrescriptionsController#findByDoctorId` (L59) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `session/:session_id` | `PrescriptionsController#findBySessionId` (L64) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `record/:record_id` | `PrescriptionsController#findByRecordId` (L69) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `:prescription_id` | `PrescriptionsController#findOne` (L74) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:prescription_id/issue` | `PrescriptionsController#issue` (L79) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:prescription_id/cancel` | `PrescriptionsController#cancel` (L84) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:prescription_id` | `PrescriptionsController#update` (L92) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| DELETE | `:prescription_id` | `PrescriptionsController#remove` (L103) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |

**RecordExportsController** — `backend/service/clinical-emr-service/src/record-exports/record-exports.controller.ts` — base path: `record-exports`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `RecordExportsController#create` (L28) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `(root)` | `RecordExportsController#findAll` (L33) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `:export_id` | `RecordExportsController#findOne` (L38) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `record/:record_id` | `RecordExportsController#findByRecordId` (L43) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:export_id` | `RecordExportsController#update` (L48) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| DELETE | `:export_id` | `RecordExportsController#remove` (L56) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |

**ReportsController** — `backend/service/clinical-emr-service/src/reports/reports.controller.ts` — base path: `reports`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| GET | `doctor-performance` | `ReportsController#getDoctorPerformance` (L32) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK |
| GET | `revenue` | `ReportsController#getRevenue` (L66) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK |
| GET | `operational` | `ReportsController#getOperational` (L100) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK |
| GET | `dashboard/doctor` | `ReportsController#getDoctorDashboard` (L128) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK |
| GET | `dashboard/patient` | `ReportsController#getPatientDashboard` (L159) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST,NURSE,PATIENT,] | - | OK |
| GET | `dashboard/customer` | `ReportsController#getCustomerDashboard` (L184) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR,RECEPTIONIST,NURSE,PATIENT,] | - | OK |
| GET | `financial` | `ReportsController#getFinancialReport` (L204) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK |

**ServiceCategoriesController** — `backend/service/clinical-emr-service/src/service-categories/service-categories.controller.ts` — base path: `service-categories`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `ServiceCategoriesController#create` (L34) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | CREATED |
| GET | `(root)` | `ServiceCategoriesController#findAll` (L41) | JwtAuthGuard, RolesGuard | - | OK |
| GET | `roots` | `ServiceCategoriesController#findRoots` (L48) | JwtAuthGuard, RolesGuard | - | OK |
| GET | `:id` | `ServiceCategoriesController#findOne` (L55) | JwtAuthGuard, RolesGuard | - | OK |
| PATCH | `:id` | `ServiceCategoriesController#update` (L63) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK |
| DELETE | `:id` | `ServiceCategoriesController#remove` (L71) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | NO_CONTENT |

**ServicesController** — `backend/service/clinical-emr-service/src/services/services.controller.ts` — base path: `(none)`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `services` | `ServicesController#create` (L33) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,RECEPTIONIST] | - | CREATED |
| GET | `services` | `ServicesController#findAll` (L40) | JwtAuthGuard, RolesGuard | - | OK |
| GET | `services/:id` | `ServicesController#findOne` (L55) | JwtAuthGuard, RolesGuard | - | OK |
| PATCH | `services/:id` | `ServicesController#update` (L63) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,RECEPTIONIST] | - | OK |
| DELETE | `services/:id` | `ServicesController#remove` (L71) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,RECEPTIONIST] | - | NO_CONTENT |
| POST | `clinics/:clinicId/services/:serviceId` | `ServicesController#assignToClinic` (L81) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,RECEPTIONIST] | - | CREATED |
| GET | `clinics/:clinicId/services` | `ServicesController#findClinicServices` (L105) | JwtAuthGuard, RolesGuard | - | OK |
| PATCH | `clinic-services/:clinicServiceId` | `ServicesController#updateClinicService` (L113) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,RECEPTIONIST] | - | OK |
| DELETE | `clinic-services/:clinicServiceId` | `ServicesController#removeClinicService` (L124) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,RECEPTIONIST] | - | NO_CONTENT |

**SpecialtiesController** — `backend/service/clinical-emr-service/src/specialties/specialties.controller.ts` — base path: `specialties`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `SpecialtiesController#create` (L33) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | CREATED |
| GET | `(root)` | `SpecialtiesController#findAll` (L41) | JwtAuthGuard, RolesGuard | - | OK |
| GET | `:id` | `SpecialtiesController#findOne` (L49) | JwtAuthGuard, RolesGuard | - | OK |
| PATCH | `:id` | `SpecialtiesController#update` (L57) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK |
| DELETE | `:id` | `SpecialtiesController#remove` (L65) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | NO_CONTENT |

**SymptomsController** — `backend/service/clinical-emr-service/src/symptoms/symptoms.controller.ts` — base path: `symptoms`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `SymptomsController#create` (L29) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `(root)` | `SymptomsController#findAll` (L34) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `:symptom_id` | `SymptomsController#findOne` (L39) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `session/:session_id` | `SymptomsController#findBySessionId` (L44) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `patient/:patient_id` | `SymptomsController#findByPatientId` (L49) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:symptom_id` | `SymptomsController#update` (L54) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| DELETE | `:symptom_id` | `SymptomsController#remove` (L62) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |

**TreatmentHistoryController** — `backend/service/clinical-emr-service/src/treatment-history/treatment-history.controller.ts` — base path: `treatment-history`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `TreatmentHistoryController#create` (L30) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `(root)` | `TreatmentHistoryController#findAll` (L35) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `:treatment_id` | `TreatmentHistoryController#findOne` (L40) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `patient/:patient_id` | `TreatmentHistoryController#findByPatientId` (L45) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `record/:record_id` | `TreatmentHistoryController#findByRecordId` (L50) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `tooth/:tooth_number` | `TreatmentHistoryController#findByToothNumber` (L55) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:treatment_id` | `TreatmentHistoryController#update` (L62) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| DELETE | `:treatment_id` | `TreatmentHistoryController#remove` (L73) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |

**TreatmentPlansController** — `backend/service/clinical-emr-service/src/treatment-plans/treatment-plans.controller.ts` — base path: `treatment-plans`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `TreatmentPlansController#create` (L29) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `(root)` | `TreatmentPlansController#findAll` (L34) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `patient/:patient_id` | `TreatmentPlansController#findByPatientId` (L39) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `session/:session_id` | `TreatmentPlansController#findBySessionId` (L44) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `record/:record_id` | `TreatmentPlansController#findByRecordId` (L49) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| GET | `:plan_id` | `TreatmentPlansController#findOne` (L54) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:plan_id/propose` | `TreatmentPlansController#propose` (L59) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:plan_id/accept` | `TreatmentPlansController#accept` (L64) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:plan_id/decline` | `TreatmentPlansController#decline` (L75) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| PATCH | `:plan_id` | `TreatmentPlansController#update` (L84) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |
| DELETE | `:plan_id` | `TreatmentPlansController#remove` (L92) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK/200 (default) |

**TreatmentRoomsController** — `backend/service/clinical-emr-service/src/treatment-rooms/treatment-rooms.controller.ts` — base path: `(none)`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `clinics/:clinicId/treatment-rooms` | `TreatmentRoomsController#create` (L31) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | CREATED |
| GET | `clinics/:clinicId/treatment-rooms` | `TreatmentRoomsController#findAllByClinic` (L42) | JwtAuthGuard, RolesGuard | - | OK |
| GET | `treatment-rooms/:id` | `TreatmentRoomsController#findOne` (L64) | JwtAuthGuard, RolesGuard | - | OK |
| PATCH | `treatment-rooms/:id` | `TreatmentRoomsController#update` (L72) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK |
| DELETE | `treatment-rooms/:id` | `TreatmentRoomsController#remove` (L80) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | NO_CONTENT |

**WorkShiftsController** — `backend/service/clinical-emr-service/src/work-shifts/work-shifts.controller.ts` — base path: `work-shifts`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `(root)` | `WorkShiftsController#create` (L32) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | CREATED |
| GET | `(root)` | `WorkShiftsController#findAll` (L39) | JwtAuthGuard, RolesGuard | - | OK |
| GET | `:id` | `WorkShiftsController#findOne` (L46) | JwtAuthGuard, RolesGuard | - | OK |
| PATCH | `:id` | `WorkShiftsController#update` (L54) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | OK |
| DELETE | `:id` | `WorkShiftsController#remove` (L62) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER,DOCTOR] | - | NO_CONTENT |


### payment-service


**HealthController** — `backend/service/payment-service/src/health/health.controller.ts` — base path: `health`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| GET | `(root)` | `HealthController#check` (L14) | (none found) | - | OK |

**PaymentsController** — `backend/service/payment-service/src/payments/payments.controller.ts` — base path: `payments`, version: `1`

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| POST | `initiate` | `PaymentsController#initiate` (L43) | (none found) | - | CREATED |
| GET | `vnpay-return` | `PaymentsController#vnpayReturn` (L76) | (none found) | - | OK |
| GET | `appointment/:id` | `PaymentsController#findByAppointment` (L98) | (none found) | - | OK |
| GET | `refunds` | `PaymentsController#listRefunds` (L117) | JwtAuthGuard | - | OK |
| GET | `(root)` | `PaymentsController#findAll` (L133) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK |
| POST | `:id/refund` | `PaymentsController#requestRefund` (L148) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK |
| POST | `:id/refund/approve` | `PaymentsController#approveRefund` (L169) | JwtAuthGuard | - | OK |
| POST | `:id/refund/reject` | `PaymentsController#rejectRefund` (L186) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK |
| GET | `:id` | `PaymentsController#findOne` (L202) | JwtAuthGuard, RolesGuard [ADMIN,MANAGER] | - | OK |


### gateway-service


**HealthController** — `backend/service/gateway-service/src/health/health.controller.ts` — base path: `health`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| GET | `(root)` | `HealthController#check` (L21) | (none found) | - | OK/200 (default) |
| GET | `live` | `HealthController#liveness` (L53) | (none found) | - | OK/200 (default) |
| GET | `ready` | `HealthController#readiness` (L59) | (none found) | - | OK/200 (default) |

**SwaggerController** — `backend/service/gateway-service/src/swagger/swagger.controller.ts` — base path: `swagger`, no version prefix

| METHOD | sub-path | controller#method | guards/roles | DTO | status |
|---|---|---|---|---|---|
| GET | `refresh` | `SwaggerController#refresh` (L11) | (none found) | - | OK/200 (default) |


**Public (no guard) routes, exhaustively** — cross-referenced from the tables above: every
`AuthController`/`AuthGoogleController` route (`email/login`, `email/register`, `email/confirm`,
`forgot/password`, `reset/password`, `POST /auth/google`) has no `@UseGuards` at class or method
level and iam-service has no global `APP_GUARD` (`rg -n "APP_GUARD" backend/service/iam-service/src`
→ 0 hits) — these are genuinely public by design. All 4 `health` controllers are public. Everything
else requires at minimum `JwtAuthGuard` (either NestJS's own `AuthGuard('jwt')` in iam-service, or a
hand-rolled `JwtAuthGuard` in clinical-emr-service/payment-service that independently re-verifies
the bearer JWT against `AUTH_JWT_SECRET` — see §6).

## 6. Guard / RBAC actual state

- **`DISABLE_AUTH_GUARD` does not exist anywhere in this codebase.** `rg -ni "disable.*auth.*guard"
  frontend/web/src` → 0 hits. This appears to be a false assumption in the brief — do not build
  tests around it. The actual frontend gate is unconditional:
  `frontend/web/src/middleware.ts:12-38` reads the `access_token` cookie and redirects based on
  `PUBLIC_ROUTES`/`AUTH_ROUTES` (`@/shared/constants/routes`) with no env-var bypass of any kind.
- **`RolesGuard` in clinical-emr-service is registered PER-CONTROLLER, not globally.** No
  `APP_GUARD` provider exists (`rg -n "APP_GUARD" backend/service/clinical-emr-service/src` → 0
  hits). Every controller except `HealthController` applies
  `@UseGuards(JwtAuthGuard, RolesGuard)` (sometimes just `JwtAuthGuard`, e.g.
  `AppointmentsController` at `appointments.controller.ts:50`, which does its own row-level
  ownership checks in the service layer instead of `@Roles`) directly on the class. This means a
  future controller that forgets the decorator is unprotected by default — verified there are
  currently only 2 controllers without a class-level `@UseGuards` in clinical-emr-service:
  `AppointmentsController` (has `JwtAuthGuard` only, by design — ownership-scoped in the service,
  confirmed in `findAll()` at `appointments.service.ts:538-568`, patients/doctors are hard-scoped to
  their own records, non-privileged/non-doctor/non-patient roles are rejected) and
  `HealthController` (intentionally public).
- **Gateway's `requiresTrustedIdentity()` covers exactly 3 things**
  (`backend/service/gateway-service/src/proxy/proxy.middleware.ts:93-99`): the
  `booking-langgraph-service` route, `/api/v1/appointments`, `/api/v1/patient-representatives`. For
  every other proxied prefix the gateway does NOT reject an unauthenticated request itself — it
  forwards it and lets the downstream service's own guard reject it. This is not a hole: every
  downstream controller independently re-validates the bearer JWT
  (`backend/service/clinical-emr-service/src/auth/jwt-auth.guard.ts:16-28` calls
  `extractActorFromAuthorization` against `process.env.AUTH_JWT_SECRET`, not the gateway's
  `x-auth-*` headers). Confirmed clinical-emr-service explicitly strips
  `x-auth-user-id`/`x-auth-role`/`x-patient-id` on every inbound request before any guard runs
  (`backend/service/clinical-emr-service/src/main.ts:25-30`, with an explicit code comment: "Drop
  the gateway's identity headers on the way in so no handler can accidentally trust a value the
  client controls when it reaches this service's port directly") — so header-spoofing against a
  directly-hit service port is not viable.
- **Patient-scoped data without an ownership check**: none found in the controllers/services
  actually read for this recon (`AppointmentsService.findAll` is correctly scoped, `PaymentsService`
  has an explicit `PAYMENT_STAFF_ROLES` set + `findByIdForActor`, `MedicalRecordsService` has
  `findMineList`/`findMineDetail` alongside staff-only `findAll`). This was NOT exhaustively swept
  across all 47 controllers — only the ones this recon happened to open for other sections. UNKNOWN
  for the remainder; command to extend: grep every controller for a `findAll`/`findById` GET that
  does NOT pass `actor`/`actorUserId` into its service call, then check whether that service method
  filters by `patient_id` internally.

## 7. Runtime + seed

**Current state of this environment: no SMILE containers are running.** `docker ps` → empty.
`docker ps -a` → 5 unrelated containers from a different project (`pacision-*`, `minio`,
`pgvector`), none named `smile-*`. Did not start anything (state-mutating). Commands that would
bring the hybrid stack up, in order (not run):

```
docker compose -f docker-compose.yml up -d postgres redis maildev   # ports 5432, 56379(→6379), 1080+1025
# then, per service (order matters — iam-service owns two DBs, must run first if others depend on IAM data):
cd backend/service/iam-service            && bun run migration:run && bun run migration:run:user && bun run seed:run:relational && bun run seed:run:user
cd backend/service/clinical-emr-service   && bun run migration:run && bun run migration:run:clinic && bun run seed:run:relational && bun run seed:run:clinic
cd backend/service/payment-service        && bun run migration:run && bun run seed:run
```
This is the TypeORM-migration + TypeScript-seed-script path (`backend/service/<svc>/package.json`
`migration:run*`/`seed:run*` scripts) — it is the actual mechanism, confirmed against
`scripts/reset-and-seed.ps1:18-23` (5 databases: `auth_service_db`, `account_service_db`,
`core_clinic_service_db`, `core_medical_service_db`, `payment_service_db`) and
`scripts/reset-and-seed.ps1:132-152` (exact per-service `ts-node .../typeorm/cli.js -d
<data-source> migration:run` invocations). The `database/**/schema.sql` + `insert.sql` files found
by the brief are NOT wired into any init script (`docker/init-db.sql` referenced by
`docker-compose.yml:29` is empty) — they read as point-in-time schema/data exports, not something
auto-applied on container start. Then, per service (hybrid — native, not containerized):
`cd backend/service/<svc> && bun run start:dev` (ports per `.env:2` `APP_PORT`: iam 8081,
clinical-emr 8082, payment 3006, gateway 8080), and `cd frontend/web && bun run dev`.

**Health/readiness endpoints:**

| service | path | file:line |
|---|---|---|
| iam-service | `GET /v1/health` | `backend/service/iam-service/src/health/health.controller.ts:7-19` (checks both `dataSource` and `iamUserDataSource`) |
| clinical-emr-service | `GET /api/v1/health` | `backend/service/clinical-emr-service/src/health/health.controller.ts:7-14` |
| payment-service | `GET /api/v1/health` | `backend/service/payment-service/src/health/health.controller.ts:7-14` |
| gateway-service | `GET /health`, `GET /health/live`, `GET /health/ready` | `backend/service/gateway-service/src/health/health.controller.ts:13,21,53,59` |

**Does a seeded run currently boot clean?** UNKNOWN — cannot verify without starting Docker
containers, which is a state-mutating action outside this recon's read-only scope. Command to
check once containers are up: `curl -sf http://localhost:8081/v1/health && curl -sf
http://localhost:8082/api/v1/health && curl -sf http://localhost:3006/api/v1/health && curl -sf
http://localhost:8080/health/ready`.

**Env vars required per service (names only)** — from `backend/service/<svc>/.env` (gitignored,
confirmed via `git check-ignore`):

- **iam-service**: `APP_FALLBACK_LANGUAGE, APP_HOST, APP_PORT, APP_URL, AUTH_CONFIRM_EMAIL_SECRET, AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN, AUTH_FORGOT_SECRET, AUTH_FORGOT_TOKEN_EXPIRES_IN, AUTH_JWT_SECRET, AUTH_JWT_TOKEN_EXPIRES_IN, AUTH_OTP_EXPIRES_IN, AUTH_REFRESH_SECRET, AUTH_REFRESH_TOKEN_EXPIRES_IN, DATABASE_HOST, DATABASE_MAX_CONNECTIONS, DATABASE_NAME, DATABASE_PASSWORD, DATABASE_PORT, DATABASE_SSL_ENABLED, DATABASE_SYNCHRONIZE, DATABASE_TYPE, DATABASE_USERNAME, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, IAM_INTERNAL_API_KEY, KYC_FILE_ENCRYPTION_KEY, KYC_MAX_FILE_SIZE, KYC_OCR_BATCH_SIZE, KYC_OCR_ENABLED, KYC_OCR_INTERVAL_MS, KYC_OCR_MAX_ATTEMPTS, KYC_OCR_STALE_PROCESSING_MS, KYC_OCR_TIMEOUT_MS, KYC_PRIVATE_STORAGE_DIR, KYC_RETENTION_CLEANUP_BATCH_SIZE, KYC_RETENTION_CLEANUP_ENABLED, KYC_RETENTION_CLEANUP_INTERVAL_MS, KYC_RETENTION_DAYS, MAIL_FROM, MAIL_HOST, MAIL_PASSWORD, MAIL_PORT, MAIL_USER, REDIS_URL, USER_DATABASE_HOST, USER_DATABASE_NAME, USER_DATABASE_PASSWORD, USER_DATABASE_PORT, USER_DATABASE_SYNCHRONIZE, USER_DATABASE_USERNAME**
- **clinical-emr-service**: `API_PREFIX, APP_FALLBACK_LANGUAGE, APP_NAME, APP_PORT, AUTH_CONFIRM_EMAIL_SECRET, AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN, AUTH_FORGOT_SECRET, AUTH_FORGOT_TOKEN_EXPIRES_IN, AUTH_JWT_SECRET, AUTH_JWT_TOKEN_EXPIRES_IN, AUTH_REFRESH_SECRET, AUTH_REFRESH_TOKEN_EXPIRES_IN, BACKEND_DOMAIN, BOOKING_KYC_ENABLED, BOOKING_SKIP_KYC, CLINIC_DATABASE_HOST, CLINIC_DATABASE_NAME, CLINIC_DATABASE_PASSWORD, CLINIC_DATABASE_PORT, CLINIC_DATABASE_SYNCHRONIZE, CLINIC_DATABASE_USERNAME, DATABASE_HOST, DATABASE_MAX_CONNECTIONS, DATABASE_NAME, DATABASE_PASSWORD, DATABASE_PORT, DATABASE_REJECT_UNAUTHORIZED, DATABASE_SSL_ENABLED, DATABASE_SYNCHRONIZE, DATABASE_TYPE, DATABASE_USERNAME, FILE_DRIVER, FRONTEND_DOMAIN, IAM_INTERNAL_API_KEY, IAM_SERVICE_URL, MAIL_CLIENT_PORT, MAIL_DEFAULT_EMAIL, MAIL_DEFAULT_NAME, MAIL_HOST, MAIL_IGNORE_TLS, MAIL_PASSWORD, MAIL_PORT, MAIL_REQUIRE_TLS, MAIL_SECURE, MAIL_USER, NODE_ENV, REDIS_CACHE_TTL_SECONDS, REDIS_URL**
- **payment-service**: `API_PREFIX, APP_PORT, AUTH_JWT_SECRET, CLINICAL_EMR_SERVICE_URL, DATABASE_HOST, DATABASE_NAME, DATABASE_PASSWORD, DATABASE_PORT, DATABASE_SYNCHRONIZE, DATABASE_TYPE, DATABASE_USERNAME, FRONTEND_DOMAIN, NODE_ENV, REDIS_URL, VNPAY_MOCK, VNPAY_SECRET_KEY, VNPAY_TMN_CODE, VNPAY_URL**
- **gateway-service**: `AI_ROUTES_ENABLED, APP_PORT, AUTH_JWT_SECRET, BOOKING_LANGGRAPH_SERVICE_URL, CLINICAL_EMR_SERVICE_URL, CORS_ORIGIN, IAM_SERVICE_URL, PAYMENT_SERVICE_URL, PROXY_TIMEOUT, RATE_LIMIT_ENABLED, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_SECONDS, REDIS_URL**

All 4 share `AUTH_JWT_SECRET` (same value expected across services — this is how the independent
per-service JWT re-verification in §6 works at all).

## 8. Blockers

1. **`web-push` module missing** (iam-service): declared in `package.json:66` (dep) and `:82`
   (`@types/web-push`) but not present in `node_modules` — breaks `ts-jest` compilation
   (`TS2307`) for 3 spec files that transitively import `push.gateway.ts`
   (`notifications.service.spec.ts`, `notifications.ownership.spec.ts`,
   `notification-gateways.logging-privacy.spec.ts`). Fix: `cd backend/service/iam-service && bun
   install` (not run — installs packages).
2. **No live Postgres/Redis/MailDev containers running** in this environment (`docker ps -a` shows
   0 SMILE containers) — blocks: the one Postgres-integration spec
   (`appointment-scheduling.postgres.spec.ts`, gated on `RUN_POSTGRES_INTEGRATION=true`), any
   `curl`-based health-endpoint verification, and any live end-to-end HTTP harness run. Auto-
   generated unit tests (mocked-repository style, §1 template) are unaffected.
3. **Real JSX syntax bug**, not test-infra: `frontend/web/src/app/(pages)/appointments/[id]/payment/page.tsx:133/140`
   — opening `<button>` closed with `</Button>` — breaks esbuild's JSX transform for that whole
   file, failing its vitest suite and (unverified, but very likely) `next build`/`tsc --noEmit` for
   that route too. This needs an actual code fix outside this recon's read-only scope.
4. **Two incompatible `PaymentStatus` enums** across clinical-emr-service and payment-service (§4)
   — any test that asserts payment-status propagation from payment-service into
   `appointments.payment_status` needs an explicit mapping table; there is no shared package/enum
   to import for either side, so a naive test asserting string equality across services will be
   wrong by construction.
5. **Inconsistent `ValidationPipe` contract across services** (§3) — `forbidNonWhitelisted` only on
   2/4 services, and 2 different error-response shapes (raw Nest 400 vs. custom `{status,errors}`
   422) — any shared assertion helper in an auto-generated harness needs to branch per service
   rather than assume one contract.
6. Two spreadsheet-referenced concepts don't exist in code and would need to be dropped or
   reframed for generated tests: **`DISABLE_AUTH_GUARD`** (no such flag anywhere) and **"dental
   image status"** (no enum/status column — only a one-way `is_archived` boolean, §4).
7. `examination_sessions.status` is an un-typed `string` column (no enum) with only two hardcoded
   literal-array guards (`activeStatuses`, `lockedStatuses`) — a generated test asserting "invalid
   status rejected" has nothing to import and must hardcode the literals `'in_progress'` /
   `'completed'` / `'signed'` itself.
8. `node --version` could not be read in this shell (a broken `_load_nvm` shell function in the
   user's profile crashes on invocation) — not a repo blocker, but worth knowing if any generated
   CI-shaped script assumes a working `node --version` call in this exact shell.
