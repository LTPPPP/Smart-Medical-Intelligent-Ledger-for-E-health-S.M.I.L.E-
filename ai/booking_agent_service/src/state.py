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


class WorkflowSlots(BaseModel):
    clinic_id: str | None = None
    clinic_label: str | None = None
    service_id: str | None = None
    service_label: str | None = None
    specialty_id: str | None = None
    specialty_label: str | None = None
    doctor_id: str | None = None
    doctor_label: str | None = None
    schedule_id: str | None = None
    schedule_label: str | None = None
    preferred_date: str | None = None
    preferred_time: str | None = None
    appointment_id: str | None = None
    appointment_code: str | None = None
    appointment_label: str | None = None

    def clear_for_goal(self, goal: str) -> None:
        if goal == "cancel":
            for field in (
                "clinic_id",
                "clinic_label",
                "service_id",
                "service_label",
                "specialty_id",
                "specialty_label",
                "doctor_id",
                "doctor_label",
                "schedule_id",
                "schedule_label",
                "preferred_date",
                "preferred_time",
            ):
                setattr(self, field, None)
        elif goal == "booking":
            for field in ("appointment_id", "appointment_code", "appointment_label"):
                setattr(self, field, None)


class AgentState(BaseModel):
    CURRENT_SCHEMA_VERSION: ClassVar[int] = 2

    state_schema_version: int = 2
    session_id: str
    current_goal: str = "unknown"
    patient_id: str | None = None
    pending_confirmation: PendingConfirmation | None = None
    slots: WorkflowSlots = Field(default_factory=WorkflowSlots)
    candidates: dict[str, Any] = Field(default_factory=dict)
    recent_turns: list[dict[str, str]] = Field(default_factory=list)
    observations: list[dict[str, Any]] = Field(default_factory=list)

    def switch_goal(self, goal: str) -> None:
        if goal != self.current_goal:
            self.slots.clear_for_goal(goal)
            self.pending_confirmation = None
        self.current_goal = goal

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
