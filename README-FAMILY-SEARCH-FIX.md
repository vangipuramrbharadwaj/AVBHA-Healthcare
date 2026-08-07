# AVBHA Healthcare — Phase 2 Family Search Fix

This patch fixes the Family relationship popup:

- Uses the normal patient list/search API instead of the duplicate-patient endpoint.
- Search works by UHID, name, mobile, or email.
- Search results must be selected before saving.
- Excludes the current patient from search results.
- Limits search to ACTIVE patients.
- Relationship is now a dropdown instead of free text.

Install from project root:

```bash
cd /Users/vangipuramrbharadwaj/Projects/AVBHA-Healthcare
unzip -o ~/Downloads/AVBHA-Healthcare-Frontend-Phase-2-Family-Search-Fix.zip -d .
```

Then:

```bash
cd frontend
npm run typecheck
npm run build
```

Runtime test:
1. Open a patient.
2. Family → Add.
3. Type part of another patient's name, UHID, mobile or email.
4. Click the returned patient result.
5. Select relationship.
6. Save.
