"""Chat SSE endpoint."""

from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Header, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ...shared.auth_context import resolve_actor
from .graph import stream_chat_turn
from .state import BookingSlotState

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    state: BookingSlotState = BookingSlotState()
    # UI-resolved id hints
    action: str | None = None
    appointment_ref: str | None = None
    selected_doctor_id: str | None = None
    selected_clinic_id: str | None = None
    selected_booking_option_id: str | None = None


def _infer_flow(state: BookingSlotState, captured: dict[str, Any]) -> str:
    if "appointments" in captured:
        return "cancel"
    if "booking_options" in captured or state.intent_type is not None:
        return "booking"
    return "conversational"


def _sse(payload: dict[str, Any]) -> str:
    return f"data: {json.dumps(payload)}\n\n"


@router.post("")
async def chat(payload: ChatRequest, authorization: str | None = Header(default=None)) -> StreamingResponse:
    try:
        actor = await resolve_actor(authorization)
    except Exception as exc:  # invalid/expired token
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session") from exc

    hints = {
        "action": payload.action,
        "appointment_ref": payload.appointment_ref,
        "selected_doctor_id": payload.selected_doctor_id,
        "selected_clinic_id": payload.selected_clinic_id,
        "selected_booking_option_id": payload.selected_booking_option_id,
    }

    async def event_stream() -> Any:
        async for event in stream_chat_turn(
            message=payload.message, state=payload.state, actor=actor, hints=hints
        ):
            if event["type"] == "token":
                yield _sse({"type": "token", "text": event["text"]})
                continue

            new_state: BookingSlotState = event["state"]
            captured: dict[str, Any] = event["captured"]
            if "appointments" in captured:
                captured["appointment_selection_action"] = "cancel"
            yield _sse(
                {
                    "type": "final",
                    "reply": event["reply"],
                    "state": new_state.model_dump(),
                    "safe_state": captured,
                    "flow": _infer_flow(new_state, captured),
                }
            )

    return StreamingResponse(event_stream(), media_type="text/event-stream")
