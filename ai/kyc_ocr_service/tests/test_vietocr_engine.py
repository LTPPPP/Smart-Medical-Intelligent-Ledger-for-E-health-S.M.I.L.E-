from pathlib import Path

import cv2
import numpy as np

from src.schemas import OcrLine
from src.vietocr_engine import VietOcrFirstEngine, _flatten_paddle_detection_result


class FakeDetector:
    def __init__(self, boxes):
        self.boxes = boxes
        self.paths = []

    def detect_text_boxes(self, image_path: Path):
        self.paths.append(image_path)
        return self.boxes


class SequenceRecognizer:
    def __init__(self, texts):
        self.texts = list(texts)
        self.crops = []

    def recognize(self, image):
        self.crops.append(image)
        return self.texts.pop(0), 0.91


class FakeFallback:
    def __init__(self):
        self.paths = []

    def recognize(self, image_path: Path):
        self.paths.append(image_path)
        return [OcrLine(text="fallback text", confidence=0.5)]


def test_vietocr_first_engine_recognizes_sorted_paddle_detection_boxes(tmp_path: Path):
    image_path = tmp_path / "card.jpg"
    cv2.imwrite(str(image_path), np.full((120, 240, 3), 255, dtype=np.uint8))
    lower_box = [[10, 70], [120, 70], [120, 95], [10, 95]]
    upper_box = [[10, 20], [150, 20], [150, 48], [10, 48]]
    detector = FakeDetector([lower_box, upper_box])
    recognizer = SequenceRecognizer(["CĂN CƯỚC CÔNG DÂN", "Số / No: 012345678901"])
    engine = VietOcrFirstEngine(
        detector=detector,
        recognizer=recognizer,
        fallback_engine=FakeFallback(),
    )

    lines = engine.recognize(image_path)

    assert [line.text for line in lines] == ["CĂN CƯỚC CÔNG DÂN", "Số / No: 012345678901"]
    assert lines[0].bbox == [[10.0, 20.0], [150.0, 20.0], [150.0, 48.0], [10.0, 48.0]]
    assert lines[0].confidence == 0.91
    assert len(recognizer.crops) == 2
    assert detector.paths == [image_path]


def test_vietocr_first_engine_falls_back_when_recognizer_fails(tmp_path: Path):
    image_path = tmp_path / "card.jpg"
    cv2.imwrite(str(image_path), np.full((80, 160, 3), 255, dtype=np.uint8))

    class FailingRecognizer:
        def recognize(self, image):
            raise RuntimeError("model unavailable")

    fallback = FakeFallback()
    engine = VietOcrFirstEngine(
        detector=FakeDetector([[[10, 10], [80, 10], [80, 30], [10, 30]]]),
        recognizer=FailingRecognizer(),
        fallback_engine=fallback,
    )

    lines = engine.recognize(image_path)

    assert [line.text for line in lines] == ["fallback text"]
    assert fallback.paths == [image_path]


def test_flatten_paddle_detection_result_accepts_page_wrapped_boxes():
    raw = [
        [
            [[1, 2], [3, 2], [3, 4], [1, 4]],
            [[10, 20], [30, 20], [30, 40], [10, 40]],
        ]
    ]

    boxes = _flatten_paddle_detection_result(raw)

    assert boxes == [
        [[1.0, 2.0], [3.0, 2.0], [3.0, 4.0], [1.0, 4.0]],
        [[10.0, 20.0], [30.0, 20.0], [30.0, 40.0], [10.0, 40.0]],
    ]
