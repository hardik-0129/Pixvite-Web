import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getUserByEmail, updateUserProfileByEmail } from "@/lib/auth-store";

type SessionPayload = jwt.JwtPayload & {
  email?: string;
  role?: "user" | "admin";
};

async function getSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const tokenMatch = cookieHeader.match(/(?:^|;\s*)pixvite_token=([^;]+)/);
  const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : "";
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const payload = jwt.verify(token, secret, {
      issuer: "pixvite",
      audience: "pixvite-users",
    }) as SessionPayload;
    if (!payload.email || !payload.role) return null;
    return { token, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

function emailOk(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByEmail(session.email);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      memberSince: user.createdAt,
    },
  });
}

export async function PUT(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const firstName = typeof body === "object" && body && "firstName" in body ? String((body as { firstName: unknown }).firstName ?? "").trim() : "";
  const lastName = typeof body === "object" && body && "lastName" in body ? String((body as { lastName: unknown }).lastName ?? "").trim() : "";
  const nextEmail =
    typeof body === "object" && body && "email" in body
      ? String((body as { email: unknown }).email ?? "").trim().toLowerCase()
      : "";

  if (!firstName || !lastName || !nextEmail) {
    return NextResponse.json({ message: "First name, last name and email are required." }, { status: 400 });
  }
  if (!emailOk(nextEmail)) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const updated = await updateUserProfileByEmail({
      currentEmail: session.email,
      firstName,
      lastName,
      nextEmail,
    });
    if (!updated) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json({ message: "JWT_SECRET is not configured." }, { status: 500 });
    }

    const token = jwt.sign(
      {
        email: updated.email,
        role: updated.role,
        name: `${updated.firstName} ${updated.lastName}`.trim(),
      },
      secret,
      {
        expiresIn: "7d",
        issuer: "pixvite",
        audience: "pixvite-users",
      }
    );

    const response = NextResponse.json({
      ok: true,
      message: "Profile updated successfully.",
      user: {
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        memberSince: updated.createdAt,
      },
    });
    response.cookies.set("pixvite_token", token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_ALREADY_IN_USE") {
      return NextResponse.json({ message: "This email is already used by another account." }, { status: 409 });
    }
    return NextResponse.json({ message: "Could not update profile." }, { status: 500 });
  }
}
