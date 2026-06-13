from __future__ import annotations

import argparse
import json
import math
import re
import sys
import tempfile
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

import cv2
from PIL import Image

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from src.paddle_engine import PaddleOcrEngine
from src.service import CccdOcrService
from src.vietnamese_text import comparable_text
from src.vietocr_engine import VietOcrFirstEngine


FIELD_CLASS_MAP = {
    "name": "full_name",
    "full_name": "full_name",
    "id": "id_number",
    "id_number": "id_number",
    "dob": "date_of_birth",
    "date_of_birth": "date_of_birth",
    "origin_place": "place_of_origin",
    "origin": "place_of_origin",
    "current_place": "place_of_residence",
    "current_place1": "place_of_residence",
    "current_place2": "place_of_residence",
    "place_of_residence": "place_of_residence",
    "issue_date": "issue_date",
}


@dataclass(frozen=True)
class FieldBox:
    field: str
    bbox: tuple[int, int, int, int]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Evaluate S.M.I.L.E CCCD OCR against a local Roboflow COCO export."
    )
    parser.add_argument("dataset_dir", type=Path, help="Roboflow export directory containing _annotations.coco.json")
    parser.add_argument("--split", default="test", help="Split folder to evaluate, default test.")
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--lang", default="vi")
    parser.add_argument(
        "--engine",
        choices=("vietocr", "paddle"),
        default="vietocr",
        help="Recognition pipeline to evaluate. Default: vietocr.",
    )
    parser.add_argument("--output", type=Path, help="Optional JSON report path.")
    parser.add_argument("--reveal-sensitive", action="store_true", help="Print field values instead of masked samples.")
    args = parser.parse_args()

    annotation_path = _find_coco_annotations(args.dataset_dir, args.split)
    images_dir = annotation_path.parent
    images = _load_coco(annotation_path)
    engine = _create_engine(args.engine, args.lang)
    service = CccdOcrService(ocr_engine=engine)
    crop_engine = engine

    totals = defaultdict(int)
    matches = defaultdict(int)
    missing = defaultdict(int)
    samples = []

    for image_name, boxes in list(images.items())[: args.limit]:
        image_path = images_dir / image_name
        if not image_path.exists():
            continue
        response = service.analyze_front(image_path)
        expected = _extract_expected_from_boxes(image_path, boxes, crop_engine)
        actual = response.fields.model_dump()
        for field, expected_value in expected.items():
            totals[field] += 1
            actual_value = actual.get(field)
            if not actual_value:
                missing[field] += 1
            elif _field_matches(actual_value, expected_value):
                matches[field] += 1
        if len(samples) < 5:
            sample_fields = {
                field: {
                    "box_reference_present": bool(value),
                    "actual_present": bool(actual.get(field)),
                    "match": _field_matches(actual.get(field), value),
                }
                for field, value in expected.items()
            }
            if args.reveal_sensitive:
                for field, value in expected.items():
                    sample_fields[field]["box_reference"] = value
                    sample_fields[field]["actual"] = actual.get(field)
            samples.append({"image": image_name, "fields": sample_fields})

    report = {
        "annotation_path": str(annotation_path),
        "engine": args.engine,
        "reference": "OCR text recognized from annotated field boxes",
        "evaluated_images": min(len(images), args.limit),
        "fields": {
            field: {
                "total": totals[field],
                "matched": matches[field],
                "missing": missing[field],
                "match_rate": round(matches[field] / totals[field], 4) if totals[field] else None,
            }
            for field in sorted(totals)
        },
        "samples": samples,
    }
    encoded_report = json.dumps(report, ensure_ascii=True, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(encoded_report, encoding="utf-8")
    else:
        print(encoded_report)


def _create_engine(name: str, lang: str):
    if name == "paddle":
        return PaddleOcrEngine(lang=lang)
    return VietOcrFirstEngine(fallback_engine=PaddleOcrEngine(lang=lang))


def _find_coco_annotations(dataset_dir: Path, split: str) -> Path:
    candidates = [
        dataset_dir / split / "_annotations.coco.json",
        dataset_dir / "_annotations.coco.json",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"Could not find _annotations.coco.json under {dataset_dir}")


def _load_coco(annotation_path: Path) -> dict[str, list[FieldBox]]:
    payload = json.loads(annotation_path.read_text(encoding="utf-8"))
    categories = {item["id"]: FIELD_CLASS_MAP.get(str(item["name"]).lower()) for item in payload["categories"]}
    image_names = {item["id"]: item["file_name"] for item in payload["images"]}
    images: dict[str, list[FieldBox]] = defaultdict(list)
    for annotation in payload["annotations"]:
        field = categories.get(annotation["category_id"])
        image_name = image_names.get(annotation["image_id"])
        if not field or not image_name:
            continue
        x, y, width, height = annotation["bbox"]
        images[image_name].append(
            FieldBox(
                field=field,
                bbox=(
                    max(0, math.floor(x)),
                    max(0, math.floor(y)),
                    max(1, math.ceil(x + width)),
                    max(1, math.ceil(y + height)),
                ),
            )
        )
    return dict(images)


def _extract_expected_from_boxes(
    image_path: Path,
    boxes: list[FieldBox],
    crop_engine: PaddleOcrEngine,
) -> dict[str, str]:
    image = cv2.imread(str(image_path))
    if image is None:
        return {}
    expected_parts: dict[str, list[str]] = defaultdict(list)
    with tempfile.TemporaryDirectory(prefix="smile-roboflow-field-crops-") as temp_dir:
        temp_root = Path(temp_dir)
        for index, box in enumerate(sorted(boxes, key=lambda item: (item.field, item.bbox[1], item.bbox[0]))):
            x1, y1, x2, y2 = _clip_box(box.bbox, image.shape[1], image.shape[0])
            crop = image[y1:y2, x1:x2]
            if crop.size == 0:
                continue
            text = _recognize_crop_text(
                crop,
                crop_engine,
                temp_root / f"{index}-{box.field}.jpg",
            )
            if text:
                expected_parts[box.field].append(text)
    return {field: " ".join(parts) for field, parts in expected_parts.items()}


def _recognize_crop_text(
    crop,
    crop_engine,
    crop_path: Path | None = None,
) -> str:
    if isinstance(crop_engine, VietOcrFirstEngine):
        rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        result = crop_engine.recognizer.recognize(Image.fromarray(rgb))
        text = result[0] if isinstance(result, tuple) else result
        return str(text).strip()

    if crop_path is None:
        raise ValueError("crop_path is required for PaddleOCR crop recognition")
    cv2.imwrite(str(crop_path), crop)
    return " ".join(line.text for line in crop_engine.recognize(crop_path)).strip()


def _clip_box(bbox: tuple[int, int, int, int], width: int, height: int) -> tuple[int, int, int, int]:
    x1, y1, x2, y2 = bbox
    return max(0, x1), max(0, y1), min(width, x2), min(height, y2)


def _field_matches(actual: str | None, expected: str | None) -> bool:
    actual_date = _normalize_date(actual)
    expected_date = _normalize_date(expected)
    if actual_date and expected_date:
        return actual_date == expected_date

    actual_key = comparable_text(actual)
    expected_key = comparable_text(expected)
    if not actual_key or not expected_key:
        return False
    return actual_key in expected_key or expected_key in actual_key


def _normalize_date(value: str | None) -> str | None:
    if not value:
        return None
    text = value.strip()
    iso_match = re.search(r"(?<!\d)(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)", text)
    if iso_match:
        year, month, day = iso_match.groups()
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
    local_match = re.search(r"(?<!\d)(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?!\d)", text)
    if local_match:
        day, month, year = local_match.groups()
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
    return None


def _display(value: str | None, reveal: bool) -> str | None:
    if not value or reveal:
        return value
    if len(value) <= 4:
        return "*" * len(value)
    return value[:2] + "*" * max(1, len(value) - 4) + value[-2:]


if __name__ == "__main__":
    main()
