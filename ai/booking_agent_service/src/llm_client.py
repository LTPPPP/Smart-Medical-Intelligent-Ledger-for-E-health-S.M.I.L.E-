from __future__ import annotations

from typing import Any

import httpx

from .config import Settings
from .planner import PlannerAction, parse_planner_response
from .state import AgentState


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
        return {
            "model": self.settings.llm_model,
            "temperature": 0,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Bạn là chatbot đặt lịch nha khoa S.M.I.L.E. "
                        "Chỉ gọi tool được phép, không tự bịa id, lịch, giá."
                    ),
                },
                {
                    "role": "system",
                    "content": (
                        f"session_id={state.session_id}; "
                        f"goal={state.current_goal}; "
                        f"patient_context={bool(state.patient_id)}"
                    ),
                },
                {"role": "user", "content": message},
            ],
        }
