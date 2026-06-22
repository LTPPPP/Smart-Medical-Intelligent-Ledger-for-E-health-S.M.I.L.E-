from __future__ import annotations

import json
from typing import Any

import httpx

from .schemas import AgentCommand, FlowName, SlotUpdate, _looks_vietnamese


COMMAND_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "intent": {"type": "string", "enum": ["lookup", "booking", "cancel", "reschedule", "info", "unknown"]},
        "dialogue_act": {
            "type": ["string", "null"],
            "enum": ["correct", "abort", "switch", None],
        },
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
    "required": [
        "intent",
        "dialogue_act",
        "confidence",
        "appointment_ref",
        "clinic_hint",
        "service_hint",
        "specialty_hint",
        "doctor_hint",
        "date_hint",
        "time_hint",
        "missing_slots",
    ],
    "additionalProperties": False,
}


class OpenAICommandExtractor:
    def __init__(
        self,
        *,
        llm_base_url: str,
        model: str,
        api_key: str,
        http_client: httpx.AsyncClient | None = None,
        timeout_seconds: float = 8.0,
    ) -> None:
        self.llm_base_url = llm_base_url.rstrip("/")
        self.model = model
        self.api_key = api_key
        self._client = http_client or httpx.AsyncClient(timeout=timeout_seconds)
        self.last_error: str | None = None

    async def extract(self, message: str) -> AgentCommand:
        self.last_error = None
        payload = {
            "model": self.model,
            "instructions": (
                "You are an intent and slot extraction module for an English and Vietnamese dental clinic booking assistant. "
                "Return only JSON matching the schema. Do not choose tools. Do not guess patient_id, "
                "appointment_id, UUIDs, or backend identifiers. Do not translate appointment codes, doctor names, "
                "clinic names, or backend identifiers; copy them exactly when present. Use correct for replacing details of an "
                "active request, abort for stopping it without changes, and switch for starting a different intent."
            ),
            "input": message,
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "booking_command",
                    "strict": True,
                    "schema": COMMAND_SCHEMA,
                }
            },
        }
        try:
            response = await self._client.post(
                f"{self.llm_base_url}/responses",
                headers={"authorization": f"Bearer {self.api_key}"},
                json=payload,
            )
            response.raise_for_status()
            content = self._extract_response_text(response.json())
            data = json.loads(content)
            command = self._command_from_payload(data, message)
            return self._apply_high_precision_intent_guard(command, message)
        except httpx.HTTPError as exc:
            self.last_error = type(exc).__name__
            return self._unknown()
        except (KeyError, TypeError, json.JSONDecodeError, ValueError):
            self.last_error = "parse_error"
            return self._unknown()

    @staticmethod
    def _unknown() -> AgentCommand:
        return AgentCommand(intent=FlowName.UNKNOWN, confidence=0.0, missing_slots=["extractor_unavailable"])

    @staticmethod
    def _extract_response_text(payload: dict[str, Any]) -> str:
        output_text = payload.get("output_text")
        if isinstance(output_text, str):
            return output_text
        for output in payload.get("output", []):
            content = output.get("content")
            if isinstance(content, dict) and content.get("type") == "output_text":
                return str(content["text"])
            if isinstance(content, list):
                for item in content:
                    if item.get("type") == "output_text":
                        return str(item["text"])
        raise KeyError("output_text")

    @staticmethod
    def _command_from_payload(data: dict[str, Any], original_message: str) -> AgentCommand:
        intent = FlowName(data.get("intent", FlowName.UNKNOWN))
        dialogue_act = data.get("dialogue_act")
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
            return AgentCommand.from_english_message(original_message) if (
                intent == FlowName.UNKNOWN and dialogue_act is None
            ) else AgentCommand(
                intent=intent,
                dialogue_act=dialogue_act,
                language="vi" if _looks_vietnamese(original_message) else "en",
                confidence=float(data.get("confidence", 0.0)),
                missing_slots=list(data.get("missing_slots") or []),
            )
        return AgentCommand(
            intent=intent,
            dialogue_act=dialogue_act,
            language="vi" if _looks_vietnamese(original_message) else "en",
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
                "what appointments",
                "which appointments",
                "appointments do i have",
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


StructuredCommandExtractor = OpenAICommandExtractor
