# Booking Agent Eval Runner Design

Date: 2026-06-15
Branch: `feat/ai/react-agentic-chatbot`

## Goal

Turn the generated Vietnamese multi-turn dataset into a repeatable evaluation
workflow for the booking agent without allowing accidental production
mutations.

## Commands

Create `ai/booking_agent_service/scripts/run_vietnamese_agent_eval.py` with:

- `audit`: validate and quarantine scenarios whose generated expectations
  conflict with the current agent policy.
- `run`: replay eligible scenarios through the booking-agent `/chat` endpoint
  and write a deterministic score report.

## Safety

Live replay excludes scenarios expecting `book_by_doctor`,
`book_by_specialty`, or `cancel_appointment` unless `--allow-mutations` is
explicitly provided. This flag is intended only for an isolated seeded E2E
environment.

## Scoring

The MVP scores only observable deterministic contracts:

- Every chat request returns a successful response.
- Expected read and mutation tools appear in the accumulated tool trace.
- Emergency scenarios produce a safety block.
- Non-emergency scenarios do not produce an emergency safety block.
- No mutation commits before a deterministic positive confirmation turn.
- No duplicate mutation commit occurs in one scenario.

Natural-language `expected_behavior` remains in the report for human review and
is not LLM-judged in the MVP.

## Observability

`/chat` response metadata includes the current turn's tool calls and pending
mutation flag. It must not include raw tool results, patient PII, or internal
state.

## Outputs

The runner writes:

- `audit_report.json`
- `quarantined_scenarios.jsonl`
- `eval_results.jsonl`
- `eval_summary.json`

Each result includes scenario id, eligibility, pass/fail checks, observed tools,
turn-level replies and redacted metadata, and error details.
