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
  ["Hospital", "billingInvoices", "  billingInvoices BillingInvoice[]"],
  ["HospitalBranch", "billingInvoices", "  billingInvoices BillingInvoice[]"],
  ["Patient", "billingInvoices", "  billingInvoices BillingInvoice[]"],
]) {
  ensureRelation(modelName, relationPrefix, relationLine);
}

for (const enumName of [
  "BillingInvoiceStatus",
  "BillingPaymentMode",
  "BillingPaymentStatus",
  "BillingLedgerEntryType",
  "BillingRefundStatus",
]) {
  const enumPattern = new RegExp(
    `\\nenum\\s+${enumName}\\s*\\{[\\s\\S]*?\\n\\}`,
    "m",
  );
  schema = schema.replace(enumPattern, "");
}

for (const modelName of [
  "BillingServiceCatalog",
  "BillingInvoice",
  "BillingInvoiceItem",
  "BillingPayment",
  "BillingRefund",
  "BillingAdvancePayment",
  "BillingPatientLedger",
]) {
  const modelPattern = new RegExp(
    `\\nmodel\\s+${modelName}\\s*\\{[\\s\\S]*?\\n\\}`,
    "m",
  );
  schema = schema.replace(modelPattern, "");
}

const addition = String.raw`
enum BillingInvoiceStatus {
  DRAFT
  ISSUED
  PARTIALLY_PAID
  PAID
  CANCELLED
  REFUNDED
}

enum BillingPaymentMode {
  CASH
  CARD
  UPI
  BANK_TRANSFER
  INSURANCE
  CREDIT
  ADVANCE
  OTHER
}

enum BillingPaymentStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
  REFUNDED
}

enum BillingLedgerEntryType {
  INVOICE
  PAYMENT
  REFUND
  ADVANCE
  ADJUSTMENT
  CREDIT_NOTE
}

enum BillingRefundStatus {
  PENDING
  APPROVED
  COMPLETED
  REJECTED
  CANCELLED
}

model BillingServiceCatalog {
  id             String       @id @default(uuid()) @db.Uuid
  hospitalId     String       @map("hospital_id") @db.Uuid
  serviceCode    String       @map("service_code") @db.VarChar(40)
  serviceName    String       @map("service_name") @db.VarChar(200)
  moduleCode     String       @map("module_code") @db.VarChar(50)
  departmentId   String?      @map("department_id") @db.Uuid
  description    String?
  basePrice      Decimal      @map("base_price") @db.Decimal(14, 2)
  gstPercent     Decimal?     @map("gst_percent") @db.Decimal(5, 2)
  discountAllowed Boolean     @default(true) @map("discount_allowed")
  status         RecordStatus @default(ACTIVE)
  createdAt      DateTime     @default(now()) @map("created_at")
  createdBy      String?      @map("created_by") @db.Uuid
  updatedAt      DateTime     @updatedAt @map("updated_at")
  updatedBy      String?      @map("updated_by") @db.Uuid
  deletedAt      DateTime?    @map("deleted_at")

  invoiceItems BillingInvoiceItem[]

  @@unique([hospitalId, serviceCode])
  @@index([hospitalId, moduleCode])
  @@index([departmentId])
  @@map("billing_service_catalog")
}

model BillingInvoice {
  id              String               @id @default(uuid()) @db.Uuid
  hospitalId      String               @map("hospital_id") @db.Uuid
  branchId        String               @map("branch_id") @db.Uuid
  patientId       String               @map("patient_id") @db.Uuid
  opdVisitId      String?              @map("opd_visit_id") @db.Uuid
  ipdAdmissionId  String?              @map("ipd_admission_id") @db.Uuid
  invoiceNumber   String               @map("invoice_number") @db.VarChar(40)
  status          BillingInvoiceStatus @default(DRAFT)
  invoiceDate     DateTime             @default(now()) @map("invoice_date")
  dueDate         DateTime?            @map("due_date") @db.Date
  subtotal        Decimal              @default(0) @db.Decimal(14, 2)
  taxAmount       Decimal              @default(0) @map("tax_amount") @db.Decimal(14, 2)
  discountAmount  Decimal              @default(0) @map("discount_amount") @db.Decimal(14, 2)
  roundOffAmount  Decimal              @default(0) @map("round_off_amount") @db.Decimal(14, 2)
  totalAmount     Decimal              @default(0) @map("total_amount") @db.Decimal(14, 2)
  paidAmount      Decimal              @default(0) @map("paid_amount") @db.Decimal(14, 2)
  balanceAmount   Decimal              @default(0) @map("balance_amount") @db.Decimal(14, 2)
  notes           String?
  cancellationReason String?           @map("cancellation_reason")
  cancelledAt     DateTime?            @map("cancelled_at")
  cancelledBy     String?              @map("cancelled_by") @db.Uuid
  createdAt       DateTime             @default(now()) @map("created_at")
  createdBy       String?              @map("created_by") @db.Uuid
  updatedAt       DateTime             @updatedAt @map("updated_at")
  updatedBy       String?              @map("updated_by") @db.Uuid

  hospital Hospital       @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  branch   HospitalBranch @relation(fields: [branchId], references: [id], onDelete: Restrict)
  patient  Patient        @relation(fields: [patientId], references: [id], onDelete: Restrict)
  items    BillingInvoiceItem[]
  payments BillingPayment[]
  refunds  BillingRefund[]

  @@unique([hospitalId, invoiceNumber])
  @@index([hospitalId, invoiceDate])
  @@index([patientId, invoiceDate])
  @@index([status])
  @@map("billing_invoices")
}

model BillingInvoiceItem {
  id              String   @id @default(uuid()) @db.Uuid
  hospitalId      String   @map("hospital_id") @db.Uuid
  invoiceId       String   @map("invoice_id") @db.Uuid
  serviceId       String?  @map("service_id") @db.Uuid
  sourceModule    String?  @map("source_module") @db.VarChar(50)
  sourceEntityId  String?  @map("source_entity_id") @db.Uuid
  description     String   @db.VarChar(300)
  quantity        Decimal  @default(1) @db.Decimal(12, 3)
  unitPrice       Decimal  @map("unit_price") @db.Decimal(14, 2)
  discountPercent Decimal? @map("discount_percent") @db.Decimal(5, 2)
  discountAmount  Decimal  @default(0) @map("discount_amount") @db.Decimal(14, 2)
  taxPercent      Decimal? @map("tax_percent") @db.Decimal(5, 2)
  taxAmount       Decimal  @default(0) @map("tax_amount") @db.Decimal(14, 2)
  lineTotal       Decimal  @map("line_total") @db.Decimal(14, 2)
  createdAt       DateTime @default(now()) @map("created_at")

  invoice BillingInvoice        @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  service BillingServiceCatalog? @relation(fields: [serviceId], references: [id], onDelete: SetNull)

  @@index([hospitalId])
  @@index([invoiceId])
  @@index([serviceId])
  @@index([sourceModule, sourceEntityId])
  @@map("billing_invoice_items")
}

model BillingPayment {
  id              String               @id @default(uuid()) @db.Uuid
  hospitalId      String               @map("hospital_id") @db.Uuid
  branchId        String               @map("branch_id") @db.Uuid
  invoiceId       String               @map("invoice_id") @db.Uuid
  patientId       String               @map("patient_id") @db.Uuid
  receiptNumber   String               @map("receipt_number") @db.VarChar(40)
  paymentMode     BillingPaymentMode   @map("payment_mode")
  status          BillingPaymentStatus @default(COMPLETED)
  amount          Decimal              @db.Decimal(14, 2)
  transactionReference String?         @map("transaction_reference") @db.VarChar(150)
  paymentDate     DateTime             @default(now()) @map("payment_date")
  remarks         String?
  receivedBy      String?              @map("received_by") @db.Uuid
  createdAt       DateTime             @default(now()) @map("created_at")

  invoice BillingInvoice @relation(fields: [invoiceId], references: [id], onDelete: Restrict)

  @@unique([hospitalId, receiptNumber])
  @@index([invoiceId])
  @@index([patientId, paymentDate])
  @@index([status])
  @@map("billing_payments")
}

model BillingRefund {
  id             String              @id @default(uuid()) @db.Uuid
  hospitalId     String              @map("hospital_id") @db.Uuid
  branchId       String              @map("branch_id") @db.Uuid
  invoiceId      String              @map("invoice_id") @db.Uuid
  paymentId      String?             @map("payment_id") @db.Uuid
  refundNumber   String              @map("refund_number") @db.VarChar(40)
  amount         Decimal             @db.Decimal(14, 2)
  reason         String
  status         BillingRefundStatus @default(PENDING)
  paymentMode    BillingPaymentMode? @map("payment_mode")
  approvedAt     DateTime?           @map("approved_at")
  approvedBy     String?             @map("approved_by") @db.Uuid
  completedAt    DateTime?           @map("completed_at")
  completedBy    String?             @map("completed_by") @db.Uuid
  createdAt      DateTime            @default(now()) @map("created_at")
  createdBy      String?             @map("created_by") @db.Uuid

  invoice BillingInvoice @relation(fields: [invoiceId], references: [id], onDelete: Restrict)

  @@unique([hospitalId, refundNumber])
  @@index([invoiceId])
  @@index([status])
  @@map("billing_refunds")
}

model BillingAdvancePayment {
  id              String             @id @default(uuid()) @db.Uuid
  hospitalId      String             @map("hospital_id") @db.Uuid
  branchId        String             @map("branch_id") @db.Uuid
  patientId       String             @map("patient_id") @db.Uuid
  advanceNumber   String             @map("advance_number") @db.VarChar(40)
  paymentMode     BillingPaymentMode @map("payment_mode")
  amount          Decimal            @db.Decimal(14, 2)
  utilizedAmount  Decimal            @default(0) @map("utilized_amount") @db.Decimal(14, 2)
  balanceAmount   Decimal            @map("balance_amount") @db.Decimal(14, 2)
  transactionReference String?       @map("transaction_reference") @db.VarChar(150)
  remarks         String?
  receivedAt      DateTime           @default(now()) @map("received_at")
  receivedBy      String?            @map("received_by") @db.Uuid

  @@unique([hospitalId, advanceNumber])
  @@index([patientId, receivedAt])
  @@map("billing_advance_payments")
}

model BillingPatientLedger {
  id             String                 @id @default(uuid()) @db.Uuid
  hospitalId     String                 @map("hospital_id") @db.Uuid
  branchId       String                 @map("branch_id") @db.Uuid
  patientId      String                 @map("patient_id") @db.Uuid
  entryType      BillingLedgerEntryType @map("entry_type")
  referenceType  String?                @map("reference_type") @db.VarChar(50)
  referenceId    String?                @map("reference_id") @db.Uuid
  description    String
  debitAmount    Decimal                @default(0) @map("debit_amount") @db.Decimal(14, 2)
  creditAmount   Decimal                @default(0) @map("credit_amount") @db.Decimal(14, 2)
  balanceAfter   Decimal                @map("balance_after") @db.Decimal(14, 2)
  entryAt        DateTime               @default(now()) @map("entry_at")
  createdBy      String?                @map("created_by") @db.Uuid

  @@index([hospitalId, patientId, entryAt])
  @@index([referenceType, referenceId])
  @@map("billing_patient_ledger")
}
`;

schema = `${schema.trimEnd()}\n\n${addition.trim()}\n`;
fs.writeFileSync(schemaPath, schema, "utf8");

console.log("Billing Prisma schema applied successfully");
