import cv2
import numpy as np
import pytest

from src.image_enhancement import OcrImageEnhancer


def test_ocr_image_enhancer_balances_shadowed_text_region():
    image = np.full((160, 320, 3), 210, dtype=np.uint8)
    image[:, 160:] = 125
    cv2.putText(image, "HO VA TEN", (24, 88), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (35, 35, 35), 2)
    cv2.putText(image, "NGUYEN VAN A", (170, 88), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (45, 45, 45), 2)

    enhanced = OcrImageEnhancer().enhance(image)

    assert enhanced.shape == image.shape
    assert enhanced.dtype == np.uint8
    assert abs(float(enhanced[:, :160].mean()) - float(enhanced[:, 160:].mean())) < 70


def test_ocr_image_enhancer_rejects_empty_input():
    with pytest.raises(ValueError):
        OcrImageEnhancer().enhance(np.array([], dtype=np.uint8))
