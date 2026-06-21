# LangGraph Production Invariant Hardening Design

Date: 2026-06-21
Branch: `feat/ai/langgraph-benchmark-hardening`
Service: `ai/booking_langgraph_service`

## Goal

Harden the booking graph around reusable production invariants rather than
adding prompt-specific, scenario-specific, or benchmark-specific branches.
The target behaviors are safe tool failure handling, bounded read retries,
one-time confirmation, superseded-intent invalidation, ownership isolation,
and mutation idempotency.

## Scope

This phase changes production graph behavior for lookup, booking, cancel, and
reschedule. It covers:

- one retry for transient read timeouts
- no automatic mutation retry
- safe user-visible handling for permanent errors and malformed payloads
- one-time confirmation tokens scoped to session and patient
- invalidation of older pending confirmations when a session creates a new one
- replay-safe and conflict-safe mutation handling
- ownership-safe not-found/refusal behavior

This phase does not:

- add phrases or branches for individual benchmark messages
- inspect `scenario_id` or benchmark categories in production code
- expand the deterministic English parser
- tune GPT-5 mini prompts or model parameters
- weaken scenario oracles after observing failures
- require every natural-language benchmark scenario to pass offline

Natural-language quality remains a live GPT-5 mini benchmark concern. The
deterministic suite verifies graph and tool invariants independently of model
quality.

## Architecture

Keep `DomainTools` focused on domain operations and enforce orchestration
policy at the graph-to-tool boundary. Add small graph helpers for safe reads,
payload validation, and safe failure responses. Do not introduce a second tool
protocol or a benchmark-only production adapter.

The helpers classify failures by behavior:

- `TimeoutError` from a read is transient and may be retried once.
- A second timeout or another runtime error is permanent for the current turn.
- Mutation errors are never retried by the graph.
- Invalid payload shape is a backend failure, not an empty successful result.
- A valid empty list remains a successful empty lookup or no-availability
  result according to the flow.

This classification is independent of the active tool implementation. It
applies equally to HTTP tools, in-memory tools, and deterministic fault tools.

## Read Policy

Read operations are `get_patient_appointments`,
`resolve_appointment_reference`, `search_booking_catalog`, and
`find_booking_options`.

For each read call:

1. Execute once.
2. If it raises `TimeoutError`, execute the equivalent call once more.
3. If the second attempt fails, stop and return a safe backend failure.
4. Do not retry `RuntimeError`, malformed payloads, authentication failures, or
   ownership failures.

The retry preserves equivalent arguments and produces at most two calls. No
backoff is needed for this synchronous single-turn policy. Transport-level
backoff and circuit breaking remain adapter or infrastructure concerns.

## Payload Validation

Validate the minimum shape required by each graph flow before reading fields:

- appointment lists must contain mapping objects with a usable identifier and
  code when a mutation may follow
- booking options must contain a usable identifier and summary
- resolver output must be either `None` or a mapping with identifier and code;
  an explicitly `cancelled` status is non-actionable

Malformed payloads produce a generic safe backend failure and no prepare or
commit action. An empty appointment list is not malformed and returns an empty
lookup success. A cancelled or otherwise non-actionable appointment is treated
as unavailable without revealing ownership or hidden state.

## Confirmation Lifecycle

A pending confirmation is a one-time capability bound to:

- session ID
- trusted patient ID
- flow and mutation action
- immutable mutation payload

When the graph creates a new confirmation, it invalidates every older pending
confirmation for the same session. This makes the latest user intent
authoritative across booking, cancellation, and rescheduling.

When confirmation is submitted, the graph atomically removes the token before
awaiting the mutation. Sequential or concurrent replay therefore cannot enter
the mutation path twice. Invalid session, patient, token, or explicit rejection
causes no mutation. A backend conflict consumes the token and requires a new
prepare step; the graph must not silently repeat the commit.

The domain adapter continues to receive the confirmation token as its
idempotency key. Graph one-time consumption and backend idempotency are
complementary protections.

## Safe Errors And Ownership

User-facing errors describe the safe outcome without exposing backend
identifiers, ownership details, stack traces, or raw transport errors.

- read unavailable: ask the user to retry later; state that no change occurred
- commit conflict: state that the change was not completed and a new option or
  prepare step is required
- malformed payload: report temporary backend unavailability
- missing, cancelled, or wrong-owner appointment: use the same non-enumerating
  unavailable response

Metrics record timeout, backend conflict, invalid action, and retry recovery
without changing the safety outcome.

## Testing

Use TDD with generic fake tools. Tests describe policies, not benchmark IDs or
specific user phrases.

Required regression tests:

- a read timeout occurs once, then the second equivalent call succeeds
- two read timeouts return a safe failure after exactly two calls
- a permanent read error is not retried and causes no prepare or commit
- malformed appointment and option payloads cause a safe failure
- a valid empty lookup remains successful
- a commit conflict is not retried and consumes the token
- a replayed token performs exactly one mutation
- a new confirmation invalidates the older token for the same session
- cross-session and cross-patient token use performs no mutation
- failed and rejected confirmations never mutate state

After focused tests pass, run the full service suite and the deterministic
29-scenario benchmark. The benchmark is diagnostic: remaining model or
semantic-oracle failures are reported, not hidden by production special cases.

## Success Criteria

- production code contains no benchmark IDs, benchmark categories, or
  message-specific patches
- safe reads make at most two equivalent calls and retry only timeouts
- mutation calls are attempted at most once per confirmation token
- stale, replayed, cross-session, and cross-patient tokens cannot mutate state
- malformed and failed backend responses never reach prepare or commit
- all existing and new unit tests pass
- deterministic benchmark artifacts remain complete and safety-gated
