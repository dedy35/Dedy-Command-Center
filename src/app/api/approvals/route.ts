import { ApprovalActionType } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { withAuditedMutation } from "@/lib/audit";
import { db } from "@/lib/db";

type CreateApprovalBody = {
  aiOutputId?: string;
  actionType?: ApprovalActionType;
  note?: string;
};

export async function POST(request: Request) {
  await requireSessionUser();

  const body = (await request.json().catch(() => null)) as CreateApprovalBody | null;
  if (!body?.aiOutputId || !body?.actionType) {
    return NextResponse.json({ error: "aiOutputId and actionType are required." }, { status: 400 });
  }
  const actionType = body.actionType;

  const aiOutput = await db.aiOutput.findUnique({ where: { id: body.aiOutputId } });
  if (!aiOutput) {
    return NextResponse.json({ error: "AI output not found." }, { status: 404 });
  }

  const approval = await withAuditedMutation({
    action: "create",
    entityTable: "approvals",
    run: () =>
      db.approval.create({
        data: {
          actionType,
          approvalNote: body.note,
          aiOutput: {
            connect: { id: aiOutput.id },
          },
        },
      }),
    afterJson: (result) => result,
  });

  return NextResponse.json({ ok: true, approval }, { status: 201 });
}
