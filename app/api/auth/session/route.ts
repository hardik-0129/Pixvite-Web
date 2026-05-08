import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("pixvite_auth")?.value === "1";
  const role = cookieStore.get("pixvite_role")?.value ?? null;

  return NextResponse.json({
    ok: true,
    isAuthenticated,
    role,
  });
}
