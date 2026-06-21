from __future__ import annotations

import asyncio

import pytest

from src.confirmation_store import InMemoryConfirmationStore, PendingConfirmation
from src.schemas import FlowName


def _pending(token: str, session_id: str = "session-1") -> PendingConfirmation:
    return PendingConfirmation(
        token=token,
        session_id=session_id,
        patient_id="patient-1",
        flow=FlowName.BOOKING,
        action="commit_booking",
        payload={"booking_option_id": "option-1"},
        summary="Book option 1.",
    )


@pytest.mark.asyncio
async def test_new_confirmation_supersedes_older_confirmation_for_session():
    store = InMemoryConfirmationStore(ttl_seconds=900)
    await store.create(_pending("old"))
    await store.create(_pending("new"))

    old = await store.consume("old", session_id="session-1", patient_id="patient-1")
    new = await store.consume("new", session_id="session-1", patient_id="patient-1")

    assert old.status == "superseded"
    assert new.status == "consumed"
    assert new.confirmation is not None


@pytest.mark.asyncio
async def test_expired_confirmation_cannot_be_consumed():
    now = [100.0]
    store = InMemoryConfirmationStore(ttl_seconds=10, clock=lambda: now[0])
    await store.create(_pending("expires"))
    now[0] = 111.0

    result = await store.consume("expires", session_id="session-1", patient_id="patient-1")

    assert result.status == "expired"
    assert result.confirmation is None


@pytest.mark.asyncio
async def test_concurrent_consumers_receive_confirmation_once():
    store = InMemoryConfirmationStore(ttl_seconds=900)
    await store.create(_pending("one-time"))

    first, second = await asyncio.gather(
        store.consume("one-time", session_id="session-1", patient_id="patient-1"),
        store.consume("one-time", session_id="session-1", patient_id="patient-1"),
    )

    assert sorted([first.status, second.status]) == ["consumed", "replayed"]


@pytest.mark.asyncio
async def test_store_copies_mutation_payload_before_persisting():
    store = InMemoryConfirmationStore(ttl_seconds=900)
    confirmation = _pending("immutable")
    await store.create(confirmation)
    confirmation.payload["booking_option_id"] = "changed"

    result = await store.consume("immutable", session_id="session-1", patient_id="patient-1")

    assert result.confirmation is not None
    assert result.confirmation.payload == {"booking_option_id": "option-1"}
