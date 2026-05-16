import { NextResponse } from "next/server";
import { getOrderById, updateOrderRenderJob } from "@/lib/template-orders";
import { getTemplateById } from "@/lib/template-store";
import { buildEditedLottieForDownload } from "@/lib/lottie-apply-fields";
import { absolutizeLottieUrlsForServer, absolutizeUrlIfRelative } from "@/lib/lottie-absolutize-assets";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ orderId: string }> };

function getAppOrigin(request: Request): string {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  return host ? `${proto}://${host}` : "";
}

export async function POST(request: Request, ctx: RouteContext) {
  const { orderId } = await ctx.params;

  const renderServerUrl = (process.env.NEXT_PUBLIC_LOTTIE_RENDER_SERVER_URL || "").trim().replace(/\/+$/, "");
  if (!renderServerUrl) {
    return NextResponse.json({ message: "Render server not configured." }, { status: 503 });
  }

  const order = await getOrderById(orderId);
  if (!order || order.status !== "paid") {
    return NextResponse.json({ message: "Order not found." }, { status: 404 });
  }
  if (order.renderStatus === "done") {
    return NextResponse.json({ alreadyDone: true });
  }

  const template = await getTemplateById(order.templateId);
  if (!template?.lottiePreviewUrl) {
    return NextResponse.json({ message: "Template has no Lottie file." }, { status: 422 });
  }

  const fieldValues = order.fieldValuesAtPayment ?? {};
  const origin = getAppOrigin(request);

  const lottieUrl = origin
    ? absolutizeUrlIfRelative(template.lottiePreviewUrl, origin)
    : template.lottiePreviewUrl;

  const edited = await buildEditedLottieForDownload(
    lottieUrl,
    template.formFields,
    fieldValues
  );
  const lottiePayload = origin ? absolutizeLottieUrlsForServer(edited, origin) : edited;

  const plateVideoUrl = (template.backgroundVideoUrl || template.previewVideoUrl || "").trim();
  const audioUrl = (order.customAudioUrl?.trim() || template.previewAudioUrl?.trim() || "");
  const fontUrls = (template.previewFontUrls ?? []).map((u) =>
    origin ? absolutizeUrlIfRelative(u, origin) : u
  );

  const renderSecret = (process.env.NEXT_PUBLIC_LOTTIE_RENDER_SECRET || "").trim();
  const renderEngine = (
    (process.env.NEXT_PUBLIC_LOTTIE_RENDER_ENGINE || "remotion").trim().toLowerCase() === "browser"
      ? "browser"
      : "remotion"
  );

  const form = new FormData();
  form.append("animationData", JSON.stringify(lottiePayload));
  form.append("orderId", orderId);
  if (plateVideoUrl) form.append("plateVideoUrl", origin ? absolutizeUrlIfRelative(plateVideoUrl, origin) : plateVideoUrl);
  if (audioUrl) form.append("audioUrl", origin ? absolutizeUrlIfRelative(audioUrl, origin) : audioUrl);
  if (fontUrls.length) form.append("previewFontUrls", JSON.stringify(fontUrls));
  form.append("renderEngine", renderEngine);
  if (renderSecret) form.append("renderSecret", renderSecret);

  const renderRes = await fetch(`${renderServerUrl}/render/order`, { method: "POST", body: form });

  if (!renderRes.ok) {
    const err = await renderRes.json().catch(() => ({})) as { error?: string };
    return NextResponse.json(
      { message: err.error ?? "Render server error." },
      { status: renderRes.status }
    );
  }

  const renderData = (await renderRes.json()) as { jobId?: string; alreadyDone?: boolean };

  if (renderData.alreadyDone) {
    return NextResponse.json({ alreadyDone: true });
  }

  if (renderData.jobId) {
    await updateOrderRenderJob(orderId, renderData.jobId, "processing");
  }

  return NextResponse.json({ ok: true, jobId: renderData.jobId ?? null });
}
