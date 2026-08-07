#!/usr/bin/env bash
set -euo pipefail

echo "=== AVBHA Frontend Phase 2 Verification ==="
npm run typecheck
npm run build

for file in   src/api/patients.api.ts   src/pages/PatientsPage.tsx   src/pages/PatientCreatePage.tsx   src/pages/PatientDetailPage.tsx   src/pages/PatientEditPage.tsx   src/components/PatientForm.tsx   src/components/PatientClinicalPanel.tsx
do
  test -s "$file" || { echo "Missing or empty: $file"; exit 1; }
done

grep -q 'path="patients/new"' src/routing/AppRouter.tsx
grep -q 'path="patients/:id"' src/routing/AppRouter.tsx

echo "FRONTEND PHASE 2 VERIFICATION: PASSED"
