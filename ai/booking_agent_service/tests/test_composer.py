from __future__ import annotations

from src.composer import (
    compose_backend_error_reply,
    compose_mutation_success,
    compose_pending_booking_confirmation,
)


def test_mutation_success_quotes_backend_code_and_status_when_available():
    reply = compose_mutation_success(
        {
            "appointment_code": "APT-20260620-0001",
            "status": "cancelled",
        }
    )

    assert "APT-20260620-0001" in reply
    assert "cancelled" in reply


def test_pending_booking_confirmation_summarizes_backend_ids_and_time():
    reply = compose_pending_booking_confirmation(
        "book_by_doctor",
        {
            "doctor_id": "22222222-2222-4222-8222-222222222222",
            "clinic_id": "33333333-3333-4333-8333-333333333333",
            "appointment_date": "2026-06-20",
            "appointment_time": "09:00",
        },
    )

    assert "bác sĩ 22222222-2222-4222-8222-222222222222" in reply
    assert "phòng khám 33333333-3333-4333-8333-333333333333" in reply
    assert "2026-06-20" in reply
    assert "09:00" in reply
    assert "xác nhận" in reply.lower()


def test_backend_error_reply_explains_kyc_required_and_unavailable():
    unavailable = compose_backend_error_reply(
        "503 Service Unavailable: {'code': 'KYC_CHECK_UNAVAILABLE'}"
    )
    required = compose_backend_error_reply(
        "403 Forbidden: {'code': 'KYC_REQUIRED', 'message': 'Phone verification and approved KYC are required before booking'}"
    )

    assert "xác minh danh tính" in unavailable.lower()
    assert "tạm thời" in unavailable.lower()
    assert "xác minh số điện thoại" in required.lower()
    assert "kyc" in required.lower()
