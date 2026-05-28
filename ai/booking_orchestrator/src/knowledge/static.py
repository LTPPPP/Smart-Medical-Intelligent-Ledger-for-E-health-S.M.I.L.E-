from typing import Any


CLINIC_INFO: dict[str, Any] = {
    "name": "S.M.I.L.E Dental Clinic",
    "address": "123 Nguyen Hue, District 1, Ho Chi Minh City",
    "phone": "+84 28 1234 5678",
    "email": "contact@smile-dental.vn",
    "opening_hours": {
        "monday_friday": "08:00-20:00",
        "saturday": "08:00-17:00",
        "sunday": "09:00-12:00",
    },
}

SERVICE_CATALOG: list[dict[str, Any]] = [
    {
        "service_code": "teeth_cleaning",
        "service_name": "Cạo vôi răng",
        "duration_minutes": 45,
    },
    {
        "service_code": "general_checkup",
        "service_name": "Khám răng tổng quát",
        "duration_minutes": 30,
    },
    {
        "service_code": "tooth_filling",
        "service_name": "Trám răng",
        "duration_minutes": 60,
    },
]


def get_clinic_info() -> dict[str, Any]:
    return CLINIC_INFO.copy()


def search_clinic_knowledge(query: str) -> dict[str, Any]:
    lowered = query.lower()
    result: dict[str, Any] = {}
    if any(term in lowered for term in ["hour", "open", "mở cửa", "giờ"]):
        result["opening_hours"] = CLINIC_INFO["opening_hours"]
    if any(term in lowered for term in ["address", "địa chỉ"]):
        result["address"] = CLINIC_INFO["address"]
    if any(term in lowered for term in ["service", "dịch vụ", "cleaning"]):
        result["services"] = SERVICE_CATALOG
    return result or {"clinic_info": CLINIC_INFO}


def get_services() -> list[dict[str, Any]]:
    return [service.copy() for service in SERVICE_CATALOG]


def estimate_service_duration(service_code_or_id: str) -> dict[str, Any]:
    for service in SERVICE_CATALOG:
        if service_code_or_id in {
            service["service_code"],
            service["service_name"],
        }:
            return {
                "service": service["service_name"],
                "duration_minutes": service["duration_minutes"],
            }
    return {"service": service_code_or_id, "duration_minutes": 30}
