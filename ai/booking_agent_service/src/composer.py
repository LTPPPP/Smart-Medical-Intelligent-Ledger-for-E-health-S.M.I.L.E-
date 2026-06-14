from __future__ import annotations

from typing import Any


def compose_missing_detail_reply() -> str:
    return "Mình cần thêm thông tin để tiếp tục, ví dụ phòng khám, ngày mong muốn hoặc bác sĩ bạn muốn đặt."


def compose_mutation_success(result: dict[str, Any]) -> str:
    code = result.get("appointment_code")
    status = result.get("status")
    status_text = f" Trạng thái: {status}." if status else ""
    if code:
        return f"Lịch hẹn đã được xử lý thành công. Mã lịch hẹn: {code}.{status_text}"
    return (
        "Yêu cầu lịch hẹn đã được xử lý thành công theo phản hồi từ hệ thống."
        f"{status_text}"
    )


def compose_pending_booking_confirmation(operation: str, payload: dict[str, Any]) -> str:
    if operation == "book_by_doctor":
        doctor = payload.get("doctor_id")
        clinic = payload.get("clinic_id")
        date = payload.get("appointment_date")
        time = payload.get("appointment_time")
        details = [
            f"bác sĩ {doctor}" if doctor else None,
            f"phòng khám {clinic}" if clinic else None,
            f"ngày {date}" if date else None,
            f"lúc {time}" if time else None,
        ]
    else:
        specialty = payload.get("specialty_id")
        clinic = payload.get("clinic_id")
        date = payload.get("preferred_date")
        time = payload.get("preferred_time")
        details = [
            f"chuyên khoa {specialty}" if specialty else None,
            f"phòng khám {clinic}" if clinic else None,
            f"ngày {date}" if date else None,
            f"lúc {time}" if time else None,
        ]
    summary = ", ".join(detail for detail in details if detail)
    if summary:
        return (
            f"Mình đã chuẩn bị yêu cầu đặt lịch với thông tin: {summary}. "
            "Bạn xác nhận rõ nếu muốn mình gửi yêu cầu đặt lịch này."
        )
    return (
        "Mình đã đủ thông tin để chuẩn bị đặt lịch. "
        "Bạn xác nhận rõ nếu muốn mình gửi yêu cầu đặt lịch này."
    )


def compose_backend_error_reply(error: str) -> str:
    if "KYC_CHECK_UNAVAILABLE" in error:
        return (
            "Mình chưa thể gửi yêu cầu đặt lịch vì hệ thống xác minh danh tính "
            "đang tạm thời không phản hồi. Bạn thử lại sau ít phút nhé."
        )
    if "KYC_REQUIRED" in error:
        return (
            "Tài khoản cần hoàn tất xác minh số điện thoại và KYC trước khi đặt lịch. "
            "Bạn vui lòng hoàn tất xác minh rồi quay lại đặt lịch nhé."
        )
    if "409" in error:
        return (
            "Khung giờ này không còn khả dụng. Mình có thể tìm lại lịch mới cho bạn."
        )
    return "Hệ thống chưa xử lý được thao tác này. Bạn thử lại sau nhé."
