import { NextResponse } from "next/server";

import { listPromptTemplates } from "@/config/prompts";
import { requireSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireSessionUser();

  const { searchParams } = new URL(request.url);
  const moduleName = searchParams.get("module") ?? undefined;

  return NextResponse.json({
    ok: true,
    prompts: listPromptTemplates(moduleName),
  });
}
