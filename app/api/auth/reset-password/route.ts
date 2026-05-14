import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, upsertUser } from "@/lib/auth-store";
import { verifyOtp } from "@/lib/otp-store";

type ResetPayload = {
  email?: string;
  otp?: string;
  newPassword?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ResetPayload;
  const email = body.email?.trim().toLowerCase() ?? "";
  const otp = body.otp?.trim() ?? "";
  const newPassword = body.newPassword ?? "";

  if (!email || !otp || !newPassword) {
    return NextResponse.json({ message: "Email, OTP, and new password are required." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ message: "Password must be at least 8 characters." }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ message: "No account found with this email." }, { status: 404 });
  }

  const valid = await verifyOtp(email, otp);
  if (!valid) {
    return NextResponse.json({ message: "Invalid or expired OTP." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await upsertUser({ ...user, passwordHash });

  return NextResponse.json({ ok: true, message: "Password reset successfully." });
}
