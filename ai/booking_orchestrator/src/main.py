from fastapi import FastAPI

from src.agent.tool_router import ToolProfile, ToolProfileSelector
from src.config import get_settings
from src.knowledge.static import get_services
from src.schemas.chat import ChatRequest, ChatResponse
from src.tools.executor import ClinicalEmrToolClient, ToolExecutor
from src.tools.schemas import openai_tool_definitions

settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Training-free agentic chatbot for dental appointment scheduling",
)

profile_selector = ToolProfileSelector()
clinical_client = ClinicalEmrToolClient(
    base_url=settings.clinical_emr_base_url,
    internal_token=settings.clinical_emr_internal_token,
)
tool_executor = ToolExecutor(clinical_client=clinical_client)


@app.get("/health")
def health_check() -> dict:
    return {"status": "healthy", "service": "booking_orchestrator"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    selection = profile_selector.select_profile(
        latest_user_message=request.message,
        conversation_state=request.conversation_state,
    )

    metadata = {
        "tool_schemas": openai_tool_definitions(selection.tools),
        "matched_keywords": selection.matched_keywords,
    }

    if selection.profile == ToolProfile.SAFETY:
        risk = tool_executor.execute(
            "classify_medical_risk", {"message": request.message}
        )
        summary = tool_executor.execute(
            "summarize_for_dentist", {"message": request.message}
        )
        metadata["risk"] = risk.model_dump()
        metadata["dentist_summary"] = summary.model_dump()
        assistant_response = (
            "Your message may need urgent clinic review. I can help notify clinic "
            "staff, but this chatbot cannot diagnose or prescribe medication."
        )
    else:
        assistant_response = (
            "I can help with dental appointment scheduling. I will only use "
            "validated backend tools before changing appointment data."
        )

    return ChatResponse(
        session_id=request.session_id,
        assistant_response=assistant_response,
        selected_profile=selection.profile.value,
        exposed_tools=selection.tools,
        metadata=metadata,
    )


@app.get("/services")
def list_services() -> dict:
    return {"success": True, "data": get_services()}


@app.get("/slots")
def get_slots(
    clinic_id: str | None = None,
    service_id: str | None = None,
    dentist_id: str | None = None,
    date: str | None = None,
) -> dict:
    return clinical_client.request(
        "GET",
        "/v1/slots",
        params={
            "clinic_id": clinic_id,
            "service_id": service_id,
            "dentist_id": dentist_id,
            "date": date,
        },
    )


@app.post("/slots/{slot_id}/hold")
def hold_slot(slot_id: str, payload: dict) -> dict:
    return clinical_client.request("POST", f"/v1/slots/{slot_id}/hold", json=payload)


@app.post("/bookings/confirm")
def confirm_booking(payload: dict) -> dict:
    return clinical_client.request("POST", "/v1/bookings/confirm", json=payload)


@app.post("/appointments/{appointment_id}/cancel")
def cancel_appointment(appointment_id: str, payload: dict) -> dict:
    return clinical_client.request(
        "POST", f"/v1/appointments/{appointment_id}/cancel", json=payload
    )


@app.post("/appointments/{appointment_id}/reschedule")
def reschedule_appointment(appointment_id: str, payload: dict) -> dict:
    return clinical_client.request(
        "POST", f"/v1/appointments/{appointment_id}/reschedule", json=payload
    )


@app.post("/waitlist")
def add_to_waitlist(payload: dict) -> dict:
    return clinical_client.request("POST", "/v1/waitlist", json=payload)
