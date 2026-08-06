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
    ("Hospital", "labOrders", "  labOrders LabOrder[]"),
    ("HospitalBranch", "labOrders", "  labOrders LabOrder[]"),
    ("Department", "labOrders", "  labOrders LabOrder[]"),
    ("Doctor", "labOrders", "  labOrders LabOrder[]"),
    ("Patient", "labOrders", "  labOrders LabOrder[]"),
]:
    add_relation(model_name, prefix, line)

for enum_name in [
    "LabOrderStatus",
    "LabOrderPriority",
    "LabSampleStatus",
    "LabResultStatus",
    "LabValueType",
]:
    text = re.sub(
        rf"\nenum\s+{enum_name}\s*\{{.*?\n\}}",
        "",
        text,
        flags=re.S,
    )

for model_name in [
    "LabTestCatalog",
    "LabTestParameter",
    "LabOrder",
    "LabOrderItem",
    "LabSample",
    "LabResult",
    "LabResultValue",
]:
    text = re.sub(
        rf"\nmodel\s+{model_name}\s*\{{.*?\n\}}",
        "",
        text,
        flags=re.S,
    )

addition = '''
enum LabOrderStatus {
  ORDERED
  SAMPLE_PENDING
  SAMPLE_COLLECTED
  IN_PROCESS
  RESULT_ENTERED
  VERIFIED
  REPORTED
  CANCELLED
}

enum LabOrderPriority {
  ROUTINE
  URGENT
  STAT
}

enum LabSampleStatus {
  PENDING
  COLLECTED
  RECEIVED
  REJECTED
  PROCESSING
  COMPLETED
}

enum LabResultStatus {
  DRAFT
  ENTERED
  VERIFIED
  RELEASED
  AMENDED
}

enum LabValueType {
  NUMERIC
  TEXT
  BOOLEAN
  CHOICE
}

model LabTestCatalog {
  id                String       @id @default(uuid()) @db.Uuid
  hospitalId        String       @map("hospital_id") @db.Uuid
  testCode          String       @map("test_code") @db.VarChar(40)
  testName          String       @map("test_name") @db.VarChar(200)
  category          String?      @db.VarChar(120)
  sampleType        String       @map("sample_type") @db.VarChar(80)
  containerType     String?      @map("container_type") @db.VarChar(80)
  turnaroundMinutes Int?         @map("turnaround_minutes")
  price             Decimal?     @db.Decimal(12, 2)
  instructions      String?
  status            RecordStatus @default(ACTIVE)
  createdAt         DateTime     @default(now()) @map("created_at")
  createdBy         String?      @map("created_by") @db.Uuid
  updatedAt         DateTime     @updatedAt @map("updated_at")
  updatedBy         String?      @map("updated_by") @db.Uuid
  deletedAt         DateTime?    @map("deleted_at")

  parameters LabTestParameter[]
  orderItems LabOrderItem[]

  @@unique([hospitalId, testCode])
  @@index([hospitalId, status])
  @@map("lab_test_catalog")
}

model LabTestParameter {
  id             String       @id @default(uuid()) @db.Uuid
  hospitalId     String       @map("hospital_id") @db.Uuid
  testId         String       @map("test_id") @db.Uuid
  parameterCode  String       @map("parameter_code") @db.VarChar(40)
  parameterName  String       @map("parameter_name") @db.VarChar(200)
  valueType      LabValueType @default(NUMERIC) @map("value_type")
  unit           String?      @db.VarChar(50)
  referenceRange String?      @map("reference_range") @db.VarChar(200)
  criticalLow    Decimal?     @map("critical_low") @db.Decimal(14, 4)
  criticalHigh   Decimal?     @map("critical_high") @db.Decimal(14, 4)
  sortOrder      Int          @default(0) @map("sort_order")
  required       Boolean      @default(true)
  status         RecordStatus @default(ACTIVE)
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  test   LabTestCatalog @relation(fields: [testId], references: [id], onDelete: Cascade)
  values LabResultValue[]

  @@unique([testId, parameterCode])
  @@index([hospitalId])
  @@map("lab_test_parameters")
}

model LabOrder {
  id            String           @id @default(uuid()) @db.Uuid
  hospitalId    String           @map("hospital_id") @db.Uuid
  branchId      String           @map("branch_id") @db.Uuid
  departmentId  String?          @map("department_id") @db.Uuid
  doctorId      String?          @map("doctor_id") @db.Uuid
  patientId     String           @map("patient_id") @db.Uuid
  orderNumber   String           @map("order_number") @db.VarChar(40)
  priority      LabOrderPriority @default(ROUTINE)
  status        LabOrderStatus   @default(ORDERED)
  clinicalNotes String?          @map("clinical_notes")
  orderedAt     DateTime         @default(now()) @map("ordered_at")
  orderedBy     String?          @map("ordered_by") @db.Uuid
  createdAt     DateTime         @default(now()) @map("created_at")
  updatedAt     DateTime         @updatedAt @map("updated_at")

  hospital   Hospital       @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  branch     HospitalBranch @relation(fields: [branchId], references: [id], onDelete: Restrict)
  department Department?    @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  doctor     Doctor?        @relation(fields: [doctorId], references: [id], onDelete: SetNull)
  patient    Patient        @relation(fields: [patientId], references: [id], onDelete: Restrict)
  items      LabOrderItem[]
  samples    LabSample[]
  results    LabResult[]

  @@unique([hospitalId, orderNumber])
  @@index([hospitalId, orderedAt])
  @@index([patientId, orderedAt])
  @@index([status])
  @@map("lab_orders")
}

model LabOrderItem {
  id           String         @id @default(uuid()) @db.Uuid
  hospitalId   String         @map("hospital_id") @db.Uuid
  orderId      String         @map("order_id") @db.Uuid
  testId       String         @map("test_id") @db.Uuid
  status       LabOrderStatus @default(ORDERED)
  price        Decimal?       @db.Decimal(12, 2)
  instructions String?
  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt @map("updated_at")

  order  LabOrder       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  test   LabTestCatalog @relation(fields: [testId], references: [id], onDelete: Restrict)
  sample LabSample?
  result LabResult?

  @@unique([orderId, testId])
  @@index([hospitalId])
  @@map("lab_order_items")
}

model LabSample {
  id              String          @id @default(uuid()) @db.Uuid
  hospitalId      String          @map("hospital_id") @db.Uuid
  orderId         String          @map("order_id") @db.Uuid
  orderItemId     String          @unique @map("order_item_id") @db.Uuid
  sampleNumber    String          @map("sample_number") @db.VarChar(50)
  barcode         String?         @unique @db.VarChar(100)
  sampleType      String          @map("sample_type") @db.VarChar(80)
  status          LabSampleStatus @default(PENDING)
  collectedAt     DateTime?       @map("collected_at")
  collectedBy     String?         @map("collected_by") @db.Uuid
  rejectedAt      DateTime?       @map("rejected_at")
  rejectedBy      String?         @map("rejected_by") @db.Uuid
  rejectionReason String?         @map("rejection_reason")
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  order     LabOrder     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderItem LabOrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)

  @@unique([hospitalId, sampleNumber])
  @@index([orderId])
  @@index([status])
  @@map("lab_samples")
}

model LabResult {
  id              String          @id @default(uuid()) @db.Uuid
  hospitalId      String          @map("hospital_id") @db.Uuid
  orderId         String          @map("order_id") @db.Uuid
  orderItemId     String          @unique @map("order_item_id") @db.Uuid
  status          LabResultStatus @default(DRAFT)
  interpretation  String?
  remarks         String?
  enteredAt       DateTime?       @map("entered_at")
  enteredBy       String?         @map("entered_by") @db.Uuid
  verifiedAt      DateTime?       @map("verified_at")
  verifiedBy      String?         @map("verified_by") @db.Uuid
  releasedAt      DateTime?       @map("released_at")
  releasedBy      String?         @map("released_by") @db.Uuid
  amendmentReason String?         @map("amendment_reason")
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  order     LabOrder     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderItem LabOrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  values    LabResultValue[]

  @@index([hospitalId])
  @@index([orderId])
  @@index([status])
  @@map("lab_results")
}

model LabResultValue {
  id             String   @id @default(uuid()) @db.Uuid
  hospitalId     String   @map("hospital_id") @db.Uuid
  resultId       String   @map("result_id") @db.Uuid
  parameterId    String   @map("parameter_id") @db.Uuid
  numericValue   Decimal? @map("numeric_value") @db.Decimal(18, 6)
  textValue      String?  @map("text_value")
  booleanValue   Boolean? @map("boolean_value")
  choiceValue    String?  @map("choice_value") @db.VarChar(200)
  unit           String?  @db.VarChar(50)
  referenceRange String?  @map("reference_range") @db.VarChar(200)
  abnormalFlag   String?  @map("abnormal_flag") @db.VarChar(20)
  critical       Boolean  @default(false)
  comments       String?
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  result    LabResult        @relation(fields: [resultId], references: [id], onDelete: Cascade)
  parameter LabTestParameter @relation(fields: [parameterId], references: [id], onDelete: Restrict)

  @@unique([resultId, parameterId])
  @@index([hospitalId])
  @@map("lab_result_values")
}
'''

schema_path.write_text(
    text.rstrip() + "\n\n" + addition.strip() + "\n",
    encoding="utf-8",
)

print("LIS Prisma schema applied successfully")
