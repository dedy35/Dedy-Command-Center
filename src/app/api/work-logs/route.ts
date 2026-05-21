import { NextResponse } from "next/server";
import { WorkLogCategory } from "@prisma/client";

import { isWorkLogCategory } from "@/config/work-log";
import { requireSessionUser } from "@/lib/auth";
import { withAuditedMutation } from "@/lib/audit";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type CreateWorkLogBody = {
  workDate?: string;
  category?: string;
  description?: string;
  impact?: string;
  relatedTicketId?: string | null;
};

export async function GET() {
  await requireSessionUser();

  const workLogs = await db.workLog.findMany({
    orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
    include: {
      relatedTicket: {
        select: {
          id: true,
          ticketNo: true,
          title: true,
        },
      },
      achievements: {
        orderBy: { createdAt: "desc" },
      },
    },
    take: 100,
  });

  return NextResponse.json({ ok: true, workLogs });
}

export async function POST(request: Request) {
  await requireSessionUser();

  const body = (await request.json().catch(() => null)) as CreateWorkLogBody | null;

  if (!body?.workDate || !body.category || !body.description?.trim()) {
    return NextResponse.json(
      {
        error: "workDate, category, and description are required.",
      },
      { status: 400 },
    );
  }

  if (!isWorkLogCategory(body.category)) {
    return NextResponse.json({ error: "Invalid work log category." }, { status: 400 });
  }

  const workDate = new Date(`${body.workDate}T00:00:00.000Z`);
  if (Number.isNaN(workDate.getTime())) {
    return NextResponse.json({ error: "Invalid workDate format." }, { status: 400 });
  }

  const relatedTicketId = body.relatedTicketId?.trim() || null;

  if (relatedTicketId) {
    const ticket = await db.ticket.findUnique({ where: { id: relatedTicketId } });
    if (!ticket) {
      return NextResponse.json({ error: "relatedTicketId not found." }, { status: 404 });
    }
  }

  const description = body.description.trim();
  const impact = body.impact?.trim() || null;

  const workLog = await withAuditedMutation({
    action: "create",
    entityTable: "work_logs",
    run: () =>
      db.workLog.create({
        data: {
          workDate,
          category: body.category as WorkLogCategory,
          description,
          impact,
          relatedTicketId,
        },
      }),
    afterJson: (created) => created,
  });

  const lifeEvent = await withAuditedMutation({
    action: "create",
    entityTable: "life_events",
    run: () =>
      db.lifeEvent.create({
        data: {
          eventDate: workDate,
          module: "daily_log",
          title: `Daily log: ${description.slice(0, 72)}`,
          summary: impact ?? description.slice(0, 240),
          sourceId: null,
          sensitivity: "private",
        },
      }),
    afterJson: (created) => created,
  });

  return NextResponse.json({ ok: true, workLog, lifeEvent }, { status: 201 });
}
