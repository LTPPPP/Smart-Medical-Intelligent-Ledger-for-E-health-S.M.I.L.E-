from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from src.locks import InMemorySessionLock, RedisSessionLock
from src.memory import (
    Candidate,
    CandidateList,
    InMemoryStateStore,
    ReferenceResolutionError,
    resolve_reference,
)
from src.state import AgentState, PendingConfirmation


NOW = datetime(2026, 6, 14, 12, 0, tzinfo=timezone.utc)


def test_candidate_indexes_and_vietnamese_ordinals_resolve_deterministically():
    candidates = CandidateList(
        kind="schedule",
        fetched_at=NOW,
        ttl_seconds=90,
        items=[
            Candidate(id="schedule-1", label="09:00 Bac si A"),
            Candidate(id="schedule-2", label="10:00 Bac si B"),
        ],
    )

    assert candidates.render_for_prompt()[0].startswith("schedule_candidates[1]")
    assert resolve_reference("slot đầu", candidates, now=NOW).id == "schedule-1"
    assert resolve_reference("thứ hai", candidates, now=NOW).id == "schedule-2"

    with pytest.raises(ReferenceResolutionError):
        resolve_reference("thứ ba", candidates, now=NOW)


def test_stale_schedule_requires_refresh_but_patient_appointments_last_longer():
    schedule = CandidateList(
        kind="schedule",
        fetched_at=NOW - timedelta(seconds=91),
        ttl_seconds=90,
        items=[Candidate(id="schedule-1", label="09:00")],
    )
    appointment = CandidateList(
        kind="appointment",
        fetched_at=NOW - timedelta(minutes=9),
        ttl_seconds=600,
        items=[Candidate(id="appointment-1", label="APT-20260614-0001")],
    )

    assert schedule.is_stale(NOW) is True
    assert appointment.is_stale(NOW) is False


def test_state_store_migrates_old_state_and_resets_malformed_payload():
    store = InMemoryStateStore(now=lambda: NOW)
    old_payload = {
        "session_id": "s1",
        "current_goal": "booking",
        "patient_id": "11111111-1111-4111-8111-111111111111",
    }

    migrated, migrated_recovered = store.load_payload(old_payload)
    reset, reset_recovered = store.load_payload({"bad": object()})

    assert migrated.session_id == "s1"
    assert migrated.state_schema_version == AgentState.CURRENT_SCHEMA_VERSION
    assert migrated_recovered is False
    assert reset.current_goal == "unknown"
    assert reset_recovered is True


@pytest.mark.asyncio
async def test_session_lock_prevents_overlapping_turns_and_releases():
    lock = InMemorySessionLock(ttl_seconds=5)

    first = await lock.acquire("s1")
    second = await lock.acquire("s1")
    await first.release()
    third = await lock.acquire("s1")

    assert first.acquired is True
    assert second.acquired is False
    assert third.acquired is True


@pytest.mark.asyncio
async def test_redis_session_lock_uses_set_nx_with_ttl_and_token_safe_release():
    class FakeRedis:
        def __init__(self):
            self.values: dict[str, str] = {}
            self.set_calls: list[dict] = []
            self.deleted: list[str] = []

        async def set(self, key, value, nx=False, ex=None):
            self.set_calls.append({"key": key, "value": value, "nx": nx, "ex": ex})
            if nx and key in self.values:
                return False
            self.values[key] = value
            return True

        async def get(self, key):
            return self.values.get(key)

        async def delete(self, key):
            self.deleted.append(key)
            self.values.pop(key, None)

    fake = FakeRedis()
    lock = RedisSessionLock(fake, ttl_seconds=8, key_prefix="test-lock")

    first = await lock.acquire("s1")
    second = await lock.acquire("s1")
    await first.release()

    assert first.acquired is True
    assert second.acquired is False
    assert fake.set_calls[0]["key"] == "test-lock:s1"
    assert fake.set_calls[0]["nx"] is True
    assert fake.set_calls[0]["ex"] == 8
    assert fake.deleted == ["test-lock:s1"]


def test_pending_confirmation_expires_and_consumes_once():
    pending = PendingConfirmation(
        confirmation_id="confirm-1",
        operation="book_by_doctor",
        summary="Đặt lịch 09:00",
        created_at=NOW,
        expires_at=NOW + timedelta(minutes=2),
        idempotency_key="s1:confirm-1:book_by_doctor",
        payload={"doctor_id": "doctor-1"},
    )

    assert pending.is_expired(NOW + timedelta(seconds=119)) is False
    assert pending.consume() is True
    assert pending.consume() is False
    assert pending.is_expired(NOW + timedelta(seconds=121)) is True
