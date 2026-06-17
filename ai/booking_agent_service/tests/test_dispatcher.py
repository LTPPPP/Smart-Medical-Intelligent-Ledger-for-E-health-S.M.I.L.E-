"""Unit tests for ActionDispatcher plan building logic."""

from __future__ import annotations

import pytest

from src.dispatcher import build_dispatch_plan
from src.graph import BookingAgentGraph
from src.memory import Candidate, CandidateList
from src.slot_extractor import ExtractedSlots
from src.state import AgentState, utc_now


def _state(patient_id: str | None = None, **slot_kwargs) -> AgentState:
    state = AgentState(session_id="test-session")
    state.patient_id = patient_id
    for key, value in slot_kwargs.items():
        setattr(state.slots, key, value)
    return state


def _tool_names(plan) -> list[str]:
    return [tool_call.name for group in plan.groups for tool_call in group]


def test_book_intent_no_slots_triggers_clinic_discovery():
    slots = ExtractedSlots(intent="book", confidence=0.9, missing_slots=["specialty", "date"])
    state = _state(patient_id="11111111-1111-4111-8111-111111111111")

    plan = build_dispatch_plan(slots, state)

    assert plan.clarification_needed is None
    assert "list_clinics" in _tool_names(plan)


def test_book_with_existing_clinic_candidates_progresses_to_specialty_discovery():
    slots = ExtractedSlots(intent="book", confidence=0.9, missing_slots=["specialty"])
    state = _state(patient_id="11111111-1111-4111-8111-111111111111")
    state.candidates["clinic"] = CandidateList(
        kind="clinic",
        fetched_at=utc_now(),
        presented_at=utc_now(),
        ttl_seconds=600,
        items=[
            Candidate(
                id="44444444-4444-4444-8444-444444444444",
                label="S.M.I.L.E Quận 3",
                payload={"clinic_id": "44444444-4444-4444-8444-444444444444"},
            )
        ],
    )

    plan = build_dispatch_plan(slots, state)

    assert "list_clinics" not in _tool_names(plan)
    assert "list_specialties" in _tool_names(plan)


def test_cancel_intent_no_appointment_triggers_lookup():
    slots = ExtractedSlots(intent="cancel", confidence=0.9, missing_slots=["appointment_ref"])
    state = _state(patient_id="11111111-1111-4111-8111-111111111111")

    plan = build_dispatch_plan(slots, state)

    assert plan.clarification_needed is None
    assert "get_patient_appointments" in _tool_names(plan)


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

    assert "list_doctor_schedules" in _tool_names(plan)


def test_book_with_resolved_doctor_clinic_and_date_goes_directly_to_schedules():
    slots = ExtractedSlots(intent="book", confidence=0.9, missing_slots=[])
    state = _state(
        patient_id="11111111-1111-4111-8111-111111111111",
        doctor_id="22222222-2222-4222-8222-222222222222",
        clinic_id="44444444-4444-4444-8444-444444444444",
        preferred_date="2026-07-01",
    )

    plan = build_dispatch_plan(slots, state)

    assert [[call.name for call in group] for group in plan.groups] == [
        ["list_doctor_schedules"]
    ]
    assert plan.groups[0][0].arguments == {
        "clinic_id": "44444444-4444-4444-8444-444444444444",
        "doctor_id": "22222222-2222-4222-8222-222222222222",
        "work_date": "2026-07-01",
    }


def test_book_with_doctor_hint_and_specialty_lists_doctors_before_schedules():
    slots = ExtractedSlots(
        intent="book",
        confidence=0.9,
        doctor_hint="nguyen minh",
        missing_slots=[],
    )
    state = _state(
        patient_id="11111111-1111-4111-8111-111111111111",
        specialty_id="33333333-3333-4333-8333-333333333333",
        clinic_id="44444444-4444-4444-8444-444444444444",
        preferred_date="2026-07-01",
    )

    plan = build_dispatch_plan(slots, state)

    assert [[call.name for call in group] for group in plan.groups] == [
        ["list_doctors_by_specialty"]
    ]
    assert plan.groups[0][0].arguments == {
        "specialty_id": "33333333-3333-4333-8333-333333333333"
    }


def test_cancel_with_extracted_appointment_code_verifies_by_code():
    slots = ExtractedSlots(
        intent="cancel",
        confidence=0.9,
        appointment_ref="APT-20260701-ABCD",
        missing_slots=[],
    )
    state = _state(patient_id="11111111-1111-4111-8111-111111111111")

    plan = build_dispatch_plan(slots, state)

    assert _tool_names(plan) == ["get_appointment_by_code"]
    assert plan.groups[0][0].arguments == {"code": "APT-20260701-ABCD"}


def test_reminder_with_extracted_appointment_code_verifies_by_code():
    slots = ExtractedSlots(
        intent="reminder",
        confidence=0.9,
        appointment_ref="APT-20260701-ABCD",
        missing_slots=[],
    )
    state = _state(patient_id="11111111-1111-4111-8111-111111111111")

    plan = build_dispatch_plan(slots, state)

    assert _tool_names(plan) == ["get_appointment_by_code"]
    assert plan.groups[0][0].arguments == {"code": "APT-20260701-ABCD"}


def test_reschedule_with_extracted_appointment_code_verifies_by_code():
    slots = ExtractedSlots(
        intent="reschedule",
        confidence=0.9,
        appointment_ref="APT-20260701-ABCD",
        missing_slots=[],
    )
    state = _state(patient_id="11111111-1111-4111-8111-111111111111")

    plan = build_dispatch_plan(slots, state)

    assert _tool_names(plan) == ["get_appointment_by_code"]
    assert plan.groups[0][0].arguments == {"code": "APT-20260701-ABCD"}


def test_merge_text_hints_resolves_clinic_hint_from_existing_candidates():
    state = _state(patient_id="11111111-1111-4111-8111-111111111111")
    state.candidates["clinic"] = CandidateList(
        kind="clinic",
        fetched_at=utc_now(),
        ttl_seconds=600,
        items=[
            Candidate(
                index=1,
                id="44444444-4444-4444-8444-444444444444",
                label="S.M.I.L.E Quận 3",
                payload={
                    "clinic_id": "44444444-4444-4444-8444-444444444444",
                    "clinic_name": "S.M.I.L.E Quận 3",
                    "district": "Quận 3",
                },
            )
        ],
    )
    slots = ExtractedSlots(intent="book", confidence=0.9, clinic_hint="quận 3")

    BookingAgentGraph._merge_text_hints(state, slots)

    assert state.slots.clinic_id == "44444444-4444-4444-8444-444444444444"
    assert state.slots.clinic_label == "S.M.I.L.E Quận 3"


def test_merge_text_hints_resolves_specialty_hint_from_existing_candidates():
    state = _state(patient_id="11111111-1111-4111-8111-111111111111")
    state.candidates["specialty"] = CandidateList(
        kind="specialty",
        fetched_at=utc_now(),
        ttl_seconds=600,
        items=[
            Candidate(
                id="33333333-3333-4333-8333-333333333333",
                label="Implant nha khoa",
                payload={
                    "specialty_id": "33333333-3333-4333-8333-333333333333",
                    "specialty_name": "Implant nha khoa",
                    "specialty_code": "IMPLANT",
                },
            )
        ],
    )
    slots = ExtractedSlots(intent="book", confidence=0.9, specialty="implant")

    BookingAgentGraph._merge_text_hints(state, slots)

    assert state.slots.specialty_id == "33333333-3333-4333-8333-333333333333"
    assert state.slots.specialty_label == "Implant nha khoa"


def test_merge_text_hints_resolves_specialty_from_unique_description_token():
    state = _state(patient_id="11111111-1111-4111-8111-111111111111")
    state.candidates["specialty"] = CandidateList(
        kind="specialty",
        fetched_at=utc_now(),
        ttl_seconds=600,
        items=[
            Candidate(
                id="11111111-1111-4111-8111-111111111111",
                label="Nha khoa tổng quát",
                payload={
                    "specialty_id": "11111111-1111-4111-8111-111111111111",
                    "specialty_name": "Nha khoa tổng quát",
                    "description": "Khám và điều trị răng miệng tổng quát",
                },
            ),
            Candidate(
                id="22222222-2222-4222-8222-222222222222",
                label="Chỉnh nha",
                payload={
                    "specialty_id": "22222222-2222-4222-8222-222222222222",
                    "specialty_name": "Chỉnh nha",
                    "description": "Niềng răng, chỉnh hình răng",
                },
            ),
        ],
    )
    slots = ExtractedSlots(
        intent="book",
        confidence=0.9,
        specialty="Mình muốn gặp bác sĩ chuyên niềng, ai rảnh cũng được.",
    )

    BookingAgentGraph._merge_text_hints(state, slots)

    assert state.slots.specialty_id == "22222222-2222-4222-8222-222222222222"
    assert state.slots.specialty_label == "Chỉnh nha"


def test_merge_text_hints_resolves_doctor_hint_from_existing_candidates():
    state = _state(patient_id="11111111-1111-4111-8111-111111111111")
    state.candidates["doctor"] = CandidateList(
        kind="doctor",
        fetched_at=utc_now(),
        ttl_seconds=600,
        items=[
            Candidate(
                id="66666666-6666-4666-8666-666666666666",
                label="BS Nguyễn Minh",
                payload={
                    "doctor_id": "66666666-6666-4666-8666-666666666666",
                    "doctor_name": "BS Nguyễn Minh",
                    "full_name": "Nguyễn Minh",
                },
            )
        ],
    )
    slots = ExtractedSlots(intent="book", confidence=0.9, doctor_hint="nguyen minh")

    BookingAgentGraph._merge_text_hints(state, slots)

    assert state.slots.doctor_id == "66666666-6666-4666-8666-666666666666"
    assert state.slots.doctor_label == "BS Nguyễn Minh"


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


async def _noop_extract(*args, **kwargs):
    return ExtractedSlots(intent="reminder", confidence=0.9, missing_slots=[])


def _extractor():
    class Extractor:
        extract = staticmethod(_noop_extract)

    return Extractor()


async def _unused_execute(*args, **kwargs):
    raise AssertionError("send_reminder must wait for confirmation")


def _tools():
    class Tools:
        execute = staticmethod(_unused_execute)

    return Tools()


@pytest.mark.asyncio
async def test_run_turn_v2_reminder_creates_pending_confirmation_without_executing_tool():
    state = _state(
        patient_id="11111111-1111-4111-8111-111111111111",
        appointment_id="44444444-4444-4444-8444-444444444444",
    )
    graph = BookingAgentGraph(planner=None, tool_registry=_tools(), step_budget=1)

    result = await graph.run_turn_v2(
        state,
        "nhắc lịch giúp tôi",
        slot_extractor=_extractor(),
        current_date_iso="2026-06-17",
    )

    assert state.pending_confirmation is not None
    assert state.pending_confirmation.operation == "send_reminder"
    assert result.pending_mutation is True


# ---------------------------------------------------------------------------
# run_turn_v2 re-plan chain tests
# ---------------------------------------------------------------------------

_SPECIALTY_ID = "33333333-3333-4333-8333-333333333333"
_CLINIC_ID = "22222222-2222-4222-8222-222222222222"
_SCHEDULE_ID = "55555555-5555-4555-8555-555555555555"
_PATIENT_ID = "11111111-1111-4111-8111-111111111111"


def _make_specialty_candidates():
    return CandidateList(
        kind="specialty",
        fetched_at=utc_now(),
        presented_at=utc_now(),
        ttl_seconds=600,
        items=[
            Candidate(
                id=_SPECIALTY_ID,
                label="Tim mạch",
                payload={
                    "specialty_id": _SPECIALTY_ID,
                    "specialty_name": "Tim mạch",
                    "specialty_code": "CARDIOLOGY",
                },
            )
        ],
    )


def _make_schedule_list():
    return [
        {
            "schedule_id": _SCHEDULE_ID,
            "work_date": "2026-06-20",
            "start_time": "08:00",
            "end_time": "12:00",
            "status": "available",
        }
    ]


class _ToolRegistry:
    """Fake tool registry that tracks calls and returns canned responses."""

    def __init__(self, responses: dict):
        self.called: list[str] = []
        self._responses = responses

    async def execute(self, name: str, arguments: dict, **kwargs):
        self.called.append(name)
        if name not in self._responses:
            raise AssertionError(f"Unexpected tool call: {name}")
        return self._responses[name]


async def _book_extract(message, *, recent_turns, current_date_iso):
    return ExtractedSlots(
        intent="book",
        confidence=0.9,
        specialty="tim mach",
        missing_slots=["date", "time"],
    )


def _book_extractor():
    class Extractor:
        extract = staticmethod(_book_extract)

    return Extractor()


@pytest.mark.asyncio
async def test_run_turn_v2_chains_to_schedule_after_specialty_match():
    """After list_specialties runs and hint matches specialty_id, re-plan should
    emit list_doctor_schedules in the same turn without needing a second user message."""
    state = AgentState(session_id="test-session")
    state.patient_id = _PATIENT_ID

    tool_registry = _ToolRegistry(
        {
            "list_clinics": [],
            "list_specialties": [
                {
                    "specialty_id": _SPECIALTY_ID,
                    "specialty_name": "Tim mạch",
                    "specialty_code": "CARDIOLOGY",
                }
            ],
            "list_doctor_schedules": _make_schedule_list(),
        }
    )
    graph = BookingAgentGraph(planner=None, tool_registry=tool_registry, step_budget=3)

    result = await graph.run_turn_v2(
        state,
        "tôi muốn đặt lịch tim mạch",
        slot_extractor=_book_extractor(),
        current_date_iso="2026-06-17",
    )

    assert "list_doctor_schedules" in tool_registry.called, (
        f"Expected list_doctor_schedules to be called but got: {tool_registry.called}"
    )
    assert "Các lịch bác sĩ" in result.reply
    assert state.slots.specialty_id == _SPECIALTY_ID


@pytest.mark.asyncio
async def test_run_turn_v2_schedule_result_takes_precedence_over_specialty_list():
    """When both list_specialties and list_doctor_schedules run, the reply should
    reflect the schedule list (deepest result), not the intermediate specialty list."""
    state = AgentState(session_id="test-session")
    state.patient_id = _PATIENT_ID

    tool_registry = _ToolRegistry(
        {
            "list_clinics": [],
            "list_specialties": [
                {
                    "specialty_id": _SPECIALTY_ID,
                    "specialty_name": "Tim mạch",
                    "specialty_code": "CARDIOLOGY",
                }
            ],
            "list_doctor_schedules": _make_schedule_list(),
        }
    )
    graph = BookingAgentGraph(planner=None, tool_registry=tool_registry, step_budget=3)

    result = await graph.run_turn_v2(
        state,
        "đặt lịch tim mạch",
        slot_extractor=_book_extractor(),
        current_date_iso="2026-06-17",
    )

    assert "Các lịch bác sĩ" in result.reply
    assert "Các chuyên khoa" not in result.reply


@pytest.mark.asyncio
async def test_run_turn_v2_no_duplicate_tool_calls_across_replans():
    """Tools already called in the initial plan must not be re-called in the re-plan."""
    state = AgentState(session_id="test-session")
    state.patient_id = _PATIENT_ID

    tool_registry = _ToolRegistry(
        {
            "list_clinics": [],
            "list_specialties": [
                {
                    "specialty_id": _SPECIALTY_ID,
                    "specialty_name": "Tim mạch",
                    "specialty_code": "CARDIOLOGY",
                }
            ],
            "list_doctor_schedules": _make_schedule_list(),
        }
    )
    graph = BookingAgentGraph(planner=None, tool_registry=tool_registry, step_budget=3)

    await graph.run_turn_v2(
        state,
        "đặt lịch tim mạch",
        slot_extractor=_book_extractor(),
        current_date_iso="2026-06-17",
    )

    assert tool_registry.called.count("list_clinics") <= 1
    assert tool_registry.called.count("list_specialties") <= 1
    assert tool_registry.called.count("list_doctor_schedules") <= 1


_DOCTOR_ID = "66666666-6666-4666-8666-666666666666"


@pytest.mark.asyncio
async def test_run_turn_v2_ordinal_pick_resolves_schedule_and_creates_confirmation():
    """When user picks a schedule by number after candidates are loaded, run_turn_v2
    should resolve the reference, skip re-discovery, and create a booking confirmation."""
    state = AgentState(session_id="test-session")
    state.patient_id = _PATIENT_ID
    state.current_goal = "booking"
    state.slots.specialty_id = _SPECIALTY_ID
    state.slots.specialty_label = "Tim mạch"
    now = utc_now()
    state.candidates["schedule"] = CandidateList(
        kind="schedule",
        fetched_at=now,
        presented_at=now,
        ttl_seconds=90,
        items=[
            Candidate(
                id=_SCHEDULE_ID,
                label="2026-06-20 08:00-12:00",
                payload={
                    "schedule_id": _SCHEDULE_ID,
                    "work_date": "2026-06-20",
                    "start_time": "08:00",
                    "end_time": "12:00",
                    "status": "available",
                    "doctor_id": _DOCTOR_ID,
                    "clinic_id": _CLINIC_ID,
                },
            )
        ],
    )

    # No tool calls should be needed — schedule is already selected
    tool_registry = _ToolRegistry({})
    graph = BookingAgentGraph(planner=None, tool_registry=tool_registry, step_budget=3)

    async def _pick_extract(message, *, recent_turns, current_date_iso):
        return ExtractedSlots(intent="book", confidence=0.8, missing_slots=[])

    class Extractor:
        extract = staticmethod(_pick_extract)

    result = await graph.run_turn_v2(
        state,
        "cái 1",
        slot_extractor=Extractor(),
        current_date_iso="2026-06-17",
    )

    assert state.slots.schedule_id == _SCHEDULE_ID, (
        f"schedule_id not set, got: {state.slots.schedule_id}"
    )
    assert state.pending_confirmation is not None
    assert state.pending_confirmation.operation in {"book_by_doctor", "book_by_specialty"}
    assert result.pending_mutation is True
    assert not tool_registry.called, f"Unexpected tool calls: {tool_registry.called}"
