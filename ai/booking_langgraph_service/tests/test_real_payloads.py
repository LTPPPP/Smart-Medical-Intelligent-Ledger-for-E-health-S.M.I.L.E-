import json
from datetime import date, timedelta

import httpx
import pytest

from src.http_tools import HttpDomainTools


@pytest.mark.asyncio
async def test_get_patient_appointments_returns_card_ready_fields():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"data": [{
            "appointment_id": "appt-1",
            "appointment_code": "APT-001",
            "appointment_date": "2026-06-24",
            "appointment_time": "09:00",
            "duration_minutes": 30,
            "status": "scheduled",
            "clinic": {"clinic_name": "SMILE HCM"},
            "room": {"room_name": "Room 1"},
            "service": {"service_name": "Oral checking"},
        }]})

    tools = HttpDomainTools(
        emr_base_url="http://emr",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    appointments = await tools.get_patient_appointments("patient-1")

    assert appointments[0]["id"] == "appt-1"
    assert appointments[0]["appointment_code"] == "APT-001"
    assert appointments[0]["appointment_date"] == "2026-06-24"
    assert appointments[0]["appointment_time"] == "09:00"
    assert appointments[0]["duration_minutes"] == 30
    assert appointments[0]["service_name"] == "Oral checking"
    assert appointments[0]["clinic_name"] == "SMILE HCM"
    assert appointments[0]["room_name"] == "Room 1"


@pytest.mark.asyncio
async def test_get_patient_appointments_enriches_doctor_name_from_iam():
    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/appointments/patient/patient-1":
            return httpx.Response(200, json={"data": [{
                "appointment_id": "appt-1",
                "appointment_code": "APT-001",
                "doctor_id": "doctor-1",
                "room_id": "room-1",
                "appointment_date": "2026-06-24",
                "appointment_time": "09:00",
                "status": "scheduled",
            }]})
        if request.url.path == "/v1/user-profiles/doctor-1":
            return httpx.Response(200, json={"full_name": "Dr. Nguyen Van An"})
        if request.url.path == "/api/v1/treatment-rooms/room-1":
            return httpx.Response(200, json={"room_name": "Room 1"})
        return httpx.Response(404, json={"message": "not found"})

    tools = HttpDomainTools(
        emr_base_url="http://emr",
        iam_base_url="http://iam",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    appointments = await tools.get_patient_appointments("patient-1")

    assert appointments[0]["doctor_name"] == "Dr. Nguyen Van An"
    assert appointments[0]["room_name"] == "Room 1"


def availability_payload(work_date: str = "2026-06-24") -> dict:
    return {
        "service": {
            "id": "service-001",
            "name": "Oral checking",
            "duration_minutes": 30,
            "required_room_type": "examination",
        },
        "dates": [{
            "date": work_date,
            "doctors": [{
                "doctor_id": "doctor-001",
                "clinic_id": "clinic-001",
                "room": {"room_id": "room-101", "room_name": "Room 101"},
                "slots": [
                    {"option_token": "slot-0900", "start_time": "09:00", "occupied_until": "09:55"},
                    {"option_token": "slot-0930", "start_time": "09:30", "occupied_until": "10:25"},
                ],
            }],
        }],
    }


@pytest.mark.asyncio
async def test_find_booking_options_reads_clinical_availability_and_doctor_metadata():
    requested_paths: list[str] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requested_paths.append(request.url.path)
        if request.url.path == "/api/v1/appointments/availability":
            assert dict(request.url.params) == {
                "patient_id": "patient-1",
                "service_id": "service-001",
                "date_from": "2026-06-24",
                "date_to": "2026-06-24",
            }
            return httpx.Response(200, json=availability_payload())
        if request.url.path == "/api/v1/user-profiles/doctor-001":
            return httpx.Response(200, json={"full_name": "Dr. Nguyen Van An"})
        return httpx.Response(404, json={"message": "not found"})

    tools = HttpDomainTools(
        emr_base_url="http://emr",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    options = await tools.find_booking_options(
        "patient-1", {"date_hint": "2026-06-24", "service_id": "service-001"}
    )

    assert "/api/v1/doctor-schedules" not in requested_paths
    assert [option["id"] for option in options] == ["slot-0900", "slot-0930"]
    assert options[0]["doctor_name"] == "Dr. Nguyen Van An"
    assert options[0]["room_name"] == "Room 101"
    assert options[0]["duration_minutes"] == 30
    assert options[0]["payload"]["service_id"] == "service-001"


@pytest.mark.asyncio
async def test_find_booking_options_keeps_slots_when_optional_doctor_profile_is_malformed():
    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/appointments/availability":
            return httpx.Response(200, json=availability_payload())
        if request.url.path.startswith("/api/v1/user-profiles/"):
            return httpx.Response(200, content=b"")
        return httpx.Response(404, json={"message": "not found"})

    tools = HttpDomainTools(
        emr_base_url="http://emr",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    options = await tools.find_booking_options(
        "patient-1", {"date_hint": "2026-06-24", "service_id": "service-001"}
    )

    assert [option["id"] for option in options] == ["slot-0900", "slot-0930"]
    assert options[0]["doctor_name"] == "Doctor doctor-001"


@pytest.mark.asyncio
async def test_find_booking_options_resolves_service_hint_before_availability_lookup():
    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/services":
            return httpx.Response(200, json={"data": [{"service_id": "service-real", "service_name": "Consultation"}]})
        if request.url.path == "/api/v1/appointments/availability":
            assert request.url.params["service_id"] == "service-real"
            return httpx.Response(200, json=availability_payload())
        if request.url.path.startswith("/api/v1/user-profiles/"):
            return httpx.Response(200, json={"full_name": "Dr. An"})
        return httpx.Response(404, json={"message": "not found"})

    tools = HttpDomainTools(
        emr_base_url="http://emr",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    options = await tools.find_booking_options("patient-1", {"service_hint": "consultation"})

    assert options[0]["payload"]["service_id"] == "service-real"


@pytest.mark.asyncio
async def test_find_booking_options_resolves_patient_exam_checking_to_oral_checking():
    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/services":
            return httpx.Response(
                200,
                json={"data": [{"service_id": "service-check", "service_name": "Oral checking"}]},
            )
        if request.url.path == "/api/v1/appointments/availability":
            assert request.url.params["service_id"] == "service-check"
            return httpx.Response(200, json=availability_payload())
        if request.url.path.startswith("/api/v1/user-profiles/"):
            return httpx.Response(200, json={"full_name": "Dr. An"})
        return httpx.Response(404, json={"message": "not found"})

    tools = HttpDomainTools(
        emr_base_url="http://emr",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    options = await tools.find_booking_options("patient-1", {"service_hint": "exam checking"})

    assert options[0]["payload"]["service_id"] == "service-check"


@pytest.mark.asyncio
async def test_find_booking_options_uses_appointment_type_as_service_hint():
    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/services":
            return httpx.Response(
                200,
                json={"data": [{"service_id": "service-check", "service_name": "Oral checking"}]},
            )
        if request.url.path == "/api/v1/appointments/availability":
            assert request.url.params["service_id"] == "service-check"
            return httpx.Response(200, json=availability_payload())
        if request.url.path.startswith("/api/v1/user-profiles/"):
            return httpx.Response(200, json={"full_name": "Dr. An"})
        return httpx.Response(404, json={"message": "not found"})

    tools = HttpDomainTools(
        emr_base_url="http://emr",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    options = await tools.find_booking_options("patient-1", {"appointment_type": "exam checking"})

    assert options[0]["payload"]["service_id"] == "service-check"


@pytest.mark.asyncio
async def test_find_booking_options_resolves_service_hint_across_service_pages():
    service_pages = []

    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/services":
            service_pages.append(request.url.params.get("page"))
            page = int(request.url.params.get("page", "1"))
            if page == 1:
                return httpx.Response(
                    200,
                    json={
                        "data": [{"service_id": "service-cleaning", "service_name": "Cleaning"}],
                        "pagination": {"page": 1, "limit": 1, "total": 2},
                    },
                )
            return httpx.Response(
                200,
                json={
                    "data": [{"service_id": "service-root", "service_name": "Root canal therapy"}],
                    "pagination": {"page": 2, "limit": 1, "total": 2},
                },
            )
        if request.url.path == "/api/v1/appointments/availability":
            assert request.url.params["service_id"] == "service-root"
            return httpx.Response(200, json=availability_payload())
        if request.url.path.startswith("/api/v1/user-profiles/"):
            return httpx.Response(200, json={"full_name": "Dr. An"})
        return httpx.Response(404, json={"message": "not found"})

    tools = HttpDomainTools(
        emr_base_url="http://emr",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    options = await tools.find_booking_options("patient-1", {"service_hint": "root canal"})

    assert service_pages == ["1", "2"]
    assert options[0]["payload"]["service_id"] == "service-root"


@pytest.mark.asyncio
async def test_find_booking_options_requires_service_before_availability_lookup():
    called = False

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal called
        called = True
        return httpx.Response(500, json={"message": "unexpected"})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    assert await tools.find_booking_options("patient-1", {"date_hint": "2026-06-24"}) == []
    assert called is False


@pytest.mark.asyncio
async def test_find_booking_options_does_not_send_non_iso_date_as_specific_range():
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json={"service": {}, "dates": []})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    await tools.find_booking_options(
        "patient-1", {"date_hint": "earliest available time", "service_id": "service-001"}
    )

    assert captured["params"]["date_from"] == date.today().isoformat()
    assert "work_date" not in captured["params"]


@pytest.mark.asyncio
async def test_find_booking_options_expands_next_day_and_next_n_days_ranges():
    captured: list[dict[str, str]] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        captured.append(dict(request.url.params))
        return httpx.Response(200, json={"service": {}, "dates": []})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    await tools.find_booking_options("patient-1", {"date_hint": "the next day", "service_id": "service-001"})
    await tools.find_booking_options("patient-1", {"date_hint": "next 10 days", "service_id": "service-001"})

    assert captured[0]["date_from"] == (date.today() + timedelta(days=1)).isoformat()
    assert captured[0]["date_to"] == (date.today() + timedelta(days=1)).isoformat()
    assert captured[1]["date_from"] == date.today().isoformat()
    assert captured[1]["date_to"] == (date.today() + timedelta(days=10)).isoformat()


@pytest.mark.asyncio
async def test_commit_booking_sends_option_token_and_patient_booking_details():
    captured = {}
    future_date = (date.today() + timedelta(days=3)).isoformat()

    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/appointments/availability":
            return httpx.Response(200, json=availability_payload(future_date))
        if request.url.path.startswith("/api/v1/user-profiles/"):
            return httpx.Response(200, json={"full_name": "Dr. Test"})
        captured["path"] = request.url.path
        captured["body"] = json.loads(request.content)
        return httpx.Response(201, json={"appointment_id": "appt-new"})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        actor_id="staff-1",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    await tools.find_booking_options("patient-1", {"service_id": "service-001", "date_hint": future_date})
    await tools.commit_booking(
        "patient-1",
        "slot-0900",
        "confirm-book",
        booking_draft={
            "appointment_type": "consultation",
            "chief_complaint": "Persistent tooth pain",
            "notes": "Sensitive to cold drinks",
        },
    )

    assert captured["path"] == "/api/v1/appointments/book-option"
    assert captured["body"] == {
        "patient_id": "patient-1",
        "option_token": "slot-0900",
        "created_by": "patient-1",
        "appointment_type": "consultation",
        "chief_complaint": "Persistent tooth pain",
        "notes": "Sensitive to cold drinks",
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
async def test_commit_reschedule_sends_option_token_payload():
    captured = {}
    future_date = (date.today() + timedelta(days=4)).isoformat()

    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/appointments/availability":
            return httpx.Response(200, json=availability_payload(future_date))
        if request.url.path.startswith("/api/v1/user-profiles/"):
            return httpx.Response(200, json={"full_name": "Dr. Test"})
        captured["path"] = request.url.path
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json={"status": "rescheduled"})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        actor_id="staff-1",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    await tools.find_booking_options("patient-1", {"service_id": "service-001", "date_hint": future_date})
    await tools.commit_reschedule("patient-1", "appt-001", "slot-0900", "confirm-reschedule")

    assert captured["path"] == "/api/v1/appointments/appt-001/reschedule-option"
    assert captured["body"] == {
        "option_token": "slot-0900",
        "updated_by": "staff-1",
    }
