import numpy as np

from tools.evaluate_roboflow_cccd_dataset import (
    _create_reference_recognizer,
    _recognize_crop_text,
)


def test_create_reference_recognizer_selects_vietocr():
    recognizer = _create_reference_recognizer("vietocr")

    assert recognizer.beamsearch is False


def test_recognize_crop_text_uses_vietocr_recognizer_directly():
    class FakeRecognizer:
        def recognize(self, image):
            return "TRẦN ĐẠI NHÂN", 0.95

    text = _recognize_crop_text(
        np.full((32, 180, 3), 255, dtype=np.uint8),
        FakeRecognizer(),
    )

    assert text == "TRẦN ĐẠI NHÂN"
