from __future__ import annotations

import pytest

from src.graph import BookingAgentGraph
from src.memory import Candidate, CandidateList
from src.planner import FakePlanner, PlannerAction, PlannerContext, parse_planner_response
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
async def test_graph_passes_step_context_to_planner_and_exposes_safe_planner_metadata():
    class RecordingPlanner:
        def __init__(self):
            self.contexts: list[PlannerContext] = []

        async def next_action(self, state, message, context):
            self.contexts.append(context)
            return PlannerAction(
                kind="answer",
                answer="Mình cần biết phòng khám bạn muốn chọn.",
                metadata={
                    "reasoning_mode": "direct",
                    "reasoning_reason": "simple_first_step",
                    "prompt_tokens": 123,
                },
            )

    planner = RecordingPlanner()
    graph = BookingAgentGraph(planner=planner, tool_registry=None, step_budget=3)

    result = await graph.run_turn(AgentState(session_id="s1"), "tôi muốn đặt lịch")

    assert planner.contexts == [PlannerContext(step_index=0, remaining_steps=3)]
    assert result.metadata["reasoning_mode"] == "direct"
    assert result.metadata["prompt_tokens"] == 123


@pytest.mark.asyncio
async def test_graph_resolves_explicit_catalog_reference_into_structured_slot_before_planning():
    class InspectPlanner:
        async def next_action(self, state, message, context):
            assert state.slots.service_id == "service-2"
            assert state.slots.service_label == "Trám răng"
            return PlannerAction(kind="answer", answer="Mình đã ghi nhận dịch vụ.")

    state = AgentState(
        session_id="s1",
        current_goal="booking",
        slots={"clinic_id": "clinic-1"},
        candidates={
            "service": CandidateList(
                kind="service",
                fetched_at=utc_now(),
                presented_at=utc_now(),
                ttl_seconds=600,
                items=[
                    Candidate(id="service-1", label="Lấy cao răng"),
                    Candidate(id="service-2", label="Trám răng"),
                ],
            )
        },
    )

    result = await BookingAgentGraph(
        planner=InspectPlanner(),
        tool_registry=None,
        step_budget=1,
    ).run_turn(state, "chọn dịch vụ thứ hai")

    assert result.reply == "Mình đã ghi nhận dịch vụ."


@pytest.mark.asyncio
async def test_graph_asks_for_clarification_when_catalog_reference_kind_is_ambiguous():
    class PlannerMustNotRun:
        async def next_action(self, state, message, context):
            raise AssertionError("ambiguous references must stop before planning")

    now = utc_now()
    state = AgentState(
        session_id="s1",
        candidates={
            "clinic": CandidateList(
                kind="clinic",
                fetched_at=now,
                presented_at=now,
                ttl_seconds=600,
                items=[Candidate(id="clinic-1", label="Clinic A")],
            ),
            "service": CandidateList(
                kind="service",
                fetched_at=now,
                presented_at=now,
                ttl_seconds=600,
                items=[Candidate(id="service-1", label="Service A")],
            ),
        },
    )

    result = await BookingAgentGraph(
        planner=PlannerMustNotRun(),
        tool_registry=None,
        step_budget=1,
    ).run_turn(state, "chọn cái đầu tiên")

    assert result.metadata["reference_ambiguous"] is True
    assert "phòng khám hay dịch vụ" in result.reply.lower()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("tool_name", "arguments", "observation", "kind", "expected_id", "expected_label"),
    [
        (
            "list_clinics",
            {},
            [{"clinic_id": "clinic-1", "clinic_name": "S.M.I.L.E Quận 1"}],
            "clinic",
            "clinic-1",
            "S.M.I.L.E Quận 1",
        ),
        (
            "list_services",
            {},
            {"data": [{"service_id": "service-1", "service_name": "Trám răng"}]},
            "service",
            "service-1",
            "Trám răng",
        ),
        (
            "list_clinic_services",
            {"clinic_id": "clinic-1"},
            [{"service_id": "service-2", "service_name": "Lấy cao răng"}],
            "service",
            "service-2",
            "Lấy cao răng",
        ),
        (
            "list_specialties",
            {},
            {"data": [{"specialty_id": "specialty-1", "specialty_name": "Nha chu"}]},
            "specialty",
            "specialty-1",
            "Nha chu",
        ),
    ],
)
async def test_catalog_reads_store_grounded_candidates(
    tool_name,
    arguments,
    observation,
    kind,
    expected_id,
    expected_label,
):
    class FakeTools:
        async def execute(self, name, received_arguments, idempotency_key=None):
            assert (name, received_arguments) == (tool_name, arguments)
            return observation

    state = AgentState(session_id="s1")
    result = await BookingAgentGraph(
        planner=FakePlanner([PlannerAction.tool(tool_name, arguments)]),
        tool_registry=FakeTools(),
        step_budget=1,
    ).run_turn(state, "tra cứu")

    candidates = state.candidates[kind]
    assert candidates.ttl_seconds == 600
    assert candidates.presented_at is not None
    assert candidates.items[0].id == expected_id
    assert candidates.items[0].label == expected_label
    assert result.metadata["candidate_list_updated"] == kind


@pytest.mark.asyncio
async def test_catalog_read_retains_at_most_100_candidates_and_empty_success_replaces_list():
    class FakeTools:
        def __init__(self):
            self.responses = [
                [
                    {"clinic_id": f"clinic-{index}", "clinic_name": f"Clinic {index}"}
                    for index in range(105)
                ],
                [],
            ]

        async def execute(self, name, arguments, idempotency_key=None):
            return self.responses.pop(0)

    tools = FakeTools()
    state = AgentState(session_id="s1")
    graph = BookingAgentGraph(
        planner=FakePlanner([PlannerAction.tool("list_clinics", {})]),
        tool_registry=tools,
        step_budget=1,
    )

    first = await graph.run_turn(state, "liệt kê phòng khám")
    graph.planner = FakePlanner([PlannerAction.tool("list_clinics", {})])
    second = await graph.run_turn(state, "làm mới phòng khám")

    assert first.metadata["candidate_results_truncated"] is True
    assert len(first.reply.splitlines()) == 101
    assert len(state.candidates["clinic"].items) == 0
    assert second.metadata["candidate_list_updated"] == "clinic"


@pytest.mark.asyncio
async def test_failed_catalog_read_preserves_last_successful_candidates():
    class FailingTools:
        async def execute(self, name, arguments, idempotency_key=None):
            raise RuntimeError("503 unavailable")

    existing = CandidateList(
        kind="clinic",
        fetched_at=utc_now(),
        presented_at=utc_now(),
        ttl_seconds=600,
        items=[Candidate(id="clinic-1", label="Clinic A")],
    )
    state = AgentState(session_id="s1", candidates={"clinic": existing})

    result = await BookingAgentGraph(
        planner=FakePlanner([PlannerAction.tool("list_clinics", {})]),
        tool_registry=FailingTools(),
        step_budget=1,
    ).run_turn(state, "làm mới phòng khám")

    assert state.candidates["clinic"] == existing
    assert result.metadata["tool_execution_failed"] == "list_clinics"


@pytest.mark.asyncio
async def test_invalid_read_tool_arguments_are_blocked_without_crashing_chat():
    from src.tools import ToolRegistry

    result = await BookingAgentGraph(
        planner=FakePlanner(
            [PlannerAction.tool("get_clinic", {"clinic_id": "S.M.I.L.E Agent E2E Clinic"})]
        ),
        tool_registry=ToolRegistry(object()),
        step_budget=1,
    ).run_turn(AgentState(session_id="s1"), "chi nhánh đầu tiên có dịch vụ gì?")

    assert result.metadata["tool_args_invalid"] == "get_clinic"
    assert result.tool_calls == ["get_clinic"]
    assert "chưa dùng được mã" in result.reply


@pytest.mark.asyncio
async def test_read_tool_arguments_use_resolved_slots_instead_of_model_label_ids():
    class FakeTools:
        def __init__(self):
            self.calls: list[tuple[str, dict]] = []

        def canonical_read_signature(self, name, arguments):
            return f"{name}:{arguments['clinic_id']}"

        async def execute(self, name, arguments, idempotency_key=None):
            self.calls.append((name, arguments))
            return {"clinic_id": arguments["clinic_id"], "clinic_name": "Clinic A"}

    state = AgentState(session_id="s1")
    state.slots.clinic_id = "11111111-1111-4111-8111-111111111111"

    tools = FakeTools()
    result = await BookingAgentGraph(
        planner=FakePlanner(
            [PlannerAction.tool("get_clinic", {"clinic_id": "Clinic A"})]
        ),
        tool_registry=tools,
        step_budget=1,
    ).run_turn(state, "chi nhánh đầu tiên có dịch vụ gì?")

    assert result.tool_calls == ["get_clinic"]
    assert result.metadata["tool_args_repaired_from_slots"] == "get_clinic"
    assert tools.calls == [
        (
            "get_clinic",
            {"clinic_id": "11111111-1111-4111-8111-111111111111"},
        )
    ]


@pytest.mark.asyncio
async def test_duplicate_read_signature_executes_once_and_asks_for_missing_detail_on_final_step():
    class FakeTools:
        def __init__(self):
            self.calls: list[tuple[str, dict]] = []

        async def execute(self, name, arguments, idempotency_key=None):
            self.calls.append((name, arguments))
            return []

    tools = FakeTools()
    state = AgentState(session_id="s1")

    result = await BookingAgentGraph(
        planner=FakePlanner(
            [
                PlannerAction.tool("get_clinic", {"clinic_id": "clinic-1"}),
                PlannerAction.tool("get_clinic", {"clinic_id": "clinic-1"}),
            ]
        ),
        tool_registry=tools,
        step_budget=2,
    ).run_turn(state, "liệt kê phòng khám")

    assert tools.calls == [("get_clinic", {"clinic_id": "clinic-1"})]
    assert result.metadata["duplicate_read_blocked"] is True
    assert result.metadata["duplicate_read_signatures"] == [
        'get_clinic:{"clinic_id":"clinic-1"}'
    ]
    assert result.metadata["stop_reason"] == "step_budget_exhausted"


@pytest.mark.asyncio
async def test_two_consecutive_duplicate_reads_stop_early_before_step_budget_exhaustion():
    class FakeTools:
        def __init__(self):
            self.calls: list[str] = []

        async def execute(self, name, arguments, idempotency_key=None):
            self.calls.append(name)
            return None

    class DuplicatePlanner:
        def __init__(self):
            self.contexts: list[PlannerContext] = []

        async def next_action(self, state, message, context):
            self.contexts.append(context)
            return PlannerAction.tool("get_clinic", {"clinic_id": "clinic-1"})

    planner = DuplicatePlanner()
    tools = FakeTools()

    result = await BookingAgentGraph(
        planner=planner,
        tool_registry=tools,
        step_budget=4,
    ).run_turn(AgentState(session_id="s1"), "xem phòng khám")

    assert tools.calls == ["get_clinic"]
    assert len(planner.contexts) == 3
    assert planner.contexts[-1].duplicate_read_blocked is True
    assert result.metadata["duplicate_read_blocked"] is True
    assert result.metadata["duplicate_read_consecutive_stop"] is True


@pytest.mark.asyncio
async def test_different_read_arguments_execute_and_same_signature_can_run_next_turn():
    class FakeTools:
        def __init__(self):
            self.calls: list[tuple[str, dict]] = []

        async def execute(self, name, arguments, idempotency_key=None):
            self.calls.append((name, arguments))
            return None

    tools = FakeTools()
    state = AgentState(session_id="s1")
    graph = BookingAgentGraph(
        planner=FakePlanner(
            [
                PlannerAction.tool("get_clinic", {"clinic_id": "clinic-1"}),
                PlannerAction.tool("get_clinic", {"clinic_id": "clinic-2"}),
            ]
        ),
        tool_registry=tools,
        step_budget=2,
    )

    await graph.run_turn(state, "xem phòng khám")
    graph.planner = FakePlanner([PlannerAction.tool("get_clinic", {"clinic_id": "clinic-1"})])
    await graph.run_turn(state, "xem lại phòng khám")

    assert tools.calls == [
        ("get_clinic", {"clinic_id": "clinic-1"}),
        ("get_clinic", {"clinic_id": "clinic-2"}),
        ("get_clinic", {"clinic_id": "clinic-1"}),
    ]


@pytest.mark.asyncio
async def test_planner_runtime_failure_returns_visible_unavailable_response_without_tools():
    class BrokenPlanner:
        async def next_action(self, state, message, context):
            raise RuntimeError("vLLM connection failed")

    class ToolsMustNotRun:
        async def execute(self, name, arguments, idempotency_key=None):
            raise AssertionError("tools must not execute when planner is unavailable")

    result = await BookingAgentGraph(
        planner=BrokenPlanner(),
        tool_registry=ToolsMustNotRun(),
        step_budget=1,
    ).run_turn(AgentState(session_id="s1"), "liệt kê phòng khám")

    assert result.metadata["planner_unavailable"] is True
    assert "mô hình" in result.reply.lower()
    assert "thử lại" in result.reply.lower()


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
async def test_consumed_pending_confirmation_allows_goal_switch_follow_up():
    class FakeTools:
        async def execute(self, name, arguments, idempotency_key=None):
            return {
                "appointment_id": "44444444-4444-4444-8444-444444444444",
                "appointment_code": arguments["code"],
                "patient_id": "11111111-1111-4111-8111-111111111111",
            }

    state = AgentState.with_pending_confirmation(
        session_id="s1",
        patient_id="11111111-1111-4111-8111-111111111111",
        operation="book_by_doctor",
        payload={"doctor_id": "22222222-2222-4222-8222-222222222222"},
    )
    assert state.pending_confirmation is not None
    state.pending_confirmation.consumed = True
    state.current_goal = "cancel"
    graph = BookingAgentGraph(
        planner=FakePlanner(
            [PlannerAction.tool("get_appointment_by_code", {"code": "APT-20260620-0001"})]
        ),
        tool_registry=FakeTools(),
        step_budget=1,
    )

    result = await graph.run_turn(state, "hủy lịch APT-20260620-0001")

    assert result.metadata["ownership_verified"] is True
    assert state.pending_confirmation is not None
    assert state.pending_confirmation.operation == "cancel_appointment"


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
async def test_booking_tool_proposal_uses_trusted_patient_context_for_mutation_payload():
    trusted_patient_id = "11111111-1111-4111-8111-111111111111"
    untrusted_patient_id = "99999999-9999-4999-8999-999999999999"
    state = AgentState(
        session_id="s1",
        patient_id=trusted_patient_id,
        current_goal="booking",
    )
    graph = BookingAgentGraph(
        planner=FakePlanner(
            [
                PlannerAction.tool(
                    "book_by_doctor",
                    {
                        "doctor_id": "22222222-2222-4222-8222-222222222222",
                        "patient_id": untrusted_patient_id,
                        "clinic_id": "33333333-3333-4333-8333-333333333333",
                        "appointment_date": "2026-06-20",
                        "appointment_time": "09:00",
                        "created_by": untrusted_patient_id,
                    },
                )
            ]
        ),
        tool_registry=None,
        step_budget=1,
    )

    result = await graph.run_turn(state, "đặt lịch bác sĩ này lúc 9h")

    assert result.metadata["pending_confirmation_created"] is True
    assert state.pending_confirmation is not None
    assert state.pending_confirmation.payload["patient_id"] == trusted_patient_id
    assert state.pending_confirmation.payload["created_by"] == trusted_patient_id


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
async def test_patient_appointment_lookup_stores_candidates_and_summarizes_result():
    class FakeTools:
        async def execute(self, name, arguments, idempotency_key=None):
            assert name == "get_patient_appointments"
            assert arguments["patient_id"] == "11111111-1111-4111-8111-111111111111"
            return [
                {
                    "appointment_id": "44444444-4444-4444-8444-444444444444",
                    "appointment_code": "APT-20260620-0001",
                    "appointment_date": "2026-06-20",
                    "appointment_time": "09:00",
                    "status": "scheduled",
                }
            ]

    state = AgentState(
        session_id="s1",
        patient_id="11111111-1111-4111-8111-111111111111",
        current_goal="lookup",
    )
    graph = BookingAgentGraph(
        planner=FakePlanner(
            [
                PlannerAction.tool(
                    "get_patient_appointments",
                    {"patient_id": "11111111-1111-4111-8111-111111111111"},
                )
            ]
        ),
        tool_registry=FakeTools(),
        step_budget=1,
    )

    result = await graph.run_turn(state, "xem lịch hẹn của tôi")

    candidates = state.candidates["appointment"]
    assert candidates.ttl_seconds == 600
    assert candidates.items[0].id == "44444444-4444-4444-8444-444444444444"
    assert candidates.render_for_prompt()[0].startswith("appointment_candidates[1]")
    assert "APT-20260620-0001" in result.reply
    assert result.metadata["candidate_list_updated"] == "appointment"


@pytest.mark.asyncio
async def test_doctor_schedule_lookup_stores_short_lived_schedule_candidates():
    class FakeTools:
        async def execute(self, name, arguments, idempotency_key=None):
            assert name == "list_doctor_schedules"
            return {
                "data": [
                    {
                        "schedule_id": "schedule-1",
                        "doctor_id": "22222222-2222-4222-8222-222222222222",
                        "work_date": "2026-06-20",
                        "status": "available",
                        "shift": {"start_time": "09:00", "end_time": "12:00"},
                    }
                ]
            }

    state = AgentState(session_id="s1", current_goal="booking")
    graph = BookingAgentGraph(
        planner=FakePlanner([PlannerAction.tool("list_doctor_schedules", {"work_date": "2026-06-20"})]),
        tool_registry=FakeTools(),
        step_budget=1,
    )

    result = await graph.run_turn(state, "xem lịch bác sĩ ngày 20")

    candidates = state.candidates["schedule"]
    assert candidates.ttl_seconds == 90
    assert candidates.items[0].id == "schedule-1"
    assert "09:00" in result.reply
    assert result.metadata["candidate_list_updated"] == "schedule"
    assert result.reply.startswith("Các lịch bác sĩ tìm được:\n1.")


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
async def test_cancel_goal_is_detected_from_user_message_before_tool_policy():
    class FakeTools:
        async def execute(self, name, arguments, idempotency_key=None):
            assert name == "get_appointment_by_code"
            return {
                "appointment_id": "44444444-4444-4444-8444-444444444444",
                "appointment_code": "APT-20260614-0001",
                "patient_id": "11111111-1111-4111-8111-111111111111",
                "status": "scheduled",
            }

    state = AgentState(
        session_id="s1",
        patient_id="11111111-1111-4111-8111-111111111111",
        current_goal="unknown",
    )
    graph = BookingAgentGraph(
        planner=FakePlanner([PlannerAction.tool("get_appointment_by_code", {"code": "APT-20260614-0001"})]),
        tool_registry=FakeTools(),
        step_budget=1,
    )

    result = await graph.run_turn(state, "hủy lịch APT-20260614-0001")

    assert state.current_goal == "cancel"
    assert result.metadata["ownership_verified"] is True
    assert state.pending_confirmation is not None
    assert state.pending_confirmation.operation == "cancel_appointment"


@pytest.mark.asyncio
async def test_direct_cancel_tool_proposal_is_blocked_without_pending_confirmation():
    class FakeTools:
        async def execute(self, name, arguments, idempotency_key=None):
            raise AssertionError("cancel mutation must not execute directly")

    state = AgentState(
        session_id="s1",
        patient_id="11111111-1111-4111-8111-111111111111",
        current_goal="cancel",
    )
    graph = BookingAgentGraph(
        planner=FakePlanner(
            [
                PlannerAction.tool(
                    "cancel_appointment",
                    {
                        "appointment_id": "APT-20260614-0001",
                        "cancelled_by": "S.M.I.L.E. Chatbot",
                    },
                )
            ]
        ),
        tool_registry=FakeTools(),
        step_budget=1,
    )

    result = await graph.run_turn(state, "hủy lịch APT-20260614-0001")

    assert state.pending_confirmation is None
    assert result.metadata["mutation_blocked"] == "cancel_requires_verified_pending_confirmation"
    assert "xác minh" in result.reply.lower()


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
async def test_backend_kyc_errors_clear_pending_confirmation_with_specific_reply():
    class KycTools:
        def __init__(self, error: str):
            self.error = error

        async def execute(self, name, arguments, idempotency_key=None):
            raise RuntimeError(self.error)

    for error, expected in (
        ("503 Service Unavailable: {'code': 'KYC_CHECK_UNAVAILABLE'}", "tạm thời"),
        ("403 Forbidden: {'code': 'KYC_REQUIRED'}", "xác minh số điện thoại"),
    ):
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
        graph = BookingAgentGraph(planner=FakePlanner([]), tool_registry=KycTools(error), step_budget=1)

        result = await graph.run_turn(state, "xác nhận")

        assert result.metadata["mutation_committed"] is False
        assert result.metadata["backend_error"] == error
        assert state.pending_confirmation is None
        assert expected in result.reply.lower()


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


@pytest.mark.asyncio
async def test_schedule_reference_second_is_resolved_before_planner_and_reused_for_booking():
    class InspectPlanner:
        async def next_action(self, state, message, context):
            assert state.slots.schedule_id == "schedule-2"
            assert state.slots.doctor_id == "22222222-2222-4222-8222-222222222222"
            assert state.slots.clinic_id == "33333333-3333-4333-8333-333333333333"
            assert state.slots.preferred_date == "2026-06-20"
            assert state.slots.preferred_time == "10:00"
            return PlannerAction.tool("book_by_doctor", {})

    state = AgentState(
        session_id="s1",
        patient_id="11111111-1111-4111-8111-111111111111",
        current_goal="booking",
        candidates={
            "schedule": CandidateList(
                kind="schedule",
                fetched_at=utc_now(),
                ttl_seconds=90,
                items=[
                    Candidate(id="schedule-1", label="09:00", payload={}),
                    Candidate(
                        id="schedule-2",
                        label="10:00 bác sĩ An",
                        payload={
                            "schedule_id": "schedule-2",
                            "doctor_id": "22222222-2222-4222-8222-222222222222",
                            "clinic_id": "33333333-3333-4333-8333-333333333333",
                            "work_date": "2026-06-20",
                            "shift": {"start_time": "10:00", "end_time": "12:00"},
                        },
                    ),
                ],
            )
        },
    )
    graph = BookingAgentGraph(planner=InspectPlanner(), tool_registry=None, step_budget=1)

    result = await graph.run_turn(state, "lấy lịch thứ hai")

    assert result.metadata["pending_confirmation_created"] is True
    assert state.pending_confirmation.payload["doctor_id"] == (
        "22222222-2222-4222-8222-222222222222"
    )
    assert state.pending_confirmation.payload["appointment_time"] == "10:00"


@pytest.mark.asyncio
async def test_graph_records_redacted_recent_user_and_assistant_turns():
    state = AgentState(session_id="s1")
    graph = BookingAgentGraph(
        planner=FakePlanner([PlannerAction(kind="answer", answer="Mình có thể hỗ trợ.")]),
        tool_registry=None,
        step_budget=1,
    )

    await graph.run_turn(state, "Số tôi là 0912345678, cho tôi hỏi lịch khám")

    assert state.recent_turns == [
        {"role": "user", "content": "Số tôi là [phone], cho tôi hỏi lịch khám"},
        {"role": "assistant", "content": "Mình có thể hỗ trợ."},
    ]
    assert state.pending_confirmation is None


@pytest.mark.asyncio
async def test_read_tool_backend_error_returns_recoverable_reply_instead_of_raising():
    class FailingTools:
        async def execute(self, name, arguments, idempotency_key=None):
            raise RuntimeError("404 Not Found: appointment missing")

    graph = BookingAgentGraph(
        planner=FakePlanner(
            [PlannerAction.tool("get_appointment_by_code", {"code": "APT-MISSING"})]
        ),
        tool_registry=FailingTools(),
        step_budget=1,
    )

    result = await graph.run_turn(
        AgentState(session_id="s1", current_goal="cancel"),
        "kiểm tra mã APT-MISSING",
    )

    assert result.metadata["backend_error"]
    assert result.tool_calls == ["get_appointment_by_code"]
    assert "thử lại" in result.reply.lower()
