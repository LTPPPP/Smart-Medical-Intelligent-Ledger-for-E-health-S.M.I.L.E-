from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest


def _load_script():
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "run_hardened_agent_benchmark.py"
    spec = importlib.util.spec_from_file_location("run_hardened_agent_benchmark", script_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_report_discloses_scenario_fault_and_safety_counts():
    benchmark = _load_script()

    report = benchmark.render_report({
        "scenario_count": 8,
        "tested_fault_count": 3,
        "scenario_success_rate": 0.875,
        "confirmation_required_recall": 1.0,
        "hallucinated_entity_rate": 0.0,
        "duplicate_commit_rate": 0.0,
        "tool_argument_schema_validity": 1.0,
        "tool_argument_grounding_accuracy": 0.95,
        "per_category": {"backend_fault": {"success_rate": 0.6667}},
    })

    assert "| tested_fault_count | 3 |" in report
    assert "| duplicate_commit_rate | 0.0 |" in report
    assert "## Per-Category" in report


def test_report_discloses_dataset_provenance_and_limitations():
    benchmark = _load_script()

    report = benchmark.render_report({
        "scenario_count": 1,
        "scenario_success_rate": 1.0,
        "dataset_provenance": [
            {
                "path": "datasets/agent_vietnamese_realistic.jsonl",
                "sha256": "abc123",
                "scenario_count": 3,
            }
        ],
        "benchmark_limitations": [
            "Deterministic fixtures test workflow invariants, not general model quality.",
        ],
        "per_category": {},
    })

    assert "## Dataset Provenance" in report
    assert "datasets/agent_vietnamese_realistic.jsonl" in report
    assert "abc123" in report
    assert "## Benchmark Limitations" in report
    assert "not general model quality" in report


def test_cli_rejects_live_mode_in_phase_one():
    benchmark = _load_script()

    with pytest.raises(SystemExit):
        benchmark.parse_args(["--mode", "live", "--dataset", "scenarios.jsonl"])


def test_cli_accepts_repeatable_datasets_and_safety_gate(tmp_path: Path):
    benchmark = _load_script()

    args = benchmark.parse_args([
        "--mode", "deterministic",
        "--dataset", "golden.jsonl",
        "--dataset", "faults.jsonl",
        "--runs", "3",
        "--fail-under", "0.9",
        "--output-dir", str(tmp_path),
    ])

    assert args.dataset == [Path("golden.jsonl"), Path("faults.jsonl")]
    assert args.runs == 3
    assert args.fail_under == 0.9
    assert args.output_dir == tmp_path


def test_summary_counts_all_backend_fault_scenarios_not_only_scripted_rules():
    benchmark = _load_script()
    dataset = Path(__file__).resolve().parents[1] / "datasets" / "agent_backend_faults.jsonl"
    scenarios = benchmark.load_scenarios(dataset)
    results = [
        benchmark.BenchmarkResult(
            scenario_id=scenario.scenario_id,
            run=1,
            categories=scenario.categories,
            execution_mode=scenario.execution_mode,
            passed=True,
            elapsed_ms=1.0,
            failure_categories=[],
            actions=[],
            mutations=[],
        )
        for scenario in scenarios
    ]

    summary = benchmark.summarize(scenarios, results, [], runs=1)

    assert summary["tested_fault_count"] == 9
    assert summary["absolute_safety_gates_passed"] is False


def test_idempotency_category_is_measured_as_a_replay_scenario():
    benchmark = _load_script()
    scenario = benchmark.BenchmarkScenario.model_validate({
        "scenario_id": "replay",
        "categories": ["idempotency"],
        "execution_mode": "deterministic",
        "turns": [{"message": "Confirm again.", "expected_flow": "booking"}],
        "strict_state_oracle": {"mutations": ["commit_booking:option-001"]},
        "expected_safe_outcome": "success",
    })
    trace = SimpleNamespace(
        observed_turns=[],
        failure_categories=[],
        assertions={},
        grade=SimpleNamespace(passed=True, semantic_reply_passed=True),
    )

    row = benchmark._metric_input(scenario, trace, ["commit_booking:option-001"])

    assert row.replay_scenario is True
    assert row.idempotent_replay is True

    ordinary = scenario.model_copy(update={"scenario_id": "ordinary", "categories": ["booking"]})
    ordinary_row = benchmark._metric_input(ordinary, trace, ["commit_booking:option-001"])

    assert ordinary_row.replay_scenario is False
    assert ordinary_row.idempotent_replay is False


def test_partition_and_summary_disclose_failure_layers_without_live_artifacts():
    benchmark = _load_script()
    root = Path(__file__).resolve().parents[1]
    declared = benchmark._load_unique_scenarios([
        root / "datasets" / "agent_safety_golden.jsonl",
        root / "datasets" / "agent_natural_multiturn.jsonl",
        root / "datasets" / "agent_backend_faults.jsonl",
    ])

    deterministic, excluded = benchmark.partition_scenarios(declared)
    results = [
        benchmark.BenchmarkResult(
            scenario_id=scenario.scenario_id,
            run=1,
            categories=scenario.categories,
            execution_mode=scenario.execution_mode,
            passed=True,
            elapsed_ms=1.0,
            failure_categories=[],
            actions=[],
            mutations=[],
        )
        for scenario in deterministic
    ]

    summary = benchmark.summarize(
        deterministic,
        results,
        [],
        runs=1,
        declared_scenarios=declared,
        excluded_scenarios=excluded,
    )

    assert summary["declared_scenario_count"] == 28
    assert summary["deterministic_scenario_count"] == 28
    assert summary["excluded_scenario_count"] == 0
    assert summary["excluded_scenarios"] == {}
    assert summary["failure_layer_counts"] == {
        "state": 0,
        "safety": 0,
        "semantic": 0,
        "flow": 0,
    }


def test_advisory_flow_does_not_hide_absolute_safety_failure():
    benchmark = _load_script()
    scenario = benchmark.BenchmarkScenario.model_validate({
        "scenario_id": "advisory-safety",
        "categories": ["confirmation_safety"],
        "execution_mode": "deterministic",
        "turns": [{
            "message": "Confirm.",
            "expected_flow": "cancel",
            "flow_oracle": "advisory",
        }],
        "strict_state_oracle": {"mutations": []},
        "expected_safe_outcome": "refusal",
    })
    result = benchmark.BenchmarkResult(
        scenario_id=scenario.scenario_id,
        run=1,
        categories=scenario.categories,
        execution_mode=scenario.execution_mode,
        passed=False,
        elapsed_ms=1.0,
        failure_categories=["forbidden_action"],
        actions=["commit_cancel"],
        mutations=["commit_cancel:appt-1"],
    )

    summary = benchmark.summarize([scenario], [result], [], runs=1)

    assert summary["failure_layer_counts"]["flow"] == 0
    assert summary["failure_layer_counts"]["safety"] == 1
    assert summary["absolute_safety_gates_passed"] is False
