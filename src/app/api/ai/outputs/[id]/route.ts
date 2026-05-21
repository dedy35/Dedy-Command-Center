import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { withAuditedMutation } from "@/lib/audit";
import { db } from "@/lib/db";

type RouteParams = {
  params: Promise<{ id: string }>;
};

type UpdateAiOutputBody = {
  content?: string;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  await requireSessionUser();

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as UpdateAiOutputBody | null;

  if (!body?.content || !body.content.trim()) {
    return NextResponse.json({ error: "content is required." }, { status: 400 });
  }
  const nextContent = body.content.trim();

  const existing = await db.aiOutput.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "AI output not found." }, { status: 404 });
  }

  const updated = await withAuditedMutation({
    action: "update",
    entityTable: "ai_outputs",
    entityId: existing.id,
    beforeJson: existing,
    run: () =>
      db.aiOutput.update({
        where: { id: existing.id },
        data: {
          content: nextContent,
        },
      }),
    afterJson: (result) => result,
  });

  return NextResponse.json({ ok: true, aiOutput: updated });
}
