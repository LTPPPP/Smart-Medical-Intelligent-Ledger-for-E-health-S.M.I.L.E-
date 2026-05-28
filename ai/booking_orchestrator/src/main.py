from fastapi import FastAPI

from src.agent.chat_orchestrator import ChatOrchestrator
from src.agent.intent_classifier import LLMIntentClassifier
from src.config import get_settings
from src.knowledge.static import get_services
from src.llm.client import OpenAICompatibleLLMClient
from src.schemas.chat import ChatRequest, ChatResponse
from src.tools.executor import ClinicalEmrToolClient, ToolExecutor

settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Training-free agentic chatbot for dental appointment scheduling",
)

clinical_client = ClinicalEmrToolClient(
    base_url=settings.clinical_emr_base_url,
    api_prefix=settings.clinical_emr_api_prefix,
    internal_token=settings.clinical_emr_internal_token,
)
tool_executor = ToolExecutor(clinical_client=clinical_client)
llm_client = (
    OpenAICompatibleLLMClient(
        base_url=settings.llm_base_url,
        api_key=settings.llm_api_key,
        model=settings.llm_model,
        temperature=settings.llm_temperature,
        max_tokens=settings.llm_max_tokens,
    )
    if settings.llm_enabled
    else None
)
chat_orchestrator = ChatOrchestrator(
    tool_executor=tool_executor,
    intent_classifier=LLMIntentClassifier(llm_client) if llm_client else None,
    llm_client=llm_client,
    llm_enabled=settings.llm_enabled,
)


@app.get("/health")
def health_check() -> dict:
    return {"status": "healthy", "service": "booking_orchestrator"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    return chat_orchestrator.process(request)


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
        "/slots",
        params={
            "clinic_id": clinic_id,
            "service_id": service_id,
            "dentist_id": dentist_id,
            "date": date,
        },
    )


@app.post("/slots/{slot_id}/hold")
def hold_slot(slot_id: str, payload: dict) -> dict:
    return clinical_client.request("POST", f"/slots/{slot_id}/hold", json=payload)


@app.post("/bookings/confirm")
def confirm_booking(payload: dict) -> dict:
    return clinical_client.request("POST", "/bookings/confirm", json=payload)


@app.post("/appointments/{appointment_id}/cancel")
def cancel_appointment(appointment_id: str, payload: dict) -> dict:
    return clinical_client.request(
        "POST", f"/appointments/{appointment_id}/cancel", json=payload
    )


@app.post("/appointments/{appointment_id}/reschedule")
def reschedule_appointment(appointment_id: str, payload: dict) -> dict:
    return clinical_client.request(
        "POST", f"/appointments/{appointment_id}/reschedule", json=payload
    )


@app.post("/waitlist")
def add_to_waitlist(payload: dict) -> dict:
    return clinical_client.request("POST", "/waitlist", json=payload)
