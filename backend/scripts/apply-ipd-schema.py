from pathlib import Path
import re

schema_path = Path(__file__).resolve().parents[1] / "prisma" / "schema.prisma"
text = schema_path.read_text(encoding="utf-8")

def add_relation(model_name: str, prefix: str, relation_line: str) -> None:
    global text
    pattern = re.compile(rf"model\s+{re.escape(model_name)}\s*\{{.*?\n\}}", re.S)
    match = pattern.search(text)
    if not match:
        raise SystemExit(f"Model {model_name} was not found")

    lines = [
        line for line in match.group(0).splitlines()
        if not line.strip().startswith(prefix)
    ]
    map_index = next(
        (i for i, line in enumerate(lines) if line.strip().startswith("@@map(")),
        None,
    )
    if map_index is None:
        raise SystemExit(f"@@map not found in model {model_name}")

    lines.insert(map_index, relation_line)
    updated = "\n".join(lines)
    text = text[:match.start()] + updated + text[match.end():]

for model_name, prefix, relation_line in [
    ("Hospital", "ipdAdmissions", "  ipdAdmissions IpdAdmission[]"),
    ("HospitalBranch", "ipdAdmissions", "  ipdAdmissions IpdAdmission[]"),
    ("Department", "ipdAdmissions", "  ipdAdmissions IpdAdmission[]"),
    ("Doctor", "ipdAdmissions", "  ipdAdmissions IpdAdmission[]"),
    ("Patient", "ipdAdmissions", "  ipdAdmissions IpdAdmission[]"),
]:
    add_relation(model_name, prefix, relation_line)

for enum_name in [
    "IpdAdmissionStatus",
    "IpdAdmissionType",
    "IpdBedStatus",
    "IpdAllocationStatus",
    "IpdDischargeType",
]:
    text = re.sub(
        rf"\nenum\s+{enum_name}\s*\{{.*?\n\}}",
        "",
        text,
        flags=re.S,
    )

for model_name in [
    "IpdWard",
    "IpdRoom",
    "IpdBed",
    "IpdAdmission",
    "IpdBedAllocation",
    "IpdNursingNote",
    "IpdVitalSign",
    "IpdDoctorRound",
    "IpdMedicationOrder",
    "IpdMedicationAdministration",
    "IpdIntakeOutput",
    "IpdDischargeSummary",
]:
    text = re.sub(
        rf"\nmodel\s+{model_name}\s*\{{.*?\n\}}",
        "",
        text,
        flags=re.S,
    )

addition = r'''
enum IpdAdmissionStatus {
  ACTIVE
  DISCHARGE_PLANNED
  DISCHARGED
  CANCELLED
}

enum IpdAdmissionType {
  ELECTIVE
  EMERGENCY
  DAY_CARE
  OBSERVATION
}

enum IpdBedStatus {
  AVAILABLE
  OCCUPIED
  RESERVED
  MAINTENANCE
  BLOCKED
}

enum IpdAllocationStatus {
  ACTIVE
  TRANSFERRED
  RELEASED
  CANCELLED
}

enum IpdDischargeType {
  NORMAL
  LAMA
  TRANSFER
  DEATH
  ABSCONDED
}

model IpdWard {
  id         String       @id @default(uuid()) @db.Uuid
  hospitalId String       @map("hospital_id") @db.Uuid
  branchId   String       @map("branch_id") @db.Uuid
  wardCode   String       @map("ward_code") @db.VarChar(30)
  wardName   String       @map("ward_name") @db.VarChar(120)
  wardType   String       @map("ward_type") @db.VarChar(50)
  floor      String?      @db.VarChar(30)
  status     RecordStatus @default(ACTIVE)
  createdAt  DateTime     @default(now()) @map("created_at")
  updatedAt  DateTime     @updatedAt @map("updated_at")

  rooms IpdRoom[]

  @@unique([hospitalId, wardCode])
  @@index([hospitalId, branchId])
  @@map("ipd_wards")
}

model IpdRoom {
  id          String       @id @default(uuid()) @db.Uuid
  hospitalId  String       @map("hospital_id") @db.Uuid
  branchId    String       @map("branch_id") @db.Uuid
  wardId      String       @map("ward_id") @db.Uuid
  roomCode    String       @map("room_code") @db.VarChar(30)
  roomName    String       @map("room_name") @db.VarChar(120)
  roomType    String       @map("room_type") @db.VarChar(50)
  dailyCharge Decimal?     @map("daily_charge") @db.Decimal(12, 2)
  status      RecordStatus @default(ACTIVE)
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  ward IpdWard @relation(fields: [wardId], references: [id], onDelete: Restrict)
  beds IpdBed[]

  @@unique([hospitalId, roomCode])
  @@index([wardId])
  @@map("ipd_rooms")
}

model IpdBed {
  id          String       @id @default(uuid()) @db.Uuid
  hospitalId  String       @map("hospital_id") @db.Uuid
  branchId    String       @map("branch_id") @db.Uuid
  roomId      String       @map("room_id") @db.Uuid
  bedCode     String       @map("bed_code") @db.VarChar(30)
  bedName     String       @map("bed_name") @db.VarChar(100)
  bedType     String       @map("bed_type") @db.VarChar(50)
  dailyCharge Decimal?     @map("daily_charge") @db.Decimal(12, 2)
  bedStatus   IpdBedStatus @default(AVAILABLE) @map("bed_status")
  status      RecordStatus @default(ACTIVE)
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  room        IpdRoom            @relation(fields: [roomId], references: [id], onDelete: Restrict)
  allocations IpdBedAllocation[]

  @@unique([hospitalId, bedCode])
  @@index([roomId, bedStatus])
  @@map("ipd_beds")
}

model IpdAdmission {
  id                    String             @id @default(uuid()) @db.Uuid
  hospitalId            String             @map("hospital_id") @db.Uuid
  branchId              String             @map("branch_id") @db.Uuid
  departmentId          String             @map("department_id") @db.Uuid
  doctorId              String             @map("doctor_id") @db.Uuid
  patientId             String             @map("patient_id") @db.Uuid
  admissionNumber       String             @map("admission_number") @db.VarChar(40)
  admissionDate         DateTime           @map("admission_date")
  admissionType         IpdAdmissionType   @default(ELECTIVE) @map("admission_type")
  status                IpdAdmissionStatus @default(ACTIVE)
  admissionReason       String?            @map("admission_reason")
  provisionalDiagnosis String?            @map("provisional_diagnosis")
  expectedDischargeDate DateTime?          @map("expected_discharge_date") @db.Date
  attendantName         String?            @map("attendant_name") @db.VarChar(150)
  attendantPhone        String?            @map("attendant_phone") @db.VarChar(20)
  notes                 String?
  dischargedAt          DateTime?          @map("discharged_at")
  createdAt             DateTime           @default(now()) @map("created_at")
  createdBy             String?            @map("created_by") @db.Uuid
  updatedAt             DateTime           @updatedAt @map("updated_at")
  updatedBy             String?            @map("updated_by") @db.Uuid
  deletedAt             DateTime?          @map("deleted_at")

  hospital         Hospital       @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  branch           HospitalBranch @relation(fields: [branchId], references: [id], onDelete: Restrict)
  department       Department     @relation(fields: [departmentId], references: [id], onDelete: Restrict)
  doctor           Doctor         @relation(fields: [doctorId], references: [id], onDelete: Restrict)
  patient          Patient        @relation(fields: [patientId], references: [id], onDelete: Restrict)
  bedAllocations   IpdBedAllocation[]
  nursingNotes     IpdNursingNote[]
  vitals           IpdVitalSign[]
  doctorRounds     IpdDoctorRound[]
  medicationOrders IpdMedicationOrder[]
  intakeOutputs    IpdIntakeOutput[]
  dischargeSummary IpdDischargeSummary?

  @@unique([hospitalId, admissionNumber])
  @@index([hospitalId, admissionDate])
  @@index([patientId, admissionDate])
  @@index([status])
  @@map("ipd_admissions")
}

model IpdBedAllocation {
  id             String              @id @default(uuid()) @db.Uuid
  hospitalId     String              @map("hospital_id") @db.Uuid
  admissionId    String              @map("admission_id") @db.Uuid
  bedId          String              @map("bed_id") @db.Uuid
  allocatedAt    DateTime            @default(now()) @map("allocated_at")
  releasedAt     DateTime?           @map("released_at")
  status         IpdAllocationStatus @default(ACTIVE)
  transferReason String?             @map("transfer_reason")
  createdBy      String?             @map("created_by") @db.Uuid
  updatedAt      DateTime            @updatedAt @map("updated_at")
  updatedBy      String?             @map("updated_by") @db.Uuid

  admission IpdAdmission @relation(fields: [admissionId], references: [id], onDelete: Cascade)
  bed       IpdBed       @relation(fields: [bedId], references: [id], onDelete: Restrict)

  @@index([admissionId, status])
  @@index([bedId, status])
  @@map("ipd_bed_allocations")
}

model IpdNursingNote {
  id          String   @id @default(uuid()) @db.Uuid
  hospitalId  String   @map("hospital_id") @db.Uuid
  admissionId String   @map("admission_id") @db.Uuid
  noteType    String   @map("note_type") @db.VarChar(50)
  note        String
  shift       String?  @db.VarChar(30)
  recordedAt  DateTime @default(now()) @map("recorded_at")
  recordedBy  String?  @map("recorded_by") @db.Uuid

  admission IpdAdmission @relation(fields: [admissionId], references: [id], onDelete: Cascade)

  @@index([admissionId, recordedAt])
  @@map("ipd_nursing_notes")
}

model IpdVitalSign {
  id                 String   @id @default(uuid()) @db.Uuid
  hospitalId         String   @map("hospital_id") @db.Uuid
  admissionId        String   @map("admission_id") @db.Uuid
  temperatureCelsius Decimal? @map("temperature_celsius") @db.Decimal(5, 2)
  pulseRate          Int?     @map("pulse_rate")
  respiratoryRate    Int?     @map("respiratory_rate")
  systolicBp         Int?     @map("systolic_bp")
  diastolicBp        Int?     @map("diastolic_bp")
  spo2               Int?
  bloodSugar         Decimal? @map("blood_sugar") @db.Decimal(8, 2)
  painScore          Int?     @map("pain_score")
  notes              String?
  recordedAt         DateTime @default(now()) @map("recorded_at")
  recordedBy         String?  @map("recorded_by") @db.Uuid

  admission IpdAdmission @relation(fields: [admissionId], references: [id], onDelete: Cascade)

  @@index([admissionId, recordedAt])
  @@map("ipd_vital_signs")
}

model IpdDoctorRound {
  id            String   @id @default(uuid()) @db.Uuid
  hospitalId    String   @map("hospital_id") @db.Uuid
  admissionId   String   @map("admission_id") @db.Uuid
  doctorId      String   @map("doctor_id") @db.Uuid
  roundDate     DateTime @default(now()) @map("round_date")
  progressNotes String?  @map("progress_notes")
  examination   String?
  diagnosis     String?
  plan          String?
  orders        String?
  createdBy     String?  @map("created_by") @db.Uuid

  admission IpdAdmission @relation(fields: [admissionId], references: [id], onDelete: Cascade)

  @@index([admissionId, roundDate])
  @@map("ipd_doctor_rounds")
}

model IpdMedicationOrder {
  id           String   @id @default(uuid()) @db.Uuid
  hospitalId   String   @map("hospital_id") @db.Uuid
  admissionId  String   @map("admission_id") @db.Uuid
  medicineName String   @map("medicine_name") @db.VarChar(200)
  dosage       String?  @db.VarChar(100)
  route        String?  @db.VarChar(50)
  frequency    String?  @db.VarChar(100)
  startDate    DateTime @map("start_date")
  endDate      DateTime? @map("end_date")
  instructions String?
  status       String   @default("ORDERED") @db.VarChar(30)
  orderedAt    DateTime @default(now()) @map("ordered_at")
  orderedBy    String?  @map("ordered_by") @db.Uuid

  admission      IpdAdmission                  @relation(fields: [admissionId], references: [id], onDelete: Cascade)
  administrations IpdMedicationAdministration[]

  @@index([admissionId, status])
  @@map("ipd_medication_orders")
}

model IpdMedicationAdministration {
  id                String    @id @default(uuid()) @db.Uuid
  hospitalId        String    @map("hospital_id") @db.Uuid
  medicationOrderId String    @map("medication_order_id") @db.Uuid
  scheduledAt       DateTime  @map("scheduled_at")
  administeredAt    DateTime? @map("administered_at")
  doseGiven         String?   @map("dose_given") @db.VarChar(100)
  status            String    @default("PENDING") @db.VarChar(30)
  remarks           String?
  administeredBy    String?   @map("administered_by") @db.Uuid

  medicationOrder IpdMedicationOrder @relation(fields: [medicationOrderId], references: [id], onDelete: Cascade)

  @@index([medicationOrderId, scheduledAt])
  @@map("ipd_medication_administrations")
}

model IpdIntakeOutput {
  id          String   @id @default(uuid()) @db.Uuid
  hospitalId  String   @map("hospital_id") @db.Uuid
  admissionId String   @map("admission_id") @db.Uuid
  recordType  String   @map("record_type") @db.VarChar(20)
  category    String   @db.VarChar(80)
  quantityMl  Decimal  @map("quantity_ml") @db.Decimal(10, 2)
  recordedAt  DateTime @default(now()) @map("recorded_at")
  recordedBy  String?  @map("recorded_by") @db.Uuid
  notes       String?

  admission IpdAdmission @relation(fields: [admissionId], references: [id], onDelete: Cascade)

  @@index([admissionId, recordedAt])
  @@map("ipd_intake_outputs")
}

model IpdDischargeSummary {
  id                   String           @id @default(uuid()) @db.Uuid
  hospitalId           String           @map("hospital_id") @db.Uuid
  admissionId          String           @unique @map("admission_id") @db.Uuid
  dischargeType        IpdDischargeType @map("discharge_type")
  finalDiagnosis       String           @map("final_diagnosis")
  hospitalCourse       String?          @map("hospital_course")
  proceduresDone       String?          @map("procedures_done")
  conditionAtDischarge String?          @map("condition_at_discharge")
  dischargeAdvice      String?          @map("discharge_advice")
  dischargeMedication  String?          @map("discharge_medication")
  followUpDate         DateTime?        @map("follow_up_date") @db.Date
  followUpInstructions String?          @map("follow_up_instructions")
  preparedAt           DateTime         @default(now()) @map("prepared_at")
  preparedBy           String?          @map("prepared_by") @db.Uuid

  admission IpdAdmission @relation(fields: [admissionId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@map("ipd_discharge_summaries")
}
'''

schema_path.write_text(
    text.rstrip() + "\n\n" + addition.strip() + "\n",
    encoding="utf-8",
)

print("IPD Prisma schema applied successfully")
