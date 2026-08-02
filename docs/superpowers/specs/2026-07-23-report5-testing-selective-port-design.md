# Report 5 Testing And Selective Port Design

## Goal

Produce evidence-backed unit-test and system-test reports for the S.M.I.L.E
capstone while keeping `origin/dev` as the source baseline. Reuse only proven
logic fixes from the preserved `demo-1707` worktree; do not merge its complete
history or copy broad changes without a failing test.

## Repository Strategy

- Work on `test/report5-origin-dev-20260723`, based on `origin/dev` commit
  `c196380a`.
- Preserve the old state through
  `backup/demo-1707-pre-dev-merge-20260723` and
  `stash@{0}: pre-dev-merge-20260723-codex`.
- Do not import generated GitNexus files, Playwright artifacts, database
  reconciliation migrations, schema dumps, seed rewrites, or broad UI/table
  sorting changes by default.
- Port one behavior-complete change at a time only when a focused test
  demonstrates that `origin/dev` lacks the required behavior.
- Do not commit or push unless explicitly requested.

## Unit-Test Scope

Run the existing suites and coverage for these five independently testable
services:

1. `iam-service`
2. `clinical-emr-service`
3. `gateway-service`
4. `payment-service`
5. `frontend/web`

The first priority is `payment-service`, which currently has no test suite.
Adapt the preserved payment tests to the current `origin/dev` implementation
instead of copying old production code. Cover the smallest useful set of
critical payment behaviors:

- successful payment callback;
- idempotent handling of an already-paid callback;
- synchronization with the owning appointment;
- refund approval/rejection and notification behavior where the current
  service exposes a stable unit boundary.

For the other services, add tests only for a verified coverage gap connected
to the 18 selected system flows. Existing tests are retained and reported as
evidence; test count alone is not a reason to duplicate them.

## Selective Port Rules

Candidate old changes are evaluated in this order:

1. Reproduce the gap on `origin/dev`.
2. Inspect current callers and related execution flow.
3. Run GitNexus upstream impact for any production symbol to be changed.
4. Write or adapt a focused failing test.
5. Port the minimum compatible logic, not the old file wholesale.
6. Run the focused test, affected service suite, build, and relevant runtime
   smoke.

Current disposition:

- Patient self-access: already present on `origin/dev`; test only if its
  authorization contract is not covered.
- Doctor leave pages and routes: already present; verify current API contract
  before considering any old code.
- Appointment availability helper: port only if the active booking wizard has
  a reproducible calendar/slot defect.
- Payment test: strong candidate because the service currently has zero test
  suites.
- Database reconciliation and broad table sorting: outside this testing pass.

## System-Test Scope

Execute 18 risk-based flows against the local Docker demo environment:

1. Register
2. Login and logout
3. Forgot password
4. Reset password
5. RBAC and unauthorized access
6. View and update profile
7. Submit KYC
8. Admin review KYC
9. Book appointment
10. Confirmation and notification
11. Reschedule or cancel appointment
12. Receptionist check-in
13. Start examination and record diagnosis
14. Treatment plan and consent
15. Prescription and finalize encounter
16. Payment
17. Refund
18. Doctor leave and admin approval

Each case records:

- test-case ID and mapped repository use case where available;
- role and preconditions;
- procedure;
- expected result;
- actual result;
- Pass, Fail, Blocked, or Not Applicable status;
- execution date;
- evidence or defect reference without secrets or patient identity data.

Tests use synthetic/demo accounts. Tokens, hashes, KYC payloads, CCCD data, and
uploaded identity paths must never be copied into reports.

## Workbook Design

### Report5_Unit Test

Preserve the template's visual language while replacing example data.

- `Guideline`
- `Cover`
- `Functions`
- `Statistics`
- `IAM`
- `Clinical EMR`
- `Gateway`
- `Payment`
- `Frontend`

The service sheets use a row-based inventory with test ID, suite/function,
case type, condition, expected result, actual result, status, and execution
date. `Statistics` summarizes passed, failed, untested, normal, abnormal, and
boundary cases plus measured code coverage.

### Report5_Test Report

Preserve the template's visual language, repair broken references, and replace
placeholder feature sheets.

- `Cover`
- `Test Cases`
- `Test Statistics`
- `Auth & KYC`
- `Booking`
- `Clinical`
- `Payment & Refund`
- `Admin & Scheduling`
- `Defects`

Statistics and coverage cells are formula-driven from the detailed sheets.
Status fields use consistent validation and colors. Source templates remain
unchanged; final workbooks are exported as new files.

## Error Handling And Evidence

- A failing unit test is classified as a source regression, stale test,
  environment/runner issue, missing dependency, or invalid test data.
- A system case is marked `Blocked` rather than `Failed` when a prerequisite
  service or seed is unavailable.
- Browser and service logs are summarized with redaction.
- No database reset, broad delete, or real-patient data mutation is allowed.
- If Docker images do not match the tested source branch, rebuild only after
  static tests pass and after preserving the current demo stack state.

## Completion Criteria

- All five services have passed/failed/total and coverage evidence, or a clear
  documented reason coverage is unavailable.
- `payment-service` has focused runnable unit tests.
- All 18 system flows have a final status and note.
- Both output workbooks contain real results, no placeholder sample data, no
  broken formulas, and pass a visual review of every sheet.
- Relevant tests, builds, health checks, and runtime flows have fresh evidence.
- The code diff contains only approved tests and narrowly required fixes.
