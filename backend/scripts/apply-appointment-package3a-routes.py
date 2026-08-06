from pathlib import Path

routes_path = (
    Path(__file__).resolve().parents[1]
    / "src"
    / "modules"
    / "appointments"
    / "appointments.routes.ts"
)

text = routes_path.read_text(encoding="utf-8")

import_line = 'import { appointmentQueueRouter } from "./appointment-queue.routes";'
if import_line not in text:
    anchor = 'import { appointmentScheduleRouter } from "./appointment-schedule.routes";'
    text = text.replace(anchor, anchor + "\n" + import_line) if anchor in text else import_line + "\n" + text

mount = "appointmentsRouter.use(appointmentQueueRouter);"
if mount not in text:
    anchor = "appointmentsRouter.use(appointmentScheduleRouter);"
    text = text.replace(anchor, anchor + "\n" + mount) if anchor in text else text

routes_path.write_text(text, encoding="utf-8")
print("Appointment Package 3A routes applied successfully")
