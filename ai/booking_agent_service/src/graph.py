from __future__ import annotations

import unicodedata
from dataclasses import dataclass, field
from datetime import timedelta
from typing import Any
from uuid import uuid4

from .composer import (
    compose_backend_error_reply,
    compose_missing_detail_reply,
    compose_mutation_success,
    compose_pending_booking_confirmation,
)
from .guards import ConfirmationDecision, ResponsePostCheck, detect_confirmation, detect_safety_risk
from .memory import Candidate, CandidateList
from .planner import PlannerAction
from .state import AgentState, PendingConfirmation, utc_now


GOAL_SWITCH_HINTS = ("xem lịch", "hủy lịch", "đổi sang", "thay vì", "xem lich", "huy lich")


def _normalize_text(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text.lower().replace("đ", "d"))
    return "".join(char for char in decomposed if unicodedata.category(char) != "Mn")


def detect_goal_hint(message: str) -> str | None:
    normalized = _normalize_text(message)
    if any(phrase in normalized for phrase in ("huy lich", "huy hen", "cancel")):
        return "cancel"
    if any(phrase in normalized for phrase in ("xem lich", "lich hen cua toi", "kiem tra lich")):
        return "lookup"
    if any(phrase in normalized for phrase in ("dat lich", "book lich", "hen kham")):
        return "booking"
    return None


@dataclass
class TurnResult:
    reply: str
    metadata: dict[str, Any] = field(default_factory=dict)
    tool_calls: list[str] = field(default_factory=list)
    pending_mutation: bool = False


class BookingAgentGraph:
    def __init__(self, planner: Any, tool_registry: Any, step_budget: int) -> None:
        self.planner = planner
        self.tool_registry = tool_registry
        self.step_budget = step_budget

    async def run_turn(self, state: AgentState, message: str) -> TurnResult:
        safety = detect_safety_risk(message)
        if safety.blocked:
            return TurnResult(
                reply=(
                    "Triệu chứng bạn mô tả có dấu hiệu khẩn cấp. "
                    "Bạn nên liên hệ cơ sở y tế gần nhất hoặc số cấp cứu thay vì đặt lịch thường."
                ),
                metadata={"safety_blocked": safety.reason},
            )

        confirmation = detect_confirmation(message)
        goal_hint = detect_goal_hint(message)
        if goal_hint:
            state.current_goal = goal_hint
        normalized_message = _normalize_text(message)
        has_goal_switch_hint = any(hint in normalized_message for hint in GOAL_SWITCH_HINTS)
        if (
            state.pending_confirmation is not None
            and state.pending_confirmation.consumed
            and has_goal_switch_hint
        ):
            state.pending_confirmation = None
        if state.pending_confirmation is not None and not (
            confirmation == ConfirmationDecision.AMBIGUOUS and has_goal_switch_hint
        ):
            pending = state.pending_confirmation
            if pending.is_expired(utc_now()):
                state.pending_confirmation = None
                return TurnResult(
                    reply=(
                        "Cửa sổ xác nhận đã hết hạn. Mình có thể làm mới thông tin "
                        "và tạo lại xác nhận nếu bạn vẫn muốn tiếp tục."
                    ),
                    metadata={"pending_confirmation_expired": True},
                )
            if confirmation == ConfirmationDecision.REJECTED:
                state.pending_confirmation = None
                return TurnResult(
                    reply="Mình đã hủy yêu cầu đang chờ xác nhận.",
                    metadata={"pending_confirmation_rejected": True},
                )
            if confirmation == ConfirmationDecision.AMBIGUOUS:
                return TurnResult(
                    reply=(
                        "Mình đang có một yêu cầu chờ xử lý. Bạn vui lòng xác nhận rõ "
                        "là đồng ý hay không đồng ý nhé."
                    ),
                    metadata={"confirmation_status": "ambiguous"},
                    pending_mutation=True,
                )
            if not pending.consume():
                return TurnResult(
                    reply="Yêu cầu này đã được xử lý trước đó, mình không gọi lại thao tác nữa.",
                    metadata={"mutation_committed": False, "duplicate_confirmation": True},
                )
            if self.tool_registry is None:
                return TurnResult(
                    reply="Mình chưa thể thực hiện thao tác vì thiếu kết nối công cụ.",
                    metadata={"mutation_committed": False},
                )
            try:
                result = await self.tool_registry.execute(
                    pending.operation,
                    pending.payload,
                    idempotency_key=pending.idempotency_key,
                )
            except TimeoutError:
                if state.patient_id:
                    await self.tool_registry.execute(
                        "get_patient_appointments",
                        {"patient_id": state.patient_id},
                    )
                state.pending_confirmation = None
                return TurnResult(
                    reply=(
                        "Kết nối bị gián đoạn khi gửi yêu cầu. Mình đã kiểm tra lại "
                        "lịch hẹn trước khi cho phép thao tác mới."
                    ),
                    metadata={
                        "mutation_committed": False,
                        "commit_timeout_reverified": True,
                    },
                )
            except RuntimeError as error:
                state.pending_confirmation = None
                if "409" in str(error):
                    return TurnResult(
                        reply=compose_backend_error_reply(str(error)),
                        metadata={
                            "mutation_committed": False,
                            "backend_conflict": True,
                        },
                    )
                return TurnResult(
                    reply=compose_backend_error_reply(str(error)),
                    metadata={"mutation_committed": False, "backend_error": str(error)},
                )
            return TurnResult(
                reply=compose_mutation_success(result),
                metadata={"mutation_committed": True},
            )

        tool_calls: list[str] = []
        for _ in range(self.step_budget):
            action: PlannerAction = await self.planner.next_action(state, message)
            if action.kind == "goal_change":
                old_pending = state.pending_confirmation is not None
                state.current_goal = action.goal or "unknown"
                state.pending_confirmation = None
                return TurnResult(
                    reply="Mình đã chuyển sang luồng phù hợp hơn với yêu cầu hiện tại.",
                    metadata={
                        "goal_changed_to": state.current_goal,
                        "pending_confirmation_invalidated": old_pending,
                    },
                )
            if action.kind == "tool" and action.tool_name is not None:
                tool_calls.append(action.tool_name)
                if action.tool_name == "cancel_appointment":
                    return TurnResult(
                        reply=(
                            "Mình cần xác minh lịch hẹn thuộc tài khoản hiện tại "
                            "và nhận xác nhận rõ trước khi hủy."
                        ),
                        metadata={
                            "mutation_blocked": "cancel_requires_verified_pending_confirmation"
                        },
                        tool_calls=tool_calls,
                    )
                if action.tool_name in {"book_by_doctor", "book_by_specialty"}:
                    if not state.patient_id:
                        return TurnResult(
                            reply="Bạn cần đăng nhập để mình có thể tạo lịch hẹn cho đúng hồ sơ.",
                            metadata={"mutation_blocked": "missing_patient_context"},
                            tool_calls=tool_calls,
                        )
                    mutation_payload = dict(action.arguments)
                    mutation_payload["patient_id"] = state.patient_id
                    mutation_payload["created_by"] = state.patient_id
                    confirmation_id = f"confirm-{uuid4()}"
                    now = utc_now()
                    state.pending_confirmation = PendingConfirmation(
                        confirmation_id=confirmation_id,
                        operation=action.tool_name,
                        summary=f"Chuẩn bị {action.tool_name}",
                        created_at=now,
                        expires_at=now + timedelta(minutes=2),
                        idempotency_key=(
                            f"{state.session_id}:{confirmation_id}:{action.tool_name}"
                        ),
                        payload=mutation_payload,
                    )
                    return TurnResult(
                        reply=compose_pending_booking_confirmation(
                            action.tool_name,
                            mutation_payload,
                        ),
                        metadata={"pending_confirmation_created": True},
                        tool_calls=tool_calls,
                        pending_mutation=True,
                    )
                if self.tool_registry is not None:
                    observation = await self.tool_registry.execute(
                        action.tool_name,
                        action.arguments,
                    )
                    if (
                        state.current_goal == "cancel"
                        and action.tool_name == "get_appointment_by_code"
                    ):
                        if observation.get("patient_id") != state.patient_id:
                            state.pending_confirmation = None
                            return TurnResult(
                                reply=(
                                    "Mình không xác minh được lịch hẹn này thuộc về "
                                    "tài khoản hiện tại nên không thể hủy."
                                ),
                                metadata={"ownership_verified": False},
                                tool_calls=tool_calls,
                            )
                        confirmation_id = f"confirm-{uuid4()}"
                        now = utc_now()
                        appointment_id = observation["appointment_id"]
                        state.pending_confirmation = PendingConfirmation(
                            confirmation_id=confirmation_id,
                            operation="cancel_appointment",
                            summary=f"Hủy lịch hẹn {observation.get('appointment_code', appointment_id)}",
                            created_at=now,
                            expires_at=now + timedelta(minutes=2),
                            idempotency_key=(
                                f"{state.session_id}:{confirmation_id}:cancel_appointment"
                            ),
                            payload={
                                "appointment_id": appointment_id,
                                "cancelled_by": state.patient_id,
                            },
                        )
                        return TurnResult(
                            reply="Mình đã xác minh lịch hẹn. Bạn xác nhận rõ nếu muốn hủy lịch này.",
                            metadata={"ownership_verified": True},
                            tool_calls=tool_calls,
                            pending_mutation=True,
                        )
                    state.observations.append({"tool": action.tool_name, "result": observation})
                    read_result = self._handle_read_observation(
                        state,
                        action.tool_name,
                        observation,
                    )
                    if read_result is not None:
                        read_result.tool_calls = tool_calls
                        return read_result
                continue
            if action.kind == "parse_failed":
                return TurnResult(
                    reply="Mình chưa hiểu rõ yêu cầu. Bạn nói lại ngắn gọn giúp mình nhé.",
                    metadata={"parse_status": "PARSE_FAILED"},
                    tool_calls=tool_calls,
                )
            if action.kind == "answer":
                reply = action.answer or compose_missing_detail_reply()
                checker = ResponsePostCheck(allowed_ids=set(), allowed_codes=set())
                post_check = checker.validate(reply)
                if not post_check.safe:
                    return TurnResult(
                        reply=(
                            "Mình không có đủ dữ liệu đã xác minh để trả lời thông tin đó. "
                            "Mình có thể tra cứu lại từ hệ thống nếu bạn muốn."
                        ),
                        metadata={
                            "post_check_blocked": True,
                            "post_check_violations": post_check.violations,
                        },
                    )
                return TurnResult(reply=reply)

        return TurnResult(
            reply=compose_missing_detail_reply(),
            metadata={"stop_reason": "step_budget_exhausted"},
            tool_calls=tool_calls,
        )

    def _handle_read_observation(
        self,
        state: AgentState,
        tool_name: str,
        observation: Any,
    ) -> TurnResult | None:
        if tool_name == "get_patient_appointments":
            appointments = observation if isinstance(observation, list) else observation.get("data", [])
            candidates = [
                Candidate(
                    id=item.get("appointment_id") or item.get("id"),
                    label=self._appointment_label(item),
                    payload=item,
                )
                for item in appointments
                if item.get("appointment_id") or item.get("id")
            ]
            state.candidates["appointment"] = CandidateList(
                kind="appointment",
                fetched_at=utc_now(),
                ttl_seconds=600,
                items=candidates,
            )
            if not candidates:
                return TurnResult(
                    reply="Hiện mình chưa thấy lịch hẹn nào từ hệ thống.",
                    metadata={"candidate_list_updated": "appointment"},
                )
            return TurnResult(
                reply="Các lịch hẹn sắp tới của bạn: " + "; ".join(c.label for c in candidates),
                metadata={"candidate_list_updated": "appointment"},
            )

        if tool_name == "list_doctor_schedules":
            schedules = observation.get("data", observation) if isinstance(observation, dict) else observation
            candidates = [
                Candidate(
                    id=item.get("schedule_id") or item.get("id"),
                    label=self._schedule_label(item),
                    payload=item,
                )
                for item in schedules
                if item.get("schedule_id") or item.get("id")
            ]
            state.candidates["schedule"] = CandidateList(
                kind="schedule",
                fetched_at=utc_now(),
                ttl_seconds=90,
                items=candidates,
            )
            if not candidates:
                return TurnResult(
                    reply="Mình chưa thấy lịch bác sĩ phù hợp từ hệ thống.",
                    metadata={"candidate_list_updated": "schedule"},
                )
            return TurnResult(
                reply="Các lịch bác sĩ tìm được: " + "; ".join(c.label for c in candidates),
                metadata={"candidate_list_updated": "schedule"},
            )

        return None

    @staticmethod
    def _appointment_label(item: dict[str, Any]) -> str:
        code = item.get("appointment_code") or item.get("code") or item.get("appointment_id")
        date = item.get("appointment_date") or item.get("date") or ""
        time = item.get("appointment_time") or item.get("time") or ""
        status = item.get("status") or ""
        return " ".join(part for part in (code, date, time, status) if part)

    @staticmethod
    def _schedule_label(item: dict[str, Any]) -> str:
        shift = item.get("shift") or {}
        start = item.get("start_time") or shift.get("start_time") or ""
        end = item.get("end_time") or shift.get("end_time") or ""
        date = item.get("work_date") or item.get("date") or ""
        status = item.get("status") or ""
        time_range = "-".join(part for part in (start, end) if part)
        return " ".join(part for part in (date, time_range, status) if part)
