import json
import re
from typing import Any, Protocol

import httpx


TOOL_CALL_PATTERN = re.compile(r"<tool_call>\s*(.*?)\s*</tool_call>", re.DOTALL)


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
        temperature: float = 0.0,
        max_tokens: int = 256,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
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
                "temperature": self.temperature,
                "max_tokens": self.max_tokens,
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
        if tool_calls:
            function = tool_calls[0].get("function") or {}
            return self._normalize_tool_call(
                name=function.get("name"),
                arguments=function.get("arguments") or {},
            )

        content = message.get("content") or ""
        match = TOOL_CALL_PATTERN.search(content)
        if not match:
            return None
        payload = self._load_json_object(match.group(1))
        if not payload:
            return None
        return self._normalize_tool_call(
            name=payload.get("name"),
            arguments=payload.get("arguments") or {},
        )

    @staticmethod
    def _normalize_tool_call(
        name: str | None, arguments: str | dict[str, Any]
    ) -> dict[str, Any]:
        if isinstance(arguments, str):
            arguments = json.loads(arguments or "{}")
        return {
            "name": name,
            "arguments": arguments,
        }

    @staticmethod
    def _load_json_object(payload: str) -> dict[str, Any] | None:
        stripped = payload.strip()
        candidates = [stripped]
        if stripped.startswith("{{"):
            candidates.append(stripped[1:])
        if stripped.endswith("}}"):
            candidates.append(stripped[:-1])
        if stripped.startswith("{{") and stripped.endswith("}}"):
            candidates.append(stripped[1:-1])

        for candidate in candidates:
            try:
                parsed = json.loads(candidate)
            except json.JSONDecodeError:
                continue
            if isinstance(parsed, dict):
                return parsed
        return None
