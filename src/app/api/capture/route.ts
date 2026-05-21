import { AuditActor, SourceType } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveAttachmentFile } from "@/lib/storage";

const moduleHints = [
  "work",
  "finance",
  "freelance",
  "career",
  "japanese",
  "meeting",
  "life_admin",
  "media",
  "decision",
  "general",
] as const;

type ModuleHint = (typeof moduleHints)[number];

function isSourceType(value: string): value is SourceType {
  return ["text", "photo", "pdf", "url", "email", "chat", "manual"].includes(value);
}

function isModuleHint(value: string): value is ModuleHint {
  return moduleHints.includes(value as ModuleHint);
}

export async function POST(request: Request) {
  await requireSessionUser();

  const formData = await request.formData();

  const contentText = String(formData.get("contentText") ?? "").trim();
  const sourceTypeRaw = String(formData.get("sourceType") ?? "manual").trim();
  const moduleHintRaw = String(formData.get("moduleHint") ?? "general").trim();
  const uploaded = formData.get("file");

  if (!isSourceType(sourceTypeRaw)) {
    return NextResponse.json({ error: "Invalid sourceType." }, { status: 400 });
  }

  if (!isModuleHint(moduleHintRaw)) {
    return NextResponse.json({ error: "Invalid moduleHint." }, { status: 400 });
  }

  const file = uploaded instanceof File && uploaded.size > 0 ? uploaded : null;

  if (!contentText && !file) {
    return NextResponse.json(
      { error: "Please provide capture text or upload at least one file." },
      { status: 400 },
    );
  }

  let stagedAttachment: {
    filePath: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    sha256: string;
  } | null = null;

  if (file) {
    stagedAttachment = await saveAttachmentFile(file);
  }

  const result = await db.$transaction(async (tx) => {
    let attachmentId: string | null = null;

    if (stagedAttachment) {
      const existing = await tx.attachment.findUnique({
        where: { sha256: stagedAttachment.sha256 },
      });

      if (existing) {
        attachmentId = existing.id;
      } else {
        const createdAttachment = await tx.attachment.create({
          data: {
            filePath: stagedAttachment.filePath,
            fileName: stagedAttachment.fileName,
            mimeType: stagedAttachment.mimeType,
            sizeBytes: BigInt(stagedAttachment.sizeBytes),
            sha256: stagedAttachment.sha256,
          },
        });

        attachmentId = createdAttachment.id;

        await tx.auditLog.create({
          data: {
            actor: AuditActor.user,
            action: "create",
            entityTable: "attachments",
            entityId: createdAttachment.id,
            afterJson: {
              fileName: createdAttachment.fileName,
              mimeType: createdAttachment.mimeType,
              sizeBytes: createdAttachment.sizeBytes.toString(),
              sha256: createdAttachment.sha256,
            },
          },
        });
      }
    }

    const source = await tx.source.create({
      data: {
        sourceType: sourceTypeRaw,
        contentText: contentText || null,
        fileId: attachmentId,
        origin: "manual_capture",
        sensitivity: "private",
      },
    });

    await tx.auditLog.create({
      data: {
        actor: AuditActor.user,
        action: "create",
        entityTable: "sources",
        entityId: source.id,
        afterJson: {
          sourceType: source.sourceType,
          moduleHint: moduleHintRaw,
          hasFile: Boolean(attachmentId),
        },
      },
    });

    const title = contentText
      ? contentText.slice(0, 80)
      : stagedAttachment
        ? `File capture: ${stagedAttachment.fileName}`
        : "Capture";

    const lifeEvent = await tx.lifeEvent.create({
      data: {
        eventDate: new Date(),
        module: moduleHintRaw,
        title,
        summary: contentText ? contentText.slice(0, 240) : null,
        sourceId: source.id,
        sensitivity: "private",
      },
    });

    await tx.auditLog.create({
      data: {
        actor: AuditActor.user,
        action: "create",
        entityTable: "life_events",
        entityId: lifeEvent.id,
        afterJson: {
          module: lifeEvent.module,
          title: lifeEvent.title,
          sourceId: source.id,
        },
      },
    });

    return {
      source,
      lifeEvent,
      attachmentId,
    };
  });

  return NextResponse.json({
    ok: true,
    sourceId: result.source.id,
    lifeEventId: result.lifeEvent.id,
    attachmentId: result.attachmentId,
  });
}
