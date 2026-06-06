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
