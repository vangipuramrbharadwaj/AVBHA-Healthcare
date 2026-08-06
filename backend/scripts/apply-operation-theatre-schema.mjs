import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");

if (!fs.existsSync(schemaPath)) {
  throw new Error(
    `Prisma schema not found: ${schemaPath}. Run this script from the backend folder.`,
  );
}

let schema = fs.readFileSync(schemaPath, "utf8");

function replaceModel(modelName, transform) {
  const pattern = new RegExp(
    `model\\s+${modelName}\\s*\\{[\\s\\S]*?\\n\\}`,
    "m",
  );
  const match = schema.match(pattern);

  if (!match) {
    throw new Error(`Model ${modelName} was not found in prisma/schema.prisma`);
  }

  schema = schema.replace(pattern, transform(match[0]));
}

function ensureRelation(modelName, relationPrefix, relationLine) {
  replaceModel(modelName, (block) => {
    const lines = block
      .split("\n")
      .filter((line) => !line.trim().startsWith(relationPrefix));

    const mapIndex = lines.findIndex((line) =>
      line.trim().startsWith("@@map("),
    );

    if (mapIndex < 0) {
      throw new Error(`@@map was not found in model ${modelName}`);
    }

    lines.splice(mapIndex, 0, relationLine);
    return lines.join("\n");
  });
}

for (const [modelName, relationPrefix, relationLine] of [
  ["Hospital", "otBookings", "  otBookings OtBooking[]"],
  ["HospitalBranch", "otBookings", "  otBookings OtBooking[]"],
  ["Patient", "otBookings", "  otBookings OtBooking[]"],
]) {
  ensureRelation(modelName, relationPrefix, relationLine);
}

for (const enumName of [
  "OtRoomStatus",
  "OtBookingStatus",
  "OtBookingPriority",
  "OtTeamRole",
  "OtChecklistStatus",
  "OtAnaesthesiaType",
  "OtRecoveryStatus",
  "OtComplicationSeverity",
]) {
  const enumPattern = new RegExp(
    `\\nenum\\s+${enumName}\\s*\\{[\\s\\S]*?\\n\\}`,
    "m",
  );
  schema = schema.replace(enumPattern, "");
}

for (const modelName of [
  "OtRoom",
  "OtProcedureCatalog",
  "OtBooking",
  "OtBookingTeam",
  "OtChecklistItem",
  "OtConsent",
  "OtAnaesthesiaAssessment",
  "OtIntraoperativeNote",
  "OtConsumable",
  "OtImplant",
  "OtSpecimen",
  "OtRecoveryRecord",
  "OtComplication",
]) {
  const modelPattern = new RegExp(
    `\\nmodel\\s+${modelName}\\s*\\{[\\s\\S]*?\\n\\}`,
    "m",
  );
  schema = schema.replace(modelPattern, "");
}

const addition = String.raw`
enum OtRoomStatus {
  ACTIVE
  INACTIVE
  MAINTENANCE
}

enum OtBookingStatus {
  REQUESTED
  SCHEDULED
  PRE_OP_READY
  PATIENT_IN_OT
  IN_PROGRESS
  COMPLETED
  RECOVERY
  CANCELLED
  RESCHEDULED
}

enum OtBookingPriority {
  ELECTIVE
  URGENT
  EMERGENCY
}

enum OtTeamRole {
  PRIMARY_SURGEON
  ASSISTANT_SURGEON
  ANAESTHETIST
  SCRUB_NURSE
  CIRCULATING_NURSE
  TECHNICIAN
  OTHER
}

enum OtChecklistStatus {
  PENDING
  COMPLETED
  NOT_APPLICABLE
  FAILED
}

enum OtAnaesthesiaType {
  GENERAL
  SPINAL
  EPIDURAL
  LOCAL
  REGIONAL
  SEDATION
  COMBINED
  OTHER
}

enum OtRecoveryStatus {
  PENDING
  IN_RECOVERY
  STABLE
  TRANSFERRED
  ESCALATED
}

enum OtComplicationSeverity {
  MILD
  MODERATE
  SEVERE
  CRITICAL
}

model OtRoom {
  id             String       @id @default(uuid()) @db.Uuid
  hospitalId     String       @map("hospital_id") @db.Uuid
  branchId       String       @map("branch_id") @db.Uuid
  roomCode       String       @map("room_code") @db.VarChar(30)
  roomName       String       @map("room_name") @db.VarChar(120)
  floor          String?      @db.VarChar(50)
  roomType       String?      @map("room_type") @db.VarChar(80)
  equipmentNotes String?      @map("equipment_notes")
  status         OtRoomStatus @default(ACTIVE)
  createdAt      DateTime     @default(now()) @map("created_at")
  createdBy      String?      @map("created_by") @db.Uuid
  updatedAt      DateTime     @updatedAt @map("updated_at")
  updatedBy      String?      @map("updated_by") @db.Uuid

  bookings OtBooking[]

  @@unique([hospitalId, branchId, roomCode])
  @@index([hospitalId, branchId, status])
  @@map("ot_rooms")
}

model OtProcedureCatalog {
  id                    String       @id @default(uuid()) @db.Uuid
  hospitalId            String       @map("hospital_id") @db.Uuid
  procedureCode         String       @map("procedure_code") @db.VarChar(40)
  procedureName         String       @map("procedure_name") @db.VarChar(200)
  speciality            String?      @db.VarChar(120)
  estimatedMinutes      Int?         @map("estimated_minutes")
  baseCharge            Decimal?     @map("base_charge") @db.Decimal(14, 2)
  defaultAnaesthesiaType OtAnaesthesiaType? @map("default_anaesthesia_type")
  preparationInstructions String?    @map("preparation_instructions")
  status                RecordStatus @default(ACTIVE)
  createdAt             DateTime     @default(now()) @map("created_at")
  createdBy             String?      @map("created_by") @db.Uuid
  updatedAt             DateTime     @updatedAt @map("updated_at")
  updatedBy             String?      @map("updated_by") @db.Uuid
  deletedAt             DateTime?    @map("deleted_at")

  bookings OtBooking[]

  @@unique([hospitalId, procedureCode])
  @@index([hospitalId, status])
  @@map("ot_procedure_catalog")
}

model OtBooking {
  id                    String            @id @default(uuid()) @db.Uuid
  hospitalId            String            @map("hospital_id") @db.Uuid
  branchId              String            @map("branch_id") @db.Uuid
  patientId             String            @map("patient_id") @db.Uuid
  ipdAdmissionId        String?           @map("ipd_admission_id") @db.Uuid
  opdVisitId            String?           @map("opd_visit_id") @db.Uuid
  otRoomId              String            @map("ot_room_id") @db.Uuid
  procedureId           String            @map("procedure_id") @db.Uuid
  bookingNumber         String            @map("booking_number") @db.VarChar(40)
  priority              OtBookingPriority @default(ELECTIVE)
  status                OtBookingStatus   @default(REQUESTED)
  scheduledStart        DateTime          @map("scheduled_start")
  scheduledEnd          DateTime          @map("scheduled_end")
  actualStart           DateTime?         @map("actual_start")
  actualEnd             DateTime?         @map("actual_end")
  primarySurgeonId      String            @map("primary_surgeon_id") @db.Uuid
  anaesthetistId        String?           @map("anaesthetist_id") @db.Uuid
  preOperativeDiagnosis String?           @map("pre_operative_diagnosis")
  postOperativeDiagnosis String?          @map("post_operative_diagnosis")
  indication            String?
  specialInstructions   String?           @map("special_instructions")
  estimatedBloodLossMl  Int?              @map("estimated_blood_loss_ml")
  cancellationReason    String?           @map("cancellation_reason")
  cancelledAt           DateTime?         @map("cancelled_at")
  cancelledBy           String?           @map("cancelled_by") @db.Uuid
  createdAt             DateTime          @default(now()) @map("created_at")
  createdBy             String?           @map("created_by") @db.Uuid
  updatedAt             DateTime          @updatedAt @map("updated_at")
  updatedBy             String?           @map("updated_by") @db.Uuid

  hospital  Hospital           @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  branch    HospitalBranch     @relation(fields: [branchId], references: [id], onDelete: Restrict)
  patient   Patient            @relation(fields: [patientId], references: [id], onDelete: Restrict)
  room      OtRoom             @relation(fields: [otRoomId], references: [id], onDelete: Restrict)
  procedure OtProcedureCatalog @relation(fields: [procedureId], references: [id], onDelete: Restrict)
  team      OtBookingTeam[]
  checklist OtChecklistItem[]
  consents  OtConsent[]
  anaesthesiaAssessment OtAnaesthesiaAssessment?
  intraoperativeNotes   OtIntraoperativeNote[]
  consumables           OtConsumable[]
  implants              OtImplant[]
  specimens             OtSpecimen[]
  recoveryRecords       OtRecoveryRecord[]
  complications         OtComplication[]

  @@unique([hospitalId, bookingNumber])
  @@index([hospitalId, scheduledStart])
  @@index([patientId, scheduledStart])
  @@index([otRoomId, scheduledStart, scheduledEnd])
  @@index([primarySurgeonId, scheduledStart, scheduledEnd])
  @@index([status])
  @@map("ot_bookings")
}

model OtBookingTeam {
  id         String     @id @default(uuid()) @db.Uuid
  hospitalId String     @map("hospital_id") @db.Uuid
  bookingId  String     @map("booking_id") @db.Uuid
  employeeId String     @map("employee_id") @db.Uuid
  role       OtTeamRole
  lead       Boolean    @default(false)
  notes      String?
  createdAt  DateTime   @default(now()) @map("created_at")

  booking OtBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@unique([bookingId, employeeId, role])
  @@index([hospitalId])
  @@index([employeeId])
  @@map("ot_booking_team")
}

model OtChecklistItem {
  id          String            @id @default(uuid()) @db.Uuid
  hospitalId  String            @map("hospital_id") @db.Uuid
  bookingId   String            @map("booking_id") @db.Uuid
  phase       String            @db.VarChar(50)
  itemCode    String            @map("item_code") @db.VarChar(50)
  itemLabel   String            @map("item_label") @db.VarChar(250)
  status      OtChecklistStatus @default(PENDING)
  completedAt DateTime?         @map("completed_at")
  completedBy String?           @map("completed_by") @db.Uuid
  remarks     String?
  createdAt   DateTime          @default(now()) @map("created_at")

  booking OtBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@unique([bookingId, phase, itemCode])
  @@index([hospitalId])
  @@index([bookingId, phase])
  @@map("ot_checklist_items")
}

model OtConsent {
  id             String   @id @default(uuid()) @db.Uuid
  hospitalId     String   @map("hospital_id") @db.Uuid
  bookingId      String   @map("booking_id") @db.Uuid
  consentType    String   @map("consent_type") @db.VarChar(80)
  consented      Boolean  @default(false)
  consentedAt    DateTime? @map("consented_at")
  consentedByName String? @map("consented_by_name") @db.VarChar(150)
  relationship   String?  @db.VarChar(80)
  witnessName    String?  @map("witness_name") @db.VarChar(150)
  documentPath   String?  @map("document_path")
  remarks        String?
  createdAt      DateTime @default(now()) @map("created_at")
  createdBy      String?  @map("created_by") @db.Uuid

  booking OtBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([bookingId])
  @@map("ot_consents")
}

model OtAnaesthesiaAssessment {
  id                    String             @id @default(uuid()) @db.Uuid
  hospitalId            String             @map("hospital_id") @db.Uuid
  bookingId             String             @unique @map("booking_id") @db.Uuid
  anaesthesiaType       OtAnaesthesiaType  @map("anaesthesia_type")
  asaGrade              String?            @map("asa_grade") @db.VarChar(20)
  airwayAssessment      String?            @map("airway_assessment")
  allergies             String?
  comorbidities         String?
  fastingConfirmed      Boolean            @default(false) @map("fasting_confirmed")
  consentConfirmed      Boolean            @default(false) @map("consent_confirmed")
  preMedication         String?            @map("pre_medication")
  specialRisks          String?            @map("special_risks")
  fitForAnaesthesia     Boolean            @default(false) @map("fit_for_anaesthesia")
  assessedAt            DateTime           @default(now()) @map("assessed_at")
  assessedBy            String             @map("assessed_by") @db.Uuid
  createdAt             DateTime           @default(now()) @map("created_at")
  updatedAt             DateTime           @updatedAt @map("updated_at")

  booking OtBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@map("ot_anaesthesia_assessments")
}

model OtIntraoperativeNote {
  id                   String   @id @default(uuid()) @db.Uuid
  hospitalId           String   @map("hospital_id") @db.Uuid
  bookingId            String   @map("booking_id") @db.Uuid
  noteType             String   @map("note_type") @db.VarChar(50)
  note                 String
  recordedAt           DateTime @default(now()) @map("recorded_at")
  recordedBy           String   @map("recorded_by") @db.Uuid
  bloodLossMl          Int?     @map("blood_loss_ml")
  urineOutputMl        Int?     @map("urine_output_ml")
  fluidsGivenMl        Int?     @map("fluids_given_ml")
  createdAt            DateTime @default(now()) @map("created_at")

  booking OtBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([bookingId, recordedAt])
  @@map("ot_intraoperative_notes")
}

model OtConsumable {
  id           String   @id @default(uuid()) @db.Uuid
  hospitalId   String   @map("hospital_id") @db.Uuid
  bookingId    String   @map("booking_id") @db.Uuid
  itemCode     String?  @map("item_code") @db.VarChar(60)
  itemName     String   @map("item_name") @db.VarChar(200)
  batchNumber  String?  @map("batch_number") @db.VarChar(80)
  quantity     Decimal  @db.Decimal(12, 3)
  unit         String?  @db.VarChar(30)
  unitCost     Decimal? @map("unit_cost") @db.Decimal(14, 2)
  billable     Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")
  createdBy    String?  @map("created_by") @db.Uuid

  booking OtBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([bookingId])
  @@map("ot_consumables")
}

model OtImplant {
  id            String   @id @default(uuid()) @db.Uuid
  hospitalId    String   @map("hospital_id") @db.Uuid
  bookingId     String   @map("booking_id") @db.Uuid
  implantName   String   @map("implant_name") @db.VarChar(200)
  manufacturer  String?  @db.VarChar(150)
  serialNumber  String?  @map("serial_number") @db.VarChar(120)
  batchNumber   String?  @map("batch_number") @db.VarChar(80)
  expiryDate    DateTime? @map("expiry_date") @db.Date
  quantity      Decimal  @default(1) @db.Decimal(12, 3)
  unitCost      Decimal? @map("unit_cost") @db.Decimal(14, 2)
  billable      Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  createdBy     String?  @map("created_by") @db.Uuid

  booking OtBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([bookingId])
  @@map("ot_implants")
}

model OtSpecimen {
  id             String   @id @default(uuid()) @db.Uuid
  hospitalId     String   @map("hospital_id") @db.Uuid
  bookingId      String   @map("booking_id") @db.Uuid
  specimenNumber String   @map("specimen_number") @db.VarChar(50)
  specimenType   String   @map("specimen_type") @db.VarChar(120)
  site           String?  @db.VarChar(120)
  investigation  String?  @db.VarChar(150)
  collectedAt    DateTime @default(now()) @map("collected_at")
  collectedBy    String?  @map("collected_by") @db.Uuid
  sentToLabAt    DateTime? @map("sent_to_lab_at")
  notes          String?
  createdAt      DateTime @default(now()) @map("created_at")

  booking OtBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@unique([hospitalId, specimenNumber])
  @@index([bookingId])
  @@map("ot_specimens")
}

model OtRecoveryRecord {
  id                String           @id @default(uuid()) @db.Uuid
  hospitalId        String           @map("hospital_id") @db.Uuid
  bookingId         String           @map("booking_id") @db.Uuid
  status            OtRecoveryStatus @default(PENDING)
  recordedAt        DateTime         @default(now()) @map("recorded_at")
  recordedBy        String           @map("recorded_by") @db.Uuid
  consciousnessLevel String?         @map("consciousness_level") @db.VarChar(80)
  painScore         Int?             @map("pain_score")
  systolicBp        Int?             @map("systolic_bp")
  diastolicBp       Int?             @map("diastolic_bp")
  pulseRate         Int?             @map("pulse_rate")
  respiratoryRate   Int?             @map("respiratory_rate")
  spo2              Int?
  temperatureCelsius Decimal?        @map("temperature_celsius") @db.Decimal(5, 2)
  nauseaVomiting    Boolean          @default(false) @map("nausea_vomiting")
  notes             String?
  createdAt         DateTime         @default(now()) @map("created_at")

  booking OtBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([bookingId, recordedAt])
  @@map("ot_recovery_records")
}

model OtComplication {
  id          String                   @id @default(uuid()) @db.Uuid
  hospitalId  String                   @map("hospital_id") @db.Uuid
  bookingId   String                   @map("booking_id") @db.Uuid
  complicationType String              @map("complication_type") @db.VarChar(120)
  severity    OtComplicationSeverity
  description String
  actionTaken String?                  @map("action_taken")
  occurredAt  DateTime                 @default(now()) @map("occurred_at")
  reportedBy  String                   @map("reported_by") @db.Uuid
  resolved    Boolean                  @default(false)
  resolvedAt  DateTime?                @map("resolved_at")
  createdAt   DateTime                 @default(now()) @map("created_at")

  booking OtBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([bookingId, occurredAt])
  @@index([severity])
  @@map("ot_complications")
}
`;

schema = `${schema.trimEnd()}\n\n${addition.trim()}\n`;
fs.writeFileSync(schemaPath, schema, "utf8");

console.log("OT Prisma schema applied successfully");
