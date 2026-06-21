import importlib.util
from pathlib import Path


def _load_live_mutation_check():
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "live_mutation_check.py"
    spec = importlib.util.spec_from_file_location("live_mutation_check", script_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_live_mutation_check_requires_healthy_agent_before_mutation():
    live_mutation_check = _load_live_mutation_check()

    result = live_mutation_check.grade_health(
        {
            "status": "degraded",
            "dependencies": {
                "emr": {"status": "ok"},
                "llm": {"status": "unavailable"},
            },
        }
    )

    assert result == {
        "ok": False,
        "reason": "agent_health_not_ok",
        "status": "degraded",
    }


def test_live_mutation_check_extracts_confirmation_token():
    live_mutation_check = _load_live_mutation_check()

    token = live_mutation_check.confirmation_token(
        {
            "flow": "booking",
            "confirmation": {
                "token": "confirm-abc",
                "action": "commit_booking",
            },
        },
        expected_flow="booking",
        expected_action="commit_booking",
    )

    assert token == "confirm-abc"


def test_live_mutation_check_rejects_wrong_confirmation_action():
    live_mutation_check = _load_live_mutation_check()

    token = live_mutation_check.confirmation_token(
        {
            "flow": "booking",
            "confirmation": {
                "token": "confirm-abc",
                "action": "commit_cancel",
            },
        },
        expected_flow="booking",
        expected_action="commit_booking",
    )

    assert token is None


def test_live_mutation_check_accepts_reschedule_confirmation_token():
    live_mutation_check = _load_live_mutation_check()

    token = live_mutation_check.confirmation_token(
        {
            "flow": "reschedule",
            "confirmation": {
                "token": "confirm-reschedule",
                "action": "commit_reschedule",
            },
        },
        expected_flow="reschedule",
        expected_action="commit_reschedule",
    )

    assert token == "confirm-reschedule"
