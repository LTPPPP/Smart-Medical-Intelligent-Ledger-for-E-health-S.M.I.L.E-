# UC divergences — spreadsheet vs. implementation

Where `Report5_Unit Test.xlsx` states an expected result the code does not produce, the
generated test asserts **the code's real behaviour** and the case is recorded here. The
spreadsheet is never edited to match, and no test is written that is expected to fail.

**Status: Phase 1 pilot — 3 of 87 sheets, 15 of 398 UTCIDs.** Phases 2+ extend this file
service by service.

## How to read this file

Every divergent UTCID carries exactly one classification:

| class | meaning | is it a product defect? |
|---|---|---|
| `SPEC_STALE` | the code changed; the sheet was never updated | no — update the sheet |
| `SPEC_WRONG` | the sheet describes something that never existed | no — rewrite the case |
| `CODE_GAP` | **the sheet is right and the code is missing the behaviour** | **yes** |

`CODE_GAP` findings are promoted into the project defect register (D14+) rather than being
left here. **Pilot result: zero CODE_GAPs across the 3 sheets** — every divergence so far is a
document problem, not a code problem.

`spec_alignment` is tracked per UTCID as `MATCHES` or `DIVERGES`. Three numbers are always
reported separately and never collapsed into one "pass rate":

1. **cases with a real execution result** (= 398 − BLOCKED) — the suite size
2. **cases where code MATCHES the spreadsheet** — the honest spec-conformance figure
3. **cases where code DIVERGES** — measured drift

---

## Sheet-level rollup — sorted by divergence rate, descending

| sheet | service | UTCIDs | MATCHES | DIVERGES | rate | classes present |
|---|---|---:|---:|---:|---:|---|
| Cancel Appointment | clinical-emr | 6 | 0 | 6 | **100%** | SPEC_STALE, SPEC_WRONG |
| Initiate Payment | payment | 2 | 0 | 2 | **100%** | SPEC_WRONG |
| Login | iam | 7 | 6 | 1 | 14% | SPEC_WRONG |
| **pilot total** | — | **15** | **6** | **9** | **60%** | — |

### ⚠ FULL-DIVERGENCE SHEETS (100% — highest-value rows in this report)

These are where the specification and the implementation have drifted apart *completely*. Not
one case on these sheets describes what the code does.

- **Cancel Appointment** (clinical-emr, 6/6) — the sheet describes cancellation as a single
  atomic action that ends with the appointment cancelled, validated through four DTO fields.
  The code implements a **two-step request/confirm workflow** where a patient's cancel only
  raises `cancellation_requested` and leaves the status `scheduled` for reception to confirm,
  and three of the four "validated" fields are not DTO properties at all.
- **Initiate Payment** (payment, 2/2) — the sheet describes reading a KYC verification record
  by id and returning a `KycVerificationEntity`. The code initiates a VNPay payment from an
  `InitiatePaymentDto` and returns `{ paymentUrl, payment }`. The two have nothing in common;
  the sheet was authored against `KycVerificationsService.findOne()` in a different service.

---

## Systemic findings

Measured across all 398 parsed UTCIDs. These matter more than any individual row.

### S1 — 240 of 398 cases (60%) name the wrong exception type · `SPEC_WRONG`

The workbook expects `BadRequestException` on **290** cases. That is correct only where the
service uses Nest's stock `ValidationPipe`. It is not uniform:

| service | pipe config | DTO rejection produces | BadRequest-expecting UTCIDs | verdict |
|---|---|---|---:|---|
| iam | `main.ts:19-26`, stock pipe | **400** `BadRequestException`, `message: string[]` | 50 | sheet **correct** |
| gateway | `main.ts:70-77`, stock pipe | **400** `BadRequestException` | 0 | n/a |
| clinical-emr | `main.ts:43` → `utils/validation-options.ts` | **422** `UnprocessableEntityException`, `{status, errors:{field}}` | 238 | sheet **wrong** |
| payment | `main.ts:26` → `utils/validation-options.ts` | **422** `UnprocessableEntityException` | 2 | sheet **wrong** |

`utils/validation-options.ts` sets `errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY` plus
a custom `exceptionFactory`. The spreadsheet appears to assume Nest's default 400 everywhere.
**240 rows need their expected exception corrected to `UnprocessableEntityException` (422).**

Generated tests import each service's own options object rather than hardcoding a status, so
if this config is ever changed the tests move with it instead of drifting silently.

### S2 — DTO-validation cases cannot be produced by the method under test

242 of 398 cases expect a class-validator message (`… should not be empty`, `must be an email`,
`must be one of the following values`, …). No service method validates its own DTO — that is
the global pipe's job. Calling `validateLogin({email:'', …})` directly does **not** raise
"email should not be empty"; it proceeds and fails later for an unrelated reason.

**Resolution (a testing-layer decision, not a divergence):** such cases are asserted against
the *real* `ValidationPipe` for that service, via
`pipe.transform(payload, { type:'body', metatype: <Dto> })`. This reproduces production exactly,
including per-service status code and error shape. Every generated file carries a **canary**
that pushes a known-valid DTO through the same pipe and asserts it resolves — if the canary
fails, every negative case in that file is suspect.

### S3 — the 11 MISMAPPED sheets have wrong *content*, not just a wrong label

15 UTCIDs sit on sheets whose `Class Name`/`Function Name` columns name an unrelated function.
The damage runs deeper than the label: **the input columns and expected results were authored
against that wrong function**, so they cannot be remapped mechanically. Affected sheets:
Access Audit Log, Confirm Appointment, Confirm Payment - View Payment, Initiate Payment,
Notify Shift Transfer, Refund - Cancel Payment, View Appointment, View Clinic Information,
View Profile, View Treatment Room, View User List.

### S4 — Statistics sheet total is arithmetically wrong

`Statistics` claims 431 cases (N=87 / A=332 / B=12). The sheets physically contain **398**
(N=87 / A=299 / B=12). `N` and `B` match exactly; the entire 33-case gap sits in `A` — a
roll-up error, not missing content. Independently recounted twice. **398 is the truth.**

---

## Sheet: Login — iam-service, `AuthService.validateLogin()` (auth.service.ts:52)

7 cases · 3 DTO-pipe / 4 service-behaviour · **6 MATCHES, 1 DIVERGES**.

The only sheet in the pilot that largely holds up: because iam uses the stock pipe, its
`BadRequestException` expectations for UTCID02-04 are correct, messages included.

### D1.1 — UTCID07 is a byte-identical duplicate of UTCID06 · `SPEC_WRONG`

* **Sheet:** UTCID06 and UTCID07 both specify `email = nguyen.a@example.com`,
  `password = WrongPass123`, expecting `UnprocessableEntityException` / `incorrectPassword`.
* **Code:** `validateLogin()` has *two* distinct paths producing `incorrectPassword` — a
  missing `passwordHash` (auth.service.ts:73-80) and a failed `compare()` (`:84-98`).
* **Assessment:** the sheet almost certainly intended UTCID07 to cover the second path, but
  the input columns do not distinguish them, so as written UTCID07 adds zero coverage.
* **Action:** reproduced faithfully rather than reinterpreted — inventing a distinction the
  sheet does not make would be fabricating a test case. Recommend the author differentiate
  UTCID07 (e.g. a social-login account with no password set).

### D1.2 — UTCID05 quotes an uninterpolated template · not counted as a divergence

* **Sheet:** log message `accountIs${account.status}` — the source expression copied verbatim.
* **Code:** auth.service.ts:68 emits it interpolated, e.g. `accountIsLOCKED`.
* **Assessment:** neither side is wrong; the sheet is quoting source. The test asserts the
  resolved string for a concrete status. Recorded for transparency only.

---

## Sheet: Cancel Appointment — clinical-emr, `AppointmentsService.cancel()` (appointments.service.ts:766)

6 cases · 1 DTO-pipe / 5 service-behaviour · **0 MATCHES, 6 DIVERGES (100%)**.

### D2.1 — UTCID01: cancelling does not set status to `cancelled` · `SPEC_STALE`

* **Sheet:** `success (AppointmentEntity)` / `operation succeeds`, implying the record ends up
  cancelled.
* **Code:** for a non-privileged actor (patient), `cancel()` sets `cancellation_requested = true`,
  writes `cancellation_reason` / `cancelled_by`, records a history row whose `old_status` and
  `new_status` are **both unchanged**, and returns — status stays `scheduled`
  (appointments.service.ts:787-803). Only a privileged staff role (ADMIN / RECEPTIONIST /
  NURSE / MANAGER) performs the real transition to `CANCELLED` and blocks future booking
  (`:806-833`).
* **Verified live**, not merely read: a real patient-side UI cancel returned
  `PATCH /api/v1/appointments/:id/cancel => 200`, and the DB row afterwards read
  `status=scheduled, cancellation_requested=t, cancelled_by` populated.
* **Assessment:** `SPEC_STALE` — the two-step workflow is deliberate product behaviour the
  sheet predates. Not a code defect.

### D2.2 — UTCID03: wrong exception type · `SPEC_WRONG` (instance of S1)

* **Sheet:** `BadRequestException` / `cancelled_by should not be empty`.
* **Code:** `cancelled_by` **is** a real `CancelAppointmentDto` field with `@IsNotEmpty()`, so
  the message text is right — but clinical-emr's pipe yields **422
  `UnprocessableEntityException`** with `{status:422, errors:{cancelled_by: '…should not be empty'}}`.
* **Assessment:** exception type only; the message is correct.

### D2.3 — UTCID02/04/05/06: validation asserted on fields that do not exist · `SPEC_WRONG`

* **Sheet:** expects `BadRequestException` for `id should not be empty` (UTCID02),
  `actorUserId should not be empty` (UTCID04), `actorUserId invalid uuid` (UTCID05),
  `actorRole should not be empty` (UTCID06).
* **Code:** `CancelAppointmentDto` declares **only** `cancelled_by` and `cancellation_reason`.
  `id` is a route param; `actorUserId` and `actorRole` are method arguments from the auth
  context. None are DTO-validated, so none of these four messages can ever be produced. What
  actually happens:
  * UTCID02 → `NotFoundException` (`:777-779`)
  * UTCID04 → `ForbiddenException` "A trusted patient, doctor, or staff role is required…"
    (`:349-357`; `resolveActorPatientId('')` short-circuits on the falsy guard at `:113` and
    never queries patients)
  * UTCID05 → `ForbiddenException` "The authenticated user can only modify their own
    appointment records." (`:334-338`) — there is no uuid check anywhere; ownership is the guard
  * UTCID06 → no error; `''` fails the privileged-role test and the request branch runs
* **Assessment:** same defect class as the previously-recorded Lock-Ban finding
  (`accountId`/`lockedBy` asserted against a DTO that has neither).

---

## Sheet: Initiate Payment — payment-service, `PaymentsService.initiate()` (payments.service.ts:232)

2 cases · 1 DTO-pipe / 1 service-behaviour · **0 MATCHES, 2 DIVERGES (100%)**. MISMAPPED (S3).

### D3.1 — UTCID01: expected return type belongs to a different feature · `SPEC_WRONG`

* **Sheet:** `success (KycVerificationEntity)`, with a single input column `id`, matching the
  falsely-claimed `KycVerificationsService.findOne()`.
* **Code:** `initiate(dto: InitiatePaymentDto, actor: Actor, authorization?, idempotencyKey?)`
  returns `{ paymentUrl: string; payment: PaymentEntity }` (`:232-285`).
* **Action:** the sheet's `id` is mapped onto `InitiatePaymentDto.appointmentId` (the
  identifier `initiate()` actually consumes) and the test asserts the real return shape. An
  ADMIN actor is used so `assertAppointmentAccess` short-circuits via `isPaymentStaff` (`:470`),
  keeping this a true unit test with no outbound `fetch`.

### D3.2 — UTCID02: field name and exception type both wrong · `SPEC_WRONG`

* **Sheet:** `BadRequestException` / `id should not be empty`.
* **Code:** `InitiatePaymentDto` has no `id`; the required identifier is `appointmentId`
  (`@IsString() @IsNotEmpty()`). payment-service's pipe yields **422
  `UnprocessableEntityException`** with `{status:422, errors:{appointmentId: …}}`.

---

## Issues for the QA report (not divergences — coverage problems)

### I1 — gateway-service has ZERO of 398 test cases · real coverage gap

All 87 sheets resolve to iam (86 UTCIDs), clinical-emr (307) or payment (5). **Not one case
targets gateway-service**, despite it owning routing, the rate-limit middleware, and the
`GatewayExceptionFilter`. It is dropped from the Phase 2 generation order because there is
nothing to generate — that absence is itself a finding, not a scheduling detail.

### I2 — payment-service has 5 of 398 cases, and all 3 payment sheets are MISMAPPED

Payment carries 1.3% of the test corpus. Worse, every one of its three sheets (Initiate
Payment, Confirm Payment - View Payment, Refund - Cancel Payment) is MISMAPPED — the cases
were authored against unrelated KYC/permission functions, so the *effective* authored coverage
of the payment domain is **zero**. This is the same area the earlier codebase audit scored as
thinnest (mock VNPay only, two incompatible `PaymentStatus` enums across services). Spec
coverage and implementation maturity are weakest in the same place, which is exactly where a
defense demo is most exposed.

---

# Session 5 addendum — two open items settled, and one new defect

## Signup / gender — verdict: **SPEC_WRONG**, not a product defect

The sheet supplies `"MALE"` / `"UNKNOWN"` as gender inputs. `genderCodeTransformer` runs
`Number(value)`, so a string label becomes `NaN` and fails `@IsInt()` — meaning the sheet's own
*valid* gender value would be rejected by the real DTO.

The question was whether the frontend also sends the label (which would make this a real
`CODE_GAP`). It does not:

- `frontend/web/src/shared/constants/common.ts` — `GENDER = { UNKNOWN: 0, MALE: 1, FEMALE: 2 }`,
  ISO-5218 integer codes.
- `frontend/web/src/features/auth/components/RegisterForm.tsx:191` seeds the form with
  `gender: GENDER.MALE` (i.e. `1`), and `:213` sends `gender: form.gender` unchanged.

So production sends the integer, `Number()` is a no-op on it, and `@IsInt` / `@IsIn` accept it.
The defect is in the spreadsheet's choice of input notation, not in the code. **No D-number.**

## `payment-service` outbound HTTP — **D14 (testability defect)**

**D14 — `PaymentsService` calls clinical-emr through the bare global `fetch()` with no injected
client, making the ownership hop untestable without patching a global.**
`backend/service/payment-service/src/payments/payments.service.ts:95`, `:124`, `:479` each call
`fetch(...)` directly. The constructor takes only three dependencies —
`@InjectRepository(PaymentEntity)`, `@Inject(REDIS_CLIENT) redis`, and
`RefundNotificationPublisher` — so there is no seam to substitute in a test.

Consequence: `initiate-payment.uc.spec.ts` has to stub `global.fetch` in `beforeEach` and
restore it in `afterEach`. That works, but it is a global mutation rather than dependency
injection, it is the only file in the generated suite that needs it, and it silently couples the
test to Node's global namespace. Same class of design issue as D3/D4 — recorded as a defect
rather than absorbed as a test inconvenience, because the fix belongs in the product (inject an
HTTP client, as every other cross-service call in this codebase does) not in the test.

**Not fixed** — injecting a client changes a constructor signature in an audited-strong service
and is out of scope for a test-generation session.

# Session 5 — the remaining 15 iam-service sheets (D10–D21)

52 new cases: **20 MATCHES, 32 DIVERGES, all SPEC_WRONG. Zero CODE_GAP, zero BLOCKED.**
Every divergence here is a document defect. In no iam sheet is the spec right and the code
missing — so nothing in this section is a product defect and the register still ends at D14.

## Sheet-level rollup — new sheets, divergence rate descending

| sheet | class.method | cases | M | D | rate |
|---|---|---:|---:|---:|---:|
| View User List | UserProfilesService.findAll | 1 | 0 | 1 | **100%** |
| Access Audit Log | AuditLogsService.findAll | 1 | 0 | 1 | **100%** |
| Revoke Role | UserRolesService.revokeRole | 5 | 1 | 4 | 80% |
| Send OTP | OtpTokensService.create | 4 | 1 | 3 | 75% |
| Assign Role | UserRolesService.assignRole | 7 | 2 | 5 | 71% |
| Update Role Permissions | PermissionsService.assignPermissionToRole | 7 | 2 | 5 | 71% |
| Unlock-Unban User Account | AccountsService.unlockAccount | 3 | 1 | 2 | 67% |
| Update Profile | UserProfilesService.update | 3 | 1 | 2 | 67% |
| Update Role | RolesService.update | 3 | 1 | 2 | 67% |
| Verify Identity KYC (Phone Numb | KycVerificationsService.findMine | 3 | 1 | 2 | 67% |
| Lock-Ban User Account | AccountsService.lockAccount | 5 | 2 | 3 | 60% |
| Login with Google | AuthGoogleService.validateLogin | 5 | 3 | 2 | 40% |
| Create Permission | PermissionsService.create | 3 | 3 | 0 | 0% |
| View Permissions By Role | PermissionsService.findAll | 1 | 1 | 0 | 0% |
| View Role | RolesService.findAll | 1 | 1 | 0 | 0% |

## ⚠ FULL-DIVERGENCE SHEETS

**View User List (D19)** — the sheet names `PermissionsService.findAll()` and declares the
return type `PermissionEntity[]`. That method lists permission records; it has nothing to do
with users. The real path is `UserProfilesService.findAll(query)` (`user-profiles.service.ts:36`,
`GET /user-profiles`) returning `{ data: UserProfileEntity[]; total: number }` — a paged
envelope, not a bare array. Class and return shape are both wrong.

**Access Audit Log (D20)** — identical failure. Sheet names `PermissionsService.findAll()` →
`PermissionEntity[]`; reality is `AuditLogsService.findAll(query)` (`audit-logs.service.ts:35`,
`GET /audit-logs`) returning `{ data: AuditLogWithUser[]; total: number }`, each row joined to
the actor's display name. Class and return shape are both wrong.

Both were already flagged MISMAPPED in `qa-recon-symbols.json`; these tests confirm the
mismapping empirically rather than by inspection.

## The dominant pattern: validation asserted on non-DTO values (D10–D14, D16–D18, D21)

32 of the 32 divergences reduce to one root cause. The sheets expect `BadRequestException`
with messages like `userId should not be empty` / `accountId invalid uuid`, but:

* **Route params are unvalidated.** `@Param('userId') userId: string` — there is **no
  `ParseUUIDPipe` anywhere in the iam controllers**. The value reaches the repository
  untouched. Affects `userId`, `roleId`, `accountId`, `id` across D10–D14, D17, D18, D21.
* **Some named arguments are never caller input at all.** `assignedBy` (D10, D12) is an
  optional third parameter the controller never passes. `lockedBy` (D13) is taken from the
  authenticated admin's own session (`request.user.accountId`), so a caller cannot submit it
  empty. Neither appears on any DTO.
* **A miss is not an error.** `RolesService.update` / `UserProfilesService.update` return
  `null` on a miss (D17, D18); `KycVerificationsService.findMine` returns a `NOT_SUBMITTED`
  response (D21); `revokeRole` / `unlockAccount` issue an unconditional repository write and
  resolve `void` regardless (D11, D14). None of them throw.

Where a field genuinely **is** on a DTO the validation is real and the tests exercise it
through the actual `ValidationPipe` — and several match the sheet verbatim:
`reason should not be empty` (LockAccountDto), `token should not be empty`
(AuthGoogleLoginDto), `permission_name should not be empty` (CreatePermissionDto). Two cases
diverge only in field naming: the sheet says `roleId`/`permissionId`, the real body fields are
`role_id`/`permission_id` (D10, D12) — validation fires, the message differs.

## D15 — Login with Google: three sheet rows, one observable behaviour

`AuthGoogleService.validateLogin()` runs two strategies and **both internal
`throw new Error(...)` calls are swallowed by their own bare `catch {}`**
(`auth-google.service.ts:41, 67`):

```
try  { verifyIdToken(); if (!payload) throw new Error('Invalid Google token'); ... }
catch { /* fall through to the access-token fallback */ }
try  { fetch(userinfo); if (!res.ok) throw new Error('Invalid Google access token'); ... }
catch { throw new UnauthorizedException('Invalid Google token'); }
```

Neither raw `Error` can reach a caller. UTCID03 names `Error('Invalid Google token')` and
UTCID04 names `Error('Invalid Google access token')` as observable outcomes; in reality every
failure path — bad id-token, bad access token, network failure — collapses to the single
`UnauthorizedException('Invalid Google token')` that UTCID05 already covers. So three rows
describe one behaviour, and only UTCID05's is correct.

Worth noting for the report: this also means a genuine network outage and a forged token are
indistinguishable to the caller.

## D16 — Send OTP: `otpType` is unenforced at runtime

`OtpTokensService.create(accountId, otpType)` takes bare arguments. `otpType` is a TypeScript
enum, which is erased at runtime — passing `''` is persisted verbatim. The sheet's placeholder
`otpType-01` is not a member of the union either (`LOGIN | PASSWORD_RESET | IDENTITY_VERIFY`);
the value the real send-otp path issues is `IDENTITY_VERIFY` (`accounts.service.ts:173-175`),
which is what the test uses, recorded as a named inferred constant with that citation.

---

# Session 5 — clinical-emr, AppointmentsService probe findings

Generated cases in this session are grounded in an **empirical probe**: the real
`ValidationPipe` (built from the imported `validation-options.ts`) was run over every sheet
input and its actual output recorded, rather than the expected message being predicted from
the decorators. Everything below is observed, not inferred.

## ⚠ NUMBERING COLLISION — read before adding any `D<n>`

Two incompatible `D<n>` schemes are in use and they overlap:

| scheme | lives in | meaning | used |
|---|---|---|---|
| **product defect register** | `qa-baseline.md` | real product defects | D10, D11, D14 |
| **divergence-group labels** | `uc-divergences.md` (Session 5 iam) | one label per sheet's divergence group | D10–D21 |

`D10`, `D11` and `D14` therefore denote **different things** in the two documents. To avoid
compounding this, **new product defects below continue from D22** — past the highest label
used by either scheme — so no number is ambiguous. Renumbering the existing labels is not
attempted here (it would rewrite a document already reviewed); the recommendation for the
final report is to rename the divergence-group labels to a distinct prefix (e.g. `DG-01`).

## REFUTED — the claimed "validateLogin swallows errors" defect

A prior session proposed registering: *"in `validateLogin`, both internal `throw new Error(...)`
calls are swallowed by bare `catch {}`, making a network outage and a forged token
indistinguishable."* **Checked and refuted — not registered.**

* The two bare `catch {}` blocks are at `iam-service/src/auth/auth.service.ts:256` and `:321`,
  inside **`confirmEmail()`** and **`resetPassword()`** — not `validateLogin()` (line 52).
* Neither swallows anything. Each throws
  `UnprocessableEntityException({ status: 422, errors: { hash: 'invalidHash' } })`.
* There are no `throw new Error(...)` calls being caught.

What *is* true is narrower: any `jwtService.verifyAsync` failure — malformed, expired, wrong
secret — collapses to the same `invalidHash` response. That is deliberate and correct; telling
a caller *why* token verification failed is an information leak. **No defect recorded.**

## D22 — `appointment_time` accepts an empty string (CODE_GAP)

`CreateAppointmentDto.appointment_time` (`create-appointment.dto.ts:41-43`) carries
`@IsString()` and nothing else. An empty string satisfies `@IsString()`, so the pipe accepts it.

* **Sheet:** *Create Appointment at Facility* UTCID12 expects rejection
  (`appointment_time should not be empty`).
* **Observed:** pipe **RESOLVED** — no error raised.
* **Verdict:** the spec is right and the code is missing the validation. Identical class to the
  `cancelled_by` / `session_id` / `symptom_name` gaps found in Session 4, which were fixed by
  adding `@IsNotEmpty()`. **Not fixed here** — out of scope for a generation session.

## D23 — `appointment_date` accepts calendar-invalid dates and silently shifts them (CODE_GAP)

`@IsDateString()` (`create-appointment.dto.ts:38`) validates ISO-8601 *shape*, not calendar
validity, so `2026-02-30` passes. `create()` then does
`appointment_date: new Date(dto.appointment_date)` (`appointments.service.ts:490`).

* **Observed (probe):** pipe **RESOLVED** `2026-02-30`.
* **Observed (runtime):** `new Date('2026-02-30')` → **`2026-03-02`**.
* **Impact:** a booking for a date that does not exist is accepted and silently moved to a
  different day. The patient is never told. This is user-visible and reaches persisted data.
* **Sheet:** *Create Appointment at Facility* UTCID10 expects rejection — the spec is right.
* **Verdict:** CODE_GAP. **Not fixed here.**

## The dominant SPEC_WRONG pattern, confirmed empirically for this class

`actorUserId`, `actorRole` and `options` are **method arguments of `create()`**, never fields on
`CreateAppointmentDto`. Probe UTCID20–23 all **RESOLVED**: `whitelist: true` strips unknown
properties, and clinical-emr's options do **not** set `forbidNonWhitelisted`, so unknown keys are
silently dropped rather than rejected. Every sheet row asserting validation on these three is
unreachable as written. This mirrors the iam finding and the Cancel Appointment pilot.

Message divergences that are real but cosmetic: every `X should not be empty` row for a
`@IsUUID()` field observes `X must be a UUID` instead — validation *does* fire, only the wording
differs (`patient_id`, `doctor_id`, `clinic_id`, `created_by`).
