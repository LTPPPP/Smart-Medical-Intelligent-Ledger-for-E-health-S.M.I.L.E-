from __future__ import annotations

from src.guards import (
    ConfirmationDecision,
    ResponsePostCheck,
    detect_confirmation,
    detect_safety_risk,
)
from src.redaction import redact_text


def test_confirmation_detection_is_deterministic_for_vietnamese_replies():
    assert detect_confirmation("có, xác nhận đặt giúp tôi") == ConfirmationDecision.CONFIRMED
    assert detect_confirmation("ok đặt lịch đó đi") == ConfirmationDecision.CONFIRMED
    assert detect_confirmation("xác nhận hủy lịch này") == ConfirmationDecision.CONFIRMED
    assert detect_confirmation("không, tôi đổi ý") == ConfirmationDecision.REJECTED
    assert detect_confirmation("để tôi xem lại đã") == ConfirmationDecision.AMBIGUOUS


def test_emergency_symptom_overrides_booking_but_normal_dental_pain_is_allowed():
    urgent = detect_safety_risk("Tôi đau răng và bị sưng mặt, khó thở, đặt lịch giúp")
    normal = detect_safety_risk("Tôi đau răng nhẹ muốn đặt lịch khám nha khoa")

    assert urgent.blocked is True
    assert urgent.reason == "emergency_or_systemic_symptom"
    assert normal.blocked is False
    assert detect_safety_risk("Răng tôi đang chảy máu nhiều lắm").blocked is True
    assert detect_safety_risk("Máu chảy nhiều lắm, đặt lịch gấp").blocked is True


def test_response_post_check_blocks_invented_ids_and_codes():
    checker = ResponsePostCheck(
        allowed_ids={"11111111-1111-4111-8111-111111111111"},
        allowed_codes={"APT-20260614-0001"},
    )

    allowed = checker.validate("Mã lịch hẹn APT-20260614-0001 đã được xác nhận.")
    blocked = checker.validate(
        "Mã lịch hẹn APT-20260614-9999 đã được xác nhận với id "
        "22222222-2222-4222-8222-222222222222."
    )

    assert allowed.safe is True
    assert blocked.safe is False
    assert "APT-20260614-9999" in blocked.violations


def test_redaction_masks_observability_payloads():
    text = "Nguyễn Văn A, email a@example.com, SĐT 0912345678, đau nhiều"

    redacted = redact_text(text)

    assert "a@example.com" not in redacted
    assert "0912345678" not in redacted
    assert "[email]" in redacted
    assert "[phone]" in redacted
