from pathlib import Path

from src.schemas import OcrLine
from src.service import CccdOcrService


class FakeOcrEngine:
    def recognize(self, image_path: Path):
        if image_path.name == "back.jpg":
            return [
                OcrLine(text="DAC DIEM NHAN DANG", confidence=0.94),
                OcrLine(text="Ngay, thang, nam 01/02/2020", confidence=0.93),
                OcrLine(text="IDVNM1234567890012345678901<<<3", confidence=0.95),
            ]
        return [
            OcrLine(text="CAN CUOC CONG DAN", confidence=0.94),
            OcrLine(text="So / No: 012345678901", confidence=0.97),
            OcrLine(text="Ho va ten / Full name: NGUYEN VAN A", confidence=0.92),
            OcrLine(text="Ngay sinh / Date of birth: 01/01/1990", confidence=0.91),
        ]


class FakeQualityAnalyzer:
    def analyze(self, image_path: Path):
        return {
            "RESOLUTION_OK": {"status": "PASS", "message": "Resolution is sufficient."},
            "BLUR_OK": {"status": "PASS", "message": "Image sharpness is acceptable."},
            "BRIGHTNESS_OK": {"status": "PASS", "message": "Brightness is acceptable."},
            "GLARE_SUSPECTED": {"status": "PASS", "message": "No strong glare detected."},
            "SCREENSHOT_SUSPECTED": {"status": "PASS", "message": "No screenshot-like border detected."},
        }


def test_service_returns_structured_paddleocr_assessment():
    service = CccdOcrService(FakeOcrEngine(), FakeQualityAnalyzer())

    result = service.analyze_front(Path("front.jpg"))

    assert result.engine == "paddleocr"
    assert result.fields.id_number == "012345678901"
    assert result.risk_level == "LOW"
    assert result.checks["ID_NUMBER_FOUND"].status == "PASS"
    assert result.checks["RESOLUTION_OK"].status == "PASS"


def test_service_analyzes_front_and_back_with_matching_id():
    service = CccdOcrService(FakeOcrEngine(), FakeQualityAnalyzer())

    result = service.analyze_document(
        Path("front.jpg"),
        Path("back.jpg"),
        expected_id_number="012345678901",
        expected_date_of_birth="1990-01-01",
    )

    assert result.risk_level == "LOW"
    assert result.front.fields.id_number == "012345678901"
    assert result.back.fields.id_number == "012345678901"
    assert result.back.fields.issue_date == "2020-02-01"
    assert result.checks["FRONT_BACK_ID_MATCH"].status == "PASS"
    assert result.checks["SUBMITTED_ID_MATCH"].status == "PASS"
    assert result.checks["SUBMITTED_DOB_MATCH"].status == "PASS"


def test_service_marks_mismatched_front_back_id_as_high_risk():
    class MismatchOcrEngine(FakeOcrEngine):
        def recognize(self, image_path: Path):
            if image_path.name == "back.jpg":
                return [
                    OcrLine(text="DAC DIEM NHAN DANG", confidence=0.94),
                    OcrLine(text="IDVNM1234567890099999999999<<<3", confidence=0.95),
                ]
            return super().recognize(image_path)

    service = CccdOcrService(MismatchOcrEngine(), FakeQualityAnalyzer())

    result = service.analyze_document(Path("front.jpg"), Path("back.jpg"))

    assert result.risk_level == "HIGH"
    assert result.checks["FRONT_BACK_ID_MATCH"].status == "FAIL"


def test_service_marks_screenshot_quality_as_high_risk():
    class ScreenshotQualityAnalyzer(FakeQualityAnalyzer):
        def analyze(self, image_path: Path):
            checks = super().analyze(image_path)
            checks["SCREENSHOT_SUSPECTED"] = {
                "status": "FAIL",
                "message": "Image has screenshot-like UI border.",
                "value": True,
            }
            return checks

    service = CccdOcrService(FakeOcrEngine(), ScreenshotQualityAnalyzer())

    result = service.analyze_document(Path("front.jpg"), Path("back.jpg"))

    assert result.risk_level == "HIGH"
    assert result.front.checks["SCREENSHOT_SUSPECTED"].status == "FAIL"


def test_service_marks_glare_quality_as_medium_risk():
    class GlareQualityAnalyzer(FakeQualityAnalyzer):
        def analyze(self, image_path: Path):
            checks = super().analyze(image_path)
            checks["GLARE_SUSPECTED"] = {
                "status": "WARNING",
                "message": "Large bright region may hide ID details.",
                "value": True,
            }
            return checks

    service = CccdOcrService(FakeOcrEngine(), GlareQualityAnalyzer())

    result = service.analyze_document(Path("front.jpg"), Path("back.jpg"))

    assert result.risk_level == "MEDIUM"
    assert result.front.checks["GLARE_SUSPECTED"].status == "WARNING"


def test_service_marks_submitted_id_mismatch_as_high_risk():
    service = CccdOcrService(FakeOcrEngine(), FakeQualityAnalyzer())

    result = service.analyze_document(
        Path("front.jpg"),
        Path("back.jpg"),
        expected_id_number="999999999999",
    )

    assert result.risk_level == "HIGH"
    assert result.checks["SUBMITTED_ID_MATCH"].status == "FAIL"


def test_service_marks_submitted_dob_mismatch_as_high_risk():
    service = CccdOcrService(FakeOcrEngine(), FakeQualityAnalyzer())

    result = service.analyze_document(
        Path("front.jpg"),
        Path("back.jpg"),
        expected_date_of_birth="2000-01-01",
    )

    assert result.risk_level == "HIGH"
    assert result.checks["SUBMITTED_DOB_MATCH"].status == "FAIL"
