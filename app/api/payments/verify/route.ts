import { NextResponse } from "next/server";
import {
  incrementCouponUsageAfterPayment,
  normalizeCouponCode,
} from "@/lib/coupon-checkout";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay-verify";
import { getDb } from "@/lib/mongodb";
import { getTemplateOrderCouponRaw, markTemplateOrderPaidIfPending } from "@/lib/template-orders";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Razorpay is not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, fieldValuesAtPayment, customAudioUrl } =
    body as Record<string, unknown>;

  const orderId = typeof razorpay_order_id === "string" ? razorpay_order_id.trim() : "";
  const paymentId = typeof razorpay_payment_id === "string" ? razorpay_payment_id.trim() : "";
  const signature = typeof razorpay_signature === "string" ? razorpay_signature.trim() : "";

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json(
      { error: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required" },
      { status: 400 }
    );
  }

  const ok = verifyRazorpayPaymentSignature(orderId, paymentId, signature, keySecret);
  if (!ok) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  try {
    const couponRaw = await getTemplateOrderCouponRaw(orderId);
    const becamePaid = await markTemplateOrderPaidIfPending(orderId, paymentId);
    if (becamePaid) {
      if (couponRaw) {
        await incrementCouponUsageAfterPayment(normalizeCouponCode(couponRaw));
      }
      // Save locked field values and mark render as pending
      if (
        fieldValuesAtPayment &&
        typeof fieldValuesAtPayment === "object" &&
        !Array.isArray(fieldValuesAtPayment)
      ) {
        const db = await getDb();
        await db.collection("template_orders").updateOne(
          { razorpayOrderId: orderId },
          {
            $set: {
              fieldValuesAtPayment: fieldValuesAtPayment as Record<string, string>,
              ...(typeof customAudioUrl === "string" && customAudioUrl.trim()
                ? { customAudioUrl: customAudioUrl.trim() }
                : {}),
              renderStatus: "pending",
            },
          }
        );
      }
    }
  } catch (e) {
    console.error("[payments/verify] Failed to update order:", e);
  }

  return NextResponse.json({ verified: true, orderId, paymentId });
}
