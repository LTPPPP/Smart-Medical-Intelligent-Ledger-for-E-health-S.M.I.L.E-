# S.M.I.L.E Booking Orchestrator

FastAPI chatbot service for training-free, tool-routed dental appointment scheduling.

The LLM is treated as untrusted. It may choose a tool and propose arguments, but all scheduling writes go through deterministic Clinical EMR endpoints with validation and database transactions.

## Run

```bash
python -m pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 7777
```

## vLLM

The orchestrator supports vLLM through its OpenAI-compatible chat completions API.

```bash
vllm serve Qwen/Qwen2.5-7B-Instruct --host 0.0.0.0 --port 8000
```

Then configure:

```env
LLM_ENABLED=true
LLM_BASE_URL=http://localhost:8000/v1
LLM_API_KEY=local-dev-key
LLM_MODEL=Qwen/Qwen2.5-7B-Instruct
LLM_TEMPERATURE=0
LLM_MAX_TOKENS=256
CLINICAL_EMR_BASE_URL=http://localhost:3004
CLINICAL_EMR_API_PREFIX=/api/v1
```

When `LLM_ENABLED=false`, `/chat` still uses deterministic profile selection and exposes tool schemas without calling an LLM.

## Test

```bash
python -m pytest -q
```

## Gradio Dev UI

Run the orchestrator first:

```bash
uvicorn src.main:app --host 127.0.0.1 --port 7777
```

Then start the local Gradio UI:

```bash
python -m src.ui.gradio_app --api-base-url http://127.0.0.1:7777 --port 7860
```

The UI includes a preset test user (`Tran Dai Nhan`, `nhantd.dev@gmail.com`) and
quick state presets for booking, hold, confirm, reschedule, waitlist, and safety
router checks.

## System Design

- **Architecture:** FastAPI handles chat orchestration only. Clinical EMR owns all appointment writes, slot state, waitlist matching, email outbox records, and handoff tickets.
- **Agent orchestrator:** `ChatOrchestrator` selects a deterministic tool profile, optionally calls an OpenAI-compatible LLM such as vLLM, validates the chosen tool call, and executes it through backend tool functions.
- **16 tools:** tool schemas live in `src/tools/schemas.py` and are validated with Pydantic before execution. The implemented tools are `get_clinic_info`, `search_clinic_knowledge`, `get_services`, `estimate_service_duration`, `get_available_slots`, `hold_slot`, `confirm_booking`, `release_hold`, `reschedule_appointment`, `cancel_appointment`, `add_to_waitlist`, `check_waitlist_matches`, `send_email_notification`, `classify_medical_risk`, `create_handoff_ticket`, and `summarize_for_dentist`.
- **Context-aware profiles:** `src/agent/tool_router.py` exposes only the selected profile tools, such as booking tools for booking intent, cancellation tools for cancel intent, and safety tools for high-risk medical messages.
- **vLLM deployment:** set `LLM_ENABLED=true` and point `LLM_BASE_URL` to the vLLM OpenAI-compatible `/v1` endpoint. When disabled, the service remains deterministic and does not call an LLM.
- **Cache strategy:** clinic info, service catalog, service duration defaults, and static knowledge are in-process immutable data. Mutating tools are never cached. Slot availability can be cached later with a very short TTL, but `hold_slot` and `confirm_booking` must always re-check Clinical EMR state.

## Transaction-Safe Scheduling Protocol

- **Hold slot:** `hold_slot` runs in Clinical EMR, locks the slot row, accepts only `AVAILABLE` slots, writes an `ACTIVE` hold, changes the slot to `HELD`, and enforces a 60-600 second TTL.
- **Confirm booking:** `confirm_booking` verifies hold existence, active status, expiry, session ownership, slot state, service existence, and patient info before creating the appointment, marking the slot `BOOKED`, confirming the hold, and queueing a booking email.
- **Release hold:** `release_hold` is idempotent. Missing or already released holds are safe; active holds release the slot back to `AVAILABLE`.
- **Reschedule:** `reschedule_appointment` requires a valid new held slot before modifying the existing appointment. If the new hold is invalid, the old appointment remains unchanged.
- **Cancellation and waitlist:** `cancel_appointment` marks the appointment cancelled, releases the linked slot to `AVAILABLE`, checks matching waitlist entries, and queues notification emails without auto-booking the slot.

## Safety Guardrails

- **Medical risk classification:** `classify_medical_risk` checks high-risk terms such as facial swelling, fever, uncontrolled bleeding, severe pain, trauma, infection, chest pain, and fainting.
- **Handoff ticket:** `create_handoff_ticket` stores high-risk conversations for clinic staff review instead of letting the LLM provide clinical decisions.
- **Dentist summary:** `summarize_for_dentist` creates a bounded summary with a safety note and does not diagnose, prescribe, or recommend dosage.
- **Email alert:** `send_email_notification` queues trusted template-based records in `email_outbox`; it does not send arbitrary LLM-generated email content.
