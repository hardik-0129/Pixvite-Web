import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type ReviewDoc = {
  _id?: ObjectId;
  templateId: string;
  name: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  createdAt: string;
};

export type ReviewStats = {
  average: number;
  total: number;
  distribution: { stars: number; count: number; percent: number }[];
};

export type PublicReview = {
  id: string;
  templateId: string;
  name: string;
  rating: number;
  text: string;
  createdAt: string;
};

const REVIEWS_COLLECTION = "reviews";

export async function addReview(data: {
  templateId: string;
  name: string;
  rating: number;
  text: string;
}): Promise<void> {
  const db = await getDb();
  const doc: Omit<ReviewDoc, "_id"> = {
    templateId: data.templateId,
    name: data.name.trim(),
    rating: data.rating,
    text: data.text.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await db.collection<Omit<ReviewDoc, "_id">>(REVIEWS_COLLECTION).insertOne(doc);
}

export async function listApprovedReviews(templateId: string): Promise<PublicReview[]> {
  const db = await getDb();
  const docs = await db
    .collection<ReviewDoc>(REVIEWS_COLLECTION)
    .find({ templateId, status: "approved" })
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((d) => ({
    id: d._id!.toString(),
    templateId: d.templateId,
    name: d.name,
    rating: d.rating,
    text: d.text,
    createdAt: d.createdAt,
  }));
}

export async function getReviewStats(templateId: string): Promise<ReviewStats> {
  const db = await getDb();
  const approved = await db
    .collection<ReviewDoc>(REVIEWS_COLLECTION)
    .find({ templateId, status: "approved" })
    .toArray();

  const total = approved.length;

  if (total === 0) {
    return {
      average: 0,
      total: 0,
      distribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0, percent: 0 })),
    };
  }

  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  for (const r of approved) {
    const rating = Math.max(1, Math.min(5, Math.round(r.rating)));
    counts[rating]++;
    sum += rating;
  }

  const average = Math.round((sum / total) * 10) / 10;
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars],
    percent: Math.round((counts[stars] / total) * 100),
  }));

  return { average, total, distribution };
}
