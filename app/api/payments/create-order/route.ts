import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { resolveCheckoutPricing } from "@/lib/coupon-checkout";
import { getTemplateById } from "@/lib/template-store";
import { insertPendingTemplateOrder } from "@/lib/template-orders";

export const runtime = "nodejs";

function parseCustomer(body: unknown) {
  if (typeof body !== "object" || body === null) return null;
  const o = body as Record<string, unknown>;
  const firstName = typeof o.firstName === "string" ? o.firstName.trim() : "";
  const lastName = typeof o.lastName === "string" ? o.lastName.trim() : "";
  const email = typeof o.email === "string" ? o.email.trim() : "";
  const phone = typeof o.phone === "string" ? o.phone.trim() : "";
  const couponRaw = typeof o.coupon === "string" ? o.coupon.trim() : "";
  const coupon = couponRaw ? couponRaw : null;
  if (!firstName || !lastName || !email || !phone) return null;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const digits = phone.replace(/\D/g, "");
  if (!emailOk || digits.length < 10) return null;
  return { firstName, lastName, email: email.toLowerCase(), phone: digits, coupon };
}

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json(
      {
        error:
          "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const templateId =
    typeof body === "object" && body !== null && "templateId" in body
      ? String((body as { templateId: unknown }).templateId ?? "").trim()
      : "";

  if (!templateId) {
    return NextResponse.json({ error: "templateId is required" }, { status: 400 });
  }

  const customer = parseCustomer(body);
  if (!customer) {
    return NextResponse.json(
      { error: "Valid firstName, lastName, email, and phone (10+ digits) are required." },
      { status: 400 }
    );
  }

  const template = await getTemplateById(templateId);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const pricing = await resolveCheckoutPricing(template.price, customer.coupon);
  if (!pricing.ok) {
    return NextResponse.json({ error: pricing.error }, { status: 400 });
  }

  const amountPaise = pricing.amountPaise;

  const receipt = `pv_${randomBytes(8).toString("hex")}`.slice(0, 40);
  const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

  try {
    const order = await rzp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: {
        template_id: template.id,
        template_title: template.title,
        ...(pricing.couponApplied ? { coupon: pricing.couponApplied } : {}),
      },
    });

    try {
      await insertPendingTemplateOrder({
        razorpayOrderId: order.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        coupon: pricing.couponApplied,
        templateId: template.id,
        templateTitle: template.title,
        currency: order.currency ?? "INR",
        subtotalInr: template.price,
        discountInr: pricing.discountInr,
        totalInr: pricing.totalInr,
        receipt,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[payments/create-order] Failed to save order:", e);
      return NextResponse.json(
        { error: "Could not save order to the database. Check MONGODB_URI and try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      keyId,
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
    });
  } catch (e) {
    console.error("[payments/create-order] Razorpay error:", e);
    return NextResponse.json({ error: "Could not create Razorpay order" }, { status: 502 });
  }
}
