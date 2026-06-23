from __future__ import annotations

import re
from enum import StrEnum
from typing import Any, Literal, TypeAlias

from pydantic import BaseModel, Field


class FlowName(StrEnum):
    LOOKUP = "lookup"
    BOOKING = "booking"
    CANCEL = "cancel"
    RESCHEDULE = "reschedule"
    INFO = "info"
    CONVERSATIONAL = "conversational"
    OUT_OF_SCOPE = "out_of_scope"
    UNKNOWN = "unknown"


DialogueAct: TypeAlias = Literal[
    "correct",
    "abort",
    "switch",
    "request",
    "inform",
    "clarify",
    "confirm",
    "reject",
    "greet",
    "identity",
    "abuse",
    "other",
]


class SideEffectLevel(StrEnum):
    READ = "read"
    PREPARE_MUTATION = "prepare_mutation"
    MUTATION = "mutation"


class ChatRequest(BaseModel):
    session_id: str = Field(min_length=1)
    message: str = Field(default="", max_length=4000)
    selected_booking_option_id: str | None = None
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
    secondary_intents: list[FlowName] = Field(default_factory=list)
    dialogue_act: DialogueAct | None = None
    language: str = "en"
    slot_updates: list[SlotUpdate] = Field(default_factory=list)
    selected_reference: str | None = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    missing_slots: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    preferences: list[str] = Field(default_factory=list)
    negations: list[str] = Field(default_factory=list)
    direct_response: str | None = None

    @classmethod
    def from_english_message(cls, message: str) -> "AgentCommand":
        text = message.lower()
        normalized_text = _strip_vietnamese_accents(text)
        appointment_code = _extract_appointment_code(message)
        iso_date = _extract_iso_date(message)
        time_hint = _extract_time_hint(message)
        slots: list[SlotUpdate] = []
        if appointment_code:
            slots.append(SlotUpdate(name="appointment_ref", value=appointment_code, source_text=appointment_code))
        if iso_date:
            slots.append(SlotUpdate(name="date_hint", value=iso_date, source_text=iso_date))
        if time_hint:
            slots.append(SlotUpdate(name="time_hint", value=time_hint, source_text=time_hint))

        if any(
            term in normalized_text
            for term in (
                "reschedule",
                "move",
                "change my appointment",
                "change appointment",
                "doi lich",
                "doi hen",
                "chuyen lich",
                "dời lịch",
            )
        ):
            return cls(
                intent=FlowName.RESCHEDULE,
                language="vi" if _looks_vietnamese(message) else "en",
                slot_updates=slots,
                selected_reference=appointment_code,
                confidence=0.82,
            )
        if any(term in normalized_text for term in ("cancel", "call off", "huy lich", "huy hen")):
            return cls(
                intent=FlowName.CANCEL,
                language="vi" if _looks_vietnamese(message) else "en",
                slot_updates=slots,
                selected_reference=appointment_code,
                confidence=0.86,
            )
        if any(
            term in normalized_text
            for term in (
                "book",
                "schedule",
                "appointment with",
                "make an appointment",
                "dat lich",
                "dat hen",
                "kham rang",
            )
        ):
            return cls(
                intent=FlowName.BOOKING,
                language="vi" if _looks_vietnamese(message) else "en",
                slot_updates=slots,
                confidence=0.78,
            )
        if any(
            term in normalized_text
            for term in (
                "show",
                "list",
                "see",
                "view",
                "my appointments",
                "appointments",
                "xem lich",
                "lich hen",
                "lich sap toi",
            )
        ):
            return cls(
                intent=FlowName.LOOKUP,
                language="vi" if _looks_vietnamese(message) else "en",
                slot_updates=slots,
                confidence=0.8,
            )
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


def _extract_time_hint(message: str) -> str | None:
    match = re.search(r"\b([01]?\d|2[0-3]):([0-5]\d)\b", message)
    if not match:
        return None
    hour = int(match.group(1))
    minute = int(match.group(2))
    return f"{hour:02d}:{minute:02d}"


def _strip_vietnamese_accents(value: str) -> str:
    replacements = str.maketrans(
        {
            "à": "a",
            "á": "a",
            "ạ": "a",
            "ả": "a",
            "ã": "a",
            "â": "a",
            "ầ": "a",
            "ấ": "a",
            "ậ": "a",
            "ẩ": "a",
            "ẫ": "a",
            "ă": "a",
            "ằ": "a",
            "ắ": "a",
            "ặ": "a",
            "ẳ": "a",
            "ẵ": "a",
            "è": "e",
            "é": "e",
            "ẹ": "e",
            "ẻ": "e",
            "ẽ": "e",
            "ê": "e",
            "ề": "e",
            "ế": "e",
            "ệ": "e",
            "ể": "e",
            "ễ": "e",
            "ì": "i",
            "í": "i",
            "ị": "i",
            "ỉ": "i",
            "ĩ": "i",
            "ò": "o",
            "ó": "o",
            "ọ": "o",
            "ỏ": "o",
            "õ": "o",
            "ô": "o",
            "ồ": "o",
            "ố": "o",
            "ộ": "o",
            "ổ": "o",
            "ỗ": "o",
            "ơ": "o",
            "ờ": "o",
            "ớ": "o",
            "ợ": "o",
            "ở": "o",
            "ỡ": "o",
            "ù": "u",
            "ú": "u",
            "ụ": "u",
            "ủ": "u",
            "ũ": "u",
            "ư": "u",
            "ừ": "u",
            "ứ": "u",
            "ự": "u",
            "ử": "u",
            "ữ": "u",
            "ỳ": "y",
            "ý": "y",
            "ỵ": "y",
            "ỷ": "y",
            "ỹ": "y",
            "đ": "d",
        }
    )
    return value.translate(replacements)


def _looks_vietnamese(message: str) -> bool:
    return _strip_vietnamese_accents(message.lower()) != message.lower()
