import { NextResponse } from "next/server";
import { getTemplateById } from "@/lib/template-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const template = await getTemplateById(id);
  if (!template) {
    return NextResponse.json({ message: "Template not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: template.id,
    title: template.title,
    thumbnail: template.thumbnail,
  });
}
