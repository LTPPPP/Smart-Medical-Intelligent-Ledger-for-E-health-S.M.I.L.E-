import importlib.util
from pathlib import Path

import httpx
import pytest


def _load_model_preflight():
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "model_preflight.py"
    spec = importlib.util.spec_from_file_location("model_preflight", script_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


@pytest.mark.asyncio
async def test_model_preflight_reports_expected_model_available():
    model_preflight = _load_model_preflight()

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"data": [{"id": "gpt-5-mini"}]})

    payload = await model_preflight.check_model_endpoint(
        "http://llm.test/v1",
        "gpt-5-mini",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    assert payload["status"] == "ok"
    assert payload["expected_model_present"] is True


@pytest.mark.asyncio
async def test_model_preflight_sends_bearer_token_when_api_key_is_provided():
    model_preflight = _load_model_preflight()
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["authorization"] = request.headers.get("authorization")
        return httpx.Response(200, json={"data": [{"id": "gpt-5-mini"}]})

    payload = await model_preflight.check_model_endpoint(
        "http://llm.test/v1",
        "gpt-5-mini",
        api_key="test-key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    assert payload["status"] == "ok"
    assert captured["authorization"] == "Bearer test-key"


@pytest.mark.asyncio
async def test_model_preflight_reports_unavailable_endpoint():
    model_preflight = _load_model_preflight()

    async def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("offline")

    payload = await model_preflight.check_model_endpoint(
        "http://llm.test/v1",
        "gpt-5-mini",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    assert payload["status"] == "unavailable"
    assert payload["error"] == "ConnectError"
