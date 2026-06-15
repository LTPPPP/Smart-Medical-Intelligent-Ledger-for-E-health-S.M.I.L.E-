from __future__ import annotations

import json
from typing import Any

import httpx

from .config import Settings
from .memory import build_safe_memory_view
from .planner import PlannerAction, parse_planner_response
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

    async def next_action(self, state: AgentState, message: str) -> PlannerAction:
        response = await self._client.post(
            f"{self.settings.llm_base_url.rstrip('/')}/chat/completions",
            json=self._payload(state, message),
        )
        response.raise_for_status()
        body = response.json()
        model_message: Any = body["choices"][0]["message"]
        return parse_planner_response(model_message)

    def _payload(self, state: AgentState, message: str) -> dict[str, Any]:
        safe_memory = build_safe_memory_view(state)
        return {
            "model": self.settings.llm_model,
            "temperature": 0,
            "tool_choice": "auto",
            "tools": PLANNER_TOOLS,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Bạn là chatbot đặt lịch nha khoa S.M.I.L.E. "
                        "Chỉ gọi tool được phép, không tự bịa id, lịch, giá. "
                        "Dùng trusted_patient_id từ ngữ cảnh cho các tool của "
                        "bệnh nhân; không hỏi người dùng nhập lại patient id."
                    ),
                },
                {
                    "role": "system",
                    "content": (
                        f"session_id={state.session_id}; "
                        f"goal={state.current_goal}; "
                        f"patient_context={bool(state.patient_id)}; "
                        f"trusted_patient_id={state.patient_id or ''}"
                    ),
                },
                {
                    "role": "system",
                    "content": (
                        "Bộ nhớ phiên an toàn bên dưới là dữ liệu đã xác minh hoặc "
                        "đã rút gọn. Dùng candidate index để hiểu các tham chiếu như "
                        "\"lịch đầu tiên\", không tự tạo id mới.\n"
                        + json.dumps(safe_memory, ensure_ascii=False)
                    ),
                },
                {"role": "user", "content": message},
            ],
        }
