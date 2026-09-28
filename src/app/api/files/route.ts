import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { NextRequest } from "next/server";
import { Readable } from "stream";
import { auth } from "@/lib/auth";
import { resolveUpload } from "@/lib/files";

export async function GET(req: NextRequest) {
  const rel = req.nextUrl.searchParams.get("path");
  if (!rel) return new Response("Not found", { status: 404 });

  const isPublic = rel.startsWith("public/");
  if (!isPublic) {
    const session = await auth();
    if (!session?.user) return new Response("Unauthorized", { status: 401 });
  }

  try {
    const full = resolveUpload(rel);
    const info = await stat(full);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    const stream = Readable.toWeb(createReadStream(full)) as ReadableStream;
    return new Response(stream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(info.size),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
