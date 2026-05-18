import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getDb } from "@/lib/mongodb";

type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ContactPayload;
  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const subject = body.subject?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ ok: false, message: "All fields are required." }, { status: 400 });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT ?? 587);
  const smtpSecure = smtpPort === 465 ? true : process.env.SMTP_SECURE === "true";
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;
  // Contact messages go to the business inbox
  const contactTo = process.env.CONTACT_TO_EMAIL || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    console.error("[contact] SMTP env vars missing");
    return NextResponse.json({ ok: false, message: "Mail service not configured." }, { status: 500 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { type: "login", user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
    });

    // Email to business — contains the user's message
    await transporter.sendMail({
      from: smtpFrom,
      to: contactTo,
      replyTo: `"${name}" <${email}>`,
      subject: `[Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `
        <table style="font-family:sans-serif;font-size:14px;color:#222;max-width:600px">
          <tr><td style="padding:8px 0"><strong>Name:</strong> ${name}</td></tr>
          <tr><td style="padding:8px 0"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px 0"><strong>Subject:</strong> ${subject}</td></tr>
          <tr><td style="padding:16px 0;border-top:1px solid #eee;white-space:pre-wrap">${message.replace(/</g, "&lt;")}</td></tr>
        </table>`,
    });

    // Auto-reply to the user
    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: "We received your message — Pixvite",
      text: `Hi ${name},\n\nThanks for reaching out! We've received your message and will get back to you soon.\n\nYour message:\n${message}\n\n— Pixvite Team`,
      html: `
        <div style="font-family:sans-serif;font-size:14px;color:#222;max-width:600px">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Thanks for reaching out! We've received your message and will get back to you as soon as possible.</p>
          <blockquote style="border-left:3px solid #e85025;margin:16px 0;padding:8px 16px;color:#555;white-space:pre-wrap">${message.replace(/</g, "&lt;")}</blockquote>
          <p style="color:#888;font-size:12px">— Pixvite Team</p>
        </div>`,
    });

    console.log(`[contact] message from ${email} sent to ${contactTo}`);

    // Save to MongoDB regardless of email success
    try {
      const db = await getDb();
      await db.collection("contact_inquiries").insertOne({
        name,
        email,
        subject,
        message,
        status: "open",
        createdAt: new Date(),
      });
    } catch (dbErr) {
      console.error("[contact] DB save error:", dbErr);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error("[contact] SMTP error:", reason);
    return NextResponse.json({ ok: false, message: "Failed to send message. Please try again." }, { status: 500 });
  }
}
