# Leave and Services Admin CRUD UI Implementation Plan

**Spec:** `docs/superpowers/specs/2026-07-29-leave-services-admin-crud-ui-design.md`

## Task 1: Lock the Services contract with focused tests

**Files**

- Add `frontend/web/src/features/service/api/service.api.test.ts`
- Add `frontend/web/src/features/service/serviceAccess.test.ts`
- Add `frontend/web/src/features/service/serviceAccess.ts`

**Checks**

- ADMIN and ROLE_ADMIN can manage services.
- Manager, Receptionist, Doctor, Patient, and missing roles cannot manage.
- Create maps camelCase to required backend snake_case, including room type.
- Update calls PATCH and maps only supplied fields.
- Responses map room type back into the frontend model.

Run only these tests first and confirm they fail for the current behavior.

## Task 2: Repair the frontend Services CRUD contract

**Files**

- Modify `frontend/web/src/features/service/types/service.type.ts`
- Modify `frontend/web/src/features/service/api/service.api.ts`
- Modify `frontend/web/src/features/service/hooks/useService.ts`

**Changes**

- Add the room-type model and required create field.
- Add create and patch update methods to the existing mapped API module.
- Point CRUD hooks at that single API module.
- Preserve the separate management module for Specialty and Category callers.

Run the focused API/access tests and confirm they pass.

## Task 3: Make Services management discoverable and consistent

**Files**

- Modify `frontend/web/src/app/(pages)/services/page.tsx`
- Modify `frontend/web/src/app/(pages)/services/new/page.tsx`
- Modify `frontend/web/src/app/(pages)/services/[id]/edit/page.tsx`
- Modify `frontend/web/src/features/service/components/ServiceCard.tsx`
- Modify `frontend/web/src/features/service/components/ServiceFilters.tsx`
- Modify `frontend/web/src/features/service/components/ServiceForm.tsx`

**Changes**

- Apply ADMIN-only management visibility and route protection.
- Use shared application surfaces, page header, readable form controls, explicit
  card actions, and loading/error/empty/retry states.
- Add the required room-type select.
- Confirm delete by service name and show English success/error feedback.

## Task 4: Restrain Leave Management UI

**Files**

- Modify `frontend/web/src/app/(pages)/schedules/leaves/page.tsx`
- Modify `frontend/web/src/features/schedule/components/LeaveRequestCard.tsx`

**Changes**

- Remove decorative statistics, gradients, neumorphic shadows, and unnecessary
  colored treatments.
- Keep neutral status filters, readable record cards, explicit actions, shared
  empty/error states, quiet pagination, and a restrained rejection dialog.
- Preserve all leave queries and mutations.

## Task 5: Verify the affected frontend only

- Run focused Vitest files.
- Run frontend type-check.
- Run ESLint only on touched frontend files.
- Run `git diff --check`, inspect the scoped diff, and run GitNexus change
  detection.
- Smoke Leave Management and Services in the browser.
- If source changes are not visible in the production container, build and
  recreate only the frontend service with `--no-deps`; do not build or restart
  KYC.
