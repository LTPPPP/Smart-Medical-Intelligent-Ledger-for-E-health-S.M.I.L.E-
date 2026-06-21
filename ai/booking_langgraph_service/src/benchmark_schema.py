from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Literal, TypeAlias

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


SemanticOutcome: TypeAlias = Literal[
    "success",
    "clarification",
    "confirmation",
    "refusal",
    "safe_backend_failure",
    "not_found",
    "unsupported_redirect",
    "safe_no_change",
]


def _validate_action_sets(
    required: list[str],
    allowed: list[str],
    forbidden: list[str],
) -> None:
    sets = (set(required), set(allowed), set(forbidden))
    if sets[0] & sets[1] or sets[0] & sets[2] or sets[1] & sets[2]:
        raise ValueError("action sets overlap")


class TurnExpectation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=1)
    expected_flow: Literal["lookup", "booking", "cancel", "reschedule", "info", "unknown"]
    flow_oracle: Literal["strict", "advisory"] = "strict"
    confirmation_required: bool = False
    clarification_required: bool = False
    semantic_reply_oracle: SemanticOutcome | None = None
    required_actions: list[str] = Field(default_factory=list)
    allowed_actions: list[str] = Field(default_factory=list)
    forbidden_actions: list[str] = Field(default_factory=list)
    safe_state_subset: dict[str, Any] = Field(default_factory=dict)
    confirmation_token_from_turn: int | None = Field(default=None, ge=0)
    confirmation_token: str | None = None
    confirmed: bool | None = None
    patient_id_override: str | None = None
    session_id_override: str | None = None

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("message must not be empty")
        return value

    @model_validator(mode="after")
    def validate_action_sets(self) -> "TurnExpectation":
        _validate_action_sets(self.required_actions, self.allowed_actions, self.forbidden_actions)
        return self


class FaultStep(BaseModel):
    model_config = ConfigDict(extra="forbid")

    method: str = Field(min_length=1)
    occurrence: int = Field(default=1, ge=1)
    outcome: Literal["timeout", "conflict", "permanent_error", "empty", "malformed"]


class BenchmarkScenario(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scenario_id: str = Field(min_length=1)
    categories: list[str] = Field(min_length=1)
    execution_mode: Literal["deterministic", "fault"]
    turns: list[TurnExpectation] = Field(min_length=1)
    trusted_patient_id: str | None = None
    required_actions: list[str] = Field(default_factory=list)
    allowed_actions: list[str] = Field(default_factory=list)
    forbidden_actions: list[str] = Field(default_factory=list)
    strict_state_oracle: dict[str, Any] = Field(default_factory=dict)
    forbidden_content_oracle: dict[str, Any] = Field(default_factory=dict)
    expected_safe_outcome: SemanticOutcome
    fault_script: list[FaultStep] = Field(default_factory=list)

    @field_validator("scenario_id")
    @classmethod
    def validate_scenario_id(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("scenario_id must not be empty")
        return value

    @field_validator("categories")
    @classmethod
    def validate_categories(cls, value: list[str]) -> list[str]:
        if any(not category.strip() for category in value):
            raise ValueError("categories must not contain empty values")
        return value

    @model_validator(mode="after")
    def validate_scenario(self) -> "BenchmarkScenario":
        _validate_action_sets(self.required_actions, self.allowed_actions, self.forbidden_actions)
        for turn_index, turn in enumerate(self.turns):
            reference = turn.confirmation_token_from_turn
            if reference is not None and reference >= turn_index:
                raise ValueError("confirmation_token_from_turn must refer to an earlier turn")
        return self


def load_scenarios(path: Path) -> list[BenchmarkScenario]:
    scenarios: list[BenchmarkScenario] = []
    seen_ids: set[str] = set()
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            scenario = BenchmarkScenario.model_validate(json.loads(line))
            if scenario.scenario_id in seen_ids:
                raise ValueError(f"duplicate scenario_id '{scenario.scenario_id}'")
        except (json.JSONDecodeError, ValueError) as exc:
            raise ValueError(f"{path}:{line_number}: {exc}") from exc
        scenarios.append(scenario)
        seen_ids.add(scenario.scenario_id)
    return scenarios
