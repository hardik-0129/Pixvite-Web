import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUserByEmail, upsertUser } from "@/lib/auth-store";

export const runtime = "nodejs";

type AutoRegisterPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
};

export async function POST(request: Request) {
  let body: AutoRegisterPayload;
  try {
    body = (await request.json()) as AutoRegisterPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const phone = body.phone?.trim() ?? "";
  const password = body.password ?? "";

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json(
      { error: "First name, last name, email, and password are required." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      {
        error: "EMAIL_ALREADY_REGISTERED",
        message:
          "This email is already registered. Please login first or use a different email.",
      },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await upsertUser({
    firstName,
    lastName,
    email,
    phone: phone || "-",
    passwordHash,
    role: "user",
  });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return NextResponse.json({ error: "JWT_SECRET is not configured." }, { status: 500 });
  }

  const token = jwt.sign(
    {
      email: user.email,
      role: user.role,
      name: `${user.firstName} ${user.lastName}`.trim(),
    },
    jwtSecret,
    { expiresIn: "7d", issuer: "pixvite", audience: "pixvite-users" }
  );

  const response = NextResponse.json({
    ok: true,
    token,
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  });

  response.cookies.set("pixvite_auth", "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    httpOnly: true,
  });
  response.cookies.set("pixvite_role", user.role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    httpOnly: true,
  });
  response.cookies.set("pixvite_token", token, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
