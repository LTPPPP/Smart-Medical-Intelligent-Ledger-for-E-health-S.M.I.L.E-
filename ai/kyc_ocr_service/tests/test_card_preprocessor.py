from pathlib import Path

import cv2
import numpy as np

from src.card_preprocessor import CardPreprocessor


def _write_card_photo(path: Path, card_width: int = 860, card_height: int = 542) -> None:
    image = np.full((900, 1400, 3), 35, dtype=np.uint8)
    card = np.array([[220, 160], [1120, 120], [1180, 700], [180, 750]], dtype=np.int32)
    cv2.fillConvexPoly(image, card, (220, 235, 225))
    cv2.polylines(image, [card], True, (245, 245, 245), 8)
    cv2.putText(image, "CAN CUOC CONG DAN", (330, 300), cv2.FONT_HERSHEY_SIMPLEX, 1.6, (20, 40, 70), 4)
    cv2.putText(image, "087204009012", (420, 440), cv2.FONT_HERSHEY_SIMPLEX, 1.7, (20, 40, 70), 4)
    cv2.imwrite(str(path), image)


def test_preprocessor_detects_and_rectifies_card(tmp_path: Path):
    source = tmp_path / "photo.jpg"
    _write_card_photo(source)

    result = CardPreprocessor().preprocess(source, tmp_path / "output")

    assert result.checks["CARD_DETECTED"].status == "PASS"
    assert result.metadata.card_detected is True
    assert len(result.metadata.card_corners) == 4
    assert 1.45 <= result.metadata.card_aspect_ratio <= 1.75
    assert result.quality_path.exists()

    crop = cv2.imread(str(result.quality_path))
    assert crop.shape[1] > crop.shape[0]
    assert abs((crop.shape[1] / crop.shape[0]) - 1.586) < 0.08


def test_preprocessor_upscales_small_rectified_card_for_ocr_only(tmp_path: Path):
    source = tmp_path / "small-card.jpg"
    image = np.full((500, 700, 3), 30, dtype=np.uint8)
    cv2.rectangle(image, (100, 120), (600, 435), (220, 235, 225), thickness=-1)
    cv2.rectangle(image, (100, 120), (600, 435), (250, 250, 250), thickness=5)
    cv2.imwrite(str(source), image)

    result = CardPreprocessor(min_ocr_width=1000).preprocess(source, tmp_path / "output")

    quality = cv2.imread(str(result.quality_path))
    ocr = cv2.imread(str(result.ocr_path))
    assert result.metadata.ocr_image_upscaled is True
    assert quality.shape[1] < 1000
    assert ocr.shape[1] >= 1000
    assert ocr.shape[1] > quality.shape[1]


def test_preprocessor_detects_card_that_fills_frame_with_rounded_corners(tmp_path: Path):
    source = tmp_path / "frame-card.jpg"
    image = np.full((630, 1000, 3), 35, dtype=np.uint8)
    cv2.rectangle(image, (0, 28), (999, 601), (220, 235, 225), thickness=-1)
    cv2.rectangle(image, (28, 0), (971, 629), (220, 235, 225), thickness=-1)
    for center in ((28, 28), (971, 28), (28, 601), (971, 601)):
        cv2.circle(image, center, 28, (220, 235, 225), thickness=-1)
    cv2.putText(image, "CAN CUOC CONG DAN", (180, 180), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (20, 40, 70), 4)
    cv2.putText(image, "087204009012", (260, 330), cv2.FONT_HERSHEY_SIMPLEX, 1.7, (20, 40, 70), 4)
    cv2.imwrite(str(source), image)

    result = CardPreprocessor().preprocess(source, tmp_path / "output")

    assert result.metadata.card_detected is True
    assert result.metadata.card_area_ratio >= 0.85
    assert result.checks["CARD_DETECTED"].status == "PASS"


def test_preprocessor_uses_frame_aligned_fallback_when_quad_approximation_fails(tmp_path: Path):
    edges = np.zeros((630, 1000), dtype=np.uint8)
    cv2.rectangle(edges, (6, 8), (993, 621), 255, thickness=8)
    processor = CardPreprocessor()

    corners = processor._frame_aligned_candidate(edges, edges.shape)

    assert corners is not None
    assert cv2.contourArea(corners) / float(edges.shape[0] * edges.shape[1]) >= 0.85


def test_preprocessor_marks_non_card_image_as_failed_without_crashing(tmp_path: Path):
    source = tmp_path / "not-card.jpg"
    image = np.full((900, 1400, 3), 120, dtype=np.uint8)
    cv2.circle(image, (700, 450), 260, (180, 180, 180), thickness=-1)
    cv2.imwrite(str(source), image)

    result = CardPreprocessor().preprocess(source, tmp_path / "output")

    assert result.checks["CARD_DETECTED"].status == "FAIL"
    assert result.metadata.card_detected is False
    assert result.quality_path.exists()
    assert result.ocr_path.exists()
