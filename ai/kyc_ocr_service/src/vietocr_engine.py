from __future__ import annotations

import logging
import os
import tempfile
from pathlib import Path
from typing import Any, Protocol

import cv2
from PIL import Image

from .paddle_engine import PaddleOcrEngine, _flatten_paddle_detection_result
from .schemas import OcrLine


LOGGER = logging.getLogger(__name__)


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
        primary_beam_threshold: float | None = None,
    ):
        self.fallback_engine = fallback_engine or PaddleOcrEngine()
        self.detector = detector or self.fallback_engine
        self.recognizer = recognizer or LazyVietOcrRecognizer()
        self.primary_beam_threshold = (
            primary_beam_threshold
            if primary_beam_threshold is not None
            else float(os.getenv("KYC_VIETOCR_PRIMARY_BEAM_THRESHOLD", "0.7"))
        )

    def recognize(self, image_path: Path) -> list[OcrLine]:
        return self._recognize(image_path, use_batch=True)

    def recognize_primary(self, image_path: Path) -> list[OcrLine]:
        return self._recognize(
            image_path,
            use_batch=True,
            low_confidence_threshold=self.primary_beam_threshold,
        )

    def recognize_precise(self, image_path: Path) -> list[OcrLine]:
        return self._recognize(image_path, use_batch=False)

    def _recognize(
        self,
        image_path: Path,
        *,
        use_batch: bool,
        low_confidence_threshold: float = 0.0,
    ) -> list[OcrLine]:
        try:
            boxes = _sort_boxes(self.detector.detect_text_boxes(image_path))
            if not boxes:
                return self.fallback_engine.recognize(image_path)
            image = cv2.imread(str(image_path))
            if image is None or image.size == 0:
                return self.fallback_engine.recognize(image_path)

            crops: list[Image.Image] = []
            crop_boxes: list[list[list[float]]] = []
            for box in boxes:
                crop = _crop_box(image, box)
                if crop is None:
                    continue
                crops.append(crop)
                crop_boxes.append(box)

            batch_recognize = (
                getattr(self.recognizer, "recognize_batch", None)
                if use_batch
                else None
            )
            results = (
                batch_recognize(crops)
                if crops and callable(batch_recognize)
                else [self.recognizer.recognize(crop) for crop in crops]
            )
            if low_confidence_threshold > 0:
                refined_results = []
                for crop, result in zip(crops, results, strict=True):
                    _, confidence = _normalize_recognizer_result(result)
                    if confidence is not None and confidence < low_confidence_threshold:
                        result = self.recognizer.recognize(crop)
                    refined_results.append(result)
                results = refined_results
            lines: list[OcrLine] = []
            for box, result in zip(crop_boxes, results, strict=True):
                text, confidence = _normalize_recognizer_result(result)
                text = text.strip()
                if text:
                    lines.append(OcrLine(text=text, confidence=confidence, bbox=box))
            return lines or self.fallback_engine.recognize(image_path)
        except Exception as exc:
            LOGGER.warning(
                "VietOCR recognition failed (%s); falling back to PaddleOCR.",
                type(exc).__name__,
            )
            try:
                return self.fallback_engine.recognize(image_path)
            except Exception as fallback_exc:
                LOGGER.error(
                    "PaddleOCR fallback also failed (%s); returning no OCR lines.",
                    type(fallback_exc).__name__,
                )
                return []


class LazyVietOcrRecognizer:
    def __init__(
        self,
        *,
        config_name: str | None = None,
        config_path: Path | None = None,
        weights_path: Path | None = None,
        device: str | None = None,
        beamsearch: bool = True,
    ):
        self.config_name = config_name or os.getenv("KYC_VIETOCR_CONFIG", "vgg_transformer")
        configured_path = os.getenv("KYC_VIETOCR_CONFIG_PATH")
        self.config_path = config_path or (
            Path(configured_path)
            if configured_path
            else Path(__file__).with_name("vietocr_vgg_transformer.yml")
        )
        configured_weights = os.getenv("KYC_VIETOCR_WEIGHTS")
        cached_weights = Path(tempfile.gettempdir()) / "vgg_transformer.pth"
        self.weights_path = weights_path or (
            Path(configured_weights)
            if configured_weights
            else cached_weights
            if cached_weights.exists()
            else None
        )
        self.device = device or os.getenv("KYC_VIETOCR_DEVICE") or _default_device()
        self.beamsearch = beamsearch
        self._predictor: Any | None = None

    def recognize(self, image: Image.Image) -> tuple[str, None]:
        predictor = self._get_predictor()
        return str(predictor.predict(image)).strip(), None

    def recognize_batch(
        self,
        images: list[Image.Image],
    ) -> list[tuple[str, float | None]]:
        if not images:
            return []
        predictor = self._get_predictor()
        texts, probabilities = predictor.predict_batch(images, return_prob=True)
        normalized_probabilities = [
            float(probability) if probability is not None else None
            for probability in probabilities
        ]
        return [
            (str(text).strip(), probability)
            for text, probability in zip(
                texts,
                normalized_probabilities,
                strict=True,
            )
        ]

    def _get_predictor(self) -> Any:
        if self._predictor is None:
            from vietocr.tool.config import Cfg
            from vietocr.tool.predictor import Predictor

            config = (
                Cfg.load_config_from_file(str(self.config_path))
                if self.config_path.exists()
                else Cfg.load_config_from_name(self.config_name)
            )
            config["device"] = self.device
            config["predictor"]["beamsearch"] = self.beamsearch
            if self.weights_path is not None:
                config["weights"] = str(self.weights_path)
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
    left = min(point[0] for point in box)
    top = min(point[1] for point in box)
    right = max(point[0] for point in box)
    bottom = max(point[1] for point in box)
    box_width = max(right - left, 1.0)
    box_height = max(bottom - top, 1.0)
    pad_x = max(6, int(round(box_width * 0.08)))
    pad_y = max(8, int(round(box_height * 0.45)))
    x1 = max(0, int(left) - pad_x)
    y1 = max(0, int(top) - pad_y)
    x2 = min(width, int(right) + pad_x)
    y2 = min(height, int(bottom) + pad_y)
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
