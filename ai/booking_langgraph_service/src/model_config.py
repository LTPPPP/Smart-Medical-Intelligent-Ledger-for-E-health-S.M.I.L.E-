from __future__ import annotations

from pydantic import BaseModel


class ModelCandidate(BaseModel):
    name: str
    role: str
    max_model_lens: list[int]
    default_reasoning: bool
    acceptance_rule: str = "baseline"


def qwen35_benchmark_candidates() -> list[ModelCandidate]:
    return [
        ModelCandidate(
            name="Qwen/Qwen3.5-4B",
            role="primary_local_baseline",
            max_model_lens=[8192, 16384],
            default_reasoning=False,
        ),
        ModelCandidate(
            name="Qwen/Qwen3.5-9B",
            role="bigger_fit_trial",
            max_model_lens=[8192, 16384],
            default_reasoning=False,
            acceptance_rule="accept_only_if_quality_gain_justifies_latency_and_vram",
        ),
    ]
