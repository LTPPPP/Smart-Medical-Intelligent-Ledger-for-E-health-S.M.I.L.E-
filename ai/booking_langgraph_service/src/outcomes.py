from __future__ import annotations

from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from .schemas import FlowName


class OutcomeCode(StrEnum):
    CONVERSATIONAL = "conversational"
    OUT_OF_SCOPE = "out_of_scope"
    CLARIFICATION_REQUIRED = "clarification_required"
    AUTH_REQUIRED = "auth_required"
    APPOINTMENTS_FOUND = "appointments_found"
    NO_APPOINTMENTS = "no_appointments"
    BOOKING_OPTIONS_FOUND = "booking_options_found"
    CONFIRMATION_REQUIRED = "confirmation_required"
    MUTATION_SUCCEEDED = "mutation_succeeded"
    MUTATION_REJECTED = "mutation_rejected"
    MUTATION_CONFLICT = "mutation_conflict"
    APPOINTMENT_UNAVAILABLE = "appointment_unavailable"
    BACKEND_UNAVAILABLE = "backend_unavailable"
    INVALID_RESPONSE = "invalid_response"


class TurnOutcome(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: OutcomeCode
    flow: FlowName
    dialogue_act: str | None = None
    safe_facts: dict[str, Any] = Field(default_factory=dict)
    suggested_actions: list[str] = Field(default_factory=list)
    confirmation_required: bool = False
    constraints: list[str] = Field(default_factory=list)


def fallback_reply(outcome: TurnOutcome) -> str:
    required = outcome.safe_facts.get("required_information")
    if outcome.code == OutcomeCode.CLARIFICATION_REQUIRED and isinstance(required, list) and required:
        return f"I need one more detail: {', '.join(str(item) for item in required)}."
    if outcome.code == OutcomeCode.CONVERSATIONAL:
        if outcome.dialogue_act == "identity":
            return "I am SMILE's scheduling assistant. I can help keep your appointment plans organized."
        if outcome.dialogue_act == "abuse":
            return "I can continue with your appointment when you are ready."
        return "I am here with you. Tell me what you need for your SMILE appointment."
    replies = {
        OutcomeCode.OUT_OF_SCOPE: "I am focused on SMILE clinic scheduling. For this request, the clinic team can help you directly.",
        OutcomeCode.CLARIFICATION_REQUIRED: "Could you share one more detail so I can check the schedule?",
        OutcomeCode.AUTH_REQUIRED: "Please sign in first so I can use your SMILE account securely.",
        OutcomeCode.APPOINTMENTS_FOUND: "Here are the appointments I found for you.",
        OutcomeCode.NO_APPOINTMENTS: "I do not see any upcoming appointments on your account.",
        OutcomeCode.BOOKING_OPTIONS_FOUND: "I found an available appointment option.",
        OutcomeCode.CONFIRMATION_REQUIRED: "Please confirm before I make this change.",
        OutcomeCode.MUTATION_SUCCEEDED: "Done. Your appointment change has been saved.",
        OutcomeCode.MUTATION_REJECTED: "No changes were made.",
        OutcomeCode.MUTATION_CONFLICT: "I could not find a matching open slot for those details. Try another date or time.",
        OutcomeCode.APPOINTMENT_UNAVAILABLE: "I could not access an appointment I can change. No changes were made.",
        OutcomeCode.BACKEND_UNAVAILABLE: "SMILE scheduling is temporarily unavailable. No changes were made. Please try again shortly.",
        OutcomeCode.INVALID_RESPONSE: "I could not complete that safely. Please try again with one appointment request.",
    }
    return replies[outcome.code]
