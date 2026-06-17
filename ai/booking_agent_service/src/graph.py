from __future__ import annotations

import asyncio
import time
import unicodedata
from dataclasses import dataclass, field
from datetime import timedelta
import json
from typing import Any
from uuid import uuid4

from .composer import (
    compose_backend_error_reply,
    compose_missing_detail_reply,
    compose_mutation_success,
    compose_pending_booking_confirmation,
)
from .guards import ConfirmationDecision, ResponsePostCheck, detect_confirmation, detect_safety_risk
from .memory import (
    Candidate,
    CandidateList,
    ReferenceResolutionError,
    record_recent_turn,
    resolve_state_reference,
)
from .planner import PlannerAction, PlannerContext
from .state import AgentState, PendingConfirmation, utc_now


GOAL_SWITCH_HINTS = ("xem lịch", "hủy lịch", "đổi sang", "thay vì", "xem lich", "huy lich")
READ_TOOL_NAMES = {
    "list_clinics",
    "get_clinic",
    "list_services",
    "list_clinic_services",
    "list_specialties",
    "list_doctor_schedules",
    "list_doctors_by_specialty",
    "get_doctor_leaves",
    "get_patient_appointments",
    "get_appointment_by_code",
    "get_appointment_by_id",
}


def _normalize_text(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text.lower().replace("đ", "d"))
    return "".join(char for char in decomposed if unicodedata.category(char) != "Mn")


def detect_goal_hint(message: str) -> str | None:
    normalized = _normalize_text(message)
    if any(phrase in normalized for phrase in ("huy lich", "huy hen", "cancel")) or (
        " huy " in f" {normalized} " and "khong huy" not in normalized and "ko huy" not in normalized
    ):
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
        record_recent_turn(state, "user", message)
        reference_error = self._resolve_active_reference(state, message)
        if reference_error == "reference_kind_ambiguous":
            result = TurnResult(
                reply=(
                    "Mình chưa rõ bạn đang chọn phòng khám hay dịch vụ/chuyên khoa. "
                    "Bạn nói rõ loại thông tin muốn chọn giúp mình nhé."
                ),
                metadata={"reference_ambiguous": True},
            )
        else:
            result = await self._run_turn(state, message)
        record_recent_turn(state, "assistant", result.reply)
        return result

    async def run_turn_v2(
        self,
        state: AgentState,
        message: str,
        slot_extractor: Any,
        current_date_iso: str,
    ) -> TurnResult:
        from .dispatcher import build_dispatch_plan

        record_recent_turn(state, "user", message)
        safety = detect_safety_risk(message)
        if safety.blocked:
            reply = (
                "Triệu chứng bạn mô tả có dấu hiệu khẩn cấp. "
                "Bạn nên liên hệ cơ sở y tế gần nhất hoặc số cấp cứu thay vì đặt lịch thường."
            )
            record_recent_turn(state, "assistant", reply)
            return TurnResult(reply=reply, metadata={"safety_blocked": safety.reason})

        confirmation = detect_confirmation(message)
        if state.pending_confirmation is not None:
            result = await self._handle_pending_confirmation(state, confirmation)
            record_recent_turn(state, "assistant", result.reply)
            return result

        try:
            extracted = await slot_extractor.extract(
                message,
                recent_turns=state.recent_turns,
                current_date_iso=current_date_iso,
            )
        except Exception:
            result = await self._run_turn(state, message)
            record_recent_turn(state, "assistant", result.reply)
            return result

        self._augment_missing_text_hints(extracted, message, state.recent_turns)
        self._merge_text_hints(state, extracted)

        # Sync goal from extracted intent so _resolve_active_reference has correct context.
        # _required_candidate_kind returns None for goal="unknown", breaking ordinal picks.
        _INTENT_TO_GOAL = {
            "book": "booking",
            "cancel": "cancel",
            "reschedule": "reschedule",
            "lookup": "lookup",
        }
        if extracted.intent in _INTENT_TO_GOAL:
            new_goal = _INTENT_TO_GOAL[extracted.intent]
            if new_goal != state.current_goal:
                state.switch_goal(new_goal)

        # Resolve ordinal/named references ("cái 1", "bác sĩ Minh") before planning
        # so schedule_id is set and _maybe_commit_from_slots can create a confirmation.
        ref_error = self._resolve_active_reference(state, message)
        if ref_error == "reference_kind_ambiguous":
            reply = (
                "Mình chưa rõ bạn đang chọn phòng khám hay dịch vụ/chuyên khoa. "
                "Bạn nói rõ loại thông tin muốn chọn giúp mình nhé."
            )
            record_recent_turn(state, "assistant", reply)
            return TurnResult(reply=reply, metadata={"reference_ambiguous": True})

        plan = build_dispatch_plan(extracted, state)
        if plan.clarification_needed:
            reply = plan.clarification_needed
            record_recent_turn(state, "assistant", reply)
            return TurnResult(reply=reply, metadata={"clarification_requested": True})
        if plan.is_empty():
            # Reference resolution may have just set schedule_id — try commit before ReACT.
            commit_result = await self._maybe_commit_from_slots(state, extracted, [])
            if commit_result is not None:
                record_recent_turn(state, "assistant", commit_result.reply)
                return commit_result
            result = await self._run_turn(state, message)
            record_recent_turn(state, "assistant", result.reply)
            return result

        all_tool_calls: list[str] = []
        last_read_result: TurnResult | None = None

        async def _run_groups(groups: list) -> TurnResult | None:
            """Execute tool groups, accumulate read results into last_read_result.

            Returns a TurnResult only on errors or mutation-gate actions (send_reminder).
            Catalog read results are stored in last_read_result instead of triggering
            an early return, so the caller can re-plan after state is updated.
            """
            nonlocal last_read_result
            called = set(all_tool_calls)
            for group in groups:
                new_calls = [tc for tc in group if tc.name not in called]
                if not new_calls:
                    continue
                for tool_call in new_calls:
                    if tool_call.name == "send_reminder":
                        r = self._prepare_send_reminder_confirmation(
                            state, tool_call.arguments, [*all_tool_calls, tool_call.name]
                        )
                        r.tool_calls = list(all_tool_calls)
                        return r
                tasks = [self.tool_registry.execute(tc.name, tc.arguments) for tc in new_calls]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                for tc, observation in zip(new_calls, results):
                    all_tool_calls.append(tc.name)
                    called.add(tc.name)
                    if isinstance(observation, Exception):
                        return TurnResult(
                            reply=compose_backend_error_reply(str(observation)),
                            metadata={
                                "backend_error": str(observation),
                                "tool_execution_failed": tc.name,
                            },
                            tool_calls=list(all_tool_calls),
                        )
                    state.observations.append({"tool": tc.name, "result": observation})
                    read_result = self._handle_read_observation(state, tc.name, observation)
                    if read_result is not None:
                        last_read_result = read_result
            return None

        early = await _run_groups(plan.groups)
        if early is not None:
            record_recent_turn(state, "assistant", early.reply)
            return early

        # Re-plan up to 2 more rounds now that state is updated from tool results.
        # After list_specialties runs, _merge_text_hints can match the specialty hint
        # to a real ID, allowing build_dispatch_plan to emit list_doctor_schedules.
        for _ in range(2):
            self._merge_text_hints(state, extracted)
            follow_plan = build_dispatch_plan(extracted, state)
            if follow_plan.clarification_needed or follow_plan.is_empty():
                break
            called_set = set(all_tool_calls)
            has_new = any(
                tc.name not in called_set
                for group in follow_plan.groups
                for tc in group
            )
            if not has_new:
                break
            early = await _run_groups(follow_plan.groups)
            if early is not None:
                record_recent_turn(state, "assistant", early.reply)
                return early

        commit_result = await self._maybe_commit_from_slots(state, extracted, all_tool_calls)
        if commit_result is not None:
            record_recent_turn(state, "assistant", commit_result.reply)
            return commit_result

        if last_read_result is not None:
            last_read_result.tool_calls = all_tool_calls
            record_recent_turn(state, "assistant", last_read_result.reply)
            return last_read_result

        if extracted.missing_slots:
            slot_questions = {
                "specialty": "Bạn muốn khám chuyên khoa nào?",
                "date": "Bạn muốn đặt ngày nào?",
                "time": "Bạn muốn đặt giờ nào?",
                "doctor": "Bạn muốn gặp bác sĩ nào?",
                "clinic": "Bạn muốn đến phòng khám nào?",
                "appointment_ref": "Bạn cho mình biết lịch hẹn nào cần thao tác nhé?",
            }
            slot_name = extracted.missing_slots[0]
            reply = slot_questions.get(slot_name, "Bạn cần thêm thông tin gì không?")
            record_recent_turn(state, "assistant", reply)
            return TurnResult(reply=reply, metadata={"missing_slot": slot_name})

        reply = compose_missing_detail_reply()
        record_recent_turn(state, "assistant", reply)
        return TurnResult(reply=reply, metadata={"stop_reason": "no_actionable_plan"})

    @staticmethod
    def _augment_missing_text_hints(
        slots: Any,
        message: str,
        recent_turns: list[dict[str, str]] | None = None,
    ) -> None:
        if getattr(slots, "intent", None) != "book":
            return
        if not getattr(slots, "specialty", None):
            user_turns = [
                turn.get("content", "")
                for turn in (recent_turns or [])[-6:]
                if turn.get("role") == "user"
            ]
            slots.specialty = " ".join([*user_turns, message]).strip()

    @staticmethod
    def _merge_text_hints(state: AgentState, slots: Any) -> None:
        if slots.date_hint and not state.slots.preferred_date:
            import re

            if re.fullmatch(r"\d{4}-\d{2}-\d{2}", slots.date_hint or ""):
                state.slots.preferred_date = slots.date_hint
        if slots.time_hint and not state.slots.preferred_time:
            import re

            if re.fullmatch(r"\d{2}:\d{2}", slots.time_hint or ""):
                state.slots.preferred_time = slots.time_hint
        if slots.clinic_hint and not state.slots.clinic_id:
            candidate = BookingAgentGraph._match_candidate_by_hint(
                state,
                kind="clinic",
                hint=slots.clinic_hint,
                payload_fields=(
                    "clinic_name",
                    "clinic_code",
                    "address",
                    "ward",
                    "district",
                    "city",
                ),
            )
            if candidate is not None:
                state.slots.clinic_id = candidate.id
                state.slots.clinic_label = candidate.label
        if slots.specialty and not state.slots.specialty_id:
            candidate = BookingAgentGraph._match_candidate_by_hint(
                state,
                kind="specialty",
                hint=slots.specialty,
                payload_fields=(
                    "specialty_name",
                    "specialty_code",
                    "description",
                ),
            )
            if candidate is not None:
                state.slots.specialty_id = candidate.id
                state.slots.specialty_label = candidate.label
        if slots.doctor_hint and not state.slots.doctor_id:
            candidate = BookingAgentGraph._match_candidate_by_hint(
                state,
                kind="doctor",
                hint=slots.doctor_hint,
                payload_fields=(
                    "doctor_name",
                    "full_name",
                    "name",
                    "doctor_code",
                ),
            )
            if candidate is not None:
                state.slots.doctor_id = candidate.id
                state.slots.doctor_label = candidate.label

    @staticmethod
    def _match_candidate_by_hint(
        state: AgentState,
        *,
        kind: str,
        hint: str,
        payload_fields: tuple[str, ...],
    ) -> Candidate | None:
        candidate_list = state.candidates.get(kind)
        if not isinstance(candidate_list, CandidateList) or candidate_list.is_stale(utc_now()):
            return None
        normalized_hint = _normalize_text(hint)
        if not normalized_hint:
            return None
        scored: list[tuple[int, Candidate]] = []
        for candidate in candidate_list.items:
            searchable_values = [
                candidate.label,
                *(
                    str(candidate.payload.get(field) or "")
                    for field in payload_fields
                ),
            ]
            searchable = " ".join(_normalize_text(value) for value in searchable_values)
            if normalized_hint in searchable or searchable in normalized_hint:
                return candidate
            overlap = BookingAgentGraph._meaningful_token_overlap(normalized_hint, searchable)
            if overlap:
                scored.append((overlap, candidate))
        if scored:
            scored.sort(key=lambda item: item[0], reverse=True)
            if len(scored) == 1 or scored[0][0] > scored[1][0]:
                return scored[0][1]
        return None

    @staticmethod
    def _meaningful_token_overlap(hint: str, searchable: str) -> int:
        import re

        stopwords = {
            "benh",
            "chuyen",
            "duoc",
            "gap",
            "kham",
            "khoa",
            "lich",
            "minh",
            "muon",
            "nha",
            "rang",
            "rung",
            "trong",
            "tong",
        }
        hint_tokens = {
            token
            for token in re.findall(r"[a-z0-9]+", hint)
            if len(token) >= 4 and token not in stopwords
        }
        searchable_tokens = {
            token
            for token in re.findall(r"[a-z0-9]+", searchable)
            if len(token) >= 4 and token not in stopwords
        }
        return len(hint_tokens & searchable_tokens)

    @staticmethod
    def _appointment_candidate_owned_by_patient(
        state: AgentState,
        appointment_id: str,
    ) -> bool:
        appointments = state.candidates.get("appointment")
        if not isinstance(appointments, CandidateList):
            return False
        for candidate in appointments.items:
            candidate_id = str(candidate.id)
            payload_id = str(candidate.payload.get("appointment_id") or candidate.payload.get("id") or "")
            if appointment_id not in {candidate_id, payload_id}:
                continue
            return candidate.payload.get("patient_id") == state.patient_id
        return False

    def _prepare_send_reminder_confirmation(
        self,
        state: AgentState,
        arguments: dict[str, Any],
        tool_calls: list[str],
    ) -> TurnResult:
        if not state.patient_id:
            return TurnResult(
                reply="Bạn cần đăng nhập để mình có thể gửi nhắc lịch.",
                metadata={"mutation_blocked": "missing_patient_context"},
                tool_calls=tool_calls,
            )
        appointment_id = arguments.get("appointment_id")
        if not appointment_id:
            return TurnResult(
                reply="Mình cần biết lịch hẹn nào để gửi nhắc. Bạn chọn lịch giúp mình nhé.",
                metadata={"mutation_blocked": "missing_appointment_id"},
                tool_calls=tool_calls,
            )
        confirmation_id = f"confirm-{uuid4()}"
        now = utc_now()
        state.pending_confirmation = PendingConfirmation(
            confirmation_id=confirmation_id,
            operation="send_reminder",
            summary="Gửi tin nhắc lịch hẹn",
            created_at=now,
            expires_at=now + timedelta(minutes=2),
            idempotency_key=f"{state.session_id}:{confirmation_id}:send_reminder",
            payload={"appointment_id": appointment_id},
        )
        return TurnResult(
            reply="Mình sẽ gửi tin nhắc cho lịch hẹn này. Bạn xác nhận để tiếp tục nhé.",
            metadata={"pending_confirmation_created": True},
            tool_calls=tool_calls,
            pending_mutation=True,
        )

    async def _maybe_commit_from_slots(
        self,
        state: AgentState,
        extracted: Any,
        tool_calls: list[str],
    ) -> TurnResult | None:
        if extracted.intent != "book":
            return None
        if not state.slots.schedule_id or not state.patient_id:
            return None
        payload: dict[str, Any] = {
            "patient_id": state.patient_id,
            "created_by": state.patient_id,
        }
        if state.slots.doctor_id:
            payload["doctor_id"] = state.slots.doctor_id
        if state.slots.specialty_id:
            payload["specialty_id"] = state.slots.specialty_id
        if state.slots.clinic_id:
            payload["clinic_id"] = state.slots.clinic_id
        if state.slots.preferred_date:
            payload["appointment_date"] = state.slots.preferred_date
        if state.slots.preferred_time:
            payload["appointment_time"] = state.slots.preferred_time
        operation = "book_by_doctor" if state.slots.doctor_id else "book_by_specialty"
        self._remember_booking_slots(state, operation, payload)
        confirmation_id = f"confirm-{uuid4()}"
        now = utc_now()
        state.pending_confirmation = PendingConfirmation(
            confirmation_id=confirmation_id,
            operation=operation,
            summary=f"Đặt lịch {state.slots.preferred_date or ''} {state.slots.preferred_time or ''}".strip(),
            created_at=now,
            expires_at=now + timedelta(minutes=2),
            idempotency_key=f"{state.session_id}:{confirmation_id}:{operation}",
            payload=payload,
        )
        return TurnResult(
            reply=compose_pending_booking_confirmation(
                operation,
                payload,
                display_labels={
                    "doctor": state.slots.doctor_label,
                    "clinic": state.slots.clinic_label,
                    "specialty": state.slots.specialty_label,
                },
            ),
            metadata={"pending_confirmation_created": True},
            tool_calls=tool_calls,
            pending_mutation=True,
        )

    async def _handle_pending_confirmation(
        self,
        state: AgentState,
        confirmation: ConfirmationDecision,
    ) -> TurnResult:
        pending = state.pending_confirmation
        assert pending is not None
        if pending.is_expired(utc_now()):
            state.pending_confirmation = None
            return TurnResult(
                reply=(
                    "Cửa sổ xác nhận đã hết hạn. Mình có thể tạo lại xác nhận "
                    "nếu bạn vẫn muốn tiếp tục."
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
                    "là đồng ý hay không nhé."
                ),
                metadata={"confirmation_status": "ambiguous"},
                pending_mutation=True,
            )
        if not pending.consume():
            return TurnResult(
                reply="Yêu cầu này đã được xử lý trước đó.",
                metadata={"mutation_committed": False, "duplicate_confirmation": True},
            )
        try:
            result = await self.tool_registry.execute(
                pending.operation,
                pending.payload,
                idempotency_key=pending.idempotency_key,
            )
        except RuntimeError as error:
            state.pending_confirmation = None
            return TurnResult(
                reply=compose_backend_error_reply(str(error)),
                metadata={
                    "mutation_committed": False,
                    "mutation_attempted": True,
                    "backend_error": str(error),
                },
                tool_calls=[pending.operation],
            )
        return TurnResult(
            reply=compose_mutation_success(result),
            metadata={"mutation_committed": True, "mutation_attempted": True},
            tool_calls=[pending.operation],
        )

    async def _run_turn(self, state: AgentState, message: str) -> TurnResult:
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
        pending_invalidated_by_goal_hint = False
        if goal_hint:
            had_pending = state.pending_confirmation is not None
            state.switch_goal(goal_hint)
            pending_invalidated_by_goal_hint = had_pending and state.pending_confirmation is None
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
                timeout_tool_calls = [pending.operation]
                if state.patient_id:
                    await self.tool_registry.execute(
                        "get_patient_appointments",
                        {"patient_id": state.patient_id},
                    )
                    timeout_tool_calls.append("get_patient_appointments")
                state.pending_confirmation = None
                return TurnResult(
                    reply=(
                        "Kết nối bị gián đoạn khi gửi yêu cầu. Mình đã kiểm tra lại "
                        "lịch hẹn trước khi cho phép thao tác mới."
                    ),
                    metadata={
                        "mutation_committed": False,
                        "mutation_attempted": True,
                        "commit_timeout_reverified": True,
                    },
                    tool_calls=timeout_tool_calls,
                )
            except RuntimeError as error:
                state.pending_confirmation = None
                if "409" in str(error):
                    return TurnResult(
                        reply=compose_backend_error_reply(str(error)),
                        metadata={
                            "mutation_committed": False,
                            "mutation_attempted": True,
                            "backend_conflict": True,
                        },
                        tool_calls=[pending.operation],
                    )
                return TurnResult(
                    reply=compose_backend_error_reply(str(error)),
                    metadata={
                        "mutation_committed": False,
                        "mutation_attempted": True,
                        "backend_error": str(error),
                    },
                    tool_calls=[pending.operation],
                )
            return TurnResult(
                reply=compose_mutation_success(result),
                metadata={"mutation_committed": True, "mutation_attempted": True},
                tool_calls=[pending.operation],
            )

        direct_read = await self._maybe_run_deterministic_read(state, normalized_message)
        if direct_read is not None:
            return direct_read

        tool_calls: list[str] = []
        planner_metadata: dict[str, Any] = {}
        attempted_read_signatures: set[str] = set()
        duplicate_read_signatures: list[str] = []
        duplicate_read_blocked = False
        consecutive_duplicate_reads = 0
        null_result_tools: list[str] = []
        for step_index in range(self.step_budget):
            pre_plan_diag: dict[str, Any] = {
                "step_index": step_index,
                "goal": state.current_goal,
                "slot_snapshot": self._diag_slot_snapshot(state),
                "candidate_kinds": self._diag_candidate_kinds(state),
                "attempted_read_signatures": sorted(attempted_read_signatures),
                "duplicate_read_blocked_context": duplicate_read_blocked,
            }
            try:
                action: PlannerAction = await self.planner.next_action(
                    state,
                    message,
                    PlannerContext(
                        step_index=step_index,
                        remaining_steps=self.step_budget - step_index,
                        attempted_read_signatures=sorted(attempted_read_signatures),
                        duplicate_read_blocked=duplicate_read_blocked,
                        null_result_tools=list(null_result_tools),
                    ),
                )
            except Exception as error:
                error_str = str(error)
                error_type = type(error).__name__
                if "timeout" in error_str.lower() or "Timeout" in error_type:
                    failure_class = "timeout"
                elif (
                    "ConnectError" in error_type
                    or "ConnectionRefused" in error_type
                    or "connection refused" in error_str.lower()
                    or "connection attempts failed" in error_str.lower()
                ):
                    failure_class = "connection_refused"
                elif any(x in error_type for x in ("HTTP", "Status", "Response")):
                    failure_class = "http_error"
                elif "JSON" in error_type or "json" in error_str.lower():
                    failure_class = "parse_error"
                else:
                    failure_class = f"unknown:{error_type}"
                return TurnResult(
                    reply=(
                        "Mô hình chatbot đang tạm thời không phản hồi. "
                        "Bạn thử lại sau ít phút nhé."
                    ),
                    metadata={
                        "planner_unavailable": True,
                        "planner_error": error_str or f"<{type(error).__name__}>",
                        "planner_failure_class": failure_class,
                        "planner_diag": pre_plan_diag,
                    },
                    tool_calls=tool_calls,
                )
            duplicate_read_blocked = False
            planner_metadata.update(action.metadata)
            planner_metadata[f"pre_plan_diag:step{step_index}"] = pre_plan_diag
            if action.kind == "goal_change":
                old_pending = state.pending_confirmation is not None
                state.switch_goal(action.goal or "unknown")
                return TurnResult(
                    reply="Mình đã chuyển sang luồng phù hợp hơn với yêu cầu hiện tại.",
                    metadata={
                        "goal_changed_to": state.current_goal,
                        "pending_confirmation_invalidated": (
                            old_pending or pending_invalidated_by_goal_hint
                        ),
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
                if action.tool_name == "reschedule_appointment":
                    if not state.patient_id:
                        return TurnResult(
                            reply="Bạn cần đăng nhập để mình có thể đổi lịch hẹn.",
                            metadata={"mutation_blocked": "missing_patient_context"},
                            tool_calls=tool_calls,
                        )
                    appointment_id = action.arguments.get("appointment_id")
                    if not appointment_id:
                        return TurnResult(
                            reply=(
                                "Mình cần mã lịch hẹn để thực hiện đổi lịch. "
                                "Bạn cho mình biết lịch nào muốn đổi nhé."
                            ),
                            metadata={"mutation_blocked": "missing_appointment_id"},
                            tool_calls=tool_calls,
                        )
                    if not self._appointment_candidate_owned_by_patient(
                        state,
                        str(appointment_id),
                    ):
                        return TurnResult(
                            reply=(
                                "Mình không xác minh được lịch hẹn này thuộc về "
                                "tài khoản hiện tại nên không thể đổi lịch."
                            ),
                            metadata={"ownership_verified": False},
                            tool_calls=tool_calls,
                        )
                    payload = dict(action.arguments)
                    payload["updated_by"] = state.patient_id
                    confirmation_id = f"confirm-{uuid4()}"
                    now = utc_now()
                    new_date = payload.get("appointment_date", "")
                    new_time = payload.get("appointment_time", "")
                    state.pending_confirmation = PendingConfirmation(
                        confirmation_id=confirmation_id,
                        operation="reschedule_appointment",
                        summary=f"Đổi lịch hẹn sang {new_date} {new_time}".strip(),
                        created_at=now,
                        expires_at=now + timedelta(minutes=2),
                        idempotency_key=(
                            f"{state.session_id}:{confirmation_id}:reschedule_appointment"
                        ),
                        payload=payload,
                    )
                    return TurnResult(
                        reply=(
                            f"Mình sẽ đổi lịch hẹn này sang {new_date} {new_time}. "
                            "Bạn xác nhận để tiếp tục nhé."
                        ),
                        metadata={"pending_confirmation_created": True},
                        tool_calls=tool_calls,
                        pending_mutation=True,
                    )
                if action.tool_name == "send_reminder":
                    if not state.patient_id:
                        return TurnResult(
                            reply="Bạn cần đăng nhập để mình có thể gửi nhắc lịch.",
                            metadata={"mutation_blocked": "missing_patient_context"},
                            tool_calls=tool_calls,
                        )
                    appointment_id = action.arguments.get("appointment_id")
                    if not appointment_id:
                        return TurnResult(
                            reply="Mình cần biết lịch hẹn nào để gửi nhắc. Bạn chọn lịch giúp mình nhé.",
                            metadata={"mutation_blocked": "missing_appointment_id"},
                            tool_calls=tool_calls,
                        )
                    confirmation_id = f"confirm-{uuid4()}"
                    now = utc_now()
                    state.pending_confirmation = PendingConfirmation(
                        confirmation_id=confirmation_id,
                        operation="send_reminder",
                        summary="Gửi tin nhắc lịch hẹn",
                        created_at=now,
                        expires_at=now + timedelta(minutes=2),
                        idempotency_key=f"{state.session_id}:{confirmation_id}:send_reminder",
                        payload={"appointment_id": appointment_id},
                    )
                    return TurnResult(
                        reply="Mình sẽ gửi tin nhắc cho lịch hẹn này. Bạn xác nhận để tiếp tục nhé.",
                        metadata={"pending_confirmation_created": True},
                        tool_calls=tool_calls,
                        pending_mutation=True,
                    )
                if action.tool_name in {"book_by_doctor", "book_by_specialty"}:
                    if not state.patient_id:
                        return TurnResult(
                            reply="Bạn cần đăng nhập để mình có thể tạo lịch hẹn cho đúng hồ sơ.",
                            metadata={"mutation_blocked": "missing_patient_context"},
                            tool_calls=tool_calls,
                        )
                    mutation_payload = self._merge_booking_slots(
                        state,
                        action.tool_name,
                        action.arguments,
                    )
                    self._remember_booking_slots(state, action.tool_name, mutation_payload)
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
                            display_labels={
                                "doctor": state.slots.doctor_label,
                                "clinic": state.slots.clinic_label,
                                "specialty": state.slots.specialty_label,
                            },
                        ),
                        metadata={"pending_confirmation_created": True},
                        tool_calls=tool_calls,
                        pending_mutation=True,
                    )
                if self.tool_registry is not None:
                    tool_arguments = dict(action.arguments)
                    if action.tool_name in READ_TOOL_NAMES:
                        tool_arguments, repaired_from_slots = self._repair_read_arguments_from_slots(
                            state,
                            action.tool_name,
                            tool_arguments,
                        )
                        if repaired_from_slots:
                            planner_metadata["tool_args_repaired_from_slots"] = action.tool_name
                        try:
                            read_signature = self._read_signature(
                                action.tool_name,
                                tool_arguments,
                            )
                        except Exception as error:
                            return TurnResult(
                                reply=(
                                    "Mình chưa dùng được mã định danh cho thông tin này. "
                                    "Bạn chọn theo số thứ tự trong danh sách hoặc để mình "
                                    "tra cứu lại danh sách nhé."
                                ),
                                metadata={
                                    "tool_args_invalid": action.tool_name,
                                    "tool_args_error": str(error),
                                },
                                tool_calls=tool_calls,
                            )
                        if read_signature in attempted_read_signatures:
                            duplicate_read_blocked = True
                            consecutive_duplicate_reads += 1
                            duplicate_read_signatures.append(read_signature)
                            metadata = {
                                **planner_metadata,
                                "duplicate_read_blocked": True,
                                "duplicate_read_signatures": duplicate_read_signatures,
                                "duplicate_read_hint": (
                                    f"Already attempted {action.tool_name} with identical args. "
                                    f"Signature: {read_signature}. "
                                    f"All attempted: {sorted(attempted_read_signatures)}"
                                ),
                                "slot_snapshot": self._diag_slot_snapshot(state),
                                "candidate_kinds": self._diag_candidate_kinds(state),
                                "planner_diag": pre_plan_diag,
                            }
                            if (
                                consecutive_duplicate_reads >= 2
                                or step_index == self.step_budget - 1
                            ):
                                if consecutive_duplicate_reads >= 2:
                                    metadata["duplicate_read_consecutive_stop"] = True
                                return TurnResult(
                                    reply=compose_missing_detail_reply(),
                                    metadata={
                                        **metadata,
                                        "stop_reason": "step_budget_exhausted",
                                    },
                                    tool_calls=tool_calls,
                                )
                            continue
                        attempted_read_signatures.add(read_signature)
                        consecutive_duplicate_reads = 0
                    _tool_t0 = time.monotonic()
                    try:
                        observation = await self.tool_registry.execute(
                            action.tool_name,
                            tool_arguments,
                        )
                    except Exception as error:
                        return TurnResult(
                            reply=compose_backend_error_reply(str(error)),
                            metadata={
                                "backend_error": str(error),
                                "tool_execution_failed": action.tool_name,
                                "backend_latency_ms": round((time.monotonic() - _tool_t0) * 1000),
                            },
                            tool_calls=tool_calls,
                        )
                    planner_metadata[f"backend_latency_ms:{action.tool_name}"] = round(
                        (time.monotonic() - _tool_t0) * 1000
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
                    if action.tool_name == "get_appointment_by_code" and not (
                        isinstance(observation, dict) and observation.get("appointment_id")
                    ):
                        null_result_tools.append(action.tool_name)
                    read_result = self._handle_read_observation(
                        state,
                        action.tool_name,
                        observation,
                    )
                    if read_result is not None:
                        read_result.tool_calls = tool_calls
                        if planner_metadata:
                            read_result.metadata = {**planner_metadata, **read_result.metadata}
                        if action.tool_name == "list_clinics":
                            followup = await self._maybe_get_clinic_after_location_match(
                                state,
                                normalized_message,
                                tool_calls,
                            )
                            if followup is not None:
                                return followup
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
                return TurnResult(reply=reply, metadata=planner_metadata)

        return TurnResult(
            reply=compose_missing_detail_reply(),
            metadata={
                **planner_metadata,
                "stop_reason": "step_budget_exhausted",
                **(
                    {
                        "duplicate_read_blocked": True,
                        "duplicate_read_signatures": duplicate_read_signatures,
                    }
                    if duplicate_read_signatures
                    else {}
                ),
            },
            tool_calls=tool_calls,
        )

    @staticmethod
    def _diag_slot_snapshot(state: AgentState) -> dict[str, Any]:
        s = state.slots
        return {k: v for k, v in {
            "clinic_id": s.clinic_id,
            "service_id": s.service_id,
            "specialty_id": s.specialty_id,
            "doctor_id": s.doctor_id,
            "schedule_id": s.schedule_id,
            "appointment_id": s.appointment_id,
            "appointment_code": s.appointment_code,
            "preferred_date": s.preferred_date,
        }.items() if v is not None}

    @staticmethod
    def _diag_candidate_kinds(state: AgentState) -> list[str]:
        return [k for k, v in state.candidates.items() if v]

    def _read_signature(self, tool_name: str, arguments: dict[str, Any]) -> str:
        if self.tool_registry is not None and hasattr(
            self.tool_registry,
            "canonical_read_signature",
        ):
            return self.tool_registry.canonical_read_signature(tool_name, arguments)
        normalized = {
            key: value for key, value in sorted(arguments.items()) if value is not None
        }
        return (
            f"{tool_name}:"
            f"{json.dumps(normalized, ensure_ascii=False, separators=(',', ':'))}"
        )

    async def _maybe_run_deterministic_read(
        self,
        state: AgentState,
        normalized_message: str,
    ) -> TurnResult | None:
        if self.tool_registry is None or not state.slots.clinic_id:
            return None
        deterministic_reason = None
        if self._asks_for_services_at_clinic(normalized_message):
            tool_name = "list_clinic_services"
            deterministic_reason = "clinic_services_for_resolved_clinic"
        elif self._asks_for_clinic_details(normalized_message):
            tool_name = "get_clinic"
            deterministic_reason = "clinic_detail_for_resolved_clinic"
        else:
            return None

        arguments = {"clinic_id": state.slots.clinic_id}
        try:
            observation = await self.tool_registry.execute(tool_name, arguments)
        except Exception as error:
            return TurnResult(
                reply=compose_backend_error_reply(str(error)),
                metadata={
                    "backend_error": str(error),
                    "tool_execution_failed": tool_name,
                    "deterministic_read": deterministic_reason,
                },
                tool_calls=[tool_name],
            )
        state.observations.append({"tool": tool_name, "result": observation})
        result = self._handle_read_observation(state, tool_name, observation)
        if result is None:
            return TurnResult(
                reply=compose_missing_detail_reply(),
                metadata={"deterministic_read": deterministic_reason},
                tool_calls=[tool_name],
            )
        result.tool_calls = [tool_name]
        result.metadata = {
            "deterministic_read": deterministic_reason,
            **result.metadata,
        }
        return result

    @staticmethod
    def _asks_for_services_at_clinic(normalized_message: str) -> bool:
        service_terms = (
            "dich vu",
            "goi kham",
            "lam duoc gi",
            "co lam",
            "co nhan",
            "co gi",
            "kham rang",
            "dieu tri gi",
            "tay trang",
            "nieng rang",
            "nho rang",
            "tram rang",
            "cao voi",
            "implant",
        )
        clinic_terms = (
            "chi nhanh",
            "phong kham",
            "clinic",
            "co so",
            "ho",
            "noi do",
            "o do",
            "tai do",
            "nay",
            "do",
        )
        return any(term in normalized_message for term in service_terms) and any(
            term in normalized_message for term in clinic_terms
        )

    @staticmethod
    def _asks_for_clinic_details(normalized_message: str) -> bool:
        detail_terms = (
            "dia chi",
            "gio lam",
            "gio mo",
            "mo cua",
            "dong cua",
            "so dien thoai",
            "lien he",
            "cho dau xe",
            "dau xe",
            "thong tin",
            "chi tiet",
        )
        clinic_terms = (
            "chi nhanh",
            "phong kham",
            "clinic",
            "co so",
            "noi do",
            "o do",
            "tai do",
            "nay",
            "do",
        )
        return any(term in normalized_message for term in detail_terms) and any(
            term in normalized_message for term in clinic_terms
        )

    async def _maybe_get_clinic_after_location_match(
        self,
        state: AgentState,
        normalized_message: str,
        tool_calls: list[str],
    ) -> TurnResult | None:
        if self.tool_registry is None or not self._asks_for_clinic_details(
            normalized_message
        ):
            return None
        clinic_candidates = state.candidates.get("clinic")
        if not isinstance(clinic_candidates, CandidateList):
            return None
        matches = [
            candidate
            for candidate in clinic_candidates.items
            if self._clinic_candidate_matches_message(candidate, normalized_message)
        ]
        if len(matches) != 1:
            return None
        selected = matches[0]
        state.slots.clinic_id = selected.id
        state.slots.clinic_label = selected.label
        tool_name = "get_clinic"
        try:
            observation = await self.tool_registry.execute(
                tool_name,
                {"clinic_id": selected.id},
            )
        except Exception as error:
            return TurnResult(
                reply=compose_backend_error_reply(str(error)),
                metadata={
                    "backend_error": str(error),
                    "tool_execution_failed": tool_name,
                    "deterministic_read": "clinic_detail_after_location_match",
                },
                tool_calls=[*tool_calls, tool_name],
            )
        state.observations.append({"tool": tool_name, "result": observation})
        result = self._handle_read_observation(state, tool_name, observation)
        if result is None:
            return None
        result.tool_calls = [*tool_calls, tool_name]
        result.metadata = {
            "deterministic_read": "clinic_detail_after_location_match",
            **result.metadata,
        }
        return result

    @staticmethod
    def _clinic_candidate_matches_message(
        candidate: Candidate,
        normalized_message: str,
    ) -> bool:
        searchable_values = [
            candidate.label,
            *(
                str(candidate.payload.get(field) or "")
                for field in (
                    "clinic_name",
                    "clinic_code",
                    "address",
                    "ward",
                    "district",
                    "city",
                )
            ),
        ]
        searchable = " ".join(_normalize_text(value) for value in searchable_values)
        if "quan 1" in normalized_message or "q1" in normalized_message:
            return "quan 1" in searchable or "q1" in searchable
        location_tokens = (
            "le loi",
            "nguyen hue",
            "tran hung dao",
            "ha noi",
            "ho chi minh",
            "hcm",
        )
        return any(token in normalized_message and token in searchable for token in location_tokens)

    @staticmethod
    def _repair_read_arguments_from_slots(
        state: AgentState,
        tool_name: str,
        arguments: dict[str, Any],
    ) -> tuple[dict[str, Any], bool]:
        repaired = False
        if tool_name in {"get_clinic", "list_clinic_services"} and state.slots.clinic_id:
            if arguments.get("clinic_id") != state.slots.clinic_id:
                arguments["clinic_id"] = state.slots.clinic_id
                repaired = True
        if tool_name == "list_specialties" and state.slots.clinic_id:
            if arguments.get("clinic_id") != state.slots.clinic_id:
                arguments["clinic_id"] = state.slots.clinic_id
                repaired = True
        if tool_name == "list_doctor_schedules":
            slot_map = {
                "clinic_id": state.slots.clinic_id,
                "doctor_id": state.slots.doctor_id,
                "specialty_id": state.slots.specialty_id,
            }
            for key, value in slot_map.items():
                if value and arguments.get(key) != value:
                    arguments[key] = value
                    repaired = True
        return arguments, repaired

    def _resolve_active_reference(self, state: AgentState, message: str) -> str | None:
        try:
            resolved = resolve_state_reference(
                message,
                state.candidates,
                goal=state.current_goal,
                slots=state.slots,
                now=utc_now(),
            )
        except ReferenceResolutionError as error:
            return str(error)
        candidate_kind = resolved.kind
        candidate = resolved.candidate
        payload = candidate.payload
        if candidate_kind == "schedule":
            shift = payload.get("shift") or {}
            state.slots.schedule_id = candidate.id
            state.slots.schedule_label = candidate.label
            state.slots.doctor_id = payload.get("doctor_id") or state.slots.doctor_id
            state.slots.doctor_label = payload.get("doctor_name") or state.slots.doctor_label
            state.slots.clinic_id = payload.get("clinic_id") or state.slots.clinic_id
            state.slots.clinic_label = payload.get("clinic_name") or state.slots.clinic_label
            state.slots.preferred_date = (
                payload.get("work_date") or payload.get("date") or state.slots.preferred_date
            )
            state.slots.preferred_time = (
                payload.get("start_time")
                or payload.get("time")
                or shift.get("start_time")
                or state.slots.preferred_time
            )
        elif candidate_kind == "appointment":
            state.slots.appointment_id = candidate.id
            state.slots.appointment_label = candidate.label
            state.slots.appointment_code = (
                payload.get("appointment_code")
                or payload.get("code")
                or state.slots.appointment_code
            )
        elif candidate_kind == "clinic":
            state.slots.clinic_id = candidate.id
            state.slots.clinic_label = candidate.label
        elif candidate_kind == "service":
            state.slots.service_id = candidate.id
            state.slots.service_label = candidate.label
        elif candidate_kind == "specialty":
            state.slots.specialty_id = candidate.id
            state.slots.specialty_label = candidate.label
        return None

    @staticmethod
    def _merge_booking_slots(
        state: AgentState,
        operation: str,
        arguments: dict[str, Any],
    ) -> dict[str, Any]:
        payload = dict(arguments)
        slot_values = {
            "clinic_id": state.slots.clinic_id,
            "doctor_id": state.slots.doctor_id,
            "specialty_id": state.slots.specialty_id,
            "service_id": state.slots.service_id,
        }
        if operation == "book_by_doctor":
            slot_values.update(
                {
                    "appointment_date": state.slots.preferred_date,
                    "appointment_time": state.slots.preferred_time,
                }
            )
        else:
            slot_values.update(
                {
                    "preferred_date": state.slots.preferred_date,
                    "preferred_time": state.slots.preferred_time,
                }
            )
        for key, value in slot_values.items():
            if value is not None:
                payload.setdefault(key, value)
        return payload

    @staticmethod
    def _remember_booking_slots(
        state: AgentState,
        operation: str,
        payload: dict[str, Any],
    ) -> None:
        state.slots.clinic_id = payload.get("clinic_id") or state.slots.clinic_id
        state.slots.doctor_id = payload.get("doctor_id") or state.slots.doctor_id
        state.slots.specialty_id = payload.get("specialty_id") or state.slots.specialty_id
        state.slots.service_id = payload.get("service_id") or state.slots.service_id
        if operation == "book_by_doctor":
            state.slots.preferred_date = (
                payload.get("appointment_date") or state.slots.preferred_date
            )
            state.slots.preferred_time = (
                payload.get("appointment_time") or state.slots.preferred_time
            )
        else:
            state.slots.preferred_date = (
                payload.get("preferred_date") or state.slots.preferred_date
            )
            state.slots.preferred_time = (
                payload.get("preferred_time") or state.slots.preferred_time
            )

    def _handle_read_observation(
        self,
        state: AgentState,
        tool_name: str,
        observation: Any,
    ) -> TurnResult | None:
        catalog = {
            "list_clinics": (
                "clinic",
                ("clinic_id", "id"),
                ("clinic_name", "name", "clinic_code"),
                "Các phòng khám tìm được:",
                "Mình chưa thấy phòng khám nào từ hệ thống.",
            ),
            "list_services": (
                "service",
                ("service_id", "id"),
                ("service_name", "name", "service_code"),
                "Các dịch vụ tìm được:",
                "Mình chưa thấy dịch vụ nào từ hệ thống.",
            ),
            "list_clinic_services": (
                "service",
                ("service_id", "id"),
                ("service_name", "name", "service_code"),
                "Các dịch vụ tại phòng khám:",
                "Mình chưa thấy dịch vụ nào tại phòng khám này.",
            ),
            "list_specialties": (
                "specialty",
                ("specialty_id", "id"),
                ("specialty_name", "name", "specialty_code"),
                "Các chuyên khoa tìm được:",
                "Mình chưa thấy chuyên khoa nào từ hệ thống.",
            ),
        }.get(tool_name)
        if catalog is not None:
            kind, id_fields, label_fields, title, empty_reply = catalog
            items = self._list_items(observation)
            candidates = self._entity_candidates(items, id_fields, label_fields)
            now = utc_now()
            state.candidates[kind] = CandidateList(
                kind=kind,
                fetched_at=now,
                presented_at=now,
                ttl_seconds=600,
                items=candidates,
            )
            metadata = {
                "candidate_list_updated": kind,
                "candidate_results_truncated": len(items) > len(candidates),
            }
            if not candidates:
                return TurnResult(reply=empty_reply, metadata=metadata)
            return TurnResult(
                reply=self._render_candidate_reply(title, candidates),
                metadata=metadata,
            )

        if tool_name == "get_clinic" and isinstance(observation, dict):
            clinic_id = observation.get("clinic_id") or observation.get("id")
            if clinic_id:
                state.slots.clinic_id = str(clinic_id)
            state.slots.clinic_label = (
                observation.get("clinic_name")
                or observation.get("name")
                or state.slots.clinic_label
            )
            return TurnResult(
                reply=self._render_clinic_detail_reply(observation),
                metadata={"clinic_detail_loaded": True},
            )

        if tool_name == "get_patient_appointments":
            appointments = self._list_items(observation)
            candidates = [
                Candidate(
                    id=item.get("appointment_id") or item.get("id"),
                    label=self._appointment_label(item),
                    payload=item,
                )
                for item in appointments
                if item.get("appointment_id") or item.get("id")
            ]
            now = utc_now()
            state.candidates["appointment"] = CandidateList(
                kind="appointment",
                fetched_at=now,
                presented_at=now,
                ttl_seconds=600,
                items=candidates[:100],
            )
            if not candidates:
                return TurnResult(
                    reply="Hiện mình chưa thấy lịch hẹn nào từ hệ thống.",
                    metadata={"candidate_list_updated": "appointment"},
                )
            return TurnResult(
                reply=self._render_candidate_reply(
                    "Các lịch hẹn sắp tới của bạn:",
                    candidates,
                ),
                metadata={"candidate_list_updated": "appointment"},
            )

        if tool_name == "list_doctor_schedules":
            schedules = self._list_items(observation)
            candidates = [
                Candidate(
                    id=item.get("schedule_id") or item.get("id"),
                    label=self._schedule_label(item),
                    payload=item,
                )
                for item in schedules
                if item.get("schedule_id") or item.get("id")
            ]
            now = utc_now()
            state.candidates["schedule"] = CandidateList(
                kind="schedule",
                fetched_at=now,
                presented_at=now,
                ttl_seconds=90,
                items=candidates[:100],
            )
            if not candidates:
                return TurnResult(
                    reply="Mình chưa thấy lịch bác sĩ phù hợp từ hệ thống.",
                    metadata={"candidate_list_updated": "schedule"},
                )
            return TurnResult(
                reply=self._render_candidate_reply(
                    "Các lịch bác sĩ tìm được:",
                    candidates,
                ),
                metadata={"candidate_list_updated": "schedule"},
            )

        if tool_name == "list_doctors_by_specialty":
            doctors = self._list_items(observation)
            candidates = self._entity_candidates(
                doctors,
                ("doctor_id", "id"),
                ("doctor_name", "full_name", "name"),
            )
            now = utc_now()
            state.candidates["doctor"] = CandidateList(
                kind="doctor",
                fetched_at=now,
                presented_at=now,
                ttl_seconds=600,
                items=candidates,
            )
            if not candidates:
                return TurnResult(
                    reply="Mình chưa thấy bác sĩ nào theo chuyên khoa này.",
                    metadata={"candidate_list_updated": "doctor"},
                )
            return TurnResult(
                reply=self._render_candidate_reply("Các bác sĩ tìm được:", candidates),
                metadata={"candidate_list_updated": "doctor"},
            )

        if tool_name == "get_doctor_leaves":
            leaves = self._list_items(observation)
            if not leaves:
                return TurnResult(
                    reply="Bác sĩ không có lịch nghỉ phép trong thời gian này.",
                    metadata={"doctor_leaves_checked": True, "leave_count": 0},
                )
            leave_dates = [
                item.get("leave_date") or item.get("date") or str(item)
                for item in leaves[:5]
            ]
            dates_str = ", ".join(str(date) for date in leave_dates if date)
            return TurnResult(
                reply=f"Bác sĩ có lịch nghỉ vào: {dates_str}. Bạn chọn ngày khác nhé.",
                metadata={"doctor_leaves_checked": True, "leave_count": len(leaves)},
            )

        if tool_name == "get_appointment_by_code" and isinstance(observation, dict):
            appointment_id = observation.get("appointment_id") or observation.get("id")
            if appointment_id:
                now = utc_now()
                state.candidates["appointment"] = CandidateList(
                    kind="appointment",
                    fetched_at=now,
                    presented_at=now,
                    ttl_seconds=600,
                    items=[
                        Candidate(
                            id=str(appointment_id),
                            label=self._appointment_label(observation),
                            payload=observation,
                        )
                    ],
                )
            return None

        if tool_name == "get_appointment_by_id" and isinstance(observation, dict):
            appointment_id = observation.get("appointment_id") or observation.get("id")
            if appointment_id:
                now = utc_now()
                state.candidates["appointment"] = CandidateList(
                    kind="appointment",
                    fetched_at=now,
                    presented_at=now,
                    ttl_seconds=600,
                    items=[
                        Candidate(
                            id=str(appointment_id),
                            label=self._appointment_label(observation),
                            payload=observation,
                        )
                    ],
                )
            return TurnResult(
                reply=self._render_appointment_detail_reply(observation),
                metadata={"appointment_detail_loaded": True},
            )

    @staticmethod
    def _list_items(observation: Any) -> list[dict[str, Any]]:
        if isinstance(observation, list):
            return [item for item in observation if isinstance(item, dict)]
        if isinstance(observation, dict) and isinstance(observation.get("data"), list):
            return [item for item in observation["data"] if isinstance(item, dict)]
        return []

    @staticmethod
    def _entity_candidates(
        items: list[dict[str, Any]],
        id_fields: tuple[str, ...],
        label_fields: tuple[str, ...],
    ) -> list[Candidate]:
        candidates: list[Candidate] = []
        for item in items[:100]:
            entity_id = next((item.get(field) for field in id_fields if item.get(field)), None)
            if entity_id is None:
                continue
            label = next((item.get(field) for field in label_fields if item.get(field)), entity_id)
            candidates.append(Candidate(id=str(entity_id), label=str(label), payload=item))
        return candidates

    @staticmethod
    def _render_candidate_reply(title: str, candidates: list[Candidate]) -> str:
        return title + "\n" + "\n".join(
            f"{index}. {candidate.label}"
            for index, candidate in enumerate(candidates, start=1)
        )

    @staticmethod
    def _render_clinic_detail_reply(item: dict[str, Any]) -> str:
        name = item.get("clinic_name") or item.get("name") or "Phòng khám"
        parts = [str(name)]
        address = item.get("address")
        if address:
            parts.append(f"Địa chỉ: {address}")
        phone = item.get("phone") or item.get("phone_number")
        if phone:
            parts.append(f"Số điện thoại: {phone}")
        operating_hours = item.get("operating_hours")
        if operating_hours:
            if isinstance(operating_hours, str):
                parts.append(f"Giờ làm việc: {operating_hours}")
            else:
                parts.append(
                    "Giờ làm việc: "
                    + json.dumps(operating_hours, ensure_ascii=False, separators=(",", ":"))
                )
        return "\n".join(parts)

    @staticmethod
    def _render_appointment_detail_reply(item: dict[str, Any]) -> str:
        code = item.get("appointment_code") or item.get("code") or ""
        date = item.get("appointment_date") or item.get("date") or ""
        time = item.get("appointment_time") or item.get("time") or ""
        status = item.get("status") or ""
        doctor = item.get("doctor_name") or ""
        clinic = item.get("clinic_name") or ""
        parts = [
            part
            for part in (
                code,
                date,
                time,
                doctor,
                clinic,
                f"({status})" if status else "",
            )
            if part
        ]
        return "Lịch hẹn: " + " | ".join(parts)

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
