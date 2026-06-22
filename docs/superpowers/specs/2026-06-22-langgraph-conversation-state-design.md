# Minimal LangGraph Conversation State Design

Date: 2026-06-22
Branch: `feat/ai/langgraph-benchmark-hardening`
Service: `ai/booking_langgraph_service`

## Goal

Finish the three remaining deterministic multi-turn behaviors needed by the
thesis without turning the chatbot into a general conversation platform.

## Scope

Keep only:

- one active mutation flow per session and trusted patient
- structured slots collected for that active flow
- typed dialogue acts `correct`, `abort`, and `switch`
- supersession of an older pending confirmation
- deterministic fixtures for the three remaining benchmark failures
- GPT-5 mini structured extraction of dialogue acts for live requests

Do not add:

- raw chat history or prompt memory
- a distributed conversation store
- conversation TTL, revisions, statuses, or new metrics
- a general dialogue framework
- phrase-specific production rules
- benchmark IDs or categories in production runtime

Existing confirmation, ownership, retry, payload-validation, and fault safety
remain unchanged.

## Architecture

Add a small process-local `ConversationStateStore` with an async lock. It stores
only `active_flow` and a deep-copied slot dictionary, scoped by session ID and
trusted patient ID. This follows the service's existing one-worker deployment
constraint and is sufficient for thesis evaluation.

Keep transition policy in a pure reducer. The extractor reports current intent,
slots, and an optional dialogue act; it does not decide whether old state may be
reused.

```python
DialogueAct = Literal["correct", "abort", "switch"]

@dataclass(frozen=True)
class ConversationState:
    session_id: str
    patient_id: str | None
    active_flow: FlowName
    slots: dict[str, Any]
```

No message text, confirmation token, or backend response is stored.

## Transition Rules

### Start

An explicit booking, cancellation, or rescheduling intent starts or replaces
the active flow. Starting a different flow clears all old slots.

### Correct

`correct` may inherit the current active mutation flow when the current command
has no explicit mutation intent. Current slot updates replace matching stored
values and preserve unrelated slots. The graph prepares a new immutable
operation, and the existing confirmation-store create policy supersedes the
older token.

### Abort

`abort` clears active state, invalidates pending confirmations for the session,
calls no domain tools, and returns a generic no-change response.

### Switch

`switch` requires an explicit supported intent. It clears old slots and pending
confirmation before opening the new flow using only current-turn slots.

An explicit intent different from the active flow is also treated as a switch.
Unknown standalone turns never inherit state. A correction without valid active
state falls back safely.

## Graph Integration

Before routing, the graph loads state and applies the reducer to the extracted
command. The resulting effective intent and slots become graph state. Abort has
a dedicated terminal route and cannot enter a domain-tool node.

After a mutation flow returns a clarification or confirmation, save its active
flow and validated slots. Clear state after successful/rejected confirmation,
abort, or explicit switch completion. Lookup never becomes active state.

`ConfirmationStore` gains `invalidate_session(session_id)`. It removes current
pending capabilities and records them as superseded, preserving replay safety.

## Extractor And Fixtures

The OpenAI JSON schema adds nullable `dialogue_act` restricted to `correct`,
`abort`, and `switch`. The deterministic parser is not expanded with phrase
lists. Deterministic scenarios use typed command fixtures, while paraphrase
quality remains part of the live GPT-5 mini suite.

Command fixtures gain optional `dialogue_act`. Tool fixtures gain slot-subset
booking-option rules so different date/time corrections resolve to exact
options without scenario-specific adapter code.

## Required Tests

- correction inherits booking and replaces the time slot
- correction can replace date and time while preserving the booking flow
- a newer prepare supersedes the older confirmation token
- abort performs no tool call or mutation and invalidates pending confirmation
- explicit switch clears old slots
- unknown standalone input does not inherit active state
- correction without active state falls back
- cross-patient context cannot be read or changed
- OpenAI structured schema accepts only the three acts or null
- the three remaining deterministic scenarios pass
- existing replay, ownership, backend-fault, and confirmation tests stay green

## Success Criteria

- production code has no benchmark IDs or message-specific patches
- state contains only active flow and structured slots
- only valid corrections inherit a mutation flow
- switch never carries old slots
- abort and replacement prepare cannot leave a usable stale token
- full unit suite passes
- deterministic benchmark reaches at least `0.90`
- all safety-layer failure counts remain zero
