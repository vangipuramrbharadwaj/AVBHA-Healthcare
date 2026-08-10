#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: npm run db:restore -- /full/path/to/backup.dump"
  exit 1
fi

BACKUP_FILE="$1"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "ERROR: Backup file does not exist: $BACKUP_FILE"
  exit 1
fi

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

if ! command -v pg_restore >/dev/null 2>&1; then
  echo "ERROR: pg_restore is not available in PATH."
  exit 1
fi

echo "WARNING: This restores data into the database configured in DATABASE_URL."
read -r -p "Type RESTORE to continue: " confirmation

if [[ "$confirmation" != "RESTORE" ]]; then
  echo "Restore cancelled."
  exit 1
fi

pg_restore \
  --dbname="$DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  "$BACKUP_FILE"

echo "Database restore completed."
