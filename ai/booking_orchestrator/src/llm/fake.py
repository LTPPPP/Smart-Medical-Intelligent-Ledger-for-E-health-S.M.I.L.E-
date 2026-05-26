from typing import Any


class FakeLLMClient:
    def __init__(self, tool_name: str | None = None, arguments: dict | None = None):
        self.tool_name = tool_name
        self.arguments = arguments or {}

    def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        tool_choice: str | dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if not self.tool_name:
            return {
                "choices": [
                    {"message": {"role": "assistant", "content": "How can I help?"}}
                ]
            }
        return {
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "tool_calls": [
                            {
                                "type": "function",
                                "function": {
                                    "name": self.tool_name,
                                    "arguments": self.arguments,
                                },
                            }
                        ],
                    }
                }
            ]
        }

    def parse_tool_call(self, response: dict[str, Any]) -> dict[str, Any] | None:
        choices = response.get("choices") or []
        if not choices:
            return None
        tool_calls = choices[0].get("message", {}).get("tool_calls") or []
        if not tool_calls:
            return None
        function = tool_calls[0]["function"]
        return {"name": function["name"], "arguments": function.get("arguments") or {}}
