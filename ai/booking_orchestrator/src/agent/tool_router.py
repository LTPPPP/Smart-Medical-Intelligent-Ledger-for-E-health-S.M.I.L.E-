from dataclasses import dataclass
from enum import Enum
from typing import Iterable


class ToolProfile(str, Enum):
    INFO = "INFO_PROFILE"
    SERVICE = "SERVICE_PROFILE"
    BOOKING = "BOOKING_PROFILE"
    RESCHEDULE = "RESCHEDULE_PROFILE"
    CANCEL = "CANCEL_PROFILE"
    WAITLIST = "WAITLIST_PROFILE"
    SAFETY = "SAFETY_PROFILE"


PROFILE_TOOLS: dict[ToolProfile, list[str]] = {
    ToolProfile.INFO: ["get_clinic_info", "search_clinic_knowledge"],
    ToolProfile.SERVICE: ["get_services", "estimate_service_duration"],
    ToolProfile.BOOKING: [
        "get_services",
        "estimate_service_duration",
        "get_available_slots",
        "hold_slot",
        "confirm_booking",
        "release_hold",
    ],
    ToolProfile.RESCHEDULE: [
        "get_available_slots",
        "hold_slot",
        "reschedule_appointment",
        "release_hold",
        "send_email_notification",
    ],
    ToolProfile.CANCEL: [
        "cancel_appointment",
        "check_waitlist_matches",
        "send_email_notification",
    ],
    ToolProfile.WAITLIST: [
        "add_to_waitlist",
        "check_waitlist_matches",
        "send_email_notification",
    ],
    ToolProfile.SAFETY: [
        "classify_medical_risk",
        "create_handoff_ticket",
        "summarize_for_dentist",
        "send_email_notification",
    ],
}


HIGH_RISK_KEYWORDS = [
    "facial swelling",
    "fever",
    "difficulty breathing",
    "uncontrolled bleeding",
    "severe pain",
    "trauma",
    "broken tooth after accident",
    "infection",
    "pus",
    "spreading swelling",
    "chest pain",
    "fainting",
]


@dataclass(frozen=True)
class ToolProfileSelection:
    profile: ToolProfile
    tools: list[str]
    matched_keywords: list[str]


class ToolProfileSelector:
    """Deterministic profile selector. It does not call or trust the LLM."""

    def select_profile(
        self,
        latest_user_message: str,
        conversation_state: dict | None = None,
        detected_intent: str | None = None,
        risk_keywords: Iterable[str] | None = None,
    ) -> ToolProfileSelection:
        text = latest_user_message.lower()
        matched_risk = [
            keyword
            for keyword in (risk_keywords or HIGH_RISK_KEYWORDS)
            if keyword in text
        ]
        if matched_risk:
            return self._selection(ToolProfile.SAFETY, matched_risk)

        intent = (detected_intent or "").lower()
        if intent in {"cancel", "cancel_appointment"} or self._contains_any(
            text, ["cancel", "hủy", "huỷ"]
        ):
            return self._selection(ToolProfile.CANCEL)
        if intent in {
            "reschedule",
            "reschedule_appointment",
        } or self._contains_any(text, ["reschedule", "change", "đổi lịch", "dời lịch"]):
            return self._selection(ToolProfile.RESCHEDULE)
        if intent in {"waitlist", "add_to_waitlist"} or self._contains_any(
            text, ["waitlist", "waiting list", "danh sách chờ"]
        ):
            return self._selection(ToolProfile.WAITLIST)
        if intent in {"book", "booking", "book_appointment"} or self._contains_any(
            text, ["book", "appointment", "đặt lịch", "khám", "cleaning"]
        ):
            return self._selection(ToolProfile.BOOKING)
        if self._contains_any(text, ["service", "dịch vụ", "price", "duration"]):
            return self._selection(ToolProfile.SERVICE)
        return self._selection(ToolProfile.INFO)

    def _selection(
        self, profile: ToolProfile, matched_keywords: list[str] | None = None
    ) -> ToolProfileSelection:
        return ToolProfileSelection(
            profile=profile,
            tools=PROFILE_TOOLS[profile],
            matched_keywords=matched_keywords or [],
        )

    @staticmethod
    def _contains_any(text: str, keywords: list[str]) -> bool:
        return any(keyword in text for keyword in keywords)
