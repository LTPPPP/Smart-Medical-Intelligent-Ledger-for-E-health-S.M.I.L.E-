# S.M.I.L.E Demo UI Completion Design

## Objective

Complete the frontend surfaces backed by the current S.M.I.L.E backend backlog on
branch `feat/fe/demo-ui`. Reuse the realized UI modules from the
`smile_tmp/001-smile-to-demo` reference repository where they remain compatible,
then reconcile them with the current repository's API contracts, authentication,
KYC, design tokens, and role model.

The completed scope covers:

- Appointment management and booking
- Payment initiation, result, history, and refund/cancel presentation
- Patient profiles, medical history, medical records, treatment history, and export
- Schedule management, personal schedules, and leave requests
- Clinical examinations, diagnoses, treatment plans, prescriptions, and orders
- Dental imaging upload, library, annotation, and tooth-chart attachment
- Existing clinic and service catalog pages needed by those workflows

Performance, revenue, and financial dashboards are excluded because their backend
backlog remains incomplete.

## Delivery Strategy

The implementation is split into independently verifiable domain slices:

1. Shared application shell, routes, roles, permissions, and validation helpers
2. Appointment and payment
3. Patient records
4. Scheduling
5. Clinical examination
6. Dental imaging integration
7. Clinic and service catalog integration polish

Each slice must type-check and pass its targeted tests before the next slice is
integrated. The final branch must also pass the full frontend build and browser QA.

## Reference Policy

The reference repository is a source of realized UI and interaction patterns, not
an authoritative source of API contracts.

- Port reusable components, stores, types, and page composition selectively.
- Keep the current repository's `shared/api/endpoint.ts`, auth token flow, KYC
  eligibility flow, and backend response shapes authoritative.
- Do not bulk-copy the reference frontend over the current frontend.
- Preserve current KYC/admin/profile improvements and current design tokens.
- Replace stale `ROLE_*` checks with the current role names where required.

## Application Shell And Access

Authenticated pages use one consistent clinical application shell with:

- Role-filtered navigation
- Page title and primary action area
- Desktop navigation and a compact mobile navigation pattern
- Account/profile access
- Loading, empty, error, forbidden, and retry states

Role behavior:

- `PATIENT`: personal appointments, booking, payment, profile, and own records
- `DENTIST`: assigned appointments, patient records, examination, imaging, schedule
- `RECEPTIONIST`: appointments, patient registration, check-in, payment assistance
- `NURSE`: appointment and examination support views allowed by permissions
- `CLINIC_ADMIN`: clinic operations, schedules, patients, services, and clinical views
- `ADMIN` and `SUPER_ADMIN`: platform administration without clinical actions unless
  the account also has the corresponding clinical permission

The UI may hide unavailable actions, but backend authorization remains the final
authority. Protected pages must declare roles or permissions explicitly instead
of relying on menu visibility.

## Appointment And Payment

### Appointment List

Provide a responsive list/calendar surface with:

- Search by appointment code, patient, doctor, or clinic
- Status, date range, clinic, doctor, and booking-type filters
- List and calendar views
- Pagination or backend-supported incremental loading
- Clear loading, empty, filtered-empty, and error states
- Actions based on status and permission: view, edit, confirm, check in, cancel,
  initiate payment

### Booking

Use a guided booking flow:

1. Select facility, specialty, or doctor booking mode
2. Select clinic/specialty/doctor and an available date/time
3. Enter patient and visit information
4. Review the appointment
5. Submit and show confirmation

The existing KYC and verified-phone eligibility check remains mandatory for patient
booking. Staff-assisted booking follows backend permissions.

Validation includes:

- Required clinic, service/specialty, doctor when applicable, and time slot
- Appointment time must be in the future
- Reason and notes length limits
- Valid email and Vietnamese phone formats when patient contact is entered
- No submission without KYC/phone eligibility for self-booking
- Server conflict errors, including unavailable slots and duplicate requests, shown
  next to the relevant step without losing entered data

### Detail And Lifecycle

The detail page presents appointment identity, participants, service, schedule,
status timeline, notes, payment state, and available lifecycle actions. Destructive
or state-changing actions require confirmation and show pending/success/error states.

### Payment

Payment pages support initiation, callback result, payment history, and refundable
transaction presentation. Currency uses Vietnamese formatting. The UI must not claim
a payment succeeded before the backend confirms it.

## Patient Records

Provide staff-facing patient search/list/detail pages and patient-facing own-record
views.

Staff workflows include:

- Create and update patient demographics
- Search and filter patients
- View profile, medical history, records, treatment timeline, and dental images
- Create, update, finalize, and delete records according to permission and status
- Export a printable/PDF-ready medical record view

Validation includes required identity fields, date of birth not in the future,
valid contact data, sensible numeric ranges, and confirmation before deletion or
finalization.

Patient accounts may only see their own records and cannot see staff-only controls.

## Scheduling

Provide:

- Doctor schedule list and calendar
- Create/update on-call and examination schedules
- Personal schedule view
- Leave request list, creation, approval/rejection presentation
- Status and date filters
- Conflict and invalid-range feedback

Validation prevents end-before-start ranges, past scheduling where prohibited,
missing clinic/doctor assignment, overlapping selections surfaced by the backend,
and empty rejection reasons.

## Clinical Examination

Build a clinical workspace around an examination session rather than isolated forms.

The workspace includes:

- Session header with patient, appointment, clinician, status, and timestamps
- Symptoms and vital signs
- Diagnoses
- Treatment plan and treatment steps
- Electronic prescriptions and medication items
- Imaging orders
- Laboratory/clinical test orders
- Dental images associated with the patient/session

Forms use typed schemas and field-level messages. Numeric medical fields use bounded
ranges, medication dosage/frequency/duration are required when an item is added, and
orders require type, urgency, and clinical indication. Finalization and deletion
require confirmation.

The examination index must list sessions with filters and link to create/detail
pages. It must not render a detail component without a session identifier.

## Dental Imaging

Integrate existing dental-image components into patient and examination workflows:

- Image library with category/date filters
- Upload with file type, size, and required metadata validation
- Preview and upload progress
- Annotation tool
- FDI tooth selection/chart
- Attachment to the relevant patient, record, treatment, or examination context

Unsupported files, oversized files, upload failures, and empty libraries receive
explicit UI states. Image operations remain permission-gated.

## Clinic And Service Catalog

Retain the current clinic and service feature implementations, then make them
consistent with the application shell and downstream workflows.

- Clinic list/detail/edit and treatment-room management
- Specialty and service list/create/edit/delete
- Selectable clinic/service data for booking and examination
- Role-aware mutation controls
- Consistent validation, confirmations, loading, empty, and error states

## Component Boundaries

Domain modules own their API client, types, hooks, schemas, and UI components:

- `features/appointment`
- `features/payment`
- `features/patient`
- `features/schedule`
- `features/examination`
- `features/dental-image`
- `features/clinic`
- `features/service`

Shared layout, form primitives, status presentation, confirmation dialogs, route
protection, and formatting live under `shared`. Pages compose domain components and
must not duplicate API or validation logic.

## Data And Error Handling

- TanStack Query owns server data, mutations, cache invalidation, and retry behavior.
- React Hook Form and Zod own client-side form state and validation.
- Server validation messages are normalized into user-readable field or form errors.
- Mutation buttons disable while pending and prevent duplicate submissions.
- Filters that trigger backend queries are debounced where appropriate.
- Cached data is invalidated narrowly after successful mutations.
- The UI never logs tokens, KYC documents, medical details, or payment secrets.

## Visual System

Follow the existing S.M.I.L.E visual language and tokens:

- White/light neutral work surfaces with blue primary actions and restrained
  semantic colors
- Dense, scan-friendly operational layouts instead of marketing compositions
- Tables and lists for comparison-heavy workflows; cards only for individual items
- Maximum card radius of 8px unless an existing shared component requires otherwise
- Lucide/Iconify icons for recognizable actions
- Stable toolbar, filter, table, calendar, and form dimensions
- Responsive layouts at desktop and mobile widths without clipping or overlap

No new decorative raster assets are required for these operational screens.

## Testing And Verification

### Automated

- Unit tests for pure validation schemas, status/action rules, and payload transforms
- Targeted component tests where the existing test setup permits them
- `npm run type-check`
- Targeted ESLint on changed files, followed by `npm run lint`
- `npm run build`

### Browser QA

Run the frontend and verify desktop and mobile flows with Playwright because the
Browser plugin is not available in this session.

Required checks:

- App shell renders without framework overlay
- No relevant console errors
- Appointment list filters and view switch
- Booking validation, step navigation, review, and blocked ineligible state
- Appointment lifecycle confirmation dialogs
- Payment initiation/result states
- Patient search, detail navigation, record validation, and protected actions
- Schedule filters/calendar and invalid date-range handling
- Examination list/create/detail and clinical form validation
- Dental image empty/upload validation states
- Responsive navigation and no horizontal overflow

Screenshots are stored outside the repository and inspected before completion.

## Git And Completion Criteria

Use Conventional Commits grouped by domain. Before each commit, inspect staged
changes and run the relevant focused checks. Before final delivery:

- All requested domain pages exist and compose real feature modules
- No page remains a placeholder for an in-scope backend capability
- Role and permission guards are explicit
- Validation and feedback cover primary invalid and failure states
- Type-check, lint, build, and browser QA have fresh passing evidence
- Git diff contains no generated artifacts or unrelated changes
- The branch is pushed only after final verification, unless a backend/environment
  blocker is documented clearly
