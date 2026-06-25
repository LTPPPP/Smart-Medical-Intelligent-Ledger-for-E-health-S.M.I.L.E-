from __future__ import annotations

from typing import Any

import pytest

from src.confirmation_store import PendingConfirmation
from src.conversation_state import ConversationState
from src.graph import BookingLangGraph
from src.redis_state import RedisConfirmationStore, RedisConversationStateStore
from src.schemas import ChatRequest
from src.schemas import FlowName
from src.tools import InMemoryDomainTools


class FakeRedis:
    def __init__(self) -> None:
        self.values: dict[str, str] = {}
        self.sets: dict[str, set[str]] = {}
        self.deleted: list[str] = []

    async def set(self, key: str, value: str, ex: int | None = None) -> None:
        self.values[key] = value

    async def get(self, key: str) -> str | None:
        return self.values.get(key)

    async def delete(self, *keys: str) -> int:
        count = 0
        for key in keys:
            if key in self.values:
                count += 1
                self.values.pop(key, None)
            self.sets.pop(key, None)
            self.deleted.append(key)
        return count

    async def sadd(self, key: str, *values: str) -> None:
        self.sets.setdefault(key, set()).update(values)

    async def smembers(self, key: str) -> set[str]:
        return set(self.sets.get(key, set()))

    async def expire(self, key: str, seconds: int) -> None:
        return None

    async def eval(self, script: str, numkeys: int, *args: Any) -> list[str | None]:
        item_key, tombstone_key, _token, _ttl = args
        value = self.values.pop(item_key, None)
        if value is None:
            return ["missing", self.values.get(tombstone_key)]
        self.values[tombstone_key] = "replayed"
        return ["stored", value]


@pytest.mark.asyncio
async def test_redis_confirmation_store_consumes_token_once_and_blocks_replay():
    redis = FakeRedis()
    store = RedisConfirmationStore(redis, ttl_seconds=900, key_prefix="test")
    pending = PendingConfirmation(
        token="confirm-1",
        session_id="session-1",
        patient_id="patient-1",
        flow=FlowName.BOOKING,
        action="commit_booking",
        payload={"booking_option_id": "option-1"},
        summary="Book option 1",
    )

    await store.create(pending)
    consumed = await store.consume("confirm-1", session_id="session-1", patient_id="patient-1")
    replayed = await store.consume("confirm-1", session_id="session-1", patient_id="patient-1")

    assert consumed.status == "consumed"
    assert consumed.confirmation == pending
    assert replayed.status == "replayed"


@pytest.mark.asyncio
async def test_redis_confirmation_store_supersedes_existing_session_tokens():
    redis = FakeRedis()
    store = RedisConfirmationStore(redis, ttl_seconds=900, key_prefix="test")
    first = PendingConfirmation(
        token="confirm-old",
        session_id="session-1",
        patient_id="patient-1",
        flow=FlowName.BOOKING,
        action="commit_booking",
        payload={"booking_option_id": "old"},
        summary="Old",
    )
    second = PendingConfirmation(
        token="confirm-new",
        session_id="session-1",
        patient_id="patient-1",
        flow=FlowName.BOOKING,
        action="commit_booking",
        payload={"booking_option_id": "new"},
        summary="New",
    )

    await store.create(first)
    await store.create(second)
    old = await store.consume("confirm-old", session_id="session-1", patient_id="patient-1")
    new = await store.consume("confirm-new", session_id="session-1", patient_id="patient-1")

    assert old.status == "superseded"
    assert new.status == "consumed"


@pytest.mark.asyncio
async def test_redis_conversation_state_round_trips_by_session_and_patient():
    redis = FakeRedis()
    store = RedisConversationStateStore(redis, ttl_seconds=3600, key_prefix="test")
    state = ConversationState(
        session_id="session-1",
        patient_id="patient-1",
        active_flow=FlowName.RESCHEDULE,
        slots={"appointment_ref": "APT-001", "date_hint": "2027-01-02"},
    )

    await store.save(state)
    loaded = await store.load("session-1", "patient-1")
    wrong_patient = await store.load("session-1", "patient-2")
    await store.clear("session-1", "patient-1")
    cleared = await store.load("session-1", "patient-1")

    assert loaded == state
    assert wrong_patient is None
    assert cleared is None
    assert "test:conversation:session-1" not in redis.values


@pytest.mark.asyncio
async def test_shared_redis_state_allows_confirmation_after_graph_restart():
    redis = FakeRedis()
    tools = InMemoryDomainTools()
    first_graph = BookingLangGraph(
        domain_tools=tools,
        confirmation_store=RedisConfirmationStore(redis, key_prefix="test"),
        conversation_store=RedisConversationStateStore(redis, key_prefix="test"),
    )
    prepared = await first_graph.handle_chat(
        ChatRequest(
            session_id="restart",
            message="Book an oral check on 2027-02-03",
            selected_doctor_id="doctor-001",
            selected_booking_option_id="option-001",
        ),
        trusted_patient_id="patient-1",
    )
    assert prepared.confirmation is not None

    restarted_graph = BookingLangGraph(
        domain_tools=tools,
        confirmation_store=RedisConfirmationStore(redis, key_prefix="test"),
        conversation_store=RedisConversationStateStore(redis, key_prefix="test"),
    )
    confirmed = await restarted_graph.handle_chat(
        ChatRequest(
            session_id="restart",
            message="Confirm",
            confirmation_token=prepared.confirmation.token,
            confirmed=True,
        ),
        trusted_patient_id="patient-1",
    )

    assert confirmed.actions == ["commit_booking"]
    assert tools.mutations == ["commit_booking:option-001"]
