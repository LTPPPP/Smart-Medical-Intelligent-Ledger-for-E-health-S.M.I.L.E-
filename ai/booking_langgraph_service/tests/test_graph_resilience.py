from __future__ import annotations

from typing import Any

import pytest

from src.graph import BookingLangGraph
from src.schemas import AgentCommand, ChatRequest, FlowName
from src.tools import InMemoryDomainTools


class RecordingExtractor:
    last_error: str | None = None

    def __init__(self, command: AgentCommand) -> None:
        self.command = command
        self.calls = 0

    async def extract(self, message: str) -> AgentCommand:
        self.calls += 1
        return self.command


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
