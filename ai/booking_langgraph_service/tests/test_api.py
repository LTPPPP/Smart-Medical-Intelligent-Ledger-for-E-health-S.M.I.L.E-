from fastapi.testclient import TestClient

from src.main import create_app
from src.tools import InMemoryDomainTools


def test_health_reports_langgraph_service_dependencies():
    client = TestClient(create_app(domain_tools=InMemoryDomainTools()))

    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "booking_langgraph_service"
    assert payload["model"]["primary"] == "gpt-5-mini"
    assert payload["model"]["provider"] == "openai"
    assert "benchmark_candidates" not in payload["model"]
    assert payload["dependencies"]["emr"]["status"] == "injected"
    assert payload["dependencies"]["llm"]["status"] == "disabled"


def test_chat_endpoint_uses_trusted_patient_header_and_returns_metrics():
    client = TestClient(create_app(domain_tools=InMemoryDomainTools()))

    response = client.post(
        "/chat",
        headers={"x-patient-id": "patient-1"},
        json={"session_id": "api-1", "message": "Show my appointments"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["flow"] == "lookup"
    assert payload["actions"] == ["get_patient_appointments"]
    assert payload["metadata"]["metrics"]["llm_calls_per_turn"] == 0


def test_chat_endpoint_rejects_mutation_without_patient_context():
    client = TestClient(create_app(domain_tools=InMemoryDomainTools()))

    response = client.post(
        "/chat",
        json={"session_id": "api-2", "message": "Cancel appointment APT-001"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["flow"] == "cancel"
    assert payload["confirmation"] is None
    assert payload["metadata"]["metrics"]["ownership_violation"] == 0
    assert "sign in" in payload["reply"].lower()
