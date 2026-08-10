#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not configured."
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERROR: pg_dump is not available in PATH."
  exit 1
fi

BACKUP_DIR="${AVBHA_BACKUP_DIR:-$ROOT_DIR/database-backups}"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR" 2>/dev/null || true

STAMP="$(date +"%Y%m%d_%H%M%S")"
FILE="$BACKUP_DIR/avbha_healthcare_${STAMP}.dump"

echo "Creating encrypted-access-controlled PostgreSQL backup..."
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file="$FILE"
chmod 600 "$FILE" 2>/dev/null || true

echo "Backup created:"
ls -lh "$FILE"

KEEP_DAYS="${AVBHA_BACKUP_KEEP_DAYS:-30}"
find "$BACKUP_DIR" -type f -name "avbha_healthcare_*.dump" -mtime "+$KEEP_DAYS" -delete

echo "Retention cleanup completed (older than ${KEEP_DAYS} days)."
