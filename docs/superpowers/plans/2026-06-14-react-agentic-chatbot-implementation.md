# React Agentic Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new FastAPI booking agent service under `ai/booking_agent_service` with safe ReAct orchestration, typed Clinical EMR tools, session memory, deterministic guardrails, Docker/GPU configuration, and complex tests.

**Architecture:** The service is a small Python package: configuration and runtime settings are isolated in `src/config.py`, Pydantic API/state/tool schemas are explicit, Clinical EMR access is wrapped by a typed async client, deterministic guards own mutation safety, and a compact graph runner coordinates planner/tool/composer steps. Tests use fake planners and fake EMR clients so unit coverage does not require GPU.

**Tech Stack:** FastAPI, Pydantic v2, httpx, redis/redis.asyncio, pytest, pytest-asyncio, uvicorn, optional OpenAI-compatible vLLM client over CUDA, Docker Compose with NVIDIA GPU reservation for integration runs.

---

### Task 1: Service Skeleton, Config, And API Schemas

**Files:**
- Create: `ai/booking_agent_service/requirements.txt`
- Create: `ai/booking_agent_service/Dockerfile`
- Create: `ai/booking_agent_service/src/__init__.py`
- Create: `ai/booking_agent_service/src/config.py`
- Create: `ai/booking_agent_service/src/schemas.py`
- Create: `ai/booking_agent_service/src/main.py`
- Test: `ai/booking_agent_service/tests/test_config_and_api.py`

- [ ] **Step 1: Write failing config/API tests**

```python
from fastapi.testclient import TestClient

from src.config import Settings
from src.main import create_app


def test_settings_read_all_runtime_values_from_environment(monkeypatch):
    monkeypatch.setenv("BOOKING_AGENT_EMR_BASE_URL", "http://clinical:8082")
    monkeypatch.setenv("BOOKING_AGENT_REQUIRE_CUDA", "false")
    monkeypatch.setenv("BOOKING_AGENT_STEP_BUDGET", "2")
    settings = Settings.from_env()
    assert settings.emr_base_url == "http://clinical:8082"
    assert settings.require_cuda is False
    assert settings.step_budget == 2


def test_chat_returns_429_session_busy_for_locked_session():
    app = create_app(test_session_busy=True)
    client = TestClient(app)
    response = client.post(
        "/chat",
        json={"session_id": "s1", "message": "đặt lịch khám răng"},
        headers={"x-patient-id": "11111111-1111-4111-8111-111111111111"},
    )
    assert response.status_code == 429
    assert response.json()["retryable"] is True
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ai/booking_agent_service && PYTHONPATH=. pytest tests/test_config_and_api.py -v`
Expected: FAIL because the package and API do not exist yet.

- [ ] **Step 3: Implement minimal config, schemas, and app factory**

Implement environment-only settings, typed request/response schemas, `/health`, `/chat`, and an injectable test-only busy lock path. Keep every tunable value in `Settings`, not in business logic.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ai/booking_agent_service && PYTHONPATH=. pytest tests/test_config_and_api.py -v`
Expected: PASS.

### Task 2: Deterministic Guards And Redaction

**Files:**
- Create: `ai/booking_agent_service/src/guards.py`
- Create: `ai/booking_agent_service/src/redaction.py`
- Test: `ai/booking_agent_service/tests/test_guards.py`

- [ ] **Step 1: Write failing guard tests**

Cover Vietnamese positive/negative/ambiguous confirmation detection, emergency symptom priority, normal dental pain allowed, invented id/code post-check, and observability redaction for phone/email/raw chief complaint.

- [ ] **Step 2: Run guard tests and verify RED**

Run: `cd ai/booking_agent_service && PYTHONPATH=. pytest tests/test_guards.py -v`
Expected: FAIL because guard modules do not exist.

- [ ] **Step 3: Implement minimal deterministic guards**

Implement rule-based confirmation detection, emergency/systemic symptom screening with Vietnamese accent-insensitive matching, redaction helpers, and response id/code validation against an allowlist supplied by state/tool observations.

- [ ] **Step 4: Run guard tests and verify GREEN**

Run: `cd ai/booking_agent_service && PYTHONPATH=. pytest tests/test_guards.py -v`
Expected: PASS.

### Task 3: State, Memory, Reference Resolution, And Locks

**Files:**
- Create: `ai/booking_agent_service/src/state.py`
- Create: `ai/booking_agent_service/src/memory.py`
- Create: `ai/booking_agent_service/src/locks.py`
- Test: `ai/booking_agent_service/tests/test_memory_reference_locking.py`

- [ ] **Step 1: Write failing memory/reference/lock tests**

Cover candidate indexes, ordinal resolution, stale schedule refresh requirement, patient appointment 10-minute freshness, pending confirmation expiry, schema version migration, malformed state reset, and per-session lock acquisition/release/busy behavior.

- [ ] **Step 2: Run tests and verify RED**

Run: `cd ai/booking_agent_service && PYTHONPATH=. pytest tests/test_memory_reference_locking.py -v`
Expected: FAIL because state and memory modules do not exist.

- [ ] **Step 3: Implement state and memory**

Implement Pydantic state models with `state_schema_version`, in-memory store with TTL, deterministic reference resolver, pending confirmation lifecycle, and in-memory plus Redis-compatible session lock interfaces.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `cd ai/booking_agent_service && PYTHONPATH=. pytest tests/test_memory_reference_locking.py -v`
Expected: PASS.

### Task 4: Clinical EMR Client And Tool Registry

**Files:**
- Create: `ai/booking_agent_service/src/emr_client.py`
- Create: `ai/booking_agent_service/src/tools.py`
- Test: `ai/booking_agent_service/tests/test_tools_emr_client.py`

- [ ] **Step 1: Write failing client/tool tests**

Assert exact request method/path/body/header construction for `list_clinics`, `get_clinic`, `list_services`, `list_clinic_services`, `list_specialties`, `list_doctor_schedules`, `book_by_specialty`, `book_by_doctor`, `get_patient_appointments`, `get_appointment_by_code`, and `cancel_appointment`.

- [ ] **Step 2: Run tests and verify RED**

Run: `cd ai/booking_agent_service && PYTHONPATH=. pytest tests/test_tools_emr_client.py -v`
Expected: FAIL because client and tools do not exist.

- [ ] **Step 3: Implement client and typed tools**

Implement httpx async client methods against Clinical EMR `/api/v1/*` paths, Pydantic tool argument schemas, idempotency headers for mutations, schema validation, and normalized recoverable backend errors for 404/409/authorization failures.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `cd ai/booking_agent_service && PYTHONPATH=. pytest tests/test_tools_emr_client.py -v`
Expected: PASS.

### Task 5: Planner Parser, Graph Runner, And Response Composer

**Files:**
- Create: `ai/booking_agent_service/src/planner.py`
- Create: `ai/booking_agent_service/src/graph.py`
- Create: `ai/booking_agent_service/src/composer.py`
- Test: `ai/booking_agent_service/tests/test_graph_flows.py`

- [ ] **Step 1: Write failing graph flow tests**

Cover OpenAI tool-call parsing, Qwen JSON fallback parsing, parser failure without tool execution, booking by specialty prepare/confirm/commit, booking by doctor prepare/confirm/commit, appointment lookup, cancel ownership verify, duplicate confirmation retry prevention, stale conflict handling, step-budget exhaustion, goal-change post-plan invalidation, commit-timeout read-verify recovery, and redacted metadata.

- [ ] **Step 2: Run tests and verify RED**

Run: `cd ai/booking_agent_service && PYTHONPATH=. pytest tests/test_graph_flows.py -v`
Expected: FAIL because graph modules do not exist.

- [ ] **Step 3: Implement graph runner and composer**

Implement a compact graph runner with named node metadata, fake planner support for tests, bounded tool loop, policy guard integration, mutation two-phase confirmation, and Vietnamese response composition grounded only in state/tool observations.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `cd ai/booking_agent_service && PYTHONPATH=. pytest tests/test_graph_flows.py -v`
Expected: PASS.

### Task 6: Docker, GPU Runtime, And Integration Verification

**Files:**
- Modify: `docker-compose.yml`
- Create: `ai/booking_agent_service/.dockerignore`
- Test: `ai/booking_agent_service/tests/test_docker_config.py`

- [ ] **Step 1: Write failing Docker/config tests**

Assert Dockerfile uses the service requirements, compose includes `booking-agent-service`, environment variables are present, Redis and Clinical EMR are configured, and GPU reservation/device configuration exists for CUDA/vLLM integration.

- [ ] **Step 2: Run tests and verify RED**

Run: `cd ai/booking_agent_service && PYTHONPATH=. pytest tests/test_docker_config.py -v`
Expected: FAIL before Docker/compose wiring exists.

- [ ] **Step 3: Implement Docker and compose wiring**

Add service Dockerfile, `.dockerignore`, compose service with `BOOKING_AGENT_REQUIRE_CUDA=true`, vLLM OpenAI-compatible URL/model env vars, Redis URL, Clinical EMR URL, and NVIDIA GPU reservation.

- [ ] **Step 4: Run local and container verification**

Run:

```bash
cd ai/booking_agent_service && PYTHONPATH=. pytest -v
docker compose config >/tmp/smile-compose-config.yml
docker compose build booking-agent-service
```

Expected: pytest PASS, compose config succeeds, image builds. If the host lacks a running vLLM model or CUDA device at verification time, record that as an integration runtime limitation while keeping unit tests deterministic.

### Task 7: Final Review And Commit

**Files:**
- All files touched by Tasks 1-6.

- [ ] **Step 1: Run full targeted verification**

Run:

```bash
cd ai/booking_agent_service && PYTHONPATH=. pytest -v
git diff --check
npx gitnexus detect-changes --scope staged --repo /home/npk/.config/superpowers/worktrees/Smart-Medical-Intelligent-Ledger-for-E-health-S.M.I.L.E-/feat-ai-react-agentic-chatbot
```

- [ ] **Step 2: Review git status**

Stage only chatbot implementation, plan/spec changes, and Docker config. Do not stage unrelated generated GitNexus files.

- [ ] **Step 3: Commit**

Run:

```bash
git commit -m "feat(ai): add react booking agent service"
```

Expected: one implementation commit on `feat/ai/react-agentic-chatbot`.
