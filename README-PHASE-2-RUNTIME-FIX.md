# AVBHA Healthcare — Frontend Phase 2 Runtime Fix

This package fixes the three runtime gaps found during local validation.

## Included fixes

1. Patient status filter
   - Fixes PostgreSQL `RecordStatus` comparison for Active / Inactive / Archived.

2. Emergency contact on Edit Patient
   - Existing primary emergency contact is loaded into the Edit form.
   - Edit Patient can update the primary emergency contact.
   - Backend performs a non-destructive primary-contact upsert.
   - Other existing emergency contacts are not deleted.

3. Family tab
   - Adds **+ Add**.
   - Search an existing patient by UHID / name / mobile / email.
   - Create family relationship.
   - Edit relationship type, emergency-contact flag, primary-contact flag and notes.
   - Archive family relationship.
   - Uses the already-existing Phase 3 backend family APIs and patient RBAC permissions.

## Install

Extract from the project root:

```bash
cd /Users/vangipuramrbharadwaj/Projects/AVBHA-Healthcare
unzip -o ~/Downloads/AVBHA-Healthcare-Frontend-Phase-2-Runtime-Fix.zip -d .
```

Then run:

```bash
chmod +x verify-phase-2-runtime-fix.sh
./verify-phase-2-runtime-fix.sh
```

If verification passes, start backend and frontend in separate terminals:

Backend:
```bash
cd /Users/vangipuramrbharadwaj/Projects/AVBHA-Healthcare/backend
npm run dev
```

Frontend:
```bash
cd /Users/vangipuramrbharadwaj/Projects/AVBHA-Healthcare/frontend
npm run dev
```

## Runtime tests

- Patients → Status filter → Active / Inactive / Archived
- Patient → Edit → change emergency contact → Save → reopen Edit
- Patient → Family → Add → search/select related existing patient → Save
- Family → Edit
- Family → Archive
