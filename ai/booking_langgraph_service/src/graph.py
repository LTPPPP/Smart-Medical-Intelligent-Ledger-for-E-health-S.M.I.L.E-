from __future__ import annotations

import time
import uuid
from typing import Any, Awaitable, Callable, Literal, TypeVar, TypedDict

from langgraph.graph import END, START, StateGraph

from .confirmation_store import ConfirmationStore, InMemoryConfirmationStore, PendingConfirmation
from .extractor import StructuredCommandExtractor
from .schemas import AgentCommand, ChatRequest, ChatResponse, ConfirmationRequest, FlowName
from .tool_errors import ReadToolFailure, SafeErrorCategory
from .tools import DomainTools, SideEffectLevel, core_domain_tool_specs


T = TypeVar("T")
DOMAIN_TOOL_SPECS = {spec.name: spec for spec in core_domain_tool_specs()}


class GraphState(TypedDict, total=False):
    request: ChatRequest
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


class BookingLangGraph:
    def __init__(
        self,
        domain_tools: DomainTools,
        extractor: StructuredCommandExtractor | None = None,
        confirmation_store: ConfirmationStore | None = None,
    ) -> None:
        self.domain_tools = domain_tools
        self.extractor = extractor
        self.confirmation_store = confirmation_store or InMemoryConfirmationStore()
        self.graph = self._build_graph()

    async def handle_chat(self, request: ChatRequest, trusted_patient_id: str | None) -> ChatResponse:
        initial: GraphState = {
            "request": request,
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
                "fallback_flow": "fallback_flow",
            },
        )
        for node in ("lookup_flow", "booking_flow", "cancel_flow", "reschedule_flow", "confirmation_flow", "fallback_flow"):
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
        if self.extractor is not None:
            state["metrics"]["llm_calls_per_turn"] = 1
            if self.extractor.last_error:
                state["metrics"]["extractor_failure_class"] = self.extractor.last_error
                state["metrics"]["timeout_rate"] = 1 if self.extractor.last_error in {"ReadTimeout", "TimeoutException"} else 0
        slots = dict(state.get("slots", {}))
        for update in command.slot_updates:
            slots[update.name] = update.value
        state["command"] = command
        state["flow"] = command.intent
        state["slots"] = slots
        state["metrics"]["json_schema_validity"] = 1
        return state

    def _route_after_extract(
        self, state: GraphState
    ) -> Literal["lookup_flow", "booking_flow", "cancel_flow", "reschedule_flow", "confirmation_flow", "fallback_flow"]:
        request = state["request"]
        if request.confirmation_token:
            return "confirmation_flow"
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
        except ReadToolFailure:
            return self._safe_read_failure(state)
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
        state["actions"].append("find_booking_options")
        try:
            options = await self._call_read(
                state,
                "find_booking_options",
                lambda: self.domain_tools.find_booking_options(patient_id, state["slots"]),
            )
        except ReadToolFailure:
            return self._safe_read_failure(state)
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
        option = options[0]
        state["slots"]["booking_option_id"] = option["id"]
        state["actions"].append("prepare_booking")
        state["confirmation"] = await self._create_confirmation(
            state,
            flow=FlowName.BOOKING,
            action="commit_booking",
            summary=f"Book {option['summary']}",
            payload={"booking_option_id": option["id"]},
        )
        state["safe_state"] = {"booking_option": option}
        state["reply"] = f"I found this option: {option['summary']} Please confirm if you want me to book it."
        return state

    async def _cancel_flow(self, state: GraphState) -> GraphState:
        state["graph_path"].append("cancel_flow")
        state["flow"] = FlowName.CANCEL
        patient_id = state.get("trusted_patient_id")
        if not patient_id:
            state["reply"] = "Please sign in before I can cancel an appointment."
            state["metrics"]["policy_compliance_rate"] = 1
            return state
        try:
            appointment = await self._resolve_appointment(state, patient_id)
        except ReadToolFailure:
            return self._safe_read_failure(state)
        if not appointment:
            state["reply"] = "I could not find that appointment. Please provide the appointment code."
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
            state["metrics"]["policy_compliance_rate"] = 1
            return state
        try:
            appointment = await self._resolve_appointment(state, patient_id)
        except ReadToolFailure:
            return self._safe_read_failure(state)
        if not appointment:
            state["reply"] = "I could not find that appointment. Please provide the appointment code."
            return state
        state["actions"].append("find_booking_options")
        try:
            options = await self._call_read(
                state,
                "find_booking_options",
                lambda: self.domain_tools.find_booking_options(patient_id, state["slots"]),
            )
        except ReadToolFailure:
            return self._safe_read_failure(state)
        if not options:
            state["reply"] = "I could not find an available reschedule option."
            state["metrics"]["backend_conflict_rate"] = 1
            return state
        option = options[0]
        state["actions"].append("prepare_reschedule")
        state["confirmation"] = await self._create_confirmation(
            state,
            flow=FlowName.RESCHEDULE,
            action="commit_reschedule",
            summary=f"Move appointment {appointment['code']} to {option['summary']}",
            payload={"appointment_id": appointment["id"], "booking_option_id": option["id"]},
        )
        state["safe_state"] = {"appointment_id": appointment["id"], "booking_option": option}
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
                await self.domain_tools.commit_cancel(patient_id, payload["appointment_id"], request.confirmation_token or "")
                state["reply"] = "The appointment has been cancelled."
            elif action == "commit_booking":
                state["actions"].append("commit_booking")
                state["metrics"]["mutation_attempt_count"] = 1
                await self.domain_tools.commit_booking(patient_id, payload["booking_option_id"], request.confirmation_token or "")
                state["reply"] = "The appointment has been booked."
            elif action == "commit_reschedule":
                state["actions"].append("commit_reschedule")
                state["metrics"]["mutation_attempt_count"] = 1
                await self.domain_tools.commit_reschedule(
                    patient_id,
                    payload["appointment_id"],
                    payload["booking_option_id"],
                    request.confirmation_token or "",
                )
                state["reply"] = "The appointment has been rescheduled."
            else:
                state["reply"] = "I could not apply that confirmation."
                state["metrics"]["invalid_action_rate"] = 1
            if state["metrics"]["mutation_attempt_count"]:
                state["metrics"]["mutation_success_count"] = 1
        except RuntimeError:
            state["reply"] = (
                "I could not complete that change because the backend reported a conflict. "
                "Please choose another option."
            )
            state["metrics"]["backend_conflict_rate"] = 1
            state["metrics"]["mutation_conflict_count"] = 1
            state["metrics"]["safe_error_category"] = "commit_conflict"
        state["confirmation"] = None
        return state

    async def _fallback_flow(self, state: GraphState) -> GraphState:
        state["graph_path"].append("fallback_flow")
        state["flow"] = FlowName.UNKNOWN
        state["reply"] = "I can help you look up, book, cancel, or reschedule an appointment. Which one would you like?"
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
        except TimeoutError:
            try:
                result = await call()
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
        }

    @staticmethod
    def _safe_appointment_summary(appointment: dict[str, Any]) -> dict[str, Any]:
        clinic = appointment.get("clinic") if isinstance(appointment.get("clinic"), dict) else {}
        return {
            "appointment_id": appointment.get("id") or appointment.get("appointment_id") or appointment.get("appointmentId"),
            "appointment_code": appointment.get("code") or appointment.get("appointment_code") or appointment.get("appointmentCode"),
            "appointment_date": appointment.get("appointment_date") or appointment.get("appointmentDate"),
            "appointment_time": appointment.get("appointment_time") or appointment.get("appointmentTime"),
            "status": appointment.get("status"),
            "clinic_name": clinic.get("clinic_name") or clinic.get("clinicName"),
        }
