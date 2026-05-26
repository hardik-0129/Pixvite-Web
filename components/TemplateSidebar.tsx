"use client";

import { useRef } from "react";
import type { SidebarCategory } from "@/lib/templates";

type PriceFilter = "all" | "low" | "mid";
type DurationFilter = "all" | "short" | "long";

type Props = {
  categories: SidebarCategory[];
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

function FilterCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[var(--border)]/60 bg-[var(--card)]/80 p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function FunnelIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function XIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function TemplateSidebar({
  categories,
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
  const accent = "#e85025";
  const searchRef = useRef<HTMLInputElement>(null);

  const priceBtn = (active: boolean) =>
    `w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
      active
        ? "border-[#e85025] bg-[#e85025] text-white shadow-sm"
        : "border-[var(--border)]/60 bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]/50"
    }`;

  const hasFilters =
    activeTags.length > 0 || priceFilter !== "all" || durationFilter !== "all" || search.trim() !== "";

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
        {/* Mobile: clear all */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={onClearAll}
            className="w-full rounded-lg border border-[#e85025]/30 px-4 py-2 text-sm font-medium transition hover:bg-[#e85025]/5"
            style={{ color: accent }}
          >
            Clear all filters
          </button>
        </div>

        {/* Active filters */}
        {hasFilters && (
          <FilterCard className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-800">Active Filters</p>
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs font-medium transition hover:opacity-80"
                style={{ color: accent }}
              >
                Clear
              </button>
            </div>
            <div className="flex min-h-[2rem] flex-wrap gap-2">
              {activeTags.map((t) => (
                <div
                  key={t.label + t.type}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e85025]/30 bg-[#e85025]/5 px-3 py-1.5 text-xs font-semibold"
                  style={{ color: accent }}
                >
                  <span>{t.label}</span>
                  <button
                    type="button"
                    className="rounded-full p-0.5 transition hover:bg-[#e85025]/10"
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
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e85025]/30 bg-[#e85025]/5 px-3 py-1.5 text-xs font-semibold" style={{ color: accent }}>
                  <span>₹0 – ₹299</span>
                  <button type="button" className="rounded-full p-0.5 transition hover:bg-[#e85025]/10" aria-label="Remove price filter" onClick={() => onPrice("all")}>
                    <XIcon />
                  </button>
                </div>
              )}
              {priceFilter === "mid" && (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e85025]/30 bg-[#e85025]/5 px-3 py-1.5 text-xs font-semibold" style={{ color: accent }}>
                  <span>₹299 – ₹499</span>
                  <button type="button" className="rounded-full p-0.5 transition hover:bg-[#e85025]/10" aria-label="Remove price filter" onClick={() => onPrice("all")}>
                    <XIcon />
                  </button>
                </div>
              )}
              {durationFilter === "short" && (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e85025]/30 bg-[#e85025]/5 px-3 py-1.5 text-xs font-semibold" style={{ color: accent }}>
                  <span>0–29 sec</span>
                  <button type="button" className="rounded-full p-0.5 transition hover:bg-[#e85025]/10" aria-label="Remove duration filter" onClick={() => onDuration("all")}>
                    <XIcon />
                  </button>
                </div>
              )}
              {durationFilter === "long" && (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e85025]/30 bg-[#e85025]/5 px-3 py-1.5 text-xs font-semibold" style={{ color: accent }}>
                  <span>30–50 sec</span>
                  <button type="button" className="rounded-full p-0.5 transition hover:bg-[#e85025]/10" aria-label="Remove duration filter" onClick={() => onDuration("all")}>
                    <XIcon />
                  </button>
                </div>
              )}
              {search.trim() && (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e85025]/30 bg-[#e85025]/5 px-3 py-1.5 text-xs font-semibold" style={{ color: accent }}>
                  <span>&ldquo;{search.trim()}&rdquo;</span>
                  <button type="button" className="rounded-full p-0.5 transition hover:bg-[#e85025]/10" aria-label="Clear search" onClick={() => onSearch("")}>
                    <XIcon />
                  </button>
                </div>
              )}
            </div>
          </FilterCard>
        )}

        {/* Search */}
        <FilterCard>
          <div className="relative">
            <input
              ref={searchRef}
              type="search"
              placeholder="Search templates…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#e85025]/40"
            />
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          </div>
        </FilterCard>

        {/* Categories */}
        <FilterCard className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-800">Categories</p>
              <p className="text-xs text-[var(--muted-foreground)]">Choose a category and subcategories.</p>
            </div>
            {(category || subcategory) && (
              <button
                type="button"
                onClick={() => onCategory(null, null)}
                className="shrink-0 text-xs font-medium transition hover:opacity-80"
                style={{ color: accent }}
              >
                Clear
              </button>
            )}
          </div>
          <div className="hide-scrollbar max-h-[200px] space-y-2 overflow-y-auto">
            {categories.map((cat, catIdx) => {
              const isActiveParent = category === cat.name;
              return (
                <div key={`${cat.name}-${catIdx}`} className="overflow-hidden rounded-xl border border-[var(--border)]/50">
                  <button
                    type="button"
                    onClick={() => onCategory(cat.name, null)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-sm font-semibold transition ${
                      isActiveParent
                        ? "bg-[#e85025] text-white"
                        : "bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]/50"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.subs.length > 0 && <ChevronIcon className={`h-4 w-4 transition-transform ${isActiveParent ? "rotate-180" : ""}`} />}
                  </button>
                  {cat.subs.length > 0 && isActiveParent && (
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
                                ? "bg-[#feede3] font-semibold text-[#e85025]"
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

        {/* Price Range */}
        <FilterCard className="space-y-3">
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

        {/* Duration */}
        <FilterCard className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-800">Duration</p>
            <p className="text-xs text-[var(--muted-foreground)]">Filter by total video length (in seconds).</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <button type="button" onClick={() => onDuration("short")} className={priceBtn(durationFilter === "short")}>
              0 – 29 Seconds
            </button>
            <button type="button" onClick={() => onDuration("long")} className={priceBtn(durationFilter === "long")}>
              30 – 50 Seconds
            </button>
            <button type="button" onClick={() => onDuration("all")} className={priceBtn(durationFilter === "all")}>
              All
            </button>
          </div>
        </FilterCard>
      </div>
    </aside>
  );
}
