from __future__ import annotations

import re

from .schemas import LayoutContext, OcrLine, TextRegion


MRZ_PATTERN = re.compile(r"^[A-Z0-9<]{20,}$")


def build_layout_context(lines: list[OcrLine]) -> LayoutContext:
    regions = [
        TextRegion(
            index=index,
            text=line.text,
            confidence=line.confidence,
            bbox=line.bbox,
        )
        for index, line in enumerate(lines)
    ]
    mrz_candidates = [
        _normalize_mrz_candidate(line.text)
        for line in lines
        if _looks_like_mrz(line.text)
    ]
    return LayoutContext(regions=regions, mrz_candidates=mrz_candidates)


def _looks_like_mrz(text: str) -> bool:
    normalized = _normalize_mrz_candidate(text)
    return bool(MRZ_PATTERN.match(normalized)) and "<" in normalized


def _normalize_mrz_candidate(text: str) -> str:
    return re.sub(r"[^A-Z0-9<]", "", text.upper())
