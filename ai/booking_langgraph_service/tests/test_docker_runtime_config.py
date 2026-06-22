from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]


def test_compose_has_no_vllm_or_qwen_runtime():
    compose = (ROOT / "docker-compose.yml").read_text(encoding="utf-8")

    assert "smile-vllm" not in compose
    assert "Qwen/" not in compose


def test_langgraph_service_uses_openai_gpt_5_mini_without_fallback_dependency():
    compose = (ROOT / "docker-compose.yml").read_text(encoding="utf-8")
    service_start = compose.index("booking-langgraph-service:")
    service_end = compose.index("# ═══════════════════════════════════════════════════════════════════════════", service_start)
    service_block = compose[service_start:service_end]

    assert "BOOKING_LANGGRAPH_LLM_PROVIDER: openai" in service_block
    assert "BOOKING_LANGGRAPH_LLM_BASE_URL: https://api.openai.com/v1" in service_block
    assert "BOOKING_LANGGRAPH_LLM_MODEL: gpt-5-mini" in service_block
    assert "BOOKING_LANGGRAPH_LLM_API_KEY: ${OPENAI_API_KEY:-}" in service_block
    assert 'BOOKING_LANGGRAPH_REQUEST_TIMEOUT_SECONDS: "20"' in service_block
    assert 'BOOKING_LANGGRAPH_CONFIRMATION_TTL_SECONDS: "900"' in service_block
    assert 'BOOKING_LANGGRAPH_CONVERSATION_TTL_SECONDS: "3600"' in service_block
    assert "BOOKING_LANGGRAPH_REDIS_URL: redis://redis:6379/2" in service_block
    assert 'BOOKING_LANGGRAPH_WORKER_COUNT: "1"' in service_block
    assert "GEMINI_API_KEY" not in service_block
    assert "vllm:" not in service_block
