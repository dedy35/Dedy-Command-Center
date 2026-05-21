import { NextResponse } from "next/server";

import { getPromptTemplateByKey } from "@/config/prompts";
import { requireSessionUser } from "@/lib/auth";
import { withAuditedMutation } from "@/lib/audit";
import { db } from "@/lib/db";
import { runMockLocalAi } from "@/lib/mock-ai-provider";
import { buildStarCvDraft } from "@/lib/work-log-generator";

type RouteParams = {
  params: Promise<{ id: string }>;
};

type GenerateBody = {
  promptKey?: string;
};

export async function POST(request: Request, { params }: RouteParams) {
  await requireSessionUser();

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as GenerateBody | null;
  const promptKey = body?.promptKey ?? "cv_bullet_star_v1";

  const prompt = getPromptTemplateByKey(promptKey);
  if (!prompt) {
    return NextResponse.json({ error: "Unknown prompt_key." }, { status: 400 });
  }

  if (prompt.module !== "daily_log") {
    return NextResponse.json(
      { error: `Prompt ${promptKey} is not registered for daily_log module.` },
      { status: 400 },
    );
  }

  const workLog = await db.workLog.findUnique({
    where: { id },
    include: {
      relatedTicket: {
        select: {
          ticketNo: true,
          title: true,
        },
      },
    },
  });

  if (!workLog) {
    return NextResponse.json({ error: "Work log not found." }, { status: 404 });
  }

  const inputText = [
    `date=${workLog.workDate.toISOString().slice(0, 10)}`,
    `category=${workLog.category}`,
    `description=${workLog.description}`,
    `impact=${workLog.impact ?? "(missing)"}`,
    `related_ticket=${workLog.relatedTicket?.ticketNo ?? "-"} ${workLog.relatedTicket?.title ?? ""}`,
  ].join("\n");

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
          sourceId: null,
          module: "daily_log",
          promptKey: prompt.key,
          outputType: prompt.outputType,
          content: generatedDraft,
          model: "mock-local-ai-v1",
        },
      }),
    afterJson: (created) => created,
  });

  if (prompt.key !== "cv_bullet_star_v1") {
    return NextResponse.json({
      ok: true,
      promptKey: prompt.key,
      aiOutput,
      message: "Draft generated and saved. No achievement record created for this prompt.",
    });
  }

  const draft = buildStarCvDraft(workLog);

  const achievement = await withAuditedMutation({
    action: "create",
    entityTable: "achievements",
    run: () =>
      db.achievement.create({
        data: {
          workLogId: workLog.id,
          sourceAiOutputId: aiOutput.id,
          starSituation: draft.starSituation,
          starTask: draft.starTask,
          starAction: draft.starAction,
          starResult: draft.starResult,
          cvBulletEn: draft.cvBulletEn,
          cvBulletId: draft.cvBulletId,
          impactQuestions: draft.impactQuestions,
        },
      }),
    afterJson: (created) => created,
  });

  return NextResponse.json({
    ok: true,
    promptKey: prompt.key,
    aiOutput,
    achievement,
    noInventedMetrics: draft.impactQuestions.length > 0,
  });
}
