import { NextResponse } from "next/server";
import { getAuthenticatedEmail } from "@/lib/server-auth";
import { getDraft, deleteDraft } from "@/lib/draft-store";

type RouteContext = { params: Promise<{ templateId: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const email = await getAuthenticatedEmail();
  if (!email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { templateId } = await ctx.params;
  const draft = await getDraft(email, templateId);
  if (!draft) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(draft);
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const email = await getAuthenticatedEmail();
  if (!email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { templateId } = await ctx.params;
  await deleteDraft(email, templateId);
  return NextResponse.json({ ok: true });
}
