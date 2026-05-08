"use client";

import type { ReactNode } from "react";
import { TEMPLATE_SIDEBAR_CATEGORIES } from "@/lib/templates";

type PriceFilter = "all" | "low" | "mid";
type DurationFilter = "all" | "short" | "long";

type Props = {
  category: string | null;
  subcategory: string | null;
  search: string;
  priceFilter: PriceFilter;
  durationFilter: DurationFilter;
  activeTags: { label: string; type: "category" | "subcategory" }[];
  onCategory: (cat: string | null, sub: string | null) => void;
  onSearch: (q: string) => void;
  onPrice: (p: PriceFilter) => void;
  onDuration: (d: DurationFilter) => void;
  onClearAll: () => void;
};

function FilterCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)]/60 bg-[var(--card)]/80 p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function FunnelIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function TemplateSidebar({
  category,
  subcategory,
  search,
  priceFilter,
  durationFilter,
  activeTags,
  onCategory,
  onSearch,
  onPrice,
  onDuration,
  onClearAll,
}: Props) {
  const accent = "var(--accent)";

  const priceBtn = (active: boolean) =>
    `w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
      active
        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm"
        : "border-[var(--border)]/60 bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]/50"
    }`;

  return (
    <aside className="w-full shrink-0 lg:w-72 lg:pr-6">
      <div className="mb-6 hidden lg:block">
        <div className="mb-2 flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="font-heading text-xl font-bold text-[var(--foreground)]">Filters</h2>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="mt-1 text-xs font-medium transition hover:opacity-80"
          style={{ color: accent }}
        >
          Clear all filters
        </button>
      </div>

      <div className="space-y-4">
        <div className="lg:hidden">
          <button
            type="button"
            onClick={onClearAll}
            className="w-full rounded-lg border border-[var(--accent)]/30 px-4 py-2 text-sm font-medium transition hover:bg-[var(--accent)]/5"
            style={{ color: accent }}
          >
            Clear all filters
          </button>
        </div>

        <FilterCard className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-800">Active Filters</p>
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-medium transition hover:opacity-80"
              style={{ color: accent }}
            >
              Clear all
            </button>
          </div>
          <div className="flex min-h-[2rem] flex-wrap gap-2">
            {activeTags.length === 0 &&
              priceFilter === "all" &&
              durationFilter === "all" &&
              !search.trim() && (
                <span className="text-xs text-[var(--muted-foreground)]">None applied</span>
              )}
            {activeTags.map((t) => (
              <div
                key={t.label + t.type}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-2 text-xs font-semibold"
                style={{ color: accent }}
              >
                <span>{t.label}</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 transition hover:bg-[var(--accent)]/10"
                  aria-label={`Remove ${t.label}`}
                  onClick={() => {
                    if (t.type === "category") onCategory(null, null);
                    if (t.type === "subcategory") onCategory(category, null);
                  }}
                >
                  <XIcon />
                </button>
              </div>
            ))}
            {priceFilter === "low" && (
              <div
                className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-2 text-xs font-semibold"
                style={{ color: accent }}
              >
                <span>₹0 – ₹299</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 transition hover:bg-[var(--accent)]/10"
                  aria-label="Remove price filter"
                  onClick={() => onPrice("all")}
                >
                  <XIcon />
                </button>
              </div>
            )}
            {priceFilter === "mid" && (
              <div
                className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-2 text-xs font-semibold"
                style={{ color: accent }}
              >
                <span>₹299 – ₹499</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 transition hover:bg-[var(--accent)]/10"
                  aria-label="Remove price filter"
                  onClick={() => onPrice("all")}
                >
                  <XIcon />
                </button>
              </div>
            )}
            {durationFilter === "short" && (
              <div
                className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-2 text-xs font-semibold"
                style={{ color: accent }}
              >
                <span>0 – 29 Seconds</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 transition hover:bg-[var(--accent)]/10"
                  aria-label="Remove duration filter"
                  onClick={() => onDuration("all")}
                >
                  <XIcon />
                </button>
              </div>
            )}
            {durationFilter === "long" && (
              <div
                className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-2 text-xs font-semibold"
                style={{ color: accent }}
              >
                <span>30 – 50 Seconds</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 transition hover:bg-[var(--accent)]/10"
                  aria-label="Remove duration filter"
                  onClick={() => onDuration("all")}
                >
                  <XIcon />
                </button>
              </div>
            )}
            {search.trim() && (
              <div
                className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-2 text-xs font-semibold"
                style={{ color: accent }}
              >
                <span className="max-w-[140px] truncate">Search: {search}</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 transition hover:bg-[var(--accent)]/10"
                  aria-label="Clear search"
                  onClick={() => onSearch("")}
                >
                  <XIcon />
                </button>
              </div>
            )}
          </div>
        </FilterCard>

        <FilterCard className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-800">Search filters</p>
          <div className="relative">
            <input
              id="filter-search"
              type="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          </div>
        </FilterCard>

        <FilterCard className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-800">Categories</p>
              <p className="text-xs text-[var(--muted-foreground)]">Choose a category and subcategories.</p>
            </div>
            <button
              type="button"
              onClick={() => onCategory(null, null)}
              className="shrink-0 text-xs font-medium transition hover:opacity-80"
              style={{ color: accent }}
            >
              Clear
            </button>
          </div>
          <div className="hide-scrollbar max-h-[200px] space-y-2 overflow-y-auto">
            {TEMPLATE_SIDEBAR_CATEGORIES.map((cat) => {
              const isActiveParent = category === cat.name;
              return (
                <div
                  key={cat.name}
                  className="overflow-hidden rounded-xl border border-[var(--border)]/50 transition hover:border-[var(--border)]"
                >
                  <button
                    type="button"
                    onClick={() => onCategory(cat.name, null)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-sm font-semibold transition ${
                      isActiveParent
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                        : "bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]/50"
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                  {cat.subs.length > 0 && (
                    <div className="divide-y divide-[var(--border)]/30 border-t border-[var(--border)]/30 bg-[var(--muted)]/20">
                      {cat.subs.map((s) => {
                        const subSelected = subcategory === s && category === cat.name;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => onCategory(cat.name, s)}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${
                              subSelected
                                ? "bg-[var(--accent)]/10 font-semibold text-[var(--accent)]"
                                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/40 hover:text-[var(--foreground)]"
                            }`}
                          >
                            <span>{s}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </FilterCard>

        <FilterCard className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-800">Price Range</p>
            <p className="text-xs text-[var(--muted-foreground)]">Pick a budget that matches your needs.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <button type="button" onClick={() => onPrice("low")} className={priceBtn(priceFilter === "low")}>
              ₹0 – ₹299
            </button>
            <button type="button" onClick={() => onPrice("mid")} className={priceBtn(priceFilter === "mid")}>
              ₹299 – ₹499
            </button>
            <button type="button" onClick={() => onPrice("all")} className={priceBtn(priceFilter === "all")}>
              All
            </button>
          </div>
        </FilterCard>

        <FilterCard className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-800">Duration</p>
            <p className="text-xs text-[var(--muted-foreground)]">Filter by total video length (in seconds).</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <button
              type="button"
              onClick={() => onDuration("short")}
              className={priceBtn(durationFilter === "short")}
            >
              0 – 29 Seconds
            </button>
            <button
              type="button"
              onClick={() => onDuration("long")}
              className={priceBtn(durationFilter === "long")}
            >
              30 – 50 Seconds
            </button>
            <button
              type="button"
              onClick={() => onDuration("all")}
              className={priceBtn(durationFilter === "all")}
            >
              All
            </button>
          </div>
        </FilterCard>
      </div>
    </aside>
  );
}
