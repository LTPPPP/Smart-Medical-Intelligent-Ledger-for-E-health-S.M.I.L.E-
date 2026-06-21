from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]


def test_compose_declares_vllm_service_for_langgraph_profile():
    compose = (ROOT / "docker-compose.yml").read_text()

    assert "vllm:" in compose
    assert "container_name: smile-vllm" in compose
    assert "- langgraph-chatbot" in compose
    assert "Qwen/Qwen3.5-4B" in compose
    assert "--max-model-len" in compose
    assert "--max-num-seqs" in compose
    assert "--max-num-batched-tokens" in compose
    assert "8000:8000" in compose
    assert "/dev/dxg:/dev/dxg" in compose
    assert "/usr/lib/wsl:/usr/lib/wsl:ro" in compose
    assert "LD_LIBRARY_PATH: /usr/lib/wsl/lib" in compose
    assert "gpus: all" not in compose


def test_langgraph_service_uses_internal_vllm_dns_not_host_bridge():
    compose = (ROOT / "docker-compose.yml").read_text()
    service_start = compose.index("booking-langgraph-service:")
    service_end = compose.index("# ═══════════════════════════════════════════════════════════════════════════", service_start)
    service_block = compose[service_start:service_end]

    assert "BOOKING_LANGGRAPH_LLM_BASE_URL: http://vllm:8000/v1" in service_block
    assert "host.docker.internal:8000" not in service_block
    assert "vllm:" in service_block
