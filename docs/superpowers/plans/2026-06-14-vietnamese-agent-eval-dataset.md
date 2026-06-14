# Vietnamese Agent Evaluation Dataset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure CLI that generates and processes 500-1000 multi-turn Vietnamese booking-agent evaluation conversations through OpenAI Batch API.

**Architecture:** A single standard-library Python CLI owns deterministic blueprint creation, OpenAI Batch HTTP operations, result parsing, validation, deduplication, and reporting. Unit tests exercise all offline behavior and mock the network boundary.

**Tech Stack:** Python 3.11+, standard library, pytest, OpenAI Batch API `/v1/responses`.

---

### Task 1: Offline Blueprint And Batch JSONL Generation

**Files:**
- Create: `ai/booking_agent_service/scripts/generate_vietnamese_eval_dataset.py`
- Create: `ai/booking_agent_service/tests/test_eval_dataset_generator.py`

- [ ] Write failing tests for deterministic distributions, unique custom ids, request grouping, and prompt coverage.
- [ ] Run `PYTHONPATH=. pytest tests/test_eval_dataset_generator.py -q` and confirm failure.
- [ ] Implement blueprint allocation and Batch JSONL rendering.
- [ ] Run the focused tests and confirm success.

### Task 2: Dataset Validation And Result Parsing

**Files:**
- Modify: `ai/booking_agent_service/scripts/generate_vietnamese_eval_dataset.py`
- Modify: `ai/booking_agent_service/tests/test_eval_dataset_generator.py`

- [ ] Write failing tests for valid scenarios, invalid turn counts, duplicate removal, and Responses API Batch output parsing.
- [ ] Implement schema validation, deduplication, and coverage reports.
- [ ] Run the focused tests and confirm success.

### Task 3: Secure Batch API Commands

**Files:**
- Modify: `ai/booking_agent_service/scripts/generate_vietnamese_eval_dataset.py`
- Modify: `ai/booking_agent_service/tests/test_eval_dataset_generator.py`

- [ ] Write failing tests proving API key environment enforcement and correct files/batches requests.
- [ ] Implement `submit`, `status`, and `download` without logging or persisting API keys.
- [ ] Run focused tests, the complete booking-agent suite, and CLI smoke tests.
