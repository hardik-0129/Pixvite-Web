"use client";

import Image from "next/image";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormField, PreviewVideoTextOverlay } from "@/lib/templates";

type Props = {
  posterSrc: string;
  posterAlt: string;
  embedUrl?: string | null;
  /** Short clip (e.g. grid hover) — not the Lottie plate. */
  previewVideoUrl?: string | null;
  /** Plate video behind Lottie (e.g. zip `Alpha.mp4`). Takes priority over `previewVideoUrl` for the editor video layer. */
  backgroundVideoUrl?: string | null;
  /** Optional audio track (auto-detected from uploaded assets, e.g. mp3). */
  previewAudioUrl?: string | null;
  /** Uploaded font files from zip/folder for matching Lottie fonts. */
  previewFontUrls?: string[] | null;
  /** Current form values — used with `videoTextOverlays` to draw text on the video. */
  fieldValues?: Record<string, string>;
  /** Extracted editable fields from template metadata (for live Lottie text edits). */
  formFields?: FormField[];
  /** Row-style map: each entry positions one field’s text on the preview video. */
  videoTextOverlays?: PreviewVideoTextOverlay[];
  /** Public path to Lottie JSON (Bodymovin), e.g. `/lottie/engagement-invitation-01.json` */
  lottiePreviewUrl?: string | null;
};

function overlayStyle(o: PreviewVideoTextOverlay): CSSProperties {
  const align = o.align ?? "center";
  const base: CSSProperties = {
    position: "absolute",
    top: `${o.topPct}%`,
    maxWidth: o.widthPct != null ? `${o.widthPct}%` : undefined,
    fontSize: `${o.fontSizeRem ?? 0.75}rem`,
    color: o.color ?? "#ffffff",
    fontWeight: o.fontWeight ?? 600,
    lineHeight: o.lineHeight ?? 1.25,
    textShadow: o.textShadow ?? "0 1px 4px rgba(0,0,0,0.85)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };
  if (align === "center") {
    return { ...base, left: `${o.leftPct}%`, transform: "translateX(-50%)", textAlign: "center" };
  }
  if (align === "right") {
    return { ...base, left: `${o.leftPct}%`, transform: "translateX(-100%)", textAlign: "right" };
  }
  return { ...base, left: `${o.leftPct}%`, textAlign: "left" };
}

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "00:00";
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ensureSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function dirname(urlPath: string) {
  const clean = urlPath.split("?")[0].split("#")[0];
  const idx = clean.lastIndexOf("/");
  return idx >= 0 ? clean.slice(0, idx + 1) : "/";
}

function parentDir(urlPath: string) {
  const dir = dirname(urlPath);
  const trimmed = dir.endsWith("/") ? dir.slice(0, -1) : dir;
  const idx = trimmed.lastIndexOf("/");
  return idx >= 0 ? `${trimmed.slice(0, idx + 1)}` : "/";
}

function joinUrl(base: string, part: string) {
  const b = ensureSlash(base);
  const p = part.replace(/^\/+/, "");
  return `${b}${p}`;
}

function stripDotSegments(value: string) {
  return value.replace(/\\/g, "/").replace(/^\.\//, "");
}

/**
 * Lottie JSON from exports often still points at the admin origin (`http://localhost:3001/...`).
 * After we switched the storefront to same-origin `/template-assets/...`, `joinUrl(relativeBase, absoluteU)`
 * produced broken URLs and images/video layers failed (only text / alpha visible).
 */
function normalizeTemplateAssetBase(u: string): string | null {
  const raw = stripDotSegments(u);
  if (!raw) return null;
  if (raw.startsWith("/template-assets/")) {
    return raw.endsWith("/") ? raw : `${raw}/`;
  }
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (parsed.pathname.startsWith("/template-assets/")) {
        return parsed.pathname.endsWith("/") ? parsed.pathname : `${parsed.pathname}/`;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

/** Full font file URL → same-origin `/template-assets/...` so `FontFace` is not blocked by CORS. */
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

function getAssetProbePath(animationData: unknown) {
  if (!animationData || typeof animationData !== "object") return null;
  const assets = (animationData as Record<string, unknown>).assets;
  if (!Array.isArray(assets)) return null;
  for (const raw of assets) {
    if (!raw || typeof raw !== "object") continue;
    const a = raw as Record<string, unknown>;
    const p = typeof a.p === "string" ? stripDotSegments(a.p) : "";
    const e = typeof a.e === "number" ? a.e : 0;
    if (!p || e !== 0) continue;
    const u = typeof a.u === "string" ? stripDotSegments(a.u) : "";
    return `${u}${p}`.replace(/^\/+/, "");
  }
  return null;
}

async function resolveAssetBase(lottieUrl: string, animationData: unknown): Promise<string | null> {
  const probe = getAssetProbePath(animationData);
  if (!probe) return null;
  const level0 = dirname(lottieUrl);
  const level1 = parentDir(level0);
  const level2 = parentDir(level1);

  // Different exports place images beside JSON, one level up, or two levels up.
  const candidates = [level0, level1, level2];
  for (const candidate of candidates) {
    const probeUrl = joinUrl(candidate, probe);
    try {
      const head = await fetch(probeUrl, { method: "HEAD" });
      if (head.ok) return candidate;
      // Some dev/static handlers may not support HEAD reliably.
      const get = await fetch(probeUrl, { method: "GET" });
      if (get.ok) return candidate;
    } catch {
      // Try next candidate.
    }
  }
  // Heuristic fallback: when JSON is in /Json/data.json, assets are commonly one level up.
  if (/\/json\/$/i.test(level0)) return level1;
  if (/\/json\//i.test(lottieUrl)) return level1;
  return null;
}

function rewriteAssetBase(animationData: unknown, base: string): unknown {
  if (!animationData || typeof animationData !== "object") return animationData;
  const clone = JSON.parse(JSON.stringify(animationData)) as Record<string, unknown>;
  const assets = clone.assets;
  if (!Array.isArray(assets)) return clone;
  const nextAssets = assets.map((raw) => {
    if (!raw || typeof raw !== "object") return raw;
    const a = raw as Record<string, unknown>;
    const p = typeof a.p === "string" ? stripDotSegments(a.p) : "";
    const e = typeof a.e === "number" ? a.e : 0;
    const u = typeof a.u === "string" ? stripDotSegments(a.u) : "";
    if (!p || e !== 0) return a;
    const proxied = normalizeTemplateAssetBase(u);
    const nextU = proxied ?? joinUrl(base, u);
    return { ...a, u: nextU };
  });
  clone.assets = nextAssets;
  return clone;
}

/**
 * lottie-web crashes (e.g. completeLayers → null.length) on incomplete exports:
 * precomp layers (ty === 0) with refId but missing matching `assets` entries.
 */
function isSafeLottieAnimationData(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  const layers = obj.layers;
  if (!Array.isArray(layers) || layers.length === 0) return false;
  const assets = Array.isArray(obj.assets) ? obj.assets : [];

  for (const layer of layers) {
    if (!layer || typeof layer !== "object") return false;
    const L = layer as Record<string, unknown>;
    if (L.ty !== 0) continue;

    const refId = L.refId;
    if (refId === undefined || refId === null) return false;
    if (assets.length === 0) return false;

    const byId = assets.some((a) => {
      if (!a || typeof a !== "object") return false;
      const id = (a as Record<string, unknown>).id;
      return id === refId || id === String(refId);
    });
    const idx = typeof refId === "number" && Number.isFinite(refId) ? refId : Number.parseInt(String(refId), 10);
    const byIndex = Number.isInteger(idx) && idx >= 0 && idx < assets.length && assets[idx] != null;

    if (!byId && !byIndex) return false;
  }
  return true;
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9]+/g, "");
}

function filenameFromUrl(url: string) {
  const clean = url.split("?")[0].split("#")[0];
  const i = clean.lastIndexOf("/");
  return i >= 0 ? clean.slice(i + 1) : clean;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function tokenizePath(pathExpr: string): Array<string | number> {
  const normalized = pathExpr.replace(/\[(\d+)\]/g, ".$1");
  return normalized
    .split(".")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => (/^\d+$/.test(x) ? Number(x) : x));
}

function getByPath(root: unknown, pathExpr: string): unknown {
  const tokens = tokenizePath(pathExpr);
  let cur: unknown = root;
  for (const t of tokens) {
    if (cur == null) return undefined;
    if (typeof t === "number") {
      if (!Array.isArray(cur)) return undefined;
      cur = cur[t];
      continue;
    }
    if (typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[t];
  }
  return cur;
}

function setByPath(root: unknown, pathExpr: string, value: string): boolean {
  const tokens = tokenizePath(pathExpr);
  if (!tokens.length) return false;
  let cur: unknown = root;
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const t = tokens[i];
    if (typeof t === "number") {
      if (!Array.isArray(cur)) return false;
      cur = cur[t];
    } else {
      if (typeof cur !== "object" || cur == null) return false;
      cur = (cur as Record<string, unknown>)[t];
    }
    if (cur == null) return false;
  }
  const last = tokens[tokens.length - 1];
  if (typeof last === "number") {
    if (!Array.isArray(cur) || typeof cur[last] !== "string") return false;
    cur[last] = value;
    return true;
  }
  if (typeof cur !== "object" || cur == null) return false;
  if (typeof (cur as Record<string, unknown>)[last] !== "string") return false;
  (cur as Record<string, unknown>)[last] = value;
  return true;
}

function setAllTextKeyframesBySourcePath(root: unknown, sourcePath: string, value: string): boolean {
  const m = sourcePath.match(/^(.*)\.t\.d\.k\[\d+\]\.s\.t$/);
  if (!m) return false;
  const keyframeListPath = `${m[1]}.t.d.k`;
  const keyframes = getByPath(root, keyframeListPath);
  if (!Array.isArray(keyframes)) return false;
  let changed = false;
  keyframes.forEach((k) => {
    if (!k || typeof k !== "object") return;
    const s = (k as Record<string, unknown>).s;
    if (!s || typeof s !== "object") return;
    if (typeof (s as Record<string, unknown>).t !== "string") return;
    (s as Record<string, unknown>).t = value;
    changed = true;
  });
  return changed;
}

function setAllTextKeyframesByLeafPath(root: unknown, leafPath: string, value: string): boolean {
  const m = leafPath.match(/^(.*)\.t\.d\.k\[0\]\.s\.t$/);
  if (!m) return false;
  const keyframeListPath = `${m[1]}.t.d.k`;
  const keyframes = getByPath(root, keyframeListPath);
  if (!Array.isArray(keyframes)) return false;
  let changed = false;
  keyframes.forEach((k) => {
    if (!k || typeof k !== "object") return;
    const s = (k as Record<string, unknown>).s;
    if (!s || typeof s !== "object") return;
    if (typeof (s as Record<string, unknown>).t !== "string") return;
    (s as Record<string, unknown>).t = value;
    changed = true;
  });
  return changed;
}

function toLottieTextValue(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n/g, "\r");
}

function normalizeTextForCompare(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function normalizeAssetKey(value: string) {
  return value
    .toLowerCase()
    .split("?")[0]
    .split("#")[0]
    .replace(/^.*[\\/]/, "")
    .replace(/[^a-z0-9._-]+/g, "");
}

function applyImageFieldValuesToLottie(
  next: Record<string, unknown>,
  formFields: FormField[] | undefined,
  values: Record<string, string> | undefined
) {
  if (!formFields || !values) return;
  const assets = Array.isArray(next.assets) ? (next.assets as Array<Record<string, unknown>>) : [];
  if (assets.length === 0) return;

  const replaceAssetWithUrl = (asset: Record<string, unknown>, url: string) => {
    const clean = typeof url === "string" ? url.trim() : "";
    if (!clean) return false;
    asset.u = "";
    asset.p = clean;
    asset.e = 0;
    return true;
  };

  const findAssetByLayerSourcePath = (sourcePath: string) => {
    const layerPath = sourcePath.replace(/\.image$/, "");
    const layer = getByPath(next, layerPath);
    if (!layer || typeof layer !== "object") return null;
    const refId = (layer as Record<string, unknown>).refId;
    if (typeof refId === "string" && refId) {
      const byId = assets.find((a) => {
        const id = typeof a.id === "string" ? a.id : "";
        return id === refId;
      });
      if (byId) return byId;
      const idx = Number.parseInt(refId, 10);
      if (Number.isInteger(idx) && idx >= 0 && idx < assets.length) return assets[idx];
    }
    if (typeof refId === "number" && Number.isInteger(refId) && refId >= 0 && refId < assets.length) {
      return assets[refId];
    }
    return null;
  };

  const assetByFilename = new Map<string, Record<string, unknown>>();
  assets.forEach((a) => {
    const p = typeof a.p === "string" ? a.p : "";
    const key = normalizeAssetKey(p);
    if (key) assetByFilename.set(key, a);
  });

  formFields.forEach((f) => {
    if ((f.type ?? "text") !== "image") return;
    const selectedUrl = values[f.name];
    if (typeof selectedUrl !== "string" || !selectedUrl.trim()) return;
    const defaultValue = String(f.defaultValue ?? "");
    if (selectedUrl === defaultValue) return;
    const selectedKey = normalizeAssetKey(selectedUrl);
    const defaultKeyExact = normalizeAssetKey(defaultValue);
    if (selectedKey && defaultKeyExact && selectedKey === defaultKeyExact) return;

    if (typeof f.sourcePath === "string" && f.sourcePath.endsWith(".image")) {
      const byLayer = findAssetByLayerSourcePath(f.sourcePath);
      if (byLayer && replaceAssetWithUrl(byLayer, selectedUrl)) return;
    }

    const defaultKey = normalizeAssetKey(String(f.defaultValue ?? ""));
    if (defaultKey) {
      const byDefault = assetByFilename.get(defaultKey);
      if (byDefault && replaceAssetWithUrl(byDefault, selectedUrl)) return;
    }
  });
}

function collectTextLeafPaths(node: unknown, current = ""): string[] {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) {
    return node.flatMap((item, idx) => collectTextLeafPaths(item, `${current}[${idx}]`));
  }
  const obj = node as Record<string, unknown>;
  const out: string[] = [];
  const td = (obj.t as Record<string, unknown> | undefined)?.d as Record<string, unknown> | undefined;
  const tk = td?.k;
  if (Array.isArray(tk) && tk.length > 0) {
    out.push(`${current ? `${current}.` : ""}t.d.k[0].s.t`);
  }
  Object.entries(obj).forEach(([k, child]) => {
    out.push(...collectTextLeafPaths(child, current ? `${current}.${k}` : k));
  });
  return out;
}

function applyFieldValuesToLottie(
  baseData: unknown,
  formFields: FormField[] | undefined,
  values: Record<string, string> | undefined
): unknown {
  if (!baseData || typeof baseData !== "object" || !formFields || !values) return baseData;
  const next = deepClone(baseData) as Record<string, unknown>;
  applyImageFieldValuesToLottie(next, formFields, values);
  const usedPaths = new Set<string>();
  const textPaths = collectTextLeafPaths(next);
  const appliedText: Array<{ name: string; mode: "sourcePath" | "fallback"; value: string }> = [];
  const fallbackPathByField = new Map<string, string>();

  formFields.forEach((f) => {
    if ((f.type ?? "text") === "image") return;
    const defaultValue = String(f.defaultValue ?? "");
    if (!defaultValue) return;
    const matches = textPaths.filter((p) => {
      const cur = getByPath(next, p);
      return typeof cur === "string" && normalizeTextForCompare(cur) === normalizeTextForCompare(defaultValue);
    });
    // Use fallback path only when it's unambiguous.
    if (matches.length === 1) fallbackPathByField.set(f.name, matches[0]);
  });

  formFields.forEach((f) => {
    if ((f.type ?? "text") === "image") return;
    const nextValue = values[f.name];
    if (typeof nextValue !== "string") return;
    if (nextValue.trim() === "") return;
    const defaultValue = String(f.defaultValue ?? "");
    if (normalizeTextForCompare(nextValue) === normalizeTextForCompare(defaultValue)) return;
    const lottieValue = toLottieTextValue(nextValue);
    if (f.sourcePath?.includes(".t.d.k[0].s.t") && setAllTextKeyframesBySourcePath(next, f.sourcePath, lottieValue)) {
      usedPaths.add(f.sourcePath);
      appliedText.push({ name: f.name, mode: "sourcePath", value: lottieValue });
      return;
    }
    const fallbackPath = fallbackPathByField.get(f.name);
    if (fallbackPath && setAllTextKeyframesByLeafPath(next, fallbackPath, lottieValue)) {
      usedPaths.add(fallbackPath);
      appliedText.push({ name: f.name, mode: "fallback", value: lottieValue });
      return;
    }
  });

  return next;
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

export function TemplateEditorPreview({
  posterSrc,
  posterAlt,
  embedUrl,
  previewVideoUrl,
  backgroundVideoUrl,
  previewAudioUrl,
  previewFontUrls,
  fieldValues,
  formFields,
  videoTextOverlays,
  lottiePreviewUrl,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [lottieData, setLottieData] = useState<unknown | null>(null);
  const [lottieError, setLottieError] = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const baseLottieDataRef = useRef<unknown | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  /** Lottie plate: background (Alpha) first, else legacy single `previewVideoUrl`. */
  const plateVideoSrc = useMemo(
    () => (backgroundVideoUrl?.trim() || previewVideoUrl?.trim() || "").trim(),
    [backgroundVideoUrl, previewVideoUrl]
  );

  const recoverLottieData = useCallback(() => {
    const base = baseLottieDataRef.current;
    if (!base) return;
    const recovered = applyFieldValuesToLottie(base, formFields, fieldValues);
    setLottieData(recovered);
    setLottieError(false);
  }, [formFields, fieldValues]);

  const hasLottie = Boolean(lottiePreviewUrl && lottieData && !lottieError);
  const hasVideo = Boolean(plateVideoSrc);
  const hasAudio = Boolean(previewAudioUrl);
  const useComposite = Boolean(hasVideo && hasLottie);
  const useImageComposite = Boolean(!hasVideo && hasLottie && posterSrc);
  const useVideo = Boolean(hasVideo && !useComposite);
  const useLottie = Boolean(hasLottie && !useComposite && !useImageComposite);
  const useIframe = Boolean(!useComposite && !useImageComposite && !useLottie && !useVideo && embedUrl && playing);

  const getMasterTime = useCallback(() => {
    const v = videoRef.current;
    if (v && Number.isFinite(v.currentTime)) return v.currentTime;
    const a = audioRef.current;
    if (a && Number.isFinite(a.currentTime)) return a.currentTime;
    return 0;
  }, []);

  const startPlaybackFromUserGesture = useCallback(async () => {
    const tasks: Array<Promise<unknown>> = [];
    if (plateVideoSrc && videoRef.current) {
      tasks.push(videoRef.current.play());
    }
    if (previewAudioUrl && audioRef.current) {
      tasks.push(audioRef.current.play());
    }
    if (tasks.length === 0) {
      setPlaying(true);
      return;
    }
    const settled = await Promise.allSettled(tasks);
    const anyPlayed = settled.some((r) => r.status === "fulfilled");
    // Keep Lottie preview available even if browser blocks media autoplay.
    setPlaying(anyPlayed || hasLottie);
  }, [plateVideoSrc, previewAudioUrl, hasLottie]);

  const togglePlaybackFromUserGesture = useCallback(async () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    await startPlaybackFromUserGesture();
  }, [playing, startPlaybackFromUserGesture]);

  useEffect(() => {
    if (!lottiePreviewUrl) {
      baseLottieDataRef.current = null;
      setLottieData(null);
      setLottieError(false);
      return;
    }
    let cancelled = false;
    setLottieData(null);
    setLottieError(false);
    fetch(lottiePreviewUrl)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then(async (d) => {
        if (cancelled) return;
        const resolvedBase = await resolveAssetBase(lottiePreviewUrl, d);
        const withFixedAssets = resolvedBase ? rewriteAssetBase(d, resolvedBase) : d;
        if (!isSafeLottieAnimationData(withFixedAssets)) {
          baseLottieDataRef.current = null;
          setLottieData(null);
          setLottieError(true);
          setPlaying(false);
          return;
        }
        baseLottieDataRef.current = withFixedAssets;
        const withCurrentFields = applyFieldValuesToLottie(withFixedAssets, formFields, fieldValues);
        setLottieData(withCurrentFields);
        setLottieError(false);
      })
      .catch(() => {
        if (!cancelled) {
          baseLottieDataRef.current = null;
          setLottieData(null);
          setLottieError(true);
          setPlaying(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [lottiePreviewUrl, formFields, fieldValues]);

  useEffect(() => {
    if (!lottiePreviewUrl) return;
    const base = baseLottieDataRef.current;
    if (!base) return;
    if (!fieldValues || !formFields?.length) return;
    setLottieData(applyFieldValuesToLottie(base, formFields, fieldValues));
  }, [lottiePreviewUrl, fieldValues, formFields]);

  useEffect(() => {
    if (!hasLottie || !lottieData || !Array.isArray(previewFontUrls) || previewFontUrls.length === 0) return;
    const root = lottieData as Record<string, unknown>;
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
    const already = new Set<string>();
    fontList.forEach((f) => {
      const family = typeof f.fFamily === "string" ? f.fFamily : "";
      const name = typeof f.fName === "string" ? f.fName : "";
      const styleRaw = typeof f.fStyle === "string" ? f.fStyle : "";
      const aliases = [name, family].filter(Boolean);
      if (aliases.length === 0) return;
      const styleMeta = parseFontStyleMeta(styleRaw);

      const scoreCandidate = (k: string) => {
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

      const best =
        candidates
          .map((c) => ({ c, s: Math.max(0, ...c.keys.map((k) => scoreCandidate(k))) }))
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
          void ff.load().then((loaded) => {
            document.fonts.add(loaded);
          });
        } catch {
          // Ignore font load errors and keep browser fallback.
        }
      });
    });
  }, [hasLottie, lottieData, previewFontUrls]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !plateVideoSrc) return;
    if (playing) {
      void v.play().catch(() => setPlaying(false));
    } else {
      v.pause();
    }
  }, [playing, plateVideoSrc]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !previewAudioUrl) return;
    if (playing) {
      void a.play().catch(() => setPlaying(false));
    } else {
      a.pause();
    }
  }, [playing, previewAudioUrl]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !plateVideoSrc) return;
    const onTime = () => {
      setCurrentTime(v.currentTime);
      if (Number.isFinite(v.duration) && v.duration > 0) setDuration(v.duration);
      if (audioRef.current && previewAudioUrl) {
        const drift = Math.abs((audioRef.current.currentTime || 0) - (v.currentTime || 0));
        if (drift > 0.18) {
          audioRef.current.currentTime = v.currentTime || 0;
        }
      }
    };
    const onMeta = () => {
      if (Number.isFinite(v.duration) && v.duration > 0) setDuration(v.duration);
    };
    const onEnded = () => setPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("ended", onEnded);
    };
  }, [plateVideoSrc, previewAudioUrl]);

  useEffect(() => {
    if (plateVideoSrc) return;
    const a = audioRef.current;
    if (!a || !previewAudioUrl) return;
    const onTime = () => {
      setCurrentTime(a.currentTime);
      if (Number.isFinite(a.duration) && a.duration > 0) setDuration(a.duration);
    };
    const onMeta = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) setDuration(a.duration);
    };
    const onEnded = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnded);
    };
  }, [previewAudioUrl, plateVideoSrc]);

  useEffect(() => {
    if (!playing || !hasLottie) return;
    const api = lottieRef.current;
    const fr = Number((lottieData as Record<string, unknown> | null)?.fr) || 30;
    if (!api || !api.animationLoaded || !Number.isFinite(fr) || fr <= 0) return;

    const id = window.setInterval(() => {
      const item = (api as unknown as { animationItem?: { currentFrame?: number } }).animationItem;
      const currentFrame = Number(item?.currentFrame ?? 0);
      const lottieTime = currentFrame / fr;
      const masterTime = getMasterTime();
      if (!Number.isFinite(masterTime)) return;
      if (Math.abs(lottieTime - masterTime) > 0.2) {
        api.goToAndPlay(masterTime * fr, true);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [playing, hasLottie, lottieData, getMasterTime]);

  const syncLottiePlayback = useCallback(() => {
    const api = lottieRef.current;
    if (!api?.animationLoaded) return;
    if (playing) {
      const fr = Number((lottieData as Record<string, unknown> | null)?.fr) || 30;
      const masterTime = getMasterTime();
      if (Number.isFinite(fr) && fr > 0 && Number.isFinite(masterTime) && masterTime >= 0) {
        api.goToAndPlay(masterTime * fr, true);
      } else {
        api.play();
      }
    } else {
      api.pause();
      api.goToAndStop(0, true);
    }
  }, [playing, lottieData, getMasterTime]);

  useEffect(() => {
    syncLottiePlayback();
  }, [playing, lottieData, syncLottiePlayback]);

  useEffect(() => {
    if (!playing || !hasLottie) return;
    const forceSync = () => {
      const api = lottieRef.current;
      if (!api?.animationLoaded) return;
      const fr = Number((lottieData as Record<string, unknown> | null)?.fr) || 30;
      const masterTime = getMasterTime();
      if (!Number.isFinite(fr) || fr <= 0 || !Number.isFinite(masterTime) || masterTime < 0) return;
      api.goToAndPlay(masterTime * fr, true);
    };
    const t0 = window.setTimeout(forceSync, 0);
    const t1 = window.setTimeout(forceSync, 120);
    const t2 = window.setTimeout(forceSync, 280);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [playing, hasLottie, lottieData, getMasterTime]);

  const restart = useCallback(() => {
    if (plateVideoSrc && videoRef.current) {
      const v = videoRef.current;
      v.currentTime = 0;
      if (audioRef.current && previewAudioUrl) {
        audioRef.current.currentTime = 0;
      }
      if (hasLottie && lottieRef.current) {
        lottieRef.current.goToAndStop(0, true);
      }
      const plays: Array<Promise<unknown>> = [v.play()];
      if (audioRef.current && previewAudioUrl) plays.push(audioRef.current.play());
      void Promise.allSettled(plays).then((settled) => {
        const anyPlayed = settled.some((r) => r.status === "fulfilled");
        setPlaying(anyPlayed || hasLottie);
      });
      return;
    }
    if (previewAudioUrl && audioRef.current) {
      const a = audioRef.current;
      a.currentTime = 0;
      if (hasLottie && lottieRef.current) {
        lottieRef.current.goToAndStop(0, true);
      }
      void a
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(hasLottie));
      return;
    }
    const api = lottieRef.current;
    if (useLottie && api) {
      api.goToAndStop(0, true);
      api.play();
      setPlaying(true);
      return;
    }
    setPlaying(false);
  }, [plateVideoSrc, previewAudioUrl, useLottie, hasLottie]);

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div id="template-editor-preview" className="relative mx-auto w-full max-w-[300px] sm:max-w-[320px] lg:max-w-[360px]">
      <div className="group relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-black/10 bg-black shadow-[0_12px_40px_-8px_rgba(15,23,42,0.35)] ring-1 ring-black/5">
        {hasAudio && previewAudioUrl ? <audio ref={audioRef} src={previewAudioUrl} preload="metadata" /> : null}
        <div className="absolute inset-0 z-10 transition-opacity duration-700" style={{ overflow: "hidden" }}>
          {useIframe ? (
            <iframe
              title="Video preview"
              width="100%"
              height="100%"
              scrolling="no"
              allow="autoplay"
              src={embedUrl!}
              className="h-full w-full border-0"
            />
          ) : (useComposite || useVideo) && plateVideoSrc ? (
            <div className="relative h-full w-full bg-neutral-950">
              <video
                key={plateVideoSrc}
                ref={videoRef}
                src={plateVideoSrc}
                poster={posterSrc}
                playsInline
                preload="metadata"
                className="absolute inset-0 z-10 h-full w-full object-cover"
                muted
                aria-label={posterAlt}
              />
              {useComposite && playing ? (
                <div className="pointer-events-none absolute inset-0 z-15">
                  <Lottie
                    lottieRef={lottieRef}
                    animationData={lottieData}
                    loop
                    autoplay={false}
                    className="h-full w-full [&_svg]:mx-auto [&_svg]:max-h-full [&_svg]:w-auto"
                    onDOMLoaded={syncLottiePlayback}
                    onDataFailed={recoverLottieData}
                  />
                </div>
              ) : null}
              {!playing && (
                <button
                  type="button"
                  onClick={() => void startPlaybackFromUserGesture()}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 transition hover:bg-black/35"
                  aria-label="Play preview"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-[var(--foreground)] shadow-lg">
                    ▶
                  </span>
                </button>
              )}
            </div>
          ) : useImageComposite ? (
            <div className="relative h-full w-full bg-neutral-950">
              <Image
                src={posterSrc}
                alt={posterAlt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 320px, 360px"
                priority
              />
              {playing ? (
                <div className="pointer-events-none absolute inset-0 z-15">
                  <Lottie
                    lottieRef={lottieRef}
                    animationData={lottieData}
                    loop
                    autoplay={false}
                    className="h-full w-full [&_svg]:mx-auto [&_svg]:max-h-full [&_svg]:w-auto"
                    onDOMLoaded={syncLottiePlayback}
                    onDataFailed={recoverLottieData}
                  />
                </div>
              ) : null}
              {!playing && (
                <button
                  type="button"
                  onClick={() => void startPlaybackFromUserGesture()}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 transition hover:bg-black/35"
                  aria-label="Play preview"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-[var(--foreground)] shadow-lg">
                    ▶
                  </span>
                </button>
              )}
            </div>
          ) : useLottie ? (
            <div className="relative flex h-full w-full items-center justify-center bg-neutral-950">
              {playing ? (
                <Lottie
                  lottieRef={lottieRef}
                  animationData={lottieData}
                  loop
                  autoplay={false}
                  className="h-full w-full [&_svg]:mx-auto [&_svg]:max-h-full [&_svg]:w-auto"
                  onDOMLoaded={syncLottiePlayback}
                  onDataFailed={recoverLottieData}
                />
              ) : (
                <Image
                  src={posterSrc}
                  alt={posterAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 320px, 360px"
                  priority
                />
              )}
              {!playing && (
                <button
                  type="button"
                  onClick={() => void startPlaybackFromUserGesture()}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 transition hover:bg-black/35"
                  aria-label="Play preview"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-[var(--foreground)] shadow-lg">
                    ▶
                  </span>
                </button>
              )}
            </div>
          ) : (
            <>
              <Image
                src={posterSrc}
                alt={posterAlt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 320px, 360px"
                priority
              />
              {!playing && (
                <button
                  type="button"
                  onClick={() => void startPlaybackFromUserGesture()}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 transition hover:bg-black/35"
                  aria-label="Play preview"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-[var(--foreground)] shadow-lg">
                    ▶
                  </span>
                </button>
              )}
            </>
          )}
        </div>
        {useVideo &&
        !lottiePreviewUrl &&
        !hasLottie &&
        plateVideoSrc &&
        videoTextOverlays &&
        videoTextOverlays.length > 0 &&
        fieldValues ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[32] overflow-hidden px-1.5 font-body sm:px-2"
            style={{ bottom: "3.25rem" }}
          >
            {videoTextOverlays.map((o) => (
              <div key={o.field} style={overlayStyle(o)}>
                {fieldValues[o.field] ?? ""}
              </div>
            ))}
          </div>
        ) : null}
        <div
          className="pointer-events-none absolute inset-0 z-30"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.08)", mixBlendMode: "soft-light" }}
        />
        <div className="pointer-events-none absolute right-1 top-1 z-[55] hidden select-none opacity-80 lg:block">
          <Image src="/logo/logo.svg" alt="" width={36} height={36} className="h-8 w-auto object-contain" />
        </div>
        <div className="pointer-events-none absolute bottom-16 left-4 z-50 rounded-full bg-black/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white">
          Preview: low quality
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-50 flex items-center gap-2 bg-black/60 px-2 py-2 text-xs text-white">
          <button type="button" className="px-1 hover:text-white/90" onClick={restart} aria-label="Restart preview">
            ↺
          </button>
          <button
            type="button"
            className="px-1 hover:text-white/90"
            onClick={() => void togglePlaybackFromUserGesture()}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <span className="tabular-nums text-white/80">
            {useVideo || useComposite || hasAudio ? formatTime(currentTime) : "00:00"}
          </span>
          <div className="h-1 flex-1 rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-150"
              style={{ width: `${useVideo || useComposite || hasAudio ? progressPct : 33}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
