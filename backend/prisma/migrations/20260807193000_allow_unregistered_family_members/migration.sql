-- Allow a family member to be stored even when that person is not a registered patient.
ALTER TABLE "patient_family_relationships"
  ALTER COLUMN "related_patient_id" DROP NOT NULL;

ALTER TABLE "patient_family_relationships"
  ADD COLUMN "related_person_name" VARCHAR(150),
  ADD COLUMN "related_person_mobile" VARCHAR(20);

ALTER TABLE "patient_family_relationships"
  ADD CONSTRAINT "patient_family_relationships_related_person_check"
  CHECK (
    "related_patient_id" IS NOT NULL
    OR (
      "related_person_name" IS NOT NULL
      AND length(btrim("related_person_name")) >= 2
    )
  );
