from __future__ import annotations

import statistics
import time
from dataclasses import dataclass
from typing import Any

from .graph import BookingLangGraph
from .schemas import ChatRequest
from .tools import core_domain_tool_specs


@dataclass(frozen=True)
class EvalScenario:
    scenario_id: str
    turns: list[str]
    expected_flow: str
    expected_actions: list[str]
    patient_id: str | None = None
    confirm_after_prepare: bool = False


async def run_scenarios(graph: BookingLangGraph, scenarios: list[EvalScenario]) -> dict[str, Any]:
    latencies: list[float] = []
    successes = 0
    all_actions: set[str] = set()
    mutation_without_confirmation = 0
    ownership_violation = 0

    for scenario in scenarios:
        scenario_actions: list[str] = []
        last_response = None
        for turn in scenario.turns:
            request = ChatRequest(session_id=scenario.scenario_id, message=turn)
            if scenario.confirm_after_prepare and last_response and last_response.confirmation:
                request = ChatRequest(
                    session_id=scenario.scenario_id,
                    message=turn,
                    confirmation_token=last_response.confirmation.token,
                    confirmed=True,
                )
            started = time.perf_counter()
            last_response = await graph.handle_chat(request, trusted_patient_id=scenario.patient_id)
            latencies.append((time.perf_counter() - started) * 1000)
            scenario_actions.extend(last_response.actions)
            all_actions.update(last_response.actions)
            mutation_without_confirmation += int(last_response.metadata["metrics"]["mutation_without_confirmation"])
            ownership_violation += int(last_response.metadata["metrics"]["ownership_violation"])

        if last_response and last_response.flow == scenario.expected_flow and _contains_in_order(
            scenario_actions, scenario.expected_actions
        ):
            successes += 1

    p50 = statistics.median(latencies) if latencies else 0.0
    p95 = _percentile(latencies, 95)
    core_tool_names = {spec.name for spec in core_domain_tool_specs()}
    return {
        "scenario_success_rate": round(successes / len(scenarios), 4) if scenarios else 0.0,
        "end_state_correctness": round(successes / len(scenarios), 4) if scenarios else 0.0,
        "pass_k": None,
        "mutation_without_confirmation": mutation_without_confirmation,
        "ownership_violation": ownership_violation,
        "core_domain_tool_coverage": round(len(all_actions & core_tool_names) / len(core_tool_names), 4),
        "p50_latency_ms": round(p50, 2),
        "p95_latency_ms": round(p95, 2),
        "observed_actions": sorted(all_actions),
    }


def _contains_in_order(observed: list[str], expected: list[str]) -> bool:
    position = 0
    for action in observed:
        if position < len(expected) and action == expected[position]:
            position += 1
    return position == len(expected)


def _percentile(values: list[float], percentile: int) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = min(len(ordered) - 1, round((percentile / 100) * (len(ordered) - 1)))
    return ordered[index]
