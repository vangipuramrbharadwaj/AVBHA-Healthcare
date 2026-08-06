from pathlib import Path
import re

app_path = Path(__file__).resolve().parents[1] / "src" / "app.ts"
text = app_path.read_text(encoding="utf-8")

import_line = 'import { appointmentsRouter } from "./modules/appointments";'
if import_line not in text:
    patient_import = re.search(
        r'import\s*\{[^}]*patientsRouter[^}]*\}\s*from\s*"\./modules/patients";',
        text,
        flags=re.S,
    )
    if not patient_import:
        raise SystemExit("Patient module import was not found in src/app.ts")
    text = text[:patient_import.start()] + import_line + "\n" + text[patient_import.start():]

mount = 'app.use("/api/v1/appointments", appointmentsRouter);'
if mount not in text:
    anchor = 'app.use("/api/v1/patients", patientsRouter);'
    if anchor not in text:
        raise SystemExit("Patients router mount was not found in src/app.ts")
    text = text.replace(anchor, anchor + "\n" + mount)

app_path.write_text(text, encoding="utf-8")
print("Appointment Package 1 app route applied successfully")
