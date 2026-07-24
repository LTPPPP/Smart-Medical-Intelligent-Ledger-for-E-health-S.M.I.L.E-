-- Drop leftover NestJS boilerplate tables from core_medical_service_db.
-- These were never wired into clinical-EMR domain logic (see schema.sql header).
-- Order matters: session -> "user" -> file/role/status (FK dependencies).
-- Safe to re-run: all statements are IF EXISTS.

DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS "user";
DROP TABLE IF EXISTS file;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS status;
