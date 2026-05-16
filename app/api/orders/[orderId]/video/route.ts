import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/template-orders";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function GET(_request: Request, ctx: RouteContext) {
  const { orderId } = await ctx.params;

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ message: "Order not found." }, { status: 404 });
  }
  if (order.renderStatus !== "done") {
    return NextResponse.json({ message: "Video not ready yet." }, { status: 409 });
  }

  const renderServerUrl = (process.env.NEXT_PUBLIC_LOTTIE_RENDER_SERVER_URL || "").trim().replace(/\/+$/, "");
  if (!renderServerUrl) {
    return NextResponse.json({ message: "Render server not configured." }, { status: 503 });
  }

  const renderSecret = (process.env.NEXT_PUBLIC_LOTTIE_RENDER_SECRET || "").trim();
  const headers: Record<string, string> = renderSecret ? { "x-render-secret": renderSecret } : {};

  const fileRes = await fetch(`${renderServerUrl}/render/orders/${orderId}/file`, { headers });
  if (!fileRes.ok) {
    return NextResponse.json({ message: "File not available." }, { status: fileRes.status });
  }

  const filename = `${order.templateTitle || "video"}-${orderId}.mp4`
    .replace(/[^a-zA-Z0-9._-]/g, "_");

  return new NextResponse(fileRes.body, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
