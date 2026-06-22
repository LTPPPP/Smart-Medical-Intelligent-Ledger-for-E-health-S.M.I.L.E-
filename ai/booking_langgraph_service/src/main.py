from __future__ import annotations

import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, Header
from redis import asyncio as redis_asyncio

from .confirmation_store import InMemoryConfirmationStore
from .conversation_state import InMemoryConversationStateStore
from .graph import BookingLangGraph
from .redis_state import RedisConfirmationStore, RedisConversationStateStore
from .schemas import ChatRequest, ChatResponse
from .settings import Settings, build_domain_tools, build_extractor
from .tools import DomainTools, core_domain_tool_specs


def create_app(
    domain_tools: DomainTools | None = None,
    settings: Settings | None = None,
    http_client: httpx.AsyncClient | None = None,
    llm_http_client: httpx.AsyncClient | None = None,
    redis_client=None,
) -> FastAPI:
    settings = settings or Settings.from_env()
    tools = domain_tools or build_domain_tools(settings, http_client=http_client)
    extractor = build_extractor(settings, http_client=llm_http_client)
    owns_emr_client = http_client is None and domain_tools is None
    owns_llm_client = llm_http_client is None and bool(settings.llm_api_key)
    emr_health_client = http_client or httpx.AsyncClient(timeout=settings.request_timeout_seconds)
    llm_health_client = llm_http_client or (
        httpx.AsyncClient(timeout=settings.request_timeout_seconds) if settings.llm_api_key else None
    )
    owns_redis_client = redis_client is None and bool(settings.redis_url)
    state_redis = redis_client or (
        redis_asyncio.from_url(settings.redis_url, decode_responses=True) if settings.redis_url else None
    )
    if state_redis is None and domain_tools is None:
        raise ValueError("BOOKING_LANGGRAPH_REDIS_URL is required for runtime state storage")
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        yield
        if owns_emr_client:
            await emr_health_client.aclose()
        if owns_llm_client and llm_health_client is not None:
            await llm_health_client.aclose()
        if owns_redis_client and state_redis is not None:
            await state_redis.aclose()

    confirmation_store = (
        RedisConfirmationStore(state_redis, ttl_seconds=settings.confirmation_ttl_seconds)
        if state_redis is not None
        else InMemoryConfirmationStore(ttl_seconds=settings.confirmation_ttl_seconds)
    )
    conversation_store = (
        RedisConversationStateStore(state_redis, ttl_seconds=settings.conversation_ttl_seconds)
        if state_redis is not None
        else InMemoryConversationStateStore()
    )

    graph = BookingLangGraph(
        domain_tools=tools,
        extractor=extractor,
        confirmation_store=confirmation_store,
        conversation_store=conversation_store,
    )
    app = FastAPI(title="English LangGraph Booking Agent", version="0.1.0", lifespan=lifespan)
    app.state.booking_graph = graph
    app.state.settings = settings
    app.state.schemas = __import__("src.schemas", fromlist=["ChatRequest"])

    @app.get("/health")
    async def health() -> dict:
        dependencies = {
            "emr": (
                {"status": "injected"}
                if domain_tools is not None
                else await _check_emr(settings, emr_health_client)
            ),
            "llm": await _check_llm(settings, llm_health_client),
        }
        status = "ok" if all(item["status"] in {"ok", "disabled", "injected"} for item in dependencies.values()) else "degraded"
        return {
            "status": status,
            "service": "booking_langgraph_service",
            "framework": "langgraph",
            "model": {
                "provider": settings.llm_provider,
                "primary": settings.llm_model,
                "extractor_enabled": bool(settings.llm_api_key),
            },
            "emr_base_url": settings.emr_base_url,
            "dependencies": dependencies,
            "domain_tools": [spec.name for spec in core_domain_tool_specs()],
        }

    @app.post("/chat", response_model=ChatResponse)
    async def chat(
        request: ChatRequest,
        x_patient_id: str | None = Header(default=None),
    ) -> ChatResponse:
        return await graph.handle_chat(request, trusted_patient_id=x_patient_id)

    return app


app = create_app()


async def _check_emr(settings: Settings, client: httpx.AsyncClient) -> dict:
    try:
        response = await client.get(f"{settings.emr_base_url.rstrip('/')}/api/v1/health")
        if response.status_code == 404:
            response = await client.get(f"{settings.emr_base_url.rstrip('/')}/api/v1/clinics")
        return {"status": "ok" if response.status_code < 500 else "unavailable", "status_code": response.status_code}
    except httpx.HTTPError as exc:
        return {"status": "unavailable", "error": type(exc).__name__}


async def _check_llm(settings: Settings, client: httpx.AsyncClient | None) -> dict:
    if not settings.llm_api_key:
        return {"status": "disabled"}
    if client is None:
        return {"status": "unavailable", "error": "missing_client"}
    try:
        response = await client.get(
            f"{settings.llm_base_url.rstrip('/')}/models/{settings.llm_model}",
            headers={"authorization": f"Bearer {settings.llm_api_key}"},
        )
        return {"status": "ok" if response.status_code < 500 else "unavailable", "status_code": response.status_code}
    except httpx.HTTPError as exc:
        return {"status": "unavailable", "error": type(exc).__name__}
