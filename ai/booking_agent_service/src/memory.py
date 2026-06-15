from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
import json
import re
from typing import Any

from pydantic import BaseModel, Field

from .redaction import redact_text
from .state import AgentState, utc_now


class ReferenceResolutionError(ValueError):
    pass


class Candidate(BaseModel):
    id: str
    label: str
    payload: dict[str, Any] = Field(default_factory=dict)


class CandidateList(BaseModel):
    kind: str
    fetched_at: datetime
    presented_at: datetime | None = None
    ttl_seconds: int
    items: list[Candidate]

    def is_stale(self, now: datetime) -> bool:
        return (now - self.fetched_at).total_seconds() > self.ttl_seconds

    def render_for_prompt(self, *, limit: int = 20, label_limit: int = 160) -> list[str]:
        return [
            f"{self.kind}_andidates[{index}] {candidate.label} ({candidate.id})"
            if self.kind.endswith("y")
            else f"{self.kind}_candidates[{index}] {candidate.label[:label_limit]} ({candidate.id})"
            for index, candidate in enumerate(self.items[:limit], start=1)
        ]


ORDINALS = {
    "cai dau tien": 1,
    "dau": 1,
    "dau tien": 1,
    "slot dau": 1,
    "lich dau": 1,
    "thu nhat": 1,
    "1": 1,
    "thu hai": 2,
    "slot hai": 2,
    "2": 2,
}

DEMONSTRATIVE_REFERENCES = (
    "bac si nay",
    "bac si do",
    "lich nay",
    "lich do",
    "slot nay",
    "slot do",
    "cai nay",
    "cai do",
)

EXPLICIT_KIND_PHRASES = {
    "clinic": ("phong kham", "chi nhanh"),
    "service": ("dich vu",),
    "specialty": ("chuyen khoa",),
    "schedule": ("lich bac si", "lich kham", "slot", "bac si"),
    "appointment": ("lich hen", "cuoc hen"),
}


@dataclass(frozen=True)
class ResolvedReference:
    kind: str
    candidate: Candidate


def _normalize(text: str) -> str:
    import unicodedata

    decomposed = unicodedata.normalize("NFD", text.lower().replace("đ", "d"))
    return "".join(char for char in decomposed if unicodedata.category(char) != "Mn")


def _contains_phrase(text: str, phrase: str) -> bool:
    return re.search(rf"(?<!\w){re.escape(phrase)}(?!\w)", text) is not None


def resolve_reference(text: str, candidates: CandidateList, now: datetime) -> Candidate:
    if candidates.is_stale(now):
        raise ReferenceResolutionError("candidate_list_stale")
    normalized = _normalize(text)
    for phrase, index in ORDINALS.items():
        if _contains_phrase(normalized, phrase):
            if 1 <= index <= len(candidates.items):
                return candidates.items[index - 1]
            raise ReferenceResolutionError("candidate_index_out_of_range")
    for candidate in candidates.items:
        if candidate.id in text:
            return candidate
    if any(_contains_phrase(normalized, phrase) for phrase in DEMONSTRATIVE_REFERENCES):
        if len(candidates.items) == 1:
            return candidates.items[0]
        raise ReferenceResolutionError("reference_ambiguous")
    raise ReferenceResolutionError("reference_not_resolved")


def _required_candidate_kind(goal: str, slots: Any, candidates: dict[str, CandidateList]) -> str | None:
    if goal == "booking":
        priorities = (
            ("clinic", "clinic_id"),
            ("specialty", "specialty_id"),
            ("service", "service_id"),
            ("schedule", "schedule_id"),
        )
    elif goal == "cancel":
        priorities = (("appointment", "appointment_id"),)
    else:
        return None
    for kind, slot_name in priorities:
        if kind in candidates and getattr(slots, slot_name, None) is None:
            return kind
    return None


def resolve_state_reference(
    text: str,
    candidates: dict[str, Any],
    *,
    goal: str,
    slots: Any,
    now: datetime,
) -> ResolvedReference:
    active = {
        kind: candidate_list
        for kind, candidate_list in candidates.items()
        if isinstance(candidate_list, CandidateList) and not candidate_list.is_stale(now)
    }
    normalized = _normalize(text)
    explicit_kinds = [
        kind
        for kind, phrases in EXPLICIT_KIND_PHRASES.items()
        if kind in active and any(_contains_phrase(normalized, phrase) for phrase in phrases)
    ]
    if len(explicit_kinds) > 1:
        raise ReferenceResolutionError("reference_kind_ambiguous")
    if explicit_kinds:
        kind = explicit_kinds[0]
        return ResolvedReference(kind, resolve_reference(text, active[kind], now))

    required_kind = _required_candidate_kind(goal, slots, active)
    if required_kind is not None:
        return ResolvedReference(required_kind, resolve_reference(text, active[required_kind], now))

    if not active:
        raise ReferenceResolutionError("reference_not_resolved")
    latest = max(
        candidate_list.presented_at or candidate_list.fetched_at
        for candidate_list in active.values()
    )
    latest_kinds = [
        kind
        for kind, candidate_list in active.items()
        if (candidate_list.presented_at or candidate_list.fetched_at) == latest
    ]
    if len(latest_kinds) != 1:
        raise ReferenceResolutionError("reference_kind_ambiguous")
    kind = latest_kinds[0]
    return ResolvedReference(kind, resolve_reference(text, active[kind], now))


def record_recent_turn(
    state: AgentState,
    role: str,
    content: str,
    *,
    max_turns: int = 8,
) -> None:
    state.recent_turns.append({"role": role, "content": redact_text(content)})
    state.recent_turns = state.recent_turns[-max_turns:]


def build_safe_memory_view(state: AgentState, now: datetime | None = None) -> dict[str, Any]:
    current_time = now or utc_now()
    candidates: dict[str, list[str]] = {}
    active_candidates = {
        kind: candidate_list
        for kind, candidate_list in state.candidates.items()
        if isinstance(candidate_list, CandidateList) and not candidate_list.is_stale(current_time)
    }
    active_kind = {"booking": "schedule", "cancel": "appointment"}.get(state.current_goal)
    ordered_kinds = sorted(
        active_candidates,
        key=lambda kind: (
            kind == active_kind,
            active_candidates[kind].presented_at or active_candidates[kind].fetched_at,
        ),
        reverse=True,
    )
    remaining_candidates = 40
    for kind in ordered_kinds:
        if remaining_candidates <= 0:
            break
        rendered = active_candidates[kind].render_for_prompt(
            limit=min(20, remaining_candidates)
        )
        if rendered:
            candidates[kind] = rendered
            remaining_candidates -= len(rendered)
    pending = None
    if state.pending_confirmation is not None and not state.pending_confirmation.is_expired(
        current_time
    ):
        pending = {
            "operation": state.pending_confirmation.operation,
            "summary": state.pending_confirmation.summary,
        }
    return {
        "goal": state.current_goal,
        "slots": state.slots.model_dump(exclude_none=True),
        "recent_turns": [
            {**turn, "content": turn.get("content", "")[:500]}
            for turn in state.recent_turns[-8:]
        ],
        "candidates": candidates,
        "pending_confirmation": pending,
    }


class InMemoryStateStore:
    def __init__(self, now: Callable[[], datetime] = utc_now) -> None:
        self.now = now
        self._states: dict[str, AgentState] = {}

    def load_payload(self, payload: dict[str, Any]) -> tuple[AgentState, bool]:
        try:
            version = payload.get("state_schema_version", 1)
            if version < AgentState.CURRENT_SCHEMA_VERSION:
                payload = {
                    **payload,
                    "state_schema_version": AgentState.CURRENT_SCHEMA_VERSION,
                    "slots": payload.get("slots", {}),
                }
            return AgentState.model_validate(payload), False
        except Exception:
            return AgentState.new(), True

    def get(self, session_id: str) -> AgentState:
        return self._states.setdefault(session_id, AgentState.new(session_id))

    def save(self, state: AgentState) -> None:
        self._states[state.session_id] = state


class RedisStateStore:
    def __init__(
        self,
        redis_client: object,
        ttl_seconds: int,
        key_prefix: str = "booking-agent:state",
    ) -> None:
        self.redis = redis_client
        self.ttl_seconds = ttl_seconds
        self.key_prefix = key_prefix

    def _key(self, session_id: str) -> str:
        return f"{self.key_prefix}:{session_id}"

    async def get(self, session_id: str) -> AgentState:
        raw = await self.redis.get(self._key(session_id))
        if raw is None:
            return AgentState.new(session_id)
        if isinstance(raw, bytes):
            raw = raw.decode()
        try:
            payload = json.loads(raw)
        except Exception:
            return AgentState.new(session_id)
        state, recovered = InMemoryStateStore().load_payload(payload)
        if recovered:
            return AgentState.new(session_id)
        state.session_id = session_id
        return state

    async def save(self, state: AgentState) -> None:
        await self.redis.set(
            self._key(state.session_id),
            state.model_dump_json(),
            ex=self.ttl_seconds,
        )
