import pytest

from src.eval_runner import EvalScenario, run_scenarios
from src.graph import BookingLangGraph
from src.tools import InMemoryDomainTools


@pytest.mark.asyncio
async def test_eval_runner_reports_agentic_metrics_for_core_flows():
    graph = BookingLangGraph(domain_tools=InMemoryDomainTools())
    scenarios = [
        EvalScenario(
            scenario_id="lookup-1",
            turns=["Show my appointments"],
            expected_flow="lookup",
            expected_actions=["get_patient_appointments"],
            patient_id="patient-1",
        ),
        EvalScenario(
            scenario_id="cancel-1",
            turns=["Cancel appointment APT-001", "Yes, confirm it"],
            expected_flow="cancel",
            expected_actions=["resolve_appointment_reference", "prepare_cancel", "commit_cancel"],
            patient_id="patient-1",
            confirm_after_prepare=True,
        ),
    ]

    summary = await run_scenarios(graph, scenarios)

    assert summary["scenario_success_rate"] == 1.0
    assert summary["mutation_without_confirmation"] == 0
    assert summary["ownership_violation"] == 0
    assert summary["core_domain_tool_coverage"] >= 0.3
    assert summary["p50_latency_ms"] >= 0
    assert summary["p95_latency_ms"] >= summary["p50_latency_ms"]
