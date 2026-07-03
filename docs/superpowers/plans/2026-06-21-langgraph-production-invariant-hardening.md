# LangGraph Production Invariant Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden production booking flows with bounded read retries, validated backend payloads, safe errors, and atomic one-time confirmation without benchmark-specific logic.

**Architecture:** Add a focused confirmation-store boundary and keep read retry/validation policy at the `BookingLangGraph` tool boundary. Derive retry eligibility from existing domain tool specifications, preserve resolved arguments, and expose stable safe-error categories through metrics while keeping user replies generic.

**Tech Stack:** Python 3.13, Pydantic 2, LangGraph, asyncio, pytest/pytest-asyncio.

---

## File Map

- Create `ai/booking_langgraph_service/src/confirmation_store.py`: immutable pending-confirmation records, TTL, session supersession, and atomic consume.
- Create `ai/booking_langgraph_service/src/tool_errors.py`: stable graph-safe backend error categories and internal exceptions.
- Modify `ai/booking_langgraph_service/src/graph.py`: use the store, bounded read helper, payload validators, operation summaries, and safe metrics.
- Modify `ai/booking_langgraph_service/src/http_tools.py`: normalize transport status and timeout errors without collapsing backend failure into not-found.
- Modify `ai/booking_langgraph_service/src/settings.py`: configure confirmation TTL and enforce the single-worker in-memory-store constraint.
- Modify `ai/booking_langgraph_service/src/main.py`: construct and inject the confirmation store.
- Modify `docker-compose.yml`: declare one worker and the confirmation TTL explicitly.
- Create `ai/booking_langgraph_service/tests/test_confirmation_store.py`.
- Create `ai/booking_langgraph_service/tests/test_graph_resilience.py`.
- Create `ai/booking_langgraph_service/tests/test_graph_confirmation_invariants.py`.
- Modify `ai/booking_langgraph_service/tests/test_settings_runtime.py`.

### Task 1: Atomic Confirmation Store

**Files:**
- Create: `ai/booking_langgraph_service/src/confirmation_store.py`
- Test: `ai/booking_langgraph_service/tests/test_confirmation_store.py`

- [ ] **Step 1: Write failing store tests**

```python
import asyncio

import pytest

from src.confirmation_store import InMemoryConfirmationStore, PendingConfirmation
from src.schemas import FlowName


def pending(token: str, session_id: str = "session-1") -> PendingConfirmation:
    return PendingConfirmation(
        token=token,
        session_id=session_id,
        patient_id="patient-1",
        flow=FlowName.BOOKING,
        action="commit_booking",
        payload={"booking_option_id": "option-1"},
        summary="Book option 1.",
    )


@pytest.mark.asyncio
async def test_new_confirmation_supersedes_older_confirmation_for_session():
    store = InMemoryConfirmationStore(ttl_seconds=900)
    await store.create(pending("old"))
    await store.create(pending("new"))

    old = await store.consume("old", session_id="session-1", patient_id="patient-1")
    new = await store.consume("new", session_id="session-1", patient_id="patient-1")

    assert old.status == "superseded"
    assert new.status == "consumed"
    assert new.confirmation is not None


@pytest.mark.asyncio
async def test_expired_confirmation_cannot_be_consumed():
    now = 100.0
    store = InMemoryConfirmationStore(ttl_seconds=10, clock=lambda: now)
    await store.create(pending("expires"))
    now = 111.0

    result = await store.consume("expires", session_id="session-1", patient_id="patient-1")

    assert result.status == "expired"
    assert result.confirmation is None


@pytest.mark.asyncio
async def test_concurrent_consumers_receive_confirmation_once():
    store = InMemoryConfirmationStore(ttl_seconds=900)
    await store.create(pending("one-time"))

    first, second = await asyncio.gather(
        store.consume("one-time", session_id="session-1", patient_id="patient-1"),
        store.consume("one-time", session_id="session-1", patient_id="patient-1"),
    )

    assert sorted([first.status, second.status]) == ["consumed", "replayed"]
```

- [ ] **Step 2: Run store tests and verify RED**

Run: `cd ai/booking_langgraph_service && python3 -m pytest -q tests/test_confirmation_store.py`

Expected: FAIL with `ModuleNotFoundError: No module named 'src.confirmation_store'`.

- [ ] **Step 3: Implement the store contract**

Create frozen `PendingConfirmation` and `ConfirmationConsumeResult` dataclasses. Implement `InMemoryConfirmationStore.create()` and `consume()` under one `asyncio.Lock`. Store expiry timestamps, deep-copy payloads on create, retain bounded token tombstones until their original expiry, and return only these statuses: `consumed`, `invalid`, `expired`, `superseded`, `replayed`, `scope_mismatch`.

```python
@dataclass(frozen=True)
class PendingConfirmation:
    token: str
    session_id: str
    patient_id: str | None
    flow: FlowName
    action: str
    payload: dict[str, Any]
    summary: str


class ConfirmationStore(Protocol):
    async def create(self, confirmation: PendingConfirmation) -> None: ...
    async def consume(
        self, token: str, *, session_id: str, patient_id: str | None
    ) -> ConfirmationConsumeResult: ...
```

- [ ] **Step 4: Run store tests and verify GREEN**

Run: `cd ai/booking_langgraph_service && python3 -m pytest -q tests/test_confirmation_store.py`

Expected: all store tests pass.

- [ ] **Step 5: Commit**

```bash
git add ai/booking_langgraph_service/src/confirmation_store.py \
  ai/booking_langgraph_service/tests/test_confirmation_store.py
git commit -m "feat(ai): add atomic confirmation store"
```

### Task 2: One-Time Confirmation Lifecycle

**Files:**
- Modify: `ai/booking_langgraph_service/src/graph.py`
- Create: `ai/booking_langgraph_service/tests/test_graph_confirmation_invariants.py`

- [ ] **Step 1: Write failing confirmation tests**

Add generic tests that inject `InMemoryConfirmationStore` and `InMemoryDomainTools`:

```python
@pytest.mark.asyncio
async def test_replayed_confirmation_attempts_mutation_once():
    tools = InMemoryDomainTools()
    graph = BookingLangGraph(domain_tools=tools)
    prepared = await graph.handle_chat(
        ChatRequest(session_id="replay", message="Book 2027-07-01"), "patient-1"
    )
    request = ChatRequest(
        session_id="replay", message="Confirm", confirmation_token=prepared.confirmation.token, confirmed=True
    )

    first, second = await asyncio.gather(
        graph.handle_chat(request, "patient-1"),
        graph.handle_chat(request, "patient-1"),
    )

    assert tools.mutations == ["commit_booking:option-001"]
    assert sum(response.metadata["metrics"]["mutation_attempt_count"] for response in (first, second)) == 1


@pytest.mark.asyncio
async def test_new_prepare_invalidates_previous_session_token():
    graph = BookingLangGraph(domain_tools=InMemoryDomainTools())
    old = await graph.handle_chat(ChatRequest(session_id="latest", message="Book 2027-07-01"), "patient-1")
    new = await graph.handle_chat(ChatRequest(session_id="latest", message="Book 2027-07-02"), "patient-1")

    rejected = await graph.handle_chat(
        ChatRequest(session_id="latest", message="Confirm", confirmation_token=old.confirmation.token, confirmed=True),
        "patient-1",
    )

    assert rejected.flow == FlowName.UNKNOWN
    assert rejected.metadata["metrics"]["confirmation_token_superseded_blocked_count"] == 1
    assert new.confirmation.token != old.confirmation.token
```

Also test expired, cross-session, cross-patient, explicit rejection, and commit conflict. Assert mutation attempt count is zero for invalid cases and one for a conflict.

- [ ] **Step 2: Run confirmation tests and verify RED**

Run: `cd ai/booking_langgraph_service && python3 -m pytest -q tests/test_graph_confirmation_invariants.py`

Expected: failures because `BookingLangGraph` still uses a process-local dictionary with non-atomic `get` then `pop`.

- [ ] **Step 3: Inject and use `ConfirmationStore`**

Update `BookingLangGraph.__init__` to accept an optional store, make `_create_confirmation` async, create a payload-specific summary, and call `store.consume()` before any mutation await. Map consume status to stable counters and `safe_error_category`. Increment `mutation_attempt_count` immediately before a commit call, `mutation_conflict_count` on runtime conflict, and `mutation_success_count` only after success.

The confirmation flow must never resolve or search again. It commits only the consumed record payload.

- [ ] **Step 4: Run confirmation and core-flow tests**

Run: `cd ai/booking_langgraph_service && python3 -m pytest -q tests/test_graph_confirmation_invariants.py tests/test_graph_core_flows.py`

Expected: all tests pass and existing prepare-before-commit behavior remains intact.

- [ ] **Step 5: Commit**

```bash
git add ai/booking_langgraph_service/src/graph.py \
  ai/booking_langgraph_service/tests/test_graph_confirmation_invariants.py
git commit -m "fix(ai): enforce one-time confirmation lifecycle"
```

### Task 3: Bounded Read Policy

**Files:**
- Create: `ai/booking_langgraph_service/src/tool_errors.py`
- Modify: `ai/booking_langgraph_service/src/graph.py`
- Modify: `ai/booking_langgraph_service/src/http_tools.py`
- Create: `ai/booking_langgraph_service/tests/test_graph_resilience.py`
- Modify: `ai/booking_langgraph_service/tests/test_http_domain_tools.py`

- [ ] **Step 1: Write failing retry tests**

Use a generic recording tools implementation whose lookup method times out once and records argument snapshots. Use a recording extractor whose `calls` count proves extraction runs once.

```python
@pytest.mark.asyncio
async def test_transient_read_retries_once_with_same_arguments_without_reextracting():
    tools = TimeoutOnceTools()
    extractor = RecordingExtractor(AgentCommand(intent=FlowName.LOOKUP, confidence=1.0))
    graph = BookingLangGraph(domain_tools=tools, extractor=extractor)

    response = await graph.handle_chat(
        ChatRequest(session_id="retry", message="Show appointments"), "patient-1"
    )

    assert response.flow == FlowName.LOOKUP
    assert tools.lookup_arguments == ["patient-1", "patient-1"]
    assert extractor.calls == 1
    assert response.metadata["metrics"]["read_timeout_recovered_count"] == 1
```

Add tests for two timeouts and one permanent `RuntimeError`. Assert exactly two and one read calls respectively, no prepare/commit action, and safe error categories `read_unavailable`.

Add HTTP adapter tests proving `httpx.ReadTimeout` is normalized to
`TimeoutError`, 404 becomes `DomainNotFoundError`, 409 becomes
`DomainConflictError`, and a 500 is not converted to not-found by appointment
resolution.

- [ ] **Step 2: Run resilience tests and verify RED**

Run: `cd ai/booking_langgraph_service && python3 -m pytest -q tests/test_graph_resilience.py -k 'timeout or permanent'`

Expected: raw exceptions escape the graph.

- [ ] **Step 3: Implement read policy from tool metadata**

Create `SafeErrorCategory`, `DomainToolError`, `DomainNotFoundError`,
`DomainConflictError`, and internal `ReadToolFailure`/`MalformedToolPayload`
types. Normalize `httpx.TimeoutException` to built-in `TimeoutError` in the HTTP
adapter; map 404 and 409 to their typed errors and all other HTTP failures to
`DomainToolError`. Appointment resolution catches only `DomainNotFoundError`.

Build a name-to-spec mapping from `core_domain_tool_specs()`. Add
`_call_read(state, tool_name, call)` that rejects non-read specs, retries one
`TimeoutError`, preserves the original closure/arguments, updates counters,
and raises `ReadToolFailure` after exhaustion or permanent failure.

Wrap all four read operations at their graph call sites. A flow catches only graph-safe internal errors and returns the generic no-change backend response.

- [ ] **Step 4: Run resilience tests and verify GREEN**

Run: `cd ai/booking_langgraph_service && python3 -m pytest -q tests/test_graph_resilience.py -k 'timeout or permanent' tests/test_http_domain_tools.py`

Expected: retry and permanent-error tests pass.

- [ ] **Step 5: Commit**

```bash
git add ai/booking_langgraph_service/src/tool_errors.py \
  ai/booking_langgraph_service/src/graph.py \
  ai/booking_langgraph_service/src/http_tools.py \
  ai/booking_langgraph_service/tests/test_graph_resilience.py \
  ai/booking_langgraph_service/tests/test_http_domain_tools.py
git commit -m "fix(ai): add bounded read recovery policy"
```

### Task 4: Payload Validation And Safe Error Taxonomy

**Files:**
- Modify: `ai/booking_langgraph_service/src/graph.py`
- Modify: `ai/booking_langgraph_service/src/http_tools.py`
- Modify: `ai/booking_langgraph_service/tests/test_graph_resilience.py`
- Modify: `ai/booking_langgraph_service/tests/test_http_domain_tools.py`

- [ ] **Step 1: Write failing payload tests**

Add tests for malformed lookup list items, malformed resolver mappings, malformed booking options, cancelled appointments, and an empty lookup. Assertions must distinguish `malformed_backend_response` from `ownership_safe_unavailable` and must verify no prepare/commit action is present.

```python
@pytest.mark.asyncio
async def test_malformed_resolver_payload_is_backend_failure_not_not_found():
    tools = ResolverTools(result={"code": "APT-001"})
    graph = BookingLangGraph(domain_tools=tools)

    response = await graph.handle_chat(
        ChatRequest(session_id="malformed", message="Cancel APT-001"), "patient-1"
    )

    assert response.metadata["metrics"]["safe_error_category"] == "malformed_backend_response"
    assert response.metadata["metrics"]["payload_validation_failure_count"] == 1
    assert "prepare_cancel" not in response.actions
```

- [ ] **Step 2: Run payload tests and verify RED**

Run: `cd ai/booking_langgraph_service && python3 -m pytest -q tests/test_graph_resilience.py -k 'malformed or empty or cancelled'`

Expected: malformed payloads are treated as empty/not-found or raise field-access errors.

- [ ] **Step 3: Implement exact minimum validators**

Add pure validators for lookup results, booking options, and resolver output. Require non-empty strings exactly as specified in the design. Return validated copies; never mutate adapter-owned payloads. Treat empty lookup as success and cancelled resolver output as non-actionable.

Update `HttpDomainTools` so malformed envelopes raise `RuntimeError` instead of silently normalizing to an empty list. Keep 404/wrong-owner resolution non-enumerating and do not expose raw errors to graph replies.

- [ ] **Step 4: Run payload, HTTP, and core tests**

Run: `cd ai/booking_langgraph_service && python3 -m pytest -q tests/test_graph_resilience.py tests/test_http_domain_tools.py tests/test_graph_core_flows.py`

Expected: all focused tests pass.

- [ ] **Step 5: Commit**

```bash
git add ai/booking_langgraph_service/src/graph.py \
  ai/booking_langgraph_service/src/http_tools.py \
  ai/booking_langgraph_service/tests/test_graph_resilience.py \
  ai/booking_langgraph_service/tests/test_http_domain_tools.py
git commit -m "fix(ai): validate backend payloads before mutation"
```

### Task 5: Runtime Wiring And Verification

**Files:**
- Modify: `ai/booking_langgraph_service/src/settings.py`
- Modify: `ai/booking_langgraph_service/src/main.py`
- Modify: `ai/booking_langgraph_service/tests/test_settings_runtime.py`
- Modify: `docker-compose.yml`

- [ ] **Step 1: Write failing settings tests**

```python
def test_settings_load_confirmation_ttl_and_single_worker(monkeypatch):
    monkeypatch.setenv("BOOKING_LANGGRAPH_CONFIRMATION_TTL_SECONDS", "600")
    monkeypatch.setenv("BOOKING_LANGGRAPH_WORKER_COUNT", "1")

    settings = Settings.from_env()

    assert settings.confirmation_ttl_seconds == 600
    assert settings.worker_count == 1


def test_in_memory_confirmation_store_rejects_multiple_workers():
    with pytest.raises(ValueError, match="shared confirmation store"):
        Settings(worker_count=2)
```

- [ ] **Step 2: Run settings tests and verify RED**

Run: `cd ai/booking_langgraph_service && python3 -m pytest -q tests/test_settings_runtime.py`

Expected: settings fields do not exist.

- [ ] **Step 3: Wire TTL and worker constraint**

Add positive `confirmation_ttl_seconds` and `worker_count` fields with a Pydantic model validator rejecting values other than one while the in-memory store is active. Load both env vars, construct `InMemoryConfirmationStore` in `create_app`, and pass it to the graph. Add explicit compose values `900` and `1`.

- [ ] **Step 4: Run all tests and deterministic benchmark**

```bash
cd ai/booking_langgraph_service
python3 -m pytest -q tests
python3 scripts/run_hardened_agent_benchmark.py \
  --mode deterministic \
  --dataset datasets/agent_safety_golden.jsonl \
  --dataset datasets/agent_natural_multiturn.jsonl \
  --dataset datasets/agent_backend_faults.jsonl \
  --runs 1 \
  --fail-under 0.90 \
  --output-dir /tmp/smile-agent-safety-benchmark-after-invariants
```

Expected: all unit tests pass. The benchmark writes all three artifacts and may exit non-zero for remaining deterministic-parser or semantic failures; do not weaken its gate or oracle.

- [ ] **Step 5: Verify no benchmark-specific production logic**

Run:

```bash
! rg -n "scenario_id|golden-|multi-|fault-" src
git diff --check
```

Expected: no benchmark identifiers in production source and no whitespace errors.

- [ ] **Step 6: Commit**

```bash
git add ai/booking_langgraph_service/src/settings.py \
  ai/booking_langgraph_service/src/main.py \
  ai/booking_langgraph_service/tests/test_settings_runtime.py \
  docker-compose.yml
git commit -m "feat(ai): configure confirmation safety policy"
```
