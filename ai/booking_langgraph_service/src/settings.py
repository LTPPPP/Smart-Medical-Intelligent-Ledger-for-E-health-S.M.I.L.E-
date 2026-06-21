from __future__ import annotations

import os

import httpx
from pydantic import BaseModel

from .extractor import StructuredCommandExtractor
from .http_tools import HttpDomainTools


class Settings(BaseModel):
    emr_base_url: str = "http://127.0.0.1:8082"
    llm_base_url: str = ""
    llm_model: str = "Qwen/Qwen3.5-4B"
    actor_id: str = "00000000-0000-4000-8000-000000000000"
    request_timeout_seconds: float = 8.0

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            emr_base_url=os.getenv("BOOKING_LANGGRAPH_EMR_BASE_URL", cls.model_fields["emr_base_url"].default),
            llm_base_url=os.getenv("BOOKING_LANGGRAPH_LLM_BASE_URL", cls.model_fields["llm_base_url"].default),
            llm_model=os.getenv("BOOKING_LANGGRAPH_LLM_MODEL", cls.model_fields["llm_model"].default),
            actor_id=os.getenv("BOOKING_LANGGRAPH_ACTOR_ID", cls.model_fields["actor_id"].default),
            request_timeout_seconds=float(
                os.getenv(
                    "BOOKING_LANGGRAPH_REQUEST_TIMEOUT_SECONDS",
                    str(cls.model_fields["request_timeout_seconds"].default),
                )
            ),
        )


def build_domain_tools(settings: Settings, http_client: httpx.AsyncClient | None = None) -> HttpDomainTools:
    return HttpDomainTools(
        emr_base_url=settings.emr_base_url,
        actor_id=settings.actor_id,
        timeout_seconds=settings.request_timeout_seconds,
        http_client=http_client,
    )


def build_extractor(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> StructuredCommandExtractor | None:
    if not settings.llm_base_url:
        return None
    return StructuredCommandExtractor(
        llm_base_url=settings.llm_base_url,
        model=settings.llm_model,
        timeout_seconds=settings.request_timeout_seconds,
        http_client=http_client,
    )
