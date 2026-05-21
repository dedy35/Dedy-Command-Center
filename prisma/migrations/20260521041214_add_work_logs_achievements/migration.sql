-- CreateEnum
CREATE TYPE "WorkLogCategory" AS ENUM ('coding', 'analysis', 'meeting', 'testing', 'documentation', 'support', 'planning');

-- CreateTable
CREATE TABLE "work_logs" (
    "id" UUID NOT NULL,
    "work_date" DATE NOT NULL,
    "category" "WorkLogCategory" NOT NULL DEFAULT 'coding',
    "description" TEXT NOT NULL,
    "impact" TEXT,
    "related_ticket_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "work_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" UUID NOT NULL,
    "work_log_id" UUID NOT NULL,
    "source_ai_output_id" UUID,
    "star_situation" TEXT,
    "star_task" TEXT,
    "star_action" TEXT,
    "star_result" TEXT,
    "cv_bullet_en" TEXT,
    "cv_bullet_id" TEXT,
    "impact_questions" TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_work_logs_date" ON "work_logs"("work_date");

-- CreateIndex
CREATE INDEX "idx_work_logs_category" ON "work_logs"("category");

-- CreateIndex
CREATE INDEX "idx_work_logs_ticket" ON "work_logs"("related_ticket_id");

-- CreateIndex
CREATE INDEX "idx_work_logs_created" ON "work_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_achievements_work_log" ON "achievements"("work_log_id");

-- CreateIndex
CREATE INDEX "idx_achievements_ai_output" ON "achievements"("source_ai_output_id");

-- CreateIndex
CREATE INDEX "idx_achievements_created" ON "achievements"("created_at");

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_related_ticket_id_fkey" FOREIGN KEY ("related_ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_work_log_id_fkey" FOREIGN KEY ("work_log_id") REFERENCES "work_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_source_ai_output_id_fkey" FOREIGN KEY ("source_ai_output_id") REFERENCES "ai_outputs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
