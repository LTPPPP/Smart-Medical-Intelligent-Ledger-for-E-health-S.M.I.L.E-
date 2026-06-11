import numpy as np

from src.paddle_engine import PaddleOcrEngine
from src.vietocr_engine import VietOcrFirstEngine
from tools.evaluate_roboflow_cccd_dataset import _create_engine, _recognize_crop_text


def test_create_engine_selects_vietocr_first_pipeline():
    engine = _create_engine("vietocr", "vi")

    assert isinstance(engine, VietOcrFirstEngine)


def test_create_engine_can_select_paddle_baseline():
    engine = _create_engine("paddle", "vi")

    assert isinstance(engine, PaddleOcrEngine)


def test_recognize_crop_text_uses_vietocr_recognizer_directly():
    class FakeRecognizer:
        def recognize(self, image):
            return "TRẦN ĐẠI NHÂN", 0.95

    engine = VietOcrFirstEngine.__new__(VietOcrFirstEngine)
    engine.recognizer = FakeRecognizer()

    text = _recognize_crop_text(
        np.full((32, 180, 3), 255, dtype=np.uint8),
        engine,
    )

    assert text == "TRẦN ĐẠI NHÂN"
