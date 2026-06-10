from __future__ import annotations

import re
from datetime import datetime

from .schemas import CccdFields, CccdParseResult, CheckResult
from .vietnamese_text import clean_human_text, compact_for_match, normalize_for_match


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
        place_of_origin=_extract_address(raw_text, "origin"),
        place_of_residence=_extract_address(raw_text, "residence"),
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
        value = _clean_name_candidate(_strip_full_name_label(line))
        if value:
            return value
        for candidate in lines[index + 1 : index + 3]:
            if _is_name_stop_line(candidate):
                break
            value = _clean_name_candidate(candidate)
            if value:
                return value
    return None


def _extract_address(text: str, kind: str) -> str | None:
    lines = [line.strip() for line in text.splitlines() if line and line.strip()]
    labels = _address_labels(kind)
    for index, line in enumerate(lines):
        if not _has_compact_label(line, labels):
            continue
        parts = []
        inline_value = _strip_address_label(line, labels)
        if inline_value:
            parts.append(inline_value)
        for candidate in lines[index + 1 : index + 4]:
            if _is_address_stop_line(candidate, kind):
                break
            cleaned = _clean_address_candidate(candidate)
            if cleaned:
                parts.append(cleaned)
            if len(parts) >= 2:
                break
        address = _join_address_parts(parts)
        if address:
            return address
    if kind == "residence":
        return _extract_residence_after_expiry(lines)
    return None


def _address_labels(kind: str) -> tuple[str, ...]:
    if kind == "origin":
        return ("QUEQUAN", "PLACEOFORIGIN", "PLACEOFONGIN")
    return (
        "NOITHUONGTRU",
        "PLACEOFRESIDENCE",
        "PLACEOFRESIDENGE",
        "PLACEOFRESIDENC",
    )


def _has_compact_label(text: str, labels: tuple[str, ...]) -> bool:
    compact = compact_for_match(text)
    return any(label in compact for label in labels) or _has_fuzzy_address_label(compact, labels)


def _has_fuzzy_address_label(compact: str, labels: tuple[str, ...]) -> bool:
    if "PLACEOFRESIDEN" in compact:
        return any(label.startswith("PLACEOFRESIDEN") for label in labels)
    if "NOI" in compact and "TR" in compact and ("THUON" in compact or "THUONG" in compact):
        return "NOITHUONGTRU" in labels
    if "PLACEOFORIGIN" in compact or "PLACEOFONGIN" in compact:
        return any(label in {"PLACEOFORIGIN", "PLACEOFONGIN"} for label in labels)
    return False


def _strip_address_label(text: str, labels: tuple[str, ...]) -> str | None:
    if ":" in text:
        return _clean_address_candidate(text.rsplit(":", 1)[1])
    stripped = text.upper()
    label_patterns = (
        r"QU[ÊE]\s*[GQ]U[ÁA]N",
        r"PLACE\s*OF\s*ORIGIN",
        r"PLACE\s*OF\s*ONGIN",
        r"N[ƠO]I\s*TH[ƯU][ƠO]NG\s*TR[ÚU]",
        r"PLACE\s*OF\s*RESIDEN[CG]E?",
    )
    for pattern in label_patterns:
        stripped = re.sub(pattern, " ", stripped, flags=re.IGNORECASE)
    stripped = re.sub(r"QU[\wÀ-Ỵ]*[GQ]U[\wÀ-Ỵ]*N", " ", stripped, flags=re.IGNORECASE)
    stripped = re.sub(
        r"N[ƠO]I\s*TH[ƯU][ƠO][NQ][GQ]?\s*TR[ÚU]",
        " ",
        stripped,
        flags=re.IGNORECASE,
    )
    stripped = re.sub(r"N[ƠO]I\s*TH[\wÀ-Ỵ]+\s*TR[\wÀ-Ỵ]*", " ", stripped, flags=re.IGNORECASE)
    stripped = re.sub(r"PLACE\s*OF\s*RESIDEN\w+", " ", stripped, flags=re.IGNORECASE)
    stripped = re.sub(r"[/:\-]", " ", stripped)
    compact = compact_for_match(stripped)
    if not compact or any(compact == label for label in labels):
        return None
    return _clean_address_candidate(stripped)


def _is_address_stop_line(text: str, kind: str) -> bool:
    compact = compact_for_match(text)
    stop_labels = {
        "SENO",
        "SONO",
        "HOVATEN",
        "FULLNAME",
        "FULLNARNE",
        "NGAYSINH",
        "DATEOFBIRTH",
        "GIOITINH",
        "SEX",
        "QUOCTICH",
        "NATIONALITY",
        "COGIATRIDEN",
        "COGIADEN",
        "GOGIATRID",
        "COGDEN",
        "DATEOFEXPIRY",
        "DATAOFEXPIRY",
        "DACDIEM",
        "NGAYTHANGNAM",
        "DATEOFISSUE",
        "IDVNM",
    }
    if kind == "origin":
        stop_labels.update(_address_labels("residence"))
    else:
        stop_labels.update(_address_labels("origin"))
    return any(label in compact for label in stop_labels)


def _extract_residence_after_expiry(lines: list[str]) -> str | None:
    saw_expiry = False
    parts = []
    for line in lines:
        compact = compact_for_match(line)
        if "COGIATRIDEN" in compact or "GOGIATRID" in compact or "DATEOFEXPIRY" in compact:
            saw_expiry = True
            continue
        if not saw_expiry:
            continue
        if _is_address_stop_line(line, "residence"):
            continue
        candidate = _clean_address_candidate(line)
        if candidate:
            parts.append(candidate)
        if len(parts) >= 2:
            break
    return _join_address_parts(parts)


def _clean_address_candidate(text: str) -> str | None:
    if _first_date(text) or _extract_id_number(text):
        return None
    normalized = _normalize(text)
    compact = compact_for_match(text)
    if len(compact) < 4:
        return None
    return clean_human_text(text, allowed_punctuation=" ,./-")


def _join_address_parts(parts: list[str]) -> str | None:
    cleaned_parts = []
    for part in parts:
        cleaned = _clean_address_candidate(part)
        if cleaned and cleaned not in cleaned_parts:
            cleaned_parts.append(cleaned)
    if not cleaned_parts:
        return None
    return ", ".join(cleaned_parts)


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
    cleaned = clean_human_text(text, allowed_punctuation=" -'")
    if not cleaned:
        return None
    if len(cleaned.replace(" ", "")) < 5:
        return None
    return cleaned


def _strip_full_name_label(text: str) -> str:
    if ":" in text and _is_full_name_label(text):
        return text.rsplit(":", 1)[1]

    label_match = re.search(
        r"(?:h\s*[ọo]\s*v(?:à|a)\s*t(?:ê|e)n|full\s*n(?:a|r)me)\s*[/:\- ]*",
        text,
        flags=re.IGNORECASE,
    )
    if label_match:
        return text[label_match.end() :]

    compact = compact_for_match(text)
    label_markers = ("HOVATEN", "FULLNAME", "FULLNARNE")
    if "/" in text and any(marker in compact for marker in label_markers):
        return ""
    stripped = text
    for pattern in (
        r"H\s*[ỌO]\s*V[ÀA]\s*T[ÊE]N",
        r"FULL\s*N[AA]ME",
        r"FULL\s*NARNE",
    ):
        stripped = re.sub(pattern, " ", stripped, flags=re.IGNORECASE)
    return re.sub(r"[/:\-]", " ", stripped)


def _is_name_stop_line(text: str) -> bool:
    compact = compact_for_match(text)
    stop_labels = {
        "NGAYSINH",
        "DATEOFBIRTH",
        "GIOITINH",
        "SEX",
        "QUOCTICH",
        "NATIONALITY",
        "QUEQUAN",
        "PLACEOFORIGIN",
        "NOITHUONGTRU",
        "PLACEOFRESIDENCE",
        "COGIATRIDEN",
        "DATEOFEXPIRY",
    }
    return any(label in compact for label in stop_labels)


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
        match = re.search(r"(?<!\d)(\d{1,2})[^\d\s]{1,2}(\d{1,2})[/-](\d{4})(?!\d)", text)
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
    return normalize_for_match(text)
