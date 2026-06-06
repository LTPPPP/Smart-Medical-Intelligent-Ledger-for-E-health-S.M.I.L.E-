from pathlib import Path

import cv2
import numpy as np

from src.quality import ImageQualityAnalyzer


def test_quality_detects_screenshot_like_border(tmp_path: Path):
    image_path = tmp_path / "screen.jpg"
    image = np.full((820, 1180, 3), 32, dtype=np.uint8)
    cv2.rectangle(image, (42, 42), (1138, 778), (245, 247, 250), thickness=-1)
    cv2.rectangle(image, (84, 110), (1096, 748), (230, 240, 248), thickness=-1)
    cv2.imwrite(str(image_path), image)

    checks = ImageQualityAnalyzer().analyze(image_path)

    assert checks["SCREENSHOT_SUSPECTED"].status == "FAIL"


def test_quality_warns_on_large_glare(tmp_path: Path):
    image_path = tmp_path / "glare.jpg"
    image = np.full((900, 1400, 3), 170, dtype=np.uint8)
    cv2.ellipse(image, (900, 420), (260, 220), 0, 0, 360, (255, 255, 255), thickness=-1)
    cv2.imwrite(str(image_path), image)

    checks = ImageQualityAnalyzer().analyze(image_path)

    assert checks["GLARE_SUSPECTED"].status == "WARNING"


def test_quality_fails_on_extreme_glare(tmp_path: Path):
    image_path = tmp_path / "extreme_glare.jpg"
    image = np.full((900, 1400, 3), 160, dtype=np.uint8)
    cv2.rectangle(image, (520, 120), (1320, 760), (255, 255, 255), thickness=-1)
    cv2.imwrite(str(image_path), image)

    checks = ImageQualityAnalyzer().analyze(image_path)

    assert checks["GLARE_SUSPECTED"].status == "FAIL"


def test_quality_fails_on_too_small_image(tmp_path: Path):
    image_path = tmp_path / "small.jpg"
    image = np.full((320, 480, 3), 180, dtype=np.uint8)
    cv2.imwrite(str(image_path), image)

    checks = ImageQualityAnalyzer().analyze(image_path)

    assert checks["RESOLUTION_OK"].status == "FAIL"


def test_quality_passes_clean_document_photo(tmp_path: Path):
    image_path = tmp_path / "clean.jpg"
    image = np.full((900, 1400, 3), 178, dtype=np.uint8)
    cv2.rectangle(image, (80, 80), (1320, 820), (210, 225, 235), thickness=-1)
    cv2.putText(image, "CAN CUOC CONG DAN", (180, 180), cv2.FONT_HERSHEY_SIMPLEX, 2, (30, 45, 70), 4)
    cv2.putText(image, "087204009012", (180, 300), cv2.FONT_HERSHEY_SIMPLEX, 2, (30, 45, 70), 4)
    cv2.imwrite(str(image_path), image)

    checks = ImageQualityAnalyzer().analyze(image_path)

    assert checks["SCREENSHOT_SUSPECTED"].status == "PASS"
    assert checks["GLARE_SUSPECTED"].status == "PASS"
