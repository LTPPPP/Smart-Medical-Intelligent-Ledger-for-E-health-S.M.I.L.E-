from __future__ import annotations

import json
from typing import Any

import httpx

from .config import Settings
from .memory import build_safe_memory_view
from .planner import PlannerAction, PlannerContext, parse_planner_response, with_action_metadata
from .state import AgentState
from .tools import BookByDoctorArgs, BookBySpecialtyArgs, RescheduleAppointmentArgs


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
    _function_tool(
        "reschedule_appointment",
        "Change the date, time, or doctor for an existing appointment. Requires confirmation before executing.",
        RescheduleAppointmentArgs.model_json_schema(),
    ),
    _function_tool(
        "list_doctors_by_specialty",
        "List doctors in a specialty for the patient to choose from.",
        _object_schema({"specialty_id": {"type": "string"}}, ["specialty_id"]),
    ),
    _function_tool(
        "get_doctor_leaves",
        "Check a doctor's leave schedule to avoid booking on their days off.",
        _object_schema(
            {
                "doctor_id": {"type": "string"},
                "from_date": {"type": "string"},
                "to_date": {"type": "string"},
            },
            ["doctor_id"],
        ),
    ),
    _function_tool(
        "send_reminder",
        "Send an appointment reminder notification to the patient.",
        _object_schema({"appointment_id": {"type": "string"}}, ["appointment_id"]),
    ),
    _function_tool(
        "get_appointment_by_id",
        "Get full details of an appointment by appointment_id (UUID).",
        _object_schema({"appointment_id": {"type": "string"}}, ["appointment_id"]),
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
            "You are S.M.I.L.E dental clinic booking assistant. "
            "Only call permitted tools; never fabricate ids, schedules, or prices. "
            "Use trusted_patient_id from session context for patient-scoped tools; "
            "never ask the user to re-enter their patient id. "
            "Always reply to the patient in Vietnamese.\n\n"
            "If session memory has fresh candidates, use the index/id from those candidates "
            "for the next tool call or answer. Do not re-call list_clinics, list_services, "
            "list_clinic_services, list_specialties, or get_patient_appointments just to "
            "retrieve the same list again, unless the user explicitly asks to refresh.\n\n"
            "Session context:\n"
            f"session_id={state.session_id}; "
            f"goal={state.current_goal}; "
            f"patient_context={bool(state.patient_id)}; "
            f"trusted_patient_id={state.patient_id or ''}; "
            f"patient_display={getattr(getattr(state, 'profile', None), 'display_name', '') or ''}; "
            f"patient_phone_masked={getattr(getattr(state, 'profile', None), 'masked_phone', '') or ''}\n\n"
            "Verified session memory below contains confirmed or summarized data. "
            "Use candidate index to understand references like 'the first appointment'; "
            "do not invent new ids.\n"
            f"{json.dumps(safe_memory, ensure_ascii=False)}\n\n"
            "Planning budget:\n"
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
                + " (do not re-call these tools — they returned empty)"
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
