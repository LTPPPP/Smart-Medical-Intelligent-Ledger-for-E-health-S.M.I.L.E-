-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  S.M.I.L.E — Database Initialization Script                            ║
-- ║  Creates all required databases for microservices                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─── IAM Service databases ──────────────────────────────────────────────────
SELECT 'CREATE DATABASE auth_service_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'auth_service_db'
)\gexec

SELECT 'CREATE DATABASE account_service_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'account_service_db'
)\gexec

-- ─── Clinical EMR Service databases ────────────────────────────────────────
SELECT 'CREATE DATABASE core_medical_service_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'core_medical_service_db'
)\gexec

SELECT 'CREATE DATABASE core_clinic_service_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'core_clinic_service_db'
)\gexec

-- ─── Payment Service database ──────────────────────────────────────────────
SELECT 'CREATE DATABASE payment_service_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'payment_service_db'
)\gexec

-- ─── Blockchain Service database ───────────────────────────────────────────
SELECT 'CREATE DATABASE blockchain_service_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'blockchain_service_db'
)\gexec
