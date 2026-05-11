/**
 * Create or update an auth_users document with role admin and a bcrypt password.
 * Run from invitemaker-nextjs (same MongoDB as the app):
 *
 *   PowerShell:
 *     $env:MONGODB_URI="your-connection-string"; node scripts/ensure-admin.mjs admin@example.com YourSecurePass123
 *
 *   bash:
 *     MONGODB_URI="your-connection-string" node scripts/ensure-admin.mjs admin@example.com YourSecurePass123
 */

import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
const [, , emailRaw, plainPassword] = process.argv;

if (!uri || !emailRaw || !plainPassword) {
  console.error("Usage: MONGODB_URI=... node scripts/ensure-admin.mjs <email> <password>");
  process.exit(1);
}

const email = String(emailRaw).trim().toLowerCase();
if (plainPassword.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
try {
  const db = client.db();
  const users = db.collection("auth_users");

  const existing = await users.findOne({ email });
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const now = existing?.createdAt ?? new Date().toISOString();

  await users.updateOne(
    { email },
    {
      $set: {
        email,
        firstName: existing?.firstName ?? "Admin",
        lastName: existing?.lastName ?? "User",
        phone: existing?.phone && existing.phone !== "" ? existing.phone : "-",
        passwordHash,
        role: "admin",
        createdAt: now,
      },
    },
    { upsert: true }
  );

  console.log(`OK: admin login ready for ${email}`);
} finally {
  await client.close();
}
