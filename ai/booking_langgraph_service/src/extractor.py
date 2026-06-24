from __future__ import annotations

import json
from typing import Any

import httpx

from .schemas import AgentCommand, FlowName, SlotUpdate


COMMAND_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "intent": {"type": "string", "enum": ["lookup", "booking", "cancel", "reschedule", "conversational", "out_of_scope", "unknown"]},
        "secondary_intents": {
            "type": "array",
            "items": {"type": "string", "enum": ["lookup", "booking", "cancel", "reschedule"]},
        },
        "dialogue_act": {
            "type": ["string", "null"],
            "enum": [
                "correct",
                "abort",
                "switch",
                "request",
                "inform",
                "clarify",
                "confirm",
                "reject",
                "greet",
                "identity",
                "abuse",
                "other",
                None,
            ],
        },
        "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0},
        "appointment_ref": {"type": ["string", "null"]},
        "clinic_hint": {"type": ["string", "null"]},
        "service_hint": {"type": ["string", "null"]},
        "specialty_hint": {"type": ["string", "null"]},
        "doctor_hint": {"type": ["string", "null"]},
        "date_hint": {"type": ["string", "null"]},
        "time_hint": {"type": ["string", "null"]},
        "appointment_type": {"type": ["string", "null"]},
        "chief_complaint": {"type": ["string", "null"]},
        "notes": {"type": ["string", "null"]},
        "missing_slots": {"type": "array", "items": {"type": "string"}},
        "constraints": {"type": "array", "items": {"type": "string"}},
        "preferences": {"type": "array", "items": {"type": "string"}},
        "negations": {"type": "array", "items": {"type": "string"}},
        "direct_response": {"type": ["string", "null"]},
    },
    "required": [
        "intent",
        "secondary_intents",
        "dialogue_act",
        "confidence",
        "appointment_ref",
        "clinic_hint",
        "service_hint",
        "specialty_hint",
        "doctor_hint",
        "date_hint",
        "time_hint",
        "appointment_type",
        "chief_complaint",
        "notes",
        "missing_slots",
        "constraints",
        "preferences",
        "negations",
        "direct_response",
    ],
    "additionalProperties": False,
}


EXTRACTOR_INSTRUCTIONS = """
ROLE
You are the semantic understanding module for SMILE clinic's English-only dental scheduling assistant.
Convert the user's latest message into structured JSON. You do not choose tools, call APIs, or mutate state.

OUTPUT CONTRACT
- Return only JSON matching the provided schema.
- Use English for language and direct_response.
- Do not invent patient_id, appointment_id, UUIDs, backend identifiers, doctors, clinics, dates, or appointment codes.
- Do not translate appointment codes, doctor names, clinic names, or backend identifiers; copy exact text when present.
- Classify by meaning, not by keyword or exact phrase matching.

INTENT ROUTING
- lookup: user asks to see, list, check, or retrieve existing appointments.
- booking: user wants a new appointment or asks for availability to book.
- cancel: user wants to cancel an existing appointment.
- reschedule: user wants to move or change an existing appointment time/date.
- conversational: greetings, assistant identity, capability questions, ordinary social turns, frustration, or abuse that can be redirected to scheduling.
- out_of_scope: requests unrelated to dental appointment scheduling.
- unknown: unclear messages that cannot safely be routed.
- Put additional transactional intents in secondary_intents instead of executing multiple flows in one turn.

DIALOGUE ACTS
- request: user asks for an action or information.
- inform: user provides details.
- clarify: user asks or answers a clarification.
- correct: user replaces details of the active request.
- abort: user stops the active request without changes.
- switch: user starts a different intent than the active request.
- confirm: user clearly approves a pending confirmation.
- reject: user declines a pending confirmation.
- greet: greeting or polite opener.
- identity: user asks who/what the assistant is.
- abuse: profanity, insults, or hostile language directed at the assistant.
- other: social or conversational turns not covered above.

SLOT EXTRACTION
- appointment_ref: explicit appointment code/reference from the user.
- clinic_hint, doctor_hint, service_hint, specialty_hint: user-provided names or descriptions only.
- appointment_type, chief_complaint, notes: copy only details explicitly supplied by the user for a new booking.
- date_hint and time_hint: preserve the user's stated natural-language or ISO date/time.
- missing_slots: fields still needed for the identified transactional intent.
- constraints: hard requirements such as "before 16:00", "only downtown", or "not with X".
- preferences: soft preferences such as "prefer morning" or "if possible".
- negations: explicit exclusions, refusals, or "do not" conditions.

DIRECT RESPONSE POLICY
- direct_response must be null for transactional turns: lookup, booking, cancel, reschedule, and unknown.
- For conversational or out_of_scope turns, direct_response should be one concise patient-facing sentence.
- For identity questions, say you are SMILE's scheduling assistant.
- For capability questions, mention only appointment lookup, booking, cancellation, and rescheduling.
- For social turns, acknowledge briefly and return to appointment context without a generic capability list.
- For abuse, set a calm boundary and offer to continue with the appointment; do not scold.
- For out_of_scope requests, briefly redirect to SMILE scheduling or clinic staff.

AMBIGUITY AND SAFETY
- Prefer missing_slots over guessing.
- Preserve hard constraints, preferences, and negations separately.
- Do not request sensitive identity details in direct_response.
- Do not claim support for treatment advice, diagnosis, billing, insurance, reminders, or medical questions.
- Do not claim an appointment was booked, cancelled, or rescheduled.
""".strip()


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
            "instructions": EXTRACTOR_INSTRUCTIONS,
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
            return self._command_from_payload(data, message)
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
        secondary_intents = [FlowName(value) for value in data.get("secondary_intents") or []]
        dialogue_act = data.get("dialogue_act")
        slot_updates: list[SlotUpdate] = []
        selected_reference = data.get("appointment_ref")
        if selected_reference:
            slot_updates.append(
                SlotUpdate(name="appointment_ref", value=selected_reference, confidence=data.get("confidence", 0.0))
            )
        for key in (
            "clinic_hint",
            "service_hint",
            "specialty_hint",
            "doctor_hint",
            "date_hint",
            "time_hint",
            "appointment_type",
            "chief_complaint",
            "notes",
        ):
            value = data.get(key)
            if value:
                slot_updates.append(SlotUpdate(name=key, value=value, confidence=data.get("confidence", 0.0)))
        fallback = AgentCommand.from_english_message(original_message)
        if intent in {FlowName.BOOKING, FlowName.UNKNOWN} or fallback.intent == intent:
            existing = {update.name for update in slot_updates}
            for update in fallback.slot_updates:
                if update.name not in existing:
                    slot_updates.append(update)
                    existing.add(update.name)
        if not slot_updates:
            return AgentCommand(
                intent=intent,
                secondary_intents=secondary_intents,
                dialogue_act=dialogue_act,
                language="en",
                confidence=float(data.get("confidence", 0.0)),
                missing_slots=list(data.get("missing_slots") or []),
                constraints=list(data.get("constraints") or []),
                preferences=list(data.get("preferences") or []),
                negations=list(data.get("negations") or []),
                direct_response=data.get("direct_response"),
            )
        return AgentCommand(
            intent=intent,
            secondary_intents=secondary_intents,
            dialogue_act=dialogue_act,
            language="en",
            slot_updates=slot_updates,
            selected_reference=selected_reference,
            confidence=float(data.get("confidence", 0.0)),
            missing_slots=list(data.get("missing_slots") or []),
            constraints=list(data.get("constraints") or []),
            preferences=list(data.get("preferences") or []),
            negations=list(data.get("negations") or []),
            direct_response=data.get("direct_response"),
        )

StructuredCommandExtractor = OpenAICommandExtractor
