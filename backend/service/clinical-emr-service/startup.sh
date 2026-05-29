#!/bin/bash
set -e

echo "[startup] Waiting for PostgreSQL..."
until nc -z "${DATABASE_HOST:-postgres}" "${DATABASE_PORT:-5432}"; do
  sleep 1
done
echo "[startup] PostgreSQL is ready."

echo "[startup] Starting Clinical EMR Service..."
exec node dist/main.js
