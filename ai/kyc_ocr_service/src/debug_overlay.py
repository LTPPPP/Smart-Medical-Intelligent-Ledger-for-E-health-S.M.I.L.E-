from __future__ import annotations

from pathlib import Path

import cv2

from .schemas import OcrLine


def write_ocr_box_overlay(image_path: Path, lines: list[OcrLine], output_path: Path) -> Path | None:
    image = cv2.imread(str(image_path))
    if image is None:
        return None

    output_path.parent.mkdir(parents=True, exist_ok=True)
    for index, line in enumerate(lines):
        if not line.bbox:
            continue
        points = [(int(round(point[0])), int(round(point[1]))) for point in line.bbox]
        if len(points) < 4:
            continue
        color = (0, 180, 255)
        cv2.polylines(image, [cv2.convexHull(_points_to_array(points))], True, color, 2)
        label_point = points[0]
        label = f"{index}: {line.confidence:.2f}" if line.confidence is not None else str(index)
        cv2.putText(
            image,
            label,
            (label_point[0], max(18, label_point[1] - 6)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            color,
            2,
            cv2.LINE_AA,
        )

    cv2.imwrite(str(output_path), image)
    return output_path


def _points_to_array(points: list[tuple[int, int]]):
    import numpy as np

    return np.array(points, dtype=np.int32)
