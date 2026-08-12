DO $$ BEGIN
  CREATE TYPE "BillingChargeStatus" AS ENUM ('PENDING', 'INVOICED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "billing_charges" (
  "id" UUID NOT NULL,
  "hospital_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "opd_visit_id" UUID,
  "ipd_admission_id" UUID,
  "service_id" UUID,
  "invoice_id" UUID,
  "source_module" VARCHAR(50) NOT NULL,
  "source_entity_id" UUID,
  "source_key" VARCHAR(180) NOT NULL,
  "description" VARCHAR(300) NOT NULL,
  "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,
  "unit_price" DECIMAL(14,2) NOT NULL,
  "discount_percent" DECIMAL(5,2),
  "discount_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "tax_percent" DECIMAL(5,2),
  "tax_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "line_total" DECIMAL(14,2) NOT NULL,
  "status" "BillingChargeStatus" NOT NULL DEFAULT 'PENDING',
  "charge_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_by" UUID,

  CONSTRAINT "billing_charges_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "billing_charges_hospital_id_fkey"
    FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "billing_charges_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "hospital_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "billing_charges_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "billing_charges_service_id_fkey"
    FOREIGN KEY ("service_id") REFERENCES "billing_service_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "billing_charges_invoice_id_fkey"
    FOREIGN KEY ("invoice_id") REFERENCES "billing_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "billing_charges_hospital_id_source_key_key"
  ON "billing_charges"("hospital_id", "source_key");

CREATE INDEX IF NOT EXISTS "billing_charges_hospital_id_status_charge_date_idx"
  ON "billing_charges"("hospital_id", "status", "charge_date");

CREATE INDEX IF NOT EXISTS "billing_charges_patient_id_status_idx"
  ON "billing_charges"("patient_id", "status");

CREATE INDEX IF NOT EXISTS "billing_charges_ipd_admission_id_status_idx"
  ON "billing_charges"("ipd_admission_id", "status");

CREATE INDEX IF NOT EXISTS "billing_charges_opd_visit_id_status_idx"
  ON "billing_charges"("opd_visit_id", "status");

CREATE INDEX IF NOT EXISTS "billing_charges_invoice_id_idx"
  ON "billing_charges"("invoice_id");
