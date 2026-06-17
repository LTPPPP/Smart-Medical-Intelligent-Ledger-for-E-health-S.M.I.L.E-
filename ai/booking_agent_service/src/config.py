from __future__ import annotations

import os
import shutil
import subprocess
from dataclasses import dataclass


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def cuda_available() -> bool:
    visible_devices = os.getenv("NVIDIA_VISIBLE_DEVICES", "").strip().lower()
    if visible_devices and visible_devices not in {"none", "void", "no", "0"}:
        return True
    if shutil.which("nvidia-smi"):
        try:
            subprocess.run(
                ["nvidia-smi", "-L"],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=2,
            )
            return True
        except Exception:
            pass
    try:
        import torch

        return bool(torch.cuda.is_available())
    except Exception:
        return False


@dataclass(frozen=True)
class Settings:
    emr_base_url: str = "http://clinical-emr-service:8082"
    redis_url: str = "redis://redis:6379/2"
    require_cuda: bool = True
    step_budget: int = 3
    session_lock_ttl_seconds: int = 8
    session_ttl_seconds: int = 3600
    pending_confirmation_ttl_seconds: int = 120
    schedule_candidate_ttl_seconds: int = 90
    appointment_candidate_ttl_seconds: int = 600
    catalog_candidate_ttl_seconds: int = 600
    llm_base_url: str = "http://vllm:8000/v1"
    llm_model: str = "Qwen/Qwen3.5-4B"
    request_timeout_seconds: float = 30.0

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            emr_base_url=os.getenv("BOOKING_AGENT_EMR_BASE_URL", cls.emr_base_url),
            redis_url=os.getenv("BOOKING_AGENT_REDIS_URL", cls.redis_url),
            require_cuda=_env_bool("BOOKING_AGENT_REQUIRE_CUDA", cls.require_cuda),
            step_budget=int(os.getenv("BOOKING_AGENT_STEP_BUDGET", str(cls.step_budget))),
            session_lock_ttl_seconds=int(
                os.getenv(
                    "BOOKING_AGENT_SESSION_LOCK_TTL_SECONDS",
                    str(cls.session_lock_ttl_seconds),
                )
            ),
            session_ttl_seconds=int(
                os.getenv("BOOKING_AGENT_SESSION_TTL_SECONDS", str(cls.session_ttl_seconds))
            ),
            pending_confirmation_ttl_seconds=int(
                os.getenv(
                    "BOOKING_AGENT_PENDING_CONFIRMATION_TTL_SECONDS",
                    str(cls.pending_confirmation_ttl_seconds),
                )
            ),
            schedule_candidate_ttl_seconds=int(
                os.getenv(
                    "BOOKING_AGENT_SCHEDULE_CANDIDATE_TTL_SECONDS",
                    str(cls.schedule_candidate_ttl_seconds),
                )
            ),
            appointment_candidate_ttl_seconds=int(
                os.getenv(
                    "BOOKING_AGENT_APPOINTMENT_CANDIDATE_TTL_SECONDS",
                    str(cls.appointment_candidate_ttl_seconds),
                )
            ),
            catalog_candidate_ttl_seconds=int(
                os.getenv(
                    "BOOKING_AGENT_CATALOG_CANDIDATE_TTL_SECONDS",
                    str(cls.catalog_candidate_ttl_seconds),
                )
            ),
            llm_base_url=os.getenv("BOOKING_AGENT_LLM_BASE_URL", cls.llm_base_url),
            llm_model=os.getenv("BOOKING_AGENT_LLM_MODEL", cls.llm_model),
            request_timeout_seconds=float(
                os.getenv(
                    "BOOKING_AGENT_REQUEST_TIMEOUT_SECONDS",
                    str(cls.request_timeout_seconds),
                )
            ),
        )

    def validate_runtime(self) -> None:
        if self.require_cuda and not cuda_available():
            raise RuntimeError("CUDA runtime is required for booking agent inference.")
