import { NextResponse } from "next/server";
import { getAuthenticatedEmail } from "@/lib/server-auth";
import { getOrderByTemplateAndEmail } from "@/lib/template-orders";

export async function GET(request: Request) {
  const email = await getAuthenticatedEmail();
  if (!email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get("templateId")?.trim() ?? "";
  if (!templateId) return NextResponse.json({ message: "templateId is required" }, { status: 400 });

  const order = await getOrderByTemplateAndEmail(templateId, email);
  if (!order) return NextResponse.json({ order: null });

  return NextResponse.json({
    order: {
      razorpayOrderId: order.razorpayOrderId,
      renderStatus: order.renderStatus ?? null,
      renderError: order.renderError ?? null,
    },
  });
}
