"""Unit tests for SlotExtractor parsing and schema compliance."""

from __future__ import annotations

import jsonschema
import httpx
import pytest

from src.config import Settings
from src.slot_extractor import ExtractedSlots, SLOT_OUTPUT_SCHEMA
from src.slot_extractor import SlotExtractor


def test_extracted_slots_from_dict_full():
    data = {
        "intent": "book",
        "confidence": 0.9,
        "specialty": "nieng rang",
        "date_hint": "2026-07-01",
        "time_hint": "14:00",
        "missing_slots": [],
    }
    slots = ExtractedSlots.from_dict(data)

    assert slots.intent == "book"
    assert slots.is_actionable is True
    assert slots.needs_clarification is False


def test_extracted_slots_low_confidence_needs_clarification():
    data = {"intent": "unknown", "confidence": 0.2, "missing_slots": ["specialty", "date"]}
    slots = ExtractedSlots.from_dict(data)

    assert slots.needs_clarification is True
    assert slots.is_actionable is False


def test_slot_output_schema_is_valid_json_schema():
    jsonschema.Draft7Validator.check_schema(SLOT_OUTPUT_SCHEMA)


def test_slot_output_validates_valid_data():
    data = {
        "intent": "cancel",
        "confidence": 0.85,
        "missing_slots": ["appointment_ref"],
    }

    jsonschema.validate(data, SLOT_OUTPUT_SCHEMA)


def test_slot_output_rejects_invalid_intent():
    data = {"intent": "fly_to_moon", "confidence": 0.5, "missing_slots": []}

    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(data, SLOT_OUTPUT_SCHEMA)


def test_slot_output_rejects_confidence_out_of_range():
    data = {"intent": "book", "confidence": 1.5, "missing_slots": []}

    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(data, SLOT_OUTPUT_SCHEMA)


@pytest.mark.asyncio
async def test_slot_extractor_enables_qwen_thinking_in_payload():
    captured: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        import json

        captured.update(json.loads(request.content.decode()))
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(
                                {
                                    "intent": "lookup",
                                    "confidence": 0.9,
                                    "missing_slots": [],
                                }
                            )
                        }
                    }
                ]
            },
        )

    extractor = SlotExtractor(
        Settings(require_cuda=False, llm_base_url="http://llm/v1"),
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    slots = await extractor.extract("xem lịch", [], "2026-06-17")

    assert slots.intent == "lookup"
    assert captured["chat_template_kwargs"] == {"enable_thinking": True}
