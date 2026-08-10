ALTER TABLE "lab_orders" ADD COLUMN IF NOT EXISTS "ipd_admission_id" UUID;
CREATE INDEX IF NOT EXISTS "lab_orders_ipd_admission_id_idx" ON "lab_orders"("ipd_admission_id");
ALTER TABLE "lab_orders" DROP CONSTRAINT IF EXISTS "lab_orders_ipd_admission_id_fkey";
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_ipd_admission_id_fkey" FOREIGN KEY ("ipd_admission_id") REFERENCES "ipd_admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
