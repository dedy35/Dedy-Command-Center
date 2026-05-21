import { NextResponse } from "next/server";
import { RiskLevel, TicketStatus } from "@prisma/client";

import { isRiskLevel, isTicketStatus } from "@/config/tickets";
import { requireSessionUser } from "@/lib/auth";
import { withAuditedMutation } from "@/lib/audit";
import { db } from "@/lib/db";

type RouteParams = {
  params: Promise<{ id: string }>;
};

type UpdateTicketBody = {
  ticketNo?: string;
  title?: string;
  systemName?: string;
  status?: string;
  riskLevel?: string;
};

export async function GET(_request: Request, { params }: RouteParams) {
  await requireSessionUser();

  const { id } = await params;
  const ticket = await db.ticket.findUnique({
    where: { id },
    include: {
      notes: {
        include: {
          screenshotAttachment: true,
        },
        orderBy: { createdAt: "desc" },
      },
      lifeEvents: {
        include: {
          lifeEvent: true,
        },
        orderBy: { createdAt: "desc" },
      },
      source: true,
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  const safeTicket = JSON.parse(
    JSON.stringify(ticket, (_key, value) => (typeof value === "bigint" ? value.toString() : value)),
  );

  return NextResponse.json({ ok: true, ticket: safeTicket });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  await requireSessionUser();

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as UpdateTicketBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (body.status && !isTicketStatus(body.status)) {
    return NextResponse.json({ error: "Invalid ticket status." }, { status: 400 });
  }

  if (body.riskLevel && !isRiskLevel(body.riskLevel)) {
    return NextResponse.json({ error: "Invalid risk level." }, { status: 400 });
  }

  const existing = await db.ticket.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  const statusValue = (body.status ?? existing.status) as TicketStatus;
  const riskValue = (body.riskLevel ?? existing.riskLevel) as RiskLevel;

  const ticket = await withAuditedMutation({
    action: "update",
    entityTable: "tickets",
    entityId: existing.id,
    beforeJson: existing,
    run: () =>
      db.ticket.update({
        where: { id: existing.id },
        data: {
          ticketNo: body.ticketNo === undefined ? existing.ticketNo : body.ticketNo || null,
          title: body.title?.trim() || existing.title,
          systemName: body.systemName === undefined ? existing.systemName : body.systemName || null,
          status: statusValue,
          riskLevel: riskValue,
        },
      }),
    afterJson: (result) => result,
  });

  return NextResponse.json({ ok: true, ticket });
}
