#!/bin/bash
set -euo pipefail

npx prisma format
npx prisma validate
npx prisma generate
npx tsc --noEmit
node --import tsx --test src/shared/sequences/document-sequence.test.ts

echo "Document sequence engine verification completed successfully."
