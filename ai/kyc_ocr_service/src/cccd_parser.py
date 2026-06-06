from __future__ import annotations

import re
import unicodedata
from datetime import datetime

from .schemas import CccdFields, CccdParseResult, CheckResult


FRONT_HINTS = (
    "CAN CUOC",
    "CONG DAN",
    "SOCIALIST REPUBLIC",
    "CITIZEN ID",
    "FULL NAME",
    "DATE OF BIRTH",
    "NGAY SINH",
    "QUOC TICH",
)
BACK_HINTS = (
    "DAC DIEM NHAN DANG",
    "DATE OF ISSUE",
    "NGAY CAP",
    "NOI CAP",
    "PLACE OF ISSUE",
    "CUC CANH SAT",
)


def parse_cccd_text(lines: list[str]) -> CccdParseResult:
    raw_text = "\n".join(line.strip() for line in lines if line and line.strip())
    normalized = _normalize(raw_text)
    side = _detect_side(normalized)
    fields = CccdFields(
        document_type="CITIZEN_ID" if _has_any(normalized, FRONT_HINTS + BACK_HINTS) else None,
        side=side,
        id_number=_extract_id_number(raw_text),
        full_name=_extract_full_name(raw_text),
        date_of_birth=_extract_date(raw_text, ("date of birth", "ngay sinh", "dob"), allow_unlabeled=side != "BACK"),
        issue_date=_extract_date(raw_text, ("date of issue", "ngay cap", "ngay thang nam")),
    )
    checks = _build_checks(fields)
    risk_level = _risk_level(checks)

    return CccdParseResult(
        fields=fields,
        checks=checks,
        risk_level=risk_level,
        raw_text=raw_text,
    )


def _build_checks(fields: CccdFields) -> dict[str, CheckResult]:
    return {
        "ID_NUMBER_FOUND": CheckResult(
            status="PASS" if fields.id_number else "FAIL",
            message="Found a 12-digit Vietnamese citizen ID number."
            if fields.id_number
            else "Could not find a 12-digit Vietnamese citizen ID number.",
            value=fields.id_number,
        ),
        "DOB_FOUND": CheckResult(
            status="PASS" if fields.date_of_birth or fields.side == "BACK" else "WARNING",
            message="Found date of birth."
            if fields.date_of_birth
            else "Date of birth is not required on the back side."
            if fields.side == "BACK"
            else "Could not find date of birth.",
            value=fields.date_of_birth,
        ),
        "DOCUMENT_TYPE_HINT": CheckResult(
            status="PASS" if fields.document_type else "FAIL",
            message="OCR text contains citizen ID keywords."
            if fields.document_type
            else "OCR text does not contain citizen ID keywords.",
            value=fields.document_type,
        ),
        "FRONT_SIDE_HINT": CheckResult(
            status="PASS" if fields.side == "FRONT" else "WARNING",
            message="OCR text looks like the front side." if fields.side == "FRONT" else "Front side keywords were not dominant.",
            value=fields.side,
        ),
        "BACK_SIDE_HINT": CheckResult(
            status="PASS" if fields.side == "BACK" else "WARNING",
            message="OCR text looks like the back side." if fields.side == "BACK" else "Back side keywords were not dominant.",
            value=fields.side,
        ),
    }


def _risk_level(checks: dict[str, CheckResult]) -> str:
    hard_fails = ("ID_NUMBER_FOUND", "DOCUMENT_TYPE_HINT")
    if any(checks[name].status == "FAIL" for name in hard_fails):
        return "HIGH"
    risk_relevant_checks = ("DOB_FOUND",)
    if any(checks[name].status == "WARNING" for name in risk_relevant_checks):
        return "MEDIUM"
    return "LOW"


def _detect_side(normalized_text: str) -> str:
    front_score = sum(1 for hint in FRONT_HINTS if hint in normalized_text)
    back_score = sum(1 for hint in BACK_HINTS if hint in normalized_text)
    if back_score > front_score:
        return "BACK"
    if front_score > 0:
        return "FRONT"
    return "UNKNOWN"


def _extract_id_number(text: str) -> str | None:
    match = re.search(r"\b\d{12}\b", text)
    if match:
        return match.group(0)
    mrz_match = re.search(r"[IT1]DVNM([0-9]{18,})", _normalize(text))
    if not mrz_match:
        return None
    digits = re.sub(r"\D", "", mrz_match.group(1))
    return digits[-12:] if len(digits) >= 12 else None


def _extract_full_name(text: str) -> str | None:
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if not _is_full_name_label(line):
            continue
        value = _clean_name_candidate(
            re.sub(r"(?i)full\s*name|ho\s*va\s*ten|[/:\-]", " ", _normalize(line)),
        )
        if value:
            return value
        for candidate in lines[index + 1 : index + 3]:
            value = _clean_name_candidate(candidate)
            if value:
                return value
    return None


def _is_full_name_label(text: str) -> bool:
    compact = re.sub(r"[^A-Z]", "", _normalize(text))
    return (
        "FULLNAME" in compact
        or "FULLNARNE" in compact
        or "HOVATEN" in compact
        or "HOVAT" in compact
    )


def _clean_name_candidate(text: str) -> str | None:
    normalized = _normalize(text)
    if _is_full_name_label(normalized):
        return None
    if _first_date(normalized) or _extract_id_number(normalized):
        return None
    if any(hint in normalized for hint in FRONT_HINTS + BACK_HINTS):
        return None
    cleaned = re.sub(r"[^A-Z ]", " ", normalized)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if len(cleaned.replace(" ", "")) < 5:
        return None
    return cleaned


def _extract_date(text: str, labels: tuple[str, ...], allow_unlabeled: bool = False) -> str | None:
    for line in text.splitlines():
        normalized = _normalize(line)
        compact = re.sub(r"[^A-Z0-9]", "", normalized)
        if not any(re.sub(r"[^A-Z0-9]", "", _normalize(label)) in compact for label in labels):
            continue
        date = _first_date(line)
        if date:
            return date
    return _first_date(text) if allow_unlabeled else None


def _first_date(text: str) -> str | None:
    match = re.search(r"(?<!\d)(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?!\d)", text)
    if not match:
        return None
    day, month, year = match.groups()
    try:
        return datetime(int(year), int(month), int(day)).strftime("%Y-%m-%d")
    except ValueError:
        return None


def _has_any(text: str, hints: tuple[str, ...]) -> bool:
    return any(hint in text for hint in hints)


def _normalize(text: str) -> str:
    without_accents = "".join(
        char for char in unicodedata.normalize("NFD", text) if unicodedata.category(char) != "Mn"
    )
    return without_accents.upper()
