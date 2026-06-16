from __future__ import annotations

from fastapi.testclient import TestClient

from src.config import Settings
from src.graph import BookingAgentGraph
from src.locks import InMemorySessionLock
from src.locks import RedisSessionLock
from src.main import build_default_session_lock, build_default_state_store, create_app
from src.memory import InMemoryStateStore
from src.memory import RedisStateStore
from src.planner import FakePlanner, PlannerAction
from src.state import AgentState


def test_settings_read_runtime_values_from_environment(monkeypatch):
    monkeypatch.setenv("BOOKING_AGENT_EMR_BASE_URL", "http://clinical:8082")
    monkeypatch.setenv("BOOKING_AGENT_REDIS_URL", "redis://redis:6379/4")
    monkeypatch.setenv("BOOKING_AGENT_REQUIRE_CUDA", "false")
    monkeypatch.setenv("BOOKING_AGENT_STEP_BUDGET", "2")
    monkeypatch.setenv("BOOKING_AGENT_SESSION_LOCK_TTL_SECONDS", "8")
    monkeypatch.setenv("BOOKING_AGENT_LLM_MODEL", "Qwen/Qwen3.5-4B")

    settings = Settings.from_env()

    assert settings.emr_base_url == "http://clinical:8082"
    assert settings.redis_url == "redis://redis:6379/4"
    assert settings.require_cuda is False
    assert settings.step_budget == 2
    assert settings.session_lock_ttl_seconds == 8
    assert settings.llm_model == "Qwen/Qwen3.5-4B"


def test_settings_default_to_qwen35_without_fallback_model():
    settings = Settings(require_cuda=False)

    assert settings.llm_model == "Qwen/Qwen3.5-4B"
    assert not hasattr(settings, "llm_fallback_model")


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


def test_cuda_available_accepts_nvidia_runtime_without_torch(monkeypatch):
    monkeypatch.setenv("NVIDIA_VISIBLE_DEVICES", "GPU-abc")
    monkeypatch.setattr("src.config.shutil.which", lambda command: None)

    from src.config import cuda_available

    assert cuda_available() is True


def test_health_endpoint_returns_runtime_shape():
    client = TestClient(
        create_app(
            settings=Settings(require_cuda=False),
            state_store=InMemoryStateStore(),
            session_lock=InMemorySessionLock(ttl_seconds=8),
            graph=BookingAgentGraph(
                planner=FakePlanner([PlannerAction(kind="answer", answer="ok")]),
                tool_registry=None,
                step_budget=1,
            ),
        )
    )

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
        create_app(
            settings=Settings(require_cuda=False),
            test_session_busy=True,
            state_store=InMemoryStateStore(),
            session_lock=InMemorySessionLock(ttl_seconds=8),
            graph=BookingAgentGraph(
                planner=FakePlanner([PlannerAction(kind="answer", answer="ok")]),
                tool_registry=None,
                step_budget=1,
            ),
        )
    )

    response = client.post(
        "/chat",
        json={"session_id": "s1", "message": "đặt lịch khám răng"},
        headers={"x-patient-id": "11111111-1111-4111-8111-111111111111"},
    )

    assert response.status_code == 429
    assert response.json()["retryable"] is True
    assert response.json()["error_code"] == "SESSION_BUSY"


def test_default_session_lock_uses_redis_setnx_ttl_factory():
    lock = build_default_session_lock(
        Settings(require_cuda=False, redis_url="redis://redis:6379/2")
    )

    assert isinstance(lock, RedisSessionLock)
    assert lock.ttl_seconds == 8


def test_default_state_store_uses_redis_with_session_ttl():
    store = build_default_state_store(
        Settings(require_cuda=False, redis_url="redis://redis:6379/2", session_ttl_seconds=7200)
    )

    assert isinstance(store, RedisStateStore)
    assert store.ttl_seconds == 7200


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
                tool_calls = ["get_patient_appointments"]
                pending_mutation = False

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
    assert response.json()["metadata"] == {
        "node": "compose_response",
        "tool_calls": ["get_patient_appointments"],
        "pending_mutation": False,
    }
    assert store.saved is not None
    assert store.saved.current_goal == "lookup"


def test_chat_endpoint_runs_multiturn_booking_and_cancellation_flow():
    patient_id = "11111111-1111-4111-8111-111111111111"
    booking_payload = {
        "doctor_id": "22222222-2222-4222-8222-222222222222",
        "patient_id": "99999999-9999-4999-8999-999999999999",
        "clinic_id": "33333333-3333-4333-8333-333333333333",
        "appointment_date": "2026-06-20",
        "appointment_time": "09:00",
        "created_by": "99999999-9999-4999-8999-999999999999",
    }

    class FakeTools:
        def __init__(self):
            self.calls: list[tuple[str, dict, str | None]] = []

        async def execute(self, name, arguments, idempotency_key=None):
            self.calls.append((name, arguments, idempotency_key))
            if name == "get_patient_appointments":
                return [
                    {
                        "appointment_id": "44444444-4444-4444-8444-444444444444",
                        "appointment_code": "APT-20260620-0001",
                        "appointment_date": "2026-06-20",
                        "appointment_time": "09:00",
                        "status": "scheduled",
                    }
                ]
            if name == "book_by_doctor":
                return {
                    "appointment_id": "55555555-5555-4555-8555-555555555555",
                    "appointment_code": "APT-20260620-0002",
                    "appointment_date": arguments["appointment_date"],
                    "appointment_time": arguments["appointment_time"],
                    "status": "scheduled",
                }
            if name == "get_appointment_by_code":
                return {
                    "appointment_id": "44444444-4444-4444-8444-444444444444",
                    "appointment_code": arguments["code"],
                    "patient_id": patient_id,
                    "status": "scheduled",
                }
            if name == "cancel_appointment":
                return {
                    "appointment_id": arguments["appointment_id"],
                    "appointment_code": "APT-20260620-0001",
                    "status": "cancelled",
                }
            raise AssertionError(f"unexpected tool {name}")

    tools = FakeTools()
    graph = BookingAgentGraph(
        planner=FakePlanner(
            [
                PlannerAction.tool("get_patient_appointments", {"patient_id": patient_id}),
                PlannerAction.tool("book_by_doctor", booking_payload),
                PlannerAction.goal_change("cancel"),
                PlannerAction.tool(
                    "get_appointment_by_code",
                    {"code": "APT-20260620-0001"},
                ),
            ]
        ),
        tool_registry=tools,
        step_budget=1,
    )
    store = InMemoryStateStore()
    client = TestClient(
        create_app(
            settings=Settings(require_cuda=False),
            state_store=store,
            session_lock=InMemorySessionLock(ttl_seconds=8),
            graph=graph,
        )
    )

    headers = {"x-patient-id": patient_id}
    lookup = client.post(
        "/chat",
        json={"session_id": "s-full", "message": "xem lịch hẹn của tôi"},
        headers=headers,
    )
    prepare_booking = client.post(
        "/chat",
        json={"session_id": "s-full", "message": "đặt lịch bác sĩ ngày 20 lúc 9h"},
        headers=headers,
    )
    confirm_booking = client.post(
        "/chat",
        json={"session_id": "s-full", "message": "đồng ý xác nhận"},
        headers=headers,
    )
    switch_to_cancel = client.post(
        "/chat",
        json={"session_id": "s-full", "message": "hủy lịch APT-20260620-0001"},
        headers=headers,
    )
    prepare_cancel = client.post(
        "/chat",
        json={"session_id": "s-full", "message": "hủy lịch APT-20260620-0001"},
        headers=headers,
    )
    confirm_cancel = client.post(
        "/chat",
        json={"session_id": "s-full", "message": "xác nhận hủy"},
        headers=headers,
    )

    assert lookup.status_code == 200
    assert "APT-20260620-0001" in lookup.json()["reply"]
    assert lookup.json()["metadata"]["candidate_list_updated"] == "appointment"
    assert prepare_booking.json()["metadata"]["pending_confirmation_created"] is True
    assert confirm_booking.json()["metadata"]["mutation_committed"] is True
    assert confirm_booking.json()["metadata"]["tool_calls"] == ["book_by_doctor"]
    assert "APT-20260620-0002" in confirm_booking.json()["reply"]
    assert switch_to_cancel.json()["metadata"]["goal_changed_to"] == "cancel"
    assert prepare_cancel.json()["metadata"]["ownership_verified"] is True
    assert confirm_cancel.json()["metadata"]["mutation_committed"] is True
    assert confirm_cancel.json()["metadata"]["tool_calls"] == ["cancel_appointment"]
    assert "cancelled" in confirm_cancel.json()["reply"]

    book_call = next(call for call in tools.calls if call[0] == "book_by_doctor")
    cancel_call = next(call for call in tools.calls if call[0] == "cancel_appointment")
    assert book_call[1]["patient_id"] == patient_id
    assert book_call[1]["created_by"] == patient_id
    assert book_call[2] is not None
    assert cancel_call[1]["appointment_id"] == "44444444-4444-4444-8444-444444444444"
    assert cancel_call[2] is not None
