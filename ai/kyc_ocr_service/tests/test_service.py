from pathlib import Path

from src.card_preprocessor import CardPreprocessMetadata, CardPreprocessResult
from src.schemas import CheckResult
from src.schemas import OcrLine
from src.service import CccdOcrService


class FakeOcrEngine:
    def __init__(self):
        self.paths = []

    def recognize(self, image_path: Path):
        self.paths.append(image_path)
        if image_path.name.startswith("back"):
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
    def __init__(self):
        self.paths = []

    def analyze(self, image_path: Path):
        self.paths.append(image_path)
        return {
            "RESOLUTION_OK": {"status": "PASS", "message": "Resolution is sufficient."},
            "BLUR_OK": {"status": "PASS", "message": "Image sharpness is acceptable."},
            "BRIGHTNESS_OK": {"status": "PASS", "message": "Brightness is acceptable."},
            "GLARE_SUSPECTED": {"status": "PASS", "message": "No strong glare detected."},
            "SCREENSHOT_SUSPECTED": {"status": "PASS", "message": "No screenshot-like border detected."},
        }


class FakeCardPreprocessor:
    def __init__(self):
        self.paths = []

    def preprocess(self, image_path: Path, output_dir: Path):
        self.paths.append(image_path)
        output_dir.mkdir(parents=True, exist_ok=True)
        quality_path = output_dir / f"{image_path.stem}-quality.jpg"
        ocr_path = output_dir / f"{image_path.stem}-ocr.jpg"
        quality_path.touch()
        ocr_path.touch()
        return CardPreprocessResult(
            quality_path=quality_path,
            ocr_path=ocr_path,
            metadata=CardPreprocessMetadata(
                card_detected=True,
                card_corners=[[0.0, 0.0], [100.0, 0.0], [100.0, 60.0], [0.0, 60.0]],
                card_area_ratio=0.8,
                card_aspect_ratio=1.586,
                perspective_corrected=True,
                ocr_image_upscaled=True,
                source_size="800x500",
                quality_image_size="800x505",
                ocr_image_size="1200x757",
            ),
            checks={
                "CARD_DETECTED": CheckResult(
                    status="PASS",
                    message="Detected a card-shaped document region.",
                    value=True,
                ),
            },
        )


def _service(ocr_engine=None, quality_analyzer=None):
    return CccdOcrService(
        ocr_engine or FakeOcrEngine(),
        quality_analyzer or FakeQualityAnalyzer(),
        FakeCardPreprocessor(),
    )


def test_service_returns_structured_paddleocr_assessment():
    service = _service()

    result = service.analyze_front(Path("front.jpg"))

    assert result.engine == "paddleocr"
    assert result.fields.id_number == "012345678901"
    assert result.risk_level == "LOW"
    assert result.checks["ID_NUMBER_FOUND"].status == "PASS"
    assert result.checks["RESOLUTION_OK"].status == "PASS"


def test_service_runs_quality_on_rectified_crop_and_ocr_on_upscaled_image():
    ocr_engine = FakeOcrEngine()
    quality_analyzer = FakeQualityAnalyzer()
    preprocessor = FakeCardPreprocessor()
    service = CccdOcrService(ocr_engine, quality_analyzer, preprocessor)

    result = service.analyze_front(Path("front.jpg"))

    assert quality_analyzer.paths[0].name == "front-quality.jpg"
    assert ocr_engine.paths[0].name == "front-ocr.jpg"
    assert result.preprocessing.card_detected is True
    assert result.preprocessing.ocr_image_upscaled is True
    assert result.checks["CARD_DETECTED"].status == "PASS"


def test_service_analyzes_front_and_back_with_matching_id():
    service = _service()

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
            if image_path.name.startswith("back"):
                return [
                    OcrLine(text="DAC DIEM NHAN DANG", confidence=0.94),
                    OcrLine(text="IDVNM1234567890099999999999<<<3", confidence=0.95),
                ]
            return super().recognize(image_path)

    service = _service(MismatchOcrEngine())

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

    service = _service(quality_analyzer=ScreenshotQualityAnalyzer())

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

    service = _service(quality_analyzer=GlareQualityAnalyzer())

    result = service.analyze_document(Path("front.jpg"), Path("back.jpg"))

    assert result.risk_level == "MEDIUM"
    assert result.front.checks["GLARE_SUSPECTED"].status == "WARNING"


def test_service_marks_submitted_id_mismatch_as_high_risk():
    service = _service()

    result = service.analyze_document(
        Path("front.jpg"),
        Path("back.jpg"),
        expected_id_number="999999999999",
    )

    assert result.risk_level == "HIGH"
    assert result.checks["SUBMITTED_ID_MATCH"].status == "FAIL"


def test_service_marks_submitted_dob_mismatch_as_high_risk():
    service = _service()

    result = service.analyze_document(
        Path("front.jpg"),
        Path("back.jpg"),
        expected_date_of_birth="2000-01-01",
    )

    assert result.risk_level == "HIGH"
    assert result.checks["SUBMITTED_DOB_MATCH"].status == "FAIL"
