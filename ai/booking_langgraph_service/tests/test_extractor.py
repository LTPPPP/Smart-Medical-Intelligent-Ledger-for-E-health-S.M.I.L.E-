import json

import httpx
import pytest

from src.extractor import OpenAICommandExtractor
from src.schemas import FlowName


def _responses_payload(data: dict) -> dict:
    return {"output": [{"content": {"type": "output_text", "text": json.dumps(data)}}]}


@pytest.mark.asyncio
async def test_openai_extractor_uses_responses_api_and_structured_json_schema():
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["authorization"] = request.headers.get("authorization")
        captured["payload"] = json.loads(request.content)
        return httpx.Response(
            200,
            json=_responses_payload(
                {
                    "intent": "cancel",
                    "confidence": 0.91,
                    "appointment_ref": "APT-001",
                    "missing_slots": [],
                }
            ),
        )

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    extractor = OpenAICommandExtractor(
        llm_base_url="http://llm.test/v1",
        model="gpt-5-mini",
        api_key="test-key",
        http_client=client,
    )

    command = await extractor.extract("Cancel appointment APT-001")

    assert command.intent == FlowName.CANCEL
    assert command.selected_reference == "APT-001"
    payload = captured["payload"]
    assert captured["url"] == "http://llm.test/v1/responses"
    assert captured["authorization"] == "Bearer test-key"
    assert payload["model"] == "gpt-5-mini"
    assert payload["input"] == "Cancel appointment APT-001"
    assert "intent and slot extraction module" in payload["instructions"]
    assert "Vietnamese" not in payload["instructions"]
    assert payload["text"]["format"]["type"] == "json_schema"
    schema = payload["text"]["format"]["schema"]
    assert schema["required"] == list(schema["properties"])
    assert schema["properties"]["appointment_ref"] == {"type": ["string", "null"]}
    assert schema["additionalProperties"] is False
    assert "chat_template_kwargs" not in payload


@pytest.mark.asyncio
async def test_structured_extractor_fails_closed_on_bad_json_by_default():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"output": [{"content": {"type": "output_text", "text": "not-json"}}]})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    extractor = OpenAICommandExtractor(
        llm_base_url="http://llm.test/v1",
        model="gpt-5-mini",
        api_key="test-key",
        http_client=client,
    )

    command = await extractor.extract("Show my appointments")

    assert command.intent == FlowName.UNKNOWN
    assert command.confidence == 0
    assert extractor.last_error == "parse_error"


@pytest.mark.asyncio
async def test_structured_extractor_records_http_failure_without_model_or_deterministic_fallback():
    async def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("offline")

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    extractor = OpenAICommandExtractor(
        llm_base_url="http://llm.test/v1",
        model="gpt-5-mini",
        api_key="test-key",
        http_client=client,
    )

    command = await extractor.extract("Cancel appointment APT-001")

    assert command.intent == FlowName.UNKNOWN
    assert extractor.last_error == "ConnectError"


@pytest.mark.asyncio
async def test_structured_extractor_guards_obvious_lookup_from_booking_misclassification():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json=_responses_payload(
                {
                    "intent": "booking",
                    "confidence": 0.72,
                    "missing_slots": ["date_hint"],
                }
            ),
        )

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    extractor = OpenAICommandExtractor(
        llm_base_url="http://llm.test/v1",
        model="gpt-5-mini",
        api_key="test-key",
        http_client=client,
    )

    command = await extractor.extract("Show my upcoming appointments")

    assert command.intent == FlowName.LOOKUP
    assert command.confidence == 1.0


@pytest.mark.asyncio
async def test_structured_extractor_guards_natural_lookup_question_from_unknown():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json=_responses_payload(
                {
                    "intent": "info",
                    "confidence": 0.41,
                    "missing_slots": ["intent"],
                }
            ),
        )

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    extractor = OpenAICommandExtractor(
        llm_base_url="http://llm.test/v1",
        model="gpt-5-mini",
        api_key="test-key",
        http_client=client,
    )

    command = await extractor.extract("What appointments do I have coming up?")

    assert command.intent == FlowName.LOOKUP
    assert command.confidence == 1.0
