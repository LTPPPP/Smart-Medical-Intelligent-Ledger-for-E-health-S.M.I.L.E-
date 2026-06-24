---
applyTo: "ai/**"
---

# 🤖 AI Service Rules — S.M.I.L.E

## Module Structure

Each active AI service, including `booking_langgraph_service` and `kyc_ocr_service`, must follow:

```
src/
  api/          ← FastAPI routers (HTTP only, no ML logic)
  service/      ← business/orchestration logic
  model/        ← ML model loading, inference wrappers
  schema/       ← Pydantic request/response schemas
  utils/        ← shared helpers (image preprocessing, etc.)
  config.py     ← settings via pydantic-settings
main.py         ← app factory, router registration
```

---

## Layer Rules

| Layer         | Responsibility                                 | Forbidden                        |
| ------------- | ---------------------------------------------- | -------------------------------- |
| `api/` router | Parse request, call service, return response   | ML inference, direct model calls |
| `service/`    | Orchestrate inference pipeline, business rules | HTTP concerns, raw tensor ops    |
| `model/`      | Load model, run inference, return typed result | Business logic, DB access        |
| `schema/`     | Pydantic I/O models                            | Logic, side effects              |

---

## Model Loading

- Models must be loaded **once at startup** (lifespan event), not per-request.
- Model paths must come from environment variables — never hardcoded.
- Support both CPU and GPU; default to CPU if CUDA is unavailable.

```python
# ✅ CORRECT — loaded once at startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = load_model(settings.MODEL_PATH)
    yield

# ❌ WRONG — loaded on every request
@router.post("/detect")
async def detect(file: UploadFile):
    model = load_model("./models/best.pt")  # expensive, per-request
```

---

## Input Validation

- All image inputs must be validated: format (JPEG/PNG), max size (< 10 MB), dimensions.
- Use Pydantic schemas for all JSON request bodies.
- Never pass raw user input to `eval()`, `exec()`, or `subprocess`.

---

## Response Schema

Every inference endpoint must return:

```json
{
  "success": true,
  "data": { ... },
  "model_version": "1.2.0",
  "inference_time_ms": 145
}
```

---

## File Size

- No Python file may exceed **500 lines**.
- If a model wrapper exceeds 200 lines, split preprocessing, inference, and postprocessing into separate methods or files.

---

## Testing

- Every service function must have a unit test with mocked model.
- Integration tests must run actual inference on a sample image.
- Run: `pytest tests/` before push.

---

## Dependencies

- Pin all dependencies in `requirements.txt` with exact versions.
- Use `torch` CPU-only build in Docker for production unless GPU is explicitly provisioned.
- Scan for CVEs with `pip-audit` before releases.
