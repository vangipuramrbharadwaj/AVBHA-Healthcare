import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const backendRoot = process.cwd();
const schemaPath = path.join(backendRoot, "prisma", "schema.prisma");

if (!fs.existsSync(schemaPath)) {
  throw new Error(`Prisma schema not found: ${schemaPath}. Run this script from the backend folder.`);
}

let schema = fs.readFileSync(schemaPath, "utf8");

function replaceModel(modelName, transform) {
  const pattern = new RegExp(`model\\s+${modelName}\\s*\\{[\\s\\S]*?\\n\\}`, "m");
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

    const mapIndex = lines.findIndex((line) => line.trim().startsWith("@@map("));
    if (mapIndex < 0) {
      throw new Error(`@@map was not found in model ${modelName}`);
    }

    lines.splice(mapIndex, 0, relationLine);
    return lines.join("\n");
  });
}

for (const [modelName, relationPrefix, relationLine] of [
  ["Hospital", "pharmacySales", "  pharmacySales PharmacySale[]"],
  ["HospitalBranch", "pharmacySales", "  pharmacySales PharmacySale[]"],
  ["Patient", "pharmacySales", "  pharmacySales PharmacySale[]"],
]) {
  ensureRelation(modelName, relationPrefix, relationLine);
}

for (const enumName of [
  "PharmacyMedicineStatus",
  "PharmacyStockTransactionType",
  "PharmacyPurchaseStatus",
  "PharmacySaleStatus",
  "PharmacyPaymentMode",
  "PharmacyDispenseStatus",
]) {
  const enumPattern = new RegExp(`\\nenum\\s+${enumName}\\s*\\{[\\s\\S]*?\\n\\}`, "m");
  schema = schema.replace(enumPattern, "");
}

for (const modelName of [
  "PharmacySupplier",
  "PharmacyMedicine",
  "PharmacyMedicineBatch",
  "PharmacyPurchaseOrder",
  "PharmacyPurchaseOrderItem",
  "PharmacyGoodsReceipt",
  "PharmacyStockTransaction",
  "PharmacyDispense",
  "PharmacyDispenseItem",
  "PharmacySale",
  "PharmacySaleItem",
]) {
  const modelPattern = new RegExp(`\\nmodel\\s+${modelName}\\s*\\{[\\s\\S]*?\\n\\}`, "m");
  schema = schema.replace(modelPattern, "");
}

const addition = String.raw`
enum PharmacyMedicineStatus {
  ACTIVE
  INACTIVE
  DISCONTINUED
}

enum PharmacyStockTransactionType {
  PURCHASE
  SALE
  DISPENSE
  RETURN_IN
  RETURN_OUT
  ADJUSTMENT_IN
  ADJUSTMENT_OUT
  DAMAGE
  EXPIRED
  TRANSFER_IN
  TRANSFER_OUT
}

enum PharmacyPurchaseStatus {
  DRAFT
  ORDERED
  PARTIALLY_RECEIVED
  RECEIVED
  CANCELLED
}

enum PharmacySaleStatus {
  DRAFT
  COMPLETED
  CANCELLED
  REFUNDED
}

enum PharmacyPaymentMode {
  CASH
  CARD
  UPI
  CREDIT
  INSURANCE
  OTHER
}

enum PharmacyDispenseStatus {
  PENDING
  PARTIAL
  COMPLETED
  CANCELLED
}

model PharmacySupplier {
  id            String       @id @default(uuid()) @db.Uuid
  hospitalId    String       @map("hospital_id") @db.Uuid
  supplierCode  String       @map("supplier_code") @db.VarChar(30)
  supplierName  String       @map("supplier_name") @db.VarChar(200)
  contactPerson String?      @map("contact_person") @db.VarChar(150)
  phone         String?      @db.VarChar(20)
  email         String?      @db.VarChar(150)
  gstin         String?      @db.VarChar(20)
  drugLicenseNo String?      @map("drug_license_no") @db.VarChar(80)
  address       String?
  paymentTerms  String?      @map("payment_terms") @db.VarChar(100)
  status        RecordStatus @default(ACTIVE)
  createdAt     DateTime     @default(now()) @map("created_at")
  createdBy     String?      @map("created_by") @db.Uuid
  updatedAt     DateTime     @updatedAt @map("updated_at")
  updatedBy     String?      @map("updated_by") @db.Uuid
  deletedAt     DateTime?    @map("deleted_at")

  purchaseOrders PharmacyPurchaseOrder[]
  batches        PharmacyMedicineBatch[]

  @@unique([hospitalId, supplierCode])
  @@index([hospitalId, status])
  @@map("pharmacy_suppliers")
}

model PharmacyMedicine {
  id                   String                 @id @default(uuid()) @db.Uuid
  hospitalId           String                 @map("hospital_id") @db.Uuid
  medicineCode         String                 @map("medicine_code") @db.VarChar(40)
  brandName            String                 @map("brand_name") @db.VarChar(200)
  genericName          String?                @map("generic_name") @db.VarChar(200)
  strength             String?                @db.VarChar(80)
  dosageForm           String?                @map("dosage_form") @db.VarChar(80)
  manufacturer         String?                @db.VarChar(200)
  hsnCode              String?                @map("hsn_code") @db.VarChar(30)
  gstPercent           Decimal?               @map("gst_percent") @db.Decimal(5, 2)
  purchasePrice        Decimal?               @map("purchase_price") @db.Decimal(12, 2)
  sellingPrice         Decimal?               @map("selling_price") @db.Decimal(12, 2)
  reorderLevel         Decimal?               @map("reorder_level") @db.Decimal(14, 3)
  controlledDrug       Boolean                @default(false) @map("controlled_drug")
  requiresPrescription Boolean                @default(true) @map("requires_prescription")
  barcode              String?                @db.VarChar(100)
  storageInstructions  String?                @map("storage_instructions")
  status               PharmacyMedicineStatus @default(ACTIVE)
  createdAt            DateTime               @default(now()) @map("created_at")
  createdBy            String?                @map("created_by") @db.Uuid
  updatedAt            DateTime               @updatedAt @map("updated_at")
  updatedBy            String?                @map("updated_by") @db.Uuid
  deletedAt            DateTime?              @map("deleted_at")

  batches            PharmacyMedicineBatch[]
  purchaseOrderItems PharmacyPurchaseOrderItem[]
  stockTransactions  PharmacyStockTransaction[]
  dispenseItems      PharmacyDispenseItem[]
  saleItems          PharmacySaleItem[]

  @@unique([hospitalId, medicineCode])
  @@index([hospitalId, status])
  @@index([barcode])
  @@index([brandName])
  @@map("pharmacy_medicines")
}

model PharmacyMedicineBatch {
  id                String       @id @default(uuid()) @db.Uuid
  hospitalId        String       @map("hospital_id") @db.Uuid
  branchId          String       @map("branch_id") @db.Uuid
  medicineId        String       @map("medicine_id") @db.Uuid
  supplierId        String?      @map("supplier_id") @db.Uuid
  batchNumber       String       @map("batch_number") @db.VarChar(80)
  manufacturingDate DateTime?    @map("manufacturing_date") @db.Date
  expiryDate        DateTime     @map("expiry_date") @db.Date
  purchasePrice     Decimal      @map("purchase_price") @db.Decimal(12, 2)
  sellingPrice      Decimal      @map("selling_price") @db.Decimal(12, 2)
  availableQuantity Decimal      @map("available_quantity") @db.Decimal(14, 3)
  reservedQuantity  Decimal      @default(0) @map("reserved_quantity") @db.Decimal(14, 3)
  rackLocation      String?      @map("rack_location") @db.VarChar(80)
  status            RecordStatus @default(ACTIVE)
  createdAt         DateTime     @default(now()) @map("created_at")
  updatedAt         DateTime     @updatedAt @map("updated_at")

  medicine          PharmacyMedicine @relation(fields: [medicineId], references: [id], onDelete: Restrict)
  supplier          PharmacySupplier? @relation(fields: [supplierId], references: [id], onDelete: SetNull)
  stockTransactions PharmacyStockTransaction[]
  dispenseItems     PharmacyDispenseItem[]
  saleItems         PharmacySaleItem[]

  @@unique([hospitalId, branchId, medicineId, batchNumber])
  @@index([hospitalId, branchId])
  @@index([medicineId])
  @@index([expiryDate])
  @@map("pharmacy_medicine_batches")
}

model PharmacyPurchaseOrder {
  id             String                 @id @default(uuid()) @db.Uuid
  hospitalId     String                 @map("hospital_id") @db.Uuid
  branchId       String                 @map("branch_id") @db.Uuid
  supplierId     String                 @map("supplier_id") @db.Uuid
  purchaseNumber String                 @map("purchase_number") @db.VarChar(40)
  status         PharmacyPurchaseStatus @default(DRAFT)
  orderDate      DateTime               @default(now()) @map("order_date")
  expectedDate   DateTime?              @map("expected_date") @db.Date
  subtotal       Decimal                @default(0) @db.Decimal(14, 2)
  taxAmount      Decimal                @default(0) @map("tax_amount") @db.Decimal(14, 2)
  discountAmount Decimal                @default(0) @map("discount_amount") @db.Decimal(14, 2)
  totalAmount    Decimal                @default(0) @map("total_amount") @db.Decimal(14, 2)
  notes          String?
  createdAt      DateTime               @default(now()) @map("created_at")
  createdBy      String?                @map("created_by") @db.Uuid
  updatedAt      DateTime               @updatedAt @map("updated_at")
  updatedBy      String?                @map("updated_by") @db.Uuid

  supplier PharmacySupplier            @relation(fields: [supplierId], references: [id], onDelete: Restrict)
  items    PharmacyPurchaseOrderItem[]
  receipts PharmacyGoodsReceipt[]

  @@unique([hospitalId, purchaseNumber])
  @@index([hospitalId, orderDate])
  @@index([supplierId])
  @@index([status])
  @@map("pharmacy_purchase_orders")
}

model PharmacyPurchaseOrderItem {
  id               String   @id @default(uuid()) @db.Uuid
  hospitalId       String   @map("hospital_id") @db.Uuid
  purchaseOrderId  String   @map("purchase_order_id") @db.Uuid
  medicineId       String   @map("medicine_id") @db.Uuid
  orderedQuantity  Decimal  @map("ordered_quantity") @db.Decimal(14, 3)
  receivedQuantity Decimal  @default(0) @map("received_quantity") @db.Decimal(14, 3)
  unitPrice         Decimal  @map("unit_price") @db.Decimal(12, 2)
  taxPercent        Decimal? @map("tax_percent") @db.Decimal(5, 2)
  discountPercent   Decimal? @map("discount_percent") @db.Decimal(5, 2)
  lineTotal         Decimal  @map("line_total") @db.Decimal(14, 2)
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  purchaseOrder PharmacyPurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  medicine      PharmacyMedicine      @relation(fields: [medicineId], references: [id], onDelete: Restrict)

  @@index([hospitalId])
  @@index([purchaseOrderId])
  @@map("pharmacy_purchase_order_items")
}

model PharmacyGoodsReceipt {
  id              String   @id @default(uuid()) @db.Uuid
  hospitalId      String   @map("hospital_id") @db.Uuid
  branchId        String   @map("branch_id") @db.Uuid
  purchaseOrderId String   @map("purchase_order_id") @db.Uuid
  receiptNumber   String   @map("receipt_number") @db.VarChar(40)
  supplierInvoice String?  @map("supplier_invoice") @db.VarChar(100)
  receiptDate     DateTime @default(now()) @map("receipt_date")
  notes           String?
  createdBy       String?  @map("created_by") @db.Uuid
  createdAt       DateTime @default(now()) @map("created_at")

  purchaseOrder PharmacyPurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Restrict)

  @@unique([hospitalId, receiptNumber])
  @@index([purchaseOrderId])
  @@map("pharmacy_goods_receipts")
}

model PharmacyStockTransaction {
  id              String                       @id @default(uuid()) @db.Uuid
  hospitalId      String                       @map("hospital_id") @db.Uuid
  branchId        String                       @map("branch_id") @db.Uuid
  medicineId      String                       @map("medicine_id") @db.Uuid
  batchId         String?                      @map("batch_id") @db.Uuid
  transactionType PharmacyStockTransactionType @map("transaction_type")
  quantity        Decimal                      @db.Decimal(14, 3)
  balanceAfter    Decimal?                     @map("balance_after") @db.Decimal(14, 3)
  referenceType   String?                      @map("reference_type") @db.VarChar(50)
  referenceId     String?                      @map("reference_id") @db.Uuid
  remarks         String?
  transactionAt   DateTime                     @default(now()) @map("transaction_at")
  createdBy       String?                      @map("created_by") @db.Uuid

  medicine PharmacyMedicine       @relation(fields: [medicineId], references: [id], onDelete: Restrict)
  batch    PharmacyMedicineBatch? @relation(fields: [batchId], references: [id], onDelete: SetNull)

  @@index([hospitalId, branchId, transactionAt])
  @@index([medicineId])
  @@index([batchId])
  @@map("pharmacy_stock_transactions")
}

model PharmacyDispense {
  id             String                 @id @default(uuid()) @db.Uuid
  hospitalId     String                 @map("hospital_id") @db.Uuid
  branchId       String                 @map("branch_id") @db.Uuid
  patientId      String                 @map("patient_id") @db.Uuid
  opdVisitId     String?                @map("opd_visit_id") @db.Uuid
  ipdAdmissionId String?                @map("ipd_admission_id") @db.Uuid
  prescriptionId String?                @map("prescription_id") @db.Uuid
  dispenseNumber String                 @map("dispense_number") @db.VarChar(40)
  status         PharmacyDispenseStatus @default(PENDING)
  dispensedAt    DateTime?              @map("dispensed_at")
  dispensedBy    String?                @map("dispensed_by") @db.Uuid
  notes          String?
  createdAt      DateTime               @default(now()) @map("created_at")
  updatedAt      DateTime               @updatedAt @map("updated_at")

  items PharmacyDispenseItem[]

  @@unique([hospitalId, dispenseNumber])
  @@index([hospitalId, createdAt])
  @@index([patientId])
  @@index([status])
  @@map("pharmacy_dispenses")
}

model PharmacyDispenseItem {
  id                  String   @id @default(uuid()) @db.Uuid
  hospitalId          String   @map("hospital_id") @db.Uuid
  dispenseId          String   @map("dispense_id") @db.Uuid
  medicineId          String   @map("medicine_id") @db.Uuid
  batchId             String   @map("batch_id") @db.Uuid
  prescribedQuantity  Decimal? @map("prescribed_quantity") @db.Decimal(14, 3)
  dispensedQuantity   Decimal  @map("dispensed_quantity") @db.Decimal(14, 3)
  unitPrice            Decimal  @map("unit_price") @db.Decimal(12, 2)
  lineTotal            Decimal  @map("line_total") @db.Decimal(14, 2)
  substitutionReason   String?  @map("substitution_reason")
  instructions         String?
  createdAt            DateTime @default(now()) @map("created_at")

  dispense PharmacyDispense      @relation(fields: [dispenseId], references: [id], onDelete: Cascade)
  medicine PharmacyMedicine      @relation(fields: [medicineId], references: [id], onDelete: Restrict)
  batch    PharmacyMedicineBatch @relation(fields: [batchId], references: [id], onDelete: Restrict)

  @@index([hospitalId])
  @@index([dispenseId])
  @@map("pharmacy_dispense_items")
}

model PharmacySale {
  id             String              @id @default(uuid()) @db.Uuid
  hospitalId     String              @map("hospital_id") @db.Uuid
  branchId       String              @map("branch_id") @db.Uuid
  patientId      String?             @map("patient_id") @db.Uuid
  dispenseId     String?             @map("dispense_id") @db.Uuid
  saleNumber     String              @map("sale_number") @db.VarChar(40)
  status         PharmacySaleStatus  @default(DRAFT)
  paymentMode    PharmacyPaymentMode @default(CASH) @map("payment_mode")
  subtotal       Decimal             @default(0) @db.Decimal(14, 2)
  taxAmount      Decimal             @default(0) @map("tax_amount") @db.Decimal(14, 2)
  discountAmount Decimal             @default(0) @map("discount_amount") @db.Decimal(14, 2)
  totalAmount    Decimal             @default(0) @map("total_amount") @db.Decimal(14, 2)
  amountPaid     Decimal             @default(0) @map("amount_paid") @db.Decimal(14, 2)
  saleDate       DateTime            @default(now()) @map("sale_date")
  notes          String?
  createdBy      String?             @map("created_by") @db.Uuid
  createdAt      DateTime            @default(now()) @map("created_at")
  updatedAt      DateTime            @updatedAt @map("updated_at")

  hospital Hospital       @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  branch   HospitalBranch @relation(fields: [branchId], references: [id], onDelete: Restrict)
  patient  Patient?       @relation(fields: [patientId], references: [id], onDelete: SetNull)
  items    PharmacySaleItem[]

  @@unique([hospitalId, saleNumber])
  @@index([hospitalId, saleDate])
  @@index([patientId])
  @@index([status])
  @@map("pharmacy_sales")
}

model PharmacySaleItem {
  id              String   @id @default(uuid()) @db.Uuid
  hospitalId      String   @map("hospital_id") @db.Uuid
  saleId          String   @map("sale_id") @db.Uuid
  medicineId      String   @map("medicine_id") @db.Uuid
  batchId         String   @map("batch_id") @db.Uuid
  quantity        Decimal  @db.Decimal(14, 3)
  unitPrice       Decimal  @map("unit_price") @db.Decimal(12, 2)
  taxPercent      Decimal? @map("tax_percent") @db.Decimal(5, 2)
  discountPercent Decimal? @map("discount_percent") @db.Decimal(5, 2)
  lineTotal       Decimal  @map("line_total") @db.Decimal(14, 2)
  createdAt       DateTime @default(now()) @map("created_at")

  sale     PharmacySale          @relation(fields: [saleId], references: [id], onDelete: Cascade)
  medicine PharmacyMedicine      @relation(fields: [medicineId], references: [id], onDelete: Restrict)
  batch    PharmacyMedicineBatch @relation(fields: [batchId], references: [id], onDelete: Restrict)

  @@index([hospitalId])
  @@index([saleId])
  @@map("pharmacy_sale_items")
}
`;

schema = `${schema.trimEnd()}\n\n${addition.trim()}\n`;
fs.writeFileSync(schemaPath, schema, "utf8");

console.log("Pharmacy Prisma schema applied successfully");
