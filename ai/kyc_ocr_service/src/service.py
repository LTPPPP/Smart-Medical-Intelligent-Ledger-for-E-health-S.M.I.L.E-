from __future__ import annotations

import re
import tempfile
import os
from uuid import uuid4
from dataclasses import asdict
from pathlib import Path

from .card_preprocessor import CardPreprocessor
from .cccd_parser import parse_cccd_text
from .debug_overlay import write_ocr_box_overlay
from .field_ocr_refiner import FieldCropOcrRefiner
from .layout_address import merge_layout_address_fields
from .layout_context import build_layout_context
from .paddle_engine import PaddleOcrEngine
from .quality import ImageQualityAnalyzer
from .schemas import (
    CardPreprocessingMetadata,
    CccdFields,
    CccdDocumentOcrResponse,
    CccdOcrResponse,
    CheckResult,
)
from .vietocr_engine import create_default_ocr_engine


class CccdOcrService:
    def __init__(
        self,
        ocr_engine: PaddleOcrEngine | None = None,
        quality_analyzer: ImageQualityAnalyzer | None = None,
        card_preprocessor: CardPreprocessor | None = None,
    ):
        self.ocr_engine = ocr_engine or create_default_ocr_engine()
        self.quality_analyzer = quality_analyzer or ImageQualityAnalyzer()
        self.card_preprocessor = card_preprocessor or CardPreprocessor()

    def analyze_front(self, image_path: Path) -> CccdOcrResponse:
        with tempfile.TemporaryDirectory(prefix="smile-card-preprocess-") as temp_dir:
            preprocessed = self.card_preprocessor.preprocess(image_path, Path(temp_dir))
            lines = self.ocr_engine.recognize(preprocessed.ocr_path)
            parse_result = parse_cccd_text([line.text for line in lines])
            parsed_fields = merge_layout_address_fields(parse_result.fields, lines)
            layout = build_layout_context(lines)
            refined_fields = FieldCropOcrRefiner(self.ocr_engine).refine(
                preprocessed.ocr_path,
                layout=layout,
                current_fields=parsed_fields,
                output_dir=Path(temp_dir) / "field-ocr-crops",
            )
            fields = refined_fields
            debug_overlay_path = self._write_debug_overlay(preprocessed.ocr_path, lines)
            checks = dict(parse_result.checks)
            _refresh_core_field_checks(checks, fields)
            checks.update(preprocessed.checks)
            checks.update(
                _normalize_quality_checks(
                    self.quality_analyzer.analyze(preprocessed.quality_path),
                ),
            )
            risk_level = _merge_risk_level(parse_result.risk_level, checks)

            return CccdOcrResponse(
                engine=getattr(self.ocr_engine, "name", "paddleocr"),
                lines=lines,
                fields=fields,
                checks=checks,
                risk_level=risk_level,
                raw_text=parse_result.raw_text,
                layout=layout,
                debug_overlay_path=debug_overlay_path,
                preprocessing=CardPreprocessingMetadata.model_validate(
                    asdict(preprocessed.metadata),
                ),
            )

    def _write_debug_overlay(self, image_path: Path, lines) -> str | None:
        debug_dir = os.getenv("KYC_OCR_DEBUG_OVERLAY_DIR")
        if not debug_dir:
            return None
        target_path = Path(debug_dir) / f"{image_path.stem}-{uuid4().hex[:10]}-boxes.jpg"
        written = write_ocr_box_overlay(image_path, lines, target_path)
        return str(written) if written else None

    def analyze_document(
        self,
        front_path: Path,
        back_path: Path | None = None,
        expected_id_number: str | None = None,
        expected_date_of_birth: str | None = None,
    ) -> CccdDocumentOcrResponse:
        front = self.analyze_front(front_path)
        back = self.analyze_front(back_path) if back_path else None
        checks = _document_checks(front, back, expected_id_number, expected_date_of_birth)
        risk_level = _merge_document_risk(front, back, checks)
        return CccdDocumentOcrResponse(
            engine=getattr(self.ocr_engine, "name", "paddleocr"),
            front=front,
            back=back,
            checks=checks,
            risk_level=risk_level,
        )


def _normalize_quality_checks(checks: dict[str, CheckResult | dict]) -> dict[str, CheckResult]:
    normalized: dict[str, CheckResult] = {}
    for name, check in checks.items():
        normalized[name] = check if isinstance(check, CheckResult) else CheckResult(**check)
    return normalized


def _refresh_core_field_checks(checks: dict[str, CheckResult], fields: CccdFields) -> None:
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
        message="OCR result contains citizen ID document type."
        if fields.document_type
        else "OCR result does not contain citizen ID document type.",
        value=fields.document_type,
    )


def _merge_risk_level(current: str, checks: dict[str, CheckResult]) -> str:
    if any(check.status == "FAIL" for check in checks.values()):
        return "HIGH"
    side_hint_checks = {"FRONT_SIDE_HINT", "BACK_SIDE_HINT"}
    risk_relevant_checks = {
        name: check for name, check in checks.items() if name not in side_hint_checks
    }
    if current == "HIGH" or any(check.status == "WARNING" for check in risk_relevant_checks.values()):
        return "MEDIUM"
    return "LOW"


def _document_checks(
    front: CccdOcrResponse,
    back: CccdOcrResponse | None,
    expected_id_number: str | None = None,
    expected_date_of_birth: str | None = None,
) -> dict[str, CheckResult]:
    checks = {
        "FRONT_SIDE_PRESENT": CheckResult(
            status="PASS" if front.fields.side == "FRONT" else "WARNING",
            message="Front image looks like the front side."
            if front.fields.side == "FRONT"
            else "Front image does not strongly look like the front side.",
            value=front.fields.side,
        ),
    }
    if back is None:
        checks["BACK_SIDE_PRESENT"] = CheckResult(
            status="WARNING",
            message="Back image was not provided.",
            value=False,
        )
        return checks

    checks["BACK_SIDE_PRESENT"] = CheckResult(
        status="PASS" if back.fields.side == "BACK" else "WARNING",
        message="Back image looks like the back side."
        if back.fields.side == "BACK"
        else "Back image does not strongly look like the back side.",
        value=back.fields.side,
    )
    front_id = front.fields.id_number
    back_id = back.fields.id_number
    checks["FRONT_BACK_ID_MATCH"] = CheckResult(
        status="PASS" if front_id and back_id and front_id == back_id else "FAIL",
        message="Front ID number matches the MRZ/back side ID number."
        if front_id and back_id and front_id == back_id
        else "Front and back ID numbers do not match or one side is missing the ID number.",
        value=bool(front_id and back_id and front_id == back_id),
    )
    expected_id = _normalize_id_number(expected_id_number)
    if expected_id:
        checks["SUBMITTED_ID_MATCH"] = CheckResult(
            status="PASS" if front_id == expected_id else "FAIL",
            message="Submitted ID number matches OCR result."
            if front_id == expected_id
            else "Submitted ID number does not match OCR result.",
            value=bool(front_id == expected_id),
        )
    expected_dob = _normalize_date(expected_date_of_birth)
    if expected_dob:
        checks["SUBMITTED_DOB_MATCH"] = CheckResult(
            status="PASS" if front.fields.date_of_birth == expected_dob else "FAIL",
            message="Submitted date of birth matches OCR result."
            if front.fields.date_of_birth == expected_dob
            else "Submitted date of birth does not match OCR result.",
            value=bool(front.fields.date_of_birth == expected_dob),
        )
    return checks


def _merge_document_risk(
    front: CccdOcrResponse,
    back: CccdOcrResponse | None,
    checks: dict[str, CheckResult],
) -> str:
    if any(check.status == "FAIL" for check in checks.values()):
        return "HIGH"
    if front.risk_level == "HIGH" or (back and back.risk_level == "HIGH"):
        return "HIGH"
    if front.risk_level == "MEDIUM" or (back and back.risk_level == "MEDIUM"):
        return "MEDIUM"
    if any(check.status == "WARNING" for check in checks.values()):
        return "MEDIUM"
    return "LOW"


def _normalize_id_number(value: str | None) -> str | None:
    if not value:
        return None
    digits = re.sub(r"\D", "", value)
    return digits or None


def _normalize_date(value: str | None) -> str | None:
    if not value:
        return None
    value = value.strip()
    iso_match = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})$", value)
    if iso_match:
        year, month, day = iso_match.groups()
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
    local_match = re.match(r"^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$", value)
    if local_match:
        day, month, year = local_match.groups()
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
    return value
