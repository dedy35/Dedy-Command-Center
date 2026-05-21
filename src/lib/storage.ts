import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ATTACHMENT_ROOT = path.join(process.cwd(), "storage", "attachments");

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function saveAttachmentFile(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const sha256 = createHash("sha256").update(buffer).digest("hex");

  const safeName = sanitizeFileName(file.name || "upload.bin");
  const ext = path.extname(safeName);
  const uniqueName = `${Date.now()}-${randomUUID()}${ext}`;
  const absolutePath = path.join(ATTACHMENT_ROOT, uniqueName);

  await mkdir(ATTACHMENT_ROOT, { recursive: true });
  await writeFile(absolutePath, buffer);

  return {
    sha256,
    sizeBytes: buffer.length,
    mimeType: file.type || "application/octet-stream",
    fileName: safeName,
    filePath: path.relative(process.cwd(), absolutePath),
  };
}
