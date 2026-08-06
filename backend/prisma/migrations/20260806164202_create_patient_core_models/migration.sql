-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID,
    "uhid" VARCHAR(40) NOT NULL,
    "title" VARCHAR(10),
    "first_name" VARCHAR(100) NOT NULL,
    "middle_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "gender" VARCHAR(20),
    "date_of_birth" DATE,
    "age_years" INTEGER,
    "blood_group" VARCHAR(10),
    "marital_status" VARCHAR(30),
    "nationality" VARCHAR(80),
    "religion" VARCHAR(80),
    "primary_mobile" VARCHAR(20) NOT NULL,
    "alternate_mobile" VARCHAR(20),
    "email" VARCHAR(150),
    "aadhaar_number" VARCHAR(20),
    "pan_number" VARCHAR(20),
    "passport_number" VARCHAR(30),
    "occupation" VARCHAR(120),
    "preferred_language" VARCHAR(50),
    "referred_by" VARCHAR(150),
    "referral_source" VARCHAR(80),
    "medical_alerts" TEXT,
    "allergies_summary" TEXT,
    "chronic_diseases_summary" TEXT,
    "is_deceased" BOOLEAN NOT NULL DEFAULT false,
    "deceased_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_addresses" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "address_type" VARCHAR(30) NOT NULL DEFAULT 'CURRENT',
    "address_line1" VARCHAR(200) NOT NULL,
    "address_line2" VARCHAR(200),
    "landmark" VARCHAR(150),
    "city" VARCHAR(100),
    "district" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100) DEFAULT 'India',
    "postal_code" VARCHAR(15),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_emergency_contacts" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "contact_name" VARCHAR(150) NOT NULL,
    "relationship" VARCHAR(60),
    "mobile" VARCHAR(20) NOT NULL,
    "alternate_mobile" VARCHAR(20),
    "email" VARCHAR(150),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patients_hospital_id_status_idx" ON "patients"("hospital_id", "status");

-- CreateIndex
CREATE INDEX "patients_hospital_id_primary_mobile_idx" ON "patients"("hospital_id", "primary_mobile");

-- CreateIndex
CREATE INDEX "patients_hospital_id_first_name_last_name_idx" ON "patients"("hospital_id", "first_name", "last_name");

-- CreateIndex
CREATE INDEX "patients_hospital_id_created_at_idx" ON "patients"("hospital_id", "created_at");

-- CreateIndex
CREATE INDEX "patients_branch_id_idx" ON "patients"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "patients_hospital_id_uhid_key" ON "patients"("hospital_id", "uhid");

-- CreateIndex
CREATE INDEX "patient_addresses_hospital_id_idx" ON "patient_addresses"("hospital_id");

-- CreateIndex
CREATE INDEX "patient_addresses_patient_id_idx" ON "patient_addresses"("patient_id");

-- CreateIndex
CREATE INDEX "patient_emergency_contacts_hospital_id_idx" ON "patient_emergency_contacts"("hospital_id");

-- CreateIndex
CREATE INDEX "patient_emergency_contacts_patient_id_idx" ON "patient_emergency_contacts"("patient_id");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "hospital_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_addresses" ADD CONSTRAINT "patient_addresses_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_addresses" ADD CONSTRAINT "patient_addresses_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_emergency_contacts" ADD CONSTRAINT "patient_emergency_contacts_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_emergency_contacts" ADD CONSTRAINT "patient_emergency_contacts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
