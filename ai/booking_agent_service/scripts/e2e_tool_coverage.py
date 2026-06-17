#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from datetime import date, timedelta
from pathlib import Path
from typing import Any
from uuid import uuid4

from e2e_chat_flow import (
    DOCTOR_ID,
    E2EError,
    PATIENT_ID,
    check_http,
    check_redis,
    check_vllm,
    docker_psql,
    request_json,
    seed_clinic_and_schedule,
    seed_iam_kyc,
)
from run_vietnamese_agent_eval import (
    MUTATION_TOOLS,
    REQUIRED_AGENT_TOOLS,
    build_eval_summary,
    build_tool_coverage_summary,
    render_markdown_report,
    utc_timestamp,
    write_json,
    write_jsonl,
)


SPECIALTY_ID = os.getenv(
    "BOOKING_AGENT_E2E_SPECIALTY_ID",
    "33333333-3333-4333-8333-333333333333",
)
OUTPUT_DIR = Path("artifacts/e2e_tool_coverage")


def seed_specialty_assignment(postgres_container: str) -> None:
    docker_psql(
        "core_clinic_service_db",
        f"""
        INSERT INTO specialties (
          specialty_id, specialty_name, specialty_code, description,
          is_active, display_order, created_at, updated_at
        ) VALUES (
          '{SPECIALTY_ID}', 'Agent E2E Chuyên khoa tổng quát',
          'AGENT_E2E_GENERAL', 'Fixture for booking-agent tool coverage',
          true, 900, now(), now()
        )
        ON CONFLICT (specialty_code) DO UPDATE
        SET specialty_name = EXCLUDED.specialty_name,
            description = EXCLUDED.description,
            is_active = true,
            updated_at = now();
        """,
        postgres_container,
    )
    docker_psql(
        "core_clinic_service_db",
        f"""
        INSERT INTO doctor_specialties (
          doctor_id, specialty_id, certification_number,
          certified_date, is_primary, created_at
        ) VALUES (
          '{DOCTOR_ID}', '{SPECIALTY_ID}', 'AGENT-E2E-CERT',
          CURRENT_DATE, true, now()
        )
        ON CONFLICT (doctor_id, specialty_id) DO UPDATE
        SET certification_number = EXCLUDED.certification_number,
            certified_date = EXCLUDED.certified_date,
            is_primary = true;
        """,
        postgres_container,
    )


def chat(agent_url: str, session_id: str, message: str) -> dict[str, Any]:
    return request_json(
        "POST",
        f"{agent_url.rstrip('/')}/chat",
        body={"session_id": session_id, "message": message},
        headers={"x-patient-id": PATIENT_ID},
        timeout=180,
    )


def executed_tools_from_metadata(metadata: dict[str, Any]) -> list[str]:
    tools = list(metadata.get("tool_calls") or [])
    if metadata.get("mutation_attempted") is True:
        return tools
    return [tool for tool in tools if tool not in MUTATION_TOOLS]


def run_chat_scenario(
    *,
    agent_url: str,
    scenario_id: str,
    categories: list[str],
    expected_tools: list[str],
    turns: list[str],
) -> dict[str, Any]:
    session_id = f"tool-coverage-{scenario_id}-{uuid4().hex[:8]}"
    turn_results: list[dict[str, Any]] = []
    observed_tools: list[str] = []
    executed_tools: list[str] = []
    for message in turns:
        started_at = time.perf_counter()
        try:
            response = chat(agent_url, session_id, message)
            status_code = 200
        except E2EError as error:
            response = {
                "session_id": session_id,
                "reply": "",
                "error": str(error),
                "metadata": {},
            }
            status_code = 599
        latency_ms = round((time.perf_counter() - started_at) * 1000)
        metadata = response.get("metadata") or {}
        observed_tools.extend(metadata.get("tool_calls") or [])
        executed_tools.extend(executed_tools_from_metadata(metadata))
        turn_results.append(
            {
                "status_code": status_code,
                "latency_ms": latency_ms,
                "session_id": session_id,
                "message": message,
                "reply": response.get("reply", ""),
                "error_code": response.get("error_code"),
                "error": response.get("error"),
                "metadata": metadata,
            }
        )
    checks = {
        "all_http_ok": all(item["status_code"] == 200 for item in turn_results),
        "expected_tools_observed": set(expected_tools) <= set(executed_tools),
        "no_duplicate_mutation_tool_call": all(
            executed_tools.count(tool) <= 1 for tool in MUTATION_TOOLS
        ),
    }
    return {
        "scenario_id": scenario_id,
        "difficulty": "e2e",
        "categories": categories,
        "passed": all(checks.values()),
        "checks": checks,
        "expected_tools": expected_tools,
        "observed_tools": observed_tools,
        "executed_tools": executed_tools,
        "turn_results": turn_results,
    }


def extract_appointment_code(result: dict[str, Any]) -> str:
    text = json.dumps(result, ensure_ascii=False)
    match = re.search(r"APT-[0-9]{8}-[0-9A-Z]+", text)
    if not match:
        raise E2EError("Booking scenario did not expose an appointment code.")
    return match.group(0)


def build_scenarios(clinic_id: str, work_date: str) -> list[dict[str, Any]]:
    minute_offset = int(time.time()) % 180
    doctor_time = os.getenv(
        "BOOKING_AGENT_COVERAGE_DOCTOR_TIME",
        f"{13 + minute_offset // 60:02d}:{minute_offset % 60:02d}",
    )
    specialty_offset = (minute_offset + 17) % 180
    specialty_time = os.getenv(
        "BOOKING_AGENT_COVERAGE_SPECIALTY_TIME",
        f"{13 + specialty_offset // 60:02d}:{specialty_offset % 60:02d}",
    )
    return [
        {
            "scenario_id": "read-list-clinics",
            "categories": ["coverage", "read"],
            "expected_tools": ["list_clinics"],
            "turns": ["Liệt kê các phòng khám S.M.I.L.E hiện có."],
        },
        {
            "scenario_id": "read-get-clinic",
            "categories": ["coverage", "read"],
            "expected_tools": ["get_clinic"],
            "turns": [f"Cho tôi thông tin chi tiết phòng khám id {clinic_id}."],
        },
        {
            "scenario_id": "read-list-services",
            "categories": ["coverage", "read"],
            "expected_tools": ["list_services"],
            "turns": ["Cho tôi xem danh sách dịch vụ nha khoa hiện có."],
        },
        {
            "scenario_id": "read-list-clinic-services",
            "categories": ["coverage", "read"],
            "expected_tools": ["list_clinic_services"],
            "turns": [f"Cho tôi xem dịch vụ của phòng khám id {clinic_id}."],
        },
        {
            "scenario_id": "read-list-specialties",
            "categories": ["coverage", "read"],
            "expected_tools": ["list_specialties"],
            "turns": ["Cho tôi xem các chuyên khoa nha khoa đang hoạt động."],
        },
        {
            "scenario_id": "read-list-doctor-schedules",
            "categories": ["coverage", "read"],
            "expected_tools": ["list_doctor_schedules"],
            "turns": [
                f"Xem lịch bác sĩ {DOCTOR_ID} tại phòng khám {clinic_id} ngày {work_date}."
            ],
        },
        {
            "scenario_id": "read-patient-appointments",
            "categories": ["coverage", "read", "lookup"],
            "expected_tools": ["get_patient_appointments"],
            "turns": ["Tôi muốn xem các lịch hẹn của tôi."],
        },
        {
            "scenario_id": "mutation-book-by-doctor",
            "categories": ["coverage", "booking", "mutation"],
            "expected_tools": ["book_by_doctor"],
            "turns": [
                f"Đặt lịch với bác sĩ {DOCTOR_ID} tại phòng khám {clinic_id} ngày {work_date} lúc {doctor_time}.",
                "Tôi xác nhận đặt lịch này.",
            ],
        },
        {
            "scenario_id": "mutation-book-by-specialty",
            "categories": ["coverage", "booking", "mutation"],
            "expected_tools": ["book_by_specialty"],
            "turns": [
                f"Đặt lịch theo chuyên khoa {SPECIALTY_ID} tại phòng khám {clinic_id} ngày {work_date} lúc {specialty_time}.",
                "Tôi xác nhận đặt lịch theo chuyên khoa này.",
            ],
        },
    ]


def build_cancel_scenario(appointment_code: str) -> dict[str, Any]:
    return {
        "scenario_id": "mutation-cancel-by-code",
        "categories": ["coverage", "cancel", "mutation"],
        "expected_tools": ["get_appointment_by_code", "cancel_appointment"],
        "turns": [
            f"Hủy giúp tôi lịch có mã {appointment_code}.",
            "Tôi xác nhận hủy lịch này.",
            "Xác nhận hủy.",
        ],
    }


def run_coverage(args: argparse.Namespace) -> None:
    check_http("booking-agent", f"{args.agent_url}/health")
    check_http("Clinical EMR", f"{args.emr_url}/api/v1/clinics")
    check_http(
        "IAM KYC",
        f"{args.iam_url}/v1/kyc/users/{PATIENT_ID}/status",
        headers={"x-internal-api-key": os.getenv("IAM_INTERNAL_API_KEY", "smile-internal-dev-key")},
    )
    check_vllm(args.llm_url)
    check_redis(args.redis_url)

    seed_iam_kyc(args.postgres_container)
    clinic_id, work_date = seed_clinic_and_schedule(args.emr_url)
    seed_specialty_assignment(args.postgres_container)

    scenarios = build_scenarios(clinic_id, work_date)
    results: list[dict[str, Any]] = []
    doctor_booking_result: dict[str, Any] | None = None
    for scenario in scenarios:
        result = run_chat_scenario(agent_url=args.agent_url, **scenario)
        results.append(result)
        print(json.dumps(result, ensure_ascii=False))
        if scenario["scenario_id"] == "mutation-book-by-doctor":
            doctor_booking_result = result

    if doctor_booking_result:
        try:
            appointment_code = extract_appointment_code(doctor_booking_result)
            cancel_scenario = build_cancel_scenario(appointment_code)
            cancel_result = run_chat_scenario(agent_url=args.agent_url, **cancel_scenario)
            results.append(cancel_result)
            print(json.dumps(cancel_result, ensure_ascii=False))
        except E2EError as error:
            results.append(
                {
                    "scenario_id": "mutation-cancel-by-code",
                    "difficulty": "e2e",
                    "categories": ["coverage", "cancel", "mutation"],
                    "passed": False,
                    "checks": {"appointment_code_available": False},
                    "expected_tools": ["get_appointment_by_code", "cancel_appointment"],
                    "observed_tools": [],
                    "executed_tools": [],
                    "turn_results": [{"status_code": 599, "error": str(error), "metadata": {}}],
                }
            )

    summary = build_eval_summary(
        results,
        quarantined_count=0,
        mutation_excluded_count=0,
    )
    coverage = build_tool_coverage_summary(results, required_tools=REQUIRED_AGENT_TOOLS)
    report = render_markdown_report(
        title="Booking Agent Live Tool Coverage Report",
        summary=summary,
        coverage=coverage,
        results=results,
    )
    args.output_dir.mkdir(parents=True, exist_ok=True)
    write_jsonl(args.output_dir / "tool_coverage_results.jsonl", results)
    write_json(args.output_dir / "tool_coverage_summary.json", summary)
    write_json(args.output_dir / "tool_coverage.json", coverage)
    (args.output_dir / "tool_coverage_report.md").write_text(report, encoding="utf-8")
    print(json.dumps({"summary": summary, "coverage": coverage}, ensure_ascii=False, indent=2))


def main() -> int:
    parser = argparse.ArgumentParser(description="Run live booking-agent tool coverage via /chat")
    parser.add_argument("--agent-url", default=os.getenv("BOOKING_AGENT_E2E_AGENT_URL", "http://127.0.0.1:8020"))
    parser.add_argument("--emr-url", default=os.getenv("BOOKING_AGENT_E2E_EMR_URL", "http://127.0.0.1:8082"))
    parser.add_argument("--iam-url", default=os.getenv("BOOKING_AGENT_E2E_IAM_URL", "http://127.0.0.1:3001"))
    parser.add_argument("--llm-url", default=os.getenv("BOOKING_AGENT_E2E_LLM_URL", "http://127.0.0.1:8000/v1"))
    parser.add_argument("--redis-url", default=os.getenv("BOOKING_AGENT_REDIS_URL", "redis://127.0.0.1:6379/2"))
    parser.add_argument("--postgres-container", default=os.getenv("BOOKING_AGENT_E2E_POSTGRES_CONTAINER", "smile-postgres"))
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    args = parser.parse_args()
    try:
        run_coverage(args)
    except E2EError as error:
        print(f"TOOL COVERAGE FAILED: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
