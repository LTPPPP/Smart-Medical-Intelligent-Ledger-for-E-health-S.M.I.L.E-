import pytest

from datetime import date, timedelta

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
async def test_booking_flow_finds_doctors_before_time_selection():
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
    assert response.actions == ["search_booking_catalog", "get_patient_appointments", "find_booking_options"]
    assert response.confirmation is None
    assert response.safe_state["doctor_options"]
    assert "booking_options" not in response.safe_state
    assert tools.mutations == []


@pytest.mark.asyncio
async def test_booking_flow_collects_service_then_date_before_availability():
    class TrackingTools(InMemoryDomainTools):
        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            raise AssertionError("availability must not run before service and date are known")

    graph = BookingLangGraph(domain_tools=TrackingTools())

    missing_service = await graph.handle_chat(
        ChatRequest(session_id="s-book-progressive", message="Book an appointment"),
        trusted_patient_id="patient-1",
    )
    assert missing_service.actions == []
    assert missing_service.safe_state["required_information"] == ["the dental service you need"]

    missing_date = await graph.handle_chat(
        ChatRequest(session_id="s-book-progressive", message="I want an oral check"),
        trusted_patient_id="patient-1",
    )
    assert missing_date.actions == []
    assert missing_date.safe_state["required_information"] == ["your preferred appointment date"]


@pytest.mark.asyncio
async def test_booking_flow_remembers_suggested_service_after_patient_confirms_it():
    class TrackingTools(InMemoryDomainTools):
        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            raise AssertionError("availability must wait for the preferred appointment date")

    class SequencedExtractor:
        last_error = None

        def __init__(self):
            self.commands = [
                AgentCommand(
                    intent=FlowName.BOOKING,
                    dialogue_act="inform",
                    slot_updates=[{"name": "chief_complaint", "value": "basic checking for my oral healthcare"}],
                    confidence=0.88,
                ),
                AgentCommand(
                    intent=FlowName.CONVERSATIONAL,
                    dialogue_act="confirm",
                    direct_response="Thank you for your confirmation.",
                    confidence=0.94,
                ),
            ]

        async def extract(self, message: str) -> AgentCommand:
            return self.commands.pop(0)

    graph = BookingLangGraph(domain_tools=TrackingTools(), extractor=SequencedExtractor())

    suggested = await graph.handle_chat(
        ChatRequest(session_id="s-book-suggested-service", message="i just want the basic checking for my oral healthcare"),
        trusted_patient_id="patient-1",
    )

    assert suggested.flow == FlowName.BOOKING
    assert suggested.safe_state["service_suggestion"] == {
        "service_hint": "oral check",
        "service_name": "routine dental check-up (oral exam)",
    }
    assert suggested.safe_state["required_information"] == ["confirm the dental service"]

    confirmed = await graph.handle_chat(
        ChatRequest(session_id="s-book-suggested-service", message="yes you are right"),
        trusted_patient_id="patient-1",
    )

    assert confirmed.flow == FlowName.BOOKING
    assert confirmed.safe_state["required_information"] == ["your preferred appointment date"]
    assert confirmed.reply == "I need one more detail: your preferred appointment date."
    assert confirmed.metadata["metrics"]["response_mode"] == "deterministic"


@pytest.mark.asyncio
async def test_booking_flow_keeps_service_context_when_user_asks_vague_follow_up():
    class TrackingTools(InMemoryDomainTools):
        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            raise AssertionError("availability must wait for the preferred appointment date")

    graph = BookingLangGraph(domain_tools=TrackingTools())

    missing_service = await graph.handle_chat(
        ChatRequest(session_id="s-book-vague-follow-up", message="book an appointment"),
        trusted_patient_id="patient-1",
    )
    assert missing_service.safe_state["required_information"] == ["the dental service you need"]

    missing_date = await graph.handle_chat(
        ChatRequest(session_id="s-book-vague-follow-up", message="oral exam"),
        trusted_patient_id="patient-1",
    )
    assert missing_date.safe_state["required_information"] == ["your preferred appointment date"]

    still_missing_date = await graph.handle_chat(
        ChatRequest(session_id="s-book-vague-follow-up", message="what detail?"),
        trusted_patient_id="patient-1",
    )

    assert still_missing_date.flow == FlowName.BOOKING
    assert still_missing_date.safe_state["required_information"] == ["your preferred appointment date"]
    assert still_missing_date.reply == "I need one more detail: your preferred appointment date."


@pytest.mark.asyncio
async def test_booking_flow_returns_doctors_before_times_and_never_auto_selects_a_slot():
    class MultipleDoctorTools(InMemoryDomainTools):
        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            options = [
                {
                    "id": "slot-a-0900",
                    "summary": "2026-06-25 at 09:00 with Dr. A",
                    "appointment_date": "2026-06-25",
                    "appointment_time": "09:00",
                    "doctor_id": "doctor-a",
                    "doctor_name": "Dr. A",
                    "clinic_name": "SMILE clinic",
                },
                {
                    "id": "slot-b-1000",
                    "summary": "2026-06-25 at 10:00 with Dr. B",
                    "appointment_date": "2026-06-25",
                    "appointment_time": "10:00",
                    "doctor_id": "doctor-b",
                    "doctor_name": "Dr. B",
                    "clinic_name": "SMILE clinic",
                },
            ]
            doctor_id = slots.get("doctor_id")
            return [option for option in options if not doctor_id or option["doctor_id"] == doctor_id]

    graph = BookingLangGraph(domain_tools=MultipleDoctorTools())

    doctors = await graph.handle_chat(
        ChatRequest(session_id="s-book-doctor-first", message="Book an oral check on 2026-06-25"),
        trusted_patient_id="patient-1",
    )

    assert doctors.confirmation is None
    assert doctors.safe_state["doctor_options"] == [
        {"doctor_id": "doctor-a", "doctor_name": "Dr. A", "clinic_name": "SMILE clinic"},
        {"doctor_id": "doctor-b", "doctor_name": "Dr. B", "clinic_name": "SMILE clinic"},
    ]
    assert "booking_options" not in doctors.safe_state
    assert "prepare_booking" not in doctors.actions

    times = await graph.handle_chat(
        ChatRequest(
            session_id="s-book-doctor-first",
            message="I choose Dr. B.",
            selected_doctor_id="doctor-b",
        ),
        trusted_patient_id="patient-1",
    )

    assert times.confirmation is None
    assert [option["id"] for option in times.safe_state["booking_options"]] == ["slot-b-1000"]
    assert "booking_option" not in times.safe_state
    assert "prepare_booking" not in times.actions

    selected_time = await graph.handle_chat(
        ChatRequest(
            session_id="s-book-doctor-first",
            message="",
            selected_booking_option_id="slot-b-1000",
        ),
        trusted_patient_id="patient-1",
    )

    assert selected_time.confirmation is not None
    assert selected_time.safe_state["booking_option"]["id"] == "slot-b-1000"
    assert selected_time.safe_state["booking_option_selected"] is True
    assert "prepare_booking" in selected_time.actions


@pytest.mark.asyncio
async def test_booking_flow_recommends_nearest_available_date_when_requested_date_has_no_slots():
    # Dates are relative to today so the test stays valid as the calendar advances.
    requested_date = (date.today() + timedelta(days=5)).isoformat()
    recommended_date = (date.today() + timedelta(days=6)).isoformat()
    search_date_to = (date.today() + timedelta(days=19)).isoformat()
    other_date = (date.today() + timedelta(days=7)).isoformat()

    class NearestDateTools(InMemoryDomainTools):
        def __init__(self):
            super().__init__()
            self.availability_calls: list[dict[str, object]] = []

        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            self.availability_calls.append(dict(slots))
            if slots.get("date_hint") == requested_date:
                return []
            return [
                {
                    "id": "slot-a-0900",
                    "summary": f"{recommended_date} at 09:00 with Dr. A",
                    "appointment_date": recommended_date,
                    "appointment_time": "09:00",
                    "doctor_id": "doctor-a",
                    "doctor_name": "Dr. A",
                    "clinic_name": "SMILE clinic",
                },
                {
                    "id": "slot-b-1000",
                    "summary": f"{other_date} at 10:00 with Dr. B",
                    "appointment_date": other_date,
                    "appointment_time": "10:00",
                    "doctor_id": "doctor-b",
                    "doctor_name": "Dr. B",
                    "clinic_name": "SMILE clinic",
                },
            ]

    tools = NearestDateTools()
    graph = BookingLangGraph(domain_tools=tools)

    response = await graph.handle_chat(
        ChatRequest(session_id="s-book-nearest-date", message=f"Book an oral check on {requested_date}"),
        trusted_patient_id="patient-1",
    )

    assert response.confirmation is None
    assert len(tools.availability_calls) == 2
    assert tools.availability_calls[1]["date_hint"] == recommended_date
    assert tools.availability_calls[1]["date_to"] == search_date_to
    assert response.safe_state["requested_date"] == requested_date
    assert response.safe_state["recommended_date"] == recommended_date
    assert response.safe_state["availability_recommendation"] is True
    assert response.safe_state["doctor_options"] == [
        {"doctor_id": "doctor-a", "doctor_name": "Dr. A", "clinic_name": "SMILE clinic"}
    ]
    assert "booking_options" not in response.safe_state


@pytest.mark.asyncio
async def test_booking_flow_recommends_next_date_for_selected_doctor_when_requested_day_is_full():
    class SelectedDoctorNearestDateTools(InMemoryDomainTools):
        def __init__(self):
            super().__init__()
            self.availability_calls: list[dict[str, object]] = []

        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            self.availability_calls.append(dict(slots))
            if slots.get("date_hint") == "2026-06-25":
                return []
            assert slots.get("doctor_id") == "doctor-a"
            return [
                {
                    "id": "slot-a-1100",
                    "summary": "2026-06-26 at 11:00 with Dr. A",
                    "appointment_date": "2026-06-26",
                    "appointment_time": "11:00",
                    "doctor_id": "doctor-a",
                    "doctor_name": "Dr. A",
                    "clinic_name": "SMILE clinic",
                }
            ]

    tools = SelectedDoctorNearestDateTools()
    graph = BookingLangGraph(domain_tools=tools)

    response = await graph.handle_chat(
        ChatRequest(
            session_id="s-book-nearest-doctor-date",
            message="Book an oral check on 2026-06-25",
            selected_doctor_id="doctor-a",
        ),
        trusted_patient_id="patient-1",
    )

    assert len(tools.availability_calls) == 2
    assert response.safe_state["recommended_date"] == "2026-06-26"
    assert response.safe_state["selected_doctor_id"] == "doctor-a"
    assert [option["id"] for option in response.safe_state["booking_options"]] == ["slot-a-1100"]


@pytest.mark.asyncio
async def test_booking_flow_recommends_previous_doctor_without_filtering_other_doctors():
    class PreviousDoctorTools(InMemoryDomainTools):
        async def get_patient_appointments(self, patient_id: str):
            return [
                {
                    "id": "appt-prev",
                    "code": "APT-PREV",
                    "appointment_date": "2026-06-20",
                    "appointment_time": "09:00",
                    "doctor_id": "doctor-a",
                    "doctor_name": "Dr. Nguyen Van A",
                }
            ]

        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            assert slots["preferred_doctor_id"] == "doctor-a"
            assert slots["preferred_doctor_name"] == "Dr. Nguyen Van A"
            return [
                {"id": "option-doctor-a-0900", "summary": "09:00 with Dr. Nguyen Van A", "doctor_id": "doctor-a"},
                {"id": "option-doctor-b-0930", "summary": "09:30 with Dr. Tran Thi B", "doctor_id": "doctor-b"},
            ]

    graph = BookingLangGraph(domain_tools=PreviousDoctorTools())

    response = await graph.handle_chat(
        ChatRequest(
            session_id="s-book-recommend-doctor",
            message="Book an oral check for tomorrow",
        ),
        trusted_patient_id="patient-1",
    )

    assert response.actions == ["search_booking_catalog", "get_patient_appointments", "find_booking_options"]
    assert response.safe_state["recommended_doctor"] == {
        "doctor_id": "doctor-a",
        "doctor_name": "Dr. Nguyen Van A",
    }
    assert [doctor["doctor_id"] for doctor in response.safe_state["doctor_options"]] == [
        "doctor-a",
        "doctor-b",
    ]


@pytest.mark.asyncio
async def test_booking_flow_prepares_the_exact_ui_selected_option():
    class MultipleOptionTools(InMemoryDomainTools):
        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            return [
                {"id": "option-doctor-a-1000", "summary": "10:00 with Dr. A", "doctor_id": "doctor-a"},
                {"id": "option-doctor-b-1000", "summary": "10:00 with Dr. B", "doctor_id": "doctor-b"},
            ]

    graph = BookingLangGraph(domain_tools=MultipleOptionTools())

    response = await graph.handle_chat(
        ChatRequest(
            session_id="s-book-selected-option",
            message="Book an oral check on 2027-02-03 at 10:00",
            selected_doctor_id="doctor-b",
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
    assert response.actions == []
    assert response.confirmation is None
    assert response.reply == "I need one more detail: the dental service you need."
    assert response.metadata["metrics"]["clarification_count"] == 1
    assert response.metadata["metrics"]["backend_conflict_rate"] == 0
    assert response.metadata["policy_intent"] == "booking_intent"


@pytest.mark.asyncio
async def test_booking_flow_with_date_but_missing_service_clarifies_instead_of_conflict():
    class NoOptionTools(InMemoryDomainTools):
        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            return []

    extractor = StubExtractor(
        AgentCommand(
            intent=FlowName.BOOKING,
            slot_updates=[{"name": "date_hint", "value": "next 10 days"}],
            confidence=0.9,
        )
    )
    graph = BookingLangGraph(domain_tools=NoOptionTools(), extractor=extractor)

    response = await graph.handle_chat(
        ChatRequest(session_id="s-book-date-needs-service", message="Any free slots for next 10 days?"),
        trusted_patient_id="patient-1",
    )

    assert response.metadata["outcome_code"] == "clarification_required"
    assert response.metadata["metrics"]["clarification_count"] == 1
    assert response.metadata["metrics"]["backend_conflict_rate"] == 0


@pytest.mark.asyncio
async def test_booking_commit_backend_conflict_returns_safe_response():
    class ConflictTools(InMemoryDomainTools):
        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            return [{
                "id": "slot-a-0900",
                "summary": "tomorrow at 09:00 with Dr. A",
                "doctor_id": "doctor-a",
            }]

        async def commit_booking(
            self, patient_id: str, booking_option_id: str, idempotency_key: str, auth_user_id: str | None = None
        ):
            raise RuntimeError("409: backend conflict")

    graph = BookingLangGraph(domain_tools=ConflictTools())
    first = await graph.handle_chat(
        ChatRequest(
            session_id="s-book-conflict",
            message="Book a dental cleaning at the downtown clinic tomorrow morning",
            selected_doctor_id="doctor-a",
            selected_booking_option_id="slot-a-0900",
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
    class RescheduleTools(InMemoryDomainTools):
        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            return [{
                "id": "reschedule-slot-a",
                "summary": "2027-02-06 at 14:00 with Dr. A",
                "doctor_id": "doctor-a",
            }]

    tools = RescheduleTools()
    graph = BookingLangGraph(domain_tools=tools)

    response = await graph.handle_chat(
        ChatRequest(
            session_id="s-reschedule",
            message="Move appointment APT-001 to 2027-02-06 at 14:00",
            selected_doctor_id="doctor-a",
            selected_booking_option_id="reschedule-slot-a",
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


@pytest.mark.asyncio
async def test_reschedule_selected_appointment_asks_for_new_date_without_requesting_code():
    class RescheduleTools(InMemoryDomainTools):
        resolved_for_user = None

        async def resolve_appointment_reference(
            self,
            patient_id: str,
            reference: str,
            auth_user_id: str | None = None,
        ):
            self.resolved_for_user = auth_user_id
            return {
                "id": "appt-001",
                "code": "APT-001",
                "service_id": "service-oral",
                "clinic_id": "clinic-1",
                "doctor_id": "doctor-a",
                "doctor_name": "Dr. A",
            }

        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            raise AssertionError("availability must wait for the preferred new date")

    graph = BookingLangGraph(domain_tools=RescheduleTools())

    response = await graph.handle_chat(
        ChatRequest(
            session_id="s-reschedule-date-first",
            message="Reschedule my selected appointment.",
            action="reschedule_appointment",
            appointment_ref="appt-001",
        ),
        trusted_patient_id="patient-1",
        trusted_user_id="user-1",
    )

    assert response.confirmation is None
    assert response.safe_state["required_information"] == ["your preferred new date"]
    assert "appointment code" not in response.reply.lower()
    assert response.actions == ["resolve_appointment_reference"]
    assert graph.domain_tools.resolved_for_user == "user-1"


@pytest.mark.asyncio
async def test_reschedule_without_reference_lists_appointments_for_selection_not_ids():
    class RescheduleSelectionTools(InMemoryDomainTools):
        async def get_patient_appointments(self, patient_id: str, auth_user_id: str | None = None):
            return [
                {
                    "id": "appt-1000",
                    "code": "APT-1000",
                    "status": "scheduled",
                    "appointment_date": "2026-06-25",
                    "appointment_time": "10:00",
                    "service_name": "Oral checking",
                    "doctor_name": "Dr. Nguyen Van A",
                }
            ]

        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            raise AssertionError("availability must wait until an existing appointment is selected")

    graph = BookingLangGraph(domain_tools=RescheduleSelectionTools())

    response = await graph.handle_chat(
        ChatRequest(session_id="s-reschedule-pick-appointment", message="I want to change my appointment"),
        trusted_patient_id="patient-1",
    )

    assert response.flow == FlowName.RESCHEDULE
    assert response.actions == ["get_patient_appointments"]
    assert response.safe_state["appointment_selection_action"] == "reschedule"
    assert response.safe_state["required_information"] == ["which appointment to reschedule"]
    assert response.safe_state["appointments"][0]["appointment_time"] == "10:00"
    assert "appointment code" not in response.reply.lower()
    assert response.confirmation is None


@pytest.mark.asyncio
async def test_reschedule_follow_up_selects_existing_appointment_by_time_then_asks_new_date():
    class RescheduleTimeSelectionTools(InMemoryDomainTools):
        async def get_patient_appointments(self, patient_id: str, auth_user_id: str | None = None):
            return [
                {
                    "id": "appt-1400",
                    "code": "APT-1400",
                    "status": "scheduled",
                    "appointment_date": "2026-06-24",
                    "appointment_time": "14:00",
                    "service_id": "service-oral",
                    "clinic_id": "clinic-1",
                    "doctor_id": "doctor-a",
                    "doctor_name": "Dr. Nguyen Van A",
                },
                {
                    "id": "appt-1000",
                    "code": "APT-1000",
                    "status": "scheduled",
                    "appointment_date": "2026-06-25",
                    "appointment_time": "10:00",
                    "service_id": "service-oral",
                    "clinic_id": "clinic-1",
                    "doctor_id": "doctor-a",
                    "doctor_name": "Dr. Nguyen Van A",
                },
            ]

        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            raise AssertionError("availability must wait for the preferred new date")

    graph = BookingLangGraph(domain_tools=RescheduleTimeSelectionTools())
    await graph.handle_chat(
        ChatRequest(session_id="s-reschedule-by-time", message="I want to change my appointment"),
        trusted_patient_id="patient-1",
    )

    response = await graph.handle_chat(
        ChatRequest(session_id="s-reschedule-by-time", message="the appointment at 10am"),
        trusted_patient_id="patient-1",
    )

    assert response.flow == FlowName.RESCHEDULE
    assert response.actions == ["get_patient_appointments"]
    assert response.safe_state["required_information"] == ["your preferred new date"]
    assert response.safe_state["current_appointment"]["id"] == "appt-1000"
    assert response.safe_state["current_appointment"]["appointment_time"] == "10:00"
    assert "appointment code" not in response.reply.lower()


@pytest.mark.asyncio
async def test_reschedule_time_reference_narrows_ambiguous_matches_for_selection():
    class RescheduleAmbiguousTimeTools(InMemoryDomainTools):
        async def get_patient_appointments(self, patient_id: str, auth_user_id: str | None = None):
            return [
                {
                    "id": "appt-1000-a",
                    "code": "APT-1000-A",
                    "status": "scheduled",
                    "appointment_date": "2026-06-25",
                    "appointment_time": "10:00",
                    "service_name": "Oral checking",
                },
                {
                    "id": "appt-1000-b",
                    "code": "APT-1000-B",
                    "status": "scheduled",
                    "appointment_date": "2026-06-27",
                    "appointment_time": "10:00",
                    "service_name": "Oral checking",
                },
                {
                    "id": "appt-1400",
                    "code": "APT-1400",
                    "status": "scheduled",
                    "appointment_date": "2026-06-27",
                    "appointment_time": "14:00",
                    "service_name": "Oral checking",
                },
            ]

    graph = BookingLangGraph(domain_tools=RescheduleAmbiguousTimeTools())
    await graph.handle_chat(
        ChatRequest(session_id="s-reschedule-ambiguous-time", message="I want to change my appointment"),
        trusted_patient_id="patient-1",
    )

    response = await graph.handle_chat(
        ChatRequest(session_id="s-reschedule-ambiguous-time", message="the appointment at 10am"),
        trusted_patient_id="patient-1",
    )

    assert response.flow == FlowName.RESCHEDULE
    assert response.safe_state["appointment_selection_action"] == "reschedule"
    assert response.safe_state["appointment_match_hint"] == "10:00"
    assert [item["appointment_id"] for item in response.safe_state["appointments"]] == [
        "appt-1000-a",
        "appt-1000-b",
    ]
    assert "appt-1400" not in str(response.safe_state["appointments"])


@pytest.mark.asyncio
async def test_reschedule_flow_recommends_nearest_available_date_when_requested_date_has_no_slots():
    # Dates are relative to today so the test stays valid as the calendar advances.
    requested_date = (date.today() + timedelta(days=5)).isoformat()
    recommended_date = (date.today() + timedelta(days=6)).isoformat()
    search_date_to = (date.today() + timedelta(days=19)).isoformat()

    class RescheduleNearestDateTools(InMemoryDomainTools):
        def __init__(self):
            super().__init__()
            self.availability_calls: list[dict[str, object]] = []

        async def resolve_appointment_reference(
            self,
            patient_id: str,
            reference: str,
            auth_user_id: str | None = None,
        ):
            return {
                "id": "appt-001",
                "code": "APT-001",
                "service_id": "service-oral",
                "clinic_id": "clinic-1",
                "doctor_id": "doctor-a",
                "doctor_name": "Dr. A",
            }

        async def find_booking_options(self, patient_id: str, slots: dict[str, object]):
            self.availability_calls.append(dict(slots))
            if slots.get("date_hint") == requested_date:
                return []
            return [
                {
                    "id": "reschedule-slot-a-1400",
                    "summary": f"{recommended_date} at 14:00 with Dr. A",
                    "appointment_date": recommended_date,
                    "appointment_time": "14:00",
                    "doctor_id": "doctor-a",
                    "doctor_name": "Dr. A",
                    "clinic_name": "SMILE clinic",
                }
            ]

    tools = RescheduleNearestDateTools()
    graph = BookingLangGraph(domain_tools=tools)

    response = await graph.handle_chat(
        ChatRequest(
            session_id="s-reschedule-nearest-date",
            message=f"Move appointment APT-001 to {requested_date}",
            selected_doctor_id="doctor-a",
        ),
        trusted_patient_id="patient-1",
    )

    assert response.flow == FlowName.RESCHEDULE
    assert len(tools.availability_calls) == 2
    assert tools.availability_calls[1]["date_hint"] == recommended_date
    assert tools.availability_calls[1]["date_to"] == search_date_to
    assert response.safe_state["requested_date"] == requested_date
    assert response.safe_state["recommended_date"] == recommended_date
    assert [option["id"] for option in response.safe_state["booking_options"]] == ["reschedule-slot-a-1400"]


def test_english_command_extracts_iso_date_hint_for_booking():
    command = AgentCommand.from_english_message("Book an appointment on 2027-02-03")

    assert command.intent == FlowName.BOOKING
    assert [(slot.name, slot.value) for slot in command.slot_updates] == [("date_hint", "2027-02-03")]


def test_english_command_extracts_time_hint_for_slot_selection():
    command = AgentCommand.from_english_message("Book an appointment on 2027-02-03 at 10:30")

    assert command.intent == FlowName.BOOKING
    assert ("date_hint", "2027-02-03") in [(slot.name, slot.value) for slot in command.slot_updates]
    assert ("time_hint", "10:30") in [(slot.name, slot.value) for slot in command.slot_updates]


def test_english_command_extracts_ampm_time_hint_for_appointment_reference():
    command = AgentCommand.from_english_message("the appointment at 10am")

    assert command.intent == FlowName.UNKNOWN
    assert [(slot.name, slot.value) for slot in command.slot_updates] == [("time_hint", "10:00")]


def test_booking_search_constraints_ignore_unresolved_and_vague_hints():
    assert not BookingLangGraph._has_booking_search_constraints(
        {"service_hint": "dental appointment", "time_hint": "earliest available time"}
    )
    assert not BookingLangGraph._has_booking_search_constraints({"date_hint": "as soon as possible"})
    assert BookingLangGraph._has_booking_search_constraints({"date_hint": "2027-02-06"})
    assert BookingLangGraph._has_booking_search_constraints({"clinic_id": "clinic-1"})


def test_booking_complaint_does_not_replace_explicit_service_selection():
    assert not BookingLangGraph._has_booking_required_service(
        {"chief_complaint": "Pain in the back of my mouth"}
    )
    assert not BookingLangGraph._has_booking_required_service({"specialty_hint": "dentistry"})
    assert BookingLangGraph._has_booking_required_service({"service_hint": "oral check"})


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
