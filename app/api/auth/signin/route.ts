import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AuthRole, getUserByEmail } from "@/lib/auth-store";

type SigninPayload = {
  email?: string;
  role?: AuthRole;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as SigninPayload;
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const requestedRole: AuthRole = body.role === "admin" ? "admin" : "user";

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ message: "User not found. Please sign up first." }, { status: 404 });
  }

  if (user.role !== requestedRole) {
    return NextResponse.json({ message: "Role does not match this account." }, { status: 403 });
  }

  if (!user.passwordHash) {
    return NextResponse.json({ message: "Password is not set for this account." }, { status: 401 });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return NextResponse.json({ message: "JWT_SECRET is not configured." }, { status: 500 });
  }

  const token = jwt.sign(
    {
      email: user.email,
      role: user.role,
      name: `${user.firstName} ${user.lastName}`.trim(),
    },
    jwtSecret,
    {
      expiresIn: "7d",
      issuer: "pixvite",
      audience: "pixvite-users",
    }
  );

  const response = NextResponse.json({
    ok: true,
    message: "Sign in successful.",
    token,
    // user: {
    //   firstName: user.firstName,
    //   lastName: user.lastName,
    //   email: user.email,
    //   role: user.role,
    // },
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
