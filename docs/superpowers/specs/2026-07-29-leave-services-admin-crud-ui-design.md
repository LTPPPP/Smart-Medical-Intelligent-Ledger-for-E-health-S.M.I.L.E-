# Leave and Services Admin CRUD UI Design

## Goal

Bring Leave Management and Dental Services into the existing S.M.I.L.E
application pattern. Leave Management must become visually restrained, while
Dental Services must expose a working, discoverable CRUD flow to Admin users
without changing the backend authorization contract.

## Users and Outcomes

- Clinical staff review their own or permitted leave requests without losing
  application navigation context.
- Admin users browse, create, edit, activate or deactivate, and delete dental
  services.
- Non-Admin users may browse services but must not see management controls or
  enter create/edit routes.

The interface should feel like a precise clinical operations console: quiet,
readable, and functional rather than decorative.

## Visual Direction

Domain concepts are treatment catalog, specialty, clinical room, appointment
duration, price, leave request, approval queue, and date range.

The color world is enamel white, surgical blue, scrub slate, pale ice, muted
amber, clinical green, and alert red. White and slate create structure;
surgical blue is the single interaction accent; amber, green, and red are used
only to communicate state.

The signature element is a compact clinical record surface: service code or
staff identity first, essential operational details grouped beneath it, status
at the edge, and explicit actions in a stable footer.

Reject these existing defaults:

- Decorative gradients and strong neumorphic shadows become quiet shared
  surfaces with a light border.
- Multicolored statistics and decorative chips become neutral counts and
  filters, with color reserved for status.
- Standalone hard-coded gray and white components become existing application
  shell, typography, spacing, and surface tokens.

## Leave Management

- Keep the current route, permissions, queries, approval flow, rejection flow,
  and pagination behavior.
- Use the existing application shell and shared page header.
- Remove decorative summary cards, gradients, oversized shadows, and colored
  avatar treatments.
- Present the status filters as one restrained filter row with neutral counts.
- Present requests as quiet responsive record cards or rows. Staff identity,
  leave type, date range, duration, and reason remain easy to scan.
- Use semantic color only for Pending, Approved, and Rejected status.
- Keep Approve and Reject actions explicit. The primary approval action uses
  surgical blue; rejection uses a restrained destructive treatment.
- Restyle the rejection dialog, empty state, error state, and pagination using
  the same shared surfaces and readable type scale as Appointments.

## Dental Services

- Use the same application shell, page-header hierarchy, card surface, spacing,
  and action placement as Specialties and Clinics.
- Preserve specialty, name, and active-state filtering plus pagination.
- Show an explicit `Add Service` action only when the normalized signed-in role
  includes `ADMIN`.
- Each service record shows service name, code, specialty, room type, duration,
  price, appointment requirement, and active state.
- Admin cards have explicit `Edit` and `Delete` footer actions. Non-Admin cards
  are read-only.
- The service list is the Read surface; a new detail-only route is out of scope.
- Create and edit routes use the same shared header and form surface. Direct
  access by a non-Admin redirects to Unauthorized through the existing access
  pattern.

## CRUD Contract

The backend already provides POST, GET, PATCH, and DELETE service endpoints, so
no backend behavior change is required.

- Normalize roles through the shared role helper and check for `ADMIN`, not
  `ROLE_ADMIN`.
- Use one frontend service API module for list, detail, create, update, and
  delete.
- Keep camelCase inside React components and map requests to backend snake_case:
  `service_code`, `service_name`, `category_id`, `specialty_id`,
  `duration_minutes`, `required_room_type`, `base_price`, `currency`,
  `is_active`, `requires_appointment`, and `preparation_instructions`.
- Map service responses back to the camelCase `Service` model.
- Create uses POST and update uses PATCH.
- Add `requiredRoomType` to the service model and form. The required select
  offers Examination, Surgery, and Imaging, mapped to `examination`, `surgery`,
  and `imaging`.
- Preserve the service code and currency rules currently enforced by the
  backend.

## Error and Interaction States

- Lists expose loading, empty, request-error with Retry, and mutation states.
- Create, update, and delete failures use the shared safe error formatter and
  toast helper; raw server objects are not rendered or logged.
- Disable submit and destructive actions while their mutation is running.
- Deletion requires confirmation naming the selected service.
- Successful create, update, and delete actions show an English confirmation
  and invalidate the affected service queries.

## Scope Boundaries

- Frontend-only changes unless focused runtime evidence identifies a backend
  regression not described by this design.
- No new design system, service detail route, bulk actions, or role expansion.
- Do not change KYC, LangGraph, chatbot, Docker images, or seed data in this
  batch.
- Preserve all unrelated changes already present in the dirty worktree.

## Verification

- Add focused tests for Admin versus non-Admin CRUD visibility and service
  request/response mapping.
- Add or update focused component tests only where needed for the changed Leave
  and Services states.
- Run frontend type-check and targeted tests or lint for touched files.
- Build only the frontend image if runtime validation requires a production
  container; do not rebuild or restart KYC.
- Browser-smoke Leave Management plus Admin service create, edit, and delete.
  Verify a non-Admin can browse services without seeing management controls.
