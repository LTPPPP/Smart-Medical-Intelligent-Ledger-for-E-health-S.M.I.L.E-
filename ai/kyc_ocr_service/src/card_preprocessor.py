from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import cv2
import numpy as np

from .image_enhancement import OcrImageEnhancer
from .schemas import CheckResult
from .yolo_card_detector import YoloCardCornerDetector


ID1_ASPECT_RATIO = 85.60 / 53.98


class InvalidImageError(ValueError):
    pass


@dataclass(frozen=True)
class CardPreprocessMetadata:
    card_detected: bool
    card_corners: list[list[float]]
    card_area_ratio: float
    card_aspect_ratio: float | None
    perspective_corrected: bool
    ocr_image_upscaled: bool
    source_size: str
    quality_image_size: str
    ocr_image_size: str


@dataclass(frozen=True)
class CardPreprocessResult:
    quality_path: Path
    ocr_path: Path
    metadata: CardPreprocessMetadata
    checks: dict[str, CheckResult]


class CardCornerDetector(Protocol):
    def detect_corners(self, image: np.ndarray) -> np.ndarray | None:
        ...


class CardPreprocessor:
    def __init__(
        self,
        target_aspect_ratio: float = ID1_ASPECT_RATIO,
        min_card_area_ratio: float = 0.12,
        min_ocr_width: int = 1600,
        max_upscale: float = 3.5,
        image_enhancer: OcrImageEnhancer | None = None,
        card_corner_detector: CardCornerDetector | None = None,
    ):
        self.target_aspect_ratio = target_aspect_ratio
        self.min_card_area_ratio = min_card_area_ratio
        self.min_ocr_width = min_ocr_width
        self.max_upscale = max_upscale
        self.image_enhancer = image_enhancer or OcrImageEnhancer()
        self.card_corner_detector = (
            card_corner_detector
            if card_corner_detector is not None
            else YoloCardCornerDetector.from_env()
        )

    def preprocess(self, image_path: Path, output_dir: Path) -> CardPreprocessResult:
        image = cv2.imread(str(image_path))
        if image is None:
            raise InvalidImageError("Image cannot be decoded")

        output_dir.mkdir(parents=True, exist_ok=True)
        source_height, source_width = image.shape[:2]
        corners = self._detect_card_corners(image)

        if corners is None:
            quality_image = image
            quality_path = output_dir / f"{image_path.stem}-quality.jpg"
            cv2.imwrite(str(quality_path), quality_image)
            ocr_path, ocr_image, upscaled = self._write_ocr_image(
                quality_image,
                output_dir / f"{image_path.stem}-ocr.jpg",
            )
            metadata = CardPreprocessMetadata(
                card_detected=False,
                card_corners=[],
                card_area_ratio=0.0,
                card_aspect_ratio=None,
                perspective_corrected=False,
                ocr_image_upscaled=upscaled,
                source_size=_size_label(image),
                quality_image_size=_size_label(quality_image),
                ocr_image_size=_size_label(ocr_image),
            )
            return CardPreprocessResult(
                quality_path=quality_path,
                ocr_path=ocr_path,
                metadata=metadata,
                checks=self._checks(metadata),
            )

        ordered = _order_points(corners)
        card_area_ratio = float(cv2.contourArea(ordered.astype(np.float32))) / float(
            source_width * source_height
        )
        measured_aspect = _quad_aspect_ratio(ordered)
        quality_image = _warp_card(image, ordered, self.target_aspect_ratio)
        quality_path = output_dir / f"{image_path.stem}-quality.jpg"
        cv2.imwrite(str(quality_path), quality_image)
        ocr_path, ocr_image, upscaled = self._write_ocr_image(
            quality_image,
            output_dir / f"{image_path.stem}-ocr.jpg",
        )
        metadata = CardPreprocessMetadata(
            card_detected=True,
            card_corners=[[round(float(x), 1), round(float(y), 1)] for x, y in ordered],
            card_area_ratio=round(card_area_ratio, 4),
            card_aspect_ratio=round(measured_aspect, 4),
            perspective_corrected=True,
            ocr_image_upscaled=upscaled,
            source_size=_size_label(image),
            quality_image_size=_size_label(quality_image),
            ocr_image_size=_size_label(ocr_image),
        )
        return CardPreprocessResult(
            quality_path=quality_path,
            ocr_path=ocr_path,
            metadata=metadata,
            checks=self._checks(metadata),
        )

    def _detect_card_corners(self, image: np.ndarray) -> np.ndarray | None:
        detected = self._detect_card_corners_with_model(image)
        if detected is not None:
            return detected

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        candidates: list[np.ndarray] = []

        edges = cv2.Canny(blurred, 40, 140)
        edges = cv2.morphologyEx(
            edges,
            cv2.MORPH_CLOSE,
            cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9)),
            iterations=2,
        )
        candidates.extend(self._quadrilaterals(edges))

        for threshold_type in (cv2.THRESH_BINARY, cv2.THRESH_BINARY_INV):
            _, mask = cv2.threshold(
                blurred,
                0,
                255,
                threshold_type | cv2.THRESH_OTSU,
            )
            mask = cv2.morphologyEx(
                mask,
                cv2.MORPH_CLOSE,
                cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7)),
                iterations=2,
            )
            candidates.extend(self._quadrilaterals(mask))

        image_area = float(image.shape[0] * image.shape[1])
        scored: list[tuple[float, np.ndarray]] = []
        for candidate in candidates:
            area_ratio = float(cv2.contourArea(candidate)) / image_area
            if area_ratio < self.min_card_area_ratio or area_ratio > 0.995:
                continue
            aspect = _quad_aspect_ratio(_order_points(candidate))
            aspect_error = abs(aspect - self.target_aspect_ratio) / self.target_aspect_ratio
            if aspect_error > 0.35:
                continue
            score = area_ratio - (aspect_error * 0.45)
            scored.append((score, candidate))

        if scored:
            return max(scored, key=lambda item: item[0])[1]
        return self._frame_aligned_candidate(edges, image.shape[:2])

    def _detect_card_corners_with_model(self, image: np.ndarray) -> np.ndarray | None:
        if not self.card_corner_detector:
            return None
        try:
            corners = self.card_corner_detector.detect_corners(image)
        except Exception:
            return None
        if corners is None:
            return None
        corners = np.asarray(corners, dtype=np.float32).reshape(-1, 2)
        if len(corners) != 4:
            return None
        ordered = _order_points(corners)
        aspect = _quad_aspect_ratio(ordered)
        aspect_error = abs(aspect - self.target_aspect_ratio) / self.target_aspect_ratio
        area_ratio = float(cv2.contourArea(ordered)) / float(image.shape[0] * image.shape[1])
        if area_ratio < self.min_card_area_ratio or aspect_error > 0.35:
            return None
        return ordered

    def _quadrilaterals(self, mask: np.ndarray) -> list[np.ndarray]:
        contours, _ = cv2.findContours(mask, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        quadrilaterals: list[np.ndarray] = []
        for contour in sorted(contours, key=cv2.contourArea, reverse=True)[:25]:
            perimeter = cv2.arcLength(contour, True)
            if perimeter <= 0:
                continue
            approximation = cv2.approxPolyDP(contour, 0.025 * perimeter, True)
            if len(approximation) == 4 and cv2.isContourConvex(approximation):
                quadrilaterals.append(approximation.reshape(4, 2).astype(np.float32))
        return quadrilaterals

    def _frame_aligned_candidate(
        self,
        edges: np.ndarray,
        image_shape: tuple[int, int],
    ) -> np.ndarray | None:
        height, width = image_shape
        source_aspect = max(width, height) / float(min(width, height))
        source_aspect_error = (
            abs(source_aspect - self.target_aspect_ratio) / self.target_aspect_ratio
        )
        if source_aspect_error > 0.08:
            return None

        contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        image_area = float(width * height)
        candidates: list[tuple[float, np.ndarray]] = []
        for contour in sorted(contours, key=cv2.contourArea, reverse=True)[:15]:
            contour_area_ratio = float(cv2.contourArea(contour)) / image_area
            if contour_area_ratio < 0.08:
                continue
            rectangle = cv2.minAreaRect(contour)
            rect_width, rect_height = rectangle[1]
            if min(rect_width, rect_height) <= 0:
                continue
            rectangle_area_ratio = float(rect_width * rect_height) / image_area
            rectangle_aspect = max(rect_width, rect_height) / min(rect_width, rect_height)
            rectangle_aspect_error = (
                abs(rectangle_aspect - self.target_aspect_ratio)
                / self.target_aspect_ratio
            )
            if rectangle_area_ratio < 0.80 or rectangle_aspect_error > 0.15:
                continue
            candidates.append(
                (
                    rectangle_area_ratio - rectangle_aspect_error,
                    cv2.boxPoints(rectangle).astype(np.float32),
                ),
            )
        return max(candidates, key=lambda item: item[0])[1] if candidates else None

    def _write_ocr_image(
        self,
        quality_image: np.ndarray,
        target_path: Path,
    ) -> tuple[Path, np.ndarray, bool]:
        width = quality_image.shape[1]
        scale = min(self.max_upscale, max(1.0, self.min_ocr_width / float(width)))
        upscaled = scale > 1.01
        if upscaled:
            ocr_image = cv2.resize(
                quality_image,
                None,
                fx=scale,
                fy=scale,
                interpolation=cv2.INTER_LANCZOS4,
            )
        else:
            ocr_image = quality_image.copy()

        ocr_image = self.image_enhancer.enhance(ocr_image)
        blurred = cv2.GaussianBlur(ocr_image, (0, 0), 1.0)
        ocr_image = cv2.addWeighted(ocr_image, 1.35, blurred, -0.35, 0)
        cv2.imwrite(str(target_path), ocr_image)
        return target_path, ocr_image, upscaled

    def _checks(self, metadata: CardPreprocessMetadata) -> dict[str, CheckResult]:
        detected = metadata.card_detected
        area_status = (
            "PASS"
            if metadata.card_area_ratio >= 0.25
            else "WARNING"
            if metadata.card_area_ratio >= self.min_card_area_ratio
            else "FAIL"
        )
        aspect_error = (
            abs(metadata.card_aspect_ratio - self.target_aspect_ratio) / self.target_aspect_ratio
            if metadata.card_aspect_ratio
            else None
        )
        aspect_status = (
            "PASS"
            if aspect_error is not None and aspect_error <= 0.12
            else "WARNING"
            if aspect_error is not None and aspect_error <= 0.25
            else "FAIL"
        )
        return {
            "CARD_DETECTED": CheckResult(
                status="PASS" if detected else "FAIL",
                message="Detected a card-shaped document region."
                if detected
                else "Could not detect a card-shaped document region.",
                value=detected,
            ),
            "CARD_AREA_RATIO": CheckResult(
                status=area_status,
                message=f"Detected card covers {metadata.card_area_ratio:.1%} of the image.",
                value=metadata.card_area_ratio,
            ),
            "CARD_ASPECT_RATIO": CheckResult(
                status=aspect_status,
                message=f"Detected card aspect ratio is {metadata.card_aspect_ratio:.3f}."
                if metadata.card_aspect_ratio
                else "Card aspect ratio is unavailable.",
                value=metadata.card_aspect_ratio,
            ),
            "PERSPECTIVE_CORRECTED": CheckResult(
                status="PASS" if metadata.perspective_corrected else "FAIL",
                message="Card perspective was corrected."
                if metadata.perspective_corrected
                else "Perspective correction was not available.",
                value=metadata.perspective_corrected,
            ),
            "OCR_IMAGE_UPSCALED": CheckResult(
                status="PASS",
                message=f"OCR image size is {metadata.ocr_image_size}."
                + (" Image was upscaled." if metadata.ocr_image_upscaled else " Upscaling was not needed."),
                value=metadata.ocr_image_upscaled,
            ),
        }


def _order_points(points: np.ndarray) -> np.ndarray:
    points = np.asarray(points, dtype=np.float32).reshape(4, 2)
    sums = points.sum(axis=1)
    differences = np.diff(points, axis=1).reshape(-1)
    return np.array(
        [
            points[np.argmin(sums)],
            points[np.argmin(differences)],
            points[np.argmax(sums)],
            points[np.argmax(differences)],
        ],
        dtype=np.float32,
    )


def _quad_aspect_ratio(points: np.ndarray) -> float:
    top_left, top_right, bottom_right, bottom_left = points
    width = max(
        np.linalg.norm(top_right - top_left),
        np.linalg.norm(bottom_right - bottom_left),
    )
    height = max(
        np.linalg.norm(bottom_left - top_left),
        np.linalg.norm(bottom_right - top_right),
    )
    if height <= 0:
        return 0.0
    ratio = float(width / height)
    return ratio if ratio >= 1.0 else 1.0 / ratio


def _warp_card(
    image: np.ndarray,
    points: np.ndarray,
    target_aspect_ratio: float,
) -> np.ndarray:
    top_left, top_right, bottom_right, bottom_left = points
    measured_width = max(
        np.linalg.norm(top_right - top_left),
        np.linalg.norm(bottom_right - bottom_left),
    )
    measured_height = max(
        np.linalg.norm(bottom_left - top_left),
        np.linalg.norm(bottom_right - top_right),
    )
    target_width = max(2, int(round(max(measured_width, measured_height * target_aspect_ratio))))
    target_height = max(2, int(round(target_width / target_aspect_ratio)))
    destination = np.array(
        [
            [0, 0],
            [target_width - 1, 0],
            [target_width - 1, target_height - 1],
            [0, target_height - 1],
        ],
        dtype=np.float32,
    )
    matrix = cv2.getPerspectiveTransform(points, destination)
    return cv2.warpPerspective(
        image,
        matrix,
        (target_width, target_height),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE,
    )


def _size_label(image: np.ndarray) -> str:
    return f"{image.shape[1]}x{image.shape[0]}"
