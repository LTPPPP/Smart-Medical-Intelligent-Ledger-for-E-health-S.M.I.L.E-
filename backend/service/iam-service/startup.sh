#!/usr/bin/env bash
set -e

# Generate .env from Docker environment variables for env-cmd
echo "📝 Generating .env from environment..."
env | grep -E '^(DATABASE_|USER_DATABASE_|AUTH_|APP_|MAIL_|NODE_)' | sort > /usr/src/app/.env
echo "   Generated $(wc -l < /usr/src/app/.env) variables"

echo "⏳ Waiting for PostgreSQL..."
/opt/wait-for-it.sh postgres:5432 -t 60

echo "🔄 Running auth-db migrations..."
npm run migration:run

echo "🔄 Running user-db migrations..."
npm run migration:run:user

echo "🌱 Running auth-db seeds..."
npm run seed:run:relational

echo "🌱 Running user-db seeds..."
npm run seed:run:user

echo "🚀 Starting IAM Service..."
npm run start:prod
