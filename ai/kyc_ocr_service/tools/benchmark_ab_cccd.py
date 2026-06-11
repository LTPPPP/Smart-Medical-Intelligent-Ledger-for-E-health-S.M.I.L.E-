from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import numpy as np

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from src.card_preprocessor import CardPreprocessor
from src.image_enhancement import OcrImageEnhancer
from src.paddle_engine import PaddleOcrEngine
from src.quality import ImageQualityAnalyzer
from src.schemas import CccdFields, CccdOcrResponse
from src.service import CccdOcrService
from src.vietocr_engine import VietOcrFirstEngine
from src.yolo_card_detector import YoloCardCornerDetector


FIELD_NAMES = (
    "document_type",
    "side",
    "id_number",
    "full_name",
    "date_of_birth",
    "issue_date",
    "expiry_date",
    "place_of_origin",
    "place_of_residence",
)
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
CORE_CHECKS = (
    "CARD_DETECTED",
    "CARD_AREA_RATIO",
    "CARD_ASPECT_RATIO",
    "PERSPECTIVE_CORRECTED",
    "OCR_IMAGE_UPSCALED",
    "RESOLUTION_OK",
    "BLUR_OK",
    "BRIGHTNESS_OK",
    "GLARE_SUSPECTED",
    "SCREENSHOT_SUSPECTED",
    "ID_NUMBER_FOUND",
    "DOB_FOUND",
    "DOCUMENT_TYPE_HINT",
)


@dataclass(frozen=True)
class VariantResult:
    variant: str
    image: str
    summary: dict[str, Any]


class PassthroughEnhancer:
    def enhance(self, image: np.ndarray) -> np.ndarray:
        return image.copy()


class MissingCornerDetector:
    def detect_corners(self, image: np.ndarray) -> None:
        return None


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Benchmark CCCD OCR A/B variants without printing sensitive OCR payloads."
    )
    parser.add_argument("paths", nargs="+", type=Path, help="Image files or directories.")
    parser.add_argument("--limit", type=int, default=30)
    parser.add_argument("--lang", default="vi")
    parser.add_argument("--yolo-model", type=Path, default=_default_yolo_model())
    parser.add_argument("--include-vietocr", action="store_true")
    parser.add_argument("--reveal-sensitive", action="store_true")
    args = parser.parse_args()

    images = discover_images(args.paths, args.limit)
    if not images:
        raise SystemExit("No supported image files found.")

    results = run_benchmark(
        images=images,
        lang=args.lang,
        yolo_model=args.yolo_model,
        include_vietocr=args.include_vietocr,
        reveal_sensitive=args.reveal_sensitive,
    )
    report = {
        "images": [path.name for path in images],
        "variants": sorted({result.variant for result in results}),
        "aggregate": aggregate_results(results),
        "results": [
            {
                "variant": result.variant,
                "image": result.image,
                **result.summary,
            }
            for result in results
        ],
        "failures": masked_failure_summary(results, reveal_sensitive=args.reveal_sensitive),
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))


def discover_images(paths: Iterable[Path], limit: int) -> list[Path]:
    images: list[Path] = []
    for path in paths:
        if path.is_dir():
            images.extend(
                child
                for child in sorted(path.iterdir())
                if child.is_file() and child.suffix.lower() in IMAGE_EXTENSIONS
            )
        elif path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            images.append(path)
    return images[:limit]


def run_benchmark(
    *,
    images: list[Path],
    lang: str,
    yolo_model: Path | None,
    include_vietocr: bool,
    reveal_sensitive: bool = False,
) -> list[VariantResult]:
    variants = _build_services(
        lang=lang,
        yolo_model=yolo_model,
        include_vietocr=include_vietocr,
    )
    results: list[VariantResult] = []
    for variant_name, service in variants:
        for image_path in images:
            start = time.perf_counter()
            try:
                response = service.analyze_front(image_path)
                summary = summarize_response(
                    response,
                    elapsed_seconds=time.perf_counter() - start,
                    reveal_sensitive=reveal_sensitive,
                )
            except Exception as error:
                summary = {
                    "elapsed_seconds": round(time.perf_counter() - start, 3),
                    "error": f"{type(error).__name__}: {error}",
                    "fields_found": {field: False for field in FIELD_NAMES},
                }
            results.append(VariantResult(variant_name, image_path.name, summary))
    return results


def summarize_response(
    response: CccdOcrResponse,
    elapsed_seconds: float,
    *,
    reveal_sensitive: bool = False,
) -> dict[str, Any]:
    fields = response.fields.model_dump()
    fields_found = {
        field: _field_is_present(field, fields.get(field))
        for field in FIELD_NAMES
    }
    return {
        "elapsed_seconds": round(elapsed_seconds, 3),
        "risk_level": response.risk_level,
        "side": response.fields.side,
        "line_count": len(response.lines),
        "fields_found": fields_found,
        "field_preview": _masked(
            {field: fields.get(field) for field in FIELD_NAMES},
            reveal_sensitive,
        ),
        "checks": {
            name: response.checks[name].status
            for name in CORE_CHECKS
            if name in response.checks
        },
        "preprocessing": {
            "card_detected": response.preprocessing.card_detected,
            "perspective_corrected": response.preprocessing.perspective_corrected,
            "card_area_ratio": response.preprocessing.card_area_ratio,
            "card_aspect_ratio": response.preprocessing.card_aspect_ratio,
            "quality_image_size": response.preprocessing.quality_image_size,
            "ocr_image_size": response.preprocessing.ocr_image_size,
        },
    }


def aggregate_results(results: list[VariantResult]) -> dict[str, Any]:
    aggregate: dict[str, Any] = {}
    for result in results:
        entry = aggregate.setdefault(
            result.variant,
            {
                "images": 0,
                "avg_elapsed_seconds": 0.0,
                "risk_levels": {},
                "fields": {
                    field: {"found": 0, "found_rate": 0.0}
                    for field in FIELD_NAMES
                },
            },
        )
        entry["images"] += 1
        entry["avg_elapsed_seconds"] += float(result.summary.get("elapsed_seconds") or 0)
        risk = result.summary.get("risk_level") or "ERROR"
        entry["risk_levels"][risk] = entry["risk_levels"].get(risk, 0) + 1
        for field, found in result.summary.get("fields_found", {}).items():
            if field not in entry["fields"]:
                entry["fields"][field] = {"found": 0, "found_rate": 0.0}
            if found:
                entry["fields"][field]["found"] += 1

    for entry in aggregate.values():
        images = max(1, int(entry["images"]))
        entry["avg_elapsed_seconds"] = round(entry["avg_elapsed_seconds"] / images, 3)
        for field_summary in entry["fields"].values():
            field_summary["found_rate"] = round(field_summary["found"] / images, 4)
    return aggregate


def masked_failure_summary(
    results: list[VariantResult],
    *,
    reveal_sensitive: bool,
    max_failures: int = 20,
) -> list[dict[str, Any]]:
    failures: list[dict[str, Any]] = []
    for result in results:
        missing_fields = _missing_required_fields(result.summary)
        if not missing_fields and not result.summary.get("error"):
            continue
        failures.append(
            {
                "variant": result.variant,
                "image": result.image,
                "missing_fields": missing_fields,
                "error": result.summary.get("error"),
                "risk_level": result.summary.get("risk_level"),
                "field_preview": _masked(result.summary.get("field_preview", {}), reveal_sensitive),
            }
        )
        if len(failures) >= max_failures:
            break
    return failures


def _missing_required_fields(summary: dict[str, Any]) -> list[str]:
    fields_found = summary.get("fields_found", {})
    side = summary.get("side")
    if side == "BACK":
        required = {
            "document_type",
            "side",
            "id_number",
            "full_name",
            "date_of_birth",
            "issue_date",
            "expiry_date",
        }
    elif side == "FRONT":
        required = {
            "document_type",
            "side",
            "id_number",
            "full_name",
            "date_of_birth",
            "place_of_origin",
            "place_of_residence",
        }
    else:
        required = {"document_type", "side", "id_number", "full_name", "date_of_birth"}
    return [field for field in FIELD_NAMES if field in required and not fields_found.get(field)]


def _build_services(
    *,
    lang: str,
    yolo_model: Path | None,
    include_vietocr: bool,
) -> list[tuple[str, CccdOcrService]]:
    quality_analyzer = ImageQualityAnalyzer()
    services = [
        (
            "opencv",
            _service(
                lang=lang,
                preprocessor=CardPreprocessor(
                    image_enhancer=PassthroughEnhancer(),
                    card_corner_detector=MissingCornerDetector(),
                ),
                quality_analyzer=quality_analyzer,
                ocr_engine=PaddleOcrEngine(lang=lang),
            ),
        ),
    ]

    if yolo_model and yolo_model.exists():
        yolo_detector = YoloCardCornerDetector(yolo_model)
        services.append(
            (
                "yolo_enhanced",
                _service(
                    lang=lang,
                    preprocessor=CardPreprocessor(
                        image_enhancer=OcrImageEnhancer(),
                        card_corner_detector=yolo_detector,
                    ),
                    quality_analyzer=quality_analyzer,
                    ocr_engine=PaddleOcrEngine(lang=lang),
                ),
            )
        )
        if include_vietocr:
            services.append(
                (
                    "yolo_enhanced_vietocr",
                    _service(
                        lang=lang,
                        preprocessor=CardPreprocessor(
                            image_enhancer=OcrImageEnhancer(),
                            card_corner_detector=YoloCardCornerDetector(yolo_model),
                        ),
                        quality_analyzer=quality_analyzer,
                        ocr_engine=VietOcrFirstEngine(
                            fallback_engine=PaddleOcrEngine(lang=lang),
                        ),
                    ),
                )
            )
    return services


def _service(
    *,
    lang: str,
    preprocessor: CardPreprocessor,
    quality_analyzer: ImageQualityAnalyzer,
    ocr_engine: Any,
) -> CccdOcrService:
    return CccdOcrService(
        ocr_engine=ocr_engine,
        quality_analyzer=quality_analyzer,
        card_preprocessor=preprocessor,
    )


def _field_is_present(field: str, value: Any) -> bool:
    if field == "side":
        return value in {"FRONT", "BACK"}
    return bool(value)


def _masked(value: Any, reveal_sensitive: bool) -> Any:
    if reveal_sensitive:
        return value
    if isinstance(value, dict):
        return {key: _masked(nested, reveal_sensitive) for key, nested in value.items()}
    if isinstance(value, list):
        return [_masked(nested, reveal_sensitive) for nested in value]
    if isinstance(value, str):
        return _mask_text(value)
    return value


def _mask_text(text: str) -> str:
    digits = [char for char in text if char.isdigit()]
    if len(digits) >= 8:
        result = []
        seen = 0
        for char in text:
            if char.isdigit():
                seen += 1
                result.append(char if seen > len(digits) - 4 else "*")
            else:
                result.append(char)
        return "".join(result)
    if len(text) <= 4:
        return "*" * len(text)
    return text[:2] + "*" * max(1, len(text) - 4) + text[-2:]


def _default_yolo_model() -> Path | None:
    env_path = os.getenv("KYC_CARD_YOLO_MODEL")
    if env_path:
        return Path(env_path)
    candidate = SERVICE_ROOT / "models" / "model_crop.pt"
    return candidate if candidate.exists() else None


if __name__ == "__main__":
    main()
