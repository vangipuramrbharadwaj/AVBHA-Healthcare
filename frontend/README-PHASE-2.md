# AVBHA Healthcare — Frontend Phase 2

## Scope
- Existing Phase 1 authentication, layout, routing and RBAC retained
- Live dashboard retained
- Real patient list connected to `GET /api/v1/patients`
- Search/filter/pagination
- Permission-aware patient registration
- Automatic backend UHID generation
- Duplicate warning check
- Patient detail/profile
- Patient edit
- Demographics/contact/address/emergency contact display
- Insurance
- Allergies
- Chronic diseases
- Medical history
- Patient documents metadata
- Patient alerts and acknowledge action
- Family relationships display
- Patient identifiers display
- Patient timeline display
- Responsive desktop/tablet/mobile UI
- Existing AVBHA blue/white/Verdana design

## Important
The backend currently accepts patient document metadata (`filePath`) rather than multipart binary upload.
This frontend therefore records document metadata/path only. Actual secure binary upload should be implemented
when Backend Phase 16 (Document, File & Attachment Management) is completed.

## Install
Extract this package into the AVBHA project root. It contains a complete `frontend/` folder.

```bash
cd /Users/vangipuramrbharadwaj/Projects/AVBHA-Healthcare/frontend
cp .env.example .env
npm install
npm run typecheck
npm run build
```

Backend terminal:
```bash
cd /Users/vangipuramrbharadwaj/Projects/AVBHA-Healthcare/backend
npm run dev
```

Frontend terminal:
```bash
cd /Users/vangipuramrbharadwaj/Projects/AVBHA-Healthcare/frontend
npm run dev
```

Open: http://localhost:5173

## Phase 2 validation
1. Login as admin
2. Dashboard opens
3. Patients menu opens real list
4. Register a test patient
5. Open patient profile
6. Edit patient
7. Add allergy / chronic disease / insurance / medical history / alert
8. Confirm timeline and profile tabs load
9. Test with a role lacking `patients.create` or `patients.update`
