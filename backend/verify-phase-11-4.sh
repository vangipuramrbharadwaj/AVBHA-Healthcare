#!/bin/bash
set -euo pipefail

npx prisma validate
npx prisma generate
npx tsc --noEmit

node --import tsx --test \
  src/modules/system-health/system-health.test.ts

node scripts/audit-phase-11-4.mjs

echo "Phase 11.4 verification completed successfully."
