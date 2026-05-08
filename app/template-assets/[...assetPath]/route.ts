import path from "node:path";
import { stat, readFile } from "node:fs/promises";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function contentTypeFromExt(ext: string) {
  const e = ext.toLowerCase();
  if (e === ".png") return "image/png";
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg";
  if (e === ".webp") return "image/webp";
  if (e === ".gif") return "image/gif";
  if (e === ".svg") return "image/svg+xml";
  if (e === ".mp4") return "video/mp4";
  if (e === ".webm") return "video/webm";
  if (e === ".mov") return "video/quicktime";
  if (e === ".m4v") return "video/x-m4v";
  if (e === ".mp3") return "audio/mpeg";
  if (e === ".wav") return "audio/wav";
  if (e === ".ogg") return "audio/ogg";
  if (e === ".m4a") return "audio/mp4";
  if (e === ".ttf") return "font/ttf";
  if (e === ".otf") return "font/otf";
  if (e === ".woff") return "font/woff";
  if (e === ".woff2") return "font/woff2";
  if (e === ".json") return "application/json";
  return "application/octet-stream";
}

type ParamsShape = { assetPath?: string[] };

async function resolveParams(params: ParamsShape | Promise<ParamsShape>) {
  return await Promise.resolve(params);
}

export async function GET(_: Request, context: { params: ParamsShape | Promise<ParamsShape> }) {
  const resolvedParams = await resolveParams(context.params);
  const safeParts = (resolvedParams.assetPath ?? [])
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => p !== "." && p !== ".." && !p.includes("\0"));

  if (!safeParts.length) {
    return NextResponse.json({ error: "Asset path is required." }, { status: 400 });
  }

  const adminAssetsRoot = path.resolve(process.cwd(), "../Pixvite-Admin/public/template-assets");
  const target = path.resolve(adminAssetsRoot, ...safeParts);
  const normRoot = path.normalize(adminAssetsRoot).toLowerCase();
  const normTarget = path.normalize(target).toLowerCase();
  if (!normTarget.startsWith(normRoot)) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  try {
    const fileStat = await stat(target);
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }
    const body = await readFile(target);
    const ext = path.extname(target);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentTypeFromExt(ext),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }
}
