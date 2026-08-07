-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "CommunicationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('QUEUED', 'SCHEDULED', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "communication_templates" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "subject_template" VARCHAR(250),
    "body_template" TEXT NOT NULL,
    "description" VARCHAR(1000),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_messages" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID,
    "template_id" UUID,
    "recipient_user_id" UUID,
    "recipient_address" VARCHAR(320),
    "channel" "CommunicationChannel" NOT NULL,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'QUEUED',
    "priority" "CommunicationPriority" NOT NULL DEFAULT 'NORMAL',
    "subject" VARCHAR(250),
    "body" TEXT NOT NULL,
    "variables" JSONB,
    "event_type" VARCHAR(100),
    "entity_type" VARCHAR(100),
    "entity_id" VARCHAR(100),
    "idempotency_key" VARCHAR(120),
    "provider" VARCHAR(80),
    "provider_message_id" VARCHAR(200),
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_delivery_attempts" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "status" "CommunicationStatus" NOT NULL,
    "provider" VARCHAR(80),
    "provider_message_id" VARCHAR(200),
    "error_message" TEXT,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_delivery_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_preferences" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "communication_templates_hospital_id_active_idx" ON "communication_templates"("hospital_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "communication_templates_hospital_id_code_channel_key" ON "communication_templates"("hospital_id", "code", "channel");

-- CreateIndex
CREATE INDEX "communication_messages_hospital_id_recipient_user_id_channe_idx" ON "communication_messages"("hospital_id", "recipient_user_id", "channel", "read_at");

-- CreateIndex
CREATE INDEX "communication_messages_hospital_id_status_scheduled_at_idx" ON "communication_messages"("hospital_id", "status", "scheduled_at");

-- CreateIndex
CREATE INDEX "communication_messages_hospital_id_event_type_entity_type_e_idx" ON "communication_messages"("hospital_id", "event_type", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "communication_messages_hospital_id_idempotency_key_key" ON "communication_messages"("hospital_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "communication_delivery_attempts_hospital_id_status_attempte_idx" ON "communication_delivery_attempts"("hospital_id", "status", "attempted_at");

-- CreateIndex
CREATE UNIQUE INDEX "communication_delivery_attempts_message_id_attempt_number_key" ON "communication_delivery_attempts"("message_id", "attempt_number");

-- CreateIndex
CREATE INDEX "communication_preferences_hospital_id_user_id_idx" ON "communication_preferences"("hospital_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "communication_preferences_hospital_id_user_id_channel_event_key" ON "communication_preferences"("hospital_id", "user_id", "channel", "event_type");

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "communication_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_delivery_attempts" ADD CONSTRAINT "communication_delivery_attempts_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "communication_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
