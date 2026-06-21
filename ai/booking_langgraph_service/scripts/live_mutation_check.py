#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import json
import time
from datetime import date, timedelta
from pathlib import Path
from typing import Any
from uuid import uuid4

import httpx


DEFAULT_PATIENT_ID = "11111111-1111-4111-8111-111111111111"
DEFAULT_DOCTOR_ID = "22222222-2222-4222-8222-222222222222"
DEFAULT_CLINIC_ID = "1e8bfdc5-b8a4-4413-9ba7-5c4d2f070fb1"


async def main() -> int:
    parser = argparse.ArgumentParser(description="Run a strict live mutation check against the LangGraph booking agent.")
    parser.add_argument("--agent-url", default="http://127.0.0.1:8030")
    parser.add_argument("--emr-url", default="http://127.0.0.1:8082")
    parser.add_argument("--patient-id", default=DEFAULT_PATIENT_ID)
    parser.add_argument("--doctor-id", default=DEFAULT_DOCTOR_ID)
    parser.add_argument("--clinic-id", default=DEFAULT_CLINIC_ID)
    parser.add_argument("--work-date", default=(date.today() + timedelta(days=230)).isoformat())
    parser.add_argument("--reschedule-date", default=(date.today() + timedelta(days=231)).isoformat())
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    checks: list[dict[str, Any]] = []
    async with httpx.AsyncClient(timeout=30) as client:
        health = await request(client, "GET", f"{args.agent_url.rstrip('/')}/health")
        checks.append({"name": "health", **grade_health(health.get("body", {})), "latency_ms": health.get("latency_ms")})
        if not checks[-1]["ok"]:
            return finish(checks, args.output)

        seed = await seed_booking_slot(
            client,
            emr_url=args.emr_url,
            doctor_id=args.doctor_id,
            clinic_id=args.clinic_id,
            work_date=args.work_date,
        )
        checks.append({"name": "seed_booking_slot", **seed})
        if not seed["ok"]:
            return finish(checks, args.output)

        reschedule_seed = await seed_booking_slot(
            client,
            emr_url=args.emr_url,
            doctor_id=args.doctor_id,
            clinic_id=args.clinic_id,
            work_date=args.reschedule_date,
        )
        checks.append({"name": "seed_reschedule_slot", **reschedule_seed})
        if not reschedule_seed["ok"]:
            return finish(checks, args.output)

        session_id = f"live-mutation-{uuid4().hex[:10]}"
        booking_prepare = await chat(
            client,
            args.agent_url,
            args.patient_id,
            {
                "session_id": session_id,
                "message": f"Book a dental appointment on {args.work_date}.",
            },
        )
        booking_token = confirmation_token(booking_prepare.get("body", {}), expected_flow="booking", expected_action="commit_booking")
        checks.append(
            {
                "name": "booking_prepare",
                "ok": booking_prepare["ok"] and booking_token is not None,
                "status_code": booking_prepare.get("status_code"),
                "latency_ms": booking_prepare.get("latency_ms"),
                "reply": (booking_prepare.get("body") or {}).get("reply"),
                "flow": (booking_prepare.get("body") or {}).get("flow"),
                "actions": (booking_prepare.get("body") or {}).get("actions"),
                "confirmation_action": ((booking_prepare.get("body") or {}).get("confirmation") or {}).get("action"),
            }
        )
        if not checks[-1]["ok"]:
            return finish(checks, args.output)

        booking_commit = await chat(
            client,
            args.agent_url,
            args.patient_id,
            {
                "session_id": session_id,
                "message": "I confirm this booking.",
                "confirmation_token": booking_token,
                "confirmed": True,
            },
        )
        booked = await find_scheduled_appointment(
            client,
            emr_url=args.emr_url,
            patient_id=args.patient_id,
            work_date=args.work_date,
        )
        checks.append(
            {
                "name": "booking_commit",
                "ok": booking_commit["ok"] and booked is not None,
                "status_code": booking_commit.get("status_code"),
                "latency_ms": booking_commit.get("latency_ms"),
                "reply": (booking_commit.get("body") or {}).get("reply"),
                "flow": (booking_commit.get("body") or {}).get("flow"),
                "actions": (booking_commit.get("body") or {}).get("actions"),
                "appointment_code": booked.get("code") if booked else None,
                "mutation_without_confirmation": ((booking_commit.get("body") or {}).get("metadata") or {})
                .get("metrics", {})
                .get("mutation_without_confirmation"),
            }
        )
        if not checks[-1]["ok"]:
            return finish(checks, args.output)

        appointment_code = booked["code"]
        appointment_id = booked["id"]

        reschedule_session_id = f"{session_id}-reschedule"
        reschedule_prepare = await chat(
            client,
            args.agent_url,
            args.patient_id,
            {
                "session_id": reschedule_session_id,
                "message": f"Reschedule appointment {appointment_code} to {args.reschedule_date}.",
            },
        )
        reschedule_token = confirmation_token(
            reschedule_prepare.get("body", {}),
            expected_flow="reschedule",
            expected_action="commit_reschedule",
        )
        checks.append(
            {
                "name": "reschedule_prepare",
                "ok": reschedule_prepare["ok"] and reschedule_token is not None,
                "status_code": reschedule_prepare.get("status_code"),
                "latency_ms": reschedule_prepare.get("latency_ms"),
                "reply": (reschedule_prepare.get("body") or {}).get("reply"),
                "flow": (reschedule_prepare.get("body") or {}).get("flow"),
                "actions": (reschedule_prepare.get("body") or {}).get("actions"),
                "confirmation_action": ((reschedule_prepare.get("body") or {}).get("confirmation") or {}).get("action"),
            }
        )
        if not checks[-1]["ok"]:
            return finish(checks, args.output)

        reschedule_commit = await chat(
            client,
            args.agent_url,
            args.patient_id,
            {
                "session_id": reschedule_session_id,
                "message": "I confirm this reschedule.",
                "confirmation_token": reschedule_token,
                "confirmed": True,
            },
        )
        appointment_after_reschedule = await request(
            client,
            "GET",
            f"{args.emr_url.rstrip('/')}/api/v1/appointments/code/{appointment_code}",
        )
        rescheduled_body = appointment_after_reschedule.get("body") or {}
        rescheduled_date = str(
            rescheduled_body.get("appointment_date") or rescheduled_body.get("appointmentDate") or ""
        ).split("T", maxsplit=1)[0]
        checks.append(
            {
                "name": "reschedule_commit",
                "ok": reschedule_commit["ok"] and rescheduled_date == args.reschedule_date,
                "status_code": reschedule_commit.get("status_code"),
                "latency_ms": reschedule_commit.get("latency_ms"),
                "reply": (reschedule_commit.get("body") or {}).get("reply"),
                "flow": (reschedule_commit.get("body") or {}).get("flow"),
                "actions": (reschedule_commit.get("body") or {}).get("actions"),
                "appointment_code": appointment_code,
                "appointment_id": appointment_id,
                "appointment_date": rescheduled_date,
                "expected_date": args.reschedule_date,
                "mutation_without_confirmation": ((reschedule_commit.get("body") or {}).get("metadata") or {})
                .get("metrics", {})
                .get("mutation_without_confirmation"),
            }
        )
        if not checks[-1]["ok"]:
            return finish(checks, args.output)

        cancel_session_id = f"{session_id}-cancel"
        cancel_prepare = await chat(
            client,
            args.agent_url,
            args.patient_id,
            {
                "session_id": cancel_session_id,
                "message": f"Cancel appointment {appointment_code}.",
            },
        )
        cancel_token = confirmation_token(cancel_prepare.get("body", {}), expected_flow="cancel", expected_action="commit_cancel")
        checks.append(
            {
                "name": "cancel_prepare",
                "ok": cancel_prepare["ok"] and cancel_token is not None,
                "status_code": cancel_prepare.get("status_code"),
                "latency_ms": cancel_prepare.get("latency_ms"),
                "reply": (cancel_prepare.get("body") or {}).get("reply"),
                "flow": (cancel_prepare.get("body") or {}).get("flow"),
                "actions": (cancel_prepare.get("body") or {}).get("actions"),
                "confirmation_action": ((cancel_prepare.get("body") or {}).get("confirmation") or {}).get("action"),
            }
        )
        if not checks[-1]["ok"]:
            return finish(checks, args.output)

        cancel_commit = await chat(
            client,
            args.agent_url,
            args.patient_id,
            {
                "session_id": cancel_session_id,
                "message": "I confirm this cancellation.",
                "confirmation_token": cancel_token,
                "confirmed": True,
            },
        )
        appointment_after_cancel = await request(
            client,
            "GET",
            f"{args.emr_url.rstrip('/')}/api/v1/appointments/code/{appointment_code}",
        )
        status = (appointment_after_cancel.get("body") or {}).get("status")
        checks.append(
            {
                "name": "cancel_commit",
                "ok": cancel_commit["ok"] and str(status).lower() == "cancelled",
                "status_code": cancel_commit.get("status_code"),
                "latency_ms": cancel_commit.get("latency_ms"),
                "reply": (cancel_commit.get("body") or {}).get("reply"),
                "flow": (cancel_commit.get("body") or {}).get("flow"),
                "actions": (cancel_commit.get("body") or {}).get("actions"),
                "appointment_code": appointment_code,
                "final_status": status,
                "mutation_without_confirmation": ((cancel_commit.get("body") or {}).get("metadata") or {})
                .get("metrics", {})
                .get("mutation_without_confirmation"),
            }
        )

    return finish(checks, args.output)


def grade_health(payload: dict[str, Any]) -> dict[str, Any]:
    status = payload.get("status")
    if status != "ok":
        return {"ok": False, "reason": "agent_health_not_ok", "status": status}
    dependencies = payload.get("dependencies") if isinstance(payload.get("dependencies"), dict) else {}
    for name in ("emr", "llm"):
        dependency = dependencies.get(name) if isinstance(dependencies.get(name), dict) else {}
        if dependency.get("status") != "ok":
            return {"ok": False, "reason": f"{name}_dependency_not_ok", "status": dependency.get("status")}
    return {"ok": True, "reason": "ok", "status": status}


def confirmation_token(payload: dict[str, Any], *, expected_flow: str, expected_action: str) -> str | None:
    confirmation = payload.get("confirmation") if isinstance(payload.get("confirmation"), dict) else {}
    if payload.get("flow") != expected_flow:
        return None
    if confirmation.get("action") != expected_action:
        return None
    token = confirmation.get("token")
    return token if isinstance(token, str) and token else None


async def seed_booking_slot(
    client: httpx.AsyncClient,
    *,
    emr_url: str,
    doctor_id: str,
    clinic_id: str,
    work_date: str,
) -> dict[str, Any]:
    shift_name = f"LangGraph live check {uuid4().hex[:8]}"
    shift = await request(
        client,
        "POST",
        f"{emr_url.rstrip('/')}/api/v1/work-shifts",
        json={
            "shift_name": shift_name,
            "start_time": "09:00",
            "end_time": "12:00",
            "description": "Seeded by LangGraph live mutation check",
        },
    )
    if not shift["ok"]:
        return {"ok": False, "stage": "work_shift", "status_code": shift.get("status_code"), "body": shift.get("body")}
    shift_id = (shift.get("body") or {}).get("shift_id")
    schedule = await request(
        client,
        "POST",
        f"{emr_url.rstrip('/')}/api/v1/doctor-schedules",
        json={
            "doctor_id": doctor_id,
            "clinic_id": clinic_id,
            "shift_id": shift_id,
            "work_date": work_date,
            "max_patients": 20,
            "status": "scheduled",
            "notes": "Seeded by LangGraph live mutation check",
        },
    )
    body = schedule.get("body")
    schedule_id = body.get("schedule_id") or body.get("id") if isinstance(body, dict) else None
    return {
        "ok": schedule["ok"],
        "stage": "doctor_schedule",
        "status_code": schedule.get("status_code"),
        "shift_id": shift_id,
        "schedule_id": schedule_id,
        "work_date": work_date,
    }


async def find_scheduled_appointment(
    client: httpx.AsyncClient,
    *,
    emr_url: str,
    patient_id: str,
    work_date: str,
) -> dict[str, Any] | None:
    result = await request(
        client,
        "GET",
        f"{emr_url.rstrip('/')}/api/v1/appointments/patient/{patient_id}",
        params={"status": "scheduled"},
    )
    body = result.get("body")
    items = body if isinstance(body, list) else body.get("data", []) if isinstance(body, dict) else []
    for item in items:
        appointment_date = str(item.get("appointment_date") or item.get("appointmentDate") or "").split("T", maxsplit=1)[0]
        if appointment_date == work_date:
            return {
                "id": item.get("id") or item.get("appointment_id") or item.get("appointmentId"),
                "code": item.get("code") or item.get("appointment_code") or item.get("appointmentCode"),
                "status": item.get("status"),
            }
    return None


async def chat(client: httpx.AsyncClient, agent_url: str, patient_id: str, body: dict[str, Any]) -> dict[str, Any]:
    return await request(
        client,
        "POST",
        f"{agent_url.rstrip('/')}/chat",
        headers={"x-patient-id": patient_id},
        json=body,
    )


async def request(client: httpx.AsyncClient, method: str, url: str, **kwargs: Any) -> dict[str, Any]:
    started = time.perf_counter()
    try:
        response = await client.request(method, url, **kwargs)
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        try:
            body: Any = response.json()
        except ValueError:
            body = response.text
        return {
            "ok": 200 <= response.status_code < 300,
            "status_code": response.status_code,
            "latency_ms": elapsed_ms,
            "body": body,
        }
    except httpx.HTTPError as exc:
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        return {
            "ok": False,
            "status_code": None,
            "latency_ms": elapsed_ms,
            "error": type(exc).__name__,
            "detail": str(exc),
        }


def finish(checks: list[dict[str, Any]], output: Path | None) -> int:
    payload = {"checks": checks, "passed": all(item.get("ok") for item in checks)}
    text = json.dumps(payload, indent=2)
    if output:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(text + "\n", encoding="utf-8")
    print(text)
    return 0 if payload["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
