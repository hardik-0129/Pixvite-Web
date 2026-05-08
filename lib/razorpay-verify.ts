import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies the payment signature returned by Razorpay Checkout (server-side only).
 * @see https://razorpay.com/docs/payments/server-integration/nodejs/payment-verification/
 */
export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expected = createHmac("sha256", keySecret).update(body).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim(), "utf8");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
