from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass
from typing import Any

import httpx

from .outcomes import OutcomeCode, TurnOutcome, fallback_reply
from .schemas import FlowName


RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "reply": {"type": "string", "minLength": 1, "maxLength": 1200},
        "used_fact_keys": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["reply", "used_fact_keys"],
    "additionalProperties": False,
}


@dataclass(frozen=True)
class GenerationResult:
    reply: str
    used_fallback: bool
    validation_passed: bool
    retry_count: int
    latency_ms: float
    input_tokens: int | None = None
    output_tokens: int | None = None
    llm_call_count: int = 1


class GroundedResponseGenerator:
    def __init__(self, *, llm_base_url: str, model: str, api_key: str, http_client: httpx.AsyncClient) -> None:
        self.llm_base_url = llm_base_url.rstrip("/")
        self.model = model
        self.api_key = api_key
        self._client = http_client

    async def generate(self, *, user_message: str, outcome: TurnOutcome) -> GenerationResult:
        started = time.perf_counter()
        structured_reply = self._structured_ui_reply(outcome)
        if structured_reply:
            return GenerationResult(
                reply=structured_reply,
                used_fallback=False,
                validation_passed=True,
                retry_count=0,
                latency_ms=round((time.perf_counter() - started) * 1000, 2),
                llm_call_count=0,
            )
        validation_feedback: str | None = None
        for attempt in range(1):
            try:
                payload = self._payload(user_message, outcome, validation_feedback)
                response = await self._client.post(
                    f"{self.llm_base_url}/responses",
                    headers={"authorization": f"Bearer {self.api_key}"},
                    json=payload,
                )
                response.raise_for_status()
                body = response.json()
                generated = json.loads(self._extract_response_text(body))
                validation_feedback = self._validate(generated, outcome)
                if validation_feedback is None:
                    usage = body.get("usage") or {}
                    return GenerationResult(
                        reply=generated["reply"].strip(),
                        used_fallback=False,
                        validation_passed=True,
                        retry_count=attempt,
                        latency_ms=round((time.perf_counter() - started) * 1000, 2),
                        input_tokens=usage.get("input_tokens"),
                        output_tokens=usage.get("output_tokens"),
                    )
            except (httpx.HTTPError, KeyError, TypeError, ValueError, json.JSONDecodeError):
                validation_feedback = "The previous response was unavailable or did not match the required schema."
        return GenerationResult(
            reply=fallback_reply(outcome),
            used_fallback=True,
            validation_passed=False,
            retry_count=0,
            latency_ms=round((time.perf_counter() - started) * 1000, 2),
        )

    @staticmethod
    def _structured_ui_reply(outcome: TurnOutcome) -> str | None:
        if outcome.flow == FlowName.CANCEL and outcome.confirmation_required:
            appointment_code = outcome.safe_facts.get("appointment_code")
            if isinstance(appointment_code, str) and appointment_code:
                return f"Please confirm that you want to cancel appointment {appointment_code}."

        appointments = outcome.safe_facts.get("appointments")
        if isinstance(appointments, list) and appointments:
            return "Choose an appointment below to reschedule or cancel."

        booking_options = outcome.safe_facts.get("booking_options")
        if isinstance(booking_options, list) and len(booking_options) > 1:
            if outcome.safe_facts.get("booking_option_selected") is True:
                return "Please confirm the selected slot below."
            return "Choose an available slot below."

        return None

    @classmethod
    def validate_direct_response(cls, reply: str, outcome: TurnOutcome) -> bool:
        return cls._validate({"reply": reply, "used_fact_keys": []}, outcome) is None

    def _payload(self, user_message: str, outcome: TurnOutcome, feedback: str | None) -> dict[str, Any]:
        instructions = (
            "You are SMILE clinic's English-only scheduling assistant. "
            "Write the final patient-facing response for the current turn. "
            "Be warm, calm, concise, and operational; sound like a clinic assistant, not a generic chatbot. "
            "Use only facts in the supplied outcome. "
            "Never invent appointment identifiers, dates, doctors, clinics, prices, or successful actions. "
            "Never claim a mutation succeeded unless outcome code is mutation_succeeded. "
            "If the outcome includes several appointments, options, or constraints, format them as short bullets. "
            "If the outcome is simple, use one or two short sentences. "
            "When confirmation_required is true, clearly ask for confirmation. "
            "When outcome code is auth_required, tell the user to sign in and do not request identity details. "
            "For conversational input, answer directly and avoid repeating a capability list unless the user asks. "
            "For out-of-scope input, briefly redirect to SMILE clinic scheduling or clinic staff. "
            "The scheduling scope is appointment lookup, booking, cancellation, and rescheduling. "
            "Do not claim support for treatment advice, diagnosis, insurance, billing, reminders, or medical questions."
        )
        if any(key in outcome.safe_facts for key in ("booking_options", "appointments")):
            instructions += (
                " Structured UI will render the available options or appointments. "
                "Do not list every option in the text; write one concise instruction sentence instead."
            )
        if feedback:
            instructions += f" Correct this validation issue: {feedback}"
        return {
            "model": self.model,
            "instructions": instructions,
            "input": json.dumps({"user_message": user_message, "outcome": outcome.model_dump(mode="json")}),
            "text": {"format": {"type": "json_schema", "name": "grounded_response", "strict": True, "schema": RESPONSE_SCHEMA}},
        }

    @staticmethod
    def _validate(generated: dict[str, Any], outcome: TurnOutcome) -> str | None:
        reply = generated.get("reply")
        used_keys = generated.get("used_fact_keys")
        if not isinstance(reply, str) or not reply.strip() or not isinstance(used_keys, list):
            return "Return a non-empty reply and used_fact_keys array."
        if any(not isinstance(key, str) or key not in outcome.safe_facts for key in used_keys):
            return "used_fact_keys contains a key absent from safe_facts."
        allowed_ids = set(re.findall(r"\bAPT-[A-Z0-9-]+\b", json.dumps(outcome.safe_facts), re.I))
        generated_ids = set(re.findall(r"\bAPT-[A-Z0-9-]+\b", reply, re.I))
        if not generated_ids.issubset(allowed_ids):
            return "The reply contains an unsupported appointment identifier."
        success_terms = ("has been booked", "has been cancelled", "has been rescheduled", "completed successfully")
        if outcome.code != OutcomeCode.MUTATION_SUCCEEDED and any(term in reply.lower() for term in success_terms):
            return "The reply claims a mutation succeeded without a success outcome."
        if outcome.confirmation_required and "confirm" not in reply.lower():
            return "The reply must explicitly request confirmation."
        if outcome.code == OutcomeCode.AUTH_REQUIRED and "sign in" not in reply.lower():
            return "The reply must tell the user to sign in and must not request identity details."
        if outcome.code in {OutcomeCode.CONVERSATIONAL, OutcomeCode.OUT_OF_SCOPE}:
            unsupported_scope = ("treatment", "diagnosis", "insurance", "billing", "reminder", "medical advice")
            if any(term in reply.lower() for term in unsupported_scope):
                return "The reply claims a capability outside appointment scheduling."
            canned_lists = (
                "i can help you find, book, cancel, or reschedule",
                "i can help you look up, book, cancel, or reschedule",
                "i can help with appointment lookup, booking, cancellation, and rescheduling",
                "i can assist with dental appointment booking, lookup, cancellation, and rescheduling",
                "i am here to assist you with booking, rescheduling, canceling, or looking up",
                "i am here to assist you with booking, rescheduling, cancelling, or looking up",
                "i'm here to assist you with dental appointment scheduling",
                "i am here to assist you with dental appointment scheduling",
                "i am here to assist you with booking, cancelling, rescheduling",
                "i am here to help you with dental appointment scheduling",
                "i'm here to help with dental appointment scheduling",
                "here to help you with booking, cancelling, rescheduling",
            )
            if any(term in reply.lower() for term in canned_lists):
                return "Avoid repetitive generic capability lists for conversational turns."
        return None

    @staticmethod
    def _extract_response_text(payload: dict[str, Any]) -> str:
        if isinstance(payload.get("output_text"), str):
            return payload["output_text"]
        for output in payload.get("output", []):
            content = output.get("content")
            if isinstance(content, list):
                for item in content:
                    if item.get("type") == "output_text":
                        return str(item["text"])
            if isinstance(content, dict) and content.get("type") == "output_text":
                return str(content["text"])
        raise KeyError("output_text")
