import json

import httpx
import pytest

from src.extractor import StructuredCommandExtractor
from src.schemas import FlowName


@pytest.mark.asyncio
async def test_structured_extractor_uses_english_prompt_and_json_schema():
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["payload"] = json.loads(request.content)
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(
                                {
                                    "intent": "cancel",
                                    "confidence": 0.91,
                                    "appointment_ref": "APT-001",
                                    "missing_slots": [],
                                }
                            )
                        }
                    }
                ]
            },
        )

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    extractor = StructuredCommandExtractor(
        llm_base_url="http://llm.test/v1",
        model="Qwen/Qwen3.5-4B",
        http_client=client,
    )

    command = await extractor.extract("Cancel appointment APT-001")

    assert command.intent == FlowName.CANCEL
    assert command.selected_reference == "APT-001"
    payload = captured["payload"]
    assert payload["model"] == "Qwen/Qwen3.5-4B"
    assert payload["chat_template_kwargs"] == {"enable_thinking": False}
    assert payload["response_format"]["type"] == "json_schema"
    assert "intent and slot extraction module" in payload["messages"][0]["content"]
    assert "Vietnamese" not in payload["messages"][0]["content"]


@pytest.mark.asyncio
async def test_structured_extractor_fails_closed_on_bad_json_by_default():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"choices": [{"message": {"content": "not-json"}}]})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    extractor = StructuredCommandExtractor(
        llm_base_url="http://llm.test/v1",
        model="Qwen/Qwen3.5-4B",
        http_client=client,
    )

    command = await extractor.extract("Show my appointments")

    assert command.intent == FlowName.UNKNOWN
    assert command.confidence == 0
    assert extractor.last_error == "parse_error"


@pytest.mark.asyncio
async def test_structured_extractor_records_http_failure_without_deterministic_fallback_by_default():
    async def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("offline")

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    extractor = StructuredCommandExtractor(
        llm_base_url="http://llm.test/v1",
        model="Qwen/Qwen3.5-4B",
        http_client=client,
    )

    command = await extractor.extract("Cancel appointment APT-001")

    assert command.intent == FlowName.UNKNOWN
    assert extractor.last_error == "ConnectError"


@pytest.mark.asyncio
async def test_structured_extractor_allows_explicit_deterministic_fallback_for_tests():
    async def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("offline")

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    extractor = StructuredCommandExtractor(
        llm_base_url="http://llm.test/v1",
        model="Qwen/Qwen3.5-4B",
        http_client=client,
        allow_deterministic_fallback=True,
    )

    command = await extractor.extract("Cancel appointment APT-001")

    assert command.intent == FlowName.CANCEL
    assert extractor.last_error == "ConnectError"


@pytest.mark.asyncio
async def test_structured_extractor_guards_obvious_lookup_from_booking_misclassification():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(
                                {
                                    "intent": "booking",
                                    "confidence": 0.72,
                                    "missing_slots": ["date_hint"],
                                }
                            )
                        }
                    }
                ]
            },
        )

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    extractor = StructuredCommandExtractor(
        llm_base_url="http://llm.test/v1",
        model="Qwen/Qwen3.5-4B",
        http_client=client,
    )

    command = await extractor.extract("Show my upcoming appointments")

    assert command.intent == FlowName.LOOKUP
    assert command.confidence == 1.0
