import { getDb } from "@/lib/mongodb";

export type TemplateOrderStatus = "pending_payment" | "paid";
export type RenderStatus = "pending" | "processing" | "done" | "error";

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
  fieldValuesAtPayment?: Record<string, string>;
  customAudioUrl?: string;
  renderStatus?: RenderStatus;
  renderJobId?: string;
  renderError?: string;
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

export async function getTemplateOrdersByEmail(email: string): Promise<TemplateOrderDoc[]> {
  const db = await getDb();
  return db
    .collection<TemplateOrderDoc>(COLLECTION)
    .find({ email, status: "paid" })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getOrderById(razorpayOrderId: string): Promise<TemplateOrderDoc | null> {
  const db = await getDb();
  return db.collection<TemplateOrderDoc>(COLLECTION).findOne({ razorpayOrderId }) as Promise<TemplateOrderDoc | null>;
}

export async function getOrderByTemplateAndEmail(
  templateId: string,
  email: string
): Promise<TemplateOrderDoc | null> {
  const db = await getDb();
  return db
    .collection<TemplateOrderDoc>(COLLECTION)
    .findOne({ templateId, email, status: "paid" }, { sort: { createdAt: -1 } }) as Promise<TemplateOrderDoc | null>;
}

export async function updateOrderRenderJob(
  razorpayOrderId: string,
  renderJobId: string,
  renderStatus: RenderStatus
): Promise<void> {
  const db = await getDb();
  await db
    .collection<TemplateOrderDoc>(COLLECTION)
    .updateOne({ razorpayOrderId }, { $set: { renderJobId, renderStatus } });
}

export async function markOrderRenderDone(razorpayOrderId: string): Promise<void> {
  const db = await getDb();
  await db
    .collection<TemplateOrderDoc>(COLLECTION)
    .updateOne({ razorpayOrderId }, { $set: { renderStatus: "done" as RenderStatus } });
}

export async function markOrderRenderError(razorpayOrderId: string, renderError: string): Promise<void> {
  const db = await getDb();
  await db
    .collection<TemplateOrderDoc>(COLLECTION)
    .updateOne({ razorpayOrderId }, { $set: { renderStatus: "error" as RenderStatus, renderError } });
}
