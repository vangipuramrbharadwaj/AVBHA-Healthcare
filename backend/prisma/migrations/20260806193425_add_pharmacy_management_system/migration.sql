-- CreateEnum
CREATE TYPE "PharmacyMedicineStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "PharmacyStockTransactionType" AS ENUM ('PURCHASE', 'SALE', 'DISPENSE', 'RETURN_IN', 'RETURN_OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'DAMAGE', 'EXPIRED', 'TRANSFER_IN', 'TRANSFER_OUT');

-- CreateEnum
CREATE TYPE "PharmacyPurchaseStatus" AS ENUM ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PharmacySaleStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PharmacyPaymentMode" AS ENUM ('CASH', 'CARD', 'UPI', 'CREDIT', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "PharmacyDispenseStatus" AS ENUM ('PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "pharmacy_suppliers" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "supplier_code" VARCHAR(30) NOT NULL,
    "supplier_name" VARCHAR(200) NOT NULL,
    "contact_person" VARCHAR(150),
    "phone" VARCHAR(20),
    "email" VARCHAR(150),
    "gstin" VARCHAR(20),
    "drug_license_no" VARCHAR(80),
    "address" TEXT,
    "payment_terms" VARCHAR(100),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pharmacy_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_medicines" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "medicine_code" VARCHAR(40) NOT NULL,
    "brand_name" VARCHAR(200) NOT NULL,
    "generic_name" VARCHAR(200),
    "strength" VARCHAR(80),
    "dosage_form" VARCHAR(80),
    "manufacturer" VARCHAR(200),
    "hsn_code" VARCHAR(30),
    "gst_percent" DECIMAL(5,2),
    "purchase_price" DECIMAL(12,2),
    "selling_price" DECIMAL(12,2),
    "reorder_level" DECIMAL(14,3),
    "controlled_drug" BOOLEAN NOT NULL DEFAULT false,
    "requires_prescription" BOOLEAN NOT NULL DEFAULT true,
    "barcode" VARCHAR(100),
    "storage_instructions" TEXT,
    "status" "PharmacyMedicineStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pharmacy_medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_medicine_batches" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "medicine_id" UUID NOT NULL,
    "supplier_id" UUID,
    "batch_number" VARCHAR(80) NOT NULL,
    "manufacturing_date" DATE,
    "expiry_date" DATE NOT NULL,
    "purchase_price" DECIMAL(12,2) NOT NULL,
    "selling_price" DECIMAL(12,2) NOT NULL,
    "available_quantity" DECIMAL(14,3) NOT NULL,
    "reserved_quantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "rack_location" VARCHAR(80),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacy_medicine_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_purchase_orders" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "purchase_number" VARCHAR(40) NOT NULL,
    "status" "PharmacyPurchaseStatus" NOT NULL DEFAULT 'DRAFT',
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_date" DATE,
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "pharmacy_purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_purchase_order_items" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "medicine_id" UUID NOT NULL,
    "ordered_quantity" DECIMAL(14,3) NOT NULL,
    "received_quantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "tax_percent" DECIMAL(5,2),
    "discount_percent" DECIMAL(5,2),
    "line_total" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacy_purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_goods_receipts" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "receipt_number" VARCHAR(40) NOT NULL,
    "supplier_invoice" VARCHAR(100),
    "receipt_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pharmacy_goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_stock_transactions" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "medicine_id" UUID NOT NULL,
    "batch_id" UUID,
    "transaction_type" "PharmacyStockTransactionType" NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "balance_after" DECIMAL(14,3),
    "reference_type" VARCHAR(50),
    "reference_id" UUID,
    "remarks" TEXT,
    "transaction_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "pharmacy_stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_dispenses" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "opd_visit_id" UUID,
    "ipd_admission_id" UUID,
    "prescription_id" UUID,
    "dispense_number" VARCHAR(40) NOT NULL,
    "status" "PharmacyDispenseStatus" NOT NULL DEFAULT 'PENDING',
    "dispensed_at" TIMESTAMP(3),
    "dispensed_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacy_dispenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_dispense_items" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "dispense_id" UUID NOT NULL,
    "medicine_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "prescribed_quantity" DECIMAL(14,3),
    "dispensed_quantity" DECIMAL(14,3) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(14,2) NOT NULL,
    "substitution_reason" TEXT,
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pharmacy_dispense_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_sales" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "patient_id" UUID,
    "dispense_id" UUID,
    "sale_number" VARCHAR(40) NOT NULL,
    "status" "PharmacySaleStatus" NOT NULL DEFAULT 'DRAFT',
    "payment_mode" "PharmacyPaymentMode" NOT NULL DEFAULT 'CASH',
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amount_paid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sale_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacy_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_sale_items" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "medicine_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "tax_percent" DECIMAL(5,2),
    "discount_percent" DECIMAL(5,2),
    "line_total" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pharmacy_sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pharmacy_suppliers_hospital_id_status_idx" ON "pharmacy_suppliers"("hospital_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_suppliers_hospital_id_supplier_code_key" ON "pharmacy_suppliers"("hospital_id", "supplier_code");

-- CreateIndex
CREATE INDEX "pharmacy_medicines_hospital_id_status_idx" ON "pharmacy_medicines"("hospital_id", "status");

-- CreateIndex
CREATE INDEX "pharmacy_medicines_barcode_idx" ON "pharmacy_medicines"("barcode");

-- CreateIndex
CREATE INDEX "pharmacy_medicines_brand_name_idx" ON "pharmacy_medicines"("brand_name");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_medicines_hospital_id_medicine_code_key" ON "pharmacy_medicines"("hospital_id", "medicine_code");

-- CreateIndex
CREATE INDEX "pharmacy_medicine_batches_hospital_id_branch_id_idx" ON "pharmacy_medicine_batches"("hospital_id", "branch_id");

-- CreateIndex
CREATE INDEX "pharmacy_medicine_batches_medicine_id_idx" ON "pharmacy_medicine_batches"("medicine_id");

-- CreateIndex
CREATE INDEX "pharmacy_medicine_batches_expiry_date_idx" ON "pharmacy_medicine_batches"("expiry_date");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_medicine_batches_hospital_id_branch_id_medicine_id_key" ON "pharmacy_medicine_batches"("hospital_id", "branch_id", "medicine_id", "batch_number");

-- CreateIndex
CREATE INDEX "pharmacy_purchase_orders_hospital_id_order_date_idx" ON "pharmacy_purchase_orders"("hospital_id", "order_date");

-- CreateIndex
CREATE INDEX "pharmacy_purchase_orders_supplier_id_idx" ON "pharmacy_purchase_orders"("supplier_id");

-- CreateIndex
CREATE INDEX "pharmacy_purchase_orders_status_idx" ON "pharmacy_purchase_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_purchase_orders_hospital_id_purchase_number_key" ON "pharmacy_purchase_orders"("hospital_id", "purchase_number");

-- CreateIndex
CREATE INDEX "pharmacy_purchase_order_items_hospital_id_idx" ON "pharmacy_purchase_order_items"("hospital_id");

-- CreateIndex
CREATE INDEX "pharmacy_purchase_order_items_purchase_order_id_idx" ON "pharmacy_purchase_order_items"("purchase_order_id");

-- CreateIndex
CREATE INDEX "pharmacy_goods_receipts_purchase_order_id_idx" ON "pharmacy_goods_receipts"("purchase_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_goods_receipts_hospital_id_receipt_number_key" ON "pharmacy_goods_receipts"("hospital_id", "receipt_number");

-- CreateIndex
CREATE INDEX "pharmacy_stock_transactions_hospital_id_branch_id_transacti_idx" ON "pharmacy_stock_transactions"("hospital_id", "branch_id", "transaction_at");

-- CreateIndex
CREATE INDEX "pharmacy_stock_transactions_medicine_id_idx" ON "pharmacy_stock_transactions"("medicine_id");

-- CreateIndex
CREATE INDEX "pharmacy_stock_transactions_batch_id_idx" ON "pharmacy_stock_transactions"("batch_id");

-- CreateIndex
CREATE INDEX "pharmacy_dispenses_hospital_id_created_at_idx" ON "pharmacy_dispenses"("hospital_id", "created_at");

-- CreateIndex
CREATE INDEX "pharmacy_dispenses_patient_id_idx" ON "pharmacy_dispenses"("patient_id");

-- CreateIndex
CREATE INDEX "pharmacy_dispenses_status_idx" ON "pharmacy_dispenses"("status");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_dispenses_hospital_id_dispense_number_key" ON "pharmacy_dispenses"("hospital_id", "dispense_number");

-- CreateIndex
CREATE INDEX "pharmacy_dispense_items_hospital_id_idx" ON "pharmacy_dispense_items"("hospital_id");

-- CreateIndex
CREATE INDEX "pharmacy_dispense_items_dispense_id_idx" ON "pharmacy_dispense_items"("dispense_id");

-- CreateIndex
CREATE INDEX "pharmacy_sales_hospital_id_sale_date_idx" ON "pharmacy_sales"("hospital_id", "sale_date");

-- CreateIndex
CREATE INDEX "pharmacy_sales_patient_id_idx" ON "pharmacy_sales"("patient_id");

-- CreateIndex
CREATE INDEX "pharmacy_sales_status_idx" ON "pharmacy_sales"("status");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_sales_hospital_id_sale_number_key" ON "pharmacy_sales"("hospital_id", "sale_number");

-- CreateIndex
CREATE INDEX "pharmacy_sale_items_hospital_id_idx" ON "pharmacy_sale_items"("hospital_id");

-- CreateIndex
CREATE INDEX "pharmacy_sale_items_sale_id_idx" ON "pharmacy_sale_items"("sale_id");

-- AddForeignKey
ALTER TABLE "pharmacy_medicine_batches" ADD CONSTRAINT "pharmacy_medicine_batches_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "pharmacy_medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_medicine_batches" ADD CONSTRAINT "pharmacy_medicine_batches_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "pharmacy_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_purchase_orders" ADD CONSTRAINT "pharmacy_purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "pharmacy_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_purchase_order_items" ADD CONSTRAINT "pharmacy_purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "pharmacy_purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_purchase_order_items" ADD CONSTRAINT "pharmacy_purchase_order_items_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "pharmacy_medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_goods_receipts" ADD CONSTRAINT "pharmacy_goods_receipts_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "pharmacy_purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_stock_transactions" ADD CONSTRAINT "pharmacy_stock_transactions_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "pharmacy_medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_stock_transactions" ADD CONSTRAINT "pharmacy_stock_transactions_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "pharmacy_medicine_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_dispense_items" ADD CONSTRAINT "pharmacy_dispense_items_dispense_id_fkey" FOREIGN KEY ("dispense_id") REFERENCES "pharmacy_dispenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_dispense_items" ADD CONSTRAINT "pharmacy_dispense_items_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "pharmacy_medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_dispense_items" ADD CONSTRAINT "pharmacy_dispense_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "pharmacy_medicine_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_sales" ADD CONSTRAINT "pharmacy_sales_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_sales" ADD CONSTRAINT "pharmacy_sales_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "hospital_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_sales" ADD CONSTRAINT "pharmacy_sales_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_sale_items" ADD CONSTRAINT "pharmacy_sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "pharmacy_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_sale_items" ADD CONSTRAINT "pharmacy_sale_items_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "pharmacy_medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_sale_items" ADD CONSTRAINT "pharmacy_sale_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "pharmacy_medicine_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
