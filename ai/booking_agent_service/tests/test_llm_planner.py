from __future__ import annotations

import httpx
import pytest

from src.config import Settings
from src.llm_client import VllmPlanner
from src.state import AgentState


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

    action = await planner.next_action(AgentState(session_id="s1"), "liệt kê phòng khám")

    assert action.kind == "tool"
    assert action.tool_name == "list_clinics"
    assert requests[0].method == "POST"
    assert requests[0].url.path == "/v1/chat/completions"
    body = requests[0].read().decode()
    assert "Qwen/Qwen2.5-7B-Instruct-AWQ" in body
    assert "liệt kê phòng khám" in body
