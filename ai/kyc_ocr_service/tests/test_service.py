from pathlib import Path

from src.schemas import CccdFields, CccdOcrResponse, CheckResult
from src.service import CccdOcrService


class FakeFastEngine:
    name = "fake-fast"

    def __init__(self):
        self.warmed = False
        self.calls = []

    def warm_up(self):
        self.warmed = True

    def analyze_side(self, image_path: Path, expected_side: str):
        self.calls.append((image_path, expected_side))
        if expected_side == "BACK":
            return CccdOcrResponse(
                engine=self.name,
                fields=CccdFields(
                    document_type="CITIZEN_ID",
                    side="BACK",
                    id_number="012345678901",
                    date_of_birth="1990-01-01",
                    issue_date="2020-02-01",
                    expiry_date="2030-01-01",
                ),
                checks={
                    "ID_NUMBER_FOUND": CheckResult(status="PASS", message="ok"),
                    "DOB_FOUND": CheckResult(status="PASS", message="ok"),
                    "DOCUMENT_TYPE_HINT": CheckResult(status="PASS", message="ok"),
                },
                risk_level="LOW",
            )
        return CccdOcrResponse(
            engine=self.name,
            fields=CccdFields(
                document_type="CITIZEN_ID",
                side="FRONT",
                id_number="012345678901",
                full_name="NGUYEN VAN A",
                date_of_birth="1990-01-01",
                place_of_origin="XA MOT, HUYEN HAI",
                place_of_residence="12A DUONG MAU",
            ),
            checks={
                "ID_NUMBER_FOUND": CheckResult(status="PASS", message="ok"),
                "DOB_FOUND": CheckResult(status="PASS", message="ok"),
                "DOCUMENT_TYPE_HINT": CheckResult(status="PASS", message="ok"),
            },
            risk_level="LOW",
        )


class FakeQualityAnalyzer:
    def __init__(self, screenshot_status="PASS"):
        self.paths = []
        self.screenshot_status = screenshot_status

    def analyze(self, image_path: Path):
        self.paths.append(image_path)
        return {
            "RESOLUTION_OK": CheckResult(status="PASS", message="ok"),
            "BLUR_OK": CheckResult(status="PASS", message="ok"),
            "BRIGHTNESS_OK": CheckResult(status="PASS", message="ok"),
            "GLARE_SUSPECTED": CheckResult(status="PASS", message="ok"),
            "SCREENSHOT_SUSPECTED": CheckResult(status=self.screenshot_status, message="ok"),
        }


def test_service_uses_fast_engine_for_front_and_quality_checks():
    fast_engine = FakeFastEngine()
    quality_analyzer = FakeQualityAnalyzer()
    service = CccdOcrService(
        quality_analyzer=quality_analyzer,
        fast_engine=fast_engine,
    )

    result = service.analyze_front(Path("front.jpg"))

    assert result.engine == "fake-fast"
    assert result.fields.id_number == "012345678901"
    assert result.fields.side == "FRONT"
    assert result.risk_level == "LOW"
    assert fast_engine.calls == [(Path("front.jpg"), "FRONT")]
    assert quality_analyzer.paths == [Path("front.jpg")]
    assert result.checks["RESOLUTION_OK"].status == "PASS"


def test_service_uses_fast_engine_for_back():
    fast_engine = FakeFastEngine()
    service = CccdOcrService(
        quality_analyzer=FakeQualityAnalyzer(),
        fast_engine=fast_engine,
    )

    result = service.analyze_back(Path("back.jpg"))

    assert result.fields.side == "BACK"
    assert result.fields.issue_date == "2020-02-01"
    assert fast_engine.calls == [(Path("back.jpg"), "BACK")]


def test_service_analyzes_front_and_back_with_matching_id():
    service = CccdOcrService(
        quality_analyzer=FakeQualityAnalyzer(),
        fast_engine=FakeFastEngine(),
    )

    result = service.analyze_document(
        Path("front.jpg"),
        Path("back.jpg"),
        expected_id_number="012345678901",
        expected_date_of_birth="1990-01-01",
    )

    assert result.engine == "fake-fast"
    assert result.risk_level == "LOW"
    assert result.checks["FRONT_BACK_ID_MATCH"].status == "PASS"
    assert result.checks["SUBMITTED_ID_MATCH"].status == "PASS"
    assert result.checks["SUBMITTED_DOB_MATCH"].status == "PASS"


def test_service_marks_mismatched_front_back_id_as_high_risk():
    class MismatchFastEngine(FakeFastEngine):
        def analyze_side(self, image_path: Path, expected_side: str):
            result = super().analyze_side(image_path, expected_side)
            if expected_side == "BACK":
                return result.model_copy(
                    update={
                        "fields": result.fields.model_copy(
                            update={"id_number": "999999999999"},
                        )
                    }
                )
            return result

    service = CccdOcrService(
        quality_analyzer=FakeQualityAnalyzer(),
        fast_engine=MismatchFastEngine(),
    )

    result = service.analyze_document(Path("front.jpg"), Path("back.jpg"))

    assert result.risk_level == "HIGH"
    assert result.checks["FRONT_BACK_ID_MATCH"].status == "FAIL"


def test_service_keeps_quality_failure_as_high_risk():
    service = CccdOcrService(
        quality_analyzer=FakeQualityAnalyzer(screenshot_status="FAIL"),
        fast_engine=FakeFastEngine(),
    )

    result = service.analyze_front(Path("front.jpg"))

    assert result.risk_level == "HIGH"
    assert result.checks["SCREENSHOT_SUSPECTED"].status == "FAIL"


def test_service_warm_up_delegates_to_fast_engine():
    fast_engine = FakeFastEngine()
    service = CccdOcrService(
        quality_analyzer=FakeQualityAnalyzer(),
        fast_engine=fast_engine,
    )

    service.warm_up()

    assert fast_engine.warmed is True
