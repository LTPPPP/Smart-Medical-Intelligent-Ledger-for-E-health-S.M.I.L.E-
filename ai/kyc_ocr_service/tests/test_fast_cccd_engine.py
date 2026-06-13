from pathlib import Path

import cv2
import numpy as np

from src.card_preprocessor import InvalidImageError
from src.fast_cccd_engine import FastCccdOcrEngine


class FakeBatchRecognizer:
    def __init__(self, values):
        self.values = values

    def recognize_batch(self, images):
        return [(value, None) for value in self.values[: len(images)]]


def _blank_card(path: Path):
    image = np.full((850, 1280, 3), 255, dtype=np.uint8)
    cv2.imwrite(str(path), image)


def test_fast_engine_reads_front_fields_from_fixed_rois(tmp_path):
    image_path = tmp_path / "front.jpg"
    _blank_card(image_path)
    recognizer = FakeBatchRecognizer(
        [
            "012345678901",
            "NGUYEN VAN A",
            "01/01/1990",
            "Xa Mot, Huyen Hai, Tinh Ba",
            "12A Duong Mau, Phuong 1, Thanh Pho Mau",
        ]
    )
    engine = FastCccdOcrEngine(
        field_model_path=tmp_path / "missing.onnx",
        recognizer=recognizer,
    )

    result = engine.analyze_side(image_path, "FRONT")

    assert result.engine == "scanocr-onnx-vietocr-fast"
    assert result.fields.side == "FRONT"
    assert result.fields.id_number == "012345678901"
    assert result.fields.full_name == "NGUYEN VAN A"
    assert result.fields.date_of_birth == "1990-01-01"
    assert result.fields.place_of_origin == "XA MOT, HUYEN HAI, TINH BA"
    assert result.fields.place_of_residence == "12A DUONG MAU, PHUONG 1, THANH PHO MAU"


def test_fast_engine_reads_back_mrz_and_issue_date_from_fixed_rois(tmp_path):
    image_path = tmp_path / "back.jpg"
    _blank_card(image_path)
    recognizer = FakeBatchRecognizer(
        [
            "01/02/2020",
            "IDVNM1234567890012345678901<<<3",
            "9001011M3001010VNM<<<<<<<<<<<<8",
        ]
    )
    engine = FastCccdOcrEngine(
        field_model_path=tmp_path / "missing.onnx",
        recognizer=recognizer,
    )

    result = engine.analyze_side(image_path, "BACK")

    assert result.fields.side == "BACK"
    assert result.fields.id_number == "012345678901"
    assert result.fields.date_of_birth == "1990-01-01"
    assert result.fields.expiry_date == "2030-01-01"
    assert result.fields.issue_date == "2020-02-01"


def test_fast_engine_raises_for_undecodable_image(tmp_path):
    broken_path = tmp_path / "broken.jpg"
    broken_path.write_bytes(b"not an image")
    engine = FastCccdOcrEngine(
        field_model_path=tmp_path / "missing.onnx",
        recognizer=FakeBatchRecognizer([]),
    )

    try:
        engine.analyze_side(broken_path, "FRONT")
    except InvalidImageError:
        return

    raise AssertionError("InvalidImageError was not raised")
