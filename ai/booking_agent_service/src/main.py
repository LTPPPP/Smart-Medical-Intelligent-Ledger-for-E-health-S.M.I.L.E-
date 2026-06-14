from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException

from .config import Settings
from .schemas import ChatRequest, ChatResponse


def create_app(
    settings: Settings | None = None,
    *,
    test_session_busy: bool = False,
) -> FastAPI:
    runtime_settings = settings or Settings.from_env()

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
        return ChatResponse(
            session_id=request.session_id,
            reply="Mình đã nhận yêu cầu và cần thêm thông tin để tiếp tục.",
            metadata={"patient_context": bool(x_patient_id), "step_budget": runtime_settings.step_budget},
        )

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
