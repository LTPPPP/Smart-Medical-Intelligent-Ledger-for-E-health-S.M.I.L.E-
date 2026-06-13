from pathlib import Path

import cv2
import numpy as np

from src.card_preprocessor import CardPreprocessMetadata, CardPreprocessResult
from src.schemas import CccdFields, CheckResult
from src.schemas import OcrLine
from src.service import CccdOcrService
from src.vietocr_engine import VietOcrFirstEngine


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
            OcrLine(text="CAN CUOC CONG DAN", confidence=0.94, bbox=[[10, 10], [300, 10], [300, 40], [10, 40]]),
            OcrLine(text="So / No: 012345678901", confidence=0.97, bbox=[[10, 50], [300, 50], [300, 80], [10, 80]]),
            OcrLine(text="Ho va ten / Full name: NGUYEN VAN A", confidence=0.92, bbox=[[10, 90], [400, 90], [400, 120], [10, 120]]),
            OcrLine(text="Ngay sinh / Date of birth: 01/01/1990", confidence=0.91, bbox=[[10, 130], [420, 130], [420, 160], [10, 160]]),
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


def test_service_defaults_to_vietocr_first_engine(monkeypatch):
    monkeypatch.delenv("KYC_OCR_ENGINE", raising=False)

    service = CccdOcrService(
        quality_analyzer=FakeQualityAnalyzer(),
        card_preprocessor=FakeCardPreprocessor(),
    )

    assert isinstance(service.ocr_engine, VietOcrFirstEngine)


def test_service_returns_structured_paddleocr_assessment():
    service = _service()

    result = service.analyze_front(Path("front.jpg"))

    assert result.engine == "paddleocr"
    assert result.fields.id_number == "012345678901"
    assert result.risk_level == "LOW"
    assert result.checks["ID_NUMBER_FOUND"].status == "PASS"
    assert result.checks["RESOLUTION_OK"].status == "PASS"
    assert result.layout.regions[1].text == "So / No: 012345678901"
    assert result.layout.regions[1].bbox == [[10.0, 50.0], [300.0, 50.0], [300.0, 80.0], [10.0, 80.0]]


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


def test_service_prefers_primary_recognition_when_engine_supports_it():
    class PrimaryOcrEngine(FakeOcrEngine):
        def __init__(self):
            super().__init__()
            self.primary_paths = []

        def recognize(self, image_path: Path):
            raise AssertionError("regular recognition should not be used for the full card")

        def recognize_primary(self, image_path: Path):
            self.primary_paths.append(image_path)
            return FakeOcrEngine.recognize(self, image_path)

    engine = PrimaryOcrEngine()
    service = _service(engine)

    result = service.analyze_front(Path("front.jpg"))

    assert result.fields.id_number == "012345678901"
    assert engine.primary_paths[0].name == "front-ocr.jpg"


def test_service_extracts_address_from_layout_without_fixed_residence_crop():
    class MissingResidenceOcrEngine(FakeOcrEngine):
        def recognize(self, image_path: Path):
            self.paths.append(image_path)
            return [
                OcrLine(text="CAN CUOC CONG DAN", confidence=0.94, bbox=[[300, 90], [700, 90], [700, 130], [300, 130]]),
                OcrLine(text="So / No: 012345678901", confidence=0.97, bbox=[[300, 150], [620, 150], [620, 190], [300, 190]]),
                OcrLine(text="Ho va ten / Full name: NGUYEN VAN A", confidence=0.92, bbox=[[300, 200], [720, 200], [720, 235], [300, 235]]),
                OcrLine(text="Ngay sinh / Date of birth: 01/01/1990", confidence=0.91, bbox=[[300, 280], [740, 280], [740, 320], [300, 320]]),
                OcrLine(text="Que quan / Place of origin", confidence=0.86, bbox=[[300, 345], [620, 345], [620, 375], [300, 375]]),
                OcrLine(text="Binh Minh, Kien Xuong, Thai Binh", confidence=0.86, bbox=[[300, 382], [780, 382], [780, 420], [300, 420]]),
                OcrLine(text="224A, HV Kh.", confidence=0.82, bbox=[[300, 468], [520, 468], [520, 506], [300, 506]]),
                OcrLine(text="Phuong 1, Thanh pho Sa Dec, Dong Thap", confidence=0.84, bbox=[[300, 512], [850, 512], [850, 550], [300, 550]]),
                OcrLine(text="Co gia tri den 01/01/2030", confidence=0.9, bbox=[[35, 560], [300, 560], [300, 600], [35, 600]]),
            ]

    class ImageWritingPreprocessor(FakeCardPreprocessor):
        def preprocess(self, image_path: Path, output_dir: Path):
            result = super().preprocess(image_path, output_dir)
            image = np.full((807, 1280, 3), 255, dtype=np.uint8)
            cv2.imwrite(str(result.ocr_path), image)
            cv2.imwrite(str(result.quality_path), image)
            return result

    ocr_engine = MissingResidenceOcrEngine()
    service = CccdOcrService(
        ocr_engine,
        FakeQualityAnalyzer(),
        ImageWritingPreprocessor(),
    )

    result = service.analyze_front(Path("front.jpg"))

    assert all("front-residence-band" not in path.name for path in ocr_engine.paths)
    assert result.fields.place_of_residence == (
        "224A, HV KH, PHUONG 1, THANH PHO SA DEC, DONG THAP"
    )


def test_service_uses_layout_boxes_for_front_addresses_and_ignores_expiry_noise():
    class AddressLayoutOcrEngine(FakeOcrEngine):
        def recognize(self, image_path: Path):
            return [
                OcrLine(text="CAN CUOC CONG DAN", confidence=0.94, bbox=[[300, 90], [700, 90], [700, 130], [300, 130]]),
                OcrLine(text="So / No: 086303003890", confidence=0.97, bbox=[[300, 150], [620, 150], [620, 190], [300, 190]]),
                OcrLine(text="Ho va ten / Full name:", confidence=0.92, bbox=[[300, 200], [550, 200], [550, 230], [300, 230]]),
                OcrLine(text="NGUYEN THI TUYET LAN", confidence=0.92, bbox=[[300, 235], [700, 235], [700, 275], [300, 275]]),
                OcrLine(text="Ngay sinh / Date of birth: 18/10/2003", confidence=0.91, bbox=[[300, 280], [700, 280], [700, 320], [300, 320]]),
                OcrLine(text="Quê quán / Place of origin", confidence=0.9, bbox=[[300, 345], [610, 345], [610, 375], [300, 375]]),
                OcrLine(text="Quới An, Vũng Liêm, Vĩnh Long", confidence=0.88, bbox=[[300, 382], [790, 382], [790, 420], [300, 420]]),
                OcrLine(text="Có giá trị đến18/10/2028", confidence=0.8, bbox=[[35, 390], [260, 390], [260, 430], [35, 430]]),
                OcrLine(text="Nơi thường trú / Place of residence: Ấp Nhất", confidence=0.85, bbox=[[300, 430], [800, 430], [800, 460], [300, 460]]),
                OcrLine(text="Quới An, Vũng Liêm, Vĩnh Long", confidence=0.87, bbox=[[300, 468], [790, 468], [790, 506], [300, 506]]),
                OcrLine(text="Data.ofexpiry", confidence=0.8, bbox=[[35, 430], [200, 430], [200, 460], [35, 460]]),
            ]

    service = CccdOcrService(
        AddressLayoutOcrEngine(),
        FakeQualityAnalyzer(),
        FakeCardPreprocessor(),
    )

    result = service.analyze_front(Path("front.jpg"))

    assert result.fields.place_of_origin == "QUỚI AN, VŨNG LIÊM, VĨNH LONG"
    assert result.fields.place_of_residence == "ẤP NHẤT, QUỚI AN, VŨNG LIÊM, VĨNH LONG"


def test_service_keeps_residence_value_on_bilingual_label_line_without_colon():
    class ResidenceSplitAfterLabelOcrEngine(FakeOcrEngine):
        def recognize(self, image_path: Path):
            return [
                OcrLine(text="CAN CUOC CONG DAN", confidence=0.94, bbox=[[300, 90], [700, 90], [700, 130], [300, 130]]),
                OcrLine(text="So / No: 012345678901", confidence=0.97, bbox=[[300, 150], [620, 150], [620, 190], [300, 190]]),
                OcrLine(text="Ho va ten / Full name: NGUYEN VAN A", confidence=0.92, bbox=[[300, 200], [720, 200], [720, 235], [300, 235]]),
                OcrLine(text="Ngay sinh / Date of birth: 01/01/1990", confidence=0.91, bbox=[[300, 280], [740, 280], [740, 320], [300, 320]]),
                OcrLine(text="Noi thuong tru / Place of residence 12A, Duong Mau", confidence=0.85, bbox=[[300, 430], [900, 430], [900, 460], [300, 460]]),
                OcrLine(text="Phuong 1, Thanh pho Mau, Tinh Mau", confidence=0.87, bbox=[[300, 468], [850, 468], [850, 506], [300, 506]]),
            ]

    service = CccdOcrService(
        ResidenceSplitAfterLabelOcrEngine(),
        FakeQualityAnalyzer(),
        FakeCardPreprocessor(),
    )

    result = service.analyze_front(Path("front.jpg"))

    assert (
        result.fields.place_of_residence
        == "12A, DUONG MAU, PHUONG 1, THANH PHO MAU, TINH MAU"
    )


def test_service_accepts_fuzzy_residence_label_ocr_typos():
    class FuzzyResidenceLabelOcrEngine(FakeOcrEngine):
        def recognize(self, image_path: Path):
            return [
                OcrLine(text="CAN CUOC CONG DAN", confidence=0.94, bbox=[[300, 90], [700, 90], [700, 130], [300, 130]]),
                OcrLine(text="So / No: 012345678901", confidence=0.97, bbox=[[300, 150], [620, 150], [620, 190], [300, 190]]),
                OcrLine(text="Noi thuonq tru / Place of residenoe 12A, Duong Mau", confidence=0.85, bbox=[[300, 430], [900, 430], [900, 460], [300, 460]]),
                OcrLine(text="Phuong 1, Thanh pho Mau, Tinh Mau", confidence=0.87, bbox=[[300, 468], [850, 468], [850, 506], [300, 506]]),
                OcrLine(text="Co gia tri den 01/01/2030", confidence=0.8, bbox=[[35, 520], [300, 520], [300, 555], [35, 555]]),
            ]

    service = CccdOcrService(
        FuzzyResidenceLabelOcrEngine(),
        FakeQualityAnalyzer(),
        FakeCardPreprocessor(),
    )

    result = service.analyze_front(Path("front.jpg"))

    assert (
        result.fields.place_of_residence
        == "12A, DUONG MAU, PHUONG 1, THANH PHO MAU, TINH MAU"
    )


def test_service_recovers_layout_residence_when_residence_label_is_missed():
    class MissingResidenceLabelOcrEngine(FakeOcrEngine):
        def recognize(self, image_path: Path):
            return [
                OcrLine(text="CAN CUOC CONG DAN", confidence=0.94, bbox=[[300, 90], [700, 90], [700, 130], [300, 130]]),
                OcrLine(text="So / No: 086303003890", confidence=0.97, bbox=[[300, 150], [620, 150], [620, 190], [300, 190]]),
                OcrLine(text="Ho va ten / Full name:", confidence=0.92, bbox=[[300, 200], [550, 200], [550, 230], [300, 230]]),
                OcrLine(text="NGUYỄN THỊ TUYẾT LAN", confidence=0.92, bbox=[[300, 235], [720, 235], [720, 275], [300, 275]]),
                OcrLine(text="Ngay sinh / Date of birth: 18/10/2003", confidence=0.91, bbox=[[300, 280], [700, 280], [700, 320], [300, 320]]),
                OcrLine(text="Quê quán / Place of origin", confidence=0.9, bbox=[[300, 345], [610, 345], [610, 375], [300, 375]]),
                OcrLine(text="Quới An, Vũng Liêm, Vĩnh Long", confidence=0.88, bbox=[[300, 382], [790, 382], [790, 420], [300, 420]]),
                OcrLine(text="Ấp Nhất, Quới An, Vũng Liêm, Vĩnh Long", confidence=0.87, bbox=[[300, 468], [860, 468], [860, 506], [300, 506]]),
                OcrLine(text="Có giá trị đến 18/10/2028", confidence=0.8, bbox=[[35, 520], [300, 520], [300, 555], [35, 555]]),
            ]

    service = CccdOcrService(
        MissingResidenceLabelOcrEngine(),
        FakeQualityAnalyzer(),
        FakeCardPreprocessor(),
    )

    result = service.analyze_front(Path("front.jpg"))

    assert result.fields.place_of_residence == "ẤP NHẤT, QUỚI AN, VŨNG LIÊM, VĨNH LONG"


def test_service_splits_multiline_origin_and_residence_when_residence_label_is_missed():
    class MultiLineAddressOcrEngine(FakeOcrEngine):
        def recognize(self, image_path: Path):
            return [
                OcrLine(text="CAN CUOC CONG DAN", confidence=0.94, bbox=[[300, 90], [700, 90], [700, 130], [300, 130]]),
                OcrLine(text="So / No: 086303003890", confidence=0.97, bbox=[[300, 150], [620, 150], [620, 190], [300, 190]]),
                OcrLine(text="Ho va ten / Full name:", confidence=0.92, bbox=[[300, 200], [550, 200], [550, 230], [300, 230]]),
                OcrLine(text="NGUYỄN THỊ TUYẾT LAN", confidence=0.92, bbox=[[300, 235], [720, 235], [720, 275], [300, 275]]),
                OcrLine(text="Ngay sinh / Date of birth: 18/10/2003", confidence=0.91, bbox=[[300, 280], [700, 280], [700, 320], [300, 320]]),
                OcrLine(text="Quê quán / Place of origin", confidence=0.9, bbox=[[300, 345], [610, 345], [610, 375], [300, 375]]),
                OcrLine(text="Xã Quới An, huyện Vũng Liêm", confidence=0.88, bbox=[[300, 382], [790, 382], [790, 420], [300, 420]]),
                OcrLine(text="tỉnh Vĩnh Long", confidence=0.88, bbox=[[300, 421], [610, 421], [610, 459], [300, 459]]),
                OcrLine(text="Ấp Nhất, xã Quới An", confidence=0.87, bbox=[[300, 505], [710, 505], [710, 543], [300, 543]]),
                OcrLine(text="huyện Vũng Liêm, tỉnh Vĩnh Long", confidence=0.87, bbox=[[300, 544], [840, 544], [840, 582], [300, 582]]),
            ]

    service = CccdOcrService(
        MultiLineAddressOcrEngine(),
        FakeQualityAnalyzer(),
        FakeCardPreprocessor(),
    )

    result = service.analyze_front(Path("front.jpg"))

    assert result.fields.place_of_origin == "XÃ QUỚI AN, HUYỆN VŨNG LIÊM, TỈNH VĨNH LONG"
    assert result.fields.place_of_residence == "ẤP NHẤT, XÃ QUỚI AN, HUYỆN VŨNG LIÊM, TỈNH VĨNH LONG"


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


def test_service_retries_ocr_on_field_crops_to_fill_name_and_addresses():
    class WeakThenCropOcrEngine(FakeOcrEngine):
        def recognize(self, image_path: Path):
            self.paths.append(image_path)
            name = image_path.name
            if "full_name" in name:
                return [
                    OcrLine(text="Họ và tên / Full name", confidence=0.94),
                    OcrLine(text="TRẦN ĐẠI NHÂN", confidence=0.93),
                ]
            if "address_block" in name:
                return [
                    OcrLine(text="Quê quán / Place of origin", confidence=0.9, bbox=[[10, 10], [310, 10], [310, 40], [10, 40]]),
                    OcrLine(text="Quới An, Vũng Liêm, Vĩnh Long", confidence=0.9, bbox=[[10, 48], [450, 48], [450, 80], [10, 80]]),
                    OcrLine(text="Nơi thường trú / Place of residence", confidence=0.9, bbox=[[10, 100], [420, 100], [420, 132], [10, 132]]),
                    OcrLine(text="Ấp Nhất, Quới An, Vũng Liêm, Vĩnh Long", confidence=0.9, bbox=[[10, 140], [520, 140], [520, 172], [10, 172]]),
                ]
            return [
                OcrLine(text="CAN CUOC CONG DAN", confidence=0.94, bbox=[[300, 90], [700, 90], [700, 130], [300, 130]]),
                OcrLine(text="So / No: 012345678901", confidence=0.97, bbox=[[300, 150], [620, 150], [620, 190], [300, 190]]),
                OcrLine(text="Ho va ten / Full name:", confidence=0.92, bbox=[[300, 200], [560, 200], [560, 230], [300, 230]]),
                OcrLine(text="Ngay sinh / Date of birth: 01/01/1990", confidence=0.91, bbox=[[300, 280], [700, 280], [700, 320], [300, 320]]),
                OcrLine(text="Que quan / Place of origin", confidence=0.74, bbox=[[300, 345], [610, 345], [610, 375], [300, 375]]),
                OcrLine(text="Noi thuong tru / Place of residence", confidence=0.68, bbox=[[300, 430], [780, 430], [780, 460], [300, 460]]),
            ]

    class ImageWritingPreprocessor(FakeCardPreprocessor):
        def preprocess(self, image_path: Path, output_dir: Path):
            result = super().preprocess(image_path, output_dir)
            image = np.full((807, 1280, 3), 255, dtype=np.uint8)
            cv2.imwrite(str(result.ocr_path), image)
            cv2.imwrite(str(result.quality_path), image)
            return result

    ocr_engine = WeakThenCropOcrEngine()
    service = CccdOcrService(
        ocr_engine,
        FakeQualityAnalyzer(),
        ImageWritingPreprocessor(),
    )

    result = service.analyze_front(Path("front.jpg"))

    assert any("full_name" in path.name for path in ocr_engine.paths)
    assert any("address_block" in path.name for path in ocr_engine.paths)
    assert result.fields.full_name == "TRẦN ĐẠI NHÂN"
    assert result.fields.place_of_origin == "QUỚI AN, VŨNG LIÊM, VĨNH LONG"
    assert result.fields.place_of_residence == "ẤP NHẤT, QUỚI AN, VŨNG LIÊM, VĨNH LONG"


def test_service_retries_address_crop_when_existing_residence_is_partial():
    class PartialThenCropOcrEngine(FakeOcrEngine):
        def recognize(self, image_path: Path):
            self.paths.append(image_path)
            if "address_block" in image_path.name:
                return [
                    OcrLine(text="Quê quán / Place of origin", confidence=0.9, bbox=[[10, 10], [310, 10], [310, 40], [10, 40]]),
                    OcrLine(text="Xã Một, Huyện Hai, Tỉnh Ba", confidence=0.9, bbox=[[10, 48], [450, 48], [450, 80], [10, 80]]),
                    OcrLine(text="Nơi thường trú / Place of residence 12A, Đường Mẫu", confidence=0.9, bbox=[[10, 100], [520, 100], [520, 132], [10, 132]]),
                    OcrLine(text="Phường 1, Thành phố Mẫu, Tỉnh Mẫu", confidence=0.9, bbox=[[10, 140], [580, 140], [580, 172], [10, 172]]),
                ]
            return [
                OcrLine(text="CAN CUOC CONG DAN", confidence=0.94, bbox=[[300, 90], [700, 90], [700, 130], [300, 130]]),
                OcrLine(text="So / No: 012345678901", confidence=0.97, bbox=[[300, 150], [620, 150], [620, 190], [300, 190]]),
                OcrLine(text="Ho va ten / Full name: NGUYEN VAN A", confidence=0.92, bbox=[[300, 200], [720, 200], [720, 235], [300, 235]]),
                OcrLine(text="Ngay sinh / Date of birth: 01/01/1990", confidence=0.91, bbox=[[300, 280], [700, 280], [700, 320], [300, 320]]),
                OcrLine(text="Quê quán / Place of origin", confidence=0.9, bbox=[[300, 345], [610, 345], [610, 375], [300, 375]]),
                OcrLine(text="Xã Một, Huyện Hai, Tỉnh Ba", confidence=0.88, bbox=[[300, 382], [790, 382], [790, 420], [300, 420]]),
                OcrLine(text="Có giá trị đến 01/01/2030", confidence=0.8, bbox=[[35, 520], [300, 520], [300, 555], [35, 555]]),
                OcrLine(text="Phường 1, Thành phố Mẫu, Tỉnh Mẫu", confidence=0.87, bbox=[[300, 544], [840, 544], [840, 582], [300, 582]]),
            ]

    class ImageWritingPreprocessor(FakeCardPreprocessor):
        def preprocess(self, image_path: Path, output_dir: Path):
            result = super().preprocess(image_path, output_dir)
            image = np.full((807, 1280, 3), 255, dtype=np.uint8)
            cv2.imwrite(str(result.ocr_path), image)
            cv2.imwrite(str(result.quality_path), image)
            return result

    ocr_engine = PartialThenCropOcrEngine()
    service = CccdOcrService(
        ocr_engine,
        FakeQualityAnalyzer(),
        ImageWritingPreprocessor(),
    )

    result = service.analyze_front(Path("front.jpg"))

    assert any("address_block" in path.name for path in ocr_engine.paths)
    assert (
        result.fields.place_of_residence
        == "12A, ĐƯỜNG MẪU, PHƯỜNG 1, THÀNH PHỐ MẪU, TỈNH MẪU"
    )


def test_service_retries_residence_block_above_detected_residence_line():
    class ResidenceBlockCropOcrEngine(FakeOcrEngine):
        def recognize(self, image_path: Path):
            self.paths.append(image_path)
            if "residence_block" in image_path.name:
                return [
                    OcrLine(text="12A, Đường Mẫu", confidence=0.9),
                    OcrLine(text="Phường 1, Thành phố Mẫu, Tỉnh Mẫu", confidence=0.9),
                ]
            if "address_block" in image_path.name:
                return [
                    OcrLine(text="Xã Một, Huyện Hai, Tỉnh Ba", confidence=0.9),
                    OcrLine(text="Phường 1, Thành phố Mẫu, Tỉnh Mẫu", confidence=0.9),
                ]
            return [
                OcrLine(text="CAN CUOC CONG DAN", confidence=0.94, bbox=[[300, 90], [700, 90], [700, 130], [300, 130]]),
                OcrLine(text="So / No: 012345678901", confidence=0.97, bbox=[[300, 150], [620, 150], [620, 190], [300, 190]]),
                OcrLine(text="Quê quán / Place of origin", confidence=0.9, bbox=[[300, 345], [610, 345], [610, 375], [300, 375]]),
                OcrLine(text="Xã Một, Huyện Hai, Tỉnh Ba", confidence=0.88, bbox=[[300, 382], [790, 382], [790, 420], [300, 420]]),
                OcrLine(text="Có giá trị đến 01/01/2030", confidence=0.8, bbox=[[35, 520], [300, 520], [300, 555], [35, 555]]),
                OcrLine(text="Phường 1, Thành phố Mẫu, Tỉnh Mẫu", confidence=0.87, bbox=[[300, 544], [840, 544], [840, 582], [300, 582]]),
            ]

    class ImageWritingPreprocessor(FakeCardPreprocessor):
        def preprocess(self, image_path: Path, output_dir: Path):
            result = super().preprocess(image_path, output_dir)
            image = np.full((807, 1280, 3), 255, dtype=np.uint8)
            cv2.imwrite(str(result.ocr_path), image)
            cv2.imwrite(str(result.quality_path), image)
            return result

    ocr_engine = ResidenceBlockCropOcrEngine()
    service = CccdOcrService(
        ocr_engine,
        FakeQualityAnalyzer(),
        ImageWritingPreprocessor(),
    )

    result = service.analyze_front(Path("front.jpg"))

    assert any("residence_block" in path.name for path in ocr_engine.paths)
    assert (
        result.fields.place_of_residence
        == "12A, ĐƯỜNG MẪU, PHƯỜNG 1, THÀNH PHỐ MẪU, TỈNH MẪU"
    )


def test_service_writes_debug_overlay_when_enabled(tmp_path, monkeypatch):
    class ImageWritingPreprocessor(FakeCardPreprocessor):
        def preprocess(self, image_path: Path, output_dir: Path):
            result = super().preprocess(image_path, output_dir)
            image = np.full((220, 360, 3), 255, dtype=np.uint8)
            cv2.imwrite(str(result.ocr_path), image)
            cv2.imwrite(str(result.quality_path), image)
            return result

    monkeypatch.setenv("KYC_OCR_DEBUG_OVERLAY_DIR", str(tmp_path / "debug"))
    service = CccdOcrService(
        FakeOcrEngine(),
        FakeQualityAnalyzer(),
        ImageWritingPreprocessor(),
    )

    result = service.analyze_front(Path("front.jpg"))

    assert result.debug_overlay_path is not None
    overlay_path = Path(result.debug_overlay_path)
    assert overlay_path.exists()
    assert overlay_path.parent == tmp_path / "debug"
