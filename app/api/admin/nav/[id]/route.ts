import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateNavItem, deleteNavItem } from "@/lib/nav-store";
import type { NavChild } from "@/lib/nav-store";

export const runtime = "nodejs";

async function assertAdmin() {
  const store = await cookies();
  return store.get("pixvite_role")?.value === "admin";
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await assertAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const update: Record<string, unknown> = {};

  if (typeof o.label === "string") update.label = o.label.trim();
  if (o.type === "link" || o.type === "dropdown") update.type = o.type;
  if (typeof o.href === "string") update.href = o.href.trim();
  if (typeof o.icon === "string") update.icon = o.icon.trim();
  if (typeof o.highlightColor === "string") update.highlightColor = o.highlightColor.trim();
  if (typeof o.sortOrder === "number") update.sortOrder = o.sortOrder;
  if (typeof o.isVisible === "boolean") update.isVisible = o.isVisible;

  if (Array.isArray(o.children)) {
    update.children = (o.children as Record<string, unknown>[])
      .filter((c) => typeof c.label === "string" && typeof c.href === "string")
      .map((c, i): NavChild => ({
        id: typeof c.id === "string" ? c.id : `child-${Date.now()}-${i}`,
        label: (c.label as string).trim(),
        href: (c.href as string).trim(),
        sortOrder: typeof c.sortOrder === "number" ? c.sortOrder : i + 1,
      }));
  }

  const ok = await updateNavItem(id, update as Parameters<typeof updateNavItem>[1]);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await assertAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ok = await deleteNavItem(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
