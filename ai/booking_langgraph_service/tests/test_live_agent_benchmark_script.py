from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


def _load_benchmark():
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "live_agent_benchmark.py"
    spec = importlib.util.spec_from_file_location("live_agent_benchmark", script_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_benchmark_aggregates_agentic_metrics_by_flow():
    benchmark = _load_benchmark()

    results = [
        benchmark.ScenarioResult(
            scenario_id="lookup-0",
            scenario_type="lookup",
            flow="lookup",
            ok=True,
            end_state_correct=True,
            actions=["get_patient_appointments"],
            latencies_ms=[100.0],
            metrics={"mutation_without_confirmation": 0, "ownership_violation": 0, "clarification_count": 0},
        ),
        benchmark.ScenarioResult(
            scenario_id="booking-0",
            scenario_type="booking_reschedule_cancel",
            flow="booking",
            ok=True,
            end_state_correct=True,
            actions=[
                "search_booking_catalog",
                "find_booking_options",
                "prepare_booking",
                "commit_booking",
                "resolve_appointment_reference",
                "prepare_reschedule",
                "commit_reschedule",
                "prepare_cancel",
                "commit_cancel",
            ],
            latencies_ms=[120.0, 140.0, 160.0],
            metrics={"mutation_without_confirmation": 0, "ownership_violation": 0, "backend_conflict_rate": 0},
        ),
        benchmark.ScenarioResult(
            scenario_id="cancel-0",
            scenario_type="cancel",
            flow="cancel",
            ok=False,
            end_state_correct=False,
            actions=["resolve_appointment_reference"],
            latencies_ms=[200.0],
            metrics={"mutation_without_confirmation": 1, "ownership_violation": 0, "timeout_rate": 1},
            error="missing confirmation",
        ),
    ]

    summary = benchmark.summarize_results(results, pass_k=3)

    assert summary["scenario_count"] == 3
    assert summary["scenario_success_rate"] == 0.6667
    assert summary["end_state_correctness"] == 0.6667
    assert summary["pass_at_1"] == 0.6667
    assert summary["pass_at_k"] == 0.6667
    assert summary["mutation_without_confirmation"] == 1
    assert summary["timeout_rate"] == 0.3333
    assert summary["per_flow_success"]["lookup"] == 1.0
    assert summary["per_flow_success"]["booking"] == 1.0
    assert summary["per_flow_success"]["cancel"] == 0.0
    assert summary["core_domain_tool_coverage"] >= 0.8
    assert summary["p95_latency_ms"] >= summary["p50_latency_ms"]


def test_benchmark_markdown_report_includes_cutover_metrics():
    benchmark = _load_benchmark()
    summary = {
        "scenario_count": 2,
        "scenario_success_rate": 1.0,
        "end_state_correctness": 1.0,
        "pass_at_1": 1.0,
        "pass_at_k": 1.0,
        "mutation_without_confirmation": 0,
        "ownership_violation": 0,
        "timeout_rate": 0,
        "p50_latency_ms": 100,
        "p95_latency_ms": 200,
        "core_domain_tool_coverage": 1.0,
        "per_flow_success": {"lookup": 1.0, "booking": 1.0},
    }

    report = benchmark.render_markdown_report(summary)

    assert "# Live Agent Benchmark Report" in report
    assert "| scenario_success_rate | 1.0 |" in report
    assert "| mutation_without_confirmation | 0 |" in report
    assert "## Per-Flow Success" in report


def test_natural_single_turn_scenarios_cover_core_flows_and_guards():
    benchmark = _load_benchmark()

    scenarios = benchmark.natural_single_turn_scenarios()

    assert len(scenarios) >= 8
    assert {scenario.expected_flow for scenario in scenarios} >= {"lookup", "booking", "cancel", "reschedule", "unknown"}
    assert any(scenario.scenario_type == "unauth_lookup_guard" for scenario in scenarios)
    assert any("get_patient_appointments" in scenario.expected_actions for scenario in scenarios)
    assert any("prepare_cancel" in scenario.forbidden_actions for scenario in scenarios)
    assert any("prepare_reschedule" in scenario.forbidden_actions for scenario in scenarios)


def test_single_turn_grader_requires_expected_actions_and_blocks_forbidden_actions():
    benchmark = _load_benchmark()
    scenario = benchmark.NaturalSingleTurnScenario(
        scenario_type="cancel_missing_reference",
        message="Cancel my appointment.",
        expected_flow="cancel",
        expected_actions=[],
        forbidden_actions=["prepare_cancel", "commit_cancel"],
    )

    good_turn = {
        "ok": True,
        "body": {
            "flow": "cancel",
            "actions": [],
            "confirmation": None,
            "metadata": {"metrics": {"mutation_without_confirmation": 0}},
        },
    }
    bad_turn = {
        "ok": True,
        "body": {
            "flow": "cancel",
            "actions": ["prepare_cancel"],
            "confirmation": {"action": "commit_cancel"},
            "metadata": {"metrics": {"mutation_without_confirmation": 0}},
        },
    }

    assert benchmark.grade_single_turn_scenario(scenario, good_turn)
    assert not benchmark.grade_single_turn_scenario(scenario, bad_turn)
