# Frontend Web

**Stack:** Next.js 15 + React 19 + TypeScript · **Port:** `3000` · **Profile compose:** `frontend`

Giao diện web cho bệnh nhân, phòng khám và admin. Client thuần — không có database riêng; mọi dữ liệu lấy qua API.

```mermaid
flowchart LR
    USER(["Người dùng<br/>bệnh nhân · phòng khám · admin"])
    FE["Frontend Web<br/>Next.js 15 · :3000"]
    GW["Gateway Service<br/>:8080"]
    BO["Booking Orchestrator<br/>:8089"]

    USER --> FE
    FE -->|"REST /api/v1/*"| GW
    FE -->|"chat đặt lịch"| BO

    classDef client fill:#e8ecef,stroke:#3d4c59,color:#1f2d36
    classDef nest fill:#e3f0ee,stroke:#0f766e,color:#1f2d36
    classDef py fill:#faefdf,stroke:#b45309,color:#1f2d36

    class USER,FE client
    class GW nest
    class BO py
```

## Kết nối

| Chiều | Đích | Giao thức / route | Ghi chú |
|---|---|---|---|
| Ra | Gateway Service | REST `NEXT_PUBLIC_GATEWAY_URL` → `:8080/api/v1` | Mọi API nghiệp vụ |
| Ra | Booking Orchestrator | HTTP `NEXT_PUBLIC_CHATBOT_URL` → `:8089` | Chat đặt lịch, gọi thẳng không qua gateway |

## Database

Không có — client-side, state nằm trên trình duyệt.
