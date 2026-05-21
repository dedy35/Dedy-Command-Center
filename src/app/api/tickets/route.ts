import { AuditActor, RiskLevel, TicketStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { isRiskLevel, isTicketStatus } from "@/config/tickets";
import { requireSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type CreateTicketBody = {
  ticketNo?: string;
  title?: string;
  systemName?: string;
  status?: string;
  riskLevel?: string;
  redmineText?: string;
};

export async function GET() {
  await requireSessionUser();

  const tickets = await db.ticket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          notes: true,
          lifeEvents: true,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, tickets });
}

export async function POST(request: Request) {
  await requireSessionUser();

  const body = (await request.json().catch(() => null)) as CreateTicketBody | null;
  if (!body?.title || !body.title.trim()) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }
  const title = body.title.trim();

  const statusRaw = (body.status ?? "new").trim();
  const riskRaw = (body.riskLevel ?? "medium").trim();

  if (!isTicketStatus(statusRaw)) {
    return NextResponse.json({ error: "Invalid ticket status." }, { status: 400 });
  }

  if (!isRiskLevel(riskRaw)) {
    return NextResponse.json({ error: "Invalid risk level." }, { status: 400 });
  }

  const redmineText = body.redmineText?.trim() ?? "";

  const result = await db.$transaction(async (tx) => {
    let sourceId: string | null = null;

    if (redmineText) {
      const source = await tx.source.create({
        data: {
          sourceType: "chat",
          contentText: redmineText,
          origin: "redmine_paste",
          sensitivity: "private",
        },
      });
      sourceId = source.id;

      await tx.auditLog.create({
        data: {
          actor: AuditActor.user,
          action: "create",
          entityTable: "sources",
          entityId: source.id,
          afterJson: { origin: source.origin, sourceType: source.sourceType },
        },
      });
    }

    const ticket = await tx.ticket.create({
      data: {
        ticketNo: body.ticketNo?.trim() || null,
        title,
        systemName: body.systemName?.trim() || null,
        status: statusRaw as TicketStatus,
        riskLevel: riskRaw as RiskLevel,
        sourceId,
      },
    });

    await tx.auditLog.create({
      data: {
        actor: AuditActor.user,
        action: "create",
        entityTable: "tickets",
        entityId: ticket.id,
        afterJson: {
          ticketNo: ticket.ticketNo,
          status: ticket.status,
          riskLevel: ticket.riskLevel,
          sourceId,
        },
      },
    });

    const lifeEvent = await tx.lifeEvent.create({
      data: {
        eventDate: new Date(),
        module: "work",
        title: `Ticket ${ticket.ticketNo ?? ticket.id.slice(0, 8)} created`,
        summary: ticket.title,
        sourceId,
        sensitivity: "private",
      },
    });

    await tx.auditLog.create({
      data: {
        actor: AuditActor.user,
        action: "create",
        entityTable: "life_events",
        entityId: lifeEvent.id,
        afterJson: { module: lifeEvent.module, title: lifeEvent.title },
      },
    });

    const link = await tx.ticketLifeEvent.create({
      data: {
        ticketId: ticket.id,
        lifeEventId: lifeEvent.id,
      },
    });

    await tx.auditLog.create({
      data: {
        actor: AuditActor.user,
        action: "create",
        entityTable: "ticket_life_events",
        entityId: link.id,
        afterJson: { ticketId: link.ticketId, lifeEventId: link.lifeEventId },
      },
    });

    if (redmineText) {
      const note = await tx.ticketNote.create({
        data: {
          ticketId: ticket.id,
          noteType: "analysis",
          content: redmineText,
        },
      });

      await tx.auditLog.create({
        data: {
          actor: AuditActor.user,
          action: "create",
          entityTable: "ticket_notes",
          entityId: note.id,
          afterJson: { ticketId: note.ticketId, noteType: note.noteType },
        },
      });
    }

    return ticket;
  });

  return NextResponse.json({ ok: true, ticket: result }, { status: 201 });
}
