import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { issueOtp } from "@/lib/otp-store";

type SendOtpPayload = {
  email?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as SendOtpPayload;
  const email = body.email?.trim().toLowerCase() ?? "";

  if (!email) {
    return NextResponse.json({ message: "Email is required." }, { status: 400 });
  }

  const otp = await issueOtp(email);
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT ?? 587);
  const smtpSecure = process.env.SMTP_SECURE === "true";
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({
        ok: true,
        message: "SMTP not configured in development. Using dev OTP.",
        devOtp: otp,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        message: "SMTP is not configured. Please set SMTP_* values in .env.",
      },
      { status: 500 }
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: "Your Pixvite OTP Code",
      text: `Your Pixvite OTP is ${otp}. It is valid for one-time verification.`,
      html: `<p>Your Pixvite OTP is <strong>${otp}</strong>.</p><p>Use this code to complete your verification.</p>`,
    });

    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({
        ok: true,
        message: "OTP Send Successfully.",
        debug: {
          accepted: info.accepted,
          rejected: info.rejected,
          response: info.response,
          messageId: info.messageId,
        },
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const reason = error instanceof Error ? error.message : "Unknown SMTP error";
      return NextResponse.json(
        {
          ok: false,
          message: "Failed to send OTP email.",
          debug: { reason },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to send OTP email. Check SMTP credentials/provider rules.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "OTP sent successfully to your email.",
  });
}
