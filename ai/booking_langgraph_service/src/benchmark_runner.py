from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any

from .benchmark_oracles import ObservedTurn, ScenarioGrade, grade_scenario
from .benchmark_schema import BenchmarkScenario, CommandFixture
from .fault_tools import FaultInjectingDomainTools
from .graph import BookingLangGraph
from .schemas import AgentCommand, ChatRequest, ChatResponse, FlowName, SlotUpdate
from .tools import DomainTools


@dataclass(frozen=True)
class ScenarioTrace:
    scenario_id: str
    observed_turns: list[ObservedTurn]
    responses: list[ChatResponse]
    grade: ScenarioGrade
    assertions: dict[str, bool]
    elapsed_ms: float
    failure_categories: list[str] = field(default_factory=list)


class ScenarioCommandExtractor:
    last_error: str | None = None

    def __init__(self, fixtures: list[CommandFixture | None]) -> None:
        self._fixtures = iter(fixtures)

    async def extract(self, message: str) -> AgentCommand:
        fixture = next(self._fixtures, None)
        if fixture is None:
            return AgentCommand.from_english_message(message)
        return AgentCommand(
            intent=FlowName(fixture.intent),
            dialogue_act=fixture.dialogue_act,
            confidence=1.0,
            slot_updates=[SlotUpdate(name=name, value=value) for name, value in fixture.slots.items()],
            selected_reference=fixture.slots.get("appointment_ref"),
        )


def build_scenario_graph(
    scenario: BenchmarkScenario,
    tools: DomainTools | None = None,
) -> BookingLangGraph:
    domain_tools = tools or FaultInjectingDomainTools(
        booking_options_by_date=scenario.tool_fixture.booking_options_by_date,
        booking_options_by_slots=[
            rule.model_dump() for rule in scenario.tool_fixture.booking_options_by_slots
        ],
    )
    extractor = ScenarioCommandExtractor([turn.command_fixture for turn in scenario.turns])
    return BookingLangGraph(domain_tools=domain_tools, extractor=extractor)


async def run_scenario(graph: BookingLangGraph, scenario: BenchmarkScenario) -> ScenarioTrace:
    started = time.perf_counter()
    base_session_id = f"benchmark:{scenario.scenario_id}"
    trusted_patient_id = scenario.trusted_patient_id
    responses: list[ChatResponse] = []
    observed: list[ObservedTurn] = []

    for index, turn in enumerate(scenario.turns):
        session_id = turn.session_id_override or base_session_id
        patient_id = turn.patient_id_override if turn.patient_id_override is not None else trusted_patient_id
        confirmation_token = turn.confirmation_token
        if confirmation_token is None and turn.confirmation_token_from_turn is not None:
            try:
                confirmation_token = responses[turn.confirmation_token_from_turn].confirmation.token  # type: ignore[union-attr]
            except (IndexError, AttributeError):
                confirmation_token = None
        request = ChatRequest(
            session_id=session_id,
            message=turn.message,
            selected_doctor_id=turn.selected_doctor_id,
            selected_booking_option_id=turn.selected_booking_option_id,
            confirmation_token=confirmation_token,
            confirmed=turn.confirmed,
        )
        response = await graph.handle_chat(request=request, trusted_patient_id=patient_id)
        responses.append(response)
        observed.append(_observed_from_response(response))

    mutations = list(getattr(graph.domain_tools, "mutations", []))
    grade = grade_scenario(scenario, observed, mutations=mutations)
    assertions = _terminal_assertions(scenario, mutations, observed)
    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
    return ScenarioTrace(
        scenario_id=scenario.scenario_id,
        observed_turns=observed,
        responses=responses,
        grade=grade,
        assertions=assertions,
        elapsed_ms=elapsed_ms,
        failure_categories=grade.failure_categories,
    )


def _observed_from_response(response: ChatResponse) -> ObservedTurn:
    return ObservedTurn(
        flow=str(response.flow),
        reply=response.reply,
        actions=list(response.actions),
        confirmation=response.confirmation.model_dump() if response.confirmation else None,
        safe_state=dict(response.safe_state),
        metrics=dict((response.metadata or {}).get("metrics") or {}),
    )


def _terminal_assertions(
    scenario: BenchmarkScenario,
    mutations: list[str],
    observed: list[ObservedTurn],
) -> dict[str, bool]:
    expected_mutations = list(scenario.strict_state_oracle.get("mutations", []))
    latest_expected = expected_mutations[-1] if expected_mutations else None
    stale_commits = [mutation for mutation in mutations if mutation not in expected_mutations]
    assertions = {
        "superseded_intent_not_committed": not stale_commits,
        "latest_user_intent_committed": latest_expected in mutations if latest_expected else not mutations,
        "stale_candidate_rejected": not stale_commits,
        "cross_session_state_leak": _has_cross_session_state_leak(scenario, mutations, observed),
    }
    return assertions


def _has_cross_session_state_leak(
    scenario: BenchmarkScenario,
    mutations: list[str],
    observed: list[ObservedTurn],
) -> bool:
    has_cross_session_turn = any(turn.session_id_override for turn in scenario.turns)
    if not has_cross_session_turn:
        return False
    expected_mutations = list(scenario.strict_state_oracle.get("mutations", []))
    if mutations != expected_mutations:
        return bool(mutations)
    return any(turn.metrics.get("cross_session_state_leak") for turn in observed)
