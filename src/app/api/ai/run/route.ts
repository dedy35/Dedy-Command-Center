import { NextResponse } from "next/server";

import { getPromptTemplateByKey } from "@/config/prompts";
import { requireSessionUser } from "@/lib/auth";
import { withAuditedMutation } from "@/lib/audit";
import { db } from "@/lib/db";
import { runMockLocalAi } from "@/lib/mock-ai-provider";

export const dynamic = "force-dynamic";

type AiRunBody = {
  sourceId?: string | null;
  module?: string;
  promptKey?: string;
  inputText?: string;
  content?: string;
  model?: string;
};

export async function POST(request: Request) {
  await requireSessionUser();

  const body = (await request.json().catch(() => null)) as AiRunBody | null;

  if (!body?.module || !body.promptKey) {
    return NextResponse.json({ error: "module and promptKey are required." }, { status: 400 });
  }
  const moduleName = body.module;
  const promptKey = body.promptKey;

  const prompt = getPromptTemplateByKey(promptKey);
  if (!prompt) {
    return NextResponse.json({ error: "Unknown prompt_key." }, { status: 400 });
  }

  if (prompt.module !== moduleName) {
    return NextResponse.json(
      {
        error: `Prompt ${prompt.key} belongs to module ${prompt.module}, not ${moduleName}.`,
      },
      { status: 400 },
    );
  }

  if (body.sourceId) {
    const source = await db.source.findUnique({ where: { id: body.sourceId } });
    if (!source) {
      return NextResponse.json({ error: "sourceId not found." }, { status: 404 });
    }
  }

  const inputText = (body.inputText ?? body.content ?? "").trim();
  if (!inputText) {
    return NextResponse.json({ error: "inputText is required." }, { status: 400 });
  }

  const generatedDraft = await runMockLocalAi({
    prompt,
    inputText,
  });

  const aiOutput = await withAuditedMutation({
    action: "ai_run",
    entityTable: "ai_outputs",
    run: () =>
      db.aiOutput.create({
        data: {
          sourceId: body.sourceId ?? null,
          module: moduleName,
          promptKey: prompt.key,
          outputType: prompt.outputType,
          content: generatedDraft,
          model: body.model ?? "mock-local-ai-v1",
        },
      }),
    afterJson: (result) => result,
  });

  return NextResponse.json({
    ok: true,
    aiOutput,
    provider: "mock-local-ai-v1",
    promptTemplate: {
      key: prompt.key,
      title: prompt.title,
      approvalRequired: prompt.approvalRequired,
    },
  });
}
