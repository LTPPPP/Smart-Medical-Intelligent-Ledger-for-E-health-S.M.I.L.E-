from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]


def test_docker_compose_declares_lightweight_booking_agent_profile_and_external_config():
    compose = (ROOT / "docker-compose.yml").read_text()

    assert "booking-agent-service:" in compose
    assert "profiles:" in compose
    assert "- agentic-chatbot" in compose
    assert "BOOKING_AGENT_EMR_BASE_URL" in compose
    assert "BOOKING_AGENT_REDIS_URL" in compose
    assert "BOOKING_AGENT_REQUIRE_CUDA" in compose
    assert "BOOKING_AGENT_LLM_BASE_URL" in compose
    assert "healthcheck:" in compose
    assert "http://127.0.0.1:8020/health" in compose
    assert 'BOOKING_AGENT_REQUIRE_CUDA: "false"' in compose


def test_dockerfile_uses_service_requirements_and_uvicorn():
    dockerfile = (ROOT / "ai/booking_agent_service/Dockerfile").read_text()

    assert "requirements.txt" in dockerfile
    assert "uvicorn" in dockerfile
    assert "src.main:app" in dockerfile


def test_booking_agent_e2e_script_documents_preflight_dependencies():
    script = (ROOT / "ai/booking_agent_service/scripts/e2e_chat_flow.py").read_text()

    assert "check_vllm" in script
    assert "check_redis" in script
    assert "check_http(\"booking-agent\"" in script
    assert "seed_iam_kyc" in script
    assert "lookup → prepare booking → confirm → cancel by code → confirm cancel" in script
