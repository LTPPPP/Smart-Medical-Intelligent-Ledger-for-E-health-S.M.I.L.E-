# Admin Color Consistency Design

**Date:** 2026-07-29
**Branch:** `feat/retest-main-flow`

## Goal

Make administrative management screens feel like one S.M.I.L.E product rather
than independent violet, indigo, cyan, and blue themes. This batch changes
presentation only; page behavior, data flow, permissions, and API contracts
remain unchanged.

## Intent

The primary user is a clinic administrator reviewing access, permissions,
users, and system activity throughout the workday. They need to scan tables,
identify actions, and move between management screens without relearning the
visual hierarchy. The interface should feel restrained, clinical, trustworthy,
and operational.

## Visual Direction

- **Domain:** dental enamel, clinical chart lines, examination lighting,
  instrument steel, access control, traceable records.
- **Color world:** enamel white, S.M.I.L.E blue, deep dental navy, mist blue,
  neutral slate, and semantic red/green/amber.
- **Signature:** a quiet S.M.I.L.E-blue management path across headers, focus
  rings, neutral actions, expansion affordances, and pagination.
- **Reject:** decorative page-specific gradients, violet/indigo branding, and
  unrelated accent colors for neutral controls.

## Color Rules

1. Use the existing `smile-primary`, `smile-primary-light`, and
   `smile-primary-dark` tokens for brand and neutral interaction states.
2. Use existing surface tokens for cards, panels, borders, inputs, and dark
   mode.
3. Preserve semantic colors:
   - red for destructive actions and errors;
   - emerald for successful or active states;
   - amber for pending or warning states;
   - audit action colors when they distinguish event meaning;
   - refund workflow colors when they distinguish workflow state.
4. Remove decorative gradients from management page headers and role dialogs.
5. Do not introduce new global tokens or change the global palette.

## Scope

### Role Management

- Page header, icon tile, count emphasis, neutral buttons, search focus,
  expansion controls, role badges, expanded border, table header, pagination,
  loading and empty states.
- Create Role dialog.
- Create Permission dialog.
- Permission matrix.

### Audit Logs

- Page header, icon tile, total emphasis, refresh action, search/filter focus,
  reset control, table header, expansion affordances, avatar treatment, detail
  border, empty/loading states, and pagination.
- Audit action badges and timeline dots retain their semantic event colors.

### User Management

- Decorative header gradient and icon tile.
- Role-management action and role dialog.
- Ban/unban and status colors remain semantic.
- Gender metadata badges remain unchanged because they are data labels rather
  than navigation or brand accents.

### Similar Admin Pages

Only non-semantic accent drift found during the implementation scan is changed.
Revenue chart series, refund workflow statuses, KYC statuses, error states, and
destructive actions are explicitly excluded.

## Implementation

Use narrow Tailwind class replacements in the existing pages and supporting
components. Reuse the current surface tokens and layout. Do not create a new
admin shell, shared abstraction, or global CSS alias for this visual-only
batch.

## Accessibility and Interaction

- Keep visible focus rings using the S.M.I.L.E primary token.
- Preserve hover, disabled, loading, expanded, and dark-mode states.
- Preserve current contrast for text and destructive/status states.
- Do not change labels, tab order, keyboard behavior, or responsive layout.

## Verification

1. Run GitNexus impact analysis or document its transport limitation and use
   explicit caller scans.
2. Run frontend type-check.
3. Run focused lint on the changed files.
4. Open Role Management, Audit Logs, and User Management in the running local
   frontend at desktop and narrow viewport widths.
5. Verify light/dark surfaces, dialogs, pagination, expanded rows, filters,
   loading/error states where reachable, and unchanged semantic colors.
6. Run `git diff --check` and inspect the complete frontend diff.

## Boundaries

- No API, permission, routing, data-model, or backend changes.
- No page redesign, spacing overhaul, typography change, or new animation.
- No changes to KYC, payment, Revenue, Refund, or audit-event semantics.
- No commit or push is part of this batch unless requested separately.
