#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "===== AVBHA DOCTOR MANAGEMENT FIX VERIFICATION ====="

echo "[1/5] Apply integration"
node scripts/apply-doctor-management-fix.mjs

echo "[2/5] Prisma validation/generation"
cd backend
npx prisma validate
npx prisma generate

echo "[3/5] Backend TypeScript"
npx tsc --noEmit

echo "[4/5] Frontend TypeScript"
cd ../frontend
npm run typecheck

echo "[5/5] Frontend build"
npm run build

echo ""
echo "DOCTOR MANAGEMENT FIX VERIFICATION: PASSED"
