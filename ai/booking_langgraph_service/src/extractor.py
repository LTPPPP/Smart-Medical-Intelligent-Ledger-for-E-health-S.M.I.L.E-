from __future__ import annotations

import json
from typing import Any

import httpx

from .schemas import AgentCommand, FlowName, SlotUpdate


COMMAND_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "intent": {"type": "string", "enum": ["lookup", "booking", "cancel", "reschedule", "info", "unknown"]},
        "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0},
        "appointment_ref": {"type": ["string", "null"]},
        "clinic_hint": {"type": ["string", "null"]},
        "service_hint": {"type": ["string", "null"]},
        "specialty_hint": {"type": ["string", "null"]},
        "doctor_hint": {"type": ["string", "null"]},
        "date_hint": {"type": ["string", "null"]},
        "time_hint": {"type": ["string", "null"]},
        "missing_slots": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["intent", "confidence", "missing_slots"],
    "additionalProperties": False,
}


class StructuredCommandExtractor:
    def __init__(
        self,
        *,
        llm_base_url: str,
        model: str,
        http_client: httpx.AsyncClient | None = None,
        timeout_seconds: float = 8.0,
        allow_deterministic_fallback: bool = False,
    ) -> None:
        self.llm_base_url = llm_base_url.rstrip("/")
        self.model = model
        self._client = http_client or httpx.AsyncClient(timeout=timeout_seconds)
        self.allow_deterministic_fallback = allow_deterministic_fallback
        self.last_error: str | None = None

    async def extract(self, message: str) -> AgentCommand:
        self.last_error = None
        payload = {
            "model": self.model,
            "temperature": 0,
            "chat_template_kwargs": {"enable_thinking": False},
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an intent and slot extraction module for an English dental clinic "
                        "booking assistant. Return only JSON matching the schema. Do not choose tools. "
                        "Do not guess patient_id, appointment_id, UUIDs, or backend identifiers."
                    ),
                },
                {"role": "user", "content": message},
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {"name": "booking_agent_command", "schema": COMMAND_SCHEMA, "strict": True},
            },
        }
        try:
            response = await self._client.post(f"{self.llm_base_url}/chat/completions", json=payload)
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            data = json.loads(content)
            command = self._command_from_payload(data, message)
            return self._apply_high_precision_intent_guard(command, message)
        except httpx.HTTPError as exc:
            self.last_error = type(exc).__name__
            return self._fallback_or_unknown(message)
        except (KeyError, TypeError, json.JSONDecodeError, ValueError):
            self.last_error = "parse_error"
            return self._fallback_or_unknown(message)

    def _fallback_or_unknown(self, message: str) -> AgentCommand:
        if self.allow_deterministic_fallback:
            return AgentCommand.from_english_message(message)
        return AgentCommand(intent=FlowName.UNKNOWN, confidence=0.0, missing_slots=["extractor_unavailable"])

    @staticmethod
    def _command_from_payload(data: dict[str, Any], original_message: str) -> AgentCommand:
        intent = FlowName(data.get("intent", FlowName.UNKNOWN))
        slot_updates: list[SlotUpdate] = []
        selected_reference = data.get("appointment_ref")
        if selected_reference:
            slot_updates.append(
                SlotUpdate(name="appointment_ref", value=selected_reference, confidence=data.get("confidence", 0.0))
            )
        for key in ("clinic_hint", "service_hint", "specialty_hint", "doctor_hint", "date_hint", "time_hint"):
            value = data.get(key)
            if value:
                slot_updates.append(SlotUpdate(name=key, value=value, confidence=data.get("confidence", 0.0)))
        if not slot_updates:
            return AgentCommand.from_english_message(original_message) if intent == FlowName.UNKNOWN else AgentCommand(
                intent=intent,
                confidence=float(data.get("confidence", 0.0)),
                missing_slots=list(data.get("missing_slots") or []),
            )
        return AgentCommand(
            intent=intent,
            language="en",
            slot_updates=slot_updates,
            selected_reference=selected_reference,
            confidence=float(data.get("confidence", 0.0)),
            missing_slots=list(data.get("missing_slots") or []),
        )

    @staticmethod
    def _apply_high_precision_intent_guard(command: AgentCommand, message: str) -> AgentCommand:
        text = message.lower()
        has_lookup = any(
            phrase in text
            for phrase in (
                "show my appointments",
                "show my upcoming appointments",
                "list my appointments",
                "list my upcoming appointments",
                "view my appointments",
                "view my upcoming appointments",
                "see my appointments",
                "see my upcoming appointments",
                "my upcoming appointments",
            )
        )
        has_mutation = any(
            term in text
            for term in (
                "book",
                "schedule",
                "make an appointment",
                "cancel",
                "reschedule",
                "move",
                "change my appointment",
            )
        )
        if has_lookup and not has_mutation and command.intent != FlowName.LOOKUP:
            return AgentCommand(intent=FlowName.LOOKUP, confidence=1.0)
        return command
