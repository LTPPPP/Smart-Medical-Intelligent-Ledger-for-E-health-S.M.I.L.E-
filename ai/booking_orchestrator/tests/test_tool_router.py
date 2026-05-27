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
    ]
    assert result.routing.pending_action == "search_slots_or_services"


def test_selects_booking_profile_for_vietnamese_hold_request():
    selector = ToolProfileSelector()

    result = selector.select_profile(
        latest_user_message="Tôi muốn giữ lịch hẹn này trong vài phút",
        conversation_state={"selected_slot_id": "10000000-0000-0000-0000-000000000001"},
    )

    assert result.profile == ToolProfile.BOOKING
    assert result.routing.pending_action == "hold_slot"
    assert result.tools == ["hold_slot"]


def test_hold_followup_without_selected_slot_asks_for_missing_info():
    selector = ToolProfileSelector()

    result = selector.select_profile(latest_user_message="Giữ slot đó giúp tôi")

    assert result.profile == ToolProfile.BOOKING
    assert result.routing.decision == "ASK_FOR_MISSING_INFO"
    assert result.routing.missing_fields == ["selected_slot_id"]
    assert "hold_slot" not in result.tools


def test_confirm_followup_missing_patient_phone_blocks_confirm():
    selector = ToolProfileSelector()

    result = selector.select_profile(
        latest_user_message="Xác nhận lịch giúp tôi",
        conversation_state={
            "hold_id": "20000000-0000-0000-0000-000000000001",
            "service_id": "30000000-0000-0000-0000-000000000001",
            "patient": {"full_name": "Nguyen Van A"},
        },
    )

    assert result.profile == ToolProfile.BOOKING
    assert result.routing.decision == "ASK_FOR_MISSING_INFO"
    assert result.routing.missing_fields == ["patient.phone"]
    assert "confirm_booking" not in result.tools


def test_confirm_followup_with_complete_state_allows_confirm():
    selector = ToolProfileSelector()

    result = selector.select_profile(
        latest_user_message="Ok xác nhận lịch",
        conversation_state={
            "hold_id": "20000000-0000-0000-0000-000000000001",
            "service_id": "30000000-0000-0000-0000-000000000001",
            "patient": {"full_name": "Nguyen Van A", "phone": "0900000000"},
        },
    )

    assert result.profile == ToolProfile.BOOKING
    assert result.routing.pending_action == "confirm_booking"
    assert result.tools == ["confirm_booking"]


def test_safety_override_wins_over_ready_to_confirm_booking():
    selector = ToolProfileSelector()

    result = selector.select_profile(
        latest_user_message="Ok xác nhận lịch, nhưng tôi đang sưng mặt và sốt",
        conversation_state={
            "hold_id": "20000000-0000-0000-0000-000000000001",
            "service_id": "30000000-0000-0000-0000-000000000001",
            "patient": {"full_name": "Nguyen Van A", "phone": "0900000000"},
        },
    )

    assert result.profile == ToolProfile.SAFETY
    assert result.routing.decision == "SAFETY_OVERRIDE"
    assert "confirm_booking" not in result.tools


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
