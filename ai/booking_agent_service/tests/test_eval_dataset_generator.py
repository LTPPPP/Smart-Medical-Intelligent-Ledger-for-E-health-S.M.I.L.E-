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


def test_build_local_requests_uses_same_blueprints_and_chat_payload():
    blueprints = generator.allocate_blueprints(10, seed=9)

    requests = generator.build_local_requests(
        blueprints,
        model="Qwen/Qwen3.5-4B",
        scenarios_per_request=5,
    )

    assert len(requests) == 2
    assert requests[0]["request_id"] == "local-vn-booking-eval-00001"
    assert requests[0]["model"] == "Qwen/Qwen3.5-4B"
    assert requests[0]["scenario_ids"] == [
        item["scenario_id"] for item in blueprints[:5]
    ]
    assert "4 đến 12 lượt user" in requests[0]["prompt"]


def test_generate_local_defaults_to_qwen35_only():
    parser = generator.build_parser()

    args = parser.parse_args(["generate-local"])

    assert args.model == "Qwen/Qwen3.5-4B"


def test_parse_generated_scenarios_keeps_valid_items_and_reports_invalid_items():
    valid = _scenario("scenario-valid")
    invalid = _scenario("scenario-invalid")
    invalid["expected_tools"] = ["hold_slot"]

    scenarios, errors = generator.parse_generated_scenarios(
        json.dumps({"scenarios": [valid, invalid]}, ensure_ascii=False)
    )

    assert [item["scenario_id"] for item in scenarios] == ["scenario-valid"]
    assert len(errors) == 1
    assert "unknown tool" in errors[0]


def test_run_local_generation_resumes_successful_checkpoint_and_retries_invalid_json(
    tmp_path,
):
    valid_one = _scenario("scenario-1", "Tôi muốn đặt lịch số một")
    valid_two = _scenario("scenario-2", "Tôi muốn đặt lịch số hai")
    checkpoint = tmp_path / "local_checkpoint.jsonl"
    generator.write_jsonl(
        checkpoint,
        [
            {
                "request_id": "local-vn-booking-eval-00001",
                "status": "success",
                "scenarios": [valid_one],
                "errors": [],
            }
        ],
    )

    class FakeClient:
        def __init__(self):
            self.calls = 0

        def generate(self, request):
            self.calls += 1
            if self.calls == 1:
                return "not-json"
            return json.dumps({"scenarios": [valid_two]}, ensure_ascii=False)

    requests = [
        {"request_id": "local-vn-booking-eval-00001", "prompt": "skip"},
        {"request_id": "local-vn-booking-eval-00002", "prompt": "generate"},
    ]
    client = FakeClient()

    scenarios, errors = generator.run_local_generation(
        requests,
        client=client,
        checkpoint_path=checkpoint,
        concurrency=1,
        max_retries=1,
    )

    assert client.calls == 2
    assert {item["scenario_id"] for item in scenarios} == {"scenario-1", "scenario-2"}
    assert any("not valid JSON" in error for error in errors)
    checkpoint_items = [json.loads(line) for line in generator.read_jsonl(checkpoint)]
    assert {item["request_id"] for item in checkpoint_items} == {
        "local-vn-booking-eval-00001",
        "local-vn-booking-eval-00002",
    }


def test_local_request_retries_partial_output_until_all_expected_ids_are_valid():
    valid_one = _scenario("scenario-1", "Tôi muốn đặt lịch số một")
    valid_two = _scenario("scenario-2", "Tôi muốn đặt lịch số hai")

    class FakeClient:
        def __init__(self):
            self.requests = []

        def generate(self, request):
            self.requests.append(request)
            if len(self.requests) == 1:
                return json.dumps({"scenarios": [valid_one]}, ensure_ascii=False)
            return json.dumps({"scenarios": [valid_two]}, ensure_ascii=False)

    result = generator._run_local_request(
        {
            "request_id": "local-1",
            "scenario_ids": ["scenario-1", "scenario-2"],
            "prompt": "generate",
        },
        FakeClient(),
        max_retries=1,
    )

    assert result["status"] == "success"
    assert {item["scenario_id"] for item in result["scenarios"]} == {
        "scenario-1",
        "scenario-2",
    }


def test_run_local_generation_preserves_partial_checkpoint_when_resuming(tmp_path):
    valid_one = _scenario("scenario-1", "Tôi muốn đặt lịch số một")
    valid_two = _scenario("scenario-2", "Tôi muốn đặt lịch số hai")
    checkpoint = tmp_path / "local_checkpoint.jsonl"
    generator.write_jsonl(
        checkpoint,
        [
            {
                "request_id": "local-1",
                "status": "partial",
                "scenarios": [valid_one],
                "errors": ["missing scenario-2"],
            }
        ],
    )

    class FakeClient:
        def generate(self, request):
            return json.dumps({"scenarios": [valid_two]}, ensure_ascii=False)

    scenarios, _ = generator.run_local_generation(
        [
            {
                "request_id": "local-1",
                "scenario_ids": ["scenario-1", "scenario-2"],
                "prompt": "generate",
            }
        ],
        client=FakeClient(),
        checkpoint_path=checkpoint,
        concurrency=1,
        max_retries=0,
    )

    assert {item["scenario_id"] for item in scenarios} == {"scenario-1", "scenario-2"}
