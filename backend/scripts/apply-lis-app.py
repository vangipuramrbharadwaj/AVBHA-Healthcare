from pathlib import Path

app_path = Path(__file__).resolve().parents[1] / "src" / "app.ts"
text = app_path.read_text(encoding="utf-8")

import_line = 'import { laboratoryRouter } from "./modules/laboratory";'
if import_line not in text:
    text = import_line + "\n" + text

mount = 'app.use("/api/v1/laboratory", laboratoryRouter);'
if mount not in text:
    anchor = 'app.use("/api/v1/ipd", ipdRouter);'
    if anchor not in text:
        raise SystemExit("IPD route mount was not found in src/app.ts")
    text = text.replace(anchor, anchor + "\n" + mount)

app_path.write_text(text, encoding="utf-8")
print("LIS application route applied successfully")
