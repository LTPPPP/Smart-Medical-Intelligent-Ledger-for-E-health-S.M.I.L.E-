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


def test_rule_fallback_extracts_booking_availability_follow_up_constraints():
    command = AgentCommand.from_english_message("is there any free slot between 12pm -> 4pm any doctor")

    slots = {update.name: update.value for update in command.slot_updates}
    assert command.intent == FlowName.BOOKING
    assert slots["time_hint"] == "between 12pm -> 4pm"
    assert slots["doctor_hint"] == "any doctor"


def test_rule_fallback_extracts_common_oral_check_booking_details():
    command = AgentCommand.from_english_message("yes i need for next 2 day, and i wanna an oral check")

    slots = {update.name: update.value for update in command.slot_updates}
    assert command.intent == FlowName.BOOKING
    assert slots["date_hint"] == "next 2 day"
    assert slots["service_hint"] == "oral check"


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
    instructions = payload["instructions"]
    assert "ROLE\n" in instructions
    assert "OUTPUT CONTRACT\n" in instructions
    assert "INTENT ROUTING\n" in instructions
    assert "DIALOGUE ACTS\n" in instructions
    assert "SLOT EXTRACTION\n" in instructions
    assert "DIRECT RESPONSE POLICY\n" in instructions
    assert "AMBIGUITY AND SAFETY\n" in instructions
    assert "semantic understanding module" in instructions
    assert "English-only" in instructions
    assert "Classify by meaning, not by keyword or exact phrase matching." in instructions
    assert "Do not translate appointment codes" in instructions
    assert "direct_response must be null for transactional turns" in instructions
    assert "Social affection" not in instructions
    assert "Insults or profanity" not in instructions
    assert payload["text"]["format"]["type"] == "json_schema"
    schema = payload["text"]["format"]["schema"]
    assert schema["required"] == list(schema["properties"])
    assert schema["properties"]["appointment_ref"] == {"type": ["string", "null"]}
    assert schema["properties"]["dialogue_act"] == {
        "type": ["string", "null"],
        "enum": [
            "correct", "abort", "switch", "request", "inform", "clarify",
            "confirm", "reject", "greet", "identity", "abuse", "other", None,
        ],
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
async def test_structured_extractor_enforces_english_language_contract():
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

    assert command.language == "en"


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
async def test_structured_extractor_does_not_override_model_with_phrase_rules():
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

    assert command.intent == FlowName.BOOKING
    assert command.confidence == 0.72


@pytest.mark.asyncio
async def test_structured_extractor_preserves_semantic_model_output():
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

    assert command.intent == FlowName.INFO
    assert command.confidence == 0.41


@pytest.mark.asyncio
async def test_structured_extractor_augments_missing_booking_hints_from_raw_message():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json=_responses_payload(
                {
                    "intent": "booking",
                    "confidence": 0.72,
                    "missing_slots": ["clinic_hint"],
                }
            ),
        )

    extractor = OpenAICommandExtractor(
        llm_base_url="http://llm.test/v1",
        model="gpt-5-mini",
        api_key="test-key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    command = await extractor.extract("yes i need for next 2 day, and i wanna an oral check")

    slots = {update.name: update.value for update in command.slot_updates}
    assert command.intent == FlowName.BOOKING
    assert slots["date_hint"] == "next 2 day"
    assert slots["service_hint"] == "oral check"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("intent", "dialogue_act"),
    [("conversational", "greet"), ("conversational", "identity"), ("out_of_scope", "request")],
)
async def test_structured_extractor_supports_semantic_non_transactional_turns(intent: str, dialogue_act: str):
    async def handler(request: httpx.Request) -> httpx.Response:
        payload = {
            key: None
            for key in (
                "appointment_ref", "clinic_hint", "service_hint", "specialty_hint",
                "doctor_hint", "date_hint", "time_hint",
            )
        }
        payload.update({"intent": intent, "dialogue_act": dialogue_act, "confidence": 0.92, "missing_slots": []})
        return httpx.Response(200, json=_responses_payload(payload))

    extractor = OpenAICommandExtractor(
        llm_base_url="http://llm.test/v1",
        model="gpt-5-mini",
        api_key="test-key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    command = await extractor.extract("An unseen natural-language utterance")

    assert command.intent.value == intent
    assert command.dialogue_act == dialogue_act


def test_structured_extractor_preserves_compound_constraints_preferences_and_negations():
    command = OpenAICommandExtractor._command_from_payload(
        {
            "intent": "booking",
            "secondary_intents": ["lookup"],
            "dialogue_act": "request",
            "confidence": 0.94,
            "date_hint": "next Friday",
            "time_hint": "afternoon",
            "constraints": ["before 16:00"],
            "preferences": ["Dr. Smith", "District 1"],
            "negations": ["not after 16:00"],
            "missing_slots": [],
        },
        "Show my appointments, then book with Dr. Smith next Friday before 4 PM.",
    )

    assert command.intent == FlowName.BOOKING
    assert command.secondary_intents == [FlowName.LOOKUP]
    assert command.constraints == ["before 16:00"]
    assert command.preferences == ["Dr. Smith", "District 1"]
    assert command.negations == ["not after 16:00"]


def test_structured_extractor_preserves_patient_booking_details_as_slots():
    command = OpenAICommandExtractor._command_from_payload(
        {
            "intent": "booking",
            "confidence": 0.96,
            "appointment_type": "consultation",
            "chief_complaint": "Persistent tooth pain",
            "notes": "Sensitive to cold drinks",
        },
        "Book a consultation for persistent tooth pain. I am sensitive to cold drinks.",
    )

    slots = {update.name: update.value for update in command.slot_updates}
    assert slots == {
        "appointment_type": "consultation",
        "chief_complaint": "Persistent tooth pain",
        "notes": "Sensitive to cold drinks",
    }
