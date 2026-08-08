ALTER TABLE "opd_prescription_items"
ADD COLUMN "medicine_id" UUID,
ADD COLUMN "prescribed_quantity" DECIMAL(14,3);

CREATE INDEX "opd_prescription_items_medicine_id_idx"
ON "opd_prescription_items"("medicine_id");

ALTER TABLE "opd_prescription_items"
ADD CONSTRAINT "opd_prescription_items_medicine_id_fkey"
FOREIGN KEY ("medicine_id")
REFERENCES "pharmacy_medicines"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
