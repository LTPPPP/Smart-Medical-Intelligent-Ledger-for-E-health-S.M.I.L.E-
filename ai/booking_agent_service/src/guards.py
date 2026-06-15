from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from enum import StrEnum


class ConfirmationDecision(StrEnum):
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    AMBIGUOUS = "ambiguous"


@dataclass(frozen=True)
class SafetyDecision:
    blocked: bool
    reason: str | None = None


@dataclass(frozen=True)
class PostCheckResult:
    safe: bool
    violations: list[str]


def _normalize(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text.lower().replace("đ", "d"))
    return "".join(char for char in decomposed if unicodedata.category(char) != "Mn")


POSITIVE_CONFIRMATION = (
    "co",
    "dong y",
    "xac nhan",
    "ok dat",
    "okay dat",
    "duoc dat",
    "duoc, dat",
    "dat giup toi",
)
NEGATIVE_CONFIRMATION = ("khong", "huy", "thoi", "doi y", "chon lai")


def detect_confirmation(message: str) -> ConfirmationDecision:
    normalized = _normalize(message)
    if any(phrase in normalized for phrase in POSITIVE_CONFIRMATION):
        return ConfirmationDecision.CONFIRMED
    if any(phrase in normalized for phrase in NEGATIVE_CONFIRMATION):
        return ConfirmationDecision.REJECTED
    return ConfirmationDecision.AMBIGUOUS


EMERGENCY_PATTERNS = (
    "sung mat",
    "sung co",
    "kho tho",
    "chay mau khong cam",
    "chay mau nhieu",
    "mau chay nhieu",
    "ngat",
    "mat y thuc",
    "sot cao",
    "chan thuong",
    "dau nguc",
    "nhiem trung lan",
)


def detect_safety_risk(message: str) -> SafetyDecision:
    normalized = _normalize(message)
    if any(pattern in normalized for pattern in EMERGENCY_PATTERNS):
        return SafetyDecision(True, "emergency_or_systemic_symptom")
    return SafetyDecision(False)


UUID_RE = re.compile(
    r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-"
    r"[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\b"
)
APPOINTMENT_CODE_RE = re.compile(r"\bAPT-\d{8}-\d{4,}\b")


class ResponsePostCheck:
    def __init__(self, allowed_ids: set[str], allowed_codes: set[str]) -> None:
        self.allowed_ids = allowed_ids
        self.allowed_codes = allowed_codes

    def validate(self, text: str) -> PostCheckResult:
        violations: list[str] = []
        for value in UUID_RE.findall(text):
            if value not in self.allowed_ids:
                violations.append(value)
        for value in APPOINTMENT_CODE_RE.findall(text):
            if value not in self.allowed_codes:
                violations.append(value)
        return PostCheckResult(safe=not violations, violations=violations)
