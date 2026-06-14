from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class PlannerAction:
    kind: str
    tool_name: str | None = None
    arguments: dict[str, Any] = field(default_factory=dict)
    answer: str | None = None
    goal: str | None = None

    @classmethod
    def tool(cls, tool_name: str, arguments: dict[str, Any]) -> "PlannerAction":
        return cls(kind="tool", tool_name=tool_name, arguments=arguments)

    @classmethod
    def goal_change(cls, goal: str) -> "PlannerAction":
        return cls(kind="goal_change", goal=goal)

    @classmethod
    def parse_failed(cls) -> "PlannerAction":
        return cls(kind="parse_failed")


def parse_planner_response(message: Any) -> PlannerAction:
    if isinstance(message, dict) and message.get("tool_calls"):
        function = message["tool_calls"][0]["function"]
        return PlannerAction.tool(
            function["name"],
            json.loads(function.get("arguments") or "{}"),
        )
    if isinstance(message, str):
        try:
            parsed = json.loads(message)
        except json.JSONDecodeError:
            return PlannerAction.parse_failed()
        if parsed.get("action") == "tool":
            return PlannerAction.tool(parsed["tool_name"], parsed.get("arguments") or {})
    return PlannerAction.parse_failed()


class FakePlanner:
    def __init__(self, actions: list[PlannerAction]) -> None:
        self._actions = list(actions)

    async def next_action(self, state: Any, message: str) -> PlannerAction:
        if self._actions:
            return self._actions.pop(0)
        return PlannerAction(kind="answer", answer="Tôi cần thêm thông tin để hỗ trợ bạn.")
