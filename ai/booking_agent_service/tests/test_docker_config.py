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
    assert "BOOKING_AGENT_LLM_MODEL: Qwen/Qwen3.5-4B" in compose
    assert "Qwen/Qwen2.5-7B-Instruct-AWQ" not in compose


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


def test_qwen35_vllm_start_script_uses_required_tool_and_reasoning_flags():
    script = (ROOT / "ai/booking_agent_service/scripts/start_qwen35_vllm.sh").read_text()

    assert "Qwen/Qwen3.5-4B" in script
    assert "--language-model-only" in script
    assert "--max-model-len 8192" in script
    assert "--reasoning-parser qwen3" in script
    assert "--enable-auto-tool-choice" in script
    assert "--tool-call-parser qwen3_coder" in script
    assert "VLLM_USE_FLASHINFER_SAMPLER" in script
    assert ":-0" in script
    assert "Smart-Medical-Intelligent-Ledger-for-E-health-S.M.I.L.E-" in script


def test_qwen35_planner_smoke_script_checks_models_answer_and_tool_call():
    script = (ROOT / "ai/booking_agent_service/scripts/smoke_qwen35_planner.py").read_text()

    assert "/models" in script
    assert "/chat/completions" in script
    assert "Qwen/Qwen3.5-4B" in script
    assert "chat_template_kwargs" in script
    assert "enable_thinking" in script
    assert "list_clinics" in script
    assert "prompt_tokens" in script
    assert "latency_ms" in script
