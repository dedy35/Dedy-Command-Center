-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('new', 'analyzing', 'waiting', 'implemented', 'released');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "TicketNoteType" AS ENUM ('analysis', 'test', 'senior_feedback', 'redmine_comment', 'internal_note');

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "ticket_no" TEXT,
    "system_name" TEXT,
    "title" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'new',
    "risk_level" "RiskLevel" NOT NULL DEFAULT 'medium',
    "source_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_notes" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "note_type" "TicketNoteType" NOT NULL DEFAULT 'analysis',
    "content" TEXT NOT NULL,
    "screenshot_attachment_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_life_events" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "life_event_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_life_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_ticket_no" ON "tickets"("ticket_no");

-- CreateIndex
CREATE INDEX "idx_ticket_status" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "idx_ticket_risk" ON "tickets"("risk_level");

-- CreateIndex
CREATE INDEX "idx_tickets_created" ON "tickets"("created_at");

-- CreateIndex
CREATE INDEX "idx_ticket_notes_ticket" ON "ticket_notes"("ticket_id");

-- CreateIndex
CREATE INDEX "idx_ticket_notes_created" ON "ticket_notes"("created_at");

-- CreateIndex
CREATE INDEX "idx_ticket_life_events_ticket" ON "ticket_life_events"("ticket_id");

-- CreateIndex
CREATE INDEX "idx_ticket_life_events_life_event" ON "ticket_life_events"("life_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_ticket_life_event" ON "ticket_life_events"("ticket_id", "life_event_id");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_notes" ADD CONSTRAINT "ticket_notes_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_notes" ADD CONSTRAINT "ticket_notes_screenshot_attachment_id_fkey" FOREIGN KEY ("screenshot_attachment_id") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_life_events" ADD CONSTRAINT "ticket_life_events_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_life_events" ADD CONSTRAINT "ticket_life_events_life_event_id_fkey" FOREIGN KEY ("life_event_id") REFERENCES "life_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
