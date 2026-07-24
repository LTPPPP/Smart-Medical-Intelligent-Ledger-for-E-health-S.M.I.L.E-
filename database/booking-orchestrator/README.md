# booking_orchestrator_db — reserved placeholder

`docker/init-db.sql` creates `booking_orchestrator_db`, but there is **no persisted
schema** for it, and that is intentional.

The booking orchestrator (`ai/booking_langgraph_service`) is a **stateless LangGraph
service**. Its `src/schemas.py` defines only Pydantic request/response DTOs
(`ChatRequest`, `BookingDraft`, `AgentCommand`, …) — none are database tables /
SQLAlchemy models. The service holds no long-lived relational state; booking data
is owned by `core_clinic_service_db` (appointments) and `payment_service_db`.

The database is kept in the init script as a reserved slot in case future
orchestrator features need persistence. Until then there are no tables, no
`schema.sql`, and nothing to migrate here.
