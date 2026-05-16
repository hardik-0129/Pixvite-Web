import { NextResponse } from "next/server";
import { getOrderById, markOrderRenderDone, markOrderRenderError } from "@/lib/template-orders";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function GET(_request: Request, ctx: RouteContext) {
  const { orderId } = await ctx.params;

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ message: "Order not found." }, { status: 404 });
  }

  if (order.renderStatus === "done") {
    return NextResponse.json({ status: "done", progress: 1 });
  }
  if (order.renderStatus === "error") {
    return NextResponse.json({ status: "error", error: order.renderError ?? "Render failed." });
  }

  const renderServerUrl = (process.env.NEXT_PUBLIC_LOTTIE_RENDER_SERVER_URL || "").trim().replace(/\/+$/, "");
  if (!renderServerUrl) {
    return NextResponse.json({ status: order.renderStatus ?? "pending", progress: 0 });
  }

  const renderSecret = (process.env.NEXT_PUBLIC_LOTTIE_RENDER_SECRET || "").trim();
  const headers: Record<string, string> = renderSecret ? { "x-render-secret": renderSecret } : {};

  let serverRes: Response;
  try {
    serverRes = await fetch(`${renderServerUrl}/render/orders/${orderId}/status`, { headers });
  } catch {
    return NextResponse.json({ status: order.renderStatus ?? "pending", progress: 0 });
  }

  if (!serverRes.ok) {
    return NextResponse.json({ status: order.renderStatus ?? "pending", progress: 0 });
  }

  const data = (await serverRes.json()) as {
    done?: boolean;
    progress?: number;
    phase?: string;
    error?: string;
    found?: boolean;
  };

  if (data.done) {
    if (data.error) {
      await markOrderRenderError(orderId, data.error);
      return NextResponse.json({ status: "error", error: data.error });
    }
    await markOrderRenderDone(orderId);
    return NextResponse.json({ status: "done", progress: 1 });
  }

  return NextResponse.json({
    status: data.error ? "error" : "processing",
    progress: data.progress ?? 0,
    phase: data.phase ?? null,
    error: data.error ?? null,
  });
}
