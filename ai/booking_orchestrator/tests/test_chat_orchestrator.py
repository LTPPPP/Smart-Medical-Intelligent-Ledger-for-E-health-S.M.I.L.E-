from datetime import date, timedelta

from src.agent.chat_orchestrator import ChatOrchestrator
from src.agent.intent_classifier import IntentClassification
from src.llm.fake import FakeLLMClient
from src.schemas.chat import ChatRequest
from src.tools.executor import ToolExecutor
from src.tools.schemas import ToolOutput


class RecordingLLMClient:
    def __init__(self):
        self.messages = []

    def chat(self, messages, tools, tool_choice=None):
        self.messages = messages
        return {"choices": [{"message": {"role": "assistant", "content": "ok"}}]}

    def parse_tool_call(self, response):
        return None


class RecordingToolExecutor:
    def __init__(self):
        self.calls = []

    def execute(self, tool_name, arguments):
        self.calls.append((tool_name, arguments))
        return ToolOutput(
            success=True,
            data={
                "success": True,
                "data": arguments,
            },
        )


class FakeIntentClassifier:
    def __init__(self, classification: IntentClassification):
        self.classification = classification

    def classify(self, message, conversation_state):
        return self.classification


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


def test_chat_composes_service_answer_from_tool_result():
    orchestrator = ChatOrchestrator(
        tool_executor=ToolExecutor(),
        llm_client=FakeLLMClient(tool_name="get_services", arguments={}),
        llm_enabled=True,
    )

    response = orchestrator.process(
        ChatRequest(
            session_id="session-1",
            message="Chào bạn, phòng khám có dịch vụ gì vậy nhỉ?",
        )
    )

    assert "Cạo vôi răng" in response.assistant_response
    assert "45 phút" in response.assistant_response
    assert "Khám răng tổng quát" in response.assistant_response


def test_chat_routes_general_vietnamese_symptom_advice_to_safety():
    orchestrator = ChatOrchestrator(
        tool_executor=ToolExecutor(),
        intent_classifier=FakeIntentClassifier(
            IntentClassification(
                intent="safety",
                confidence=0.9,
                requires_clinical_triage=True,
                reason="semantic_symptom",
            )
        ),
        llm_client=FakeLLMClient(),
        llm_enabled=True,
    )

    response = orchestrator.process(
        ChatRequest(session_id="session-1", message="anh nhức đầu quá em ơi")
    )

    assert response.selected_profile == "SAFETY_PROFILE"
    assert "không thể chẩn đoán hoặc kê thuốc" in response.assistant_response
    assert "semantic_intent_classifier" in response.metadata["risk"]["data"]["matched_keywords"]


def test_chat_uses_semantic_classifier_for_unseen_symptom_language():
    orchestrator = ChatOrchestrator(
        tool_executor=ToolExecutor(),
        intent_classifier=FakeIntentClassifier(
            IntentClassification(
                intent="safety",
                confidence=0.82,
                requires_clinical_triage=True,
                reason="nguoi_dung_mo_ta_cam_giac_kho_chiu_o_nuou",
            )
        ),
        llm_client=FakeLLMClient(),
        llm_enabled=True,
    )

    response = orchestrator.process(
        ChatRequest(session_id="session-1", message="cảm giác nướu đang rất khó chịu")
    )

    assert response.selected_profile == "SAFETY_PROFILE"
    assert response.metadata["llm"]["used"] is False
    assert response.metadata["routing"]["reason"] == "semantic_safety_intent"
    assert response.metadata["intent_classifier"]["requires_clinical_triage"] is True
    assert response.metadata["risk"]["data"]["risk_level"] == "HIGH"
    assert "semantic_intent_classifier" in response.metadata["risk"]["data"]["matched_keywords"]


def test_chat_does_not_let_llm_drive_safety_tool_arguments():
    orchestrator = ChatOrchestrator(
        tool_executor=ToolExecutor(),
        intent_classifier=FakeIntentClassifier(
            IntentClassification(
                intent="safety",
                confidence=0.9,
                requires_clinical_triage=True,
                reason="semantic_symptom",
            )
        ),
        llm_client=FakeLLMClient(
            tool_name="create_handoff_ticket",
            arguments={"session_id": "session-1", "source_message": None, "summary": None},
        ),
        llm_enabled=True,
    )

    response = orchestrator.process(
        ChatRequest(session_id="session-1", message="cảm giác nướu đang rất khó chịu")
    )

    assert response.selected_profile == "SAFETY_PROFILE"
    assert response.metadata["llm"] == {"used": False}
    assert "tool_result" not in response.metadata
    assert response.metadata["risk"]["success"] is True


def test_chat_ignores_low_confidence_semantic_classifier_result():
    orchestrator = ChatOrchestrator(
        tool_executor=ToolExecutor(),
        intent_classifier=FakeIntentClassifier(
            IntentClassification(
                intent="safety",
                confidence=0.31,
                requires_clinical_triage=True,
                reason="low_confidence",
            )
        ),
        llm_client=FakeLLMClient(),
        llm_enabled=True,
    )

    response = orchestrator.process(
        ChatRequest(session_id="session-1", message="phòng khám mở cửa lúc mấy giờ")
    )

    assert response.selected_profile == "INFO_PROFILE"


def test_chat_answers_scope_limit_for_classifier_out_of_scope_intent():
    orchestrator = ChatOrchestrator(
        tool_executor=ToolExecutor(),
        intent_classifier=FakeIntentClassifier(
            IntentClassification(
                intent="out_of_scope",
                confidence=0.92,
                requires_clinical_triage=False,
                reason="unsupported_capability",
            )
        ),
        llm_client=FakeLLMClient(tool_name="create_handoff_ticket", arguments={}),
        llm_enabled=True,
    )

    response = orchestrator.process(
        ChatRequest(session_id="session-1", message="nội dung ngoài phạm vi hệ thống")
    )

    assert response.selected_profile == "INFO_PROFILE"
    assert response.metadata["routing"]["reason"] == "semantic_out_of_scope"
    assert response.metadata["llm"] == {"used": False}
    assert "ngoài phạm vi" in response.assistant_response
    assert "risk" not in response.metadata


def test_chat_normalizes_vietnamese_relative_date_before_tool_execution():
    executor = RecordingToolExecutor()
    orchestrator = ChatOrchestrator(
        tool_executor=executor,
        llm_client=FakeLLMClient(
            tool_name="get_available_slots",
            arguments={"date": "2023-05-18", "dentist_id": ""},
        ),
        llm_enabled=True,
    )

    orchestrator.process(
        ChatRequest(session_id="session-1", message="Tôi muốn đặt lịch khám ngày mai")
    )

    assert executor.calls[0][0] == "get_available_slots"
    assert executor.calls[0][1]["date"] == (date.today() + timedelta(days=1)).isoformat()
    assert executor.calls[0][1]["dentist_id"] is None


def test_chat_executes_ready_hold_when_llm_skips_tool_call():
    executor = RecordingToolExecutor()
    orchestrator = ChatOrchestrator(
        tool_executor=executor,
        llm_client=FakeLLMClient(),
        llm_enabled=True,
    )

    response = orchestrator.process(
        ChatRequest(
            session_id="session-1",
            message="Giữ slot đó giúp tôi",
            conversation_state={
                "patient_session_id": "session-1",
                "selected_slot_id": "10000000-0000-0000-0000-000000000001",
            },
        )
    )

    assert response.metadata["llm"]["tool_call"]["name"] == "hold_slot"
    assert response.metadata["llm"]["tool_call"]["source"] == "deterministic_router"
    assert executor.calls == [
        (
            "hold_slot",
            {
                "slot_id": "10000000-0000-0000-0000-000000000001",
                "patient_session_id": "session-1",
                "ttl_seconds": 300,
            },
        )
    ]


def test_chat_completes_partial_hold_tool_call_from_trusted_state():
    executor = RecordingToolExecutor()
    orchestrator = ChatOrchestrator(
        tool_executor=executor,
        llm_client=FakeLLMClient(
            tool_name="hold_slot",
            arguments={"slot_id": "10000000-0000-0000-0000-000000000001"},
        ),
        llm_enabled=True,
    )

    orchestrator.process(
        ChatRequest(
            session_id="session-1",
            message="Giữ slot đó giúp tôi",
            conversation_state={
                "patient_session_id": "session-1",
                "selected_slot_id": "10000000-0000-0000-0000-000000000001",
            },
        )
    )

    assert executor.calls == [
        (
            "hold_slot",
            {
                "slot_id": "10000000-0000-0000-0000-000000000001",
                "patient_session_id": "session-1",
                "ttl_seconds": 300,
            },
        )
    ]


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


def test_chat_does_not_call_llm_when_policy_blocks_confirm_for_missing_hold():
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
    assert response.metadata["llm"] == {"used": False}
    assert "tool_result" not in response.metadata


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

    assert "Không tự bịa UUID" in prompt
    assert "giá trị chưa biết" in prompt
    assert "YYYY-MM-DD" in prompt
    assert "không gọi hold_slot khi chưa có slot_id" in prompt
    assert "không gọi confirm_booking khi chưa có hold_id" in prompt
