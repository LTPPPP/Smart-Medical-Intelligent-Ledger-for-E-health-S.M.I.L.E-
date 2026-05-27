from src.agent.conversation_state import ConversationState, RoutingDecision


def test_conversation_state_normalizes_known_fields_and_ignores_unknowns():
    state = ConversationState.from_raw(
        {
            "active_intent": "booking",
            "selected_slot_id": "10000000-0000-0000-0000-000000000001",
            "patient": {"full_name": "Nguyen Van A", "phone": "0900000000"},
            "unexpected": "ignored",
        }
    )

    assert state.active_intent == "booking"
    assert state.selected_slot_id == "10000000-0000-0000-0000-000000000001"
    assert state.patient.full_name == "Nguyen Van A"
    assert "unexpected" not in state.model_dump()


def test_routing_decision_serializes_metadata_contract():
    decision = RoutingDecision(
        decision="ASK_FOR_MISSING_INFO",
        reason="booking_confirm_missing_fields",
        confidence="MEDIUM",
        pending_action="confirm_booking",
        missing_fields=["hold_id", "patient.phone"],
        state_update={"active_intent": "booking"},
        blocked_tools=["confirm_booking"],
    )

    assert decision.model_dump()["missing_fields"] == ["hold_id", "patient.phone"]
