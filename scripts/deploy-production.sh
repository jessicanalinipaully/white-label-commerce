#!/usr/bin/env bash

# Safe Non-Destructive Production Deployment Script
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

echo "=================================================="
echo " Starting White-Label Commerce Production Deployment "
echo "=================================================="

# 1. Ensure .env.production exists
if [ ! -f ".env.production" ]; then
    echo "ERROR: .env.production file not found!"
    echo "Please copy .env.production.example to .env.production and configure your secrets."
    exit 1
fi

# Load production environment variables
export $(grep -v '^#' .env.production | xargs)

# 2. Start PostgreSQL and Redis containers
echo "[1/5] Starting database & Redis infrastructure..."
docker compose -f docker-compose.production.yml up -d postgres redis

# 3. Wait for PostgreSQL to become healthy
echo "[2/5] Waiting for PostgreSQL readiness..."
RETRIES=30
until docker exec commerce_prod_postgres pg_isready -U "${POSTGRES_USER:-commerce_user}" -d "${POSTGRES_DB:-commerce_prod}" > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    echo "Waiting for database connection... ($RETRIES attempts remaining)"
    sleep 2
    RETRIES=$((RETRIES-1))
done

if [ $RETRIES -eq 0 ]; then
    echo "ERROR: PostgreSQL failed to start within expected time."
    exit 1
fi

echo "PostgreSQL is healthy and accepting connections."

# 4. Safely apply Prisma database migrations (NON-DESTRUCTIVE)
echo "[3/5] Applying Prisma database migrations (prisma migrate deploy)..."
pnpm --filter @commerce/database db:deploy || npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

# 5. Build and start API & Web production containers
echo "[4/5] Building & starting production API and Web containers..."
docker compose -f docker-compose.production.yml up -d --build api web

# 6. Verify health endpoint
echo "[5/5] Verifying API Health Check..."
sleep 5
HEALTH_STATUS=$(curl -s http://127.0.0.1:4000/api/health || echo "FAILED")

echo "Health Response: ${HEALTH_STATUS}"

if [[ "${HEALTH_STATUS}" == *"status\":\"ok"* ]]; then
    echo "=================================================="
    echo " DEPLOYMENT SUCCESSFUL! All services healthy.    "
    echo "=================================================="
else
    echo "WARNING: Health check did not return expected 'ok' status. Please check container logs with:"
    echo "docker compose -f docker-compose.production.yml logs"
fi
