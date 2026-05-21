-- CreateEnum
CREATE TYPE "SensitivityLevel" AS ENUM ('public', 'internal', 'private', 'confidential');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('text', 'photo', 'pdf', 'url', 'email', 'chat', 'manual');

-- CreateEnum
CREATE TYPE "AiOutputStatus" AS ENUM ('draft', 'approved', 'rejected', 'superseded');

-- CreateEnum
CREATE TYPE "ApprovalActionType" AS ENUM ('copy', 'send', 'update', 'export', 'delete', 'submit');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "AuditActor" AS ENUM ('user', 'system', 'ai');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "email" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "life_events" (
    "id" UUID NOT NULL,
    "event_date" DATE NOT NULL,
    "module" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "source_id" UUID,
    "sensitivity" "SensitivityLevel" NOT NULL DEFAULT 'internal',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "life_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" UUID NOT NULL,
    "source_type" "SourceType" NOT NULL,
    "content_text" TEXT,
    "file_id" UUID,
    "origin" TEXT,
    "sensitivity" "SensitivityLevel" NOT NULL DEFAULT 'private',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "sha256" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_outputs" (
    "id" UUID NOT NULL,
    "source_id" UUID,
    "module" TEXT NOT NULL,
    "prompt_key" TEXT NOT NULL,
    "model" TEXT,
    "output_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "AiOutputStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" UUID NOT NULL,
    "ai_output_id" UUID NOT NULL,
    "action_type" "ApprovalActionType" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "approved_at" TIMESTAMPTZ(6),
    "approval_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor" "AuditActor" NOT NULL,
    "action" TEXT NOT NULL,
    "entity_table" TEXT NOT NULL,
    "entity_id" UUID,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_tags" (
    "id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "entity_table" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_created" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "idx_life_events_date" ON "life_events"("event_date");

-- CreateIndex
CREATE INDEX "idx_life_events_module" ON "life_events"("module");

-- CreateIndex
CREATE INDEX "idx_source_type" ON "sources"("source_type");

-- CreateIndex
CREATE INDEX "idx_sources_created" ON "sources"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_sha256_key" ON "attachments"("sha256");

-- CreateIndex
CREATE INDEX "idx_ai_source" ON "ai_outputs"("source_id");

-- CreateIndex
CREATE INDEX "idx_ai_module" ON "ai_outputs"("module");

-- CreateIndex
CREATE INDEX "idx_output_type" ON "ai_outputs"("output_type");

-- CreateIndex
CREATE INDEX "idx_ai_status" ON "ai_outputs"("status");

-- CreateIndex
CREATE INDEX "idx_approval_output" ON "approvals"("ai_output_id");

-- CreateIndex
CREATE INDEX "idx_approval_status" ON "approvals"("status");

-- CreateIndex
CREATE INDEX "idx_audit_actor" ON "audit_logs"("actor");

-- CreateIndex
CREATE INDEX "idx_audit_action" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "idx_audit_entity" ON "audit_logs"("entity_table", "entity_id");

-- CreateIndex
CREATE INDEX "idx_audit_created" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "idx_entity_tags_entity" ON "entity_tags"("entity_table", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_entity_tag" ON "entity_tags"("tag_id", "entity_table", "entity_id");

-- AddForeignKey
ALTER TABLE "life_events" ADD CONSTRAINT "life_events_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_outputs" ADD CONSTRAINT "ai_outputs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_ai_output_id_fkey" FOREIGN KEY ("ai_output_id") REFERENCES "ai_outputs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_tags" ADD CONSTRAINT "entity_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
