#!/usr/bin/env bash
set -euo pipefail

npx prisma validate
npx prisma generate
npx tsc --noEmit
node --import tsx --test src/modules/communications/communications.test.ts
node scripts/audit-phase-13.mjs

echo "PHASE 13 VERIFICATION: PASSED"
