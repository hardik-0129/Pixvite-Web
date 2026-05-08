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

  const backendPrefix = (process.env.BACKEND_PREFIX || process.env.NEXT_PUBLIC_BACKEND_PREFIX || "").trim().replace(/\/+$/, "");
  if (!backendPrefix) {
    return NextResponse.json({ error: "BACKEND_PREFIX is not configured." }, { status: 500 });
  }

  const proxiedUrl = `${backendPrefix}/template-assets/${safeParts.map(encodeURIComponent).join("/")}`;

  try {
    const upstream = await fetch(proxiedUrl, { method: "GET", cache: "no-store" });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Asset not found." }, { status: upstream.status === 404 ? 404 : 502 });
    }

    const body = await upstream.arrayBuffer();
    const ext = safeParts[safeParts.length - 1]?.includes(".")
      ? safeParts[safeParts.length - 1].slice(safeParts[safeParts.length - 1].lastIndexOf("."))
      : "";
    const contentType = upstream.headers.get("content-type") || contentTypeFromExt(ext);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": upstream.headers.get("cache-control") || "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Backend asset service unreachable." }, { status: 502 });
  }
}
