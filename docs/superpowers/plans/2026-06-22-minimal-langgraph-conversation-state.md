# Minimal LangGraph Conversation State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add only the conversation state needed for booking correction, booking reversal, and cancellation abort while preserving all existing safety invariants.

**Architecture:** Introduce a process-local patient-scoped store and pure reducer containing only active flow and slots. Extend commands with three typed dialogue acts, let the graph apply reducer decisions before routing, and use declarative benchmark fixtures for deterministic language-independent coverage.

**Tech Stack:** Python 3.13, Pydantic 2, LangGraph, asyncio, pytest/pytest-asyncio, JSONL.

---

## File Map

- Create `ai/booking_langgraph_service/src/conversation_state.py`: minimal state store and pure transition reducer.
- Create `ai/booking_langgraph_service/tests/test_conversation_state.py`: reducer, isolation, and copy-safety tests.
- Modify `ai/booking_langgraph_service/src/schemas.py`: typed optional dialogue act on commands.
- Modify `ai/booking_langgraph_service/src/confirmation_store.py`: invalidate all pending confirmations for one session.
- Modify `ai/booking_langgraph_service/src/graph.py`: apply conversation transitions and terminal abort route.
- Modify `ai/booking_langgraph_service/src/extractor.py`: nullable dialogue act in OpenAI structured output.
- Modify benchmark schema, runner, fault tools, and three scenario rows for declarative fixtures.
- Update focused tests and run the complete suite and deterministic benchmark.

### Task 1: Minimal State And Reducer

**Files:**
- Create: `ai/booking_langgraph_service/src/conversation_state.py`
- Modify: `ai/booking_langgraph_service/src/schemas.py`
- Create: `ai/booking_langgraph_service/tests/test_conversation_state.py`

- [ ] **Step 1: Write failing reducer and store tests**

Cover correction merge, explicit switch clearing, correction without state,
abort, cross-patient isolation, and deep-copy isolation:

```python
def test_correction_inherits_active_flow_and_replaces_only_supplied_slots():
    state = ConversationState(
        session_id="session-1",
        patient_id="patient-1",
        active_flow=FlowName.BOOKING,
        slots={"date_hint": "Monday", "time_hint": "15:00"},
    )
    command = AgentCommand(
        intent=FlowName.UNKNOWN,
        dialogue_act="correct",
        slot_updates=[SlotUpdate(name="time_hint", value="16:00")],
    )

    result = reduce_conversation(state, command)

    assert result.command.intent == FlowName.BOOKING
    assert result.slots == {"date_hint": "Monday", "time_hint": "16:00"}
```

```python
@pytest.mark.asyncio
async def test_store_never_returns_state_to_another_patient():
    store = InMemoryConversationStateStore()
    await store.save(ConversationState(
        session_id="session-1", patient_id="patient-1",
        active_flow=FlowName.CANCEL, slots={"appointment_ref": "APT-001"},
    ))
    assert await store.load("session-1", "patient-2") is None
```

- [ ] **Step 2: Run tests and verify RED**

Run: `cd ai/booking_langgraph_service && python3 -m pytest -q tests/test_conversation_state.py`

Expected: import failure because state types do not exist.

- [ ] **Step 3: Implement minimal types and transitions**

Add to `schemas.py`:

```python
DialogueAct = Literal["correct", "abort", "switch"]

class AgentCommand(BaseModel):
    intent: FlowName
    dialogue_act: DialogueAct | None = None
    # existing fields remain unchanged
```

Implement:

```python
@dataclass(frozen=True)
class ConversationState:
    session_id: str
    patient_id: str | None
    active_flow: FlowName
    slots: dict[str, Any]

@dataclass(frozen=True)
class ConversationResolution:
    command: AgentCommand
    slots: dict[str, Any]
    abort: bool = False
    switch: bool = False
```

`reduce_conversation()` must merge only `correct` against a valid mutation
flow, clear slots for explicit flow switches, and never inherit unknown
standalone commands. The store uses one async lock and `deepcopy`; add no TTL,
history, status, revision, or metrics.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `cd ai/booking_langgraph_service && python3 -m pytest -q tests/test_conversation_state.py tests/test_contracts.py`

Expected: all focused tests pass.

- [ ] **Step 5: Commit**

```bash
git add ai/booking_langgraph_service/src/conversation_state.py \
  ai/booking_langgraph_service/src/schemas.py \
  ai/booking_langgraph_service/tests/test_conversation_state.py
git commit -m "feat(ai): add minimal conversation state reducer"
```

### Task 2: Graph Lifecycle And Confirmation Invalidation

**Files:**
- Modify: `ai/booking_langgraph_service/src/confirmation_store.py`
- Modify: `ai/booking_langgraph_service/src/graph.py`
- Modify: `ai/booking_langgraph_service/tests/test_confirmation_store.py`
- Modify: `ai/booking_langgraph_service/tests/test_graph_resilience.py`

- [ ] **Step 1: Write failing lifecycle tests**

Add tests proving `invalidate_session()` tombstones pending tokens as
superseded, correction creates a replacement confirmation, abort has no domain
actions, and cross-patient context cannot carry over.

```python
@pytest.mark.asyncio
async def test_abort_clears_context_and_invalidates_pending_confirmation():
    tools = InMemoryDomainTools()
    graph = BookingLangGraph(domain_tools=tools, extractor=SequenceExtractor([
        AgentCommand(intent=FlowName.CANCEL, slot_updates=[SlotUpdate(name="appointment_ref", value="APT-001")]),
        AgentCommand(intent=FlowName.UNKNOWN, dialogue_act="abort"),
    ]))
    prepared = await graph.handle_chat(ChatRequest(session_id="s", message="prepare"), "patient-1")
    aborted = await graph.handle_chat(ChatRequest(session_id="s", message="stop"), "patient-1")

    assert aborted.actions == []
    assert "no changes" in aborted.reply.lower()
    replay = await graph.handle_chat(ChatRequest(
        session_id="s", message="confirm", confirmation_token=prepared.confirmation.token, confirmed=True,
    ), "patient-1")
    assert replay.metadata["metrics"]["confirmation_token_superseded_blocked_count"] == 1
    assert tools.mutations == []
```

- [ ] **Step 2: Run tests and verify RED**

Run: `cd ai/booking_langgraph_service && python3 -m pytest -q tests/test_confirmation_store.py tests/test_graph_resilience.py -k 'invalidate or correction or abort or conversation'`

Expected: missing invalidation API and graph state behavior.

- [ ] **Step 3: Implement graph integration**

Extend `ConfirmationStore` with:

```python
async def invalidate_session(self, session_id: str) -> None: ...
```

Inject `InMemoryConversationStateStore` into `BookingLangGraph`. During command
extraction load state, call `reduce_conversation`, invalidate confirmation on
abort/switch, and route abort to a terminal no-change node. After invocation,
save state only when a mutation flow returns clarification or confirmation;
clear it after confirmation or abort. Do not alter commit routing or retry
policy.

- [ ] **Step 4: Run focused and invariant tests**

Run: `cd ai/booking_langgraph_service && python3 -m pytest -q tests/test_confirmation_store.py tests/test_graph_resilience.py tests/test_graph_confirmation_invariants.py`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add ai/booking_langgraph_service/src/confirmation_store.py \
  ai/booking_langgraph_service/src/graph.py \
  ai/booking_langgraph_service/tests/test_confirmation_store.py \
  ai/booking_langgraph_service/tests/test_graph_resilience.py
git commit -m "feat(ai): carry minimal mutation context across turns"
```

### Task 3: Structured Extraction And Deterministic Fixtures

**Files:**
- Modify: `ai/booking_langgraph_service/src/extractor.py`
- Modify: `ai/booking_langgraph_service/src/benchmark_schema.py`
- Modify: `ai/booking_langgraph_service/src/benchmark_runner.py`
- Modify: `ai/booking_langgraph_service/src/fault_tools.py`
- Modify: `ai/booking_langgraph_service/datasets/agent_natural_multiturn.jsonl`
- Modify focused extractor, runner, fault, and schema tests.

- [ ] **Step 1: Write failing extractor and fixture tests**

Assert OpenAI schema requires nullable `dialogue_act`, fixture commands preserve
the typed act, slot-subset option rules choose an exact result, and the three
scenario rows declare generic fixtures.

```python
assert schema["properties"]["dialogue_act"] == {
    "type": ["string", "null"],
    "enum": ["correct", "abort", "switch", None],
}
```

- [ ] **Step 2: Run tests and verify RED**

Run: `cd ai/booking_langgraph_service && python3 -m pytest -q tests/test_extractor.py tests/test_benchmark_schema.py tests/test_benchmark_runner.py tests/test_fault_tools.py`

Expected: dialogue-act and slot-rule fixture contracts are missing.

- [ ] **Step 3: Implement extractor and fixture plumbing**

Add `dialogue_act` to `COMMAND_SCHEMA`, extraction payload parsing, and
`CommandFixture`. Add:

```python
class BookingOptionFixture(BaseModel):
    match_slots: dict[str, Any]
    options: list[dict[str, Any]]
```

`FaultInjectingDomainTools.find_booking_options()` selects the first rule whose
slot subset matches. Preserve existing date-only fixtures.

Update only `multi-001`, `multi-002`, and `multi-008` with command and tool
fixtures. Keep their state, safety, action, and mutation oracles unchanged.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `cd ai/booking_langgraph_service && python3 -m pytest -q tests/test_extractor.py tests/test_benchmark_schema.py tests/test_benchmark_runner.py tests/test_fault_tools.py`

Expected: all focused tests pass.

- [ ] **Step 5: Commit**

```bash
git add ai/booking_langgraph_service/src/extractor.py \
  ai/booking_langgraph_service/src/benchmark_schema.py \
  ai/booking_langgraph_service/src/benchmark_runner.py \
  ai/booking_langgraph_service/src/fault_tools.py \
  ai/booking_langgraph_service/datasets/agent_natural_multiturn.jsonl \
  ai/booking_langgraph_service/tests
git commit -m "test(ai): cover minimal multi-turn conversation state"
```

### Task 4: Full Verification And Push

**Files:**
- Verify all modified service files and generated benchmark artifacts.

- [ ] **Step 1: Run complete service tests**

Run: `cd ai/booking_langgraph_service && python3 -m pytest -q tests`

Expected: all tests pass.

- [ ] **Step 2: Run deterministic benchmark at the unchanged gate**

```bash
cd ai/booking_langgraph_service
python3 scripts/run_hardened_agent_benchmark.py \
  --mode deterministic \
  --dataset datasets/agent_safety_golden.jsonl \
  --dataset datasets/agent_natural_multiturn.jsonl \
  --dataset datasets/agent_backend_faults.jsonl \
  --dataset datasets/agent_live_natural_language.jsonl \
  --runs 1 \
  --fail-under 0.90 \
  --output-dir /tmp/smile-agent-benchmark-phase-b
```

Expected: exit `0`, success at least `0.90`, one disclosed live exclusion, and
zero state/safety failure layers.

- [ ] **Step 3: Verify scope and worktree**

```bash
if rg -n "golden-|multi-|fault-" src/graph.py src/conversation_state.py src/extractor.py; then exit 1; fi
git diff --check
git status --short
```

Expected: no production benchmark IDs and no uncommitted files after the final
implementation commit.

- [ ] **Step 4: Push only the current feature branch**

```bash
git push origin HEAD:feat/ai/langgraph-benchmark-hardening
```

Expected: remote feature branch updates; `dev` is untouched.
