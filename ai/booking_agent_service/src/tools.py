from __future__ import annotations

import json
from typing import Any, Callable
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


def _validate_uuid(value: str) -> str:
    UUID(value)
    return value


class StrictToolArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ReadToolArgs(BaseModel):
    model_config = ConfigDict(extra="ignore")


class EmptyReadArgs(ReadToolArgs):
    pass


class GetClinicArgs(ReadToolArgs):
    clinic_id: str


class ListClinicServicesArgs(ReadToolArgs):
    clinic_id: str


class ListSpecialtiesArgs(ReadToolArgs):
    active_only: bool | None = None


class ListDoctorSchedulesArgs(ReadToolArgs):
    clinic_id: str | None = None
    doctor_id: str | None = None
    specialty_id: str | None = None
    work_date: str | None = None
    date_from: str | None = None
    date_to: str | None = None
    status: str | None = None


class GetPatientAppointmentsArgs(ReadToolArgs):
    patient_id: str
    status: str | None = None


class GetAppointmentByCodeArgs(ReadToolArgs):
    code: str


class BookBySpecialtyArgs(StrictToolArgs):
    specialty_id: str
    patient_id: str
    clinic_id: str
    preferred_date: str | None = None
    preferred_time: str | None = None
    duration_minutes: int | None = None
    chief_complaint: str | None = None
    notes: str | None = None
    created_by: str

    _uuid_fields = field_validator("specialty_id", "patient_id", "clinic_id", "created_by")(
        _validate_uuid
    )


class BookByDoctorArgs(StrictToolArgs):
    doctor_id: str
    patient_id: str
    clinic_id: str
    appointment_date: str
    appointment_time: str
    room_id: str | None = None
    service_id: str | None = None
    duration_minutes: int | None = None
    appointment_type: str | None = None
    chief_complaint: str | None = None
    notes: str | None = None
    created_by: str

    _uuid_fields = field_validator(
        "doctor_id",
        "patient_id",
        "clinic_id",
        "room_id",
        "service_id",
        "created_by",
    )(_validate_uuid)


class CancelAppointmentArgs(StrictToolArgs):
    appointment_id: str
    cancelled_by: str
    cancellation_reason: str | None = None

    _uuid_fields = field_validator("appointment_id", "cancelled_by")(_validate_uuid)


class ToolRegistry:
    def __init__(self, client: Any) -> None:
        self.client = client
        self._schemas: dict[str, type[BaseModel]] = {
            "book_by_specialty": BookBySpecialtyArgs,
            "book_by_doctor": BookByDoctorArgs,
            "cancel_appointment": CancelAppointmentArgs,
        }
        self._read_schemas: dict[str, type[BaseModel]] = {
            "list_clinics": EmptyReadArgs,
            "get_clinic": GetClinicArgs,
            "list_services": EmptyReadArgs,
            "list_clinic_services": ListClinicServicesArgs,
            "list_specialties": ListSpecialtiesArgs,
            "list_doctor_schedules": ListDoctorSchedulesArgs,
            "get_patient_appointments": GetPatientAppointmentsArgs,
            "get_appointment_by_code": GetAppointmentByCodeArgs,
        }
        self._read_tools: dict[str, Callable[..., Any]] = {}
        for name in (
            "list_clinics",
            "get_clinic",
            "list_services",
            "list_clinic_services",
            "list_specialties",
            "list_doctor_schedules",
            "get_patient_appointments",
            "get_appointment_by_code",
        ):
            if hasattr(client, name):
                self._read_tools[name] = getattr(client, name)

    def normalize_read_call(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        if name not in self._read_schemas:
            raise ValueError(f"Unknown read tool: {name}")
        parsed = self._read_schemas[name].model_validate(arguments)
        return parsed.model_dump(exclude_none=True)

    def canonical_read_signature(self, name: str, arguments: dict[str, Any]) -> str:
        normalized = self.normalize_read_call(name, arguments)
        return f"{name}:{json.dumps(normalized, ensure_ascii=False, separators=(',', ':'), sort_keys=True)}"

    async def execute(
        self,
        name: str,
        arguments: dict[str, Any],
        idempotency_key: str | None = None,
    ) -> Any:
        if name in self._read_tools:
            return await self._read_tools[name](**self.normalize_read_call(name, arguments))
        if name not in self._schemas:
            raise ValueError(f"Unknown tool: {name}")
        parsed = self._schemas[name].model_validate(arguments)
        payload = parsed.model_dump(exclude_none=True)
        if name == "cancel_appointment":
            appointment_id = payload.pop("appointment_id")
            return await self.client.cancel_appointment(
                appointment_id,
                payload,
                idempotency_key=idempotency_key,
            )
        return await getattr(self.client, name)(payload, idempotency_key=idempotency_key)
