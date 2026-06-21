from __future__ import annotations

from datetime import date
from typing import Any

import httpx

from .tool_errors import DomainConflictError, DomainNotFoundError, DomainToolError, MalformedToolPayload


class HttpDomainTools:
    def __init__(
        self,
        *,
        emr_base_url: str,
        actor_id: str = "00000000-0000-4000-8000-000000000000",
        http_client: httpx.AsyncClient | None = None,
        timeout_seconds: float = 8.0,
    ) -> None:
        self.emr_base_url = emr_base_url.rstrip("/")
        self.actor_id = actor_id
        self._client = http_client or httpx.AsyncClient(timeout=timeout_seconds)
        self.mutations: list[str] = []
        self._booking_options: dict[str, dict[str, Any]] = {}

    async def get_patient_appointments(self, patient_id: str) -> list[dict[str, Any]]:
        payload = await self._request("GET", f"/api/v1/appointments/patient/{patient_id}", params={"status": "scheduled"})
        if isinstance(payload, list):
            return payload
        if isinstance(payload, dict) and isinstance(payload.get("data"), list):
            return list(payload["data"])
        raise MalformedToolPayload("appointment response must be a list envelope")

    async def resolve_appointment_reference(self, patient_id: str, appointment_ref: str) -> dict[str, Any] | None:
        path = f"/api/v1/appointments/code/{appointment_ref}"
        try:
            payload = await self._request("GET", path)
        except DomainNotFoundError:
            return None
        if not isinstance(payload, dict):
            raise MalformedToolPayload("appointment resolver response must be an object")
        owner = payload.get("patient_id") or payload.get("patientId") or payload.get("patient", {}).get("id")
        if owner and owner != patient_id:
            return None
        return self._normalize_appointment(payload)

    async def search_booking_catalog(self, slots: dict[str, Any]) -> dict[str, Any]:
        clinics = await self._request("GET", "/api/v1/clinics")
        services = await self._request("GET", "/api/v1/services")
        return {"clinics": clinics, "services": services}

    async def find_booking_options(self, patient_id: str, slots: dict[str, Any]) -> list[dict[str, Any]]:
        payload = await self._request("GET", "/api/v1/doctor-schedules", params=self._schedule_params(slots))
        if isinstance(payload, list):
            schedules = payload
        elif isinstance(payload, dict) and isinstance(payload.get("data"), list):
            schedules = list(payload.get("data", []))
        else:
            raise MalformedToolPayload("schedule response must be a list envelope")
        options = []
        for item in schedules:
            if not isinstance(item, dict):
                raise MalformedToolPayload("schedule item must be an object")
            option_id = item.get("id") or item.get("schedule_id") or item.get("scheduleId")
            if not option_id or not self._has_committable_date_time(item):
                continue
            options.append(
                {
                    "id": str(option_id),
                    "summary": item.get("summary") or self._schedule_summary(item),
                    "payload": item,
                }
            )
        for option in options:
            self._booking_options[option["id"]] = option
        return options

    async def commit_booking(self, patient_id: str, booking_option_id: str, idempotency_key: str) -> dict[str, Any]:
        option = self._require_prepared_option(booking_option_id)
        result = await self._request(
            "POST",
            "/api/v1/appointments/by-doctor",
            json=self._book_by_doctor_payload(patient_id, option),
            idempotency_key=idempotency_key,
        )
        self.mutations.append(f"commit_booking:{booking_option_id}")
        return result

    async def commit_cancel(self, patient_id: str, appointment_id: str, idempotency_key: str) -> dict[str, Any]:
        result = await self._request(
            "PATCH",
            f"/api/v1/appointments/{appointment_id}/cancel",
            json={
                "cancelled_by": self.actor_id,
                "cancellation_reason": "Cancelled by patient through booking assistant",
            },
            idempotency_key=idempotency_key,
        )
        self.mutations.append(f"commit_cancel:{appointment_id}")
        return result

    async def commit_reschedule(
        self,
        patient_id: str,
        appointment_id: str,
        booking_option_id: str,
        idempotency_key: str,
    ) -> dict[str, Any]:
        option = self._require_prepared_option(booking_option_id)
        result = await self._request(
            "PATCH",
            f"/api/v1/appointments/{appointment_id}",
            json=self._reschedule_payload(option),
            idempotency_key=idempotency_key,
        )
        self.mutations.append(f"commit_reschedule:{appointment_id}:{booking_option_id}")
        return result

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
        idempotency_key: str | None = None,
    ) -> Any:
        headers = {"Idempotency-Key": idempotency_key} if idempotency_key else None
        try:
            response = await self._client.request(
                method,
                f"{self.emr_base_url}{path}",
                json=json,
                params={key: value for key, value in (params or {}).items() if value is not None},
                headers=headers,
            )
        except httpx.TimeoutException as exc:
            raise TimeoutError("domain tool request timed out") from exc
        except httpx.HTTPError as exc:
            raise DomainToolError("domain tool request failed") from exc
        if response.status_code == 404:
            raise DomainNotFoundError("domain entity was not found")
        if response.status_code == 409:
            raise DomainConflictError("domain mutation conflict")
        if response.status_code >= 400:
            raise DomainToolError(f"domain tool returned HTTP {response.status_code}")
        if response.status_code == 204:
            return None
        return response.json()

    @staticmethod
    def _schedule_params(slots: dict[str, Any]) -> dict[str, Any]:
        work_date = HttpDomainTools._iso_date_or_none(slots.get("date_hint") or slots.get("preferred_date"))
        return {
            "clinic_id": slots.get("clinic_id"),
            "doctor_id": slots.get("doctor_id"),
            "specialty_id": slots.get("specialty_id"),
            "date_from": date.today().isoformat(),
            "work_date": work_date,
        }

    @staticmethod
    def _iso_date_or_none(value: Any) -> str | None:
        if not value:
            return None
        candidate = str(value).split("T", maxsplit=1)[0]
        try:
            date.fromisoformat(candidate)
        except ValueError:
            return None
        return candidate

    @staticmethod
    def _schedule_summary(item: dict[str, Any]) -> str:
        work_date = item.get("work_date") or item.get("workDate") or "an available date"
        shift = item.get("shift") if isinstance(item.get("shift"), dict) else {}
        time = (
            item.get("start_time")
            or item.get("startTime")
            or item.get("booking_time")
            or shift.get("start_time")
            or shift.get("startTime")
            or "an available time"
        )
        return f"{work_date} at {time}"

    def _require_prepared_option(self, option_id: str) -> dict[str, Any]:
        option = self._booking_options.get(option_id)
        if not option:
            raise RuntimeError("Booking option must be prepared from EMR before commit.")
        return option

    def _book_by_doctor_payload(self, patient_id: str, option: dict[str, Any]) -> dict[str, Any]:
        payload = option.get("payload") or {}
        return {
            "doctor_id": payload.get("doctor_id") or payload.get("doctorId"),
            "patient_id": patient_id,
            "clinic_id": payload.get("clinic_id") or payload.get("clinicId"),
            "appointment_date": self._appointment_date(payload),
            "appointment_time": self._appointment_time(payload),
            "duration_minutes": int(payload.get("duration_minutes") or payload.get("durationMinutes") or 30),
            "created_by": patient_id,
        }

    def _reschedule_payload(self, option: dict[str, Any]) -> dict[str, Any]:
        payload = option.get("payload") or {}
        return {
            "appointment_date": self._appointment_date(payload),
            "appointment_time": self._appointment_time(payload),
            "doctor_id": payload.get("doctor_id") or payload.get("doctorId"),
            "clinic_id": payload.get("clinic_id") or payload.get("clinicId"),
            "updated_by": self.actor_id,
        }

    @staticmethod
    def _appointment_date(payload: dict[str, Any]) -> str:
        value = payload.get("work_date") or payload.get("workDate") or payload.get("appointment_date")
        if not value:
            raise RuntimeError("Prepared booking option is missing work_date.")
        return str(value).split("T", maxsplit=1)[0]

    @staticmethod
    def _appointment_time(payload: dict[str, Any]) -> str:
        shift = payload.get("shift") if isinstance(payload.get("shift"), dict) else {}
        value = (
            payload.get("start_time")
            or payload.get("startTime")
            or payload.get("appointment_time")
            or shift.get("start_time")
            or shift.get("startTime")
        )
        if not value:
            raise RuntimeError("Prepared booking option is missing start_time.")
        return str(value)[:5]

    @classmethod
    def _has_committable_date_time(cls, payload: dict[str, Any]) -> bool:
        try:
            cls._appointment_date(payload)
            cls._appointment_time(payload)
            return True
        except RuntimeError:
            return False

    @staticmethod
    def _normalize_appointment(payload: dict[str, Any]) -> dict[str, Any]:
        appointment_id = payload.get("id") or payload.get("appointment_id") or payload.get("appointmentId")
        appointment_code = payload.get("code") or payload.get("appointment_code") or payload.get("appointmentCode")
        return {
            "id": appointment_id,
            "code": appointment_code,
            "patient_id": payload.get("patient_id") or payload.get("patientId") or payload.get("patient", {}).get("id"),
            "status": payload.get("status"),
            "raw": payload,
        }
