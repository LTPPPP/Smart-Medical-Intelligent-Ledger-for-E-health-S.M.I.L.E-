# QA Baseline — write-mode session (Tasks 1–4)

Branch: `dev` (re-verified at session start and unchanged throughout — no drift).
Hard rules honored: no git writes, no new dependencies (only `bun install --frozen-lockfile`
against already-locked packages), no edits to `appointments/`, `examination-sessions/`,
`prescriptions/`, `treatment-plans/` business logic.

## 1. Before / after test counts

| Service | Runner | Command | Spec/test files | Before (suites/files) | Before (tests) | Before wall time | After (suites/files) | After (tests) | After wall time |
|---|---|---|---|---|---|---|---|---|---|
| iam-service | Jest 30.1.3 | `cd backend/service/iam-service && bun run test` | 21 `*.spec.ts` | 3 failed / 18 passed / 21 total | 89 passed, 0 failed | 7.427s | **21 passed / 21 total** | **114 passed, 0 failed** | 7.201s |
| clinical-emr-service | Jest 30.1.3 | `cd backend/service/clinical-emr-service && bun run test` | 45 `*.spec.ts` | 1 skipped / 44 passed / 45 total | 379 passed, 6 skipped, 385 total | 9.554s | unchanged (not touched) | unchanged | 9.442s |
| payment-service | Jest 30.1.3 | `cd backend/service/payment-service && bun run test` | 5 `*.spec.ts` | 5 passed / 5 total | 33 passed, 0 failed | 2.813s | unchanged (not touched) | unchanged | 3.934s |
| gateway-service | Jest 30.1.3 | `cd backend/service/gateway-service && bun run test` | 9 `*.spec.ts` | 9 passed / 9 total | 42 passed, 0 failed | 4.706s | unchanged (not touched) | unchanged | 4.03s |
| frontend/web | Vitest 3.2.6 | `cd frontend/web && bun run test` (now runs with `NODE_OPTIONS=--no-experimental-webstorage` baked into the script — see §2 fix 6) | 38 `*.test.ts(x)` | 12 failed / 26 passed / 38 total | 13 failed, 139 passed, 152 total | 4.36s | **2 failed / 36 passed / 38 total** | **2 failed, 151 passed, 153 total** | ~4.4s |

Frontend: 13 of 15 originally-failing tests now pass (the 1 transform-level failure in
`payment/page.test.tsx` is counted as part of the 12-failed-files/13-failed-tests baseline, since
fixing its syntax error let 1 new test start running and immediately fail on a real, separate,
unfixed issue — see §3). Net: 2 tests remain failing, both intentionally left open (§3).

`bun run build` (Next.js): **fails**, unchanged before/after this session's fixes, for two
causes wholly unrelated to anything touched here (§3). `payment/page.tsx` — the file Task 2
targeted — no longer appears anywhere in the build's error output.

## 2. Every fix made

**Task 1 — iam-service missing module**
- `backend/service/iam-service/package.json:66,82` (declarations, unchanged) — `web-push@3.6.7`
  and `@types/web-push@3.6.4` were fully resolved in `backend/service/iam-service/bun.lock:1520`
  but absent from `node_modules`. Ran `bun install --frozen-lockfile` in that directory (verified
  zero lockfile diff before/after). Installed `web-push`, `@types/web-push`, and `cloudinary`
  (also locked-but-missing, pulled in by the same install). Unblocked 3 spec files that were
  failing to even compile (`TS2307`).

**Task 2 — `frontend/web/src/app/(pages)/appointments/[id]/payment/page.tsx`**
- Line 140: `</Button>` → `</button>`. The element opened at line 134 is a raw `<button>` (no
  `Button` import exists anywhere in the file; every other button in the file uses lowercase
  `<button>`/`</button>`). This was the JSX bug the task named.
- Lines ~283–286 (post-fix): deleted an orphaned `))}` (no matching `.map()` anywhere in the
  file — confirmed there is exactly one `.map((` in the whole file and it already closes
  correctly 2 lines earlier) and changed the following `</dl>` to `</div>` (there is zero `<dl`
  anywhere in the file; this was the same class of bug as the line-140 fix — a closing tag with
  the wrong element name — closing the "Payment Method" card `<div>` opened at line 239).
  Confirmed via `AskUserQuestion` before applying, since it went beyond a single tag-casing fix.
- Added `import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";` — used at
  line 358 but never imported anywhere in the file (every other protected route in the codebase
  imports it the same way; the file's own test already mocks this exact module path, confirming
  the import was intended). Without it the whole page threw `ReferenceError: ProtectedRoute is
  not defined` on first render.
- Added `const hasPayableAmount = amount > 0;` right after `amount` is computed (originally line
  56) — `hasPayableAmount` was referenced at render time and inside `handlePayment` but declared
  nowhere in the file, causing a `ReferenceError` on every render. `amount > 0` is the only
  non-speculative reading, matching both use sites (guard against a zero-amount submission;
  display an em-dash instead of ₫0).
- **Note on `tsc --noEmit`**: none of the last three bugs (missing import, undefined
  `hasPayableAmount`, and a third undefined identifier `code` — see §3) were caught by
  `bunx tsc --noEmit`, even with a fresh (non-incremental) build. Verified this is not
  file-specific: a deliberately-bogus identifier inserted anywhere in this file's function bodies
  is also silently accepted. Root cause not fully diagnosed (isolated `tsc` runs against a minimal
  tsconfig correctly catch `Cannot find name` errors, so the tool itself works — something about
  this project's specific tsconfig/Next.js plugin interaction is suppressing checker diagnostics
  project-wide, not just for this file). **`bunx tsc --noEmit` is not a reliable signal for
  undefined-identifier bugs in this project; `bun run test` (real DOM execution) is.**

**Task 3 — vitest infra + 6 test fixes**
- `frontend/web/vitest.config.ts` — tried adding `environmentOptions.jsdom.url`, did **not**
  fix the problem, reverted (net diff: none).
- `frontend/web/package.json:13` — `"test": "vitest run"` → `"test": "NODE_OPTIONS=--no-experimental-webstorage vitest run"`.
  Root cause: Node 26.5.0 (the system `node` binary vitest's worker pool spawns) ships
  `localStorage`/`sessionStorage` as an experimental global that is non-functional without
  `--localstorage-file` (this is the source of the `ExperimentalWarning: localStorage is not
  available...` printed on **every** test run all session, front- and back-end). Vitest's jsdom
  environment (`node_modules/vitest/dist/chunks/index.CmSc2RE5.js`, `populateGlobal`/
  `getWindowKeys`) only proxies a global onto the test sandbox if that key is **not already
  present** on `globalThis` — so Node's broken native `localStorage` silently wins over jsdom's
  real, working one. `--no-experimental-webstorage` removes Node's native global so vitest's
  proxy takes over correctly. Verified via an isolated probe test before committing to the config
  change. This single fix resolved 5 of the 13 originally-failing tests with no other changes:
  `Providers.test.tsx`, `booking-chat/conversation.test.ts`, `client.test.ts` (both cases),
  `FloatingBookingChat.test.tsx` (both cases).
- `frontend/web/src/shared/api/endpoint.test.ts:7-9` (bucket A) — expected URL changed from
  `http://localhost:8080/api/v1/appointments/doctor/doctor-1/worklist` to the relative
  `/api/v1/appointments/doctor/doctor-1/worklist`. `GATEWAY` is a hardcoded relative constant
  `"/api/v1"` in `src/shared/constants/env.ts:1` — deliberate, current architecture, not a bug.
- `frontend/web/src/shared/lib/toast.test.ts:126` (bucket A) — expected message changed from
  English (`"No account found for this email."`) to Vietnamese
  (`"Không tìm thấy tài khoản với email này."`). The file's own 10 sibling `it.each` cases in the
  same `describe` block already assert Vietnamese as the correct default when no locale cookie is
  set — this one test's English expectation was simply inconsistent with its own file's
  established convention.
- `frontend/web/src/features/schedule/scheduleAccess.test.ts:32-35` (bucket A) — updated expected
  route sets for RECEPTIONIST (removed `ROUTES.WORK_SHIFTS` — `WORK_SHIFT_ROLES` in
  `src/shared/constants/roles.ts:92-96` is `[ADMIN, DOCTOR, MANAGER]`, deliberately excluding
  front-desk staff from shift-catalog management) and NURSE (added `ROUTES.MY_SCHEDULE` —
  `MY_SCHEDULE_ROLES` at `roles.ts:67` is `[DOCTOR, NURSE]`, correctly giving nurses their own
  personal-schedule view). Both are real, named, intentional RBAC role lists, not oversights.
- `frontend/web/src/features/appointment/components/BookingWizard.test.tsx` (bucket C) — added
  `beforeEach`/`afterEach` freezing the clock to `2026-08-01T00:00:00` via
  `vi.useFakeTimers({ toFake: ["Date"] })` + `vi.setSystemTime(...)`. The test's fixture hardcodes
  `date: "2026-08-01"` as a day with a bookable 09:00 slot; `BookingWizard.tsx:471-478` correctly
  hides past time-of-day slots when the group's date equals **today's real date** — and today's
  real date is now 2026-08-01, so the fixture's own slot started getting hidden. `toFake: ["Date"]`
  (not full fake timers) was required — plain `vi.useFakeTimers()` breaks `@testing-library/
  user-event`'s internal `setTimeout` usage and makes the test hang/timeout.
- `frontend/web/src/app/(pages)/(auth)/unauthorized/page.test.tsx` (bucket C) — added
  `vi.mock("@/features/i18n", () => ({ useTranslation: () => ({ t: (_k, fb) => fb ?? _k }) }))`,
  matching the exact pattern already used by `Providers.test.tsx` and `BookingWizard.test.tsx`.
  This page's `useLocale()` comes from `LocaleProvider`'s React Context
  (`src/features/i18n/provider/LocaleProvider.tsx:17-20`), whose **default** context value (used
  when, as in this test, no `<LocaleProvider>` wraps the render) is hardcoded to `DEFAULT_LOCALE`
  ('vi') — the cookie is only read inside the provider's own `useEffect`, which never runs here.
  (A `document.cookie` override was tried first and confirmed **not** to work for this file,
  unlike the next two fixes — different locale-resolution mechanism, see below.)
- `frontend/web/src/app/(pages)/appointments/[id]/payment/callback/page.test.tsx` (bucket C) —
  added `document.cookie = "smile_locale=en; path=/"` in `beforeEach`, reset in `afterEach`. This
  page's error UI (`ErrorMessage` component, `src/shared/components/ui/ErrorMessage.tsx:1,20`)
  calls `extractApiError`/`getApiErrorMetadata` from `@/shared/lib/toast` directly — that module
  reads `document.cookie` as a plain function call (not React Context), so the cookie override
  works correctly here, unlike the unauthorized-page case above. Matches the precedent already
  established in `toast.test.ts:63`.

## 3. Bucket B / D — real defects left open, not fixed

| # | Bucket | File:line | Assertion / symptom | Why it fails |
|---|---|---|---|---|
| 1 | B | `frontend/web/src/app/(pages)/appointments/[id]/payment/page.tsx` (VNPay `<Icon>`, in the "Payment Method" card) | `payment/page.test.tsx` — `expect(screen.getByRole("img", { name: /vnpay/i })).toBeInTheDocument()` | The `<Icon icon="simple-icons:vnpay" .../>` renders an `<svg>` with no `role` or `aria-label`. `grep -rn "role=\"img\""` / `aria-label.*[Ii]con` across `frontend/web/src` returns **zero** other usages — there is no established accessibility convention for icons in this codebase to follow. Fixing this means inventing new ARIA markup, a design decision, not a mechanical fix. |
| 2 | B | `frontend/web/src/app/(pages)/appointments/[id]/payment/page.tsx:75` (inside `handlePayment`) | `orderInfo: \`Payment for ${code}\`` | `code` is referenced but declared nowhere in the file (same class of bug as the `hasPayableAmount` fix in §2, but this one only executes on a live button click, so it is **not** exercised by the currently-passing test and was left alone). Almost certainly should be `appointmentCode` (declared at line ~147, same component). Clicking "Proceed to Payment" in production will throw `ReferenceError: code is not defined`. |
| 3 | B | `frontend/web/src/app/(pages)/appointments/page.tsx:276` | `bunx tsc --noEmit` / `bun run build` both fail: stray `)}` with no matching opener, same bug class as the original `payment/page.tsx` fix but in an unrelated file | Discovered only as a byproduct of diagnosing Task 2 (`tsc --noEmit` output). Out of scope per "list and stop, don't fix unrelated build errors." Breaks the production build. |
| 4 | B | `frontend/web/src/app/(pages)/(user)/profile/page.tsx` | `bun run build` — `Module not found: Can't resolve 'next-cloudinary'` | `next-cloudinary@6.17.5` is declared in `package.json:32` and fully resolved in `bun.lock:1371`, but absent from `node_modules` — same exact pattern as the `web-push` fix in Task 1 (would very likely resolve with `cd frontend/web && bun install --frozen-lockfile`). Left unfixed since it surfaced only via the build log while diagnosing an unrelated file, outside both Task 2's and Task 3's named scope. |
| 5 | D | `frontend/web/src/features/booking-chat/api.test.ts:7-9` | `expect(API_ENDPOINTS.AI.BOOKING_CHAT).toBe("http://localhost:8080/api/v1/ai/booking-chat/chat")`, receives `"/api/v1/ai/booking-chat/chat"` | **Identical root cause to the `endpoint.test.ts` fix in §2** (stale absolute-URL assertion against the now-deliberately-relative `GATEWAY` constant) — this one was left untouched per the explicit booking-chat product-scope carve-out, even though the mechanical fix is known and trivial. |

## 4. Cannot verify (needs live infra)

- `backend/service/clinical-emr-service/src/appointments/appointment-scheduling.postgres.spec.ts`
  — gated on `RUN_POSTGRES_INTEGRATION=true`; inserts real rows against `core_clinic_service_db`
  to exercise the 3 GIST EXCLUDE constraints. Not run (mutates state; no Postgres container is
  running in this environment — `docker ps -a` shows zero SMILE-related containers).
- Whether a freshly-seeded hybrid stack boots clean end-to-end (all 4 services + frontend +
  Postgres/Redis/MailDev) — no containers are running in this environment; starting them was
  outside this session's read/write scope (Docker Compose bring-up wasn't part of any of the 4
  tasks).
- Whether `next-cloudinary`'s `bun install --frozen-lockfile` fix (defect #4 above) actually
  resolves the profile-page build error, or whether the file compiles clean after that but still
  fails for a *different* reason further down the build — not attempted.

---

# Session 2 — P0 build blockers + bug-class sweep

Branch: `dev` (re-verified at session start and throughout — no drift). Same hard rules honored:
no git writes, minimal diffs, no new dependencies (only `bun install --frozen-lockfile` against
already-locked packages), no edits to `appointments/`, `examination-sessions/`, `prescriptions/`,
`treatment-plans/` **backend service** business logic (frontend page components under
`app/(pages)/appointments/` were explicitly in scope per this session's brief).

## Task 1 — provenance (correction to initial hypothesis)

All 3 §3-defect files (`appointments/page.tsx`, `payment/page.tsx`, `profile/page.tsx`) share the
same most-recent commit in `git log`: `9cf25549` (`chore(frontend): shorten code comments to
terse labels`, single-parent, not a merge, 139 files / 543(+) / 914(-)). **That commit is not
actually responsible for the bugs** — `git show 9cf25549 -- <path>` for `appointments/page.tsx`
touches only comment lines near L76-127, nowhere near the bug at L276. Walking the file's commit
history further back (`git show <sha> -- <path>` for each), the true cause is the merge commit
**`c625a021` — "Merge branch 'dev' into feat/connect-flow"** (author KHOA, 2026-07-31 22:50:59,
parents `35d938d5` + `ec245719`). Its combined diff (`diff --cc`) shows the entire "Pay" button
`<Link>` block (wrapped in `{r.payment_status === "unpaid" && (...)}`) deleted during conflict
resolution while its own closing `)}` was left behind — a botched manual merge, not an automated
comment-sweep artifact. `payment/page.tsx`'s most recent merge in its own log is a *different*
commit, `2e112380`, with the identical message — i.e. a separate merge event in the same
`feat/connect-flow`→`dev` integration process, not the same commit. Six merge commits with
messages matching "connect-flow" exist in recent history (`e96aa4c5`, `2e112380`, `c625a021`,
`1bc23f6c`, `93ba5e33`, `1bc1628a`) — plausible that more of this pattern exists there, but a full
per-commit archaeology across all six was not attempted (out of this session's bounded scope).

## Task 2 — D6: next-cloudinary

`next-cloudinary@6.17.5` confirmed locked (`package.json:32`, `bun.lock:1371`) but absent from
`node_modules`. `bun install --frozen-lockfile` in `frontend/web` — verified zero `bun.lock` diff
before/after. Packages pulled in (11 total): `next-cloudinary` + its 3 transitive deps
(`@cloudinary-util/types`, `@cloudinary-util/url-loader`, `@cloudinary-util/util`), plus
`@biomejs/biome@1.9.4` (also locked-but-missing, unrelated to next-cloudinary, pulled in by the
same install pass) and its platform binary.

## Task 3 — D5: `appointments/page.tsx:276`

Root cause identified via git history (§ Task 1), not reconstructed from current-state
indentation. Restored the deleted "Pay" button block verbatim (content confirmed identical on
both merge parents) between the existing `</Link>` (View button) and the orphaned `)}`, which now
correctly closes the restored `{r.payment_status === "unpaid" && (...)}` conditional:

```tsx
<Link href={ROUTES.APPOINTMENT_DETAIL(r.appointment_id)} title={t("appointments.list.view", "View")} ...>
  <Icon icon="lucide:eye" width={15} />
</Link>
{r.payment_status === "unpaid" && (          {/* restored */}
  <Link href={ROUTES.APPOINTMENT_PAYMENT(r.appointment_id)} title={t("appointments.list.pay", "Pay")} ...>
    <Icon icon="lucide:credit-card" width={15} />
  </Link>
)}                                             {/* was the orphaned token */}
```

Not ambiguous — no `.map()`/structural guesswork required, unlike the payment page reconstruction
in Session 1. Verified: `bunx tsc --noEmit` no longer lists this file.

## Task 4 — D7: `payment/page.tsx:75` undefined `code`

Read the full component. Fixed: `` `Payment for ${code}` `` → `` `Payment for ${appointmentCode}` ``.
`appointmentCode` (declared `page.tsx:148`, `appointment.appointmentCode ?? appointment.appointment_code`)
is the only plausible candidate — `appointment?.code` doesn't exist on the file's own inline
`appointment` type (L36-53), and `params.id`/`appointmentId` is a UUID, semantically wrong for a
payment-gateway order description and redundant with the `appointmentId` field already sent
separately in the same `createPayment` call. `appointmentCode` is also the exact pattern this file
already uses twice elsewhere for display (L166, L195). Verified clean via `tsc --noEmit`.

## Task 5 — build

**`bun run build` now succeeds** (`✓ Compiled successfully in 13.8s`), all 61 routes generated,
including `/profile`, `/appointments`, `/appointments/[id]/payment`,
`/appointments/[id]/payment/callback`. Before this session: failed on both D5 and D6. No other
build errors surfaced — nothing else needed fixing.

## Task 6 — bug-class sweep

ESLint is configured: flat config at `frontend/web/eslint.config.mjs` (extends
`next/core-web-vitals` + `next/typescript`), `"lint": "eslint ."` in `package.json:9`.
`bunx eslint --print-config` confirms the *effective* rule set: `no-undef` is **off** (`0`) and
there is no `@typescript-eslint/no-undef` rule (typescript-eslint doesn't ship one — projects are
expected to rely on the TS compiler instead, which we already established is not reliable here).
Only `react/jsx-no-undef` is active (error-level) — it catches undefined **JSX component tags**
but not bare-variable references used inside `{...}` expressions or plain (non-JSX) missing
imports, i.e. it would **not** have caught the `hasPayableAmount`/`code`/missing-`ProtectedRoute`-
import bugs from Session 1. This is a real, unaddressed coverage gap in this project's tooling —
neither `tsc` nor `eslint` fully covers plain undefined-identifier bugs; only the JSX-tag subset
is covered.

`bunx eslint src/` → 18 problems (5 errors, 13 warnings). Of the 5 errors, 4 are `react/jsx-no-undef`
(the target bug class); the 5th is an unrelated `jsx-a11y/alt-text` finding
(`src/features/clinic/components/ClinicImage.tsx:27`, missing `alt` prop — not this bug class, not
reported further). The 13 warnings are unused-import/import-order/a11y-role/exhaustive-deps
findings, not undefined-identifier bugs — not reported in the table below.

Per Task 5's build output (all 61 routes listed, all non-zero size, no route failed to generate)
— the `bun run build`-per-route fallback (Task 6c) surfaces no additional evidence beyond what
ESLint already found; it would not catch a runtime-only `ReferenceError` regardless, since nearly
every route here is server-rendered on demand (`ƒ Dynamic`), not statically prerendered, so
component bodies aren't executed at build time.

### Sweep table

| file:line | undefined identifier | which user flow reaches it | on demo-path list? |
|---|---|---|---|
| `frontend/web/src/app/(pages)/examinations/[id]/page.tsx:4067` | `ConfirmDialog` | **Every single visit to the examination detail page** — `<ConfirmDialog open={deleteTarget !== null} ...>` is rendered **unconditionally** at the top level of the component's return (not gated by any loading/error/data state), so this crashes on first render 100% of the time, regardless of what's being deleted or whether the delete dialog is even open. | **Yes — `/examinations/[id]`** |
| `frontend/web/src/app/(pages)/examinations/[id]/page.tsx:1718` | `InlineFeedback` | Clinical Alerts panel's loading state (`clinicalContextLoading ? <InlineFeedback tone="info">...` ) — reached on every page load while clinical context data is in flight, i.e. very early in the same page's lifecycle (though L4067 above crashes first regardless). | **Yes — `/examinations/[id]`** |
| `frontend/web/src/app/(pages)/examinations/[id]/page.tsx:1725` | `InlineFeedback` | Clinical Alerts panel's error state (`clinicalContextUnavailable ? <InlineFeedback tone="error" ...>` ) — reached if the clinical-context fetch fails. | **Yes — `/examinations/[id]`** |
| `frontend/web/src/app/(pages)/examinations/[id]/page.tsx:4362` | `InlineFeedback` | Error display inside a shared delete-confirmation form component (`{error && <InlineFeedback tone="error">...}`) — reached only if a delete/remove submission fails; moot in practice until L4067 is fixed, since that crash happens first on every render. | **Yes — `/examinations/[id]`** |

Both `InlineFeedback` (`src/shared/components/ui/InlineFeedback.tsx`) and `ConfirmDialog`
(`src/shared/components/ui/ConfirmDialog.tsx`) are real, existing, independently-tested components
(each has its own passing `.test.tsx`) — this file simply never imports either. `grep -n "^import"
... | grep -i "shared/components/ui"` on this file returns nothing. Exact same bug class as the
missing `ProtectedRoute` import fixed in Session 1 Task 2. **Not fixed** — Task 6 was explicitly
scoped as report-only ("Do NOT auto-fix; list them").

None of the other 9 demo-path routes (`/login`, `/dashboard`, `/appointments`,
`/appointments/new`, `/appointments/[id]`, `/appointments/[id]/payment`, `/patients`, `/admin`,
`/admin/refunds`, `/admin/revenue-reports`) showed any `react/jsx-no-undef` finding.

## Before / after test totals

All 5 suites re-run at the end of this session; none of this session's fixes touched test files,
business logic, or the vitest/jest config — so all totals are **unchanged from Session 1's final
state** (confirms no regression):

| Service | Command | Tests |
|---|---|---|
| iam-service | `cd backend/service/iam-service && bun run test` | 21/21 suites, 114/114 passed |
| clinical-emr-service | `cd backend/service/clinical-emr-service && bun run test` | 44/45 suites (1 skipped), 379/385 passed |
| payment-service | `cd backend/service/payment-service && bun run test` | 5/5 suites, 33/33 passed |
| gateway-service | `cd backend/service/gateway-service && bun run test` | 9/9 suites, 42/42 passed |
| frontend/web | `cd frontend/web && bun run test` | 36/38 files, 151/153 passed (same 2 open Session-1 bucket B/D failures — VNPay icon accessible-name gap, `booking-chat/api.test.ts`) |

## Files touched this session

- `frontend/web/src/app/(pages)/appointments/page.tsx` (restored deleted "Pay" button block)
- `frontend/web/src/app/(pages)/appointments/[id]/payment/page.tsx` (fixed undefined `code` → `appointmentCode`)
- `frontend/web/node_modules/` (installed `next-cloudinary` + `@biomejs/biome` + transitive deps, all pre-locked — `bun.lock` unchanged)

No test files, business logic, or config files were touched this session.

# Session 3 — full stack bring-up + Playwright live verification

Note: this session was executed by two agent runs. The first ran ~30 minutes and was cut off
mid-Flow-A5 (context exhaustion, not a real stopping point) after completing Tasks 0, 2 and
starting Task 5; a second fresh run redid Tasks 1/3/4 (their findings were never persisted by
the first run) and continued Task 5 from A5. This section is written incrementally as each
task/flow completes, specifically so a repeat cutoff doesn't lose already-verified work.

## Task 0 — /examinations/[id] crash fix (confirmed via diff)

`ConfirmDialog` (`src/shared/components/ui/ConfirmDialog.tsx`) and `InlineFeedback`
(`src/shared/components/ui/InlineFeedback.tsx`) are now imported at
`frontend/web/src/app/(pages)/examinations/[id]/page.tsx:56` and `:65` respectively — both
components already existed with their own passing `.test.tsx`; the page simply never imported
them. Fix is a 2-line import addition, `git diff --stat` confirms `2 insertions(+), 0 deletions(-)`
for this file this session.

**Line-count finding (not fixed, recorded per instruction):** page files over 1500 lines —
`frontend/web/src/app/(pages)/examinations/[id]/page.tsx` is **4381 lines** (`wc -l`). No other
page.tsx file in the demo-path set approaches this; next largest checked was well under 1000
lines. Not refactored, per scope.

## Task 1 — c625a021 blast radius (read-only)

`c625a021` is a merge commit (`Merge branch 'dev' into feat/connect-flow`, KHOA, 2026-07-31
22:50:59 +0700), 233 files changed, +8910/-14215 across the whole repo — the vast majority of
the deletions are doc/plan-file cleanup (`docs/paper/**`, `docs/todo/plans/**`,
`database/COLUMN-INVENTORY.md`, etc.), not code.

Scoped to `frontend/web/src/app/(pages)/**` (8 page.tsx files touched by this merge:
`(user)/profile`, `admin/audit-logs`, `admin/roles-management`, `admin/users-management`,
`appointments/[id]`, `appointments`, `clinics/[id]`, `clinics`), only **one** file shows an
interactive-element deletion with no replacement in the merge result:

| file | what was deleted | which user flow loses it |
|---|---|---|
| `frontend/web/src/app/(pages)/appointments/page.tsx` | The `payment_status === "unpaid"` conditional `<Link>` to `ROUTES.APPOINTMENT_PAYMENT` (the "Pay" button, `lucide:credit-card` icon) in the appointments list table — combined-diff resolution dropped the whole conditional block while reformatting the surrounding JSX (multi-line wrap of the `!isLoading && !isError && ...` condition) | Patient's "pay from the list view" path (`/appointments` → Pay button → `/appointments/[id]/payment`) |

**Already fixed** by an earlier session (confirmed live in current file at
`appointments/page.tsx:270-282` — `APPOINTMENT_DETAIL`, `APPOINTMENT_PAYMENT`, both icons present).
The other 7 page files: diffed each against the merge result, filtered for dropped
`<Link>/<button>/<Button>/<Icon>/onClick/onSubmit/href=` lines with no corresponding addition —
zero hits. No other unreplaced deletions found in this file set.

## Task 3 — seed date window (P0)

**Verdict: NOT a blocker for the 2026-08-08 demo, but the mechanism is fragile.**

Live DB query (credentials read from `backend/service/clinical-emr-service/.env`,
`CLINIC_DATABASE_USERNAME`/`CLINIC_DATABASE_PASSWORD`/`CLINIC_DATABASE_NAME` — values not
printed):

| table | min date | max date | future rows (>= today 2026-08-01) | total rows |
|---|---|---|---|---|
| `doctor_schedules` | 2026-07-15 | 2026-10-27 | 1200 | 1440 |
| `appointments` | 2026-04-30 | 2026-08-28 | 62 | 242 |
| `doctor_leaves` | 2026-07-19 | 2026-09-02 | 11 | 16 |

This contradicts the prior docs' claim of a 2026-07-13→2026-07-26 (entirely past) schedule
window — that claim is stale; the currently-loaded seed data has a materially wider window and
comfortably covers 2026-08-08.

Root cause, `backend/service/clinical-emr-service/src/database/seeds/relational/clinic/`:
- `run-clinic-seed.ts:66` — `const ANCHOR_DATE = new Date('2026-07-29T00:00:00.000Z')` —
  **hardcoded literal, not computed relative to `now()`**.
- `clinic-seed-schedules.ts:1-2` — `SCHEDULE_PAST_DAYS = 14`, `SCHEDULE_FUTURE_DAYS = 90`;
  `getSeedScheduleDates()` (`clinic-seed-schedules.ts:4-18`) generates one row per non-Sunday day
  in `[ANCHOR_DATE - 14d, ANCHOR_DATE + 90d]` → exactly matches the observed 2026-07-15..10-27
  window.

**Recommended fix (not applied — affects shared demo data, operator decides):** either (a)
compute `ANCHOR_DATE` as `new Date()` at seed-run time instead of a literal, or (b) at minimum
bump the literal to track the actual defense date before any re-seed. As of this check the
window is safe through 2026-10-27; it will silently go stale again on any re-seed after that
date, or sooner if the defense date slips past it.

## Task 4 — Postgres GIST EXCLUDE integration suite

```
cd backend/service/clinical-emr-service
RUN_POSTGRES_INTEGRATION=true CLINIC_DATABASE_HOST=localhost bun run test -- appointment-scheduling.postgres.spec.ts
```

**PASS — 6/6 tests, 1/1 suite, 1.866s.**

```
✓ should reject overlapping appointments for the same doctor (7 ms)
✓ should reject overlapping appointments for the same room (11 ms)
✓ should reject overlapping appointments for the same patient (11 ms)
✓ should allow adjacent occupied intervals (12 ms)
✓ should do not let cancelled appointments block a slot (4 ms)
✓ should allow exactly one concurrent commit for the same slot (9 ms)
```

No setup fixes needed — ran clean against the live `smile-postgres` container on first try.

## Task 5 — Playwright flow verification

Frontend http://localhost:3000, gateway :8080, MailDev :1080. Screenshots in `docs/audit/evidence/`.

### Flow A — PATIENT (nguyenvana.pt@email.com, plus a fresh qa+<ts>@example.com registration)

| ID | Step | Result | Evidence | HTTP / notes |
|---|---|---|---|---|
| A1 | Register brand-new account, verify via MailDev | PASS | `PATIENT-01-register-success.png` | done in prior sub-session |
| A2 | Log in as seeded patient, land on `/dashboard` | PASS | `PATIENT-02-dashboard.png` | |
| A3 | Browse `/clinics`, `/services`, doctor list | PASS | `PATIENT-03-clinics-services.png` | real seeded data renders |
| A4 | BookingWizard "By Specialty" end-to-end | PASS | `PATIENT-04-booking-by-specialty-success.png` | created `APT-20260801-RS9J`, 2026-08-08 09:00, status `scheduled` |
| A5 | BookingWizard "By Doctor", clinic→doctor dropdown populated (no raw UUID field) | PASS | `PATIENT-05-appointments-list-A4-A5-done.png` | doctor cards show real names ("BS. Felix Bui", "BS. Benjamin Tran", "BS. Amelia Nguyen" etc.); first attempt on 2026-08-08 correctly 409'd on the **one-booking-per-patient-per-day** rule (`Bạn đã có một lịch hẹn trong ngày này rồi.`, not a bug); retried 2026-08-10 → created `APT-20260801-WL5Z` |
| A6 | Double-booking check: same doctor (Amelia Nguyen) + same slot (2026-08-10 10:00) as same patient | PASS | `PATIENT-07-A6-doublebooking-slot-disabled.png` | UI itself disables the conflicting slot — 09:15–10:45 all show "Không còn trống" (unavailable), backed by a real `GET /api/v1/appointments/availability?...doctor_id=...` call (200). Booking is prevented before submission is even possible, not just rejected after — stronger than a bare 409. |
| A7 | "Send Reminder" / "Send Confirmation" buttons on `/appointments/[id]` | N/A for PATIENT | `PATIENT-06-appointment-detail-uuid-bug.png` | No such buttons exist on the patient-facing detail page for either appointment checked — only Edit/Cancel/Pay. Likely a front-desk/staff-only action elsewhere (`FRONT_DESK_ROLES` referenced in this same file); to be confirmed against Flow B/C. Not a patient-flow defect as scripted — re-scope or confirm staff-side in a follow-up session. |
| A8 | "Confirm" → status becomes `confirmed` | PASS (via different path) | `PATIENT-08-A9-payment-success.png` | No separate "Confirm" button for PATIENT; status moved `scheduled → confirmed` automatically as a side effect of successful payment (A9), not a distinct patient action. |
| A9 | `/appointments/[id]/payment` — Pay button exists, mock VNPay completes | PASS | `PATIENT-08-A9-payment-success.png` | Clicking "Thanh toán ngay" drove straight through the mock VNPay redirect to `/payment/callback?vnp_ResponseCode=00&...` and back to the detail page with `status=confirmed`, `payment=paid`, amount 200.000 ₫, a `Hoàn tiền` (Refund) row appeared. The c625a021-restored Pay button (Task 1) works end-to-end live. |
| A10 | Notification bell: badge, click, decrement, persists on reload | PASS | `PATIENT-09-A10-notification-read.png` | badge showed "1" → clicked the one notification → badge gone, confirmed still gone after navigating to `/dashboard` |

**New defects found in Flow A** (continuing numbering from qa-baseline.md §3's D9):

**D10 — Patient's own name never resolves on their own appointment detail page (403, not a crash).**
`frontend/web/src/app/(pages)/appointments/[id]/page.tsx:264-269` calls
`API_ENDPOINTS.PATIENT.DETAIL(patient_id)` → `GET /api/v1/patients/:patient_id`, which is
role-gated `@Roles(ADMIN, MANAGER, DOCTOR, RECEPTIONIST, NURSE)` — PATIENT is deliberately
excluded (`backend/service/clinical-emr-service/src/patients/patients.controller.ts:79-88`,
staff-only lookup by design). A patient viewing their own appointment therefore always gets
`403` on this call (confirmed via network log: `GET /api/v1/patients/a3000000-...-010 => 403`,
reproduced 4 times across 2 different appointments). Code degrades gracefully — no crash — but
silently falls back to displaying the **full raw patient UUID** (line 274:
`patientName || (apt?.patient_id ?? "—")`, no truncation, unlike the doctor-name fallback which
at least truncates+prefixes) instead of the patient's name, on every single appointment detail
view for every patient, always. A working self-service endpoint already exists —
`GET /patients/me` / `findMine()` (`patients.controller.ts:52-61`) — but isn't used here.
Fix would be: resolve "my own name" from the already-available `useAuth()`/session user object
(same pattern already used for the doctor case at line 255-256: `if (doctorId === user?.userId)`)
instead of an extra staff-gated fetch. Not fixed — not crash-class, needs a product decision on
which of several valid fix shapes to take.

**Related, lower-severity, not a separate defect:** the doctor name field showed a transient
`Bác sĩ 550e8400` (truncated-UUID fallback, same file line 258-259) for one render immediately
after the post-payment `invalidateQueries` refetch, then self-corrected to "Amelia Nguyen" on
the next render once `GET /api/v1/user-profiles/550e8400-...` (200 OK both times) resolved.
Pure loading-state flash, not persistent — not worth a defect row on its own, noted here only
because it looks superficially like the same bug as D10 and isn't.

**Flow A note (scope-adjacent, not a new numbered defect, ties to E2):** the booking wizard's
step-1 screen carries a persistent link "Thích trò chuyện hơn? Dùng Trợ lý đặt lịch" → `/chat`
(the booking chatbot). Flagged here, detailed under Flow E2 below since that's the flow this
task explicitly designated for hidden-feature confirmation.

**Credential correction (affects Flow B accounts as given in the task brief):** neither
`dr.nguyenvana@smile.com` nor (presumably) `recep.levan@smile.com` exist as
seeded accounts on `dev` — those emails come from a different repo/branch's seed data. Verified
against the live `auth_service_db.accounts` table: real seeded DOCTOR accounts are
`doctor1@smile.com` through `doctor8@smile.com`. `doctor1@smile.com` = Amelia Nguyen (the same
doctor used throughout Flow A) — used for Flow B below.

### Flow B — DOCTOR (doctor1@smile.com = Amelia Nguyen)

| ID | Step | Result | Evidence | HTTP / notes |
|---|---|---|---|---|
| B1 | `/dashboard` doctor worklist renders | PASS | `DOCTOR-01-dashboard-worklist.png` | "Chào mừng trở lại, Amelia Nguyen", today's stats, 7-day upcoming schedule (all real shifts), upcoming-appointments list including `APT-20260801-RS9J` from Flow A |
| B2 | `/schedules/leaves` — submit a leave request, check it appears pending | **NOT ATTEMPTED** | — | Not reached in the time available for this pass — no result to report either way. |
| B3 | The appointment booked in A4/A5 appears in this doctor's assigned list | PASS | `DOCTOR-01-dashboard-worklist.png` | Confirmed as a side-observation of B1: the same screenshot's upcoming-appointments list already includes `APT-20260801-RS9J` (created for this doctor in Flow A4) — not separately re-verified via a dedicated `/appointments` list-view pass. |
| A7 (re-scoped) | "Gửi xác nhận" / "Gửi nhắc lịch" (Send Confirmation / Send Reminder) buttons | **FAIL** | `DOCTOR-02-B-notification-503.png` | Confirms these ARE doctor/staff-only actions (not patient-facing, resolving the A7 open question) — both buttons exist here on `APT-20260801-RS9J`. Both fail identically: frontend gets `POST /api/v1/appointments/:id/notifications/confirmation → 503` ("Dịch vụ tạm thời không khả dụng"). Root cause traced via `/tmp/smile-clinical.log` and `/tmp/smile-gateway.log`: clinical-emr-service's `AppointmentNotificationPublisher` calls iam-service's internal notification endpoint and gets a real `401` (`error_class=HttpError http_status=401`), which clinical-emr-service translates to a `503` for the frontend. See **D11** below for root cause. |
| B4 | Move appointment to `checked_in` (find the reachable role/route) | **Could not find, worked around** | — | No check-in action exists on the DOCTOR role's appointment list (`/appointments`, 56 rows, no per-row action beyond "Xem") or detail page (`Gửi xác nhận`/`Gửi nhắc lịch`/`Hủy` only). Consistent with the `FRONT_DESK_ROLES` comment at `appointments/[id]/page.tsx:227-229` — check-in is likely RECEPTIONIST-only and wasn't reachable in the time available for this pass. Worked around by using a pre-existing seeded `checked_in` appointment (`APT-2026-0181`, patient Samuel Pham) for B5/B6 instead of blocking the rest of the flow. Flagging for a follow-up receptionist-role pass rather than guessing. |
| B5 | `/examinations/new` — create session against a `checked_in` appointment | PASS | `DOCTOR-03-B6-examination-page-loads.png` | Form auto-populated clinic/doctor/patient/chief-complaint from the checked-in appointment; "Create session" → redirected to `/examinations/4ba47e6b-...` |
| B6 | `/examinations/[id]` — full clinical chain | **PASS — the headline result of this whole session** | `DOCTOR-03/04-...png` | Page (**the one fixed in Task 0**) rendered with **zero crash-class console errors** — only the same benign initial-401-race pattern seen everywhere else. Full chain exercised live: symptom added → diagnosis added → treatment plan created (all Task-0-adjacent propose-blocker fields filled up front: cost, quote version, risk disclosure, alternatives) → proposed (`draft→proposed`, no errors) → e-prescription created → item added (**one 4xx caught**: "Instructions are required" client-side validation on first submit — the field has no visible `*` unlike other required fields, minor UX gap, not a defect worth its own row) → issued (`draft→issued`, confirm dialog handled, success dialog shown) → X-ray order created (`ordered`). No 4xx/5xx from the backend at any step in this chain. |
| B7 | Finalize examination → appointment reaches `completed` | PASS | `DOCTOR-05-B7-examination-completed.png` | Confirm dialog "Ghi chú khám sẽ bị khóa" accepted → session status `in progress → completed`, all edit controls correctly disabled/locked |
| B8 | `/patients` list + a patient's medical record render for DOCTOR | PASS | `DOCTOR-06-B8-patient-record.png` | `/patients`: 40 real patients. `/patients/a3000000-...-021` (Samuel Pham, the exam patient): full history — medical history (1), medical records (5, including the exam just completed in B6/B7), treatment records (4) all render with real data. Confirms D10 is specific to the PATIENT role's own appointment-detail lookup — DOCTOR role hits no such 403 anywhere in this page. Related, not a new defect: several OTHER historical entries on this same page show the same `Bác sĩ 550e8400` truncated-UUID fallback (not just a one-frame flash this time — persists across a static already-loaded page) sitting right next to entries correctly resolved to "Amelia Nguyen" for the *same* underlying doctor ID — looks like a caching/hydration inconsistency in this list's name-resolution, distinct from D10's root cause, not chased further given time. |
| B9 | `/performance` — doctor's own performance view | **FAIL** | `DOCTOR-06-B8-patient-record.png` (screenshot captured mid-navigation, shows the 404) | `GET /performance` → **404**, confirmed via HTTP status in the navigation response, not just an empty page. Matches a previously-known distinction between `/performance` (doctor-gated, apparently unrouted) and `/admin/performance` (the one that exists) — recorded here as newly re-confirmed against `dev`, not re-diagnosed further given time budget. |

**D11 — Appointment confirmation/reminder emails are completely broken: internal service-to-service auth token was never provisioned.**
`backend/service/clinical-emr-service/src/appointments/appointment-notification.publisher.ts:108`
reads `process.env.INTERNAL_SERVICE_TOKEN` and, if set, sends it as the `x-internal-token`
header (`:115`) when calling iam-service's internal notification endpoint. iam-service's
`src/config/internal-secrets.ts:9-11` declares `INTERNAL_SERVICE_TOKEN` and `IAM_INTERNAL_API_KEY`
as `REQUIRED_INTERNAL_SECRETS` for that same guard. Checked both services' `.env` files: **neither
`backend/service/iam-service/.env` nor `backend/service/clinical-emr-service/.env` defines
`INTERNAL_SERVICE_TOKEN` at all** (only `IAM_INTERNAL_API_KEY` is present in both). Startup
doesn't fail loudly because `NODE_ENV=development` is in `EXEMPT_ENVIRONMENTS`
(`internal-secrets.ts:13,18-20`) — the check is skipped, so both services boot fine but every
runtime call between them for this feature 401s, silently, every time. This is why the earlier
qa-recon pass never caught it (it's a live cross-service call, not something `tsc`/unit tests
would surface) and why Task 2's health checks all passed (health endpoints don't exercise this
path). **Not fixed** — this needs a shared secret value generated and set identically in both
`.env` files; picking/generating that value is a config decision left to the operator rather
than something to invent unilaterally, even though the mechanical fix is a one-line env addition
in two files.

**Credential correction:** `admin@smile.com` DOES exist as given in the task brief (unlike the doctor account) — confirmed via `auth_service_db.accounts`. Also present: `manager1/2@smile.com`, `receptionist1-4@smile.com` (task brief's `recep.levan@smile.com` does not exist, not needed — no step required it).

### Flow C — ADMIN (admin@smile.com)

| ID | Step | Result | Evidence | Notes |
|---|---|---|---|---|
| C1 | `/admin` console renders | PASS | `ADMIN-01-C1-console.png` | only the benign initial-401-race pattern in console, larger batch (8 calls) since this route fires more requests, all silently retried/resolved |
| C2 | `/admin/users-management` — list, open one user | PASS | `ADMIN-02-C2-users-management.png` | 61 real users, paginated 7 pages; opened role-management dialog for one user with no errors |
| C3 | `/admin/roles-management` — list roles/permissions | PASS | (not separately captured, verified via snapshot) | 6 real roles (admin/doctor/receptionist/patient/manager/nurse) with an expandable permission matrix per row |
| C4 | `/admin/facility` — clinics + treatment rooms | **FAIL (route doesn't exist on `dev`)** | — | `GET /admin/facility` → **404**. This route/page is from a different repo/branch context, not `dev`'s actual nav — the admin sidebar's real "Phòng khám" (Clinics) link points at the general `/clinics` list (verified rendering fine, same as Flow A3), and there is no separate admin-scoped treatment-room management page reachable from the nav. Recorded as a spec-vs-reality mismatch, not chased into a defect since it was never real on this branch. |
| C5 | `/admin/refunds` — approve a pending refund, check revenue reflects it | PASS | (state change visible in live page) | 9 pending on load; clicked "Approve" on the oldest pending row (450.000 ₫) → succeeded, no errors, pending count dropped to 8, that row's status flipped to "Refunded" live in the table. Did not separately verify revenue-report $ reflection given time budget — flagged as a follow-up, not assumed. |
| C6 | `/admin/audit-logs` — renders with real entries | PASS | (verified via snapshot) | 24 real events (logins, registration, KYC verifications), actor names + IDs resolved correctly (no UUID-fallback issue here, unlike D10/B8) |
| C7 | `/admin/performance` and `/admin/revenue-reports` — charts render | PASS | `ADMIN-03-C7-revenue-reports.png`, `ADMIN-04-C7-performance.png` | both render with charts/data, no console errors beyond the benign race pattern; did not exercise filter interactions given time budget |

**Credential correction (2nd):** the task brief's `nguyenvana.pt@email.com` also does not exist on `dev` (confirmed via `auth_service_db.accounts`) — the "PATIENT" used throughout Flow A/B was actually **`patient10@smile.com`** (= Zoe Truong, patient_id `a3000000-...-010`), which the dead first-run agent must have silently substituted before it died (never recorded as a correction, since it never got to write Session 3 to the file). Used `patient10@smile.com` for Flow D below.

### Flow D — RBAC negative checks

| ID | Step | Result | Notes |
|---|---|---|---|
| D1 | PATIENT → `/admin` | PASS | Redirected to `/unauthorized?from=%2Fadmin&roles=ADMIN`, page correctly shows "Vai trò đăng nhập: Patient" vs "Vai trò được phép: Admin" |
| D2 | PATIENT → `/examinations` | PASS | Redirected to `/unauthorized?from=%2Fexaminations&roles=ADMIN%2CDOCTOR%2CNURSE%2CMANAGER` |
| D3 | Log out → `/dashboard` directly | PASS | Redirected to `/login?callbackUrl=%2Fdashboard` |
| D4 | Cross-patient data access via a DIFFERENT patient's appointment/payment/medical-records/dashboard | **PASS (no leak found this pass)** | Bearer-token extraction via `browser_evaluate` was blocked by the app's own architecture, not the tool: `auth-storage` in localStorage holds only `refreshToken` + a full `user` object (**including `passwordHash`** — see note below) with **no `accessToken` field at all**, and a bare same-origin `fetch()` with `credentials:'include'` got 401 even for `/patients/me` (own record) — the access token is kept in-memory only, not attached by raw `fetch`. Worked around by navigating the actual UI directly to another patient's appointment (`/appointments/a5000000-...-003`, belongs to patient `a3000000-...-003`, NOT the logged-in `patient10`): `GET /api/v1/appointments/:id` → **403** ("Bạn không có quyền thực hiện thao tác này"), same for `GET /api/v1/payments/appointment/:id` → **403**. Live-verified: appointments and payments are correctly ownership-checked. Code-verified (not live-tested, time budget): `GET /medical-records/patient/:patient_id` is role-gated to ADMIN/MANAGER/DOCTOR only — PATIENT can't reach it at all, by role exclusion, not ownership check (`medical-records.controller.ts:27-29`); `GET /reports/dashboard/patient` accepts `patient_id` as a query param but the service layer (`reports.service.ts:446-471`, `resolveDashboardPatientId`) explicitly re-resolves to the caller's own `patient_id` for non-staff roles and throws `ForbiddenException` if the query param doesn't match — also safe. No exploitable cross-patient leak found in this pass, but this was not an exhaustive endpoint sweep. |

**Side finding from D4 (not a numbered defect — informational, not exploitable via a network attacker, but worth knowing):** the frontend's persisted Zustand `auth-storage` localStorage entry stores the **entire account object returned at login, including `passwordHash`**. It's a bcrypt-style hash, not plaintext, and localStorage is same-origin-only — but persisting any password material to client-side storage is unusual practice and worth a second look; not chased further (would need to trace `useAuth.ts`'s persisted store shape) given time budget.

### Flow E — confirm hidden features stay hidden

| ID | Step | Result | Notes |
|---|---|---|---|
| E1 | Forgot/Reset password link reachable from `/login`? | PASS (correctly hidden) | Searched the fully-rendered login page for "Quên mật khẩu" / "password" — zero matches. Not reachable. |
| E2 | Booking chatbot must not appear | **FAIL — still reachable** | A persistent "Thích trò chuyện hơn? Dùng Trợ lý đặt lịch" (~"Prefer to chat? Use the Booking Assistant") link → `/chat` sits at the bottom of every step of `/appointments/new`'s BookingWizard (seen throughout Flow A). AI_ROUTES_ENABLED-style gating, if it exists, isn't hiding this entry point on `dev`. |
| E3 | Dental imaging "AI Analyze" button must not appear | PASS (correctly hidden) | Checked `/dental-images` as DOCTOR — searched for "AI" (only false-positive substring hits inside patient surnames like "Mai") and "Phân tích" (Analyze) — zero real matches. Consistent with a prior session's exhaustive code-search finding that no AI-analyze control exists anywhere in this codebase. |
| E4 | Any "Tải PDF"/download button that does nothing | **Inconclusive, not confirmed either way** | Searched for literal "Tải PDF" text on `/dental-images` — no match. The closest candidate noticed during this session is the "Xuất" (Export) button on each entry of a patient's medical-record history (Flow B8) — did not click it to verify whether it produces a real file or no-ops, given time budget. Not recorded as a confirmed defect. |

## c625a021 deletion table — annotated with empirical confirmation

From Task 1 (only one unreplaced deletion found in the `frontend/web/src/app/(pages)/**` scope):

| file | what was deleted | which flow loses it | empirically confirmed this session? |
|---|---|---|---|
| `appointments/page.tsx` | the `payment_status === "unpaid"` conditional "Pay" `<Link>` in the list table | Patient's "pay from the list view" path | **Yes — fully confirmed live.** Already fixed by an earlier session (restored before this session started). This session's Flow A9 clicked exactly this restored button on a real unpaid appointment, drove the full mock-VNPay redirect round trip, and landed back on the detail page with `status: confirmed`, `payment: paid`, a real payment row, and a `Hoàn tiền` (Refund) action — then Flow C5 approved a *different* real refund end-to-end. The restoration is not just present in the diff, it is a working, demo-ready path. |

No other unreplaced deletions were found in this file scope (Task 1), so there is nothing else in this table to annotate.

## Everything fixed in this specific continuation session

**Nothing.** This fork made zero source-code edits — Task 0's `examinations/[id]/page.tsx` import fix, and the `appointments/page.tsx` Pay-button restoration and `payment/page.tsx` undefined-`code` fix referenced above, were all already committed to the working tree by earlier sessions/agent runs before this continuation started (confirmed via `git diff --stat` at the top of this run: 11 files changed, unchanged from before). This session was diagnosis, live verification, and documentation only, per Task 5/6's report-only scope for anything short of crash-class.

## Final full re-run of all 5 suites (end of Session 3)

| Service | Result | vs. Session 1/2 baseline |
|---|---|---|
| iam-service | 21/21 suites, 114/114 tests | unchanged |
| clinical-emr-service | 44/45 suites (1 skipped), 379/385 tests | unchanged |
| payment-service | 5/5 suites, 33/33 tests | unchanged |
| gateway-service | 9/9 suites, 42/42 tests | unchanged |
| frontend/web | 36/38 files, 151/153 tests | unchanged (same 2 known open defects: VNPay icon accessible-name gap, `booking-chat/api.test.ts`) |

No regressions from any activity in this session (none of it touched test files, business logic, or config).

**Editorial note:** this "Session 3" section was written incrementally across two agent forks plus a mid-session security-classifier interruption; the Flow B table and several notes were originally appended out of chronological order (Flow B ended up after Flow C/D/E and the summary tables, split into two disconnected fragments). Reordered into the correct A→B→C→D→E→summary sequence post-hoc by the coordinating session. Two rows were added to Flow B (B2, B3) reflecting exactly what had already been reported at hand-off — no new facts were introduced, only reordering and those two explicitly-sourced additions.




# Session 4 — targeted fixes (D10–D13, docs, validation gaps)

Branch `fix/qa-hardening`. Stack reused as-is from Session 3 (no re-seed, no compose
down/up). Live DB **was not re-seeded at any point this session** — it still holds the
2026-07-15..2026-10-27 schedule window described in Session 3 Task 3.

## Task 1 — D11: internal service token (FIXED, verified live)

**Guard mechanism confirmed before touching anything.** Both sides read the *same* var, so
this was never a name-mismatch bug — the var was simply never set:
- Sender: `backend/service/clinical-emr-service/src/appointments/appointment-notification.publisher.ts:108`
  reads `process.env.INTERNAL_SERVICE_TOKEN`, sends it as `x-internal-token` (`:115`).
- Receiver: `backend/service/iam-service/src/notifications/guards/internal-service.guard.ts:16`
  reads the same var, and `:29-36` compares it to the header with `timingSafeEqual`.
  `:17-21` — when the var is unset the guard throws before even looking at the header, which
  is exactly the 401 Session 3 observed.

**Fix.** Generated one value (`openssl rand -hex 32`) and set it under `INTERNAL_SERVICE_TOKEN`
in both `backend/service/iam-service/.env` and `backend/service/clinical-emr-service/.env`
(verified identical, 64 hex chars; both files are gitignored — the value appears in no tracked
file, no doc, and no screenshot). Both services restarted via the `nohup … & disown` pattern.

`.env.example` for **both** services already documented this var with the placeholder
`smile-local-internal-token` (`iam-service/.env.example:107`,
`clinical-emr-service/.env.example:87`) — no additions were needed. One stale comment fixed:
`iam-service/.env.example:106` claimed `(unset = open)`, which is the opposite of the guard's
actual fail-closed behaviour — corrected to `(unset = every request denied)`.

**Live verification.**

| check | before (Session 3) | after |
|---|---|---|
| `POST /v1/notifications` with no token | `Internal service authentication is not configured` | `401 Missing internal service token` |
| same, wrong token | — | `401 Invalid internal service token` |
| UI "Gửi xác nhận" | **503** | **202 Accepted** |
| UI "Gửi nhắc lịch" | **503** | **202 Accepted** |
| clinical-emr log | `outcome=rejected … http_status=401` | `outcome=sent type=APPOINTMENT_CONFIRMATION` / `…_REMINDER` |

The two 401 variants are the proof the value is loaded: an unset var can never reach the
"Missing"/"Invalid" branches. Evidence: `docs/audit/evidence/FIX-1-d11-notifications-202.png`.

Persisted result — `account_service_db.notifications`, timestamps matching the two clicks:

```
 created  |    notification_type     | channel | status |        subject
----------+--------------------------+---------+--------+------------------------
 15:49:05 | APPOINTMENT_REMINDER     | APP     | sent   | Appointment reminder
 15:48:49 | APPOINTMENT_CONFIRMATION | APP     | sent   | Appointment confirmation
```

**Correction to the task brief's premise.** The brief expected these two buttons to land mail
in MailDev. They cannot, by design: the publisher hard-codes `NotificationChannel.APP`
(`appointment-notification.publisher.ts:49`, and `:54` defaults the same way), so this feature
creates **in-app notifications only and never sends email**. The MailDev mailbox is empty (0
messages, `GET localhost:1080/api/email` — MailDev 3.0.0-rc.1 serves its API at `/api/email`,
not `/email`) and correctly so. D11 is fully fixed; "confirmation/reminder *emails* are broken"
was a mis-description of the defect — the correct statement is that the in-app appointment
notification pipeline was broken, and it is now working end to end.

## Task 2 — D12: password hash leaking to the client (FIXED, verified live)

**Safety check first, as instructed:** `rg -n "passwordHash|password_hash" frontend/web/src`
returns **zero matches** — nothing in the frontend reads the field, so removing it breaks
nothing.

**Root cause — the decorators were inert.** `Account` already carries
`@Expose({ toPlainOnly: true }) passwordHash?: string`
(`backend/service/iam-service/src/accounts/domain/account.ts:65-66`), and the login controller
declares `@SerializeOptions({ groups: ['me'] })` (`src/auth/auth.controller.ts:40-42`). But
**no `ClassSerializerInterceptor` is registered anywhere in this service** — not in
`src/main.ts` (only `useGlobalPipes(new ValidationPipe(...))` at `:18-19`) and not as an
`APP_INTERCEPTOR` provider in any module. So class-transformer never runs on responses: the
returned object is plain-`JSON.stringify`d and every field goes out, decorators
notwithstanding. Changing `@Expose` → `@Exclude` would therefore have fixed **nothing** — the
fix has to happen at the return site.

**Mechanism chosen:** explicit destructure-and-omit at each return, not an interceptor. Adding
a global `ClassSerializerInterceptor` would have been a service-wide behavioural change
affecting every endpoint's response shape — far beyond a minimal diff, and it would have
silently re-shaped responses the frontend already depends on. The codebase has no existing
serializer pattern to follow, so the surgical option is the correct one.

**Three leak sites found and fixed** — the brief named only the login path; the other two were
found by probing every `Account`-returning endpoint:

| endpoint | file:line | before | after |
|---|---|---|---|
| `POST /v1/auth/email/login` | `auth.service.ts:111-119` (`validateLogin`) | leaked | clean |
| social login | `auth.service.ts:~199` (`validateSocialLogin`) | leaked (same shape) | clean |
| `GET /v1/auth/me` | `auth.service.ts:350-361` (`me`) | **leaked** | clean |
| `PATCH /v1/auth/me` | `auth.service.ts:408-419` (`update`) | **leaked** | clean |

`GET /auth/me` is the more serious of the two extra sites: it is called on every session
restore, so the hash was re-delivered to the client on essentially every page load, not just
at login.

**Live verification** (each endpoint hit directly, response scanned for any key matching
`password|hash`):

```
POST /v1/auth/email/login    PASSWORD KEYS: NONE  ✓
GET  /v1/auth/me             PASSWORD KEYS: NONE  ✓
PATCH /v1/auth/me            PASSWORD KEYS: NONE  ✓
```

Browser-level, after clearing storage and logging in fresh as `patient10@smile.com` so the
entry was written by the fixed backend — recursive walk of the whole persisted `auth-storage`
tree:

```
passwordMaterialKeys: []            (no key matching /password|hash|secret/i at any depth)
rawContainsBcryptPrefix: false      (no $2a$/$2b$/$2y$ anywhere in the raw string)
userObjectKeys: accountId, createdAt, createdBy, dateOfBirth, email, emailVerified,
  failedLoginAttempts, fullName, gender, lastLoginAt, lockedAt, lockedBy, lockedReason,
  permissions, phone, phoneVerified, role, roles, status, updatedAt, updatedBy, userId, username
```

Evidence: `docs/audit/evidence/FIX-2-d12-localstorage-clean.png`.
`bunx tsc --noEmit` clean. iam-service suite: **21/21 suites, 114/114 tests passed** — no test
asserted the old shape, so no assertion changes were needed (no bucket-A edits in this task).

**Left open, not fixed (out of scope, recorded for the operator):** the inert-decorator problem
is service-wide. Any *other* endpoint in iam-service that returns a raw entity is unprotected by
the `@Expose`/`@Exclude` annotations it appears to carry. The four auth paths above are now
explicitly safe, but a systematic fix (registering `ClassSerializerInterceptor` globally and
auditing every response shape against it) is a larger change that needs its own review.

## Task 3 — D10: patient saw a raw UUID instead of their own name (FIXED, verified live)

**The page already had the machinery** — no new fetch or state was needed. `isPatientUser`
(`frontend/web/src/app/(pages)/appointments/[id]/page.tsx:210`) and `isOwningPatient`
(`:222-223`, derived from an existing `GET /patients/me` query at `:211-221`) were already
computed for the edit/pay permission checks; the name resolution simply never used them.

**Fix** — `appointments/[id]/page.tsx:263-280`, two changes:
1. `enabled: !!apt?.patient_id` → `enabled: !!apt?.patient_id && !isPatientUser` — the
   staff-gated `GET /patients/:id` is no longer called at all for a PATIENT role, instead of
   being called and always 403ing.
2. `patientLabel` now resolves from the session for the owning patient:
   `isOwningPatient ? (user?.fullName ?? user?.email ?? t("…me","Me")) : patientName || (apt?.patient_id ?? "—")`
   — deliberately the same shape as the existing `doctorLabel()` branch at `:255-256`.

Staff behaviour is untouched: for any non-patient role both the query and the fallback are
exactly as before.

**Live verification, as `patient10@smile.com` (Zoe Truong), both Session-3 appointments:**

| appointment | before | after | `GET /patients/:id` |
|---|---|---|---|
| `a6599061-…` (APT-20260801-RS9J) | raw UUID | **"Bệnh nhân: Zoe Truong"** | not called at all |
| `2f48fb55-…` (APT-20260801-WL5Z) | raw UUID | **"Bệnh nhân: Zoe Truong"** | not called at all |

Network log for the patient now contains only `GET /api/v1/patients/me => 200` — the 403 that
fired on every appointment-detail view is gone entirely.

**Regression check — staff path, as `doctor1@smile.com` on the same appointment:**
`GET /api/v1/patients/a3000000-0000-4000-8000-000000000010 => **200 OK**`, name renders
"Zoe Truong" via the staff endpoint exactly as before. Confirmed unchanged.

Evidence: `docs/audit/evidence/FIX-3-d10-patient-name-resolved.png`.

**Side finding, NOT fixed (outside this session's 9 tasks, pre-existing on HEAD).**
`frontend/web/src/shared/lib/toast.ts:239` — `return STATUS_MESSAGES[statusCode];` returns the
whole `Record<"vi"|"en", string>` object where a `string` is required, so any error taking that
branch (a non-Axios error carrying a numeric `statusCode`) renders as `[object Object]` to the
user instead of a message. This is the **only** `tsc --noEmit` error in `frontend/web` (1 total)
and it is present in the committed HEAD version of the file — verified via
`git show HEAD:…/toast.ts`; `git status --short` reports the file unmodified this session. The
sibling branch two lines above it does the same lookup correctly with `[locale]`. Recorded as a
defect for the operator rather than fixed, since it was not in scope.

## Task 4 — D13: booking-chatbot entry point (HIDDEN, verified live)

**No frontend gating flag exists.** Searched `frontend/web` for `AI_ROUTES_ENABLED`,
`AI_ENABLED`, `CHATBOT`, `FEATURE_FLAG`, `NEXT_PUBLIC_AI` across `src/` and all `.env*` —
zero matches, and `src/shared/constants/env.ts` exposes no feature-flag mechanism at all.
Per the instruction's fallback, the link element was removed rather than gated.

**Fix** — `frontend/web/src/app/(pages)/appointments/new/page.tsx:37-65` — removed the
"Chat Cross Link" `<Link href={ROUTES.CHAT}>` card (the sole render site of
`appointments.new.chatCrossLinkTitle`, confirmed by `rg -n "chatCrossLink" src/`), replaced
with a comment recording why. The now-unused `Link`, `Icon`, `ROUTES` imports and the
`cardBase` const were removed with it — each verified to have exactly one remaining
occurrence (its own declaration) before deletion.

**Untouched, as required:** the `/chat` route, everything under `features/booking-chat`, both
i18n dictionaries' `chatCrossLinkTitle`/`chatCrossLinkDesc` keys, and
`dashboard.json:48 bookingAssistant`. Only this one entry point is hidden; nothing was deleted.

**Live verification — all 4 wizard steps walked as `patient10@smile.com`:**

| step | chat link present? | `a[href*="/chat"]` |
|---|---|---|
| 1 Phương thức | no | `[]` |
| 2 Phòng khám | no | `[]` |
| 3 Lịch hẹn | no | `[]` |
| 4 Bệnh nhân & Xem lại | no | `[]` |

Regex checked both locales (`Trợ lý đặt lịch|Booking Assistant|Thích trò chuyện|Prefer chat`).

**The wizard still completes a booking** — full path At-clinic → HCMC → 2026-08-12 → 14:00 →
Xác nhận đặt lịch: `POST /api/v1/appointments/by-clinic => **201 Created**`, redirected to
`/appointments`, new row visible: **`APT-20260801-TN5I` · 2026-08-12 · 14:00 · scheduled ·
unpaid**. (Date deliberately chosen clear of existing bookings to avoid the
one-booking-per-patient-per-day rule.) Step 4's patient field also pre-filled "Zoe Truong"
correctly — an independent confirmation of the Task 3 fix.

`bunx tsc --noEmit` on `frontend/web`: 1 error total, the pre-existing `toast.ts:239` one
noted in Task 3 — none introduced here.
Evidence: `docs/audit/evidence/FIX-4-d13-chatbot-link-gone-booking-works.png`.

## Task 5 — Q4: `/performance` and `/admin/facility` (NO CODE CHANGE NEEDED; doc updated)

**Both routes confirmed non-existent** — neither page file is present:

```
src/app/(pages)/performance          MISSING
src/app/(pages)/admin/facility       MISSING
src/app/(pages)/admin/performance    EXISTS   ← the real one
```

**No nav change was required — the nav already links to neither.** This was verified before
changing anything, rather than assumed:
- `rg` across all of `frontend/web/src` finds **zero** route links to `/admin/facility` and
  **zero** to bare `/performance` (the single `/performance` hit is
  `shared/api/endpoint.ts:414 DOCTOR_PERFORMANCE`, an API path, not a nav href).
- `shared/constants/nav.ts:106-110` defines only `NAV_PERFORMANCE_ADMIN → /admin/performance`,
  which exists.

Session 3's B9/C4 404s were reached by typing the URLs directly, not by clicking a nav link —
so there was no dead link in the UI to remove. **No source file was edited for this task.**

**Live verification of the rendered nav (`document.querySelectorAll('nav a')`), all 3 roles:**

| role | nav hrefs | dead links |
|---|---|---|
| DOCTOR `doctor1@smile.com` | `/dashboard`, `/appointments`, `/patients`, `/dental-images`, `/examinations`, `/schedules/my-schedule` | **none** |
| ADMIN `admin@smile.com` | 15 links incl. `/admin/performance` ("Hiệu suất"), `/admin/revenue-reports`, `/admin/refunds`, … | **none** |
| PATIENT `patient10@smile.com` | `/dashboard`, `/appointments`, `/clinics`, `/medical-records` | **none** |

No role renders a link to `/performance` or `/admin/facility`.

**Doc updated** — `docs/ROLE_BENCHMARK.md` §0.5, exactly 2 lines changed
(`git diff --stat`: `2 insertions(+), 2 deletions(-)`), nothing else in the file touched:
- `/performance` row: Doctor cell `✅ chỉ mình` → `⏸️`, route tagged `⏸️`, one-line HTML comment
  noting it 404s on `dev` and that `/admin/performance` is the real page.
- `/admin/facility` row: Admin cell `✅` → `⏸️`, route tagged `⏸️`, comment noting it 404s and
  that clinic/room management goes through `/clinics`.

`⏸️` was chosen because it is the file's own existing symbol for "Phase sau" (not yet
implemented), already used elsewhere in the same table (e.g. the `/admin/kyc-management` row).

## Task 6 — seed anchor date (CODE ONLY — no seed executed)

**Change** — `backend/service/clinical-emr-service/src/database/seeds/relational/clinic/run-clinic-seed.ts:66`:

```ts
// before
const ANCHOR_DATE = new Date('2026-07-29T00:00:00.000Z');

// after — anchored on the day the seed actually runs, normalised to UTC midnight
const ANCHOR_DATE = (() => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
})();
```

UTC-midnight normalisation is preserved deliberately — the original literal was
`T00:00:00.000Z`, and `getSeedScheduleDates()` does `setUTCDate()` arithmetic on it, so
anchoring on a raw `new Date()` (with a time component) would have shifted every generated
date by the local wall-clock time. `SCHEDULE_PAST_DAYS = 14` / `SCHEDULE_FUTURE_DAYS = 90`
(`clinic-seed-schedules.ts:1-2`) are **unchanged**, as required.

**Verified without executing the seed.** A throwaway script placed next to the module (so the
relative import resolved), importing the *real* `getSeedScheduleDates`, `SCHEDULE_PAST_DAYS`
and `SCHEDULE_FUTURE_DAYS` and applying the same anchor expression — run with `bun`, then
deleted (deletion confirmed):

```
today (UTC)      : 2026-08-01
PAST/FUTURE days : 14 / 90 (unchanged)
generated min    : 2026-07-18
generated max    : 2026-10-30
generated count  : 90 (Sundays excluded)
window expected  : 2026-07-18 .. 2026-10-30
min >= expected  : true
max <= expected  : true
any Sunday?      : false
```

today−14 = 2026-07-18 and today+90 = 2026-10-30 exactly as intended, Sunday exclusion intact.

**THE LIVE DATABASE WAS NOT RE-SEEDED.** Confirmed by querying it after the code change —
it still holds the *old* window generated from the previous hardcoded anchor:

```
    min     |    max     | rows
------------+------------+------
 2026-07-15 | 2026-10-27 | 1440
```

(2026-07-15 = the old 2026-07-29 anchor − 14d, unchanged from Session 3's Task 3 reading.)
The new behaviour takes effect only on the *next* deliberate re-seed, which is the operator's
call. `bunx tsc --noEmit` on clinical-emr-service: 0 errors.

## Task 7 — docs vs the real database (`docs/guide.md`, `docs/TEST_ACCOUNTS.md`)

Ground truth used: the live `auth_service_db.accounts` table (queried via
`docker exec smile-postgres psql`, reading `DATABASE_USERNAME` from `backend/service/iam-service/.env`;
no secret values printed, and no password/hash column was ever selected).

### Live account inventory — 61 accounts, all `ACTIVE`

| Role | Count | Emails |
|---|---|---|
| ADMIN | 1 | `admin@smile.com` |
| DOCTOR | 8 | `doctor1@smile.com` … `doctor8@smile.com` |
| MANAGER | 2 | `manager1@smile.com`, `manager2@smile.com` |
| NURSE | 5 | `nurse1@smile.com` … `nurse5@smile.com` |
| RECEPTIONIST | 4 | `receptionist1@smile.com` … `receptionist4@smile.com` |
| PATIENT | 41 | `patient1@smile.com` … `patient40@smile.com`, plus 1 `qa+…@example.com` registered by hand during Session 3 |

### What the old docs claimed vs. reality

Both files were substantially fiction. `docs/TEST_ACCOUNTS.md` listed **10 doctors, 5
receptionists and 85 patients under a completely different naming scheme**
(`dr.nguyenvana@smile.com`, `recep.levan@smile.com`, `nguyenvana.pt@email.com`, …) — of every
account named in that file, **only `admin@smile.com` actually exists**. It also stated that
NURSE and MANAGER had no seeded accounts, when the live DB has 5 and 2 respectively.

Root cause: those names come from `database/iam-service/auth-service/insert.sql`, a
point-in-time SQL export that **is not wired into any init script**. The database is actually
built by the TypeORM migration + seed commands, which generate the `role+N@smile.com` scheme.
The two have simply drifted, and the docs tracked the dead one.

Verified non-existent (query returns 0 rows for each):
`dr.nguyenvana@smile.com`, `nguyenvana.pt@email.com`, `recep.levan@smile.com`, `nurse.dothih@smile.com`.

### Changes made

Both files rewritten in place, preserving their existing structure and Vietnamese wording style;
no sections unrelated to accounts/seeding were touched.

- **`docs/guide.md`** — demo account table corrected to `admin@smile.com` / `doctor1@smile.com` /
  `patient10@smile.com`; added a per-role table; added the TypeORM seeding commands; added an
  explicit ⚠️ warning that `database/**/insert.sql` + `schema.sql` are non-wired exports and that
  the four legacy emails do not exist; schedule window corrected from the stale
  `2026-07-13 → 2026-07-26` to `2026-07-15 → 2026-10-27` with the Task-6 anchor-date caveat. Also
  fixed a second stale date reference in the booking-validation checklist (line 77) that would
  otherwise have contradicted the new section.
- **`docs/TEST_ACCOUNTS.md`** — rewritten against the live inventory above, same warnings, same
  seeding commands, and a corrected note that NURSE/MANAGER *do* have seeded accounts.

### Verification

Logged in through the real UI for all three demo accounts, each landing on its role-correct
dashboard:

| Role | Account | Result | Evidence |
|---|---|---|---|
| ADMIN | `admin@smile.com` | ✅ dashboard renders | `FIX-7-admin-dashboard.png` |
| DOCTOR | `doctor1@smile.com` | ✅ doctor worklist ("Amelia Nguyen") | `FIX-7-doctor-dashboard.png` |
| PATIENT | `patient10@smile.com` | ✅ patient dashboard (Zoe Truong) | `FIX-7-patient-dashboard.png` |

Then swept **every** email string appearing in either file against the live DB. Result: the only
addresses that don't resolve are exactly the four that both documents now explicitly label as
non-existent. No unverified credential survives in either file.

## Task 8 — the 4 claimed validation gaps (3 tightened, 1 investigated then tightened)

Source: `docs/audit/qa-recon.md` §3 addendum — the capstone spreadsheet asserts
`should not be empty` validation on 4 fields whose DTOs carried only `@IsString()`.
Decision rule applied per field: *if no real UI flow can send it empty → add the decorator so
code matches spec; if any flow can → leave the DTO alone and record a defect instead.*

### Per-field decisions

| field | DTO (file:line) | call sites checked | can a real flow send it empty? | decision |
|---|---|---|---|---|
| `cancelled_by` | `clinical-emr-service/src/appointments/dto/cancel-appointment.dto.ts:6-8` | `frontend/web/src/app/(pages)/appointments/[id]/page.tsx:375` (`cancelled_by: user?.userId`) — the only one | **No.** Sends either a real userId or `undefined`; `undefined` is dropped from the JSON body and already failed the pre-existing `@IsString()`. An empty string is never constructed. | `@IsNotEmpty()` **added** |
| `session_id` | `create-symptom.dto.ts:5-7` | `examinations/[id]/page.tsx:549` (`session_id: id`, the route param) | **No.** Route param; the page cannot render without it. | `@IsNotEmpty()` **added** |
| `symptom_name` | `create-symptom.dto.ts:13-15` | `examinations/[id]/page.tsx:550` (spread from the symptom form) | **No.** Required form field. | `@IsNotEmpty()` **added** |
| `recorded_by` | `create-symptom.dto.ts:37-39` | `examinations/[id]/page.tsx:548` (`recorded_by: actorId`) — the only one in the whole frontend (`rg -n "recorded_by" frontend/web/src` returns exactly 1 hit) | **No — but only after investigation; see below.** | `@IsNotEmpty()` **added** |

### Why `recorded_by` needed a closer look

It was the one genuinely ambiguous case, because its source expression has an explicit
empty-string fallback — `examinations/[id]/page.tsx:229`:

```ts
const actorId = currentUser?.userId ?? session?.doctor_id ?? "";
```

Read literally that is "a flow that can send it empty", which under the decision rule would mean
*don't touch the DTO*. Three findings show the `""` branch is unreachable at submit time:

1. **The symptom form only renders after the session query resolves** — `examinations/[id]/page.tsx:1424`
   gates the whole body on `!isLoading && !isError && session`. So by the time the Add button
   exists, `session` is non-null.
2. **`examination_sessions.doctor_id` is `NOT NULL`** — verified against the live DB
   (`information_schema.columns` → `is_nullable = NO`; `0` nulls across all `158` rows). So the
   second fallback `session?.doctor_id` always resolves, and the third (`""`) is dead code in
   this context.
3. **`symptoms.recorded_by` is `uuid NOT NULL`** — an empty string was never storable anyway;
   Postgres rejects it with `invalid input syntax for type uuid: ""`. Pre-change, an empty
   `recorded_by` would have surfaced as an ugly 500-level cast error rather than a silent bad
   write. The decorator converts that into a clean 400 with the message the spec expects.

So the field is tightened, matching spec, and the change strictly improves the failure mode.
The `?? ""` fallback at line 229 is left untouched — it is defensive code for other consumers
of `actorId` on that page and rewriting it was out of scope.

### Live verification — the tightened DTOs did NOT break the real flow

All 158 pre-existing examination sessions are `completed` (editing locked), so a fresh session
was created rather than reusing one. `doctor1@smile.com` owns no `checked_in` appointment, so
this ran as **`doctor2@smile.com`**, who owns `APT-2026-0182` (the `/examinations/new`
appointment dropdown is doctor-scoped — itself a small confirmation that scoping works).

- Created session `aeaeea8d-d134-42c1-ba82-37fb397378a5` from `APT-2026-0182` (patient Clara Vo).
- Added a symptom through the real form → **`POST /api/v1/symptoms => 201 Created`**, followed by
  the list refetch `GET .../symptoms/session/... => 200`.
- Confirmed in the DB: one row, `symptom_name = 'Ê buốt khi uống nước lạnh'`, `recorded_by` non-null.
- Evidence: `docs/audit/evidence/FIX-8-validation-dtos.png`.

**Negative case** (that the new decorators actually reject empties) was proven without
credentials via a throwaway `class-validator` harness run against the real DTO classes and then
deleted — NestJS runs guards before pipes, so an unauthenticated HTTP probe would 401 before
validation and prove nothing:

```
symptom VALID payload (mirrors the live 201)  -> VALID (no errors)
symptom EMPTY recorded_by                     -> recorded_by should not be empty
symptom EMPTY session_id + symptom_name       -> session_id should not be empty | symptom_name should not be empty
cancel VALID                                  -> VALID (no errors)
cancel EMPTY cancelled_by                     -> cancelled_by should not be empty
```

All four messages are now **verbatim** what the spreadsheet asserts, closing the Pattern-2 gap
recorded in `qa-recon.md` §3 addendum.

**Cancel-appointment path: not exercised end-to-end in the UI.** The DTO is unit-verified above
and its only call site was read, but no appointment was actually cancelled this session (it
would mutate demo data for no additional signal). Stated here rather than claimed as tested.

### Recorded, deliberately NOT fixed

**Lock-Ban User Account — spreadsheet error, not a code gap.** The workbook claims
`accountId should not be empty` and `lockedBy should not be empty`, but `LockAccountDto`
(`iam-service/src/accounts/dto/lock-account.dto.ts`) has exactly one property, `reason`. There is
no `accountId` or `lockedBy` field to validate — the account id travels as a route param. No
fields were added to the DTO; the spreadsheet rows are simply wrong and should be corrected on
the document side, not the code side.

## Task 9 — final re-run of all 5 suites (end of Session 4)

Command per service: `cd <dir> && bun run test`.

| Service | Suites | Tests | vs. Session 1–3 baseline |
|---|---|---|---|
| iam-service | 21 passed / 21 | 114 passed / 114 | unchanged |
| clinical-emr-service | 44 passed, 1 skipped / 45 | 379 passed, 6 skipped / 385 | unchanged |
| payment-service | 5 passed / 5 | 33 passed / 33 | unchanged |
| gateway-service | 9 passed / 9 | 42 passed / 42 | unchanged |
| frontend/web | 36 passed / 38 files | 151 passed / 153 | unchanged |

**Zero regressions.** The 2 remaining frontend failures are the same two carried since Session 1
and are deliberately still open:

- **bucket B** — `appointments/[id]/payment/page.test.tsx:64`: the VNPay icon has no accessible
  name. Needs an ARIA convention decision (no existing convention in this codebase to follow), so
  it was never a silent fix.
- **bucket D** — `booking-chat/api.test.ts`: tests a feature frozen for the demo; left untouched
  by explicit product-scope carve-out, not skipped or deleted.

Note: Session 4's own changes are not covered by these suites in the places that matter most —
the DTO tightening (Task 8) is proven by the live `201` + the `class-validator` harness recorded
above, and the doc rewrite (Task 7) by live logins. Neither is unit-testable in the existing
suites, which is why both were verified against the running system instead.

# Session 5 — iam-service (UC test generation, PARTIAL)

Generated from `Report5_Unit Test.xlsx` via `scripts/qa/parse-uc-matrix.py` -> `docs/audit/uc-matrix.json`
(398 UTCIDs, asserted N=87/A=299/B=12). Divergences in `docs/audit/uc-divergences.md`.

## Status: 7 of 22 iam sheets generated (34 of 86 iam UTCIDs). 15 sheets remain.

Generation stopped on context budget, NOT on a blocker. No sheet forced a BLOCKED; no CODE_GAP found.
Every generated case was executed — nothing is reported that did not run.

| sheet | UTCIDs | canaries | DTO-pipe | service | MATCHES | DIVERGES |
|---|---:|---:|---:|---:|---:|---:|
| Login | 7 | 1 | 3 | 4 | 6 | 1 |
| Signup | 6 | 1 | 5 | 1 | 2 | 4 |
| Change Password | 8 | 1 | 2 | 6 | 3 | 5 |
| Reset Password | 4 | 0 | 0 | 4 | 2 | 2 |
| Forgot Password | 3 | 0 | 0 | 3 | 2 | 1 |
| Logout | 4 | 0 | 0 | 4 | 1 | 3 |
| View Profile | 2 | 0 | 0 | 2 | 0 | 2 |
| **total** | **34** | **3** | **10** | **24** | **16** | **18** |

34 UTCID tests + 3 canaries = 37 generated tests (never summed into one figure).

Sheets with NO DTO-validation block carry no canary: the target takes bare string arguments
rather than a DTO, so no ValidationPipe participates and there would be no pipe to prove.

## Remaining iam sheets (15 sheets, 52 UTCIDs)

Update Role Permissions (7), Assign Role (7), Login with Google (5), Revoke Role (5),
Lock-Ban User Account (5), Send OTP (4), Update Profile (3), Update Role (3),
Create Permission (3), Verify Identity KYC (3), Unlock-Unban User Account (3),
View Role (1), View Permissions By Role (1), Access Audit Log (1), View User List (1).

## Suite totals after this session

| service | suites | tests |
|---|---|---|
| iam-service | 28 passed / 28 | 151 passed / 151 |
| clinical-emr-service | 45 passed, 1 skipped / 46 | 386 passed, 6 skipped / 392 |
| payment-service | 6 passed / 6 | 36 passed / 36 |

Zero regressions; the 117 pre-existing specs are untouched.

## Reproduce

```
python3 scripts/qa/parse-uc-matrix.py
cd backend/service/<service> && bun run test
```

---

# Session 5 — pipeline proof at 42 UTCIDs

Purpose: run Phases 3→5 end-to-end on the cases that already exist, so the pipeline's failure
modes surface at 42 cases instead of at 398. It worked — the proof run overturned a stated
assumption about the workbook (see "What broke", below).

## Coverage (derived, never typed)

`scripts/qa/coverage.py` is now the single source of truth. No coverage figure appears in any
document or message unless this script produced it. It exists because an earlier session
reported "34 done" when the real number was 42 — it had counted only iam and missed the two
pilot files in clinical-emr and payment.

```
UTCIDs   : 42 / 398 generated   (10.6%)   remaining 356
Sheets   : 9 complete, 0 partial, of 87
Canaries : 5   (counted separately; never summed into UTCIDs)
REPORTABLE: 42 UTCID tests + 5 canaries = 47 generated tests

service          UTCIDs        sheets      canaries
clinical-emr      6/307       1+0p/62         1
iam              34/86        7+0p/22         3
payment           2/5         1+0p/3          1
```

## Phase 3 — execution capture

`bun run test -- --json --outputFile=docs/audit/results/<service>.json` (Jest's built-in
reporter; no new dependency). `scripts/qa/collect-uc-results.py` maps each result back to
(sheet, UTCID) via the `UTCID\d+` title prefix and the file's `GENERATED ... sheet "<name>"`
header, emitting `docs/audit/uc-results.json`.

```
42 UTCIDs with a real execution result
  status         PASS 42   FAIL 0   BLOCKED 0
  spec alignment MATCHES 16   DIVERGES 26   untagged 0
  divergence classes  SPEC_STALE 1   SPEC_WRONG 25
```

`untagged 0` matters: every generated test carries a machine-readable `[MATCHES]` /
`[DIVERGES: CLASS]` tag, so alignment is never inferred.

## Phase 4 — additive writeback

`scripts/qa/writeback-unittest-xlsx.py` → `docs/audit/Report5_Unit_Test_v2.xlsx`.
Original untouched (verified: mtime and size unchanged). Verified **semantically idempotent** —
two consecutive runs produce **zero cell-level differences** across all 90 sheets. (Byte-level
md5 differs because xlsx is a zip with embedded timestamps; cell equality is the meaningful
test.) Full narrative for the file's owner: `docs/audit/xlsx-changelog.md`.

## What broke — the workbook's 431 is wrong in a different way than assumed

The working assumption was "431 is a roll-up arithmetic error in the Statistics total". Running
the pipeline disproved that:

- `Statistics!C99`, `G99`, `I99` are `=SUM(C12:C98)` formulas. The sub-total was **always
  arithmetically faithful** — it correctly added up rows that were themselves wrong.
- The inflation is distributed: **exactly 33 of the 87 per-function rows over-count bucket A by
  exactly +1 each.** 33 × 1 = 33, and 431 − 398 = 33. Closes with nothing left over.
- 14 of those rows were initially invisible because the Statistics `Function code` differs from
  the Excel tab name (31-char limit); they resolve through the Functions sheet's own
  Code→Sheet mapping.

This changed what the writeback had to do: correcting one total cell was impossible (it is a
formula), so the fix targets the 33 inflated per-function rows.

**Which side is wrong was then settled empirically, not assumed.** For all 87 sheets, three
independent counts agree: UTCID column headers on row 9, manual `Passed/Failed` marks, and
cases parsed by `parse-uc-matrix.py`. **87/87 agree, total 398.** So the function sheets and the
manual execution log were correct all along; only the Statistics tally disagreed with them.

That dissolved an apparent conflict with the "leave every manual result cell untouched" rule:
correcting the tally does not overwrite a manual observation, it reconciles a summary *to* the
manual observations. `Passed`/`Failed`/`Untested` are re-derived from each sheet's own marks
rather than assumed. After correction the `=SUM()` formulas total **398 / N 87 / A 299 / B 12**.

## Structural note

The operator's instruction was to "add two columns". In these decision tables UTCIDs run
horizontally as *columns*, so one new field per UTCID is structurally a **row**. Implemented as
two new rows (`Automated test`, `Spec alignment`) below `Defect ID` on each of the 87 sheets —
the instruction's intent, in the sheet's own idiom.

## Open items settled

- **Signup / gender → SPEC_WRONG, no product defect.** The frontend sends the ISO-5218 integer
  (`GENDER = {UNKNOWN:0, MALE:1, FEMALE:2}` in `shared/constants/common.ts`;
  `RegisterForm.tsx:191,213`), which `Number()` and `@IsInt` accept. Only the sheet's `"MALE"`
  string notation is wrong.
- **D14 — bare global `fetch()` in `PaymentsService`** (`payments.service.ts:95,124,479`), no
  injected HTTP client in a 3-dependency constructor. Recorded as a testability defect in
  `uc-divergences.md`, not absorbed as a test inconvenience.

## Throughput: clinical-emr clusters into 18 classes, not 62 sheets

Generation is switching from per-sheet to per-target-class, so a service is read once and every
sheet targeting it is emitted together.

| target class | sheets | UTCIDs |
|---|---:|---:|
| AppointmentsService | 11 | 100 |
| DoctorSchedulesService | 7 | 37 |
| ClinicalOrdersService | 2 | 24 |
| TreatmentPlansService | 5 | 24 |
| DentalImagesService | 4 | 16 |
| TreatmentRoomsService | 4 | 13 |
| SymptomsService | 4 | 11 |
| TreatmentHistoryService | 3 | 11 |
| PrescriptionsService | 1 | 10 |
| DiagnosticOrdersService | 1 | 9 |
| PatientsService | 3 | 9 |
| SpecialtiesService | 4 | 9 |
| ClinicsService | 3 | 8 |
| ReportsService | 4 | 8 |
| MedicalRecordsService | 3 | 6 |
| RecordExportsService | 1 | 6 |
| MedicalHistoryService | 1 | 4 |
| ImageAnnotationsService | 1 | 2 |
| **total** | **62** | **307** |

`AppointmentsService` alone is 11 sheets / 100 UTCIDs — a third of clinical-emr from a single
class read, and the reason its 16-dependency mock is the first factory to extract.

## Suites after this session

Unchanged from the start of it — this session added no tests, only pipeline scripts and
documents. iam 28/28 suites · 151/151 tests. clinical-emr 46 suites (1 skipped) · 392.
payment 6/6 · 36/36. Zero pre-existing `.spec.ts` modified. No git writes (HEAD `34aaaf5d`).

# Session 5 — iam-service (UC suite generation, complete)

**iam-service is finished: 86/86 UTCIDs across 22/22 sheets.** No CODE_GAP found, no UTCID
BLOCKED. Git untouched (HEAD `34aaaf5d`), 117 pre-existing `.spec.ts` unmodified, original
workbook unmodified.

## Counts (UTCIDs and canaries never summed into one figure)

| | before | after |
|---|---|---|
| iam sheets generated | 7 / 22 | **22 / 22** |
| iam UTCIDs generated | 34 / 86 | **86 / 86** |
| iam canaries | 3 | **8** |
| iam suite | 28 suites / 151 tests | **43 suites / 208 tests** |

Project-wide, from `scripts/qa/coverage.py` (the single source of truth — no coverage figure
in this document is hand-typed):

```
UTCIDs   : 94 / 398 generated   (23.6%)   remaining 304
Sheets   : 24 complete, 0 partial, of 87
Canaries : 10   (counted separately; never summed into UTCIDs)
REPORTABLE: 94 UTCID tests + 10 canaries = 104 generated tests
```

## Spec alignment

| scope | cases | MATCHES | DIVERGES | classes |
|---|---:|---:|---:|---|
| new this session (15 sheets) | 52 | 20 | 32 | SPEC_WRONG 32 |
| iam total (22 sheets) | 86 | 36 | 50 | SPEC_WRONG 50 |

**Zero CODE_GAP.** Every iam divergence is a document defect, not a product defect — the code
is right and the sheet is wrong. No new entries in the defect register (still ends at D14).

Two FULL-DIVERGENCE sheets this session, both MISMAPPED in the symbol map and both asserting
`PermissionEntity[]` from a method that returns something else entirely:

| sheet | sheet claims | reality |
|---|---|---|
| View User List | `PermissionsService.findAll()` → `PermissionEntity[]` | `UserProfilesService.findAll()` → `{ data, total }` |
| Access Audit Log | `PermissionsService.findAll()` → `PermissionEntity[]` | `AuditLogsService.findAll()` → `{ data, total }`, rows joined to actor name |

## The dominant divergence pattern in iam

32 of the 52 new cases fail the same way: **the sheet asserts DTO validation on values that
are not DTO fields.** Route parameters (`userId`, `roleId`, `accountId`, `id`) reach these
services as bare strings — there is no `ParseUUIDPipe` anywhere in the iam controllers — and
several named arguments (`assignedBy`, `lockedBy`) are never caller input at all: they are
either filled from the authenticated session or never passed by the controller.

Where a field IS genuinely on a DTO, the tests go through the real `ValidationPipe` and pass,
and several match the sheet verbatim (`reason should not be empty`, `token should not be
empty`, `permission_name should not be empty`). The distinction is now recorded per case.

## Template defects T1–T4 — fixed generator-wide

- **T1 (fixture collision)** — `src/test-support/uc-fixtures.ts` per service: one id per entity
  kind, distinct hex-word prefixes, and an `assertDistinct()` that throws at *import* time.
  Collisions are impossible by construction. Verified: no two entities share a literal in any
  generated file.
- **T2 (mis-titled assertions)** — 1 title rewritten across the pilot; **0 new occurrences in
  these 15 sheets.** Reporting that plainly rather than as a clean result: the pattern is rare
  because most generated negatives assert a message only that input produces, but 0 out of 15
  is a small sample and does not prove the check is working hard.
- **T3 (double invocation)** — shared `captureRejection()` / `capturePipeRejection()` helpers.
  No generated test invokes the method under test more than once.
- **T4 (canary counting)** — two-number format in place everywhere, including this checkpoint.

## Two wrong assumptions caught by running the tests

Recorded because "it compiled" is not evidence:

1. `OtpType.PHONE_VERIFICATION` does not exist (the union is `LOGIN | PASSWORD_RESET |
   IDENTITY_VERIFY`). Corrected to `IDENTITY_VERIFY` after reading the real call site at
   `accounts.service.ts:173-175`, not by guessing a second time.
2. `KycStatus` is exported from `entities/kyc-verification.entity.ts`, not a `domain/` module.

## Workbook writeback — now surgical at the ZIP level

The previous implementation round-tripped the workbook through openpyxl, which silently
**dropped** `xl/media/image1.png`, `xl/drawings/*`, `xl/webextensions/*`,
`xl/printerSettings/*` and a worksheet `.rels` part. Cell-level checks could not detect that —
every cell was correct while the file was quietly damaged.

`scripts/qa/writeback-unittest-xlsx.py` now copies the original archive entry-by-entry and
rewrites only the worksheet XML that must change. It refuses to emit a file unless no entry is
lost, no entry is unexpectedly added, and every entry outside the declared set is byte-identical.

```
ZIP INTEGRITY
  entries: original 116  ->  v2 116
  lost entries            : NONE
  unexpected new entries  : NONE
  byte-drift in untouched : NONE
  VERDICT: PASS
```

Also fixed in passing: the `=SUM()` formulas in `Statistics` row 99 are preserved *and* their
cached values refreshed (they still read 431 under the old approach, so any non-Excel reader
saw the wrong total), and `workbook.xml` carries `fullCalcOnLoad="1"` so Excel recomputes on
open. Post-fix the totals read **398 / N 87 / A 299 / B 12**.

Idempotency is now structural — every run starts from the pristine original, so rows cannot
duplicate and corrections cannot compound. Verified: two consecutive runs produce a
**byte-identical** file (md5 match), and 0 cell-level differences across all 90 sheets.

## Reproduce

```
cd backend/service/iam-service && bun run test
python3 scripts/qa/collect-uc-results.py
python3 scripts/qa/writeback-unittest-xlsx.py
python3 scripts/qa/coverage.py
```

## Remaining

304 UTCIDs: clinical-emr 301 (61 sheets), payment 3 (2 sheets). Gateway has 0 of 398 — a real
coverage gap, not an omission. Mock factories exist for `AppointmentsService` (15 deps); the
other 17 clinical-emr target classes still need theirs.
