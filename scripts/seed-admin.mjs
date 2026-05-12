/**
 * One-time script to create the initial admin user in MongoDB.
 * Usage: node scripts/seed-admin.mjs
 *
 * Reads MONGODB_URI from .env.local automatically.
 * Edit EMAIL, PASSWORD, FIRST_NAME, LAST_NAME below before running.
 */

import { MongoClient } from "mongodb";
import { createHash, randomBytes, pbkdf2Sync } from "crypto";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ─── Config ───────────────────────────────────────────────────────────────────
const EMAIL = "admin@pixvite.com";       // change this
const PASSWORD = "Admin@123";            // change this
const FIRST_NAME = "Admin";
const LAST_NAME = "User";
// ──────────────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
function loadEnv() {
  try {
    const envPath = resolve(__dirname, "../.env.local");
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // ignore missing .env.local
  }
}

// Simple bcrypt-compatible hash using Node's built-in crypto
// We use bcryptjs-compatible output by shelling out — but since we can't
// require bcryptjs in a standalone script easily, we'll use a workaround:
// Import bcryptjs via dynamic import (it's already installed in the project).
async function hashPassword(password) {
  const bcrypt = await import("bcryptjs");
  return bcrypt.default.hash(password, 12);
}

async function main() {
  loadEnv();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found. Make sure .env.local exists.");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db(); // uses the database in the URI
  const users = db.collection("auth_users");

  const email = EMAIL.trim().toLowerCase();
  const existing = await users.findOne({ email });

  if (existing) {
    if (existing.role === "admin") {
      console.log(`Admin user "${email}" already exists. Nothing to do.`);
    } else {
      await users.updateOne({ email }, { $set: { role: "admin" } });
      console.log(`Updated existing user "${email}" role to admin.`);
    }
    await client.close();
    return;
  }

  const passwordHash = await hashPassword(PASSWORD);

  await users.insertOne({
    firstName: FIRST_NAME,
    lastName: LAST_NAME,
    email,
    phone: "",
    passwordHash,
    role: "admin",
    createdAt: new Date().toISOString(),
  });

  console.log(`Admin user "${email}" created successfully.`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
