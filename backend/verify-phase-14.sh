#!/usr/bin/env bash
set -euo pipefail

npx prisma validate
npx prisma generate
npx tsc --noEmit
node --import tsx --test src/modules/reports/reports.test.ts
node scripts/audit-phase-14.mjs

echo "PHASE 14 VERIFICATION: PASSED"
