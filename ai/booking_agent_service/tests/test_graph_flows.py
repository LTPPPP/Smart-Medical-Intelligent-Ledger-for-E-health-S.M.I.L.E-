from __future__ import annotations

import pytest

from src.graph import BookingAgentGraph
from src.planner import FakePlanner, PlannerAction, parse_planner_response
from src.state import AgentState, PendingConfirmation, utc_now


def test_parser_supports_openai_tool_calls_and_qwen_json_fallback():
    openai_message = {
        "tool_calls": [
            {
                "function": {
                    "name": "list_clinics",
                    "arguments": "{\"limit\": 3}",
                }
            }
        ]
    }
    qwen_message = '{"action": "tool", "tool_name": "list_specialties", "arguments": {"active_only": true}}'

    assert parse_planner_response(openai_message).tool_name == "list_clinics"
    assert parse_planner_response(qwen_message).tool_name == "list_specialties"


def test_parser_failure_never_executes_a_tool():
    action = parse_planner_response("not json and not a tool call")

    assert action.kind == "parse_failed"
    assert action.tool_name is None


@pytest.mark.asyncio
async def test_step_budget_exhaustion_asks_for_missing_detail_without_mutation():
    graph = BookingAgentGraph(
        planner=FakePlanner(
            [
                PlannerAction.tool("list_clinics", {"limit": 3}),
                PlannerAction.tool("list_specialties", {"active_only": True}),
            ]
        ),
        tool_registry=None,
        step_budget=1,
    )
    state = AgentState(session_id="s1", patient_id="11111111-1111-4111-8111-111111111111")

    result = await graph.run_turn(state, "Tôi muốn đặt lịch")

    assert result.tool_calls == ["list_clinics"]
    assert result.pending_mutation is False
    assert "cần thêm" in result.reply.lower()
    assert result.metadata["stop_reason"] == "step_budget_exhausted"


@pytest.mark.asyncio
async def test_duplicate_confirmation_retry_does_not_double_commit():
    class FakeTools:
        def __init__(self):
            self.calls = 0

        async def execute(self, name, arguments, idempotency_key=None):
            self.calls += 1
            return {"appointment_id": "appt-1", "appointment_code": "APT-20260614-0001"}

    tools = FakeTools()
    state = AgentState.with_pending_confirmation(
        session_id="s1",
        patient_id="11111111-1111-4111-8111-111111111111",
        operation="book_by_doctor",
        payload={
            "doctor_id": "22222222-2222-4222-8222-222222222222",
            "patient_id": "11111111-1111-4111-8111-111111111111",
            "clinic_id": "33333333-3333-4333-8333-333333333333",
            "appointment_date": "2026-06-20",
            "appointment_time": "09:00",
            "created_by": "11111111-1111-4111-8111-111111111111",
        },
    )
    graph = BookingAgentGraph(planner=FakePlanner([]), tool_registry=tools, step_budget=1)

    first = await graph.run_turn(state, "đồng ý xác nhận")
    second = await graph.run_turn(state, "đồng ý xác nhận")

    assert tools.calls == 1
    assert first.metadata["mutation_committed"] is True
    assert second.metadata["mutation_committed"] is False
    assert "đã được xử lý" in second.reply.lower()


@pytest.mark.asyncio
async def test_goal_change_invalidates_pending_confirmation_before_new_action():
    state = AgentState.with_pending_confirmation(
        session_id="s1",
        patient_id="11111111-1111-4111-8111-111111111111",
        operation="book_by_doctor",
        payload={"doctor_id": "doctor-1"},
    )
    graph = BookingAgentGraph(
        planner=FakePlanner([PlannerAction.goal_change("lookup")]),
        tool_registry=None,
        step_budget=1,
    )

    result = await graph.run_turn(state, "xem lịch hẹn của tôi thay vì đặt")

    assert state.pending_confirmation is None
    assert result.metadata["goal_changed_to"] == "lookup"
    assert result.metadata["pending_confirmation_invalidated"] is True


@pytest.mark.asyncio
async def test_booking_tool_proposal_creates_pending_confirmation_without_mutation_call():
    class FakeTools:
        def __init__(self):
            self.calls: list[str] = []

        async def execute(self, name, arguments, idempotency_key=None):
            self.calls.append(name)
            return {"appointment_id": "should-not-be-called"}

    tools = FakeTools()
    state = AgentState(
        session_id="s1",
        patient_id="11111111-1111-4111-8111-111111111111",
        current_goal="booking",
    )
    payload = {
        "doctor_id": "22222222-2222-4222-8222-222222222222",
        "patient_id": "11111111-1111-4111-8111-111111111111",
        "clinic_id": "33333333-3333-4333-8333-333333333333",
        "appointment_date": "2026-06-20",
        "appointment_time": "09:00",
        "created_by": "11111111-1111-4111-8111-111111111111",
    }
    graph = BookingAgentGraph(
        planner=FakePlanner([PlannerAction.tool("book_by_doctor", payload)]),
        tool_registry=tools,
        step_budget=1,
    )

    result = await graph.run_turn(state, "đặt lịch bác sĩ này lúc 9h")

    assert tools.calls == []
    assert state.pending_confirmation is not None
    assert state.pending_confirmation.operation == "book_by_doctor"
    assert state.pending_confirmation.payload == payload
    assert result.pending_mutation is True
    assert result.metadata["pending_confirmation_created"] is True
    assert "xác nhận" in result.reply.lower()


@pytest.mark.asyncio
async def test_booking_mutation_requires_authenticated_patient_context():
    state = AgentState(session_id="s1", current_goal="booking")
    payload = {
        "doctor_id": "22222222-2222-4222-8222-222222222222",
        "patient_id": "11111111-1111-4111-8111-111111111111",
        "clinic_id": "33333333-3333-4333-8333-333333333333",
        "appointment_date": "2026-06-20",
        "appointment_time": "09:00",
        "created_by": "11111111-1111-4111-8111-111111111111",
    }
    graph = BookingAgentGraph(
        planner=FakePlanner([PlannerAction.tool("book_by_doctor", payload)]),
        tool_registry=None,
        step_budget=1,
    )

    result = await graph.run_turn(state, "đặt lịch")

    assert state.pending_confirmation is None
    assert result.metadata["mutation_blocked"] == "missing_patient_context"
    assert "đăng nhập" in result.reply.lower()


@pytest.mark.asyncio
async def test_negative_confirmation_clears_pending_without_mutation():
    class FakeTools:
        async def execute(self, name, arguments, idempotency_key=None):
            raise AssertionError("mutation must not be called")

    state = AgentState.with_pending_confirmation(
        session_id="s1",
        patient_id="11111111-1111-4111-8111-111111111111",
        operation="book_by_doctor",
        payload={"doctor_id": "22222222-2222-4222-8222-222222222222"},
    )
    graph = BookingAgentGraph(planner=FakePlanner([]), tool_registry=FakeTools(), step_budget=1)

    result = await graph.run_turn(state, "không, tôi đổi ý")

    assert state.pending_confirmation is None
    assert result.metadata["pending_confirmation_rejected"] is True
    assert "đã hủy" in result.reply.lower()


@pytest.mark.asyncio
async def test_ambiguous_confirmation_keeps_pending_and_asks_for_clear_confirmation():
    state = AgentState.with_pending_confirmation(
        session_id="s1",
        patient_id="11111111-1111-4111-8111-111111111111",
        operation="book_by_doctor",
        payload={"doctor_id": "22222222-2222-4222-8222-222222222222"},
    )
    graph = BookingAgentGraph(planner=FakePlanner([]), tool_registry=None, step_budget=1)

    result = await graph.run_turn(state, "để tôi xem lại")

    assert state.pending_confirmation is not None
    assert result.metadata["confirmation_status"] == "ambiguous"
    assert "xác nhận rõ" in result.reply.lower()


@pytest.mark.asyncio
async def test_expired_pending_confirmation_is_cleared_without_mutation():
    now = utc_now()
    state = AgentState(
        session_id="s1",
        patient_id="11111111-1111-4111-8111-111111111111",
        pending_confirmation=PendingConfirmation(
            confirmation_id="confirm-1",
            operation="book_by_doctor",
            summary="Đặt lịch 09:00",
            created_at=now,
            expires_at=now,
            idempotency_key="s1:confirm-1:book_by_doctor",
            payload={"doctor_id": "22222222-2222-4222-8222-222222222222"},
        ),
    )
    graph = BookingAgentGraph(planner=FakePlanner([]), tool_registry=None, step_budget=1)

    result = await graph.run_turn(state, "đồng ý")

    assert state.pending_confirmation is None
    assert result.metadata["pending_confirmation_expired"] is True
    assert "hết hạn" in result.reply.lower()


@pytest.mark.asyncio
async def test_emergency_symptom_blocks_booking_mutation_before_planning():
    state = AgentState(
        session_id="s1",
        patient_id="11111111-1111-4111-8111-111111111111",
        current_goal="booking",
    )
    graph = BookingAgentGraph(
        planner=FakePlanner([PlannerAction.tool("book_by_doctor", {})]),
        tool_registry=None,
        step_budget=1,
    )

    result = await graph.run_turn(state, "tôi đau răng sưng mặt khó thở đặt lịch giúp")

    assert state.pending_confirmation is None
    assert result.metadata["safety_blocked"] == "emergency_or_systemic_symptom"
    assert "khẩn cấp" in result.reply.lower()


@pytest.mark.asyncio
async def test_answer_with_invented_id_is_replaced_by_safe_fallback():
    state = AgentState(session_id="s1")
    graph = BookingAgentGraph(
        planner=FakePlanner(
            [
                PlannerAction(
                    kind="answer",
                    answer=(
                        "Lịch của bạn có mã APT-20260614-9999 và id "
                        "22222222-2222-4222-8222-222222222222."
                    ),
                )
            ]
        ),
        tool_registry=None,
        step_budget=1,
    )

    result = await graph.run_turn(state, "lịch của tôi là gì")

    assert result.metadata["post_check_blocked"] is True
    assert "không có đủ dữ liệu" in result.reply.lower()


@pytest.mark.asyncio
async def test_cancel_by_user_supplied_code_verifies_ownership_before_confirmation():
    class FakeTools:
        def __init__(self):
            self.calls: list[tuple[str, dict]] = []

        async def execute(self, name, arguments, idempotency_key=None):
            self.calls.append((name, arguments))
            return {
                "appointment_id": "44444444-4444-4444-8444-444444444444",
                "appointment_code": "APT-20260614-0001",
                "patient_id": "11111111-1111-4111-8111-111111111111",
                "status": "scheduled",
            }

    state = AgentState(
        session_id="s1",
        patient_id="11111111-1111-4111-8111-111111111111",
        current_goal="cancel",
    )
    graph = BookingAgentGraph(
        planner=FakePlanner([PlannerAction.tool("get_appointment_by_code", {"code": "APT-20260614-0001"})]),
        tool_registry=FakeTools(),
        step_budget=2,
    )

    result = await graph.run_turn(state, "hủy lịch APT-20260614-0001")

    assert result.metadata["ownership_verified"] is True
    assert state.pending_confirmation is not None
    assert state.pending_confirmation.operation == "cancel_appointment"
    assert state.pending_confirmation.payload["appointment_id"] == "44444444-4444-4444-8444-444444444444"


@pytest.mark.asyncio
async def test_cancel_ownership_mismatch_blocks_mutation_confirmation():
    class FakeTools:
        async def execute(self, name, arguments, idempotency_key=None):
            return {
                "appointment_id": "44444444-4444-4444-8444-444444444444",
                "appointment_code": "APT-20260614-0001",
                "patient_id": "99999999-9999-4999-8999-999999999999",
            }

    state = AgentState(
        session_id="s1",
        patient_id="11111111-1111-4111-8111-111111111111",
        current_goal="cancel",
    )
    graph = BookingAgentGraph(
        planner=FakePlanner([PlannerAction.tool("get_appointment_by_code", {"code": "APT-20260614-0001"})]),
        tool_registry=FakeTools(),
        step_budget=2,
    )

    result = await graph.run_turn(state, "hủy lịch APT-20260614-0001")

    assert result.metadata["ownership_verified"] is False
    assert state.pending_confirmation is None
    assert "không xác minh" in result.reply.lower()


@pytest.mark.asyncio
async def test_backend_conflict_clears_pending_confirmation_and_offers_refresh():
    class ConflictTools:
        async def execute(self, name, arguments, idempotency_key=None):
            raise RuntimeError("409 scheduling conflict")

    state = AgentState.with_pending_confirmation(
        session_id="s1",
        patient_id="11111111-1111-4111-8111-111111111111",
        operation="book_by_doctor",
        payload={
            "doctor_id": "22222222-2222-4222-8222-222222222222",
            "patient_id": "11111111-1111-4111-8111-111111111111",
            "clinic_id": "33333333-3333-4333-8333-333333333333",
            "appointment_date": "2026-06-20",
            "appointment_time": "09:00",
            "created_by": "11111111-1111-4111-8111-111111111111",
        },
    )
    graph = BookingAgentGraph(planner=FakePlanner([]), tool_registry=ConflictTools(), step_budget=1)

    result = await graph.run_turn(state, "xác nhận")

    assert result.metadata["mutation_committed"] is False
    assert result.metadata["backend_conflict"] is True
    assert state.pending_confirmation is None
    assert "không còn khả dụng" in result.reply.lower()


@pytest.mark.asyncio
async def test_commit_timeout_read_verifies_before_allowing_duplicate_confirmation():
    class TimeoutThenLookupTools:
        def __init__(self):
            self.calls: list[str] = []

        async def execute(self, name, arguments, idempotency_key=None):
            self.calls.append(name)
            if name == "book_by_doctor":
                raise TimeoutError("network timeout")
            return [{"appointment_code": "APT-20260614-0001", "status": "scheduled"}]

    tools = TimeoutThenLookupTools()
    state = AgentState.with_pending_confirmation(
        session_id="s1",
        patient_id="11111111-1111-4111-8111-111111111111",
        operation="book_by_doctor",
        payload={
            "doctor_id": "22222222-2222-4222-8222-222222222222",
            "patient_id": "11111111-1111-4111-8111-111111111111",
            "clinic_id": "33333333-3333-4333-8333-333333333333",
            "appointment_date": "2026-06-20",
            "appointment_time": "09:00",
            "created_by": "11111111-1111-4111-8111-111111111111",
        },
    )
    graph = BookingAgentGraph(planner=FakePlanner([]), tool_registry=tools, step_budget=1)

    result = await graph.run_turn(state, "đồng ý")

    assert tools.calls == ["book_by_doctor", "get_patient_appointments"]
    assert result.metadata["commit_timeout_reverified"] is True
    assert state.pending_confirmation is None
