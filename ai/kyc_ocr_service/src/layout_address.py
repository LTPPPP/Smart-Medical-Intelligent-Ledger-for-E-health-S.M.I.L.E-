from __future__ import annotations

import re

from .schemas import CccdFields, OcrLine
from .vietnamese_text import clean_human_text, compact_for_match


def merge_layout_address_fields(fields: CccdFields, lines: list[OcrLine]) -> CccdFields:
    if fields.side != "FRONT":
        return fields
    origin = _extract_layout_address(lines, "origin") or fields.place_of_origin
    residence = _extract_layout_address(lines, "residence") or fields.place_of_residence
    if origin == fields.place_of_origin and residence == fields.place_of_residence:
        return fields
    return CccdFields(
        document_type=fields.document_type,
        side=fields.side,
        id_number=fields.id_number,
        full_name=fields.full_name,
        date_of_birth=fields.date_of_birth,
        issue_date=fields.issue_date,
        place_of_origin=origin,
        place_of_residence=residence,
    )


def _extract_layout_address(lines: list[OcrLine], kind: str) -> str | None:
    indexed = [(index, line) for index, line in enumerate(lines) if line.bbox]
    if not indexed:
        return None
    origin_label = _find_layout_label(indexed, "origin")
    residence_label = _find_layout_label(indexed, "residence")
    label_item = origin_label if kind == "origin" else residence_label
    if not label_item:
        if kind == "residence" and origin_label:
            _, residence = _extract_layout_addresses_after_origin(indexed, origin_label[1])
            return residence
        return None
    if kind == "origin" and origin_label and not residence_label:
        origin, _ = _extract_layout_addresses_after_origin(indexed, origin_label[1])
        if origin:
            return origin

    _, label = label_item
    min_x, label_top, _, _ = _line_box(label)
    image_width = max(_line_box(line)[2] for _, line in indexed)
    start_y = label_top + ((_line_height(label) * 0.45) if kind == "residence" else _line_height(label) * 0.75)
    end_y = (
        _line_box(residence_label[1])[1] - 2
        if kind == "origin" and residence_label
        else max(_line_box(line)[3] for _, line in indexed) + 1
    )
    address_parts = []
    inline_value = _strip_layout_address_label(label.text)
    if inline_value:
        address_parts.append(inline_value)

    for _, line in sorted(indexed, key=lambda item: (_line_center_y(item[1]), _line_box(item[1])[0])):
        if line is label:
            continue
        left, top, right, bottom = _line_box(line)
        center_y = (top + bottom) / 2
        center_x = (left + right) / 2
        if center_y < start_y or center_y > end_y:
            continue
        if center_x < image_width * 0.24 or right < min_x - 35:
            continue
        if _is_layout_address_noise(line.text):
            continue
        cleaned = _clean_layout_address_text(line.text)
        if cleaned:
            address_parts.append(cleaned)
    return _join_layout_address_parts(address_parts)


def _extract_layout_addresses_after_origin(
    indexed: list[tuple[int, OcrLine]],
    origin_label: OcrLine,
) -> tuple[str | None, str | None]:
    min_x, label_top, _, _ = _line_box(origin_label)
    image_width = max(_line_box(line)[2] for _, line in indexed)
    start_y = label_top + (_line_height(origin_label) * 0.75)
    candidates: list[tuple[OcrLine, str]] = []
    for _, line in sorted(indexed, key=lambda item: (_line_center_y(item[1]), _line_box(item[1])[0])):
        if line is origin_label:
            continue
        left, top, right, bottom = _line_box(line)
        center_y = (top + bottom) / 2
        center_x = (left + right) / 2
        if center_y < start_y:
            continue
        if center_x < image_width * 0.24 or right < min_x - 35:
            continue
        if _is_layout_address_noise(line.text):
            continue
        cleaned = _clean_layout_address_text(line.text)
        if cleaned:
            candidates.append((line, cleaned))
    if not candidates:
        return None, None
    groups = _group_address_candidates(candidates)
    origin = _join_layout_address_parts(groups[0]) if groups else None
    residence_parts = [part for group in groups[1:] for part in group]
    residence = _join_layout_address_parts(residence_parts) if residence_parts else None
    return origin, residence


def _group_address_candidates(candidates: list[tuple[OcrLine, str]]) -> list[list[str]]:
    if not candidates:
        return []
    heights = sorted(_line_height(line) for line, _ in candidates)
    median_height = heights[len(heights) // 2]
    gap_threshold = max(12.0, median_height * 0.9)
    groups: list[list[str]] = []
    current: list[str] = []
    previous_bottom: float | None = None
    for line, text in candidates:
        _, top, _, bottom = _line_box(line)
        if current and previous_bottom is not None and top - previous_bottom > gap_threshold:
            groups.append(current)
            current = []
        current.append(text)
        previous_bottom = bottom
    if current:
        groups.append(current)
    return groups


def _find_layout_label(indexed: list[tuple[int, OcrLine]], kind: str) -> tuple[int, OcrLine] | None:
    labels = ("QUEQUAN", "QUEGUAN", "PLACEOFORIGIN", "PLACEOFONGIN") if kind == "origin" else (
        "NOITHUONGTRU",
        "PLACEOFRESIDENCE",
        "PLACEOFRESIDENC",
    )
    for item in indexed:
        compact = compact_for_match(item[1].text)
        if any(label in compact for label in labels) or _has_fuzzy_layout_label(compact, kind):
            return item
    return None


def _has_fuzzy_layout_label(compact: str, kind: str) -> bool:
    if kind == "residence":
        return (
            "PLACEOFRESIDEN" in compact
            or ("NOI" in compact and "TR" in compact and ("THUON" in compact or "THUONG" in compact))
        )
    return "PLACEOFORIGIN" in compact or "PLACEOFONGIN" in compact


def _strip_layout_address_label(text: str) -> str | None:
    if ":" in text:
        return _clean_layout_address_text(text.rsplit(":", 1)[1])
    stripped = text.upper()
    for pattern in (
        r"QU[ÊE]\s*[GQ]U[ÁA]N",
        r"PLACE\s*OF\s*ORIGIN",
        r"PLACE\s*OF\s*ONGIN",
        r"N[ƠO]I\s*TH[ƯU][ƠO]NG\s*TR[ÚU]",
        r"PLACE\s*OF\s*RESIDEN[CG]E?",
    ):
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
    return _clean_layout_address_text(stripped)


def _is_layout_address_noise(text: str) -> bool:
    compact = compact_for_match(text)
    noise_tokens = (
        "COGIATRIDEN",
        "COGIA",
        "COGDEN",
        "DATEOFEXPIRY",
        "DATAOFEXPIRY",
        "NGAYSINH",
        "DATEOFBIRTH",
        "GIOITINH",
        "QUOCTICH",
        "NATIONALITY",
        "FULLNAME",
        "HOVATEN",
    )
    return any(token in compact for token in noise_tokens) or _contains_date(text)


def _contains_date(text: str) -> bool:
    return bool(
        re.search(r"(?<!\d)\d{4}-\d{1,2}-\d{1,2}(?!\d)", text)
        or re.search(r"(?<!\d)\d{1,2}[/-]\d{1,2}[/-]\d{4}(?!\d)", text)
    )


def _clean_layout_address_text(text: str) -> str | None:
    if _is_layout_address_noise(text):
        return None
    cleaned = clean_human_text(text, allowed_punctuation=" ,./-")
    if not cleaned:
        return None
    compact = compact_for_match(cleaned)
    if len(compact) < 3:
        return None
    return cleaned


def _join_layout_address_parts(parts: list[str]) -> str | None:
    cleaned_parts = []
    for part in parts:
        cleaned = _clean_layout_address_text(part)
        if cleaned and cleaned not in cleaned_parts:
            cleaned_parts.append(cleaned)
    if not cleaned_parts:
        return None
    return ", ".join(cleaned_parts)


def _line_box(line: OcrLine) -> tuple[float, float, float, float]:
    xs = [point[0] for point in line.bbox or []]
    ys = [point[1] for point in line.bbox or []]
    return min(xs), min(ys), max(xs), max(ys)


def _line_height(line: OcrLine) -> float:
    _, top, _, bottom = _line_box(line)
    return max(bottom - top, 1.0)


def _line_center_y(line: OcrLine) -> float:
    _, top, _, bottom = _line_box(line)
    return (top + bottom) / 2
