# AVBHA Healthcare - Doctor Management

This package contains only new/modified Doctor Management files.

## Install
Extract this ZIP over the AVBHA-Healthcare project root.

Then run:

```bash
cd /Users/vangipuramrbharadwaj/Projects/AVBHA-Healthcare
chmod +x verify-doctor-management.sh
./verify-doctor-management.sh
```

## What it adds
- Backend `/api/v1/doctors` list/create/get/update
- Tenant isolation using `hospitalId`
- Doctor profile linked to an existing active employee
- Frontend Doctor Management page
- `/doctors` frontend route
- Reuses existing employee permissions so no permission migration is required

## Important schema expectation
The backend is written against the existing AVBHA `doctors` table fields discussed in the project:
doctor_code, registration_number, registration_council, qualification,
specialization, consultation_fee, follow_up_fee, emergency_fee,
average_consultation_minutes, is_visiting_consultant, status,
created_by, updated_by.

If your current Prisma Doctor model uses a different physical column name, the backend build can still pass because the repository uses parameterized raw SQL, but runtime verification will reveal the mismatch immediately.

## Test
1. Start backend.
2. Start frontend.
3. Open `/doctors`.
4. Click `+ Add Doctor`.
5. Select an existing active employee.
6. Save the doctor.
7. Return to Appointments and Reception/OPD and verify the doctor dropdown.
