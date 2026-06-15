#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.request
from typing import Any


MODEL_NAME = "Qwen/Qwen3.5-4B"


def request_json(method: str, url: str, payload: dict[str, Any] | None = None) -> Any:
    data = json.dumps(payload).encode() if payload is not None else None
    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as error:
        body = error.read().decode(errors="replace")
        raise RuntimeError(f"{method} {url} failed with HTTP {error.code}: {body}") from error


def chat_completion(base_url: str, payload: dict[str, Any]) -> dict[str, Any]:
    started_at = time.perf_counter()
    body = request_json("POST", f"{base_url.rstrip('/')}/chat/completions", payload)
    latency_ms = round((time.perf_counter() - started_at) * 1000)
    return {"latency_ms": latency_ms, "body": body}


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke test Qwen3.5 planner serving")
    parser.add_argument("--llm-url", default="http://localhost:8000/v1")
    parser.add_argument("--model", default=MODEL_NAME)
    args = parser.parse_args()

    base_url = args.llm_url.rstrip("/")
    models = request_json("GET", f"{base_url}/models")
    model_ids = {item.get("id") for item in models.get("data", [])}
    if args.model not in model_ids:
        raise RuntimeError(f"{args.model} not served by {base_url}. Served models: {sorted(model_ids)}")

    answer = chat_completion(
        base_url,
        {
            "model": args.model,
            "temperature": 0,
            "max_tokens": 96,
            "chat_template_kwargs": {"enable_thinking": False},
            "messages": [
                {"role": "system", "content": "Bạn là chatbot nha khoa S.M.I.L.E."},
                {"role": "user", "content": "Chào bạn, bạn có thể giúp gì?"},
            ],
        },
    )
    answer_message = answer["body"]["choices"][0]["message"]
    if not (answer_message.get("content") or "").strip():
        raise RuntimeError("Direct answer smoke returned empty content")

    tool = chat_completion(
        base_url,
        {
            "model": args.model,
            "temperature": 0,
            "max_tokens": 128,
            "tool_choice": "auto",
            "chat_template_kwargs": {"enable_thinking": False},
            "tools": [
                {
                    "type": "function",
                    "function": {
                        "name": "list_clinics",
                        "description": "List dental clinics.",
                        "parameters": {
                            "type": "object",
                            "properties": {},
                            "required": [],
                            "additionalProperties": False,
                        },
                    },
                }
            ],
            "messages": [
                {
                    "role": "system",
                    "content": "Chỉ gọi tool nếu cần tra cứu dữ liệu phòng khám.",
                },
                {"role": "user", "content": "Liệt kê phòng khám giúp tôi."},
            ],
        },
    )
    tool_calls = tool["body"]["choices"][0]["message"].get("tool_calls") or []
    tool_names = [
        item.get("function", {}).get("name")
        for item in tool_calls
        if item.get("function")
    ]
    if "list_clinics" not in tool_names:
        raise RuntimeError(f"Tool-call smoke did not call list_clinics: {tool_names}")

    result = {
        "model": args.model,
        "answer_latency_ms": answer["latency_ms"],
        "tool_latency_ms": tool["latency_ms"],
        "answer_prompt_tokens": answer["body"].get("usage", {}).get("prompt_tokens"),
        "tool_prompt_tokens": tool["body"].get("usage", {}).get("prompt_tokens"),
        "tool_names": tool_names,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
