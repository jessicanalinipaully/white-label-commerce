#!/usr/bin/env bash

# Safe PostgreSQL Database Backup Script
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

BACKUP_DIR="${ROOT_DIR}/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/commerce_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "Starting PostgreSQL backup..."

# Load environment variables if .env.production exists
if [ -f ".env.production" ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

DB_USER="${POSTGRES_USER:-commerce_user}"
DB_NAME="${POSTGRES_DB:-commerce_prod}"
CONTAINER_NAME="commerce_prod_postgres"

# Execute pg_dump inside container and compress output
docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"

echo "Database backup created successfully:"
echo "Location: ${BACKUP_FILE}"
echo "Size: $(du -h "${BACKUP_FILE}" | cut -f1)"
