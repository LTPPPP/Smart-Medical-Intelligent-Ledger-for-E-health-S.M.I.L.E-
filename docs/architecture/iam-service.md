# IAM Service

**Stack:** NestJS + TypeORM · **Port:** `8081` · **Vị trí:** `backend/service/iam-service/`

Identity & Access Management — xác thực (JWT, OAuth), phân quyền RBAC, hồ sơ người dùng và xác minh danh tính KYC.

```mermaid
flowchart LR
    GW["Gateway Service<br/>:8080"]
    IAM["IAM Service<br/>NestJS · :8081"]
    KYC["KYC OCR Service<br/>:8010"]
    AUTHDB[("auth_service_db")]
    ACCDB[("account_service_db")]
    MD["MailDev<br/>:1025"]
    OAUTH["OAuth<br/>Google · Facebook · Apple"]

    GW -->|"proxy /auth · /users"| IAM
    IAM -->|"xác thực giấy tờ"| KYC
    IAM --> AUTHDB
    IAM --> ACCDB
    IAM -->|"SMTP"| MD
    IAM -.->|"đăng nhập xã hội"| OAUTH

    classDef nest fill:#e3f0ee,stroke:#0f766e,color:#1f2d36
    classDef py fill:#faefdf,stroke:#b45309,color:#1f2d36
    classDef data fill:#e7eaf8,stroke:#4150a6,color:#1f2d36
    classDef ext fill:#fafbfb,stroke:#98a4ad,stroke-dasharray:5 4,color:#1f2d36

    class GW,IAM nest
    class KYC py
    class AUTHDB,ACCDB,MD data
    class OAUTH ext
```

## Kết nối

| Chiều | Đích | Giao thức / route | Ghi chú |
|---|---|---|---|
| Vào | Gateway Service | proxy `/api/v1/auth`, users, roles... | Không nhận traffic trực tiếp từ client |
| Ra | KYC OCR Service | HTTP `KYC_OCR_URL` (`:8010`) | Đọc CCCD/giấy tờ khi đăng ký KYC |
| Ra | PostgreSQL | TypeORM `:5432` | 2 database bên dưới |
| Ra | MailDev | SMTP `:1025` | Mail xác nhận, thông báo (dev) |
| Ra | OAuth providers | HTTPS | Google / Facebook / Apple login |

## Database

| Database | Vai trò |
|---|---|
| `auth_service_db` | Phiên đăng nhập, credential, refresh token, KYC (`kyc_verifications.document_hash`) |
| `account_service_db` | Tài khoản, hồ sơ người dùng, vai trò |

Migration: `src/database/user-migrations/`. ERD chi tiết: [erd.md](erd.md#1-auth_service_db--iam-service).
