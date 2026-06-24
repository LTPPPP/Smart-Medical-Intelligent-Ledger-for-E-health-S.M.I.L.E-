from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Literal

from .tool_errors import AmbiguousReferenceError
from .tools import InMemoryDomainTools


FaultOutcome = Literal["timeout", "conflict", "permanent_error", "empty", "malformed", "ambiguous"]


@dataclass(frozen=True)
class FaultRule:
    method: str
    occurrence: int = 1
    outcome: FaultOutcome = "timeout"


@dataclass(frozen=True)
class ToolCallRecord:
    method: str
    occurrence: int
    arguments: dict[str, Any]
    outcome: str
    latency_ms: float


class FaultInjectingDomainTools:
    def __init__(
        self,
        *,
        faults: list[FaultRule] | None = None,
        delegate: InMemoryDomainTools | None = None,
        booking_options_by_date: dict[str, list[dict[str, Any]]] | None = None,
        booking_options_by_slots: list[dict[str, Any]] | None = None,
    ) -> None:
        self.delegate = delegate or InMemoryDomainTools()
        self.faults = faults or []
        self.calls: list[ToolCallRecord] = []
        self._occurrences: dict[str, int] = {}
        self._idempotency_cache: dict[tuple[str, str], dict[str, Any]] = {}
        self.booking_options_by_date = booking_options_by_date or {}
        self.booking_options_by_slots = booking_options_by_slots or []

    @property
    def mutations(self) -> list[str]:
        return self.delegate.mutations

    async def resolve_patient_id_by_user_id(self, user_id: str) -> str | None:
        return await self._call(
            "resolve_patient_id_by_user_id",
            {"user_id": user_id},
            lambda: self.delegate.resolve_patient_id_by_user_id(user_id),
        )

    async def get_patient_appointments(
        self,
        patient_id: str,
        auth_user_id: str | None = None,
    ) -> list[dict[str, Any]]:
        return await self._call(
            "get_patient_appointments",
            {"patient_id": patient_id},
            lambda: self.delegate.get_patient_appointments(patient_id, auth_user_id),
        )

    async def resolve_appointment_reference(self, patient_id: str, appointment_ref: str) -> dict[str, Any] | None:
        return await self._call(
            "resolve_appointment_reference",
            {"patient_id": patient_id, "appointment_ref": appointment_ref},
            lambda: self.delegate.resolve_appointment_reference(patient_id, appointment_ref),
        )

    async def search_booking_catalog(self, slots: dict[str, Any]) -> dict[str, Any]:
        return await self._call(
            "search_booking_catalog",
            {"slots": _sanitize(slots)},
            lambda: self.delegate.search_booking_catalog(slots),
        )

    async def find_booking_options(self, patient_id: str, slots: dict[str, Any]) -> list[dict[str, Any]]:
        date_hint = slots.get("date_hint")
        return await self._call(
            "find_booking_options",
            {"patient_id": patient_id, "slots": _sanitize(slots)},
            lambda: self._find_booking_options(patient_id, slots, date_hint),
        )

    async def _find_booking_options(
        self,
        patient_id: str,
        slots: dict[str, Any],
        date_hint: Any,
    ) -> list[dict[str, Any]]:
        for rule in self.booking_options_by_slots:
            match_slots = rule.get("match_slots", {})
            if all(slots.get(key) == value for key, value in match_slots.items()):
                return [dict(option) for option in rule.get("options", [])]
        if isinstance(date_hint, str) and date_hint in self.booking_options_by_date:
            return [dict(option) for option in self.booking_options_by_date[date_hint]]
        return await self.delegate.find_booking_options(patient_id, slots)

    async def commit_booking(
        self,
        patient_id: str,
        booking_option_id: str,
        idempotency_key: str,
        auth_user_id: str | None = None,
        booking_draft=None,
    ) -> dict[str, Any]:
        return await self._idempotent_mutation(
            "commit_booking",
            idempotency_key,
            {"patient_id": patient_id, "booking_option_id": booking_option_id, "idempotency_key": idempotency_key},
            lambda: self.delegate.commit_booking(
                patient_id,
                booking_option_id,
                idempotency_key,
                auth_user_id,
                booking_draft=booking_draft,
            ),
        )

    async def commit_cancel(
        self, patient_id: str, appointment_id: str, idempotency_key: str, auth_user_id: str | None = None
    ) -> dict[str, Any]:
        return await self._idempotent_mutation(
            "commit_cancel",
            idempotency_key,
            {"patient_id": patient_id, "appointment_id": appointment_id, "idempotency_key": idempotency_key},
            lambda: self.delegate.commit_cancel(patient_id, appointment_id, idempotency_key, auth_user_id),
        )

    async def commit_reschedule(
        self,
        patient_id: str,
        appointment_id: str,
        booking_option_id: str,
        idempotency_key: str,
        auth_user_id: str | None = None,
    ) -> dict[str, Any]:
        return await self._idempotent_mutation(
            "commit_reschedule",
            idempotency_key,
            {
                "patient_id": patient_id,
                "appointment_id": appointment_id,
                "booking_option_id": booking_option_id,
                "idempotency_key": idempotency_key,
            },
            lambda: self.delegate.commit_reschedule(
                patient_id, appointment_id, booking_option_id, idempotency_key, auth_user_id
            ),
        )

    async def _idempotent_mutation(
        self,
        method: str,
        idempotency_key: str,
        arguments: dict[str, Any],
        delegate_call,
    ) -> dict[str, Any]:
        cache_key = (method, idempotency_key)
        if cache_key in self._idempotency_cache:
            return await self._record_only(method, arguments, "idempotent_replay", self._idempotency_cache[cache_key])
        result = await self._call(method, arguments, delegate_call)
        self._idempotency_cache[cache_key] = result
        return result

    async def _record_only(
        self,
        method: str,
        arguments: dict[str, Any],
        outcome: str,
        result: dict[str, Any],
    ) -> dict[str, Any]:
        occurrence = self._increment(method)
        started = time.perf_counter()
        self.calls.append(
            ToolCallRecord(
                method=method,
                occurrence=occurrence,
                arguments=_sanitize(arguments),
                outcome=outcome,
                latency_ms=round((time.perf_counter() - started) * 1000, 2),
            )
        )
        return result

    async def _call(self, method: str, arguments: dict[str, Any], delegate_call):
        occurrence = self._increment(method)
        started = time.perf_counter()
        outcome = self._fault_for(method, occurrence)
        try:
            if outcome:
                result = self._fault_result(outcome)
            else:
                result = await delegate_call()
                outcome = "success"
            return result
        except Exception:
            raise
        finally:
            self.calls.append(
                ToolCallRecord(
                    method=method,
                    occurrence=occurrence,
                    arguments=_sanitize(arguments),
                    outcome=outcome or "success",
                    latency_ms=round((time.perf_counter() - started) * 1000, 2),
                )
            )

    def _increment(self, method: str) -> int:
        occurrence = self._occurrences.get(method, 0) + 1
        self._occurrences[method] = occurrence
        return occurrence

    def _fault_for(self, method: str, occurrence: int) -> FaultOutcome | None:
        for rule in self.faults:
            if rule.method == method and rule.occurrence == occurrence:
                return rule.outcome
        return None

    @staticmethod
    def _fault_result(outcome: FaultOutcome):
        if outcome == "timeout":
            raise TimeoutError("scripted timeout")
        if outcome == "conflict":
            raise RuntimeError("scripted conflict")
        if outcome == "permanent_error":
            raise RuntimeError("scripted permanent error")
        if outcome == "empty":
            return []
        if outcome == "malformed":
            return [{"malformed": True}]
        if outcome == "ambiguous":
            raise AmbiguousReferenceError("scripted ambiguous reference")
        raise RuntimeError(f"unknown scripted fault {outcome}")


def _sanitize(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _sanitize(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_sanitize(item) for item in value]
    return value
