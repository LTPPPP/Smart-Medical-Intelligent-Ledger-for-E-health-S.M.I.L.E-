import json

import httpx

from src.llm.fake import FakeLLMClient
from src.llm.client import OpenAICompatibleLLMClient
from src.tools.schemas import TOOL_SCHEMAS, GetAvailableSlotsInput, HoldSlotInput


def test_exposes_exactly_sixteen_tool_schemas():
    assert sorted(TOOL_SCHEMAS.keys()) == [
        "add_to_waitlist",
        "cancel_appointment",
        "check_waitlist_matches",
        "classify_medical_risk",
        "confirm_booking",
        "create_handoff_ticket",
        "estimate_service_duration",
        "get_available_slots",
        "get_clinic_info",
        "get_services",
        "hold_slot",
        "release_hold",
        "reschedule_appointment",
        "search_clinic_knowledge",
        "send_email_notification",
        "summarize_for_dentist",
    ]


def test_hold_slot_schema_rejects_invalid_ttl():
    try:
        HoldSlotInput(
            slot_id="10000000-0000-0000-0000-000000000001",
            patient_session_id="session-1",
            ttl_seconds=10,
        )
    except ValueError as exc:
        assert "ttl_seconds" in str(exc)
    else:
        raise AssertionError("HoldSlotInput accepted an unsafe ttl")


def test_get_available_slots_schema_accepts_llm_datetime_date():
    payload = GetAvailableSlotsInput(date="2026-06-15T08:00:00Z")

    assert payload.date.isoformat() == "2026-06-15"


def test_fake_llm_client_returns_deterministic_tool_call():
    client = FakeLLMClient(
        tool_name="get_services",
        arguments={"clinic_id": "60000000-0000-0000-0000-000000000001"},
    )

    response = client.chat(messages=[{"role": "user", "content": "services"}], tools=[])
    tool_call = client.parse_tool_call(response)

    assert tool_call == {
        "name": "get_services",
        "arguments": {"clinic_id": "60000000-0000-0000-0000-000000000001"},
    }


def test_openai_client_parses_json_encoded_tool_arguments():
    client = OpenAICompatibleLLMClient(
        base_url="http://localhost:8000/v1",
        api_key="test",
        model="test",
    )

    tool_call = client.parse_tool_call(
        {
            "choices": [
                {
                    "message": {
                        "tool_calls": [
                            {
                                "function": {
                                    "name": "hold_slot",
                                    "arguments": '{"ttl_seconds": 300}',
                                }
                            }
                        ]
                    }
                }
            ]
        }
    )

    assert tool_call == {"name": "hold_slot", "arguments": {"ttl_seconds": 300}}


def test_openai_client_parses_qwen_xml_tool_call_content():
    client = OpenAICompatibleLLMClient(
        base_url="http://localhost:8000/v1",
        api_key="test",
        model="test",
    )

    tool_call = client.parse_tool_call(
        {
            "choices": [
                {
                    "message": {
                        "content": (
                            "<tool_call>\n"
                            '{{"name": "get_available_slots", '
                            '"arguments": {"date": "2026-06-15"}}\n'
                            "</tool_call>"
                        )
                    }
                }
            ]
        }
    )

    assert tool_call == {
        "name": "get_available_slots",
        "arguments": {"date": "2026-06-15"},
    }


def test_openai_client_sends_deterministic_generation_options():
    captured_json = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured_json.update(json.loads(request.content))
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": "ok"}}]},
        )

    client = OpenAICompatibleLLMClient(
        base_url="http://localhost:8000/v1",
        api_key="test",
        model="test",
        temperature=0.0,
        max_tokens=128,
    )
    client.client = httpx.Client(transport=httpx.MockTransport(handler))

    client.chat(messages=[{"role": "user", "content": "hi"}], tools=[])

    assert captured_json["temperature"] == 0.0
    assert captured_json["max_tokens"] == 128
