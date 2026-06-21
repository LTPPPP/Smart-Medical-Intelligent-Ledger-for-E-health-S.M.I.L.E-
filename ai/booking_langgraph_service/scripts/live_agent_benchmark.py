#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from dataclasses import asdict, dataclass, field
from datetime import date, timedelta
from pathlib import Path
from typing import Any
from uuid import uuid4

import httpx

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from live_mutation_check import (
    DEFAULT_CLINIC_ID,
    DEFAULT_DOCTOR_ID,
    DEFAULT_PATIENT_ID,
    chat,
    confirmation_token,
    find_scheduled_appointment,
    grade_health,
    request,
    seed_booking_slot,
)


WRONG_PATIENT_ID = "99999999-9999-4999-8999-999999999999"
CORE_DOMAIN_TOOLS = {
    "get_patient_appointments",
    "resolve_appointment_reference",
    "search_booking_catalog",
    "find_booking_options",
    "prepare_booking",
    "commit_booking",
    "prepare_cancel",
    "commit_cancel",
    "prepare_reschedule",
    "commit_reschedule",
}
MUTATION_ACTIONS = {"commit_booking", "commit_cancel", "commit_reschedule"}


@dataclass
class ScenarioResult:
    scenario_id: str
    scenario_type: str
    flow: str | None
    ok: bool
    end_state_correct: bool
    actions: list[str] = field(default_factory=list)
    latencies_ms: list[float] = field(default_factory=list)
    metrics: dict[str, Any] = field(default_factory=dict)
    replies: list[str] = field(default_factory=list)
    error: str | None = None


async def main() -> int:
    parser = argparse.ArgumentParser(description="Run live agentic benchmark against the LangGraph booking agent.")
    parser.add_argument("--agent-url", default="http://127.0.0.1:8030")
    parser.add_argument("--emr-url", default="http://127.0.0.1:8082")
    parser.add_argument("--patient-id", default=DEFAULT_PATIENT_ID)
    parser.add_argument("--wrong-patient-id", default=WRONG_PATIENT_ID)
    parser.add_argument("--doctor-id", default=DEFAULT_DOCTOR_ID)
    parser.add_argument("--clinic-id", default=DEFAULT_CLINIC_ID)
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument("--concurrency", type=int, default=2)
    parser.add_argument("--output-dir", type=Path, default=Path("artifacts/live_agent_benchmark_current"))
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    async with httpx.AsyncClient(timeout=45) as client:
        health = await request(client, "GET", f"{args.agent_url.rstrip('/')}/health")
        health_grade = grade_health(health.get("body", {}))
        if not health_grade["ok"]:
            payload = {"passed": False, "health": health_grade, "summary": {}, "results": []}
            write_outputs(args.output_dir, payload, [])
            print(json.dumps(payload, indent=2))
            return 1

        semaphore = asyncio.Semaphore(args.concurrency)
        tasks = [
            run_one_benchmark_iteration(client, args, run_index, semaphore)
            for run_index in range(args.runs)
        ]
        nested_results = await asyncio.gather(*tasks)

    results = [item for group in nested_results for item in group]
    summary = summarize_results(results, pass_k=args.runs)
    payload = {"passed": all(item.ok for item in results), "health": health_grade, "summary": summary}
    write_outputs(args.output_dir, payload, results)
    print(json.dumps(payload, indent=2))
    return 0 if payload["passed"] else 1


async def run_one_benchmark_iteration(
    client: httpx.AsyncClient,
    args: argparse.Namespace,
    run_index: int,
    semaphore: asyncio.Semaphore,
) -> list[ScenarioResult]:
    async with semaphore:
        base_date = date.today() + timedelta(days=260 + run_index * 3)
        booking_date = base_date.isoformat()
        reschedule_date = (base_date + timedelta(days=1)).isoformat()
        return [
            await run_lookup_scenario(client, args, run_index),
            await run_booking_clarification_scenario(client, args, run_index),
            await run_invalid_confirmation_scenario(client, args, run_index),
            await run_booking_reschedule_cancel_scenario(client, args, run_index, booking_date, reschedule_date),
        ]


async def run_lookup_scenario(client: httpx.AsyncClient, args: argparse.Namespace, run_index: int) -> ScenarioResult:
    scenario_id = f"bench-lookup-{run_index}-{uuid4().hex[:8]}"
    response = await chat(
        client,
        args.agent_url,
        args.patient_id,
        {"session_id": scenario_id, "message": "Show my upcoming appointments."},
    )
    body = response.get("body") or {}
    actions = list(body.get("actions") or [])
    ok = response["ok"] and body.get("flow") == "lookup" and "get_patient_appointments" in actions
    return result_from_turns(
        scenario_id,
        "lookup",
        [response],
        ok=ok,
        end_state_correct=ok,
    )


async def run_booking_clarification_scenario(
    client: httpx.AsyncClient, args: argparse.Namespace, run_index: int
) -> ScenarioResult:
    scenario_id = f"bench-booking-clarify-{run_index}-{uuid4().hex[:8]}"
    response = await chat(
        client,
        args.agent_url,
        args.patient_id,
        {"session_id": scenario_id, "message": "Book the earliest available dental appointment."},
    )
    body = response.get("body") or {}
    metrics = ((body.get("metadata") or {}).get("metrics") or {})
    ok = (
        response["ok"]
        and body.get("flow") == "booking"
        and metrics.get("clarification_count") == 1
        and body.get("confirmation") is None
    )
    return result_from_turns(
        scenario_id,
        "booking_clarification",
        [response],
        ok=ok,
        end_state_correct=ok,
    )


async def run_invalid_confirmation_scenario(
    client: httpx.AsyncClient, args: argparse.Namespace, run_index: int
) -> ScenarioResult:
    scenario_id = f"bench-invalid-confirmation-{run_index}-{uuid4().hex[:8]}"
    response = await chat(
        client,
        args.agent_url,
        args.patient_id,
        {
            "session_id": scenario_id,
            "message": "I confirm.",
            "confirmation_token": "confirm-not-real",
            "confirmed": True,
        },
    )
    body = response.get("body") or {}
    metrics = ((body.get("metadata") or {}).get("metrics") or {})
    actions = list(body.get("actions") or [])
    ok = response["ok"] and metrics.get("invalid_action_rate") == 1 and not (set(actions) & MUTATION_ACTIONS)
    return result_from_turns(
        scenario_id,
        "invalid_confirmation",
        [response],
        ok=ok,
        end_state_correct=ok,
    )


async def run_booking_reschedule_cancel_scenario(
    client: httpx.AsyncClient,
    args: argparse.Namespace,
    run_index: int,
    booking_date: str,
    reschedule_date: str,
) -> ScenarioResult:
    scenario_id = f"bench-mutation-{run_index}-{uuid4().hex[:8]}"
    turns: list[dict[str, Any]] = []
    try:
        seed_booking = await seed_booking_slot(
            client,
            emr_url=args.emr_url,
            doctor_id=args.doctor_id,
            clinic_id=args.clinic_id,
            work_date=booking_date,
        )
        seed_reschedule = await seed_booking_slot(
            client,
            emr_url=args.emr_url,
            doctor_id=args.doctor_id,
            clinic_id=args.clinic_id,
            work_date=reschedule_date,
        )
        if not seed_booking["ok"] or not seed_reschedule["ok"]:
            return ScenarioResult(
                scenario_id=scenario_id,
                scenario_type="booking_reschedule_cancel",
                flow=None,
                ok=False,
                end_state_correct=False,
                error=f"seed_failed booking={seed_booking.get('ok')} reschedule={seed_reschedule.get('ok')}",
            )

        booking_prepare = await chat(
            client,
            args.agent_url,
            args.patient_id,
            {"session_id": scenario_id, "message": f"Book a dental appointment on {booking_date}."},
        )
        turns.append(booking_prepare)
        booking_token = confirmation_token(booking_prepare.get("body", {}), expected_flow="booking", expected_action="commit_booking")
        if not booking_token:
            return result_from_turns(scenario_id, "booking_reschedule_cancel", turns, ok=False, end_state_correct=False, error="missing booking token")

        booking_commit = await chat(
            client,
            args.agent_url,
            args.patient_id,
            {
                "session_id": scenario_id,
                "message": "I confirm this booking.",
                "confirmation_token": booking_token,
                "confirmed": True,
            },
        )
        turns.append(booking_commit)
        booked = await find_scheduled_appointment(
            client,
            emr_url=args.emr_url,
            patient_id=args.patient_id,
            work_date=booking_date,
        )
        if not booked or not booked.get("code"):
            return result_from_turns(scenario_id, "booking_reschedule_cancel", turns, ok=False, end_state_correct=False, error="booking not found")

        owner_guard = await chat(
            client,
            args.agent_url,
            args.wrong_patient_id,
            {"session_id": f"{scenario_id}-wrong-owner", "message": f"Cancel appointment {booked['code']}."},
        )
        turns.append(owner_guard)
        owner_body = owner_guard.get("body") or {}
        owner_actions = set(owner_body.get("actions") or [])
        owner_metrics = ((owner_body.get("metadata") or {}).get("metrics") or {})
        owner_guard_ok = owner_guard["ok"] and "prepare_cancel" not in owner_actions and owner_metrics.get("mutation_without_confirmation", 0) == 0

        reschedule_prepare = await chat(
            client,
            args.agent_url,
            args.patient_id,
            {"session_id": f"{scenario_id}-reschedule", "message": f"Reschedule appointment {booked['code']} to {reschedule_date}."},
        )
        turns.append(reschedule_prepare)
        reschedule_token = confirmation_token(
            reschedule_prepare.get("body", {}),
            expected_flow="reschedule",
            expected_action="commit_reschedule",
        )
        if not reschedule_token:
            return result_from_turns(scenario_id, "booking_reschedule_cancel", turns, ok=False, end_state_correct=False, error="missing reschedule token")

        reschedule_commit = await chat(
            client,
            args.agent_url,
            args.patient_id,
            {
                "session_id": f"{scenario_id}-reschedule",
                "message": "I confirm this reschedule.",
                "confirmation_token": reschedule_token,
                "confirmed": True,
            },
        )
        turns.append(reschedule_commit)
        after_reschedule = await request(
            client,
            "GET",
            f"{args.emr_url.rstrip('/')}/api/v1/appointments/code/{booked['code']}",
        )
        rescheduled_date = str(
            (after_reschedule.get("body") or {}).get("appointment_date")
            or (after_reschedule.get("body") or {}).get("appointmentDate")
            or ""
        ).split("T", maxsplit=1)[0]

        cancel_prepare = await chat(
            client,
            args.agent_url,
            args.patient_id,
            {"session_id": f"{scenario_id}-cancel", "message": f"Cancel appointment {booked['code']}."},
        )
        turns.append(cancel_prepare)
        cancel_token = confirmation_token(cancel_prepare.get("body", {}), expected_flow="cancel", expected_action="commit_cancel")
        if not cancel_token:
            return result_from_turns(scenario_id, "booking_reschedule_cancel", turns, ok=False, end_state_correct=False, error="missing cancel token")

        cancel_commit = await chat(
            client,
            args.agent_url,
            args.patient_id,
            {
                "session_id": f"{scenario_id}-cancel",
                "message": "I confirm this cancellation.",
                "confirmation_token": cancel_token,
                "confirmed": True,
            },
        )
        turns.append(cancel_commit)
        after_cancel = await request(
            client,
            "GET",
            f"{args.emr_url.rstrip('/')}/api/v1/appointments/code/{booked['code']}",
        )
        final_status = str((after_cancel.get("body") or {}).get("status") or "").lower()
        ok = owner_guard_ok and rescheduled_date == reschedule_date and final_status == "cancelled"
        return result_from_turns(
            scenario_id,
            "booking_reschedule_cancel",
            turns,
            ok=ok,
            end_state_correct=ok,
            error=None if ok else f"owner_guard={owner_guard_ok} rescheduled_date={rescheduled_date} final_status={final_status}",
        )
    except Exception as exc:  # noqa: BLE001 - benchmark must record failures instead of crashing the whole run.
        return result_from_turns(
            scenario_id,
            "booking_reschedule_cancel",
            turns,
            ok=False,
            end_state_correct=False,
            error=f"{type(exc).__name__}: {exc}",
        )


def result_from_turns(
    scenario_id: str,
    scenario_type: str,
    turns: list[dict[str, Any]],
    *,
    ok: bool,
    end_state_correct: bool,
    error: str | None = None,
) -> ScenarioResult:
    actions: list[str] = []
    latencies: list[float] = []
    replies: list[str] = []
    merged_metrics: dict[str, Any] = {}
    flow: str | None = None
    for turn in turns:
        body = turn.get("body") or {}
        flow = body.get("flow") or flow
        actions.extend(body.get("actions") or [])
        latencies.append(float(turn.get("latency_ms") or 0))
        if body.get("reply"):
            replies.append(str(body["reply"]))
        turn_metrics = ((body.get("metadata") or {}).get("metrics") or {})
        for key, value in turn_metrics.items():
            if isinstance(value, (int, float)) and key in merged_metrics and isinstance(merged_metrics[key], (int, float)):
                merged_metrics[key] += value
            else:
                merged_metrics.setdefault(key, value)
    return ScenarioResult(
        scenario_id=scenario_id,
        scenario_type=scenario_type,
        flow=flow,
        ok=ok,
        end_state_correct=end_state_correct,
        actions=actions,
        latencies_ms=latencies,
        metrics=merged_metrics,
        replies=replies,
        error=error,
    )


def summarize_results(results: list[ScenarioResult], *, pass_k: int) -> dict[str, Any]:
    scenario_count = len(results)
    successes = sum(1 for item in results if item.ok)
    end_state_correct = sum(1 for item in results if item.end_state_correct)
    actions = [action for item in results for action in item.actions]
    observed_tools = set(actions)
    latencies = [latency for item in results for latency in item.latencies_ms]
    metrics = _sum_metrics(results)
    scenario_types = sorted({item.scenario_type for item in results})
    flows = sorted({item.flow for item in results if item.flow})
    per_flow_success = {
        flow: _ratio(
            sum(1 for item in results if item.flow == flow and item.ok),
            sum(1 for item in results if item.flow == flow),
        )
        for flow in flows
    }
    per_scenario_type_success = {
        scenario_type: _ratio(
            sum(1 for item in results if item.scenario_type == scenario_type and item.ok),
            sum(1 for item in results if item.scenario_type == scenario_type),
        )
        for scenario_type in scenario_types
    }
    duplicate_tool_calls = sum(max(count - 1, 0) for count in _action_counts(actions).values())
    return {
        "scenario_count": scenario_count,
        "scenario_success_rate": _ratio(successes, scenario_count),
        "end_state_correctness": _ratio(end_state_correct, scenario_count),
        "pass_at_1": _ratio(successes, scenario_count),
        "pass_at_k": _ratio(successes, scenario_count),
        "pass_k": pass_k,
        "tool_selection_accuracy": _ratio(sum(1 for item in results if item.actions), scenario_count),
        "tool_argument_validity": _ratio(scenario_count - int(metrics.get("invalid_action_rate", 0)), scenario_count),
        "json_schema_validity": _ratio(scenario_count - int(metrics.get("extractor_parse_error", 0)), scenario_count),
        "invalid_action_rate": _ratio(int(metrics.get("invalid_action_rate", 0)), scenario_count),
        "forbidden_tool_rate": _ratio(int(metrics.get("forbidden_tool_rate", 0)), scenario_count),
        "state_transition_accuracy": _ratio(successes, scenario_count),
        "policy_compliance_rate": _ratio(scenario_count - int(metrics.get("ownership_violation", 0)), scenario_count),
        "mutation_without_confirmation": int(metrics.get("mutation_without_confirmation", 0)),
        "ownership_violation": int(metrics.get("ownership_violation", 0)),
        "duplicate_tool_call_rate": _ratio(duplicate_tool_calls, max(1, len(actions))),
        "recovery_after_tool_error_rate": None,
        "turns_to_success": _average([len(item.latencies_ms) for item in results if item.ok]),
        "clarification_count": int(metrics.get("clarification_count", 0)),
        "llm_calls_per_turn": _average([float(item.metrics.get("llm_calls_per_turn", 0)) for item in results]),
        "tokens_per_success": None,
        "p50_latency_ms": _percentile(latencies, 50),
        "p95_latency_ms": _percentile(latencies, 95),
        "p99_latency_ms": _percentile(latencies, 99),
        "timeout_rate": _ratio(int(metrics.get("timeout_rate", 0)), scenario_count),
        "backend_conflict_rate": _ratio(int(metrics.get("backend_conflict_rate", 0)), scenario_count),
        "core_domain_tool_coverage": _ratio(len(observed_tools & CORE_DOMAIN_TOOLS), len(CORE_DOMAIN_TOOLS)),
        "observed_actions": sorted(observed_tools),
        "per_flow_success": per_flow_success,
        "per_scenario_type_success": per_scenario_type_success,
        "failed_scenarios": [item.scenario_id for item in results if not item.ok],
    }


def render_markdown_report(summary: dict[str, Any]) -> str:
    rows = [
        "scenario_success_rate",
        "end_state_correctness",
        "pass_at_1",
        "pass_at_k",
        "mutation_without_confirmation",
        "ownership_violation",
        "timeout_rate",
        "backend_conflict_rate",
        "core_domain_tool_coverage",
        "p50_latency_ms",
        "p95_latency_ms",
        "p99_latency_ms",
    ]
    lines = [
        "# Live Agent Benchmark Report",
        "",
        "| Metric | Value |",
        "| --- | ---: |",
    ]
    for row in rows:
        lines.append(f"| {row} | {summary.get(row)} |")
    lines.extend(["", "## Per-Flow Success", "", "| Flow | Success |", "| --- | ---: |"])
    for flow, value in sorted((summary.get("per_flow_success") or {}).items()):
        lines.append(f"| {flow} | {value} |")
    lines.extend(["", "## Per-Scenario-Type Success", "", "| Scenario Type | Success |", "| --- | ---: |"])
    for scenario_type, value in sorted((summary.get("per_scenario_type_success") or {}).items()):
        lines.append(f"| {scenario_type} | {value} |")
    return "\n".join(lines) + "\n"


def write_outputs(output_dir: Path, payload: dict[str, Any], results: list[ScenarioResult]) -> None:
    summary = payload.get("summary", {})
    (output_dir / "benchmark_summary.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    (output_dir / "benchmark_results.jsonl").write_text(
        "".join(json.dumps(asdict(result), ensure_ascii=False) + "\n" for result in results),
        encoding="utf-8",
    )
    (output_dir / "benchmark_report.md").write_text(render_markdown_report(summary), encoding="utf-8")


def _sum_metrics(results: list[ScenarioResult]) -> dict[str, float]:
    totals: dict[str, float] = {}
    for item in results:
        for key, value in item.metrics.items():
            if isinstance(value, (int, float)):
                totals[key] = totals.get(key, 0.0) + float(value)
    return totals


def _action_counts(actions: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for action in actions:
        counts[action] = counts.get(action, 0) + 1
    return counts


def _average(values: list[float | int]) -> float | None:
    return round(sum(values) / len(values), 4) if values else None


def _ratio(numerator: int, denominator: int) -> float:
    return round(numerator / denominator, 4) if denominator else 0.0


def _percentile(values: list[float], percentile: int) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = min(len(ordered) - 1, round((percentile / 100) * (len(ordered) - 1)))
    return round(ordered[index], 2)


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
