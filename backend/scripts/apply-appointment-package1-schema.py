from pathlib import Path
import re

schema_path = Path(__file__).resolve().parents[1] / "prisma" / "schema.prisma"
text = schema_path.read_text(encoding="utf-8")

def add_relation(model_name: str, relation_line: str, prefix: str) -> None:
    global text
    pattern = re.compile(rf"model\s+{re.escape(model_name)}\s*\{{.*?\n\}}", re.S)
    match = pattern.search(text)
    if not match:
        raise SystemExit(f"Model {model_name} was not found")
    block = match.group(0)
    lines = [line for line in block.splitlines()
             if not line.strip().startswith(prefix)]
    map_index = next(
        (index for index, line in enumerate(lines)
         if line.strip().startswith("@@map(")),
        None,
    )
    if map_index is None:
        raise SystemExit(f"@@map was not found in model {model_name}")
    lines.insert(map_index, relation_line)
    updated = "\n".join(lines)
    text = text[:match.start()] + updated + text[match.end():]

add_relation("Hospital", "  appointments Appointment[]", "appointments")
add_relation("HospitalBranch", "  appointments Appointment[]", "appointments")
add_relation("Department", "  appointments Appointment[]", "appointments")
add_relation("Doctor", "  appointments Appointment[]", "appointments")
add_relation("Patient", "  appointments Appointment[]", "appointments")

for enum_name in [
    "AppointmentStatus",
    "AppointmentType",
    "AppointmentVisitType",
    "AppointmentPriority",
]:
    text = re.sub(
        rf"\nenum\s+{enum_name}\s*\{{.*?\n\}}",
        "",
        text,
        flags=re.S,
    )

text = re.sub(
    r"\nmodel\s+Appointment\s*\{.*?\n\}",
    "",
    text,
    flags=re.S,
)

addition = '''
enum AppointmentStatus {
  BOOKED
  CONFIRMED
  CHECKED_IN
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
  RESCHEDULED
}

enum AppointmentType {
  CONSULTATION
  FOLLOW_UP
  PROCEDURE
  HEALTH_CHECK
  VACCINATION
  TELECONSULTATION
  EMERGENCY
  OTHER
}

enum AppointmentVisitType {
  NEW
  FOLLOW_UP
  REVIEW
}

enum AppointmentPriority {
  NORMAL
  URGENT
  EMERGENCY
}

model Appointment {
  id           String                   @id @default(uuid()) @db.Uuid
  hospitalId   String                   @map("hospital_id") @db.Uuid
  branchId     String                   @map("branch_id") @db.Uuid
  departmentId String                   @map("department_id") @db.Uuid
  patientId    String                   @map("patient_id") @db.Uuid
  doctorId     String                   @map("doctor_id") @db.Uuid

  appointmentNumber String               @map("appointment_number") @db.VarChar(40)
  appointmentDate   DateTime             @map("appointment_date") @db.Date
  startTime         DateTime             @map("start_time")
  endTime           DateTime             @map("end_time")
  durationMinutes   Int                  @default(15) @map("duration_minutes")
  appointmentType   AppointmentType      @default(CONSULTATION) @map("appointment_type")
  visitType         AppointmentVisitType @default(NEW) @map("visit_type")
  priority          AppointmentPriority  @default(NORMAL)
  status            AppointmentStatus    @default(BOOKED)

  chiefComplaint String? @map("chief_complaint")
  reason         String?
  notes          String?
  internalNotes  String? @map("internal_notes")
  source           String? @db.VarChar(50)
  referredBy       String? @map("referred_by") @db.VarChar(150)
  confirmationMode String? @map("confirmation_mode") @db.VarChar(30)

  cancelledAt       DateTime? @map("cancelled_at")
  cancelledBy       String?   @map("cancelled_by") @db.Uuid
  cancellationReason String?  @map("cancellation_reason")
  rescheduledFromId String?   @map("rescheduled_from_id") @db.Uuid
  checkedInAt       DateTime? @map("checked_in_at")
  completedAt       DateTime? @map("completed_at")

  createdAt DateTime  @default(now()) @map("created_at")
  createdBy String?   @map("created_by") @db.Uuid
  updatedAt DateTime  @updatedAt @map("updated_at")
  updatedBy String?   @map("updated_by") @db.Uuid
  deletedAt DateTime? @map("deleted_at")

  hospital   Hospital       @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  branch     HospitalBranch @relation(fields: [branchId], references: [id], onDelete: Restrict)
  department Department     @relation(fields: [departmentId], references: [id], onDelete: Restrict)
  patient    Patient        @relation(fields: [patientId], references: [id], onDelete: Restrict)
  doctor     Doctor         @relation(fields: [doctorId], references: [id], onDelete: Restrict)

  @@unique([hospitalId, appointmentNumber])
  @@index([hospitalId, appointmentDate])
  @@index([branchId, appointmentDate])
  @@index([departmentId, appointmentDate])
  @@index([doctorId, startTime])
  @@index([patientId, appointmentDate])
  @@index([status])
  @@map("appointments")
}
'''

schema_path.write_text(text.rstrip() + "\n\n" + addition.strip() + "\n", encoding="utf-8")
print("Appointment Package 1 Prisma schema applied successfully")
