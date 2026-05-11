import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { AuthRole, upsertUser } from "@/lib/auth-store";
import { verifyOtp } from "@/lib/otp-store";

type SignupPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: AuthRole;
  otp?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as SignupPayload;

  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const phone = body.phone?.trim() ?? "";
  const password = body.password ?? "";
  const otp = body.otp?.trim() ?? "";
  const role: AuthRole = body.role === "admin" ? "admin" : "user";

  if (!firstName || !lastName || !email || !password || !otp) {
    return NextResponse.json({ message: "First name, last name, email, password and OTP are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ message: "Password must be at least 8 characters." }, { status: 400 });
  }

  if (!(await verifyOtp(email, otp))) {
    return NextResponse.json({ message: "Invalid OTP." }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const normalizedPhone = phone || "-";
  const user = await upsertUser({ firstName, lastName, email, phone: normalizedPhone, passwordHash, role });

  const response = NextResponse.json({
    ok: true,
    message: "Sign up successful.",
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
  response.cookies.set("pixvite_role", role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    httpOnly: true,
  });

  return response;
}
