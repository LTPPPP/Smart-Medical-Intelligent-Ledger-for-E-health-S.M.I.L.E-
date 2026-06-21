from __future__ import annotations

import re
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class FlowName(StrEnum):
    LOOKUP = "lookup"
    BOOKING = "booking"
    CANCEL = "cancel"
    RESCHEDULE = "reschedule"
    INFO = "info"
    UNKNOWN = "unknown"


class SideEffectLevel(StrEnum):
    READ = "read"
    PREPARE_MUTATION = "prepare_mutation"
    MUTATION = "mutation"


class ChatRequest(BaseModel):
    session_id: str = Field(min_length=1)
    message: str = Field(default="", max_length=4000)
    confirmation_token: str | None = None
    confirmed: bool | None = None


class ConfirmationRequest(BaseModel):
    token: str
    flow: FlowName
    action: str
    summary: str


class ChatResponse(BaseModel):
    reply: str
    flow: FlowName
    safe_state: dict[str, Any] = Field(default_factory=dict)
    actions: list[str] = Field(default_factory=list)
    confirmation: ConfirmationRequest | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class SlotUpdate(BaseModel):
    name: str
    value: Any
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    source_text: str | None = None


class Candidate(BaseModel):
    kind: str
    id: str
    label: str
    payload: dict[str, Any] = Field(default_factory=dict)


class AgentCommand(BaseModel):
    intent: FlowName
    language: str = "en"
    slot_updates: list[SlotUpdate] = Field(default_factory=list)
    selected_reference: str | None = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    missing_slots: list[str] = Field(default_factory=list)

    @classmethod
    def from_english_message(cls, message: str) -> "AgentCommand":
        text = message.lower()
        appointment_code = _extract_appointment_code(message)
        iso_date = _extract_iso_date(message)
        slots: list[SlotUpdate] = []
        if appointment_code:
            slots.append(SlotUpdate(name="appointment_ref", value=appointment_code, source_text=appointment_code))
        if iso_date:
            slots.append(SlotUpdate(name="date_hint", value=iso_date, source_text=iso_date))

        if any(term in text for term in ("reschedule", "move", "change my appointment", "change appointment")):
            return cls(
                intent=FlowName.RESCHEDULE,
                slot_updates=slots,
                selected_reference=appointment_code,
                confidence=0.82,
            )
        if any(term in text for term in ("cancel", "call off")):
            return cls(
                intent=FlowName.CANCEL,
                slot_updates=slots,
                selected_reference=appointment_code,
                confidence=0.86,
            )
        if any(term in text for term in ("book", "schedule", "appointment with", "make an appointment")):
            return cls(intent=FlowName.BOOKING, slot_updates=slots, confidence=0.78)
        if any(term in text for term in ("show", "list", "see", "view", "my appointments", "appointments")):
            return cls(intent=FlowName.LOOKUP, slot_updates=slots, confidence=0.8)
        return cls(intent=FlowName.UNKNOWN, slot_updates=slots, confidence=0.35, missing_slots=["intent"])


class DomainToolSpec(BaseModel):
    name: str
    intent: FlowName
    phase: str
    required_slots: list[str]
    side_effect: SideEffectLevel
    requires_confirmation: bool
    idempotency_scope: str
    timeout_seconds: float = Field(gt=0)
    retry_policy: str
    safe_error_category: str
    allowed_graph_nodes: list[str]


class AgentMetricsEvent(BaseModel):
    trace_id: str
    session_id: str
    flow: FlowName
    graph_path: list[str]
    metrics: dict[str, Any]


def _extract_appointment_code(message: str) -> str | None:
    match = re.search(r"\b(?:APT-[A-Z0-9-]+|appt-[A-Za-z0-9-]+)\b", message, re.I)
    if not match:
        return None
    return match.group(0)


def _extract_iso_date(message: str) -> str | None:
    match = re.search(r"\b20\d{2}-\d{2}-\d{2}\b", message)
    return match.group(0) if match else None
