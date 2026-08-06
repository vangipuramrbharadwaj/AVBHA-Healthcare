#!/bin/bash
set -euo pipefail

npx prisma format
npx prisma validate
npx prisma generate
npx tsc --noEmit
node --import tsx --test src/modules/operation-theatre/operation-theatre.test.ts

echo "Operation Theatre verification completed successfully."
