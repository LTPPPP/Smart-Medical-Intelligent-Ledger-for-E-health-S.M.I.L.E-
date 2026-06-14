from __future__ import annotations

from src.composer import compose_mutation_success


def test_mutation_success_quotes_backend_code_and_status_when_available():
    reply = compose_mutation_success(
        {
            "appointment_code": "APT-20260620-0001",
            "status": "cancelled",
        }
    )

    assert "APT-20260620-0001" in reply
    assert "cancelled" in reply
