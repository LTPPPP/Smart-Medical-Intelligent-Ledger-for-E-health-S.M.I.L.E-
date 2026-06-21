from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

from .schemas import DomainToolSpec, FlowName, SideEffectLevel


def core_domain_tool_specs() -> list[DomainToolSpec]:
    return [
        DomainToolSpec(
            name="get_patient_appointments",
            intent=FlowName.LOOKUP,
            phase="read",
            required_slots=["patient_id"],
            side_effect=SideEffectLevel.READ,
            requires_confirmation=False,
            idempotency_scope="none",
            timeout_seconds=5.0,
            retry_policy="retry_safe_reads_once",
            safe_error_category="backend_unavailable",
            allowed_graph_nodes=["lookup_flow"],
        ),
        DomainToolSpec(
            name="resolve_appointment_reference",
            intent=FlowName.CANCEL,
            phase="resolve",
            required_slots=["patient_id", "appointment_ref"],
            side_effect=SideEffectLevel.READ,
            requires_confirmation=False,
            idempotency_scope="none",
            timeout_seconds=5.0,
            retry_policy="retry_safe_reads_once",
            safe_error_category="not_found",
            allowed_graph_nodes=["cancel_flow", "reschedule_flow"],
        ),
        DomainToolSpec(
            name="search_booking_catalog",
            intent=FlowName.BOOKING,
            phase="discover",
            required_slots=[],
            side_effect=SideEffectLevel.READ,
            requires_confirmation=False,
            idempotency_scope="none",
            timeout_seconds=5.0,
            retry_policy="retry_safe_reads_once",
            safe_error_category="backend_unavailable",
            allowed_graph_nodes=["booking_flow"],
        ),
        DomainToolSpec(
            name="find_booking_options",
            intent=FlowName.BOOKING,
            phase="options",
            required_slots=["patient_id"],
            side_effect=SideEffectLevel.READ,
            requires_confirmation=False,
            idempotency_scope="none",
            timeout_seconds=8.0,
            retry_policy="retry_safe_reads_once",
            safe_error_category="no_availability",
            allowed_graph_nodes=["booking_flow", "reschedule_flow"],
        ),
        DomainToolSpec(
            name="prepare_booking",
            intent=FlowName.BOOKING,
            phase="prepare",
            required_slots=["patient_id", "booking_option_id"],
            side_effect=SideEffectLevel.PREPARE_MUTATION,
            requires_confirmation=True,
            idempotency_scope="session+option",
            timeout_seconds=5.0,
            retry_policy="no_retry_for_mutations",
            safe_error_category="backend_conflict",
            allowed_graph_nodes=["booking_flow"],
        ),
        DomainToolSpec(
            name="commit_booking",
            intent=FlowName.BOOKING,
            phase="commit",
            required_slots=["patient_id", "booking_option_id"],
            side_effect=SideEffectLevel.MUTATION,
            requires_confirmation=True,
            idempotency_scope="session+confirmation_token",
            timeout_seconds=8.0,
            retry_policy="no_retry_for_mutations",
            safe_error_category="backend_conflict",
            allowed_graph_nodes=["confirmation_flow"],
        ),
        DomainToolSpec(
            name="prepare_cancel",
            intent=FlowName.CANCEL,
            phase="prepare",
            required_slots=["patient_id", "appointment_id"],
            side_effect=SideEffectLevel.PREPARE_MUTATION,
            requires_confirmation=True,
            idempotency_scope="session+appointment_id",
            timeout_seconds=5.0,
            retry_policy="no_retry_for_mutations",
            safe_error_category="backend_conflict",
            allowed_graph_nodes=["cancel_flow"],
        ),
        DomainToolSpec(
            name="commit_cancel",
            intent=FlowName.CANCEL,
            phase="commit",
            required_slots=["patient_id", "appointment_id"],
            side_effect=SideEffectLevel.MUTATION,
            requires_confirmation=True,
            idempotency_scope="session+confirmation_token",
            timeout_seconds=8.0,
            retry_policy="no_retry_for_mutations",
            safe_error_category="backend_conflict",
            allowed_graph_nodes=["confirmation_flow"],
        ),
        DomainToolSpec(
            name="prepare_reschedule",
            intent=FlowName.RESCHEDULE,
            phase="prepare",
            required_slots=["patient_id", "appointment_id", "booking_option_id"],
            side_effect=SideEffectLevel.PREPARE_MUTATION,
            requires_confirmation=True,
            idempotency_scope="session+appointment_id+option",
            timeout_seconds=5.0,
            retry_policy="no_retry_for_mutations",
            safe_error_category="backend_conflict",
            allowed_graph_nodes=["reschedule_flow"],
        ),
        DomainToolSpec(
            name="commit_reschedule",
            intent=FlowName.RESCHEDULE,
            phase="commit",
            required_slots=["patient_id", "appointment_id", "booking_option_id"],
            side_effect=SideEffectLevel.MUTATION,
            requires_confirmation=True,
            idempotency_scope="session+confirmation_token",
            timeout_seconds=8.0,
            retry_policy="no_retry_for_mutations",
            safe_error_category="backend_conflict",
            allowed_graph_nodes=["confirmation_flow"],
        ),
    ]


class DomainTools(Protocol):
    mutations: list[str]

    async def get_patient_appointments(self, patient_id: str) -> list[dict[str, Any]]: ...

    async def resolve_appointment_reference(self, patient_id: str, appointment_ref: str) -> dict[str, Any] | None: ...

    async def search_booking_catalog(self, slots: dict[str, Any]) -> dict[str, Any]: ...

    async def find_booking_options(self, patient_id: str, slots: dict[str, Any]) -> list[dict[str, Any]]: ...

    async def commit_booking(self, patient_id: str, booking_option_id: str, idempotency_key: str) -> dict[str, Any]: ...

    async def commit_cancel(self, patient_id: str, appointment_id: str, idempotency_key: str) -> dict[str, Any]: ...

    async def commit_reschedule(
        self,
        patient_id: str,
        appointment_id: str,
        booking_option_id: str,
        idempotency_key: str,
    ) -> dict[str, Any]: ...


@dataclass
class InMemoryDomainTools:
    appointments: dict[str, list[dict[str, Any]]] = field(default_factory=dict)
    mutations: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not self.appointments:
            self.appointments = {
                "patient-1": [
                    {
                        "id": "appt-001",
                        "code": "APT-001",
                        "status": "scheduled",
                        "summary": "Dental cleaning, tomorrow at 09:00.",
                    }
                ]
            }

    async def get_patient_appointments(self, patient_id: str) -> list[dict[str, Any]]:
        return list(self.appointments.get(patient_id, []))

    async def resolve_appointment_reference(self, patient_id: str, appointment_ref: str) -> dict[str, Any] | None:
        normalized = appointment_ref.lower()
        for appointment in self.appointments.get(patient_id, []):
            if appointment["id"].lower() == normalized or appointment["code"].lower() == normalized:
                return appointment
        return None

    async def search_booking_catalog(self, slots: dict[str, Any]) -> dict[str, Any]:
        return {
            "clinics": [{"id": "clinic-downtown", "label": "Downtown Clinic"}],
            "services": [{"id": "service-cleaning", "label": "Dental cleaning"}],
        }

    async def find_booking_options(self, patient_id: str, slots: dict[str, Any]) -> list[dict[str, Any]]:
        return [
            {
                "id": "option-001",
                "clinic_id": "clinic-downtown",
                "doctor_id": "doctor-001",
                "summary": "Downtown Clinic, Friday at 14:00 with Dr. Smith.",
            }
        ]

    async def commit_booking(self, patient_id: str, booking_option_id: str, idempotency_key: str) -> dict[str, Any]:
        self.mutations.append(f"commit_booking:{booking_option_id}")
        return {"status": "booked", "appointment_id": "appt-new", "idempotency_key": idempotency_key}

    async def commit_cancel(self, patient_id: str, appointment_id: str, idempotency_key: str) -> dict[str, Any]:
        self.mutations.append(f"commit_cancel:{appointment_id}")
        return {"status": "cancelled", "appointment_id": appointment_id, "idempotency_key": idempotency_key}

    async def commit_reschedule(
        self,
        patient_id: str,
        appointment_id: str,
        booking_option_id: str,
        idempotency_key: str,
    ) -> dict[str, Any]:
        self.mutations.append(f"commit_reschedule:{appointment_id}:{booking_option_id}")
        return {
            "status": "rescheduled",
            "appointment_id": appointment_id,
            "booking_option_id": booking_option_id,
            "idempotency_key": idempotency_key,
        }
