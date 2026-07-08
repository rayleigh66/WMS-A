#!/bin/sh
set -e

DB_HOST=$(echo "$DATABASE_URL" | sed -E 's#.*@([^:/]+).*##')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's#.*:([0-9]+)/.*##')

if [ -z "$DB_HOST" ]; then
  DB_HOST="postgres"
fi

if [ -z "$DB_PORT" ]; then
  DB_PORT="5432"
fi

echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."

until pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is ready"

echo "Generating Prisma client..."
npx prisma generate

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Running seed..."
npm run seed

echo "Starting backend..."
exec node dist/main.js
