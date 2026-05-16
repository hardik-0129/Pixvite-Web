export const dynamic = "force-dynamic";

import { TemplatesView } from "@/components/TemplatesView";
import { listSidebarCategories, listTemplates } from "@/lib/template-store";

export default async function WeddingPage() {
  const [templates, categories] = await Promise.all([listTemplates(), listSidebarCategories()]);

  return (
    <div className="min-h-[60vh] bg-[var(--bg-page)]">
      <TemplatesView
        templates={templates}
        categories={categories}
        preset={{ category: "Wedding", subcategory: "Wedding Invitation" }}
      />
    </div>
  );
}
