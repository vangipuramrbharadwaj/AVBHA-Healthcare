from pathlib import Path

routes_path = (
    Path(__file__).resolve().parents[1]
    / "src"
    / "modules"
    / "appointments"
    / "appointments.routes.ts"
)

text = routes_path.read_text(encoding="utf-8")

import_line = (
    'import { appointmentQueueActionsRouter } '
    'from "./appointment-queue-actions.routes";'
)

if import_line not in text:
    anchor = 'import { appointmentQueueRouter } from "./appointment-queue.routes";'
    if anchor in text:
        text = text.replace(anchor, anchor + "\n" + import_line)
    else:
        text = import_line + "\n" + text

mount = "appointmentsRouter.use(appointmentQueueActionsRouter);"

if mount not in text:
    anchor = "appointmentsRouter.use(appointmentQueueRouter);"
    if anchor in text:
        text = text.replace(anchor, anchor + "\n" + mount)
    else:
        marker = "appointmentsRouter.use(authenticate, enforceTenant);"
        text = text.replace(marker, marker + "\n" + mount)

routes_path.write_text(text, encoding="utf-8")
print("Appointment Package 3B routes applied successfully")
