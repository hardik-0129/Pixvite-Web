"use client";

import { useSearchParams } from "next/navigation";
import { TemplatesView } from "@/components/TemplatesView";

const SORTS = ["recent", "price-asc", "price-desc"] as const;
type SortKey = (typeof SORTS)[number];

function normalizeSort(raw: string | null): SortKey {
  if (raw && (SORTS as readonly string[]).includes(raw)) return raw as SortKey;
  return "recent";
}

export function TemplatesWithSearchParams() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  const category = sp.get("category");
  const subcategory = sp.get("subcategory");
  const sort = normalizeSort(sp.get("sort"));

  return (
    <TemplatesView
      preset={{
        category: category || undefined,
        subcategory: subcategory || undefined,
        initialSearch: q,
        sort,
      }}
    />
  );
}
