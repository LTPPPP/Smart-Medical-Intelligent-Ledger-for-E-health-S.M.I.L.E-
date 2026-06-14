from __future__ import annotations

from dataclasses import dataclass, field
from datetime import timedelta
from typing import Any
from uuid import uuid4

from .composer import compose_missing_detail_reply, compose_mutation_success
from .guards import ConfirmationDecision, detect_confirmation
from .planner import PlannerAction
from .state import AgentState, PendingConfirmation, utc_now


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
        confirmation = detect_confirmation(message)
        if state.pending_confirmation is not None and confirmation == ConfirmationDecision.CONFIRMED:
            pending = state.pending_confirmation
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
                        reply=(
                            "Khung giờ này không còn khả dụng. Mình có thể tìm lại "
                            "lịch mới cho bạn."
                        ),
                        metadata={
                            "mutation_committed": False,
                            "backend_conflict": True,
                        },
                    )
                return TurnResult(
                    reply="Hệ thống chưa xử lý được thao tác này. Bạn thử lại sau nhé.",
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
                continue
            if action.kind == "parse_failed":
                return TurnResult(
                    reply="Mình chưa hiểu rõ yêu cầu. Bạn nói lại ngắn gọn giúp mình nhé.",
                    metadata={"parse_status": "PARSE_FAILED"},
                    tool_calls=tool_calls,
                )
            if action.kind == "answer":
                return TurnResult(reply=action.answer or compose_missing_detail_reply())

        return TurnResult(
            reply=compose_missing_detail_reply(),
            metadata={"stop_reason": "step_budget_exhausted"},
            tool_calls=tool_calls,
        )
