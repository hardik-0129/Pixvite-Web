import { Suspense } from "react";
import { TemplatesWithSearchParams } from "./TemplatesWithSearchParams";

export default function TemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background)] px-4 py-16 text-center text-sm text-[var(--muted-foreground)] sm:px-6 lg:px-8">
          Loading templates…
        </div>
      }
    >
      <TemplatesWithSearchParams />
    </Suspense>
  );
}
