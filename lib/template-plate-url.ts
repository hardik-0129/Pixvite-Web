export function resolveTemplatePlateVideoUrl(t: {
  backgroundVideoUrl?: string | null;
  previewVideoUrl?: string | null;
  lottiePreviewUrl?: string | null;
}): string {
  return (t.backgroundVideoUrl || "").trim();
}
