from __future__ import annotations

import importlib.util
from pathlib import Path


def _load_docker_preflight():
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "docker_vllm_preflight.py"
    spec = importlib.util.spec_from_file_location("docker_vllm_preflight", script_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_classifies_docker_gpu_cdi_vendor_failure():
    preflight = _load_docker_preflight()

    reason = preflight.classify_compose_error(
        "failed to discover GPU vendor from CDI: no known GPU vendor found"
    )

    assert reason == "docker_gpu_vendor_unavailable"


def test_classifies_missing_nvidia_runtime_failure():
    preflight = _load_docker_preflight()

    reason = preflight.classify_compose_error(
        "could not select device driver \"\" with capabilities: [[gpu]]"
    )

    assert reason == "docker_gpu_runtime_unavailable"


def test_grades_expected_model_payload():
    preflight = _load_docker_preflight()

    grade = preflight.grade_model_payload(
        {"data": [{"id": "Qwen/Qwen3.5-4B"}, {"id": "other"}]},
        "Qwen/Qwen3.5-4B",
    )

    assert grade["status"] == "ok"
    assert grade["expected_model_present"] is True
    assert grade["models"] == ["Qwen/Qwen3.5-4B", "other"]


def test_grades_container_cuda_probe_blocked_driver():
    preflight = _load_docker_preflight()

    grade = preflight.grade_cuda_probe(
        "NVIDIA-SMI has failed because it couldn't communicate with the NVIDIA driver.\n"
        "cuda_available False\n"
        "cuda_device_count 0\n"
    )

    assert grade["status"] == "gpu_driver_unavailable"
    assert grade["cuda_available"] is False


def test_grades_container_cuda_probe_success():
    preflight = _load_docker_preflight()

    grade = preflight.grade_cuda_probe(
        "cuda_available True\ncuda_device_count 1\ncuda_device_name NVIDIA GeForce RTX 3060\n"
    )

    assert grade["status"] == "ok"
    assert grade["cuda_available"] is True
