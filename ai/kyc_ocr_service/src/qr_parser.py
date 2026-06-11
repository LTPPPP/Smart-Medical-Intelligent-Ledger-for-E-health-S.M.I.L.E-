from __future__ import annotations

import re
from datetime import datetime

from .schemas import CccdFields, QrDetectionResult
from .vietnamese_text import clean_human_text


def fields_from_qr(qr: QrDetectionResult) -> CccdFields:
    if not qr.detected or not qr.data:
        return CccdFields()
    parts = [part.strip() for part in qr.data.split("|")]
    if len(parts) < 6:
        return CccdFields()
    return CccdFields(
        document_type="CITIZEN_ID",
        side="FRONT",
        id_number=_id_number(parts[0]),
        full_name=clean_human_text(parts[2], allowed_punctuation=" -'"),
        date_of_birth=_qr_date(parts[3]),
        issue_date=_qr_date(parts[6]) if len(parts) > 6 else None,
        place_of_residence=clean_human_text(parts[5], allowed_punctuation=" ,./-"),
    )


def merge_qr_fields(fields: CccdFields, qr: QrDetectionResult) -> CccdFields:
    qr_fields = fields_from_qr(qr)
    if not any(
        (
            qr_fields.id_number,
            qr_fields.full_name,
            qr_fields.date_of_birth,
            qr_fields.issue_date,
            qr_fields.place_of_residence,
        )
    ):
        return fields
    return CccdFields(
        document_type=fields.document_type or qr_fields.document_type,
        side=fields.side if fields.side != "UNKNOWN" else qr_fields.side,
        id_number=fields.id_number or qr_fields.id_number,
        full_name=fields.full_name or qr_fields.full_name,
        date_of_birth=fields.date_of_birth or qr_fields.date_of_birth,
        issue_date=fields.issue_date or qr_fields.issue_date,
        expiry_date=fields.expiry_date or qr_fields.expiry_date,
        place_of_origin=fields.place_of_origin,
        place_of_residence=fields.place_of_residence or qr_fields.place_of_residence,
    )


def _id_number(value: str) -> str | None:
    match = re.search(r"\b\d{12}\b", value)
    return match.group(0) if match else None


def _qr_date(value: str) -> str | None:
    digits = re.sub(r"\D", "", value)
    if len(digits) != 8:
        return None
    for day, month, year in ((digits[:2], digits[2:4], digits[4:]), (digits[6:], digits[4:6], digits[:4])):
        try:
            return datetime(int(year), int(month), int(day)).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None
