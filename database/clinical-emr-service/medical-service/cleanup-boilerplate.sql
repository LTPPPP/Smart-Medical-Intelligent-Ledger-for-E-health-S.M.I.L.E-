-- Drop leftover NestJS boilerplate tables from core_medical_service_db.
-- Order matters: session -> "user" -> file/role/status (FK dependencies).

DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS "user";
DROP TABLE IF EXISTS file;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS status;
