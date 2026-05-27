from dataclasses import dataclass
from enum import Enum
from typing import Iterable

from src.agent.conversation_state import ConversationState, RoutingDecision


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
    "sưng mặt",
    "sốt",
    "khó thở",
    "chảy máu không cầm",
    "đau dữ dội",
    "tai nạn",
    "nhiễm trùng",
    "mủ",
    "đau ngực",
    "ngất",
    "đau răng dữ dội",
    "cấp cứu",
]

BOOKING_READ_TOOLS = ["get_services", "estimate_service_duration", "get_available_slots"]
HOLD_KEYWORDS = ["hold", "giữ slot", "giữ chỗ", "giữ lịch", "chọn slot", "slot này", "slot đó"]
CONFIRM_KEYWORDS = ["confirm", "confirm booking", "xác nhận", "chốt lịch"]
RELEASE_HOLD_KEYWORDS = ["release hold", "không lấy", "bỏ giữ", "nhả slot", "hủy giữ"]
CANCEL_KEYWORDS = ["cancel", "hủy", "huỷ"]
RESCHEDULE_KEYWORDS = ["reschedule", "change", "đổi lịch", "dời lịch", "hoãn lịch", "chuyển lịch"]
WAITLIST_KEYWORDS = ["waitlist", "waiting list", "danh sách chờ"]
SERVICE_KEYWORDS = ["service", "dịch vụ", "price", "duration", "thời lượng", "bao lâu"]
INFO_KEYWORDS = ["hours", "opening", "giờ mở cửa", "thông tin", "địa chỉ", "phòng khám"]
BOOKING_KEYWORDS = [
    "book",
    "appointment",
    "đặt lịch",
    "lịch khám",
    "muốn khám",
    "cần khám",
    "cạo vôi",
    "cleaning",
]


@dataclass(frozen=True)
class ToolProfileSelection:
    profile: ToolProfile
    tools: list[str]
    matched_keywords: list[str]
    routing: RoutingDecision


class ToolProfileSelector:
    """Deterministic profile selector. It does not call or trust the LLM."""

    def select_profile(
        self,
        latest_user_message: str,
        conversation_state: dict | None = None,
        detected_intent: str | None = None,
        risk_keywords: Iterable[str] | None = None,
    ) -> ToolProfileSelection:
        state = ConversationState.from_raw(conversation_state)
        text = latest_user_message.lower()
        matched_risk = [
            keyword
            for keyword in (risk_keywords or HIGH_RISK_KEYWORDS)
            if keyword in text
        ]
        if matched_risk:
            return self._selection(
                ToolProfile.SAFETY,
                matched_risk,
                routing=self._routing(
                    decision="SAFETY_OVERRIDE",
                    reason="safety_keywords_matched",
                    confidence="HIGH",
                    pending_action="create_handoff_ticket",
                    state_update={"active_intent": "safety"},
                ),
            )

        intent = (detected_intent or "").lower()
        if intent in {"cancel", "cancel_appointment"} or self._contains_any(text, CANCEL_KEYWORDS):
            return self._cancel_selection(state)
        if intent in {
            "reschedule",
            "reschedule_appointment",
        } or self._contains_any(text, RESCHEDULE_KEYWORDS):
            return self._reschedule_selection(text, state)
        if intent in {"waitlist", "add_to_waitlist"} or self._contains_any(text, WAITLIST_KEYWORDS):
            return self._waitlist_selection(text, state)

        if state.active_intent == "reschedule":
            return self._reschedule_selection(text, state)
        if state.active_intent == "waitlist":
            return self._waitlist_selection(text, state)
        if state.active_intent == "cancel":
            return self._cancel_selection(state)
        if self._is_booking_action(text) or state.active_intent == "booking":
            return self._booking_selection(text, state)
        if self._contains_any(text, SERVICE_KEYWORDS):
            return self._selection(
                ToolProfile.SERVICE,
                tools=PROFILE_TOOLS[ToolProfile.SERVICE],
                routing=self._routing(
                    reason="service_keywords_matched",
                    confidence="HIGH",
                    pending_action="answer_service_question",
                    state_update={"active_intent": "service"},
                ),
            )
        if self._contains_any(text, INFO_KEYWORDS):
            return self._selection(
                ToolProfile.INFO,
                tools=PROFILE_TOOLS[ToolProfile.INFO],
                routing=self._routing(
                    reason="info_keywords_matched",
                    confidence="HIGH",
                    pending_action="answer_clinic_info",
                    state_update={"active_intent": "info"},
                ),
            )
        if intent in {"book", "booking", "book_appointment"} or self._contains_any(text, BOOKING_KEYWORDS):
            return self._booking_selection(text, state)
        return self._selection(
            ToolProfile.INFO,
            tools=PROFILE_TOOLS[ToolProfile.INFO],
            routing=self._routing(
                decision="FALLBACK_INFO",
                reason="fallback_info",
                confidence="LOW",
                pending_action="clarify_or_answer_info",
                state_update={"active_intent": "info"},
            ),
        )

    def _booking_selection(self, text: str, state: ConversationState) -> ToolProfileSelection:
        if self._contains_any(text, RELEASE_HOLD_KEYWORDS):
            if state.hold_id:
                return self._selection(
                    ToolProfile.BOOKING,
                    tools=["release_hold"],
                    routing=self._routing(
                        reason="booking_release_ready",
                        confidence="HIGH",
                        pending_action="release_hold",
                        state_update={"active_intent": "booking"},
                    ),
                )
            return self._missing_selection(
                ToolProfile.BOOKING,
                reason="booking_release_missing_hold",
                pending_action="release_hold",
                missing_fields=["hold_id"],
                blocked_tools=["release_hold"],
            )

        if self._contains_any(text, CONFIRM_KEYWORDS) or state.pending_action == "confirm_booking":
            missing = self._booking_confirm_missing_fields(state)
            if missing:
                return self._missing_selection(
                    ToolProfile.BOOKING,
                    reason="booking_confirm_missing_fields",
                    pending_action="confirm_booking",
                    missing_fields=missing,
                    blocked_tools=["confirm_booking"],
                )
            return self._selection(
                ToolProfile.BOOKING,
                tools=["confirm_booking"],
                routing=self._routing(
                    reason="booking_confirm_ready",
                    confidence="HIGH",
                    pending_action="confirm_booking",
                    state_update={"active_intent": "booking"},
                ),
            )

        if self._contains_any(text, HOLD_KEYWORDS) or state.pending_action == "hold_slot":
            if not state.selected_slot_id:
                return self._missing_selection(
                    ToolProfile.BOOKING,
                    reason="booking_hold_missing_slot",
                    pending_action="hold_slot",
                    missing_fields=["selected_slot_id"],
                    blocked_tools=["hold_slot"],
                    tools=["get_available_slots"],
                )
            return self._selection(
                ToolProfile.BOOKING,
                tools=["hold_slot"],
                routing=self._routing(
                    reason="booking_hold_ready",
                    confidence="HIGH",
                    pending_action="hold_slot",
                    state_update={"active_intent": "booking"},
                ),
            )

        return self._selection(
            ToolProfile.BOOKING,
            tools=BOOKING_READ_TOOLS,
            routing=self._routing(
                reason="booking_search_ready",
                confidence="MEDIUM",
                pending_action="search_slots_or_services",
                state_update={"active_intent": "booking"},
            ),
        )

    def _reschedule_selection(self, text: str, state: ConversationState) -> ToolProfileSelection:
        if not state.appointment_id:
            return self._missing_selection(
                ToolProfile.RESCHEDULE,
                reason="reschedule_missing_appointment",
                pending_action="identify_appointment",
                missing_fields=["appointment_id"],
                blocked_tools=["reschedule_appointment"],
                tools=["get_available_slots"],
            )
        if self._contains_any(text, CONFIRM_KEYWORDS) or state.pending_action == "reschedule_appointment":
            missing = []
            if not state.hold_id:
                missing.append("hold_id")
            if not state.patient_session_id:
                missing.append("patient_session_id")
            if not state.changed_by:
                missing.append("changed_by")
            if missing:
                return self._missing_selection(
                    ToolProfile.RESCHEDULE,
                    reason="reschedule_missing_fields",
                    pending_action="reschedule_appointment",
                    missing_fields=missing,
                    blocked_tools=["reschedule_appointment"],
                    tools=["get_available_slots"],
                )
            return self._selection(
                ToolProfile.RESCHEDULE,
                tools=["reschedule_appointment"],
                routing=self._routing(
                    reason="reschedule_ready",
                    confidence="HIGH",
                    pending_action="reschedule_appointment",
                    state_update={"active_intent": "reschedule"},
                ),
            )
        if state.selected_slot_id:
            return self._selection(
                ToolProfile.RESCHEDULE,
                tools=["hold_slot"],
                routing=self._routing(
                    reason="reschedule_hold_new_slot_ready",
                    confidence="HIGH",
                    pending_action="hold_slot",
                    state_update={"active_intent": "reschedule"},
                ),
            )
        return self._selection(
            ToolProfile.RESCHEDULE,
            tools=["get_available_slots"],
            routing=self._routing(
                reason="reschedule_search_slots",
                confidence="MEDIUM",
                pending_action="get_available_slots",
                state_update={"active_intent": "reschedule"},
            ),
        )

    def _cancel_selection(self, state: ConversationState) -> ToolProfileSelection:
        missing = []
        if not state.appointment_id:
            missing.append("appointment_id")
        if not state.cancelled_by:
            missing.append("cancelled_by")
        if missing:
            return self._missing_selection(
                ToolProfile.CANCEL,
                reason="cancel_missing_fields",
                pending_action="cancel_appointment",
                missing_fields=missing,
                blocked_tools=["cancel_appointment"],
            )
        return self._selection(
            ToolProfile.CANCEL,
            tools=["cancel_appointment", "check_waitlist_matches", "send_email_notification"],
            routing=self._routing(
                reason="cancel_ready",
                confidence="HIGH",
                pending_action="cancel_appointment",
                state_update={"active_intent": "cancel"},
            ),
        )

    def _waitlist_selection(self, text: str, state: ConversationState) -> ToolProfileSelection:
        if "match" in text or "phù hợp" in text:
            if state.selected_slot_id:
                return self._selection(
                    ToolProfile.WAITLIST,
                    tools=["check_waitlist_matches"],
                    routing=self._routing(
                        reason="waitlist_match_ready",
                        confidence="HIGH",
                        pending_action="check_waitlist_matches",
                        state_update={"active_intent": "waitlist"},
                    ),
                )
            return self._missing_selection(
                ToolProfile.WAITLIST,
                reason="waitlist_match_missing_slot",
                pending_action="check_waitlist_matches",
                missing_fields=["selected_slot_id"],
                blocked_tools=["check_waitlist_matches"],
            )

        missing = self._waitlist_missing_fields(state)
        if missing:
            return self._missing_selection(
                ToolProfile.WAITLIST,
                reason="waitlist_missing_fields",
                pending_action="add_to_waitlist",
                missing_fields=missing,
                blocked_tools=["add_to_waitlist"],
            )
        return self._selection(
            ToolProfile.WAITLIST,
            tools=["add_to_waitlist"],
            routing=self._routing(
                reason="waitlist_ready",
                confidence="HIGH",
                pending_action="add_to_waitlist",
                state_update={"active_intent": "waitlist"},
            ),
        )

    def _selection(
        self,
        profile: ToolProfile,
        matched_keywords: list[str] | None = None,
        tools: list[str] | None = None,
        routing: RoutingDecision | None = None,
    ) -> ToolProfileSelection:
        selected_tools = tools if tools is not None else PROFILE_TOOLS[profile]
        selected_routing = routing or self._routing(
            reason=f"{profile.value.lower()}_selected",
            confidence="MEDIUM",
            state_update={"active_intent": profile.value.lower()},
        )
        if "last_profile" not in selected_routing.state_update:
            selected_routing.state_update["last_profile"] = profile.value
        if selected_routing.pending_action and "pending_action" not in selected_routing.state_update:
            selected_routing.state_update["pending_action"] = selected_routing.pending_action
        return ToolProfileSelection(
            profile=profile,
            tools=selected_tools,
            matched_keywords=matched_keywords or [],
            routing=selected_routing,
        )

    def _missing_selection(
        self,
        profile: ToolProfile,
        reason: str,
        pending_action: str,
        missing_fields: list[str],
        blocked_tools: list[str],
        tools: list[str] | None = None,
    ) -> ToolProfileSelection:
        return self._selection(
            profile,
            tools=tools or [],
            routing=self._routing(
                decision="ASK_FOR_MISSING_INFO",
                reason=reason,
                confidence="MEDIUM",
                pending_action=pending_action,
                missing_fields=missing_fields,
                state_update={"active_intent": profile.value.replace("_PROFILE", "").lower()},
                blocked_tools=blocked_tools,
            ),
        )

    @staticmethod
    def _routing(
        reason: str,
        confidence: str,
        decision: str = "ALLOW_TOOL_PROFILE",
        pending_action: str | None = None,
        missing_fields: list[str] | None = None,
        state_update: dict | None = None,
        blocked_tools: list[str] | None = None,
    ) -> RoutingDecision:
        return RoutingDecision(
            decision=decision,  # type: ignore[arg-type]
            reason=reason,
            confidence=confidence,  # type: ignore[arg-type]
            pending_action=pending_action,
            missing_fields=missing_fields or [],
            state_update=state_update or {},
            blocked_tools=blocked_tools or [],
        )

    def _is_booking_action(self, text: str) -> bool:
        return self._contains_any(text, HOLD_KEYWORDS + CONFIRM_KEYWORDS + RELEASE_HOLD_KEYWORDS)

    @staticmethod
    def _booking_confirm_missing_fields(state: ConversationState) -> list[str]:
        missing = []
        if not state.hold_id:
            missing.append("hold_id")
        if not state.service_id:
            missing.append("service_id")
        if not state.patient.full_name:
            missing.append("patient.full_name")
        if not state.patient.phone:
            missing.append("patient.phone")
        return missing

    @staticmethod
    def _waitlist_missing_fields(state: ConversationState) -> list[str]:
        missing = []
        if not state.patient.full_name:
            missing.append("patient.full_name")
        if not state.patient.phone:
            missing.append("patient.phone")
        if not state.clinic_id:
            missing.append("clinic_id")
        if not state.service_id:
            missing.append("service_id")
        if not state.preferred_date:
            missing.append("preferred_date")
        return missing

    @staticmethod
    def _contains_any(text: str, keywords: list[str]) -> bool:
        return any(keyword in text for keyword in keywords)
