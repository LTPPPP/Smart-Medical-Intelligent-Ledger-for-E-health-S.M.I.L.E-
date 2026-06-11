from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from src.schemas import OcrLine
from src.vietocr_engine import (
    LazyVietOcrRecognizer,
    VietOcrFirstEngine,
    _crop_box,
    _flatten_paddle_detection_result,
)


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


class BatchRecognizer:
    def __init__(self, texts):
        self.texts = list(texts)
        self.batches = []

    def recognize(self, image):
        raise AssertionError("single-image recognition should not be used")

    def recognize_batch(self, images):
        self.batches.append(list(images))
        return [(text, 0.92) for text in self.texts]


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


def test_vietocr_first_engine_batches_sorted_detection_crops(tmp_path: Path):
    image_path = tmp_path / "card.jpg"
    cv2.imwrite(str(image_path), np.full((120, 240, 3), 255, dtype=np.uint8))
    lower_box = [[10, 70], [120, 70], [120, 95], [10, 95]]
    upper_box = [[10, 20], [150, 20], [150, 48], [10, 48]]
    recognizer = BatchRecognizer(["CĂN CƯỚC CÔNG DÂN", "Số / No: 012345678901"])
    engine = VietOcrFirstEngine(
        detector=FakeDetector([lower_box, upper_box]),
        recognizer=recognizer,
        fallback_engine=FakeFallback(),
    )

    lines = engine.recognize(image_path)

    assert [line.text for line in lines] == ["CĂN CƯỚC CÔNG DÂN", "Số / No: 012345678901"]
    assert [line.confidence for line in lines] == [0.92, 0.92]
    assert len(recognizer.batches) == 1
    assert len(recognizer.batches[0]) == 2


def test_vietocr_first_engine_precise_mode_uses_single_image_recognition(
    tmp_path: Path,
):
    image_path = tmp_path / "field-crop.jpg"
    cv2.imwrite(str(image_path), np.full((120, 240, 3), 255, dtype=np.uint8))
    lower_box = [[10, 70], [120, 70], [120, 95], [10, 95]]
    upper_box = [[10, 20], [150, 20], [150, 48], [10, 48]]
    recognizer = SequenceRecognizer(["DÒNG TRÊN", "DÒNG DƯỚI"])
    engine = VietOcrFirstEngine(
        detector=FakeDetector([lower_box, upper_box]),
        recognizer=recognizer,
        fallback_engine=FakeFallback(),
    )

    lines = engine.recognize_precise(image_path)

    assert [line.text for line in lines] == ["DÒNG TRÊN", "DÒNG DƯỚI"]
    assert len(recognizer.crops) == 2


def test_vietocr_first_engine_primary_mode_rechecks_low_confidence_lines(
    tmp_path: Path,
):
    image_path = tmp_path / "card.jpg"
    cv2.imwrite(str(image_path), np.full((120, 240, 3), 255, dtype=np.uint8))
    boxes = [
        [[10, 20], [150, 20], [150, 48], [10, 48]],
        [[10, 70], [120, 70], [120, 95], [10, 95]],
    ]

    class HybridRecognizer:
        def __init__(self):
            self.single_images = []

        def recognize_batch(self, images):
            return [("HIGH", 0.95), ("LOW GREEDY", 0.6)]

        def recognize(self, image):
            self.single_images.append(image)
            return "LOW BEAM", None

    recognizer = HybridRecognizer()
    engine = VietOcrFirstEngine(
        detector=FakeDetector(boxes),
        recognizer=recognizer,
        fallback_engine=FakeFallback(),
        primary_beam_threshold=0.7,
    )

    lines = engine.recognize_primary(image_path)

    assert [line.text for line in lines] == ["HIGH", "LOW BEAM"]
    assert len(recognizer.single_images) == 1


def test_vietocr_first_engine_falls_back_when_recognizer_fails(
    tmp_path: Path,
    caplog,
):
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
    assert "falling back to PaddleOCR" in caplog.text


def test_vietocr_first_engine_returns_empty_when_fallback_also_fails(
    tmp_path: Path,
    caplog,
):
    image_path = tmp_path / "card.jpg"
    cv2.imwrite(str(image_path), np.full((80, 160, 3), 255, dtype=np.uint8))

    class FailingDetector:
        def detect_text_boxes(self, image_path):
            raise RuntimeError("detector unavailable")

    class FailingFallback:
        def recognize(self, image_path):
            raise RuntimeError("fallback unavailable")

    engine = VietOcrFirstEngine(
        detector=FailingDetector(),
        recognizer=SequenceRecognizer([]),
        fallback_engine=FailingFallback(),
    )

    lines = engine.recognize(image_path)

    assert lines == []
    assert "PaddleOCR fallback also failed" in caplog.text


def test_crop_box_adds_enough_vertical_padding_for_vietnamese_diacritics():
    image = np.full((80, 160, 3), 255, dtype=np.uint8)
    tight_box = [[50, 30], [100, 30], [100, 40], [50, 40]]

    crop = _crop_box(image, tight_box)

    assert crop is not None
    assert crop.height >= 24
    assert crop.width >= 60


def test_lazy_vietocr_recognizer_loads_local_config_without_remote_lookup(
    tmp_path: Path,
    monkeypatch,
):
    from vietocr.tool.config import Cfg
    from vietocr.tool import predictor as predictor_module

    config_path = tmp_path / "vietocr.yml"
    config_path.write_text("predictor:\n  beamsearch: false\n", encoding="utf-8")
    weights_path = tmp_path / "weights.pth"
    calls = {}

    def load_from_file(path):
        calls["config_path"] = path
        return {"predictor": {"beamsearch": False}}

    def fail_remote_lookup(name):
        raise AssertionError(f"unexpected remote config lookup: {name}")

    class FakePredictor:
        def __init__(self, config):
            calls["config"] = config

    monkeypatch.setattr(Cfg, "load_config_from_file", staticmethod(load_from_file))
    monkeypatch.setattr(Cfg, "load_config_from_name", staticmethod(fail_remote_lookup))
    monkeypatch.setattr(predictor_module, "Predictor", FakePredictor)

    recognizer = LazyVietOcrRecognizer(
        config_path=config_path,
        weights_path=weights_path,
        device="cpu",
        beamsearch=True,
    )

    recognizer._get_predictor()

    assert Path(calls["config_path"]) == config_path
    assert calls["config"]["weights"] == str(weights_path)
    assert calls["config"]["device"] == "cpu"
    assert calls["config"]["predictor"]["beamsearch"] is True


def test_lazy_vietocr_recognizer_uses_predictor_batch_api(monkeypatch):
    calls = {}

    class FakePredictor:
        def predict_batch(self, images, return_prob=False):
            calls["images"] = images
            calls["return_prob"] = return_prob
            return ["MỘT", "HAI"], [0.8, 0.9]

    recognizer = LazyVietOcrRecognizer(device="cpu")
    monkeypatch.setattr(recognizer, "_get_predictor", lambda: FakePredictor())
    images = [
        Image.fromarray(np.full((20, 40, 3), 255, dtype=np.uint8)),
        Image.fromarray(np.full((20, 60, 3), 255, dtype=np.uint8)),
    ]

    results = recognizer.recognize_batch(images)

    assert results == [("MỘT", 0.8), ("HAI", 0.9)]
    assert calls == {"images": images, "return_prob": True}


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
