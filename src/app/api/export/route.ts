import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { withAuditedMutation } from "@/lib/audit";

type ExportBody = {
  modules?: string[];
  fromDate?: string;
  toDate?: string;
  format?: "csv" | "json";
};

export async function POST(request: Request) {
  await requireSessionUser();

  const body = (await request.json().catch(() => null)) as ExportBody | null;

  const exportRequest = {
    modules: body?.modules ?? ["all"],
    fromDate: body?.fromDate ?? null,
    toDate: body?.toDate ?? null,
    format: body?.format ?? "json",
    generatedAt: new Date().toISOString(),
  };

  await withAuditedMutation({
    action: "export",
    entityTable: "audit_logs",
    run: async () => exportRequest,
    afterJson: (result) => result,
  });

  return NextResponse.json({
    ok: true,
    message: "Export request recorded. Export generation will be connected in later phase.",
    request: exportRequest,
  });
}
