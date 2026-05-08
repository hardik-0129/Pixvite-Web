import { getDb } from "@/lib/mongodb";

export type TemplateOrderStatus = "pending_payment" | "paid";

export type TemplateOrderDoc = {
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: TemplateOrderStatus;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  coupon: string | null;
  templateId: string;
  templateTitle: string;
  currency: string;
  subtotalInr: number;
  discountInr: number;
  totalInr: number;
  receipt: string;
  createdAt: string;
  paidAt?: string;
};

const COLLECTION = "template_orders";

let indexesEnsured = false;

async function ensureIndexes() {
  if (indexesEnsured) return;
  const db = await getDb();
  const c = db.collection(COLLECTION);
  await c.createIndex({ razorpayOrderId: 1 }, { unique: true });
  await c.createIndex({ createdAt: -1 });
  indexesEnsured = true;
}

export async function insertPendingTemplateOrder(
  doc: Omit<TemplateOrderDoc, "status" | "paidAt" | "razorpayPaymentId">
): Promise<void> {
  await ensureIndexes();
  const db = await getDb();
  const row: TemplateOrderDoc = { ...doc, status: "pending_payment" };
  await db.collection<TemplateOrderDoc>(COLLECTION).insertOne(row);
}

/**
 * Marks an order paid only if it was still `pending_payment` (webhook + client verify safe).
 * @returns true if this call transitioned the order to paid (first fulfillment).
 */
export async function markTemplateOrderPaidIfPending(
  razorpayOrderId: string,
  razorpayPaymentId: string
): Promise<boolean> {
  const db = await getDb();
  const r = await db.collection<TemplateOrderDoc>(COLLECTION).updateOne(
    { razorpayOrderId, status: "pending_payment" },
    {
      $set: {
        status: "paid" as const,
        razorpayPaymentId,
        paidAt: new Date().toISOString(),
      },
    }
  );
  return r.modifiedCount === 1;
}

export async function getTemplateOrderCouponRaw(razorpayOrderId: string): Promise<string | null> {
  const db = await getDb();
  const doc = await db.collection<TemplateOrderDoc>(COLLECTION).findOne(
    { razorpayOrderId },
    { projection: { coupon: 1 } }
  );
  const c = doc?.coupon;
  return typeof c === "string" && c.trim() ? c.trim() : null;
}
