import { getDb } from "@/lib/mongodb";

export type AuthRole = "user" | "admin";

export type AuthUser = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: AuthRole;
  createdAt: string;
};

export async function upsertUser(user: Omit<AuthUser, "createdAt">) {
  const normalizedEmail = user.email.trim().toLowerCase();
  const db = await getDb();
  const users = db.collection<AuthUser>("auth_users");
  const existing = await users.findOne({ email: normalizedEmail });
  const nextUser: AuthUser = {
    ...user,
    email: normalizedEmail,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  await users.updateOne({ email: normalizedEmail }, { $set: nextUser }, { upsert: true });
  return nextUser;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  const users = db.collection<AuthUser>("auth_users");
  return users.findOne({ email: email.trim().toLowerCase() });
}

export async function updateUserProfileByEmail(input: {
  currentEmail: string;
  firstName: string;
  lastName: string;
  nextEmail: string;
}) {
  const db = await getDb();
  const users = db.collection<AuthUser>("auth_users");

  const currentEmail = input.currentEmail.trim().toLowerCase();
  const nextEmail = input.nextEmail.trim().toLowerCase();
  const existing = await users.findOne({ email: currentEmail });
  if (!existing) return null;

  const updated: AuthUser = {
    ...existing,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: nextEmail,
  };

  if (currentEmail === nextEmail) {
    await users.updateOne({ email: currentEmail }, { $set: updated });
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
