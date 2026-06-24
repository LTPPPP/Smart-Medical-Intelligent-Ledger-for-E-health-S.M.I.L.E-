#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import json
import statistics
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any
from uuid import uuid4

import httpx


@dataclass(frozen=True)
class LoadTurnResult:
    ok: bool
    status_code: int | None
    latency_ms: float
    flow: str | None
    actions: list[str]
    error: str | None = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run a bounded HTTP load check against the booking LangGraph agent.")
    parser.add_argument("--agent-url", default="http://127.0.0.1:8030")
    parser.add_argument("--patient-id", required=True)
    parser.add_argument("--requests", type=int, default=20)
    parser.add_argument("--concurrency", type=int, default=5)
    parser.add_argument("--output", type=Path, default=Path("artifacts/load_check_summary.json"))
    args = parser.parse_args()
    if args.requests < 1:
        parser.error("--requests must be at least 1")
    if args.concurrency < 1:
        parser.error("--concurrency must be at least 1")
    return args


async def run_load_check(agent_url: str, patient_id: str, request_count: int, concurrency: int) -> dict[str, Any]:
    semaphore = asyncio.Semaphore(concurrency)
    timeout = httpx.Timeout(30.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        health = await _health(client, agent_url)
        tasks = [
            _bounded_turn(semaphore, client, agent_url, patient_id, index)
            for index in range(request_count)
        ]
        results = await asyncio.gather(*tasks)
    return summarize(health, results, request_count, concurrency)


async def _health(client: httpx.AsyncClient, agent_url: str) -> dict[str, Any]:
    try:
        response = await client.get(f"{agent_url.rstrip('/')}/health")
        return {"ok": response.status_code < 500, "status_code": response.status_code, "body": response.json()}
    except Exception as exc:
        return {"ok": False, "error": f"{type(exc).__name__}: {exc}"}


async def _bounded_turn(
    semaphore: asyncio.Semaphore,
    client: httpx.AsyncClient,
    agent_url: str,
    patient_id: str,
    index: int,
) -> LoadTurnResult:
    async with semaphore:
        started = time.perf_counter()
        try:
            response = await client.post(
                f"{agent_url.rstrip('/')}/chat",
                headers={"x-patient-id": patient_id},
                json={
                    "session_id": f"load-{index}-{uuid4().hex[:8]}",
                    "message": "Cho tôi xem lịch hẹn sắp tới.",
                },
            )
            latency_ms = round((time.perf_counter() - started) * 1000, 2)
            body = response.json()
            return LoadTurnResult(
                ok=response.status_code == 200 and body.get("flow") == "lookup",
                status_code=response.status_code,
                latency_ms=latency_ms,
                flow=body.get("flow"),
                actions=list(body.get("actions") or []),
            )
        except Exception as exc:
            latency_ms = round((time.perf_counter() - started) * 1000, 2)
            return LoadTurnResult(
                ok=False,
                status_code=None,
                latency_ms=latency_ms,
                flow=None,
                actions=[],
                error=f"{type(exc).__name__}: {exc}",
            )


def summarize(
    health: dict[str, Any],
    results: list[LoadTurnResult],
    request_count: int,
    concurrency: int,
) -> dict[str, Any]:
    latencies = [result.latency_ms for result in results]
    passed = sum(result.ok for result in results)
    return {
        "health": health,
        "request_count": request_count,
        "concurrency": concurrency,
        "success_rate": round(passed / len(results), 4) if results else None,
        "p50_latency_ms": _percentile(latencies, 50),
        "p95_latency_ms": _percentile(latencies, 95),
        "max_latency_ms": max(latencies) if latencies else None,
        "failed_count": len(results) - passed,
        "flows": sorted({result.flow for result in results if result.flow}),
        "results": [asdict(result) for result in results],
    }


def _percentile(values: list[float], percentile: int) -> float | None:
    if not values:
        return None
    if len(values) == 1:
        return values[0]
    ordered = sorted(values)
    index = round((percentile / 100) * (len(ordered) - 1))
    return ordered[index]


async def main() -> int:
    args = parse_args()
    summary = await run_load_check(args.agent_url, args.patient_id, args.requests, args.concurrency)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in summary.items() if key != "results"}, indent=2, sort_keys=True))
    return 0 if summary["health"].get("ok") and summary["success_rate"] == 1.0 else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
