# S.M.I.L.E Desloppify Backlog

Status: remediation in progress; last reconciled with source on 2026-06-23

Scope: repository-wide review with deeper inspection of the appointment, booking assistant, frontend integration, local runtime artifacts, and affected service boundaries. This document is updated incrementally as evidence is verified.

The initial scan is complete and remediation is being delivered in scoped commits. Historical findings below retain their original evidence; use the status matrix and selection queue as the authoritative current state.

## Remediation Status

Status meanings:

- **Resolved:** implemented and verified for the stated scope.
- **Partial:** the primary path improved, but the original finding still has an uncovered boundary.
- **Open:** no complete verified remediation has been delivered.

| Item | Status | Current evidence / remaining boundary |
|---|---|---|
| C1 | Partial | Gateway now requires a valid JWT before proxying appointment routes and injects trusted actor plus role headers; Clinical appointment availability/create/update/status/cancel/check-in plus read/detail/code/history/notification routes now require an actor header and have focused tests for patient-projected ownership. Doctor-owned list/detail/mutation paths reject cross-doctor access, unknown non-patient actors without a trusted role are rejected for reads and creates, trusted staff/doctor create paths use the target Clinical patient projection for KYC, and Clinical normalizes trusted role headers before authorization decisions. Broader staff/admin route policy remains incomplete. |
| C2 | Resolved | Clinical EMR now owns service-duration-aware availability; AI consumes its opaque options. |
| C3 | Resolved | Canonical occupied intervals and PostgreSQL doctor/room/patient exclusion constraints include arrival and break buffers. |
| C4 | Resolved | Normal appointment frontend create/update/cancel/confirm routes now use Gateway/Clinical paths and verbs, including `PATCH` mutations. |
| C5 | Resolved | Frontend `npm run type-check` now passes after appointment, service/specialty, profile/KYC, and register Google-provider compatibility fixes. |
| C6 | Partial | Gateway no longer introduces a usable fallback JWT secret and documents a placeholder, but tracked environment-secret history still requires rotation/template cleanup. |
| C7 | Resolved | Signed availability options carry canonical service/doctor/room/date/time/duration context, while a validated `BookingDraft` preserves patient-supplied appointment type, chief complaint, and notes through confirmation and commit. |
| C8 | Resolved | Token-based reschedule revalidates canonical availability, and generic appointment updates now reject room/service/date/time/duration changes so scheduling mutations must use the signed option-token path. |
| C9 | Resolved | Normal appointment API now defaults to Gateway `/api/v1/appointments` instead of the legacy direct appointment service base. |
| C10 | Resolved | `scheduling-policy.ts` and the canonical migration define one occupied-interval policy. |
| C11 | Partial | Chat booking and Clinical appointment routes resolve authenticated IAM user IDs to Clinical patient records before booking, reading patient-owned appointments, or signing availability option tokens; Gateway now forwards the signed IAM role for appointment routes, and Clinical rejects appointment reads/creates when neither patient projection nor a trusted staff/doctor role is present. Trusted staff/doctor create paths now validate the target Clinical patient and check KYC against that patient's IAM user projection instead of the staff actor. The broader identity projection contract remains incomplete. |
| C12 | Partial | Booking validates patient/doctor context, and Clinical now enforces patient projection outside the chat path for reads and availability plus doctor self-projection for appointment list/detail/mutation paths. Create paths validate the target Clinical patient record before KYC and persistence, direct/outside-hours creation rejects doctors without an existing Clinical schedule or specialty projection, and a clinic migration adds an authoritative `appointments.patient_id` foreign key to `patients.patient_id`. Authoritative doctor database relations/projections remain incomplete. |
| C13 | Resolved | Appointment API now normalizes Clinical snake_case responses into frontend DTOs, uses lowercase Clinical status/payment values, and sends snake_case mutation payloads. |
| M1 | Resolved | The floating chat no longer renders the guided modal wizard or appointment-code input; booking, cancel, and reschedule now proceed through chat text and inline cards. |
| M2 | Resolved | Signed, patient-bound option tokens replace process-local prepared-option state and commits revalidate availability. |
| M3 | Partial | AI booking service discovery now follows Clinical pagination when resolving service hints and listing catalog services before using the server-driven availability endpoint. Manual appointment booking now calls server availability before booking option tokens, common dental-exam phrasing resolves to the seeded Oral checking service, and follow-up availability filters preserve previous booking context. Broader searchable/paginated service and doctor discovery UI remains pending. |
| M4 | Partial | Slot picking, appointment action cards, structured action builders, and conversation storage helpers are extracted into focused tested modules, reducing `FloatingBookingChat.tsx` to 401 lines. The slot picker now renders booked slots as disabled rose/pink items and open slots as selectable white items. Resize behavior and API orchestration still remain in the container. |
| M5 | Resolved | Manual appointment booking now requires server-driven availability lookup and selected option tokens for normal bookings; outside-hours remains the explicit manual-time exception. |
| M6 | Open | Package-manager lockfile policy is unresolved. |
| M7 | Open | CI still lacks all identified Gateway, AI, and explicit type-check gates. |
| M8 | Open | Legacy `booking_agent_service` remains pending owner decision. |
| M9 | Resolved | Vitest/React Testing Library now covers booking chat controls for no-ID appointment actions, structured action emission, and slot-picker rendering without a global confirmation button. |
| M10 | Resolved | Real PostgreSQL tests cover doctor/room/patient overlap, adjacency, cancellation, and concurrent same-slot commits. |
| M11 | Open | Notification/payment side-effect reliability remains unresolved. |
| M12 | Resolved | Appointment API helpers now unwrap response envelopes at the feature boundary so appointment pages consume domain DTOs. |
| M13 | Partial | AI/Clinical contracts have broader tests, but a shared contract suite for every `DomainTools` implementation is still missing. |
| M14 | Open | GitNexus generated artifacts remain noisy and intentionally excluded from feature commits. |
| M15 | Partial | Outcome codes and grounded response generation are now tracked and tested; older graph reply paths and exact-string policies remain. |
| M16 | Resolved | Appointment card actions send explicit `action` plus hidden `appointment_ref` fields while visible chat text stays human-readable; the AI service honors structured action payloads without requiring IDs in the message. |
| M17 | Partial | Local Gateway/AI/IAM wiring is improved, but compose/frontend URL definitions are not yet one canonical matrix. |
| M18 | Partial | Floating booking chat transcripts are now scoped by authenticated user id, legacy global transcript storage is cleared, and focused frontend tests cover cross-account transcript isolation. Auth token storage remains a broader security hardening decision. |
| M19 | Open | Legacy appointment-code benchmark/spec scenarios remain primary in several datasets. |
| M20 | Open | Idempotency uniqueness is still not scoped by actor and route. |
| M21 | Resolved | Floating chat, outcome, response-generator modules, and their tests are tracked. |
| M22 | Partial | Seed data now uses rolling schedules and service-room mappings; complete specialty/provider projection coverage remains. |
| N1 | Open | `runs/` and root model weights remain untracked and are still visible in status. |
| N2 | Open | Oversized UI/graph modules remain. |
| N3 | Resolved | Demo appointment schedules now roll relative to seed execution. |
| N4 | Open | Debug comments/logging cleanup remains opportunistic. |
| N5 | Open | Per-service Docker ignore review remains. |

Verification recorded for the resolved scheduling batch:

- Clinical unit tests: 63 passed, 6 opt-in PostgreSQL tests skipped by default.
- PostgreSQL scheduling integration: 6 passed, including concurrent same-slot commit behavior.
- Booking LangGraph: 212 passed.
- Gateway: 4 passed and build succeeded.
- IAM and Clinical builds succeeded.
- API smoke covered availability, booking, stale-token conflict, reschedule, and cancellation.

Verification recorded for the frontend type-safety batch:

- `frontend/web`: `npm run type-check` passed.
- `frontend/web`: focused `npx eslint` over the touched appointment, service/specialty, profile, and register files passed with no warnings.
- `frontend/web`: `npm run build` passed; remaining warnings are pre-existing repo-wide import-order, unused-variable, and `<img>` warnings outside this batch.

Verification recorded for the normal appointment route-parity batch:

- RED check first failed on legacy appointment base, legacy create paths, and non-Clinical mutation verbs.
- Route parity check now passes for Gateway `/appointments`, `/by-specialty`, `/by-doctor`, and `PATCH` update/cancel/confirm.
- `frontend/web`: `npm run type-check` passed.
- `frontend/web`: focused `npx eslint` over touched appointment endpoint/API/form/page files passed with no warnings.
- `frontend/web`: `npm run build` passed; remaining warnings are pre-existing repo-wide import-order, unused-variable, and `<img>` warnings outside this batch.

Verification recorded for the Gateway appointment-auth batch:

- RED Gateway spec first proved unauthenticated Clinical appointment requests were proxied instead of rejected.
- `backend/service/gateway-service`: `npm test -- proxy.middleware.spec.ts -- --runInBand` passed.
- `backend/service/gateway-service`: `npm run build` passed.

Verification recorded for the Clinical appointment read-authorization batch:

- RED controller/service specs first failed because read/history/notification routes did not accept or enforce an authenticated actor.
- `backend/service/clinical-emr-service`: `npm test -- appointments.controller.spec.ts appointments.service.spec.ts -- --runInBand` passed.
- `backend/service/clinical-emr-service`: `npm run build` passed.

Verification recorded for the Clinical availability ownership batch:

- RED controller/availability specs first failed because availability lookup did not accept an authenticated actor or enforce patient projection before signing option tokens.
- `backend/service/clinical-emr-service`: `npx eslint src/appointments/appointments.controller.ts src/appointments/appointments.controller.spec.ts src/appointments/appointment-availability.service.ts src/appointments/appointment-availability.service.spec.ts` passed.
- `backend/service/clinical-emr-service`: `npm test -- appointments.controller.spec.ts appointment-availability.service.spec.ts -- --runInBand` passed.
- `backend/service/clinical-emr-service`: `npm run build` passed.

Verification recorded for the doctor appointment projection batch:

- RED Gateway spec first failed because a signed IAM role was not forwarded as a trusted Clinical header.
- RED Clinical specs first failed because doctor appointment lookup did not accept an actor role or reject cross-doctor reads.
- `backend/service/gateway-service`: `npm test -- proxy.middleware.spec.ts -- --runInBand` passed.
- `backend/service/clinical-emr-service`: `npm test -- appointments.controller.spec.ts appointments.service.spec.ts -- --runInBand` passed.

Verification recorded for the doctor appointment ownership batch:

- RED Clinical specs first failed because appointment list/detail/cancel paths did not accept or enforce a trusted doctor role.
- `backend/service/clinical-emr-service`: `npm test -- appointments.controller.spec.ts appointments.service.spec.ts -- --runInBand` passed.
- `backend/service/clinical-emr-service`: `npx eslint src/appointments/appointments.controller.ts src/appointments/appointments.controller.spec.ts src/appointments/appointments.service.ts src/appointments/appointments.service.spec.ts` passed.
- `backend/service/clinical-emr-service`: `npm run build` passed.

Verification recorded for the trusted-role appointment read batch:

- RED Clinical specs first failed because patient and list reads did not accept an actor role and unknown non-patient actors could still read appointment records.
- `backend/service/clinical-emr-service`: `npm test -- appointments.controller.spec.ts appointments.service.spec.ts -- --runInBand` passed.
- `backend/service/clinical-emr-service`: `npx eslint src/appointments/appointments.controller.ts src/appointments/appointments.controller.spec.ts src/appointments/appointments.service.ts src/appointments/appointments.service.spec.ts` passed.
- `backend/service/clinical-emr-service`: `npm run build` passed.
- `backend/service/clinical-emr-service`: `npm test -- appointments -- --runInBand` passed with 86 tests passed and 6 opt-in PostgreSQL tests skipped.

Verification recorded for the appointment patient-record validation batch:

- RED Clinical spec first failed because appointment creation persisted a body `patient_id` even when the Clinical patient lookup failed.
- `backend/service/clinical-emr-service`: `npm test -- appointments.controller.spec.ts appointments.service.spec.ts -- --runInBand` passed.
- `backend/service/clinical-emr-service`: `npx eslint src/appointments/appointments.service.ts src/appointments/appointments.service.spec.ts` passed.
- `backend/service/clinical-emr-service`: `npm run build` passed.
- `backend/service/clinical-emr-service`: `npm test -- appointments -- --runInBand` passed with 87 tests passed and 6 opt-in PostgreSQL tests skipped.

Verification recorded for the appointment doctor-projection validation batch:

- RED Clinical spec first failed because appointment creation persisted a body `doctor_id` even when no Clinical doctor schedule or specialty projection existed.
- `backend/service/clinical-emr-service`: `npm test -- appointments.controller.spec.ts appointments.service.spec.ts -- --runInBand` passed.
- `backend/service/clinical-emr-service`: `npx eslint src/appointments/appointments.service.ts src/appointments/appointments.service.spec.ts` passed.
- `backend/service/clinical-emr-service`: `npm run build` passed.
- `backend/service/clinical-emr-service`: `npm test -- appointments -- --runInBand` passed with 88 tests passed and 6 opt-in PostgreSQL tests skipped.

Verification recorded for the trusted creator projection batch:

- RED Clinical specs first failed because create routes did not accept a trusted actor role and service creation treated a non-patient actor as an unrestricted creator.
- `backend/service/clinical-emr-service`: `npm test -- appointments.controller.spec.ts appointments.service.spec.ts -- --runInBand` passed.
- `backend/service/clinical-emr-service`: `npx eslint src/appointments/appointments.controller.ts src/appointments/appointments.controller.spec.ts src/appointments/appointments.service.ts src/appointments/appointments.service.spec.ts` passed.
- `backend/service/clinical-emr-service`: `npm run build` passed.
- `backend/service/clinical-emr-service`: `npm test -- appointments -- --runInBand` passed with 91 tests passed and 6 opt-in PostgreSQL tests skipped.

Verification recorded for the appointment patient foreign-key migration batch:

- RED migration spec first failed because `1730000000003-AppointmentPatientForeignKey` did not exist.
- `backend/service/clinical-emr-service`: `npm test -- 1730000000003-AppointmentPatientForeignKey.spec.ts clinic-data-source.spec.ts -- --runInBand` passed.
- `backend/service/clinical-emr-service`: `npm test -- clinic-migrations clinic-data-source.spec.ts -- --runInBand` passed.
- `backend/service/clinical-emr-service`: `npx eslint src/database/clinic-data-source.ts src/database/clinic-data-source.spec.ts src/database/clinic-migrations/1730000000003-AppointmentPatientForeignKey.ts src/database/clinic-migrations/1730000000003-AppointmentPatientForeignKey.spec.ts` passed.
- `backend/service/clinical-emr-service`: `npm run build` passed.

Verification recorded for the trusted role normalization batch:

- RED Clinical spec first failed because lowercase `receptionist` was treated as an untrusted role for appointment reads.
- `backend/service/clinical-emr-service`: `npm test -- appointments.controller.spec.ts appointments.service.spec.ts -- --runInBand` passed.
- `backend/service/clinical-emr-service`: `npx eslint src/appointments/appointments.service.ts src/appointments/appointments.service.spec.ts` passed.
- `backend/service/clinical-emr-service`: `npm run build` passed.
- `backend/service/clinical-emr-service`: `npm test -- appointments -- --runInBand` passed with 93 tests passed and 6 opt-in PostgreSQL tests skipped.

Verification recorded for the AI service pagination batch:

- RED Booking LangGraph spec first failed because service hint resolution requested only the first `/api/v1/services` page and missed a matching service on page 2.
- `ai/booking_langgraph_service`: `.venv\Scripts\python.exe -m pytest tests/test_real_payloads.py::test_find_booking_options_resolves_service_hint_across_service_pages -q` passed.
- `ai/booking_langgraph_service`: `.venv\Scripts\python.exe -m pytest tests/test_real_payloads.py tests/test_http_domain_tools.py -q` passed with 21 tests.
- `ai/booking_langgraph_service`: `.venv\Scripts\python.exe -m compileall -q src` passed.

Verification recorded for the booking chat transcript scoping batch:

- RED frontend spec first failed because `FloatingBookingChat` restored another user's transcript from the legacy global `smile-booking-chat-conversations` localStorage key.
- `frontend/web`: `npm test -- FloatingBookingChat.test.tsx BookingChatControls.test.tsx` passed with 4 tests.
- `frontend/web`: `npx eslint src/features/booking-chat/components/FloatingBookingChat.tsx src/features/booking-chat/components/FloatingBookingChat.test.tsx` passed.
- `frontend/web`: `npm run type-check` passed.
- `frontend/web`: `npm run build` passed; remaining warnings are pre-existing repo-wide import-order, unused-variable, and `<img>` warnings outside this batch.

Verification recorded for the booking availability UX/runtime hardening batch:

- RED checks first failed because Clinical availability hid booked candidates, AI availability lookup omitted the trusted actor header, the conversation reducer dropped constraint-only follow-ups, and parser fallback missed common "free slot", "next two days", and "dental exam" phrasing.
- `backend/service/clinical-emr-service`: `npm test -- appointment-availability.service.spec.ts` passed.
- `backend/service/clinical-emr-service`: `npm run build` passed.
- `ai/booking_langgraph_service`: `.venv\Scripts\python.exe -m pytest ai\booking_langgraph_service\tests\test_extractor.py ai\booking_langgraph_service\tests\test_conversation_state.py ai\booking_langgraph_service\tests\test_real_payloads.py ai\booking_langgraph_service\tests\test_graph_core_flows.py ai\booking_langgraph_service\tests\test_http_domain_tools.py -q` passed with 75 tests.
- `frontend/web`: `npm test -- BookingChatControls.test.tsx` passed.
- `frontend/web`: `npm run type-check` passed.
- Local Docker smoke on `POST http://localhost:8030/chat` with `x-auth-user-id=550e8400-e29b-41d4-a716-446655440004` returned 44 booking options for "next 2 day + oral check" and 20 filtered options for "between 12pm -> 4pm any doctor"; doctor UUIDs no longer render in the slot label.

## GitNexus Pass

- `npx gitnexus analyze --force .` completed on `2026-06-23` for the current Windows checkout: 56,386 nodes, 68,521 edges, 517 clusters, and 300 flows.
- `npx gitnexus status` still reports the index as stale in the sandbox because the CLI cannot resolve the current commit there, even after a successful analyze. Treat `detect-changes` output and source inspection as the stronger evidence for this pass.
- `npx gitnexus detect-changes --scope unstaged` reports 32 changed files, 216 changed symbols, 66 affected execution flows, and **critical** risk for the current dirty branch. This confirms the existing working tree is broad enough that cleanup should be sequenced carefully. In the sandbox this command can fail with `spawnSync git EPERM`; it succeeded when rerun with explicit GitNexus permission.
- GitNexus `query` still reported missing FTS indexes even after force analysis, so symbol-level `context`, `impact`, and `detect-changes` were used as the reliable GitNexus evidence source for this pass.

## Current Booking Flow Map

- Frontend entry: `frontend/web/src/app/provider/Providers.tsx` mounts `FloatingBookingChat`, which calls `sendBookingChatMessage` in `frontend/web/src/features/booking-chat/api.ts`.
- Chat request contract: `BookingChatRequest` / `ChatRequest` only carries `session_id`, `message`, `selected_booking_option_id`, `confirmation_token`, and `confirmed`.
- AI service entry: `ai/booking_langgraph_service/src/main.py::chat` passes the request plus `x-patient-id` into `BookingLangGraph.handle_chat`.
- Scheduling adapter: `HttpDomainTools.find_booking_options` resolves service hints through paginated `/api/v1/services`, then consumes `/api/v1/appointments/availability` opaque option tokens from Clinical EMR.
- Booking commit: `HttpDomainTools.commit_booking` calls `POST /api/v1/appointments/book-option` with the selected option token and patient booking details.
- Reschedule commit: `HttpDomainTools.commit_reschedule` calls `PATCH /api/v1/appointments/{id}/reschedule-option` with the selected option token.
- Clinical create path: `AppointmentsController.createByDoctor` calls `AppointmentsService.createByDoctor`, which maps into `AppointmentsService.create`.
- Clinical create DTO supports more fields than the chat flow currently asks for: `doctor_id`, `patient_id`, `clinic_id`, optional `room_id`, optional `service_id`, `appointment_date`, `appointment_time`, optional `duration_minutes`, optional `appointment_type`, optional `chief_complaint`, optional `notes`, and `created_by`.
- GitNexus context shows `AppointmentsService.create` runs KYC eligibility, appointment-code generation, and exclusion-violation handling; `AppointmentsService.update` is much thinner and does not show the same validation path in symbol context.

## Gateway And Reschedule Flow Notes

- `ProxyMiddlewareFactory.createMiddleware` only extracts and enforces JWT identity for `route.serviceName === 'booking-langgraph-service'`.
- `extractTrustedPatientIdFromAuthorization` reads `accountId` from the JWT but writes it into an `x-patient-id` header. The booking LangGraph service then treats that value as the `patient_id` sent to Clinical EMR.
- Gateway route config proxies `/api/v1/appointments`, `/api/v1/doctor-schedules`, `/api/v1/services`, `/api/v1/treatment-rooms`, and related Clinical routes without adding trusted identity headers or enforcing authentication in this middleware.
- `AppointmentsController` exposes appointment create/list/detail/update/status/cancel/check-in/patient/doctor routes without a controller guard in the inspected source.
- `UpdateAppointmentDto` already supports `room_id`, `service_id`, `appointment_date`, `appointment_time`, `appointment_type`, `duration_minutes`, `chief_complaint`, `notes`, and payment fields.
- `AppointmentsService.update` currently loads by ID, assigns the DTO, converts date if provided, and saves. It does not run the same schedule/domain validation path as `createByDoctor`/`create`.
- Clinical `patients.patient_id` and `patients.user_id` are separate columns. `KycEligibilityClient.assertCanBook` expects an IAM user/account id, while `appointments.patient_id` is meant to identify the Clinical patient record.
- GitNexus impact for `AppointmentsService.update` and `cancel` only found the controller as a direct caller, but this is an API boundary, so route-level callers from frontend/AI/gateway still need integration tests.
- GitNexus impact for `AppointmentsService.create` returned a read-only traversal error during one run, so create blast radius should be inferred from context/source instead of the reported low impact.

## Frontend Appointment Flow Notes

- GitNexus context shows `useAppointment` is consumed by appointment detail, edit, payment, and new appointment pages.
- `frontend/web/src/features/appointment/api/appointment.api.ts` defaults to `API_ENDPOINTS.APPOINTMENT.*`, but those endpoints default to `http://localhost:8083/api/appointment`.
- Gateway/Clinical routes inspected in this repo expose `/api/v1/appointments`, including `POST /by-doctor`, `POST /by-specialty`, `POST /outside-hours`, and `PATCH /:id`.
- Frontend API uses `PUT` for update and `POST` for cancel/confirm, while Clinical controller exposes `PATCH` for update, cancel, and confirm.
- `NewAppointmentPage` imports `BookingType`, `BOOKING_TYPE`, and create mutations that are not exported by the inspected constants/hook.
- `CreateAppointmentForm` asks users to enter clinic/doctor/specialty/service IDs manually and uses static `TIME_SLOTS`, including times outside the agreed clinic windows.
- `CreateAppointmentForm` submits camelCase fields such as `appointmentDate` and `appointmentTime`; Clinical appointment DTOs expect snake_case fields such as `appointment_date`, `appointment_time`, `patient_id`, and `created_by`.
- Frontend appointment status constants use uppercase values like `SCHEDULED` and `CANCELLED`, while Clinical status values are lowercase strings such as `scheduled`, `cancelled`, and `no_show`.
- This means the normal appointment page is not currently a reliable production reference for chatbot behavior; both need to converge on the same server-driven appointment contract.

## Data Model Scheduling Notes

- GitNexus context confirms the core columns exist: `AppointmentEntity` has `doctor_id`, `room_id`, `service_id`, `appointment_date`, `appointment_time`, and `duration_minutes`.
- `ServiceEntity` has `duration_minutes`, so the service can be the source of truth for appointment length instead of AI/frontend defaults.
- `DoctorScheduleEntity` has `room_id` and `max_patients`; `TreatmentRoomEntity` has `capacity`; `WorkShiftEntity` has `start_time` and `end_time`.
- `AppointmentEntity` models `patient_id` and `doctor_id` as plain UUID columns without ORM relations, and the clinic migration does not add foreign keys for those two fields.
- `CreateAppointmentDto` describes `patient_id` and `doctor_id` as UUIDs from user-service, while the Clinical schema has its own `patients.patient_id` and `patients.user_id` split. This documentation reinforces the identity ambiguity noted in C11.
- Clinic seed now creates services with different `duration_minutes`, work shifts for `09:00-12:00` and `13:30-17:30`, and demo doctor schedules for two IAM doctor account IDs on `2026-06-24`.
- Clinic seed does not seed Clinical `patients`, `doctor_specialties`, room `capacity`, or service availability for every seeded service/clinic. It only links `ORAL-CHECK` to the HCM clinic.
- Clinic `operating_hours` seed still says `08:00-20:00` on weekdays, while work shifts and the AI adapter use `09:00-12:00` and `13:30-17:30`.
- The current double-booking migration creates a generated `during` range from appointment start to `start + duration_minutes` only.
- The current exclusion constraint protects only `doctor_id` plus overlapping `during`, and ignores room, patient, grace period, doctor break, room capacity, and schedule `max_patients`.
- Search found no implemented scheduling grace/break configuration. The agreed 15-minute patient-arrival grace and 10-minute doctor break need to become explicit domain policy, not prompt/UI convention.
- `createByDoctor` checks that the doctor has any schedule at the clinic on the requested date, but does not verify the requested time falls inside that schedule or that the requested room matches the scheduled room.

## AI Conversation Flow Notes

- GitNexus context shows `BookingLangGraph` is a large orchestration class covering routing, lookup, booking, cancel, reschedule, confirmation, fallback, outcome derivation, policy intent, metrics, and conversation persistence.
- `OpenAICommandExtractor` contains the semantic routing prompt and direct-response policy. It classifies abuse/social turns and can return a patient-facing `direct_response`.
- `BookingLangGraph.handle_chat` prefers a validated extractor `direct_response`, otherwise calls `GroundedResponseGenerator`, otherwise uses deterministic `fallback_reply`.
- `GroundedResponseGenerator` has another policy prompt plus validation rules, including a hardcoded denylist of repetitive capability-list phrases.
- `fallback_reply` contains fixed responses for conversational, abuse, identity, confirmation, conflicts, and backend failures.
- `graph.py` still assigns node-level `state["reply"]` strings such as "Please provide the appointment code" and "Please confirm moving appointment..." before final response generation overwrites the final reply in `handle_chat`.
- `graph.py` still hardcodes clarification requirements such as "the appointment code" and "the appointment code and preferred new date or time", which conflicts with the desired no-system-ID user experience.
- Tests currently assert exact wording for some conversational/abuse/unknown replies, so changing the bot to sound more natural will require updating behavior tests to assert policy properties instead of brittle full strings.
- Benchmark datasets and older Superpowers specs still include many `APT-001` / appointment-code-driven cancel and reschedule scenarios. These are useful safety coverage, but they also encode the old user-facing reference model unless refreshed into appointment-card/opaque-reference scenarios.
- `graph.py` and `settings.py` import the new response layer from `outcomes.py` and `response_generator.py`, but those two runtime modules are currently untracked in Git.

## Booking Chat UI Flow Notes

- GitNexus context shows `FloatingBookingChat` owns history, resizing, message rendering, wizard state, card rendering, slot selection, confirmation, cancel, and reschedule handlers in one component.
- `frontend/web/src/app/provider/Providers.tsx` now mounts `FloatingBookingChat` globally, and `/chat` has been reduced to an informational page pointing users to the floating bubble.
- The only current `FloatingBookingChat.tsx` file is under `frontend/web/src/features/booking-chat/components/`, which is currently untracked in Git. A clean checkout of only tracked files would not include the globally mounted chat component.
- `AssistantDataCard` renders both booking slot cards and appointment cards from `safeState`.
- Chat conversation history is stored in browser `localStorage` under one global key, `smile-booking-chat-conversations`, without patient/user scoping.
- Slot selection sends a hidden prompt-like message plus `selected_booking_option_id`; the visible user text is different from what the AI receives.
- Appointment cancel/reschedule buttons build messages from `appointmentIdOf`, which currently prefers `appointment_code` and falls back to raw IDs.
- The wizard path is separate from inline cards, disables the chat input while open, and still asks for an appointment code manually.
- `sendToAgent` auto-opens the wizard only for some clarification responses from typed input. Card/button actions follow a different path, which makes the UX inconsistent across the same business flow.

## Runtime Wiring Notes

- GitNexus context shows booking runtime config is centralized in `ai/booking_langgraph_service/src/settings.py`, while frontend URL routing is centralized in `frontend/web/src/shared/api/endpoint.ts`.
- `docker-compose.yml` has IAM, Clinical EMR, and Gateway service definitions commented out, but the `booking-langgraph-service` profile still points to Docker DNS names such as `clinical-emr-service:8082` and `iam-service:3001`.
- `docker-compose.swagger.yaml` runs Clinical EMR on internal/container port `3004` and configures Gateway `CLINICAL_EMR_SERVICE_URL=http://clinical-emr-service:3004`.
- `backend/service/gateway-service/docker-compose.yaml` configures Gateway to call `clinical-emr-service:8082`.
- The frontend endpoint defaults still include several direct service URLs, including the incompatible appointment base noted in C9, while `AI.BOOKING_CHAT` routes through the gateway-style base.
- `.env.docker` tracks high-level ports and local secrets but does not define a single canonical service URL matrix for frontend, gateway, booking LangGraph, IAM, and Clinical EMR.

## Critical Issues

### C1. Appointment APIs trust caller-supplied identity and are exposed without authorization

- **Where:** `backend/service/gateway-service/src/proxy/proxy.middleware.ts`, `backend/service/gateway-service/src/config/services.config.ts`, and `backend/service/clinical-emr-service/src/appointments/appointments.controller.ts`.
- **Why it matters:** The gateway validates JWTs only for `booking-langgraph-service`. Clinical routes, including appointment create, update, status, cancel, patient lookup, and doctor lookup, are proxied without authentication enforcement. The controller has no guard and accepts `patient_id`, `created_by`, `cancelled_by`, `changed_by`, and resource IDs from the request. A caller can potentially read or mutate another patient's appointment by changing URL/body identifiers.
- **Recommendation:** Add gateway/service authentication consistently, derive actor and patient identity from verified claims, enforce role and ownership in Clinical EMR, and stop accepting security-sensitive actor identity as authoritative body data. Add authorization tests for patient, doctor, receptionist, and admin boundaries.
- **Timing:** **Fix before extending booking.** This is cross-cutting and requires a focused security task, not an incidental UI cleanup.

### C2. Availability is calculated in the AI adapter with a hardcoded 30-minute appointment model

- **Where:** `ai/booking_langgraph_service/src/http_tools.py` (`BUSINESS_WINDOWS`, `_free_times`, `find_booking_options`).
- **Why it matters:** Candidate slots always occupy 30 minutes, and displayed duration is taken from schedule payload/default 30 rather than the selected service. Long services can be offered in gaps that are too short. Business hours are duplicated in AI code, so schedule policy can drift from Clinical EMR.
- **Recommendation:** Move availability calculation into a dedicated Clinical EMR domain service/API. Resolve `service.duration_minutes` first, generate 15-minute candidate starts, and validate the complete occupied interval against the actual doctor shift and clinic resources. AI should consume opaque availability options, not implement scheduling rules.
- **Timing:** **Fix now as the first booking-domain task.** Do not patch `_free_times` further as a long-term solution.

### C3. Database conflict protection covers only doctor time and ignores operational buffers/resources

- **Where:** `backend/service/clinical-emr-service/src/database/clinic-migrations/1730000000000-AppointmentNoDoubleBooking.ts` and appointment create/update paths.
- **Why it matters:** The generated range includes only `duration_minutes`; it excludes the agreed 15-minute arrival grace and 10-minute doctor break. The exclusion constraint protects only `doctor_id`, not `room_id` or overlapping appointments for the same patient. Availability and commit behavior can therefore disagree, and rooms/patients can be double-booked.
- **Recommendation:** Store explicit grace/break values, generate one canonical occupied range, add database-backed doctor/room/patient overlap protection, and revalidate availability inside the booking/reschedule transaction. Map each constraint violation to a stable conflict code so chat/UI can refresh choices.
- **Timing:** **Fix together with C2.** Requires a migration and concurrency tests; it should not be applied as an unreviewed cleanup.

### C4. The normal appointment frontend and backend use incompatible mutation contracts

- **Where:** `frontend/web/src/features/appointment/api/appointment.api.ts` versus `backend/service/clinical-emr-service/src/appointments/appointments.controller.ts`.
- **Why it matters:** Frontend update uses `PUT` while the backend exposes `PATCH`; frontend cancel uses `POST` while the backend exposes `PATCH`. This makes the non-chat appointment edit/cancel flow fragile or non-functional and means chat parity cannot be judged against a reliable reference flow.
- **Recommendation:** Define shared request contracts (or generated API types), align verbs and DTO field names, and add route-level integration tests covering create, edit, cancel, and reschedule through the gateway.
- **Timing:** **Safe to fix now** as a narrow contract task, after adding failing integration tests.

### C5. Frontend does not type-check; the appointment creation reference flow is incomplete

- **Where:** `frontend/web/src/app/(pages)/appointments/**`, `frontend/web/src/features/appointment/**`, plus service/specialty and profile pages.
- **Why it matters:** A fresh `npm run type-check` reports 83 TypeScript errors: 53 appointment-related, 25 service/specialty-related, and 5 profile/KYC-related. The new appointment page imports `BookingType`/`BOOKING_TYPE` and create mutations that do not exist. Detail/edit/payment pages also confuse Axios responses with application payloads. These are compile-time contract failures, not cosmetic warnings.
- **Recommendation:** Restore a single typed API boundary that unwraps Axios consistently, implement or remove incomplete appointment create hooks, align frontend request DTOs with Clinical EMR, and make `type-check` a required CI gate. Fix profile/service errors in separate scoped tasks rather than weakening TypeScript.
- **Timing:** **Fix now before using the regular appointment UI as the specification for chatbot parity.** Split by feature to keep reviewable changes.

### C6. Local environment secrets are tracked in the repository

- **Where:** `.env.docker` and its Git history.
- **Why it matters:** The tracked local Docker env contains non-empty JWT/refresh/admin password values. Even if they are demo defaults, committed JWT secrets become unsafe once reused by any developer, Docker compose stack, or demo deployment because tokens can be forged from repository history.
- **Recommendation:** Move `.env.docker` to a redacted `.env.docker.example`, ignore real local env files, rotate local/demo JWT and refresh secrets, and document required variables without publishing usable secret material.
- **Timing:** **Safe to start now** by adding templates and ignore rules. Rotation and compose updates should be coordinated with whoever runs the local demo stack.

### C7. Chat booking is thinner than the real appointment contract

- **Where:** `frontend/web/src/features/booking-chat/types.ts`, `ai/booking_langgraph_service/src/schemas.py`, `ai/booking_langgraph_service/src/http_tools.py`, and Clinical `BookByDoctorDto`.
- **Why it matters:** The chat flow can select/confirm a prepared slot, but it does not explicitly collect or confirm the full appointment fields supported by the normal booking API: service, duration, room, appointment type, chief complaint, notes, and actor identity. `_book_by_doctor_payload` auto-fills a subset and `_reschedule_payload` omits `room_id`, `service_id`, and `duration_minutes`, so booking/reschedule parity is incomplete.
- **Recommendation:** Introduce a server-driven booking draft that tracks selected service, date, doctor/room, calculated duration, patient-supplied complaint/notes, and final confirmation. The UI should send structured selections as draft updates, not raw IDs or only slot IDs. Reschedule should preserve or intentionally replace service/room/duration through the same domain availability contract.
- **Timing:** **Fix with C2/C3 and M1/M3.** It should be part of the production booking redesign, not a prompt-only patch.

### C8. Reschedule update bypasses create-time scheduling validation

- **Where:** `backend/service/clinical-emr-service/src/appointments/appointments.service.ts` (`update`) and `ai/booking_langgraph_service/src/http_tools.py` (`_reschedule_payload`).
- **Why it matters:** `UpdateAppointmentDto` can change the exact fields that define availability, but `AppointmentsService.update` does not verify doctor schedule, service duration, room availability, patient overlap, or operational buffers before saving. The AI reschedule payload also sends only date/time/doctor/clinic/updated_by, so it can drop or fail to intentionally preserve room/service/duration semantics.
- **Recommendation:** Create a shared appointment scheduling validator used by create and reschedule. Reschedule should resolve a complete availability option, preserve existing service/room/duration unless the user changes them, and commit through one transactional path with the same conflict mapping as booking.
- **Timing:** **Fix with C2/C3/C7.** This should not wait for UI polish because it affects data correctness.

### C9. Frontend appointment endpoints target an old/incompatible appointment API

- **Where:** `frontend/web/src/shared/api/endpoint.ts`, `frontend/web/src/features/appointment/api/appointment.api.ts`, and `frontend/web/src/features/appointment/hooks/useAppointment.ts`.
- **Why it matters:** The frontend default appointment base is `http://localhost:8083/api/appointment` with paths like `/doctor` and `/clinic`, while the gateway/Clinical service uses `/api/v1/appointments/by-doctor`, `/by-specialty`, `/outside-hours`, and `PATCH` mutations. This creates route-level failures independent of chatbot logic and explains why the normal appointment page cannot be used as the business-rule baseline yet.
- **Recommendation:** Point appointment frontend APIs at the gateway Clinical appointment contract, rename/create hooks to match backend use cases, align HTTP verbs, and add route smoke tests through the gateway.
- **Timing:** **Fix before or alongside C5/M12.** It is a prerequisite for using the normal appointment page as the parity target for chat.

### C10. Scheduling policy is not represented as one canonical occupied interval

- **Where:** `backend/service/clinical-emr-service/src/appointments/entities/appointment.entity.ts`, `backend/service/clinical-emr-service/src/services/entities/service.entity.ts`, `backend/service/clinical-emr-service/src/doctor-schedules/entities/doctor-schedule.entity.ts`, `backend/service/clinical-emr-service/src/database/clinic-migrations/1730000000000-AppointmentNoDoubleBooking.ts`.
- **Why it matters:** The schema has enough raw fields to support correct scheduling, but the persisted conflict range only covers appointment duration. It does not encode service-derived duration, arrival grace, doctor break, room/patient conflicts, or schedule/room capacity. Availability, reschedule, and database commit can therefore disagree.
- **Recommendation:** Define a single scheduling policy object in Clinical EMR: service duration source, candidate start granularity, business windows, arrival grace, cleanup/break, room capacity semantics, and patient overlap rule. Persist/generated occupied ranges should use that policy, and availability should use the same validator before returning options.
- **Timing:** **Fix with C2/C3/C8.** This is the core backend prerequisite for production-ready booking.

### C11. Booking identity mapping conflates IAM accounts with Clinical patients

- **Where:** `backend/service/gateway-service/src/proxy/proxy.middleware.ts`, `ai/booking_langgraph_service/src/main.py`, `ai/booking_langgraph_service/src/http_tools.py`, `backend/service/clinical-emr-service/src/patients/entities/patient.entity.ts`, and `backend/service/clinical-emr-service/src/appointments/kyc-eligibility.client.ts`.
- **Why it matters:** Gateway extracts JWT `accountId` and forwards it as `x-patient-id`. Booking LangGraph then sends that value as `appointments.patient_id` and `created_by`. Clinical EMR has separate concepts: `patients.patient_id` identifies the patient record, while `patients.user_id` links to the IAM user/account, and the KYC check expects the IAM user id. This can save appointments under an account id instead of the Clinical patient id, break patient appointment lookup, and make ownership checks ambiguous.
- **Recommendation:** Rename the gateway header to the identity it actually carries, for example `x-auth-user-id`, then resolve the Clinical patient record server-side by `patients.user_id` before booking/listing/canceling/rescheduling. Store both actor user id and patient id explicitly where needed, and add tests proving a signed-in account can only operate on its own Clinical patient record.
- **Timing:** **Fix with C1 before booking productionization.** It is a correctness and authorization boundary issue, not UI cleanup.

### C12. Appointment rows can reference non-existent patients and doctors

- **Where:** `backend/service/clinical-emr-service/src/appointments/entities/appointment.entity.ts`, `backend/service/clinical-emr-service/src/database/clinic-migrations/1700000000000-CreateClinicServiceTables.ts`, and appointment DTOs.
- **Why it matters:** `appointments.patient_id` and `appointments.doctor_id` are UUID columns with no database foreign key in the inspected clinic migration. `clinic_id`, `room_id`, and `service_id` do have foreign keys, so this is inconsistent. Combined with C11, the system can persist appointments against an IAM account id or any random UUID and still pass database constraints, leaving lookup, ownership checks, reports, and downstream EMR records inconsistent.
- **Recommendation:** Decide the authoritative doctor and patient source for Clinical EMR, then add validated relations or explicit lookup checks before mutation. If doctors live in IAM/user-service, Clinical needs a stable local provider/doctor projection table or a verified service-to-service lookup. Add migration/tests that reject missing patients/doctors before booking.
- **Timing:** **Fix with C1/C11.** Do not add scheduling features on top of appointment rows that can point at no real patient or doctor.

### C13. Frontend appointment create/edit models do not match Clinical DTOs or statuses

- **Where:** `frontend/web/src/features/appointment/types/appointment.type.ts`, `frontend/web/src/features/appointment/constants/appointment.constant.ts`, `frontend/web/src/features/appointment/components/CreateAppointmentForm.tsx`, `frontend/web/src/app/(pages)/appointments/new/page.tsx`, and Clinical appointment DTOs/enums.
- **Why it matters:** The frontend normal booking form submits camelCase fields (`appointmentDate`, `appointmentTime`, `clinicId`, `doctorId`) and never injects required Clinical fields like `patient_id` and `created_by`. The frontend status enum is uppercase (`SCHEDULED`, `CANCELLED`, `NO_SHOW`) while Clinical stores lowercase statuses (`scheduled`, `cancelled`, `no_show`). Even after endpoint verbs are fixed, the page can send an invalid body, render wrong colors/actions, and fail cancel/edit decisions.
- **Recommendation:** Introduce explicit frontend DTO mappers at the API boundary: UI form model -> Clinical request DTO and Clinical response DTO -> UI view model. Use backend status literals or generated/shared types. Do not let components consume raw Axios responses or raw Clinical snake_case payloads directly.
- **Timing:** **Fix with C5/C9/M12.** This is part of restoring the appointment page as the source of truth for chat parity.

## Medium Cleanup Items

### M1. Guided booking UI duplicates the chat state machine and still asks for appointment codes

- **Where:** `frontend/web/src/features/booking-chat/components/FloatingBookingChat.tsx` (`wizardOpen`, `WizardState.appointmentCode`, modal-like wizard markup).
- **Why it matters:** The component maintains a second flow beside LangGraph, disables normal chat while open, and requires a system-facing appointment code for cancel/reschedule. Card actions already provide an opaque internal reference, so the wizard is conflicting dead-end behavior.
- **Recommendation:** Remove the modal/wizard path. Render sequential inline chat controls for appointment, service, date, doctor, slot, details, and confirmation. Keep IDs in structured request fields only and display human-readable labels/codes.
- **Timing:** **Safe to fix after C2/C3 define the availability contract.** Removing it before the replacement contract exists would regress guided booking.

### M2. Booking option state is process-local, unbounded, and not scoped to patient/session

- **Where:** `ai/booking_langgraph_service/src/http_tools.py` (`self._booking_options`).
- **Why it matters:** Prepared options disappear on restart, do not work safely with multiple workers, accumulate without expiry, and are keyed only by `schedule_id:time`. A confirmation can depend on which process handled the prior request.
- **Recommendation:** Return a signed/opaque option token containing a versioned availability snapshot, or persist prepared options in Redis with patient/session ownership and TTL. Always revalidate at commit.
- **Timing:** **Fix with the new availability API**, not independently.

### M3. Schedule and service discovery silently truncates to default pagination

- **Where:** Clinical `ServicesService` and `DoctorSchedulesService` default to 10 items; `HttpDomainTools` does not request/iterate all pages.
- **Why it matters:** A clinic with more than ten services, doctors, or schedules can silently omit valid choices. This directly causes the oversized-list versus missing-results UX problem to be solved inconsistently.
- **Recommendation:** Add purpose-built paginated discovery/availability endpoints with explicit cursor/page metadata. UI should search/page services and doctors instead of loading everything.
- **Timing:** **Fix as part of the sequential booking flow.** Avoid merely increasing the limit.

### M4. The booking chat component is a monolith with multiple responsibilities

- **Where:** `frontend/web/src/features/booking-chat/components/FloatingBookingChat.tsx` (currently 769 lines).
- **Why it matters:** Conversation persistence, resize behavior, dialogue policy, wizard state, message formatting, structured appointment/slot rendering, network mutations, and confirmation handling share one component. The duplicated control paths make state invalidation and UI regression difficult to reason about.
- **Recommendation:** After removing the modal flow, extract focused pure components and reducers: conversation state, inline step controls, appointment cards, availability picker, and confirmation panel. Keep API orchestration in one hook and unit-test pure transitions.
- **Timing:** **Safe during the inline-flow replacement**, but avoid a standalone rewrite before behavior tests exist.

### M5. Frontend appointment time constants contradict clinic business hours

- **Where:** `frontend/web/src/features/appointment/constants/appointment.constant.ts`.
- **Why it matters:** The hardcoded list includes `08:00`, `08:30`, and `13:00`, while clinic shifts are `09:00-12:00` and `13:30-17:30`. It also assumes 30-minute starts and ignores service duration. This is another source of scheduling-policy drift.
- **Recommendation:** Delete static `TIME_SLOTS` from booking forms and render only server-calculated availability.
- **Timing:** **Fix with C2/C5.** Do not replace it with another frontend constant.

### M6. Package manager lockfiles are inconsistent across services

- **Where:** `backend/service/gateway-service` has `bun.lock`, `package-lock.json`, and `yarn.lock`; IAM and frontend mix Bun and npm lockfiles; CI uses different install commands per service.
- **Why it matters:** Dependency resolution can differ between Docker, CI, and local machines. This makes build failures hard to reproduce and can hide transitive dependency/security changes.
- **Recommendation:** Pick one package manager per service, update CI/Docker to match, and remove stale lockfiles after confirming the standard. Use deterministic install commands (`npm ci` for npm projects).
- **Timing:** **Safe after confirming the intended package manager.** Gateway cleanup is likely low risk but should still be build-verified.

### M7. CI misses important services and quality gates

- **Where:** `.github/workflows/ci.yml` and `.github/workflows/cd.yml`.
- **Why it matters:** CI currently covers IAM, Clinical EMR, and frontend lint/build/tests, but does not run Gateway tests/build, booking LangGraph pytest, KYC OCR checks, or an explicit frontend type-check gate. The auth proxy and chatbot can regress without a red build.
- **Recommendation:** Add Gateway test/build, `ai/booking_langgraph_service` pytest, explicit `frontend/web npm run type-check`, and deterministic installs. Add KYC OCR checks only with redacted local fixtures or mocked smoke tests.
- **Timing:** **Safe as a CI hardening task**, but expect current frontend type-check to fail until C5 is fixed.

### M8. Legacy booking agent service remains beside the active LangGraph service

- **Where:** `ai/booking_agent_service`.
- **Why it matters:** The old service contains a large `graph.py` and extensive tests while current compose/gateway flow targets `booking_langgraph_service`. Keeping two booking agents with overlapping concepts increases confusion over which prompts, schemas, and tests are authoritative.
- **Recommendation:** Confirm whether this is still used for benchmarks or historical comparison. If not, archive it under docs or remove it from active source paths and CI expectations.
- **Timing:** **Wait for owner confirmation.** Do not delete until the benchmark/history requirement is clear.

### M9. Frontend booking and appointment flows have no focused UI test harness

- **Where:** `frontend/web/package.json` and `frontend/web/src/features/booking-chat/**`.
- **Why it matters:** The chat flow now relies on manual browser checks even though it has stateful multi-turn behavior, structured cards, confirm/cancel actions, and appointment mutations. Small UI changes can reintroduce IDs, duplicate slot lists, or stale modal paths.
- **Recommendation:** Add a lightweight Vitest/React Testing Library setup or equivalent project-standard test harness for pure reducers/components first: appointment card rendering, slot selection, no-ID display, and confirmation transitions.
- **Timing:** **Best after C5 type-check cleanup**, so tests are not fighting broken TS contracts.

### M10. Scheduling has no real database/concurrency coverage

- **Where:** `backend/service/clinical-emr-service/src/appointments/*.spec.ts` and migration tests.
- **Why it matters:** Existing appointment tests are mostly service/controller unit tests with mocks. They do not prove the PostgreSQL exclusion constraint, room/patient conflict rules, buffer logic, or two-users-same-slot race behavior.
- **Recommendation:** Add integration tests against PostgreSQL/Testcontainers or a local Docker test database for doctor, room, patient, duration, grace, break, and concurrent booking scenarios.
- **Timing:** **Fix with C2/C3.** These tests should lock down the new availability and commit rules.

### M11. Notification and side-effect failures are swallowed or deferred

- **Where:** `backend/service/clinical-emr-service/src/doctor-schedules/doctor-schedules.service.ts` and appointment service TODOs.
- **Why it matters:** Schedule-change notifications can fail silently, and appointment create/cancel/update has TODOs for notification/payment side effects. In production, silent failures create support issues because the core DB mutation succeeds while the user or doctor never receives the update.
- **Recommendation:** Use a logged outbox/job pattern for notification/payment side effects, return stable status to the caller, and expose retry observability instead of `.catch(() => {})`.
- **Timing:** **Wait unless this flow is part of the selected production readiness task.** It needs a small architectural decision.

### M12. API response envelope handling is inconsistent in the frontend

- **Where:** `frontend/web/src/features/appointment/api/appointment.api.ts`, appointment pages, and related hooks.
- **Why it matters:** Some code treats Axios responses as domain objects; other code expects an `ApiResponse<T>` wrapper. This causes type errors today and will keep creating runtime shape bugs when chat and appointment pages share APIs.
- **Recommendation:** Standardize API helpers to unwrap one response shape at the feature boundary. Keep React components consuming domain DTOs only.
- **Timing:** **Safe with C5.** This is a prerequisite for reliable appointment UI parity.

### M13. Domain tool polymorphism hides production blast radius from tests and GitNexus impact

- **Where:** `ai/booking_langgraph_service/src/tools.py`, `ai/booking_langgraph_service/src/http_tools.py`, `ai/booking_langgraph_service/src/fault_tools.py`, and booking LangGraph tests.
- **Why it matters:** GitNexus finds many `find_booking_options` implementations and test subclasses. Context on `HttpDomainTools.find_booking_options` shows direct callers mostly in payload tests, while production use goes through the `DomainTools` interface and runtime injection. That makes `impact` look low even though the business risk is high.
- **Recommendation:** Keep the interface, but add contract tests that every `DomainTools` implementation must pass for booking options, commit booking, cancel, and reschedule. Prefer shared fixtures over many bespoke test subclasses when the behavior is not intentionally different.
- **Timing:** **Safe with booking-domain refactor.** Do not clean all test doubles before the new availability contract is defined.

### M14. GitNexus generated index is tracked and very noisy

- **Where:** `.gitnexus/lbug`, `.gitnexus/meta.json`, `AGENTS.md`, `CLAUDE.md`, and `.claude/skills/gitnexus/**`.
- **Why it matters:** Refreshing GitNexus updated a large binary graph file, expanded `meta.json` by tens of thousands of lines, and rewrote GitNexus instruction blocks in agent docs. This makes normal code review noisy and can accidentally mix generated index churn with real booking/auth changes.
- **Recommendation:** Decide whether `.gitnexus` should be committed as a shared artifact or regenerated locally. If local, ignore generated database files and keep only minimal setup docs. If committed, isolate index updates in dedicated commits and prevent `AGENTS.md`/`CLAUDE.md` instruction shrinkage from being accepted accidentally.
- **Timing:** **Safe as repository hygiene**, but handle separately from booking logic.

### M15. Conversational response policy is scattered and partly brittle

- **Where:** `ai/booking_langgraph_service/src/extractor.py`, `ai/booking_langgraph_service/src/graph.py`, `ai/booking_langgraph_service/src/outcomes.py`, `ai/booking_langgraph_service/src/response_generator.py`, and conversational tests in `ai/booking_langgraph_service/tests`.
- **Why it matters:** The assistant's naturalness depends on four separate policy layers: extractor prompt, graph outcome rules, response-generator prompt/validator, and deterministic fallback strings. `graph.py` still carries older node-level reply text even though final output is now generated from outcomes. Exact-string tests also lock in wording like slot and fallback prompts. This makes the bot feel hardcoded and makes improvements risky because a small phrase change can break tests or confuse debugging.
- **Recommendation:** Centralize response policy around outcome codes and safe facts. Keep deterministic fallbacks short and neutral, move repeated text into one response catalog, and update tests to assert intent, safety, and constraints rather than exact phrasing except for required compliance text. Remove user-facing appointment-code requirements once appointment cards/opaque refs are authoritative.
- **Timing:** **Safe after the booking contract is clarified.** Do not rewrite wording before C7/C8/C10 decide which fields the assistant should ask for.

### M16. Booking chat UI action contract mixes hidden prompts, visible text, and system identifiers

- **Where:** `frontend/web/src/features/booking-chat/components/FloatingBookingChat.tsx`.
- **Why it matters:** UI actions send prompt-like natural language to the AI while showing different text to the patient. Cancel/reschedule actions still depend on appointment codes or raw IDs, and the modal wizard asks for appointment codes manually. This is exactly the user-facing ID leakage and modal/card inconsistency observed in testing.
- **Recommendation:** Replace hidden prompt construction with explicit structured action payloads: `action`, `appointment_ref_token`, `booking_option_token`, and optional draft fields. Render human-readable labels only, keep IDs opaque inside payloads, and remove the wizard once inline cards can drive the same sequence.
- **Timing:** **Fix with M1/M4/M9 after C7/C8 define the backend draft/option token contract.**

### M17. Runtime URL wiring differs across compose files and frontend defaults

- **Where:** `docker-compose.yml`, `docker-compose.swagger.yaml`, `backend/service/gateway-service/docker-compose.yaml`, `.env.docker`, `frontend/web/src/shared/api/endpoint.ts`, and `ai/booking_langgraph_service/src/settings.py`.
- **Why it matters:** Different local run modes use different ports and service names for the same dependencies. One compose file points Clinical EMR at `3004`, another at `8082`, the root compose comments out services that booking LangGraph depends on, and the frontend still has direct service defaults. This causes "works in one terminal, fails in UI/Docker" behavior and makes API debugging noisy.
- **Recommendation:** Define one supported local runtime matrix: gateway port, IAM URL, Clinical URL, booking LangGraph URL, Redis URL, and frontend public URLs. Update compose files and frontend env defaults to route browser traffic through Gateway and service-to-service traffic through Docker DNS. Add a health/smoke script that verifies frontend -> gateway -> booking-chat -> Clinical.
- **Timing:** **Safe as runtime hygiene**, but do it before UI smoke testing or full booking implementation verification.

### M18. Booking chat transcripts persist globally in browser localStorage

- **Where:** `frontend/web/src/features/booking-chat/components/FloatingBookingChat.tsx` and `frontend/web/src/features/auth/store/authStore.ts`.
- **Why it matters:** The chat stores conversation history, safe-state appointment previews, and user-entered scheduling details under one global localStorage key. If a developer or demo machine switches accounts in the same browser, the next signed-in user can see the previous account's booking transcript. The auth store also persists tokens and user data in localStorage, so XSS blast radius is larger than it needs to be for a healthcare app.
- **Recommendation:** Scope booking transcripts by authenticated user id and clear them on logout/account switch. Prefer storing only short UI history client-side, not structured appointment payloads. For auth, consider httpOnly refresh-token cookies or a stronger token storage strategy as a separate security hardening task.
- **Timing:** **Safe after C1/C11 clarify identity ownership.** Transcript scoping is a narrow frontend fix; auth-token storage needs a broader auth decision.

### M19. Benchmark datasets and old specs encode the appointment-code UX

- **Where:** `ai/booking_langgraph_service/datasets/*.jsonl`, `ai/booking_langgraph_service/tests/test_benchmark_*.py`, `docs/superpowers/specs/2026-06-14-react-agentic-chatbot-design.md`, `docs/superpowers/specs/2026-06-21-langgraph-production-invariant-hardening-design.md`, and related Superpowers plans.
- **Why it matters:** Several scenarios still say "Cancel appointment APT-001" or "Move appointment APT-001", and some specs explicitly discuss appointment code/id as the known reference. That coverage is valuable for users who paste a code, but it no longer matches the desired primary UX where the assistant lists real upcoming appointments and users select a human-readable card without typing system identifiers.
- **Recommendation:** Split benchmark coverage into two groups: legacy direct-code input remains allowed and ownership-checked, while the primary production flow uses appointment-card references or opaque tokens. Mark superseded design docs as archived, or update the active spec to say appointment codes are display-only and optional.
- **Timing:** **Safe with M15/M16.** Do not delete these tests blindly; first replace their behavioral purpose with no-ID card-selection scenarios.

### M20. Idempotency keys are not scoped to route or actor

- **Where:** `backend/service/clinical-emr-service/src/appointments/idempotency.interceptor.ts` and `backend/service/clinical-emr-service/src/database/clinic-migrations/1730000000001-CreateIdempotencyKeys.ts`.
- **Why it matters:** The interceptor stores `method` and `path`, but lookup/replay is by `idempotency_key` alone. If two different mutating requests reuse the same key, the second request can receive the first response or be blocked as in-progress even when it targets a different appointment endpoint. For chat confirmations this is less likely because confirmation tokens are unique, but the appointment API exposes the interceptor to all mutating appointment routes.
- **Recommendation:** Scope idempotency uniqueness and replay checks by actor, method, and normalized path, or require a namespaced key format per mutation type. On replay, verify stored method/path/actor match the current request before returning the stored response.
- **Timing:** **Safe with C1/C11 or API contract cleanup.** It needs tests for cross-route same-key behavior.

### M21. Runtime modules for the new chat/response layer are still untracked

- **Where:** `frontend/web/src/app/provider/Providers.tsx`, `frontend/web/src/app/(pages)/chat/page.tsx`, `frontend/web/src/features/booking-chat/components/FloatingBookingChat.tsx`, `ai/booking_langgraph_service/src/graph.py`, `ai/booking_langgraph_service/src/settings.py`, `ai/booking_langgraph_service/src/outcomes.py`, and `ai/booking_langgraph_service/src/response_generator.py`.
- **Why it matters:** `Providers` imports and renders `FloatingBookingChat` globally, while `/chat` now only tells users to use the floating bubble. The component file that implements the actual chat is currently untracked. The AI graph also imports `outcomes.py` and `response_generator.py`, which are untracked runtime modules. A commit/deploy/review that misses these files can ship broken imports or silently drop the response layer that was being tested locally.
- **Recommendation:** Treat the floating chat and response generator as real feature boundaries: either track their runtime modules and tests with the rest of the booking-chat changes, or temporarily revert tracked imports to the last fully tracked implementation until the new layer is ready. Add this to the selected source task before any commit.
- **Timing:** **Safe as delivery hygiene**, but wait until the user selects the frontend/chat cleanup task if we are still in scan-only mode.

### M22. Demo clinic seed data does not cover the intended booking business flow

- **Where:** `backend/service/clinical-emr-service/src/database/seeds/relational/clinic/run-clinic-seed.ts`, IAM user seeds, and `ai/booking_langgraph_service/src/http_tools.py`.
- **Why it matters:** The seed creates specialties and services, but does not seed `doctor_specialties`, so `createBySpecialty` has no demo doctors to select. It creates doctor schedules using IAM account IDs as doctor IDs, but does not create Clinical patient records or doctor projections, which reinforces the identity/data-integrity problems in C11/C12. It seeds only one `clinic_services` row for `ORAL-CHECK`, leaves room `capacity` null, sets clinic `operating_hours` to `08:00-20:00`, and uses fixed schedules on `2026-06-24`. The chatbot may look usable for one hand-crafted Oral checking date while the broader appointment flow remains untested or misleading.
- **Recommendation:** Build a rolling local demo dataset that explicitly covers patient profile mapping, doctor profile mapping, doctor specialties, clinic-service availability, room capacity/equipment, service durations, and schedules across a short future window. Seed data should exercise booking by service/specialty/doctor and reschedule/cancel flows without relying on account IDs as patient IDs.
- **Timing:** **Safe with the scheduling/seed task**, after C11/C12 define identity ownership. It should not be treated as cosmetic seed polish because current demo data hides production contract gaps.

## Nice-to-Have Polish

### N1. Generated ML/runtime artifacts are not fully ignored

- **Where:** repository root `.gitignore`, untracked `runs/`, and root `*.pt` model files.
- **Why it matters:** Local OCR/training artifacts and model weights are large, noisy, and should not appear in source control status or accidental commits.
- **Recommendation:** Ignore `runs/` and root-level model weight patterns while keeping intentional small model manifests/checksums tracked separately.
- **Timing:** **Safe now.** Verify no intentionally tracked production model file depends on the new pattern.

### N2. Several UI pages and AI graph files are oversized

- **Where:** `frontend/web/src/app/(pages)/(user)/profile/page.tsx`, `frontend/web/src/app/(pages)/admin/page.tsx`, `ai/booking_langgraph_service/src/graph.py`, and legacy booking agent files.
- **Why it matters:** Large single files are harder to review and make targeted behavior changes risky. This is already visible in the booking chat component.
- **Recommendation:** Split only when touching the feature: extract pure components, typed helpers, and small state transitions. Avoid a broad refactor without behavioral tests.
- **Timing:** **Wait until a related feature task.**

### N3. Demo clinic seed data is date-fragile

- **Where:** `backend/service/clinical-emr-service/src/database/seeds/relational/clinic/run-clinic-seed.ts` and local seeded data.
- **Why it matters:** Demo availability depends on fixed sample dates. As the current date moves, UI demos and chatbot smoke tests become misleading unless data is reseeded carefully.
- **Recommendation:** Use rolling dates relative to the seed run date once M22's data coverage is fixed, and label all demo records clearly.
- **Timing:** **Safe with the booking test-data task**, not as a random seed rewrite.

### N4. Debug comments and console logging remain in UI paths

- **Where:** frontend pages with TODOs/`console.log`, including patient and auth/profile related pages.
- **Why it matters:** Low-level debug output is harmless locally but noisy in production and can accidentally expose identifiers.
- **Recommendation:** Remove console logs or route them through a redacted logger. Convert stale TODOs into backlog items or delete them.
- **Timing:** **Safe opportunistically** while touching those files.

### N5. Docker ignore rules should be reviewed per service

- **Where:** service `.dockerignore` files.
- **Why it matters:** Some ignore rules are broad enough to hide docs/tests/Dockerfile patterns. That can be fine for lean images, but it should be intentional per build context.
- **Recommendation:** Review each service Docker context after package-manager cleanup and CI build coverage are aligned.
- **Timing:** **Wait until CI/Docker hardening.**

## Selection Queue

1. **Next: C1 + C11 + C12 - Complete authorization tests and authoritative patient/doctor data integrity beyond the chat path.**
2. **Completed: C7 + C8 - Typed appointment drafts and canonical scheduling validation now cover booking confirmation and every scheduling update path.**
3. **Completed: M1 + M4 + M9 + M16 - Removed the booking wizard/system-ID UX, added tested inline structured actions, and extracted chat controls.**
4. **In progress: M3 - Finish searchable/paginated doctor and service discovery UI beyond the server-driven manual availability picker.**
5. **C6 - Finish tracked-secret removal and rotate local/demo credentials.**
6. **M18 - Decide broader auth-token storage hardening after user-scoped chat transcript storage.**
7. **M20 - Scope idempotency keys by actor, method, and normalized route.**
8. **M15 + M19 - Consolidate response policy and refresh benchmark/spec coverage away from required appointment codes.**
9. **M17 - Normalize the local runtime URL matrix across compose, frontend, Gateway, and AI.**
10. **M7 - Add missing Gateway, booking LangGraph, and frontend type-check CI gates.**
11. **M22 - Complete specialty/provider/service demo seed coverage.**
12. **M6 - Normalize package manager lockfiles.**
13. **M14 - Decide GitNexus index tracking policy and isolate generated artifacts.**
14. **M8 - Decide whether to archive/delete legacy `ai/booking_agent_service`.**
15. **N1 - Ignore generated ML runs and root model weights without hiding intentional production assets.**
16. **M11 + N2 + N4 + N5 - Side-effect observability and opportunistic maintainability polish.**
