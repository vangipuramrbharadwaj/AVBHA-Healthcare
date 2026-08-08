-- Support doctors who are not hospital employees.
-- Existing employee-linked doctors remain unchanged.

ALTER TABLE "doctors"
  ALTER COLUMN "employee_id" DROP NOT NULL;

ALTER TABLE "doctors"
  ADD COLUMN IF NOT EXISTS "title" VARCHAR(10),
  ADD COLUMN IF NOT EXISTS "first_name" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "middle_name" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "last_name" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "mobile" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "email" VARCHAR(150);

-- Preserve an external doctor profile if a linked employee is later removed.
ALTER TABLE "doctors"
  DROP CONSTRAINT IF EXISTS "doctors_employee_id_fkey";

ALTER TABLE "doctors"
  ADD CONSTRAINT "doctors_employee_id_fkey"
  FOREIGN KEY ("employee_id")
  REFERENCES "employees"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
