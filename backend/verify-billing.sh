#!/bin/bash
set -euo pipefail

npx prisma format
npx prisma validate
npx prisma generate
npx tsc --noEmit
node --import tsx --test src/modules/billing/billing.test.ts

echo "Billing verification completed successfully."
