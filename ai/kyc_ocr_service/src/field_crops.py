from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

from .schemas import LayoutContext, TextRegion
from .vietnamese_text import compact_for_match


@dataclass(frozen=True)
class FieldCrop:
    name: str
    path: Path
    bbox: list[list[float]]
    text_hint: str


def build_field_crops(
    image_path: Path,
    layout: LayoutContext,
    output_dir: Path,
) -> list[FieldCrop]:
    image = cv2.imread(str(image_path))
    if image is None:
        return []

    regions = [region for region in layout.regions if region.bbox]
    if not regions:
        return []

    output_dir.mkdir(parents=True, exist_ok=True)
    crops: list[FieldCrop] = []
    full_name_regions = _span_after_label(
        regions,
        label_predicate=_is_full_name_label,
        stop_predicate=_is_after_full_name_stop,
    )
    if full_name_regions:
        crop = _write_crop(
            "full_name",
            image,
            full_name_regions,
            output_dir,
            rect=_planned_full_name_rect(regions, full_name_regions, image.shape[:2]),
        )
        if crop:
            crops.append(crop)

    address_regions = _address_block(regions)
    if address_regions:
        crop = _write_crop(
            "address_block",
            image,
            address_regions,
            output_dir,
            rect=_planned_address_rect(regions, address_regions, image.shape[:2]),
        )
        if crop:
            crops.append(crop)

    return crops


def _span_after_label(
    regions: list[TextRegion],
    *,
    label_predicate,
    stop_predicate,
) -> list[TextRegion]:
    label_index = _first_index(regions, label_predicate)
    if label_index is None:
        return []

    selected: list[TextRegion] = [regions[label_index]]
    label_y = _center_y(regions[label_index])
    for region in regions[label_index + 1 :]:
        if stop_predicate(region):
            break
        if _center_y(region) >= label_y - 8:
            selected.append(region)
    return selected


def _address_block(regions: list[TextRegion]) -> list[TextRegion]:
    start = _first_index(regions, lambda region: _is_origin_label(region) or _is_residence_label(region))
    if start is None:
        return []

    selected: list[TextRegion] = []
    for region in regions[start:]:
        if selected and _is_after_address_stop(region):
            break
        selected.append(region)
    return selected


def _write_crop(
    name: str,
    image: np.ndarray,
    regions: list[TextRegion],
    output_dir: Path,
    rect: tuple[int, int, int, int] | None = None,
) -> FieldCrop | None:
    height, width = image.shape[:2]
    bbox = rect or _union_bbox(regions)
    if not bbox:
        return None

    x1, y1, x2, y2 = bbox
    pad_x = max(24, int(width * 0.02))
    pad_y = max(14, int(height * 0.02))
    x1 = max(0, x1 - pad_x)
    y1 = max(0, y1 - pad_y)
    x2 = min(width, x2 + pad_x)
    y2 = min(height, y2 + pad_y)
    if x2 <= x1 or y2 <= y1:
        return None

    crop_image = image[y1:y2, x1:x2]
    target_path = output_dir / f"{name}.jpg"
    cv2.imwrite(str(target_path), crop_image)
    return FieldCrop(
        name=name,
        path=target_path,
        bbox=[
            [float(x1), float(y1)],
            [float(x2), float(y1)],
            [float(x2), float(y2)],
            [float(x1), float(y2)],
        ],
        text_hint=" ".join(region.text for region in regions).strip(),
    )


def _planned_full_name_rect(
    regions: list[TextRegion],
    selected: list[TextRegion],
    image_shape: tuple[int, int],
) -> tuple[int, int, int, int] | None:
    label = selected[0] if selected else None
    if not label or not label.bbox:
        return _union_bbox(selected)
    height, width = image_shape
    left, top, _, bottom = _region_box(label)
    stop_top = _next_region_top(regions, label.index, _is_after_full_name_stop)
    y2 = int(stop_top) if stop_top is not None else int(bottom + (_region_height(label) * 3.0))
    return int(left), int(top), width, min(height, max(y2, int(bottom + _region_height(label) * 2.2)))


def _planned_address_rect(
    regions: list[TextRegion],
    selected: list[TextRegion],
    image_shape: tuple[int, int],
) -> tuple[int, int, int, int] | None:
    label = selected[0] if selected else None
    if not label or not label.bbox:
        return _union_bbox(selected)
    height, width = image_shape
    left, top, _, bottom = _region_box(label)
    stop_top = _next_region_top(regions, label.index, _is_after_address_stop)
    y2 = int(stop_top) if stop_top is not None else height
    return int(left), int(top), width, min(height, max(y2, int(bottom + _region_height(label) * 4.0)))


def _union_bbox(regions: list[TextRegion]) -> tuple[int, int, int, int] | None:
    points: list[tuple[float, float]] = []
    for region in regions:
        if not region.bbox:
            continue
        points.extend((float(x), float(y)) for x, y in region.bbox)
    if not points:
        return None
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    return int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))


def _next_region_top(regions: list[TextRegion], after_index: int, predicate) -> float | None:
    for region in sorted(regions, key=lambda item: item.index):
        if region.index <= after_index or not region.bbox:
            continue
        if predicate(region):
            return _region_box(region)[1]
    return None


def _region_box(region: TextRegion) -> tuple[float, float, float, float]:
    xs = [float(point[0]) for point in region.bbox or []]
    ys = [float(point[1]) for point in region.bbox or []]
    return min(xs), min(ys), max(xs), max(ys)


def _region_height(region: TextRegion) -> float:
    _, top, _, bottom = _region_box(region)
    return max(1.0, bottom - top)


def _first_index(regions: list[TextRegion], predicate) -> int | None:
    for index, region in enumerate(regions):
        if predicate(region):
            return index
    return None


def _normalized(region: TextRegion) -> str:
    return compact_for_match(region.text)


def _is_full_name_label(region: TextRegion) -> bool:
    text = _normalized(region)
    return "HOVATEN" in text or "FULLNAME" in text


def _is_origin_label(region: TextRegion) -> bool:
    text = _normalized(region)
    return "QUEQUAN" in text or "PLACEOFORIGIN" in text


def _is_residence_label(region: TextRegion) -> bool:
    text = _normalized(region)
    return (
        "NOITHUONGTRU" in text
        or "PLACEOFRESIDENCE" in text
        or "PLACEOFRESIDEN" in text
        or ("NOI" in text and "TR" in text and ("THUON" in text or "THUONG" in text))
    )


def _is_after_full_name_stop(region: TextRegion) -> bool:
    text = _normalized(region)
    return any(
        token in text
        for token in (
            "NGAYSINH",
            "DATEOFBIRTH",
            "GIOITINH",
            "SEX",
            "QUOCTICH",
            "NATIONALITY",
            "QUEQUAN",
            "PLACEOFORIGIN",
        )
    )


def _is_after_address_stop(region: TextRegion) -> bool:
    text = _normalized(region)
    return any(
        token in text
        for token in (
            "DACDIEM",
            "NHANDANG",
        )
    )


def _center_y(region: TextRegion) -> float:
    if not region.bbox:
        return 0.0
    return sum(float(point[1]) for point in region.bbox) / len(region.bbox)
