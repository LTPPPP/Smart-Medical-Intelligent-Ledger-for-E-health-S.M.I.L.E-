from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


RoutingDecisionValue = Literal[
    "ALLOW_TOOL_PROFILE",
    "ASK_FOR_MISSING_INFO",
    "SAFETY_OVERRIDE",
    "FALLBACK_INFO",
]
RoutingConfidence = Literal["HIGH", "MEDIUM", "LOW"]


class PatientState(BaseModel):
    model_config = ConfigDict(extra="ignore")

    full_name: str | None = None
    phone: str | None = None
    email: str | None = None

    def has_required_contact(self) -> bool:
        return bool(self.full_name and self.phone)


class ConversationState(BaseModel):
    model_config = ConfigDict(extra="ignore")

    active_intent: str | None = None
    last_profile: str | None = None
    service_id: str | None = None
    selected_slot_id: str | None = None
    hold_id: str | None = None
    appointment_id: str | None = None
    clinic_id: str | None = None
    dentist_id: str | None = None
    preferred_date: str | None = None
    patient_session_id: str | None = None
    changed_by: str | None = None
    cancelled_by: str | None = None
    cancellation_reason: str | None = None
    patient: PatientState = Field(default_factory=PatientState)
    pending_action: str | None = None

    @classmethod
    def from_raw(cls, raw: dict[str, Any] | None) -> "ConversationState":
        return cls(**(raw or {}))

    def has_complete_booking_confirmation(self) -> bool:
        return bool(self.hold_id and self.service_id and self.patient.has_required_contact())


class RoutingDecision(BaseModel):
    decision: RoutingDecisionValue
    reason: str
    confidence: RoutingConfidence
    pending_action: str | None = None
    missing_fields: list[str] = Field(default_factory=list)
    state_update: dict[str, Any] = Field(default_factory=dict)
    blocked_tools: list[str] = Field(default_factory=list)
