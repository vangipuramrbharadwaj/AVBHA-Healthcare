#!/bin/bash
set -euo pipefail

npx prisma format
npx prisma validate
npx prisma generate
npx tsc --noEmit
node --import tsx --test src/modules/pharmacy/pharmacy.test.ts

echo "Pharmacy verification completed successfully."
