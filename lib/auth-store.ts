import { getDb } from "@/lib/mongodb";

export type AuthRole = "user" | "admin";

export type AuthUser = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passwordHash?: string;
  role: AuthRole;
  createdAt: string;
  photoUrl?: string;
};

export async function upsertUser(user: Omit<AuthUser, "createdAt">) {
  const normalizedEmail = user.email.trim().toLowerCase();
  const db = await getDb();
  const users = db.collection<AuthUser>("auth_users");
  const existing = await users.findOne({ email: normalizedEmail });
  const nextUser: AuthUser = {
    ...user,
    email: normalizedEmail,
    // Preserve existing phone if the incoming value is empty/placeholder
    phone: (user.phone && user.phone !== "-") ? user.phone : (existing?.phone ?? "-"),
    // Preserve existing passwordHash if caller didn't supply one (e.g. Google auth)
    passwordHash: user.passwordHash ?? existing?.passwordHash,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  // Exclude _id from $set — MongoDB treats _id as immutable
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...fields } = nextUser as typeof nextUser & { _id?: unknown };
  await users.updateOne({ email: normalizedEmail }, { $set: fields }, { upsert: true });
  return nextUser;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  const users = db.collection<AuthUser>("auth_users");
  return users.findOne({ email: email.trim().toLowerCase() });
}

export async function deleteUserAndDataByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = await getDb();
  await db.collection("auth_users").deleteOne({ email: normalizedEmail });
  await db.collection("template_orders").deleteMany({ email: normalizedEmail });
  await db.collection("user_drafts").deleteMany({ userEmail: normalizedEmail });
}

export async function updateUserPhotoByEmail(email: string, photoUrl: string | null) {
  const db = await getDb();
  const users = db.collection<AuthUser>("auth_users");
  const normalizedEmail = email.trim().toLowerCase();
  const update = photoUrl
    ? { $set: { photoUrl } }
    : { $unset: { photoUrl: "" as const } };
  const result = await users.updateOne({ email: normalizedEmail }, update);
  return result.matchedCount > 0;
}

export async function updateUserProfileByEmail(input: {
  currentEmail: string;
  firstName: string;
  lastName: string;
  phone?: string;
  nextEmail?: string;
}) {
  const db = await getDb();
  const users = db.collection<AuthUser>("auth_users");

  const currentEmail = input.currentEmail.trim().toLowerCase();
  const nextEmail = (input.nextEmail ?? currentEmail).trim().toLowerCase();
  const existing = await users.findOne({ email: currentEmail });
  if (!existing) return null;

  const updated: AuthUser = {
    ...existing,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: nextEmail,
    ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
  };

  if (currentEmail === nextEmail) {
    // Exclude _id from $set — MongoDB treats _id as immutable
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...fields } = updated as typeof updated & { _id?: unknown };
    await users.updateOne({ email: currentEmail }, { $set: fields });
    return updated;
  }

  const clash = await users.findOne({ email: nextEmail });
  if (clash) {
    throw new Error("EMAIL_ALREADY_IN_USE");
  }

  await users.insertOne(updated);
  await users.deleteOne({ email: currentEmail });
  return updated;
}
