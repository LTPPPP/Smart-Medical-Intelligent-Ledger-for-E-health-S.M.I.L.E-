from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from datetime import date
import inspect
from typing import Any

from fastapi import FastAPI, Header, HTTPException

from .config import Settings
from .emr_client import ClinicalEmrClient
from .graph import BookingAgentGraph
from .llm_client import VllmPlanner
from .locks import InMemorySessionLock, RedisSessionLock
from .memory import InMemoryStateStore, RedisStateStore
from .schemas import ChatRequest, ChatResponse, ConfirmationWidget
from .session_context import extract_patient_context
from .slot_extractor import SlotExtractor
from .state import PatientProfile
from .tools import ToolRegistry


def build_default_session_lock(settings: Settings) -> InMemorySessionLock | RedisSessionLock:
    try:
        import redis.asyncio as redis

        return RedisSessionLock(
            redis.from_url(settings.redis_url),
            ttl_seconds=settings.session_lock_ttl_seconds,
        )
    except Exception:
        return InMemorySessionLock(ttl_seconds=settings.session_lock_ttl_seconds)


def build_default_state_store(settings: Settings) -> InMemoryStateStore | RedisStateStore:
    try:
        import redis.asyncio as redis

        return RedisStateStore(
            redis.from_url(settings.redis_url),
            ttl_seconds=settings.session_ttl_seconds,
        )
    except Exception:
        return InMemoryStateStore()


async def _maybe_await(value: Any) -> Any:
    if inspect.isawaitable(value):
        return await value
    return value


def create_app(
    settings: Settings | None = None,
    *,
    test_session_busy: bool = False,
    state_store: Any | None = None,
    session_lock: Any | None = None,
    graph: Any | None = None,
    slot_extractor: Any | None = None,
) -> FastAPI:
    runtime_settings = settings or Settings.from_env()
    runtime_store = state_store or build_default_state_store(runtime_settings)
    runtime_lock = session_lock or build_default_session_lock(runtime_settings)
    runtime_graph = graph
    if runtime_graph is None:
        emr_client = ClinicalEmrClient(runtime_settings)
        runtime_graph = BookingAgentGraph(
            planner=VllmPlanner(runtime_settings),
            tool_registry=ToolRegistry(emr_client),
            step_budget=runtime_settings.step_budget,
        )
    runtime_slot_extractor = slot_extractor
    if runtime_slot_extractor is None and runtime_settings.pipeline_mode in {"shadow", "v2"}:
        runtime_slot_extractor = SlotExtractor(runtime_settings)

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        runtime_settings.validate_runtime()
        yield

    app = FastAPI(
        title="S.M.I.L.E Booking Agent Service",
        version="0.1.0",
        lifespan=lifespan,
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "service": "booking-agent-service"}

    @app.post("/chat", response_model=ChatResponse)
    async def chat(
        request: ChatRequest,
        x_patient_id: str | None = Header(default=None),
        x_patient_name: str | None = Header(default=None),
        x_patient_phone: str | None = Header(default=None),
    ) -> ChatResponse:
        if test_session_busy:
            raise HTTPException(
                status_code=429,
                detail={
                    "error_code": "SESSION_BUSY",
                    "message": "Session is processing another turn.",
                    "retryable": True,
                },
            )
        patient_ctx = extract_patient_context(
            x_patient_id,
            x_patient_name=x_patient_name,
            x_patient_phone=x_patient_phone,
        )
        if x_patient_id is not None and patient_ctx is None:
            raise HTTPException(
                status_code=400,
                detail={
                    "error_code": "INVALID_PATIENT_CONTEXT",
                    "message": "Invalid patient context.",
                    "retryable": False,
                },
            )
        lease = await runtime_lock.acquire(request.session_id)
        if not lease.acquired:
            raise HTTPException(
                status_code=429,
                detail={
                    "error_code": "SESSION_BUSY",
                    "message": "Session is processing another turn.",
                    "retryable": True,
                },
            )
        try:
            state = await _maybe_await(runtime_store.get(request.session_id))
            if patient_ctx:
                state.patient_id = patient_ctx.patient_id
                if state.profile is None:
                    state.profile = PatientProfile(
                        patient_id=patient_ctx.patient_id,
                        display_name=patient_ctx.display_name,
                        masked_phone=patient_ctx.masked_phone,
                    )
            effective_message = request.message
            if request.confirm_token is not None and request.confirmed is not None:
                effective_message = "xac nhan" if request.confirmed else "khong dong y"
            shadow_metadata: dict[str, Any] | None = None
            if runtime_settings.pipeline_mode == "shadow" and runtime_slot_extractor is not None:
                shadow_metadata = await _shadow_v2_metadata(
                    state,
                    effective_message,
                    runtime_slot_extractor,
                    runtime_settings.shadow_timeout_seconds,
                )
            if runtime_settings.pipeline_mode == "v2" and runtime_slot_extractor is not None:
                result = await runtime_graph.run_turn_v2(
                    state,
                    effective_message,
                    runtime_slot_extractor,
                    date.today().isoformat(),
                )
            else:
                result = await runtime_graph.run_turn(state, effective_message)
            await _maybe_await(runtime_store.save(state))
            metadata = {
                **result.metadata,
                "tool_calls": list(getattr(result, "tool_calls", [])),
                "pending_mutation": bool(getattr(result, "pending_mutation", False)),
            }
            if shadow_metadata is not None:
                metadata["shadow_v2"] = shadow_metadata
            confirmation_widget = None
            if result.pending_mutation and state.pending_confirmation is not None:
                pending = state.pending_confirmation
                confirmation_widget = ConfirmationWidget(
                    confirm_token=pending.confirmation_id,
                    operation=pending.operation,
                    summary_text=pending.summary,
                    expires_at=pending.expires_at.isoformat(),
                )
            return ChatResponse(
                session_id=request.session_id,
                reply=result.reply,
                metadata=metadata,
                confirmation=confirmation_widget,
            )
        finally:
            await lease.release()

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_, exc: HTTPException):
        from fastapi.responses import JSONResponse

        if isinstance(exc.detail, dict):
            return JSONResponse(status_code=exc.status_code, content=exc.detail)
        return JSONResponse(
            status_code=exc.status_code,
            content={"error_code": "HTTP_ERROR", "message": str(exc.detail), "retryable": False},
        )

    return app


async def _shadow_v2_metadata(
    state: Any,
    message: str,
    slot_extractor: Any,
    timeout_seconds: float,
) -> dict[str, Any]:
    from .dispatcher import build_dispatch_plan

    shadow_state = state.model_copy(deep=True) if hasattr(state, "model_copy") else state
    try:
        extracted = await asyncio.wait_for(
            slot_extractor.extract(
                message,
                recent_turns=list(getattr(shadow_state, "recent_turns", [])),
                current_date_iso=date.today().isoformat(),
            ),
            timeout=timeout_seconds,
        )
        original_hints = {
            "specialty": extracted.specialty,
            "doctor_hint": extracted.doctor_hint,
            "clinic_hint": extracted.clinic_hint,
            "date_hint": extracted.date_hint,
            "time_hint": extracted.time_hint,
            "appointment_ref": extracted.appointment_ref,
            "missing_slots": list(extracted.missing_slots),
        }
        BookingAgentGraph._augment_missing_text_hints(
            extracted,
            message,
            list(getattr(shadow_state, "recent_turns", [])),
        )
        BookingAgentGraph._merge_text_hints(shadow_state, extracted)
        intent_to_goal = {
            "book": "booking",
            "cancel": "cancel",
            "reschedule": "reschedule",
            "lookup": "lookup",
        }
        if extracted.intent in intent_to_goal:
            shadow_state.switch_goal(intent_to_goal[extracted.intent])
        plan = build_dispatch_plan(extracted, shadow_state)
        return {
            "intent": extracted.intent,
            "confidence": extracted.confidence,
            "hints": original_hints,
            "plan_tools": [
                tool_call.name
                for group in plan.groups
                for tool_call in group
            ],
            "clarification_needed": plan.clarification_needed,
        }
    except Exception as error:
        return {"error": error.__class__.__name__}


app = create_app()
