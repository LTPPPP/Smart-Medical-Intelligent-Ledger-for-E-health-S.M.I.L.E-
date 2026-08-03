"""Clinical EMR service HTTP client."""

from __future__ import annotations

from typing import Any

import httpx

from ...config import get_settings


def _drop_none(body: dict[str, Any]) -> dict[str, Any]:
    # Omit unset fields
    return {k: v for k, v in body.items() if v is not None}


def _client(token: str) -> httpx.AsyncClient:
    settings = get_settings()
    return httpx.AsyncClient(
        base_url=f"{settings.clinical_emr_service_url}/api/v1",
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )


def _client_unversioned(token: str) -> httpx.AsyncClient:
    # No /v1 prefix
    settings = get_settings()
    return httpx.AsyncClient(
        base_url=f"{settings.clinical_emr_service_url}/api",
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )


async def create_patient(token: str, *, full_name: str, phone: str | None) -> dict[str, Any]:
    """Create guest patient (staff-only)."""
    async with _client_unversioned(token) as client:
        response = await client.post(
            "/patients", json={"full_name": full_name, "phone": phone}
        )
        response.raise_for_status()
        return response.json()


async def create_my_patient(
    token: str, *, full_name: str, phone: str
) -> dict[str, Any]:
    """Create own patient profile."""
    async with _client_unversioned(token) as client:
        response = await client.post(
            "/patients/me", json={"full_name": full_name, "phone": phone}
        )
        response.raise_for_status()
        return response.json()


async def get_patient_me(token: str) -> dict[str, Any]:
    async with _client_unversioned(token) as client:
        response = await client.get("/patients/me")
        response.raise_for_status()
        return response.json()


async def list_clinics(token: str, **query: Any) -> dict[str, Any]:
    async with _client(token) as client:
        response = await client.get(
            "/clinics", params={k: v for k, v in query.items() if v is not None}
        )
        response.raise_for_status()
        return response.json()


async def list_services(token: str, **query: Any) -> dict[str, Any]:
    async with _client(token) as client:
        response = await client.get(
            "/services", params={k: v for k, v in query.items() if v is not None}
        )
        response.raise_for_status()
        return response.json()


async def create_appointment_by_clinic(token: str, **dto: Any) -> dict[str, Any]:
    async with _client(token) as client:
        response = await client.post("/appointments/by-clinic", json=_drop_none(dto))
        response.raise_for_status()
        return response.json()


async def create_appointment_by_specialty(token: str, **dto: Any) -> dict[str, Any]:
    async with _client(token) as client:
        response = await client.post("/appointments/by-specialty", json=_drop_none(dto))
        response.raise_for_status()
        return response.json()


async def create_appointment_by_doctor(token: str, **dto: Any) -> dict[str, Any]:
    async with _client(token) as client:
        response = await client.post("/appointments/by-doctor", json=_drop_none(dto))
        response.raise_for_status()
        return response.json()


async def create_appointment_outside_hours(token: str, **dto: Any) -> dict[str, Any]:
    async with _client(token) as client:
        response = await client.post("/appointments/outside-hours", json=_drop_none(dto))
        response.raise_for_status()
        return response.json()


async def create_appointment_by_option(token: str, **dto: Any) -> dict[str, Any]:
    async with _client(token) as client:
        response = await client.post("/appointments/book-option", json=_drop_none(dto))
        response.raise_for_status()
        return response.json()


async def find_availability(token: str, **query: Any) -> dict[str, Any]:
    async with _client(token) as client:
        response = await client.get(
            "/appointments/availability", params={k: v for k, v in query.items() if v is not None}
        )
        response.raise_for_status()
        return response.json()


async def find_appointment_by_code(token: str, code: str) -> dict[str, Any] | None:
    async with _client(token) as client:
        response = await client.get(f"/appointments/code/{code}")
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()


async def list_patient_appointments(token: str, patient_id: str) -> list[dict[str, Any]]:
    async with _client(token) as client:
        response = await client.get(f"/appointments/patient/{patient_id}")
        response.raise_for_status()
        return response.json()


async def cancel_appointment(
    token: str, appointment_id: str, *, cancelled_by: str, cancellation_reason: str | None
) -> dict[str, Any]:
    async with _client(token) as client:
        response = await client.patch(
            f"/appointments/{appointment_id}/cancel",
            json=_drop_none(
                {"cancelled_by": cancelled_by, "cancellation_reason": cancellation_reason}
            ),
        )
        response.raise_for_status()
        return response.json()
