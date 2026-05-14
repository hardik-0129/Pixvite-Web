import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { upsertUser } from "@/lib/auth-store";

type GoogleTokenInfo = {
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  aud?: string;
  email_verified?: string;
  picture?: string;
  error_description?: string;
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const credential =
    typeof body === "object" && body !== null && "credential" in body
      ? String((body as { credential: unknown }).credential ?? "").trim()
      : "";

  if (!credential) {
    return NextResponse.json({ message: "No Google credential provided." }, { status: 400 });
  }

  // Verify token using Google's tokeninfo endpoint (no extra library needed)
  let tokenData: GoogleTokenInfo;
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    tokenData = (await res.json()) as GoogleTokenInfo;
    if (!res.ok || tokenData.error_description) {
      return NextResponse.json(
        { message: tokenData.error_description ?? "Invalid Google token." },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json({ message: "Could not verify Google token." }, { status: 502 });
  }

  // Verify the token was issued for this app
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (clientId && tokenData.aud !== clientId) {
    return NextResponse.json({ message: "Token audience mismatch." }, { status: 401 });
  }

  if (!tokenData.email) {
    return NextResponse.json({ message: "No email in Google token." }, { status: 400 });
  }

  if (tokenData.email_verified !== "true") {
    return NextResponse.json({ message: "Google email is not verified." }, { status: 400 });
  }

  const firstName = tokenData.given_name ?? tokenData.name?.split(" ")[0] ?? "Google";
  const lastName =
    tokenData.family_name ?? tokenData.name?.split(" ").slice(1).join(" ") ?? "User";

  // Create the user if they don't exist, or update name if they do
  const user = await upsertUser({
    firstName,
    lastName,
    email: tokenData.email,
    phone: "",
    role: "user",
  });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return NextResponse.json({ message: "JWT_SECRET not configured." }, { status: 500 });
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

  const response = NextResponse.json({ ok: true, message: "Signed in with Google.", token });

  const cookieOpts = {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax" as const,
    httpOnly: true,
  };

  response.cookies.set("pixvite_auth", "1", cookieOpts);
  response.cookies.set("pixvite_role", user.role, cookieOpts);
  response.cookies.set("pixvite_token", token, {
    ...cookieOpts,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
