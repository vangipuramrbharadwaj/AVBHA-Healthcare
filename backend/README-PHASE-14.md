# AVBHA Healthcare — Phase 14 Reports, Analytics & MIS Engine

This package was built against the uploaded backend after Phase 13. The existing Reports module was empty scaffolding, and `reports.view`, `reports.export`, and `reports.print` are already part of the permission seed, so **no Prisma schema change or database migration is required** for Phase 14.

## Files edited/added only
- `src/modules/reports/*` — fills the existing empty reports module
- `scripts/apply-phase-14-app.mjs` — mounts the router
- `scripts/audit-phase-14.mjs`
- `verify-phase-14.sh`

## Functional reports
- MIS Overview
- Daily MIS
- Patient Registration
- Appointment Analytics
- OPD Analytics
- IPD Analytics + average length of stay
- Revenue / Collections / Outstanding
- Laboratory Analytics
- Radiology Analytics
- Pharmacy Revenue Analytics
- Inventory Value / Expiry / Pending Materials
- Doctor Performance

All queries are hospital-scoped. If the authenticated user has a branch in the access token, requests cannot override that branch.

## Install
From `backend`:

```bash
node scripts/apply-phase-14-app.mjs
npx prisma validate
npx prisma generate
npx tsc --noEmit
node --import tsx --test src/modules/reports/reports.test.ts
node scripts/audit-phase-14.mjs
```

Or:

```bash
chmod +x verify-phase-14.sh
./verify-phase-14.sh
```

Then:

```bash
npm run dev
```

## API base
`/api/v1/reports`

Most reports require `from` and `to`, for example:
`/api/v1/reports/overview?from=2026-08-01&to=2026-08-07`

Optional filters where supported: `branchId`, `departmentId`, `doctorId`.
