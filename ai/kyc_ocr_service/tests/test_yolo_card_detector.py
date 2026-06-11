import numpy as np

from src.yolo_card_detector import (
    YoloCardCornerDetector,
    corners_from_yolo_result,
    estimate_missing_corner,
)


class FakeTensor:
    def __init__(self, value):
        self.value = value

    def cpu(self):
        return self

    def numpy(self):
        return np.asarray(self.value)

    def item(self):
        return float(self.value)


class FakeBoxes:
    def __init__(self):
        self.cls = FakeTensor([0, 1, 2, 3, 0])
        self.conf = [FakeTensor(0.50), FakeTensor(0.91), FakeTensor(0.93), FakeTensor(0.90), FakeTensor(0.98)]
        self.xyxy = FakeTensor(
            [
                [10, 10, 30, 30],
                [190, 12, 210, 32],
                [188, 118, 210, 140],
                [12, 120, 32, 140],
                [8, 8, 28, 28],
            ]
        )

    def __len__(self):
        return 5


class FakeResult:
    boxes = FakeBoxes()
    names = {
        0: "top_left",
        1: "top_right",
        2: "bot_right",
        3: "bot_left",
    }


def test_corners_from_yolo_result_selects_best_corner_boxes():
    corners = corners_from_yolo_result(FakeResult(), min_confidence=0.7)

    assert corners is not None
    assert corners.tolist() == [[18.0, 18.0], [200.0, 22.0], [199.0, 129.0], [22.0, 130.0]]


def test_estimate_missing_corner_recovers_single_missing_corner():
    corners = estimate_missing_corner(
        {
            "top_left": (10.0, 10.0),
            "top_right": (210.0, 14.0),
            "bot_left": (18.0, 130.0),
        }
    )

    assert corners["bot_right"] == (218.0, 134.0)


def test_yolo_detector_returns_none_when_model_path_is_missing(monkeypatch):
    monkeypatch.delenv("KYC_CARD_YOLO_MODEL", raising=False)

    detector = YoloCardCornerDetector.from_env()

    assert detector is None
