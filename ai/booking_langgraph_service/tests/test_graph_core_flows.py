import pytest

from src.graph import BookingLangGraph
from src.response_generator import GenerationResult
from src.schemas import AgentCommand, ChatRequest, FlowName
from src.tools import InMemoryDomainTools


@pytest.mark.asyncio
async def test_lookup_flow_fetches_patient_appointments_without_llm_tool_choice():
    graph = BookingLangGraph(domain_tools=InMemoryDomainTools())

    response = await graph.handle_chat(
        ChatRequest(session_id="s-lookup", message="Show my appointments"),
        trusted_patient_id="patient-1",
    )

    assert response.flow == FlowName.LOOKUP
    assert response.actions == ["get_patient_appointments"]
    assert response.safe_state["appointments"][0] == {
        "appointment_id": "appt-001",
        "appointment_code": "APT-001",
        "appointment_date": None,
        "appointment_time": None,
        "duration_minutes": None,
        "status": "scheduled",
        "service_name": None,
        "doctor_name": None,
        "clinic_name": None,
        "room_name": None,
    }
    assert response.metadata["metrics"]["llm_calls_per_turn"] == 0
    assert response.metadata["metrics"]["forbidden_tool_rate"] == 0


@pytest.mark.asyncio
async def test_cancel_flow_prepares_confirmation_before_mutation():
    tools = InMemoryDomainTools()
    graph = BookingLangGraph(domain_tools=tools)

    response = await graph.handle_chat(
        ChatRequest(session_id="s-cancel", message="Cancel appointment APT-001"),
        trusted_patient_id="patient-1",
    )

    assert response.flow == FlowName.CANCEL
    assert response.actions == ["resolve_appointment_reference", "prepare_cancel"]
    assert response.confirmation is not None
    assert tools.mutations == []
    assert response.metadata["metrics"]["mutation_without_confirmation"] == 0


@pytest.mark.asyncio
async def test_cancel_flow_commits_only_with_matching_confirmation_token():
    tools = InMemoryDomainTools()
    graph = BookingLangGraph(domain_tools=tools)
    first = await graph.handle_chat(
        ChatRequest(session_id="s-cancel-confirm", message="Cancel appointment APT-001"),
        trusted_patient_id="patient-1",
    )

    confirmed = await graph.handle_chat(
        ChatRequest(
            session_id="s-cancel-confirm",
            message="Yes, confirm cancellation.",
            confirmation_token=first.confirmation.token,
            confirmed=True,
        ),
        trusted_patient_id="patient-1",
    )

    assert confirmed.actions == ["commit_cancel"]
    assert tools.mutations == ["commit_cancel:appt-001"]
    assert confirmed.confirmation is None


@pytest.mark.asyncio
async def test_booking_flow_finds_options_before_booking_confirmation():
    tools = InMemoryDomainTools()
    graph = BookingLangGraph(domain_tools=tools)

    response = await graph.handle_chat(
        ChatRequest(
            session_id="s-book",
            message="Book a dental cleaning at the downtown clinic tomorrow morning",
        ),
        trusted_patient_id="patient-1",
    )

    assert response.flow == FlowName.BOOKING
    assert response.actions == ["search_booking_catalog", "find_booking_options", "prepare_booking"]
    assert response.confirmation is not None
    assert response.safe_state["booking_options"] == [response.safe_state["booking_option"]]
    assert tools.mutations == []


@pytest.mark.asyncio
async def test_booking_flow_prepares_the_exact_ui_selected_option():
    class MultipleOptionTools(InMemoryDomainTools):
        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            return [
                {"id": "option-doctor-a-1000", "summary": "10:00 with Dr. A"},
                {"id": "option-doctor-b-1000", "summary": "10:00 with Dr. B"},
            ]

    graph = BookingLangGraph(domain_tools=MultipleOptionTools())

    response = await graph.handle_chat(
        ChatRequest(
            session_id="s-book-selected-option",
            message="Book an appointment on 2027-02-03 at 10:00",
            selected_booking_option_id="option-doctor-b-1000",
        ),
        trusted_patient_id="patient-1",
    )

    assert response.safe_state["booking_option"]["id"] == "option-doctor-b-1000"
    assert response.safe_state["booking_option_selected"] is True
    assert response.confirmation is not None
    assert "Dr. B" in response.confirmation.summary


@pytest.mark.asyncio
async def test_booking_flow_without_constraints_clarifies_when_no_options():
    class NoOptionTools(InMemoryDomainTools):
        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            return []

    graph = BookingLangGraph(domain_tools=NoOptionTools())

    response = await graph.handle_chat(
        ChatRequest(session_id="s-book-clarify", message="Book a dental appointment"),
        trusted_patient_id="patient-1",
    )

    assert response.flow == FlowName.BOOKING
    assert response.actions == ["search_booking_catalog", "find_booking_options"]
    assert response.confirmation is None
    assert response.reply == "I need one more detail: a preferred date, clinic, doctor, or dental service."
    assert response.metadata["metrics"]["clarification_count"] == 1
    assert response.metadata["metrics"]["backend_conflict_rate"] == 0
    assert response.metadata["policy_intent"] == "booking_intent"


@pytest.mark.asyncio
async def test_booking_commit_backend_conflict_returns_safe_response():
    class ConflictTools(InMemoryDomainTools):
        async def commit_booking(
            self, patient_id: str, booking_option_id: str, idempotency_key: str, auth_user_id: str | None = None
        ):
            raise RuntimeError("409: backend conflict")

    graph = BookingLangGraph(domain_tools=ConflictTools())
    first = await graph.handle_chat(
        ChatRequest(
            session_id="s-book-conflict",
            message="Book a dental cleaning at the downtown clinic tomorrow morning",
        ),
        trusted_patient_id="patient-1",
    )

    confirmed = await graph.handle_chat(
        ChatRequest(
            session_id="s-book-conflict",
            message="Confirm booking",
            confirmation_token=first.confirmation.token,
            confirmed=True,
        ),
        trusted_patient_id="patient-1",
    )

    assert confirmed.reply == "I could not find a matching open slot for those details. Try another date or time."
    assert confirmed.actions == ["commit_booking"]
    assert confirmed.metadata["metrics"]["backend_conflict_rate"] == 1


@pytest.mark.asyncio
async def test_reschedule_flow_requires_confirmation_before_commit():
    tools = InMemoryDomainTools()
    graph = BookingLangGraph(domain_tools=tools)

    response = await graph.handle_chat(
        ChatRequest(
            session_id="s-reschedule",
            message="Move appointment APT-001 to Friday afternoon",
        ),
        trusted_patient_id="patient-1",
    )

    assert response.flow == FlowName.RESCHEDULE
    assert response.actions == [
        "resolve_appointment_reference",
        "find_booking_options",
        "prepare_reschedule",
    ]
    assert response.confirmation is not None
    assert response.safe_state["appointment_code"] == "APT-001"
    assert response.safe_state["booking_options"] == [response.safe_state["booking_option"]]
    assert tools.mutations == []


def test_english_command_extracts_iso_date_hint_for_booking():
    command = AgentCommand.from_english_message("Book an appointment on 2027-02-03")

    assert command.intent == FlowName.BOOKING
    assert [(slot.name, slot.value) for slot in command.slot_updates] == [("date_hint", "2027-02-03")]


def test_english_command_extracts_time_hint_for_slot_selection():
    command = AgentCommand.from_english_message("Book an appointment on 2027-02-03 at 10:30")

    assert command.intent == FlowName.BOOKING
    assert ("date_hint", "2027-02-03") in [(slot.name, slot.value) for slot in command.slot_updates]
    assert ("time_hint", "10:30") in [(slot.name, slot.value) for slot in command.slot_updates]


def test_booking_search_constraints_ignore_unresolved_and_vague_hints():
    assert not BookingLangGraph._has_booking_search_constraints(
        {"service_hint": "dental appointment", "time_hint": "earliest available time"}
    )
    assert not BookingLangGraph._has_booking_search_constraints({"date_hint": "as soon as possible"})
    assert BookingLangGraph._has_booking_search_constraints({"date_hint": "2027-02-06"})
    assert BookingLangGraph._has_booking_search_constraints({"clinic_id": "clinic-1"})


class StubExtractor:
    last_error = None

    def __init__(self, command: AgentCommand):
        self.command = command

    async def extract(self, message: str) -> AgentCommand:
        return self.command


class StubGenerator:
    def __init__(self):
        self.calls = 0

    async def generate(self, *, user_message: str, outcome):
        self.calls += 1
        return GenerationResult(
            reply="Here are your appointment details.",
            used_fallback=False,
            validation_passed=True,
            retry_count=0,
            latency_ms=1.0,
        )


@pytest.mark.asyncio
async def test_conversational_direct_response_uses_one_llm_call():
    extractor = StubExtractor(
        AgentCommand(
            intent=FlowName.CONVERSATIONAL,
            dialogue_act="greet",
            direct_response="Hello. How can I help with your appointment?",
            confidence=0.95,
        )
    )
    generator = StubGenerator()
    graph = BookingLangGraph(domain_tools=InMemoryDomainTools(), extractor=extractor, response_generator=generator)

    response = await graph.handle_chat(ChatRequest(session_id="adaptive-one", message="Hello"), "patient-1")

    assert response.reply == "Hello. How can I help with your appointment?"
    assert response.metadata["dialogue_act"] == "greet"
    assert response.metadata["policy_intent"] == "social"
    assert response.metadata["metrics"]["llm_calls_per_turn"] == 1
    assert response.metadata["metrics"]["response_mode"] == "parser_direct"
    assert generator.calls == 0


@pytest.mark.asyncio
async def test_abuse_turn_uses_valid_model_boundary_direct_response():
    extractor = StubExtractor(
        AgentCommand(
            intent=FlowName.CONVERSATIONAL,
            dialogue_act="abuse",
            direct_response="I cannot help with insults, but I can continue with your appointment when you are ready.",
            confidence=0.95,
        )
    )
    graph = BookingLangGraph(domain_tools=InMemoryDomainTools(), extractor=extractor)

    response = await graph.handle_chat(ChatRequest(session_id="abuse-boundary", message="fuck you"), "patient-1")

    assert response.reply == "I cannot help with insults, but I can continue with your appointment when you are ready."
    assert response.metadata["policy_intent"] == "abuse"
    assert response.metadata["metrics"]["response_mode"] == "parser_direct"


@pytest.mark.asyncio
async def test_conversational_turn_without_direct_response_uses_response_generator():
    extractor = StubExtractor(
        AgentCommand(
            intent=FlowName.CONVERSATIONAL,
            dialogue_act="other",
            confidence=0.95,
        )
    )
    generator = StubGenerator()
    graph = BookingLangGraph(domain_tools=InMemoryDomainTools(), extractor=extractor, response_generator=generator)

    response = await graph.handle_chat(ChatRequest(session_id="adaptive-social", message="i love you"), "patient-1")

    assert response.reply == "Here are your appointment details."
    assert response.metadata["policy_intent"] == "social"
    assert response.metadata["metrics"]["response_mode"] == "llm_generated"
    assert generator.calls == 1


@pytest.mark.asyncio
async def test_complex_tool_result_uses_second_llm_call():
    extractor = StubExtractor(AgentCommand(intent=FlowName.LOOKUP, confidence=0.95))
    generator = StubGenerator()
    graph = BookingLangGraph(domain_tools=InMemoryDomainTools(), extractor=extractor, response_generator=generator)

    response = await graph.handle_chat(ChatRequest(session_id="adaptive-two", message="What is coming up?"), "patient-1")

    assert response.metadata["outcome_code"] == "appointments_found"
    assert response.metadata["metrics"]["llm_calls_per_turn"] == 2
    assert response.metadata["metrics"]["response_mode"] == "llm_generated"
    assert generator.calls == 1


@pytest.mark.asyncio
async def test_compound_request_is_clarified_without_executing_tools():
    extractor = StubExtractor(
        AgentCommand(
            intent=FlowName.LOOKUP,
            secondary_intents=[FlowName.RESCHEDULE],
            confidence=0.92,
        )
    )
    graph = BookingLangGraph(domain_tools=InMemoryDomainTools(), extractor=extractor)

    response = await graph.handle_chat(
        ChatRequest(session_id="compound", message="Show my appointment and move it to Friday"),
        "patient-1",
    )

    assert response.actions == []
    assert response.metadata["outcome_code"] == "clarification_required"
    assert "one appointment request at a time" in response.reply


@pytest.mark.asyncio
async def test_unknown_without_generator_uses_safe_english_fallback():
    graph = BookingLangGraph(domain_tools=InMemoryDomainTools())

    response = await graph.handle_chat(
        ChatRequest(session_id="s-fallback", message="Could you help me?"),
        trusted_patient_id="patient-1",
    )

    assert response.flow == FlowName.UNKNOWN
    assert response.reply == "Could you share one more detail so I can check the schedule?"
    assert response.metadata["outcome_code"] == "clarification_required"
