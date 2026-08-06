-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('PERMANENT', 'CONTRACT', 'PART_TIME', 'VISITING', 'INTERN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "DataScope" AS ENUM ('PLATFORM', 'HOSPITAL', 'BRANCH', 'DEPARTMENT', 'OWN');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'PRINT', 'EXPORT', 'APPROVE', 'REJECT');

-- CreateTable
CREATE TABLE "hospitals" (
    "id" UUID NOT NULL,
    "hospital_code" VARCHAR(30) NOT NULL,
    "legal_name" VARCHAR(200) NOT NULL,
    "display_name" VARCHAR(150) NOT NULL,
    "registration_number" VARCHAR(100),
    "gstin" VARCHAR(20),
    "pan" VARCHAR(15),
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "alternate_phone" VARCHAR(20),
    "address_line1" VARCHAR(200) NOT NULL,
    "address_line2" VARCHAR(200),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL DEFAULT 'India',
    "postal_code" VARCHAR(15) NOT NULL,
    "timezone" VARCHAR(60) NOT NULL DEFAULT 'Asia/Kolkata',
    "currency_code" CHAR(3) NOT NULL DEFAULT 'INR',
    "logo_path" TEXT,
    "license_expiry_date" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_branches" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_code" VARCHAR(30) NOT NULL,
    "branch_name" VARCHAR(150) NOT NULL,
    "branch_type" VARCHAR(30) NOT NULL DEFAULT 'HOSPITAL',
    "email" VARCHAR(150),
    "phone" VARCHAR(20) NOT NULL,
    "address" TEXT NOT NULL,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(15),
    "is_main_branch" BOOLEAN NOT NULL DEFAULT false,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hospital_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID,
    "department_code" VARCHAR(30) NOT NULL,
    "department_name" VARCHAR(120) NOT NULL,
    "department_type" VARCHAR(30) NOT NULL DEFAULT 'CLINICAL',
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designations" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "department_id" UUID,
    "designation_code" VARCHAR(30) NOT NULL,
    "designation_name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID,
    "department_id" UUID NOT NULL,
    "designation_id" UUID NOT NULL,
    "reporting_manager_id" UUID,
    "employee_code" VARCHAR(30) NOT NULL,
    "title" VARCHAR(10),
    "first_name" VARCHAR(80) NOT NULL,
    "middle_name" VARCHAR(80),
    "last_name" VARCHAR(80),
    "gender" "Gender",
    "date_of_birth" DATE,
    "blood_group" VARCHAR(5),
    "marital_status" VARCHAR(20),
    "nationality" VARCHAR(80) DEFAULT 'Indian',
    "religion" VARCHAR(80),
    "mobile" VARCHAR(20) NOT NULL,
    "alternate_mobile" VARCHAR(20),
    "email" VARCHAR(150),
    "address_line1" VARCHAR(200),
    "address_line2" VARCHAR(200),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100) DEFAULT 'India',
    "postal_code" VARCHAR(15),
    "aadhaar_number" VARCHAR(20),
    "pan_number" VARCHAR(15),
    "passport_number" VARCHAR(30),
    "emergency_contact_name" VARCHAR(150),
    "emergency_contact_phone" VARCHAR(20),
    "emergency_relationship" VARCHAR(50),
    "employment_type" "EmploymentType" NOT NULL DEFAULT 'PERMANENT',
    "joining_date" DATE NOT NULL,
    "confirmation_date" DATE,
    "probation_end_date" DATE,
    "relieving_date" DATE,
    "basic_salary" DECIMAL(14,2),
    "bank_name" VARCHAR(150),
    "bank_account_number" VARCHAR(50),
    "ifsc_code" VARCHAR(20),
    "pf_number" VARCHAR(50),
    "esi_number" VARCHAR(50),
    "photo_path" TEXT,
    "signature_path" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_documents" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "document_name" VARCHAR(200) NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" VARCHAR(100),
    "file_size" BIGINT,
    "document_date" DATE,
    "expiry_date" DATE,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" UUID,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "doctor_code" VARCHAR(30) NOT NULL,
    "medical_registration_number" VARCHAR(80) NOT NULL,
    "registration_council" VARCHAR(120),
    "qualification" TEXT NOT NULL,
    "specialization" VARCHAR(150) NOT NULL,
    "consultation_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "followup_fee" DECIMAL(12,2) DEFAULT 0,
    "emergency_fee" DECIMAL(12,2) DEFAULT 0,
    "average_consultation_minutes" INTEGER DEFAULT 15,
    "is_visiting_consultant" BOOLEAN NOT NULL DEFAULT false,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID,
    "employee_id" UUID,
    "full_name" VARCHAR(150) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150),
    "phone" VARCHAR(20),
    "password_hash" TEXT NOT NULL,
    "password_changed_at" TIMESTAMP(3),
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" VARCHAR(64),
    "session_timeout_minutes" INTEGER NOT NULL DEFAULT 30,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "hospital_id" UUID,
    "role_code" VARCHAR(50) NOT NULL,
    "role_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_system_role" BOOLEAN NOT NULL DEFAULT false,
    "data_scope" "DataScope" NOT NULL DEFAULT 'HOSPITAL',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "permission_code" VARCHAR(120) NOT NULL,
    "module_code" VARCHAR(60) NOT NULL,
    "action_code" VARCHAR(30) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "effective_from" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "hospital_id" UUID,
    "user_id" UUID,
    "action" "AuditAction" NOT NULL,
    "module" VARCHAR(60) NOT NULL,
    "entity_type" VARCHAR(100),
    "entity_id" UUID,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(64),
    "user_agent" TEXT,
    "event_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hospitals_hospital_code_key" ON "hospitals"("hospital_code");

-- CreateIndex
CREATE INDEX "hospital_branches_hospital_id_idx" ON "hospital_branches"("hospital_id");

-- CreateIndex
CREATE UNIQUE INDEX "hospital_branches_hospital_id_branch_code_key" ON "hospital_branches"("hospital_id", "branch_code");

-- CreateIndex
CREATE INDEX "departments_hospital_id_idx" ON "departments"("hospital_id");

-- CreateIndex
CREATE INDEX "departments_branch_id_idx" ON "departments"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_hospital_id_department_code_key" ON "departments"("hospital_id", "department_code");

-- CreateIndex
CREATE INDEX "designations_hospital_id_idx" ON "designations"("hospital_id");

-- CreateIndex
CREATE INDEX "designations_department_id_idx" ON "designations"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "designations_hospital_id_designation_code_key" ON "designations"("hospital_id", "designation_code");

-- CreateIndex
CREATE INDEX "employees_hospital_id_idx" ON "employees"("hospital_id");

-- CreateIndex
CREATE INDEX "employees_branch_id_idx" ON "employees"("branch_id");

-- CreateIndex
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");

-- CreateIndex
CREATE INDEX "employees_designation_id_idx" ON "employees"("designation_id");

-- CreateIndex
CREATE INDEX "employees_reporting_manager_id_idx" ON "employees"("reporting_manager_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_hospital_id_employee_code_key" ON "employees"("hospital_id", "employee_code");

-- CreateIndex
CREATE INDEX "employee_documents_hospital_id_idx" ON "employee_documents"("hospital_id");

-- CreateIndex
CREATE INDEX "employee_documents_employee_id_idx" ON "employee_documents"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_employee_id_key" ON "doctors"("employee_id");

-- CreateIndex
CREATE INDEX "doctors_hospital_id_idx" ON "doctors"("hospital_id");

-- CreateIndex
CREATE INDEX "doctors_department_id_idx" ON "doctors"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_hospital_id_doctor_code_key" ON "doctors"("hospital_id", "doctor_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");

-- CreateIndex
CREATE INDEX "users_hospital_id_idx" ON "users"("hospital_id");

-- CreateIndex
CREATE INDEX "users_branch_id_idx" ON "users"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_hospital_id_username_key" ON "users"("hospital_id", "username");

-- CreateIndex
CREATE UNIQUE INDEX "users_hospital_id_email_key" ON "users"("hospital_id", "email");

-- CreateIndex
CREATE INDEX "roles_hospital_id_idx" ON "roles"("hospital_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_hospital_id_role_code_key" ON "roles"("hospital_id", "role_code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_code_key" ON "permissions"("permission_code");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "audit_logs_hospital_id_idx" ON "audit_logs"("hospital_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_event_at_idx" ON "audit_logs"("event_at");

-- AddForeignKey
ALTER TABLE "hospital_branches" ADD CONSTRAINT "hospital_branches_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "hospital_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designations" ADD CONSTRAINT "designations_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designations" ADD CONSTRAINT "designations_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "hospital_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "designations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_reporting_manager_id_fkey" FOREIGN KEY ("reporting_manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "hospital_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
