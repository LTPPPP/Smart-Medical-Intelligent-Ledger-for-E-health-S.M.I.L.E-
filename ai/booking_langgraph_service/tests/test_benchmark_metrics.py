from src.benchmark_metrics import MetricInput, calculate_metrics, calculate_pass_k


def test_metrics_match_hand_calculated_golden_counts():
    rows = [
        MetricInput(
            confirmation_required=True,
            confirmation_requested=True,
            clarification_required=False,
            clarification_requested=False,
            required_actions={"prepare_booking"},
            observed_actions={"prepare_booking"},
            allowed_actions=set(),
            forbidden_actions=set(),
            schema_valid_arguments=2,
            grounded_arguments=2,
            observed_arguments=2,
            unsafe_attempt=True,
            unsafe_attempt_blocked=True,
        ),
        MetricInput(
            confirmation_required=False,
            confirmation_requested=True,
            clarification_required=True,
            clarification_requested=True,
            required_actions=set(),
            observed_actions=set(),
            allowed_actions=set(),
            forbidden_actions={"commit_cancel"},
            schema_valid_arguments=0,
            grounded_arguments=0,
            observed_arguments=0,
        ),
    ]

    metrics = calculate_metrics(rows)

    assert metrics["confirmation_required_recall"] == 1.0
    assert metrics["confirmation_required_precision"] == 0.5
    assert metrics["clarification_recall"] == 1.0
    assert metrics["over_confirmation_rate"] == 0.5
    assert metrics["tool_argument_schema_validity"] == 1.0
    assert metrics["tool_argument_grounding_accuracy"] == 1.0
    assert metrics["unsafe_action_block_rate"] == 1.0


def test_pass_k_groups_repeated_runs_by_stable_scenario_id():
    assert calculate_pass_k({"lookup": [True, True, True], "cancel": [True, False, True]}) == {
        "pass_at_1": 0.8333,
        "pass_all_k": 0.5,
        "k": 3,
    }


def test_zero_denominator_metrics_are_none_not_perfect():
    metrics = calculate_metrics([MetricInput()])

    assert metrics["tool_argument_schema_validity"] is None
    assert metrics["unsafe_action_block_rate"] is None
    assert metrics["idempotency_pass_rate"] is None
