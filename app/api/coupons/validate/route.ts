import { NextResponse } from "next/server";
import { getTemplateById } from "@/lib/template-store";
import { resolveCheckoutPricing } from "@/lib/coupon-checkout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const templateId = typeof o.templateId === "string" ? o.templateId.trim() : "";
  const code = typeof o.code === "string" ? o.code : "";

  if (!templateId) {
    return NextResponse.json({ error: "templateId is required" }, { status: 400 });
  }

  const template = await getTemplateById(templateId);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const pricing = await resolveCheckoutPricing(template.price, code.trim() || null);
  if (!pricing.ok) {
    return NextResponse.json({ error: pricing.error }, { status: 400 });
  }

  return NextResponse.json({
    subtotalInr: template.price,
    discountInr: pricing.discountInr,
    totalInr: pricing.totalInr,
    coupon: pricing.couponApplied,
  });
}
