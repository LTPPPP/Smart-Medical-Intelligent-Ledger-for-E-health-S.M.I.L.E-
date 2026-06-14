from __future__ import annotations

from fastapi.testclient import TestClient

from src.config import Settings
from src.main import create_app
from src.state import AgentState


def test_settings_read_runtime_values_from_environment(monkeypatch):
    monkeypatch.setenv("BOOKING_AGENT_EMR_BASE_URL", "http://clinical:8082")
    monkeypatch.setenv("BOOKING_AGENT_REDIS_URL", "redis://redis:6379/4")
    monkeypatch.setenv("BOOKING_AGENT_REQUIRE_CUDA", "false")
    monkeypatch.setenv("BOOKING_AGENT_STEP_BUDGET", "2")
    monkeypatch.setenv("BOOKING_AGENT_SESSION_LOCK_TTL_SECONDS", "8")
    monkeypatch.setenv("BOOKING_AGENT_LLM_MODEL", "Qwen/Qwen2.5-7B-Instruct-AWQ")

    settings = Settings.from_env()

    assert settings.emr_base_url == "http://clinical:8082"
    assert settings.redis_url == "redis://redis:6379/4"
    assert settings.require_cuda is False
    assert settings.step_budget == 2
    assert settings.session_lock_ttl_seconds == 8
    assert settings.llm_model == "Qwen/Qwen2.5-7B-Instruct-AWQ"


def test_settings_fail_fast_when_cuda_is_required_but_unavailable(monkeypatch):
    monkeypatch.setenv("BOOKING_AGENT_REQUIRE_CUDA", "true")
    monkeypatch.setattr("src.config.cuda_available", lambda: False)

    settings = Settings.from_env()

    try:
        settings.validate_runtime()
    except RuntimeError as exc:
        assert "CUDA" in str(exc)
    else:
        raise AssertionError("expected CUDA validation failure")


def test_health_endpoint_returns_runtime_shape():
    client = TestClient(create_app(settings=Settings(require_cuda=False)))

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "booking-agent-service"


def test_app_startup_validates_cuda_requirement(monkeypatch):
    monkeypatch.setattr("src.config.cuda_available", lambda: False)

    try:
        with TestClient(create_app(settings=Settings(require_cuda=True))):
            pass
    except RuntimeError as exc:
        assert "CUDA" in str(exc)
    else:
        raise AssertionError("expected app startup to fail when CUDA is required")


def test_chat_returns_429_session_busy_for_locked_session():
    client = TestClient(
        create_app(settings=Settings(require_cuda=False), test_session_busy=True)
    )

    response = client.post(
        "/chat",
        json={"session_id": "s1", "message": "đặt lịch khám răng"},
        headers={"x-patient-id": "11111111-1111-4111-8111-111111111111"},
    )

    assert response.status_code == 429
    assert response.json()["retryable"] is True
    assert response.json()["error_code"] == "SESSION_BUSY"


def test_chat_loads_state_attaches_patient_runs_graph_and_persists_state():
    class FakeStore:
        def __init__(self):
            self.saved: AgentState | None = None

        def get(self, session_id):
            return AgentState(session_id=session_id)

        def save(self, state):
            self.saved = state

    class FakeLease:
        acquired = True

        async def release(self):
            pass

    class FakeLock:
        async def acquire(self, session_id):
            assert session_id == "s1"
            return FakeLease()

    class FakeGraph:
        async def run_turn(self, state, message):
            assert state.patient_id == "11111111-1111-4111-8111-111111111111"
            state.current_goal = "lookup"

            class Result:
                reply = "Đây là lịch hẹn của bạn."
                metadata = {"node": "compose_response"}

            return Result()

    store = FakeStore()
    client = TestClient(
        create_app(
            settings=Settings(require_cuda=False),
            state_store=store,
            session_lock=FakeLock(),
            graph=FakeGraph(),
        )
    )

    response = client.post(
        "/chat",
        json={"session_id": "s1", "message": "xem lịch của tôi"},
        headers={"x-patient-id": "11111111-1111-4111-8111-111111111111"},
    )

    assert response.status_code == 200
    assert response.json()["reply"] == "Đây là lịch hẹn của bạn."
    assert response.json()["metadata"] == {"node": "compose_response"}
    assert store.saved is not None
    assert store.saved.current_goal == "lookup"
