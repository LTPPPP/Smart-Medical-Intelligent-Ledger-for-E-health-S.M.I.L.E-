from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Header, HTTPException

from .config import Settings
from .emr_client import ClinicalEmrClient
from .graph import BookingAgentGraph
from .llm_client import VllmPlanner
from .locks import InMemorySessionLock, RedisSessionLock
from .memory import InMemoryStateStore
from .schemas import ChatRequest, ChatResponse
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


def create_app(
    settings: Settings | None = None,
    *,
    test_session_busy: bool = False,
    state_store: Any | None = None,
    session_lock: Any | None = None,
    graph: Any | None = None,
) -> FastAPI:
    runtime_settings = settings or Settings.from_env()
    runtime_store = state_store or InMemoryStateStore()
    runtime_lock = session_lock or build_default_session_lock(runtime_settings)
    runtime_graph = graph
    if runtime_graph is None:
        emr_client = ClinicalEmrClient(runtime_settings)
        runtime_graph = BookingAgentGraph(
            planner=VllmPlanner(runtime_settings),
            tool_registry=ToolRegistry(emr_client),
            step_budget=runtime_settings.step_budget,
        )

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
            state = runtime_store.get(request.session_id)
            if x_patient_id:
                state.patient_id = x_patient_id
            result = await runtime_graph.run_turn(state, request.message)
            runtime_store.save(state)
            return ChatResponse(
                session_id=request.session_id,
                reply=result.reply,
                metadata=result.metadata,
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


app = create_app()
