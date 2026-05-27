from src.agent.tool_router import ToolProfile, ToolProfileSelector


def test_selects_safety_profile_for_high_risk_message():
    selector = ToolProfileSelector()

    result = selector.select_profile(
        latest_user_message="I have facial swelling and fever after an accident"
    )

    assert result.profile == ToolProfile.SAFETY
    assert "classify_medical_risk" in result.tools
    assert "create_handoff_ticket" in result.tools


def test_selects_booking_profile_for_booking_message():
    selector = ToolProfileSelector()

    result = selector.select_profile(
        latest_user_message="I want to book teeth cleaning tomorrow afternoon"
    )

    assert result.profile == ToolProfile.BOOKING
    assert result.tools == [
        "get_services",
        "estimate_service_duration",
        "get_available_slots",
        "hold_slot",
        "confirm_booking",
        "release_hold",
    ]


def test_selects_booking_profile_for_vietnamese_hold_request():
    selector = ToolProfileSelector()

    result = selector.select_profile(
        latest_user_message="Tôi muốn giữ lịch hẹn này trong vài phút"
    )

    assert result.profile == ToolProfile.BOOKING


def test_selects_reschedule_profile_for_vietnamese_move_request():
    selector = ToolProfileSelector()

    result = selector.select_profile(
        latest_user_message="Tôi muốn hoãn lịch khám và chuyển lịch sang tuần sau"
    )

    assert result.profile == ToolProfile.RESCHEDULE


def test_selects_safety_profile_for_vietnamese_urgent_dental_pain():
    selector = ToolProfileSelector()

    result = selector.select_profile(
        latest_user_message="Tôi bị đau răng dữ dội, có cần cấp cứu không?"
    )

    assert result.profile == ToolProfile.SAFETY


def test_selects_info_profile_for_vietnamese_clinic_info_request():
    selector = ToolProfileSelector()

    result = selector.select_profile(
        latest_user_message="Cho tôi biết giờ mở cửa và thông tin phòng khám"
    )

    assert result.profile == ToolProfile.INFO


def test_selects_service_profile_for_vietnamese_service_duration_request():
    selector = ToolProfileSelector()

    result = selector.select_profile(
        latest_user_message="Phòng khám có dịch vụ cạo vôi răng không, thời lượng bao lâu?"
    )

    assert result.profile == ToolProfile.SERVICE
