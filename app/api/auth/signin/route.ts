import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { AuthRole, getUserByEmail } from "@/lib/auth-store";
import { verifyOtp } from "@/lib/otp-store";

type SigninPayload = {
  email?: string;
  role?: AuthRole;
  otp?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as SigninPayload;
  const email = body.email?.trim().toLowerCase() ?? "";
  const otp = body.otp?.trim() ?? "";
  const requestedRole: AuthRole = body.role === "admin" ? "admin" : "user";

  if (!email || !otp) {
    return NextResponse.json({ message: "Email and OTP are required." }, { status: 400 });
  }

  if (!(await verifyOtp(email, otp))) {
    return NextResponse.json({ message: "Invalid OTP." }, { status: 401 });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ message: "User not found. Please sign up first." }, { status: 404 });
  }

  if (user.role !== requestedRole) {
    return NextResponse.json({ message: "Role does not match this account." }, { status: 403 });
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
