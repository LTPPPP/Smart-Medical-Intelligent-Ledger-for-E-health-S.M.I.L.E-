#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import json
import time
from pathlib import Path
from typing import Any

import httpx


async def main() -> int:
    parser = argparse.ArgumentParser(description="Run real HTTP checks against the LangGraph booking agent.")
    parser.add_argument("--agent-url", default="http://127.0.0.1:8030")
    parser.add_argument("--patient-id", required=True)
    parser.add_argument("--appointment-code")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    checks: list[dict[str, Any]] = []
    async with httpx.AsyncClient(timeout=20) as client:
        health = await _request(client, "GET", f"{args.agent_url.rstrip('/')}/health")
        checks.append(_grade_check("health", health))

        lookup = await _chat(
            client,
            args.agent_url,
            args.patient_id,
            {"session_id": "live-core-lookup", "message": "Show my appointments"},
        )
        checks.append(_grade_check("lookup", lookup))

        booking = await _chat(
            client,
            args.agent_url,
            args.patient_id,
            {
                "session_id": "live-core-booking",
                "message": "Book a dental appointment at the earliest available time",
            },
        )
        checks.append(_grade_check("booking_prepare", booking))

        if args.appointment_code:
            cancel = await _chat(
                client,
                args.agent_url,
                args.patient_id,
                {
                    "session_id": "live-core-cancel",
                    "message": f"Cancel appointment {args.appointment_code}",
                },
            )
            checks.append(_grade_check("cancel_prepare", cancel))

    payload = {"checks": checks, "passed": all(item["ok"] for item in checks)}
    text = json.dumps(payload, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text + "\n", encoding="utf-8")
    print(text)
    return 0 if payload["passed"] else 1


def _grade_check(name: str, result: dict[str, Any]) -> dict[str, Any]:
    semantic_status = _semantic_status(name, result)
    acceptable_semantics = {"ok"}
    if name == "booking_prepare":
        acceptable_semantics.add("clarification_requested")
    return {
        "name": name,
        **result,
        "ok": bool(result.get("ok")) and semantic_status in acceptable_semantics,
        "http_ok": bool(result.get("ok")),
        "semantic_status": semantic_status,
    }


def _semantic_status(name: str, result: dict[str, Any]) -> str:
    if not result.get("ok"):
        return "http_error"
    body = result.get("body")
    if not isinstance(body, dict):
        return "invalid_json_body"
    if name == "health":
        return "ok" if body.get("status") == "ok" else "degraded_health"
    if name == "lookup":
        if body.get("flow") != "lookup":
            return "wrong_flow"
        appointments = (body.get("safe_state") or {}).get("appointments")
        return "ok" if isinstance(appointments, list) else "missing_appointments"
    if name == "booking_prepare":
        confirmation = body.get("confirmation") or {}
        if body.get("flow") != "booking":
            return "wrong_flow"
        if confirmation.get("token") and confirmation.get("action") == "commit_booking":
            return "ok"
        metrics = (body.get("metadata") or {}).get("metrics") or {}
        if metrics.get("clarification_count") == 1 and metrics.get("backend_conflict_rate", 0) == 0:
            return "clarification_requested"
        return "missing_booking_confirmation"
    if name == "cancel_prepare":
        confirmation = body.get("confirmation") or {}
        if body.get("flow") != "cancel":
            return "wrong_flow"
        if confirmation.get("token") and confirmation.get("action") == "commit_cancel":
            return "ok"
        return "missing_cancel_confirmation"
    return "ok"


async def _chat(client: httpx.AsyncClient, agent_url: str, patient_id: str, body: dict[str, Any]) -> dict[str, Any]:
    return await _request(
        client,
        "POST",
        f"{agent_url.rstrip('/')}/chat",
        headers={"x-patient-id": patient_id},
        json=body,
    )


async def _request(client: httpx.AsyncClient, method: str, url: str, **kwargs: Any) -> dict[str, Any]:
    started = time.perf_counter()
    try:
        response = await client.request(method, url, **kwargs)
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        ok = 200 <= response.status_code < 300
        try:
            body: Any = response.json()
        except ValueError:
            body = response.text
        return {"ok": ok, "status_code": response.status_code, "latency_ms": elapsed_ms, "body": body}
    except httpx.HTTPError as exc:
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        return {"ok": False, "status_code": None, "latency_ms": elapsed_ms, "error": type(exc).__name__, "detail": str(exc)}


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
