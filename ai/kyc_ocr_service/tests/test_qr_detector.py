import cv2
import numpy as np

from src.qr_detector import QrDetector


def test_qr_detector_reads_qr_code(tmp_path):
    encoder = cv2.QRCodeEncoder_create()
    image = encoder.encode("sample-qr-payload")
    image = cv2.resize(image, (250, 250), interpolation=cv2.INTER_NEAREST)
    image = cv2.copyMakeBorder(
        image,
        40,
        40,
        40,
        40,
        cv2.BORDER_CONSTANT,
        value=255,
    )
    image_path = tmp_path / "qr.png"
    cv2.imwrite(str(image_path), image)

    result = QrDetector().detect(image_path)

    assert result.detected is True
    assert result.data is None
    assert result.bbox is not None


def test_qr_detector_handles_images_without_qr(tmp_path):
    image_path = tmp_path / "blank.png"
    cv2.imwrite(str(image_path), np.full((120, 120, 3), 255, dtype=np.uint8))

    result = QrDetector().detect(image_path)

    assert result.detected is False
    assert result.data is None


def test_qr_detector_locates_top_right_qr_like_region_when_decode_fails(tmp_path):
    image = np.full((420, 640, 3), 245, dtype=np.uint8)
    for y in range(40, 170, 12):
        for x in range(480, 610, 12):
            if ((x // 12) + (y // 12)) % 2 == 0:
                cv2.rectangle(image, (x, y), (x + 7, y + 7), (10, 10, 10), -1)
    image_path = tmp_path / "qr-like.png"
    cv2.imwrite(str(image_path), image)

    result = QrDetector().detect(image_path)

    assert result.detected is True
    assert result.bbox is not None
