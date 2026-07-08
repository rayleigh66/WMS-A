#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:/]*\).*/\1/p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')

until pg_isready -h "$DB_HOST" -U "$DB_USER" > /dev/null 2>&1; do
  echo "PostgreSQL not ready yet, retrying in 2s..."
  sleep 2
done
echo "PostgreSQL is ready."

echo "Running Prisma generate..."
npx prisma generate

# Try migrate deploy first; if no migrations exist, use db push
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
  echo "Running Prisma migrate deploy..."
  npx prisma migrate deploy
else
  echo "No migrations found, running prisma db push..."
  npx prisma db push
fi

echo "Running seed..."
npm run seed

echo "Starting server..."
exec node dist/main.js
