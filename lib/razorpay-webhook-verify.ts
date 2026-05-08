import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Validates Razorpay webhook `X-Razorpay-Signature` against the raw POST body.
 * @see https://razorpay.com/docs/webhooks/validate-test/
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string
): boolean {
  if (!webhookSecret || !signatureHeader) return false;
  const expected = createHmac("sha256", webhookSecret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signatureHeader.trim(), "utf8");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
