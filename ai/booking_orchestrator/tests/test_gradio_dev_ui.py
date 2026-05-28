import json

from src.ui.gradio_app import (
    DEFAULT_API_BASE_URL,
    build_chat_payload,
    default_state_json,
    merge_state_update,
)


def test_default_state_assigns_nhan_test_user():
    state = json.loads(default_state_json())

    assert state["patient_session_id"] == "nhan-dev-session"
    assert state["changed_by"] == "50000000-0000-0000-0000-000000000001"
    assert state["cancelled_by"] == "50000000-0000-0000-0000-000000000001"
    assert state["patient"] == {
        "full_name": "Tran Dai Nhan",
        "phone": "0900000000",
        "email": "nhantd.dev@gmail.com",
    }


def test_build_chat_payload_uses_selected_session_and_state():
    payload = build_chat_payload(
        session_id="session-ui",
        message="Giữ slot đó giúp tôi",
        state_json='{"selected_slot_id": "10000000-0000-0000-0000-000000000001"}',
    )

    assert payload == {
        "session_id": "session-ui",
        "message": "Giữ slot đó giúp tôi",
        "conversation_state": {
            "selected_slot_id": "10000000-0000-0000-0000-000000000001"
        },
    }


def test_merge_state_update_preserves_user_fields_and_applies_router_update():
    merged = merge_state_update(
        current_state={"patient_session_id": "nhan-dev-session"},
        response={
            "metadata": {
                "routing": {
                    "state_update": {
                        "active_intent": "booking",
                        "pending_action": "hold_slot",
                    }
                }
            }
        },
    )

    assert merged["patient_session_id"] == "nhan-dev-session"
    assert merged["active_intent"] == "booking"
    assert merged["pending_action"] == "hold_slot"


def test_default_api_base_url_targets_local_orchestrator():
    assert DEFAULT_API_BASE_URL == "http://127.0.0.1:7777"
