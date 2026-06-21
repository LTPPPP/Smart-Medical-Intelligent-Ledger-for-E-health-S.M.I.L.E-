#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import json
import time
from pathlib import Path
from typing import Any

import httpx


async def check_model_endpoint(
    llm_url: str,
    expected_model: str,
    *,
    http_client: httpx.AsyncClient | None = None,
) -> dict[str, Any]:
    owns_client = http_client is None
    client = http_client or httpx.AsyncClient(timeout=10)
    started = time.perf_counter()
    try:
        response = await client.get(f"{llm_url.rstrip('/')}/models")
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        response.raise_for_status()
        body = response.json()
        models = [item.get("id") for item in body.get("data", []) if isinstance(item, dict)]
        present = expected_model in models
        return {
            "status": "ok" if present else "model_missing",
            "llm_url": llm_url,
            "expected_model": expected_model,
            "expected_model_present": present,
            "models": models,
            "latency_ms": elapsed_ms,
        }
    except httpx.HTTPError as exc:
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        return {
            "status": "unavailable",
            "llm_url": llm_url,
            "expected_model": expected_model,
            "expected_model_present": False,
            "error": type(exc).__name__,
            "detail": str(exc),
            "latency_ms": elapsed_ms,
        }
    finally:
        if owns_client:
            await client.aclose()


async def main() -> int:
    parser = argparse.ArgumentParser(description="Check an OpenAI-compatible model endpoint before live eval.")
    parser.add_argument("--llm-url", default="https://api.openai.com/v1")
    parser.add_argument("--model", default="gpt-5-mini")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    payload = await check_model_endpoint(args.llm_url, args.model)
    text = json.dumps(payload, indent=2)
    if args.output:
        args.output.write_text(text + "\n", encoding="utf-8")
    print(text)
    return 0 if payload["status"] == "ok" else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
