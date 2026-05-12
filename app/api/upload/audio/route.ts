import { NextResponse } from "next/server";
import { getAuthenticatedEmail } from "@/lib/server-auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(request: Request) {
  const email = await getAuthenticatedEmail();
  if (!email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "No audio file provided." }, { status: 400 });
  }
  if (!file.type.startsWith("audio/")) {
    return NextResponse.json({ message: "File must be an audio file." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: "File too large (max 50 MB)." }, { status: 400 });
  }

  const rawExt = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp3";
  const ext = ["mp3", "wav", "aac", "ogg", "m4a", "flac"].includes(rawExt) ? rawExt : "mp3";
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

  const uploadDir = join(process.cwd(), "public", "uploads", "audio");
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, filename), Buffer.from(bytes));

  return NextResponse.json({ url: `/uploads/audio/${filename}`, name: file.name });
}
