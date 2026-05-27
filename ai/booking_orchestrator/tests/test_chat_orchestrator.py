from src.agent.chat_orchestrator import ChatOrchestrator
from src.llm.fake import FakeLLMClient
from src.schemas.chat import ChatRequest
from src.tools.executor import ToolExecutor


class RecordingLLMClient:
    def __init__(self):
        self.messages = []

    def chat(self, messages, tools, tool_choice=None):
        self.messages = messages
        return {"choices": [{"message": {"role": "assistant", "content": "ok"}}]}

    def parse_tool_call(self, response):
        return None


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


def test_chat_metadata_includes_contextual_routing_decision():
    orchestrator = ChatOrchestrator(tool_executor=ToolExecutor())

    response = orchestrator.process(
        ChatRequest(session_id="session-1", message="Giữ slot đó giúp tôi")
    )

    assert response.metadata["routing"]["decision"] == "ASK_FOR_MISSING_INFO"
    assert response.metadata["routing"]["pending_action"] == "hold_slot"
    assert response.metadata["routing"]["missing_fields"] == ["selected_slot_id"]


def test_chat_rejects_llm_confirm_when_policy_marks_hold_missing():
    orchestrator = ChatOrchestrator(
        tool_executor=ToolExecutor(),
        llm_client=FakeLLMClient(
            tool_name="confirm_booking",
            arguments={
                "hold_id": "20000000-0000-0000-0000-000000000001",
                "patient_session_id": "session-1",
                "service_id": "30000000-0000-0000-0000-000000000001",
                "patient": {"full_name": "Nguyen Van A", "phone": "0900000000"},
            },
        ),
        llm_enabled=True,
    )

    response = orchestrator.process(
        ChatRequest(session_id="session-1", message="Xác nhận lịch giúp tôi")
    )

    assert response.metadata["routing"]["decision"] == "ASK_FOR_MISSING_INFO"
    assert response.metadata["tool_result"]["success"] is False
    assert response.metadata["tool_result"]["error_code"] == "TOOL_NOT_ALLOWED"


def test_chat_includes_conversation_state_in_llm_context():
    llm = RecordingLLMClient()
    orchestrator = ChatOrchestrator(
        tool_executor=ToolExecutor(),
        llm_client=llm,
        llm_enabled=True,
    )

    orchestrator.process(
        ChatRequest(
            session_id="session-1",
            message="Giữ slot đó giúp tôi",
            conversation_state={
                "selected_slot_id": "10000000-0000-0000-0000-000000000001"
            },
        )
    )

    llm_context = "\n".join(message["content"] for message in llm.messages)
    assert "conversation_state" in llm_context
    assert "selected_slot_id" in llm_context
    assert "10000000-0000-0000-0000-000000000001" in llm_context


def test_system_prompt_prevents_llm_identifier_hallucination():
    prompt = ChatOrchestrator._system_prompt(["get_available_slots"])

    assert "Never invent UUIDs" in prompt
    assert "unknown optional IDs" in prompt
    assert "YYYY-MM-DD" in prompt
    assert "Do not call hold_slot without a backend slot_id" in prompt
    assert "Do not call confirm_booking without a backend hold_id" in prompt
