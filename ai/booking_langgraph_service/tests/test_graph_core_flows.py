import pytest

from src.graph import BookingLangGraph
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
        "status": "scheduled",
        "clinic_name": None,
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
    assert tools.mutations == []


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
    assert response.reply == "Please share a preferred date, clinic, doctor, or service so I can find a suitable appointment."
    assert response.metadata["metrics"]["clarification_count"] == 1
    assert response.metadata["metrics"]["backend_conflict_rate"] == 0


@pytest.mark.asyncio
async def test_booking_commit_backend_conflict_returns_safe_response():
    class ConflictTools(InMemoryDomainTools):
        async def commit_booking(self, patient_id: str, booking_option_id: str, idempotency_key: str):
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

    assert confirmed.reply == "I could not complete that change because the backend reported a conflict. Please choose another option."
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
    assert tools.mutations == []


def test_english_command_extracts_iso_date_hint_for_booking():
    command = AgentCommand.from_english_message("Book an appointment on 2027-02-03")

    assert command.intent == FlowName.BOOKING
    assert [(slot.name, slot.value) for slot in command.slot_updates] == [("date_hint", "2027-02-03")]


def test_booking_search_constraints_ignore_unresolved_and_vague_hints():
    assert not BookingLangGraph._has_booking_search_constraints(
        {"service_hint": "dental appointment", "time_hint": "earliest available time"}
    )
    assert not BookingLangGraph._has_booking_search_constraints({"date_hint": "as soon as possible"})
    assert BookingLangGraph._has_booking_search_constraints({"date_hint": "2027-02-06"})
    assert BookingLangGraph._has_booking_search_constraints({"clinic_id": "clinic-1"})
