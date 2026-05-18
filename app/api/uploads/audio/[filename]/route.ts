import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, extname, basename } from "path";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".flac": "audio/flac",
};

type ParamsShape = { filename: string };

export async function GET(
  _: Request,
  context: { params: ParamsShape | Promise<ParamsShape> }
) {
  const { filename } = await Promise.resolve(context.params);

  const safe = basename(filename).replace(/[^a-zA-Z0-9._-]/g, "");
  if (!safe || safe !== filename) {
    return NextResponse.json({ error: "Invalid filename." }, { status: 400 });
  }

  const ext = extname(safe).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  const filePath = join(process.cwd(), "public", "uploads", "audio", safe);

  try {
    const data = await readFile(filePath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Accept-Ranges": "bytes",
      },
    });
  } catch {
    return NextResponse.json({ error: "Audio not found." }, { status: 404 });
  }
}
