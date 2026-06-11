from __future__ import annotations

from pathlib import Path

from .schemas import CheckResult


class ImageQualityAnalyzer:
    def __init__(
        self,
        min_width: int = 800,
        min_height: int = 500,
        min_laplacian_var: float = 80.0,
        min_brightness: float = 35.0,
        max_brightness: float = 235.0,
    ):
        self.min_width = min_width
        self.min_height = min_height
        self.min_laplacian_var = min_laplacian_var
        self.min_brightness = min_brightness
        self.max_brightness = max_brightness

    def analyze(self, image_path: Path) -> dict[str, CheckResult]:
        import cv2

        image = cv2.imread(str(image_path))
        if image is None:
            return {
                "IMAGE_READABLE": CheckResult(status="FAIL", message="Image cannot be decoded."),
            }

        height, width = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        brightness = float(gray.mean())
        glare_ratio = _largest_bright_region_ratio(cv2, gray)
        screenshot_score = _screenshot_border_score(gray)

        return {
            "RESOLUTION_OK": CheckResult(
                status="PASS" if width >= self.min_width and height >= self.min_height else "FAIL",
                message=f"Image resolution is {width}x{height}.",
                value=f"{width}x{height}",
            ),
            "BLUR_OK": CheckResult(
                status="PASS" if blur_score >= self.min_laplacian_var else "FAIL",
                message=f"Image blur score is {blur_score:.1f}.",
                value=round(blur_score, 1),
            ),
            "BRIGHTNESS_OK": CheckResult(
                status="PASS" if self.min_brightness <= brightness <= self.max_brightness else "FAIL",
                message=f"Image brightness is {brightness:.1f}.",
                value=round(brightness, 1),
            ),
            "GLARE_SUSPECTED": CheckResult(
                status="FAIL" if glare_ratio >= 0.18 else "WARNING" if glare_ratio >= 0.08 else "PASS",
                message=f"Largest bright glare-like region covers {glare_ratio:.1%} of the image.",
                value=round(glare_ratio, 4),
            ),
            "SCREENSHOT_SUSPECTED": CheckResult(
                status="FAIL" if screenshot_score >= 0.35 else "PASS",
                message=f"Screenshot-like border score is {screenshot_score:.2f}.",
                value=round(screenshot_score, 3),
            ),
        }


def _largest_bright_region_ratio(cv2, gray) -> float:
    import numpy as np

    mask = (gray >= 248).astype(np.uint8) * 255
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return 0.0
    largest_area = max(float(cv2.contourArea(contour)) for contour in contours)
    return largest_area / float(gray.shape[0] * gray.shape[1])


def _screenshot_border_score(gray) -> float:
    import numpy as np

    height, width = gray.shape[:2]
    border = max(8, min(height, width) // 18)
    top = gray[:border, :]
    bottom = gray[-border:, :]
    left = gray[:, :border]
    right = gray[:, -border:]
    border_mean = float(np.mean([top.mean(), bottom.mean(), left.mean(), right.mean()]))
    center_mean = float(gray[border:-border, border:-border].mean())
    if center_mean <= 0:
        return 0.0
    contrast = max(0.0, center_mean - border_mean) / 255.0
    dark_border_bonus = 0.3 if border_mean < 80 else 0.0
    return min(1.0, contrast + dark_border_bonus)
