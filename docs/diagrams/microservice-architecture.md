# S.M.I.L.E — Overall Architecture (Microservices)

> Software Design Document · Mục 2.1 — sơ đồ khớp với `docker-compose.yml` và script init database thực tế.

## Service nào sử dụng database nào

| Service | Database sở hữu | Nội dung (tables) | Redis logical DB |
|---|---|---|---|
| **API Gateway** :3000 | *(không có DB)* | — | DB0 — distributed rate limit |
| **IAM Service** :3001 | `auth_service_db` | accounts (login) | DB3 — access-token blacklist (logout) |
| | `account_service_db` | users, roles, permissions, user_roles, role_permissions | |
| **Clinical EMR Service** :3002 | `core_clinic_service_db` | clinics, rooms, specialties, services, schedules, appointments | DB1 — master-data read cache (TTL 300s) |
| | `core_medical_service_db` | patients, medical_records | |
| **Payment Service** :3003 | `payment_service_db` | payments | DB4 — idempotency + callback replay guard |
| **AI Service** (booking_orchestrator) | `booking_orchestrator_db` | conversation / booking state | — |

Nguyên tắc: **database-per-service** — mỗi database vẽ thành một node riêng, mũi tên chỉ thẳng từ service sở hữu vào từng DB; không service nào đọc chéo DB của service khác. (Về hạ tầng, cả 6 DB chạy chung 1 instance PostgreSQL 16 `smile-postgres` :5432.) Redis là **1 instance dùng chung**, tách biệt bằng logical DB (0/1/3/4).

## Diagram

Màu sắc = ranh giới ownership: service và database cùng màu.

```mermaid
flowchart LR
  client[Web Client<br/>Browser · Next.js FE]

  subgraph docker[Docker Compose · smile-network]
    direction LR
    gw[API Gateway :3000<br/>routing · auth guard · rate limit]

    subgraph services[Backend Services]
      direction TB
      iam[IAM Service :3001<br/>auth · users · sessions]
      emr[Clinical EMR Service :3002<br/>clinic · medical records]
      pay[Payment Service :3003<br/>invoices · VNPay]
      ai[AI Service · Python<br/>booking_orchestrator · booking_langgraph · kyc_ocr]
    end

    authdb[(auth_service_db<br/>PostgreSQL · accounts)]
    accountdb[(account_service_db<br/>PostgreSQL · users · roles · permissions)]
    clinicdb[(core_clinic_service_db<br/>PostgreSQL · clinics · rooms · specialties<br/>services · schedules · appointments)]
    meddb[(core_medical_service_db<br/>PostgreSQL · patients · medical_records)]
    paydb[(payment_service_db<br/>PostgreSQL · payments)]
    aidb[(booking_orchestrator_db<br/>PostgreSQL · conversation state)]

    redis[(Redis 7 — shared cache<br/>DB0 rate limit — Gateway<br/>DB1 read cache — EMR<br/>DB3 token blacklist — IAM<br/>DB4 idempotency — Payment)]
    mail[MailDev SMTP :1025]
  end

  vnpay[VNPay Sandbox<br/>External payment gateway]

  client -->|HTTPS| gw
  gw -->|/api/v1 proxy| iam
  gw --> emr
  gw --> pay
  gw --> ai

  iam --> authdb
  iam --> accountdb
  emr --> clinicdb
  emr --> meddb
  pay --> paydb
  ai --> aidb

  ai -. booking / patient API .-> emr

  gw -. DB0 rate limit .-> redis
  emr -. DB1 read cache .-> redis
  iam -. DB3 token blacklist .-> redis
  pay -. DB4 idempotency .-> redis

  iam -. confirm email .-> mail
  pay -->|redirect + IPN callback| vnpay

  %% Màu = ranh giới ownership: service và database cùng màu
  classDef gateway fill:#e8effa,stroke:#1d5fbf,stroke-width:2px
  classDef iamC fill:#e0f4f8,stroke:#0e7490,stroke-width:1.5px
  classDef emrC fill:#e7f4ec,stroke:#2f7d4f,stroke-width:1.5px
  classDef payC fill:#fdf1e0,stroke:#b45309,stroke-width:1.5px
  classDef aiC fill:#f3f1f9,stroke:#8073b0,stroke-width:1.5px
  classDef cache fill:#fbf0ee,stroke:#a93226
  classDef ext fill:#ffffff,stroke:#8a94a3,stroke-dasharray:5 4

  class gw gateway
  class iam,authdb,accountdb iamC
  class emr,clinicdb,meddb emrC
  class pay,paydb payC
  class ai,aidb aiC
  class redis cache
  class vnpay ext
```

## Quy ước

| Ký hiệu | Ý nghĩa |
|---|---|
| Mũi tên liền `-->` | Gọi đồng bộ (REST / SQL) |
| Mũi tên đứt `-.->` | Cache / side-channel (Redis, SMTP) |
| Cùng màu | Service và database thuộc cùng một ownership boundary |
| Khung `docker` | Ranh giới Docker Compose, network `smile-network` |
| Node viền đứt | Hệ thống bên ngoài (VNPay) |

## Điểm khác so với hình cũ (đã sửa)

1. **Redis không nằm trên đường ghi dữ liệu.** Hình cũ vẽ chuỗi Service → Redis → PostgresDB; thực tế Redis chỉ là cache dùng chung bên cạnh, mỗi service dùng một logical DB riêng. Đường ghi chính là Service → PostgreSQL trực tiếp.
2. **Database-per-service, 6 database tách biệt — mỗi DB một node riêng, mũi tên riêng từ service sở hữu.** Không dùng chung một PostgresDB: IAM sở hữu 2 DB (`auth_service_db`, `account_service_db`), Clinical EMR sở hữu 2 DB (`core_clinic_service_db`, `core_medical_service_db`), Payment và AI orchestrator mỗi bên 1 DB.
3. **Bổ sung external systems.** VNPay Sandbox (redirect + IPN callback từ Payment Service) và MailDev SMTP (IAM gửi confirm email).
4. **AI Service không cô lập.** Nhóm AI gọi Clinical EMR qua REST booking/patient API và có database riêng.
5. **Gateway là entry point duy nhất.** Client chỉ đi qua Gateway :3000; các service :3001–:3003 chỉ giao tiếp nội bộ trong `smile-network`.

## File liên quan

- Nguồn Mermaid thuần: [`microservice-architecture.mmd`](./microservice-architecture.mmd) — mở bằng [mermaid.live](https://mermaid.live), draw.io (Arrange → Insert → Advanced → Mermaid), hoặc VS Code extension *Markdown Preview Mermaid Support*.
- Cấu hình hạ tầng: [`docker-compose.yml`](../../docker-compose.yml)
- Export PNG: `npx -p @mermaid-js/mermaid-cli mmdc -i docs/diagrams/microservice-architecture.mmd -o architecture.png -s 3`
