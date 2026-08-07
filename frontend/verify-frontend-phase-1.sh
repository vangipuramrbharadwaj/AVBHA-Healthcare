#!/usr/bin/env bash
set -euo pipefail
npm run typecheck
npm run build
echo "AVBHA FRONTEND PHASE 1 VERIFICATION: PASSED"
