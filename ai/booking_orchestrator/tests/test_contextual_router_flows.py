from src.agent.tool_router import ToolProfile, ToolProfileSelector


SLOT_ID = "10000000-0000-0000-0000-000000000001"
HOLD_ID = "20000000-0000-0000-0000-000000000001"
SERVICE_ID = "30000000-0000-0000-0000-000000000001"
APPOINTMENT_ID = "40000000-0000-0000-0000-000000000001"
USER_ID = "50000000-0000-0000-0000-000000000001"
CLINIC_ID = "60000000-0000-0000-0000-000000000001"


def select(message: str, state: dict | None = None):
    return ToolProfileSelector().select_profile(message, conversation_state=state)


def test_booking_initial_vietnamese_searches_slots_or_services():
    result = select("Tôi muốn đặt lịch cạo vôi răng ngày mai")

    assert result.profile == ToolProfile.BOOKING
    assert result.tools == ["get_services", "estimate_service_duration", "get_available_slots"]
    assert result.routing.pending_action == "search_slots_or_services"
    assert result.routing.state_update["active_intent"] == "booking"


def test_booking_hold_missing_slot_blocks_hold_tool():
    result = select("Giữ slot đó giúp tôi")

    assert result.routing.decision == "ASK_FOR_MISSING_INFO"
    assert result.routing.missing_fields == ["selected_slot_id"]
    assert result.routing.blocked_tools == ["hold_slot"]


def test_booking_hold_with_selected_slot_allows_hold_tool():
    result = select("Giữ slot đó giúp tôi", {"selected_slot_id": SLOT_ID})

    assert result.tools == ["hold_slot"]
    assert result.routing.reason == "booking_hold_ready"


def test_booking_confirm_missing_hold_blocks_confirm_tool():
    result = select(
        "Xác nhận lịch giúp tôi",
        {
            "service_id": SERVICE_ID,
            "patient": {"full_name": "Nguyen Van A", "phone": "0900000000"},
        },
    )

    assert result.routing.missing_fields == ["hold_id"]
    assert "confirm_booking" not in result.tools


def test_booking_confirm_missing_patient_phone_blocks_confirm_tool():
    result = select(
        "Xác nhận lịch giúp tôi",
        {
            "hold_id": HOLD_ID,
            "service_id": SERVICE_ID,
            "patient": {"full_name": "Nguyen Van A"},
        },
    )

    assert result.routing.missing_fields == ["patient.phone"]
    assert "confirm_booking" not in result.tools


def test_booking_confirm_complete_state_allows_confirm_tool():
    result = select(
        "Xác nhận lịch giúp tôi",
        {
            "hold_id": HOLD_ID,
            "service_id": SERVICE_ID,
            "patient": {"full_name": "Nguyen Van A", "phone": "0900000000"},
        },
    )

    assert result.tools == ["confirm_booking"]
    assert result.routing.reason == "booking_confirm_ready"


def test_booking_release_hold_allows_release_tool():
    result = select("Tôi không lấy slot này nữa", {"active_intent": "booking", "hold_id": HOLD_ID})

    assert result.tools == ["release_hold"]
    assert result.routing.pending_action == "release_hold"


def test_booking_date_change_keeps_read_only_booking_tools():
    result = select(
        "Chuyển sang thứ sáu được không?",
        {"active_intent": "booking", "service_id": SERVICE_ID},
    )

    assert result.profile == ToolProfile.BOOKING
    assert result.tools == ["get_services", "estimate_service_duration", "get_available_slots"]


def test_reschedule_missing_appointment_blocks_reschedule_tool():
    result = select("Tôi muốn dời lịch khám")

    assert result.profile == ToolProfile.RESCHEDULE
    assert "appointment_id" in result.routing.missing_fields
    assert "reschedule_appointment" not in result.tools


def test_reschedule_with_appointment_searches_new_slots():
    result = select("Dời lịch này sang ngày mai", {"appointment_id": APPOINTMENT_ID})

    assert result.profile == ToolProfile.RESCHEDULE
    assert result.tools == ["get_available_slots"]
    assert result.routing.pending_action == "get_available_slots"


def test_reschedule_active_flow_selected_slot_allows_hold():
    result = select(
        "Lấy slot mới này",
        {"active_intent": "reschedule", "appointment_id": APPOINTMENT_ID, "selected_slot_id": SLOT_ID},
    )

    assert result.profile == ToolProfile.RESCHEDULE
    assert result.tools == ["hold_slot"]


def test_reschedule_confirm_complete_state_allows_reschedule_tool():
    result = select(
        "Xác nhận đổi lịch",
        {
            "active_intent": "reschedule",
            "appointment_id": APPOINTMENT_ID,
            "hold_id": HOLD_ID,
            "patient_session_id": "session-1",
            "changed_by": USER_ID,
        },
    )

    assert result.tools == ["reschedule_appointment"]
    assert result.routing.pending_action == "reschedule_appointment"


def test_cancel_missing_appointment_blocks_cancel_tool():
    result = select("Hủy lịch giúp tôi")

    assert result.profile == ToolProfile.CANCEL
    assert "appointment_id" in result.routing.missing_fields
    assert "cancel_appointment" not in result.tools


def test_cancel_with_required_state_allows_cancel_tool():
    result = select("Hủy lịch này", {"appointment_id": APPOINTMENT_ID, "cancelled_by": USER_ID})

    assert result.profile == ToolProfile.CANCEL
    assert "cancel_appointment" in result.tools


def test_cancel_request_with_high_risk_symptoms_routes_to_safety():
    result = select("Hủy lịch, tôi đang sưng mặt và sốt", {"appointment_id": APPOINTMENT_ID})

    assert result.profile == ToolProfile.SAFETY
    assert result.routing.decision == "SAFETY_OVERRIDE"


def test_waitlist_complete_state_allows_add_to_waitlist():
    result = select(
        "Cho tôi vào danh sách chờ",
        {
            "clinic_id": CLINIC_ID,
            "service_id": SERVICE_ID,
            "preferred_date": "2026-06-15",
            "patient": {"full_name": "Nguyen Van A", "phone": "0900000000"},
        },
    )

    assert result.profile == ToolProfile.WAITLIST
    assert result.tools == ["add_to_waitlist"]


def test_waitlist_missing_date_blocks_add_to_waitlist():
    result = select(
        "Cho tôi vào danh sách chờ",
        {
            "clinic_id": CLINIC_ID,
            "service_id": SERVICE_ID,
            "patient": {"full_name": "Nguyen Van A", "phone": "0900000000"},
        },
    )

    assert result.routing.missing_fields == ["preferred_date"]
    assert "add_to_waitlist" not in result.tools


def test_waitlist_active_flow_with_slot_checks_matches():
    result = select(
        "Có ai phù hợp slot này không?",
        {"active_intent": "waitlist", "selected_slot_id": SLOT_ID},
    )

    assert result.profile == ToolProfile.WAITLIST
    assert result.tools == ["check_waitlist_matches"]


def test_vietnamese_high_risk_symptoms_route_to_safety():
    result = select("Tôi bị đau răng dữ dội, sưng mặt và sốt")

    assert result.profile == ToolProfile.SAFETY
    assert set(result.routing.state_update.values()) >= {"safety", ToolProfile.SAFETY.value}


def test_english_high_risk_symptoms_route_to_safety():
    result = select("I have facial swelling and difficulty breathing")

    assert result.profile == ToolProfile.SAFETY
    assert "facial swelling" in result.matched_keywords


def test_clinic_hours_routes_to_info_profile():
    result = select("Phòng khám mở cửa lúc mấy giờ?")

    assert result.profile == ToolProfile.INFO
    assert result.tools == ["get_clinic_info", "search_clinic_knowledge"]


def test_service_duration_routes_to_service_profile():
    result = select("Cạo vôi răng mất bao lâu?")

    assert result.profile == ToolProfile.SERVICE
    assert result.tools == ["get_services", "estimate_service_duration"]


def test_service_question_with_clinic_word_does_not_route_to_booking():
    result = select("Phòng khám có dịch vụ niềng răng không?")

    assert result.profile == ToolProfile.SERVICE


def test_info_then_booking_followup_starts_fresh_booking_flow():
    result = select("Ok book one then", {"active_intent": "info"})

    assert result.profile == ToolProfile.BOOKING
    assert result.tools == ["get_services", "estimate_service_duration", "get_available_slots"]
    assert result.routing.pending_action == "search_slots_or_services"
