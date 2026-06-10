from src.cccd_parser import parse_cccd_text


def test_parse_cccd_front_extracts_core_fields_and_checks():
    result = parse_cccd_text(
        [
            "CONG HOA XA HOI CHU NGHIA VIET NAM",
            "CAN CUOC CONG DAN",
            "So / No: 012345678901",
            "Ho va ten / Full name: NGUYEN VAN A",
            "Ngay sinh / Date of birth: 01/01/1990",
            "Quoc tich / Nationality: Viet Nam",
        ],
    )

    assert result.fields.id_number == "012345678901"
    assert result.fields.full_name == "NGUYEN VAN A"
    assert result.fields.date_of_birth == "1990-01-01"
    assert result.fields.document_type == "CITIZEN_ID"
    assert result.fields.side == "FRONT"
    assert result.risk_level == "LOW"
    assert result.checks["ID_NUMBER_FOUND"].status == "PASS"
    assert result.checks["DOB_FOUND"].status == "PASS"
    assert result.checks["DOCUMENT_TYPE_HINT"].status == "PASS"


def test_parse_cccd_front_extracts_vietnamese_only_labels():
    result = parse_cccd_text(
        [
            "CONG HOA XA HOI CHU NGHIA VIET NAM",
            "CAN CUOC CONG DAN",
            "So",
            "087204009012",
            "Ho va ten",
            "TRAN DAI NHAN",
            "Ngay sinh",
            "08/10/2004",
            "Quoc tich Viet Nam",
        ],
    )

    assert result.fields.id_number == "087204009012"
    assert result.fields.full_name == "TRAN DAI NHAN"
    assert result.fields.date_of_birth == "2004-10-08"
    assert result.fields.side == "FRONT"


def test_parse_cccd_front_preserves_vietnamese_diacritics_in_name_and_addresses():
    result = parse_cccd_text(
        [
            "CĂN CƯỚC CÔNG DÂN",
            "Số / No: 012345678901",
            "Họ và tên / Full name: TRẦN ĐẠI NHÂN",
            "Ngày sinh / Date of birth: 01/01/1990",
            "Quê quán / Place of origin: Mỹ Phong, Thành phố Mỹ Tho, Tiền Giang",
            "Nơi thường trú / Place of residence: Ấp Nhất, Quới An, Vũng Liêm, Vĩnh Long",
        ],
    )

    assert result.fields.full_name == "TRẦN ĐẠI NHÂN"
    assert result.fields.place_of_origin == "MỸ PHONG, THÀNH PHỐ MỸ THO, TIỀN GIANG"
    assert result.fields.place_of_residence == "ẤP NHẤT, QUỚI AN, VŨNG LIÊM, VĨNH LONG"


def test_parse_cccd_front_preserves_extended_latin_name_punctuation():
    result = parse_cccd_text(
        [
            "CAN CUOC CONG DAN",
            "So / No: 012345678901",
            "Ho va ten / Full name: H'HEN NIÊ",
            "Ngay sinh / Date of birth: 01/01/1990",
        ],
    )

    assert result.fields.full_name == "H'HEN NIÊ"


def test_parse_cccd_front_joins_multiline_addresses():
    result = parse_cccd_text(
        [
            "CAN CUOC CONG DAN",
            "So / No: 012345678901",
            "Ho va ten / Full name: NGUYEN VAN A",
            "Ngay sinh / Date of birth: 01/01/1990",
            "Que quan / Place of origin:",
            "My Phong, Thanh pho My Tho, Tien Giang",
            "Noi thuong tru / Place of residence: 271 Giap Nuoc",
            "Phuoc Thanh, TP. My Tho, Tien Giang",
        ],
    )

    assert result.fields.place_of_origin == "MY PHONG, THANH PHO MY THO, TIEN GIANG"
    assert (
        result.fields.place_of_residence
        == "271 GIAP NUOC, PHUOC THANH, TP. MY THO, TIEN GIANG"
    )


def test_parse_cccd_front_recovers_residence_when_label_is_missed_near_expiry():
    result = parse_cccd_text(
        [
            "CAN CUOC CONG DAN",
            "So / No: 012345678901",
            "Ho va ten / Full name: NGUYEN VAN A",
            "Ngay sinh / Date of birth: 01/01/1990",
            "Que quan / Place of origin",
            "Binh Minh, Kien Xuong, Thai Binh",
            "Co gia tri den 01/01/2030",
            "Date of expiry",
            "Phuong 1, Thanh pho Sa Dec, Dong Thap",
        ],
    )

    assert result.fields.place_of_residence == "PHUONG 1, THANH PHO SA DEC, DONG THAP"


def test_parse_cccd_front_strips_fuzzy_origin_label():
    result = parse_cccd_text(
        [
            "CAN CUOC CONG DAN",
            "So / No: 012345678901",
            "Quéguän/ Place of origin",
            "Binh MinhKien Xuong,Thai Binh",
        ],
    )

    assert result.fields.place_of_origin == "BINH MINHKIEN XUONG,THAI BINH"


def test_parse_cccd_front_keeps_inline_residence_value_and_next_line():
    result = parse_cccd_text(
        [
            "CAN CUOC CONG DAN",
            "So / No: 012345678901",
            "Noi thuong tru / Place of residence: An Dong",
            "Quynh Hoang, Quynh Phu, Thai Binh",
        ],
    )

    assert (
        result.fields.place_of_residence
        == "AN DONG, QUYNH HOANG, QUYNH PHU, THAI BINH"
    )


def test_parse_cccd_front_keeps_residence_value_after_bilingual_label_without_colon():
    result = parse_cccd_text(
        [
            "CAN CUOC CONG DAN",
            "So / No: 012345678901",
            "Ho va ten / Full name: NGUYEN VAN A",
            "Ngay sinh / Date of birth: 01/01/1990",
            "Noi thuong tru / Place of residence 12A, Duong Mau",
            "Phuong 1, Thanh pho Mau, Tinh Mau",
        ],
    )

    assert (
        result.fields.place_of_residence
        == "12A, DUONG MAU, PHUONG 1, THANH PHO MAU, TINH MAU"
    )


def test_parse_cccd_front_accepts_fuzzy_residence_label_ocr_typos():
    result = parse_cccd_text(
        [
            "CAN CUOC CONG DAN",
            "So / No: 012345678901",
            "Noi thuonq tru / Place of residenoe 12A, Duong Mau",
            "Phuong 1, Thanh pho Mau, Tinh Mau",
            "Co gia tri den 01/01/2030",
        ],
    )

    assert (
        result.fields.place_of_residence
        == "12A, DUONG MAU, PHUONG 1, THANH PHO MAU, TINH MAU"
    )


def test_parse_cccd_marks_missing_id_as_high_risk():
    result = parse_cccd_text(
        [
            "CONG HOA XA HOI CHU NGHIA VIET NAM",
            "CAN CUOC CONG DAN",
            "Anh bi mo khong thay so giay to",
        ],
    )

    assert result.fields.id_number is None
    assert result.risk_level == "HIGH"
    assert result.checks["ID_NUMBER_FOUND"].status == "FAIL"


def test_parse_cccd_detects_back_side_keywords():
    result = parse_cccd_text(
        [
            "DAC DIEM NHAN DANG",
            "Ngay cap / Date of issue: 01/02/2020",
            "Noi cap / Place of issue: Cuc Canh sat QLHC ve TTXH",
        ],
    )

    assert result.fields.side == "BACK"
    assert result.fields.issue_date == "2020-02-01"
    assert result.checks["BACK_SIDE_HINT"].status == "PASS"


def test_parse_cccd_back_extracts_issue_date_and_id_from_mrz():
    result = parse_cccd_text(
        [
            "Dac diem nhan dang",
            "Ngay, thang, nam 22/11/2021",
            "IDVNM2040090122087204009012<<<3",
            "0410081M2910080VNM<<<<<<<<<8",
            "TRAN<<DAI<NHAN<<<<<<<<<<<",
        ],
    )

    assert result.fields.side == "BACK"
    assert result.fields.issue_date == "2021-11-22"
    assert result.fields.id_number == "087204009012"
    assert result.checks["DOB_FOUND"].status == "PASS"
    assert result.risk_level == "LOW"


def test_parse_cccd_back_tolerates_common_mrz_prefix_ocr_error():
    result = parse_cccd_text(
        [
            "Dac diem nhan dang",
            "TDVNM2040090122087204009012<23",
            "0410081M2910080VNM<<<<<<<<<8",
        ],
    )

    assert result.fields.id_number == "087204009012"
    assert result.checks["ID_NUMBER_FOUND"].status == "PASS"


def test_parse_cccd_date_when_ocr_joins_label_and_value():
    result = parse_cccd_text(
        [
            "Dac diem nhan dang",
            "Ngay,thang,nam/Date,monthyear22/11/2021",
            "IDVNM2040090122087204009012<<<3",
        ],
    )

    assert result.fields.issue_date == "2021-11-22"


def test_parse_cccd_back_extracts_issue_date_when_date_separator_is_ocr_noise():
    result = parse_cccd_text(
        [
            "Dac diem nhan dang",
            "Ngay thang, nam / Date, month, year 22n11/2021",
            "IDVNM2040090122087204009012<<<3",
        ],
    )

    assert result.fields.issue_date == "2021-11-22"


def test_parse_cccd_does_not_copy_birth_date_into_issue_date():
    result = parse_cccd_text(
        [
            "CAN CUOC CONG DAN",
            "So / No: 012345678901",
            "Ngay sinh / Date of birth: 01/01/1990",
        ],
    )

    assert result.fields.date_of_birth == "1990-01-01"
    assert result.fields.issue_date is None


def test_parse_cccd_full_name_from_next_ocr_line_after_label():
    result = parse_cccd_text(
        [
            "Ho va ten / Full name:",
            "NGUYEN VAN A",
            "Ngay sinh / Date of birth:",
            "01/01/1990",
        ],
    )

    assert result.fields.full_name == "NGUYEN VAN A"


def test_parse_cccd_full_name_tolerates_common_ocr_label_typos():
    result = parse_cccd_text(
        [
            "Ho va t�n / Full narne:",
            "NGUYEN VAN A",
            "Ngay sinh i Date of birth:",
            "01/01/1990",
        ],
    )

    assert result.fields.full_name == "NGUYEN VAN A"
