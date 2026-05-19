"use client";

import { useCallback, useEffect, useId, useReducer, useRef, useState } from "react";
import type { NavChild, NavItemDoc } from "@/lib/nav-store";

// ─── helpers ────────────────────────────────────────────────────────────────

function uid() {
  return `child-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── small UI pieces ─────────────────────────────────────────────────────────

function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: "gray" | "orange" | "blue" }) {
  const cls = {
    gray: "bg-gray-100 text-gray-600",
    orange: "bg-orange-100 text-orange-700",
    blue: "bg-blue-100 text-blue-700",
  }[color];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${checked ? "bg-orange-500" : "bg-gray-300"}`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
}

// ─── child row editor ────────────────────────────────────────────────────────

function ChildRow({
  child,
  onUpdate,
  onDelete,
}: {
  child: NavChild;
  onUpdate: (c: NavChild) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(child.label);
  const [href, setHref] = useState(child.href);

  function commit() {
    if (label.trim() && href.trim()) onUpdate({ ...child, label: label.trim(), href: href.trim() });
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2">
      <input
        className="min-w-0 flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={commit}
        placeholder="Label"
      />
      <input
        className="min-w-0 flex-[2] rounded border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
        value={href}
        onChange={(e) => setHref(e.target.value)}
        onBlur={commit}
        placeholder="Link URL e.g. /category?category=Wedding"
      />
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 text-red-400 hover:text-red-600"
        title="Remove"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── item card ───────────────────────────────────────────────────────────────

function NavItemCard({
  item,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  item: NavItemDoc;
  onSave: (updated: NavItemDoc) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  // editable fields
  const [label, setLabel] = useState(item.label);
  const [type, setType] = useState<"dropdown" | "link">(item.type);
  const [href, setHref] = useState(item.href ?? "");
  const [icon, setIcon] = useState(item.icon ?? "");
  const [highlightColor, setHighlightColor] = useState(item.highlightColor ?? "");
  const [isVisible, setIsVisible] = useState(item.isVisible);
  const [children, setChildren] = useState<NavChild[]>(item.children ?? []);

  const [saving, setSaving] = useState(false);

  function resetEdit() {
    setLabel(item.label);
    setType(item.type);
    setHref(item.href ?? "");
    setIcon(item.icon ?? "");
    setHighlightColor(item.highlightColor ?? "");
    setIsVisible(item.isVisible);
    setChildren(item.children ?? []);
    setEditing(false);
  }

  async function save() {
    setSaving(true);
    const updated: NavItemDoc = {
      ...item,
      label,
      type,
      href: type === "link" ? href : undefined,
      icon: icon || undefined,
      highlightColor: highlightColor || undefined,
      isVisible,
      children: type === "dropdown" ? children : undefined,
    };
    await onSave(updated);
    setSaving(false);
    setEditing(false);
  }

  function addChild() {
    setChildren((prev) => [
      ...prev,
      { id: uid(), label: "", href: "", sortOrder: prev.length + 1 },
    ]);
  }

  function updateChild(id: string, c: NavChild) {
    setChildren((prev) => prev.map((ch) => (ch.id === id ? c : ch)));
  }

  function removeChild(id: string) {
    setChildren((prev) => prev.filter((ch) => ch.id !== id));
  }

  return (
    <div className={`rounded-xl border bg-white shadow-sm transition-all ${editing ? "border-orange-300 ring-1 ring-orange-200" : "border-gray-200"}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Reorder */}
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            disabled={isFirst}
            onClick={onMoveUp}
            className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={onMoveDown}
            className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Label */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {item.icon ? <span className="text-base">{item.icon}</span> : null}
          <span
            className="truncate text-sm font-semibold text-gray-900"
            style={item.highlightColor ? { color: item.highlightColor } : undefined}
          >
            {item.label}
          </span>
          <Badge color={item.type === "dropdown" ? "blue" : "orange"}>
            {item.type}
          </Badge>
          {item.type === "link" && item.href ? (
            <span className="truncate text-xs text-gray-400">{item.href}</span>
          ) : null}
        </div>

        {/* Visible toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">{item.isVisible ? "Visible" : "Hidden"}</span>
          <Toggle
            checked={item.isVisible}
            onChange={async (v) => {
              await onSave({ ...item, isVisible: v });
            }}
          />
        </div>

        {/* Expand (dropdown only) */}
        {item.type === "dropdown" ? (
          <button
            type="button"
            onClick={() => setExpanded((x) => !x)}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            {expanded ? "Hide" : `Children (${(item.children ?? []).length})`}
          </button>
        ) : null}

        {/* Edit */}
        <button
          type="button"
          onClick={() => { setEditing((x) => !x); setExpanded(true); }}
          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Edit
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => { if (confirm(`Delete "${item.label}"?`)) onDelete(); }}
          className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      {/* Edit form */}
      {editing ? (
        <div className="border-t border-gray-100 bg-orange-50/30 px-4 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Label</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Wedding"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Type</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={type}
                onChange={(e) => setType(e.target.value as "dropdown" | "link")}
              >
                <option value="dropdown">Dropdown (with children)</option>
                <option value="link">Direct Link</option>
              </select>
            </div>
            {type === "link" ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Link URL</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={href}
                  onChange={(e) => setHref(e.target.value)}
                  placeholder="e.g. /about-us"
                />
              </div>
            ) : null}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Icon (emoji, optional)</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g. 🎉"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Highlight color (optional)</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={highlightColor}
                onChange={(e) => setHighlightColor(e.target.value)}
                placeholder="e.g. #e85025"
              />
            </div>
            <div className="flex items-center gap-2 self-end">
              <Toggle checked={isVisible} onChange={setIsVisible} />
              <span className="text-sm text-gray-700">{isVisible ? "Visible" : "Hidden"}</span>
            </div>
          </div>

          {/* Children editor */}
          {type === "dropdown" ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Dropdown Children</span>
                <button
                  type="button"
                  onClick={addChild}
                  className="flex items-center gap-1 rounded-lg bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-orange-600"
                >
                  + Add Child
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {children.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No children yet. Add one below.</p>
                ) : null}
                {children.map((ch) => (
                  <ChildRow
                    key={ch.id}
                    child={ch}
                    onUpdate={(c) => updateChild(ch.id, c)}
                    onDelete={() => removeChild(ch.id)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={resetEdit}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {/* Children preview (collapsed) */}
      {!editing && expanded && item.type === "dropdown" ? (
        <div className="border-t border-gray-100 px-4 py-3">
          {(item.children ?? []).length === 0 ? (
            <p className="text-xs text-gray-400 italic">No children — click Edit to add some.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {(item.children ?? []).map((ch) => (
                <li key={ch.id} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="text-gray-400">↳</span>
                  <span className="font-medium">{ch.label}</span>
                  <span className="text-gray-400">→</span>
                  <span className="truncate text-gray-500">{ch.href}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ─── Add item form ───────────────────────────────────────────────────────────

function AddItemForm({ onAdd }: { onAdd: (item: Omit<NavItemDoc, "_id" | "createdAt" | "sortOrder">) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"dropdown" | "link">("link");
  const [href, setHref] = useState("");
  const [icon, setIcon] = useState("");
  const [highlightColor, setHighlightColor] = useState("");
  const [children, setChildren] = useState<NavChild[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function addChild() {
    setChildren((prev) => [...prev, { id: uid(), label: "", href: "", sortOrder: prev.length + 1 }]);
  }

  function reset() {
    setLabel(""); setType("link"); setHref(""); setIcon(""); setHighlightColor("");
    setChildren([]); setErr(""); setOpen(false);
  }

  async function submit() {
    setErr("");
    if (!label.trim()) { setErr("Label is required."); return; }
    if (type === "link" && !href.trim()) { setErr("Link URL is required."); return; }
    setSaving(true);
    try {
      await onAdd({
        label: label.trim(),
        type,
        href: type === "link" ? href.trim() : undefined,
        icon: icon.trim() || undefined,
        highlightColor: highlightColor.trim() || undefined,
        children: type === "dropdown" ? children.filter((c) => c.label && c.href) : undefined,
        isVisible: true,
      });
      reset();
    } catch {
      setErr("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border-2 border-dashed border-orange-300 px-5 py-3 text-sm font-semibold text-orange-600 transition hover:border-orange-400 hover:bg-orange-50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Nav Item
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-orange-300 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-gray-900">New Nav Item</h3>
      {err ? <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Label *</label>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Wedding, About Us"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Type *</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={type}
            onChange={(e) => setType(e.target.value as "dropdown" | "link")}
          >
            <option value="link">Direct Link (no dropdown)</option>
            <option value="dropdown">Dropdown (with children)</option>
          </select>
        </div>
        {type === "link" ? (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Link URL *</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="e.g. /about-us or /contact"
            />
          </div>
        ) : null}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Icon emoji (optional)</label>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="e.g. 🎉"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Highlight color (optional)</label>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={highlightColor}
            onChange={(e) => setHighlightColor(e.target.value)}
            placeholder="e.g. #e85025"
          />
        </div>
      </div>

      {type === "dropdown" ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">Dropdown Children</span>
            <button
              type="button"
              onClick={addChild}
              className="flex items-center gap-1 rounded-lg bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-orange-600"
            >
              + Add Child
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {children.map((ch) => (
              <ChildRow
                key={ch.id}
                child={ch}
                onUpdate={(c) => setChildren((prev) => prev.map((x) => (x.id === ch.id ? c : x)))}
                onDelete={() => setChildren((prev) => prev.filter((x) => x.id !== ch.id))}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={submit}
          className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add Item"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function NavigationAdminPage() {
  const [items, setItems] = useState<NavItemDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 2500);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/nav");
      const data = (await res.json()) as { items?: NavItemDoc[] };
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleSave(updated: NavItemDoc) {
    const res = await fetch(`/api/admin/nav/${updated._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
      showToast("Saved");
    } else {
      showToast("Save failed");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/nav/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i._id !== id));
      showToast("Deleted");
    }
  }

  async function handleAdd(item: Omit<NavItemDoc, "_id" | "createdAt" | "sortOrder">) {
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.sortOrder)) + 1 : 1;
    const res = await fetch("/api/admin/nav", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, sortOrder: nextOrder }),
    });
    if (res.ok) {
      await load();
      showToast("Added");
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const next = [...items];
    const swap = index + direction;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    // reassign sortOrder
    const updated = next.map((item, i) => ({ ...item, sortOrder: i + 1 }));
    setItems(updated);
    // persist all changed orders
    await Promise.all(
      updated
        .filter((item, i) => item.sortOrder !== items[i]?.sortOrder)
        .map((item) =>
          fetch(`/api/admin/nav/${item._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: item.sortOrder }),
          })
        )
    );
    showToast("Reordered");
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Toast */}
      {toast ? (
        <div className="fixed right-6 top-6 z-50 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Navigation Manager</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage the navbar items shown on the website. Changes apply on next page load.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
        >
          Refresh
        </button>
      </div>

      {/* Add form */}
      <div className="mb-4">
        <AddItemForm onAdd={handleAdd} />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
          No nav items yet. Add one above.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item, idx) => (
            <NavItemCard
              key={item._id}
              item={item}
              onSave={handleSave}
              onDelete={() => void handleDelete(item._id!)}
              onMoveUp={() => void handleMove(idx, -1)}
              onMoveDown={() => void handleMove(idx, 1)}
              isFirst={idx === 0}
              isLast={idx === items.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
