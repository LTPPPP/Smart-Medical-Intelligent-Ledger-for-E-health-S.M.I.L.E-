from __future__ import annotations

from pathlib import Path

import cv2

from .schemas import QrDetectionResult


class QrDetector:
    def detect(self, image_path: Path) -> QrDetectionResult:
        image = cv2.imread(str(image_path))
        if image is None:
            return QrDetectionResult()

        detector = cv2.QRCodeDetector()
        multi_result = self._detect_multi(detector, image)
        if multi_result.detected:
            return multi_result

        data, points, _ = detector.detectAndDecode(image)
        if points is None:
            detected, detected_points = detector.detect(image)
            if detected and detected_points is not None:
                return QrDetectionResult(
                    detected=True,
                    bbox=_points_to_bbox(detected_points),
                )
            return _detect_top_right_qr_like_region(image, decoded=bool(data))
        return QrDetectionResult(
            detected=True,
            bbox=_points_to_bbox(points),
        )

    def _detect_multi(self, detector, image) -> QrDetectionResult:
        if not hasattr(detector, "detectAndDecodeMulti"):
            return QrDetectionResult()
        try:
            ok, decoded_info, points, _ = detector.detectAndDecodeMulti(image)
        except cv2.error:
            return QrDetectionResult()
        if not ok:
            return QrDetectionResult()
        first_bbox = None
        if points is not None and len(points) > 0:
            first_bbox = _points_to_bbox(points[0])
        return QrDetectionResult(
            detected=True,
            bbox=first_bbox,
        )


def _points_to_bbox(points) -> list[list[float]]:
    return [[float(point[0]), float(point[1])] for point in points.reshape(-1, 2)]


def _detect_top_right_qr_like_region(image, decoded: bool = False) -> QrDetectionResult:
    height, width = image.shape[:2]
    x0 = int(width * 0.70)
    y0 = int(height * 0.02)
    x1 = int(width * 0.98)
    y1 = int(height * 0.38)
    crop = image[y0:y1, x0:x1]
    if crop.size == 0:
        return QrDetectionResult(detected=decoded)

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 135, 255, cv2.THRESH_BINARY_INV)
    mask = cv2.morphologyEx(
        mask,
        cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5)),
    )
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    candidates = []
    for contour in contours:
        x, y, box_width, box_height = cv2.boundingRect(contour)
        if box_width < width * 0.04 or box_height < height * 0.04:
            continue
        aspect = box_width / max(box_height, 1)
        if not 0.65 <= aspect <= 1.45:
            continue
        area_ratio = cv2.contourArea(contour) / max(box_width * box_height, 1)
        if area_ratio < 0.12:
            continue
        candidates.append((box_width * box_height, x, y, box_width, box_height))
    if not candidates:
        dark_points = cv2.findNonZero(mask)
        if dark_points is None:
            return QrDetectionResult(detected=decoded)
        x, y, box_width, box_height = cv2.boundingRect(dark_points)
        aspect = box_width / max(box_height, 1)
        dark_density = cv2.countNonZero(mask[y : y + box_height, x : x + box_width]) / max(
            box_width * box_height,
            1,
        )
        if (
            box_width < width * 0.04
            or box_height < height * 0.04
            or not 0.65 <= aspect <= 1.45
            or dark_density < 0.10
        ):
            return QrDetectionResult(detected=decoded)
        return QrDetectionResult(
            detected=True,
            bbox=[
                [float(x0 + x), float(y0 + y)],
                [float(x0 + x + box_width), float(y0 + y)],
                [float(x0 + x + box_width), float(y0 + y + box_height)],
                [float(x0 + x), float(y0 + y + box_height)],
            ],
        )

    _, x, y, box_width, box_height = max(candidates, key=lambda item: item[0])
    return QrDetectionResult(
        detected=True,
        bbox=[
            [float(x0 + x), float(y0 + y)],
            [float(x0 + x + box_width), float(y0 + y)],
            [float(x0 + x + box_width), float(y0 + y + box_height)],
            [float(x0 + x), float(y0 + y + box_height)],
        ],
    )
