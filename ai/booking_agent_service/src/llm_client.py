from __future__ import annotations

import json
from typing import Any

import httpx

from .config import Settings
from .memory import build_safe_memory_view
from .planner import PlannerAction, PlannerContext, parse_planner_response, with_action_metadata
from .state import AgentState
from .tools import BookByDoctorArgs, BookBySpecialtyArgs


def _function_tool(
    name: str,
    description: str,
    parameters: dict[str, Any],
) -> dict[str, Any]:
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": parameters,
        },
    }


def _object_schema(properties: dict[str, Any], required: list[str] | None = None) -> dict[str, Any]:
    return {
        "type": "object",
        "properties": properties,
        "required": required or [],
        "additionalProperties": False,
    }


PLANNER_TOOLS: list[dict[str, Any]] = [
    _function_tool(
        "list_clinics",
        "List dental clinics from Clinical EMR.",
        _object_schema({}),
    ),
    _function_tool(
        "get_clinic",
        "Get one clinic by backend clinic id.",
        _object_schema({"clinic_id": {"type": "string"}}, ["clinic_id"]),
    ),
    _function_tool(
        "list_services",
        "List dental services from Clinical EMR.",
        _object_schema({}),
    ),
    _function_tool(
        "list_clinic_services",
        "List services available at a clinic.",
        _object_schema({"clinic_id": {"type": "string"}}, ["clinic_id"]),
    ),
    _function_tool(
        "list_specialties",
        "List dental specialties from Clinical EMR.",
        _object_schema({"clinic_id": {"type": "string"}}, ["clinic_id"]),
    ),
    _function_tool(
        "list_doctor_schedules",
        "List doctor schedule candidates for booking.",
        _object_schema(
            {
                "clinic_id": {"type": "string"},
                "doctor_id": {"type": "string"},
                "specialty_id": {"type": "string"},
                "work_date": {"type": "string"},
            },
        ),
    ),
    _function_tool(
        "get_patient_appointments",
        "List appointments for the authenticated patient.",
        _object_schema({"patient_id": {"type": "string"}}, ["patient_id"]),
    ),
    _function_tool(
        "get_appointment_by_code",
        "Read-verify an appointment by code before cancellation.",
        _object_schema({"code": {"type": "string"}}, ["code"]),
    ),
    _function_tool(
        "book_by_specialty",
        "Prepare or commit a booking by specialty after policy validation.",
        BookBySpecialtyArgs.model_json_schema(),
    ),
    _function_tool(
        "book_by_doctor",
        "Prepare or commit a booking by doctor after policy validation.",
        BookByDoctorArgs.model_json_schema(),
    ),
]


class VllmPlanner:
    def __init__(
        self,
        settings: Settings,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self.settings = settings
        self._client = http_client or httpx.AsyncClient(
            timeout=settings.request_timeout_seconds
        )

    async def next_action(
        self,
        state: AgentState,
        message: str,
        context: PlannerContext | None = None,
    ) -> PlannerAction:
        planner_context = context or PlannerContext()
        enable_thinking, reasoning_reason = self._reasoning_mode(planner_context)
        response = await self._client.post(
            f"{self.settings.llm_base_url.rstrip('/')}/chat/completions",
            json=self._payload(state, message, planner_context, enable_thinking),
        )
        response.raise_for_status()
        body = response.json()
        model_message: Any = body["choices"][0]["message"]
        usage = body.get("usage") or {}
        metadata = {
            "reasoning_mode": "thinking" if enable_thinking else "direct",
            "reasoning_reason": reasoning_reason,
        }
        for key in ("prompt_tokens", "completion_tokens"):
            if isinstance(usage.get(key), int):
                metadata[key] = usage[key]
        return with_action_metadata(parse_planner_response(model_message), metadata)

    @staticmethod
    def _reasoning_mode(context: PlannerContext) -> tuple[bool, str]:
        if context.duplicate_read_blocked:
            return True, "duplicate_read_blocked"
        if context.reference_ambiguous:
            return True, "reference_ambiguous"
        if context.multi_goal:
            return True, "multi_goal"
        if context.remaining_steps <= 1 and context.attempted_read_signatures:
            return True, "follow_up_after_read"
        return False, "simple_first_step"

    def _payload(
        self,
        state: AgentState,
        message: str,
        context: PlannerContext | None = None,
        enable_thinking: bool = False,
    ) -> dict[str, Any]:
        planner_context = context or PlannerContext()
        safe_memory = build_safe_memory_view(state)
        system_content = (
            "Bạn là chatbot đặt lịch nha khoa S.M.I.L.E. "
            "Chỉ gọi tool được phép, không tự bịa id, lịch, giá. "
            "Dùng trusted_patient_id từ ngữ cảnh cho các tool của "
            "bệnh nhân; không hỏi người dùng nhập lại patient id.\n\n"
            "Nếu bộ nhớ có candidate còn mới, hãy dùng index/id trong candidate "
            "đó để gọi tool kế tiếp hoặc trả lời. Không gọi lại list_clinics, "
            "list_services, list_clinic_services, list_specialties hoặc "
            "get_patient_appointments chỉ để lấy lại cùng danh sách, trừ khi "
            "người dùng yêu cầu làm mới rõ ràng.\n\n"
            "Ngữ cảnh phiên:\n"
            f"session_id={state.session_id}; "
            f"goal={state.current_goal}; "
            f"patient_context={bool(state.patient_id)}; "
            f"trusted_patient_id={state.patient_id or ''}\n\n"
            "Bộ nhớ phiên an toàn bên dưới là dữ liệu đã xác minh hoặc "
            "đã rút gọn. Dùng candidate index để hiểu các tham chiếu như "
            "\"lịch đầu tiên\", không tự tạo id mới.\n"
            f"{json.dumps(safe_memory, ensure_ascii=False)}\n\n"
            "Ngân sách lập kế hoạch:\n"
            f"planning_step={planner_context.step_index + 1}; "
            f"remaining_steps={planner_context.remaining_steps}; "
            "attempted_reads="
            + json.dumps(
                planner_context.attempted_read_signatures,
                ensure_ascii=False,
            )
            + (
                "; null_results="
                + json.dumps(planner_context.null_result_tools, ensure_ascii=False)
                + " (đừng gọi lại các tool này — chúng đã trả về rỗng)"
                if planner_context.null_result_tools
                else ""
            )
        )
        return {
            "model": self.settings.llm_model,
            "temperature": 0,
            "chat_template_kwargs": {"enable_thinking": enable_thinking},
            "tool_choice": "auto",
            "tools": PLANNER_TOOLS,
            "messages": [
                {
                    "role": "system",
                    "content": system_content,
                },
                {"role": "user", "content": message},
            ],
        }
