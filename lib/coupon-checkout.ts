import { getDb } from "@/lib/mongodb";

/** Matches admin `coupons` collection (Pixvite-deshbord). */
export type CouponDoc = {
  code: string;
  codeNormalized: string;
  type: "percent" | "fixed";
  discount: number;
  maxUses: number;
  used: number;
  expiry: string;
  active: boolean;
};

const COLLECTION = "coupons";

export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function todayISODateUtc(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Discount in INR (never pushes total below ₹1). */
export function computeDiscountAmount(subtotalInr: number, coupon: CouponDoc): number {
  let off =
    coupon.type === "percent" ? roundMoney((subtotalInr * coupon.discount) / 100) : roundMoney(coupon.discount);
  off = Math.min(off, Math.max(0, subtotalInr - 1));
  return roundMoney(off);
}

export type CheckoutPricing =
  | { ok: false; error: string }
  | {
      ok: true;
      couponApplied: string | null;
      discountInr: number;
      totalInr: number;
      amountPaise: number;
    };

/** Single source of truth for checkout totals (reuse in validate + create-order). */
export async function resolveCheckoutPricing(subtotalInr: number, couponRaw: string | null | undefined): Promise<CheckoutPricing> {
  if (!Number.isFinite(subtotalInr) || subtotalInr <= 0) {
    return { ok: false, error: "Invalid template price." };
  }

  const sub = roundMoney(subtotalInr);
  const trimmed = couponRaw?.trim();

  if (!trimmed) {
    const amountPaise = Math.round(sub * 100);
    if (amountPaise < 100) {
      return { ok: false, error: "Order amount must be at least ₹1." };
    }
    return {
      ok: true,
      couponApplied: null,
      discountInr: 0,
      totalInr: sub,
      amountPaise,
    };
  }

  const codeNormalized = normalizeCouponCode(trimmed);
  if (!codeNormalized) {
    return { ok: false, error: "Enter a valid coupon code." };
  }

  const db = await getDb();
  const doc = await db.collection<CouponDoc>(COLLECTION).findOne({ codeNormalized });

  if (!doc) {
    return { ok: false, error: "Invalid coupon code." };
  }
  if (!doc.active) {
    return { ok: false, error: "This coupon is not active." };
  }
  if (doc.expiry < todayISODateUtc()) {
    return { ok: false, error: "This coupon has expired." };
  }
  if (doc.used >= doc.maxUses) {
    return { ok: false, error: "This coupon has reached its usage limit." };
  }

  const discountInr = computeDiscountAmount(sub, doc);
  const totalInr = roundMoney(sub - discountInr);
  const amountPaise = Math.round(totalInr * 100);

  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    return { ok: false, error: "Discounted amount must be at least ₹1." };
  }

  return {
    ok: true,
    couponApplied: doc.code,
    discountInr,
    totalInr,
    amountPaise,
  };
}

export async function incrementCouponUsageAfterPayment(codeNormalized: string): Promise<void> {
  if (!codeNormalized) return;
  const db = await getDb();
  await db.collection(COLLECTION).updateOne(
    {
      codeNormalized,
      active: true,
      $expr: { $lt: ["$used", "$maxUses"] },
    },
    {
      $inc: { used: 1 },
      $set: { updatedAt: new Date().toISOString() },
    }
  );
}
