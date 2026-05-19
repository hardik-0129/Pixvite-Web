import { NextResponse } from "next/server";
import { listNavItems } from "@/lib/nav-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await listNavItems();
    return NextResponse.json({ items: items.filter((i) => i.isVisible) });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
