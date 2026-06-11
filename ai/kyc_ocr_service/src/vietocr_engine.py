from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Protocol

import cv2
from PIL import Image

from .paddle_engine import PaddleOcrEngine, _flatten_paddle_detection_result
from .schemas import OcrLine


class TextBoxDetector(Protocol):
    def detect_text_boxes(self, image_path: Path) -> list[list[list[float]]]:
        ...


class TextRecognizer(Protocol):
    def recognize(self, image: Image.Image) -> str | tuple[str, float | None]:
        ...


class VietOcrFirstEngine:
    name = "vietocr-first"

    def __init__(
        self,
        *,
        detector: TextBoxDetector | None = None,
        recognizer: TextRecognizer | None = None,
        fallback_engine: PaddleOcrEngine | None = None,
    ):
        self.fallback_engine = fallback_engine or PaddleOcrEngine()
        self.detector = detector or self.fallback_engine
        self.recognizer = recognizer or LazyVietOcrRecognizer()

    def recognize(self, image_path: Path) -> list[OcrLine]:
        try:
            boxes = _sort_boxes(self.detector.detect_text_boxes(image_path))
            if not boxes:
                return self.fallback_engine.recognize(image_path)
            image = cv2.imread(str(image_path))
            if image is None or image.size == 0:
                return self.fallback_engine.recognize(image_path)

            lines: list[OcrLine] = []
            for box in boxes:
                crop = _crop_box(image, box)
                if crop is None:
                    continue
                text, confidence = _normalize_recognizer_result(self.recognizer.recognize(crop))
                text = text.strip()
                if text:
                    lines.append(OcrLine(text=text, confidence=confidence, bbox=box))
            return lines or self.fallback_engine.recognize(image_path)
        except Exception:
            return self.fallback_engine.recognize(image_path)


class LazyVietOcrRecognizer:
    def __init__(
        self,
        *,
        config_name: str | None = None,
        device: str | None = None,
        beamsearch: bool = True,
    ):
        self.config_name = config_name or os.getenv("KYC_VIETOCR_CONFIG", "vgg_transformer")
        self.device = device or os.getenv("KYC_VIETOCR_DEVICE") or _default_device()
        self.beamsearch = beamsearch
        self._predictor: Any | None = None

    def recognize(self, image: Image.Image) -> tuple[str, None]:
        predictor = self._get_predictor()
        return str(predictor.predict(image)).strip(), None

    def _get_predictor(self) -> Any:
        if self._predictor is None:
            from vietocr.tool.config import Cfg
            from vietocr.tool.predictor import Predictor

            config = Cfg.load_config_from_name(self.config_name)
            config["device"] = self.device
            config["predictor"]["beamsearch"] = self.beamsearch
            self._predictor = Predictor(config)
        return self._predictor


def create_default_ocr_engine() -> PaddleOcrEngine | VietOcrFirstEngine:
    engine_name = os.getenv("KYC_OCR_ENGINE", "vietocr").strip().lower()
    if engine_name in {"paddle", "paddleocr"}:
        return PaddleOcrEngine()
    return VietOcrFirstEngine()


def _default_device() -> str:
    try:
        import torch

        return "cuda:0" if torch.cuda.is_available() else "cpu"
    except Exception:
        return "cpu"


def _sort_boxes(boxes: list[list[list[float]]]) -> list[list[list[float]]]:
    return sorted(boxes, key=lambda box: (_box_top(box), _box_left(box)))


def _box_top(box: list[list[float]]) -> float:
    return min(point[1] for point in box)


def _box_left(box: list[list[float]]) -> float:
    return min(point[0] for point in box)


def _crop_box(image, box: list[list[float]]) -> Image.Image | None:
    height, width = image.shape[:2]
    x1 = max(0, int(min(point[0] for point in box)) - 4)
    y1 = max(0, int(min(point[1] for point in box)) - 4)
    x2 = min(width, int(max(point[0] for point in box)) + 4)
    y2 = min(height, int(max(point[1] for point in box)) + 4)
    if x2 <= x1 or y2 <= y1:
        return None
    crop = image[y1:y2, x1:x2]
    rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    return Image.fromarray(rgb)


def _normalize_recognizer_result(value: str | tuple[str, float | None]) -> tuple[str, float | None]:
    if isinstance(value, tuple):
        text = value[0] if value else ""
        confidence = value[1] if len(value) > 1 else None
        return str(text), confidence
    return str(value), None
