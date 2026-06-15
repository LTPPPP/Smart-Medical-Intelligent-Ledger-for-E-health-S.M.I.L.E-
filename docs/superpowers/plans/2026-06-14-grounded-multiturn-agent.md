# Grounded Multi-Turn Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the booking agent reliably use redacted conversation history, structured slots, candidate lists, and deterministic Vietnamese references across turns.

**Architecture:** Extend `AgentState` with typed workflow slots and bounded redacted turns. Build a safe planner memory view from state, resolve references and carry known slots before planning, and use candidate labels for user-facing confirmations while backend ids remain authoritative.

**Tech Stack:** Python 3.11, Pydantic, FastAPI, Redis, pytest, vLLM OpenAI-compatible tool calling.

---

### Task 1: Structured Session Memory

**Files:**
- Modify: `ai/booking_agent_service/src/state.py`
- Modify: `ai/booking_agent_service/src/memory.py`
- Modify: `ai/booking_agent_service/src/redaction.py`
- Modify: `ai/booking_agent_service/tests/test_memory_reference_locking.py`

- [ ] Write failing tests for typed slots, bounded redacted turns, candidate-safe memory rendering, and goal-switch slot invalidation.
- [ ] Implement `WorkflowSlots`, recent-turn recording, safe memory rendering, and focused slot clearing.
- [ ] Run focused memory tests.

### Task 2: Planner Grounding

**Files:**
- Modify: `ai/booking_agent_service/src/llm_client.py`
- Modify: `ai/booking_agent_service/tests/test_llm_planner.py`

- [ ] Write failing tests proving planner payload contains safe slots, recent redacted turns, pending summary, and indexed candidate labels without raw candidate payloads.
- [ ] Implement compact safe memory messages in the vLLM prompt.
- [ ] Run focused planner tests.

### Task 3: Deterministic Reference And Slot Carry-Over

**Files:**
- Modify: `ai/booking_agent_service/src/graph.py`
- Modify: `ai/booking_agent_service/tests/test_graph_flows.py`

- [ ] Write failing tests for “lịch thứ hai”, “lịch đó”, slot reuse across booking turns, and goal-switch invalidation.
- [ ] Resolve active candidate references before planner, update structured slots from read observations and tool proposals, and merge known slots into booking proposals.
- [ ] Run focused graph tests.

### Task 4: Friendly Grounded Responses

**Files:**
- Modify: `ai/booking_agent_service/src/composer.py`
- Modify: `ai/booking_agent_service/src/graph.py`
- Modify: `ai/booking_agent_service/tests/test_composer.py`
- Modify: `ai/booking_agent_service/tests/test_graph_flows.py`

- [ ] Write failing tests proving confirmation and candidate responses prefer verified labels over UUIDs.
- [ ] Implement label-aware confirmation summaries and indexed candidate rendering.
- [ ] Run focused and full booking-agent tests.
