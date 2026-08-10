ALTER TABLE "ipd_medication_orders"
ADD COLUMN IF NOT EXISTS "medicine_id" UUID,
ADD COLUMN IF NOT EXISTS "prescribed_quantity" DECIMAL(14,3);

CREATE INDEX IF NOT EXISTS "ipd_medication_orders_medicine_id_idx"
ON "ipd_medication_orders"("medicine_id");
