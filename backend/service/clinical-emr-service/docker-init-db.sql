-- Tạo database thứ 2 cho clinic service
-- Database đầu tiên (core_medical_service_db) đã được tạo qua POSTGRES_DB env
SELECT 'CREATE DATABASE core_clinic_service_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'core_clinic_service_db'
)\gexec
