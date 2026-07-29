# Desktop Sidebar Collapse Implementation Plan

**Spec:** `docs/superpowers/specs/2026-07-29-desktop-sidebar-collapse-design.md`

## Task 1: Lock behavior with focused tests

- Add an `AppShell` component test.
- Confirm the current shell has no desktop collapse control.
- Cover toggle, layout offsets, local persistence, restored state, and mobile
  drawer isolation.

## Task 2: Implement the compact desktop rail

- Add desktop-only collapsed state and a stable local-storage key.
- Add an accessible edge toggle.
- Adapt logo, primary action, links, groups, profile, and sign-out controls to
  icon-only mode without changing destinations or permissions.
- Transition sidebar, top bar, and content offsets together.
- Keep the mobile drawer expanded.

## Task 3: Verify only the affected frontend

- Run the focused `AppShell` test.
- Run frontend type-check.
- Run ESLint on the touched source and test.
- Run formatting and diff checks plus scoped GitNexus change detection.
- Build/recreate only the frontend service if needed for runtime validation.
