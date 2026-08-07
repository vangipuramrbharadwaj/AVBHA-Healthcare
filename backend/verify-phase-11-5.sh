#!/bin/bash
set -euo pipefail

npx prisma validate
npx prisma generate
npx tsc --noEmit

node scripts/audit-phase-11-5.mjs

npm run test:integration:core

echo "Phase 11.5 core integration verification completed successfully."
echo "Optional authenticated/concurrency tests can be enabled with E2E environment variables."
