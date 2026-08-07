-- Store optional date of birth for unregistered appointment visitors.
ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "guest_date_of_birth" DATE;

-- Age is no longer collected for new/unregistered appointment visitors.
ALTER TABLE "appointments"
  DROP COLUMN IF EXISTS "guest_age_years";
