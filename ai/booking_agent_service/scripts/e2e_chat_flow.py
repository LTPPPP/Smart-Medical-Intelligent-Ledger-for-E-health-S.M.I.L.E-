#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import date, timedelta
from typing import Any
from uuid import uuid4


FLOW_DESCRIPTION = "lookup → prepare booking → confirm → cancel by code → confirm cancel"
PATIENT_ID = os.getenv("BOOKING_AGENT_E2E_PATIENT_ID", "11111111-1111-4111-8111-111111111111")
DOCTOR_ID = os.getenv("BOOKING_AGENT_E2E_DOCTOR_ID", "22222222-2222-4222-8222-222222222222")
CLINIC_CODE = os.getenv("BOOKING_AGENT_E2E_CLINIC_CODE", "SMILE-AGENT-E2E")
INTERNAL_API_KEY = os.getenv("IAM_INTERNAL_API_KEY", "smile-internal-dev-key")


class E2EError(RuntimeError):
    pass


def request_json(
    method: str,
    url: str,
    *,
    body: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
    timeout: int = 20,
) -> Any:
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json", **(headers or {})},
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        raw = error.read().decode(errors="replace")
        raise E2EError(f"{method} {url} failed with HTTP {error.code}: {raw}") from error
    except urllib.error.URLError as error:
        raise E2EError(f"{method} {url} failed: {error}") from error


def check_http(name: str, url: str, headers: dict[str, str] | None = None) -> None:
    try:
        request_json("GET", url, headers=headers, timeout=5)
    except E2EError as error:
        raise E2EError(f"{name} is not ready at {url}. {error}") from error


def check_vllm(base_url: str) -> None:
    check_http("vLLM", f"{base_url.rstrip('/')}/models")


def check_redis(redis_url: str) -> None:
    match = re.match(r"redis://(?P<host>[^:/]+):(?P<port>\d+)(?:/\d+)?", redis_url)
    if not match:
        raise E2EError(f"Unsupported Redis URL for E2E preflight: {redis_url}")
    host = match.group("host")
    port = int(match.group("port"))
    try:
        with socket.create_connection((host, port), timeout=3) as sock:
            sock.sendall(b"*1\r\n$4\r\nPING\r\n")
            response = sock.recv(32)
    except OSError as error:
        raise E2EError(f"Redis is not reachable at {redis_url}: {error}") from error
    if not response.startswith(b"+PONG"):
        raise E2EError(f"Redis did not return PONG at {redis_url}: {response!r}")


def docker_psql(database: str, sql: str, postgres_container: str) -> None:
    command = [
        "docker",
        "exec",
        postgres_container,
        "psql",
        "-U",
        "postgres",
        "-d",
        database,
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        sql,
    ]
    result = subprocess.run(command, text=True, capture_output=True)
    if result.returncode != 0:
        raise E2EError(
            f"psql seed failed for {database}: {result.stderr.strip() or result.stdout.strip()}"
        )


def seed_iam_kyc(postgres_container: str) -> None:
    docker_psql(
        "auth_service_db",
        f"""
        INSERT INTO accounts (
          account_id, username, email, phone, full_name, role, status,
          email_verified, phone_verified, created_at, updated_at
        ) VALUES (
          '{PATIENT_ID}', 'agent_e2e_patient', 'agent-e2e@smile.test',
          '0900000999', 'Agent E2E Patient', 'PATIENT', 'ACTIVE',
          true, true, now(), now()
        )
        ON CONFLICT (account_id) DO UPDATE
        SET phone_verified = true, email_verified = true, status = 'ACTIVE', updated_at = now();
        """,
        postgres_container,
    )
    docker_psql(
        "account_service_db",
        f"""
        INSERT INTO users (user_id, full_name, email, phone, created_at, updated_at)
        VALUES ('{PATIENT_ID}', 'Agent E2E Patient', 'agent-e2e@smile.test', '0900000999', now(), now())
        ON CONFLICT (user_id) DO UPDATE
        SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, phone = EXCLUDED.phone, updated_at = now();
        """,
        postgres_container,
    )
    docker_psql(
        "account_service_db",
        f"""
        INSERT INTO kyc_verifications (
          user_id, id_type, id_number, full_name, verification_status, ocr_status,
          submitted_at, verified_at, decision_source, decision_reason,
          consent_version, retention_policy_version, created_at, updated_at
        )
        SELECT
          '{PATIENT_ID}', 'CCCD', 'AGENT-E2E', 'Agent E2E Patient', 'VERIFIED', 'SKIPPED',
          now(), now(), 'MANUAL', 'Agent E2E seed',
          'agent-e2e', 'agent-e2e', now(), now()
        WHERE NOT EXISTS (
          SELECT 1 FROM kyc_verifications
          WHERE user_id = '{PATIENT_ID}' AND verification_status = 'VERIFIED'
        );
        """,
        postgres_container,
    )


def seed_clinic_and_schedule(emr_url: str) -> tuple[str, str]:
    clinics = request_json("GET", f"{emr_url}/api/v1/clinics")
    clinic_items = clinics.get("data", clinics) if isinstance(clinics, dict) else clinics
    clinic = next((item for item in clinic_items if item.get("clinic_code") == CLINIC_CODE), None)
    if clinic is None:
        clinic = request_json(
            "POST",
            f"{emr_url}/api/v1/clinics",
            body={
                "clinic_name": "S.M.I.L.E Agent E2E Clinic",
                "clinic_code": CLINIC_CODE,
                "address": "1 Agent E2E Street",
                "ward": "Ben Nghe",
                "district": "Quan 1",
                "city": "Ho Chi Minh",
                "phone": "028-0000-0999",
                "email": "agent-e2e@smile.test",
                "operating_hours": {"monday": "08:00-17:00"},
                "status": "ACTIVE",
                "license_number": "AGENT-E2E",
            },
        )
    clinic_id = clinic["clinic_id"]
    work_date = os.getenv(
        "BOOKING_AGENT_E2E_DATE",
        (date.today() + timedelta(days=7)).isoformat(),
    )
    schedules = request_json(
        "GET",
        f"{emr_url}/api/v1/doctor-schedules?doctor_id={DOCTOR_ID}&clinic_id={clinic_id}&work_date={work_date}",
    )
    schedule_items = schedules.get("data", schedules) if isinstance(schedules, dict) else schedules
    if not schedule_items:
        request_json(
            "POST",
            f"{emr_url}/api/v1/doctor-schedules",
            body={
                "doctor_id": DOCTOR_ID,
                "clinic_id": clinic_id,
                "work_date": work_date,
                "max_patients": 20,
                "status": "scheduled",
                "notes": "booking-agent e2e",
            },
        )
    return clinic_id, work_date


def chat(agent_url: str, session_id: str, message: str) -> dict[str, Any]:
    return request_json(
        "POST",
        f"{agent_url}/chat",
        body={"session_id": session_id, "message": message},
        headers={"x-patient-id": PATIENT_ID},
        timeout=180,
    )


def run_flow(args: argparse.Namespace) -> None:
    print(f"Running booking-agent E2E flow: {FLOW_DESCRIPTION}")
    check_http("booking-agent", f"{args.agent_url}/health")
    check_http("Clinical EMR", f"{args.emr_url}/api/v1/clinics")
    check_http(
        "IAM KYC",
        f"{args.iam_url}/v1/kyc/users/{PATIENT_ID}/status",
        headers={"x-internal-api-key": INTERNAL_API_KEY},
    )
    check_vllm(args.llm_url)
    check_redis(args.redis_url)

    seed_iam_kyc(args.postgres_container)
    eligibility = request_json(
        "GET",
        f"{args.iam_url}/v1/kyc/users/{PATIENT_ID}/status",
        headers={"x-internal-api-key": INTERNAL_API_KEY},
    )
    if not eligibility.get("canBook"):
        raise E2EError(f"IAM KYC seed did not make patient bookable: {eligibility}")

    clinic_id, work_date = seed_clinic_and_schedule(args.emr_url)
    session_id = f"agent-e2e-{int(time.time())}-{uuid4().hex[:8]}"
    time_text = os.getenv("BOOKING_AGENT_E2E_TIME", "10:30")

    turns = [
        "Tôi muốn xem lịch hẹn của tôi",
        f"Đặt lịch với bác sĩ {DOCTOR_ID} tại phòng khám {clinic_id} ngày {work_date} lúc {time_text}",
        "đồng ý xác nhận",
    ]
    appointment_code = None
    for message in turns:
        response = chat(args.agent_url, session_id, message)
        print(json.dumps(response, ensure_ascii=False))
        match = re.search(r"APT-[0-9]{8}-[0-9A-Z]+", json.dumps(response, ensure_ascii=False))
        if match:
            appointment_code = match.group(0)

    if not appointment_code:
        raise E2EError("Booking did not return an appointment code.")

    for message in (f"hủy lịch {appointment_code}", "xác nhận hủy"):
        response = chat(args.agent_url, session_id, message)
        print(json.dumps(response, ensure_ascii=False))

    final_appointment = request_json(
        "GET",
        f"{args.emr_url}/api/v1/appointments/code/{appointment_code}",
    )
    if final_appointment.get("status") != "cancelled":
        raise E2EError(f"Expected final appointment status cancelled, got {final_appointment}")
    print(
        json.dumps(
            {
                "ok": True,
                "appointment_code": appointment_code,
                "final_status": final_appointment["status"],
                "session_id": session_id,
            },
            ensure_ascii=False,
        )
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=FLOW_DESCRIPTION)
    parser.add_argument("--agent-url", default=os.getenv("BOOKING_AGENT_E2E_AGENT_URL", "http://127.0.0.1:8020"))
    parser.add_argument("--emr-url", default=os.getenv("BOOKING_AGENT_E2E_EMR_URL", "http://127.0.0.1:8082"))
    parser.add_argument("--iam-url", default=os.getenv("BOOKING_AGENT_E2E_IAM_URL", "http://127.0.0.1:3001"))
    parser.add_argument("--llm-url", default=os.getenv("BOOKING_AGENT_E2E_LLM_URL", "http://127.0.0.1:8000/v1"))
    parser.add_argument("--redis-url", default=os.getenv("BOOKING_AGENT_REDIS_URL", "redis://127.0.0.1:6379/2"))
    parser.add_argument("--postgres-container", default=os.getenv("BOOKING_AGENT_E2E_POSTGRES_CONTAINER", "smile-postgres"))
    args = parser.parse_args()
    try:
        run_flow(args)
    except E2EError as error:
        print(f"E2E FAILED: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
