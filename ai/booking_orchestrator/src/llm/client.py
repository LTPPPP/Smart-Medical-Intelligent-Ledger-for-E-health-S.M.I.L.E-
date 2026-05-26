import json
from typing import Any, Protocol

import httpx


class LLMClient(Protocol):
    def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        tool_choice: str | dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        ...

    def parse_tool_call(self, response: dict[str, Any]) -> dict[str, Any] | None:
        ...


class OpenAICompatibleLLMClient:
    def __init__(
        self,
        base_url: str,
        api_key: str,
        model: str,
        timeout_seconds: float = 30.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.client = httpx.Client(
            timeout=timeout_seconds,
            headers={"Authorization": f"Bearer {api_key}"},
        )

    def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        tool_choice: str | dict[str, Any] | None = "auto",
    ) -> dict[str, Any]:
        response = self.client.post(
            f"{self.base_url}/chat/completions",
            json={
                "model": self.model,
                "messages": messages,
                "tools": tools,
                "tool_choice": tool_choice,
            },
        )
        response.raise_for_status()
        return response.json()

    def parse_tool_call(self, response: dict[str, Any]) -> dict[str, Any] | None:
        choices = response.get("choices") or []
        if not choices:
            return None
        message = choices[0].get("message") or {}
        tool_calls = message.get("tool_calls") or []
        if not tool_calls:
            return None
        function = tool_calls[0].get("function") or {}
        arguments = function.get("arguments") or {}
        if isinstance(arguments, str):
            arguments = json.loads(arguments or "{}")
        return {
            "name": function.get("name"),
            "arguments": arguments,
        }
