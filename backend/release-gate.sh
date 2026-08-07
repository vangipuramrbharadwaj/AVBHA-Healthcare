#!/bin/bash
set -euo pipefail

ROOT="$(pwd)"
LOG_DIR="$ROOT/.release-gate"
SERVER_LOG="$LOG_DIR/server.log"

mkdir -p "$LOG_DIR"

echo "=============================================="
echo " AVBHA Healthcare - Final Backend Release Gate"
echo "=============================================="

echo ""
echo "[1/5] Static verification"
npm run verify:static

echo ""
echo "[2/5] Full discovered unit/module test suite"
npm run test:unit:all

echo ""
echo "[3/5] Starting backend for runtime verification"

SERVER_PID=""

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

if curl -fsS \
  "${E2E_BASE_URL:-http://localhost:4000}/api/v1/live" \
  >/dev/null 2>&1; then
  echo "Existing backend detected; using the running process."
else
  node --import tsx src/server.ts >"$SERVER_LOG" 2>&1 &
  SERVER_PID=$!

  node scripts/wait-for-backend.mjs
fi

echo ""
echo "[4/5] Core HTTP integration suite"
npm run test:integration:core

echo ""
echo "[5/5] Release source audit"
npm run audit:release

echo ""
echo "=============================================="
echo " AVBHA BACKEND RELEASE GATE: PASSED"
echo "=============================================="
echo ""
echo "Optional checks not automatically enabled:"
echo "- authenticated smoke test"
echo "- sequence concurrency test"
echo ""
echo "Enable those separately when valid test credentials"
echo "and development hospital IDs are available."
