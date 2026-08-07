#!/bin/bash
set -euo pipefail

npx prisma validate
npx prisma generate
npx tsc --noEmit

node --import tsx --test \
  src/shared/sequences/document-sequence.test.ts \
  src/shared/sequences/document-number.presets.test.ts

node scripts/verify-number-generator-replacements.mjs

node --import tsx --test src/modules/patients/patients.test.ts
node --import tsx --test src/modules/appointments/appointments.test.ts
node --import tsx --test src/modules/opd/opd.test.ts
node --import tsx --test src/modules/ipd/ipd.test.ts
node --import tsx --test src/modules/laboratory/laboratory.test.ts
node --import tsx --test src/modules/radiology/radiology.test.ts
node --import tsx --test src/modules/pharmacy/pharmacy.test.ts
node --import tsx --test src/modules/billing/billing.test.ts
node --import tsx --test src/modules/operation-theatre/operation-theatre.test.ts

echo "Phase 11.2B verification completed successfully."
