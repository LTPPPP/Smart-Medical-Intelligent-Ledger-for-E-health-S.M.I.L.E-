"""Booking Slot State — client-owned, stateless backend."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

IntentType = Literal["by_clinic", "by_specialty", "by_doctor", "outside_hours"]

# Clear on intent switch
_FIELDS_TO_CLEAR_ON_SWITCH: dict[IntentType, list[str]] = {
    "by_clinic": ["specialty_id", "specialty_name", "doctor_id", "doctor_name", "is_follow_up", "outside_hours_reason"],
    "by_specialty": ["doctor_id", "doctor_name", "is_follow_up", "outside_hours_reason"],
    "by_doctor": ["outside_hours_reason"],
    "outside_hours": ["is_follow_up"],
}


class BookingSlotState(BaseModel):
    intent_type: IntentType | None = None

    # Auto-resolved, not LLM input
    patient_id: str | None = None

    # Guest profile fields
    patient_name: str | None = None
    patient_phone: str | None = None

    clinic_id: str | None = None
    clinic_name: str | None = None
    specialty_id: str | None = None
    specialty_name: str | None = None
    doctor_id: str | None = None
    doctor_name: str | None = None
    # Resolved from chief complaint
    service_id: str | None = None
    service_name: str | None = None

    appointment_date: str | None = None  # YYYY-MM-DD
    appointment_time: str | None = None  # HH:MM
    chief_complaint: str | None = None
    is_follow_up: bool | None = None
    outside_hours_reason: str | None = None

    confirmed: bool = False


class BookingSlotUpdate(BaseModel):
    """Per-turn extraction result."""

    intent_type: IntentType | None = None
    patient_name: str | None = None
    patient_phone: str | None = None
    clinic_id: str | None = None
    clinic_name: str | None = None
    specialty_id: str | None = None
    specialty_name: str | None = None
    doctor_id: str | None = None
    doctor_name: str | None = None
    service_id: str | None = None
    service_name: str | None = None
    appointment_date: str | None = None
    appointment_time: str | None = None
    chief_complaint: str | None = None
    is_follow_up: bool | None = None
    outside_hours_reason: str | None = None
    # True only if just confirmed
    confirmed: bool | None = None


def merge_state(current: BookingSlotState, update: BookingSlotUpdate) -> BookingSlotState:
    merged = current.model_copy(deep=True)
    intent_switched = update.intent_type is not None and update.intent_type != current.intent_type

    for field_name, value in update.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(merged, field_name, value)

    if intent_switched:
        for field_name in _FIELDS_TO_CLEAR_ON_SWITCH.get(update.intent_type, []):
            setattr(merged, field_name, None)
        merged.confirmed = False

    return merged
