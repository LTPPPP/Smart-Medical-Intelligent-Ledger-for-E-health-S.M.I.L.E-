from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Any

from PIL import Image


class LazyVietOcrRecognizer:
    """Load the local VietOCR predictor only when the first crop is read."""

    def __init__(
        self,
        *,
        config_name: str | None = None,
        config_path: Path | None = None,
        weights_path: Path | None = None,
        device: str | None = None,
        beamsearch: bool = True,
    ):
        self.config_name = config_name or os.getenv(
            "KYC_VIETOCR_CONFIG",
            "vgg_transformer",
        )
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


def _default_device() -> str:
    try:
        import torch

        return "cuda:0" if torch.cuda.is_available() else "cpu"
    except Exception:
        return "cpu"
