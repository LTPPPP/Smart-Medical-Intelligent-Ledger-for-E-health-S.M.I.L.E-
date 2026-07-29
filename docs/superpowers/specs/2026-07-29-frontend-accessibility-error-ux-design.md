# Frontend Accessibility and Error UX Design

## Goal

Make the S.M.I.L.E frontend easier to read and recover from errors while
keeping schedule navigation aligned with backend authorization. Refresh local
demo data with English-only seed content without destructive database resets.

## Scope

- Remove the nested application shell from Admin Performance.
- Give Leave Management and Request Leave the same application shell and
  report-style visual language used by the rest of the product.
- Show schedule destinations only when the signed-in role can use them.
- Normalize `ROLE_*` role values before route checks.
- Replace protected routes with the Unauthorized route so browser Back does
  not loop into the denied route.
- Explain the denied route, signed-in role, and allowed roles without exposing
  tokens or private data.
- Map IAM error keys such as `notFound` and `incorrectPassword` to readable
  login messages.
- Log only sanitized error metadata in development; never log credentials,
  tokens, request bodies, or personal identity data.
- Remove the unused Pairing and language buttons from the landing header.
- Increase the default type scale modestly, raise tiny labels to a readable
  minimum, and restore browser zoom support.
- Re-run verified idempotent local seeds using English demo content.

## Role Matrix

The frontend must use backend-supported roles as the source of truth:

- Schedule management: Admin and Manager.
- Work shifts: Admin, Doctor, Receptionist, and Manager.
- My Schedule: Doctor.
- Leave Management: Admin, Manager, Doctor, and Receptionist.

The Schedules landing page must not present inaccessible destinations as
ordinary links. Direct navigation remains protected by `ProtectedRoute`.

## Error Handling

One shared formatter converts known backend keys and HTTP/network failures to
user-facing English. Unknown server messages fall back to a safe generic
message. Development logs contain only the operation, HTTP status, server error
key, and request path.

Unauthorized navigation uses history replacement and a deterministic Dashboard
exit. The page provides enough context to understand the denial without
revealing implementation details.

## Visual Direction

The interface remains a clinical operations console: sterile white, medical
blue, scrub teal, slate, and semantic red. Typography prioritizes daily staff
readability. The schedule hub is role-aware, and all affected screens retain
the existing S.M.I.L.E application chrome rather than introducing a separate
design system.

## Data Refresh

Before running seeds, inspect every command for deletes or truncation and
confirm the target local containers and databases. Prefer idempotent upserts.
Seeded names, descriptions, specialties, clinics, services, schedules, and
other demo labels must be English. Existing real or identity/KYC data is out of
scope and must not be printed or modified.

## Verification

- Focused tests for login error formatting, role normalization, schedule-card
  visibility, and Unauthorized navigation.
- Frontend lint, type-check, targeted Vitest, and production build.
- Browser smoke for invalid login, Admin Performance, schedule destinations,
  Leave Management, Unauthorized Back/Dashboard behavior, and landing header.
- Apply seeds to confirmed local demo databases, rerun for idempotency, and
  verify representative English-only rows without printing sensitive fields.
