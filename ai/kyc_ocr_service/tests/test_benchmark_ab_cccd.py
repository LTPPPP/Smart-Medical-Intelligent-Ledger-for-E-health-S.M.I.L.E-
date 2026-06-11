from pathlib import Path

from src.schemas import CardPreprocessingMetadata, CccdFields, CccdOcrResponse, CheckResult
from tools.benchmark_ab_cccd import (
    VariantResult,
    _build_services,
    aggregate_results,
    discover_images,
    masked_failure_summary,
    summarize_response,
)


def test_discover_images_limits_supported_image_files(tmp_path: Path):
    (tmp_path / "a.jpg").write_bytes(b"x")
    (tmp_path / "b.png").write_bytes(b"x")
    (tmp_path / "notes.txt").write_text("nope", encoding="utf-8")

    images = discover_images([tmp_path], limit=1)

    assert len(images) == 1
    assert images[0].suffix == ".jpg"


def test_summarize_response_reports_presence_without_sensitive_values():
    response = CccdOcrResponse(
        lines=[],
        fields=CccdFields(
            document_type="CITIZEN_ID",
            side="FRONT",
            id_number="012345678901",
            full_name="NGUYEN VAN A",
            date_of_birth="1990-01-01",
        ),
        checks={
            "CARD_DETECTED": CheckResult(status="PASS", message="ok"),
            "ID_NUMBER_FOUND": CheckResult(status="PASS", message="ok"),
        },
        preprocessing=CardPreprocessingMetadata(
            card_detected=True,
            perspective_corrected=True,
            ocr_image_size="1600x1009",
        ),
        risk_level="LOW",
    )

    summary = summarize_response(response, elapsed_seconds=1.25)

    assert summary["fields_found"]["id_number"] is True
    assert summary["fields_found"]["full_name"] is True
    assert "012345678901" not in str(summary)
    assert "NGUYEN VAN A" not in str(summary)
    assert summary["risk_level"] == "LOW"
    assert summary["checks"]["CARD_DETECTED"] == "PASS"


def test_summarize_response_can_reveal_sensitive_values_for_local_debug():
    response = CccdOcrResponse(
        lines=[],
        fields=CccdFields(
            document_type="CITIZEN_ID",
            side="FRONT",
            id_number="012345678901",
            full_name="NGUYEN VAN A",
        ),
        checks={},
        risk_level="LOW",
    )

    summary = summarize_response(
        response,
        elapsed_seconds=1.25,
        reveal_sensitive=True,
    )

    assert summary["field_preview"]["id_number"] == "012345678901"
    assert summary["field_preview"]["full_name"] == "NGUYEN VAN A"


def test_aggregate_results_counts_field_completion_rates():
    results = [
        VariantResult("opencv", "a.jpg", {"fields_found": {"id_number": True, "full_name": False}}),
        VariantResult("opencv", "b.jpg", {"fields_found": {"id_number": True, "full_name": True}}),
        VariantResult("yolo", "a.jpg", {"fields_found": {"id_number": False, "full_name": True}}),
    ]

    aggregate = aggregate_results(results)

    assert aggregate["opencv"]["images"] == 2
    assert aggregate["opencv"]["fields"]["id_number"]["found_rate"] == 1.0
    assert aggregate["opencv"]["fields"]["full_name"]["found_rate"] == 0.5
    assert aggregate["yolo"]["fields"]["id_number"]["found_rate"] == 0.0


def test_masked_failure_summary_masks_sensitive_actual_values():
    result = VariantResult(
        "opencv",
        "a.jpg",
        {
            "fields_found": {"id_number": True, "full_name": False},
            "field_preview": {"id_number": "012345678901", "full_name": None},
        },
    )

    failures = masked_failure_summary([result], reveal_sensitive=False)

    assert failures[0]["field_preview"]["id_number"] == "********8901"


def test_masked_failure_summary_uses_side_specific_required_fields():
    result = VariantResult(
        "ocr",
        "back.jpg",
        {
            "side": "BACK",
            "fields_found": {
                "document_type": True,
                "side": True,
                "id_number": True,
                "full_name": True,
                "date_of_birth": True,
                "issue_date": True,
                "expiry_date": True,
                "place_of_origin": False,
                "place_of_residence": False,
            },
            "field_preview": {},
        },
    )

    assert masked_failure_summary([result], reveal_sensitive=False) == []


def test_build_services_can_include_vietocr_yolo_variant(tmp_path: Path):
    yolo_model = tmp_path / "model_crop.pt"
    yolo_model.write_bytes(b"fake")

    services = _build_services(
        lang="vi",
        yolo_model=yolo_model,
        include_vietocr=True,
    )

    assert [name for name, _ in services] == [
        "opencv",
        "yolo_enhanced",
        "yolo_enhanced_vietocr",
    ]
