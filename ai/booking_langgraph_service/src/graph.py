from __future__ import annotations

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
        state["slots"].pop("booking_option_id", None)
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
                lambda: self.domain_tools.get_patient_appointments(patient_id),
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
        state["actions"].append("find_booking_options")
        try:
            options = await self._call_read(
                state,
                "find_booking_options",
                lambda: self.domain_tools.find_booking_options(
                    patient_id,
                    state["slots"],
                ),
            )
            options = self._validate_booking_options(options)
        except ReadToolFailure:
            return self._safe_read_failure(state)
        except MalformedToolPayload:
            return self._safe_malformed_failure(state)
        if not options:
            if not self._has_booking_search_constraints(state["slots"]):
                state["reply"] = (
                    "Please share a preferred date, clinic, doctor, or service so I can find a suitable appointment."
                )
                state["metrics"]["clarification_count"] = 1
            else:
                state["reply"] = "I could not find an available appointment option. Please share another date or clinic."
                state["metrics"]["backend_conflict_rate"] = 1
            return state
        option = self._selected_booking_option(options, state["slots"].get("booking_option_id"))
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
            if state["slots"].get("appointment_ref"):
                return self._safe_appointment_unavailable(state, SafeErrorCategory.OWNERSHIP_SAFE_UNAVAILABLE)
            state["reply"] = "I could not find that appointment. Please provide the appointment code."
            state["metrics"]["clarification_count"] = 1
            return state
        state["actions"].append("find_booking_options")
        try:
            options = await self._call_read(
                state,
                "find_booking_options",
                lambda: self.domain_tools.find_booking_options(
                    patient_id,
                    state["slots"],
                ),
            )
            options = self._validate_booking_options(options)
        except ReadToolFailure:
            return self._safe_read_failure(state)
        except MalformedToolPayload:
            return self._safe_malformed_failure(state)
        if not options:
            state["reply"] = "I could not find an available reschedule option."
            state["metrics"]["backend_conflict_rate"] = 1
            return state
        option = self._selected_booking_option(options, state["slots"].get("booking_option_id"))
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
            lambda: self.domain_tools.resolve_appointment_reference(patient_id, appointment_ref),
        )
        if appointment:
            appointment = self._validate_resolved_appointment(appointment)
            if str(appointment.get("status") or "").lower() == "cancelled":
                raise NonActionableAppointment(appointment_ref)
            state["slots"]["appointment_id"] = appointment["id"]
        return appointment

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
        if not selected_option_id:
            return options[0] if options else None
        return next((option for option in options if option.get("id") == selected_option_id), None)

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

    async def _persist_conversation_state(self, state: GraphState) -> None:
        request = state["request"]
        patient_id = state.get("trusted_patient_id")
        if request.confirmation_token or state.get("conversation_abort"):
            await self.conversation_store.clear(request.session_id, patient_id)
            return
        flow = state.get("flow")
        has_active_turn = state.get("confirmation") is not None or bool(
            state["metrics"].get("clarification_count")
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
    def _is_specific_date_hint(value: Any) -> bool:
        if not isinstance(value, str) or not value.strip():
            return False
        text = value.strip().lower()
        vague_terms = ("earliest", "soon", "available", "any", "asap", "as soon as possible", "whenever")
        return not any(term in text for term in vague_terms)

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
        elif flow == FlowName.BOOKING and safe_facts.get("booking_option"):
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
                safe_facts["required_information"] = ["the appointment code and preferred new date or time"]
            elif flow == FlowName.BOOKING:
                safe_facts["required_information"] = ["a preferred date, clinic, doctor, or dental service"]
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
