from __future__ import annotations

import httpx
import pytest

from src.config import Settings
from src.emr_client import ClinicalEmrClient
from src.tools import (
    BookByDoctorArgs,
    BookBySpecialtyArgs,
    CancelAppointmentArgs,
    ToolRegistry,
)


@pytest.mark.asyncio
async def test_emr_client_constructs_appointment_requests_with_idempotency_key():
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(201, json={"appointment_id": "appt-1", "appointment_code": "APT-20260614-0001"})

    client = ClinicalEmrClient(
        Settings(emr_base_url="http://clinical:8082", require_cuda=False),
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    result = await client.book_by_doctor(
        {
            "doctor_id": "11111111-1111-4111-8111-111111111111",
            "patient_id": "22222222-2222-4222-8222-222222222222",
            "clinic_id": "33333333-3333-4333-8333-333333333333",
            "appointment_date": "2026-06-20",
            "appointment_time": "09:00",
            "created_by": "22222222-2222-4222-8222-222222222222",
        },
        idempotency_key="s1:confirm-1:book_by_doctor",
    )

    assert result["appointment_code"] == "APT-20260614-0001"
    assert requests[0].method == "POST"
    assert requests[0].url.path == "/api/v1/appointments/by-doctor"
    assert requests[0].headers["Idempotency-Key"] == "s1:confirm-1:book_by_doctor"


@pytest.mark.asyncio
async def test_emr_client_turns_http_errors_into_recoverable_runtime_errors():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            422,
            json={"status": 422, "errors": {"clinic_id": "clinic_id must be a UUID"}},
        )

    client = ClinicalEmrClient(
        Settings(emr_base_url="http://clinical:8082", require_cuda=False),
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    with pytest.raises(RuntimeError, match="422"):
        await client.book_by_doctor(
            {
                "doctor_id": "11111111-1111-4111-8111-111111111111",
                "patient_id": "22222222-2222-4222-8222-222222222222",
                "clinic_id": "33333333-3333-4333-8333-333333333333",
                "appointment_date": "2026-06-20",
                "appointment_time": "09:00",
                "created_by": "22222222-2222-4222-8222-222222222222",
            },
            idempotency_key="s1:confirm-1:book_by_doctor",
        )


@pytest.mark.asyncio
async def test_tool_registry_validates_args_and_calls_expected_client_methods():
    calls: list[tuple[str, dict]] = []

    class FakeClient:
        async def book_by_specialty(self, payload, idempotency_key=None):
            calls.append(("book_by_specialty", payload | {"idempotency_key": idempotency_key}))
            return {"appointment_id": "appt-1"}

        async def book_by_doctor(self, payload, idempotency_key=None):
            calls.append(("book_by_doctor", payload | {"idempotency_key": idempotency_key}))
            return {"appointment_id": "appt-2"}

        async def cancel_appointment(self, appointment_id, payload, idempotency_key=None):
            calls.append(("cancel_appointment", {"appointment_id": appointment_id, **payload, "idempotency_key": idempotency_key}))
            return {"appointment_id": appointment_id, "status": "cancelled"}

    registry = ToolRegistry(FakeClient())

    await registry.execute(
        "book_by_specialty",
        BookBySpecialtyArgs(
            specialty_id="11111111-1111-4111-8111-111111111111",
            patient_id="22222222-2222-4222-8222-222222222222",
            clinic_id="33333333-3333-4333-8333-333333333333",
            preferred_date="2026-06-20",
            created_by="22222222-2222-4222-8222-222222222222",
        ).model_dump(exclude_none=True),
        idempotency_key="idem-1",
    )
    await registry.execute(
        "cancel_appointment",
        CancelAppointmentArgs(
            appointment_id="44444444-4444-4444-8444-444444444444",
            cancelled_by="22222222-2222-4222-8222-222222222222",
        ).model_dump(exclude_none=True),
        idempotency_key="idem-2",
    )

    assert calls[0][0] == "book_by_specialty"
    assert calls[0][1]["idempotency_key"] == "idem-1"
    assert calls[1] == (
        "cancel_appointment",
        {
            "appointment_id": "44444444-4444-4444-8444-444444444444",
            "cancelled_by": "22222222-2222-4222-8222-222222222222",
            "idempotency_key": "idem-2",
        },
    )


@pytest.mark.asyncio
async def test_tool_registry_validates_read_args_and_drops_planner_extras():
    class FakeClient:
        async def get_appointment_by_code(self, code):
            return {"appointment_code": code}

    registry = ToolRegistry(FakeClient())

    result = await registry.execute(
        "get_appointment_by_code",
        {
            "code": "APT-20260614-0001",
            "patient_id": "22222222-2222-4222-8222-222222222222",
        },
    )

    assert result == {"appointment_code": "APT-20260614-0001"}


def test_tool_args_reject_unknown_or_invalid_mutation_payloads():
    with pytest.raises(ValueError):
        BookByDoctorArgs(
            doctor_id="not-a-uuid",
            patient_id="22222222-2222-4222-8222-222222222222",
            clinic_id="33333333-3333-4333-8333-333333333333",
            appointment_date="2026-06-20",
            appointment_time="09:00",
            created_by="22222222-2222-4222-8222-222222222222",
        )


def test_tool_registry_canonical_read_signature_normalizes_defaults_and_key_order():
    registry = ToolRegistry(object())

    omitted = registry.canonical_read_signature("list_specialties", {})
    explicit_none = registry.canonical_read_signature(
        "list_specialties",
        {"active_only": None},
    )
    first_order = registry.canonical_read_signature(
        "list_doctor_schedules",
        {"work_date": "2026-06-20", "clinic_id": "clinic-1"},
    )
    second_order = registry.canonical_read_signature(
        "list_doctor_schedules",
        {"clinic_id": "clinic-1", "work_date": "2026-06-20"},
    )

    assert omitted == explicit_none == "list_specialties:{}"
    assert first_order == second_order
    assert first_order == (
        'list_doctor_schedules:{"clinic_id":"clinic-1","work_date":"2026-06-20"}'
    )


@pytest.mark.asyncio
async def test_tool_registry_execute_uses_same_normalized_read_args_as_signature():
    calls: list[dict] = []

    class FakeClient:
        async def list_doctor_schedules(self, **kwargs):
            calls.append(kwargs)
            return []

    registry = ToolRegistry(FakeClient())

    signature = registry.canonical_read_signature(
        "list_doctor_schedules",
        {"clinic_id": "clinic-1", "work_date": "2026-06-20", "extra": "ignored"},
    )
    await registry.execute(
        "list_doctor_schedules",
        {"work_date": "2026-06-20", "clinic_id": "clinic-1", "extra": "ignored"},
    )

    assert signature == (
        'list_doctor_schedules:{"clinic_id":"clinic-1","work_date":"2026-06-20"}'
    )
    assert calls == [{"clinic_id": "clinic-1", "work_date": "2026-06-20"}]
