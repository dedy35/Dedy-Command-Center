import { AuditActor } from "@prisma/client";
import { NextResponse } from "next/server";

import { isTicketNoteType } from "@/config/tickets";
import { requireSessionUser } from "@/lib/auth";
import { withAuditedMutation, writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { saveAttachmentFile } from "@/lib/storage";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  await requireSessionUser();

  const { id } = await params;
  const ticket = await db.ticket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const noteTypeRaw = String(formData.get("noteType") ?? "analysis").trim();
  const content = String(formData.get("content") ?? "").trim();
  const uploaded = formData.get("screenshot");

  if (!isTicketNoteType(noteTypeRaw)) {
    return NextResponse.json({ error: "Invalid note type." }, { status: 400 });
  }

  if (!content) {
    return NextResponse.json({ error: "Note content is required." }, { status: 400 });
  }

  const screenshot = uploaded instanceof File && uploaded.size > 0 ? uploaded : null;

  let attachmentId: string | null = null;
  if (screenshot) {
    const staged = await saveAttachmentFile(screenshot);
    const existing = await db.attachment.findUnique({ where: { sha256: staged.sha256 } });

    if (existing) {
      attachmentId = existing.id;
    } else {
      const attachment = await withAuditedMutation({
        action: "create",
        entityTable: "attachments",
        run: () =>
          db.attachment.create({
            data: {
              filePath: staged.filePath,
              fileName: staged.fileName,
              mimeType: staged.mimeType,
              sizeBytes: BigInt(staged.sizeBytes),
              sha256: staged.sha256,
            },
          }),
        afterJson: (result) => ({ ...result, sizeBytes: result.sizeBytes.toString() }),
      });
      attachmentId = attachment.id;
    }
  }

  const note = await withAuditedMutation({
    action: "create",
    entityTable: "ticket_notes",
    run: () =>
      db.ticketNote.create({
        data: {
          ticketId: ticket.id,
          noteType: noteTypeRaw,
          content,
          screenshotAttachmentId: attachmentId,
        },
      }),
    afterJson: (result) => result,
  });

  await writeAuditLog({
    actor: AuditActor.user,
    action: "update",
    entityTable: "tickets",
    entityId: ticket.id,
    afterJson: { noteAdded: note.id },
  });

  return NextResponse.json({ ok: true, note }, { status: 201 });
}
