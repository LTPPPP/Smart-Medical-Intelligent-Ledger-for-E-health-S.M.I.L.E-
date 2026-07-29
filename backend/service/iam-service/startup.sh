#!/bin/bash
set -e

# Generate .env from container environment variables
echo "📝 Generating .env from environment..."
env | grep -E '^(APP_|DATABASE_|USER_DATABASE_|AUTH_|MAIL_|KYC_|NODE_ENV|GOOGLE_|FACEBOOK_|APPLE_)' > /app/.env || true
echo "   Generated $(wc -l < /app/.env) variables"

echo "⏳ Waiting for PostgreSQL..."
/opt/wait-for-it.sh "${DATABASE_HOST:-postgres}:${DATABASE_PORT:-5432}" -t 60
echo "✅ PostgreSQL is ready!"

echo "🔄 Running IAM database migrations..."
bun ./node_modules/typeorm/cli.js -d src/database/data-source.ts migration:run || { echo "❌ IAM migration failed"; exit 1; }

echo "🔄 Running User database migrations..."
bun ./node_modules/typeorm/cli.js -d src/database/user-data-source.ts migration:run || { echo "❌ User migration failed"; exit 1; }

echo "🚀 Starting IAM Service..."
if [ ! -e /app/node_modules/@auth ] && [ ! -L /app/node_modules/@auth ]; then
  ln -s /app/dist /app/node_modules/@auth
fi
exec bun run dist/main.js
