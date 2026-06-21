import httpx
import pytest

from src.extractor import OpenAICommandExtractor
from src.http_tools import HttpDomainTools
from src.main import create_app
from src.settings import Settings, build_domain_tools, build_extractor


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


def test_settings_builds_openai_extractor_when_api_key_is_set():
    settings = Settings(emr_base_url="http://emr.test", llm_base_url="http://llm.test/v1", llm_api_key="test-key")

    extractor = build_extractor(settings)

    assert isinstance(extractor, OpenAICommandExtractor)


@pytest.mark.asyncio
async def test_default_app_uses_real_http_tools_not_in_memory():
    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/appointments/patient/patient-1":
            return httpx.Response(200, json=[])
        return httpx.Response(404, json={"message": "unexpected"})

    settings = Settings(emr_base_url="http://emr.test", llm_api_key="")
    app = create_app(
        settings=settings,
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    graph = app.state.booking_graph
    assert isinstance(graph.domain_tools, HttpDomainTools)

    response = await graph.handle_chat(
        request=app.state.schemas.ChatRequest(session_id="s-real", message="Show my appointments"),
        trusted_patient_id="patient-1",
    )

    assert response.actions == ["get_patient_appointments"]
    assert response.safe_state["appointments"] == []
