import json
from datetime import date, timedelta

import httpx
import pytest

from src.http_tools import HttpDomainTools


@pytest.mark.asyncio
async def test_commit_booking_sends_real_book_by_doctor_payload():
    captured = {}
    future_date = (date.today() + timedelta(days=3)).isoformat()

    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/doctor-schedules":
            return httpx.Response(
                200,
                json={
                    "data": [
                        {
                            "schedule_id": "schedule-1",
                            "doctor_id": "doctor-001",
                            "clinic_id": "clinic-downtown",
                            "work_date": future_date,
                            "start_time": "09:00:00",
                        }
                    ]
                },
            )
        captured["path"] = request.url.path
        captured["body"] = json.loads(request.content)
        return httpx.Response(201, json={"appointment_id": "appt-new"})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        actor_id="staff-1",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    await tools.find_booking_options("patient-1", {})
    await tools.commit_booking("patient-1", "schedule-1", "confirm-book")

    assert captured["path"] == "/api/v1/appointments/by-doctor"
    assert captured["body"] == {
        "doctor_id": "doctor-001",
        "patient_id": "patient-1",
        "clinic_id": "clinic-downtown",
        "appointment_date": future_date,
        "appointment_time": "09:00",
        "duration_minutes": 30,
        "created_by": "patient-1",
    }


@pytest.mark.asyncio
async def test_commit_cancel_sends_real_cancel_payload():
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json={"status": "cancelled"})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        actor_id="staff-1",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    await tools.commit_cancel("patient-1", "appt-001", "confirm-cancel")

    assert captured["body"] == {
        "cancelled_by": "staff-1",
        "cancellation_reason": "Cancelled by patient through booking assistant",
    }


@pytest.mark.asyncio
async def test_commit_reschedule_uses_appointment_patch_with_real_update_fields():
    captured = {}
    future_date = (date.today() + timedelta(days=4)).isoformat()

    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/doctor-schedules":
            return httpx.Response(
                200,
                json={
                    "data": [
                        {
                            "schedule_id": "schedule-1",
                            "doctor_id": "doctor-001",
                            "clinic_id": "clinic-downtown",
                            "work_date": future_date,
                            "start_time": "09:00:00",
                        }
                    ]
                },
            )
        captured["path"] = request.url.path
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json={"status": "rescheduled"})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        actor_id="staff-1",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    await tools.find_booking_options("patient-1", {})
    await tools.commit_reschedule("patient-1", "appt-001", "schedule-1", "confirm-reschedule")

    assert captured["path"] == "/api/v1/appointments/appt-001"
    assert captured["body"] == {
        "appointment_date": future_date,
        "appointment_time": "09:00",
        "doctor_id": "doctor-001",
        "clinic_id": "clinic-downtown",
        "updated_by": "staff-1",
    }


@pytest.mark.asyncio
async def test_find_booking_options_skips_schedules_without_time():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "data": [
                    {
                        "schedule_id": "missing-time",
                        "doctor_id": "doctor-001",
                        "clinic_id": "clinic-downtown",
                        "work_date": "2026-06-24",
                        "shift": None,
                    },
                    {
                        "schedule_id": "with-time",
                        "doctor_id": "doctor-001",
                        "clinic_id": "clinic-downtown",
                        "work_date": "2026-06-25",
                        "shift": {"start_time": "10:00:00"},
                    },
                ]
            },
        )

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    options = await tools.find_booking_options("patient-1", {})

    assert [option["id"] for option in options] == ["with-time"]


@pytest.mark.asyncio
async def test_find_booking_options_does_not_send_non_iso_date_hint_as_work_date():
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json={"data": []})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    await tools.find_booking_options("patient-1", {"date_hint": "earliest available time"})

    assert "work_date" not in captured["params"]
