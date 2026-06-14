from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, ClassVar
from uuid import uuid4

from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class PendingConfirmation(BaseModel):
    confirmation_id: str
    operation: str
    summary: str
    created_at: datetime
    expires_at: datetime
    idempotency_key: str
    payload: dict[str, Any]
    consumed: bool = False
    failed: bool = False

    def is_expired(self, now: datetime) -> bool:
        return now >= self.expires_at

    def consume(self) -> bool:
        if self.consumed:
            return False
        self.consumed = True
        return True


class AgentState(BaseModel):
    CURRENT_SCHEMA_VERSION: ClassVar[int] = 1

    state_schema_version: int = 1
    session_id: str
    current_goal: str = "unknown"
    patient_id: str | None = None
    pending_confirmation: PendingConfirmation | None = None
    candidates: dict[str, Any] = Field(default_factory=dict)
    recent_turns: list[dict[str, str]] = Field(default_factory=list)
    observations: list[dict[str, Any]] = Field(default_factory=list)

    @classmethod
    def new(cls, session_id: str = "recovered") -> "AgentState":
        return cls(session_id=session_id, state_schema_version=cls.CURRENT_SCHEMA_VERSION)

    @classmethod
    def with_pending_confirmation(
        cls,
        session_id: str,
        patient_id: str,
        operation: str,
        payload: dict[str, Any],
    ) -> "AgentState":
        confirmation_id = f"confirm-{uuid4()}"
        now = utc_now()
        return cls(
            session_id=session_id,
            patient_id=patient_id,
            current_goal="booking",
            pending_confirmation=PendingConfirmation(
                confirmation_id=confirmation_id,
                operation=operation,
                summary=operation,
                created_at=now,
                expires_at=now + timedelta(minutes=2),
                idempotency_key=f"{session_id}:{confirmation_id}:{operation}",
                payload=payload,
            ),
        )
