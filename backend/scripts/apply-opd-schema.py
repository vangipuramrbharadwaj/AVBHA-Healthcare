from pathlib import Path
import re

schema_path = Path(__file__).resolve().parents[1] / "prisma" / "schema.prisma"
text = schema_path.read_text(encoding="utf-8")

def add_relation(model_name: str, prefix: str, line: str) -> None:
    global text
    pattern = re.compile(rf"model\s+{re.escape(model_name)}\s*\{{.*?\n\}}", re.S)
    match = pattern.search(text)
    if not match:
        raise SystemExit(f"Model {model_name} was not found")

    lines = [
        item for item in match.group(0).splitlines()
        if not item.strip().startswith(prefix)
    ]
    map_index = next(
        (index for index, item in enumerate(lines)
         if item.strip().startswith("@@map(")),
        None,
    )
    if map_index is None:
        raise SystemExit(f"@@map was not found in {model_name}")

    lines.insert(map_index, line)
    updated = "\n".join(lines)
    text = text[:match.start()] + updated + text[match.end():]

for model_name, prefix, line in [
    ("Hospital", "opdVisits", "  opdVisits OpdVisit[]"),
    ("HospitalBranch", "opdVisits", "  opdVisits OpdVisit[]"),
    ("Department", "opdVisits", "  opdVisits OpdVisit[]"),
    ("Doctor", "opdVisits", "  opdVisits OpdVisit[]"),
    ("Patient", "opdVisits", "  opdVisits OpdVisit[]"),
    ("Appointment", "opdVisit", "  opdVisit OpdVisit?"),
]:
    add_relation(model_name, prefix, line)

for enum_name in [
    "OpdVisitStatus",
    "OpdVisitType",
    "ConsultationStatus",
    "DiagnosisType",
    "ClinicalOrderType",
]:
    text = re.sub(
        rf"\nenum\s+{enum_name}\s*\{{.*?\n\}}",
        "",
        text,
        flags=re.S,
    )

for model_name in [
    "OpdVisit",
    "OpdVitalSign",
    "OpdConsultation",
    "OpdDiagnosis",
    "OpdPrescription",
    "OpdPrescriptionItem",
    "OpdClinicalOrder",
    "OpdFollowUp",
]:
    text = re.sub(
        rf"\nmodel\s+{model_name}\s*\{{.*?\n\}}",
        "",
        text,
        flags=re.S,
    )

addition = '''
enum OpdVisitStatus {
  REGISTERED
  WAITING
  IN_CONSULTATION
  COMPLETED
  CANCELLED
}

enum OpdVisitType {
  NEW
  FOLLOW_UP
  REVIEW
  EMERGENCY
}

enum ConsultationStatus {
  DRAFT
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum DiagnosisType {
  PROVISIONAL
  FINAL
  DIFFERENTIAL
}

enum ClinicalOrderType {
  LABORATORY
  RADIOLOGY
  PROCEDURE
  PHARMACY
}

model OpdVisit {
  id              String         @id @default(uuid()) @db.Uuid
  hospitalId      String         @map("hospital_id") @db.Uuid
  branchId        String         @map("branch_id") @db.Uuid
  departmentId    String         @map("department_id") @db.Uuid
  doctorId        String         @map("doctor_id") @db.Uuid
  patientId       String         @map("patient_id") @db.Uuid
  appointmentId   String?        @unique @map("appointment_id") @db.Uuid
  visitNumber     String         @map("visit_number") @db.VarChar(40)
  visitDate       DateTime       @map("visit_date")
  visitType       OpdVisitType   @default(NEW) @map("visit_type")
  status          OpdVisitStatus @default(REGISTERED)
  chiefComplaint  String?        @map("chief_complaint")
  notes           String?
  completedAt     DateTime?      @map("completed_at")
  createdAt       DateTime       @default(now()) @map("created_at")
  createdBy       String?        @map("created_by") @db.Uuid
  updatedAt       DateTime       @updatedAt @map("updated_at")
  updatedBy       String?        @map("updated_by") @db.Uuid
  deletedAt       DateTime?      @map("deleted_at")

  hospital     Hospital        @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  branch       HospitalBranch  @relation(fields: [branchId], references: [id], onDelete: Restrict)
  department   Department      @relation(fields: [departmentId], references: [id], onDelete: Restrict)
  doctor       Doctor          @relation(fields: [doctorId], references: [id], onDelete: Restrict)
  patient      Patient         @relation(fields: [patientId], references: [id], onDelete: Restrict)
  appointment  Appointment?    @relation(fields: [appointmentId], references: [id], onDelete: SetNull)
  vitals       OpdVitalSign[]
  consultation OpdConsultation?
  diagnoses    OpdDiagnosis[]
  prescription OpdPrescription?
  orders       OpdClinicalOrder[]
  followUps    OpdFollowUp[]

  @@unique([hospitalId, visitNumber])
  @@index([hospitalId, visitDate])
  @@index([patientId, visitDate])
  @@index([doctorId, visitDate])
  @@index([status])
  @@map("opd_visits")
}

model OpdVitalSign {
  id                 String   @id @default(uuid()) @db.Uuid
  hospitalId         String   @map("hospital_id") @db.Uuid
  visitId            String   @map("visit_id") @db.Uuid
  temperatureCelsius Decimal? @map("temperature_celsius") @db.Decimal(5,2)
  pulseRate          Int?     @map("pulse_rate")
  systolicBp         Int?     @map("systolic_bp")
  diastolicBp        Int?     @map("diastolic_bp")
  spo2               Int?
  heightCm           Decimal? @map("height_cm") @db.Decimal(7,2)
  weightKg           Decimal? @map("weight_kg") @db.Decimal(7,2)
  bmi                Decimal? @db.Decimal(7,2)
  notes              String?
  recordedAt         DateTime @default(now()) @map("recorded_at")
  recordedBy         String?  @map("recorded_by") @db.Uuid

  visit OpdVisit @relation(fields: [visitId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([visitId])
  @@map("opd_vital_signs")
}

model OpdConsultation {
  id               String             @id @default(uuid()) @db.Uuid
  hospitalId       String             @map("hospital_id") @db.Uuid
  visitId          String             @unique @map("visit_id") @db.Uuid
  status           ConsultationStatus @default(DRAFT)
  history          String?
  examinationNotes String?            @map("examination_notes")
  clinicalNotes    String?            @map("clinical_notes")
  advice           String?
  doctorNotes      String?            @map("doctor_notes")
  startedAt        DateTime?          @map("started_at")
  completedAt      DateTime?          @map("completed_at")
  createdAt        DateTime           @default(now()) @map("created_at")
  createdBy        String?            @map("created_by") @db.Uuid
  updatedAt        DateTime           @updatedAt @map("updated_at")
  updatedBy        String?            @map("updated_by") @db.Uuid

  visit OpdVisit @relation(fields: [visitId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@map("opd_consultations")
}

model OpdDiagnosis {
  id            String        @id @default(uuid()) @db.Uuid
  hospitalId    String        @map("hospital_id") @db.Uuid
  visitId       String        @map("visit_id") @db.Uuid
  diagnosisType DiagnosisType @default(PROVISIONAL) @map("diagnosis_type")
  diagnosisCode String?       @map("diagnosis_code") @db.VarChar(30)
  diagnosisName String        @map("diagnosis_name") @db.VarChar(250)
  description   String?
  isPrimary     Boolean       @default(false) @map("is_primary")
  createdAt     DateTime      @default(now()) @map("created_at")
  createdBy     String?       @map("created_by") @db.Uuid

  visit OpdVisit @relation(fields: [visitId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([visitId])
  @@map("opd_diagnoses")
}

model OpdPrescription {
  id         String   @id @default(uuid()) @db.Uuid
  hospitalId String   @map("hospital_id") @db.Uuid
  visitId    String   @unique @map("visit_id") @db.Uuid
  notes      String?
  createdAt  DateTime @default(now()) @map("created_at")
  createdBy  String?  @map("created_by") @db.Uuid
  updatedAt  DateTime @updatedAt @map("updated_at")
  updatedBy  String?  @map("updated_by") @db.Uuid

  visit OpdVisit @relation(fields: [visitId], references: [id], onDelete: Cascade)
  items OpdPrescriptionItem[]

  @@index([hospitalId])
  @@map("opd_prescriptions")
}

model OpdPrescriptionItem {
  id             String   @id @default(uuid()) @db.Uuid
  hospitalId     String   @map("hospital_id") @db.Uuid
  prescriptionId String   @map("prescription_id") @db.Uuid
  medicineName   String   @map("medicine_name") @db.VarChar(200)
  dosage         String?  @db.VarChar(100)
  frequency      String?  @db.VarChar(100)
  durationDays   Int?     @map("duration_days")
  instructions   String?
  createdAt      DateTime @default(now()) @map("created_at")
  createdBy      String?  @map("created_by") @db.Uuid

  prescription OpdPrescription @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([prescriptionId])
  @@map("opd_prescription_items")
}

model OpdClinicalOrder {
  id           String            @id @default(uuid()) @db.Uuid
  hospitalId   String            @map("hospital_id") @db.Uuid
  visitId      String            @map("visit_id") @db.Uuid
  orderType    ClinicalOrderType @map("order_type")
  orderName    String            @map("order_name") @db.VarChar(250)
  instructions String?
  priority     String            @default("NORMAL") @db.VarChar(20)
  orderedAt    DateTime          @default(now()) @map("ordered_at")
  orderedBy    String?           @map("ordered_by") @db.Uuid

  visit OpdVisit @relation(fields: [visitId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([visitId])
  @@map("opd_clinical_orders")
}

model OpdFollowUp {
  id           String   @id @default(uuid()) @db.Uuid
  hospitalId   String   @map("hospital_id") @db.Uuid
  visitId      String   @map("visit_id") @db.Uuid
  followUpDate DateTime @map("follow_up_date") @db.Date
  reason       String?
  notes        String?
  createdAt    DateTime @default(now()) @map("created_at")
  createdBy    String?  @map("created_by") @db.Uuid

  visit OpdVisit @relation(fields: [visitId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([visitId])
  @@map("opd_follow_ups")
}
'''

schema_path.write_text(
    text.rstrip() + "\n\n" + addition.strip() + "\n",
    encoding="utf-8",
)

print("OPD Prisma schema applied successfully")
