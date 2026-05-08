import { TemplatesView } from "@/components/TemplatesView";

export default function WeddingPage() {
  return (
    <div className="min-h-[60vh] bg-[var(--bg-page)]">
      <TemplatesView preset={{ category: "Wedding", subcategory: "Wedding Invitation" }} />
    </div>
  );
}
