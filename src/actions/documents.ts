"use server";

import { revalidatePath } from "next/cache";
import { writeAudit } from "@/lib/audit";
import { saveUpload } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function uploadDocumentAction(_: unknown, formData: FormData) {
  const actor = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const file = formData.get("file");
  if (!title) return { error: "عنوان الزامی است" };
  if (!(file instanceof File) || file.size === 0) return { error: "فایل را انتخاب کنید" };
  const saved = await saveUpload(file, "documents");
  const item = await prisma.document.create({
    data: {
      title,
      description: description || null,
      filePath: saved.rel,
      fileName: saved.fileName,
      uploadedById: actor.id,
    },
  });
  await writeAudit({ actorId: actor.id, action: "create", entity: "Document", entityId: item.id });
  revalidatePath("/panel/documents");
  return { ok: true };
}

export async function deleteDocumentAction(id: string) {
  const actor = await requireAdmin();
  await prisma.document.delete({ where: { id } });
  await writeAudit({ actorId: actor.id, action: "delete", entity: "Document", entityId: id });
  revalidatePath("/panel/documents");
}
