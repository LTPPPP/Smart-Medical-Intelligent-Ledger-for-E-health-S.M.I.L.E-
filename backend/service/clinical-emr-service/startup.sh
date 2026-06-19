#!/bin/bash
set -e

# env-cmd requires a .env file to exist — create an empty one
# so it falls through to the actual environment variables
touch /app/.env

echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h "${DATABASE_HOST:-postgres}" -p "${DATABASE_PORT:-5432}" -U "${DATABASE_USERNAME:-postgres}" -q; do
  echo "  PostgreSQL is not ready yet — sleeping 2s..."
  sleep 2
done
echo "✅ PostgreSQL is ready!"

echo "🔄 Running core database migrations..."
npm run migration:run || { echo "❌ Core migration failed"; exit 1; }

echo "🔄 Running clinic database migrations..."
npm run migration:run:clinic || { echo "❌ Clinic migration failed"; exit 1; }

echo "🚀 Starting Clinical EMR Service..."
exec node dist/main
