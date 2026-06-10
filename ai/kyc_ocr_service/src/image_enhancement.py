from __future__ import annotations

import cv2
import numpy as np


class OcrImageEnhancer:
    def __init__(
        self,
        shadow_kernel_size: int = 7,
        background_blur_size: int = 21,
        clahe_clip_limit: float = 2.0,
        clahe_tile_grid_size: tuple[int, int] = (8, 8),
    ):
        self.shadow_kernel_size = _odd_at_least(shadow_kernel_size, 3)
        self.background_blur_size = _odd_at_least(background_blur_size, 3)
        self.clahe_clip_limit = clahe_clip_limit
        self.clahe_tile_grid_size = clahe_tile_grid_size

    def enhance(self, image: np.ndarray) -> np.ndarray:
        if image is None or image.size == 0:
            raise ValueError("Empty image input to OcrImageEnhancer.enhance()")

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image.copy()
        balanced = self._remove_shadow(gray)
        clahe = cv2.createCLAHE(
            clipLimit=self.clahe_clip_limit,
            tileGridSize=self.clahe_tile_grid_size,
        )
        balanced = clahe.apply(balanced)
        balanced = cv2.fastNlMeansDenoising(balanced, None, 7, 7, 21)
        return cv2.cvtColor(balanced, cv2.COLOR_GRAY2BGR)

    def _remove_shadow(self, gray: np.ndarray) -> np.ndarray:
        kernel = np.ones((self.shadow_kernel_size, self.shadow_kernel_size), np.uint8)
        dilated = cv2.dilate(gray, kernel)
        background = cv2.medianBlur(dilated, self.background_blur_size)
        diff = 255 - cv2.absdiff(gray, background)
        return _auto_brightness_contrast(diff, clip_hist_percent=1.0)


def _auto_brightness_contrast(gray: np.ndarray, clip_hist_percent: float) -> np.ndarray:
    hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
    accumulator = np.cumsum(hist)
    maximum = float(accumulator[-1])
    if maximum <= 0:
        return gray.copy()

    clip_amount = clip_hist_percent * (maximum / 100.0) / 2.0
    minimum_gray = int(np.searchsorted(accumulator, clip_amount))
    maximum_gray = int(np.searchsorted(accumulator, maximum - clip_amount))
    if maximum_gray <= minimum_gray:
        return gray.copy()

    alpha = 255.0 / float(maximum_gray - minimum_gray)
    beta = -minimum_gray * alpha
    return cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)


def _odd_at_least(value: int, minimum: int) -> int:
    value = max(int(value), minimum)
    return value if value % 2 == 1 else value + 1
