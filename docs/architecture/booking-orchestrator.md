# Booking Orchestrator

**Stack:** FastAPI (Python) · **Port:** `8089` · **Vị trí:** `ai/booking_orchestrator/` · **Profile compose:** `chatbot`

Chatbot đặt lịch hội thoại — nhận chat trực tiếp từ frontend (không qua gateway), mặc định chạy mock LLM.

```mermaid
flowchart LR
    FE["Frontend Web<br/>:3000"]
    BO["Booking Orchestrator<br/>FastAPI · :8089"]
    GW["Gateway Service<br/>:8080"]
    MEDDB[("core_medical_service_db<br/>(chỉ đọc)")]
    LLM["LLM APIs<br/>HF / OpenAI (mock mặc định)"]

    FE -->|"chat đặt lịch"| BO
    BO -->|"GATEWAY_URL /api/v1"| GW
    BO -.->|"đọc lịch trống"| MEDDB
    BO -.-> LLM

    classDef client fill:#e8ecef,stroke:#3d4c59,color:#1f2d36
    classDef nest fill:#e3f0ee,stroke:#0f766e,color:#1f2d36
    classDef py fill:#faefdf,stroke:#b45309,color:#1f2d36
    classDef data fill:#e7eaf8,stroke:#4150a6,color:#1f2d36
    classDef ext fill:#fafbfb,stroke:#98a4ad,stroke-dasharray:5 4,color:#1f2d36

    class FE client
    class GW nest
    class BO py
    class MEDDB data
    class LLM ext
```

## Kết nối

| Chiều | Đích | Giao thức / route | Ghi chú |
|---|---|---|---|
| Vào | Frontend Web | HTTP `:8089` | Chat gọi thẳng, không qua gateway |
| Ra | Gateway Service | REST `GATEWAY_URL=http://gateway:8080/api/v1` | Tra lịch trống, thông tin phòng khám |
| Ra | PostgreSQL | đọc `core_medical_service_db` | Không sở hữu database |
| Ra | LLM APIs | HTTPS (tuỳ chọn) | Hugging Face / OpenAI, mặc định mock mode |

## Database

Không sở hữu database riêng — chỉ **đọc** `core_medical_service_db` (thuộc [Clinical EMR Service](clinical-emr-service.md)).
