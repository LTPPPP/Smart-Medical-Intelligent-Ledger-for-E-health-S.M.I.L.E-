# Booking Agent — Implementation Plan v2

**Branch:** `feat/ai/react-agentic-chatbot`  
**Service root:** `ai/booking_agent_service/`  
**Target:** Codex agent — implement all tasks top to bottom, run tests after each section.

---

## Overview

Four independent work-streams, ordered by dependency:

| # | Stream | Files touched |
|---|--------|---------------|
| 1 | New tools (5 tools) | `src/emr_client.py`, `src/tools.py`, `src/llm_client.py`, `src/graph.py` |
| 2 | Two-phase pipeline | `src/slot_extractor.py` (new), `src/dispatcher.py` (new), `src/graph.py` |
| 3 | Structured confirmation API | `src/schemas.py`, `src/graph.py`, `src/main.py` |
| 4 | Session patient profile + security | `src/session_context.py` (new), `src/main.py`, `src/state.py` |
| 5 | Metrics evaluation framework | `scripts/run_metrics_eval.py` (new), `artifacts/metrics/` |

---

## Stream 1 — Five New Tools

### 1.1 New EMR client methods (`src/emr_client.py`)

Add the following methods to `ClinicalEmrClient`. Do NOT change existing methods.

```python
async def reschedule_appointment(
    self,
    appointment_id: str,
    payload: dict[str, Any],
    idempotency_key: str | None = None,
) -> Any:
    return await self._request(
        "PATCH",
        f"/api/v1/appointments/{appointment_id}",
        json=payload,
        idempotency_key=idempotency_key,
    )

async def list_doctors_by_specialty(
    self,
    specialty_id: str,
) -> Any:
    return await self._request(
        "GET",
        f"/api/v1/doctor-specialties/specialty/{specialty_id}",
    )

async def get_doctor_leaves(
    self,
    doctor_id: str,
    **params: Any,
) -> Any:
    return await self._request(
        "GET",
        f"/api/v1/doctor-leaves/doctor/{doctor_id}",
        params=params,
    )

async def send_appointment_reminder(
    self,
    appointment_id: str,
) -> Any:
    return await self._request(
        "POST",
        f"/api/v1/appointments/{appointment_id}/notifications/reminder",
    )

async def get_appointment_by_id(
    self,
    appointment_id: str,
) -> Any:
    return await self._request(
        "GET",
        f"/api/v1/appointments/{appointment_id}",
    )
```

### 1.2 Arg models and ToolRegistry (`src/tools.py`)

**Add Pydantic arg models** (same pattern as existing models):

```python
class RescheduleAppointmentArgs(BaseModel):
    appointment_id: str
    appointment_date: str | None = None   # ISO 8601 date YYYY-MM-DD
    appointment_time: str | None = None   # HH:MM
    doctor_id: str | None = None
    schedule_id: str | None = None

    @field_validator("appointment_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        return _validate_uuid(v)

    @field_validator("appointment_date")
    @classmethod
    def validate_date(cls, v: str | None) -> str | None:
        if v is None:
            return v
        import re
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
            raise ValueError("appointment_date must be YYYY-MM-DD")
        return v

    @field_validator("appointment_time")
    @classmethod
    def validate_time(cls, v: str | None) -> str | None:
        if v is None:
            return v
        import re
        if not re.fullmatch(r"\d{2}:\d{2}", v):
            raise ValueError("appointment_time must be HH:MM")
        return v


class ListDoctorsBySpecialtyArgs(BaseModel):
    specialty_id: str

    @field_validator("specialty_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        return _validate_uuid(v)


class GetDoctorLeavesArgs(BaseModel):
    doctor_id: str
    from_date: str | None = None   # YYYY-MM-DD
    to_date: str | None = None     # YYYY-MM-DD

    @field_validator("doctor_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        return _validate_uuid(v)


class SendReminderArgs(BaseModel):
    appointment_id: str

    @field_validator("appointment_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        return _validate_uuid(v)


class GetAppointmentByIdArgs(BaseModel):
    appointment_id: str

    @field_validator("appointment_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        return _validate_uuid(v)
```

**Register new tools in `ToolRegistry.__init__`** (inside the `_mutation_map` and `_read_map` dicts):

```python
# In _mutation_map (operations that change state):
"reschedule_appointment": RescheduleAppointmentArgs,
"send_reminder": SendReminderArgs,

# In _read_map (safe reads):
"list_doctors_by_specialty": ListDoctorsBySpecialtyArgs,
"get_doctor_leaves": GetDoctorLeavesArgs,
"get_appointment_by_id": GetAppointmentByIdArgs,
```

**Add dispatch cases in `ToolRegistry.execute`**:

```python
if name == "reschedule_appointment":
    args = RescheduleAppointmentArgs(**arguments)
    payload = args.model_dump(exclude_none=True)
    appointment_id = payload.pop("appointment_id")
    return await self.client.reschedule_appointment(
        appointment_id, payload, idempotency_key=idempotency_key
    )

if name == "list_doctors_by_specialty":
    args = ListDoctorsBySpecialtyArgs(**arguments)
    return await self.client.list_doctors_by_specialty(args.specialty_id)

if name == "get_doctor_leaves":
    args = GetDoctorLeavesArgs(**arguments)
    return await self.client.get_doctor_leaves(
        args.doctor_id,
        from_date=args.from_date,
        to_date=args.to_date,
    )

if name == "send_reminder":
    args = SendReminderArgs(**arguments)
    return await self.client.send_appointment_reminder(args.appointment_id)

if name == "get_appointment_by_id":
    args = GetAppointmentByIdArgs(**arguments)
    return await self.client.get_appointment_by_id(args.appointment_id)
```

### 1.3 Register in PLANNER_TOOLS (`src/llm_client.py`)

Append to `PLANNER_TOOLS` list. Keep existing entries unchanged.

```python
_function_tool(
    "reschedule_appointment",
    "Đổi ngày/giờ/bác sĩ cho một lịch hẹn hiện có. Yêu cầu xác nhận trước khi thực hiện.",
    RescheduleAppointmentArgs.model_json_schema(),
),
_function_tool(
    "list_doctors_by_specialty",
    "Liệt kê bác sĩ theo chuyên khoa để bệnh nhân chọn.",
    _object_schema({"specialty_id": {"type": "string"}}, ["specialty_id"]),
),
_function_tool(
    "get_doctor_leaves",
    "Kiểm tra lịch nghỉ của bác sĩ để tránh đặt vào ngày nghỉ.",
    _object_schema(
        {
            "doctor_id": {"type": "string"},
            "from_date": {"type": "string"},
            "to_date": {"type": "string"},
        },
        ["doctor_id"],
    ),
),
_function_tool(
    "send_reminder",
    "Gửi tin nhắc lịch hẹn cho bệnh nhân.",
    _object_schema({"appointment_id": {"type": "string"}}, ["appointment_id"]),
),
_function_tool(
    "get_appointment_by_id",
    "Xem chi tiết một lịch hẹn theo appointment_id (UUID).",
    _object_schema({"appointment_id": {"type": "string"}}, ["appointment_id"]),
),
```

Also update `READ_TOOL_NAMES` in `src/graph.py`:

```python
READ_TOOL_NAMES = {
    "list_clinics",
    "get_clinic",
    "list_services",
    "list_clinic_services",
    "list_specialties",
    "list_doctor_schedules",
    "list_doctors_by_specialty",  # NEW
    "get_doctor_leaves",           # NEW
    "get_appointment_by_code",
    "get_appointment_by_id",       # NEW
    "get_patient_appointments",
}
```

### 1.4 Graph handlers for new read tools (`src/graph.py`)

Add these cases inside `_handle_read_observation`:

```python
if tool_name == "list_doctors_by_specialty":
    doctors = self._list_items(observation)
    candidates = self._entity_candidates(
        doctors,
        ("doctor_id", "id"),
        ("doctor_name", "full_name", "name"),
    )
    now = utc_now()
    state.candidates["doctor"] = CandidateList(
        kind="doctor",
        fetched_at=now,
        presented_at=now,
        ttl_seconds=600,
        items=candidates,
    )
    if not candidates:
        return TurnResult(
            reply="Mình chưa thấy bác sĩ nào theo chuyên khoa này.",
            metadata={"candidate_list_updated": "doctor"},
        )
    return TurnResult(
        reply=self._render_candidate_reply("Các bác sĩ tìm được:", candidates),
        metadata={"candidate_list_updated": "doctor"},
    )

if tool_name == "get_doctor_leaves":
    leaves = self._list_items(observation)
    if not leaves:
        return TurnResult(
            reply="Bác sĩ không có lịch nghỉ phép trong thời gian này.",
            metadata={"doctor_leaves_checked": True, "leave_count": 0},
        )
    leave_dates = [
        item.get("leave_date") or item.get("date") or str(item)
        for item in leaves[:5]
    ]
    dates_str = ", ".join(str(d) for d in leave_dates if d)
    return TurnResult(
        reply=f"Bác sĩ có lịch nghỉ vào: {dates_str}. Bạn chọn ngày khác nhé.",
        metadata={"doctor_leaves_checked": True, "leave_count": len(leaves)},
    )

if tool_name == "get_appointment_by_id" and isinstance(observation, dict):
    appointment_id = observation.get("appointment_id") or observation.get("id")
    if appointment_id:
        now = utc_now()
        state.candidates["appointment"] = CandidateList(
            kind="appointment",
            fetched_at=now,
            presented_at=now,
            ttl_seconds=600,
            items=[
                Candidate(
                    id=str(appointment_id),
                    label=self._appointment_label(observation),
                    payload=observation,
                )
            ],
        )
    return TurnResult(
        reply=self._render_appointment_detail_reply(observation),
        metadata={"appointment_detail_loaded": True},
    )
```

Add helper `_render_appointment_detail_reply` to `BookingAgentGraph`:

```python
@staticmethod
def _render_appointment_detail_reply(item: dict[str, Any]) -> str:
    code = item.get("appointment_code") or item.get("code") or ""
    date = item.get("appointment_date") or item.get("date") or ""
    time = item.get("appointment_time") or item.get("time") or ""
    status = item.get("status") or ""
    doctor = item.get("doctor_name") or ""
    clinic = item.get("clinic_name") or ""
    parts = [p for p in [code, date, time, doctor, clinic, f"({status})" if status else ""] if p]
    return "Lịch hẹn: " + " | ".join(parts)
```

**Reschedule pending confirmation** in `graph.py` — handle `reschedule_appointment` the same way as `book_by_doctor`/`book_by_specialty`: create a `PendingConfirmation` before executing. Add to the mutation block (alongside the existing `book_by_doctor`/`book_by_specialty` check):

```python
if action.tool_name == "reschedule_appointment":
    if not state.patient_id:
        return TurnResult(
            reply="Bạn cần đăng nhập để mình có thể đổi lịch hẹn.",
            metadata={"mutation_blocked": "missing_patient_context"},
            tool_calls=tool_calls,
        )
    appt_id = action.arguments.get("appointment_id")
    if not appt_id:
        return TurnResult(
            reply="Mình cần mã lịch hẹn để thực hiện đổi lịch. Bạn cho mình biết lịch nào muốn đổi nhé.",
            metadata={"mutation_blocked": "missing_appointment_id"},
            tool_calls=tool_calls,
        )
    payload = dict(action.arguments)
    payload["updated_by"] = state.patient_id
    confirmation_id = f"confirm-{uuid4()}"
    now = utc_now()
    new_date = payload.get("appointment_date", "")
    new_time = payload.get("appointment_time", "")
    state.pending_confirmation = PendingConfirmation(
        confirmation_id=confirmation_id,
        operation="reschedule_appointment",
        summary=f"Đổi lịch hẹn sang {new_date} {new_time}".strip(),
        created_at=now,
        expires_at=now + timedelta(minutes=2),
        idempotency_key=f"{state.session_id}:{confirmation_id}:reschedule_appointment",
        payload=payload,
    )
    return TurnResult(
        reply=(
            f"Mình sẽ đổi lịch hẹn này sang {new_date} {new_time}. "
            "Bạn xác nhận để tiếp tục nhé."
        ),
        metadata={"pending_confirmation_created": True},
        tool_calls=tool_calls,
        pending_mutation=True,
    )
```

---

## Stream 2 — Two-Phase Pipeline

### 2.1 New module: `src/slot_extractor.py`

Create file `src/slot_extractor.py`. This is a **stateless** structured extraction — one LLM call, no tools, JSON schema output.

```python
"""
SlotExtractor — Phase 1 of the two-phase pipeline.

Extracts structured intent and slots from the current user message + history.
One LLM call, no tools, JSON output only.
Never puts patient PII in the response; reads patient_id from context only.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

import httpx

from .config import Settings

# JSON schema for structured slot output
SLOT_OUTPUT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "intent": {
            "type": "string",
            "enum": ["book", "cancel", "reschedule", "lookup", "info", "reminder", "unknown"],
            "description": "Mục đích chính của người dùng trong lượt này",
        },
        "confidence": {
            "type": "number",
            "minimum": 0.0,
            "maximum": 1.0,
            "description": "Độ tự tin về intent (0–1)",
        },
        "specialty": {
            "type": ["string", "null"],
            "description": "Chuyên khoa người dùng yêu cầu, ví dụ: 'niềng răng', 'nhổ răng'",
        },
        "doctor_hint": {
            "type": ["string", "null"],
            "description": "Tên hoặc gợi ý về bác sĩ (không phải UUID)",
        },
        "clinic_hint": {
            "type": ["string", "null"],
            "description": "Tên hoặc địa điểm phòng khám",
        },
        "date_hint": {
            "type": ["string", "null"],
            "description": "Ngày mong muốn dạng YYYY-MM-DD hoặc mô tả như 'thứ 2 tuần sau'",
        },
        "time_hint": {
            "type": ["string", "null"],
            "description": "Giờ mong muốn dạng HH:MM hoặc mô tả như 'buổi chiều'",
        },
        "appointment_ref": {
            "type": ["string", "null"],
            "description": "Mã lịch hẹn hoặc mô tả tham chiếu như 'lịch C02 lúc 2 giờ'",
        },
        "missing_slots": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Các slot còn thiếu để hoàn tất intent (ví dụ: ['date', 'specialty'])",
        },
    },
    "required": ["intent", "confidence", "missing_slots"],
    "additionalProperties": False,
}


@dataclass
class ExtractedSlots:
    intent: str
    confidence: float
    specialty: str | None = None
    doctor_hint: str | None = None
    clinic_hint: str | None = None
    date_hint: str | None = None
    time_hint: str | None = None
    appointment_ref: str | None = None
    missing_slots: list[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ExtractedSlots":
        return cls(
            intent=data.get("intent", "unknown"),
            confidence=float(data.get("confidence", 0.0)),
            specialty=data.get("specialty"),
            doctor_hint=data.get("doctor_hint"),
            clinic_hint=data.get("clinic_hint"),
            date_hint=data.get("date_hint"),
            time_hint=data.get("time_hint"),
            appointment_ref=data.get("appointment_ref"),
            missing_slots=list(data.get("missing_slots") or []),
        )

    @property
    def is_actionable(self) -> bool:
        """True when confidence is high enough to proceed without clarification."""
        return self.confidence >= 0.7 and self.intent != "unknown"

    @property
    def needs_clarification(self) -> bool:
        return self.confidence < 0.4 or self.intent == "unknown"


class SlotExtractor:
    """
    Phase-1 LLM call: extract intent + slots from user message + recent history.
    Does NOT call any tools. Returns ExtractedSlots.
    """

    def __init__(
        self,
        settings: Settings,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self.settings = settings
        self._client = http_client or httpx.AsyncClient(
            timeout=settings.request_timeout_seconds
        )

    async def extract(
        self,
        message: str,
        recent_turns: list[dict[str, str]],
        current_date_iso: str,
    ) -> ExtractedSlots:
        """
        Extract slots from message. recent_turns is a list of
        {"role": "user"|"assistant", "content": "..."} dicts (last 6 turns max).
        current_date_iso is today's date as YYYY-MM-DD for relative date resolution.
        """
        system_prompt = (
            "Bạn là module trích xuất ý định (intent) và thông tin (slots) từ tin nhắn "
            "của bệnh nhân trong hệ thống đặt lịch nha khoa. "
            "Chỉ trả về JSON theo schema đã cho. Không tự điền thông tin không có trong tin nhắn. "
            "Không đoán patient_id, appointment_id, hay UUID — chỉ trích xuất text thô người dùng nói.\n\n"
            f"Ngày hôm nay: {current_date_iso}\n\n"
            "Quy tắc:\n"
            "- intent='book': người dùng muốn đặt lịch mới\n"
            "- intent='cancel': người dùng muốn hủy lịch\n"
            "- intent='reschedule': người dùng muốn đổi ngày/giờ lịch hiện có\n"
            "- intent='lookup': người dùng muốn xem lịch hẹn của mình\n"
            "- intent='info': người dùng hỏi thông tin phòng khám/bác sĩ/dịch vụ\n"
            "- intent='reminder': người dùng muốn nhận nhắc lịch\n"
            "- confidence: 1.0 nếu rõ ràng, 0.5 nếu không chắc, 0.0 nếu không liên quan\n"
            "- missing_slots: liệt kê ['specialty','date','time','doctor','clinic','appointment_ref'] "
            "tuỳ slot nào còn thiếu để thực hiện intent"
        )

        messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
        # Include last 6 turns for coreference resolution
        for turn in recent_turns[-6:]:
            messages.append({"role": turn["role"], "content": turn["content"]})
        messages.append({"role": "user", "content": message})

        payload: dict[str, Any] = {
            "model": self.settings.llm_model,
            "temperature": 0,
            "messages": messages,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "slot_extraction",
                    "schema": SLOT_OUTPUT_SCHEMA,
                    "strict": True,
                },
            },
        }
        response = await self._client.post(
            f"{self.settings.llm_base_url.rstrip('/')}/chat/completions",
            json=payload,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        try:
            data = json.loads(content)
        except (json.JSONDecodeError, KeyError):
            return ExtractedSlots(intent="unknown", confidence=0.0)
        return ExtractedSlots.from_dict(data)
```

### 2.2 New module: `src/dispatcher.py`

Create file `src/dispatcher.py`. The dispatcher maps extracted slots → which tools to call in parallel.

```python
"""
ActionDispatcher — Phase 2 of the two-phase pipeline.

Given extracted slots + current AgentState, determines which tool calls are
needed and dispatches them (potentially in parallel via asyncio.gather).
Does NOT call the LLM. Returns DispatchPlan.
"""
from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Any

from .slot_extractor import ExtractedSlots
from .state import AgentState


@dataclass
class ToolCall:
    name: str
    arguments: dict[str, Any]


@dataclass
class DispatchPlan:
    """Ordered groups of tool calls. Each group runs in parallel; groups run sequentially."""
    groups: list[list[ToolCall]] = field(default_factory=list)
    requires_patient: bool = False
    clarification_needed: str | None = None

    def is_empty(self) -> bool:
        return not self.groups and not self.clarification_needed


def build_dispatch_plan(slots: ExtractedSlots, state: AgentState) -> DispatchPlan:
    """
    Pure function: given extracted slots + current session state,
    return a DispatchPlan that describes which tools to call.

    Rules:
    - Group 0 (parallel): all independent reads needed to fill missing data
    - Group 1 (sequential after group 0): the commit action (book/cancel/reschedule)
    - If confidence < 0.4: return clarification_needed
    - If required slots still missing after plan: return clarification_needed
    """
    if slots.needs_clarification:
        return DispatchPlan(clarification_needed="Mình chưa rõ bạn muốn làm gì. Bạn nói rõ hơn giúp mình nhé.")

    plan = DispatchPlan()

    if slots.intent == "book":
        plan.requires_patient = True
        parallel_reads: list[ToolCall] = []
        # Fetch clinic list if no clinic resolved yet
        if not state.slots.clinic_id and not slots.clinic_hint:
            parallel_reads.append(ToolCall("list_clinics", {}))
        # Fetch specialty list if specialty needed and not resolved
        if not state.slots.specialty_id and slots.specialty:
            parallel_reads.append(ToolCall("list_specialties", {
                "clinic_id": state.slots.clinic_id,
            } if state.slots.clinic_id else {}))
        # Fetch schedules if we have specialty or doctor
        if state.slots.specialty_id or state.slots.doctor_id:
            sched_args: dict[str, Any] = {}
            if state.slots.clinic_id:
                sched_args["clinic_id"] = state.slots.clinic_id
            if state.slots.specialty_id:
                sched_args["specialty_id"] = state.slots.specialty_id
            if state.slots.doctor_id:
                sched_args["doctor_id"] = state.slots.doctor_id
            if state.slots.preferred_date:
                sched_args["work_date"] = state.slots.preferred_date
            parallel_reads.append(ToolCall("list_doctor_schedules", sched_args))
        if parallel_reads:
            plan.groups.append(parallel_reads)

    elif slots.intent == "cancel":
        plan.requires_patient = True
        if not state.slots.appointment_code and not state.slots.appointment_id:
            if state.patient_id:
                plan.groups.append([
                    ToolCall("get_patient_appointments", {"patient_id": state.patient_id})
                ])
            else:
                plan.clarification_needed = "Bạn cần đăng nhập để mình có thể xem lịch hẹn."
        elif state.slots.appointment_code and not state.slots.appointment_id:
            plan.groups.append([
                ToolCall("get_appointment_by_code", {"code": state.slots.appointment_code})
            ])

    elif slots.intent == "reschedule":
        plan.requires_patient = True
        if not state.slots.appointment_id:
            if state.patient_id:
                plan.groups.append([
                    ToolCall("get_patient_appointments", {"patient_id": state.patient_id})
                ])
            else:
                plan.clarification_needed = "Bạn cần đăng nhập để mình có thể đổi lịch hẹn."

    elif slots.intent == "lookup":
        plan.requires_patient = True
        if state.patient_id:
            plan.groups.append([
                ToolCall("get_patient_appointments", {"patient_id": state.patient_id})
            ])
        else:
            plan.clarification_needed = "Bạn cần đăng nhập để mình có thể xem lịch hẹn."

    elif slots.intent == "info":
        parallel_reads = []
        if slots.clinic_hint and not state.slots.clinic_id:
            parallel_reads.append(ToolCall("list_clinics", {}))
        if slots.specialty and not state.slots.specialty_id:
            parallel_reads.append(ToolCall("list_specialties", {}))
        if parallel_reads:
            plan.groups.append(parallel_reads)

    elif slots.intent == "reminder":
        plan.requires_patient = True
        if state.slots.appointment_id:
            plan.groups.append([
                ToolCall("send_reminder", {"appointment_id": state.slots.appointment_id})
            ])
        else:
            plan.clarification_needed = "Mình cần biết lịch hẹn nào để gửi nhắc. Bạn cho mình biết nhé."

    return plan
```

### 2.3 Wire up in `src/graph.py`

Add a new entry point `run_turn_v2` to `BookingAgentGraph` that uses the two-phase pipeline. Keep `run_turn` (v1 ReACT) intact as fallback.

```python
async def run_turn_v2(
    self,
    state: AgentState,
    message: str,
    slot_extractor: Any,  # SlotExtractor instance
    current_date_iso: str,
) -> TurnResult:
    """
    Two-phase pipeline entry point.
    Phase 1: slot extraction (LLM, no tools).
    Phase 2: parallel tool dispatch based on slots.
    Falls back to run_turn (ReACT) when confidence is low or dispatcher plan is empty.
    """
    from .dispatcher import build_dispatch_plan
    record_recent_turn(state, "user", message)

    safety = detect_safety_risk(message)
    if safety.blocked:
        reply = (
            "Triệu chứng bạn mô tả có dấu hiệu khẩn cấp. "
            "Bạn nên liên hệ cơ sở y tế gần nhất hoặc số cấp cứu thay vì đặt lịch thường."
        )
        record_recent_turn(state, "assistant", reply)
        return TurnResult(reply=reply, metadata={"safety_blocked": safety.reason})

    # Check structured confirmation first (same as v1)
    confirmation = detect_confirmation(message)
    if state.pending_confirmation is not None:
        result = await self._handle_pending_confirmation(state, confirmation, message)
        record_recent_turn(state, "assistant", result.reply)
        return result

    # Phase 1: extract slots
    try:
        extracted = await slot_extractor.extract(
            message,
            recent_turns=state.recent_turns,
            current_date_iso=current_date_iso,
        )
    except Exception:
        # Phase 1 failed — fall back to ReACT
        result = await self._run_turn(state, message)
        record_recent_turn(state, "assistant", result.reply)
        return result

    # Merge extracted text hints into state.slots (no UUID injection)
    self._merge_text_hints(state, extracted)

    # Phase 2: build and execute dispatch plan
    plan = build_dispatch_plan(extracted, state)

    if plan.clarification_needed:
        reply = plan.clarification_needed
        record_recent_turn(state, "assistant", reply)
        return TurnResult(reply=reply, metadata={"clarification_requested": True})

    if plan.is_empty():
        # No tools needed — fall back to ReACT for LLM-generated answer
        result = await self._run_turn(state, message)
        record_recent_turn(state, "assistant", result.reply)
        return result

    # Execute tool groups
    all_tool_calls: list[str] = []
    for group in plan.groups:
        tasks = [
            self.tool_registry.execute(tc.name, tc.arguments)
            for tc in group
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for tc, obs in zip(group, results):
            all_tool_calls.append(tc.name)
            if isinstance(obs, Exception):
                reply = compose_backend_error_reply(str(obs))
                record_recent_turn(state, "assistant", reply)
                return TurnResult(
                    reply=reply,
                    metadata={"backend_error": str(obs), "tool_execution_failed": tc.name},
                    tool_calls=all_tool_calls,
                )
            state.observations.append({"tool": tc.name, "result": obs})
            read_result = self._handle_read_observation(state, tc.name, obs)
            if read_result is not None:
                record_recent_turn(state, "assistant", read_result.reply)
                read_result.tool_calls = all_tool_calls
                return read_result

    # After all reads: check if we can now commit
    commit_result = await self._maybe_commit_from_slots(state, extracted, all_tool_calls)
    if commit_result is not None:
        record_recent_turn(state, "assistant", commit_result.reply)
        return commit_result

    # Still missing info — ask for the first missing slot
    if extracted.missing_slots:
        slot_questions = {
            "specialty": "Bạn muốn khám chuyên khoa nào?",
            "date": "Bạn muốn đặt ngày nào?",
            "time": "Bạn muốn đặt giờ nào?",
            "doctor": "Bạn muốn gặp bác sĩ nào?",
            "clinic": "Bạn muốn đến phòng khám nào?",
            "appointment_ref": "Bạn cho mình biết lịch hẹn nào cần thao tác nhé?",
        }
        question = slot_questions.get(extracted.missing_slots[0], "Bạn cần thêm thông tin gì không?")
        record_recent_turn(state, "assistant", question)
        return TurnResult(reply=question, metadata={"missing_slot": extracted.missing_slots[0]})

    reply = compose_missing_detail_reply()
    record_recent_turn(state, "assistant", reply)
    return TurnResult(reply=reply, metadata={"stop_reason": "no_actionable_plan"})

@staticmethod
def _merge_text_hints(state: AgentState, slots: ExtractedSlots) -> None:
    """
    Merge text-level hints from slot extractor into WorkflowSlots.
    Only fills label fields (not ID fields) — IDs come from tool responses only.
    """
    if slots.date_hint and not state.slots.preferred_date:
        # Only store if it looks like a concrete date (YYYY-MM-DD), not "thứ 2 tuần sau"
        import re
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", slots.date_hint or ""):
            state.slots.preferred_date = slots.date_hint
    if slots.time_hint and not state.slots.preferred_time:
        import re
        if re.fullmatch(r"\d{2}:\d{2}", slots.time_hint or ""):
            state.slots.preferred_time = slots.time_hint

async def _maybe_commit_from_slots(
    self,
    state: AgentState,
    extracted: ExtractedSlots,
    tool_calls: list[str],
) -> TurnResult | None:
    """Return a pending-confirmation TurnResult if all required slots are present, else None."""
    if extracted.intent == "book":
        if state.slots.schedule_id and state.patient_id:
            payload: dict[str, Any] = {
                "patient_id": state.patient_id,
                "created_by": state.patient_id,
            }
            if state.slots.doctor_id:
                payload["doctor_id"] = state.slots.doctor_id
            if state.slots.specialty_id:
                payload["specialty_id"] = state.slots.specialty_id
            if state.slots.clinic_id:
                payload["clinic_id"] = state.slots.clinic_id
            if state.slots.preferred_date:
                payload["appointment_date"] = state.slots.preferred_date
            if state.slots.preferred_time:
                payload["appointment_time"] = state.slots.preferred_time
            operation = "book_by_doctor" if state.slots.doctor_id else "book_by_specialty"
            self._remember_booking_slots(state, operation, payload)
            from uuid import uuid4
            from datetime import timedelta
            from .state import PendingConfirmation
            confirmation_id = f"confirm-{uuid4()}"
            now = utc_now()
            state.pending_confirmation = PendingConfirmation(
                confirmation_id=confirmation_id,
                operation=operation,
                summary=f"Đặt lịch {state.slots.preferred_date} {state.slots.preferred_time}".strip(),
                created_at=now,
                expires_at=now + timedelta(minutes=2),
                idempotency_key=f"{state.session_id}:{confirmation_id}:{operation}",
                payload=payload,
            )
            return TurnResult(
                reply=compose_pending_booking_confirmation(
                    operation, payload,
                    display_labels={
                        "doctor": state.slots.doctor_label,
                        "clinic": state.slots.clinic_label,
                        "specialty": state.slots.specialty_label,
                    },
                ),
                metadata={"pending_confirmation_created": True},
                tool_calls=tool_calls,
                pending_mutation=True,
            )
    return None

async def _handle_pending_confirmation(
    self,
    state: AgentState,
    confirmation: Any,
    message: str,
) -> TurnResult:
    """Extracted from _run_turn for reuse in run_turn_v2."""
    from .guards import ConfirmationDecision
    pending = state.pending_confirmation
    assert pending is not None

    if pending.is_expired(utc_now()):
        state.pending_confirmation = None
        return TurnResult(
            reply="Cửa sổ xác nhận đã hết hạn. Mình có thể tạo lại xác nhận nếu bạn vẫn muốn tiếp tục.",
            metadata={"pending_confirmation_expired": True},
        )
    if confirmation == ConfirmationDecision.REJECTED:
        state.pending_confirmation = None
        return TurnResult(
            reply="Mình đã hủy yêu cầu đang chờ xác nhận.",
            metadata={"pending_confirmation_rejected": True},
        )
    if confirmation == ConfirmationDecision.AMBIGUOUS:
        return TurnResult(
            reply="Mình đang có một yêu cầu chờ xử lý. Bạn vui lòng xác nhận rõ là đồng ý hay không nhé.",
            metadata={"confirmation_status": "ambiguous"},
            pending_mutation=True,
        )
    if not pending.consume():
        return TurnResult(
            reply="Yêu cầu này đã được xử lý trước đó.",
            metadata={"mutation_committed": False, "duplicate_confirmation": True},
        )
    try:
        result = await self.tool_registry.execute(
            pending.operation, pending.payload, idempotency_key=pending.idempotency_key
        )
    except RuntimeError as error:
        state.pending_confirmation = None
        return TurnResult(
            reply=compose_backend_error_reply(str(error)),
            metadata={"mutation_committed": False, "mutation_attempted": True, "backend_error": str(error)},
            tool_calls=[pending.operation],
        )
    return TurnResult(
        reply=compose_mutation_success(result),
        metadata={"mutation_committed": True, "mutation_attempted": True},
        tool_calls=[pending.operation],
    )
```

---

## Stream 3 — Structured Confirmation API

### 3.1 Update `src/schemas.py`

```python
class ConfirmationWidget(BaseModel):
    """
    Structured confirmation payload for frontend button rendering.
    Frontend should render Confirm / Cancel buttons instead of free-text input.
    """
    confirm_token: str          # opaque token — frontend echoes back as confirmed=true/false
    operation: str              # "book_by_doctor" | "cancel_appointment" | "reschedule_appointment"
    summary_text: str           # Human-readable summary for display
    expires_at: str             # ISO 8601 datetime string


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    retryable: bool = False
    error_code: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    # Structured confirmation — present when pending_mutation=True
    confirmation: ConfirmationWidget | None = None


class ChatRequest(BaseModel):
    session_id: str = Field(min_length=1)
    message: str = Field(min_length=1)
    # Optional: frontend echoes confirm_token + confirmed=True/False when user presses a button.
    # When provided, message field is ignored for confirmation logic.
    confirm_token: str | None = None
    confirmed: bool | None = None
```

### 3.2 Update `/chat` endpoint in `src/main.py`

Add confirmation widget population to the response:

```python
@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    x_patient_id: str | None = Header(default=None),
) -> ChatResponse:
    ...
    # After result = await runtime_graph.run_turn(state, request.message):
    confirmation_widget = None
    if result.pending_mutation and state.pending_confirmation is not None:
        pc = state.pending_confirmation
        confirmation_widget = ConfirmationWidget(
            confirm_token=pc.confirmation_id,
            operation=pc.operation,
            summary_text=pc.summary,
            expires_at=pc.expires_at.isoformat(),
        )
    return ChatResponse(
        session_id=request.session_id,
        reply=result.reply,
        metadata=metadata,
        confirmation=confirmation_widget,
    )
```

Also handle incoming `confirm_token` + `confirmed` from frontend:

```python
# Before calling runtime_graph.run_turn:
if request.confirm_token is not None and request.confirmed is not None:
    # Structured button press — synthesise a deterministic message
    if request.confirmed:
        synthesised_message = "xác nhận"
    else:
        synthesised_message = "không đồng ý"
    effective_message = synthesised_message
else:
    effective_message = request.message
result = await runtime_graph.run_turn(state, effective_message)
```

---

## Stream 4 — Session Patient Profile + Security Guardrails

### 4.1 New module: `src/session_context.py`

**NEVER inject patient PII from user message. All patient data comes from the authenticated session token.**

```python
"""
session_context.py — Extract patient context from authenticated session headers.

Security contract:
- Patient identity (patient_id, display_name, phone) is ONLY sourced from
  the X-Patient-Id header (set by gateway after JWT verification) and
  X-Patient-Profile header (optional, gateway-signed JSON).
- The chatbot NEVER asks the user to type their patient_id, phone, or name.
- patient_id must be a valid UUID v4 — reject all other shapes.
- display_name and phone are used for display only, never for API lookups.
- Phone number is masked in all logs and LLM prompts: 09*****678.
"""
from __future__ import annotations

import re
from dataclasses import dataclass


UUID_RE = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-"
    r"[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
)
PHONE_RE = re.compile(r"(\d{2,3})(\d{3,5})(\d{3,4})")


def validate_patient_id(value: str | None) -> str | None:
    """Return value if it is a valid UUID v4, else None."""
    if value and UUID_RE.match(value.strip()):
        return value.strip()
    return None


def mask_phone(phone: str) -> str:
    """Replace middle digits with asterisks: 0912345678 → 091*****78"""
    m = PHONE_RE.match(phone.strip())
    if not m:
        return "***"
    prefix, middle, suffix = m.groups()
    return f"{prefix}{'*' * len(middle)}{suffix}"


@dataclass(frozen=True)
class PatientContext:
    patient_id: str
    display_name: str | None = None   # for UI display only, not for API calls
    masked_phone: str | None = None   # always masked — never raw phone in context


def extract_patient_context(
    x_patient_id: str | None,
    x_patient_name: str | None = None,
    x_patient_phone: str | None = None,
) -> PatientContext | None:
    """
    Build PatientContext from gateway-provided headers.
    Returns None if patient_id is absent or invalid.

    Headers set by API gateway after JWT verification:
      X-Patient-Id:    UUID v4 of the authenticated patient
      X-Patient-Name:  Display name (optional)
      X-Patient-Phone: Raw phone number (optional — will be masked here)
    """
    validated_id = validate_patient_id(x_patient_id)
    if not validated_id:
        return None
    masked = mask_phone(x_patient_phone) if x_patient_phone else None
    return PatientContext(
        patient_id=validated_id,
        display_name=x_patient_name or None,
        masked_phone=masked,
    )
```

### 4.2 Add `PatientProfile` to `AgentState` (`src/state.py`)

```python
class PatientProfile(BaseModel):
    """
    Read-only session data — set once from gateway headers, never from user input.
    display_name and masked_phone are safe for inclusion in LLM system prompt.
    Raw phone/email are never stored here.
    """
    patient_id: str
    display_name: str | None = None
    masked_phone: str | None = None


class AgentState(BaseModel):
    ...
    profile: PatientProfile | None = None   # set from session, read-only after init
```

### 4.3 Update `/chat` in `src/main.py`

```python
from .session_context import extract_patient_context

@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    x_patient_id: str | None = Header(default=None),
    x_patient_name: str | None = Header(default=None),
    x_patient_phone: str | None = Header(default=None),
) -> ChatResponse:
    ...
    patient_ctx = extract_patient_context(x_patient_id, x_patient_name, x_patient_phone)
    state = await _maybe_await(runtime_store.get(request.session_id))
    if patient_ctx:
        state.patient_id = patient_ctx.patient_id
        # Only update profile if not already set (prevent mid-session overwrite)
        if state.profile is None:
            from .state import PatientProfile
            state.profile = PatientProfile(
                patient_id=patient_ctx.patient_id,
                display_name=patient_ctx.display_name,
                masked_phone=patient_ctx.masked_phone,
            )
    ...
```

### 4.4 Inject display name in system prompt (`src/llm_client.py`)

In `_payload`, replace the current `trusted_patient_id` line:

```python
# Replace:
f"trusted_patient_id={state.patient_id or ''}\n\n"

# With:
f"trusted_patient_id={state.patient_id or ''}; "
f"patient_display={getattr(getattr(state, 'profile', None), 'display_name', '') or ''}; "
f"patient_phone_masked={getattr(getattr(state, 'profile', None), 'masked_phone', '') or ''}\n\n"
```

The display name and masked phone allow the agent to greet the patient by name and reference their phone number for display — without exposing raw PII.

---

## Stream 5 — Metrics Evaluation Framework

### 5.1 New evaluation script `scripts/run_metrics_eval.py`

Create a new evaluation script that measures the metrics below, separate from the existing `run_vietnamese_agent_eval.py`. The two scripts can run in parallel.

**Metrics to implement** (justified by τ-bench, CONFETTI, ATOD papers):

| Metric | Definition | How to compute |
|--------|-----------|----------------|
| **TCR** (Task Completion Rate) | % sessions where final DB state matches intent | Check EMR after each session: appointment created/cancelled/rescheduled |
| **AT@success** (Avg Turns to Completion) | Avg number of user turns in successful sessions | Count user turns in sessions where TCR=true |
| **SER** (Slot Error Rate) | % of booking attempts with wrong date/doctor/specialty | Compare booking payload with what user asked |
| **Pass@k** | % of scenarios passing in all k runs (consistency) | Run each scenario k=3 times, count fully-consistent |
| **Abandonment Rate** | % sessions ending without completing intent | Sessions with no mutation and >4 turns |
| **Re-ask Rate** | Avg times bot asked for same slot type per session | Count duplicate slot questions in assistant turns |
| **Tool Precision** | % of tool calls that were necessary | (necessary_calls / total_calls) per scenario |
| **Confirmation Bypass Rate** | % of mutations without explicit confirmation | Should be 0 — flag if any pending skipped |

```python
#!/usr/bin/env python3
"""
run_metrics_eval.py — Compute TOD quality metrics for the booking agent.

Usage:
    python3 scripts/run_metrics_eval.py \
        --agent-url http://127.0.0.1:8020 \
        --emr-url http://127.0.0.1:8082 \
        --patient-id <uuid> \
        --dataset artifacts/metrics/metrics_scenarios.jsonl \
        --runs-per-scenario 3 \
        --output-dir artifacts/metrics/results/

Scenario JSONL format (one JSON per line):
{
  "scenario_id": "m-001",
  "intent": "book",
  "turns": ["Tôi muốn đặt lịch niềng răng ngày mai buổi chiều", "Xác nhận"],
  "expected_intent": "book",
  "expected_outcome": {"status": "scheduled"},  // check in EMR after run
  "expected_max_turns": 3,
  "expected_tools_necessary": ["list_clinics", "list_doctor_schedules", "book_by_specialty"]
}
"""
```

**Scenario file schema** — create `artifacts/metrics/metrics_scenarios.jsonl` with at minimum 1 scenario per intent type:

```json
{"scenario_id": "m-book-001", "intent": "book", "expected_intent": "book", "expected_max_turns": 4, "turns": ["Tôi muốn đặt lịch niềng răng tuần sau buổi sáng", "Lịch đầu tiên đi", "Xác nhận"], "expected_outcome": {"status": "scheduled"}, "expected_tools_necessary": ["list_doctor_schedules", "book_by_specialty"]}
{"scenario_id": "m-cancel-001", "intent": "cancel", "expected_intent": "cancel", "expected_max_turns": 3, "turns": ["Hủy lịch hẹn của tôi", "Lịch số 1", "Xác nhận hủy"], "expected_outcome": {"status": "cancelled"}, "expected_tools_necessary": ["get_patient_appointments", "cancel_appointment"]}
{"scenario_id": "m-reschedule-001", "intent": "reschedule", "expected_intent": "reschedule", "expected_max_turns": 4, "turns": ["Đổi lịch hẹn sang ngày mai lúc 3 giờ chiều", "Lịch đầu tiên", "Xác nhận đổi"], "expected_outcome": {"status": "scheduled"}, "expected_tools_necessary": ["get_patient_appointments", "reschedule_appointment"]}
{"scenario_id": "m-lookup-001", "intent": "lookup", "expected_intent": "lookup", "expected_max_turns": 2, "turns": ["Cho tôi xem lịch hẹn của mình"], "expected_outcome": null, "expected_tools_necessary": ["get_patient_appointments"]}
{"scenario_id": "m-info-001", "intent": "info", "expected_intent": "info", "expected_max_turns": 2, "turns": ["Phòng khám Quận 1 ở đâu?"], "expected_outcome": null, "expected_tools_necessary": ["list_clinics"]}
{"scenario_id": "m-ambiguous-001", "intent": "unknown", "expected_intent": "unknown", "expected_max_turns": 2, "turns": ["Xin chào"], "expected_outcome": null, "expected_tools_necessary": []}
```

### 5.2 Metrics output format

The script must write `artifacts/metrics/results/run_<timestamp>/summary.json`:

```json
{
  "run_id": "...",
  "timestamp": "2026-06-17T...",
  "scenarios_total": 6,
  "tcr": 0.83,
  "at_success": 2.4,
  "pass_k": {"k": 3, "rate": 0.67},
  "abandonment_rate": 0.0,
  "confirmation_bypass_rate": 0.0,
  "tool_precision": 0.91,
  "per_scenario": [...]
}
```

---

## Validation Rules (enforce in all new code)

These rules apply to every new tool, endpoint, and module:

### Input validation
- `patient_id` — must match UUID v4 regex; reject with 400 if invalid shape
- `appointment_id` — must match UUID v4 regex
- `appointment_date` — must match `^\d{4}-\d{2}-\d{2}$`; reject dates more than 365 days in the future
- `appointment_time` — must match `^\d{2}:\d{2}$`; hours 00–23, minutes 00–59
- `specialty_id`, `doctor_id`, `clinic_id` — all UUIDs
- `message` in ChatRequest — max 2000 characters; reject if exceeds
- No UUID in user-provided `message` field is ever used directly as an API argument — UUIDs only from tool responses stored in session state

### Security guardrails
- Patient profile (name, phone) comes **only** from gateway headers — never from user message body
- Phone numbers are always masked before storage in AgentState or LLM prompt
- Ownership check on cancel: `observation["patient_id"] == state.patient_id` (already in graph.py — keep it)
- Ownership check on reschedule: same pattern — verify `appointment.patient_id == state.patient_id` before creating pending confirmation
- `ResponsePostCheck` runs on all LLM answer responses — no invented UUIDs or APT codes in replies
- Rate limit on pending confirmations: if `state.pending_confirmation` already exists and has not expired, block new mutation requests with "Bạn đang có yêu cầu chờ xác nhận."

### Idempotency
- All mutation tools (`book_by_doctor`, `book_by_specialty`, `cancel_appointment`, `reschedule_appointment`, `send_reminder`) must include `idempotency_key` from `PendingConfirmation.idempotency_key`
- Pattern for `reschedule_appointment`: `f"{session_id}:{confirmation_id}:reschedule_appointment"`

---

## Tests

All new tests go in `tests/`. Run with `python3 -m pytest tests/ -q`.

### `tests/test_new_tools.py`

```python
"""Tests for the 5 new tools: arg validation, registry dispatch, graph handlers."""
import pytest
from unittest.mock import AsyncMock, MagicMock
from src.tools import (
    RescheduleAppointmentArgs,
    ListDoctorsBySpecialtyArgs,
    GetDoctorLeavesArgs,
    SendReminderArgs,
    GetAppointmentByIdArgs,
    ToolRegistry,
)
from src.emr_client import ClinicalEmrClient


# --- Arg validation ---

def test_reschedule_rejects_non_uuid_appointment_id():
    with pytest.raises(Exception):
        RescheduleAppointmentArgs(appointment_id="not-a-uuid")


def test_reschedule_rejects_bad_date_format():
    with pytest.raises(Exception):
        RescheduleAppointmentArgs(
            appointment_id="11111111-1111-4111-8111-111111111111",
            appointment_date="17/06/2026",   # wrong format
        )


def test_reschedule_rejects_bad_time_format():
    with pytest.raises(Exception):
        RescheduleAppointmentArgs(
            appointment_id="11111111-1111-4111-8111-111111111111",
            appointment_time="2pm",   # wrong format
        )


def test_reschedule_accepts_valid_args():
    args = RescheduleAppointmentArgs(
        appointment_id="11111111-1111-4111-8111-111111111111",
        appointment_date="2026-07-01",
        appointment_time="14:00",
    )
    assert args.appointment_date == "2026-07-01"


def test_list_doctors_by_specialty_rejects_non_uuid():
    with pytest.raises(Exception):
        ListDoctorsBySpecialtyArgs(specialty_id="nieng-rang")


def test_get_doctor_leaves_accepts_optional_dates():
    args = GetDoctorLeavesArgs(
        doctor_id="22222222-2222-4222-8222-222222222222",
        from_date="2026-07-01",
    )
    assert args.to_date is None


# --- Registry dispatch ---

@pytest.mark.asyncio
async def test_registry_dispatches_reschedule():
    mock_client = AsyncMock(spec=ClinicalEmrClient)
    mock_client.reschedule_appointment.return_value = {"appointment_id": "11111111-1111-4111-8111-111111111111"}
    registry = ToolRegistry(mock_client)
    result = await registry.execute(
        "reschedule_appointment",
        {
            "appointment_id": "11111111-1111-4111-8111-111111111111",
            "appointment_date": "2026-07-01",
            "appointment_time": "15:00",
        },
    )
    mock_client.reschedule_appointment.assert_awaited_once()
    assert result["appointment_id"] == "11111111-1111-4111-8111-111111111111"


@pytest.mark.asyncio
async def test_registry_dispatches_list_doctors_by_specialty():
    mock_client = AsyncMock(spec=ClinicalEmrClient)
    mock_client.list_doctors_by_specialty.return_value = [
        {"doctor_id": "22222222-2222-4222-8222-222222222222", "doctor_name": "BS. Nguyễn A"}
    ]
    registry = ToolRegistry(mock_client)
    result = await registry.execute(
        "list_doctors_by_specialty",
        {"specialty_id": "33333333-3333-4333-8333-333333333333"},
    )
    mock_client.list_doctors_by_specialty.assert_awaited_once_with(
        "33333333-3333-4333-8333-333333333333"
    )
    assert len(result) == 1


@pytest.mark.asyncio
async def test_registry_dispatches_send_reminder():
    mock_client = AsyncMock(spec=ClinicalEmrClient)
    mock_client.send_appointment_reminder.return_value = {"sent": True}
    registry = ToolRegistry(mock_client)
    result = await registry.execute(
        "send_reminder",
        {"appointment_id": "11111111-1111-4111-8111-111111111111"},
    )
    mock_client.send_appointment_reminder.assert_awaited_once_with(
        "11111111-1111-4111-8111-111111111111"
    )
```

### `tests/test_slot_extractor.py`

```python
"""Unit tests for SlotExtractor parsing and schema compliance."""
import pytest
from src.slot_extractor import ExtractedSlots, SlotExtractor, SLOT_OUTPUT_SCHEMA
import jsonschema


def test_extracted_slots_from_dict_full():
    data = {
        "intent": "book",
        "confidence": 0.9,
        "specialty": "niềng răng",
        "date_hint": "2026-07-01",
        "time_hint": "14:00",
        "missing_slots": [],
    }
    slots = ExtractedSlots.from_dict(data)
    assert slots.intent == "book"
    assert slots.is_actionable is True
    assert slots.needs_clarification is False


def test_extracted_slots_low_confidence_needs_clarification():
    data = {"intent": "unknown", "confidence": 0.2, "missing_slots": ["specialty", "date"]}
    slots = ExtractedSlots.from_dict(data)
    assert slots.needs_clarification is True
    assert slots.is_actionable is False


def test_slot_output_schema_is_valid_json_schema():
    # Schema itself should be a valid JSON Schema
    jsonschema.Draft7Validator.check_schema(SLOT_OUTPUT_SCHEMA)


def test_slot_output_validates_valid_data():
    data = {
        "intent": "cancel",
        "confidence": 0.85,
        "missing_slots": ["appointment_ref"],
    }
    jsonschema.validate(data, SLOT_OUTPUT_SCHEMA)


def test_slot_output_rejects_invalid_intent():
    data = {"intent": "fly_to_moon", "confidence": 0.5, "missing_slots": []}
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(data, SLOT_OUTPUT_SCHEMA)


def test_slot_output_rejects_confidence_out_of_range():
    data = {"intent": "book", "confidence": 1.5, "missing_slots": []}
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(data, SLOT_OUTPUT_SCHEMA)
```

### `tests/test_dispatcher.py`

```python
"""Unit tests for ActionDispatcher plan building logic."""
import pytest
from src.dispatcher import build_dispatch_plan, DispatchPlan
from src.slot_extractor import ExtractedSlots
from src.state import AgentState, WorkflowSlots


def _state(patient_id: str | None = None, **slot_kwargs) -> AgentState:
    state = AgentState(session_id="test-session")
    state.patient_id = patient_id
    for k, v in slot_kwargs.items():
        setattr(state.slots, k, v)
    return state


def test_book_intent_no_slots_triggers_clinic_discovery():
    slots = ExtractedSlots(intent="book", confidence=0.9, missing_slots=["specialty", "date"])
    state = _state(patient_id="11111111-1111-4111-8111-111111111111")
    plan = build_dispatch_plan(slots, state)
    assert not plan.clarification_needed
    tool_names = [tc.name for group in plan.groups for tc in group]
    assert "list_clinics" in tool_names


def test_cancel_intent_no_appointment_triggers_lookup():
    slots = ExtractedSlots(intent="cancel", confidence=0.9, missing_slots=["appointment_ref"])
    state = _state(patient_id="11111111-1111-4111-8111-111111111111")
    plan = build_dispatch_plan(slots, state)
    assert not plan.clarification_needed
    tool_names = [tc.name for group in plan.groups for tc in group]
    assert "get_patient_appointments" in tool_names


def test_cancel_intent_no_patient_returns_clarification():
    slots = ExtractedSlots(intent="cancel", confidence=0.9, missing_slots=["appointment_ref"])
    state = _state(patient_id=None)
    plan = build_dispatch_plan(slots, state)
    assert plan.clarification_needed is not None


def test_low_confidence_returns_clarification():
    slots = ExtractedSlots(intent="unknown", confidence=0.1, missing_slots=[])
    state = _state(patient_id="11111111-1111-4111-8111-111111111111")
    plan = build_dispatch_plan(slots, state)
    assert plan.clarification_needed is not None


def test_book_with_specialty_resolved_adds_schedules():
    slots = ExtractedSlots(intent="book", confidence=0.9, missing_slots=["date"])
    state = _state(
        patient_id="11111111-1111-4111-8111-111111111111",
        specialty_id="33333333-3333-4333-8333-333333333333",
        clinic_id="44444444-4444-4444-8444-444444444444",
    )
    plan = build_dispatch_plan(slots, state)
    tool_names = [tc.name for group in plan.groups for tc in group]
    assert "list_doctor_schedules" in tool_names


def test_reminder_without_appointment_returns_clarification():
    slots = ExtractedSlots(intent="reminder", confidence=0.9, missing_slots=["appointment_ref"])
    state = _state(patient_id="11111111-1111-4111-8111-111111111111")
    plan = build_dispatch_plan(slots, state)
    assert plan.clarification_needed is not None


def test_lookup_without_patient_returns_clarification():
    slots = ExtractedSlots(intent="lookup", confidence=0.9, missing_slots=[])
    state = _state(patient_id=None)
    plan = build_dispatch_plan(slots, state)
    assert plan.clarification_needed is not None
```

### `tests/test_session_context.py`

```python
"""Tests for patient context extraction and PII guardrails."""
import pytest
from src.session_context import (
    validate_patient_id,
    mask_phone,
    extract_patient_context,
    PatientContext,
)


def test_validate_patient_id_accepts_uuid_v4():
    valid = "11111111-1111-4111-8111-111111111111"
    assert validate_patient_id(valid) == valid


def test_validate_patient_id_rejects_non_uuid():
    assert validate_patient_id("not-a-uuid") is None
    assert validate_patient_id("") is None
    assert validate_patient_id(None) is None


def test_validate_patient_id_rejects_uuid_v1():
    # UUID v1 has time-based structure — our validator requires v4 (4xxx)
    uuid_v1 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
    assert validate_patient_id(uuid_v1) is None


def test_mask_phone_masks_middle_digits():
    masked = mask_phone("0912345678")
    assert "0912345678" not in masked
    assert masked.startswith("091")
    assert "*" in masked


def test_mask_phone_handles_short_number():
    result = mask_phone("123")
    assert result is not None  # should not raise


def test_extract_patient_context_valid():
    ctx = extract_patient_context(
        x_patient_id="11111111-1111-4111-8111-111111111111",
        x_patient_name="Nguyễn Văn A",
        x_patient_phone="0912345678",
    )
    assert ctx is not None
    assert ctx.patient_id == "11111111-1111-4111-8111-111111111111"
    assert ctx.display_name == "Nguyễn Văn A"
    assert "0912345678" not in (ctx.masked_phone or "")
    assert ctx.masked_phone is not None


def test_extract_patient_context_invalid_id_returns_none():
    ctx = extract_patient_context(x_patient_id="invalid")
    assert ctx is None


def test_extract_patient_context_no_headers_returns_none():
    ctx = extract_patient_context(x_patient_id=None)
    assert ctx is None


def test_extract_patient_context_no_phone_is_fine():
    ctx = extract_patient_context(
        x_patient_id="11111111-1111-4111-8111-111111111111",
    )
    assert ctx is not None
    assert ctx.masked_phone is None
```

### `tests/test_structured_confirmation.py`

```python
"""Tests for structured confirmation widget generation."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from src.main import create_app
from src.state import AgentState, PendingConfirmation
from datetime import datetime, timedelta, timezone


def _make_pending(operation: str = "book_by_doctor") -> PendingConfirmation:
    now = datetime.now(timezone.utc)
    return PendingConfirmation(
        confirmation_id="confirm-test-123",
        operation=operation,
        summary="Đặt lịch ngày 2026-07-01 14:00",
        created_at=now,
        expires_at=now + timedelta(minutes=2),
        idempotency_key="session:confirm-test-123:book_by_doctor",
        payload={"patient_id": "11111111-1111-4111-8111-111111111111"},
    )


def test_chat_response_includes_confirmation_widget_when_pending():
    """When a turn results in pending_mutation=True, response.confirmation must be set."""
    mock_graph = MagicMock()
    from src.graph import TurnResult
    mock_graph.run_turn = AsyncMock(return_value=TurnResult(
        reply="Xác nhận để đặt lịch.",
        pending_mutation=True,
    ))
    mock_store = MagicMock()

    def make_state():
        state = AgentState(session_id="s1")
        state.patient_id = "11111111-1111-4111-8111-111111111111"
        state.pending_confirmation = _make_pending()
        return state

    mock_store.get = AsyncMock(side_effect=lambda _: make_state())
    mock_store.save = AsyncMock()
    mock_lock = MagicMock()
    mock_lease = MagicMock()
    mock_lease.acquired = True
    mock_lease.release = AsyncMock()
    mock_lock.acquire = AsyncMock(return_value=mock_lease)

    app = create_app(graph=mock_graph, state_store=mock_store, session_lock=mock_lock)
    client = TestClient(app)
    resp = client.post(
        "/chat",
        json={"session_id": "s1", "message": "Đặt lịch"},
        headers={"x-patient-id": "11111111-1111-4111-8111-111111111111"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["confirmation"] is not None
    assert data["confirmation"]["operation"] == "book_by_doctor"
    assert data["confirmation"]["confirm_token"] == "confirm-test-123"


def test_chat_response_no_confirmation_when_not_pending():
    mock_graph = MagicMock()
    from src.graph import TurnResult
    mock_graph.run_turn = AsyncMock(return_value=TurnResult(
        reply="Chào bạn!", pending_mutation=False
    ))
    mock_store = MagicMock()
    mock_store.get = AsyncMock(return_value=AgentState(session_id="s1"))
    mock_store.save = AsyncMock()
    mock_lock = MagicMock()
    mock_lease = MagicMock()
    mock_lease.acquired = True
    mock_lease.release = AsyncMock()
    mock_lock.acquire = AsyncMock(return_value=mock_lease)

    app = create_app(graph=mock_graph, state_store=mock_store, session_lock=mock_lock)
    client = TestClient(app)
    resp = client.post("/chat", json={"session_id": "s1", "message": "Xin chào"})
    assert resp.status_code == 200
    assert resp.json()["confirmation"] is None
```

---

## Execution Order for Codex

1. **Stream 1** — Add 5 new tools. Run `pytest tests/ -q` after. All existing tests must still pass.
2. **Stream 4** — session_context.py + PatientProfile. Run `pytest tests/test_session_context.py -q`.
3. **Stream 3** — ConfirmationWidget. Run `pytest tests/test_structured_confirmation.py -q`.
4. **Stream 2** — SlotExtractor + Dispatcher (no LLM call in tests — mock the HTTP client). Run `pytest tests/test_slot_extractor.py tests/test_dispatcher.py -q`.
5. **Stream 5** — metrics scenario file + eval script skeleton (does not need to run E2E in CI).
6. Final: `pytest tests/ -q` — all tests pass.

## Do NOT

- Do not hardcode any patient_id, UUID, appointment code, or phone number in source files — use env vars or test fixtures only.
- Do not inject patient name/phone from user message content.
- Do not remove or break existing guards.py logic — it stays as fallback for v1 ReACT path.
- Do not amend existing commits — create new commits.
- Do not add Claude as co-author in any commit.
