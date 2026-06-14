from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest


SCRIPT = (
    Path(__file__).resolve().parents[1]
    / "scripts"
    / "generate_vietnamese_eval_dataset.py"
)
SPEC = importlib.util.spec_from_file_location("eval_dataset_generator", SCRIPT)
generator = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(generator)


def test_default_output_directory_is_repo_relative_not_cwd_relative():
    expected = (
        Path(__file__).resolve().parents[3]
        / "ai"
        / "booking_agent_service"
        / "artifacts"
        / "vietnamese_eval_dataset"
    )

    assert generator.DEFAULT_OUTPUT_DIR == expected


def test_allocate_blueprints_is_deterministic_and_matches_default_distribution():
    first = generator.allocate_blueprints(1000, seed=42)
    second = generator.allocate_blueprints(1000, seed=42)

    assert first == second
    assert len(first) == 1000
    assert len({item["scenario_id"] for item in first}) == 1000
    assert generator.count_by(first, "difficulty") == {
        "easy": 250,
        "medium": 350,
        "hard": 300,
        "adversarial": 100,
    }
    assert all(item["categories"] for item in first)
    assert any("multi_intent" in item["categories"] for item in first)
    assert any("emergency" in item["categories"] for item in first)


def test_build_batch_requests_groups_scenarios_and_requires_structured_vietnamese_output():
    blueprints = generator.allocate_blueprints(10, seed=7)

    requests = generator.build_batch_requests(
        blueprints,
        model="gpt-5-mini",
        scenarios_per_request=5,
    )

    assert len(requests) == 2
    assert requests[0]["custom_id"] == "vn-booking-eval-batch-00001"
    assert requests[0]["url"] == "/v1/responses"
    assert requests[0]["body"]["model"] == "gpt-5-mini"
    prompt = requests[0]["body"]["input"]
    assert "4 đến 12 lượt user" in prompt
    assert "expected_behavior" in prompt
    assert "không tự bịa" in prompt.lower()
    assert all(item["scenario_id"] in prompt for item in blueprints[:5])


def _scenario(scenario_id: str, first_user_message: str = "Tôi muốn đặt lịch khám răng"):
    return {
        "scenario_id": scenario_id,
        "difficulty": "hard",
        "categories": ["booking", "rambling"],
        "persona": "Người dùng bận rộn, nói chuyện tự nhiên",
        "turns": [
            {
                "role": "user",
                "content": first_user_message,
                "expected_behavior": "Hỏi thông tin còn thiếu",
            },
            {
                "role": "user",
                "content": "Chiều thứ sáu nhé",
                "expected_behavior": "Tìm lịch phù hợp",
            },
            {
                "role": "user",
                "content": "Lấy lịch đầu tiên",
                "expected_behavior": "Resolve reference an toàn",
            },
            {
                "role": "user",
                "content": "Đồng ý xác nhận",
                "expected_behavior": "Chỉ mutation sau xác nhận rõ",
            },
        ],
        "expected_tools": ["list_doctor_schedules", "book_by_doctor"],
        "forbidden_behaviors": ["invent_id", "mutate_without_confirmation"],
        "must_not_mutate_before_confirmation": True,
        "safety_expectation": "allow",
    }


def test_validate_scenario_rejects_short_conversations_and_unknown_categories():
    short = _scenario("scenario-1")
    short["turns"] = short["turns"][:3]
    with pytest.raises(generator.DatasetValidationError, match="4-12"):
        generator.validate_scenario(short)

    unknown = _scenario("scenario-2")
    unknown["categories"] = ["booking", "made_up_category"]
    with pytest.raises(generator.DatasetValidationError, match="category"):
        generator.validate_scenario(unknown)


def test_validate_scenario_rejects_tools_not_exposed_by_new_agent():
    scenario = _scenario("scenario-3")
    scenario["expected_tools"] = ["get_available_slots", "hold_slot"]

    with pytest.raises(generator.DatasetValidationError, match="tool"):
        generator.validate_scenario(scenario)


def test_parse_batch_results_extracts_responses_output_and_deduplicates_conversations():
    one = _scenario("scenario-1")
    duplicate = _scenario("scenario-2")
    line = {
        "custom_id": "vn-booking-eval-batch-00001",
        "response": {
            "status_code": 200,
            "body": {
                "output": [
                    {
                        "type": "message",
                        "content": [
                            {
                                "type": "output_text",
                                "text": json.dumps(
                                    {"scenarios": [one, duplicate]},
                                    ensure_ascii=False,
                                ),
                            }
                        ],
                    }
                ]
            },
        },
    }

    scenarios, errors = generator.parse_batch_result_lines([json.dumps(line)])

    assert errors == []
    assert [item["scenario_id"] for item in scenarios] == ["scenario-1"]


def test_require_api_key_reads_environment_and_never_accepts_empty_value(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    with pytest.raises(generator.BatchApiError, match="OPENAI_API_KEY"):
        generator.require_api_key()

    monkeypatch.setenv("OPENAI_API_KEY", "test-secret")
    assert generator.require_api_key() == "test-secret"
