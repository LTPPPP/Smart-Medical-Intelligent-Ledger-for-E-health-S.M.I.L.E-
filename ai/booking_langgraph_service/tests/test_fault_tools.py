from __future__ import annotations

from pathlib import Path

import pytest

from src.benchmark_schema import load_scenarios
from src.fault_tools import FaultInjectingDomainTools, FaultRule


ROOT = Path(__file__).resolve().parents[1]


@pytest.mark.asyncio
async def test_transient_read_timeout_occurs_once_then_succeeds():
    tools = FaultInjectingDomainTools(
        faults=[FaultRule(method="find_booking_options", occurrence=1, outcome="timeout")]
    )

    with pytest.raises(TimeoutError):
        await tools.find_booking_options("patient-1", {"date_hint": "2026-07-01"})
    result = await tools.find_booking_options("patient-1", {"date_hint": "2026-07-01"})

    assert result[0]["id"] == "option-001"
    assert tools.calls[0].method == "find_booking_options"
    assert tools.calls[0].outcome == "timeout"
    assert tools.calls[1].outcome == "success"


@pytest.mark.asyncio
async def test_commit_is_idempotent_for_same_key():
    tools = FaultInjectingDomainTools()

    first = await tools.commit_booking("patient-1", "option-001", "confirm-1")
    second = await tools.commit_booking("patient-1", "option-001", "confirm-1")

    assert first == second
    assert tools.mutations == ["commit_booking:option-001"]


@pytest.mark.asyncio
async def test_fault_adapter_records_sanitized_arguments_and_malformed_payloads():
    tools = FaultInjectingDomainTools(
        faults=[FaultRule(method="get_patient_appointments", occurrence=1, outcome="malformed")]
    )

    result = await tools.get_patient_appointments("patient-1")

    assert result == [{"malformed": True}]
    assert tools.calls[0].arguments == {"patient_id": "patient-1"}
    assert tools.calls[0].latency_ms >= 0


@pytest.mark.asyncio
async def test_date_aware_fixture_returns_exact_configured_booking_option():
    tools = FaultInjectingDomainTools(
        booking_options_by_date={
            "2027-06-09": [
                {"id": "option-date-specific", "summary": "Wednesday 2027-06-09 at 10:00."}
            ]
        }
    )

    result = await tools.find_booking_options("patient-1", {"date_hint": "2027-06-09"})

    assert result == [
        {"id": "option-date-specific", "summary": "Wednesday 2027-06-09 at 10:00."}
    ]
    assert tools.calls[0].arguments["slots"] == {"date_hint": "2027-06-09"}


@pytest.mark.asyncio
async def test_slot_subset_fixture_selects_exact_booking_option():
    tools = FaultInjectingDomainTools(
        booking_options_by_slots=[
            {
                "match_slots": {"date_hint": "Monday", "time_hint": "16:00"},
                "options": [{"id": "option-monday-1600", "summary": "Monday at 16:00."}],
            }
        ]
    )

    result = await tools.find_booking_options(
        "patient-1",
        {"date_hint": "Monday", "time_hint": "16:00", "service_hint": "dental"},
    )

    assert result[0]["id"] == "option-monday-1600"


def test_backend_fault_dataset_declares_nine_scenarios():
    scenarios = load_scenarios(ROOT / "datasets" / "agent_backend_faults.jsonl")

    assert [scenario.scenario_id for scenario in scenarios] == [
        "fault-001-slot-conflict",
        "fault-002-transient-read",
        "fault-003-permanent-read",
        "fault-004-duplicate-reference",
        "fault-005-already-cancelled",
        "fault-006-reschedule-race",
        "fault-007-wrong-owner",
        "fault-008-empty-payload",
        "fault-009-malformed-payload",
    ]


def test_duplicate_reference_scenario_uses_generic_ambiguity_fixture():
    scenario = next(
        item
        for item in load_scenarios(ROOT / "datasets" / "agent_backend_faults.jsonl")
        if item.scenario_id == "fault-004-duplicate-reference"
    )

    assert scenario.turns[0].command_fixture.model_dump() == {
        "intent": "cancel",
        "dialogue_act": None,
        "slots": {"appointment_ref": "nearest"},
    }
    assert scenario.fault_script[0].model_dump() == {
        "method": "resolve_appointment_reference",
        "occurrence": 1,
        "outcome": "ambiguous",
    }
