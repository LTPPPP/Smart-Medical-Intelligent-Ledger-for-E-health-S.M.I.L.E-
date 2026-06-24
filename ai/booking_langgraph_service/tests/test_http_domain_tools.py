import base64
import json

import httpx
import pytest

from src.http_tools import HttpDomainTools
from src.tool_errors import DomainConflictError, DomainToolError, MalformedToolPayload


def _unsigned_option_token(payload: dict[str, object]) -> str:
    header = base64.urlsafe_b64encode(json.dumps({"alg": "none"}).encode()).decode().rstrip("=")
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    return f"{header}.{body}.signature"


@pytest.mark.asyncio
async def test_resolve_patient_id_uses_clinical_patient_me_route_with_trusted_identity():
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["auth_user_id"] = request.headers.get("x-auth-user-id")
        if request.url.path == "/api/patients/me":
            return httpx.Response(200, json={"patient_id": "patient-1"})
        return httpx.Response(404, json={"message": "not found"})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    result = await tools.resolve_patient_id_by_user_id("user-1")

    assert result == "patient-1"
    assert captured == {"path": "/api/patients/me", "auth_user_id": "user-1"}


@pytest.mark.asyncio
async def test_find_booking_options_sends_trusted_identity_for_patient_scoped_availability():
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/appointments/availability":
            captured["auth_user_id"] = request.headers.get("x-auth-user-id")
            return httpx.Response(200, json={"service": {}, "dates": []})
        return httpx.Response(404, json={"message": "not found"})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    await tools.find_booking_options(
        "patient-1",
        {"service_id": "service-1", "auth_user_id": "user-1"},
    )

    assert captured == {"auth_user_id": "user-1"}


@pytest.mark.asyncio
async def test_find_booking_options_preserves_selected_opaque_token_when_availability_tokens_rotate():
    selected_token = _unsigned_option_token(
        {
            "aud": "appointment-option",
            "service_id": "service-1",
            "clinic_id": "clinic-1",
            "doctor_id": "doctor-a",
            "room_id": "room-1",
            "work_date": "2026-06-25",
            "start_time": "09:15",
        }
    )

    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/appointments/availability":
            return httpx.Response(
                200,
                json={
                    "service": {"duration_minutes": 30},
                    "dates": [
                        {
                            "date": "2026-06-25",
                            "doctors": [
                                {
                                    "doctor_id": "doctor-a",
                                    "clinic_id": "clinic-1",
                                    "room": {"room_id": "room-1", "room_name": "Room 1"},
                                    "slots": [
                                        {
                                            "start_time": "09:15",
                                            "status": "available",
                                            "option_token": "fresh-token-for-same-slot",
                                        }
                                    ],
                                }
                            ],
                        }
                    ],
                },
            )
        if request.url.path == "/v1/user-profiles/doctor-a":
            return httpx.Response(200, json={"full_name": "Dr. Nguyen Van A"})
        return httpx.Response(404, json={"message": "not found"})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        iam_base_url="http://iam.test",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    options = await tools.find_booking_options(
        "patient-1",
        {
            "service_id": "service-1",
            "booking_option_id": selected_token,
        },
    )

    assert options[0]["id"] == selected_token
    assert options[0]["doctor_name"] == "Dr. Nguyen Van A"
    assert options[0]["appointment_time"] == "09:15"


@pytest.mark.asyncio
async def test_commit_booking_sends_selected_opaque_token_without_prepared_cache():
    selected_token = _unsigned_option_token(
        {
            "aud": "appointment-option",
            "service_id": "service-1",
            "clinic_id": "clinic-1",
            "doctor_id": "doctor-a",
            "room_id": "room-1",
            "work_date": "2026-06-25",
            "start_time": "09:15",
        }
    )
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["body"] = json.loads(request.content)
        captured["idempotency"] = request.headers["Idempotency-Key"]
        return httpx.Response(201, json={"appointment_id": "appt-1"})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    result = await tools.commit_booking("patient-1", selected_token, "confirm-1", "user-1")

    assert result == {"appointment_id": "appt-1"}
    assert captured == {
        "path": "/api/v1/appointments/book-option",
        "body": {"patient_id": "patient-1", "option_token": selected_token, "created_by": "user-1"},
        "idempotency": "confirm-1",
    }


@pytest.mark.asyncio
async def test_get_patient_appointments_sends_trusted_identity_for_patient_scoped_reads():
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["auth_user_id"] = request.headers.get("x-auth-user-id")
        return httpx.Response(200, json=[])

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    await tools.get_patient_appointments("patient-1", "user-1")

    assert captured == {
        "path": "/api/v1/appointments/patient/patient-1",
        "auth_user_id": "user-1",
    }


@pytest.mark.asyncio
async def test_http_domain_tools_resolve_appointment_by_patient_ownership():
    seen_paths = []

    async def handler(request: httpx.Request) -> httpx.Response:
        seen_paths.append(str(request.url.path))
        if request.url.path == "/api/v1/appointments/code/APT-001":
            return httpx.Response(
                200,
                json={"appointment_id": "appt-001", "appointment_code": "APT-001", "patient_id": "patient-1"},
            )
        return httpx.Response(404, json={"message": "not found"})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        actor_id="staff-1",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    result = await tools.resolve_appointment_reference("patient-1", "APT-001")

    assert result["id"] == "appt-001"
    assert result["code"] == "APT-001"
    assert result["raw"]["appointment_id"] == "appt-001"
    assert seen_paths == ["/api/v1/appointments/code/APT-001"]


@pytest.mark.asyncio
async def test_http_domain_tools_rejects_appointment_owned_by_other_patient():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"id": "appt-001", "code": "APT-001", "patient_id": "other"})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        actor_id="staff-1",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    result = await tools.resolve_appointment_reference("patient-1", "APT-001")

    assert result is None


@pytest.mark.asyncio
async def test_http_domain_tools_commit_cancel_sends_idempotency_key():
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["body"] = json.loads(request.content)
        captured["idempotency"] = request.headers["Idempotency-Key"]
        return httpx.Response(200, json={"status": "cancelled", "appointment_id": "appt-001"})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        actor_id="staff-1",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    result = await tools.commit_cancel("patient-1", "appt-001", "confirm-123")

    assert result["status"] == "cancelled"
    assert captured == {
        "path": "/api/v1/appointments/appt-001/cancel",
        "method": "PATCH",
        "body": {
            "cancelled_by": "staff-1",
            "cancellation_reason": "Cancelled by patient through booking assistant",
        },
        "idempotency": "confirm-123",
    }
    assert tools.mutations == ["commit_cancel:appt-001"]


@pytest.mark.asyncio
async def test_http_timeout_is_normalized_for_graph_retry_policy():
    async def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("slow", request=request)

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    with pytest.raises(TimeoutError):
        await tools.get_patient_appointments("patient-1")


@pytest.mark.asyncio
async def test_http_500_during_resolution_is_not_collapsed_to_not_found():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"message": "unavailable"})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    with pytest.raises(DomainToolError):
        await tools.resolve_appointment_reference("patient-1", "APT-001")


@pytest.mark.asyncio
async def test_http_404_during_resolution_remains_safe_not_found():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404, json={"message": "not found"})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    assert await tools.resolve_appointment_reference("patient-1", "APT-001") is None


@pytest.mark.asyncio
async def test_http_409_is_typed_as_domain_conflict():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(409, json={"message": "conflict"})

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    with pytest.raises(DomainConflictError):
        await tools.commit_cancel("patient-1", "appt-001", "key-1")

    assert tools.mutations == []


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload",
    [{"unexpected": []}, {"data": "not-a-list"}, "not-an-envelope"],
)
async def test_malformed_appointment_envelope_is_not_normalized_to_empty(payload):
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=payload)

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    with pytest.raises(MalformedToolPayload):
        await tools.get_patient_appointments("patient-1")


@pytest.mark.asyncio
async def test_malformed_resolver_object_is_not_normalized_to_not_found():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[{"id": "wrong-shape"}])

    tools = HttpDomainTools(
        emr_base_url="http://emr.test",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    with pytest.raises(MalformedToolPayload):
        await tools.resolve_appointment_reference("patient-1", "APT-001")
