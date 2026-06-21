import httpx
import pytest

from src.extractor import StructuredCommandExtractor
from src.http_tools import HttpDomainTools
from src.main import create_app
from src.settings import Settings, build_domain_tools, build_extractor


def test_settings_builds_real_http_tools_by_default():
    settings = Settings(
        emr_base_url="http://emr.test",
        llm_base_url="",
        llm_model="Qwen/Qwen3.5-4B",
    )

    tools = build_domain_tools(settings)

    assert isinstance(tools, HttpDomainTools)
    assert tools.emr_base_url == "http://emr.test"


def test_settings_builds_no_extractor_when_llm_url_is_empty():
    settings = Settings(emr_base_url="http://emr.test", llm_base_url="")

    assert build_extractor(settings) is None


def test_settings_builds_structured_extractor_when_llm_url_is_set():
    settings = Settings(emr_base_url="http://emr.test", llm_base_url="http://llm.test/v1")

    extractor = build_extractor(settings)

    assert isinstance(extractor, StructuredCommandExtractor)


@pytest.mark.asyncio
async def test_default_app_uses_real_http_tools_not_in_memory():
    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/appointments/patient/patient-1":
            return httpx.Response(200, json=[])
        return httpx.Response(404, json={"message": "unexpected"})

    settings = Settings(emr_base_url="http://emr.test", llm_base_url="")
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
