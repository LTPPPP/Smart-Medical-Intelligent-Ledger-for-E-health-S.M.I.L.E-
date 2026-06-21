import json

import httpx
import pytest

from src.http_tools import HttpDomainTools


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
