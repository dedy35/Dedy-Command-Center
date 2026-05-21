import { AuditActor } from "@prisma/client";
import { NextResponse } from "next/server";

import { createLoginResponse, getSingleUserCredential } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginBody | null;

  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const credential = await getSingleUserCredential();

  if (body.email !== credential.email || body.password !== credential.password) {
    await writeAuditLog({
      actor: AuditActor.system,
      action: "login_failed",
      entityTable: "users",
      entityId: credential.user.id,
      afterJson: { attemptedEmail: body.email },
    });

    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  await writeAuditLog({
    actor: AuditActor.user,
    action: "login",
    entityTable: "users",
    entityId: credential.user.id,
    afterJson: { email: credential.user.email },
  });

  return createLoginResponse(credential.user);
}
