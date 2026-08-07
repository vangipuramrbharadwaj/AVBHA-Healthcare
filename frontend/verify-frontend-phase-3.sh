#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "===== AVBHA FRONTEND PHASE 3 VERIFICATION ====="
echo "1/4 Checking Phase 3 files..."
test -f src/pages/ReceptionOpdPage.tsx
test -f src/api/reception-opd.api.ts
test -f src/types/reception-opd.ts
test -f src/styles/phase3-reception-opd.css

echo "2/4 Checking route reference..."
grep -Rqs "ReceptionOpdPage" src/routing src/router src/App.tsx 2>/dev/null || {
  echo "Reception route not installed."
  echo "Run: node scripts/apply-phase-3-routing.mjs"
  exit 1
}

echo "3/4 Type checking..."
npm run typecheck

echo "4/4 Production build..."
npm run build

echo ""
echo "PHASE 3 FRONTEND VERIFICATION: PASSED"
