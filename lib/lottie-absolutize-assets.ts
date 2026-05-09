/** Turn a site-relative media URL into an absolute URL the render server can fetch. */
export function absolutizeUrlIfRelative(url: string, origin: string): string {
  const u = url.trim();
  if (!u || /^https?:/i.test(u) || /^blob:/i.test(u) || /^data:/i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  const base = origin.replace(/\/$/, "");
  if (u.startsWith("/")) return `${base}${u}`;
  return u;
}

/**
 * Rewrites root-relative Lottie asset paths so a headless render server can fetch them
 * (same origin in the browser becomes absolute https in POST body).
 */
export function absolutizeLottieUrlsForServer(animationData: unknown, origin: string): unknown {
  const base = origin.replace(/\/$/, "");
  if (!base) return animationData;
  const clone = JSON.parse(JSON.stringify(animationData)) as Record<string, unknown>;
  const assets = clone.assets;
  if (Array.isArray(assets)) {
    for (const raw of assets) {
      if (!raw || typeof raw !== "object") continue;
      const a = raw as Record<string, unknown>;
      if (typeof a.u === "string" && a.u.startsWith("/")) a.u = `${base}${a.u}`;
      if (typeof a.p === "string" && a.p.startsWith("/")) a.p = `${base}${a.p}`;
    }
  }
  const fontList = (clone.fonts as Record<string, unknown> | undefined)?.list;
  if (Array.isArray(fontList)) {
    for (const raw of fontList) {
      if (!raw || typeof raw !== "object") continue;
      const f = raw as Record<string, unknown>;
      if (typeof f.fPath === "string" && f.fPath.startsWith("/")) f.fPath = `${base}${f.fPath}`;
    }
  }
  return clone;
}
