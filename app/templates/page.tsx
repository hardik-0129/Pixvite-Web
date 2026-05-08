import { Suspense } from "react";
import { TemplatesWithSearchParams } from "./TemplatesWithSearchParams";
import { listSidebarCategories, listTemplates } from "@/lib/template-store";

export default async function TemplatesPage() {
  const [templates, categories] = await Promise.all([listTemplates(), listSidebarCategories()]);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background)] px-4 py-16 text-center text-sm text-[var(--muted-foreground)] sm:px-6 lg:px-8">
          Loading templates…
        </div>
      }
    >
      <TemplatesWithSearchParams templates={templates} categories={categories} />
    </Suspense>
  );
}
