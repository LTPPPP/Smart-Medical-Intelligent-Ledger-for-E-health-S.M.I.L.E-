# Sequence Diagram Review Notes

Diff between the `.puml` diagrams and the actual code, plus the three issues
raised. Findings are recorded below; **the fixes described in "Applied changes"
have been made**, the rest is left as-is.

## Applied changes

- **UC-10 is now a sub-flow**, drawn as a `group UC-10 Send OTP` frame (a real
  PlantUML frame, not a note) inside **UC05** and **UC06**. UC06 issues the code;
  UC05 verifies it and re-issues it on the "Resend code" path.
- **UC05 / UC06 rewritten to the OTP design** (option 2 below) —
  `OtpType.PASSWORD_RESET`, `otpTokensService.create` /
  `findValidByAccountAndCode` / `markAsUsed`. See the backend gap warning below.
- **UC15, UC16, UC19**: added the missing user action step (`Click "Assign
  Permission"` / `Click "Assign Role"` / `Click "Approve"`) plus a form-level
  validate step; all steps renumbered.
- **21 vague `validate` steps rewritten** with the concrete rules spelled out in
  the step message itself (no notes), read from the form components and the
  class-validator DTOs: UC01, UC02, UC07, UC09, UC30, UC33, UC37, UC48, UC49,
  UC50, UC51, UC54, UC63, UC66, UC70, UC75, UC76, UC77, UC78, UC79, UC80.
  UC01 step 1 also corrected to list `username` and `gender`, which the form
  collects and submits.

> **Backend gap.** UC05/UC06 now document OTP-based password recovery, which the
> `iam-service` does **not** implement yet — it still signs a JWT `forgotAccountId`
> and expects `POST /auth/reset/password { hash, password }`. `OtpTokensService`
> already has every method the diagrams call and `OtpType.PASSWORD_RESET` already
> exists; only the `AuthService.forgotPassword` / `resetPassword` wiring is
> missing. Until that is written, the diagrams are the spec, not the as-built.

> **`UC10_SendOTP.puml` is now redundant** and has been left untouched rather than
> deleted. Note it still describes the *phone/KYC* OTP
> (`POST /accounts/me/phone/send-otp`, `OtpType.IDENTITY_VERIFY`), which is a
> different flow from the password OTP now embedded in UC05/UC06. Tell me whether
> to delete it or repurpose it as the phone-verification use case.

Code read:
- `backend/service/iam-service/src/auth/auth.service.ts`, `auth.controller.ts`
- `backend/service/iam-service/src/accounts/accounts.controller.ts`, `accounts.service.ts`
- `backend/service/iam-service/src/otp-tokens/otp-tokens.service.ts`, `domain/otp-token.ts`
- `frontend/web/src/features/auth/{api/auth.ts,components/*.tsx}`

---

## Issue 1 — Send OTP / Forgot / Reset / Change Password

### What the code actually does

| Use case | Endpoint | Real logic |
|---|---|---|
| **UC06 Forgot Password** | `POST /api/v1/auth/forgot/password` body `{ email }` | `findByEmail` → if missing, 422 `emailNotExists` → `jwtService.signAsync({ forgotAccountId }, forgotSecret, forgotExpires)` → **emails a reset link** (currently `console.log`, no mailer wired). **No OTP anywhere.** |
| **UC05 Reset Password** | `POST /api/v1/auth/reset/password` body `{ hash, password }` | `verifyAsync(hash, forgotSecret)` → on failure 422 `invalidHash` → `findById` → on missing 422 `notFound` → `accountsService.update(accountId, { password })` → `refreshTokensService.revokeByAccountId()`. Entered from the emailed link, **not** from an OTP. |
| **UC07 Change Password** | `PATCH /api/v1/auth/me` body `{ oldPassword, password }`, JWT-guarded | `findById` → 422 `accountNotFound` → if `password` present and `oldPassword` missing → 422 `missingOldPassword` → if account has no `passwordHash` (Google-only account) → 422 `incorrectOldPassword` → `compare()` → on mismatch 422 `incorrectOldPassword` → **`revokeByAccountId()`** → `accountsService.update()`. |
| **UC10 Send OTP** | `POST /api/v1/accounts/me/phone/send-otp`, JWT-guarded | `otpTokensService.create(accountId, OtpType.IDENTITY_VERIFY)` → 6-digit code, `expiresAt` from `AUTH_OTP_EXPIRES_IN` (default `5m`) → INSERT `otp_token` → returns `{ message, devOtp }` (`devOtp` only when `NODE_ENV !== 'production'`). Consumed by `POST /api/v1/accounts/me/verify-phone { otp }` → `findValidByAccountAndCode(..., IDENTITY_VERIFY)` → 401 if invalid/expired → `markAsUsed` → `verifyPhone`. |

Key fact: **OTP in this codebase serves phone/identity verification only.**
`OtpType.PASSWORD_RESET` exists in the enum (`otp-tokens/domain/otp-token.ts:6`)
but **is never referenced by any service**. Password recovery is entirely
JWT-hash-link based.

### Your point is right, but the fix isn't where you think

UC10 as drawn is a dangling fragment: it starts at `Click "Send OTP"`, ends at
"Show OTP input form", and nothing ever verifies the code. It has no caller and
no consumer. But in the current code it does **not** belong to forgot/reset
password — it belongs to **phone verification**. Attaching it to UC05/UC06 would
document a flow the backend does not implement.

Three ways to resolve; they are mutually exclusive and this is the decision that
blocks the rewrite:

1. **As-built.** Delete standalone UC10; rewrite it as *Verify Phone Number* =
   `send-otp` + `verify-phone` in one diagram. UC05/UC06 stay link-based.
   Diagrams then match the backend exactly.
2. **Target design.** Merge UC10 into UC06 (forgot password sends an OTP) and
   have UC05 verify OTP + new password. Matches the UI already built — but the
   backend does not implement it, so the diagrams become a spec, not as-built.
   Requires backend work: use `OtpType.PASSWORD_RESET`, accept `{ emailOrPhone, otp, newPassword }`.
3. **Both.** OTP drawn as a reusable sub-flow appearing in two diagrams — phone
   verification (as-built) and forgot/reset password (marked *planned*).

### Related: a real FE/BE bug found while checking this

`frontend/web/src/features/auth/components/ForgotPasswordForm.tsx` implements a
**two-step OTP UI**: step 1 `emailOrPhone`, step 2 `otp` + `newPassword`. Step 2
calls `authApi.resetPassword({ emailOrPhone, otp, newPassword })` →
`POST /auth/reset/password` (`api/auth.ts:107`). The backend expects
`{ hash, password }` and will 422 `invalidHash` on every attempt.
**This path cannot work today.** The working path is
`ResetPasswordForm.tsx`, which reads `?hash=` from the URL and posts
`{ hash, password }` via `resetPasswordByHash` (`api/auth.ts:116`).

So the "forgot password with OTP" flow exists in the UI, in the enum, and in
your diagram intent — but not in the backend. That gap is the actual source of
the confusion between the three password use cases.

### Diagram-vs-code diffs to fix regardless of which option is chosen

- **UC05** — accurate. Minor: step 2 `Validate input` is vague (see Issue 3);
  the entry step should say the user arrives via `/reset-password?hash=…` from
  the email link, and there is no explicit "Click Reset" step (Issue 2).
- **UC06** — accurate. The FE field is `emailOrPhone` but is sent to the API as
  `{ email }` (`api/auth.ts:102`); worth showing, since it explains why a phone
  number never resolves.
- **UC07** — **missing two things**: (a) `refreshTokensService.revokeByAccountId(accountId)`
  after the old-password check, which the diagram omits entirely; (b) the
  `missingOldPassword` branch and the "account has no passwordHash" branch — the
  diagram only shows a single `incorrectOldPassword` outcome.
- **UC10** — no verify step, no `devOtp` in the response, expiry source
  (`AUTH_OTP_EXPIRES_IN`) shown but not the `OtpType.IDENTITY_VERIFY`
  significance; the boundary is called `PhoneVerificationView`, which already
  contradicts the UC name "Send OTP".
- **UC01** — steps 34-36 show the user typing an **OTP** for email confirmation,
  but `confirmEmail` (`auth.service.ts:235`) takes a **JWT `hash`**, not a
  6-digit code. Same confusion as UC10. Also missing the `emailVerified` /
  `NotFoundException` branch, and `register()` also creates a **UserProfile** —
  which the diagram does show correctly.

---

## Issue 2 — Missing "click submit / action" step

Swept all 87 diagrams for a boundary→controller call with a
`POST/PUT/PATCH/DELETE` that has **no preceding actor action step**.

**Genuinely broken (3):**

| File | Problem |
|---|---|
| `UC15_UpdateRolePermissions.puml:15` | Jumps straight from `1. Select role and permission to assign` to `2. POST /permissions/role/{roleId}`. Needs a `Click "Assign Permission"` step. |
| `UC16_AssignRole.puml:16` | Same shape: `1. Select user and role to assign` → `2. POST /user-roles/user/{userId}`. Needs `Click "Assign Role"`. |
| `UC19_VerifyIdentityKYC.puml:81` | Admin side: `24. Open KYC review panel` → `25. POST /kyc-verifications/{id}/approve`. Needs `Click "Approve"` (and the reject branch needs `Click "Reject"`). |

**Not a defect (24 files):** the read-only "view" use cases — UC08, UC11, UC14,
UC18, UC20, UC23, UC24, UC27, UC32, UC38, UC45, UC52, UC55, UC59, UC61, UC62,
UC67, UC71, UC81, UC84, UC85, UC86, UC87 — fire their `GET` on page load, so
"Open X page" *is* the triggering action. No button needed. UC04 has no
boundary→controller call at all (OAuth redirect), which is correct for that flow.

The remaining 60 diagrams already have an explicit `Click "…"` step.

---

## Issue 3 — `validate input` is too vague

23 diagrams have a self-message that says nothing about what is checked. They
should name the concrete rules, read from the form component or the DTO.

**Bare `validate input` / `Validate input` (17):**
UC01, UC02, UC05, UC06, UC07, UC09, UC30, UC33, UC48, UC49, UC50, UC51, UC63,
UC66, UC76, UC77, UC78

**Slightly better but still unspecific (6):**
UC37 `Validate input fields`, UC54 `validate cancellation reason`,
UC70 `validate input fields`, UC75 `validate prescription fields`,
UC79 / UC80 `Validate file type and size`

**Worked example — UC01**, from `RegisterForm.tsx:164-178`, `3. validate input`
should read:

```
form -> form : 3. validate: firstName/lastName/username required,
\nusername ≥ 3 chars and [a-zA-Z0-9_], email format,
\npassword ≥ 8 chars, confirmPassword matches
```

Note the diagram's step 1 lists `firstName, lastName, email, phone, password` but
the form also collects **username** and **gender**, and both are sent to the API
(`RegisterForm.tsx:183-189`). Step 1 needs updating too.

The same treatment is needed per diagram — each one's rules must be read from its
own form component; they are not interchangeable. UC79/UC80 are closest to
acceptable already but should still state the actual allowed MIME types and the
size ceiling rather than "file type and size".

---

## Suggested order of work

1. Decide the UC10 question (option 1 / 2 / 3 above) — it determines whether
   UC05/UC06/UC10 are rewritten or only patched.
2. Patch UC07 (missing token revocation + two missing branches) and UC01
   (hash vs OTP confusion) — these are wrong-logic bugs, not cosmetics.
3. Add the three missing action steps (UC15, UC16, UC19).
4. Sweep the 23 vague `validate` labels, reading rules from each form.
5. Separately, in code: fix the `ForgotPasswordForm.tsx` → `/auth/reset/password`
   body mismatch, or remove the OTP UI if option 1 is chosen.
