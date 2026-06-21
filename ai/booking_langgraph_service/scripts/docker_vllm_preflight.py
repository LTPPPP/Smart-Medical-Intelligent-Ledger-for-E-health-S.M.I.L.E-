#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import json
import subprocess
import time
from pathlib import Path
from typing import Any

import httpx


ROOT = Path(__file__).resolve().parents[3]


def classify_compose_error(stderr: str) -> str:
    text = stderr.lower()
    if "failed to discover gpu vendor" in text or "no known gpu vendor" in text:
        return "docker_gpu_vendor_unavailable"
    if "could not select device driver" in text and "gpu" in text:
        return "docker_gpu_runtime_unavailable"
    if "nvidia" in text and ("runtime" in text or "driver" in text):
        return "nvidia_container_runtime_unavailable"
    if "out of memory" in text or "cuda out of memory" in text:
        return "gpu_oom"
    return "compose_start_failed"


def grade_model_payload(payload: dict[str, Any], expected_model: str) -> dict[str, Any]:
    models = [item.get("id") for item in payload.get("data", []) if isinstance(item, dict)]
    present = expected_model in models
    return {
        "status": "ok" if present else "model_missing",
        "expected_model": expected_model,
        "expected_model_present": present,
        "models": models,
    }


def grade_cuda_probe(stdout: str, stderr: str = "") -> dict[str, Any]:
    combined = f"{stdout}\n{stderr}".lower()
    cuda_available = "cuda true" in combined or "cuda_available true" in combined
    if cuda_available:
        status = "ok"
    elif "gpu access blocked" in combined:
        status = "gpu_access_blocked"
    elif "driver not loaded" in combined or "couldn't communicate with the nvidia driver" in combined:
        status = "gpu_driver_unavailable"
    elif "cuda false" in combined or "cuda_available false" in combined:
        status = "cuda_unavailable"
    else:
        status = "unknown"
    return {"status": status, "cuda_available": cuda_available}


def run_command(args: list[str], *, cwd: Path = ROOT, timeout: int = 120) -> dict[str, Any]:
    started = time.perf_counter()
    try:
        completed = subprocess.run(
            args,
            cwd=cwd,
            timeout=timeout,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        return {
            "args": args,
            "returncode": completed.returncode,
            "stdout": completed.stdout.strip(),
            "stderr": completed.stderr.strip(),
            "latency_ms": round((time.perf_counter() - started) * 1000, 2),
        }
    except subprocess.TimeoutExpired as exc:
        return {
            "args": args,
            "returncode": 124,
            "stdout": (exc.stdout or "").strip() if isinstance(exc.stdout, str) else "",
            "stderr": (exc.stderr or "").strip() if isinstance(exc.stderr, str) else "command timed out",
            "latency_ms": round((time.perf_counter() - started) * 1000, 2),
            "error_class": "command_timeout",
        }


async def poll_models(
    llm_url: str,
    expected_model: str,
    *,
    timeout_seconds: int,
) -> dict[str, Any]:
    deadline = time.monotonic() + timeout_seconds
    attempts = 0
    last_error: dict[str, Any] | None = None
    async with httpx.AsyncClient(timeout=5) as client:
        while time.monotonic() < deadline:
            attempts += 1
            started = time.perf_counter()
            try:
                response = await client.get(f"{llm_url.rstrip('/')}/models")
                response.raise_for_status()
                grade = grade_model_payload(response.json(), expected_model)
                grade.update(
                    {
                        "attempts": attempts,
                        "latency_ms": round((time.perf_counter() - started) * 1000, 2),
                    }
                )
                if grade["status"] == "ok":
                    return grade
                last_error = grade
            except httpx.HTTPError as exc:
                last_error = {
                    "status": "unavailable",
                    "error": type(exc).__name__,
                    "detail": str(exc),
                    "attempts": attempts,
                    "latency_ms": round((time.perf_counter() - started) * 1000, 2),
                }
            await asyncio.sleep(2)
    return last_error or {"status": "unavailable", "attempts": attempts}


async def run_preflight(args: argparse.Namespace) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "status": "unknown",
        "expected_model": args.model,
        "llm_url": args.llm_url,
        "checks": {},
    }

    docker_info = run_command(["docker", "info", "--format", "{{json .Runtimes}} {{json .DefaultRuntime}}"], timeout=30)
    payload["checks"]["docker_info"] = docker_info

    host_gpu = run_command(
        [
            "bash",
            "-lc",
            (
                "if [ -x /usr/lib/wsl/lib/nvidia-smi ]; then "
                "/usr/lib/wsl/lib/nvidia-smi >/tmp/host-nvidia-smi.out && "
                "echo host_nvidia_smi_ok && cat /tmp/host-nvidia-smi.out | sed -n '1,12p'; "
                "else echo host_nvidia_smi_missing; exit 1; fi"
            ),
        ],
        timeout=30,
    )
    payload["checks"]["host_gpu"] = host_gpu

    if not args.skip_container_gpu_probe:
        container_gpu = run_command(
            [
                "docker",
                "run",
                "--rm",
                "--entrypoint",
                "bash",
                "--device=/dev/dxg",
                "--security-opt",
                "apparmor=unconfined",
                "-v",
                "/usr/lib/wsl:/usr/lib/wsl:ro",
                "-e",
                "LD_LIBRARY_PATH=/usr/lib/wsl/lib",
                "vllm/vllm-openai:v0.21.0",
                "-lc",
                (
                    "/usr/lib/wsl/lib/nvidia-smi || true; "
                    "python3 - <<'PY'\n"
                    "import torch\n"
                    "print('cuda_available', torch.cuda.is_available())\n"
                    "print('cuda_device_count', torch.cuda.device_count())\n"
                    "if torch.cuda.is_available(): print('cuda_device_name', torch.cuda.get_device_name(0))\n"
                    "PY"
                ),
            ],
            timeout=args.container_gpu_probe_timeout_seconds,
        )
        container_gpu["grade"] = grade_cuda_probe(container_gpu.get("stdout", ""), container_gpu.get("stderr", ""))
        payload["checks"]["container_gpu_probe"] = container_gpu

    compose_config = run_command(
        ["docker", "compose", "--profile", "langgraph-chatbot", "config"],
        timeout=60,
    )
    payload["checks"]["compose_config"] = compose_config
    if compose_config["returncode"] != 0:
        payload["status"] = "compose_config_failed"
        return payload

    compose_up_args = ["docker", "compose", "--profile", "langgraph-chatbot", "up", "-d"]
    if args.force_recreate:
        compose_up_args.append("--force-recreate")
    compose_up_args.append("vllm")
    compose_up = run_command(compose_up_args, timeout=args.compose_timeout_seconds)
    payload["checks"]["compose_up_vllm"] = compose_up
    if compose_up["returncode"] != 0:
        payload["status"] = classify_compose_error(compose_up.get("stderr", ""))
        return payload

    inspect = run_command(
        [
            "docker",
            "inspect",
            "smile-vllm",
            "--format",
            "{{json .State}} {{json .HostConfig.DeviceRequests}} {{json .HostConfig.Runtime}}",
        ],
        timeout=30,
    )
    payload["checks"]["docker_inspect_vllm"] = inspect

    models = await poll_models(args.llm_url, args.model, timeout_seconds=args.model_timeout_seconds)
    payload["checks"]["models"] = models
    payload["status"] = "ok" if models.get("status") == "ok" else models.get("status", "model_unavailable")
    return payload


async def main() -> int:
    parser = argparse.ArgumentParser(description="Strict Docker vLLM preflight for the LangGraph booking agent.")
    parser.add_argument("--llm-url", default="http://127.0.0.1:8000/v1")
    parser.add_argument("--model", default="Qwen/Qwen3.5-4B")
    parser.add_argument("--compose-timeout-seconds", type=int, default=120)
    parser.add_argument("--container-gpu-probe-timeout-seconds", type=int, default=90)
    parser.add_argument("--model-timeout-seconds", type=int, default=180)
    parser.add_argument("--force-recreate", action="store_true")
    parser.add_argument("--skip-container-gpu-probe", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    payload = await run_preflight(args)
    text = json.dumps(payload, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text + "\n", encoding="utf-8")
    print(text)
    return 0 if payload["status"] == "ok" else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
