from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from src.locks import InMemorySessionLock, RedisSessionLock
from src.memory import (
    Candidate,
    CandidateList,
    InMemoryStateStore,
    ReferenceResolutionError,
    RedisStateStore,
    build_safe_memory_view,
    record_recent_turn,
    resolve_state_reference,
    resolve_reference,
)
from src.state import AgentState, PendingConfirmation, WorkflowSlots


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
    with pytest.raises(ReferenceResolutionError):
        resolve_reference("ngày 12 tháng 6", candidates, now=NOW)

    only_one = CandidateList(
        kind="schedule",
        fetched_at=NOW,
        ttl_seconds=90,
        items=[Candidate(id="schedule-only", label="09:00 Bac si A")],
    )
    assert resolve_reference("bác sĩ này", only_one, now=NOW).id == "schedule-only"
    with pytest.raises(ReferenceResolutionError):
        resolve_reference("bác sĩ này", candidates, now=NOW)


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


def test_state_store_restores_candidate_lists_from_serialized_payload():
    store = InMemoryStateStore(now=lambda: NOW)
    state = AgentState(
        session_id="s1",
        candidates={
            "clinic": CandidateList(
                kind="clinic",
                fetched_at=NOW,
                ttl_seconds=600,
                items=[
                    Candidate(
                        id="11111111-1111-4111-8111-111111111111",
                        label="Clinic A",
                    )
                ],
            )
        },
    )

    loaded, recovered = store.load_payload(state.model_dump(mode="json"))
    resolved = resolve_state_reference(
        "chi nhánh đầu tiên",
        loaded.candidates,
        goal=loaded.current_goal,
        slots=loaded.slots,
        now=NOW,
    )

    assert recovered is False
    assert isinstance(loaded.candidates["clinic"], CandidateList)
    assert resolved.candidate.id == "11111111-1111-4111-8111-111111111111"


@pytest.mark.asyncio
async def test_redis_state_store_persists_versioned_state_with_ttl_and_recovers_malformed():
    class FakeRedis:
        def __init__(self):
            self.values: dict[str, str] = {}
            self.set_calls: list[dict] = []

        async def get(self, key):
            return self.values.get(key)

        async def set(self, key, value, ex=None):
            self.values[key] = value
            self.set_calls.append({"key": key, "value": value, "ex": ex})

    fake = FakeRedis()
    store = RedisStateStore(fake, ttl_seconds=3600, key_prefix="test-state")
    state = AgentState(session_id="s1", current_goal="lookup")

    await store.save(state)
    loaded = await store.get("s1")
    fake.values["test-state:broken"] = "{not-json"
    recovered = await store.get("broken")

    assert fake.set_calls[0]["key"] == "test-state:s1"
    assert fake.set_calls[0]["ex"] == 3600
    assert loaded.current_goal == "lookup"
    assert recovered.session_id == "broken"
    assert recovered.current_goal == "unknown"


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


def test_structured_slots_and_goal_switch_clear_only_incompatible_workflow_fields():
    state = AgentState(
        session_id="s1",
        current_goal="booking",
        slots=WorkflowSlots(
            clinic_id="clinic-1",
            clinic_label="Nha khoa trung tâm",
            doctor_id="doctor-1",
            doctor_label="Bác sĩ An",
            preferred_date="2026-06-20",
            appointment_code="APT-20260620-0001",
        ),
    )

    state.switch_goal("cancel")

    assert state.current_goal == "cancel"
    assert state.slots.appointment_code == "APT-20260620-0001"
    assert state.slots.clinic_id is None
    assert state.slots.doctor_id is None
    assert state.slots.preferred_date is None


def test_recent_turns_are_redacted_bounded_and_safe_memory_hides_candidate_payloads():
    state = AgentState(
        session_id="s1",
        current_goal="booking",
        slots=WorkflowSlots(
            clinic_id="clinic-1",
            clinic_label="Nha khoa trung tâm",
            preferred_date="2026-06-20",
        ),
        candidates={
            "schedule": CandidateList(
                kind="schedule",
                fetched_at=NOW,
                ttl_seconds=90,
                items=[
                    Candidate(
                        id="schedule-1",
                        label="20/06 lúc 09:00 với bác sĩ An",
                        payload={"secret_backend_field": "do-not-expose"},
                    )
                ],
            )
        },
    )
    for index in range(8):
        record_recent_turn(
            state,
            "user",
            f"Tin {index}, gọi tôi theo số 0912345678",
            max_turns=4,
        )

    view = build_safe_memory_view(state, now=NOW)

    assert len(state.recent_turns) == 4
    assert all("0912345678" not in turn["content"] for turn in state.recent_turns)
    assert view["slots"]["clinic_label"] == "Nha khoa trung tâm"
    assert view["candidates"]["schedule"] == [
        "schedule_candidates[1] 20/06 lúc 09:00 với bác sĩ An (schedule-1)"
    ]
    assert "secret_backend_field" not in str(view)


def test_safe_memory_bounds_candidate_prompt_view_and_recent_turn_lengths():
    def candidate_list(kind: str, presented_minute: int) -> CandidateList:
        return CandidateList(
            kind=kind,
            fetched_at=NOW,
            presented_at=NOW + timedelta(minutes=presented_minute),
            ttl_seconds=600,
            items=[
                Candidate(id=f"{kind}-{index}", label=("x" * 200) + str(index))
                for index in range(30)
            ],
        )

    state = AgentState(
        session_id="s1",
        current_goal="booking",
        recent_turns=[{"role": "user", "content": "y" * 700}],
        candidates={
            "clinic": candidate_list("clinic", 1),
            "service": candidate_list("service", 3),
            "schedule": candidate_list("schedule", 2),
        },
    )

    view = build_safe_memory_view(state, now=NOW)

    assert set(view["candidates"]) == {"service", "schedule"}
    assert sum(len(items) for items in view["candidates"].values()) == 40
    assert all(
        len(line.split(" (", 1)[0]) <= len("schedule_candidates[20] ") + 160
        for items in view["candidates"].values()
        for line in items
    )
    assert len(view["recent_turns"][0]["content"]) == 500
    assert resolve_reference("thứ hai", state.candidates["clinic"], now=NOW).id == "clinic-1"


def test_state_reference_resolution_uses_explicit_kind_then_required_slot_then_recent_list():
    clinic = CandidateList(
        kind="clinic",
        fetched_at=NOW,
        presented_at=NOW,
        ttl_seconds=600,
        items=[
            Candidate(id="clinic-1", label="Clinic A"),
            Candidate(id="clinic-2", label="Clinic B"),
        ],
    )
    service = CandidateList(
        kind="service",
        fetched_at=NOW,
        presented_at=NOW + timedelta(seconds=1),
        ttl_seconds=600,
        items=[
            Candidate(id="service-1", label="Service A"),
            Candidate(id="service-2", label="Service B"),
        ],
    )

    explicit = resolve_state_reference(
        "phòng khám thứ hai",
        {"clinic": clinic, "service": service},
        goal="unknown",
        slots=WorkflowSlots(),
        now=NOW,
    )
    required = resolve_state_reference(
        "cái thứ hai",
        {"clinic": clinic, "service": service},
        goal="booking",
        slots=WorkflowSlots(),
        now=NOW,
    )
    recent = resolve_state_reference(
        "cái thứ hai",
        {"clinic": clinic, "service": service},
        goal="unknown",
        slots=WorkflowSlots(),
        now=NOW,
    )

    assert (explicit.kind, explicit.candidate.id) == ("clinic", "clinic-2")
    assert (required.kind, required.candidate.id) == ("clinic", "clinic-2")
    assert (recent.kind, recent.candidate.id) == ("service", "service-2")


def test_state_reference_resolution_rejects_equal_priority_candidate_lists():
    clinic = CandidateList(
        kind="clinic",
        fetched_at=NOW,
        presented_at=NOW,
        ttl_seconds=600,
        items=[Candidate(id="clinic-1", label="Clinic A")],
    )
    service = CandidateList(
        kind="service",
        fetched_at=NOW,
        presented_at=NOW,
        ttl_seconds=600,
        items=[Candidate(id="service-1", label="Service A")],
    )

    with pytest.raises(ReferenceResolutionError, match="reference_kind_ambiguous"):
        resolve_state_reference(
            "cái đầu tiên",
            {"clinic": clinic, "service": service},
            goal="unknown",
            slots=WorkflowSlots(),
            now=NOW,
        )
