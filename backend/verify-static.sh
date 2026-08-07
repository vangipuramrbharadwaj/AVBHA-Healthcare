#!/bin/bash
set -euo pipefail

echo "=== AVBHA Phase 11.6 Static Verification ==="

npx prisma format
npx prisma validate
npx prisma generate
npx tsc --noEmit
node scripts/audit-release-gate.mjs

echo "Static verification passed."
