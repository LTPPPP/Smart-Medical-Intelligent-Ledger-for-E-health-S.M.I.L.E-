import httpx

from src.tools.executor import ClinicalEmrToolClient, ToolExecutor


def test_clinical_emr_client_prepends_configured_api_prefix():
    seen_paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_paths.append(request.url.path)
        return httpx.Response(200, json={"success": True})

    client = ClinicalEmrToolClient(
        base_url="http://clinical-emr.local",
        api_prefix="/api/v1",
    )
    client.client = httpx.Client(transport=httpx.MockTransport(handler))

    response = client.request("GET", "/slots", params={"date": "2026-06-15"})

    assert response == {"success": True}
    assert seen_paths == ["/api/v1/slots"]


class RecordingClinicalClient:
    def __init__(self):
        self.calls: list[dict] = []

    def request(self, method: str, path: str, json=None, params=None):
        self.calls.append(
            {"method": method, "path": path, "json": json, "params": params}
        )
        return {"success": True}


def test_tool_executor_uses_unversioned_clinical_paths():
    client = RecordingClinicalClient()
    executor = ToolExecutor(clinical_client=client)  # type: ignore[arg-type]

    result = executor.execute(
        "hold_slot",
        {
            "slot_id": "10000000-0000-0000-0000-000000000001",
            "patient_session_id": "session-1",
            "ttl_seconds": 300,
        },
    )

    assert result.success is True
    assert client.calls == [
        {
            "method": "POST",
            "path": "/slots/10000000-0000-0000-0000-000000000001/hold",
            "json": {"patient_session_id": "session-1", "ttl_seconds": 300},
            "params": None,
        }
    ]
