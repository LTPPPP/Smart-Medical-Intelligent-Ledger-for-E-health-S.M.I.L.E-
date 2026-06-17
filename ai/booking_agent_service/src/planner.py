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
    metadata: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def tool(cls, tool_name: str, arguments: dict[str, Any]) -> "PlannerAction":
        return cls(kind="tool", tool_name=tool_name, arguments=arguments)

    @classmethod
    def goal_change(cls, goal: str) -> "PlannerAction":
        return cls(kind="goal_change", goal=goal)

    @classmethod
    def parse_failed(cls) -> "PlannerAction":
        return cls(kind="parse_failed")


@dataclass(frozen=True)
class PlannerContext:
    step_index: int = 0
    remaining_steps: int = 1
    attempted_read_signatures: list[str] = field(default_factory=list)
    duplicate_read_blocked: bool = False
    reference_ambiguous: bool = False
    multi_goal: bool = False
    null_result_tools: list[str] = field(default_factory=list)


def with_action_metadata(action: PlannerAction, metadata: dict[str, Any]) -> PlannerAction:
    return PlannerAction(
        kind=action.kind,
        tool_name=action.tool_name,
        arguments=action.arguments,
        answer=action.answer,
        goal=action.goal,
        metadata=metadata,
    )


def parse_planner_response(message: Any) -> PlannerAction:
    if isinstance(message, dict) and message.get("tool_calls"):
        function = message["tool_calls"][0]["function"]
        return PlannerAction.tool(
            function["name"],
            json.loads(function.get("arguments") or "{}"),
        )
    if isinstance(message, dict) and isinstance(message.get("content"), str):
        parsed_content = parse_planner_response(message["content"])
        if parsed_content.kind == "parse_failed" and message["content"].strip():
            return PlannerAction(kind="answer", answer=message["content"])
        return parsed_content
    if isinstance(message, str):
        try:
            parsed = json.loads(message)
        except json.JSONDecodeError:
            return PlannerAction.parse_failed()
        if parsed.get("action") == "tool":
            return PlannerAction.tool(parsed["tool_name"], parsed.get("arguments") or {})
        if parsed.get("action") == "answer":
            return PlannerAction(kind="answer", answer=parsed.get("answer") or "")
        if parsed.get("action") == "goal_change":
            return PlannerAction.goal_change(parsed.get("goal") or "unknown")
    return PlannerAction.parse_failed()


class FakePlanner:
    def __init__(self, actions: list[PlannerAction]) -> None:
        self._actions = list(actions)

    async def next_action(
        self,
        state: Any,
        message: str,
        context: PlannerContext | None = None,
    ) -> PlannerAction:
        if self._actions:
            return self._actions.pop(0)
        return PlannerAction(kind="answer", answer="Tôi cần thêm thông tin để hỗ trợ bạn.")
