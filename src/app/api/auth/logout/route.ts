import { AuditActor } from "@prisma/client";

import { createLogoutResponse, getCurrentSessionUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const sessionUser = await getCurrentSessionUser();

  if (sessionUser) {
    await writeAuditLog({
      actor: AuditActor.user,
      action: "logout",
      entityTable: "users",
      entityId: sessionUser.id,
      afterJson: { email: sessionUser.email },
    });
  }

  return createLogoutResponse(request);
}
