"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { filterTemplates, type SidebarCategory, type Template } from "@/lib/templates";
import { TemplateCard } from "./TemplateCard";
import { TemplateSidebar } from "./TemplateSidebar";

type PriceFilter = "all" | "low" | "mid";
type DurationFilter = "all" | "short" | "long";

type SortKey = "recent" | "price-asc" | "price-desc";

type Preset = {
  category?: string | null;
  subcategory?: string | null;
  initialSearch?: string;
  sort?: SortKey;
};

function templateIdNum(id: string): number {
  const n = parseInt(id.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

export function TemplatesView({
  preset,
  templates,
  categories,
}: {
  preset?: Preset;
  templates: Template[];
  categories: SidebarCategory[];
}) {
  const [category, setCategory] = useState<string | null>(preset?.category ?? null);
  const [subcategory, setSubcategory] = useState<string | null>(preset?.subcategory ?? null);
  const [search, setSearch] = useState(preset?.initialSearch ?? "");
  const sortBy: SortKey = preset?.sort ?? "recent";
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("all");

  const priceRange = useMemo(() => {
    if (priceFilter === "low") return { priceMin: 0, priceMax: 299 };
    if (priceFilter === "mid") return { priceMin: 299, priceMax: 499 };
    return { priceMin: null, priceMax: null };
  }, [priceFilter]);

  const durationRange = useMemo(() => {
    if (durationFilter === "short") return { durationMin: 0, durationMax: 29 };
    if (durationFilter === "long") return { durationMin: 30, durationMax: 50 };
    return { durationMin: null, durationMax: null };
  }, [durationFilter]);

  const filtered = useMemo(
    () =>
      filterTemplates(templates, {
        category: category ?? undefined,
        subcategory: subcategory ?? undefined,
        search,
        ...priceRange,
        ...durationRange,
      }),
    [templates, category, subcategory, search, priceRange, durationRange]
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === "recent") {
      arr.sort((a, b) => templateIdNum(b.id) - templateIdNum(a.id));
    } else if (sortBy === "price-asc") {
      arr.sort((a, b) => a.price - b.price);
    } else {
      arr.sort((a, b) => b.price - a.price);
    }
    return arr;
  }, [filtered, sortBy]);

  const activeTags: { label: string; type: "category" | "subcategory" }[] = [];
  if (category) activeTags.push({ label: category, type: "category" });
  if (subcategory) activeTags.push({ label: subcategory, type: "subcategory" });

  function onCategory(cat: string | null, sub: string | null) {
    setCategory(cat);
    setSubcategory(sub);
  }

  function onClearAll() {
    setCategory(null);
    setSubcategory(null);
    setSearch("");
    setPriceFilter("all");
    setDurationFilter("all");
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex justify-center sm:hidden">
          <Image
            src="/category/steps.svg"
            alt="3 Steps to Create Invitation"
            width={600}
            height={300}
            className="h-auto w-full max-w-[600px] rounded-lg shadow-sm"
            priority={false}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:gap-8">
          <TemplateSidebar
            categories={categories}
            category={category}
            subcategory={subcategory}
            search={search}
            priceFilter={priceFilter}
            durationFilter={durationFilter}
            activeTags={activeTags}
            onCategory={onCategory}
            onSearch={setSearch}
            onPrice={setPriceFilter}
            onDuration={setDurationFilter}
            onClearAll={onClearAll}
          />

          <div className="min-w-0 flex-1">
            <div className="mb-6 min-w-0 sm:mb-8">
              <div className="mb-4 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0 w-full sm:w-auto">
                  <p className="text-xs text-[var(--muted-foreground)] sm:text-sm">
                    Showing {sorted.length} of {templates.length}
                  </p>
                </div>
                <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                  <label className="sr-only" htmlFor="template-sort">
                    Sort templates
                  </label>
                  {/* <select
                    id="template-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-medium text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/30 sm:text-sm"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select> */}
                  <div className="inline-flex max-w-full flex-wrap items-baseline gap-x-1 rounded-lg border-2 border-gray-400 bg-[var(--muted)]/50 px-3 py-1.5 sm:px-4 sm:py-2 dark:border-gray-500">
                    <span className="text-base font-bold sm:text-lg" style={{ color: "var(--accent)" }}>
                      {templates.length}
                    </span>
                    <span className="text-xs font-medium text-[var(--muted-foreground)] sm:text-sm">Templates</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
              {sorted.map((t) => (
                <TemplateCard key={t.id} template={t} />
              ))}
            </div>

            {sorted.length === 0 && (
              <p className="mt-10 text-center text-sm text-[var(--muted-foreground)]">
                No templates match your filters.
              </p>
            )}

            <div className="h-10" aria-hidden />
            <div className="py-12 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">
                We add new templates every day.
                <br />
                Check back soon for more.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
