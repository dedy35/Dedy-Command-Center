import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { withAuditedMutation } from "@/lib/audit";
import { db } from "@/lib/db";

type RouteParams = {
  params: Promise<{ id: string }>;
};

type LinkBody = {
  lifeEventId?: string;
};

export async function POST(request: Request, { params }: RouteParams) {
  await requireSessionUser();

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as LinkBody | null;

  if (!body?.lifeEventId) {
    return NextResponse.json({ error: "lifeEventId is required." }, { status: 400 });
  }

  const [ticket, lifeEvent] = await Promise.all([
    db.ticket.findUnique({ where: { id } }),
    db.lifeEvent.findUnique({ where: { id: body.lifeEventId } }),
  ]);

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  if (!lifeEvent) {
    return NextResponse.json({ error: "Life event not found." }, { status: 404 });
  }

  const existing = await db.ticketLifeEvent.findFirst({
    where: {
      ticketId: ticket.id,
      lifeEventId: lifeEvent.id,
    },
  });

  if (existing) {
    return NextResponse.json({ ok: true, link: existing });
  }

  const link = await withAuditedMutation({
    action: "create",
    entityTable: "ticket_life_events",
    run: () =>
      db.ticketLifeEvent.create({
        data: {
          ticketId: ticket.id,
          lifeEventId: lifeEvent.id,
        },
      }),
    afterJson: (result) => result,
  });

  return NextResponse.json({ ok: true, link }, { status: 201 });
}
