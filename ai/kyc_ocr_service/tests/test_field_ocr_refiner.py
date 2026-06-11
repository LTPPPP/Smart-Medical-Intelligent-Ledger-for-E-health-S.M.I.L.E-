from pathlib import Path

import cv2
import numpy as np

from src.field_ocr_refiner import FieldCropOcrRefiner, _merge_refined_fields
from src.layout_context import build_layout_context
from src.schemas import CccdFields, OcrLine


def test_merge_refined_fields_keeps_clean_residence_over_mixed_longer_candidate():
    current = CccdFields(
        side="FRONT",
        place_of_origin="XA MOT, HUYEN HAI, TINH BA",
        place_of_residence="PHUONG 1, THANH PHO MAU, TINH MAU",
    )
    candidate = CccdFields(
        side="FRONT",
        place_of_residence=(
            "XA MOT, HUYEN HAI, TINH BA, "
            "PHUONG 1, THANH PHO MAU, TINH MAU"
        ),
    )

    merged = _merge_refined_fields(current, candidate)

    assert merged.place_of_residence == current.place_of_residence


def test_refiner_recovers_missing_issue_date_from_back_side_field_crop(tmp_path: Path):
    image_path = tmp_path / "card-back.jpg"
    cv2.imwrite(str(image_path), np.full((800, 1200, 3), 255, dtype=np.uint8))
    layout = build_layout_context(
        [
            OcrLine(
                text="ĐẶC ĐIỂM NHẬN DẠNG / Personal identification",
                confidence=0.9,
                bbox=[[80, 300], [650, 300], [650, 335], [80, 335]],
            ),
            OcrLine(
                text="Ngày, tháng, năm / Date, month, year",
                confidence=0.7,
                bbox=[[80, 440], [540, 440], [540, 472], [80, 472]],
            ),
            OcrLine(
                text="Có giá trị đến / Date of expiry",
                confidence=0.9,
                bbox=[[80, 580], [430, 580], [430, 612], [80, 612]],
            ),
        ],
    )

    class IssueDateCropEngine:
        def __init__(self):
            self.paths = []

        def recognize(self, crop_path: Path):
            self.paths.append(crop_path)
            if crop_path.name.startswith("issue_date"):
                return [
                    OcrLine(text="Ngày, tháng, năm / Date, month, year"),
                    OcrLine(text="22/11/2021"),
                ]
            return []

    engine = IssueDateCropEngine()
    refined = FieldCropOcrRefiner(engine).refine(
        image_path,
        layout=layout,
        current_fields=CccdFields(
            document_type="CITIZEN_ID",
            side="UNKNOWN",
            id_number="000000000000",
        ),
        output_dir=tmp_path / "crops",
    )

    assert refined.side == "BACK"
    assert refined.issue_date == "2021-11-22"
    assert any(path.name.startswith("issue_date") for path in engine.paths)
    assert len([path for path in engine.paths if path.name.startswith("issue_date")]) == 1


def test_refiner_skips_complete_back_side(tmp_path: Path):
    image_path = tmp_path / "card-back.jpg"
    cv2.imwrite(str(image_path), np.full((800, 1200, 3), 255, dtype=np.uint8))
    layout = build_layout_context(
        [
            OcrLine(
                text="Ngày, tháng, năm / Date, month, year",
                bbox=[[80, 440], [540, 440], [540, 472], [80, 472]],
            ),
            OcrLine(
                text="22/11/2021",
                bbox=[[600, 440], [800, 440], [800, 472], [600, 472]],
            ),
        ],
    )

    class UnexpectedCropEngine:
        def recognize(self, crop_path: Path):
            raise AssertionError(f"unexpected crop OCR: {crop_path.name}")

    current = CccdFields(
        document_type="CITIZEN_ID",
        side="BACK",
        id_number="000000000000",
        issue_date="2021-11-22",
        expiry_date="2044-10-08",
    )
    refined = FieldCropOcrRefiner(UnexpectedCropEngine()).refine(
        image_path,
        layout=layout,
        current_fields=current,
        output_dir=tmp_path / "crops",
    )

    assert refined == current


def test_refiner_uses_precise_recognition_for_front_name_and_address_crops(
    tmp_path: Path,
):
    image_path = tmp_path / "card-front.jpg"
    cv2.imwrite(str(image_path), np.full((800, 1200, 3), 255, dtype=np.uint8))
    layout = build_layout_context(
        [
            OcrLine(
                text="Họ và tên / Full name",
                bbox=[[300, 180], [650, 180], [650, 215], [300, 215]],
            ),
            OcrLine(
                text="NGUYEN VAN A",
                bbox=[[300, 225], [700, 225], [700, 260], [300, 260]],
            ),
            OcrLine(
                text="Ngày sinh / Date of birth: 01/01/2000",
                bbox=[[300, 280], [760, 280], [760, 315], [300, 315]],
            ),
            OcrLine(
                text="Quê quán / Place of origin",
                bbox=[[300, 350], [700, 350], [700, 385], [300, 385]],
            ),
            OcrLine(
                text="Nơi thường trú / Place of residence",
                bbox=[[300, 480], [800, 480], [800, 515], [300, 515]],
            ),
        ],
    )

    class PreciseCropEngine:
        def __init__(self):
            self.precise_paths = []

        def recognize(self, crop_path: Path):
            raise AssertionError(f"batch crop OCR should not be used: {crop_path.name}")

        def recognize_precise(self, crop_path: Path):
            self.precise_paths.append(crop_path)
            if crop_path.name.startswith("full_name"):
                return [
                    OcrLine(text="Họ và tên / Full name"),
                    OcrLine(text="NGUYỄN VĂN A"),
                ]
            if crop_path.name.startswith("address_block"):
                return [
                    OcrLine(text="Quê quán / Place of origin"),
                    OcrLine(text="XÃ MẪU, HUYỆN MẪU"),
                    OcrLine(text="Nơi thường trú / Place of residence"),
                    OcrLine(text="PHƯỜNG MẪU, THÀNH PHỐ MẪU"),
                ]
            return []

    engine = PreciseCropEngine()
    refined = FieldCropOcrRefiner(engine).refine(
        image_path,
        layout=layout,
        current_fields=CccdFields(
            document_type="CITIZEN_ID",
            side="FRONT",
            id_number="000000000000",
            full_name="NGUYEN VAN A",
            date_of_birth="2000-01-01",
            place_of_origin="XA MAU, HUYEN MAU",
            place_of_residence="PHUONG MAU, THANH PHO MAU",
        ),
        output_dir=tmp_path / "crops",
    )

    assert refined.full_name == "NGUYỄN VĂN A"
    assert refined.place_of_origin == "XÃ MẪU, HUYỆN MẪU"
    assert refined.place_of_residence == "PHƯỜNG MẪU, THÀNH PHỐ MẪU"
    assert any(path.name.startswith("full_name") for path in engine.precise_paths)
    assert any(path.name.startswith("address_block") for path in engine.precise_paths)


def test_refiner_precisely_rechecks_name_region_when_label_is_missing(
    tmp_path: Path,
):
    image_path = tmp_path / "card-front.jpg"
    cv2.imwrite(str(image_path), np.full((800, 1200, 3), 255, dtype=np.uint8))
    layout = build_layout_context(
        [
            OcrLine(
                text="NGUYEN VAN A",
                bbox=[[300, 225], [700, 225], [700, 260], [300, 260]],
            ),
            OcrLine(
                text="Ngày sinh / Date of birth: 01/01/2000",
                bbox=[[300, 280], [760, 280], [760, 315], [300, 315]],
            ),
        ],
    )

    class PreciseNameEngine:
        def __init__(self):
            self.precise_paths = []

        def recognize(self, crop_path: Path):
            raise AssertionError(f"batch crop OCR should not be used: {crop_path.name}")

        def recognize_precise(self, crop_path: Path):
            self.precise_paths.append(crop_path)
            return [OcrLine(text="NGUYỄN VĂN A")]

    engine = PreciseNameEngine()
    refined = FieldCropOcrRefiner(engine).refine(
        image_path,
        layout=layout,
        current_fields=CccdFields(
            document_type="CITIZEN_ID",
            side="FRONT",
            id_number="000000000000",
            full_name="NGUYEN VAN A",
            date_of_birth="2000-01-01",
            place_of_origin="XÃ MẪU",
            place_of_residence="PHƯỜNG MẪU",
        ),
        output_dir=tmp_path / "crops",
    )

    assert refined.full_name == "NGUYỄN VĂN A"
    assert any(path.name.startswith("full_name_value") for path in engine.precise_paths)


def test_refiner_recovers_missing_date_of_birth_from_front_field_crop(tmp_path: Path):
    image_path = tmp_path / "card-front.jpg"
    cv2.imwrite(str(image_path), np.full((800, 1200, 3), 255, dtype=np.uint8))
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

    class DateOfBirthCropEngine:
        def recognize(self, crop_path: Path):
            if crop_path.name.startswith("date_of_birth"):
                return [
                    OcrLine(text="Ngày sinh / Date of birth"),
                    OcrLine(text="08.10.2004"),
                ]
            return []

    refined = FieldCropOcrRefiner(DateOfBirthCropEngine()).refine(
        image_path,
        layout=layout,
        current_fields=CccdFields(
            document_type="CITIZEN_ID",
            side="FRONT",
            id_number="000000000000",
            full_name="NGUYỄN VĂN A",
            place_of_origin="XÃ MẪU, HUYỆN MẪU",
            place_of_residence="PHƯỜNG MẪU, THÀNH PHỐ MẪU",
        ),
        output_dir=tmp_path / "crops",
    )

    assert refined.date_of_birth == "2004-10-08"
