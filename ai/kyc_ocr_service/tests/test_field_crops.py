from pathlib import Path

import cv2
import numpy as np

from src.field_crops import build_field_crops
from src.layout_context import build_layout_context
from src.schemas import OcrLine


def test_field_crops_extend_from_label_to_next_field_when_value_line_is_missing(tmp_path: Path):
    image_path = tmp_path / "card.jpg"
    image = np.full((800, 1200, 3), 255, dtype=np.uint8)
    cv2.imwrite(str(image_path), image)
    layout = build_layout_context(
        [
            OcrLine(text="Ho va ten / Full name:", bbox=[[300, 200], [560, 200], [560, 230], [300, 230]]),
            OcrLine(text="Ngay sinh / Date of birth: 01/01/1990", bbox=[[300, 320], [780, 320], [780, 350], [300, 350]]),
            OcrLine(text="Que quan / Place of origin", bbox=[[300, 390], [650, 390], [650, 420], [300, 420]]),
        ]
    )

    crops = build_field_crops(image_path, layout, tmp_path / "crops")
    full_name = next(crop for crop in crops if crop.name == "full_name")

    assert full_name.bbox[0][1] <= 200
    assert full_name.bbox[2][1] >= 300
    assert full_name.bbox[1][0] >= 1000


def test_address_crop_extends_to_bottom_when_address_values_are_missing(tmp_path: Path):
    image_path = tmp_path / "card.jpg"
    image = np.full((800, 1200, 3), 255, dtype=np.uint8)
    cv2.imwrite(str(image_path), image)
    layout = build_layout_context(
        [
            OcrLine(text="Que quan / Place of origin", bbox=[[300, 390], [650, 390], [650, 420], [300, 420]]),
            OcrLine(text="Co gia tri den 01/01/2030", bbox=[[40, 700], [300, 700], [300, 730], [40, 730]]),
        ]
    )

    crops = build_field_crops(image_path, layout, tmp_path / "crops")
    address = next(crop for crop in crops if crop.name == "address_block")

    assert address.bbox[0][1] <= 390
    assert address.bbox[2][1] >= 680
    assert address.bbox[1][0] >= 1000


def test_address_crop_accepts_common_origin_label_ocr_typo(tmp_path: Path):
    image_path = tmp_path / "card.jpg"
    cv2.imwrite(str(image_path), np.full((800, 1200, 3), 255, dtype=np.uint8))
    layout = build_layout_context(
        [
            OcrLine(
                text="Que guan / Place of ongin",
                bbox=[[300, 390], [650, 390], [650, 420], [300, 420]],
            ),
        ],
    )

    crops = build_field_crops(image_path, layout, tmp_path / "crops")

    assert any(crop.name == "address_block" for crop in crops)


def test_issue_date_crop_extends_below_back_side_label(tmp_path: Path):
    image_path = tmp_path / "card-back.jpg"
    image = np.full((800, 1200, 3), 255, dtype=np.uint8)
    cv2.imwrite(str(image_path), image)
    layout = build_layout_context(
        [
            OcrLine(
                text="ĐẶC ĐIỂM NHẬN DẠNG / Personal identification",
                bbox=[[80, 300], [650, 300], [650, 335], [80, 335]],
            ),
            OcrLine(
                text="Ngày, tháng, năm / Date, month, year",
                bbox=[[80, 440], [540, 440], [540, 472], [80, 472]],
            ),
            OcrLine(
                text="Có giá trị đến / Date of expiry",
                bbox=[[80, 580], [430, 580], [430, 612], [80, 612]],
            ),
        ],
    )

    crops = build_field_crops(image_path, layout, tmp_path / "crops")
    issue_date = next(crop for crop in crops if crop.name == "issue_date")

    assert issue_date.bbox[0][1] <= 440
    assert issue_date.bbox[2][1] >= 520
    assert issue_date.bbox[1][0] >= 1000


def test_date_of_birth_crop_extends_from_label_to_next_front_field(tmp_path: Path):
    image_path = tmp_path / "card-front.jpg"
    image = np.full((800, 1200, 3), 255, dtype=np.uint8)
    cv2.imwrite(str(image_path), image)
    layout = build_layout_context(
        [
            OcrLine(
                text="Ngày sinh / Date of birth",
                bbox=[[300, 300], [650, 300], [650, 332], [300, 332]],
            ),
            OcrLine(
                text="Giới tính / Sex: Nam",
                bbox=[[300, 410], [620, 410], [620, 442], [300, 442]],
            ),
        ],
    )

    crops = build_field_crops(image_path, layout, tmp_path / "crops")
    date_of_birth = next(crop for crop in crops if crop.name == "date_of_birth")

    assert date_of_birth.bbox[0][1] <= 300
    assert date_of_birth.bbox[2][1] >= 380
    assert date_of_birth.bbox[1][0] >= 1000
