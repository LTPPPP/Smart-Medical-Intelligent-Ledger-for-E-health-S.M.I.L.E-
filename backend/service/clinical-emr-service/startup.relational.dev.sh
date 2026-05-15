#!/usr/bin/env bash
set -e

# Generate .env from Docker environment variables for env-cmd
echo "📝 Generating .env from environment..."
env | grep -E '^(DATABASE_|CLINIC_DATABASE_|APP_|API_|MAIL_|NODE_)' | sort > /usr/src/app/.env
echo "   Generated $(wc -l < /usr/src/app/.env) variables"

echo "⏳ Waiting for PostgreSQL..."
/opt/wait-for-it.sh postgres:5432 -t 60

echo "🔄 Running medical-db migrations..."
npm run migration:run

echo "🔄 Running clinic-db migrations..."
npm run migration:run:clinic

echo "🌱 Running medical-db seeds..."
npm run seed:run:relational

echo "🌱 Running clinic-db seeds..."
npm run seed:run:clinic

echo "🚀 Starting Clinical EMR Service..."
npm run start:prod
