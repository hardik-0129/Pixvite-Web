import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, extname, basename } from "path";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

type ParamsShape = { filename: string };

export async function GET(
  _: Request,
  context: { params: ParamsShape | Promise<ParamsShape> }
) {
  const { filename } = await Promise.resolve(context.params);

  // Sanitize: only allow safe filenames (no path traversal)
  const safe = basename(filename).replace(/[^a-zA-Z0-9._-]/g, "");
  if (!safe || safe !== filename) {
    return NextResponse.json({ error: "Invalid filename." }, { status: 400 });
  }

  const ext = extname(safe).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  const filePath = join(process.cwd(), "public", "uploads", "images", safe);

  try {
    const data = await readFile(filePath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }
}
