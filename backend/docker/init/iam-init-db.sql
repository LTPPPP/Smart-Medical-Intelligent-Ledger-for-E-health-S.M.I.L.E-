SELECT 'CREATE DATABASE account_service_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'account_service_db'
)\gexec
