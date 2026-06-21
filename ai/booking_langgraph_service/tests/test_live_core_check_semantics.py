import importlib.util
from pathlib import Path


def _load_live_core_check():
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "live_core_check.py"
    spec = importlib.util.spec_from_file_location("live_core_check", script_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_health_check_requires_ok_status_not_just_http_200():
    live_core_check = _load_live_core_check()

    graded = live_core_check._grade_check(
        "health",
        {
            "ok": True,
            "status_code": 200,
            "body": {
                "status": "degraded",
                "dependencies": {"llm": {"status": "unavailable"}},
            },
        },
    )

    assert graded["ok"] is False
    assert graded["semantic_status"] == "degraded_health"


def test_booking_prepare_accepts_confirmation_token():
    live_core_check = _load_live_core_check()

    graded = live_core_check._grade_check(
        "booking_prepare",
        {
            "ok": True,
            "status_code": 200,
            "body": {
                "flow": "booking",
                "actions": ["search_booking_catalog", "find_booking_options"],
                "confirmation": None,
            },
        },
    )

    assert graded["ok"] is False
    assert graded["semantic_status"] == "missing_booking_confirmation"


def test_booking_prepare_accepts_targeted_clarification_when_no_search_constraints():
    live_core_check = _load_live_core_check()

    graded = live_core_check._grade_check(
        "booking_prepare",
        {
            "ok": True,
            "status_code": 200,
            "body": {
                "flow": "booking",
                "actions": ["search_booking_catalog", "find_booking_options"],
                "confirmation": None,
                "metadata": {"metrics": {"clarification_count": 1, "backend_conflict_rate": 0}},
            },
        },
    )

    assert graded["ok"] is True
    assert graded["semantic_status"] == "clarification_requested"


def test_cancel_prepare_requires_confirmation_token():
    live_core_check = _load_live_core_check()

    graded = live_core_check._grade_check(
        "cancel_prepare",
        {
            "ok": True,
            "status_code": 200,
            "body": {
                "flow": "cancel",
                "actions": ["resolve_appointment_reference", "prepare_cancel"],
                "confirmation": {"token": "confirm-123", "action": "commit_cancel"},
            },
        },
    )

    assert graded["ok"] is True
    assert graded["semantic_status"] == "ok"
