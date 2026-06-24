import httpx
import pytest

from src.confirmation_store import InMemoryConfirmationStore
from src.extractor import OpenAICommandExtractor
from src.http_tools import HttpDomainTools
from src.main import create_app
from src.redis_state import RedisConfirmationStore, RedisConversationStateStore
from src.settings import Settings, build_domain_tools, build_extractor
from tests.test_redis_state import FakeRedis


def test_settings_builds_real_http_tools_by_default():
    settings = Settings(
        emr_base_url="http://emr.test",
        llm_base_url="",
        llm_model="gpt-5-mini",
    )

    tools = build_domain_tools(settings)

    assert isinstance(tools, HttpDomainTools)
    assert tools.emr_base_url == "http://emr.test"


def test_settings_builds_no_extractor_without_api_key():
    settings = Settings(emr_base_url="http://emr.test", llm_api_key="")

    assert build_extractor(settings) is None


def test_default_timeout_allows_strict_openai_responses():
    settings = Settings()

    assert settings.request_timeout_seconds >= 20


def test_default_conversation_state_is_retained_for_multi_step_booking():
    settings = Settings()

    assert settings.conversation_ttl_seconds >= 14_400


def test_settings_builds_openai_extractor_when_api_key_is_set():
    settings = Settings(emr_base_url="http://emr.test", llm_base_url="http://llm.test/v1", llm_api_key="test-key")

    extractor = build_extractor(settings)

    assert isinstance(extractor, OpenAICommandExtractor)
    assert extractor.model == "gpt-4.1-mini"


def test_settings_loads_role_specific_models_with_legacy_response_fallback(monkeypatch):
    monkeypatch.setenv("BOOKING_LANGGRAPH_LLM_MODEL", "gpt-5-mini")
    monkeypatch.setenv("BOOKING_LANGGRAPH_EXTRACTOR_MODEL", "gpt-4.1-mini")

    settings = Settings.from_env()

    assert settings.llm_model == "gpt-5-mini"
    assert settings.extractor_model == "gpt-4.1-mini"
    assert settings.response_model == "gpt-5-mini"


def test_settings_loads_explicit_response_model(monkeypatch):
    monkeypatch.setenv("BOOKING_LANGGRAPH_RESPONSE_MODEL", "gpt-4.1-mini")

    settings = Settings.from_env()

    assert settings.response_model == "gpt-4.1-mini"


def test_settings_load_confirmation_ttl_and_single_worker(monkeypatch):
    monkeypatch.setenv("BOOKING_LANGGRAPH_CONFIRMATION_TTL_SECONDS", "600")
    monkeypatch.setenv("BOOKING_LANGGRAPH_WORKER_COUNT", "1")

    settings = Settings.from_env()

    assert settings.confirmation_ttl_seconds == 600
    assert settings.worker_count == 1


def test_in_memory_confirmation_store_rejects_multiple_workers():
    with pytest.raises(ValueError, match="BOOKING_LANGGRAPH_REDIS_URL"):
        Settings(redis_url="", worker_count=2)


def test_redis_state_store_allows_multiple_workers():
    settings = Settings(redis_url="redis://redis:6379/2", worker_count=2)

    assert settings.redis_url == "redis://redis:6379/2"
    assert settings.worker_count == 2


def test_app_uses_configured_confirmation_ttl():
    settings = Settings(emr_base_url="http://emr.test", redis_url="", confirmation_ttl_seconds=321)

    app = create_app(settings=settings, domain_tools=HttpDomainTools(emr_base_url="http://emr.test"))

    store = app.state.booking_graph.confirmation_store
    assert isinstance(store, InMemoryConfirmationStore)
    assert store.ttl_seconds == 321


def test_app_uses_redis_state_stores_when_configured():
    redis = FakeRedis()
    settings = Settings(
        emr_base_url="http://emr.test",
        redis_url="redis://redis:6379/2",
        confirmation_ttl_seconds=321,
        conversation_ttl_seconds=654,
    )

    app = create_app(
        settings=settings,
        domain_tools=HttpDomainTools(emr_base_url="http://emr.test"),
        redis_client=redis,
    )

    graph = app.state.booking_graph
    assert isinstance(graph.confirmation_store, RedisConfirmationStore)
    assert isinstance(graph.conversation_store, RedisConversationStateStore)
    assert graph.confirmation_store.ttl_seconds == 321
    assert graph.conversation_store.ttl_seconds == 654


@pytest.mark.asyncio
async def test_default_app_uses_real_http_tools_not_in_memory():
    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/appointments/patient/patient-1":
            return httpx.Response(200, json=[])
        return httpx.Response(404, json={"message": "unexpected"})

    settings = Settings(emr_base_url="http://emr.test", redis_url="redis://redis:6379/2", llm_api_key="")
    app = create_app(
        settings=settings,
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
        redis_client=FakeRedis(),
    )

    graph = app.state.booking_graph
    assert isinstance(graph.domain_tools, HttpDomainTools)

    response = await graph.handle_chat(
        request=app.state.schemas.ChatRequest(session_id="s-real", message="Show my appointments"),
        trusted_patient_id="patient-1",
    )

    assert response.actions == ["get_patient_appointments"]
    assert response.safe_state["appointments"] == []
