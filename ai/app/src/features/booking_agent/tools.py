"""Booking agent LangChain tools."""

from __future__ import annotations

import logging
from typing import Any

import httpx
from langchain_core.tools import StructuredTool

from ...shared.auth_context import ActorContext
from ...shared.backend_clients import clinical_emr_client
from ...shared.vectorstore import search_similar_chunks
from .state import BookingSlotState

logger = logging.getLogger(__name__)


def _not_confirmed_error() -> dict[str, Any]:
    return {
        "error": "not_confirmed",
        "message": "Cannot book yet — the patient has not confirmed the details.",
    }


def _no_patient_error() -> dict[str, Any]:
    return {
        "error": "no_patient",
        "message": "No patient profile resolved yet — call create_guest_patient first "
        "(guest) or wait for the logged-in patient's profile to resolve.",
    }


def _http_error(exc: httpx.HTTPStatusError) -> dict[str, Any]:
    # Log real backend error
    logger.warning(
        "Backend call failed: %s %s -> %s %s",
        exc.request.method,
        exc.request.url,
        exc.response.status_code,
        exc.response.text,
    )
    return {
        "error": "backend_error",
        "status": exc.response.status_code,
        "message": exc.response.text,
    }


def _flatten_availability(raw: dict[str, Any]) -> list[dict[str, Any]]:
    """Flatten availability response."""
    service_name = (raw.get("service") or {}).get("name")
    options: list[dict[str, Any]] = []
    for date_group in raw.get("dates", []):
        date = date_group.get("date")
        for doctor_group in date_group.get("doctors", []):
            room = doctor_group.get("room") or {}
            for slot in doctor_group.get("slots", []):
                options.append(
                    {
                        "id": slot.get("option_token"),
                        "appointment_date": date,
                        "appointment_time": slot.get("start_time"),
                        "doctor_name": doctor_group.get("doctor_id"),
                        "clinic_name": doctor_group.get("clinic_id"),
                        "room_name": room.get("room_name"),
                        "service_name": service_name,
                        "status": slot.get("status"),
                    }
                )
    return options


def _flatten_appointment(a: dict[str, Any]) -> dict[str, Any]:
    """Flatten appointment response."""
    service = a.get("service") or {}
    clinic = a.get("clinic") or {}
    room = a.get("room") or {}
    return {
        "id": a.get("appointment_id"),
        "appointment_code": a.get("appointment_code"),
        "appointment_date": a.get("appointment_date"),
        "appointment_time": a.get("appointment_time"),
        "duration_minutes": a.get("duration_minutes"),
        "status": a.get("status"),
        "service_name": service.get("service_name") or service.get("name"),
        "clinic_name": clinic.get("clinic_name") or clinic.get("name"),
        "room_name": room.get("room_name"),
    }


def build_tools(
    actor: ActorContext, state: BookingSlotState
) -> tuple[list[StructuredTool], dict[str, Any]]:
    """Build agent tools."""
    token = actor.token
    captured: dict[str, Any] = {}

    async def search_policy_documents(query: str) -> Any:
        """Search the clinic's policy knowledge base (opening hours, branch
        addresses, whether booking ahead is required, etc — "Loại 1"
        questions). Do NOT use this for pricing, warranty, or "can you treat
        my case" questions ("Loại 2") — those must be redirected to the
        clinic admin contact, never answered from retrieved documents."""
        return search_similar_chunks(query, limit=5)

    async def search_clinics(
        city: str | None = None,
        district: str | None = None,
        clinic_name: str | None = None,
    ) -> Any:
        """Look up clinic branches by city/district/name. Use this whenever
        the patient only knows a general area (e.g. "TP Hồ Chí Minh") rather
        than the exact clinic name — list matching branches for them to pick
        from instead of asking them to already know the exact clinic name."""
        try:
            result = await clinical_emr_client.list_clinics(
                token, city=city, district=district, clinic_name=clinic_name, limit=20
            )
        except httpx.HTTPStatusError as exc:
            return _http_error(exc)
        matches = [
            {
                "clinic_id": c.get("clinic_id"),
                "clinic_name": c.get("clinic_name"),
                "address": c.get("address"),
                "district": c.get("district"),
                "city": c.get("city"),
            }
            for c in result.get("data", [])
        ]
        # Resolve unambiguous match
        if len(matches) == 1:
            captured["resolved_clinic_id"] = matches[0]["clinic_id"]
            captured["resolved_clinic_name"] = matches[0]["clinic_name"]
        elif len(matches) > 1:
            # Surface pickable options
            captured["clinic_options"] = matches
        return matches

    async def search_services(
        service_name: str | None = None, specialty_id: str | None = None
    ) -> Any:
        """Look up medical services (needed to get a service_id for
        check_doctor_availability) by name or specialty. Use this to resolve
        the patient's chief complaint (e.g. "đau răng") into a service_id —
        never ask the patient to already know a service code."""
        try:
            result = await clinical_emr_client.list_services(
                token, service_name=service_name, specialty_id=specialty_id, limit=20
            )
        except httpx.HTTPStatusError as exc:
            return _http_error(exc)
        matches = [
            {
                "service_id": s.get("service_id"),
                "service_name": s.get("service_name"),
                "duration_minutes": s.get("duration_minutes"),
            }
            for s in result.get("data", [])
        ]
        if len(matches) == 1:
            captured["resolved_service_id"] = matches[0]["service_id"]
            captured["resolved_service_name"] = matches[0]["service_name"]
        return matches

    async def check_doctor_availability(
        service_id: str,
        date_from: str,
        date_to: str,
        clinic_id: str | None = None,
        doctor_id: str | None = None,
    ) -> Any:
        """Look up open appointment slots. Read-only — safe to call anytime."""
        if not state.patient_id:
            return _no_patient_error()
        try:
            raw = await clinical_emr_client.find_availability(
                token,
                patient_id=state.patient_id,
                service_id=service_id,
                date_from=date_from,
                date_to=date_to,
                clinic_id=clinic_id,
                doctor_id=doctor_id,
            )
        except httpx.HTTPStatusError as exc:
            return _http_error(exc)
        options = _flatten_availability(raw)
        captured["booking_options"] = options
        return options

    async def book_selected_option(option_token: str) -> Any:
        """Book the exact slot the patient picked from the availability list
        (option_token comes from check_doctor_availability's results) — safer
        than re-specifying date/time/doctor by hand since it's a signed,
        already-validated slot. Only call after the patient has explicitly
        confirmed the booking summary."""
        if not state.confirmed:
            return _not_confirmed_error()
        if not state.patient_id:
            return _no_patient_error()
        try:
            return await clinical_emr_client.create_appointment_by_option(
                token,
                patient_id=state.patient_id,
                option_token=option_token,
                created_by=actor.account_id,
            )
        except httpx.HTTPStatusError as exc:
            return _http_error(exc)

    async def create_guest_patient(full_name: str, phone: str) -> Any:
        """Create a patient profile — for a walk-in guest (using the bot's
        RECEPTIONIST token), or for a logged-in account that doesn't have a
        linked patient record yet (their signed-in account itself isn't a
        patient profile — this links one to it). Call this whenever
        "Booking state so far" has no patient_id, regardless of guest or
        logged-in status. Only call it once — if patient_id is already set,
        reuse it instead (calling this again would create a duplicate
        profile)."""
        try:
            if actor.is_guest:
                created = await clinical_emr_client.create_patient(
                    token, full_name=full_name, phone=phone
                )
            else:
                # Self-service endpoint
                created = await clinical_emr_client.create_my_patient(
                    token, full_name=full_name, phone=phone
                )
        except httpx.HTTPStatusError as exc:
            return _http_error(exc)
        # Update state immediately
        state.patient_id = created.get("patient_id")
        captured["resolved_patient_id"] = state.patient_id
        return created

    async def book_by_clinic(
        clinic_id: str,
        appointment_date: str,
        appointment_time: str,
        chief_complaint: str | None = None,
        duration_minutes: int | None = None,
    ) -> Any:
        """Book an appointment by clinic only (loại 1: theo phòng khám) — the
        clinic auto-assigns an available doctor. Only call after the patient
        has explicitly confirmed the booking summary."""
        if not state.confirmed:
            return _not_confirmed_error()
        if not state.patient_id:
            return _no_patient_error()
        try:
            return await clinical_emr_client.create_appointment_by_clinic(
                token,
                patient_id=state.patient_id,
                clinic_id=clinic_id,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                chief_complaint=chief_complaint,
                duration_minutes=duration_minutes,
                created_by=actor.account_id,
            )
        except httpx.HTTPStatusError as exc:
            return _http_error(exc)

    async def book_by_specialty(
        specialty_id: str,
        clinic_id: str,
        preferred_date: str | None = None,
        preferred_time: str | None = None,
        chief_complaint: str | None = None,
    ) -> Any:
        """Book an appointment by specialty (loại 2: theo chuyên khoa) —
        auto-assigns an available doctor in that specialty. Only call after
        the patient has explicitly confirmed the booking summary."""
        if not state.confirmed:
            return _not_confirmed_error()
        if not state.patient_id:
            return _no_patient_error()
        try:
            return await clinical_emr_client.create_appointment_by_specialty(
                token,
                patient_id=state.patient_id,
                specialty_id=specialty_id,
                clinic_id=clinic_id,
                preferred_date=preferred_date,
                preferred_time=preferred_time,
                chief_complaint=chief_complaint,
                created_by=actor.account_id,
            )
        except httpx.HTTPStatusError as exc:
            return _http_error(exc)

    async def book_by_doctor(
        doctor_id: str,
        clinic_id: str,
        appointment_date: str,
        appointment_time: str,
        chief_complaint: str | None = None,
    ) -> Any:
        """Book an appointment with a specific doctor (loại 3: theo bác sĩ).
        Only call after the patient has explicitly confirmed the booking
        summary, and after any doctor-name ambiguity has been resolved by
        asking the patient (never guess between two same-named doctors)."""
        if not state.confirmed:
            return _not_confirmed_error()
        if not state.patient_id:
            return _no_patient_error()
        try:
            return await clinical_emr_client.create_appointment_by_doctor(
                token,
                patient_id=state.patient_id,
                doctor_id=doctor_id,
                clinic_id=clinic_id,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                chief_complaint=chief_complaint,
                created_by=actor.account_id,
            )
        except httpx.HTTPStatusError as exc:
            return _http_error(exc)

    async def book_outside_hours(
        clinic_id: str,
        appointment_date: str,
        appointment_time: str,
        outside_hours_reason: str,
        doctor_id: str | None = None,
        specialty_id: str | None = None,
        chief_complaint: str | None = None,
    ) -> Any:
        """Book an appointment outside regular working hours (loại 4: ngoài
        giờ). Only call after the patient has explicitly confirmed the
        booking summary."""
        if not state.confirmed:
            return _not_confirmed_error()
        if not state.patient_id:
            return _no_patient_error()
        try:
            return await clinical_emr_client.create_appointment_outside_hours(
                token,
                patient_id=state.patient_id,
                clinic_id=clinic_id,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                outside_hours_reason=outside_hours_reason,
                doctor_id=doctor_id,
                specialty_id=specialty_id,
                chief_complaint=chief_complaint,
                created_by=actor.account_id,
            )
        except httpx.HTTPStatusError as exc:
            return _http_error(exc)

    async def list_my_upcoming_appointments() -> Any:
        """List a logged-in patient's upcoming appointments, to help them
        pick which one to cancel. Only usable when the patient is logged
        in — guests have no patient_id to look this up with."""
        if not state.patient_id:
            return _no_patient_error()
        try:
            appointments = await clinical_emr_client.list_patient_appointments(
                token, state.patient_id
            )
        except httpx.HTTPStatusError as exc:
            return _http_error(exc)
        active = [a for a in appointments if a.get("status") not in ("cancelled", "completed")]
        flattened = [_flatten_appointment(a) for a in active]
        captured["appointments"] = flattened
        return flattened

    async def find_appointment_for_guest_cancel(code: str, phone: str) -> Any:
        """Guest cancellation flow: look up an appointment by its code, then
        the caller must independently confirm the phone number matches
        before cancel_appointment is ever invoked (two-factor: code + phone,
        per Research/booking-agent.md, Feature 2)."""
        try:
            appointment = await clinical_emr_client.find_appointment_by_code(token, code)
        except httpx.HTTPStatusError as exc:
            return _http_error(exc)
        if not appointment:
            return {"error": "not_found", "message": f"No appointment with code {code}"}
        patient_phone = (appointment.get("patient") or {}).get("phone")
        if not patient_phone or patient_phone != phone:
            return {"error": "phone_mismatch", "message": "Phone number does not match this appointment."}
        return appointment

    async def cancel_appointment(appointment_id: str, cancellation_reason: str | None = None) -> Any:
        """Cancel an appointment. For a logged-in patient this may be called
        once they've picked the appointment from list_my_upcoming_appointments
        and confirmed. For a guest, only call after
        find_appointment_for_guest_cancel has verified the phone number."""
        if not state.confirmed:
            return _not_confirmed_error()
        try:
            return await clinical_emr_client.cancel_appointment(
                token,
                appointment_id,
                cancelled_by=actor.account_id,
                cancellation_reason=cancellation_reason,
            )
        except httpx.HTTPStatusError as exc:
            return _http_error(exc)

    tools = [
        StructuredTool.from_function(coroutine=search_policy_documents),
        StructuredTool.from_function(coroutine=search_clinics),
        StructuredTool.from_function(coroutine=search_services),
        StructuredTool.from_function(coroutine=check_doctor_availability),
        StructuredTool.from_function(coroutine=create_guest_patient),
        StructuredTool.from_function(coroutine=book_by_clinic),
        StructuredTool.from_function(coroutine=book_by_specialty),
        StructuredTool.from_function(coroutine=book_by_doctor),
        StructuredTool.from_function(coroutine=book_outside_hours),
        StructuredTool.from_function(coroutine=book_selected_option),
        StructuredTool.from_function(coroutine=list_my_upcoming_appointments),
        StructuredTool.from_function(coroutine=find_appointment_for_guest_cancel),
        StructuredTool.from_function(coroutine=cancel_appointment),
    ]
    return tools, captured
