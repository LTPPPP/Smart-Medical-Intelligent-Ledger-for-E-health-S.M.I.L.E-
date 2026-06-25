import pytest

from src.schemas import (
    AgentCommand,
    ChatRequest,
    ChatResponse,
    ConfirmationRequest,
    DomainToolSpec,
    FlowName,
    SideEffectLevel,
)


def test_chat_contract_supports_confirmation_resume():
    request = ChatRequest(
        session_id="session-1",
        message="Yes, confirm it.",
        confirmation_token="confirm-123",
        confirmed=True,
    )

    assert request.session_id == "session-1"
    assert request.confirmation_token == "confirm-123"
    assert request.confirmed is True


def test_chat_response_exposes_safe_state_actions_and_metrics():
    response = ChatResponse(
        reply="Please confirm the cancellation.",
        flow=FlowName.CANCEL,
        safe_state={"appointment_id": "appt-1"},
        actions=["prepare_cancel"],
        confirmation=ConfirmationRequest(
            token="confirm-123",
            flow=FlowName.CANCEL,
            action="commit_cancel",
            summary="Cancel appointment appt-1.",
        ),
        metadata={
            "trace_id": "trace-1",
            "graph_path": ["extract_command", "cancel_flow"],
            "metrics": {"llm_calls_per_turn": 0, "mutation_without_confirmation": 0},
        },
    )

    assert response.flow == FlowName.CANCEL
    assert response.confirmation is not None
    assert response.metadata["metrics"]["mutation_without_confirmation"] == 0


def test_domain_tool_spec_requires_agentic_metadata():
    spec = DomainToolSpec(
        name="commit_cancel",
        intent=FlowName.CANCEL,
        phase="commit",
        required_slots=["appointment_id"],
        side_effect=SideEffectLevel.MUTATION,
        requires_confirmation=True,
        idempotency_scope="session+confirmation_token",
        timeout_seconds=5.0,
        retry_policy="no_retry_for_mutations",
        safe_error_category="backend_conflict",
        allowed_graph_nodes=["cancel_flow"],
    )

    assert spec.requires_confirmation is True
    assert spec.side_effect == SideEffectLevel.MUTATION
    assert "cancel_flow" in spec.allowed_graph_nodes


@pytest.mark.parametrize(
    ("message", "expected_flow"),
    [
        ("Show my appointments", FlowName.LOOKUP),
        ("I want to book an appointment next Monday", FlowName.BOOKING),
        ("Cancel appointment APT-123", FlowName.CANCEL),
        ("Move my appointment to Friday afternoon", FlowName.RESCHEDULE),
    ],
)
def test_agent_command_from_message_is_english_first(message, expected_flow):
    command = AgentCommand.from_english_message(message)

    assert command.intent == expected_flow
    assert command.language == "en"
