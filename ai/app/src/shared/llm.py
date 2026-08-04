"""Chat and judge LLM clients."""

from __future__ import annotations

from functools import lru_cache

from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_openai import ChatOpenAI

from ..config import get_settings


@lru_cache
def get_chat_model() -> ChatOpenAI:
    settings = get_settings()
    return ChatOpenAI(
        model=settings.openai_chat_model,
        api_key=settings.openai_api_key,
        streaming=True,
    )


@lru_cache
def get_judge_model() -> ChatNVIDIA:
    settings = get_settings()
    return ChatNVIDIA(
        model=settings.llm_model,
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
        temperature=0,
    )
