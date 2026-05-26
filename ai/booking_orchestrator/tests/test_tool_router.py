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
