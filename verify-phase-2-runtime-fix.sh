#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=============================================="
echo " AVBHA Healthcare - Frontend Phase 2 Runtime Fix"
echo "=============================================="

echo "[1/4] Apply backend runtime fixes"
cd "$ROOT/backend"
node scripts/apply-frontend-phase-2-runtime-fixes.mjs

echo "[2/4] Backend static verification"
npx prisma validate
npx prisma generate
npx tsc --noEmit

echo "[3/4] Frontend typecheck"
cd "$ROOT/frontend"
npm run typecheck

echo "[4/4] Frontend production build"
npm run build

echo ""
echo "PHASE 2 RUNTIME FIX VERIFICATION: PASSED"
