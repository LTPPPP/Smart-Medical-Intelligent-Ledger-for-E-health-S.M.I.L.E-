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
- bounded confirmation expiry
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

Use `core_domain_tool_specs()` as the retry-policy registry. Only tools whose
spec declares `SideEffectLevel.READ` and the bounded-read retry policy may use
the helper. A new tool is not retryable until its side effect and retry policy
are explicitly declared. A read-like name alone is insufficient because a
future discovery tool could reserve capacity, write an audit event, or mutate
session state.

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

Retry occurs inside the graph helper using the already-resolved patient ID,
reference, filters, slots, and session context. It does not re-enter command
extraction or ask the model to regenerate tool arguments. Tests compare the
recorded argument values from both attempts.

## Payload Validation

Validate the minimum shape required by each graph flow before reading fields:

- lookup results must be a list of mappings; each mapping must contain at least
  one non-empty appointment identifier or appointment code
- booking options must contain non-empty string `id` and `summary` values;
  adapter-specific raw payload remains opaque to the graph
- resolver output must be either `None` or a mapping with non-empty string
  `id` and `code`; an explicitly `cancelled` status is non-actionable

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

All mutating flows use prepare-before-commit. Natural-language intent
resolution can resolve and validate entities, but it cannot call a commit
tool. Prepare creates the immutable mutation payload and returns an
action-specific operation summary plus a confirmation token. Lookup never
requires confirmation.

The operation summary includes the human-checkable fields available for the
action: mutation type, appointment code, selected option summary, date/time,
provider, and location when those values exist in validated tool output. A
generic `Please confirm` without identifying the prepared operation is not a
valid confirmation request. The graph commits exactly the stored payload; it
does not search again or silently replace an unavailable option after the user
confirms.

When the graph creates a new confirmation, it invalidates every older pending
confirmation for the same session. This makes the latest user intent
authoritative across booking, cancellation, and rescheduling.

When confirmation is submitted, the graph atomically removes the token before
awaiting the mutation. Sequential or concurrent replay therefore cannot enter
the mutation path twice. Invalid session, patient, token, or explicit rejection
causes no mutation. A backend conflict consumes the token and requires a new
prepare step; the graph must not silently repeat the commit.

Pending confirmations expire after a configurable bounded TTL, defaulting to
15 minutes. Expired tokens are consumed as invalid and cannot mutate state.
Time is injected into the store for deterministic tests.

Confirmation state is accessed through a small `ConfirmationStore` contract
that supports create-with-session-supersession and atomic consume. The current
Docker deployment runs one Uvicorn worker, so the initial in-memory store uses
an async lock and provides process-local atomicity. Multi-worker or replicated
deployment is not supported by that implementation and must fail configuration
validation until a shared Redis or database implementation provides atomic
check-and-delete. Process-local memory must not be presented as distributed
atomicity.

The domain adapter continues to receive the confirmation token as its
idempotency key. Graph one-time consumption and backend idempotency are
complementary protections.

The backend idempotency key may be derived from the token in a later adapter,
but neither raw confirmation tokens nor derived key material may be emitted in
logs, metrics, error messages, or benchmark reports.

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

Graph metadata uses stable safe-error categories rather than matching reply
text:

- `read_unavailable`
- `malformed_backend_response`
- `commit_conflict`
- `non_actionable_appointment`
- `invalid_confirmation`
- `rejected_confirmation`
- `ownership_safe_unavailable`

User-facing replies remain generic and may evolve independently of these
categories.

Metrics distinguish recovery from exposure with counters for recovered and
exhausted read timeouts, permanent read failures, payload validation failures,
blocked replay, blocked superseded tokens, mutation attempts, mutation
conflicts, and mutation successes.

## Testing

Use TDD with generic fake tools. Tests describe policies, not benchmark IDs or
specific user phrases.

Required regression tests:

- a read timeout occurs once, then the second equivalent call succeeds
- two read timeouts return a safe failure after exactly two calls
- read retry preserves arguments and does not invoke command extraction again
- a permanent read error is not retried and causes no prepare or commit
- malformed appointment and option payloads cause a safe failure
- malformed resolver output is a backend failure, not a not-found result
- a valid empty lookup remains successful
- a commit conflict is not retried and consumes the token
- a replayed token performs exactly one mutation
- two concurrent confirmations of one token attempt exactly one mutation
- a new confirmation invalidates the older token for the same session
- an expired token performs no mutation
- cross-session and cross-patient token use performs no mutation
- failed and rejected confirmations never mutate state

After focused tests pass, run the full service suite and the deterministic
29-scenario benchmark. The benchmark is diagnostic: remaining model or
semantic-oracle failures are reported, not hidden by production special cases.

## Success Criteria

- production code contains no benchmark IDs, benchmark categories, or
  message-specific patches
- safe reads make at most two equivalent calls and retry only timeouts
- read retries do not re-enter command extraction
- mutation calls are attempted at most once per confirmation token
- stale, replayed, cross-session, and cross-patient tokens cannot mutate state
- expired tokens and concurrent duplicate confirmations cannot mutate twice
- malformed and failed backend responses never reach prepare or commit
- every mutation confirmation contains a payload-specific operation summary
- process-local confirmation storage is used only with a single service worker
- all existing and new unit tests pass
- deterministic benchmark artifacts remain complete and safety-gated
