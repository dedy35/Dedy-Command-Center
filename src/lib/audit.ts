import { AuditActor } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { db } from "./db";

type AuditPayload = {
  actor: AuditActor;
  action: string;
  entityTable: string;
  entityId?: string | null;
  beforeJson?: unknown;
  afterJson?: unknown;
};

export async function writeAuditLog(payload: AuditPayload) {
  const beforeJson =
    payload.beforeJson === undefined
      ? undefined
      : payload.beforeJson === null
        ? Prisma.JsonNull
        : (payload.beforeJson as Prisma.InputJsonValue);

  const afterJson =
    payload.afterJson === undefined
      ? undefined
      : payload.afterJson === null
        ? Prisma.JsonNull
        : (payload.afterJson as Prisma.InputJsonValue);

  return db.auditLog.create({
    data: {
      actor: payload.actor,
      action: payload.action,
      entityTable: payload.entityTable,
      entityId: payload.entityId ?? null,
      beforeJson,
      afterJson,
    },
  });
}

export async function withAuditedMutation<T>(args: {
  action: "create" | "update" | "delete" | "approve" | "export" | "ai_run";
  entityTable: string;
  entityId?: string | null;
  beforeJson?: unknown;
  run: () => Promise<T>;
  afterJson?: (result: T) => unknown;
}) {
  const result = await args.run();

  await writeAuditLog({
    actor: AuditActor.user,
    action: args.action,
    entityTable: args.entityTable,
    entityId: args.entityId,
    beforeJson: args.beforeJson,
    afterJson: args.afterJson ? args.afterJson(result) : undefined,
  });

  return result;
}
