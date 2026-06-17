"""ActionDispatcher: deterministic phase 2 of the two-phase pipeline."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from .slot_extractor import ExtractedSlots
from .state import AgentState


@dataclass
class ToolCall:
    name: str
    arguments: dict[str, Any]


@dataclass
class DispatchPlan:
    """Ordered groups of tool calls. Each group runs in parallel."""

    groups: list[list[ToolCall]] = field(default_factory=list)
    requires_patient: bool = False
    clarification_needed: str | None = None

    def is_empty(self) -> bool:
        return not self.groups and not self.clarification_needed


def build_dispatch_plan(slots: ExtractedSlots, state: AgentState) -> DispatchPlan:
    if slots.needs_clarification:
        return DispatchPlan(
            clarification_needed="Mình chưa rõ bạn muốn làm gì. Bạn nói rõ hơn giúp mình nhé."
        )

    plan = DispatchPlan()

    if slots.intent == "book":
        plan.requires_patient = True
        if not state.slots.schedule_id:
            parallel_reads: list[ToolCall] = []
            if not state.slots.clinic_id and not slots.clinic_hint:
                parallel_reads.append(ToolCall("list_clinics", {}))
            if not state.slots.specialty_id and slots.specialty:
                args = {"clinic_id": state.slots.clinic_id} if state.slots.clinic_id else {}
                parallel_reads.append(ToolCall("list_specialties", args))
            if state.slots.specialty_id or state.slots.doctor_id:
                sched_args: dict[str, Any] = {}
                if state.slots.clinic_id:
                    sched_args["clinic_id"] = state.slots.clinic_id
                if state.slots.specialty_id:
                    sched_args["specialty_id"] = state.slots.specialty_id
                if state.slots.doctor_id:
                    sched_args["doctor_id"] = state.slots.doctor_id
                if state.slots.preferred_date:
                    sched_args["work_date"] = state.slots.preferred_date
                parallel_reads.append(ToolCall("list_doctor_schedules", sched_args))
            if parallel_reads:
                plan.groups.append(parallel_reads)

    elif slots.intent == "cancel":
        plan.requires_patient = True
        appointment_ref_tool = _appointment_ref_lookup(slots)
        if not state.patient_id:
            plan.clarification_needed = "Bạn cần đăng nhập để mình có thể xem lịch hẹn."
        elif appointment_ref_tool and not state.slots.appointment_id:
            plan.groups.append([appointment_ref_tool])
        elif not state.slots.appointment_code and not state.slots.appointment_id:
            plan.groups.append(
                [ToolCall("get_patient_appointments", {"patient_id": state.patient_id})]
            )
        elif state.slots.appointment_code and not state.slots.appointment_id:
            plan.groups.append(
                [ToolCall("get_appointment_by_code", {"code": state.slots.appointment_code})]
            )

    elif slots.intent == "reschedule":
        plan.requires_patient = True
        appointment_ref_tool = _appointment_ref_lookup(slots)
        if not state.patient_id:
            plan.clarification_needed = "Bạn cần đăng nhập để mình có thể đổi lịch hẹn."
        elif appointment_ref_tool and not state.slots.appointment_id:
            plan.groups.append([appointment_ref_tool])
        elif not state.slots.appointment_id:
            plan.groups.append(
                [ToolCall("get_patient_appointments", {"patient_id": state.patient_id})]
            )

    elif slots.intent == "lookup":
        plan.requires_patient = True
        if state.patient_id:
            plan.groups.append(
                [ToolCall("get_patient_appointments", {"patient_id": state.patient_id})]
            )
        else:
            plan.clarification_needed = "Bạn cần đăng nhập để mình có thể xem lịch hẹn."

    elif slots.intent == "info":
        parallel_reads: list[ToolCall] = []
        if slots.clinic_hint and not state.slots.clinic_id:
            parallel_reads.append(ToolCall("list_clinics", {}))
        if slots.specialty and not state.slots.specialty_id:
            parallel_reads.append(ToolCall("list_specialties", {}))
        if parallel_reads:
            plan.groups.append(parallel_reads)

    elif slots.intent == "reminder":
        plan.requires_patient = True
        appointment_ref_tool = _appointment_ref_lookup(slots)
        if state.slots.appointment_id:
            plan.groups.append(
                [ToolCall("send_reminder", {"appointment_id": state.slots.appointment_id})]
            )
        elif appointment_ref_tool:
            plan.groups.append([appointment_ref_tool])
        else:
            plan.clarification_needed = (
                "Mình cần biết lịch hẹn nào để gửi nhắc. Bạn cho mình biết nhé."
            )

    return plan


def _appointment_ref_lookup(slots: ExtractedSlots) -> ToolCall | None:
    ref = (slots.appointment_ref or "").strip()
    if not ref:
        return None
    try:
        UUID(ref)
    except ValueError:
        return ToolCall("get_appointment_by_code", {"code": ref})
    return ToolCall("get_appointment_by_id", {"appointment_id": ref})
