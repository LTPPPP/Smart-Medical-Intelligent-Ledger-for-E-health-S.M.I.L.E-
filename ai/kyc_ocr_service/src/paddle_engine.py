from __future__ import annotations

from pathlib import Path
from typing import Any

from .schemas import OcrLine


class PaddleOcrEngine:
    def __init__(self, lang: str = "vi", use_angle_cls: bool = True):
        self.lang = lang
        self.use_angle_cls = use_angle_cls
        self._engine: Any | None = None

    def recognize(self, image_path: Path) -> list[OcrLine]:
        engine = self._get_engine()
        raw_result = engine.ocr(str(image_path), cls=self.use_angle_cls)
        return _flatten_paddle_result(raw_result)

    def _get_engine(self) -> Any:
        if self._engine is None:
            from paddleocr import PaddleOCR

            self._engine = PaddleOCR(lang=self.lang, use_angle_cls=self.use_angle_cls, show_log=False)
        return self._engine


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
