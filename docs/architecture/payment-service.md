# Payment Service

**Stack:** NestJS + TypeORM · **Port:** `3006` · **Vị trí:** `backend/service/payment-service/`

Xử lý thanh toán — hóa đơn, tích hợp cổng VNPay, hoàn tiền.

```mermaid
flowchart LR
    GW["Gateway Service<br/>:8080"]
    PAY["Payment Service<br/>NestJS · :3006"]
    PAYDB[("payment_service_db")]
    VNP["VNPay<br/>(mock trong dev)"]

    GW -->|"proxy /payments"| PAY
    PAY --> PAYDB
    PAY -.->|"tạo giao dịch · IPN"| VNP

    classDef nest fill:#e3f0ee,stroke:#0f766e,color:#1f2d36
    classDef data fill:#e7eaf8,stroke:#4150a6,color:#1f2d36
    classDef ext fill:#fafbfb,stroke:#98a4ad,stroke-dasharray:5 4,color:#1f2d36

    class GW,PAY nest
    class PAYDB data
    class VNP ext
```

## Kết nối

| Chiều | Đích | Giao thức / route | Ghi chú |
|---|---|---|---|
| Vào | Gateway Service | proxy `/api/v1/payments` | |
| Ra | PostgreSQL | TypeORM `:5432` | `payment_service_db` |
| Ra | VNPay | HTTPS | `VNPAY_MOCK=true` mặc định trong dev |

## Database

| Database | Vai trò |
|---|---|
| `payment_service_db` | Hóa đơn, giao dịch thanh toán, hoàn tiền |
