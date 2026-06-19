from __future__ import annotations

from pathlib import Path
from typing import Iterable

import cv2
import numpy as np

from .cccd_parser import _clean_address_candidate, _join_address_parts, parse_cccd_text
from .field_crops import FieldCrop, build_field_crops
from .layout_address import merge_layout_address_fields
from .schemas import CccdFields, LayoutContext, OcrLine
from .vietnamese_text import clean_human_text, comparable_text, has_diacritics


TARGET_FIELDS = (
    "full_name",
    "date_of_birth",
    "place_of_origin",
    "place_of_residence",
)


class FieldCropOcrRefiner:
    def __init__(self, ocr_engine):
        self.ocr_engine = ocr_engine

    def refine(
        self,
        image_path: Path,
        *,
        layout: LayoutContext,
        current_fields: CccdFields,
        output_dir: Path,
    ) -> CccdFields:
        precise_front_refinement = (
            current_fields.side != "BACK"
            and callable(getattr(self.ocr_engine, "recognize_precise", None))
        )
        refine_address_block = _should_refine_address_block(current_fields, layout)
        if (
            not _needs_refinement(current_fields)
            and not refine_address_block
            and not precise_front_refinement
        ):
            return current_fields
        crops = build_field_crops(image_path, layout, output_dir)
        if (
            precise_front_refinement
            and current_fields.full_name
            and not any(crop.name == "full_name" for crop in crops)
        ):
            full_name_value_crop = _build_text_value_crop(
                image_path,
                layout,
                current_fields.full_name,
                output_dir,
                name="full_name_value",
            )
            if full_name_value_crop:
                crops.append(full_name_value_crop)
        if not crops:
            return current_fields

        refined = current_fields
        for crop in crops:
            if (
                crop.name == "full_name"
                and refined.full_name
                and not precise_front_refinement
            ):
                continue
            if crop.name == "date_of_birth" and refined.date_of_birth:
                continue
            if crop.name == "issue_date" and refined.issue_date:
                continue
            if (
                crop.name == "address_block"
                and refined.place_of_origin
                and refined.place_of_residence
                and not refine_address_block
                and not precise_front_refinement
            ):
                continue
            crop_fields = self._recognize_crop_fields(crop)
            refined = _merge_refined_fields(refined, crop_fields)
        if refine_address_block and refined.place_of_residence:
            residence_crop = _build_residence_block_crop(image_path, layout, refined, output_dir)
            if residence_crop:
                refined = _merge_refined_fields(
                    refined,
                    self._recognize_residence_crop_fields(residence_crop),
                )
        return refined

    def _recognize_crop_fields(self, crop: FieldCrop) -> CccdFields:
        side_hint = "BACK" if crop.name == "issue_date" else "FRONT"
        best = CccdFields(side=side_hint)
        for variant_path in _build_crop_variants(crop):
            lines = self._recognize_crop(crop.name, variant_path)
            crop_fields = (
                _fields_from_full_name_value_lines(lines)
                if crop.name == "full_name_value"
                else _fields_from_crop_lines(lines, side_hint=side_hint)
            )
            best = _merge_refined_fields(best, crop_fields)
            if _crop_satisfied(crop.name, best):
                break
        return best

    def _recognize_residence_crop_fields(self, crop: FieldCrop) -> CccdFields:
        best = CccdFields(side="FRONT")
        for variant_path in _build_crop_variants(crop):
            lines = self._recognize_crop(crop.name, variant_path)
            crop_fields = _fields_from_residence_crop_lines(lines)
            best = _merge_refined_fields(best, crop_fields)
            if best.place_of_residence:
                break
        return best

    def _recognize_crop(self, crop_name: str, crop_path: Path) -> list[OcrLine]:
        recognize_precise = getattr(self.ocr_engine, "recognize_precise", None)
        if crop_name in {
            "full_name",
            "full_name_value",
            "address_block",
            "residence_block",
        } and callable(recognize_precise):
            return recognize_precise(crop_path)
        return self.ocr_engine.recognize(crop_path)


def _fields_from_crop_lines(
    lines: list[OcrLine],
    *,
    side_hint: str = "FRONT",
) -> CccdFields:
    parse_result = parse_cccd_text([line.text for line in lines])
    fields = parse_result.fields
    if fields.side == "UNKNOWN":
        fields = fields.model_copy(update={"side": side_hint})
    fields = merge_layout_address_fields(fields, lines)
    return fields


def _fields_from_residence_crop_lines(lines: list[OcrLine]) -> CccdFields:
    fields = _fields_from_crop_lines(lines)
    if fields.place_of_residence:
        return fields
    parts = []
    for line in lines:
        cleaned = _clean_address_candidate(line.text)
        if cleaned:
            parts.append(cleaned)
    return CccdFields(
        side="FRONT",
        place_of_residence=_join_address_parts(parts),
    )


def _fields_from_full_name_value_lines(lines: list[OcrLine]) -> CccdFields:
    candidates = [
        cleaned
        for line in lines
        if (cleaned := clean_human_text(line.text))
    ]
    return CccdFields(
        side="FRONT",
        full_name=max(candidates, key=len) if candidates else None,
    )


def _build_text_value_crop(
    image_path: Path,
    layout: LayoutContext,
    text: str,
    output_dir: Path,
    *,
    name: str,
) -> FieldCrop | None:
    image = cv2.imread(str(image_path))
    if image is None or image.size == 0:
        return None
    target = _find_region_for_text(layout, text)
    if not target or not target.bbox:
        return None

    height, width = image.shape[:2]
    left, top, right, bottom = _region_box(target)
    line_height = max(bottom - top, 1.0)
    x1 = max(0, int(left - max(18, width * 0.015)))
    y1 = max(0, int(top - line_height * 0.6))
    x2 = min(width, int(right + max(18, width * 0.015)))
    y2 = min(height, int(bottom + line_height * 0.6))
    if x2 <= x1 or y2 <= y1:
        return None

    output_dir.mkdir(parents=True, exist_ok=True)
    target_path = output_dir / f"{name}.jpg"
    cv2.imwrite(str(target_path), image[y1:y2, x1:x2])
    return FieldCrop(
        name=name,
        path=target_path,
        bbox=[
            [float(x1), float(y1)],
            [float(x2), float(y1)],
            [float(x2), float(y2)],
            [float(x1), float(y2)],
        ],
        text_hint=text,
    )


def _build_residence_block_crop(
    image_path: Path,
    layout: LayoutContext,
    fields: CccdFields,
    output_dir: Path,
) -> FieldCrop | None:
    if not fields.place_of_residence:
        return None
    image = cv2.imread(str(image_path))
    if image is None or image.size == 0:
        return None
    target = _find_region_for_text(layout, fields.place_of_residence)
    if not target or not target.bbox:
        return None

    height, width = image.shape[:2]
    left, top, right, bottom = _region_box(target)
    line_height = max(bottom - top, 1.0)
    x1 = max(0, int(left - max(18, width * 0.015)))
    y1 = max(0, int(top - line_height * 2.4))
    x2 = width
    y2 = min(height, int(bottom + line_height * 0.8))
    if x2 <= x1 or y2 <= y1:
        return None

    output_dir.mkdir(parents=True, exist_ok=True)
    target_path = output_dir / "residence_block.jpg"
    cv2.imwrite(str(target_path), image[y1:y2, x1:x2])
    return FieldCrop(
        name="residence_block",
        path=target_path,
        bbox=[
            [float(x1), float(y1)],
            [float(x2), float(y1)],
            [float(x2), float(y2)],
            [float(x1), float(y2)],
        ],
        text_hint=fields.place_of_residence,
    )


def _find_region_for_text(layout: LayoutContext, text: str):
    target_key = comparable_text(text)
    if not target_key:
        return None
    matches = []
    for region in layout.regions:
        if not region.bbox:
            continue
        region_key = comparable_text(region.text)
        if region_key and (region_key in target_key or target_key in region_key):
            matches.append(region)
    return max(matches, key=lambda region: _region_box(region)[1]) if matches else None


def _region_box(region) -> tuple[float, float, float, float]:
    xs = [float(point[0]) for point in region.bbox or []]
    ys = [float(point[1]) for point in region.bbox or []]
    return min(xs), min(ys), max(xs), max(ys)


def _build_crop_variants(crop: FieldCrop) -> Iterable[Path]:
    yield crop.path
    image = cv2.imread(str(crop.path))
    if image is None or image.size == 0:
        return

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    contrast = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
    contrast = cv2.cvtColor(contrast, cv2.COLOR_GRAY2BGR)
    contrast_path = crop.path.with_name(f"{crop.path.stem}-contrast{crop.path.suffix}")
    cv2.imwrite(str(contrast_path), contrast)
    yield contrast_path

    binary = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        9,
    )
    binary_path = crop.path.with_name(f"{crop.path.stem}-binary{crop.path.suffix}")
    cv2.imwrite(str(binary_path), cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR))
    yield binary_path


def _merge_refined_fields(current: CccdFields, candidate: CccdFields) -> CccdFields:
    return CccdFields(
        document_type=current.document_type or candidate.document_type,
        side=current.side if current.side != "UNKNOWN" else candidate.side,
        id_number=current.id_number or candidate.id_number,
        full_name=_prefer_text_field(current.full_name, candidate.full_name),
        date_of_birth=current.date_of_birth or candidate.date_of_birth,
        issue_date=current.issue_date or candidate.issue_date,
        expiry_date=current.expiry_date or candidate.expiry_date,
        place_of_origin=_prefer_address_field(
            current.place_of_origin,
            candidate.place_of_origin,
            other_current=current.place_of_residence,
        ),
        place_of_residence=_prefer_address_field(
            current.place_of_residence,
            candidate.place_of_residence,
            other_current=current.place_of_origin,
        ),
    )


def _prefer_address_field(
    current: str | None,
    candidate: str | None,
    *,
    other_current: str | None,
) -> str | None:
    if current and candidate and other_current:
        current_key = comparable_text(current)
        candidate_key = comparable_text(candidate)
        other_key = comparable_text(other_current)
        if (
            current_key
            and candidate_key
            and other_key
            and current_key in candidate_key
            and other_key in candidate_key
            and other_key not in current_key
        ):
            return current
    return _prefer_text_field(current, candidate)


def _prefer_text_field(current: str | None, candidate: str | None) -> str | None:
    if not current:
        return candidate
    if not candidate:
        return current
    current_key = comparable_text(current)
    candidate_key = comparable_text(candidate)
    if current_key and candidate_key:
        if current_key == candidate_key:
            if has_diacritics(candidate) and not has_diacritics(current):
                return candidate
            return current
        if current_key in candidate_key and len(candidate_key) > len(current_key):
            return candidate
        if candidate_key in current_key:
            return current
    return current


def _needs_refinement(fields: CccdFields) -> bool:
    if fields.side == "BACK":
        return not fields.issue_date
    return any(not getattr(fields, field) for field in TARGET_FIELDS)


def _should_refine_address_block(fields: CccdFields, layout: LayoutContext) -> bool:
    if fields.side == "BACK":
        return False
    if not fields.place_of_origin or not fields.place_of_residence:
        return True
    return not any(_is_residence_label(region.text) for region in layout.regions)


def _is_residence_label(text: str) -> bool:
    compact = comparable_text(text)
    return (
        "NOITHUONGTRU" in compact
        or "PLACEOFRESIDENCE" in compact
        or "PLACEOFRESIDEN" in compact
        or ("NOI" in compact and "TR" in compact and ("THUON" in compact or "THUONG" in compact))
    )


def _crop_satisfied(crop_name: str, fields: CccdFields) -> bool:
    if crop_name == "full_name":
        return bool(fields.full_name)
    if crop_name == "full_name_value":
        return bool(fields.full_name)
    if crop_name == "date_of_birth":
        return bool(fields.date_of_birth)
    if crop_name == "address_block":
        return bool(fields.place_of_origin and fields.place_of_residence)
    if crop_name == "issue_date":
        return bool(fields.issue_date)
    return False
