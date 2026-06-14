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

## Service Shape

Create a new FastAPI service under `ai/booking_agent_service`.

Initial endpoints:

- `GET /health`
- `POST /chat`

The service owns chatbot orchestration only. Clinical EMR remains the source of
truth for clinics, services, specialties, schedules, appointments, cancellation,
and appointment status.

The API Gateway and Docker Compose integration are not required for the first
code milestone, but the service should be structured so they can be added with
minimal changes.

## Architecture

The MVP uses five core modules.

### 1. Agent State

`AgentState` stores durable session context:

- Session id.
- Current goal: `booking`, `lookup`, `cancel`, `info`, `unknown`.
- Known patient context from authenticated headers or session context.
- Candidate clinics, services, specialties, doctors, schedules, and
  appointments returned by tools.
- Pending action and pending confirmation.
- Recent redacted turns.
- Bounded tool observations.

The state is server-owned. Client-provided state may bootstrap development
tests, but production state is stored by session id.

The first store is in-memory for tests and local development. Redis is the
production-ready store because the repo already runs Redis in Docker Compose.

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

### 3. ReAct Loop

Each chat turn follows a bounded loop:

1. Build a compact prompt from the user message, current state, allowed tools,
   and safety rules.
2. Ask the LLM for one ReAct action: answer, ask clarification, or call one
   allowed tool.
3. Validate the tool call.
4. Execute the tool and store the observation.
5. Repeat for at most three steps.
6. Compose the final answer from the latest state and observations.

The first implementation should support deterministic fake planning in tests.
The production planner uses the CUDA-backed LLM.

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

It allows:

- Read tools for clinic, service, specialty, schedule, and appointment lookup.
- Booking mutation only after required fields are known.
- Cancellation mutation only after the user confirms the specific appointment.

Policy does not choose the whole workflow. It only rejects unsafe actions and
reports missing fields.

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

## Safety Guardrails

Safety has two layers.

Deterministic guards run before and after the LLM:

- High-risk symptom keyword screening.
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

## Testing Strategy

Tests start with deterministic fake clients and no GPU dependency.

Required MVP tests:

- Tool schema validation.
- Clinical EMR client request construction.
- Session memory persistence and follow-up resolution.
- Booking by specialty happy path.
- Booking by doctor happy path.
- Appointment lookup.
- Cancel confirmation gate.
- Cancel success path.
- Safety blocks mutation when message contains high-risk symptoms.
- LLM tool-call parser handles normal OpenAI tool calls and Qwen-style JSON
  fallback.

GPU/vLLM tests are optional integration tests gated by environment variables.

## Non-Goals For MVP

- Hold-slot workflow.
- Waitlist workflow.
- Full reschedule workflow.
- Payment flow.
- Notification authoring.
- Arbitrary medical advice.
- Migrating the full LLM to ONNX before the service behavior is stable.

## Open Integration Notes

- Gateway route and Docker Compose service should be added after the FastAPI
  service and local tests are stable.
- The service should accept trusted patient/session headers from the gateway in
  production.
- The old `ai/booking_orchestrator` branch remains the historical reference but
  is not copied wholesale into this branch.

