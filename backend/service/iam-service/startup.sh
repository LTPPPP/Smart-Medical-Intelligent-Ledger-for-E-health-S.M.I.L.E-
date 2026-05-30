#!/bin/bash
set -e

# Generate .env from container environment variables
echo "📝 Generating .env from environment..."
env | grep -E '^(APP_|DATABASE_|USER_DATABASE_|AUTH_|MAIL_|NODE_ENV|GOOGLE_|FACEBOOK_|APPLE_)' > /usr/src/app/.env || true
echo "   Generated $(wc -l < /usr/src/app/.env) variables"

echo "⏳ Waiting for PostgreSQL..."
/opt/wait-for-it.sh "${DATABASE_HOST:-postgres}:${DATABASE_PORT:-5432}" -t 60
echo "✅ PostgreSQL is ready!"

echo "🔄 Running IAM database migrations..."
npm run migration:run || { echo "❌ IAM migration failed"; exit 1; }

echo "🔄 Running User database migrations..."
npm run migration:run:user || { echo "❌ User migration failed"; exit 1; }

echo "🚀 Starting IAM Service..."
exec node dist/main
