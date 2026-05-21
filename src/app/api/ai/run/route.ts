import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { withAuditedMutation } from "@/lib/audit";
import { db } from "@/lib/db";

type AiRunBody = {
  sourceId?: string | null;
  module?: string;
  promptKey?: string;
  outputType?: string;
  content?: string;
  model?: string;
};

export async function POST(request: Request) {
  await requireSessionUser();

  const body = (await request.json().catch(() => null)) as AiRunBody | null;

  if (!body?.module || !body.promptKey || !body.outputType || !body.content) {
    return NextResponse.json(
      { error: "module, promptKey, outputType, and content are required." },
      { status: 400 },
    );
  }
  const moduleName = body.module;
  const promptKey = body.promptKey;
  const outputType = body.outputType;
  const content = body.content;

  if (body.sourceId) {
    const source = await db.source.findUnique({ where: { id: body.sourceId } });
    if (!source) {
      return NextResponse.json({ error: "sourceId not found." }, { status: 404 });
    }
  }

  const aiOutput = await withAuditedMutation({
    action: "ai_run",
    entityTable: "ai_outputs",
    run: () =>
      db.aiOutput.create({
        data: {
          sourceId: body.sourceId ?? null,
          module: moduleName,
          promptKey,
          outputType,
          content,
          model: body.model ?? "mock-local-model",
        },
      }),
    afterJson: (result) => result,
  });

  return NextResponse.json({ ok: true, aiOutput }, { status: 201 });
}
