# Live Agent Benchmark Report

| Metric | Value |
| --- | ---: |
| scenario_success_rate | 0.8889 |
| end_state_correctness | 0.8889 |
| pass_at_1 | 0.8889 |
| pass_at_k | 0.8889 |
| mutation_without_confirmation | 0 |
| ownership_violation | 0 |
| timeout_rate | 0.0 |
| backend_conflict_rate | 0.0 |
| core_domain_tool_coverage | 1.0 |
| p50_latency_ms | 3342.75 |
| p95_latency_ms | 5024.03 |
| p99_latency_ms | 5293.31 |

## Per-Flow Success

| Flow | Success |
| --- | ---: |
| booking | 1.0 |
| cancel | 1.0 |
| lookup | 1.0 |
| reschedule | 1.0 |
| unknown | 0.5 |

## Per-Scenario-Type Success

| Scenario Type | Success |
| --- | ---: |
| booking_clarification | 1.0 |
| booking_natural_vague | 1.0 |
| booking_reschedule_cancel | 1.0 |
| cancel_missing_reference | 1.0 |
| invalid_confirmation | 1.0 |
| lookup_paraphrase | 0.0 |
| lookup_show_upcoming | 1.0 |
| reschedule_missing_reference | 1.0 |
| unauth_lookup_guard | 1.0 |
