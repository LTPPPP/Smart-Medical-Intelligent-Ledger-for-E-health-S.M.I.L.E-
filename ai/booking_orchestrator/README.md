# S.M.I.L.E Booking Orchestrator

FastAPI chatbot service for training-free, tool-routed dental appointment scheduling.

The LLM is treated as untrusted. It may choose a tool and propose arguments, but all scheduling writes go through deterministic Clinical EMR endpoints with validation and database transactions.

## Run

```bash
python -m pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 7777
```

## vLLM

The orchestrator supports vLLM through its OpenAI-compatible chat completions API.

```bash
vllm serve Qwen/Qwen2.5-7B-Instruct --host 0.0.0.0 --port 8000
```

Then configure:

```env
LLM_ENABLED=true
LLM_BASE_URL=http://localhost:8000/v1
LLM_API_KEY=local-dev-key
LLM_MODEL=Qwen/Qwen2.5-7B-Instruct
```

When `LLM_ENABLED=false`, `/chat` still uses deterministic profile selection and exposes tool schemas without calling an LLM.

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
