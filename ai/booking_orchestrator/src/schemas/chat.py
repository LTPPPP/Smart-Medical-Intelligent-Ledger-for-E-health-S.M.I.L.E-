from typing import Any

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=255)
    message: str = Field(min_length=1, max_length=2000)
    conversation_state: dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    session_id: str
    assistant_response: str
    selected_profile: str
    exposed_tools: list[str]
    metadata: dict[str, Any] = Field(default_factory=dict)
