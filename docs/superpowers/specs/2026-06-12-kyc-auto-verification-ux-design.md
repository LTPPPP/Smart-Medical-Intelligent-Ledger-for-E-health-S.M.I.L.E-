# KYC Auto-Verification and UX Design

## Objective

Improve the existing citizen ID verification flow without redesigning the patient Profile UI.
The system should automatically verify trustworthy submissions, route uncertain submissions to
manual review, remove unnecessary selfie collection, and give administrators a dedicated KYC
management workspace with complete submission history.

## Scope

### Included

- Keep the existing `Profile > Identity` layout and visual styling.
- Accept Vietnamese citizen ID cards only.
- Require front and back citizen ID images.
- Remove selfie from new submissions.
- Use Profile full name and date of birth as independent submitted values.
- Let the user enter the citizen ID number.
- Compare submitted values against OCR without overwriting Profile data.
- Automatically verify submissions that satisfy every safety condition.
- Keep all other completed, uncertain, or failed OCR submissions available for manual review.
- Add a dedicated admin KYC management page with search, filters, history, and detail review.
- Replace technical patient-facing errors with clear English guidance.

### Excluded

- Face matching or biometric verification.
- Passport, driver license, old identity-card, or foreign document support.
- Redesigning the Profile page or Identity tab.
- Updating Profile name or date of birth from OCR.
- Deleting legacy selfie files or the nullable database column in this change.
- Exposing raw OCR payloads or infrastructure errors to patients.

## Patient Experience

The Identity tab keeps its current component structure, spacing, colors, and interaction style.
Only its fields, validation, and state messages change.

### Form

- Document type is fixed to `CITIZEN_ID`; the document-type selector is removed.
- Full name and date of birth remain sourced from the user's Profile.
- Citizen ID number remains an explicit user input.
- Required uploads are:
  - Citizen ID front
  - Citizen ID back
- Selfie upload is removed.
- Existing submission history remains accessible from the Identity tab.

### Submission behavior

1. Validate Profile full name and date of birth.
2. Validate the citizen ID number as exactly 12 digits.
3. Validate that both images are present, decodable, and use an accepted image format.
4. Store the submission and start asynchronous OCR.
5. Display a processing state while OCR is pending or running.
6. Refresh the current KYC status after OCR reaches a terminal state.

OCR never silently changes Profile data or the submitted citizen ID number.

### Patient-visible states

- `NOT_SUBMITTED`: the current form is editable.
- `PENDING_REVIEW` with OCR pending/processing: show that document reading is in progress.
- `PENDING_REVIEW` with OCR completed: show that the submission needs manual review.
- `VERIFIED`: lock resubmission and show whether verification was automatic or manual.
- `REJECTED`: show the actionable rejection reason and allow corrected resubmission.
- OCR failure: retain the submission for manual review and do not expose technical details.

### Patient-facing messages

Messages use concise English and describe the next action.

- Invalid front image:
  `We couldn't read the front of your citizen ID. Upload a clearer image with all four corners visible.`
- Invalid back image:
  `We couldn't read the back of your citizen ID. Upload a clearer image with all four corners visible.`
- Invalid citizen ID number:
  `Enter the 12-digit number printed on your citizen ID.`
- OCR mismatch:
  `Some information could not be confirmed automatically. Your submission has been sent for manual review.`
- Manual review:
  `Your documents were submitted successfully and need a manual review.`
- Automatic verification:
  `Your identity was verified automatically.`
- OCR service failure:
  `We couldn't complete automatic document reading. Your submission is safe and has been sent for manual review.`

Patient responses must not include exception messages, IP addresses, ports, service names, stack
traces, raw OCR text, or raw OCR payloads.

## Automatic Verification Policy

Automatic verification runs on the server after OCR completes. A submission is automatically
verified only when every condition below is true:

1. OCR status is `COMPLETED`.
2. OCR confidence is at least the configured threshold, default `80`.
3. Final risk level is `LOW`.
4. OCR identifies the document as `CITIZEN_ID`.
5. The submitted front image is identified as `FRONT`.
6. The submitted back image is identified as `BACK`.
7. OCR citizen ID number matches the submitted 12-digit number.
8. OCR full name matches the Profile full name using Vietnamese-aware normalization.
9. OCR date of birth matches the Profile date of birth.
10. Every automated check has status `PASS`.

Missing confidence, missing fields, `WARNING`, `FAIL`, OCR failure, mismatches, or an unknown side
always prevent automatic verification.

### Decision outcomes

- All conditions pass:
  - Set verification status to `VERIFIED`.
  - Record `verified_at`.
  - Record decision source as automatic.
  - Enable booking when phone verification is also complete.
  - Write a `KYC_AUTO_VERIFIED` audit event.
- Any condition does not pass:
  - Keep verification status as `PENDING_REVIEW`.
  - Persist a safe decision reason and failed criteria for admin review.
  - Do not reject automatically.

The decision must be idempotent. Reprocessing a terminal or manually reviewed submission must not
overwrite the existing decision.

## Confidence

The decision threshold is configurable through `KYC_AUTO_VERIFY_CONFIDENCE`, with a default value
of `80`.

The confidence used for automatic verification must be a document-level value produced by a
documented aggregation rule. If the OCR provider cannot provide a valid numeric document-level
confidence, the submission cannot be automatically verified.

## Data Model

Add explicit decision metadata to KYC records:

- `decision_source`: `AUTO`, `MANUAL`, or null while undecided.
- `decision_reason`: safe summary suitable for authorized admin display.

Keep `verified_by` nullable:

- Automatic verification leaves `verified_by` null.
- Manual approval or rejection stores the reviewer account ID.

Keep `selfie_image` nullable for legacy compatibility. New submissions do not require or store a
selfie.

## API Changes

### Patient submission

- Continue accepting multipart form data.
- Require `idFront` and `idBack`.
- Stop requiring `selfie`.
- Enforce `idType = CITIZEN_ID` server-side.
- Reject unsupported document types even if a custom client sends one.
- Return safe validation messages.

### Patient status and history

Include:

- verification status
- OCR status
- masked citizen ID number
- confidence when available
- decision source
- safe decision/rejection reason
- submission, processing, and verification timestamps

Do not include private file paths, raw OCR text, or technical OCR payloads.

### Admin list

Support:

- search by normalized full name or last four citizen ID digits
- verification status
- OCR status
- decision source
- submitted date range
- pagination

List rows include applicant, masked ID, status, OCR confidence, decision source, submitted time,
and reviewed/verified time.

### Admin detail

Authorized admins can access:

- front and back citizen ID images through audited private-file endpoints
- submitted Profile data
- structured OCR fields
- automated checks and risk
- safe OCR error details
- decision metadata
- review history and timestamps

Raw OCR text and technical payload remain collapsed as diagnostic information and are never shown
in the default review summary.

## Admin UX

Add `/admin/kyc-management` and a matching admin sidebar item.

The page contains:

- summary counts
- search input
- status, OCR status, decision source, and date filters
- paginated KYC history table
- empty, loading, and error states
- a detail surface for document comparison and review actions

The existing admin dashboard keeps a compact pending-review summary and links to the KYC
management page. Full review UI moves out of the dashboard.

Manual approval remains blocked while OCR is pending or processing and when server safety rules
forbid approval. Rejection requires a clear reason.

## Error Handling

### Patient

- Convert upload, validation, OCR, and network errors into stable message codes and friendly copy.
- Preserve the submitted record when OCR infrastructure fails.
- Allow retry only when no active pending submission exists or the previous submission was rejected.

### Admin

- Show whether failure belongs to image quality, OCR processing, data mismatch, or system error.
- Never show unredacted citizen ID numbers in list views.
- Technical errors may appear only in an explicitly expanded diagnostic section.

### Server logs

- Log KYC IDs and error categories, not raw identity values.
- Never log decrypted file paths, raw OCR text, citizen ID numbers, or image content.

## Security and Privacy

- Keep encrypted document storage and audited temporary decryption.
- Remove temporary decrypted files after OCR and admin file access.
- Restrict KYC history and document endpoints by role and ownership.
- Preserve retention-policy behavior.
- Record automatic and manual decisions in audit logs.
- Do not collect selfie data when it is not used.

## Compatibility

- Existing records with selfie images remain readable.
- Existing records without decision metadata are treated as legacy manual decisions when already
  verified or rejected.
- Database migration adds nullable/default-safe columns and does not rewrite legacy documents.
- Existing Profile and admin visual design tokens remain unchanged.

## Testing Strategy

### Backend unit tests

- Every auto-verification condition passes.
- Each individual failed condition prevents automatic verification.
- `WARNING` prevents automatic verification.
- Missing confidence prevents automatic verification.
- OCR failure remains pending for manual review.
- Duplicate poller execution is idempotent.
- Manual decisions are never overwritten.
- Unsupported document types and missing images are rejected.
- New submissions do not require selfie.
- Patient responses redact technical OCR data.
- Admin search and filters compose correctly.

### Backend integration tests

- Submit front/back images, process OCR, and auto-verify.
- Submit a mismatch and retain `PENDING_REVIEW`.
- Submit while OCR is unavailable and retain a reviewable record.
- Verify booking eligibility after automatic verification.
- Verify audit events for automatic and manual decisions.

### Frontend tests

- Identity UI retains its existing layout.
- Selfie and document selector are absent.
- Front/back validation messages are field-specific.
- OCR processing, automatic verification, manual review, rejection, and history states render.
- Admin list filters and pagination update API parameters.
- Admin detail actions refresh list and detail state.
- Raw infrastructure errors are not rendered to patients.

### Browser verification

- Patient Profile Identity flow on desktop and mobile.
- Existing Profile tabs and layout remain visually unchanged.
- Admin KYC list, filters, detail, approve, and reject flow.
- Loading, empty, failure, and long-address states.
- Console has no relevant runtime errors.

## Acceptance Criteria

- New KYC submissions require only citizen ID front and back images.
- Patient Profile UI is not redesigned.
- OCR never overwrites Profile identity data.
- Only submissions satisfying all automatic policy conditions become `VERIFIED`.
- All other submissions remain available for manual review.
- Patients never see raw infrastructure errors.
- Admins can search, filter, inspect, and review all historical KYC submissions.
- Automatic and manual decisions are auditable.
- Existing KYC records remain accessible.
