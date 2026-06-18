"""SlotExtractor: phase 1 of the two-phase booking pipeline."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

import httpx

from .config import Settings


SLOT_OUTPUT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "intent": {
            "type": "string",
            "enum": ["book", "cancel", "reschedule", "lookup", "info", "reminder", "unknown"],
        },
        "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0},
        "specialty": {"type": ["string", "null"]},
        "doctor_hint": {"type": ["string", "null"]},
        "clinic_hint": {"type": ["string", "null"]},
        "date_hint": {"type": ["string", "null"]},
        "time_hint": {"type": ["string", "null"]},
        "appointment_ref": {"type": ["string", "null"]},
        "missing_slots": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["intent", "confidence", "missing_slots"],
    "additionalProperties": False,
}


@dataclass
class ExtractedSlots:
    intent: str
    confidence: float
    specialty: str | None = None
    doctor_hint: str | None = None
    clinic_hint: str | None = None
    date_hint: str | None = None
    time_hint: str | None = None
    appointment_ref: str | None = None
    missing_slots: list[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ExtractedSlots":
        return cls(
            intent=data.get("intent", "unknown"),
            confidence=float(data.get("confidence", 0.0)),
            specialty=data.get("specialty"),
            doctor_hint=data.get("doctor_hint"),
            clinic_hint=data.get("clinic_hint"),
            date_hint=data.get("date_hint"),
            time_hint=data.get("time_hint"),
            appointment_ref=data.get("appointment_ref"),
            missing_slots=list(data.get("missing_slots") or []),
        )

    @property
    def is_actionable(self) -> bool:
        return self.confidence >= 0.7 and self.intent != "unknown"

    @property
    def needs_clarification(self) -> bool:
        return self.confidence < 0.4 or self.intent == "unknown"


class SlotExtractor:
    """One LLM call that extracts intent and slots without tool access."""

    def __init__(
        self,
        settings: Settings,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self.settings = settings
        self._client = http_client or httpx.AsyncClient(
            timeout=settings.request_timeout_seconds
        )

    async def extract(
        self,
        message: str,
        recent_turns: list[dict[str, str]],
        current_date_iso: str,
    ) -> ExtractedSlots:
        system_prompt = (
            "You are an intent and slot extraction module for a dental clinic booking system. "
            "Extract the patient's intent and booking details from their message. "
            "Return only JSON matching the schema. Do not guess patient_id, appointment_id, or UUIDs.\n\n"
            f"Today's date: {current_date_iso}\n\n"
            "intent='book' to book a new appointment; intent='cancel' to cancel an appointment; "
            "intent='reschedule' to reschedule an existing appointment; intent='lookup' to view appointments; "
            "intent='info' for general clinic information; intent='reminder' to set an appointment reminder."
        )
        messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
        messages.extend(recent_turns[-6:])
        messages.append({"role": "user", "content": message})
        payload: dict[str, Any] = {
            "model": self.settings.llm_model,
            "temperature": 0,
            "chat_template_kwargs": {"enable_thinking": True},
            "messages": messages,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "slot_extraction",
                    "schema": SLOT_OUTPUT_SCHEMA,
                    "strict": True,
                },
            },
        }
        response = await self._client.post(
            f"{self.settings.llm_base_url.rstrip('/')}/chat/completions",
            json=payload,
        )
        response.raise_for_status()
        try:
            content = response.json()["choices"][0]["message"]["content"]
            data = json.loads(content)
        except (KeyError, TypeError, json.JSONDecodeError):
            return ExtractedSlots(intent="unknown", confidence=0.0)
        return ExtractedSlots.from_dict(data)
