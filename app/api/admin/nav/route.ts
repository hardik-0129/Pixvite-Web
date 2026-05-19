import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { listNavItems, createNavItem } from "@/lib/nav-store";
import type { NavChild } from "@/lib/nav-store";

export const runtime = "nodejs";

async function assertAdmin() {
  const store = await cookies();
  return store.get("pixvite_role")?.value === "admin";
}

export async function GET() {
  if (!(await assertAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await listNavItems();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  if (!(await assertAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const label = typeof o.label === "string" ? o.label.trim() : "";
  const type = o.type === "link" ? "link" : "dropdown";
  const href = typeof o.href === "string" ? o.href.trim() : undefined;
  const icon = typeof o.icon === "string" ? o.icon.trim() : undefined;
  const highlightColor =
    typeof o.highlightColor === "string" ? o.highlightColor.trim() : undefined;
  const sortOrder = typeof o.sortOrder === "number" ? o.sortOrder : 99;
  const isVisible = o.isVisible !== false;

  if (!label) return NextResponse.json({ error: "label is required" }, { status: 400 });
  if (type === "link" && !href)
    return NextResponse.json({ error: "href is required for link type" }, { status: 400 });

  const children: NavChild[] = Array.isArray(o.children)
    ? (o.children as Record<string, unknown>[])
        .filter((c) => typeof c.label === "string" && typeof c.href === "string")
        .map((c, i) => ({
          id: typeof c.id === "string" ? c.id : `child-${Date.now()}-${i}`,
          label: (c.label as string).trim(),
          href: (c.href as string).trim(),
          sortOrder: typeof c.sortOrder === "number" ? c.sortOrder : i + 1,
        }))
    : [];

  const item = await createNavItem({
    label,
    type,
    href,
    icon,
    highlightColor,
    children: type === "dropdown" ? children : undefined,
    sortOrder,
    isVisible,
  });

  return NextResponse.json({ item }, { status: 201 });
}
