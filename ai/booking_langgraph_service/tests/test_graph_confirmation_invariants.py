from __future__ import annotations

import asyncio

import pytest

from src.confirmation_store import InMemoryConfirmationStore
from src.graph import BookingLangGraph
from src.schemas import ChatRequest, FlowName
from src.tools import InMemoryDomainTools


async def _prepare_booking(graph: BookingLangGraph, session_id: str = "booking"):
    response = await graph.handle_chat(
        ChatRequest(session_id=session_id, message="Book an appointment on 2027-07-01"),
        trusted_patient_id="patient-1",
    )
    assert response.confirmation is not None
    return response


@pytest.mark.asyncio
async def test_replayed_confirmation_attempts_mutation_once():
    tools = InMemoryDomainTools()
    graph = BookingLangGraph(domain_tools=tools)
    prepared = await _prepare_booking(graph, "replay")
    request = ChatRequest(
        session_id="replay",
        message="Confirm",
        confirmation_token=prepared.confirmation.token,
        confirmed=True,
    )

    first, second = await asyncio.gather(
        graph.handle_chat(request, trusted_patient_id="patient-1"),
        graph.handle_chat(request, trusted_patient_id="patient-1"),
    )

    assert tools.mutations == ["commit_booking:option-001"]
    assert sum(response.metadata["metrics"]["mutation_attempt_count"] for response in (first, second)) == 1
    assert sum(
        response.metadata["metrics"]["confirmation_token_replay_blocked_count"]
        for response in (first, second)
    ) == 1


@pytest.mark.asyncio
async def test_new_prepare_invalidates_previous_session_token():
    tools = InMemoryDomainTools()
    graph = BookingLangGraph(domain_tools=tools)
    old = await _prepare_booking(graph, "latest")
    new = await _prepare_booking(graph, "latest")

    rejected = await graph.handle_chat(
        ChatRequest(
            session_id="latest",
            message="Confirm",
            confirmation_token=old.confirmation.token,
            confirmed=True,
        ),
        trusted_patient_id="patient-1",
    )

    assert rejected.flow == FlowName.UNKNOWN
    assert rejected.metadata["metrics"]["confirmation_token_superseded_blocked_count"] == 1
    assert new.confirmation.token != old.confirmation.token
    assert tools.mutations == []


@pytest.mark.asyncio
async def test_expired_confirmation_performs_no_mutation():
    now = [100.0]
    store = InMemoryConfirmationStore(ttl_seconds=10, clock=lambda: now[0])
    tools = InMemoryDomainTools()
    graph = BookingLangGraph(domain_tools=tools, confirmation_store=store)
    prepared = await _prepare_booking(graph, "expired")
    now[0] = 111.0

    response = await graph.handle_chat(
        ChatRequest(
            session_id="expired",
            message="Confirm",
            confirmation_token=prepared.confirmation.token,
            confirmed=True,
        ),
        trusted_patient_id="patient-1",
    )

    assert response.flow == FlowName.UNKNOWN
    assert response.metadata["metrics"]["safe_error_category"] == "invalid_confirmation"
    assert tools.mutations == []


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("session_id", "patient_id"),
    [("another-session", "patient-1"), ("scoped", "patient-2")],
)
async def test_confirmation_scope_mismatch_performs_no_mutation(session_id: str, patient_id: str):
    tools = InMemoryDomainTools()
    graph = BookingLangGraph(domain_tools=tools)
    prepared = await _prepare_booking(graph, "scoped")

    response = await graph.handle_chat(
        ChatRequest(
            session_id=session_id,
            message="Confirm",
            confirmation_token=prepared.confirmation.token,
            confirmed=True,
        ),
        trusted_patient_id=patient_id,
    )

    assert response.flow == FlowName.UNKNOWN
    assert response.metadata["metrics"]["safe_error_category"] == "invalid_confirmation"
    assert tools.mutations == []


@pytest.mark.asyncio
async def test_rejected_confirmation_is_consumed_without_mutation():
    tools = InMemoryDomainTools()
    graph = BookingLangGraph(domain_tools=tools)
    prepared = await _prepare_booking(graph, "rejected")

    rejected = await graph.handle_chat(
        ChatRequest(
            session_id="rejected",
            message="No",
            confirmation_token=prepared.confirmation.token,
            confirmed=False,
        ),
        trusted_patient_id="patient-1",
    )
    replay = await graph.handle_chat(
        ChatRequest(
            session_id="rejected",
            message="Confirm",
            confirmation_token=prepared.confirmation.token,
            confirmed=True,
        ),
        trusted_patient_id="patient-1",
    )

    assert rejected.metadata["metrics"]["safe_error_category"] == "rejected_confirmation"
    assert replay.metadata["metrics"]["confirmation_token_replay_blocked_count"] == 1
    assert tools.mutations == []


@pytest.mark.asyncio
async def test_commit_conflict_is_attempted_once_and_consumes_token():
    class ConflictTools(InMemoryDomainTools):
        attempts = 0

        async def commit_booking(self, patient_id: str, booking_option_id: str, idempotency_key: str):
            self.attempts += 1
            raise RuntimeError("backend conflict")

    tools = ConflictTools()
    graph = BookingLangGraph(domain_tools=tools)
    prepared = await _prepare_booking(graph, "conflict")
    request = ChatRequest(
        session_id="conflict",
        message="Confirm",
        confirmation_token=prepared.confirmation.token,
        confirmed=True,
    )

    first = await graph.handle_chat(request, trusted_patient_id="patient-1")
    second = await graph.handle_chat(request, trusted_patient_id="patient-1")

    assert tools.attempts == 1
    assert first.metadata["metrics"]["mutation_attempt_count"] == 1
    assert first.metadata["metrics"]["mutation_conflict_count"] == 1
    assert second.metadata["metrics"]["confirmation_token_replay_blocked_count"] == 1


@pytest.mark.asyncio
async def test_confirmation_summary_identifies_prepared_operation():
    graph = BookingLangGraph(domain_tools=InMemoryDomainTools())

    response = await _prepare_booking(graph, "summary")

    assert response.confirmation.summary.startswith("Book ")
    assert "Downtown Clinic" in response.confirmation.summary
