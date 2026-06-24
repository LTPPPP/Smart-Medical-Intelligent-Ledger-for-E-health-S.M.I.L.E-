import json

import httpx
import pytest

from src.outcomes import OutcomeCode, TurnOutcome
from src.response_generator import GroundedResponseGenerator
from src.schemas import FlowName


def _response(reply: str, used_fact_keys: list[str]) -> httpx.Response:
    return httpx.Response(200, json={"output_text": json.dumps({"reply": reply, "used_fact_keys": used_fact_keys})})


@pytest.mark.asyncio
async def test_generator_instructs_concise_copy_when_structured_options_render():
    captured: dict[str, object] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["payload"] = json.loads(request.content)
        return _response("Please confirm the available slot below.", ["booking_options"])

    generator = GroundedResponseGenerator(
        llm_base_url="http://llm.test/v1", model="gpt-5-mini", api_key="key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    outcome = TurnOutcome(
        code=OutcomeCode.CONFIRMATION_REQUIRED,
        flow=FlowName.BOOKING,
        safe_facts={
            "booking_options_count": 1,
            "booking_option": {"appointment_time": "09:00"},
        },
        confirmation_required=True,
    )

    await generator.generate(user_message="Book oral checking", outcome=outcome)

    assert "Do not list every option" in str(captured["payload"])


@pytest.mark.asyncio
async def test_generator_uses_concise_ui_copy_for_appointment_cards():
    calls = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return _response("You have appointment APT-001 tomorrow.", ["appointments"])

    generator = GroundedResponseGenerator(
        llm_base_url="http://llm.test/v1", model="gpt-5-mini", api_key="key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    outcome = TurnOutcome(
        code=OutcomeCode.APPOINTMENTS_FOUND, flow=FlowName.LOOKUP,
        safe_facts={"appointments": [{"appointment_code": "APT-001"}]},
    )

    result = await generator.generate(user_message="What is coming up?", outcome=outcome)

    assert calls == 0
    assert result.reply == "Choose an appointment below to reschedule or cancel."
    assert not result.used_fallback
    assert result.validation_passed


@pytest.mark.asyncio
async def test_generator_uses_reschedule_selection_copy_without_llm_call():
    calls = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return _response("Unexpected LLM response.", [])

    generator = GroundedResponseGenerator(
        llm_base_url="http://llm.test/v1", model="gpt-5-mini", api_key="key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    outcome = TurnOutcome(
        code=OutcomeCode.CLARIFICATION_REQUIRED,
        flow=FlowName.RESCHEDULE,
        safe_facts={
            "appointments": [{"appointment_time": "10:00"}],
            "appointment_selection_action": "reschedule",
            "required_information": ["which appointment to reschedule"],
        },
    )

    result = await generator.generate(user_message="I want to change my appointment", outcome=outcome)

    assert calls == 0
    assert result.reply == "Please choose which appointment you want to reschedule below. You do not need an appointment ID."
    assert result.validation_passed


@pytest.mark.asyncio
async def test_generator_explains_ambiguous_reschedule_time_matches_without_llm_call():
    calls = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return _response("Unexpected LLM response.", [])

    generator = GroundedResponseGenerator(
        llm_base_url="http://llm.test/v1", model="gpt-5-mini", api_key="key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    outcome = TurnOutcome(
        code=OutcomeCode.CLARIFICATION_REQUIRED,
        flow=FlowName.RESCHEDULE,
        safe_facts={
            "appointments": [{"appointment_time": "10:00"}, {"appointment_time": "10:00"}],
            "appointment_selection_action": "reschedule",
            "appointment_match_hint": "10:00",
            "required_information": ["which appointment to reschedule"],
        },
    )

    result = await generator.generate(user_message="the appointment at 10am", outcome=outcome)

    assert calls == 0
    assert result.reply == "I found more than one appointment matching 10:00. Please choose which one to reschedule below."
    assert result.validation_passed


@pytest.mark.asyncio
async def test_generator_uses_concise_ui_copy_for_multiple_booking_options():
    calls = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return _response("Here are all available slots.", ["booking_options"])

    generator = GroundedResponseGenerator(
        llm_base_url="http://llm.test/v1", model="gpt-5-mini", api_key="key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    outcome = TurnOutcome(
        code=OutcomeCode.CONFIRMATION_REQUIRED,
        flow=FlowName.BOOKING,
        safe_facts={
            "booking_options": [{"appointment_time": "09:00"}, {"appointment_time": "09:30"}],
            "booking_option": {"appointment_time": "09:00"},
        },
        confirmation_required=True,
    )

    result = await generator.generate(user_message="Book oral checking", outcome=outcome)

    assert calls == 0
    assert result.reply == "Choose an available time below."
    assert not result.used_fallback
    assert result.validation_passed


@pytest.mark.asyncio
async def test_generator_explains_recommended_date_for_structured_time_options():
    calls = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return _response("Unexpected LLM response.", [])

    generator = GroundedResponseGenerator(
        llm_base_url="http://llm.test/v1", model="gpt-5-mini", api_key="key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    outcome = TurnOutcome(
        code=OutcomeCode.BOOKING_OPTIONS_FOUND,
        flow=FlowName.BOOKING,
        safe_facts={
            "booking_options": [{"appointment_date": "2026-06-26", "appointment_time": "09:00"}],
            "requested_date": "2026-06-25",
            "recommended_date": "2026-06-26",
            "availability_recommendation": True,
        },
    )

    result = await generator.generate(user_message="I choose Dr. A.", outcome=outcome)

    assert calls == 0
    assert result.reply == (
        "I do not see an open time on 2026-06-25, but I found the nearest matching openings on "
        "2026-06-26. Please choose a time below."
    )
    assert result.validation_passed


@pytest.mark.asyncio
async def test_generator_explains_pending_service_suggestion_without_llm_call():
    calls = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return _response("Unexpected LLM response.", [])

    generator = GroundedResponseGenerator(
        llm_base_url="http://llm.test/v1", model="gpt-5-mini", api_key="key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    outcome = TurnOutcome(
        code=OutcomeCode.CLARIFICATION_REQUIRED,
        flow=FlowName.BOOKING,
        safe_facts={
            "required_information": ["confirm the dental service"],
            "service_suggestion": {
                "service_hint": "oral check",
                "service_name": "routine dental check-up (oral exam)",
            },
        },
    )

    result = await generator.generate(
        user_message="i just want the basic checking for my oral healthcare",
        outcome=outcome,
    )

    assert calls == 0
    assert result.reply == (
        "It sounds like you mean a routine dental check-up (oral exam). "
        "If that is right, reply yes; otherwise tell me the dental service you prefer."
    )
    assert result.validation_passed


@pytest.mark.asyncio
async def test_generator_asks_to_confirm_an_explicitly_selected_slot():
    calls = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return _response("Unexpected LLM response.", [])

    generator = GroundedResponseGenerator(
        llm_base_url="http://llm.test/v1", model="gpt-5-mini", api_key="key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    outcome = TurnOutcome(
        code=OutcomeCode.CONFIRMATION_REQUIRED,
        flow=FlowName.RESCHEDULE,
        safe_facts={
            "booking_options": [{"id": "slot-1"}, {"id": "slot-2"}],
            "booking_option": {"id": "slot-2"},
            "booking_option_selected": True,
        },
        confirmation_required=True,
    )

    result = await generator.generate(user_message="Use the second slot", outcome=outcome)

    assert calls == 0
    assert result.reply == "Please confirm the selected slot below."


@pytest.mark.asyncio
async def test_generator_keeps_cancel_confirmation_free_of_internal_ids():
    calls = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return _response("Cancel APT-001 (ID 53775bed-5da6-4d27-a3e5-3df1d6020086)?", ["appointment_id"])

    generator = GroundedResponseGenerator(
        llm_base_url="http://llm.test/v1", model="gpt-5-mini", api_key="key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    outcome = TurnOutcome(
        code=OutcomeCode.CONFIRMATION_REQUIRED,
        flow=FlowName.CANCEL,
        safe_facts={
            "appointment_id": "53775bed-5da6-4d27-a3e5-3df1d6020086",
            "appointment_code": "APT-001",
        },
        confirmation_required=True,
    )

    result = await generator.generate(user_message="Cancel it", outcome=outcome)

    assert calls == 0
    assert result.reply == "Please confirm that you want to cancel appointment APT-001."
    assert "53775bed" not in result.reply


@pytest.mark.asyncio
async def test_generator_falls_back_without_a_third_llm_call_on_unsupported_claims():
    calls = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return _response("Appointment APT-FAKE has been booked.", [])

    generator = GroundedResponseGenerator(
        llm_base_url="http://llm.test/v1", model="gpt-5-mini", api_key="key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    outcome = TurnOutcome(code=OutcomeCode.CLARIFICATION_REQUIRED, flow=FlowName.BOOKING)

    result = await generator.generate(user_message="Book something", outcome=outcome)

    assert calls == 1
    assert result.used_fallback
    assert result.reply == "Could you share one more detail so I can check the schedule?"
    assert result.llm_call_count == 1


@pytest.mark.asyncio
async def test_generator_rejects_scope_inflation():
    calls = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return _response("I can help with insurance, billing, and treatment questions.", [])

    generator = GroundedResponseGenerator(
        llm_base_url="http://llm.test/v1", model="gpt-5-mini", api_key="key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    outcome = TurnOutcome(
        code=OutcomeCode.CONVERSATIONAL,
        flow=FlowName.CONVERSATIONAL,
        safe_facts={"supported_capabilities": ["lookup", "booking", "cancellation", "rescheduling"]},
    )

    result = await generator.generate(user_message="What can you do?", outcome=outcome)

    assert calls == 1
    assert not result.validation_passed
    assert result.used_fallback


@pytest.mark.asyncio
async def test_generator_rejects_repetitive_conversational_capability_list():
    async def handler(request: httpx.Request) -> httpx.Response:
        return _response(
            "I am here to assist you with booking, rescheduling, canceling, or looking up dental appointments.",
            [],
        )

    generator = GroundedResponseGenerator(
        llm_base_url="http://llm.test/v1", model="gpt-5-mini", api_key="key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    outcome = TurnOutcome(code=OutcomeCode.CONVERSATIONAL, flow=FlowName.CONVERSATIONAL)

    result = await generator.generate(user_message="do you love me?", outcome=outcome)

    assert result.used_fallback
    assert "sweet" not in result.reply.lower()
    assert "appointment" in result.reply.lower()


@pytest.mark.asyncio
async def test_generator_requires_sign_in_for_auth_outcome():
    calls = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return _response("Please provide the patient's name.", [])

    generator = GroundedResponseGenerator(
        llm_base_url="http://llm.test/v1", model="gpt-5-mini", api_key="key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    outcome = TurnOutcome(
        code=OutcomeCode.AUTH_REQUIRED,
        flow=FlowName.CANCEL,
        safe_facts={"authenticated": False},
    )

    result = await generator.generate(user_message="Cancel my appointment", outcome=outcome)

    assert calls == 1
    assert "sign in" in result.reply.lower()
    assert not result.validation_passed
