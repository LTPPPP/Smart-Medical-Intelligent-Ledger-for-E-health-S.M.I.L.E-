from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image

from .card_preprocessor import InvalidImageError
from .cccd_parser import parse_cccd_text
from .schemas import (
    CardPreprocessingMetadata,
    CccdFields,
    CccdOcrResponse,
    CheckResult,
    LayoutContext,
    OcrLine,
    TextRegion,
)
from .vietocr_engine import LazyVietOcrRecognizer
from .vietnamese_text import clean_human_text


@dataclass(frozen=True)
class _CropItem:
    label: str
    image: Image.Image
    bbox: list[list[float]]
    y: int
    x: int


class FastCccdOcrEngine:
    name = "scanocr-onnx-vietocr-fast"

    def __init__(
        self,
        *,
        field_model_path: Path | None = None,
        recognizer: Any | None = None,
        confidence_threshold: float = 0.25,
    ):
        self.field_model_path = field_model_path or _default_field_model_path()
        self.confidence_threshold = confidence_threshold
        self.recognizer = recognizer or LazyVietOcrRecognizer(beamsearch=False)
        self._field_model: Any | None = None

    def warm_up(self) -> None:
        self._get_field_model()
        batch_recognize = getattr(self.recognizer, "recognize_batch", None)
        dummy = Image.fromarray(np.full((32, 160, 3), 255, dtype=np.uint8))
        if callable(batch_recognize):
            batch_recognize([dummy])
        else:
            self.recognizer.recognize(dummy)

    def analyze_side(self, image_path: Path, expected_side: str) -> CccdOcrResponse:
        image = cv2.imread(str(image_path))
        if image is None or image.size == 0:
            raise InvalidImageError("Image cannot be decoded")

        if expected_side == "BACK":
            return self._analyze_back(image_path, image)
        return self._analyze_front(image_path, image)

    def _analyze_front(self, image_path: Path, image) -> CccdOcrResponse:
        crop_items = self._front_model_crops(image_path, image)
        detector_source = "onnx"
        if not crop_items:
            crop_items = _front_fixed_roi_crops(image)
            detector_source = "fixed-roi"

        lines = self._recognize_crops(crop_items)
        grouped = _group_lines_by_label(lines)
        parse_result = parse_cccd_text([line.text for line in lines])
        fields = CccdFields(
            document_type="CITIZEN_ID",
            side="FRONT",
            id_number=_extract_id(grouped.get("ID_Number")) or parse_result.fields.id_number,
            full_name=_clean_name(grouped.get("Full_Name")) or parse_result.fields.full_name,
            date_of_birth=_extract_date(grouped.get("DOB"), "date_of_birth")
            or parse_result.fields.date_of_birth,
            place_of_origin=_clean_address(grouped.get("Hometown"))
            or parse_result.fields.place_of_origin,
            place_of_residence=_clean_address(grouped.get("Address"))
            or parse_result.fields.place_of_residence,
        )
        checks = _checks_for_fields(fields)
        checks["KYC_FAST_FIELD_DETECTOR"] = CheckResult(
            status="PASS" if detector_source == "onnx" else "WARNING",
            message="ONNX field detector produced front-side regions."
            if detector_source == "onnx"
            else "Fixed front-side ROI regions were used because ONNX field regions were unavailable.",
            value=detector_source,
        )
        return _response(self.name, image, lines, fields, checks)

    def _analyze_back(self, image_path: Path, image) -> CccdOcrResponse:
        crop_items = _back_fixed_roi_crops(image)
        lines = self._recognize_crops(crop_items)
        text_lines = ["DAC DIEM NHAN DANG", "NGAY THANG NAM"]
        for line in lines:
            if line.text.startswith("mrz_"):
                label, _, value = line.text.partition(":")
                text_lines.append(_sanitize_mrz(value))
            else:
                text_lines.append(line.text)

        parse_result = parse_cccd_text(text_lines)
        issue_date = parse_result.fields.issue_date
        if not issue_date:
            issue_date = _extract_date(_group_lines_by_label(lines).get("issue_date"), "issue_date")
        fields = parse_result.fields.model_copy(
            update={
                "document_type": "CITIZEN_ID",
                "side": "BACK",
                "issue_date": issue_date or parse_result.fields.issue_date,
            },
        )
        checks = _checks_for_fields(fields)
        checks["KYC_FAST_BACK_ROI"] = CheckResult(
            status="PASS",
            message="Back-side MRZ and issue-date regions were read from deterministic CCCD ROIs.",
            value=True,
        )
        return _response(self.name, image, lines, fields, checks)

    def _front_model_crops(self, image_path: Path, image) -> list[_CropItem]:
        model = self._get_field_model()
        if model is None:
            return []
        try:
            detections = model(str(image_path), verbose=False)[0]
        except Exception:
            return []

        crop_items: list[_CropItem] = []
        names = getattr(detections, "names", {})
        for box in detections.boxes:
            confidence = float(box.conf[0]) if getattr(box, "conf", None) is not None else 1.0
            if confidence < self.confidence_threshold:
                continue
            label = names.get(int(box.cls[0]), str(int(box.cls[0])))
            if label not in _FRONT_LABELS:
                continue
            x1, y1, x2, y2 = [int(value) for value in box.xyxy[0].tolist()]
            crop = _crop_image(image, x1, y1, x2, y2, pad_x=0.04, pad_y=0.20)
            if crop:
                crop_items.append(_CropItem(label, crop[0], crop[1], y1, x1))
        return sorted(crop_items, key=lambda item: (item.y, item.x))

    def _get_field_model(self):
        if self._field_model is not None:
            return self._field_model
        if not self.field_model_path or not self.field_model_path.exists():
            return None
        try:
            from ultralytics import YOLO

            self._field_model = YOLO(str(self.field_model_path), task="detect")
        except Exception:
            self._field_model = None
        return self._field_model

    def _recognize_crops(self, crop_items: list[_CropItem]) -> list[OcrLine]:
        if not crop_items:
            return []
        batch_recognize = getattr(self.recognizer, "recognize_batch", None)
        if callable(batch_recognize):
            recognized = batch_recognize([item.image for item in crop_items])
        else:
            recognized = [self.recognizer.recognize(item.image) for item in crop_items]

        lines: list[OcrLine] = []
        for item, result in zip(crop_items, recognized, strict=True):
            text = _recognized_text(result)
            if not text:
                continue
            lines.append(
                OcrLine(
                    text=f"{item.label}: {text}",
                    confidence=None,
                    bbox=item.bbox,
                ),
            )
        return lines


_FRONT_LABELS = {
    "ID_Number",
    "Full_Name",
    "DOB",
    "Hometown",
    "Address",
}


def _default_field_model_path() -> Path | None:
    configured = os.getenv("KYC_FIELD_YOLO_ONNX_MODEL")
    if configured:
        return Path(configured)
    repo_root = Path(__file__).resolve().parents[3]
    return repo_root / "models" / "scanocr-identity-vi" / "yolo_v11_best.onnx"


def _front_fixed_roi_crops(image) -> list[_CropItem]:
    rois = (
        ("ID_Number", 0.40, 0.34, 0.79, 0.45),
        ("Full_Name", 0.30, 0.46, 0.78, 0.56),
        ("DOB", 0.52, 0.56, 0.79, 0.65),
        ("Hometown", 0.30, 0.68, 0.88, 0.79),
        ("Address", 0.30, 0.79, 0.94, 0.93),
    )
    return _ratio_crops(image, rois)


def _back_fixed_roi_crops(image) -> list[_CropItem]:
    rois = (
        ("issue_date", 0.02, 0.11, 0.56, 0.20),
        ("mrz_1", 0.03, 0.66, 0.97, 0.75),
        ("mrz_2", 0.03, 0.75, 0.97, 0.84),
    )
    return _ratio_crops(image, rois)


def _ratio_crops(image, rois: tuple[tuple[str, float, float, float, float], ...]) -> list[_CropItem]:
    height, width = image.shape[:2]
    crops: list[_CropItem] = []
    for label, left, top, right, bottom in rois:
        x1 = int(width * left)
        y1 = int(height * top)
        x2 = int(width * right)
        y2 = int(height * bottom)
        crop = _crop_image(image, x1, y1, x2, y2, pad_x=0.0, pad_y=0.0)
        if crop:
            crops.append(_CropItem(label, crop[0], crop[1], y1, x1))
    return crops


def _crop_image(image, x1: int, y1: int, x2: int, y2: int, *, pad_x: float, pad_y: float):
    height, width = image.shape[:2]
    box_width = max(1, x2 - x1)
    box_height = max(1, y2 - y1)
    px = max(2, int(box_width * pad_x)) if pad_x else 0
    py = max(2, int(box_height * pad_y)) if pad_y else 0
    x1 = max(0, x1 - px)
    y1 = max(0, y1 - py)
    x2 = min(width, x2 + px)
    y2 = min(height, y2 + py)
    if x2 <= x1 or y2 <= y1:
        return None
    crop = image[y1:y2, x1:x2]
    if crop.size == 0:
        return None
    rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    return (
        Image.fromarray(rgb),
        [
            [float(x1), float(y1)],
            [float(x2), float(y1)],
            [float(x2), float(y2)],
            [float(x1), float(y2)],
        ],
    )


def _recognized_text(value: str | tuple[str, float | None]) -> str:
    text = value[0] if isinstance(value, tuple) and value else value
    return str(text).strip()


def _group_lines_by_label(lines: list[OcrLine]) -> dict[str, str]:
    grouped: dict[str, list[str]] = {}
    for line in lines:
        label, separator, text = line.text.partition(":")
        if not separator:
            continue
        value = text.strip()
        if value:
            grouped.setdefault(label.strip(), []).append(value)
    return {label: " ".join(values).strip() for label, values in grouped.items()}


def _extract_id(text: str | None) -> str | None:
    if not text:
        return None
    match = re.search(r"\d(?:\D?\d){11}", text)
    if not match:
        return None
    digits = re.sub(r"\D", "", match.group(0))
    return digits if len(digits) == 12 else None


def _extract_date(text: str | None, kind: str) -> str | None:
    if not text:
        return None
    if kind == "date_of_birth":
        return parse_cccd_text([f"Ngay sinh / Date of birth: {text}"]).fields.date_of_birth
    if kind == "issue_date":
        return parse_cccd_text([f"Ngay, thang, nam / Date, month, year: {text}"]).fields.issue_date
    return parse_cccd_text([text]).fields.date_of_birth


def _clean_name(text: str | None) -> str | None:
    return clean_human_text(text or "", allowed_punctuation=" -'")


def _clean_address(text: str | None) -> str | None:
    return clean_human_text(text or "", allowed_punctuation=" ,./-")


def _sanitize_mrz(text: str) -> str:
    value = re.sub(r"\s+", "", text.upper())
    return (
        value.replace("«", "<")
        .replace("‹", "<")
        .replace(">", "<")
        .replace(" ", "")
    )


def _checks_for_fields(fields: CccdFields) -> dict[str, CheckResult]:
    checks = parse_cccd_text(_field_hint_lines(fields)).checks
    checks["ID_NUMBER_FOUND"] = CheckResult(
        status="PASS" if fields.id_number else "FAIL",
        message="Found a 12-digit Vietnamese citizen ID number."
        if fields.id_number
        else "Could not find a 12-digit Vietnamese citizen ID number.",
        value=fields.id_number,
    )
    checks["DOB_FOUND"] = CheckResult(
        status="PASS" if fields.date_of_birth or fields.side == "BACK" else "WARNING",
        message="Found date of birth."
        if fields.date_of_birth
        else "Date of birth is not required on the back side."
        if fields.side == "BACK"
        else "Could not find date of birth.",
        value=fields.date_of_birth,
    )
    checks["DOCUMENT_TYPE_HINT"] = CheckResult(
        status="PASS" if fields.document_type else "FAIL",
        message="Fast OCR result contains citizen ID document type."
        if fields.document_type
        else "Fast OCR result does not contain citizen ID document type.",
        value=fields.document_type,
    )
    checks["FRONT_SIDE_HINT"] = CheckResult(
        status="PASS" if fields.side == "FRONT" else "WARNING",
        message="Fast OCR result looks like the front side."
        if fields.side == "FRONT"
        else "Front side keywords were not dominant.",
        value=fields.side,
    )
    checks["BACK_SIDE_HINT"] = CheckResult(
        status="PASS" if fields.side == "BACK" else "WARNING",
        message="Fast OCR result looks like the back side."
        if fields.side == "BACK"
        else "Back side keywords were not dominant.",
        value=fields.side,
    )
    return checks


def _field_hint_lines(fields: CccdFields) -> list[str]:
    hints = ["CAN CUOC CONG DAN" if fields.side == "FRONT" else "DAC DIEM NHAN DANG"]
    if fields.id_number:
        hints.append(fields.id_number)
    if fields.date_of_birth:
        hints.append(fields.date_of_birth)
    return hints


def _response(
    engine: str,
    image,
    lines: list[OcrLine],
    fields: CccdFields,
    checks: dict[str, CheckResult],
) -> CccdOcrResponse:
    raw_text = "\n".join(line.text for line in lines)
    layout = LayoutContext(
        regions=[
            TextRegion(
                index=index,
                text=line.text,
                confidence=line.confidence,
                bbox=line.bbox,
            )
            for index, line in enumerate(lines)
        ],
        mrz_candidates=[
            _sanitize_mrz(line.text.partition(":")[2])
            for line in lines
            if line.text.startswith("mrz_")
        ],
    )
    return CccdOcrResponse(
        engine=engine,
        lines=lines,
        fields=fields,
        checks=checks,
        risk_level=_risk_level(checks),
        raw_text=raw_text,
        layout=layout,
        preprocessing=_metadata_for_image(image, card_detected=bool(lines)),
    )


def _empty_response(
    *,
    engine: str,
    side: str,
    checks: dict[str, CheckResult],
) -> CccdOcrResponse:
    fields = CccdFields(side=side)
    checks = {**checks, **_checks_for_fields(fields)}
    return CccdOcrResponse(
        engine=engine,
        fields=fields,
        checks=checks,
        risk_level="HIGH",
    )


def _metadata_for_image(image, *, card_detected: bool) -> CardPreprocessingMetadata:
    height, width = image.shape[:2]
    size = f"{width}x{height}"
    return CardPreprocessingMetadata(
        card_detected=card_detected,
        card_corners=[],
        card_area_ratio=0.0,
        card_aspect_ratio=None,
        perspective_corrected=False,
        ocr_image_upscaled=False,
        source_size=size,
        quality_image_size=size,
        ocr_image_size=size,
    )


def _risk_level(checks: dict[str, CheckResult]) -> str:
    if any(check.status == "FAIL" for check in checks.values()):
        return "HIGH"
    side_hint_checks = {"FRONT_SIDE_HINT", "BACK_SIDE_HINT"}
    risk_checks = {name: check for name, check in checks.items() if name not in side_hint_checks}
    if any(check.status == "WARNING" for check in risk_checks.values()):
        return "MEDIUM"
    return "LOW"
