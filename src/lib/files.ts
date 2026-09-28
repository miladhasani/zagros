import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const uploadRoot = () => path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

export function randomPassword(length = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function saveUpload(file: File, folder: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || "";
  const safeName = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const dir = path.join(uploadRoot(), folder);
  await mkdir(dir, { recursive: true });
  const rel = path.join(folder, safeName).replaceAll("\\", "/");
  await writeFile(path.join(uploadRoot(), rel), buffer);
  return { rel, fileName: file.name };
}

export function resolveUpload(rel: string) {
  const root = path.resolve(uploadRoot());
  const full = path.resolve(root, rel);
  if (full !== root && !full.startsWith(root + path.sep)) throw new Error("مسیر نامعتبر است");
  return full;
}
