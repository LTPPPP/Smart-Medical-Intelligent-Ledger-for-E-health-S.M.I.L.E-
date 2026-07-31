# Refund Request Dialog Design

## Goal

Add a deliberate review step before a paid payment becomes a refund request.
Clicking **Refund** must open a dialog and must not change server state until
the user confirms the request.

## Existing Workflow

The backend already provides the complete refund lifecycle:

1. An authorized patient or staff member requests a refund for a paid payment.
2. The payment enters `REQUESTED`.
3. Admin or manager approves or rejects it in the refund queue.
4. Approval changes the payment to `refunded`; rejection keeps the original
   payment paid and records the decision reason.

This change does not introduce a payment-cancellation state or a new backend
endpoint.

## Design

### Shared dialog

Create one reusable `RefundRequestDialog` for the appointment detail and
payment callback/history surfaces. It contains:

- short payment reference;
- original paid amount;
- refund amount initialized to the full captured amount;
- required reason textarea;
- **Cancel** and **Submit refund request** actions.

The dialog uses the existing design-system dialog, input, button, semantic
error, font, and theme tokens. It must support keyboard focus, Escape, close
button, accessible title/description, and pending-state locking.

### Validation

Client validation mirrors the backend boundary:

- amount must be a finite number greater than zero;
- amount must not exceed the captured amount;
- reason must be non-empty after trimming.

The backend remains authoritative. API validation errors appear inside the
dialog with readable light/dark contrast and retain the user's inputs.

### State transitions

- Clicking **Refund** only opens the dialog.
- Closing or cancelling performs no mutation.
- Confirming sends `{ amount, reason }` through the existing refund API.
- On success, close the dialog, refresh payment history, show the existing
  success toast, and replace the Refund action with the current refund status.
- While a refund request is open, the UI prevents duplicate submission.

### Admin queue

The existing admin refund queue, approval dialog, rejection dialog, financial
report adjustment, and notification behavior remain unchanged.

## Verification

- Component test: opening and cancelling does not call the refund API.
- Component test: invalid amount or blank reason cannot submit.
- Component test: confirmation sends the trimmed reason and selected amount
  exactly once.
- Integration-level page tests cover both appointment detail and payment
  callback/history entry points.
- Frontend type-check and production build pass.
- Authenticated API smoke verifies the submitted request becomes `REQUESTED`
  only after confirmation and a duplicate request is rejected/disabled.

## Out of Scope

- A new `cancelled` payment status.
- Cancelling a pending VNPay transaction.
- Changing refund authorization or ownership rules.
- Changing admin approval/rejection state transitions.
- Automatically approving refunds.
