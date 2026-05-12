import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "No image file provided." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ message: "File must be an image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: "File too large (max 10 MB)." }, { status: 400 });
  }

  const rawExt = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const ext = ["jpg", "jpeg", "png", "webp", "gif"].includes(rawExt) ? rawExt : "jpg";
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

  const uploadDir = join(process.cwd(), "public", "uploads", "images");
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, filename), Buffer.from(bytes));

  return NextResponse.json({ url: `/uploads/images/${filename}` });
}
