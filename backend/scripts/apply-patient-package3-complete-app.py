from pathlib import Path
import re

app_path = Path(__file__).resolve().parents[1] / "src" / "app.ts"
text = app_path.read_text(encoding="utf-8")

pattern = re.compile(
    r'import\s*\{[^}]*patientsRouter[^}]*\}\s*from\s*"\./modules/patients";',
    re.S,
)
replacement = '''import {
  patientAdvancedRouter,
  patientClinicalRouter,
  patientMergeRouter,
  patientsRouter,
} from "./modules/patients";'''

if not pattern.search(text):
    raise SystemExit("Patient import block was not found in src/app.ts")

text = pattern.sub(replacement, text, count=1)

mounts = [
    'app.use("/api/v1/patients", patientsRouter);',
    'app.use("/api/v1/patients", patientClinicalRouter);',
    'app.use("/api/v1/patients", patientAdvancedRouter);',
    'app.use("/api/v1/patients", patientMergeRouter);',
]

for mount in mounts:
    while text.count(mount) > 1:
        text = text.replace(mount, "", 1)

base_mount = mounts[0]
if base_mount not in text:
    raise SystemExit("Base patients router mount was not found")

for mount in mounts[1:]:
    text = text.replace(mount, "")

text = text.replace(base_mount, "\n".join(mounts))
text = re.sub(r"\n{3,}", "\n\n", text)

app_path.write_text(text, encoding="utf-8")
print("Patient Package 3 app routes applied successfully")
