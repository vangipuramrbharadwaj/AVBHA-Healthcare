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
        item
        for item in match.group(0).splitlines()
        if not item.strip().startswith(prefix)
    ]

    map_index = next(
        (
            index
            for index, item in enumerate(lines)
            if item.strip().startswith("@@map(")
        ),
        None,
    )

    if map_index is None:
        raise SystemExit(f"@@map was not found in {model_name}")

    lines.insert(map_index, line)
    updated = "\n".join(lines)
    text = text[: match.start()] + updated + text[match.end() :]

for model_name, prefix, line in [
    ("Hospital", "radiologyOrders", "  radiologyOrders RadiologyOrder[]"),
    ("HospitalBranch", "radiologyOrders", "  radiologyOrders RadiologyOrder[]"),
    ("Department", "radiologyOrders", "  radiologyOrders RadiologyOrder[]"),
    ("Doctor", "radiologyOrders", "  radiologyOrders RadiologyOrder[]"),
    ("Patient", "radiologyOrders", "  radiologyOrders RadiologyOrder[]"),
]:
    add_relation(model_name, prefix, line)

for enum_name in [
    "RadiologyModality",
    "RadiologyOrderPriority",
    "RadiologyOrderStatus",
    "RadiologyStudyStatus",
    "RadiologyReportStatus",
    "ContrastRoute",
]:
    text = re.sub(
        rf"\nenum\s+{enum_name}\s*\{{.*?\n\}}",
        "",
        text,
        flags=re.S,
    )

for model_name in [
    "RadiologyProcedureCatalog",
    "RadiologyOrder",
    "RadiologyOrderItem",
    "RadiologyStudy",
    "RadiologyContrastAdministration",
    "RadiologyReport",
    "RadiologyAttachment",
]:
    text = re.sub(
        rf"\nmodel\s+{model_name}\s*\{{.*?\n\}}",
        "",
        text,
        flags=re.S,
    )

addition = r'''
enum RadiologyModality {
  XRAY
  CT
  MRI
  ULTRASOUND
  MAMMOGRAPHY
  FLUOROSCOPY
  DEXA
  PET_CT
  NUCLEAR_MEDICINE
  OTHER
}

enum RadiologyOrderPriority {
  ROUTINE
  URGENT
  STAT
}

enum RadiologyOrderStatus {
  ORDERED
  SCHEDULED
  CHECKED_IN
  IN_PROGRESS
  COMPLETED
  REPORTED
  CANCELLED
}

enum RadiologyStudyStatus {
  PENDING
  SCHEDULED
  PATIENT_READY
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum RadiologyReportStatus {
  DRAFT
  PRELIMINARY
  VERIFIED
  RELEASED
  AMENDED
}

enum ContrastRoute {
  ORAL
  INTRAVENOUS
  RECTAL
  INTRATHECAL
  OTHER
}

model RadiologyProcedureCatalog {
  id                    String            @id @default(uuid()) @db.Uuid
  hospitalId            String            @map("hospital_id") @db.Uuid
  procedureCode         String            @map("procedure_code") @db.VarChar(40)
  procedureName         String            @map("procedure_name") @db.VarChar(200)
  modality              RadiologyModality
  bodyPart              String?           @map("body_part") @db.VarChar(100)
  laterality            String?           @db.VarChar(30)
  requiresContrast      Boolean           @default(false) @map("requires_contrast")
  requiresPreparation   Boolean           @default(false) @map("requires_preparation")
  preparationInstructions String?         @map("preparation_instructions")
  estimatedMinutes      Int?              @map("estimated_minutes")
  price                 Decimal?          @db.Decimal(12, 2)
  reportTemplate        String?           @map("report_template")
  status                RecordStatus      @default(ACTIVE)
  createdAt             DateTime          @default(now()) @map("created_at")
  createdBy             String?           @map("created_by") @db.Uuid
  updatedAt             DateTime          @updatedAt @map("updated_at")
  updatedBy             String?           @map("updated_by") @db.Uuid
  deletedAt             DateTime?         @map("deleted_at")

  orderItems RadiologyOrderItem[]

  @@unique([hospitalId, procedureCode])
  @@index([hospitalId, status])
  @@index([modality])
  @@map("radiology_procedure_catalog")
}

model RadiologyOrder {
  id             String                 @id @default(uuid()) @db.Uuid
  hospitalId     String                 @map("hospital_id") @db.Uuid
  branchId       String                 @map("branch_id") @db.Uuid
  departmentId   String?                @map("department_id") @db.Uuid
  doctorId       String?                @map("doctor_id") @db.Uuid
  patientId      String                 @map("patient_id") @db.Uuid
  opdVisitId     String?                @map("opd_visit_id") @db.Uuid
  ipdAdmissionId String?                @map("ipd_admission_id") @db.Uuid
  orderNumber    String                 @map("order_number") @db.VarChar(40)
  priority       RadiologyOrderPriority @default(ROUTINE)
  status         RadiologyOrderStatus   @default(ORDERED)
  clinicalNotes  String?                @map("clinical_notes")
  provisionalDiagnosis String?          @map("provisional_diagnosis")
  requestedAt    DateTime               @default(now()) @map("requested_at")
  requestedBy    String?                @map("requested_by") @db.Uuid
  scheduledAt    DateTime?              @map("scheduled_at")
  cancelledAt    DateTime?              @map("cancelled_at")
  cancelledBy    String?                @map("cancelled_by") @db.Uuid
  cancelReason   String?                @map("cancel_reason")
  createdAt      DateTime               @default(now()) @map("created_at")
  updatedAt      DateTime               @updatedAt @map("updated_at")

  hospital   Hospital       @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  branch     HospitalBranch @relation(fields: [branchId], references: [id], onDelete: Restrict)
  department Department?    @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  doctor     Doctor?        @relation(fields: [doctorId], references: [id], onDelete: SetNull)
  patient    Patient        @relation(fields: [patientId], references: [id], onDelete: Restrict)
  items      RadiologyOrderItem[]
  studies    RadiologyStudy[]
  reports    RadiologyReport[]

  @@unique([hospitalId, orderNumber])
  @@index([hospitalId, requestedAt])
  @@index([patientId, requestedAt])
  @@index([status])
  @@index([priority])
  @@map("radiology_orders")
}

model RadiologyOrderItem {
  id           String               @id @default(uuid()) @db.Uuid
  hospitalId   String               @map("hospital_id") @db.Uuid
  orderId      String               @map("order_id") @db.Uuid
  procedureId  String               @map("procedure_id") @db.Uuid
  status       RadiologyOrderStatus @default(ORDERED)
  scheduledAt  DateTime?            @map("scheduled_at")
  price        Decimal?             @db.Decimal(12, 2)
  instructions String?
  createdAt    DateTime             @default(now()) @map("created_at")
  updatedAt    DateTime             @updatedAt @map("updated_at")

  order     RadiologyOrder            @relation(fields: [orderId], references: [id], onDelete: Cascade)
  procedure RadiologyProcedureCatalog @relation(fields: [procedureId], references: [id], onDelete: Restrict)
  study     RadiologyStudy?
  report    RadiologyReport?

  @@unique([orderId, procedureId])
  @@index([hospitalId])
  @@index([orderId])
  @@map("radiology_order_items")
}

model RadiologyStudy {
  id                   String               @id @default(uuid()) @db.Uuid
  hospitalId           String               @map("hospital_id") @db.Uuid
  orderId              String               @map("order_id") @db.Uuid
  orderItemId          String               @unique @map("order_item_id") @db.Uuid
  accessionNumber      String               @map("accession_number") @db.VarChar(50)
  modality             RadiologyModality
  status               RadiologyStudyStatus @default(PENDING)
  scheduledAt          DateTime?            @map("scheduled_at")
  checkInAt            DateTime?            @map("check_in_at")
  startedAt            DateTime?            @map("started_at")
  completedAt          DateTime?            @map("completed_at")
  technicianId         String?              @map("technician_id") @db.Uuid
  radiologistId        String?              @map("radiologist_id") @db.Uuid
  patientPreparation   String?              @map("patient_preparation")
  pregnancyStatus      String?              @map("pregnancy_status") @db.VarChar(30)
  creatinineValue      Decimal?             @map("creatinine_value") @db.Decimal(8, 2)
  pacsStudyUid         String?              @map("pacs_study_uid") @db.VarChar(200)
  dicomStudyUid        String?              @map("dicom_study_uid") @db.VarChar(200)
  workstationName      String?              @map("workstation_name") @db.VarChar(120)
  notes                String?
  createdAt            DateTime             @default(now()) @map("created_at")
  updatedAt            DateTime             @updatedAt @map("updated_at")

  order      RadiologyOrder     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderItem  RadiologyOrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  contrasts  RadiologyContrastAdministration[]
  attachments RadiologyAttachment[]
  report     RadiologyReport?

  @@unique([hospitalId, accessionNumber])
  @@index([orderId])
  @@index([status])
  @@index([scheduledAt])
  @@map("radiology_studies")
}

model RadiologyContrastAdministration {
  id                String        @id @default(uuid()) @db.Uuid
  hospitalId        String        @map("hospital_id") @db.Uuid
  studyId           String        @map("study_id") @db.Uuid
  contrastName      String        @map("contrast_name") @db.VarChar(150)
  route             ContrastRoute
  dose              Decimal?      @db.Decimal(10, 2)
  doseUnit          String?       @map("dose_unit") @db.VarChar(30)
  lotNumber         String?       @map("lot_number") @db.VarChar(80)
  administeredAt    DateTime      @default(now()) @map("administered_at")
  administeredBy    String?       @map("administered_by") @db.Uuid
  reactionObserved  Boolean       @default(false) @map("reaction_observed")
  reactionDetails   String?       @map("reaction_details")
  notes             String?

  study RadiologyStudy @relation(fields: [studyId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([studyId])
  @@map("radiology_contrast_administrations")
}

model RadiologyReport {
  id                String                @id @default(uuid()) @db.Uuid
  hospitalId        String                @map("hospital_id") @db.Uuid
  orderId           String                @map("order_id") @db.Uuid
  orderItemId       String                @unique @map("order_item_id") @db.Uuid
  studyId           String                @unique @map("study_id") @db.Uuid
  status            RadiologyReportStatus @default(DRAFT)
  clinicalHistory   String?               @map("clinical_history")
  technique         String?
  findings          String?
  impression        String?
  recommendations   String?
  comparisonStudy   String?               @map("comparison_study")
  reportedAt        DateTime?             @map("reported_at")
  reportedBy        String?               @map("reported_by") @db.Uuid
  verifiedAt        DateTime?             @map("verified_at")
  verifiedBy        String?               @map("verified_by") @db.Uuid
  releasedAt        DateTime?             @map("released_at")
  releasedBy        String?               @map("released_by") @db.Uuid
  amendmentReason   String?               @map("amendment_reason")
  createdAt         DateTime              @default(now()) @map("created_at")
  updatedAt         DateTime              @updatedAt @map("updated_at")

  order     RadiologyOrder     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderItem RadiologyOrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  study     RadiologyStudy     @relation(fields: [studyId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([orderId])
  @@index([status])
  @@map("radiology_reports")
}

model RadiologyAttachment {
  id          String   @id @default(uuid()) @db.Uuid
  hospitalId  String   @map("hospital_id") @db.Uuid
  studyId     String   @map("study_id") @db.Uuid
  fileName    String   @map("file_name") @db.VarChar(250)
  filePath    String   @map("file_path")
  mimeType    String?  @map("mime_type") @db.VarChar(120)
  fileSize    BigInt?  @map("file_size")
  attachmentType String @map("attachment_type") @db.VarChar(50)
  createdAt   DateTime @default(now()) @map("created_at")
  createdBy   String?  @map("created_by") @db.Uuid

  study RadiologyStudy @relation(fields: [studyId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([studyId])
  @@map("radiology_attachments")
}
'''

schema_path.write_text(
    text.rstrip() + "\n\n" + addition.strip() + "\n",
    encoding="utf-8",
)

print("RIS Prisma schema applied successfully")
