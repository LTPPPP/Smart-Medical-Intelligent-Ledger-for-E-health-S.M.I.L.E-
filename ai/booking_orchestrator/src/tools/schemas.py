from datetime import date as Date
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


UUID_PATTERN = (
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)


class ToolOutput(BaseModel):
    success: bool
    data: dict[str, Any] | list[Any] | None = None
    error_code: str | None = None
    message: str | None = None
    recommended_action: str | None = None
    details: dict[str, Any] | None = None


class GetClinicInfoInput(BaseModel):
    clinic_id: str | None = Field(default=None, pattern=UUID_PATTERN)


class SearchClinicKnowledgeInput(BaseModel):
    query: str = Field(min_length=1, max_length=500)


class GetServicesInput(BaseModel):
    clinic_id: str | None = Field(default=None, pattern=UUID_PATTERN)


class EstimateServiceDurationInput(BaseModel):
    service_id: str = Field(pattern=UUID_PATTERN)


class GetAvailableSlotsInput(BaseModel):
    clinic_id: str | None = Field(default=None, pattern=UUID_PATTERN)
    service_id: str | None = Field(default=None, pattern=UUID_PATTERN)
    dentist_id: str | None = Field(default=None, pattern=UUID_PATTERN)
    date: Date | None = None

    @field_validator("date", mode="before")
    @classmethod
    def coerce_datetime_to_date(cls, value: object) -> object:
        if isinstance(value, str) and "T" in value:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
        return value


class HoldSlotInput(BaseModel):
    slot_id: str = Field(pattern=UUID_PATTERN)
    patient_session_id: str = Field(min_length=1, max_length=255)
    ttl_seconds: int = Field(ge=60, le=600)


class ConfirmBookingPatientInput(BaseModel):
    patient_id: str | None = Field(default=None, pattern=UUID_PATTERN)
    full_name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=8, max_length=20)
    email: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        allowed = set("+0123456789 ().-")
        if any(char not in allowed for char in value):
            raise ValueError("phone contains invalid characters")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        if value is not None and "@" not in value:
            raise ValueError("email must contain @")
        return value


class ConfirmBookingInput(BaseModel):
    hold_id: str = Field(pattern=UUID_PATTERN)
    patient_session_id: str = Field(min_length=1, max_length=255)
    service_id: str = Field(pattern=UUID_PATTERN)
    patient: ConfirmBookingPatientInput


class ReleaseHoldInput(BaseModel):
    hold_id: str = Field(pattern=UUID_PATTERN)


class RescheduleAppointmentInput(BaseModel):
    appointment_id: str = Field(pattern=UUID_PATTERN)
    new_hold_id: str = Field(pattern=UUID_PATTERN)
    patient_session_id: str = Field(min_length=1, max_length=255)
    changed_by: str = Field(pattern=UUID_PATTERN)


class CancelAppointmentInput(BaseModel):
    appointment_id: str = Field(pattern=UUID_PATTERN)
    cancelled_by: str = Field(pattern=UUID_PATTERN)
    cancellation_reason: str | None = Field(default=None, max_length=1000)


class AddToWaitlistInput(BaseModel):
    patient_id: str | None = Field(default=None, pattern=UUID_PATTERN)
    patient_name: str = Field(min_length=1, max_length=255)
    patient_phone: str = Field(min_length=8, max_length=20)
    patient_email: str | None = None
    clinic_id: str = Field(pattern=UUID_PATTERN)
    service_id: str = Field(pattern=UUID_PATTERN)
    dentist_id: str | None = Field(default=None, pattern=UUID_PATTERN)
    preferred_date: Date
    preferred_start_time: str | None = None
    preferred_end_time: str | None = None


class CheckWaitlistMatchesInput(BaseModel):
    slot_id: str = Field(pattern=UUID_PATTERN)


class SendEmailNotificationInput(BaseModel):
    notification_type: Literal[
        "booking_confirmation",
        "booking_reminder",
        "cancellation_confirmation",
        "reschedule_confirmation",
        "waitlist_slot_available",
        "handoff_alert",
        "manual_review_required",
    ]
    recipient_type: str = Field(min_length=1, max_length=40)
    recipient_email: str
    template_data: dict[str, Any] = Field(default_factory=dict)

    @field_validator("recipient_email")
    @classmethod
    def validate_recipient_email(cls, value: str) -> str:
        if "@" not in value:
            raise ValueError("recipient_email must contain @")
        return value


class ClassifyMedicalRiskInput(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class CreateHandoffTicketInput(BaseModel):
    session_id: str = Field(min_length=1, max_length=255)
    patient_id: str | None = Field(default=None, pattern=UUID_PATTERN)
    source_message: str = Field(min_length=1, max_length=2000)
    summary: str = Field(min_length=1, max_length=2000)


class SummarizeForDentistInput(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


TOOL_SCHEMAS: dict[str, type[BaseModel]] = {
    "get_clinic_info": GetClinicInfoInput,
    "search_clinic_knowledge": SearchClinicKnowledgeInput,
    "get_services": GetServicesInput,
    "estimate_service_duration": EstimateServiceDurationInput,
    "get_available_slots": GetAvailableSlotsInput,
    "hold_slot": HoldSlotInput,
    "confirm_booking": ConfirmBookingInput,
    "release_hold": ReleaseHoldInput,
    "reschedule_appointment": RescheduleAppointmentInput,
    "cancel_appointment": CancelAppointmentInput,
    "add_to_waitlist": AddToWaitlistInput,
    "check_waitlist_matches": CheckWaitlistMatchesInput,
    "send_email_notification": SendEmailNotificationInput,
    "classify_medical_risk": ClassifyMedicalRiskInput,
    "create_handoff_ticket": CreateHandoffTicketInput,
    "summarize_for_dentist": SummarizeForDentistInput,
}


def openai_tool_definitions(tool_names: list[str]) -> list[dict[str, Any]]:
    definitions: list[dict[str, Any]] = []
    for name in tool_names:
        schema = TOOL_SCHEMAS[name]
        definitions.append(
            {
                "type": "function",
                "function": {
                    "name": name,
                    "description": f"Công cụ backend đã được xác thực: {name}",
                    "parameters": schema.model_json_schema(),
                },
            }
        )
    return definitions
