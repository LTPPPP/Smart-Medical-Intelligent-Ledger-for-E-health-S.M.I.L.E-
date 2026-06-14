# React Agentic Chatbot Design

Date: 2026-06-14
Branch: `feat/ai/react-agentic-chatbot`
Base: `origin/dev`

## Goal

Build a new lightweight, safe, session-aware dental booking chatbot from the
current `dev` backend APIs instead of carrying forward the older multi-layer
booking orchestrator.

The first milestone focuses on:

- Booking by specialty or doctor.
- Looking up the current patient's appointments.
- Cancelling an appointment after explicit confirmation.
- Answering clinic, service, specialty, and schedule questions needed for those
  flows.

The design intentionally starts from a compact ReAct core and grows from there.
It should be agentic enough to plan, call tools, observe results, and continue a
conversation, but not so layered that routing, policy, planning, and state all
compete to make the same decision.

## Runtime Model

The first runtime uses the same LLM family as the previous booking work:
`Qwen/Qwen2.5-7B-Instruct-AWQ` through a vLLM OpenAI-compatible server.

Production and serious local testing are CUDA-only:

- The service must fail fast when GPU runtime is required but unavailable.
- CPU fallback is allowed only in unit tests with fake models or deterministic
  stubs.
- vLLM is the first inference backend because it is already compatible with the
  old flow and supports fast CUDA serving.

ONNX is a planned optimization lane, not the first dependency of the MVP:

- Phase 1 keeps the main LLM behind the OpenAI-compatible client.
- Phase 2 adds ONNX Runtime CUDA for lightweight classifiers and guardrail
  models where practical.
- Phase 3 evaluates ONNX export or quantized runtime options for the agent model
  only if quality, tool-call reliability, and latency are acceptable.

This keeps the first implementation shippable while preserving the lightweight
direction.

## Open Source Research Takeaways

Research references:

- LangGraph: https://github.com/langchain-ai/langgraph
- LangGraph persistence docs:
  https://docs.langchain.com/oss/python/langgraph/persistence
- LangGraph interrupts docs:
  https://docs.langchain.com/oss/python/langgraph/interrupts
- Rasa forms docs: https://rasa.com/docs/rasa/forms/
- Rasa demo: https://github.com/RasaHQ/rasa-demo
- Appointment agent starter kit:
  https://github.com/mjunaidca/appointment-agent
- LangGraph appointment bot:
  https://github.com/omariut/langgraph-appointment-bot
- LangGraph medical assistant examples:
  https://github.com/aimaster-dev/medical-ai-assistant and
  https://github.com/taherfattahi/langgraph-medical-ai-assistant

Applicable lessons:

- Use an existing graph runtime for state transitions, persistence hooks, and
  bounded tool loops instead of hand-rolling all orchestration from scratch.
  LangGraph is the best fit because it supports stateful agents, checkpointers,
  stores, human-in-the-loop interrupts, and explicit graph edges while staying
  Python-native.
- Keep tool execution custom. Public appointment demos often bind tools directly
  to calendar or file writes. For S.M.I.L.E, all mutations must go through typed
  Clinical EMR tools plus policy guards.
- Adopt Rasa's form idea, not the Rasa stack: each workflow should define
  required slots, slot validators, and loop deactivation/invalidation behavior
  when the user switches goals.
- Treat simple medical assistant examples as cautionary references. Keyword-only
  emergency routing and hardcoded clinic/doctor data are not acceptable for this
  project.
- Add observability early. LangGraph and appointment-agent examples lean on graph
  traces or LangSmith-style testing; this service should expose per-turn
  metadata for selected node, tool call, guard decision, parse status, and state
  delta even if LangSmith is not required.

Decision:

- The MVP should use LangGraph `StateGraph` as the orchestration runtime.
- The service should not use Composio, Google Calendar, Gmail, static doctor
  catalogs, or file-based appointment storage.
- The service should not depend on Rasa runtime, but should implement
  Rasa-inspired workflow slot contracts.

## Service Shape

Create a new FastAPI service under `ai/booking_agent_service`.

Initial endpoints:

- `GET /health`
- `POST /chat`

The service owns chatbot orchestration only. Clinical EMR remains the source of
truth for clinics, services, specialties, schedules, appointments, cancellation,
and appointment status.

The chatbot must not hardcode clinic, service, specialty, doctor, room, schedule,
price, or appointment data. These facts come from Clinical EMR through tools.
Small caches are allowed only for performance, must have explicit TTLs, and must
never be used as proof that a mutation is still valid.

The API Gateway and Docker Compose integration are not required for the first
code milestone, but the service should be structured so they can be added with
minimal changes.

## Architecture

The MVP uses LangGraph as the graph runtime and five project-owned core modules.
LangGraph provides node execution, explicit graph edges, checkpoint hooks, and
interrupt-like pause/resume semantics. S.M.I.L.E owns state schemas, tool
schemas, policy, guardrails, Clinical EMR integration, and response composition.

### 1. Agent State

`AgentState` stores durable session context:

- Session id.
- Current goal: `booking`, `lookup`, `cancel`, `info`, `unknown`.
- Known patient context from authenticated headers or session context.
- Candidate clinics, services, specialties, doctors, schedules, and
  appointments returned by tools.
- Pending action and pending confirmation.
- Stable candidate indexes for the latest visible candidate lists.
- Recent redacted turns.
- Bounded tool observations.

The state is server-owned. Client-provided state may bootstrap development
tests, but production state is stored by session id.

The first store is in-memory for tests and local development. Redis is the
production-ready store because the repo already runs Redis in Docker Compose.
Both stores need TTL support. Pending confirmations must expire sooner than the
session and must be invalidated when the goal, patient context, or candidate list
changes.

Implementation shape:

- Use a typed LangGraph state object as the execution state.
- Keep a narrower external request/response schema so the API does not expose
  internal graph state directly.
- Use LangGraph checkpointer-compatible storage for short-term session state.
- Use a Redis-backed store/checkpointer in production when available; in-memory
  checkpointer is only for tests and local development.

### 2. Tool Registry

Tools are thin, typed wrappers around current `dev` APIs:

- `list_clinics`
- `get_clinic`
- `list_services`
- `list_clinic_services`
- `list_specialties`
- `list_doctor_schedules`
- `book_by_specialty`
- `book_by_doctor`
- `get_patient_appointments`
- `cancel_appointment`

Tool schemas are explicit Pydantic models. The LLM never calls arbitrary URLs.
Every tool call is validated before execution.

Tool results are the only source for dynamic domain facts. The service may keep
configuration such as endpoint URLs, timeouts, step limits, and risk thresholds,
but must not embed a static catalog of actual clinics, services, doctors,
specialties, schedules, or prices.

### 3. ReAct Loop

Each chat turn follows a bounded LangGraph flow:

1. `ingest_turn`: load session state, redact input, attach trusted patient
   context, and detect obvious safety or goal-change signals.
2. `resolve_slots`: apply Rasa-inspired slot extraction and deterministic
   reference resolution against candidate lists.
3. `plan_next_action`: ask the CUDA-backed LLM for one ReAct action: answer,
   ask clarification, or call one allowed tool.
4. `policy_guard`: validate the proposed action, schema, confirmation, ownership
   requirements, and mutation idempotency.
5. `execute_tool`: execute exactly one validated tool and store the observation.
6. `compose_response`: produce the user-visible Vietnamese reply from state and
   observations.
7. `post_check_response`: run deterministic output checks before returning.

The graph may loop from `execute_tool` back to `plan_next_action` while the step
budget allows. The default budget is three tool-planning iterations per chat
turn. The graph must expose metadata for every node transition.

The first implementation should support deterministic fake planning in tests.
The production planner uses the CUDA-backed LLM.

If the step budget is exhausted before the agent has enough validated data to
act, the agent must stop tool execution and ask the user for the single most
useful missing detail. It must not force a mutation on the final step or return a
vague answer that implies the task succeeded.

If the LLM response cannot be parsed as either a standard OpenAI tool call or the
supported Qwen-style JSON fallback, the turn is treated as `PARSE_FAILED`: no
tool is executed, no mutation is attempted, the failure is recorded in metadata,
and the response composer asks a clarification or gives a safe fallback. The
loop does not silently retry forever.

### 4. Policy Guard

Policy is deliberately small and sharp.

It blocks:

- Unknown tools.
- Tool arguments not validated by schema.
- Booking without authenticated patient id and explicit user intent.
- Cancellation without appointment ownership context and explicit confirmation.
- Medical diagnosis, drug dosage, or emergency triage as normal booking answers.
- PII collection from free-form chat when trusted session context should supply
  the data.
- Resolved references that do not map to the current validated candidate list.
- Cancellation by appointment code or id until ownership has been verified by a
  read call against Clinical EMR.
- Duplicate mutation attempts for an already consumed pending confirmation.

It allows:

- Read tools for clinic, service, specialty, schedule, and appointment lookup.
- Booking mutation only after required fields are known.
- Cancellation mutation only after the user confirms the specific appointment.

Policy does not choose the whole workflow. It only rejects unsafe actions and
reports missing fields.

Before any mutation, policy must either require a fresh read verification or rely
on the backend response to reject stale state. Booking and cancellation handlers
must treat `404`, `409`, ownership failures, and transition failures as normal
recoverable outcomes and explain them to the user.

Sensitive mutation nodes should be interrupt-compatible. In MVP, user
confirmation is represented as a pending confirmation in session state. Later,
the same graph boundary can support staff approval or UI review without
rewriting the tool layer.

### 5. Response Composer

The response composer turns observations into Vietnamese assistant replies.

It must not invent:

- Appointment ids or codes.
- Doctor ids.
- Clinic ids.
- Prices, schedules, or availability.
- Confirmation status.

When state is incomplete, it asks for the single most useful missing detail.
When a mutation succeeds, it quotes backend-confirmed appointment information.

The MVP includes a deterministic post-check before returning text to the user:

- Detect UUID-like strings and appointment-code-like strings.
- Allow only ids/codes present in the current safe state, tool observations, or
  backend-confirmed mutation result.
- Replace or regenerate unsafe responses that contain invented ids, invented
  codes, unsupported confirmation claims, or unsupported medical advice.

## Memory Design

Memory is a first-class requirement, not an afterthought.

Per-session memory includes:

- Recent redacted messages, capped by count and token budget.
- Structured slots such as clinic, specialty, doctor, service, date, time, and
  appointment id.
- Candidate lists returned by tools so the user can say "slot đầu", "lịch đó",
  or "bác sĩ này" without repeating ids.
- Tool observations with compact summaries.
- Pending confirmations for booking and cancellation.

The LLM prompt receives a safe memory view:

- No raw unnecessary PII.
- No full backend payloads when summaries are enough.
- Enough candidate references for grounded follow-up.

The backend state store keeps richer structured data so later turns can resolve
references without asking again.

LangGraph persistence should be used for short-term conversational state rather
than a custom append-only chat buffer. Long-term profile memory is not part of
the MVP unless it is sourced from trusted backend records. The agent may store
summaries of session observations, but must not silently create medical history
or patient profile facts from free-form chat.

Memory compaction rules:

- Keep structured slots and candidate ids losslessly until TTL expiry.
- Keep recent text turns with redaction and token cap.
- Summarize old tool observations, but retain backend ids needed for pending
  confirmation or ownership verification.
- Clear or mark stale any candidate list after the freshness window expires.

## Reference Resolution

Every candidate list shown or made available to the LLM must have stable,
turn-local indexes:

- Clinics: `clinic_candidates[1]`, `clinic_candidates[2]`, ...
- Services: `service_candidates[1]`, `service_candidates[2]`, ...
- Specialties: `specialty_candidates[1]`, `specialty_candidates[2]`, ...
- Doctor schedules: `schedule_candidates[1]`, `schedule_candidates[2]`, ...
- Appointments: `appointment_candidates[1]`, `appointment_candidates[2]`, ...

The prompt should show candidates with these indexes and compact human-readable
labels. The LLM may reference a candidate by index or by backend id, but the
service must resolve the reference deterministically:

1. Parse explicit ordinal phrases such as "đầu tiên", "thứ hai", "lịch đó",
   "bác sĩ này", or a numeric choice.
2. Resolve the phrase against the active candidate list for the current goal.
3. Reject the reference if it does not map to exactly one current candidate.
4. Reject ids that are not present in state unless a read-verify tool confirms
   them.

Tool calls receive only resolved backend ids from the service, not raw ordinal
phrases from the model.

## Revalidation And Idempotency

State is conversational memory, not proof that the backend is still unchanged.

Before mutation:

- `book_by_specialty` should refresh or validate the selected clinic,
  specialty, and date context when the state is older than the configured
  freshness window.
- `book_by_doctor` should refresh or validate the selected doctor schedule when
  the state is older than the configured freshness window.
- `cancel_appointment` must verify the appointment belongs to the authenticated
  patient if the appointment was provided by code/id or if the stored candidate
  is stale.

After mutation failure:

- `409` or scheduling conflict means the state was stale; explain that the slot
  or schedule is no longer available and offer to search again.
- `404` means the referenced appointment or entity no longer exists; clear the
  affected pending confirmation.
- Ownership or authorization failures clear the pending cancellation and ask the
  user to choose an appointment from a fresh lookup.

Mutation requests should include an idempotency key derived from session id,
pending confirmation id, and operation type when the backend endpoint supports
it. Even when the backend lacks idempotency support, the agent must consume a
pending confirmation after the first mutation attempt and prevent duplicate
mutation calls for the same confirmation.

The graph should model mutation confirmation as a two-phase flow:

1. Prepare phase: collect and verify required slots, then create a
   `pending_confirmation` object with operation type, resolved backend ids,
   display summary, expiry, and idempotency key.
2. Commit phase: only an explicit user confirmation can consume the pending
   confirmation and call the mutation tool.

If the commit phase fails, the pending confirmation is consumed or marked failed;
the user must refresh candidates or confirm a new operation.

## Booking Flow

The MVP supports two booking paths.

### Book by specialty

Required data:

- Authenticated patient id.
- Clinic id.
- Specialty id.
- Preferred date.
- Optional preferred time.
- Optional chief complaint or note.

The agent may use read tools to discover clinics, services, specialties, and
schedules. Once required data is known, it asks for explicit confirmation, then
calls `POST /api/v1/appointments/by-specialty`.

### Book by doctor

Required data:

- Authenticated patient id.
- Doctor id.
- Clinic id.
- Appointment date.
- Appointment time.
- Optional service id.
- Optional room id.
- Optional chief complaint or note.

The agent may use schedule reads before booking. Once required data is known, it
asks for explicit confirmation, then calls `POST /api/v1/appointments/by-doctor`.

## Lookup Flow

The agent calls `GET /api/v1/appointments/patient/:patientId`.

The response is summarized as upcoming appointments first. If the backend returns
one active appointment, the state may store it as the current cancellation
candidate. If there are multiple active appointments, the user must choose one.

## Cancel Flow

The agent can cancel only after:

- The appointment is known from backend lookup or an exact appointment code/id.
- The appointment belongs to the current patient context or trusted backend
  lookup result.
- The user explicitly confirms cancellation.

Mutation uses `PATCH /api/v1/appointments/:id/cancel`.

If the user provides an appointment code or id directly, cancellation must first
perform a read-verify step. The agent cannot treat user-supplied code/id as
ownership evidence.

## Safety Guardrails

Safety has two layers.

Deterministic guards run before and after the LLM:

- High-risk emergency/systemic symptom screening.
- Out-of-scope detection for non-dental requests.
- Mutation confirmation gates.
- Tool allowlist and schema validation.
- Response checks for invented ids or unsupported medical advice.

Model-assisted guards can be added behind CUDA or ONNX Runtime CUDA:

- Intent and safety classification.
- Response risk classifier.
- Tool-call risk classifier.

The MVP should implement deterministic guards and leave clean interfaces for
model-assisted guardrails.

The symptom guard must distinguish ordinary dental complaints from emergency or
systemic risk:

- Allow normal booking for dental pain, toothache, gum discomfort, sensitivity,
  broken tooth, wisdom tooth discomfort, or bleeding described as mild or
  routine.
- Escalate or safety-block normal booking answers when the message includes
  severe swelling, facial or neck swelling, breathing difficulty, uncontrolled
  bleeding, fainting, loss of consciousness, high fever, trauma, spreading
  infection, chest pain, or similar emergency indicators.
- Handle Vietnamese variants, missing accents, and common shorthand where
  practical.

Out-of-scope detection should not block dental-adjacent questions just because
they mention general health. A dental symptom plus booking intent remains in the
booking flow unless emergency/systemic risk is detected.

## Testing Strategy

Tests start with deterministic fake clients and no GPU dependency.

Required MVP tests:

- Tool schema validation.
- Clinical EMR client request construction.
- Session memory persistence and follow-up resolution.
- Candidate index rendering and deterministic reference resolution.
- Booking by specialty happy path.
- Booking by doctor happy path.
- Stale booking candidate conflict handling.
- Appointment lookup.
- Appointment code/id ownership verification before cancellation.
- Cancel confirmation gate.
- Cancel success path.
- Duplicate confirmation retry does not double-book or double-cancel.
- Safety blocks mutation when message contains high-risk symptoms.
- Ordinary dental pain remains bookable when no emergency/systemic risk is
  present.
- Rule-based response post-check blocks invented ids/codes.
- Step-budget exhaustion asks for missing information instead of forcing a tool.
- LLM tool-call parser handles normal OpenAI tool calls and Qwen-style JSON
  fallback.
- LLM parse failure does not execute tools and returns a safe clarification.
- LangGraph node transition tests for happy paths and guard-blocked paths.
- Slot contract tests inspired by Rasa forms: missing slot, invalid slot, goal
  switch invalidation, and confirmation expiry.

GPU/vLLM tests are optional integration tests gated by environment variables.

The test suite should avoid the common weakness seen in public demo repos where
only a single "assistant replies with text" case is tested. Tool calls, state
transitions, guard decisions, stale backend failures, and response post-checks
must be asserted directly.

## Non-Goals For MVP

- Hold-slot workflow.
- Waitlist workflow.
- Full reschedule workflow.
- Payment flow.
- Notification authoring.
- Arbitrary medical advice.
- Migrating the full LLM to ONNX before the service behavior is stable.
- Using external tool providers such as Composio for S.M.I.L.E appointment
  mutations.
- Hardcoded demo catalogs for clinics, doctors, services, prices, or schedules.

## Open Integration Notes

- Gateway route and Docker Compose service should be added after the FastAPI
  service and local tests are stable.
- The service should accept trusted patient/session headers from the gateway in
  production.
- The old `ai/booking_orchestrator` branch remains the historical reference but
  is not copied wholesale into this branch.
