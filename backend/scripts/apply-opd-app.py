from pathlib import Path

app_path = Path(__file__).resolve().parents[1] / "src" / "app.ts"
text = app_path.read_text(encoding="utf-8")

import_line = 'import { opdRouter } from "./modules/opd";'
if import_line not in text:
    text = import_line + "\n" + text

mount = 'app.use("/api/v1/opd", opdRouter);'
if mount not in text:
    anchor = 'app.use("/api/v1/appointments", appointmentsRouter);'
    if anchor not in text:
        raise SystemExit("Appointments route was not found in src/app.ts")
    text = text.replace(anchor, anchor + "\n" + mount)

app_path.write_text(text, encoding="utf-8")
print("OPD route applied successfully")
