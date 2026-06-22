from __future__ import annotations

import json
from copy import deepcopy
from dataclasses import asdict
from typing import Any

from .confirmation_store import ConfirmationConsumeResult, PendingConfirmation
from .conversation_state import ConversationState
from .schemas import FlowName


_CONSUME_CONFIRMATION_SCRIPT = """
local value = redis.call("GET", ARGV[1])
if not value then
  local tombstone = redis.call("GET", ARGV[2])
  if tombstone then
    return {"missing", tombstone}
  end
  return {"missing", "invalid"}
end
redis.call("DEL", ARGV[1])
redis.call("SET", ARGV[2], "replayed", "EX", ARGV[4])
return {"stored", value}
"""


class RedisConfirmationStore:
    def __init__(self, redis: Any, *, ttl_seconds: float = 900, key_prefix: str = "booking_langgraph") -> None:
        if ttl_seconds <= 0:
            raise ValueError("ttl_seconds must be positive")
        self.redis = redis
        self.ttl_seconds = int(ttl_seconds)
        self.key_prefix = key_prefix.rstrip(":")

    async def create(self, confirmation: PendingConfirmation) -> None:
        await self.invalidate_session(confirmation.session_id)
        payload = {
            "token": confirmation.token,
            "session_id": confirmation.session_id,
            "patient_id": confirmation.patient_id,
            "flow": confirmation.flow.value,
            "action": confirmation.action,
            "payload": deepcopy(confirmation.payload),
            "summary": confirmation.summary,
        }
        token_key = self._token_key(confirmation.token)
        session_key = self._session_key(confirmation.session_id)
        await self.redis.set(token_key, json.dumps(payload), ex=self.ttl_seconds)
        await self.redis.sadd(session_key, confirmation.token)
        await self.redis.expire(session_key, self.ttl_seconds)

    async def invalidate_session(self, session_id: str) -> None:
        session_key = self._session_key(session_id)
        tokens = await self.redis.smembers(session_key)
        for raw_token in tokens:
            token = self._decode(raw_token)
            token_key = self._token_key(token)
            stored = await self.redis.get(token_key)
            if stored is not None:
                await self.redis.delete(token_key)
                await self.redis.set(self._tombstone_key(token), "superseded", ex=self.ttl_seconds)
        await self.redis.delete(session_key)

    async def consume(
        self,
        token: str,
        *,
        session_id: str,
        patient_id: str | None,
    ) -> ConfirmationConsumeResult:
        status, value = await self.redis.eval(
            _CONSUME_CONFIRMATION_SCRIPT,
            0,
            self._token_key(token),
            self._tombstone_key(token),
            token,
            str(self.ttl_seconds),
        )
        status = self._decode(status)
        value = self._decode(value)
        if status == "missing":
            return ConfirmationConsumeResult(status=value if value in {"expired", "superseded", "replayed"} else "invalid")
        data = json.loads(value or "{}")
        confirmation = PendingConfirmation(
            token=data["token"],
            session_id=data["session_id"],
            patient_id=data.get("patient_id"),
            flow=FlowName(data["flow"]),
            action=data["action"],
            payload=deepcopy(data["payload"]),
            summary=data["summary"],
        )
        if confirmation.session_id != session_id or confirmation.patient_id != patient_id:
            return ConfirmationConsumeResult(status="scope_mismatch")
        return ConfirmationConsumeResult(status="consumed", confirmation=confirmation)

    def _token_key(self, token: str) -> str:
        return f"{self.key_prefix}:confirmation:{token}"

    def _tombstone_key(self, token: str) -> str:
        return f"{self.key_prefix}:confirmation_tombstone:{token}"

    def _session_key(self, session_id: str) -> str:
        return f"{self.key_prefix}:confirmation_session:{session_id}"

    @staticmethod
    def _decode(value: Any) -> str | None:
        if value is None:
            return None
        if isinstance(value, bytes):
            return value.decode("utf-8")
        return str(value)


class RedisConversationStateStore:
    def __init__(self, redis: Any, *, ttl_seconds: float = 3600, key_prefix: str = "booking_langgraph") -> None:
        if ttl_seconds <= 0:
            raise ValueError("ttl_seconds must be positive")
        self.redis = redis
        self.ttl_seconds = int(ttl_seconds)
        self.key_prefix = key_prefix.rstrip(":")

    async def load(self, session_id: str, patient_id: str | None) -> ConversationState | None:
        value = await self.redis.get(self._key(session_id))
        if value is None:
            return None
        data = json.loads(RedisConfirmationStore._decode(value) or "{}")
        if data.get("patient_id") != patient_id:
            return None
        return ConversationState(
            session_id=data["session_id"],
            patient_id=data.get("patient_id"),
            active_flow=FlowName(data["active_flow"]),
            slots=deepcopy(data.get("slots") or {}),
        )

    async def save(self, state: ConversationState) -> None:
        data = asdict(state)
        data["active_flow"] = state.active_flow.value
        data["slots"] = deepcopy(state.slots)
        await self.redis.set(self._key(state.session_id), json.dumps(data), ex=self.ttl_seconds)

    async def clear(self, session_id: str, patient_id: str | None) -> None:
        current = await self.load(session_id, patient_id)
        if current is not None:
            await self.redis.delete(self._key(session_id))

    def _key(self, session_id: str) -> str:
        return f"{self.key_prefix}:conversation:{session_id}"
