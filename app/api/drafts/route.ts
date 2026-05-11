import { NextResponse } from "next/server";
import { getAuthenticatedEmail } from "@/lib/server-auth";
import { upsertDraft, listDrafts } from "@/lib/draft-store";

export async function GET() {
  const email = await getAuthenticatedEmail();
  if (!email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const drafts = await listDrafts(email);
  return NextResponse.json({ drafts });
}

export async function POST(request: Request) {
  const email = await getAuthenticatedEmail();
  if (!email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { templateId?: unknown; values?: unknown };
  const { templateId, values } = body;

  if (!templateId || typeof templateId !== "string") {
    return NextResponse.json({ message: "templateId is required." }, { status: 400 });
  }
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    return NextResponse.json({ message: "values must be an object." }, { status: 400 });
  }

  await upsertDraft(email, templateId, values as Record<string, string>);
  return NextResponse.json({ ok: true });
}
