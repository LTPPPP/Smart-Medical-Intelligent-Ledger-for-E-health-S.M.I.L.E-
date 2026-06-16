from __future__ import annotations

from typing import Any

import httpx

from .config import Settings


class ClinicalEmrClient:
    def __init__(
        self,
        settings: Settings,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self.settings = settings
        self._client = http_client or httpx.AsyncClient(
            base_url=settings.emr_base_url,
            timeout=settings.request_timeout_seconds,
        )

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
        url = f"{self.settings.emr_base_url.rstrip('/')}{path}"
        response = await self._client.request(
            method,
            url,
            json=json,
            params={k: v for k, v in (params or {}).items() if v is not None},
            headers=headers,
        )
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as error:
            try:
                body: Any = error.response.json()
            except ValueError:
                body = error.response.text
            raise RuntimeError(
                f"{error.response.status_code} {error.response.reason_phrase}: {body}"
            ) from error
        if response.status_code == 204:
            return None
        return response.json()

    async def list_clinics(self, **params: Any) -> Any:
        return await self._request("GET", "/api/v1/clinics", params=params)

    async def get_clinic(self, clinic_id: str) -> Any:
        return await self._request("GET", f"/api/v1/clinics/{clinic_id}")

    async def list_services(self, **params: Any) -> Any:
        return await self._request("GET", "/api/v1/services", params=params)

    async def list_clinic_services(self, clinic_id: str) -> Any:
        return await self._request("GET", f"/api/v1/clinics/{clinic_id}/services")

    async def list_specialties(
        self,
        clinic_id: str | None = None,
        active_only: bool | None = None,
    ) -> Any:
        return await self._request(
            "GET",
            "/api/v1/specialties",
            params={"clinic_id": clinic_id, "active_only": active_only},
        )

    async def list_doctor_schedules(self, **params: Any) -> Any:
        return await self._request("GET", "/api/v1/doctor-schedules", params=params)

    async def get_patient_appointments(self, patient_id: str, status: str | None = None) -> Any:
        return await self._request(
            "GET",
            f"/api/v1/appointments/patient/{patient_id}",
            params={"status": status},
        )

    async def get_appointment_by_code(self, code: str) -> Any:
        return await self._request("GET", f"/api/v1/appointments/code/{code}")

    async def book_by_specialty(
        self,
        payload: dict[str, Any],
        idempotency_key: str | None = None,
    ) -> Any:
        return await self._request(
            "POST",
            "/api/v1/appointments/by-specialty",
            json=payload,
            idempotency_key=idempotency_key,
        )

    async def book_by_doctor(
        self,
        payload: dict[str, Any],
        idempotency_key: str | None = None,
    ) -> Any:
        return await self._request(
            "POST",
            "/api/v1/appointments/by-doctor",
            json=payload,
            idempotency_key=idempotency_key,
        )

    async def cancel_appointment(
        self,
        appointment_id: str,
        payload: dict[str, Any],
        idempotency_key: str | None = None,
    ) -> Any:
        return await self._request(
            "PATCH",
            f"/api/v1/appointments/{appointment_id}/cancel",
            json=payload,
            idempotency_key=idempotency_key,
        )
