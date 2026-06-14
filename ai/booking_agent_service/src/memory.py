from __future__ import annotations

from collections.abc import Callable
from datetime import datetime
import json
from typing import Any

from pydantic import BaseModel, Field

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


def _normalize(text: str) -> str:
    import unicodedata

    decomposed = unicodedata.normalize("NFD", text.lower().replace("đ", "d"))
    return "".join(char for char in decomposed if unicodedata.category(char) != "Mn")


def resolve_reference(text: str, candidates: CandidateList, now: datetime) -> Candidate:
    if candidates.is_stale(now):
        raise ReferenceResolutionError("candidate_list_stale")
    normalized = _normalize(text)
    for phrase, index in ORDINALS.items():
        if phrase in normalized:
            if 1 <= index <= len(candidates.items):
                return candidates.items[index - 1]
            raise ReferenceResolutionError("candidate_index_out_of_range")
    for candidate in candidates.items:
        if candidate.id in text:
            return candidate
    raise ReferenceResolutionError("reference_not_resolved")


class InMemoryStateStore:
    def __init__(self, now: Callable[[], datetime] = utc_now) -> None:
        self.now = now
        self._states: dict[str, AgentState] = {}

    def load_payload(self, payload: dict[str, Any]) -> tuple[AgentState, bool]:
        try:
            if "state_schema_version" not in payload:
                payload = {"state_schema_version": AgentState.CURRENT_SCHEMA_VERSION, **payload}
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
