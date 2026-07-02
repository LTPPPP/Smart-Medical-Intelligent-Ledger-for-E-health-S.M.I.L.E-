# Clinical EMR Service

**Stack:** NestJS + TypeORM · **Port:** `8082` · **Vị trí:** `backend/service/clinical-emr-service/`

Bệnh án điện tử và vận hành phòng khám — lịch hẹn, phiên khám, đơn thuốc, hồ sơ y tế, lịch làm việc nhân viên.

```mermaid
flowchart LR
    GW["Gateway Service<br/>:8080"]
    EMR["Clinical EMR Service<br/>NestJS · :8082"]
    MEDDB[("core_medical_service_db")]
    CLINDB[("core_clinic_service_db")]
    RD[("Redis :6379")]
    MD["MailDev<br/>:1025"]
    S3["AWS S3<br/>(tuỳ chọn)"]

    GW -->|"proxy /appointments · /medical-records"| EMR
    EMR --> MEDDB
    EMR --> CLINDB
    EMR -->|"queue job nền"| RD
    EMR -->|"SMTP"| MD
    EMR -.->|"FILE_DRIVER=s3"| S3

    classDef nest fill:#e3f0ee,stroke:#0f766e,color:#1f2d36
    classDef data fill:#e7eaf8,stroke:#4150a6,color:#1f2d36
    classDef ext fill:#fafbfb,stroke:#98a4ad,stroke-dasharray:5 4,color:#1f2d36

    class GW,EMR nest
    class MEDDB,CLINDB,RD,MD data
    class S3 ext
```

## Kết nối

| Chiều | Đích | Giao thức / route | Ghi chú |
|---|---|---|---|
| Vào | Gateway Service | proxy `/api/v1/appointments`, medical-records... | |
| Ra | PostgreSQL | TypeORM `:5432` | 2 database bên dưới |
| Ra | Redis | `WORKER_HOST=redis://redis:6379/1` | Queue job nền |
| Ra | MailDev | SMTP `:1025` | Nhắc lịch hẹn, thông báo (dev) |
| Ra | AWS S3 | HTTPS (tuỳ chọn) | Lưu file/ảnh khi `FILE_DRIVER=s3` |

Lưu ý: `core_medical_service_db` còn được **Booking Orchestrator đọc** để tra lịch trống.

## Database

| Database | Vai trò |
|---|---|
| `core_medical_service_db` | Bệnh án (`medical_records`), phiên khám, đơn thuốc |
| `core_clinic_service_db` | Phòng khám, lịch làm việc, nhân viên |

Migration: `src/database/migrations/`.
