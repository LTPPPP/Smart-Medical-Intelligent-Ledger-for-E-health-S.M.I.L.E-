# Qwen3.5 Orchestration Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Qwen3.5-4B the sole planner model and harden the booking agent's grounded candidate memory, adaptive reasoning, and read-tool loop.

**Architecture:** Keep model-specific request behavior inside `VllmPlanner`, canonical read validation/signatures inside `ToolRegistry`, and turn-local loop policy inside `BookingAgentGraph`. Extend `CandidateList` with bounded prompt rendering and deterministic presentation metadata while preserving richer server-owned state.

**Tech Stack:** Python 3.11, FastAPI, Pydantic 2, httpx, Redis, pytest, vLLM OpenAI-compatible API, Qwen3.5-4B.

---

### Task 1: Qwen3.5 Planner Contract And Adaptive Reasoning

**Files:**
- Modify: `ai/booking_agent_service/src/config.py`
- Modify: `ai/booking_agent_service/src/llm_client.py`
- Modify: `ai/booking_agent_service/src/graph.py`
- Modify: `ai/booking_agent_service/tests/test_config_and_api.py`
- Modify: `ai/booking_agent_service/tests/test_llm_planner.py`

- [ ] **Step 1: Write failing tests for the Qwen3.5-only configuration**

Add assertions that `Settings().llm_model == "Qwen/Qwen3.5-4B"`, that environment overrides still work, and that no fallback-model setting exists.

- [ ] **Step 2: Run the focused config tests and verify RED**

Run:

```bash
cd ai/booking_agent_service
pytest -q tests/test_config_and_api.py
```

Expected: failure because the default still points to Qwen2.5-7B.

- [ ] **Step 3: Write failing planner tests for adaptive reasoning and usage metadata**

Cover a simple first planning request with:

```python
assert body["chat_template_kwargs"] == {"enable_thinking": False}
```

Cover a subsequent/complex planning request with:

```python
assert body["chat_template_kwargs"] == {"enable_thinking": True}
assert action.metadata["reasoning_mode"] == "thinking"
```

Also assert that `prompt_tokens` from the vLLM response usage is returned as planner metadata and reasoning content is ignored.

- [ ] **Step 4: Run planner tests and verify RED**

Run:

```bash
pytest -q tests/test_llm_planner.py
```

Expected: failures because planner context, adaptive reasoning, and metadata do not exist yet.

- [ ] **Step 5: Implement the minimal planner context contract**

Add a `PlannerContext` dataclass carrying:

```python
step_index: int
remaining_steps: int
attempted_read_signatures: list[str]
duplicate_read_blocked: bool
reference_ambiguous: bool
multi_goal: bool
```

Update `VllmPlanner.next_action` to accept it, select thinking deterministically, send `chat_template_kwargs`, and attach safe response usage metadata to `PlannerAction`.

- [ ] **Step 6: Update graph planner calls and run focused tests GREEN**

Pass a fresh/updated `PlannerContext` at each planning step. Run:

```bash
pytest -q tests/test_config_and_api.py tests/test_llm_planner.py tests/test_graph_flows.py
```

Expected: all selected tests pass.

- [ ] **Step 7: Commit**

```bash
git add ai/booking_agent_service/src/config.py ai/booking_agent_service/src/llm_client.py ai/booking_agent_service/src/planner.py ai/booking_agent_service/src/graph.py ai/booking_agent_service/tests/test_config_and_api.py ai/booking_agent_service/tests/test_llm_planner.py ai/booking_agent_service/tests/test_graph_flows.py
git commit -m "feat(ai): migrate planner contract to qwen35"
```

### Task 2: Bounded Candidate Memory And Deterministic Reference Resolution

**Files:**
- Modify: `ai/booking_agent_service/src/memory.py`
- Modify: `ai/booking_agent_service/src/state.py`
- Modify: `ai/booking_agent_service/src/graph.py`
- Modify: `ai/booking_agent_service/tests/test_memory_reference_locking.py`
- Modify: `ai/booking_agent_service/tests/test_graph_flows.py`

- [ ] **Step 1: Write failing candidate-memory tests**

Cover:

- `CandidateList` stores `presented_at`.
- Prompt rendering limits each kind to 20 items, 40 total, and 160 characters per label.
- Safe memory caps recent turns at 500 characters.
- Full retained candidates remain resolvable even when omitted from prompt rendering.

- [ ] **Step 2: Run memory tests and verify RED**

Run:

```bash
pytest -q tests/test_memory_reference_locking.py
```

Expected: failures for missing presentation metadata and prompt bounds.

- [ ] **Step 3: Implement bounded candidate and safe-memory rendering**

Add `presented_at`, bounded label rendering, total candidate limits, and priority ordering that preserves the active workflow kind and most recently presented kind.

- [ ] **Step 4: Write failing reference-resolution tests**

Cover explicit entity phrases, next-required workflow slot, most-recently-presented list, and ambiguous same-index references across clinic/service lists.

- [ ] **Step 5: Run reference tests and verify RED**

Run:

```bash
pytest -q tests/test_memory_reference_locking.py -k reference
```

Expected: failures because the graph currently resolves only schedule/appointment.

- [ ] **Step 6: Implement deterministic multi-kind resolution**

Return a structured resolution result containing candidate kind, candidate, and ambiguity status. Update matching slots for clinic, service, specialty, schedule, and appointment. On ambiguity, stop before planning and ask which entity list the user meant.

- [ ] **Step 7: Run focused tests GREEN and commit**

Run:

```bash
pytest -q tests/test_memory_reference_locking.py tests/test_graph_flows.py
```

Then:

```bash
git add ai/booking_agent_service/src/memory.py ai/booking_agent_service/src/state.py ai/booking_agent_service/src/graph.py ai/booking_agent_service/tests/test_memory_reference_locking.py ai/booking_agent_service/tests/test_graph_flows.py
git commit -m "feat(ai): ground catalog candidate memory"
```

### Task 3: Catalog Candidate Extraction

**Files:**
- Modify: `ai/booking_agent_service/src/graph.py`
- Modify: `ai/booking_agent_service/tests/test_graph_flows.py`

- [ ] **Step 1: Write failing graph tests for catalog reads**

Test raw-list and `{ "data": [...] }` responses for:

```text
list_clinics -> clinic
list_services -> service
list_clinic_services -> service
list_specialties -> specialty
```

Assert catalog TTL `600`, backend ids, grounded labels, a maximum of 100 retained items, empty-success replacement, and failed-read preservation.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
pytest -q tests/test_graph_flows.py -k "clinic or service or specialty or candidate"
```

Expected: catalog candidate assertions fail because only schedule and appointment candidates are persisted.

- [ ] **Step 3: Implement shared deterministic candidate extraction**

Add small graph helpers for list-envelope extraction, id-field selection, backend-only labels, bounded retention, and candidate-list storage. Reuse the helper for existing schedule and appointment handling where practical.

- [ ] **Step 4: Run focused tests GREEN and commit**

Run:

```bash
pytest -q tests/test_graph_flows.py tests/test_memory_reference_locking.py
```

Then:

```bash
git add ai/booking_agent_service/src/graph.py ai/booking_agent_service/tests/test_graph_flows.py
git commit -m "feat(ai): persist catalog read candidates"
```

### Task 4: Canonical Read Signatures And Turn-Local Deduplication

**Files:**
- Modify: `ai/booking_agent_service/src/tools.py`
- Modify: `ai/booking_agent_service/src/graph.py`
- Modify: `ai/booking_agent_service/tests/test_tools_emr_client.py`
- Modify: `ai/booking_agent_service/tests/test_graph_flows.py`

- [ ] **Step 1: Write failing canonical-signature tests**

Assert:

```python
registry.canonical_read_signature("list_specialties", {}) == \
registry.canonical_read_signature("list_specialties", {"active_only": None})
```

Also assert stable key ordering and that validated execution uses the same normalized arguments as signature generation.

- [ ] **Step 2: Run tool tests and verify RED**

Run:

```bash
pytest -q tests/test_tools_emr_client.py
```

Expected: failure because canonical signatures are not implemented.

- [ ] **Step 3: Implement normalized read validation and signatures**

Add a single `normalize_read_call(name, arguments)` path returning validated arguments and a canonical JSON signature. Use it from both signature generation and read execution.

- [ ] **Step 4: Write failing graph dedup tests**

Cover:

- Same signature executes once in a turn.
- Different argument signatures execute normally.
- Same signature may execute in a later turn.
- Final-step duplicate returns safe clarification.
- Two consecutive duplicate proposals stop early.
- Timeout/mutation verification reads remain unaffected.

- [ ] **Step 5: Run graph tests and verify RED**

Run:

```bash
pytest -q tests/test_graph_flows.py -k "duplicate or signature or timeout"
```

Expected: duplicate reads execute repeatedly.

- [ ] **Step 6: Implement turn-local dedup policy**

Track attempted read signatures and consecutive duplicate count inside `run_turn`, block execution before `ToolRegistry.execute`, feed compact attempted-signature hints into `PlannerContext`, and record:

```python
metadata["duplicate_read_blocked"]
metadata["duplicate_read_signatures"]
```

- [ ] **Step 7: Run focused tests GREEN and commit**

Run:

```bash
pytest -q tests/test_tools_emr_client.py tests/test_graph_flows.py tests/test_llm_planner.py
```

Then:

```bash
git add ai/booking_agent_service/src/tools.py ai/booking_agent_service/src/graph.py ai/booking_agent_service/tests/test_tools_emr_client.py ai/booking_agent_service/tests/test_graph_flows.py ai/booking_agent_service/tests/test_llm_planner.py
git commit -m "feat(ai): prevent repeated read tool loops"
```

### Task 5: Runtime Configuration And Visible Planner Failure

**Files:**
- Modify: `docker-compose.yml`
- Modify: `ai/booking_agent_service/src/graph.py`
- Modify: `ai/booking_agent_service/tests/test_docker_config.py`
- Modify: `ai/booking_agent_service/tests/test_graph_flows.py`
- Create: `ai/booking_agent_service/scripts/start_qwen35_vllm.sh`

- [ ] **Step 1: Write failing runtime/config tests**

Assert Compose config uses only `Qwen/Qwen3.5-4B`, and the launch script contains:

```text
--language-model-only
--max-model-len 8192
--reasoning-parser qwen3
--enable-auto-tool-choice
--tool-call-parser qwen3_coder
```

Add a graph test asserting planner HTTP/runtime failure returns a visible planner-unavailable reply and metadata without invoking tools.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
pytest -q tests/test_docker_config.py tests/test_graph_flows.py -k "planner or qwen"
```

Expected: failures because Compose still names Qwen2.5 and no launch script exists.

- [ ] **Step 3: Implement runtime configuration and error boundary**

Update Compose, add the executable launch script using the existing vLLM environment, and catch planner transport/runtime errors at the graph planning boundary. Do not add fallback routing.

- [ ] **Step 4: Run focused tests GREEN and commit**

Run:

```bash
pytest -q tests/test_docker_config.py tests/test_graph_flows.py
```

Then:

```bash
git add docker-compose.yml ai/booking_agent_service/scripts/start_qwen35_vllm.sh ai/booking_agent_service/src/graph.py ai/booking_agent_service/tests/test_docker_config.py ai/booking_agent_service/tests/test_graph_flows.py
git commit -m "feat(ai): configure qwen35-only runtime"
```

### Task 6: Evaluation Metrics And Full Verification

**Files:**
- Modify: `ai/booking_agent_service/scripts/run_vietnamese_agent_eval.py`
- Modify: `ai/booking_agent_service/tests/test_eval_runner.py`
- Create: `ai/booking_agent_service/scripts/smoke_qwen35_planner.py`

- [ ] **Step 1: Write failing eval-metric tests**

Add fixtures asserting summaries include:

```text
duplicate_read_block_count
reasoning_mode_counts
prompt_token_distribution
candidate_reference_resolution: correct / ambiguous_safe / incorrect
latency_ms: p50 / p95
```

- [ ] **Step 2: Run eval tests and verify RED**

Run:

```bash
pytest -q tests/test_eval_runner.py
```

Expected: failures because the metrics are absent.

- [ ] **Step 3: Implement metric aggregation and Qwen3.5 smoke script**

Aggregate only redacted metadata. The smoke script must verify `/v1/models`, one direct answer, one `list_clinics` tool call, and report prompt tokens/latency without performing mutations.

- [ ] **Step 4: Run the complete unit suite**

Run:

```bash
pytest -q
```

Expected: all tests pass.

- [ ] **Step 5: Start Qwen3.5 and perform live smoke verification**

Run:

```bash
bash scripts/start_qwen35_vllm.sh
python3 scripts/smoke_qwen35_planner.py --llm-url http://localhost:8000/v1
```

Expected: model id is `Qwen/Qwen3.5-4B`, direct answer and tool call succeed, and prompt-token/latency metrics are printed.

- [ ] **Step 6: Rebuild booking agent and run safe live evaluation**

Run:

```bash
docker compose --profile agentic-chatbot up -d --build booking-agent-service
python3 scripts/run_vietnamese_agent_eval.py run --limit 20 --concurrency 1
```

Expected: no mutation tools execute; report contains the new orchestration metrics.

- [ ] **Step 7: Commit**

```bash
git add ai/booking_agent_service/scripts/run_vietnamese_agent_eval.py ai/booking_agent_service/scripts/smoke_qwen35_planner.py ai/booking_agent_service/tests/test_eval_runner.py
git commit -m "test(ai): measure qwen35 orchestration quality"
```

- [ ] **Step 8: Final completion audit**

Run:

```bash
git status --short
git log --oneline -8
rg -n "Qwen/Qwen2.5-7B-Instruct-AWQ" ai/booking_agent_service docker-compose.yml --glob '!artifacts/**'
```

Expected: only unrelated pre-existing dirty files remain; no active booking-agent/runtime configuration references Qwen2.5-7B.
