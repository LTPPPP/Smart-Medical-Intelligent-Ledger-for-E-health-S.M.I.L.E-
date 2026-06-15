from __future__ import annotations

import json
from datetime import datetime, timezone

import httpx
import pytest

from src.config import Settings
from src.llm_client import VllmPlanner
from src.memory import Candidate, CandidateList
from src.planner import parse_planner_response
from src.state import AgentState, WorkflowSlots


@pytest.mark.asyncio
async def test_vllm_planner_calls_openai_compatible_chat_completions_and_parses_tool():
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "tool_calls": [
                                {
                                    "function": {
                                        "name": "list_clinics",
                                        "arguments": "{\"limit\": 3}",
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
        )

    planner = VllmPlanner(
        Settings(
            require_cuda=False,
            llm_base_url="http://vllm:8000/v1",
            llm_model="Qwen/Qwen2.5-7B-Instruct-AWQ",
        ),
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    action = await planner.next_action(
        AgentState(
            session_id="s1",
            patient_id="11111111-1111-1111-1111-111111111111",
        ),
        "liệt kê phòng khám",
    )

    assert action.kind == "tool"
    assert action.tool_name == "list_clinics"
    assert requests[0].method == "POST"
    assert requests[0].url.path == "/v1/chat/completions"
    body = json.loads(requests[0].read().decode())
    assert body["model"] == "Qwen/Qwen2.5-7B-Instruct-AWQ"
    assert body["tool_choice"] == "auto"
    assert body["messages"][-1]["content"] == "liệt kê phòng khám"
    assert "trusted_patient_id=11111111-1111-1111-1111-111111111111" in (
        body["messages"][1]["content"]
    )
    tool_names = {tool["function"]["name"] for tool in body["tools"]}
    assert "list_clinics" in tool_names
    assert "get_patient_appointments" in tool_names
    assert "book_by_doctor" in tool_names
    assert "get_appointment_by_code" in tool_names
    assert "cancel_appointment" not in tool_names


def test_vllm_planner_payload_contains_safe_grounded_memory_without_raw_payloads():
    planner = VllmPlanner(Settings(require_cuda=False))
    state = AgentState(
        session_id="s1",
        current_goal="booking",
        patient_id="11111111-1111-4111-8111-111111111111",
        slots=WorkflowSlots(
            clinic_id="clinic-1",
            clinic_label="Nha khoa trung tâm",
            preferred_date="2026-06-20",
        ),
        recent_turns=[
            {"role": "user", "content": "Gọi tôi theo số [phone]"},
            {"role": "assistant", "content": "Mình đã ghi nhận ngày mong muốn."},
        ],
        candidates={
            "schedule": CandidateList(
                kind="schedule",
                fetched_at=datetime.now(timezone.utc),
                ttl_seconds=90,
                items=[
                    Candidate(
                        id="schedule-1",
                        label="20/06 lúc 09:00 với bác sĩ An",
                        payload={"internal_secret": "must-not-leak"},
                    )
                ],
            )
        },
    )

    payload = planner._payload(state, "lấy lịch đầu tiên")
    memory_message = payload["messages"][-2]["content"]

    assert "Nha khoa trung tâm" in memory_message
    assert "schedule_candidates[1]" in memory_message
    assert "Gọi tôi theo số [phone]" in memory_message
    assert "must-not-leak" not in memory_message
    assert payload["messages"][-1]["content"] == "lấy lịch đầu tiên"


def test_planner_parser_accepts_plain_assistant_answer():
    action = parse_planner_response(
        {"role": "assistant", "content": "Bạn muốn khám ở chi nhánh nào?"}
    )

    assert action.kind == "answer"
    assert action.answer == "Bạn muốn khám ở chi nhánh nào?"
