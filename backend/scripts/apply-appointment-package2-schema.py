from pathlib import Path
import re

schema_path = Path(__file__).resolve().parents[1] / "prisma" / "schema.prisma"
text = schema_path.read_text(encoding="utf-8")

def add_relation(model_name: str, relation_line: str, prefixes: list[str]) -> None:
    global text
    pattern = re.compile(rf"model\s+{re.escape(model_name)}\s*\{{.*?\n\}}", re.S)
    match = pattern.search(text)
    if not match:
        raise SystemExit(f"Model {model_name} was not found")
    lines = []
    for line in match.group(0).splitlines():
        stripped = line.strip()
        if any(stripped.startswith(prefix) for prefix in prefixes):
            continue
        lines.append(line)
    map_index = next(
        (i for i, line in enumerate(lines) if line.strip().startswith("@@map(")),
        None,
    )
    if map_index is None:
        raise SystemExit(f"@@map not found in {model_name}")
    lines.insert(map_index, relation_line)
    updated = "\n".join(lines)
    text = text[:match.start()] + updated + text[match.end():]

add_relation("Hospital", "  doctorSchedules DoctorSchedule[]", ["doctorSchedules"])
add_relation("HospitalBranch", "  doctorSchedules DoctorSchedule[]", ["doctorSchedules"])
add_relation(
    "Doctor",
    "  schedules DoctorSchedule[]\n  scheduleHolidays DoctorScheduleHoliday[]\n  slotLocks AppointmentSlotLock[]",
    ["schedules", "scheduleHolidays", "slotLocks"],
)

models = '''
model DoctorSchedule {
  id              String       @id @default(uuid()) @db.Uuid
  hospitalId      String       @map("hospital_id") @db.Uuid
  branchId        String       @map("branch_id") @db.Uuid
  doctorId        String       @map("doctor_id") @db.Uuid
  dayOfWeek       Int          @map("day_of_week")
  startTime       String       @map("start_time") @db.VarChar(5)
  endTime         String       @map("end_time") @db.VarChar(5)
  slotDuration    Int          @default(15) @map("slot_duration")
  maxAppointments Int?         @map("max_appointments")
  effectiveFrom   DateTime     @map("effective_from") @db.Date
  effectiveTo     DateTime?    @map("effective_to") @db.Date
  status          RecordStatus @default(ACTIVE)
  createdAt       DateTime     @default(now()) @map("created_at")
  createdBy       String?      @map("created_by") @db.Uuid
  updatedAt       DateTime     @updatedAt @map("updated_at")
  updatedBy       String?      @map("updated_by") @db.Uuid
  deletedAt       DateTime?    @map("deleted_at")

  hospital Hospital       @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  branch   HospitalBranch @relation(fields: [branchId], references: [id], onDelete: Restrict)
  doctor   Doctor         @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  breaks   DoctorScheduleBreak[]

  @@unique([hospitalId, branchId, doctorId, dayOfWeek, startTime, effectiveFrom])
  @@index([hospitalId])
  @@index([branchId])
  @@index([doctorId, dayOfWeek])
  @@map("doctor_schedules")
}

model DoctorScheduleBreak {
  id         String       @id @default(uuid()) @db.Uuid
  hospitalId String       @map("hospital_id") @db.Uuid
  doctorId   String       @map("doctor_id") @db.Uuid
  scheduleId String       @map("schedule_id") @db.Uuid
  breakName  String       @map("break_name") @db.VarChar(100)
  startTime  String       @map("start_time") @db.VarChar(5)
  endTime    String       @map("end_time") @db.VarChar(5)
  status     RecordStatus @default(ACTIVE)
  createdAt  DateTime     @default(now()) @map("created_at")
  createdBy  String?      @map("created_by") @db.Uuid
  updatedAt  DateTime     @updatedAt @map("updated_at")
  updatedBy  String?      @map("updated_by") @db.Uuid
  deletedAt  DateTime?    @map("deleted_at")

  schedule DoctorSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([doctorId])
  @@index([scheduleId])
  @@map("doctor_schedule_breaks")
}

model DoctorScheduleHoliday {
  id          String       @id @default(uuid()) @db.Uuid
  hospitalId  String       @map("hospital_id") @db.Uuid
  branchId    String       @map("branch_id") @db.Uuid
  doctorId    String       @map("doctor_id") @db.Uuid
  holidayDate DateTime     @map("holiday_date") @db.Date
  reason      String?      @db.VarChar(300)
  allDay      Boolean      @default(true) @map("all_day")
  startTime   String?      @map("start_time") @db.VarChar(5)
  endTime     String?      @map("end_time") @db.VarChar(5)
  status      RecordStatus @default(ACTIVE)
  createdAt   DateTime     @default(now()) @map("created_at")
  createdBy   String?      @map("created_by") @db.Uuid
  updatedAt   DateTime     @updatedAt @map("updated_at")
  updatedBy   String?      @map("updated_by") @db.Uuid
  deletedAt   DateTime?    @map("deleted_at")

  doctor Doctor @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([branchId])
  @@index([doctorId, holidayDate])
  @@map("doctor_schedule_holidays")
}

model AppointmentSlotLock {
  id         String    @id @default(uuid()) @db.Uuid
  hospitalId String    @map("hospital_id") @db.Uuid
  branchId   String    @map("branch_id") @db.Uuid
  doctorId   String    @map("doctor_id") @db.Uuid
  patientId  String?   @map("patient_id") @db.Uuid
  lockToken  String    @unique @map("lock_token") @db.VarChar(100)
  slotStart  DateTime  @map("slot_start")
  slotEnd    DateTime  @map("slot_end")
  expiresAt  DateTime  @map("expires_at")
  releasedAt DateTime? @map("released_at")
  createdAt  DateTime  @default(now()) @map("created_at")
  createdBy  String?   @map("created_by") @db.Uuid

  doctor Doctor @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([branchId])
  @@index([doctorId, slotStart])
  @@index([expiresAt])
  @@map("appointment_slot_locks")
}
'''

for model_name in [
    "DoctorSchedule",
    "DoctorScheduleBreak",
    "DoctorScheduleHoliday",
    "AppointmentSlotLock",
]:
    text = re.sub(
        rf"\nmodel\s+{model_name}\s*\{{.*?\n\}}",
        "",
        text,
        flags=re.S,
    )

schema_path.write_text(text.rstrip() + "\n\n" + models.strip() + "\n", encoding="utf-8")
print("Appointment Package 2 Prisma schema applied successfully")
