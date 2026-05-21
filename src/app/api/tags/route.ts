import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { withAuditedMutation } from "@/lib/audit";
import { db } from "@/lib/db";

type TagBody = {
  id?: string;
  name?: string;
  color?: string | null;
};

export async function POST(request: Request) {
  await requireSessionUser();

  const body = (await request.json().catch(() => null)) as TagBody | null;
  if (!body?.name) {
    return NextResponse.json({ error: "Tag name is required." }, { status: 400 });
  }
  const name = body.name;

  const tag = await withAuditedMutation({
    action: "create",
    entityTable: "tags",
    run: () =>
      db.tag.create({
        data: {
          name,
          color: body.color ?? null,
        },
      }),
    afterJson: (result) => result,
  });

  return NextResponse.json({ ok: true, tag }, { status: 201 });
}

export async function PUT(request: Request) {
  await requireSessionUser();

  const body = (await request.json().catch(() => null)) as TagBody | null;
  if (!body?.id || !body.name) {
    return NextResponse.json({ error: "Tag id and name are required." }, { status: 400 });
  }
  const name = body.name;

  const existing = await db.tag.findUnique({ where: { id: body.id } });
  if (!existing) {
    return NextResponse.json({ error: "Tag not found." }, { status: 404 });
  }

  const tag = await withAuditedMutation({
    action: "update",
    entityTable: "tags",
    entityId: existing.id,
    beforeJson: existing,
    run: () =>
      db.tag.update({
        where: { id: existing.id },
        data: {
          name,
          color: body.color ?? null,
        },
      }),
    afterJson: (result) => result,
  });

  return NextResponse.json({ ok: true, tag });
}

export async function DELETE(request: Request) {
  await requireSessionUser();

  const body = (await request.json().catch(() => null)) as TagBody | null;
  if (!body?.id) {
    return NextResponse.json({ error: "Tag id is required." }, { status: 400 });
  }

  const existing = await db.tag.findUnique({ where: { id: body.id } });
  if (!existing) {
    return NextResponse.json({ error: "Tag not found." }, { status: 404 });
  }

  await withAuditedMutation({
    action: "delete",
    entityTable: "tags",
    entityId: existing.id,
    beforeJson: existing,
    run: () => db.tag.delete({ where: { id: existing.id } }),
    afterJson: (result) => result,
  });

  return NextResponse.json({ ok: true });
}
