from __future__ import annotations

from typing import Any

import pytest

from src.graph import BookingLangGraph
from src.schemas import AgentCommand, ChatRequest, FlowName, SlotUpdate
from src.tool_errors import AmbiguousReferenceError, DomainToolError
from src.tools import InMemoryDomainTools


class RecordingExtractor:
    last_error: str | None = None

    def __init__(self, command: AgentCommand) -> None:
        self.command = command
        self.calls = 0

    async def extract(self, message: str) -> AgentCommand:
        self.calls += 1
        return self.command


class SequenceExtractor:
    last_error: str | None = None

    def __init__(self, commands: list[AgentCommand]) -> None:
        self.commands = iter(commands)

    async def extract(self, message: str) -> AgentCommand:
        return next(self.commands, AgentCommand(intent=FlowName.UNKNOWN))


class TimeoutOnceLookupTools(InMemoryDomainTools):
    def __init__(self) -> None:
        super().__init__()
        self.lookup_arguments: list[str] = []

    async def get_patient_appointments(self, patient_id: str) -> list[dict[str, Any]]:
        self.lookup_arguments.append(patient_id)
        if len(self.lookup_arguments) == 1:
            raise TimeoutError("transient")
        return await super().get_patient_appointments(patient_id)


class AlwaysFailLookupTools(InMemoryDomainTools):
    def __init__(self, error: Exception) -> None:
        super().__init__()
        self.error = error
        self.calls = 0

    async def get_patient_appointments(self, patient_id: str) -> list[dict[str, Any]]:
        self.calls += 1
        raise self.error


@pytest.mark.asyncio
async def test_transient_read_retries_once_with_same_arguments_without_reextracting():
    tools = TimeoutOnceLookupTools()
    extractor = RecordingExtractor(AgentCommand(intent=FlowName.LOOKUP, confidence=1.0))
    graph = BookingLangGraph(domain_tools=tools, extractor=extractor)

    response = await graph.handle_chat(
        ChatRequest(session_id="retry", message="Show appointments"),
        trusted_patient_id="patient-1",
    )

    assert response.flow == FlowName.LOOKUP
    assert tools.lookup_arguments == ["patient-1", "patient-1"]
    assert extractor.calls == 1
    assert response.metadata["metrics"]["read_timeout_recovered_count"] == 1
    assert response.actions == ["get_patient_appointments"]


@pytest.mark.asyncio
async def test_two_read_timeouts_return_safe_failure_after_two_calls():
    tools = AlwaysFailLookupTools(TimeoutError("still unavailable"))
    graph = BookingLangGraph(domain_tools=tools)

    response = await graph.handle_chat(
        ChatRequest(session_id="timeout", message="Show appointments"),
        trusted_patient_id="patient-1",
    )

    assert tools.calls == 2
    assert response.metadata["metrics"]["read_timeout_exhausted_count"] == 1
    assert response.metadata["metrics"]["safe_error_category"] == "read_unavailable"
    assert "try again" in response.reply.lower()


@pytest.mark.asyncio
async def test_permanent_read_error_is_not_retried():
    tools = AlwaysFailLookupTools(RuntimeError("permanent"))
    graph = BookingLangGraph(domain_tools=tools)

    response = await graph.handle_chat(
        ChatRequest(session_id="permanent", message="Show appointments"),
        trusted_patient_id="patient-1",
    )

    assert tools.calls == 1
    assert response.metadata["metrics"]["read_permanent_failure_count"] == 1
    assert response.metadata["metrics"]["safe_error_category"] == "read_unavailable"
    assert not tools.mutations


@pytest.mark.asyncio
async def test_malformed_lookup_item_is_backend_failure():
    class MalformedLookupTools(InMemoryDomainTools):
        async def get_patient_appointments(self, patient_id: str):
            return [{"malformed": True}]

    graph = BookingLangGraph(domain_tools=MalformedLookupTools())

    response = await graph.handle_chat(
        ChatRequest(session_id="malformed-lookup", message="Show appointments"),
        trusted_patient_id="patient-1",
    )

    assert response.metadata["metrics"]["safe_error_category"] == "malformed_backend_response"
    assert response.metadata["metrics"]["payload_validation_failure_count"] == 1
    assert response.confirmation is None


@pytest.mark.asyncio
async def test_empty_lookup_is_a_successful_empty_result():
    class EmptyLookupTools(InMemoryDomainTools):
        async def get_patient_appointments(self, patient_id: str):
            return []

    graph = BookingLangGraph(domain_tools=EmptyLookupTools())

    response = await graph.handle_chat(
        ChatRequest(session_id="empty-lookup", message="Show appointments"),
        trusted_patient_id="patient-1",
    )

    assert response.safe_state["appointments"] == []
    assert response.metadata["metrics"]["safe_error_category"] is None
    assert "did not find" in response.reply.lower()


@pytest.mark.asyncio
async def test_malformed_booking_option_never_reaches_prepare():
    class MalformedOptionTools(InMemoryDomainTools):
        async def find_booking_options(self, patient_id: str, slots: dict[str, Any]):
            return [{"id": "option-without-summary"}]

    graph = BookingLangGraph(domain_tools=MalformedOptionTools())

    response = await graph.handle_chat(
        ChatRequest(session_id="malformed-option", message="Book an appointment on 2027-07-01"),
        trusted_patient_id="patient-1",
    )

    assert response.metadata["metrics"]["safe_error_category"] == "malformed_backend_response"
    assert "prepare_booking" not in response.actions
    assert response.confirmation is None


@pytest.mark.asyncio
async def test_malformed_resolver_payload_is_backend_failure_not_not_found():
    class MalformedResolverTools(InMemoryDomainTools):
        async def resolve_appointment_reference(self, patient_id: str, appointment_ref: str):
            return {"code": "APT-001"}

    graph = BookingLangGraph(domain_tools=MalformedResolverTools())

    response = await graph.handle_chat(
        ChatRequest(session_id="malformed-resolver", message="Cancel APT-001"),
        trusted_patient_id="patient-1",
    )

    assert response.metadata["metrics"]["safe_error_category"] == "malformed_backend_response"
    assert response.metadata["metrics"]["payload_validation_failure_count"] == 1
    assert "prepare_cancel" not in response.actions


@pytest.mark.asyncio
async def test_cancelled_appointment_is_non_actionable_without_prepare():
    class CancelledResolverTools(InMemoryDomainTools):
        async def resolve_appointment_reference(self, patient_id: str, appointment_ref: str):
            return {"id": "appt-001", "code": "APT-001", "status": "cancelled"}

    graph = BookingLangGraph(domain_tools=CancelledResolverTools())

    response = await graph.handle_chat(
        ChatRequest(session_id="cancelled", message="Cancel APT-001"),
        trusted_patient_id="patient-1",
    )

    assert response.metadata["metrics"]["safe_error_category"] == "non_actionable_appointment"
    assert "prepare_cancel" not in response.actions
    assert "cannot access an actionable appointment" in response.reply.lower()


@pytest.mark.asyncio
async def test_ambiguous_reference_requests_clarification_without_mutation_prepare():
    class AmbiguousResolverTools(InMemoryDomainTools):
        async def resolve_appointment_reference(self, patient_id: str, appointment_ref: str):
            raise AmbiguousReferenceError("multiple safe matches")

    graph = BookingLangGraph(domain_tools=AmbiguousResolverTools())

    response = await graph.handle_chat(
        ChatRequest(session_id="ambiguous-reference", message="Cancel APT-001"),
        trusted_patient_id="patient-1",
    )

    assert response.flow == FlowName.CANCEL
    assert response.metadata["metrics"]["clarification_count"] == 1
    assert response.actions == ["resolve_appointment_reference"]
    assert response.confirmation is None
    assert "which appointment" in response.reply.lower()


@pytest.mark.asyncio
async def test_correction_prepares_latest_slots_and_supersedes_previous_token():
    class SlotAwareTools(InMemoryDomainTools):
        async def find_booking_options(self, patient_id: str, slots: dict[str, Any]):
            time_hint = slots.get("time_hint")
            return [{"id": f"option-{time_hint}", "summary": f"Monday at {time_hint}."}]

    tools = SlotAwareTools()
    extractor = SequenceExtractor([
        AgentCommand(
            intent=FlowName.BOOKING,
            slot_updates=[
                SlotUpdate(name="date_hint", value="Monday"),
                SlotUpdate(name="time_hint", value="15:00"),
            ],
        ),
        AgentCommand(
            intent=FlowName.UNKNOWN,
            dialogue_act="correct",
            slot_updates=[SlotUpdate(name="time_hint", value="16:00")],
        ),
    ])
    graph = BookingLangGraph(domain_tools=tools, extractor=extractor)

    first = await graph.handle_chat(ChatRequest(session_id="correction", message="first"), "patient-1")
    second = await graph.handle_chat(ChatRequest(session_id="correction", message="correct"), "patient-1")
    rejected = await graph.handle_chat(
        ChatRequest(
            session_id="correction",
            message="confirm old",
            confirmation_token=first.confirmation.token,
            confirmed=True,
        ),
        "patient-1",
    )
    committed = await graph.handle_chat(
        ChatRequest(
            session_id="correction",
            message="confirm new",
            confirmation_token=second.confirmation.token,
            confirmed=True,
        ),
        "patient-1",
    )

    assert second.safe_state["booking_option"]["id"] == "option-16:00"
    assert rejected.metadata["metrics"]["confirmation_token_superseded_blocked_count"] == 1
    assert committed.flow == FlowName.BOOKING
    assert tools.mutations == ["commit_booking:option-16:00"]


@pytest.mark.asyncio
async def test_abort_calls_no_tools_and_invalidates_pending_confirmation():
    tools = InMemoryDomainTools()
    extractor = SequenceExtractor([
        AgentCommand(
            intent=FlowName.CANCEL,
            slot_updates=[SlotUpdate(name="appointment_ref", value="APT-001")],
        ),
        AgentCommand(intent=FlowName.UNKNOWN, dialogue_act="abort"),
    ])
    graph = BookingLangGraph(domain_tools=tools, extractor=extractor)
    prepared = await graph.handle_chat(ChatRequest(session_id="abort", message="prepare"), "patient-1")

    aborted = await graph.handle_chat(ChatRequest(session_id="abort", message="stop"), "patient-1")
    replay = await graph.handle_chat(
        ChatRequest(
            session_id="abort",
            message="confirm",
            confirmation_token=prepared.confirmation.token,
            confirmed=True,
        ),
        "patient-1",
    )

    assert aborted.flow == FlowName.UNKNOWN
    assert aborted.actions == []
    assert "no changes" in aborted.reply.lower()
    assert replay.metadata["metrics"]["confirmation_token_superseded_blocked_count"] == 1
    assert tools.mutations == []


@pytest.mark.asyncio
async def test_permanent_commit_failure_is_not_reported_as_conflict():
    class UnavailableCommitTools(InMemoryDomainTools):
        attempts = 0

        async def commit_booking(self, patient_id: str, booking_option_id: str, idempotency_key: str):
            self.attempts += 1
            raise DomainToolError("backend unavailable")

    tools = UnavailableCommitTools()
    graph = BookingLangGraph(domain_tools=tools)
    prepared = await graph.handle_chat(
        ChatRequest(session_id="commit-unavailable", message="Book 2027-07-01"),
        trusted_patient_id="patient-1",
    )

    response = await graph.handle_chat(
        ChatRequest(
            session_id="commit-unavailable",
            message="Confirm",
            confirmation_token=prepared.confirmation.token,
            confirmed=True,
        ),
        trusted_patient_id="patient-1",
    )

    assert tools.attempts == 1
    assert response.metadata["metrics"]["safe_error_category"] == "commit_unavailable"
    assert response.metadata["metrics"]["mutation_conflict_count"] == 0
