# Booking Agent Eval Runner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a safe deterministic runner for auditing and replaying the Vietnamese booking-agent evaluation dataset.

**Architecture:** A standalone Python CLI reads JSONL scenarios, applies policy-alignment quarantine rules, replays eligible turns through `/chat`, and scores observable invariants. The chat API exposes only redacted turn-level tool trace metadata needed by the runner.

**Tech Stack:** Python standard library, FastAPI, pytest, booking-agent HTTP API.

---

### Task 1: Expose Safe Turn Trace

**Files:**
- Modify: `ai/booking_agent_service/src/main.py`
- Modify: `ai/booking_agent_service/tests/test_config_and_api.py`

- [ ] Write a failing API test that expects `tool_calls` and `pending_mutation` in response metadata.
- [ ] Add the safe turn trace fields without exposing state or tool results.
- [ ] Run the focused API test.

### Task 2: Audit And Score Scenarios

**Files:**
- Create: `ai/booking_agent_service/scripts/run_vietnamese_agent_eval.py`
- Create: `ai/booking_agent_service/tests/test_eval_runner.py`

- [ ] Write failing tests for policy quarantine, live mutation exclusion, and deterministic scoring.
- [ ] Implement scenario loading, audit rules, confirmation-aware scoring, and report writing.
- [ ] Run focused runner tests.

### Task 3: Safe Live Replay CLI

**Files:**
- Modify: `ai/booking_agent_service/scripts/run_vietnamese_agent_eval.py`
- Modify: `ai/booking_agent_service/tests/test_eval_runner.py`

- [ ] Write failing tests for HTTP replay, per-scenario sessions, limits, and error reporting.
- [ ] Implement `audit` and `run` commands with safe defaults.
- [ ] Run audit against the generated 765-scenario dataset.
- [ ] Run the full booking-agent test suite.
