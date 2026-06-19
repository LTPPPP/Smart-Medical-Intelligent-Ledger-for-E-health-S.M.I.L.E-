from __future__ import annotations

import importlib.util
from pathlib import Path
from typing import Any

from .schemas import OcrLine


class PaddleOcrEngine:
    name = "paddleocr"

    def __init__(self, lang: str = "vi", use_angle_cls: bool = True):
        self.lang = lang
        self.use_angle_cls = use_angle_cls
        self._engine: Any | None = None

    def recognize(self, image_path: Path) -> list[OcrLine]:
        engine = self._get_engine()
        raw_result = engine.ocr(str(image_path), cls=self.use_angle_cls)
        return _flatten_paddle_result(raw_result)

    def detect_text_boxes(self, image_path: Path) -> list[list[list[float]]]:
        engine = self._get_engine()
        raw_result = engine.ocr(str(image_path), det=True, rec=False, cls=False)
        return _flatten_paddle_detection_result(raw_result)

    def _get_engine(self) -> Any:
        if self._engine is None:
            _preload_torch_if_available()
            from paddleocr import PaddleOCR

            self._engine = PaddleOCR(lang=self.lang, use_angle_cls=self.use_angle_cls, show_log=False)
        return self._engine


def _preload_torch_if_available() -> None:
    if importlib.util.find_spec("torch") is None:
        return
    # PaddleOCR imports albumentations, which imports albumentations.pytorch
    # when torch is installed. On Windows this is more reliable if torch loads
    # its DLLs before Paddle has loaded its native extensions.
    import torch  # noqa: F401


def _flatten_paddle_result(raw_result: Any) -> list[OcrLine]:
    lines: list[OcrLine] = []
    for page in raw_result or []:
        for item in page or []:
            if not isinstance(item, (list, tuple)) or len(item) < 2:
                continue
            bbox = item[0] if isinstance(item[0], list) else None
            text_meta = item[1]
            if not isinstance(text_meta, (list, tuple)) or not text_meta:
                continue
            text = str(text_meta[0]).strip()
            confidence = float(text_meta[1]) if len(text_meta) > 1 and text_meta[1] is not None else None
            if text:
                lines.append(OcrLine(text=text, confidence=confidence, bbox=bbox))
    return lines


def _flatten_paddle_detection_result(raw_result: Any) -> list[list[list[float]]]:
    boxes: list[list[list[float]]] = []
    for page in raw_result or []:
        for item in page or []:
            box = _normalize_box(item)
            if box:
                boxes.append(box)
    return boxes


def _normalize_box(value: Any) -> list[list[float]] | None:
    if not isinstance(value, (list, tuple)) or len(value) != 4:
        return None
    points: list[list[float]] = []
    for point in value:
        if not isinstance(point, (list, tuple)) or len(point) < 2:
            return None
        points.append([float(point[0]), float(point[1])])
    return points
