/**
 * Load template font files into `document.fonts` so lottie-web **canvas** export matches
 * the SVG preview (text layers need real font files, not only system fallbacks).
 */

function toProxiedTemplateAssetFileUrl(href: string): string {
  const t = href.trim();
  if (!t) return t;
  if (t.startsWith("/template-assets/")) return t;
  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t);
      if (u.pathname.startsWith("/template-assets/")) {
        return `${u.pathname}${u.search}`;
      }
    } catch {
      /* ignore */
    }
  }
  return t;
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9]+/g, "");
}

function filenameFromUrl(url: string) {
  const clean = url.split("?")[0].split("#")[0];
  const i = clean.lastIndexOf("/");
  return i >= 0 ? clean.slice(i + 1) : clean;
}

function parseFontStyleMeta(styleRaw: string): { style: "normal" | "italic"; weight: string } {
  const s = styleRaw.toLowerCase();
  const style: "normal" | "italic" = s.includes("italic") ? "italic" : "normal";
  if (/\bthin\b/.test(s)) return { style, weight: "100" };
  if (/\bextralight\b|\bultralight\b/.test(s)) return { style, weight: "200" };
  if (/\blight\b/.test(s)) return { style, weight: "300" };
  if (/\bregular\b|\bbook\b|\bnormal\b/.test(s)) return { style, weight: "400" };
  if (/\bmedium\b/.test(s)) return { style, weight: "500" };
  if (/\bsemibold\b|\bdemibold\b/.test(s)) return { style, weight: "600" };
  if (/\bbold\b/.test(s)) return { style, weight: "700" };
  if (/\bextrabold\b|\bultrabold\b/.test(s)) return { style, weight: "800" };
  if (/\bblack\b|\bheavy\b/.test(s)) return { style, weight: "900" };
  return { style, weight: "400" };
}

export async function preloadLottieTemplateFonts(
  animationData: unknown,
  previewFontUrls: string[] | null | undefined
): Promise<void> {
  if (!animationData || typeof animationData !== "object") return;
  if (!Array.isArray(previewFontUrls) || previewFontUrls.length === 0) return;

  const root = animationData as Record<string, unknown>;
  const fontList = ((root.fonts as Record<string, unknown> | undefined)?.list ?? []) as Array<Record<string, unknown>>;
  if (!Array.isArray(fontList) || fontList.length === 0) return;

  const candidates = previewFontUrls.map((href) => {
    const url = toProxiedTemplateAssetFileUrl(href);
    const stem = filenameFromUrl(url).replace(/\.[^.]+$/i, "");
    const keys = new Set<string>();
    keys.add(normalizeName(filenameFromUrl(url)));
    stem.split(/[-_\s]+/).forEach((part) => {
      const k = normalizeName(part);
      if (k.length >= 2) keys.add(k);
    });
    return { url, keys: Array.from(keys) };
  });

  const loads: Promise<void>[] = [];
  const already = new Set<string>();

  const scoreCandidate = (_keys: string[], aliases: string[], styleRaw: string) => (k: string) => {
    let score = 0;
    aliases.forEach((a) => {
      const ak = normalizeName(a);
      if (!ak) return;
      if (k === ak) score += 12;
      else if (k.includes(ak) || ak.includes(k)) score += 8;
    });
    const st = normalizeName(styleRaw);
    if (st && (k.includes(st) || st.includes(k))) score += 3;
    return score;
  };

  fontList.forEach((f) => {
    const family = typeof f.fFamily === "string" ? f.fFamily : "";
    const name = typeof f.fName === "string" ? f.fName : "";
    const styleRaw = typeof f.fStyle === "string" ? f.fStyle : "";
    const aliases = [name, family].filter(Boolean);
    if (aliases.length === 0) return;
    const styleMeta = parseFontStyleMeta(styleRaw);

    const best =
      candidates
        .map((c) => ({
          c,
          s: Math.max(0, ...c.keys.map((k) => scoreCandidate(c.keys, aliases, styleRaw)(k))),
        }))
        .sort((a, b) => b.s - a.s)[0]?.c ?? candidates[0];
    if (!best) return;

    aliases.forEach((alias) => {
      const key = `${alias}|${best.url}|${styleMeta.style}|${styleMeta.weight}`;
      if (already.has(key)) return;
      already.add(key);
      try {
        const ff = new FontFace(alias, `url("${best.url}")`, {
          style: styleMeta.style,
          weight: styleMeta.weight,
        });
        loads.push(
          ff.load().then((loaded) => {
            try {
              document.fonts.add(loaded);
            } catch {
              /* ignore */
            }
          })
        );
      } catch {
        /* ignore */
      }
    });
  });

  await Promise.all(loads);
  if (document.fonts?.ready) await document.fonts.ready;
}
