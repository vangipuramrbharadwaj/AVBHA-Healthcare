-- CreateEnum
CREATE TYPE "BillingInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "BillingPaymentMode" AS ENUM ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'INSURANCE', 'CREDIT', 'ADVANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "BillingPaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "BillingLedgerEntryType" AS ENUM ('INVOICE', 'PAYMENT', 'REFUND', 'ADVANCE', 'ADJUSTMENT', 'CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "BillingRefundStatus" AS ENUM ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "billing_service_catalog" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "service_code" VARCHAR(40) NOT NULL,
    "service_name" VARCHAR(200) NOT NULL,
    "module_code" VARCHAR(50) NOT NULL,
    "department_id" UUID,
    "description" TEXT,
    "base_price" DECIMAL(14,2) NOT NULL,
    "gst_percent" DECIMAL(5,2),
    "discount_allowed" BOOLEAN NOT NULL DEFAULT true,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "billing_service_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_invoices" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "opd_visit_id" UUID,
    "ipd_admission_id" UUID,
    "invoice_number" VARCHAR(40) NOT NULL,
    "status" "BillingInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "invoice_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATE,
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "round_off_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balance_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "cancellation_reason" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "billing_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_invoice_items" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "service_id" UUID,
    "source_module" VARCHAR(50),
    "source_entity_id" UUID,
    "description" VARCHAR(300) NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "discount_percent" DECIMAL(5,2),
    "discount_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tax_percent" DECIMAL(5,2),
    "tax_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_payments" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "receipt_number" VARCHAR(40) NOT NULL,
    "payment_mode" "BillingPaymentMode" NOT NULL,
    "status" "BillingPaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "amount" DECIMAL(14,2) NOT NULL,
    "transaction_reference" VARCHAR(150),
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "received_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_refunds" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "payment_id" UUID,
    "refund_number" VARCHAR(40) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "BillingRefundStatus" NOT NULL DEFAULT 'PENDING',
    "payment_mode" "BillingPaymentMode",
    "approved_at" TIMESTAMP(3),
    "approved_by" UUID,
    "completed_at" TIMESTAMP(3),
    "completed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "billing_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_advance_payments" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "advance_number" VARCHAR(40) NOT NULL,
    "payment_mode" "BillingPaymentMode" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "utilized_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balance_amount" DECIMAL(14,2) NOT NULL,
    "transaction_reference" VARCHAR(150),
    "remarks" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_by" UUID,

    CONSTRAINT "billing_advance_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_patient_ledger" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "entry_type" "BillingLedgerEntryType" NOT NULL,
    "reference_type" VARCHAR(50),
    "reference_id" UUID,
    "description" TEXT NOT NULL,
    "debit_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "credit_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balance_after" DECIMAL(14,2) NOT NULL,
    "entry_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "billing_patient_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "billing_service_catalog_hospital_id_module_code_idx" ON "billing_service_catalog"("hospital_id", "module_code");

-- CreateIndex
CREATE INDEX "billing_service_catalog_department_id_idx" ON "billing_service_catalog"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_service_catalog_hospital_id_service_code_key" ON "billing_service_catalog"("hospital_id", "service_code");

-- CreateIndex
CREATE INDEX "billing_invoices_hospital_id_invoice_date_idx" ON "billing_invoices"("hospital_id", "invoice_date");

-- CreateIndex
CREATE INDEX "billing_invoices_patient_id_invoice_date_idx" ON "billing_invoices"("patient_id", "invoice_date");

-- CreateIndex
CREATE INDEX "billing_invoices_status_idx" ON "billing_invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "billing_invoices_hospital_id_invoice_number_key" ON "billing_invoices"("hospital_id", "invoice_number");

-- CreateIndex
CREATE INDEX "billing_invoice_items_hospital_id_idx" ON "billing_invoice_items"("hospital_id");

-- CreateIndex
CREATE INDEX "billing_invoice_items_invoice_id_idx" ON "billing_invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "billing_invoice_items_service_id_idx" ON "billing_invoice_items"("service_id");

-- CreateIndex
CREATE INDEX "billing_invoice_items_source_module_source_entity_id_idx" ON "billing_invoice_items"("source_module", "source_entity_id");

-- CreateIndex
CREATE INDEX "billing_payments_invoice_id_idx" ON "billing_payments"("invoice_id");

-- CreateIndex
CREATE INDEX "billing_payments_patient_id_payment_date_idx" ON "billing_payments"("patient_id", "payment_date");

-- CreateIndex
CREATE INDEX "billing_payments_status_idx" ON "billing_payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "billing_payments_hospital_id_receipt_number_key" ON "billing_payments"("hospital_id", "receipt_number");

-- CreateIndex
CREATE INDEX "billing_refunds_invoice_id_idx" ON "billing_refunds"("invoice_id");

-- CreateIndex
CREATE INDEX "billing_refunds_status_idx" ON "billing_refunds"("status");

-- CreateIndex
CREATE UNIQUE INDEX "billing_refunds_hospital_id_refund_number_key" ON "billing_refunds"("hospital_id", "refund_number");

-- CreateIndex
CREATE INDEX "billing_advance_payments_patient_id_received_at_idx" ON "billing_advance_payments"("patient_id", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "billing_advance_payments_hospital_id_advance_number_key" ON "billing_advance_payments"("hospital_id", "advance_number");

-- CreateIndex
CREATE INDEX "billing_patient_ledger_hospital_id_patient_id_entry_at_idx" ON "billing_patient_ledger"("hospital_id", "patient_id", "entry_at");

-- CreateIndex
CREATE INDEX "billing_patient_ledger_reference_type_reference_id_idx" ON "billing_patient_ledger"("reference_type", "reference_id");

-- AddForeignKey
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "hospital_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_invoice_items" ADD CONSTRAINT "billing_invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "billing_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_invoice_items" ADD CONSTRAINT "billing_invoice_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "billing_service_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "billing_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_refunds" ADD CONSTRAINT "billing_refunds_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "billing_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
