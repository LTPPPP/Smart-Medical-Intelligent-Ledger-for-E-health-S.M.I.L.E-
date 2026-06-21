from src.model_config import ModelCandidate, qwen35_benchmark_candidates


def test_qwen35_benchmark_candidates_include_local_default_and_9b_trial():
    candidates = qwen35_benchmark_candidates()

    assert candidates[0] == ModelCandidate(
        name="Qwen/Qwen3.5-4B",
        role="primary_local_baseline",
        max_model_lens=[8192, 16384],
        default_reasoning=False,
    )
    assert candidates[1].name == "Qwen/Qwen3.5-9B"
    assert candidates[1].role == "bigger_fit_trial"
    assert candidates[1].acceptance_rule == "accept_only_if_quality_gain_justifies_latency_and_vram"
