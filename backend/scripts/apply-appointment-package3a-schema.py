from pathlib import Path
import re

schema_path = Path(__file__).resolve().parents[1] / "prisma" / "schema.prisma"
text = schema_path.read_text(encoding="utf-8")

def update_model(source: str, model_name: str, prefixes: list[str], additions: list[str]) -> str:
    pattern = re.compile(rf"model\s+{re.escape(model_name)}\s*\{{.*?\n\}}", re.S)
    match = pattern.search(source)
    if not match:
        raise SystemExit(f"Model {model_name} was not found")

    lines = []
    for line in match.group(0).splitlines():
        stripped = line.strip()
        if any(stripped.startswith(prefix) for prefix in prefixes):
            continue
        lines.append(line)

    map_index = next(
        (index for index, line in enumerate(lines)
         if line.strip().startswith("@@map(")),
        None,
    )
    if map_index is None:
        raise SystemExit(f"@@map not found in model {model_name}")

    for addition in additions:
        lines.insert(map_index, addition)
        map_index += 1

    updated = "\n".join(lines)
    return source[:match.start()] + updated + source[match.end():]

updates = [
    (
        "Hospital",
        ["appointmentQueues", "appointmentQueueEntries"],
        [
            "  appointmentQueues       AppointmentQueue[]",
            "  appointmentQueueEntries AppointmentQueueEntry[]",
        ],
    ),
    (
        "HospitalBranch",
        ["appointmentQueues", "appointmentQueueEntries"],
        [
            "  appointmentQueues       AppointmentQueue[]",
            "  appointmentQueueEntries AppointmentQueueEntry[]",
        ],
    ),
    (
        "Department",
        ["appointmentQueues", "appointmentQueueEntries"],
        [
            "  appointmentQueues       AppointmentQueue[]",
            "  appointmentQueueEntries AppointmentQueueEntry[]",
        ],
    ),
    (
        "Doctor",
        ["appointmentQueues", "appointmentQueueEntries"],
        [
            "  appointmentQueues       AppointmentQueue[]",
            "  appointmentQueueEntries AppointmentQueueEntry[]",
        ],
    ),
    (
        "Patient",
        ["appointmentQueueEntries"],
        ["  appointmentQueueEntries AppointmentQueueEntry[]"],
    ),
    (
        "Appointment",
        ["queueEntry"],
        ["  queueEntry AppointmentQueueEntry?"],
    ),
]

for model_name, prefixes, additions in updates:
    text = update_model(text, model_name, prefixes, additions)

for enum_name in [
    "QueueStatus",
    "QueueEntryStatus",
    "QueuePriority",
    "QueueSource",
]:
    text = re.sub(
        rf"\nenum\s+{enum_name}\s*\{{.*?\n\}}",
        "",
        text,
        flags=re.S,
    )

for model_name in ["AppointmentQueue", "AppointmentQueueEntry"]:
    text = re.sub(
        rf"\nmodel\s+{model_name}\s*\{{.*?\n\}}",
        "",
        text,
        flags=re.S,
    )

addition = """
enum QueueStatus {
  OPEN
  PAUSED
  CLOSED
}

enum QueueEntryStatus {
  WAITING
  CALLED
  IN_PROGRESS
  HELD
  SKIPPED
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum QueuePriority {
  NORMAL
  PRIORITY
  VIP
  EMERGENCY
}

enum QueueSource {
  APPOINTMENT
  WALK_IN
  EMERGENCY
}

model AppointmentQueue {
  id              String      @id @default(uuid()) @db.Uuid
  hospitalId      String      @map("hospital_id") @db.Uuid
  branchId        String      @map("branch_id") @db.Uuid
  departmentId    String      @map("department_id") @db.Uuid
  doctorId        String      @map("doctor_id") @db.Uuid
  queueDate       DateTime    @map("queue_date") @db.Date
  queueCode       String      @map("queue_code") @db.VarChar(30)
  tokenPrefix     String      @default("A") @map("token_prefix") @db.VarChar(10)
  nextTokenNumber Int         @default(1) @map("next_token_number")
  currentToken    String?     @map("current_token") @db.VarChar(30)
  status          QueueStatus @default(OPEN)
  openedAt        DateTime?   @map("opened_at")
  pausedAt        DateTime?   @map("paused_at")
  closedAt        DateTime?   @map("closed_at")
  createdAt       DateTime    @default(now()) @map("created_at")
  createdBy       String?     @map("created_by") @db.Uuid
  updatedAt       DateTime    @updatedAt @map("updated_at")
  updatedBy       String?     @map("updated_by") @db.Uuid

  hospital   Hospital       @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  branch     HospitalBranch @relation(fields: [branchId], references: [id], onDelete: Restrict)
  department Department     @relation(fields: [departmentId], references: [id], onDelete: Restrict)
  doctor     Doctor         @relation(fields: [doctorId], references: [id], onDelete: Restrict)
  entries    AppointmentQueueEntry[]

  @@unique([hospitalId, branchId, doctorId, queueDate])
  @@index([hospitalId, queueDate])
  @@index([branchId, queueDate])
  @@index([departmentId, queueDate])
  @@index([doctorId, queueDate])
  @@map("appointment_queues")
}

model AppointmentQueueEntry {
  id             String           @id @default(uuid()) @db.Uuid
  hospitalId     String           @map("hospital_id") @db.Uuid
  branchId       String           @map("branch_id") @db.Uuid
  departmentId   String           @map("department_id") @db.Uuid
  doctorId       String           @map("doctor_id") @db.Uuid
  patientId      String           @map("patient_id") @db.Uuid
  appointmentId  String?          @unique @map("appointment_id") @db.Uuid
  queueId        String           @map("queue_id") @db.Uuid
  tokenNumber    Int              @map("token_number")
  tokenCode      String           @map("token_code") @db.VarChar(30)
  priority       QueuePriority    @default(NORMAL)
  source         QueueSource      @default(APPOINTMENT)
  status         QueueEntryStatus @default(WAITING)
  checkInAt      DateTime         @default(now()) @map("check_in_at")
  calledAt       DateTime?        @map("called_at")
  startedAt      DateTime?        @map("started_at")
  completedAt    DateTime?        @map("completed_at")
  heldAt         DateTime?        @map("held_at")
  skippedAt      DateTime?        @map("skipped_at")
  cancelledAt    DateTime?        @map("cancelled_at")
  notes          String?
  createdAt      DateTime         @default(now()) @map("created_at")
  createdBy      String?          @map("created_by") @db.Uuid
  updatedAt      DateTime         @updatedAt @map("updated_at")
  updatedBy      String?          @map("updated_by") @db.Uuid

  hospital    Hospital         @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  branch      HospitalBranch   @relation(fields: [branchId], references: [id], onDelete: Restrict)
  department  Department       @relation(fields: [departmentId], references: [id], onDelete: Restrict)
  doctor      Doctor           @relation(fields: [doctorId], references: [id], onDelete: Restrict)
  patient     Patient          @relation(fields: [patientId], references: [id], onDelete: Restrict)
  appointment Appointment?     @relation(fields: [appointmentId], references: [id], onDelete: SetNull)
  queue       AppointmentQueue @relation(fields: [queueId], references: [id], onDelete: Cascade)

  @@unique([queueId, tokenNumber])
  @@unique([queueId, tokenCode])
  @@index([hospitalId, checkInAt])
  @@index([queueId, status])
  @@index([doctorId, checkInAt])
  @@index([patientId, checkInAt])
  @@index([priority, status])
  @@map("appointment_queue_entries")
}
"""

schema_path.write_text(
    text.rstrip() + "\n\n" + addition.strip() + "\n",
    encoding="utf-8",
)

print("Appointment Package 3A schema applied successfully")
