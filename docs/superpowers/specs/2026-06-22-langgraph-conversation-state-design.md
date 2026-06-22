# LangGraph Conversation State Design

Date: 2026-06-22
Branch: `feat/ai/langgraph-benchmark-hardening`
Service: `ai/booking_langgraph_service`

## Goal

Add generic multi-turn conversation state for booking, cancellation, and
rescheduling without matching benchmark IDs or patching individual messages.
The graph must distinguish continuation, correction, abort, and intent switch,
carry forward only safe structured state, and keep confirmation lifecycle
protections intact.

## Scope

This phase covers:

- active mutation flow and flow status per session and trusted patient
- collected slots and declared missing slots
- typed dialogue acts: `continue`, `correct`, `abort`, and `switch`
- slot-only continuation and correction of an active flow
- explicit intent switching with old-slot removal
- aborting an active flow without tools or mutation
- invalidating pending confirmations on abort or switch
- deterministic fixtures for graph-state tests
- GPT-5 mini structured extraction of dialogue acts for live requests

This phase does not:

- store raw conversation transcripts
- infer patient identity from model output
- add message-specific branches to production code
- make unknown turns inherit an active flow without a dialogue act
- change mutation retry, confirmation replay, TTL, or ownership policy
- use benchmark scenario IDs or categories in production runtime

## Chosen Architecture

Use a small process-local `ConversationStore` and a pure state reducer at the
graph-to-extractor boundary. This matches the existing single-worker deployment
and the in-memory confirmation-store constraint. The reducer receives the
stored context and the current structured command, then returns the effective
flow, merged slots, and a transition decision.

Two alternatives were rejected:

- A LangGraph checkpointer would couple business conversation state to graph
  execution internals and require a larger persistence migration.
- Sending prior turns to GPT-5 mini would make carryover nondeterministic,
  increase token use, and mix safety policy with language interpretation.

The extractor remains responsible only for intent, dialogue act, and slot
extraction. The reducer owns all carryover policy.

## Data Model

Add an optional `dialogue_act` to `AgentCommand`:

```python
DialogueAct = Literal["continue", "correct", "abort", "switch"]
```

`None` means the turn is a standalone command. It does not mean continue.

Persist this structured context:

```python
@dataclass(frozen=True)
class ConversationContext:
    session_id: str
    patient_id: str | None
    active_flow: FlowName | None
    status: Literal["collecting", "awaiting_confirmation", "closed"]
    slots: dict[str, Any]
    missing_slots: tuple[str, ...]
```

The store deep-copies slots on load/save and serializes updates with an async
lock. State is scoped by session and trusted patient. A patient mismatch never
returns the prior context and replaces it only when the current turn starts a
new valid flow.

Raw messages, confirmation tokens, backend IDs not already present in validated
state, and model prompts are not stored.

## Transition Policy

### Standalone Turn

An explicit lookup or mutation intent starts that flow. A different explicit
intent replaces the old active flow and clears old slots. An unknown standalone
turn does not inherit context and routes to fallback.

### Continue

`continue` may inherit an active mutation flow when the command has no explicit
mutation intent. New slots are merged into the stored slots. Existing values
remain unless the turn supplies a replacement.

### Correct

`correct` inherits the active mutation flow and replaces supplied slot values.
Unmentioned slots remain. A new prepare operation uses the merged immutable
payload and supersedes the previous confirmation through the existing
confirmation store.

### Abort

`abort` closes the active flow, clears its slots, invalidates pending
confirmations for the session, calls no domain tools, and returns a generic
no-change response.

### Switch

`switch` requires an explicit supported intent. It closes the old flow,
invalidates pending confirmations, clears all old slots, and opens the new flow
using only slots from the current command. If the new intent is absent, the
turn safely falls back without inheriting the old flow.

An explicit intent different from the active flow is treated as a switch even
when the extractor leaves `dialogue_act` unset. This prevents stale booking
slots from entering cancellation or rescheduling.

## Graph Integration

Before routing, `_extract_command` loads context and applies the pure reducer.
The effective command and merged slots are written to graph state. Abort is a
dedicated terminal route that cannot enter lookup, prepare, or commit nodes.

After a turn:

- a clarification stores `collecting`
- a prepared mutation stores `awaiting_confirmation`
- successful, rejected, aborted, or safely invalid confirmation closes context
- lookup is terminal and does not become an active mutation flow
- backend failure preserves only validated collection state, never a pending
  mutation payload

Confirmation requests continue to commit only the immutable payload held by
`ConfirmationStore`. Conversation state cannot invoke a commit action.

`ConfirmationStore` gains a session invalidation operation so abort and switch
can supersede pending capabilities before a replacement confirmation exists.

## Extractor Contract

The OpenAI structured schema adds nullable `dialogue_act`. Instructions define
acts behaviorally:

- `continue`: add missing information to the active request
- `correct`: replace details of the active request
- `abort`: stop the active request or leave it unchanged
- `switch`: begin a different supported intent

The extractor still receives only the current message. It never decides whether
carryover is allowed; the reducer validates the act against stored state.

The deterministic parser is not expanded with phrase lists. Benchmark scenarios
that test graph state use typed command fixtures. Natural paraphrase quality,
including dialogue-act extraction, remains in the live GPT-5 mini suite.

## Deterministic Fixtures

Extend command fixtures with optional `dialogue_act`. Extend tool fixtures with
slot-subset booking-option rules so date and time corrections can select exact
options without encoding scenario IDs:

```python
class BookingOptionFixture(BaseModel):
    match_slots: dict[str, Any]
    options: list[dict[str, Any]]
```

The fault adapter selects the first rule whose `match_slots` are all equal to
the current validated slots. Existing date-only fixtures remain supported.

## Error And Safety Behavior

- Continue/correct without active state does not route to a mutation flow.
- Switch without a supported explicit intent does not retain old slots.
- Abort and switch invalidate pending confirmations before returning or
  preparing another operation.
- Patient mismatch cannot read, merge, or close another patient's context.
- Conversation-state failures fail closed to the current standalone command;
  they never create a mutation or bypass confirmation.
- No raw confirmation token is stored or emitted in conversation metadata.

## Testing

Use TDD with reducer and store tests independent of benchmark text, then graph
integration tests with typed commands.

Required regression coverage:

- slot-only continue inherits an active flow
- correction replaces one slot and preserves unrelated slots
- a replacement prepare supersedes the older confirmation token
- abort calls no tools, clears context, and invalidates confirmation
- explicit switch clears old slots and opens the new flow
- unknown standalone input does not inherit context
- continue/correct without active context safely falls back
- cross-patient use cannot observe or mutate stored context
- OpenAI schema accepts only the four typed dialogue acts or null
- deterministic booking correction/reversal commits only the newest option
- conditional cancellation followed by abort performs no mutation
- existing replay, cross-session, ownership, timeout, and fault tests remain
  green

## Success Criteria

- no production benchmark IDs, categories, or scenario-specific message rules
- active context is structured, patient-scoped, and deep-copy isolated
- slot-only continue/correct works only with a valid active mutation flow
- switch never carries slots from the old flow
- abort and switch invalidate pending confirmation capabilities
- stale and replayed tokens remain unable to mutate
- all unit tests pass
- deterministic benchmark reaches the 0.90 gate with zero safety-layer failures
- live GPT-5 mini scenarios remain reported separately from deterministic graph
  invariants
