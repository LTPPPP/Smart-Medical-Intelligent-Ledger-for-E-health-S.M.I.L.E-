from __future__ import annotations

from datetime import date, timedelta
import re
import time
import uuid
from typing import Any, Awaitable, Callable, Literal, TypeVar, TypedDict

from langgraph.graph import END, START, StateGraph

from .confirmation_store import ConfirmationStore, InMemoryConfirmationStore, PendingConfirmation
from .conversation_state import (
    ConversationState,
    InMemoryConversationStateStore,
    MUTATION_FLOWS,
    reduce_conversation,
)
from .extractor import StructuredCommandExtractor
from .outcomes import OutcomeCode, TurnOutcome, fallback_reply
from .response_generator import GroundedResponseGenerator
from .schemas import AgentCommand, BookingDraft, ChatRequest, ChatResponse, ConfirmationRequest, FlowName, SlotUpdate
from .tool_errors import (
    AmbiguousReferenceError,
    DomainConflictError,
    DomainToolError,
    MalformedToolPayload,
    NonActionableAppointment,
    ReadToolFailure,
    SafeErrorCategory,
)
from .tools import DomainTools, SideEffectLevel, core_domain_tool_specs


T = TypeVar("T")
DOMAIN_TOOL_SPECS = {spec.name: spec for spec in core_domain_tool_specs()}
RECOMMENDATION_SEARCH_DAYS = 14


class GraphState(TypedDict, total=False):
    request: ChatRequest
    trusted_user_id: str | None
    trusted_patient_id: str | None
    command: AgentCommand
    flow: FlowName
    slots: dict[str, Any]
    safe_state: dict[str, Any]
    actions: list[str]
    graph_path: list[str]
    reply: str
    confirmation: ConfirmationRequest | None
    metrics: dict[str, Any]
    started_at: float
    conversation_abort: bool
    conversation_switch: bool
    outcome: TurnOutcome


class BookingLangGraph:
    def __init__(
        self,
        domain_tools: DomainTools,
        extractor: StructuredCommandExtractor | None = None,
        confirmation_store: ConfirmationStore | None = None,
        conversation_store: InMemoryConversationStateStore | None = None,
        response_generator: GroundedResponseGenerator | None = None,
    ) -> None:
        self.domain_tools = domain_tools
        self.extractor = extractor
        self.confirmation_store = confirmation_store or InMemoryConfirmationStore()
        self.conversation_store = conversation_store or InMemoryConversationStateStore()
        self.response_generator = response_generator
        self.graph = self._build_graph()

    async def handle_chat(
        self,
        request: ChatRequest,
        trusted_patient_id: str | None,
        trusted_user_id: str | None = None,
    ) -> ChatResponse:
        initial: GraphState = {
            "request": request,
            "trusted_user_id": trusted_user_id,
            "trusted_patient_id": trusted_patient_id,
            "slots": {},
            "safe_state": {},
            "actions": [],
            "graph_path": [],
            "confirmation": None,
            "metrics": self._base_metrics(),
            "started_at": time.perf_counter(),
        }
        result = await self.graph.ainvoke(initial, {"configurable": {"thread_id": request.session_id}})
        outcome = self._derive_outcome(result)
        result["outcome"] = outcome
        command = result.get("command")
        direct_response = command.direct_response.strip() if command and command.direct_response else None
        if (
            direct_response
            and command
            and GroundedResponseGenerator.validate_direct_response(direct_response, outcome)
        ):
            result["reply"] = direct_response
            result["metrics"].update(
                {"response_mode": "parser_direct", "response_generator_fallback": 0, "response_validation_passed": 1}
            )
        elif self.response_generator is not None:
            generated = await self.response_generator.generate(user_message=request.message, outcome=outcome)
            result["reply"] = generated.reply
            result["metrics"]["llm_calls_per_turn"] += generated.llm_call_count
            result["metrics"].update(
                {
                    "response_mode": "llm_generated",
                    "response_generator_latency_ms": generated.latency_ms,
                    "response_generator_fallback": int(generated.used_fallback),
                    "response_validation_passed": int(generated.validation_passed),
                    "response_generator_retry_count": generated.retry_count,
                    "response_generator_input_tokens": generated.input_tokens,
                    "response_generator_output_tokens": generated.output_tokens,
                }
            )
        else:
            result["reply"] = fallback_reply(outcome)
            result["metrics"].update(
                {"response_mode": "deterministic", "response_generator_fallback": 0, "response_validation_passed": 1}
            )
        await self._persist_conversation_state(result)
        metrics = result["metrics"]
        metrics["p50_p95_latency_source"] = "per_turn_latency_ms"
        metrics["latency_ms"] = round((time.perf_counter() - result["started_at"]) * 1000, 2)
        return ChatResponse(
            reply=result["reply"],
            flow=result["flow"],
            safe_state=result.get("safe_state", {}),
            actions=result.get("actions", []),
            confirmation=result.get("confirmation"),
            metadata={
                "trace_id": str(uuid.uuid5(uuid.NAMESPACE_URL, request.session_id + request.message)),
                "graph_path": result.get("graph_path", []),
                "metrics": metrics,
                "outcome_code": outcome.code.value,
                "dialogue_act": command.dialogue_act if command else None,
                "policy_intent": self._policy_intent(command, result["flow"]),
            },
        )

    def _build_graph(self):
        builder: StateGraph[GraphState] = StateGraph(GraphState)
        builder.add_node("extract_command", self._extract_command)
        builder.add_node("lookup_flow", self._lookup_flow)
        builder.add_node("booking_flow", self._booking_flow)
        builder.add_node("cancel_flow", self._cancel_flow)
        builder.add_node("reschedule_flow", self._reschedule_flow)
        builder.add_node("confirmation_flow", self._confirmation_flow)
        builder.add_node("abort_flow", self._abort_flow)
        builder.add_node("fallback_flow", self._fallback_flow)
        builder.add_edge(START, "extract_command")
        builder.add_conditional_edges(
            "extract_command",
            self._route_after_extract,
            {
                "lookup_flow": "lookup_flow",
                "booking_flow": "booking_flow",
                "cancel_flow": "cancel_flow",
                "reschedule_flow": "reschedule_flow",
                "confirmation_flow": "confirmation_flow",
                "abort_flow": "abort_flow",
                "fallback_flow": "fallback_flow",
            },
        )
        for node in (
            "lookup_flow",
            "booking_flow",
            "cancel_flow",
            "reschedule_flow",
            "confirmation_flow",
            "abort_flow",
            "fallback_flow",
        ):
            builder.add_edge(node, END)
        return builder.compile()

    async def _extract_command(self, state: GraphState) -> GraphState:
        state["graph_path"].append("extract_command")
        request = state["request"]
        command = (
            await self.extractor.extract(request.message)
            if self.extractor is not None
            else AgentCommand.from_english_message(request.message)
        )
        if request.action and request.appointment_ref:
            command = AgentCommand(
                intent=(
                    FlowName.CANCEL
                    if request.action == "cancel_appointment"
                    else FlowName.RESCHEDULE
                ),
                dialogue_act="request",
                slot_updates=[
                    SlotUpdate(name="appointment_ref", value=request.appointment_ref)
                ],
                selected_reference=request.appointment_ref,
                confidence=1.0,
            )
        current = await self.conversation_store.load(request.session_id, state.get("trusted_patient_id"))
        if request.selected_doctor_id:
            command = command.model_copy(
                update={
                    "intent": current.active_flow if current and current.active_flow in MUTATION_FLOWS else command.intent,
                    "slot_updates": [
                        *command.slot_updates,
                        SlotUpdate(name="doctor_id", value=request.selected_doctor_id),
                    ],
                }
            )
        if request.selected_booking_option_id:
            command = command.model_copy(
                update={
                    "intent": current.active_flow if current and current.active_flow in MUTATION_FLOWS else command.intent,
                    "slot_updates": [
                        *command.slot_updates,
                        SlotUpdate(name="booking_option_id", value=request.selected_booking_option_id),
                    ],
                }
            )
        resolution = reduce_conversation(current, command)
        command = resolution.command
        if resolution.abort or resolution.switch:
            await self.confirmation_store.invalidate_session(request.session_id)
        if self.extractor is not None:
            state["metrics"]["llm_calls_per_turn"] = 1
            if self.extractor.last_error:
                state["metrics"]["extractor_failure_class"] = self.extractor.last_error
                state["metrics"]["timeout_rate"] = 1 if self.extractor.last_error in {"ReadTimeout", "TimeoutException"} else 0
        state["command"] = command
        if command.secondary_intents:
            state["metrics"]["compound_request_count"] = 1
        state["flow"] = command.intent
        state["slots"] = resolution.slots
        if state.get("trusted_user_id"):
            state["slots"]["auth_user_id"] = state["trusted_user_id"]
        state["slots"].pop("booking_option_id", None)
        if request.selected_doctor_id:
            state["slots"]["doctor_id"] = request.selected_doctor_id
        if request.selected_booking_option_id:
            state["slots"]["booking_option_id"] = request.selected_booking_option_id
        state["conversation_abort"] = resolution.abort
        state["conversation_switch"] = resolution.switch
        state["metrics"]["json_schema_validity"] = 1
        return state

    def _route_after_extract(
        self, state: GraphState
    ) -> Literal[
        "lookup_flow",
        "booking_flow",
        "cancel_flow",
        "reschedule_flow",
        "confirmation_flow",
        "abort_flow",
        "fallback_flow",
    ]:
        request = state["request"]
        if request.confirmation_token:
            return "confirmation_flow"
        if state.get("conversation_abort"):
            return "abort_flow"
        if state.get("command") and state["command"].secondary_intents:
            return "fallback_flow"
        flow = state["flow"]
        if flow == FlowName.LOOKUP:
            return "lookup_flow"
        if flow == FlowName.BOOKING:
            return "booking_flow"
        if flow == FlowName.CANCEL:
            return "cancel_flow"
        if flow == FlowName.RESCHEDULE:
            return "reschedule_flow"
        return "fallback_flow"

    async def _abort_flow(self, state: GraphState) -> GraphState:
        state["graph_path"].append("abort_flow")
        state["flow"] = FlowName.UNKNOWN
        state["reply"] = "No changes were made."
        state["safe_state"] = {"conversation_aborted": True}
        return state

    async def _lookup_flow(self, state: GraphState) -> GraphState:
        state["graph_path"].append("lookup_flow")
        patient_id = state.get("trusted_patient_id")
        state["flow"] = FlowName.LOOKUP
        if not patient_id:
            state["reply"] = "Please sign in before I can show your appointments."
            state["safe_state"] = {"authenticated": False}
            state["metrics"]["policy_compliance_rate"] = 1
            return state
        state["actions"].append("get_patient_appointments")
        try:
            appointments = await self._call_read(
                state,
                "get_patient_appointments",
                lambda: self._get_patient_appointments(state, patient_id),
            )
            appointments = self._validate_lookup_results(appointments)
        except ReadToolFailure:
            return self._safe_read_failure(state)
        except MalformedToolPayload:
            return self._safe_malformed_failure(state)
        state["safe_state"] = {
            "appointments": [self._safe_appointment_summary(appointment) for appointment in appointments],
            "authenticated": True,
        }
        if appointments:
            state["reply"] = "I found your upcoming appointments."
        else:
            state["reply"] = "I did not find any upcoming appointments."
        return state

    async def _booking_flow(self, state: GraphState) -> GraphState:
        state["graph_path"].append("booking_flow")
        state["flow"] = FlowName.BOOKING
        patient_id = state.get("trusted_patient_id")
        if not patient_id:
            state["reply"] = "Please sign in before I can book an appointment."
            state["safe_state"] = {"authenticated": False}
            state["metrics"]["policy_compliance_rate"] = 1
            return state
        if not self._has_booking_required_service(state["slots"]):
            service_suggestion = self._suggest_service_from_context(state)
            if service_suggestion:
                state["slots"]["suggested_service_hint"] = service_suggestion["service_hint"]
                state["slots"]["suggested_service_name"] = service_suggestion["service_name"]
                return self._require_information(
                    state,
                    "confirm the dental service",
                    reply="Please confirm the dental service before I continue.",
                    safe_state={"service_suggestion": service_suggestion},
                )
            return self._require_information(
                state,
                "the dental service you need",
                reply="What dental service would you like to book?",
            )
        if not self._has_specific_booking_date(state["slots"]):
            return self._require_information(
                state,
                "your preferred appointment date",
                reply="What date would you prefer for the appointment?",
            )
        state["actions"].append("search_booking_catalog")
        try:
            await self._call_read(
                state,
                "search_booking_catalog",
                lambda: self.domain_tools.search_booking_catalog(state["slots"]),
            )
        except ReadToolFailure:
            return self._safe_read_failure(state)
        except MalformedToolPayload:
            return self._safe_malformed_failure(state)
        recommended_doctor = await self._recommended_doctor_for_booking(state, patient_id)
        if recommended_doctor:
            state["slots"]["preferred_doctor_id"] = recommended_doctor["doctor_id"]
            if recommended_doctor.get("doctor_name"):
                state["slots"]["preferred_doctor_name"] = recommended_doctor["doctor_name"]
        try:
            options = await self._read_booking_options(state, patient_id)
        except ReadToolFailure:
            return self._safe_read_failure(state)
        except MalformedToolPayload:
            return self._safe_malformed_failure(state)
        selected_doctor_id = state["slots"].get("doctor_id")
        recommendation = None
        if not self._available_booking_options(options):
            try:
                recommendation = await self._recommended_booking_options(
                    state,
                    patient_id,
                    selected_doctor_id=str(selected_doctor_id) if selected_doctor_id else None,
                )
            except ReadToolFailure:
                return self._safe_read_failure(state)
            except MalformedToolPayload:
                return self._safe_malformed_failure(state)
            if recommendation is None:
                return self._safe_no_availability(state)
            options = recommendation["options"]
        if not selected_doctor_id:
            state["safe_state"] = {"doctor_options": self._doctor_options(self._available_booking_options(options))}
            if recommendation:
                self._apply_recommendation_safe_state(state["safe_state"], recommendation)
            if recommended_doctor:
                state["safe_state"]["recommended_doctor"] = recommended_doctor
            state["reply"] = "Choose a doctor for this appointment."
            return state
        options = [option for option in options if option.get("doctor_id") == str(selected_doctor_id)]
        if not self._available_booking_options(options):
            try:
                recommendation = await self._recommended_booking_options(
                    state,
                    patient_id,
                    selected_doctor_id=str(selected_doctor_id),
                )
            except ReadToolFailure:
                return self._safe_read_failure(state)
            except MalformedToolPayload:
                return self._safe_malformed_failure(state)
            if recommendation is None:
                return self._safe_no_availability(state, selected_doctor_id=str(selected_doctor_id))
            options = recommendation["options"]
        selected_option_id = state["slots"].get("booking_option_id")
        if not selected_option_id:
            state["safe_state"] = {
                "booking_options": options,
                "selected_doctor_id": str(selected_doctor_id),
            }
            if recommendation:
                self._apply_recommendation_safe_state(state["safe_state"], recommendation)
            state["reply"] = "Choose an available time."
            return state
        option = self._selected_booking_option(options, selected_option_id)
        if option is None:
            state["reply"] = "That slot is no longer available. Please choose another open slot."
            state["safe_state"] = {"booking_options": options}
            state["metrics"]["backend_conflict_rate"] = 1
            return state
        state["slots"]["booking_option_id"] = option["id"]
        booking_draft = BookingDraft.model_validate(state["slots"]).model_dump(exclude_none=True)
        state["actions"].append("prepare_booking")
        state["confirmation"] = await self._create_confirmation(
            state,
            flow=FlowName.BOOKING,
            action="commit_booking",
            summary=f"Book {option['summary']}",
            payload={"booking_option_id": option["id"], "booking_draft": booking_draft},
        )
        state["safe_state"] = {
            "booking_option": option,
            "booking_options": options,
            "booking_option_selected": bool(state["request"].selected_booking_option_id),
        }
        if recommended_doctor:
            state["safe_state"]["recommended_doctor"] = recommended_doctor
        state["reply"] = f"I found this option: {option['summary']} Please confirm if you want me to book it."
        return state

    async def _cancel_flow(self, state: GraphState) -> GraphState:
        state["graph_path"].append("cancel_flow")
        state["flow"] = FlowName.CANCEL
        patient_id = state.get("trusted_patient_id")
        if not patient_id:
            state["reply"] = "Please sign in before I can cancel an appointment."
            state["safe_state"] = {"authenticated": False}
            state["metrics"]["policy_compliance_rate"] = 1
            return state
        try:
            appointment = await self._resolve_appointment(state, patient_id)
        except ReadToolFailure:
            return self._safe_read_failure(state)
        except MalformedToolPayload:
            return self._safe_malformed_failure(state)
        except AmbiguousReferenceError:
            return self._safe_ambiguous_reference(state)
        except NonActionableAppointment:
            return self._safe_appointment_unavailable(state, SafeErrorCategory.NON_ACTIONABLE_APPOINTMENT)
        if not appointment:
            if state["slots"].get("appointment_ref"):
                return self._safe_appointment_unavailable(state, SafeErrorCategory.OWNERSHIP_SAFE_UNAVAILABLE)
            state["reply"] = "I could not find that appointment. Please provide the appointment code."
            state["metrics"]["clarification_count"] = 1
            return state
        state["actions"].append("prepare_cancel")
        state["confirmation"] = await self._create_confirmation(
            state,
            flow=FlowName.CANCEL,
            action="commit_cancel",
            summary=f"Cancel appointment {appointment['code']}.",
            payload={"appointment_id": appointment["id"]},
        )
        state["safe_state"] = {"appointment_id": appointment["id"], "appointment_code": appointment["code"]}
        state["reply"] = f"Please confirm that you want to cancel appointment {appointment['code']}."
        return state

    async def _reschedule_flow(self, state: GraphState) -> GraphState:
        state["graph_path"].append("reschedule_flow")
        state["flow"] = FlowName.RESCHEDULE
        patient_id = state.get("trusted_patient_id")
        if not patient_id:
            state["reply"] = "Please sign in before I can reschedule an appointment."
            state["safe_state"] = {"authenticated": False}
            state["metrics"]["policy_compliance_rate"] = 1
            return state
        try:
            appointment = await self._resolve_appointment(state, patient_id)
        except ReadToolFailure:
            return self._safe_read_failure(state)
        except MalformedToolPayload:
            return self._safe_malformed_failure(state)
        except AmbiguousReferenceError:
            return self._safe_ambiguous_reference(state)
        except NonActionableAppointment:
            return self._safe_appointment_unavailable(state, SafeErrorCategory.NON_ACTIONABLE_APPOINTMENT)
        if not appointment:
            try:
                appointment, appointment_candidates, match_hint = await self._select_appointment_from_schedule_clues(
                    state,
                    patient_id,
                )
            except ReadToolFailure:
                return self._safe_read_failure(state)
            except MalformedToolPayload:
                return self._safe_malformed_failure(state)
        if not appointment:
            if state["slots"].get("appointment_ref"):
                return self._safe_appointment_unavailable(state, SafeErrorCategory.OWNERSHIP_SAFE_UNAVAILABLE)
            return self._require_appointment_selection(
                state,
                appointment_candidates,
                action="reschedule",
                match_hint=match_hint,
            )
        self._apply_reschedule_context(state["slots"], appointment)
        if not self._has_specific_booking_date(state["slots"]):
            return self._require_information(
                state,
                "your preferred new date",
                reply="What new date would you prefer?",
                safe_state={"current_appointment": appointment},
            )
        try:
            options = await self._read_booking_options(state, patient_id)
        except ReadToolFailure:
            return self._safe_read_failure(state)
        except MalformedToolPayload:
            return self._safe_malformed_failure(state)
        selected_doctor_id = state["slots"].get("doctor_id")
        recommendation = None
        if not self._available_booking_options(options):
            try:
                recommendation = await self._recommended_booking_options(
                    state,
                    patient_id,
                    selected_doctor_id=str(selected_doctor_id) if selected_doctor_id else None,
                )
            except ReadToolFailure:
                return self._safe_read_failure(state)
            except MalformedToolPayload:
                return self._safe_malformed_failure(state)
            if recommendation is None:
                return self._safe_no_availability(state)
            options = recommendation["options"]
        if not selected_doctor_id:
            state["safe_state"] = {
                "appointment_id": appointment["id"],
                "appointment_code": appointment["code"],
                "current_appointment": appointment,
                "doctor_options": self._doctor_options(self._available_booking_options(options)),
            }
            if recommendation:
                self._apply_recommendation_safe_state(state["safe_state"], recommendation)
            preferred_doctor = self._appointment_doctor_reference(appointment)
            if preferred_doctor:
                state["safe_state"]["recommended_doctor"] = preferred_doctor
            state["reply"] = "Choose a doctor for the new appointment."
            return state
        options = [option for option in options if option.get("doctor_id") == str(selected_doctor_id)]
        if not self._available_booking_options(options):
            try:
                recommendation = await self._recommended_booking_options(
                    state,
                    patient_id,
                    selected_doctor_id=str(selected_doctor_id),
                )
            except ReadToolFailure:
                return self._safe_read_failure(state)
            except MalformedToolPayload:
                return self._safe_malformed_failure(state)
            if recommendation is None:
                return self._safe_no_availability(state, selected_doctor_id=str(selected_doctor_id))
            options = recommendation["options"]
        selected_option_id = state["slots"].get("booking_option_id")
        if not selected_option_id:
            state["safe_state"] = {
                "appointment_id": appointment["id"],
                "appointment_code": appointment["code"],
                "current_appointment": appointment,
                "booking_options": options,
                "selected_doctor_id": str(selected_doctor_id),
            }
            if recommendation:
                self._apply_recommendation_safe_state(state["safe_state"], recommendation)
            state["reply"] = "Choose an available time for the new appointment."
            return state
        option = self._selected_booking_option(options, selected_option_id)
        if option is None:
            state["reply"] = "That reschedule slot is no longer available. Please choose another open slot."
            state["safe_state"] = {
                "appointment_id": appointment["id"],
                "appointment_code": appointment["code"],
                "current_appointment": appointment,
                "booking_options": options,
            }
            state["metrics"]["backend_conflict_rate"] = 1
            return state
        state["actions"].append("prepare_reschedule")
        state["confirmation"] = await self._create_confirmation(
            state,
            flow=FlowName.RESCHEDULE,
            action="commit_reschedule",
            summary=f"Move appointment {appointment['code']} to {option['summary']}",
            payload={"appointment_id": appointment["id"], "booking_option_id": option["id"]},
        )
        state["safe_state"] = {
            "appointment_id": appointment["id"],
            "appointment_code": appointment["code"],
            "current_appointment": appointment,
            "booking_option": option,
            "booking_options": options,
            "booking_option_selected": bool(state["request"].selected_booking_option_id),
        }
        state["reply"] = f"Please confirm moving appointment {appointment['code']} to {option['summary']}"
        return state

    async def _confirmation_flow(self, state: GraphState) -> GraphState:
        state["graph_path"].append("confirmation_flow")
        request = state["request"]
        consumed = await self.confirmation_store.consume(
            request.confirmation_token or "",
            session_id=request.session_id,
            patient_id=state.get("trusted_patient_id"),
        )
        pending = consumed.confirmation
        if pending is None:
            state["flow"] = FlowName.UNKNOWN
            state["reply"] = "I could not verify that confirmation request. Please start again."
            state["metrics"]["safe_error_category"] = "invalid_confirmation"
            state["metrics"]["invalid_action_rate"] = 1
            if consumed.status == "superseded":
                state["metrics"]["confirmation_token_superseded_blocked_count"] = 1
            elif consumed.status == "replayed":
                state["metrics"]["confirmation_token_replay_blocked_count"] = 1
            return state
        state["flow"] = pending.flow
        if request.confirmed is not True:
            state["reply"] = "No changes were made."
            state["safe_state"] = {"confirmation_cancelled": True}
            state["metrics"]["safe_error_category"] = "rejected_confirmation"
            return state
        patient_id = pending.patient_id
        if not patient_id:
            state["flow"] = FlowName.UNKNOWN
            state["reply"] = "I could not verify that confirmation request. Please start again."
            state["metrics"]["safe_error_category"] = "invalid_confirmation"
            state["metrics"]["invalid_action_rate"] = 1
            return state
        action = pending.action
        payload = pending.payload
        try:
            if action == "commit_cancel":
                state["actions"].append("commit_cancel")
                state["metrics"]["mutation_attempt_count"] = 1
                await self.domain_tools.commit_cancel(
                    patient_id,
                    payload["appointment_id"],
                    request.confirmation_token or "",
                    state.get("trusted_user_id"),
                )
                state["reply"] = "The appointment has been cancelled."
            elif action == "commit_booking":
                state["actions"].append("commit_booking")
                state["metrics"]["mutation_attempt_count"] = 1
                booking_args = (
                    patient_id,
                    payload["booking_option_id"],
                    request.confirmation_token or "",
                    state.get("trusted_user_id"),
                )
                booking_draft = payload.get("booking_draft") or None
                if booking_draft:
                    await self.domain_tools.commit_booking(*booking_args, booking_draft=booking_draft)
                else:
                    await self.domain_tools.commit_booking(*booking_args)
                state["reply"] = "The appointment has been booked."
            elif action == "commit_reschedule":
                state["actions"].append("commit_reschedule")
                state["metrics"]["mutation_attempt_count"] = 1
                await self.domain_tools.commit_reschedule(
                    patient_id,
                    payload["appointment_id"],
                    payload["booking_option_id"],
                    request.confirmation_token or "",
                    state.get("trusted_user_id"),
                )
                state["reply"] = "The appointment has been rescheduled."
            else:
                state["reply"] = "I could not apply that confirmation."
                state["metrics"]["invalid_action_rate"] = 1
            if state["metrics"]["mutation_attempt_count"]:
                state["metrics"]["mutation_success_count"] = 1
        except DomainConflictError:
            state["reply"] = (
                "I could not complete that change because the backend reported a conflict. "
                "Please choose another option."
            )
            state["metrics"]["backend_conflict_rate"] = 1
            state["metrics"]["mutation_conflict_count"] = 1
            state["metrics"]["safe_error_category"] = "commit_conflict"
        except DomainToolError:
            state["reply"] = "The scheduling service is unavailable. The change was not completed. Please try again later."
            state["metrics"]["safe_error_category"] = SafeErrorCategory.COMMIT_UNAVAILABLE.value
        except RuntimeError:
            state["reply"] = (
                "I could not complete that change because the backend reported a conflict. "
                "Please choose another option."
            )
            state["metrics"]["backend_conflict_rate"] = 1
            state["metrics"]["mutation_conflict_count"] = 1
            state["metrics"]["safe_error_category"] = SafeErrorCategory.COMMIT_CONFLICT.value
        state["confirmation"] = None
        return state

    async def _fallback_flow(self, state: GraphState) -> GraphState:
        state["graph_path"].append("fallback_flow")
        command = state.get("command")
        state["flow"] = (
            command.intent
            if command and command.intent in {FlowName.CONVERSATIONAL, FlowName.OUT_OF_SCOPE}
            else FlowName.UNKNOWN
        )
        state["reply"] = "Tell me what you need for your SMILE appointment, and I will check the schedule."
        state["metrics"]["clarification_count"] = 1
        return state

    async def _resolve_appointment(self, state: GraphState, patient_id: str) -> dict[str, Any] | None:
        appointment_ref = state["slots"].get("appointment_ref")
        if not appointment_ref:
            return None
        state["actions"].append("resolve_appointment_reference")
        appointment = await self._call_read(
            state,
            "resolve_appointment_reference",
            lambda: self.domain_tools.resolve_appointment_reference(
                patient_id,
                appointment_ref,
                auth_user_id=state.get("trusted_user_id"),
            ),
        )
        if appointment:
            appointment = self._validate_resolved_appointment(appointment)
            if str(appointment.get("status") or "").lower() == "cancelled":
                raise NonActionableAppointment(appointment_ref)
            state["slots"]["appointment_id"] = appointment["id"]
        return appointment

    async def _select_appointment_from_schedule_clues(
        self,
        state: GraphState,
        patient_id: str,
    ) -> tuple[dict[str, Any] | None, list[dict[str, Any]], str | None]:
        appointments = await self._read_patient_appointments_for_selection(state, patient_id)
        match_hint = self._appointment_match_hint(state["slots"])
        if not self._has_appointment_selection_clues(state["slots"]):
            return None, appointments, None

        matches = [
            appointment for appointment in appointments
            if self._appointment_matches_slots(appointment, state["slots"])
        ]
        if len(matches) == 1:
            appointment = matches[0]
            state["slots"]["appointment_id"] = appointment["id"]
            state["slots"]["appointment_ref"] = appointment.get("id") or appointment.get("code")
            return appointment, [], match_hint
        return None, matches or appointments, match_hint

    async def _read_patient_appointments_for_selection(
        self,
        state: GraphState,
        patient_id: str,
    ) -> list[dict[str, Any]]:
        state["actions"].append("get_patient_appointments")
        appointments = await self._call_read(
            state,
            "get_patient_appointments",
            lambda: self._get_patient_appointments(state, patient_id),
        )
        validated = self._validate_lookup_results(appointments)
        return [
            appointment for appointment in validated
            if str(appointment.get("status") or "").lower() != "cancelled"
        ]

    @staticmethod
    def _has_appointment_selection_clues(slots: dict[str, Any]) -> bool:
        return any(slots.get(key) for key in ("date_hint", "preferred_date", "time_hint", "doctor_id", "doctor_hint"))

    @classmethod
    def _appointment_matches_slots(cls, appointment: dict[str, Any], slots: dict[str, Any]) -> bool:
        time_hint = cls._normalize_time_value(slots.get("time_hint"))
        if time_hint and cls._normalize_time_value(
            appointment.get("appointment_time") or appointment.get("appointmentTime") or appointment.get("time")
        ) != time_hint:
            return False

        requested_date = cls._requested_date_value(slots)
        if requested_date:
            appointment_date = cls._appointment_date_value(appointment)
            if appointment_date != requested_date:
                return False

        doctor_id = slots.get("doctor_id")
        if doctor_id and str(appointment.get("doctor_id") or appointment.get("doctorId") or "") != str(doctor_id):
            return False

        doctor_hint = slots.get("doctor_hint")
        doctor_name = str(appointment.get("doctor_name") or appointment.get("doctorName") or "").casefold()
        if isinstance(doctor_hint, str) and doctor_hint.strip() and doctor_hint.strip().casefold() not in doctor_name:
            return False

        return True

    @classmethod
    def _appointment_match_hint(cls, slots: dict[str, Any]) -> str | None:
        time_hint = cls._normalize_time_value(slots.get("time_hint"))
        if time_hint:
            return time_hint
        requested_date = cls._requested_date_value(slots)
        if requested_date:
            return requested_date.isoformat()
        doctor_hint = slots.get("doctor_hint") or slots.get("doctor_id")
        return str(doctor_hint) if doctor_hint else None

    @staticmethod
    def _appointment_date_value(appointment: dict[str, Any]) -> date | None:
        value = appointment.get("appointment_date") or appointment.get("appointmentDate") or appointment.get("date")
        if not isinstance(value, str) or not value.strip():
            return None
        try:
            return date.fromisoformat(value.strip().split("T", 1)[0])
        except ValueError:
            return None

    @staticmethod
    def _normalize_time_value(value: Any) -> str | None:
        if not isinstance(value, str) or not value.strip():
            return None
        text = value.strip().lower()
        match = re.search(r"\b([01]?\d|2[0-3]):([0-5]\d)\b", text)
        if match:
            return f"{int(match.group(1)):02d}:{int(match.group(2)):02d}"
        ampm_match = re.search(r"\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b", text)
        if not ampm_match:
            return None
        hour = int(ampm_match.group(1))
        minute = int(ampm_match.group(2) or "0")
        meridiem = ampm_match.group(3)
        if meridiem == "am" and hour == 12:
            hour = 0
        elif meridiem == "pm" and hour != 12:
            hour += 12
        return f"{hour:02d}:{minute:02d}"

    async def _call_read(
        self,
        state: GraphState,
        tool_name: str,
        call: Callable[[], Awaitable[T]],
    ) -> T:
        spec = DOMAIN_TOOL_SPECS.get(tool_name)
        if (
            spec is None
            or spec.side_effect != SideEffectLevel.READ
            or spec.retry_policy != "retry_safe_reads_once"
        ):
            raise ValueError(f"tool is not registered for bounded read retry: {tool_name}")
        try:
            return await call()
        except AmbiguousReferenceError:
            raise
        except MalformedToolPayload:
            raise
        except TimeoutError:
            try:
                result = await call()
            except MalformedToolPayload:
                raise
            except TimeoutError as exc:
                state["metrics"]["read_timeout_exhausted_count"] = 1
                raise ReadToolFailure(tool_name) from exc
            except RuntimeError as exc:
                state["metrics"]["read_permanent_failure_count"] = 1
                raise ReadToolFailure(tool_name) from exc
            state["metrics"]["read_timeout_recovered_count"] = 1
            return result
        except RuntimeError as exc:
            state["metrics"]["read_permanent_failure_count"] = 1
            raise ReadToolFailure(tool_name) from exc

    async def _read_booking_options(
        self,
        state: GraphState,
        patient_id: str,
        slots: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        state["actions"].append("find_booking_options")
        options = await self._call_read(
            state,
            "find_booking_options",
            lambda: self.domain_tools.find_booking_options(patient_id, slots or state["slots"]),
        )
        return self._validate_booking_options(options)

    async def _recommended_booking_options(
        self,
        state: GraphState,
        patient_id: str,
        *,
        selected_doctor_id: str | None = None,
    ) -> dict[str, Any] | None:
        requested_date = self._requested_date_label(state["slots"])
        start = self._recommendation_start_date(state["slots"])
        end = start + timedelta(days=RECOMMENDATION_SEARCH_DAYS - 1)
        search_slots = dict(state["slots"])
        search_slots["date_hint"] = start.isoformat()
        search_slots["date_to"] = end.isoformat()
        search_slots.pop("booking_option_id", None)
        if selected_doctor_id:
            search_slots["doctor_id"] = selected_doctor_id

        options = await self._read_booking_options(state, patient_id, search_slots)
        if selected_doctor_id:
            options = [option for option in options if option.get("doctor_id") == selected_doctor_id]
        available = self._available_booking_options(options)
        recommended_date = self._earliest_option_date(available)
        if not recommended_date:
            return None
        recommended_options = [
            option for option in options
            if option.get("appointment_date") == recommended_date
        ]
        if not self._available_booking_options(recommended_options):
            return None
        state["slots"]["date_hint"] = recommended_date
        state["slots"].pop("date_to", None)
        return {
            "options": recommended_options,
            "requested_date": requested_date,
            "recommended_date": recommended_date,
        }

    @classmethod
    def _recommendation_start_date(cls, slots: dict[str, Any]) -> date:
        requested = cls._requested_date_value(slots)
        today = date.today()
        anchor = requested if requested and requested > today else today
        return anchor + timedelta(days=1)

    @classmethod
    def _requested_date_label(cls, slots: dict[str, Any]) -> str | None:
        requested = cls._requested_date_value(slots)
        if requested:
            return requested.isoformat()
        for key in ("date_hint", "preferred_date"):
            value = slots.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        return None

    @staticmethod
    def _requested_date_value(slots: dict[str, Any]) -> date | None:
        for key in ("date_hint", "preferred_date"):
            value = slots.get(key)
            if not isinstance(value, str) or not value.strip():
                continue
            text = value.strip().lower()
            try:
                return date.fromisoformat(text.split("T", 1)[0])
            except ValueError:
                pass
            if "tomorrow" in text or "next day" in text:
                return date.today() + timedelta(days=1)
        return None

    @staticmethod
    def _available_booking_options(options: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [option for option in options if option.get("status") != "booked"]

    @staticmethod
    def _earliest_option_date(options: list[dict[str, Any]]) -> str | None:
        dated_options = [
            option for option in options
            if isinstance(option.get("appointment_date"), str) and option.get("appointment_date")
        ]
        if not dated_options:
            return None
        earliest = min(
            dated_options,
            key=lambda option: (
                str(option.get("appointment_date")),
                str(option.get("appointment_time") or ""),
            ),
        )
        return str(earliest["appointment_date"])

    @staticmethod
    def _apply_recommendation_safe_state(safe_state: dict[str, Any], recommendation: dict[str, Any]) -> None:
        safe_state["availability_recommendation"] = True
        safe_state["requested_date"] = recommendation.get("requested_date")
        safe_state["recommended_date"] = recommendation.get("recommended_date")
        safe_state["availability_search_window_days"] = RECOMMENDATION_SEARCH_DAYS

    @staticmethod
    def _suggest_service_from_context(state: GraphState) -> dict[str, str] | None:
        slots = state.get("slots", {})
        text = " ".join(
            str(value)
            for value in (
                state["request"].message,
                slots.get("appointment_type"),
                slots.get("chief_complaint"),
                slots.get("notes"),
            )
            if value
        ).casefold()
        oral_check_terms = (
            "basic check",
            "basic checking",
            "routine check",
            "routine exam",
            "dental check",
            "dental exam",
            "oral exam",
            "oral healthcare",
            "oral health care",
            "oral check",
            "checkup",
            "check up",
        )
        if any(term in text for term in oral_check_terms):
            return {
                "service_hint": "oral check",
                "service_name": "routine dental check-up (oral exam)",
            }
        return None

    @staticmethod
    def _safe_no_availability(
        state: GraphState,
        *,
        selected_doctor_id: str | None = None,
    ) -> GraphState:
        state["reply"] = (
            "I checked nearby dates too, but I could not find an open appointment for those details. "
            "Please try another doctor, clinic, or date range."
        )
        state["confirmation"] = None
        state["metrics"]["backend_conflict_rate"] = 1
        state["safe_state"] = {
            "no_available_options": True,
            "requested_date": BookingLangGraph._requested_date_label(state["slots"]),
            "availability_search_window_days": RECOMMENDATION_SEARCH_DAYS,
        }
        if selected_doctor_id:
            state["safe_state"]["selected_doctor_id"] = selected_doctor_id
        return state

    @staticmethod
    def _safe_read_failure(state: GraphState) -> GraphState:
        state["reply"] = "The scheduling service is unavailable. No changes were made. Please try again later."
        state["confirmation"] = None
        state["metrics"]["safe_error_category"] = SafeErrorCategory.READ_UNAVAILABLE.value
        return state

    @staticmethod
    def _safe_malformed_failure(state: GraphState) -> GraphState:
        state["reply"] = "The scheduling service returned an invalid response. No changes were made. Please try again later."
        state["confirmation"] = None
        state["metrics"]["safe_error_category"] = SafeErrorCategory.MALFORMED_BACKEND_RESPONSE.value
        state["metrics"]["payload_validation_failure_count"] = 1
        return state

    @staticmethod
    def _safe_ambiguous_reference(state: GraphState) -> GraphState:
        state["reply"] = "I found more than one possible match. Please clarify which appointment you mean."
        state["confirmation"] = None
        state["metrics"]["clarification_count"] = 1
        state["safe_state"] = {"ambiguous_reference": True}
        return state

    @staticmethod
    def _safe_appointment_unavailable(
        state: GraphState,
        category: SafeErrorCategory,
    ) -> GraphState:
        state["reply"] = "I cannot access an actionable appointment for this request. No changes were made."
        state["confirmation"] = None
        state["metrics"]["safe_error_category"] = category.value
        state["safe_state"] = {"appointment_unavailable": True}
        return state

    @classmethod
    def _validate_lookup_results(cls, value: Any) -> list[dict[str, Any]]:
        if not isinstance(value, list):
            raise MalformedToolPayload("appointment results must be a list")
        validated: list[dict[str, Any]] = []
        for item in value:
            if not isinstance(item, dict):
                raise MalformedToolPayload("appointment result must be an object")
            identifier = item.get("id") or item.get("appointment_id") or item.get("appointmentId")
            code = item.get("code") or item.get("appointment_code") or item.get("appointmentCode")
            if not cls._is_nonempty_string(identifier) and not cls._is_nonempty_string(code):
                raise MalformedToolPayload("appointment result requires an identifier or code")
            validated.append(dict(item))
        return validated

    @classmethod
    def _validate_booking_options(cls, value: Any) -> list[dict[str, Any]]:
        if not isinstance(value, list):
            raise MalformedToolPayload("booking options must be a list")
        validated: list[dict[str, Any]] = []
        for item in value:
            if (
                not isinstance(item, dict)
                or not cls._is_nonempty_string(item.get("id"))
                or not cls._is_nonempty_string(item.get("summary"))
            ):
                raise MalformedToolPayload("booking option requires id and summary")
            validated.append(dict(item))
        return validated

    @staticmethod
    def _selected_booking_option(
        options: list[dict[str, Any]],
        selected_option_id: Any,
    ) -> dict[str, Any] | None:
        available_options = [option for option in options if option.get("status") != "booked"]
        if not selected_option_id:
            return available_options[0] if available_options else None
        return next((option for option in available_options if option.get("id") == selected_option_id), None)

    @staticmethod
    def _doctor_options(options: list[dict[str, Any]]) -> list[dict[str, Any]]:
        doctors: list[dict[str, Any]] = []
        seen: set[str] = set()
        for option in options:
            doctor_id = option.get("doctor_id")
            if not doctor_id or str(doctor_id) in seen:
                continue
            seen.add(str(doctor_id))
            doctors.append(
                {
                    "doctor_id": str(doctor_id),
                    "doctor_name": option.get("doctor_name") or "Available doctor",
                    "clinic_name": option.get("clinic_name"),
                }
            )
        return doctors

    @staticmethod
    def _appointment_doctor_reference(appointment: dict[str, Any]) -> dict[str, str] | None:
        doctor_id = appointment.get("doctor_id") or appointment.get("doctorId")
        if not doctor_id:
            return None
        result = {"doctor_id": str(doctor_id)}
        doctor_name = appointment.get("doctor_name") or appointment.get("doctorName")
        if doctor_name:
            result["doctor_name"] = str(doctor_name)
        return result

    @staticmethod
    def _apply_reschedule_context(slots: dict[str, Any], appointment: dict[str, Any]) -> None:
        for target, sources in {
            "service_id": ("service_id", "serviceId"),
            "clinic_id": ("clinic_id", "clinicId"),
        }.items():
            if slots.get(target):
                continue
            value = next((appointment.get(source) for source in sources if appointment.get(source)), None)
            if value:
                slots[target] = value
        doctor = BookingLangGraph._appointment_doctor_reference(appointment)
        if doctor:
            slots.setdefault("preferred_doctor_id", doctor["doctor_id"])
            if doctor.get("doctor_name"):
                slots.setdefault("preferred_doctor_name", doctor["doctor_name"])

    @staticmethod
    def _require_appointment_selection(
        state: GraphState,
        appointments: list[dict[str, Any]],
        *,
        action: Literal["cancel", "reschedule"],
        match_hint: str | None = None,
    ) -> GraphState:
        state["safe_state"] = {
            "appointments": [
                BookingLangGraph._safe_appointment_summary(appointment)
                for appointment in appointments
            ],
            "appointment_selection_action": action,
            "required_information": [f"which appointment to {action}"],
        }
        if match_hint:
            state["safe_state"]["appointment_match_hint"] = match_hint
            state["safe_state"]["appointment_match_count"] = len(appointments)
        if appointments:
            state["reply"] = f"Please choose which appointment you want to {action}."
        else:
            state["reply"] = f"I do not see any upcoming appointments to {action}."
            state["safe_state"]["appointment_unavailable"] = True
        state["metrics"]["clarification_count"] = 1
        return state

    @staticmethod
    def _require_information(
        state: GraphState,
        required_item: str,
        *,
        reply: str,
        safe_state: dict[str, Any] | None = None,
    ) -> GraphState:
        state["safe_state"] = dict(safe_state or {})
        state["safe_state"]["required_information"] = [required_item]
        state["reply"] = reply
        state["metrics"]["clarification_count"] = 1
        return state

    @classmethod
    def _validate_resolved_appointment(cls, value: Any) -> dict[str, Any]:
        if (
            not isinstance(value, dict)
            or not cls._is_nonempty_string(value.get("id"))
            or not cls._is_nonempty_string(value.get("code"))
        ):
            raise MalformedToolPayload("resolved appointment requires id and code")
        return dict(value)

    @staticmethod
    def _is_nonempty_string(value: Any) -> bool:
        return isinstance(value, str) and bool(value.strip())

    async def _create_confirmation(
        self,
        state: GraphState,
        *,
        flow: FlowName,
        action: str,
        summary: str,
        payload: dict[str, Any],
    ) -> ConfirmationRequest:
        token = f"confirm-{uuid.uuid4().hex[:16]}"
        request = state["request"]
        await self.confirmation_store.create(
            PendingConfirmation(
                token=token,
                session_id=request.session_id,
                patient_id=state.get("trusted_patient_id"),
                flow=flow,
                action=action,
                payload=payload,
                summary=summary,
            )
        )
        return ConfirmationRequest(token=token, flow=flow, action=action, summary=summary)

    async def _recommended_doctor_for_booking(
        self,
        state: GraphState,
        patient_id: str,
    ) -> dict[str, str] | None:
        slots = state.get("slots", {})
        if state["request"].selected_booking_option_id or slots.get("doctor_id") or slots.get("doctor_hint"):
            return None
        if not self._has_booking_required_service(slots) or not self._has_booking_search_constraints(slots):
            return None
        state["actions"].append("get_patient_appointments")
        try:
            appointments = await self._call_read(
                state,
                "get_patient_appointments",
                lambda: self._get_patient_appointments(state, patient_id),
            )
        except (ReadToolFailure, MalformedToolPayload):
            return None
        if not isinstance(appointments, list):
            return None
        return self._latest_doctor_reference(appointments)

    async def _get_patient_appointments(self, state: GraphState, patient_id: str) -> list[dict[str, Any]]:
        auth_user_id = state.get("trusted_user_id")
        try:
            return await self.domain_tools.get_patient_appointments(patient_id, auth_user_id)
        except TypeError:
            return await self.domain_tools.get_patient_appointments(patient_id)

    @staticmethod
    def _latest_doctor_reference(appointments: list[Any]) -> dict[str, str] | None:
        for appointment in sorted(
            (item for item in appointments if isinstance(item, dict)),
            key=lambda item: str(item.get("appointment_date") or item.get("date") or "") + " "
            + str(item.get("appointment_time") or item.get("time") or ""),
            reverse=True,
        ):
            doctor_id = appointment.get("doctor_id") or appointment.get("doctorId")
            if not doctor_id:
                continue
            doctor: dict[str, str] = {"doctor_id": str(doctor_id)}
            doctor_name = appointment.get("doctor_name") or appointment.get("doctorName")
            if doctor_name:
                doctor["doctor_name"] = str(doctor_name)
            return doctor
        return None

    async def _persist_conversation_state(self, state: GraphState) -> None:
        request = state["request"]
        patient_id = state.get("trusted_patient_id")
        if request.confirmation_token or state.get("conversation_abort"):
            await self.conversation_store.clear(request.session_id, patient_id)
            return
        flow = state.get("flow")
        has_active_turn = state.get("confirmation") is not None or bool(
            state["metrics"].get("clarification_count")
        ) or any(
            key in state.get("safe_state", {})
            for key in ("doctor_options", "booking_options", "no_available_options")
        )
        if flow in MUTATION_FLOWS and has_active_turn:
            await self.conversation_store.save(
                ConversationState(
                    session_id=request.session_id,
                    patient_id=patient_id,
                    active_flow=flow,
                    slots=dict(state.get("slots", {})),
                )
            )
            return
        await self.conversation_store.clear(request.session_id, patient_id)

    @staticmethod
    def _has_booking_search_constraints(slots: dict[str, Any]) -> bool:
        if any(slots.get(key) for key in ("clinic_id", "doctor_id", "specialty_id", "service_id")):
            return True
        return any(
            BookingLangGraph._is_specific_date_hint(slots.get(key))
            for key in ("date_hint", "preferred_date")
        )

    @staticmethod
    def _has_specific_booking_date(slots: dict[str, Any]) -> bool:
        return any(
            BookingLangGraph._is_specific_date_hint(slots.get(key))
            for key in ("date_hint", "preferred_date")
        )

    @staticmethod
    def _is_specific_date_hint(value: Any) -> bool:
        if not isinstance(value, str) or not value.strip():
            return False
        text = value.strip().lower()
        vague_terms = ("earliest", "soon", "available", "any", "asap", "as soon as possible", "whenever")
        return not any(term in text for term in vague_terms)

    @staticmethod
    def _has_booking_required_service(slots: dict[str, Any]) -> bool:
        return any(slots.get(key) for key in ("service_id", "service_hint"))

    @staticmethod
    def _derive_outcome(state: GraphState) -> TurnOutcome:
        command = state.get("command")
        flow = state.get("flow", FlowName.UNKNOWN)
        safe_facts = dict(state.get("safe_state", {}))
        metrics = state.get("metrics", {})
        confirmation = state.get("confirmation")
        if command and command.intent == FlowName.CONVERSATIONAL:
            code = OutcomeCode.CONVERSATIONAL
            safe_facts["supported_capabilities"] = [
                "look up appointments", "book appointments", "cancel appointments", "reschedule appointments"
            ]
        elif command and command.intent == FlowName.OUT_OF_SCOPE:
            code = OutcomeCode.OUT_OF_SCOPE
            safe_facts["supported_capabilities"] = [
                "look up appointments", "book appointments", "cancel appointments", "reschedule appointments"
            ]
        elif safe_facts.get("authenticated") is False:
            code = OutcomeCode.AUTH_REQUIRED
        elif metrics.get("safe_error_category") in {
            SafeErrorCategory.COMMIT_UNAVAILABLE.value,
            "read_unavailable",
            "malformed_payload",
        }:
            code = OutcomeCode.BACKEND_UNAVAILABLE
        elif confirmation is not None:
            code = OutcomeCode.CONFIRMATION_REQUIRED
        elif metrics.get("mutation_success_count"):
            code = OutcomeCode.MUTATION_SUCCEEDED
        elif metrics.get("backend_conflict_rate"):
            code = OutcomeCode.MUTATION_CONFLICT
        elif safe_facts.get("confirmation_cancelled") or state.get("conversation_abort"):
            code = OutcomeCode.MUTATION_REJECTED
        elif safe_facts.get("appointment_unavailable"):
            code = OutcomeCode.APPOINTMENT_UNAVAILABLE
        elif flow == FlowName.LOOKUP:
            code = OutcomeCode.APPOINTMENTS_FOUND if safe_facts.get("appointments") else OutcomeCode.NO_APPOINTMENTS
        elif flow in {FlowName.BOOKING, FlowName.RESCHEDULE} and any(
            safe_facts.get(key) for key in ("doctor_options", "booking_options", "booking_option")
        ):
            code = OutcomeCode.BOOKING_OPTIONS_FOUND
        elif metrics.get("clarification_count"):
            code = OutcomeCode.CLARIFICATION_REQUIRED
        else:
            code = OutcomeCode.INVALID_RESPONSE
        if code == OutcomeCode.CLARIFICATION_REQUIRED:
            if safe_facts.get("ambiguous_reference"):
                safe_facts["required_information"] = ["which appointment you mean"]
            elif command and command.secondary_intents:
                safe_facts["required_information"] = ["one appointment request at a time"]
            elif flow == FlowName.CANCEL:
                safe_facts["required_information"] = ["the appointment code"]
            elif flow == FlowName.RESCHEDULE:
                safe_facts.setdefault("required_information", ["the appointment to reschedule and preferred new date"])
            elif flow == FlowName.BOOKING:
                safe_facts.setdefault("required_information", ["the dental service and preferred date"])
        return TurnOutcome(
            code=code,
            flow=flow,
            dialogue_act=command.dialogue_act if command else None,
            safe_facts=safe_facts,
            suggested_actions=list(state.get("actions", [])),
            confirmation_required=confirmation is not None,
            constraints=["Do not invent facts", "Do not claim an uncommitted mutation succeeded"],
        )

    @staticmethod
    def _policy_intent(command: AgentCommand | None, flow: FlowName) -> str:
        if flow == FlowName.BOOKING:
            return "booking_intent"
        if flow == FlowName.LOOKUP:
            return "appointment_lookup"
        if flow in {FlowName.CANCEL, FlowName.RESCHEDULE}:
            return "appointment_change"
        if flow == FlowName.OUT_OF_SCOPE:
            return "out_of_scope"
        if flow == FlowName.CONVERSATIONAL:
            if command and command.dialogue_act == "identity":
                return "identity"
            if command and command.dialogue_act == "abuse":
                return "abuse"
            return "social"
        return "unknown"

    @staticmethod
    def _base_metrics() -> dict[str, Any]:
        return {
            "scenario_success_rate": None,
            "end_state_correctness": None,
            "pass_k": None,
            "tool_selection_accuracy": 1,
            "tool_argument_validity": 1,
            "json_schema_validity": 0,
            "invalid_action_rate": 0,
            "forbidden_tool_rate": 0,
            "state_transition_accuracy": 1,
            "policy_compliance_rate": 1,
            "mutation_without_confirmation": 0,
            "ownership_violation": 0,
            "duplicate_tool_call_rate": 0,
            "recovery_after_tool_error_rate": None,
            "turns_to_success": None,
            "clarification_count": 0,
            "llm_calls_per_turn": 0,
            "tokens_per_success": None,
            "timeout_rate": 0,
            "backend_conflict_rate": 0,
            "safe_error_category": None,
            "confirmation_token_replay_blocked_count": 0,
            "confirmation_token_superseded_blocked_count": 0,
            "mutation_attempt_count": 0,
            "mutation_conflict_count": 0,
            "mutation_success_count": 0,
            "read_timeout_recovered_count": 0,
            "read_timeout_exhausted_count": 0,
            "read_permanent_failure_count": 0,
            "payload_validation_failure_count": 0,
            "compound_request_count": 0,
        }

    @staticmethod
    def _safe_appointment_summary(appointment: dict[str, Any]) -> dict[str, Any]:
        clinic = appointment.get("clinic") if isinstance(appointment.get("clinic"), dict) else {}
        room = appointment.get("room") if isinstance(appointment.get("room"), dict) else {}
        service = appointment.get("service") if isinstance(appointment.get("service"), dict) else {}
        return {
            "appointment_id": appointment.get("id") or appointment.get("appointment_id") or appointment.get("appointmentId"),
            "appointment_code": appointment.get("code") or appointment.get("appointment_code") or appointment.get("appointmentCode"),
            "appointment_date": appointment.get("appointment_date") or appointment.get("appointmentDate"),
            "appointment_time": appointment.get("appointment_time") or appointment.get("appointmentTime"),
            "duration_minutes": appointment.get("duration_minutes") or appointment.get("durationMinutes"),
            "status": appointment.get("status"),
            "service_name": appointment.get("service_name") or appointment.get("serviceName") or service.get("service_name") or service.get("serviceName"),
            "doctor_name": appointment.get("doctor_name") or appointment.get("doctorName"),
            "clinic_name": appointment.get("clinic_name") or appointment.get("clinicName") or clinic.get("clinic_name") or clinic.get("clinicName"),
            "room_name": appointment.get("room_name") or appointment.get("roomName") or room.get("room_name") or room.get("roomName"),
        }
