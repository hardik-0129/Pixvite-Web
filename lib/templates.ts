export type FormField = {
  name: string;
  label: string;
  defaultValue: string;
  type?: "text" | "image";
  sourcePath?: string;
  /** When false, field is hidden on the storefront (admin can turn it back on). */
  enabled?: boolean;
};

/** Treat missing `enabled` as on (legacy templates). */
export function isFormFieldEnabled(field: Pick<FormField, "enabled">): boolean {
  return field.enabled !== false;
}

export type PreviewVideoTextOverlay = {
  field: string;
  topPct: number;
  leftPct: number;
  align?: "left" | "center" | "right";
  widthPct?: number;
  fontSizeRem?: number;
  color?: string;
  fontWeight?: string | number;
  lineHeight?: number;
  textShadow?: string;
};

export type Template = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  functions: number;
  duration: string;
  durationSeconds: number;
  price: number;
  originalPrice: number;
  thumbnail: string;
  formFields: FormField[];
  /** Short clip for grid hover / marketing (optional). */
  previewVideoUrl?: string;
  /** Full template plate behind Lottie (e.g. `Alpha.mp4` from zip) — separate from hover preview. */
  backgroundVideoUrl?: string;
  previewAudioUrl?: string;
  previewFontUrls?: string[];
  previewVideoTextOverlays?: PreviewVideoTextOverlay[];
  lottiePreviewUrl?: string;
  status?: "active" | "draft";
};

export type SidebarCategory = { name: string; subs: string[] };

export function filterTemplates(
  list: Template[],
  opts: {
    category?: string | null;
    subcategory?: string | null;
    search?: string;
    priceMin?: number | null;
    priceMax?: number | null;
    durationMin?: number | null;
    durationMax?: number | null;
  }
) {
  return list.filter((t) => {
    if (opts.category && t.category !== opts.category) return false;
    if (opts.subcategory && t.subcategory !== opts.subcategory) return false;
    if (opts.search) {
      const q = opts.search.toLowerCase();
      const hay = `${t.id} ${t.title} ${t.category} ${t.subcategory}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (opts.priceMin != null && t.price < opts.priceMin) return false;
    if (opts.priceMax != null && t.price > opts.priceMax) return false;
    if (opts.durationMin != null && t.durationSeconds < opts.durationMin) return false;
    if (opts.durationMax != null && t.durationSeconds > opts.durationMax) return false;
    return true;
  });
}
