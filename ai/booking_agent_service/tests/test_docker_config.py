from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]


def test_docker_compose_declares_booking_agent_with_gpu_and_external_config():
    compose = (ROOT / "docker-compose.yml").read_text()

    assert "booking-agent-service:" in compose
    assert "BOOKING_AGENT_EMR_BASE_URL" in compose
    assert "BOOKING_AGENT_REDIS_URL" in compose
    assert "BOOKING_AGENT_REQUIRE_CUDA" in compose
    assert "BOOKING_AGENT_LLM_BASE_URL" in compose
    assert "capabilities: [gpu]" in compose or "capabilities:\n              - gpu" in compose


def test_dockerfile_uses_service_requirements_and_uvicorn():
    dockerfile = (ROOT / "ai/booking_agent_service/Dockerfile").read_text()

    assert "requirements.txt" in dockerfile
    assert "uvicorn" in dockerfile
    assert "src.main:app" in dockerfile
