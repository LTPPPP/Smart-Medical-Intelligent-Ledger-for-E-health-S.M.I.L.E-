# Booking LangGraph Service

**Stack:** FastAPI + LangGraph (Python) · **Port:** `8030` · **Vị trí:** `ai/booking_langgraph_service/`

Agent đặt lịch nhiều bước — quản lý state hội thoại phức tạp bằng LangGraph, lưu checkpoint hội thoại vào PostgreSQL. Nhận traffic từ Gateway qua route `/api/v1/ai/booking-chat`.

> ⚠️ Chưa có trong `docker-compose.yml` chính — chạy riêng, Gateway trỏ mặc định về `http://localhost:8030`.

```mermaid
flowchart LR
    GW["Gateway Service<br/>:8080"]
    LG["Booking LangGraph<br/>FastAPI + LangGraph · :8030"]
    PG[("PostgreSQL<br/>checkpoint hội thoại")]
    LLM["LLM APIs<br/>HF / OpenAI (mock mặc định)"]

    GW -->|"/api/v1/ai/booking-chat"| LG
    LG -->|"lưu checkpoint"| PG
    LG -.-> LLM

    classDef nest fill:#e3f0ee,stroke:#0f766e,color:#1f2d36
    classDef py fill:#faefdf,stroke:#b45309,color:#1f2d36
    classDef data fill:#e7eaf8,stroke:#4150a6,color:#1f2d36
    classDef ext fill:#fafbfb,stroke:#98a4ad,stroke-dasharray:5 4,color:#1f2d36

    class GW nest
    class LG py
    class PG data
    class LLM ext
```

## Kết nối

| Chiều | Đích | Giao thức / route | Ghi chú |
|---|---|---|---|
| Vào | Gateway Service | proxy `/api/v1/ai/booking-chat` → `BOOKING_LANGGRAPH_SERVICE_URL` | Xem `gateway-service/src/config/services.config.ts` |
| Ra | PostgreSQL | `:5432` | Lưu checkpoint state hội thoại LangGraph |
| Ra | LLM APIs | HTTPS (tuỳ chọn) | Mặc định mock mode |

## Database

Dùng PostgreSQL làm **checkpoint storage** cho state hội thoại (không có database nghiệp vụ riêng).
