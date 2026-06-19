from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import numpy as np


CORNER_NAMES = ("top_left", "top_right", "bot_right", "bot_left")
CORNER_ALIASES = {
    "bottom_right": "bot_right",
    "bottom_left": "bot_left",
}


class YoloCardCornerDetector:
    def __init__(
        self,
        model_path: Path,
        image_size: int = 640,
        device: str | None = None,
        min_confidence: float = 0.5,
    ):
        self.model_path = model_path
        self.image_size = image_size
        self.device = device
        self.min_confidence = min_confidence
        self._model: Any | None = None

    @classmethod
    def from_env(cls) -> "YoloCardCornerDetector | None":
        model_path = os.getenv("KYC_CARD_YOLO_MODEL")
        if not model_path:
            return None
        return cls(
            model_path=Path(model_path),
            image_size=int(os.getenv("KYC_CARD_YOLO_IMAGE_SIZE", "640")),
            device=os.getenv("KYC_CARD_YOLO_DEVICE") or None,
            min_confidence=float(os.getenv("KYC_CARD_YOLO_MIN_CONFIDENCE", "0.5")),
        )

    def detect_corners(self, image: np.ndarray) -> np.ndarray | None:
        if image is None or image.size == 0:
            return None
        model = self._get_model()
        predict_kwargs: dict[str, Any] = {
            "source": image,
            "imgsz": self.image_size,
            "verbose": False,
        }
        if self.device:
            predict_kwargs["device"] = self.device
        results = model.predict(**predict_kwargs)
        if not results:
            return None
        return corners_from_yolo_result(results[0], min_confidence=self.min_confidence)

    def _get_model(self) -> Any:
        if self._model is None:
            from ultralytics import YOLO

            self._model = YOLO(str(self.model_path))
        return self._model


def corners_from_yolo_result(result: Any, min_confidence: float = 0.5) -> np.ndarray | None:
    boxes = getattr(result, "boxes", None)
    if boxes is None or len(boxes) == 0:
        return None

    names = getattr(result, "names", {})
    classes = _to_numpy(boxes.cls)
    xyxy = _to_numpy(boxes.xyxy)
    corner_points: dict[str, tuple[float, float]] = {}
    corner_scores: dict[str, float] = {}

    for index, class_id in enumerate(classes):
        class_name = _canonical_corner_name(str(names.get(int(class_id), int(class_id))))
        if class_name not in CORNER_NAMES:
            continue
        confidence = float(boxes.conf[index].item())
        if confidence < min_confidence or confidence <= corner_scores.get(class_name, -1.0):
            continue
        x1, y1, x2, y2 = [float(value) for value in xyxy[index]]
        corner_points[class_name] = ((x1 + x2) / 2.0, (y1 + y2) / 2.0)
        corner_scores[class_name] = confidence

    if len(corner_points) == 3:
        corner_points = estimate_missing_corner(corner_points)
    if any(name not in corner_points for name in CORNER_NAMES):
        return None

    return np.asarray([corner_points[name] for name in CORNER_NAMES], dtype=np.float32)


def estimate_missing_corner(
    corners: dict[str, tuple[float, float]],
) -> dict[str, tuple[float, float]]:
    normalized = {_canonical_corner_name(name): value for name, value in corners.items()}
    missing = [name for name in CORNER_NAMES if name not in normalized]
    if len(missing) != 1:
        return normalized

    name = missing[0]
    try:
        if name == "top_left":
            normalized[name] = _point_add(normalized["top_right"], normalized["bot_left"], normalized["bot_right"])
        elif name == "top_right":
            normalized[name] = _point_add(normalized["top_left"], normalized["bot_right"], normalized["bot_left"])
        elif name == "bot_right":
            normalized[name] = _point_add(normalized["top_right"], normalized["bot_left"], normalized["top_left"])
        elif name == "bot_left":
            normalized[name] = _point_add(normalized["top_left"], normalized["bot_right"], normalized["top_right"])
    except KeyError:
        return normalized
    return normalized


def _point_add(
    first: tuple[float, float],
    second: tuple[float, float],
    subtract: tuple[float, float],
) -> tuple[float, float]:
    return (first[0] + second[0] - subtract[0], first[1] + second[1] - subtract[1])


def _canonical_corner_name(name: str) -> str:
    return CORNER_ALIASES.get(name, name)


def _to_numpy(value: Any) -> np.ndarray:
    if hasattr(value, "cpu"):
        value = value.cpu()
    if hasattr(value, "numpy"):
        value = value.numpy()
    return np.asarray(value)
