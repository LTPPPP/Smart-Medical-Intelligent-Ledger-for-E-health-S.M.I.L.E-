from __future__ import annotations

import os

import httpx
from pydantic import BaseModel, Field, model_validator

from .extractor import OpenAICommandExtractor
from .http_tools import HttpDomainTools
from .response_generator import GroundedResponseGenerator


class Settings(BaseModel):
    emr_base_url: str = "http://127.0.0.1:8082"
    iam_base_url: str | None = None
    llm_provider: str = "openai"
    llm_base_url: str = "https://api.openai.com/v1"
    llm_model: str = "gpt-5-mini"
    extractor_model: str = "gpt-4.1-mini"
    response_model: str = "gpt-5-mini"
    llm_api_key: str = ""
    actor_id: str = "00000000-0000-4000-8000-000000000000"
    request_timeout_seconds: float = 20.0
    confirmation_ttl_seconds: float = Field(default=900.0, gt=0)
    conversation_ttl_seconds: float = Field(default=14_400.0, gt=0)
    redis_url: str = "redis://localhost:6379/2"
    worker_count: int = Field(default=1, ge=1)
    response_generation_enabled: bool = True

    @model_validator(mode="after")
    def validate_confirmation_store_scope(self) -> "Settings":
        if self.worker_count != 1 and not self.redis_url:
            raise ValueError("multiple workers require BOOKING_LANGGRAPH_REDIS_URL")
        return self

    @classmethod
    def from_env(cls) -> "Settings":
        legacy_model = os.getenv("BOOKING_LANGGRAPH_LLM_MODEL", cls.model_fields["llm_model"].default)
        return cls(
            emr_base_url=os.getenv("BOOKING_LANGGRAPH_EMR_BASE_URL", cls.model_fields["emr_base_url"].default),
            iam_base_url=os.getenv("BOOKING_LANGGRAPH_IAM_BASE_URL"),
            llm_provider=os.getenv("BOOKING_LANGGRAPH_LLM_PROVIDER", cls.model_fields["llm_provider"].default),
            llm_base_url=os.getenv("BOOKING_LANGGRAPH_LLM_BASE_URL", cls.model_fields["llm_base_url"].default),
            llm_model=legacy_model,
            extractor_model=os.getenv(
                "BOOKING_LANGGRAPH_EXTRACTOR_MODEL",
                cls.model_fields["extractor_model"].default,
            ),
            response_model=os.getenv("BOOKING_LANGGRAPH_RESPONSE_MODEL", legacy_model),
            llm_api_key=os.getenv(
                "BOOKING_LANGGRAPH_LLM_API_KEY",
                os.getenv("OPENAI_API_KEY", cls.model_fields["llm_api_key"].default),
            ),
            actor_id=os.getenv("BOOKING_LANGGRAPH_ACTOR_ID", cls.model_fields["actor_id"].default),
            request_timeout_seconds=float(
                os.getenv(
                    "BOOKING_LANGGRAPH_REQUEST_TIMEOUT_SECONDS",
                    str(cls.model_fields["request_timeout_seconds"].default),
                )
            ),
            confirmation_ttl_seconds=float(
                os.getenv(
                    "BOOKING_LANGGRAPH_CONFIRMATION_TTL_SECONDS",
                    str(cls.model_fields["confirmation_ttl_seconds"].default),
                )
            ),
            conversation_ttl_seconds=float(
                os.getenv(
                    "BOOKING_LANGGRAPH_CONVERSATION_TTL_SECONDS",
                    str(cls.model_fields["conversation_ttl_seconds"].default),
                )
            ),
            redis_url=os.getenv("BOOKING_LANGGRAPH_REDIS_URL", cls.model_fields["redis_url"].default),
            worker_count=int(
                os.getenv(
                    "BOOKING_LANGGRAPH_WORKER_COUNT",
                    str(cls.model_fields["worker_count"].default),
                )
            ),
            response_generation_enabled=os.getenv("BOOKING_LANGGRAPH_RESPONSE_GENERATION_ENABLED", "true").lower()
            in {"1", "true", "yes", "on"},
        )


def build_domain_tools(settings: Settings, http_client: httpx.AsyncClient | None = None) -> HttpDomainTools:
    return HttpDomainTools(
        emr_base_url=settings.emr_base_url,
        iam_base_url=settings.iam_base_url,
        actor_id=settings.actor_id,
        timeout_seconds=settings.request_timeout_seconds,
        http_client=http_client,
    )


def build_extractor(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> OpenAICommandExtractor | None:
    if not settings.llm_api_key:
        return None
    return OpenAICommandExtractor(
        llm_base_url=settings.llm_base_url,
        model=settings.extractor_model,
        api_key=settings.llm_api_key,
        timeout_seconds=settings.request_timeout_seconds,
        http_client=http_client,
    )


def build_response_generator(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> GroundedResponseGenerator | None:
    if not settings.llm_api_key or not settings.response_generation_enabled:
        return None
    return GroundedResponseGenerator(
        llm_base_url=settings.llm_base_url,
        model=settings.response_model,
        api_key=settings.llm_api_key,
        http_client=http_client or httpx.AsyncClient(timeout=settings.request_timeout_seconds),
    )
