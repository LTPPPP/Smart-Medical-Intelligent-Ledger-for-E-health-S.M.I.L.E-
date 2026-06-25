import httpx
from fastapi.testclient import TestClient

from src.main import create_app
from src.settings import Settings


def test_health_checks_real_emr_and_llm_when_not_injected():
    async def emr_handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/health":
            return httpx.Response(200, json={"status": "ok"})
        return httpx.Response(404, json={"message": "unexpected"})

    async def llm_handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/v1/models/gpt-4.1-mini":
            assert request.headers["authorization"] == "Bearer test-key"
            return httpx.Response(200, json={"id": "gpt-4.1-mini"})
        return httpx.Response(404, json={"message": "unexpected"})

    client = TestClient(
        create_app(
            settings=Settings(emr_base_url="http://emr.test", llm_base_url="http://llm.test/v1", llm_api_key="test-key"),
            http_client=httpx.AsyncClient(transport=httpx.MockTransport(emr_handler)),
            llm_http_client=httpx.AsyncClient(transport=httpx.MockTransport(llm_handler)),
        )
    )

    payload = client.get("/health").json()

    assert payload["status"] == "ok"
    assert payload["dependencies"]["emr"]["status"] == "ok"
    assert payload["dependencies"]["llm"]["status"] == "ok"
    assert payload["dependencies"]["llm"]["model"] == "gpt-4.1-mini"


def test_health_reports_degraded_when_llm_is_configured_but_unavailable():
    async def emr_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"status": "ok"})

    async def llm_handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("no model server")

    client = TestClient(
        create_app(
            settings=Settings(emr_base_url="http://emr.test", llm_base_url="http://llm.test/v1", llm_api_key="test-key"),
            http_client=httpx.AsyncClient(transport=httpx.MockTransport(emr_handler)),
            llm_http_client=httpx.AsyncClient(transport=httpx.MockTransport(llm_handler)),
        )
    )

    payload = client.get("/health").json()

    assert payload["status"] == "degraded"
    assert payload["dependencies"]["emr"]["status"] == "ok"
    assert payload["dependencies"]["llm"]["status"] == "unavailable"
