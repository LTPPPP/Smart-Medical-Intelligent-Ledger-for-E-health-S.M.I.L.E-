from src.agent.chat_orchestrator import ChatOrchestrator
from src.llm.fake import FakeLLMClient
from src.schemas.chat import ChatRequest
from src.tools.executor import ToolExecutor


def test_chat_uses_vllm_compatible_tool_call_when_enabled():
    orchestrator = ChatOrchestrator(
        tool_executor=ToolExecutor(),
        llm_client=FakeLLMClient(tool_name="get_services", arguments={}),
        llm_enabled=True,
    )

    response = orchestrator.process(
        ChatRequest(session_id="session-1", message="What services do you offer?")
    )

    assert response.metadata["llm"]["used"] is True
    assert response.metadata["llm"]["tool_call"]["name"] == "get_services"
    assert response.metadata["tool_result"]["success"] is True
    assert response.metadata["tool_result"]["data"][0]["service_code"] == "teeth_cleaning"


def test_chat_rejects_llm_tool_call_outside_selected_profile():
    orchestrator = ChatOrchestrator(
        tool_executor=ToolExecutor(),
        llm_client=FakeLLMClient(tool_name="confirm_booking", arguments={}),
        llm_enabled=True,
    )

    response = orchestrator.process(
        ChatRequest(session_id="session-2", message="What are your opening hours?")
    )

    assert response.metadata["llm"]["used"] is True
    assert response.metadata["tool_result"]["success"] is False
    assert response.metadata["tool_result"]["error_code"] == "TOOL_NOT_ALLOWED"
