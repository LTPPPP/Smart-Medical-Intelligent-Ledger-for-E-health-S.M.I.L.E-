from __future__ import annotations

from collections.abc import Callable
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
    ttl_seconds: int
    items: list[Candidate]

    def is_stale(self, now: datetime) -> bool:
        return (now - self.fetched_at).total_seconds() > self.ttl_seconds

    def render_for_prompt(self) -> list[str]:
        return [
            f"{self.kind}_andidates[{index}] {candidate.label} ({candidate.id})"
            if self.kind.endswith("y")
            else f"{self.kind}_candidates[{index}] {candidate.label} ({candidate.id})"
            for index, candidate in enumerate(self.items, start=1)
        ]


ORDINALS = {
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
    for kind, candidate_list in state.candidates.items():
        if not isinstance(candidate_list, CandidateList) or candidate_list.is_stale(current_time):
            continue
        candidates[kind] = candidate_list.render_for_prompt()
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
        "recent_turns": list(state.recent_turns),
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
