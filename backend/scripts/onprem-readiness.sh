#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

failures=0

check_command() {
  local command_name="$1"
  if command -v "$command_name" >/dev/null 2>&1; then
    echo "OK    $command_name -> $(command -v "$command_name")"
  else
    echo "FAIL  $command_name not found"
    failures=$((failures + 1))
  fi
}

echo "AVBHA Healthcare - On-Prem Readiness"
echo "------------------------------------"

check_command node
check_command npm
check_command psql
check_command pg_dump
check_command pg_restore

if [[ -f ".env" ]]; then
  echo "OK    backend/.env exists"
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
else
  echo "FAIL  backend/.env is missing"
  failures=$((failures + 1))
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "OK    DATABASE_URL configured"
else
  echo "FAIL  DATABASE_URL not configured"
  failures=$((failures + 1))
fi

if [[ -n "${JWT_SECRET:-}" && "${#JWT_SECRET}" -ge 32 ]]; then
  echo "OK    JWT_SECRET configured"
else
  echo "WARN  JWT_SECRET missing or shorter than 32 characters"
fi

if [[ "$failures" -gt 0 ]]; then
  echo "Readiness failed with $failures required check(s)."
  exit 1
fi

echo "Core on-prem prerequisites are available."
