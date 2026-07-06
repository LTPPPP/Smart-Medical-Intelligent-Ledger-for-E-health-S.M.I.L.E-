# Table Descriptions — auth_service_db

> Owner service: **IAM Service (default connection)** · Diagram: [`db-auth-service.dbml`](db-auth-service.dbml) / [`db-auth-service.puml`](db-auth-service.puml)

| No | Table | Description |
|----|-------|-------------|
| 01 | **accounts** | **Primary key:**<br>• account_id: UUID<br>**Foreign keys:**<br>• account_id → account_service_db.users.user_id (1:1 identity link) *(logical, cross-DB)*<br>**Attributes:**<br>• username: VARCHAR (unique, nullable)<br>• email: VARCHAR (unique, nullable)<br>• phone: VARCHAR (unique, nullable)<br>• full_name: VARCHAR (nullable)<br>• gender: VARCHAR (nullable)<br>• password_hash: VARCHAR (nullable)<br>• role: VARCHAR (default: PATIENT)<br>• status: VARCHAR (default: ACTIVE)<br>• failed_login_attempts: INT (default: 0)<br>• locked_at: TIMESTAMP (nullable)<br>• locked_reason: TEXT (nullable)<br>• locked_by: UUID (nullable)<br>• email_verified: BOOLEAN (default: false)<br>• phone_verified: BOOLEAN (default: false)<br>• last_login_at: TIMESTAMP (nullable)<br>• created_at: TIMESTAMP<br>• updated_at: TIMESTAMP<br>• created_by: UUID (nullable)<br>• updated_by: UUID (nullable) |
| 02 | **oauth_connections** | **Primary key:**<br>• connection_id: UUID<br>**Foreign keys:**<br>• account_id → accounts(account_id)<br>**Attributes:**<br>• provider: VARCHAR(50)<br>• provider_user_id: VARCHAR(255)<br>• access_token: TEXT (nullable)<br>• refresh_token: TEXT (nullable)<br>• token_expires_at: TIMESTAMP (nullable)<br>• is_active: BOOLEAN (default: true)<br>• created_at: TIMESTAMP<br>• updated_at: TIMESTAMP |
| 03 | **otp_tokens** | **Primary key:**<br>• otp_id: UUID<br>**Foreign keys:**<br>• account_id → accounts(account_id)<br>**Attributes:**<br>• otp_code: VARCHAR(10)<br>• otp_type: VARCHAR(20)<br>• expires_at: TIMESTAMP<br>• used_at: TIMESTAMP (nullable)<br>• created_at: TIMESTAMP<br>• updated_at: TIMESTAMP |
| 04 | **refresh_tokens** | **Primary key:**<br>• token_id: UUID<br>**Foreign keys:**<br>• account_id → accounts(account_id)<br>**Attributes:**<br>• token_hash: VARCHAR(255)<br>• expires_at: TIMESTAMP<br>• revoked_at: TIMESTAMP (nullable)<br>• device_info: TEXT (nullable)<br>• ip_address: VARCHAR(45) (nullable)<br>• created_at: TIMESTAMP |

> *Logical, cross-DB* = UUID reference to another service's database; enforced in the application layer, not by a database constraint.
