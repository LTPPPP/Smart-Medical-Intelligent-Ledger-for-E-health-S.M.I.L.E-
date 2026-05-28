import json
from datetime import date, timedelta
from typing import Any

from src.agent.conversation_state import ConversationState
from src.agent.intent_classifier import IntentClassification, IntentClassifier
from src.agent.tool_router import ToolProfile, ToolProfileSelector
from src.llm.client import LLMClient
from src.schemas.chat import ChatRequest, ChatResponse
from src.tools.executor import ToolExecutor
from src.tools.schemas import ToolOutput, openai_tool_definitions


class ChatOrchestrator:
    def __init__(
        self,
        tool_executor: ToolExecutor,
        profile_selector: ToolProfileSelector | None = None,
        intent_classifier: IntentClassifier | None = None,
        llm_client: LLMClient | None = None,
        llm_enabled: bool = False,
    ) -> None:
        self.tool_executor = tool_executor
        self.profile_selector = profile_selector or ToolProfileSelector()
        self.intent_classifier = intent_classifier
        self.llm_client = llm_client
        self.llm_enabled = llm_enabled

    def process(self, request: ChatRequest) -> ChatResponse:
        intent_classification = self._classify_intent(request)
        selection = self.profile_selector.select_profile(
            latest_user_message=request.message,
            conversation_state=request.conversation_state,
            detected_intent=(
                intent_classification.intent
                if intent_classification and intent_classification.is_actionable
                else None
            ),
        )
        tool_definitions = openai_tool_definitions(selection.tools)
        metadata: dict[str, Any] = {
            "tool_schemas": tool_definitions,
            "matched_keywords": selection.matched_keywords,
            "routing": selection.routing.model_dump(),
            "llm": {"used": False},
        }
        if intent_classification:
            metadata["intent_classifier"] = intent_classification.model_dump()

        if (
            selection.profile != ToolProfile.SAFETY
            and selection.tools
            and self.llm_enabled
            and self.llm_client is not None
        ):
            llm_response = self.llm_client.chat(
                messages=[
                    {
                        "role": "system",
                        "content": self._system_prompt(selection.tools),
                    },
                    {
                        "role": "system",
                        "content": self._state_prompt(
                            request.conversation_state,
                            metadata["routing"],
                        ),
                    },
                    {"role": "user", "content": request.message},
                ],
                tools=tool_definitions,
                tool_choice="auto",
            )
            tool_call = self.llm_client.parse_tool_call(llm_response)
            tool_call = self._normalize_tool_call(tool_call, request)
            if not tool_call:
                tool_call = self._deterministic_tool_call(selection.tools, request)
            metadata["llm"] = {"used": True, "tool_call": tool_call}
            if tool_call:
                metadata["tool_result"] = self._execute_allowed_tool(
                    tool_call=tool_call,
                    allowed_tools=selection.tools,
                ).model_dump()

        if selection.profile == ToolProfile.SAFETY:
            risk = self.tool_executor.execute(
                "classify_medical_risk", {"message": request.message}
            )
            summary = self.tool_executor.execute(
                "summarize_for_dentist", {"message": request.message}
            )
            risk_metadata = risk.model_dump()
            if (
                intent_classification
                and intent_classification.requires_clinical_triage
                and isinstance(risk_metadata.get("data"), dict)
                and risk_metadata["data"].get("risk_level") == "LOW"
            ):
                risk_metadata["data"]["risk_level"] = "HIGH"
                risk_metadata["data"]["matched_keywords"] = [
                    "semantic_intent_classifier"
                ]
            metadata["risk"] = risk_metadata
            metadata["dentist_summary"] = summary.model_dump()
            assistant_response = (
                "Triệu chứng của bạn cần được nhân viên phòng khám xem xét. "
                "Mình không thể chẩn đoán hoặc kê thuốc trong chat; nếu tình trạng "
                "có dấu hiệu khẩn cấp hoặc diễn tiến nặng, bạn nên liên hệ phòng "
                "khám/cấp cứu ngay."
            )
        else:
            if selection.routing.reason == "semantic_out_of_scope":
                assistant_response = self._out_of_scope_response()
            else:
                assistant_response = self._compose_tool_response(
                    tool_call=metadata["llm"].get("tool_call"),
                    tool_result=metadata.get("tool_result"),
                ) or self._default_assistant_response()

        return ChatResponse(
            session_id=request.session_id,
            assistant_response=assistant_response,
            selected_profile=selection.profile.value,
            exposed_tools=selection.tools,
            metadata=metadata,
        )

    def _classify_intent(self, request: ChatRequest) -> IntentClassification | None:
        if not self.intent_classifier:
            return None
        try:
            return self.intent_classifier.classify(
                request.message,
                request.conversation_state,
            )
        except Exception as exc:
            return IntentClassification(
                intent="unknown",
                confidence=0.0,
                reason=f"classifier_error:{exc.__class__.__name__}",
            )

    def _execute_allowed_tool(
        self, tool_call: dict[str, Any], allowed_tools: list[str]
    ) -> ToolOutput:
        tool_name = tool_call.get("name")
        if tool_name not in allowed_tools:
            return ToolOutput(
                success=False,
                error_code="TOOL_NOT_ALLOWED",
                message="LLM đã yêu cầu công cụ nằm ngoài profile được phép.",
                recommended_action="RETRY_WITH_SELECTED_PROFILE_TOOLS",
                details={"requested_tool": tool_name, "allowed_tools": allowed_tools},
            )
        arguments = tool_call.get("arguments") or {}
        return self.tool_executor.execute(tool_name, arguments)

    @staticmethod
    def _default_assistant_response() -> str:
        return (
            "Mình có thể hỗ trợ đặt lịch nha khoa. Mọi thao tác thay đổi lịch hẹn "
            "sẽ chỉ được thực hiện qua công cụ backend đã xác thực."
        )

    @staticmethod
    def _out_of_scope_response() -> str:
        return (
            "Mình chỉ hỗ trợ đặt lịch, thông tin dịch vụ/phòng khám và chuyển "
            "tiếp an toàn trong phạm vi nha khoa. Với nội dung ngoài phạm vi này, "
            "bạn nên liên hệ đơn vị chuyên môn phù hợp."
        )

    def _normalize_tool_call(
        self, tool_call: dict[str, Any] | None, request: ChatRequest
    ) -> dict[str, Any] | None:
        if not tool_call:
            return None
        arguments = self._empty_strings_to_none(tool_call.get("arguments") or {})
        state = ConversationState.from_raw(request.conversation_state)
        if tool_call.get("name") == "get_available_slots":
            resolved_date = self._resolve_vietnamese_relative_date(request.message)
            if resolved_date:
                arguments["date"] = resolved_date
            arguments.setdefault("clinic_id", state.clinic_id)
            arguments.setdefault("service_id", state.service_id)
            arguments.setdefault("dentist_id", state.dentist_id)
        if tool_call.get("name") == "hold_slot":
            arguments.setdefault("slot_id", state.selected_slot_id)
            arguments.setdefault("patient_session_id", state.patient_session_id or request.session_id)
            arguments.setdefault("ttl_seconds", 300)
        if tool_call.get("name") == "confirm_booking":
            arguments.setdefault("hold_id", state.hold_id)
            arguments.setdefault("patient_session_id", state.patient_session_id or request.session_id)
            arguments.setdefault("service_id", state.service_id)
            arguments.setdefault("patient", state.patient.model_dump(exclude_none=True))
        return {
            **tool_call,
            "arguments": arguments,
        }

    def _deterministic_tool_call(
        self, allowed_tools: list[str], request: ChatRequest
    ) -> dict[str, Any] | None:
        state = ConversationState.from_raw(request.conversation_state)
        if allowed_tools == ["hold_slot"] and state.selected_slot_id:
            return {
                "name": "hold_slot",
                "source": "deterministic_router",
                "arguments": {
                    "slot_id": state.selected_slot_id,
                    "patient_session_id": state.patient_session_id or request.session_id,
                    "ttl_seconds": 300,
                },
            }
        if allowed_tools == ["confirm_booking"] and state.has_complete_booking_confirmation():
            return {
                "name": "confirm_booking",
                "source": "deterministic_router",
                "arguments": {
                    "hold_id": state.hold_id,
                    "patient_session_id": state.patient_session_id or request.session_id,
                    "service_id": state.service_id,
                    "patient": state.patient.model_dump(exclude_none=True),
                },
            }
        return None

    @staticmethod
    def _empty_strings_to_none(value: Any) -> Any:
        if isinstance(value, dict):
            return {key: ChatOrchestrator._empty_strings_to_none(item) for key, item in value.items()}
        if isinstance(value, list):
            return [ChatOrchestrator._empty_strings_to_none(item) for item in value]
        if value == "":
            return None
        return value

    @staticmethod
    def _resolve_vietnamese_relative_date(message: str) -> str | None:
        text = message.lower()
        today = date.today()
        if "ngày kia" in text or "mốt" in text:
            return (today + timedelta(days=2)).isoformat()
        if "ngày mai" in text or "mai" in text:
            return (today + timedelta(days=1)).isoformat()
        if "hôm nay" in text or "bữa nay" in text:
            return today.isoformat()
        return None

    def _compose_tool_response(
        self,
        tool_call: dict[str, Any] | None,
        tool_result: dict[str, Any] | None,
    ) -> str | None:
        if not tool_call or not tool_result or not tool_result.get("success"):
            return None

        data = self._unwrap_backend_data(tool_result.get("data"))
        tool_name = tool_call.get("name")
        if tool_name == "get_services" and isinstance(data, list):
            return self._compose_service_response(data)
        if tool_name == "get_available_slots" and isinstance(data, list):
            return self._compose_slots_response(data)
        if tool_name == "hold_slot" and isinstance(data, dict):
            return self._compose_hold_response(data)
        if tool_name == "confirm_booking" and isinstance(data, dict):
            return self._compose_booking_confirmation_response(data)
        if tool_name == "get_clinic_info" and isinstance(data, dict):
            return self._compose_clinic_info_response(data)
        if tool_name == "search_clinic_knowledge" and isinstance(data, dict):
            return self._compose_knowledge_response(data)
        return None

    @staticmethod
    def _unwrap_backend_data(data: Any) -> Any:
        if isinstance(data, dict) and data.get("success") is True and "data" in data:
            return data["data"]
        return data

    @staticmethod
    def _compose_service_response(services: list[Any]) -> str | None:
        service_summaries: list[str] = []
        for service in services:
            if not isinstance(service, dict):
                continue
            service_name = service.get("service_name")
            duration_minutes = service.get("duration_minutes")
            if not service_name:
                continue
            if duration_minutes:
                service_summaries.append(f"{service_name} ({duration_minutes} phút)")
            else:
                service_summaries.append(str(service_name))

        if not service_summaries:
            return None
        return "Phòng khám hiện có các dịch vụ: " + ", ".join(service_summaries) + "."

    @staticmethod
    def _compose_slots_response(slots: list[Any]) -> str:
        if not slots:
            return (
                "Mình chưa tìm thấy khung giờ phù hợp. Bạn có thể chọn ngày khác "
                "hoặc cung cấp thêm dịch vụ/bác sĩ mong muốn."
            )
        slot_summaries: list[str] = []
        for slot in slots[:3]:
            if not isinstance(slot, dict):
                continue
            slot_summaries.append(
                f"{slot.get('slot_date')} lúc {slot.get('start_time')} "
                f"(slot_id: {slot.get('slot_id')})"
            )
        return "Mình tìm thấy các khung giờ còn trống: " + "; ".join(slot_summaries) + "."

    @staticmethod
    def _compose_hold_response(hold: dict[str, Any]) -> str | None:
        hold_id = hold.get("hold_id")
        if not hold_id:
            return None
        return (
            f"Mình đã giữ slot tạm thời. Hold ID là {hold_id}. "
            f"Thời hạn giữ đến {hold.get('expires_at')}."
        )

    @staticmethod
    def _compose_booking_confirmation_response(appointment: dict[str, Any]) -> str | None:
        appointment_code = appointment.get("appointment_code")
        if not appointment_code:
            return None
        return (
            f"Lịch hẹn đã được xác nhận. Mã lịch hẹn: {appointment_code}, "
            f"ngày {appointment.get('appointment_date')} lúc "
            f"{appointment.get('appointment_time')}."
        )

    @staticmethod
    def _compose_clinic_info_response(clinic_info: dict[str, Any]) -> str | None:
        parts: list[str] = []
        if clinic_info.get("name"):
            parts.append(str(clinic_info["name"]))
        if clinic_info.get("address"):
            parts.append(f"địa chỉ {clinic_info['address']}")
        if clinic_info.get("phone"):
            parts.append(f"số điện thoại {clinic_info['phone']}")
        if not parts:
            return None
        return "Thông tin phòng khám: " + ", ".join(parts) + "."

    def _compose_knowledge_response(self, knowledge: dict[str, Any]) -> str | None:
        if isinstance(knowledge.get("services"), list):
            return self._compose_service_response(knowledge["services"])
        if isinstance(knowledge.get("clinic_info"), dict):
            return self._compose_clinic_info_response(knowledge["clinic_info"])
        if knowledge.get("address"):
            return f"Địa chỉ phòng khám là {knowledge['address']}."
        if isinstance(knowledge.get("opening_hours"), dict):
            opening_hours = knowledge["opening_hours"]
            return (
                "Giờ mở cửa: thứ 2-6 "
                f"{opening_hours.get('monday_friday')}, thứ 7 "
                f"{opening_hours.get('saturday')}, chủ nhật "
                f"{opening_hours.get('sunday')}."
            )
        return None

    @staticmethod
    def _system_prompt(tool_names: list[str]) -> str:
        return (
            "Bạn là trợ lý đặt lịch nha khoa. LLM không được tin cậy để tự thay "
            "đổi dữ liệu; mọi thay đổi phải đi qua công cụ backend được cấp. "
            f"Chỉ chọn một công cụ trong danh sách đang được expose: {', '.join(tool_names)}. "
            "Không tự bịa UUID hoặc ID nội bộ; với giá trị chưa biết thì dùng null "
            "hoặc bỏ qua trường đó. Ngày phải dùng định dạng YYYY-MM-DD. Với yêu "
            "cầu đặt lịch ban đầu, hãy gọi get_available_slots hoặc get_services trước. "
            "Tuyệt đối không gọi hold_slot khi chưa có slot_id từ backend. Tuyệt đối "
            "không gọi confirm_booking khi chưa có hold_id từ backend và thông tin "
            "bệnh nhân đầy đủ."
        )

    @staticmethod
    def _state_prompt(conversation_state: dict[str, Any], routing: dict[str, Any]) -> str:
        payload = {
            "conversation_state": conversation_state,
            "routing": routing,
        }
        return (
            "Dùng context đáng tin cậy này để hiểu các câu tiếp nối. "
            "Không tự bịa giá trị không có trong context: "
            f"{json.dumps(payload, ensure_ascii=False, sort_keys=True)}"
        )
