from pathlib import Path

app_path = Path(__file__).resolve().parents[1] / "src" / "app.ts"
text = app_path.read_text(encoding="utf-8")

old_import = 'import { patientsRouter } from "./modules/patients";'
new_import = '''import {
  patientClinicalRouter,
  patientsRouter,
} from "./modules/patients";'''

if old_import in text:
    text = text.replace(old_import, new_import)

mount = 'app.use("/api/v1/patients", patientClinicalRouter);'
anchor = 'app.use("/api/v1/patients", patientsRouter);'

if mount not in text:
    if anchor not in text:
        raise SystemExit("Patient router mount was not found in src/app.ts")
    text = text.replace(anchor, anchor + "\n" + mount)

app_path.write_text(text, encoding="utf-8")
print(f"Updated {app_path}")
