import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

type TokenPayload = {
  email: string;
  role: string;
  name: string;
};

export async function getAuthenticatedEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("pixvite_token")?.value;
  if (!token) return null;

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return null;

  try {
    const payload = jwt.verify(token, jwtSecret, {
      issuer: "pixvite",
      audience: "pixvite-users",
    }) as TokenPayload;
    return payload.email?.trim().toLowerCase() || null;
  } catch {
    return null;
  }
}
