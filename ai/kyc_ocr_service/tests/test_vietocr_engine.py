from pathlib import Path

import numpy as np
from PIL import Image

from src.vietocr_engine import LazyVietOcrRecognizer


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
