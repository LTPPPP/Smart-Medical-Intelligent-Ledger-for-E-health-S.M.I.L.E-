import json

import httpx
import pytest

from src.extractor import OpenAICommandExtractor
from src.schemas import AgentCommand, FlowName


def _responses_payload(data: dict) -> dict:
    return {"output": [{"content": {"type": "output_text", "text": json.dumps(data)}}]}


def test_rule_fallback_extracts_vietnamese_booking_cancel_reschedule_and_lookup():
    cases = [
        ("Tôi muốn đặt lịch khám răng vào 2027-02-03", FlowName.BOOKING),
        ("Cho tôi xem lịch hẹn sắp tới", FlowName.LOOKUP),
        ("Tôi muốn hủy lịch hẹn APT-001", FlowName.CANCEL),
        ("Đổi lịch hẹn APT-001 sang 2027-02-04", FlowName.RESCHEDULE),
    ]

    for message, expected in cases:
        command = AgentCommand.from_english_message(message)

        assert command.intent == expected


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
    assert "English and Vietnamese" in payload["instructions"]
    assert "Do not translate appointment codes" in payload["instructions"]
    assert payload["text"]["format"]["type"] == "json_schema"
    schema = payload["text"]["format"]["schema"]
    assert schema["required"] == list(schema["properties"])
    assert schema["properties"]["appointment_ref"] == {"type": ["string", "null"]}
    assert schema["properties"]["dialogue_act"] == {
        "type": ["string", "null"],
        "enum": ["correct", "abort", "switch", None],
    }
    assert schema["additionalProperties"] is False
    assert "chat_template_kwargs" not in payload


@pytest.mark.asyncio
async def test_structured_extractor_returns_typed_dialogue_act():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json=_responses_payload({
                "intent": "unknown",
                "dialogue_act": "correct",
                "confidence": 0.94,
                "appointment_ref": None,
                "clinic_hint": None,
                "service_hint": None,
                "specialty_hint": None,
                "doctor_hint": None,
                "date_hint": None,
                "time_hint": "16:00",
                "missing_slots": [],
            }),
        )

    extractor = OpenAICommandExtractor(
        llm_base_url="http://llm.test/v1",
        model="gpt-5-mini",
        api_key="test-key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    command = await extractor.extract("Actually, make it 16:00.")

    assert command.dialogue_act == "correct"
    assert command.slot_updates[0].name == "time_hint"


@pytest.mark.asyncio
async def test_structured_extractor_infers_vietnamese_language_from_original_message():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json=_responses_payload({
                "intent": "booking",
                "dialogue_act": None,
                "confidence": 0.93,
                "appointment_ref": None,
                "clinic_hint": None,
                "service_hint": "khám răng",
                "specialty_hint": "nha khoa",
                "doctor_hint": None,
                "date_hint": "2027-02-03",
                "time_hint": None,
                "missing_slots": [],
            }),
        )

    extractor = OpenAICommandExtractor(
        llm_base_url="http://llm.test/v1",
        model="gpt-5-mini",
        api_key="test-key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    command = await extractor.extract("Tôi muốn đặt lịch khám răng ngày 2027-02-03.")

    assert command.language == "vi"


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
