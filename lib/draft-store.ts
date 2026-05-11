import { getDb } from "@/lib/mongodb";

const COLLECTION = "user_drafts";

type UserDraftDoc = {
  userEmail: string;
  templateId: string;
  values: Record<string, string>;
  savedAt: string;
};

export async function upsertDraft(
  userEmail: string,
  templateId: string,
  values: Record<string, string>
): Promise<void> {
  const db = await getDb();
  const savedAt = new Date().toISOString();
  await db.collection<UserDraftDoc>(COLLECTION).updateOne(
    { userEmail, templateId },
    { $set: { userEmail, templateId, values, savedAt } },
    { upsert: true }
  );
}

export async function getDraft(
  userEmail: string,
  templateId: string
): Promise<{ values: Record<string, string>; savedAt: string } | null> {
  const db = await getDb();
  const doc = await db
    .collection<UserDraftDoc>(COLLECTION)
    .findOne({ userEmail, templateId }, { projection: { values: 1, savedAt: 1, _id: 0 } });
  if (!doc) return null;
  return { values: doc.values, savedAt: doc.savedAt };
}

export async function listDrafts(
  userEmail: string
): Promise<{ templateId: string; savedAt: string }[]> {
  const db = await getDb();
  const docs = await db
    .collection<UserDraftDoc>(COLLECTION)
    .find({ userEmail }, { projection: { templateId: 1, savedAt: 1, _id: 0 } })
    .sort({ savedAt: -1 })
    .toArray();
  return docs as { templateId: string; savedAt: string }[];
}

export async function deleteDraft(userEmail: string, templateId: string): Promise<void> {
  const db = await getDb();
  await db.collection<UserDraftDoc>(COLLECTION).deleteOne({ userEmail, templateId });
}
