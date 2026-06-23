from __future__ import annotations

import asyncio
from datetime import date
from typing import Any

import httpx

from .tool_errors import DomainConflictError, DomainNotFoundError, DomainToolError, MalformedToolPayload


class HttpDomainTools:
    def __init__(
        self,
        *,
        emr_base_url: str,
        iam_base_url: str | None = None,
        actor_id: str = "00000000-0000-4000-8000-000000000000",
        http_client: httpx.AsyncClient | None = None,
        timeout_seconds: float = 8.0,
    ) -> None:
        self.emr_base_url = emr_base_url.rstrip("/")
        self.iam_base_url = iam_base_url.rstrip("/") if iam_base_url else self.emr_base_url
        self.actor_id = actor_id
        self._client = http_client or httpx.AsyncClient(timeout=timeout_seconds)
        self.mutations: list[str] = []
        self._booking_options: dict[str, dict[str, Any]] = {}

    async def resolve_patient_id_by_user_id(self, user_id: str) -> str | None:
        try:
            payload = await self._request(
                "GET",
                "/api/v1/patients/me",
                headers={"x-auth-user-id": user_id},
            )
        except DomainNotFoundError:
            return None
        if payload is None:
            return None
        if not isinstance(payload, dict):
            raise MalformedToolPayload("patient resolver response must be an object")
        patient_id = payload.get("patient_id") or payload.get("patientId")
        return str(patient_id) if patient_id else None

    async def get_patient_appointments(self, patient_id: str) -> list[dict[str, Any]]:
        payload = await self._request(
            "GET",
            f"/api/v1/appointments/patient/{patient_id}",
            params={"status": "scheduled"},
        )
        if isinstance(payload, list):
            items = [item for item in payload if isinstance(item, dict)]
        elif isinstance(payload, dict) and isinstance(payload.get("data"), list):
            items = [item for item in payload["data"] if isinstance(item, dict)]
        else:
            raise MalformedToolPayload("appointment response must be a list envelope")
        appointments = self._normalize_appointments(items)
        doctor_ids = list(dict.fromkeys(item.get("doctor_id") for item in appointments if item.get("doctor_id")))
        room_ids = list(dict.fromkeys(item.get("room_id") for item in appointments if item.get("room_id")))
        profiles, rooms = await asyncio.gather(
            asyncio.gather(*(self._doctor_profile(str(doctor_id)) for doctor_id in doctor_ids)),
            asyncio.gather(*(self._room_profile(str(room_id)) for room_id in room_ids)),
        )
        names_by_id = {
            str(doctor_id): self._doctor_name(profile, str(doctor_id))
            for doctor_id, profile in zip(doctor_ids, profiles)
        }
        rooms_by_id = {
            str(room_id): self._room_name({"room": room})
            for room_id, room in zip(room_ids, rooms)
        }
        for appointment in appointments:
            doctor_id = appointment.get("doctor_id")
            room_id = appointment.get("room_id")
            appointment["doctor_name"] = names_by_id.get(str(doctor_id)) if doctor_id else None
            if not appointment.get("room_name") and room_id:
                appointment["room_name"] = rooms_by_id.get(str(room_id))
        return appointments

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
        service_id = slots.get("service_id") or await self._resolve_service_id(slots.get("service_hint"))
        if not service_id:
            return []
        payload = await self._request(
            "GET",
            "/api/v1/appointments/availability",
            params=self._availability_params(patient_id, service_id, slots),
        )
        if not isinstance(payload, dict):
            raise MalformedToolPayload("availability response must be an object")
        options: list[dict[str, Any]] = []
        service = payload.get("service") if isinstance(payload.get("service"), dict) else {}
        for date_group in payload.get("dates", []):
            if not isinstance(date_group, dict):
                continue
            work_date = str(date_group.get("date") or "").split("T", 1)[0]
            for doctor_group in date_group.get("doctors", []):
                if not isinstance(doctor_group, dict):
                    continue
                doctor_id = doctor_group.get("doctor_id") or doctor_group.get("doctorId")
                clinic_id = doctor_group.get("clinic_id") or doctor_group.get("clinicId") or slots.get("clinic_id")
                room = doctor_group.get("room") if isinstance(doctor_group.get("room"), dict) else {}
                room_id = room.get("room_id") or room.get("roomId")
                room_name = room.get("room_name") or room.get("roomName")
                if not doctor_id or not room_id:
                    continue
                profile = await self._doctor_profile(str(doctor_id))
                doctor_name = self._doctor_name(profile, str(doctor_id))
                for slot in doctor_group.get("slots", []):
                    if not isinstance(slot, dict):
                        continue
                    token = slot.get("option_token") or slot.get("optionToken")
                    start_time = slot.get("start_time") or slot.get("startTime")
                    if not token or not start_time:
                        continue
                    option_payload = {
                        "option_token": token,
                        "doctor_id": str(doctor_id),
                        "clinic_id": str(clinic_id) if clinic_id else None,
                        "room_id": str(room_id),
                        "service_id": service_id,
                        "work_date": work_date,
                        "appointment_time": str(start_time)[:5],
                    }
                    options.append({
                        "id": str(token),
                        "summary": (
                            f"{work_date} at {str(start_time)[:5]} with {doctor_name}"
                            + (f", {room_name}" if room_name else "")
                        ),
                        "appointment_date": work_date,
                        "appointment_time": str(start_time)[:5],
                        "duration_minutes": service.get("duration_minutes") or service.get("durationMinutes"),
                        "doctor_id": str(doctor_id),
                        "doctor_name": doctor_name,
                        "clinic_id": str(clinic_id) if clinic_id else None,
                        "clinic_name": "SMILE clinic",
                        "room_id": str(room_id),
                        "room_name": str(room_name) if room_name else None,
                        "service_id": service_id,
                        "payload": option_payload,
                    })
        for option in options:
            self._booking_options[option["id"]] = option
        preferred_time = str(slots.get("time_hint") or slots.get("preferred_time") or "")[:5]
        if preferred_time:
            options.sort(key=lambda option: option["payload"].get("appointment_time") != preferred_time)
        return options

    def _availability_params(self, patient_id: str, service_id: str, slots: dict[str, Any]) -> dict[str, Any]:
        date_hint = self._iso_date_or_none(slots.get("date_hint") or slots.get("preferred_date"))
        date_from = date_hint or date.today().isoformat()
        return {
            "patient_id": patient_id,
            "service_id": service_id,
            "clinic_id": slots.get("clinic_id"),
            "doctor_id": slots.get("doctor_id"),
            "date_from": date_from,
            "date_to": slots.get("date_to") or date_from,
        }

    async def _resolve_service_id(self, hint: Any) -> str | None:
        if not hint:
            return None
        payload = await self._request("GET", "/api/v1/services")
        services = payload.get("data", []) if isinstance(payload, dict) else payload
        normalized_hint = str(hint).strip().casefold()
        for service in services if isinstance(services, list) else []:
            if not isinstance(service, dict):
                continue
            name = service.get("service_name") or service.get("name")
            if name and normalized_hint in str(name).casefold():
                identifier = service.get("service_id") or service.get("id")
                return str(identifier) if identifier else None
        return None

    async def _doctor_profile(self, doctor_id: str) -> dict[str, Any]:
        for path in (f"/api/v1/user-profiles/{doctor_id}", f"/v1/user-profiles/{doctor_id}"):
            try:
                payload = await self._request("GET", path, base_url=self.iam_base_url)
            except DomainNotFoundError:
                continue
            return payload if isinstance(payload, dict) else {}
        return {}

    async def _room_profile(self, room_id: str) -> dict[str, Any]:
        try:
            payload = await self._request("GET", f"/api/v1/treatment-rooms/{room_id}")
        except DomainNotFoundError:
            return {}
        return payload if isinstance(payload, dict) else {}

    @staticmethod
    def _doctor_name(profile: dict[str, Any], doctor_id: str) -> str:
        return str(profile.get("full_name") or profile.get("fullName") or f"Doctor {doctor_id}")

    @staticmethod
    def _clinic_name(schedule: dict[str, Any]) -> str:
        clinic = schedule.get("clinic") if isinstance(schedule.get("clinic"), dict) else {}
        return str(clinic.get("clinic_name") or clinic.get("name") or schedule.get("clinic_name") or "SMILE clinic")

    @staticmethod
    def _room_name(schedule: dict[str, Any]) -> str | None:
        room = schedule.get("room") if isinstance(schedule.get("room"), dict) else {}
        value = room.get("room_name") or room.get("name") or schedule.get("room_name") or schedule.get("roomName")
        return str(value) if value else None

    async def commit_booking(
        self,
        patient_id: str,
        booking_option_id: str,
        idempotency_key: str,
        auth_user_id: str | None = None,
    ) -> dict[str, Any]:
        option = self._require_prepared_option(booking_option_id)
        result = await self._request(
            "POST",
            "/api/v1/appointments/book-option",
            json=self._book_option_payload(patient_id, option, auth_user_id),
            idempotency_key=idempotency_key,
            headers={"x-auth-user-id": auth_user_id} if auth_user_id else None,
        )
        self.mutations.append(f"commit_booking:{booking_option_id}")
        return result

    async def commit_cancel(
        self,
        patient_id: str,
        appointment_id: str,
        idempotency_key: str,
        auth_user_id: str | None = None,
    ) -> dict[str, Any]:
        result = await self._request(
            "PATCH",
            f"/api/v1/appointments/{appointment_id}/cancel",
            json={
                "cancelled_by": auth_user_id or self.actor_id,
                "cancellation_reason": "Cancelled by patient through booking assistant",
            },
            idempotency_key=idempotency_key,
            headers={"x-auth-user-id": auth_user_id} if auth_user_id else None,
        )
        self.mutations.append(f"commit_cancel:{appointment_id}")
        return result

    async def commit_reschedule(
        self,
        patient_id: str,
        appointment_id: str,
        booking_option_id: str,
        idempotency_key: str,
        auth_user_id: str | None = None,
    ) -> dict[str, Any]:
        option = self._require_prepared_option(booking_option_id)
        result = await self._request(
            "PATCH",
            f"/api/v1/appointments/{appointment_id}/reschedule-option",
            json=self._reschedule_option_payload(option, auth_user_id),
            idempotency_key=idempotency_key,
            headers={"x-auth-user-id": auth_user_id} if auth_user_id else None,
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
        base_url: str | None = None,
        headers: dict[str, str] | None = None,
    ) -> Any:
        request_headers: dict[str, str] = {}
        if idempotency_key:
            request_headers["Idempotency-Key"] = idempotency_key
        if headers:
            request_headers.update(headers)
        try:
            response = await self._client.request(
                method,
                f"{base_url or self.emr_base_url}{path}",
                json=json,
                params={key: value for key, value in (params or {}).items() if value is not None},
                headers=request_headers or None,
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
    def _iso_date_or_none(value: Any) -> str | None:
        if not value:
            return None
        candidate = str(value).split("T", maxsplit=1)[0]
        try:
            date.fromisoformat(candidate)
        except ValueError:
            return None
        return candidate

    def _require_prepared_option(self, option_id: str) -> dict[str, Any]:
        option = self._booking_options.get(option_id)
        if not option:
            raise RuntimeError("Booking option must be prepared from EMR before commit.")
        return option

    def _book_option_payload(
        self,
        patient_id: str,
        option: dict[str, Any],
        auth_user_id: str | None = None,
    ) -> dict[str, Any]:
        payload = option.get("payload") or {}
        return {
            "patient_id": patient_id,
            "option_token": payload.get("option_token") or payload.get("optionToken") or option.get("id"),
            "created_by": auth_user_id or patient_id,
        }

    def _reschedule_option_payload(
        self, option: dict[str, Any], auth_user_id: str | None = None
    ) -> dict[str, Any]:
        payload = option.get("payload") or {}
        return {
            "option_token": payload.get("option_token") or payload.get("optionToken") or option.get("id"),
            "updated_by": auth_user_id or self.actor_id,
        }

    @staticmethod
    def _normalize_appointment(payload: dict[str, Any]) -> dict[str, Any]:
        appointment_id = payload.get("id") or payload.get("appointment_id") or payload.get("appointmentId")
        appointment_code = payload.get("code") or payload.get("appointment_code") or payload.get("appointmentCode")
        clinic = payload.get("clinic") if isinstance(payload.get("clinic"), dict) else {}
        room = payload.get("room") if isinstance(payload.get("room"), dict) else {}
        service = payload.get("service") if isinstance(payload.get("service"), dict) else {}
        return {
            "id": appointment_id,
            "appointment_id": appointment_id,
            "code": appointment_code,
            "appointment_code": appointment_code,
            "appointment_date": str(payload.get("appointment_date") or payload.get("appointmentDate") or "").split("T", 1)[0],
            "appointment_time": str(payload.get("appointment_time") or payload.get("appointmentTime") or "")[:5],
            "duration_minutes": payload.get("duration_minutes") or payload.get("durationMinutes"),
            "patient_id": payload.get("patient_id") or payload.get("patientId") or payload.get("patient", {}).get("id"),
            "doctor_id": payload.get("doctor_id") or payload.get("doctorId"),
            "clinic_id": payload.get("clinic_id") or payload.get("clinicId"),
            "room_id": payload.get("room_id") or payload.get("roomId"),
            "service_id": payload.get("service_id") or payload.get("serviceId"),
            "service_name": service.get("service_name") or service.get("name") or payload.get("service_name") or payload.get("serviceName"),
            "clinic_name": clinic.get("clinic_name") or clinic.get("name") or payload.get("clinic_name") or payload.get("clinicName"),
            "room_name": room.get("room_name") or room.get("name") or payload.get("room_name") or payload.get("roomName"),
            "status": payload.get("status"),
            "raw": payload,
        }

    @classmethod
    def _normalize_appointments(cls, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [cls._normalize_appointment(item) for item in items]
