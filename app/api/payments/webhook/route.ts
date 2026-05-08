import { NextResponse } from "next/server";
import {
  incrementCouponUsageAfterPayment,
  normalizeCouponCode,
} from "@/lib/coupon-checkout";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay-webhook-verify";
import { getTemplateOrderCouponRaw, markTemplateOrderPaidIfPending } from "@/lib/template-orders";

export const runtime = "nodejs";

/** Razorpay payment entity inside webhook payload (subset). */
type PaymentEntity = {
  id?: string;
  order_id?: string | undefined;
  status?: string;
};

type WebhookBody = {
  event?: string;
  payload?: {
    payment?: {
      entity?: PaymentEntity;
    };
  };
};

function pickPaymentCaptured(body: WebhookBody): { paymentId: string; orderId: string } | null {
  const e = body.payload?.payment?.entity;
  if (!e?.id || !e.order_id) return null;
  return { paymentId: String(e.id), orderId: String(e.order_id) };
}

/**
 * Razorpay → Webhooks: subscribe to **payment.captured** (and optionally retry-friendly events).
 * Set `RAZORPAY_WEBHOOK_SECRET` from the Razorpay Dashboard → Webhooks → your endpoint secret.
 *
 * Endpoint URL (production): `https://your-domain.com/api/payments/webhook`
 */
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[payments/webhook] RAZORPAY_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("x-razorpay-signature");
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!verifyRazorpayWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let parsed: WebhookBody;
  try {
    parsed = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = typeof parsed.event === "string" ? parsed.event : "";

  if (event !== "payment.captured") {
    return NextResponse.json({ ok: true, ignored: event || "unknown" });
  }

  const ids = pickPaymentCaptured(parsed);
  if (!ids) {
    return NextResponse.json({ ok: true, ignored: "no_payment_entity" });
  }

  try {
    const couponRaw = await getTemplateOrderCouponRaw(ids.orderId);
    const becamePaid = await markTemplateOrderPaidIfPending(ids.orderId, ids.paymentId);
    if (becamePaid && couponRaw) {
      await incrementCouponUsageAfterPayment(normalizeCouponCode(couponRaw));
    }
  } catch (e) {
    console.error("[payments/webhook] Fulfillment error:", e);
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
