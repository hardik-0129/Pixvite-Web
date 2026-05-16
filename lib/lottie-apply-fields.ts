import type { FormField } from "@/lib/templates";

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

  const candidates = [level0, level1, level2];
  for (const candidate of candidates) {
    const probeUrl = joinUrl(candidate, probe);
    try {
      const head = await fetch(probeUrl, { method: "HEAD" });
      if (head.ok) return candidate;
      const get = await fetch(probeUrl, { method: "GET" });
      if (get.ok) return candidate;
    } catch {
      // Try next candidate.
    }
  }
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
export function isSafeLottieAnimationData(data: unknown): boolean {
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

/** Fetch Lottie JSON from URL and rewrite asset `u` paths like the live preview. */
export async function fetchLottieJsonRewritten(lottiePreviewUrl: string): Promise<unknown> {
  const res = await fetch(lottiePreviewUrl);
  if (!res.ok) throw new Error(`Could not load Lottie JSON (${res.status})`);
  const d = (await res.json()) as unknown;
  const resolvedBase = await resolveAssetBase(lottiePreviewUrl, d);
  return resolvedBase ? rewriteAssetBase(d, resolvedBase) : d;
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

/**
 * Derive a usable JSON text path from legacy sourcePath formats written by
 * older versions of extractLottieEditableFields.
 *   "layers[N].text"  →  "layers[N].t.d.k[0].s.t"
 * Returns null when the format is not recognised.
 */
function deriveLegacyTextPath(sourcePath: string): string | null {
  const m = sourcePath.match(/^((?:layers|assets\[\d+\]\.layers)\[\d+\])\.text$/);
  if (m) return `${m[1]}.t.d.k[0].s.t`;
  return null;
}

export function applyFieldValuesToLottie(
  baseData: unknown,
  formFields: FormField[] | undefined,
  values: Record<string, string> | undefined
): unknown {
  if (!baseData || typeof baseData !== "object" || !formFields || !values) return baseData;
  const next = deepClone(baseData) as Record<string, unknown>;
  // Remove embedded glyph outlines so lottie-web falls back to the system
  // font for rendering. Without this, only the characters whose vector paths
  // were baked into the Lottie export (the `chars` array) can be rendered,
  // which means any character not in that set is invisible when typed.
  if (Array.isArray(next.chars) && next.chars.length > 0) {
    next.chars = [];
  }
  applyImageFieldValuesToLottie(next, formFields, values);

  // ── Value-matching fallback ──────────────────────────────────────────────
  // Collect every text path in the Lottie (in traversal order, which matches
  // the order fields were extracted). Then for each unique default-value
  // group, assign text paths to form fields POSITIONALLY so that non-unique
  // values like "&" (appearing multiple times) still map correctly.
  const textPaths = collectTextLeafPaths(next);

  // Build a map: normalizedDefaultValue → ordered list of matching text paths
  const pathsByNormDv = new Map<string, string[]>();
  textPaths.forEach((p) => {
    const cur = getByPath(next, p);
    if (typeof cur !== "string") return;
    const key = normalizeTextForCompare(cur);
    if (!key) return;
    const arr = pathsByNormDv.get(key) ?? [];
    arr.push(p);
    pathsByNormDv.set(key, arr);
  });

  // Track how many times we've claimed a path for each defaultValue bucket.
  const dvPickCursor = new Map<string, number>();

  // For each text formField, derive the fallback path using positional pick.
  const fallbackPathByField = new Map<string, string>();
  formFields.forEach((f) => {
    if ((f.type ?? "text") === "image") return;
    const dv = normalizeTextForCompare(String(f.defaultValue ?? ""));
    if (!dv) return;
    const paths = pathsByNormDv.get(dv);
    if (!paths || paths.length === 0) return;
    const cursor = dvPickCursor.get(dv) ?? 0;
    if (cursor < paths.length) {
      fallbackPathByField.set(f.name, paths[cursor]);
      dvPickCursor.set(dv, cursor + 1);
    }
  });

  // ── Apply each changed field ─────────────────────────────────────────────
  formFields.forEach((f) => {
    if ((f.type ?? "text") === "image") return;
    const nextValue = values[f.name];
    if (typeof nextValue !== "string") return;
    if (nextValue.trim() === "") return;
    const defaultValue = String(f.defaultValue ?? "");
    if (normalizeTextForCompare(nextValue) === normalizeTextForCompare(defaultValue)) return;
    const lottieValue = toLottieTextValue(nextValue);

    // 1. Direct path — correct format: sourcePath ends with .t.d.k[N].s.t
    if (f.sourcePath?.includes(".t.d.k[0].s.t") && setAllTextKeyframesBySourcePath(next, f.sourcePath, lottieValue)) {
      return;
    }

    // 2. Legacy backward-compat — old format: "layers[N].text" / "assets[X].layers[N].text"
    const legacyPath = deriveLegacyTextPath(f.sourcePath ?? "");
    if (legacyPath && setAllTextKeyframesByLeafPath(next, legacyPath, lottieValue)) {
      return;
    }

    // 3. Positional value-matching fallback — works for any sourcePath format,
    //    including non-unique values like "&" through group-positional assignment.
    const fallbackPath = fallbackPathByField.get(f.name);
    if (fallbackPath && setAllTextKeyframesByLeafPath(next, fallbackPath, lottieValue)) {
      return;
    }
  });

  return next;
}

export async function buildEditedLottieForDownload(
  lottiePreviewUrl: string,
  formFields: FormField[],
  fieldValues: Record<string, string>
): Promise<unknown> {
  const base = await fetchLottieJsonRewritten(lottiePreviewUrl);
  return applyFieldValuesToLottie(base, formFields, fieldValues);
}
