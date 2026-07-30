# Desktop Sidebar Collapse Design

## Goal

Give S.M.I.L.E staff more horizontal workspace while keeping primary navigation
visible and predictable across the shared application shell.

## Approved Direction

- On desktop, the sidebar toggles between the existing 288 px width and an
  80 px icon rail.
- The compact rail keeps the logo mark, New Booking, navigation, Profile, and
  Sign Out actions available as icons.
- Compact actions expose accessible labels and native hover titles.
- An active route remains visually distinct in both states.
- Selecting a collapsed navigation group expands the sidebar so its child
  routes remain discoverable.
- The desktop preference is stored locally and restored after reload.
- The mobile drawer remains full width and does not inherit the desktop
  collapsed state.

## Visual Direction

The interface remains a quiet clinical console: enamel white, surgical blue,
scrub slate, and pale ice. The compact sidebar acts as an instrument rail,
using the existing iconography and active-route treatment rather than adding a
new visual language.

The width, content offset, and top-bar offset transition together over roughly
200 ms. Avoid floating navigation, decorative animation, unlabeled icons, or a
shared collapsed state between desktop and mobile.

## Accessibility

- The toggle is a keyboard-accessible button with `aria-label`,
  `aria-controls`, and `aria-expanded`.
- Every icon-only action keeps an accessible name.
- Compact navigation retains hover titles for sighted pointer users.
- Focus order and route destinations are unchanged.

## Scope

- Change only the shared frontend application shell and focused tests.
- Do not change routes, permissions, API behavior, backend services, KYC,
  LangGraph, chatbot, or seed data.
- Preserve the existing mobile drawer and all unrelated dirty-worktree changes.

## Verification

- Focused component tests cover toggle behavior, local persistence, restored
  state, and the full-width mobile drawer.
- Run frontend type-check and lint only for touched frontend source/tests.
- Build and recreate only the frontend container if runtime validation needs
  the production image; never rebuild KYC for this change.
