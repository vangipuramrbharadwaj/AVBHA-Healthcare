#!/bin/bash
set -euo pipefail

npx prisma format
npx prisma validate
npx prisma generate
npx tsc --noEmit

node --import tsx --test src/modules/inventory/inventory.test.ts
node scripts/audit-phase-12.mjs

echo "Phase 12 Central Inventory verification completed successfully."
