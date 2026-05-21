import { ApprovalStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { withAuditedMutation } from "@/lib/audit";
import { db } from "@/lib/db";

type ApprovalDecisionBody = {
  status?: ApprovalStatus;
  note?: string;
};

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  await requireSessionUser();

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as ApprovalDecisionBody | null;

  if (!body?.status || !["approved", "rejected"].includes(body.status)) {
    return NextResponse.json({ error: "status must be approved or rejected." }, { status: 400 });
  }

  const existing = await db.approval.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Approval not found." }, { status: 404 });
  }

  const approval = await withAuditedMutation({
    action: "approve",
    entityTable: "approvals",
    entityId: existing.id,
    beforeJson: existing,
    run: () =>
      db.approval.update({
        where: { id: existing.id },
        data: {
          status: body.status,
          approvalNote: body.note ?? existing.approvalNote,
          approvedAt: new Date(),
        },
      }),
    afterJson: (result) => result,
  });

  await withAuditedMutation({
    action: "approve",
    entityTable: "ai_outputs",
    entityId: existing.aiOutputId,
    run: () =>
      db.aiOutput.update({
        where: { id: existing.aiOutputId },
        data: {
          status: body.status === "approved" ? "approved" : "rejected",
        },
      }),
    afterJson: (result) => result,
  });

  return NextResponse.json({ ok: true, approval });
}
