from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    session_id: str = Field(min_length=1)
    message: str = Field(min_length=1)


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    retryable: bool = False
    error_code: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    error_code: str
    message: str
    retryable: bool = False
