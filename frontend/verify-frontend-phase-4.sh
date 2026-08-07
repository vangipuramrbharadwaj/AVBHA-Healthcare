#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "===== AVBHA FRONTEND PHASE 4 VERIFICATION ====="

echo "1/4 Checking files"
test -f src/pages/AppointmentsPage.tsx
test -f src/api/appointments.api.ts
test -f src/styles/phase4-appointments.css

echo "2/4 Checking route"
grep -q "AppointmentsPage" src/routing/AppRouter.tsx

echo "3/4 Typecheck"
npm run typecheck

echo "4/4 Production build"
npm run build

echo ""
echo "FRONTEND PHASE 4 VERIFICATION: PASSED"
