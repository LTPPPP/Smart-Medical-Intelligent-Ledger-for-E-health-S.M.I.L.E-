from typing import Any

import httpx
from pydantic import ValidationError

from src.agent.tool_router import HIGH_RISK_KEYWORDS
from src.knowledge.static import (
    estimate_service_duration,
    get_clinic_info,
    get_services,
    search_clinic_knowledge,
)
from src.tools.schemas import TOOL_SCHEMAS, ToolOutput


class ClinicalEmrToolClient:
    def __init__(
        self,
        base_url: str,
        api_prefix: str = "/api/v1",
        internal_token: str | None = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_prefix = "/" + api_prefix.strip("/")
        self.internal_token = internal_token
        self.client = httpx.Client(timeout=30.0)

    def request(
        self,
        method: str,
        path: str,
        json: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        headers = {}
        if self.internal_token:
            headers["x-internal-token"] = self.internal_token
        normalized_path = "/" + path.lstrip("/")
        response = self.client.request(
            method,
            f"{self.base_url}{self.api_prefix}{normalized_path}",
            json=json,
            params=params,
            headers=headers,
        )
        response.raise_for_status()
        return response.json()


class ToolExecutor:
    def __init__(self, clinical_client: ClinicalEmrToolClient | None = None):
        self.clinical_client = clinical_client

    def execute(self, tool_name: str, arguments: dict[str, Any]) -> ToolOutput:
        schema = TOOL_SCHEMAS.get(tool_name)
        if not schema:
            return ToolOutput(
                success=False,
                error_code="TOOL_NOT_FOUND",
                message=f"Tool {tool_name} is not registered.",
            )
        try:
            data = schema(**arguments)
        except ValidationError as exc:
            return ToolOutput(
                success=False,
                error_code="VALIDATION_ERROR",
                message="Tool arguments failed validation.",
                details={"errors": exc.errors()},
            )

        if tool_name == "get_clinic_info":
            return ToolOutput(success=True, data=get_clinic_info())
        if tool_name == "search_clinic_knowledge":
            return ToolOutput(
                success=True,
                data=search_clinic_knowledge(data.query),  # type: ignore[attr-defined]
            )
        if tool_name == "get_services":
            return ToolOutput(success=True, data=get_services())
        if tool_name == "estimate_service_duration":
            return ToolOutput(
                success=True,
                data=estimate_service_duration(data.service_id),  # type: ignore[attr-defined]
            )
        if tool_name == "classify_medical_risk":
            return self._classify_medical_risk(data.message)  # type: ignore[attr-defined]
        if tool_name == "summarize_for_dentist":
            return self._summarize_for_dentist(data.message)  # type: ignore[attr-defined]

        if not self.clinical_client:
            return ToolOutput(
                success=False,
                error_code="CLINICAL_CLIENT_NOT_CONFIGURED",
                message="Clinical EMR tool client is not configured.",
            )
        return ToolOutput(success=True, data=self._execute_clinical_tool(tool_name, data))

    def _execute_clinical_tool(self, tool_name: str, data: Any) -> dict[str, Any]:
        payload = data.model_dump(mode="json")
        if tool_name == "get_available_slots":
            return self.clinical_client.request("GET", "/slots", params=payload)
        if tool_name == "hold_slot":
            slot_id = payload.pop("slot_id")
            return self.clinical_client.request(
                "POST", f"/slots/{slot_id}/hold", json=payload
            )
        if tool_name == "confirm_booking":
            return self.clinical_client.request("POST", "/bookings/confirm", json=payload)
        if tool_name == "release_hold":
            return self.clinical_client.request("POST", "/holds/release", json=payload)
        if tool_name == "cancel_appointment":
            appointment_id = payload.pop("appointment_id")
            return self.clinical_client.request(
                "POST", f"/appointments/{appointment_id}/cancel", json=payload
            )
        if tool_name == "reschedule_appointment":
            appointment_id = payload.pop("appointment_id")
            return self.clinical_client.request(
                "POST", f"/appointments/{appointment_id}/reschedule", json=payload
            )
        if tool_name == "add_to_waitlist":
            return self.clinical_client.request("POST", "/waitlist", json=payload)
        if tool_name == "check_waitlist_matches":
            return self.clinical_client.request(
                "GET", f"/waitlist/matches/{payload['slot_id']}"
            )
        if tool_name == "send_email_notification":
            return self.clinical_client.request(
                "POST", "/agent/email-notifications", json=payload
            )
        if tool_name == "create_handoff_ticket":
            return self.clinical_client.request(
                "POST", "/agent/handoff-tickets", json=payload
            )
        raise ValueError(f"Unhandled clinical tool {tool_name}")

    def _classify_medical_risk(self, message: str) -> ToolOutput:
        lowered = message.lower()
        matched = [keyword for keyword in HIGH_RISK_KEYWORDS if keyword in lowered]
        return ToolOutput(
            success=True,
            data={
                "risk_level": "HIGH" if matched else "LOW",
                "matched_keywords": matched,
            },
        )

    def _summarize_for_dentist(self, message: str) -> ToolOutput:
        risk = self._classify_medical_risk(message)
        matched = ", ".join(risk.data["matched_keywords"]) if risk.data else "none"
        return ToolOutput(
            success=True,
            data={
                "summary": (
                    f"Patient reported: {message}. High-risk keyword matches: {matched}."
                ),
                "safety_note": "This is not a diagnosis and requires clinician review.",
            },
        )
