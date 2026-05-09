"use strict";

/**
 * Browser-side font loader; must match `lib/lottie-export-fonts.ts` logic.
 * Passed to puppeteer `page.evaluate` (no Node closures).
 */
async function preloadLottieTemplateFontsInPage(animationData, previewFontUrls) {
  function normalizeName(value) {
    return String(value)
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  function filenameFromUrl(url) {
    const raw = String(url || "").trim();
    try {
      const parsed = new URL(raw, window.location.origin);
      // Our render proxy format: /__asset?u=<encoded-absolute-url>
      const nested = parsed.searchParams.get("u");
      if (nested) {
        return filenameFromUrl(decodeURIComponent(nested));
      }
    } catch {
      /* fall through to raw parser */
    }
    const clean = raw.split("?")[0].split("#")[0];
    const i = clean.lastIndexOf("/");
    return i >= 0 ? clean.slice(i + 1) : clean;
  }

  function parseFontStyleMeta(styleRaw) {
    const s = String(styleRaw).toLowerCase();
    const style = s.includes("italic") ? "italic" : "normal";
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

  if (!animationData || typeof animationData !== "object") return;
  if (!Array.isArray(previewFontUrls) || previewFontUrls.length === 0) return;

  const root = animationData;
  const fontList = root.fonts && Array.isArray(root.fonts.list) ? root.fonts.list : [];
  if (fontList.length === 0) return;

  const candidates = previewFontUrls.map((hrefRaw) => {
    const url = String(hrefRaw || "").trim();
    if (!url) return null;
    const stem = filenameFromUrl(url).replace(/\.[^.]+$/i, "");
    /** @type {Set<string>} */
    const keys = new Set();
    keys.add(normalizeName(filenameFromUrl(url)));
    stem.split(/[-_\s]+/).forEach((part) => {
      const k = normalizeName(part);
      if (k.length >= 2) keys.add(k);
    });
    return {
      url,
      stemNorm: normalizeName(stem),
      fileNorm: normalizeName(filenameFromUrl(url)),
      keys: Array.from(keys),
    };
  }).filter(Boolean);

  if (candidates.length === 0) return;

  /** @type {Promise<void>[]} */
  const loads = [];
  const already = new Set();
  const assignments = [];

  function scoreCandidate(c, f) {
    const fName = normalizeName(f?.fName || "");
    const family = normalizeName(f?.fFamily || "");
    const style = normalizeName(f?.fStyle || "");
    let score = 0;

    // Highest priority: exact fName filename match.
    if (fName && c.stemNorm === fName) score += 120;
    else if (fName && (c.stemNorm.includes(fName) || fName.includes(c.stemNorm))) score += 70;

    if (family && (c.stemNorm.includes(family) || family.includes(c.stemNorm))) score += 25;
    if (style && (c.stemNorm.includes(style) || style.includes(c.stemNorm))) score += 8;

    // Alias token support.
    const aliases = [f?.fName, f?.fFamily].filter(Boolean).map((a) => normalizeName(a));
    aliases.forEach((ak) => {
      if (!ak) return;
      c.keys.forEach((k) => {
        if (k === ak) score += 12;
        else if (k.includes(ak) || ak.includes(k)) score += 6;
      });
    });

    return score;
  }

  fontList.forEach((f) => {
    if (!f || typeof f !== "object") return;
    const family = typeof f.fFamily === "string" ? f.fFamily : "";
    const name = typeof f.fName === "string" ? f.fName : "";
    const styleRaw = typeof f.fStyle === "string" ? f.fStyle : "";
    const aliases = [name, family].filter(Boolean);
    if (aliases.length === 0) return;
    const styleMeta = parseFontStyleMeta(styleRaw);

    const ranked = candidates
      .map((c) => ({ c, s: scoreCandidate(c, f) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.c);
    if (ranked.length === 0) return;

    aliases.forEach((alias) => {
      loads.push((async () => {
        for (const cand of ranked) {
          const key = `${alias}|${cand.url}|${styleMeta.style}|${styleMeta.weight}`;
          if (already.has(key)) continue;
          try {
            const ff = new FontFace(alias, `url("${cand.url}")`, {
              style: styleMeta.style,
              weight: styleMeta.weight,
            });
            const loaded = await ff.load();
            document.fonts.add(loaded);
            already.add(key);
            assignments.push({
              family,
              name,
              styleRaw,
              selectedUrl: cand.url,
              aliases,
            });
            return;
          } catch {
            // try next candidate
          }
        }
      })());
    });
  });

  await Promise.all(loads);
  if (document.fonts?.ready) await document.fonts.ready;
  return assignments;
}

module.exports = preloadLottieTemplateFontsInPage;
