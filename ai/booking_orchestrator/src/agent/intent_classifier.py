import json
import re
from typing import Any, Literal, Protocol

from pydantic import BaseModel, Field

from src.llm.client import LLMClient


IntentName = Literal[
    "info",
    "service",
    "booking",
    "reschedule",
    "cancel",
    "waitlist",
    "safety",
    "out_of_scope",
    "unknown",
]


class IntentClassification(BaseModel):
    intent: IntentName = "unknown"
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    requires_clinical_triage: bool = False
    reason: str = ""

    @property
    def is_actionable(self) -> bool:
        return self.confidence >= 0.55 and self.intent != "unknown"


class IntentClassifier(Protocol):
    def classify(
        self, message: str, conversation_state: dict[str, Any]
    ) -> IntentClassification:
        ...


class LLMIntentClassifier:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    def classify(
        self, message: str, conversation_state: dict[str, Any]
    ) -> IntentClassification:
        response = self.llm_client.chat(
            messages=[
                {"role": "system", "content": self._system_prompt()},
                {
                    "role": "user",
                    "content": json.dumps(
                        {"message": message},
                        ensure_ascii=False,
                    ),
                },
            ],
            tools=[],
            tool_choice="none",
        )
        payload = self._extract_json(response)
        if not payload:
            return IntentClassification(
                intent="unknown",
                confidence=0.0,
                reason="classifier_returned_no_json",
            )
        return self._parse_classification_payload(payload)

    @staticmethod
    def _system_prompt() -> str:
        return (
            "Return JSON only for a Vietnamese dental appointment router.\n"
            "Output shape: "
            '{"intent":"unknown","confidence":0.0,'
            '"requires_clinical_triage":false,"reason":"short"}.\n'
            "Allowed intent values: info, service, booking, reschedule, cancel, "
            "waitlist, safety, out_of_scope, unknown.\n"
            "Chỉ chọn một intent. Do not return multiple values. Do not use |.\n"
            "Classify by supported capability, not by fixed entities or examples. "
            "Use out_of_scope only when the request cannot be handled by the "
            "available dental appointment, clinic information, service, waitlist, "
            "or safety handoff capabilities. Use safety when the request needs "
            "clinical triage or medical handoff. Use booking, reschedule, cancel, "
            "or waitlist for appointment workflows. Use service for service, price, "
            "or duration questions. Use info for administrative clinic information. "
            "Use unknown when evidence is insufficient."
        )

    @staticmethod
    def _parse_classification_payload(payload: dict[str, Any]) -> IntentClassification:
        if (
            payload.get("requires_clinical_triage") is True
            and payload.get("intent") != "out_of_scope"
        ):
            payload = {**payload, "intent": "safety"}
        try:
            return IntentClassification(**payload)
        except Exception:
            return IntentClassification(
                intent="unknown",
                confidence=0.0,
                reason="classifier_returned_invalid_json",
            )

    @classmethod
    def _extract_json(cls, response: dict[str, Any]) -> dict[str, Any] | None:
        choices = response.get("choices") or []
        if not choices:
            return None
        content = choices[0].get("message", {}).get("content") or ""
        return cls._parse_json_object(content)

    @staticmethod
    def _parse_json_object(content: str) -> dict[str, Any] | None:
        candidates = [content.strip()]
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            candidates.append(match.group(0))
        for candidate in candidates:
            try:
                parsed = json.loads(candidate)
            except json.JSONDecodeError:
                continue
            if isinstance(parsed, dict):
                return parsed
        return None
