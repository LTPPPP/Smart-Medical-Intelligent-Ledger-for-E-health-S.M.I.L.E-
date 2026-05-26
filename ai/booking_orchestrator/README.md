# S.M.I.L.E Booking Orchestrator

FastAPI chatbot service for training-free, tool-routed dental appointment scheduling.

The LLM is treated as untrusted. It may choose a tool and propose arguments, but all scheduling writes go through deterministic Clinical EMR endpoints with validation and database transactions.

## Run

```bash
python -m pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 7777
```

## Test

```bash
python -m pytest -q
```

## Architecture

- `agent/`: deterministic tool profile selection.
- `llm/`: OpenAI-compatible client interface and fake client for tests.
- `tools/`: Pydantic tool schemas and validated executor.
- `knowledge/`: static clinic/service knowledge for info tools.
- Clinical EMR owns slot holds, bookings, cancellation, waitlist, email outbox, and handoff tickets.
