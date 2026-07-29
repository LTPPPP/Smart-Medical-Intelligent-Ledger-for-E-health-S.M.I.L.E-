# Database Connections — Local Dev

Thông số kết nối các database của SMILE khi chạy stack dev bằng Docker Compose
(`docker compose -f docker-compose.yml up -d`).

> ⚠️ **Port 55432, không phải 5432.** Máy dev có Postgres Homebrew chiếm
> `127.0.0.1:5432` (user `apple9`, không có data SMILE). Container postgres của
> SMILE publish ra host ở **55432** để tránh đụng độ. Các file `.env` của từng
> service cũng trỏ vào 55432/56379.

## PostgreSQL

| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `55432` |
| Username | `postgres` |
| Password | `postgres` |
| Default DB | `postgres` |

JDBC URL: `jdbc:postgresql://localhost:55432/postgres`

CLI: `psql -h localhost -p 55432 -U postgres` hoặc `docker exec -it smile-postgres psql -U postgres`

### Databases

| Database | Service | Nội dung chính |
|---|---|---|
| `auth_service_db` | IAM | `accounts` (login), `refresh_tokens`, `otp_tokens`, `oauth_connections` |
| `account_service_db` | IAM | `users`, `roles`, `permissions`, `user_roles`, `notifications`, `notification_templates`, `kyc_verifications`, `audit_logs` |
| `core_clinic_service_db` | Clinical EMR | `clinics`, `appointments`, `doctor_schedules`, `services`, `specialties`, `treatment_rooms` |
| `core_medical_service_db` | Clinical EMR | `medical_records`, hồ sơ khám |
| `payment_service_db` | Payment | `payments` (paid / pending / failed / refunded + refund workflow) |
| `booking_orchestrator_db` | (reserved) | trống |

## DBeaver setup

1. **New Connection → PostgreSQL**, điền host/port/user/password ở trên.
2. Tab **PostgreSQL** trong dialog → tick **Show all databases** → một
   connection thấy đủ 6 database.
3. **Test Connection** (DBeaver tự tải driver nếu thiếu) → **Finish**.

## Redis

| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `56379` |
| Password | *(không có)* |

| Logical DB | Dùng cho |
|---|---|
| 0 | Gateway — distributed rate limiting |
| 1 | Clinical EMR — master-data read cache |
| 3 | IAM — access-token blacklist (logout) |
| 4 | Payment — idempotency + callback replay guard |

DBeaver Community không hỗ trợ Redis (chỉ bản PRO). Thay thế:
`redis-cli -p 56379` hoặc RedisInsight.

## Tiện ích khác

| Tool | URL | Ghi chú |
|---|---|---|
| Maildev (hộp mail dev) | http://localhost:1080 | SMTP nội bộ port 1025 |
| pgAdmin | http://localhost:5050 | chạy `make monitoring`; login `admin@smile.com` / `admin` |

## Tài khoản test (API/Frontend, không phải DB)

Password chung: `Password123!`

`admin@` · `manager1@` · `doctor1@` · `doctor2@` · `receptionist1@` ·
`nurse1@` · `patient1@` · `patient2@` — tất cả `@smile.com`.
