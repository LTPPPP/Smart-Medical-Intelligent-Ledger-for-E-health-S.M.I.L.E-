# VNPay Payment and Delete Dialog Design

**Date:** 2026-07-31
**Branch:** `feat/retest-main-flow`

## Goal

Make payment screens consistent with the S.M.I.L.E application, expose VNPay
as the only supported payment gateway, and replace browser delete prompts with
an accessible in-application confirmation dialog.

## Scope

### Payment

- Remove the disabled MoMo and ZaloPay choices and their stale translation
  copy from the frontend.
- Keep the existing VNPay backend contract and callback flow unchanged.
- Store and render a local VNPay brand asset instead of relying on a runtime
  icon lookup.
- Align the appointment checkout, payment callback/history, and admin refund
  management screens with the shared S.M.I.L.E layout, typography, surface,
  button, badge, and currency-formatting primitives.
- Preserve all existing role checks, payment state transitions, and refund API
  behavior.

### Delete confirmation

- Add one reusable controlled `ConfirmDialog` composed from the existing Base
  UI dialog and shared button components.
- Replace native `window.confirm` only for destructive Delete/Remove actions.
- Keep business confirmations such as Approve, Cancel, Finalize, Sign, Archive,
  and refund decisions outside this change.
- Keep the selected record and mutation state owned by each feature page; the
  shared dialog owns presentation and accessibility only.

### Booking availability

- Correct the shared appointment-availability contract so booked slots may omit
  an option token and every slot exposes its server-provided status.
- Apply green/red availability treatment only to the patient-by-doctor picker
  backed by `GET /appointments/availability`; do not infer availability in the
  generic date/time fields.
- Mark a date green when it contains at least one signed available slot and red
  when all returned candidates are unavailable. Keep every returned date
  selectable so the user can inspect why it cannot be booked.
- Mark individual time slots green and actionable or red and disabled, with
  text/icons and accessible labels so status is not communicated by color alone.
- Distinguish loading, request failure, genuinely empty schedules, and returned
  unavailable slots.

### Theme-safe feedback and clinical alerts

- Introduce a small semantic inline-feedback primitive for error, warning, info,
  and success surfaces using the existing theme tokens.
- Make the common error component and active examination error surfaces readable
  in light and dark themes, prioritizing copied pale-red error styles.
- Replace the clinical-alert cards' light-theme near-white text with semantic
  foreground/icon pairs that remain legible in both themes.
- Treat clinical-context loading and failure explicitly. A failed request must
  never render the reassuring “no known alerts” state.

### Examination-ready seed data

- Preserve the existing deterministic graph of eight English-language doctor
  accounts, profiles, specialties, clinics, rooms, schedules, patients, and 240
  appointments.
- Reclassify eight reserved appointments as `checked_in` on the demo date, one
  non-conflicting appointment per doctor, without pre-creating an examination
  session or medical record.
- Preserve fixed identifiers, two-pass idempotency, overlap constraints, and the
  payment seed's exact 240-appointment invariant.

## Experience Direction

The visual direction is calm clinical trust: enamel-white surfaces, the
existing S.M.I.L.E blue palette, cool slate supporting text, and semantic
green/red only for status and destructive actions. Payment should read like a
clear appointment receipt, not a gateway marketing page.

The payment signature element is a single verified VNPay gateway row beside a
receipt-style appointment and amount summary. This replaces the current three
equal provider cards and makes the supported path unambiguous.

## Component Design

### Payment screens

- Use the existing application shell and shared page-header/card/button/badge
  primitives wherever the route already participates in the authenticated
  application layout.
- Use the shared `formatVND` utility for every displayed amount.
- Show the local VNPay logo with accessible alternative text and a short
  secure-gateway explanation.
- Disable submission while a request is pending and reject invalid or missing
  payable amounts before calling the API.
- Keep callback status content semantic: success, pending, and failure each
  receive a clear heading, explanation, and next action.

### `ConfirmDialog`

The component accepts controlled state and descriptive content:

- `open` and `onOpenChange`
- `title` and `description`
- `confirmLabel` and optional `cancelLabel`
- `pending`
- `onConfirm`

The cancel action receives initial safe emphasis. The destructive action uses
the shared destructive button style. While pending, both duplicate submission
and accidental dismissal are prevented. Escape and backdrop dismissal remain
available before submission. Feature pages remain responsible for API calls,
toasts, list refreshes, and error details.

## Data and Error Flow

Payment remains:

1. The checkout page loads appointment and payment details.
2. The user verifies the receipt and chooses the sole VNPay gateway.
3. The existing initiate endpoint returns the VNPay redirect URL.
4. VNPay redirects to the existing callback route.
5. The callback page displays the verified backend payment state.

For deletion, clicking Delete stores the target and opens the dialog. Confirm
starts the existing mutation. Success closes the dialog and refreshes local
data; failure keeps the context visible and uses the application's existing
error/toast path. No API payloads or backend delete endpoints change.

Booking availability remains server-authoritative. The UI reads each slot's
`status` and only submits a slot when it is `available` and has a signed
`option_token`. Request errors receive a retry state and are never converted to
red “unavailable” dates or an empty schedule.

Clinical alerts are built only after the clinical-context query succeeds.
Loading shows a neutral progress state; failure shows theme-safe error feedback
with retry; a successful empty response alone may show “no known alerts.”

The examination seed follows the runtime rule that a new session starts from a
`checked_in` appointment. Each seeded doctor therefore receives one eligible
appointment with no existing session, allowing the normal create-session flow
to generate the draft medical record and transition the appointment.

## Validation

- Add focused tests proving VNPay is visible and MoMo/ZaloPay are absent.
- Add focused `ConfirmDialog` tests for accessible content, cancel, confirm,
  and pending behavior.
- Add focused booking tests for green available, red unavailable, disabled
  behavior, date aggregation, and distinct loading/error/empty states.
- Preserve the backend availability test that proves booked slots omit tokens
  and update the shared frontend contract accordingly.
- Add focused semantic-feedback and clinical-alert tests ensuring a failed
  clinical-context request never reports an empty safe state.
- Run the canonical reset/seed script and verify exactly one eligible
  `checked_in` appointment for every seeded doctor.
- Update or add targeted feature tests for representative delete flows instead
  of rebuilding unrelated services.
- Run frontend type checking and the smallest relevant test groups.
- Perform browser smoke checks for patient payment, callback states, admin
  refunds, and representative delete dialogs at desktop and narrow widths.
- Do not rebuild or retest the KYC service for this frontend-only change.
- Rebuild only the frontend Docker service after code validation. Seed-only
  source changes are executed locally by the reset script and do not require a
  Clinical EMR image rebuild.

## Risks and Boundaries

- Do not remove `provider` fields from payment entities or responses; they are
  valid backend audit data even though VNPay is currently the only provider.
- Do not introduce a global promise-based confirmation provider. It would hide
  feature state and add complexity without improving this scope.
- Do not mechanically convert non-delete native prompts; several collect or
  confirm domain-specific data and need separate UX decisions.
- Do not paint generic calendar/date/time controls green or red when they do not
  have server availability data.
- Do not add appointments beyond 240; the payment seed deliberately validates
  that canonical total.
- Do not modify the existing uncommitted KYC/PaddleOCR work or generated local
  artifacts.
