#!/usr/bin/env bash
#
# db-reset-load.sh — Reset + (re)create every S.M.I.L.E service database and
# load its schema/seed SQL straight from database/ into the running postgres
# container. No manual copying of .sql files into docker/init-db.sql or
# docker-entrypoint-initdb.d is needed — this script pipes each file into
# `psql` directly via `docker compose exec`.
#
# Usage:
#   bash scripts/db-reset-load.sh                # reset + schema + seed data
#   bash scripts/db-reset-load.sh --schema-only   # reset + schema, skip insert.sql
#
# Prerequisites:
#   - docker compose available (postgres service is started automatically
#     if it isn't already running).
#
# What it does (per service):
#   1. DROP DATABASE (with FORCE) + CREATE DATABASE — a clean reset.
#   2. Load schema.sql (and cleanup-boilerplate.sql, if present).
#   3. Load insert.sql seed data (unless --schema-only is passed).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DATABASE_DIR="$ROOT_DIR/database"
COMPOSE_SERVICE="postgres"
PG_USER="postgres"

cd "$ROOT_DIR"

SCHEMA_ONLY=false
if [[ "${1:-}" == "--schema-only" ]]; then
  SCHEMA_ONLY=true
fi

# "database/<service-dir>:<db-name>" — mirrors docker/init-db.sql.
# booking-orchestrator is intentionally excluded: it has no schema.sql
# (see database/booking-orchestrator/README.md).
SERVICES=(
  "iam-service/auth-service:auth_service_db"
  "iam-service/user-service:account_service_db"
  "clinical-emr-service/clinic-service:core_clinic_service_db"
  "clinical-emr-service/medical-service:core_medical_service_db"
  "payment-service/payment-service:payment_service_db"
)

header() {
  echo ""
  echo "════════════════════════════════════════════════════════════════════"
  echo "  $1"
  echo "════════════════════════════════════════════════════════════════════"
}

psql_admin() {
  # Runs a single -c statement against the maintenance "postgres" db.
  docker compose exec -T "$COMPOSE_SERVICE" psql -U "$PG_USER" -d postgres -v ON_ERROR_STOP=1 -c "$1"
}

load_file() {
  local db="$1" file="$2"
  [ -f "$file" ] || return 0
  echo "  ▶ ${file#"$ROOT_DIR"/} → $db"
  docker compose exec -T "$COMPOSE_SERVICE" psql -U "$PG_USER" -d "$db" -v ON_ERROR_STOP=1 < "$file"
}

# ─── 0. Make sure postgres is up ────────────────────────────────────────────
header "Ensuring postgres is up"
docker compose up -d "$COMPOSE_SERVICE"
echo "  Waiting for postgres to accept connections..."
until docker compose exec -T "$COMPOSE_SERVICE" pg_isready -U "$PG_USER" >/dev/null 2>&1; do
  sleep 1
done
echo "  postgres ready."

# ─── 1. Drop + recreate every service database ──────────────────────────────
header "Resetting databases"
for entry in "${SERVICES[@]}"; do
  db="${entry#*:}"
  echo "  ↻ $db"
  psql_admin "DROP DATABASE IF EXISTS $db WITH (FORCE);"
  psql_admin "CREATE DATABASE $db;"
done

# ─── 2. Load schema.sql (+ cleanup-boilerplate.sql) per service ────────────
header "Loading schemas"
for entry in "${SERVICES[@]}"; do
  dir="${entry%:*}"
  db="${entry#*:}"
  load_file "$db" "$DATABASE_DIR/$dir/schema.sql"
  load_file "$db" "$DATABASE_DIR/$dir/cleanup-boilerplate.sql"
done

# ─── 3. Load insert.sql (seed data) per service ─────────────────────────────
if [ "$SCHEMA_ONLY" = false ]; then
  header "Loading seed data"
  for entry in "${SERVICES[@]}"; do
    dir="${entry%:*}"
    db="${entry#*:}"
    load_file "$db" "$DATABASE_DIR/$dir/insert.sql"
  done
else
  echo ""
  echo "--schema-only passed — skipped insert.sql seed data."
fi

header "DONE"
echo "All database/ SQL files were applied directly to the running postgres container."
