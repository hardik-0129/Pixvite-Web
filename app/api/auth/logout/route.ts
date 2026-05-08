import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    ok: true,
    message: "Logged out successfully.",
  });

  const expiredDate = new Date(0);

  response.cookies.set("pixvite_auth", "", {
    path: "/",
    expires: expiredDate,
    httpOnly: true,
    sameSite: "lax",
  });
  response.cookies.set("pixvite_role", "", {
    path: "/",
    expires: expiredDate,
    httpOnly: true,
    sameSite: "lax",
  });
  response.cookies.set("pixvite_token", "", {
    path: "/",
    expires: expiredDate,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
