-- Allow appointments to be booked before a hospital patient/UHID exists.
ALTER TABLE "appointments"
  ALTER COLUMN "patient_id" DROP NOT NULL;

ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "guest_name" VARCHAR(150),
  ADD COLUMN IF NOT EXISTS "guest_mobile" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "guest_gender" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "guest_age_years" INTEGER;

CREATE INDEX IF NOT EXISTS "appointments_guest_mobile_idx"
  ON "appointments"("guest_mobile");

ALTER TABLE "appointments"
  DROP CONSTRAINT IF EXISTS "appointments_patient_or_guest_check";

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_patient_or_guest_check"
  CHECK (
    "patient_id" IS NOT NULL
    OR (
      "guest_name" IS NOT NULL
      AND length(trim("guest_name")) > 0
      AND "guest_mobile" IS NOT NULL
      AND length(trim("guest_mobile")) > 0
    )
  );
