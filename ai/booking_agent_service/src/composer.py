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
