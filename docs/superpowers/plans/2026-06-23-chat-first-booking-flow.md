# Chat-First Booking Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the chat-first booking, cancel, and reschedule flow with structured in-chat controls and no appointment-ID typing.

**Architecture:** Keep LangGraph as the orchestration layer and the clinical/EMR API as source of truth. The frontend renders structured `safe_state` into slot pickers and appointment action cards, while mutations still require confirmation tokens.

**Tech Stack:** FastAPI/Python LangGraph service, NestJS clinical EMR APIs, Next.js/React booking chat widget, PostgreSQL seed data.

---

### Task 1: Shape Appointment Data For Cards

**Files:**
- Modify: `ai/booking_langgraph_service/src/http_tools.py`
- Test: `ai/booking_langgraph_service/tests/test_real_payloads.py`

- [ ] **Step 1: Write failing test**

Add a test asserting `get_patient_appointments()` returns normalized fields for card rendering:

```python
@pytest.mark.asyncio
async def test_get_patient_appointments_returns_card_ready_fields():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"data": [{
            "appointment_id": "appt-1",
            "appointment_code": "APT-001",
            "appointment_date": "2026-06-24",
            "appointment_time": "09:00",
            "duration_minutes": 30,
            "status": "scheduled",
            "clinic": {"clinic_name": "SMILE HCM"},
            "room": {"room_name": "Room 1"},
            "service": {"service_name": "Oral checking"},
        }]})

    tools = HttpDomainTools(emr_base_url="http://emr", http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)))
    appointments = await tools.get_patient_appointments("patient-1")

    assert appointments[0]["id"] == "appt-1"
    assert appointments[0]["appointment_code"] == "APT-001"
    assert appointments[0]["service_name"] == "Oral checking"
    assert appointments[0]["clinic_name"] == "SMILE HCM"
    assert appointments[0]["room_name"] == "Room 1"
```

- [ ] **Step 2: Verify failure**

Run:

```powershell
ai/booking_langgraph_service/.venv/Scripts/python.exe -m pytest ai/booking_langgraph_service/tests/test_real_payloads.py::test_get_patient_appointments_returns_card_ready_fields -q
```

Expected: fail because `get_patient_appointments` returns raw payload.

- [ ] **Step 3: Implement normalization**

Add a helper in `HttpDomainTools`:

```python
@classmethod
def _normalize_appointments(cls, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [cls._normalize_appointment(item) for item in items]
```

Use it in `get_patient_appointments`.

- [ ] **Step 4: Verify**

Run the targeted test and full Python suite:

```powershell
ai/booking_langgraph_service/.venv/Scripts/python.exe -m pytest ai/booking_langgraph_service/tests/test_real_payloads.py::test_get_patient_appointments_returns_card_ready_fields -q
ai/booking_langgraph_service/.venv/Scripts/python.exe -m pytest ai/booking_langgraph_service/tests -q
```

### Task 2: Keep Assistant Copy Short When UI Has Lists

**Files:**
- Modify: `ai/booking_langgraph_service/src/response_generator.py`
- Test: `ai/booking_langgraph_service/tests/test_response_generator.py`

- [ ] **Step 1: Write failing test**

Add a test that structured booking options produce concise text without repeating every slot.

```python
def test_booking_options_prompt_requests_concise_copy():
    prompt = build_response_prompt(
        flow="booking",
        outcome_code="confirmation_required",
        safe_facts={"booking_options_count": 12, "booking_option": {"summary": "2026-06-24 at 09:00"}},
    )
    assert "Do not list every option" in prompt
```

- [ ] **Step 2: Verify failure**

Run:

```powershell
ai/booking_langgraph_service/.venv/Scripts/python.exe -m pytest ai/booking_langgraph_service/tests/test_response_generator.py -q
```

- [ ] **Step 3: Implement prompt rule**

Add response guidance: if structured options or appointments exist, keep copy to a one-sentence instruction and let UI render the list.

- [ ] **Step 4: Verify**

Run response generator tests and full Python suite.

### Task 3: Render Appointment Action Cards

**Files:**
- Modify: `frontend/web/src/features/booking-chat/components/FloatingBookingChat.tsx`

- [ ] **Step 1: Add typed appointment preview**

Define `AppointmentPreview` near `BookingOptionPreview` with fields:

```ts
type AppointmentPreview = {
  id?: string;
  appointment_id?: string;
  appointment_code?: string;
  appointment_date?: string;
  appointment_time?: string;
  duration_minutes?: number;
  status?: string;
  service_name?: string;
  doctor_name?: string;
  clinic_name?: string;
  room_name?: string;
};
```

- [ ] **Step 2: Add message builders**

Add:

```ts
function appointmentIdOf(item: AppointmentPreview) {
  return item.id ?? item.appointment_id ?? item.appointment_code ?? "";
}

function buildCancelAppointmentMessage(item: AppointmentPreview) {
  return `Cancel appointment ${appointmentIdOf(item)}.`;
}

function buildRescheduleAppointmentMessage(item: AppointmentPreview) {
  return `Move appointment ${appointmentIdOf(item)}.`;
}
```

- [ ] **Step 3: Render cards with actions**

Replace passive upcoming appointment rendering with card buttons for `Cancel` and `Reschedule`.

- [ ] **Step 4: Verify lint**

Run:

```powershell
npx eslint src/features/booking-chat/components/FloatingBookingChat.tsx
```

### Task 4: Make Slot Picker Confirmation Explicit

**Files:**
- Modify: `frontend/web/src/features/booking-chat/components/FloatingBookingChat.tsx`

- [ ] **Step 1: Do not show global confirmation for multi-option responses**

Keep current `hasMultipleBookingOptions` guard. Ensure the slot picker still renders.

- [ ] **Step 2: Include all selected fields in slot selection message**

Ensure `buildSlotSelectionMessage` includes service, date, time, doctor, room, clinic.

- [ ] **Step 3: Verify lint**

Run:

```powershell
npx eslint src/features/booking-chat/components/FloatingBookingChat.tsx
```

### Task 5: API Verification

**Files:**
- No source changes.

- [ ] **Step 1: Rebuild AI service**

Run:

```powershell
docker compose --profile langgraph-chatbot up -d --build booking-langgraph-service
```

- [ ] **Step 2: Verify booking option selection**

POST to `/chat` with `preferred time: 10:30`; expected confirmation summary contains `10:30`.

- [ ] **Step 3: Verify appointment lookup for cards**

POST to `/chat` with `Show my upcoming SMILE appointments.`; expected `safe_state.appointments` is an array and contains card-ready fields when appointments exist.

- [ ] **Step 4: Verify frontend static checks**

Run:

```powershell
npx eslint src/features/booking-chat/components/FloatingBookingChat.tsx
```
