/**
 * Lottie (+ optional plate MP4 + optional audio) → MP4
 * Pipeline: optional ZIP extract → static file server → Puppeteer frame capture (JPEG stills) → FFmpeg mux.
 *
 * Env:
 *   PORT (default 3847)
 *   RENDER_SECRET — if set, require header X-Render-Secret or body field renderSecret
 *   ALLOW_FETCH_HOSTS — comma-separated hostnames allowed for plateVideoUrl / audioUrl downloads (empty = allow all, dev only)
 *   RENDER_LOG_FRAME_STEP — log frame progress every N frames (default 30; set 1 for every frame)
 *   RENDER_JPEG_QUALITY — 0.5…1 still-frame quality passed to canvas.toDataURL (default 0.94)
 *   RENDER_FORCE_SOFTWARE_RASTER — set to "1" to add --disable-gpu (legacy; default uses GPU raster)
 *   RENDER_PROTOCOL_TIMEOUT_MS — CDP wait for long `evaluate` calls (omit or "0": no limit; Puppeteer default 180000)
 *   MAX_CONCURRENT_RENDERS — max jobs processed at once (default 1, extra requests get 429)
 *   MAX_BROWSER_INSTANCES — hard cap for live puppeteer instances (default = MAX_CONCURRENT_RENDERS)
 *   RENDER_CAPTURE_MODE — "auto" (default), "canvas" (fast), or "stage" (slow, exact browser screenshot)
 *   RENDER_LOTTIE_RENDERER — "canvas" (default) or "svg" (matches website preview; usually slower)
 *   RENDER_ENGINE — "remotion" (default) or "browser"
 *
 * Async jobs: POST /render returns 202 { jobId, rid }. Poll GET /render/jobs/:jobId (same auth as POST),
 * then GET /render/jobs/:jobId/file for the MP4. When RENDER_SECRET is set, use header X-Render-Secret
 * or query ?secret= on GET.
 *
 * Same-origin /__asset proxy: the Puppeteer page is served from 127.0.0.1:randomPort. Lottie image/font
 * URLs pointing at localhost:3000 are rewritten to /__asset?u=… (CORS). Plate video is **not** proxied:
 * it is downloaded once to disk (same URL the web app uses) and served as /plate.* from the job static
 * server so <video> seeks do not hammer /__asset (avoids net::ERR_ABORTED on Range requests).
 */

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const { Readable } = require("stream");
const { randomUUID } = require("crypto");
const runRenderPipeline = require("./render-pipeline");
const runRemotionPipeline = require("./render-pipeline-remotion");

const MAX_EXPORT_SECONDS = 380;
const DEFAULT_PORT = Number(process.env.PORT) || 3847;
const RENDER_SECRET = (process.env.RENDER_SECRET || "").trim();
const ALLOW_FETCH_HOSTS = (process.env.ALLOW_FETCH_HOSTS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

/** Every Nth frame log progress (1 = log every frame; 30 = ~1/sec at 30fps). */
const FRAME_LOG_STEP = Math.max(1, Number(process.env.RENDER_LOG_FRAME_STEP) || 30);
const MAX_CONCURRENT_RENDERS = Math.max(1, Number(process.env.MAX_CONCURRENT_RENDERS) || 1);
const MAX_BROWSER_INSTANCES = Math.max(1, Number(process.env.MAX_BROWSER_INSTANCES) || MAX_CONCURRENT_RENDERS);
const DEFAULT_RENDER_ENGINE = (process.env.RENDER_ENGINE || "remotion").trim().toLowerCase() === "browser" ? "browser" : "remotion";

function ts() {
  return new Date().toISOString();
}

function shortUrl(u, max = 96) {
  if (!u || typeof u !== "string") return "(none)";
  const t = u.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function log(rid, ...parts) {
  const id = rid ? `[${rid}]` : "[—]";
  console.log(`[render ${ts()}] ${id}`, ...parts);
}

function assertFetchUrl(urlStr, label) {
  let u;
  try {
    u = new URL(urlStr);
  } catch {
    throw new Error(`Invalid ${label} URL`);
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error(`Invalid ${label} protocol`);
  }
  if (ALLOW_FETCH_HOSTS.length && !ALLOW_FETCH_HOSTS.includes(u.hostname.toLowerCase())) {
    throw new Error(`${label} host not allowed: ${u.hostname}`);
  }
}

async function downloadToFile(urlStr, destPath, label) {
  assertFetchUrl(urlStr, label);
  const res = await fetch(urlStr, { redirect: "follow" });
  if (!res.ok) throw new Error(`Could not download ${label} (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fsp.writeFile(destPath, buf);
}

/** Local filename under jobDir for the plate video (same bytes as storefront `src`, one Node fetch). */
function plateLocalFilename(plateVideoUrl) {
  try {
    const ext = path.extname(new URL(plateVideoUrl).pathname).toLowerCase();
    if ([".mp4", ".webm", ".mov", ".m4v"].includes(ext)) return `plate${ext}`;
  } catch {
    /* ignore */
  }
  return "plate.mp4";
}

function findFileByExt(dir, ext) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of entries) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      const inner = findFileByExt(full, ext);
      if (inner) return inner;
    } else if (f.name.toLowerCase().endsWith(ext.toLowerCase())) {
      return full;
    }
  }
  return null;
}

/** Join Lottie asset `u` + `p` into one URL when `p` is not already absolute. */
function joinAssetUrl(u, p) {
  const us = typeof u === "string" ? u : "";
  const ps = typeof p === "string" ? p : "";
  if (!ps) return null;
  if (/^https?:\/\//i.test(ps)) return ps;
  if (/^https?:\/\//i.test(us)) {
    return `${us.replace(/\/?$/, "/")}${ps.replace(/^\//, "")}`;
  }
  return null;
}

/** Same-origin URL so the Puppeteer page (on 127.0.0.1:jobPort) avoids CORS vs localhost:3000. */
function toProxyAssetUrl(absoluteUrl, proxyBaseUrl) {
  assertFetchUrl(absoluteUrl, "proxy target");
  const base = proxyBaseUrl.endsWith("/") ? proxyBaseUrl.slice(0, -1) : proxyBaseUrl;
  return `${base}/__asset?u=${encodeURIComponent(absoluteUrl)}`;
}

/**
 * Rewrite http(s) raster/font paths to /__asset?u=… on the local static origin.
 */
function rewriteLottieJsonForSameOriginProxy(lottieJson, proxyBaseUrl) {
  const clone = JSON.parse(JSON.stringify(lottieJson));
  const assets = clone.assets;
  if (Array.isArray(assets)) {
    for (const a of assets) {
      if (!a || typeof a !== "object") continue;
      const full = joinAssetUrl(a.u, a.p);
      if (full && /^https?:\/\//i.test(full)) {
        a.u = "";
        a.p = toProxyAssetUrl(full, proxyBaseUrl);
      }
    }
  }
  const fontList = clone.fonts && clone.fonts.list;
  if (Array.isArray(fontList)) {
    for (const f of fontList) {
      if (!f || typeof f !== "object") continue;
      const fp = f.fPath;
      if (typeof fp === "string" && /^https?:\/\//i.test(fp)) {
        f.fPath = toProxyAssetUrl(fp, proxyBaseUrl);
      }
    }
  }
  return clone;
}

function startStaticServer(rootDir, rid) {
  const mini = express();
  mini.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });

  mini.get("/favicon.ico", (_req, res) => {
    res.status(204).end();
  });

  mini.get("/__asset", async (req, res) => {
    const raw = req.query.u;
    if (typeof raw !== "string" || !raw.trim()) {
      res.status(400).send("missing u");
      return;
    }
    let target;
    try {
      target = decodeURIComponent(raw);
    } catch {
      res.status(400).send("bad u");
      return;
    }
    try {
      assertFetchUrl(target, "proxy");
    } catch (e) {
      log(rid, "__asset reject", e?.message || e);
      res.status(403).send("forbidden");
      return;
    }
    try {
      const upstreamHeaders = {};
      const range = req.headers.range;
      if (range) upstreamHeaders.Range = range;
      const upstream = await fetch(target, { headers: upstreamHeaders, redirect: "follow" });
      const ct = upstream.headers.get("content-type") || "application/octet-stream";
      res.status(upstream.status);
      res.setHeader("Content-Type", ct);
      res.setHeader("Access-Control-Allow-Origin", "*");
      ["accept-ranges", "content-range", "content-length", "cache-control"].forEach((name) => {
        const v = upstream.headers.get(name);
        if (v) res.setHeader(name, v);
      });
      if (upstream.body && typeof Readable.fromWeb === "function") {
        await new Promise((resolve, reject) => {
          Readable.fromWeb(upstream.body)
            .on("error", reject)
            .pipe(res)
            .on("finish", resolve)
            .on("error", reject);
        });
      } else {
        const buf = Buffer.from(await upstream.arrayBuffer());
        res.send(buf);
      }
    } catch (e) {
      log(rid, "__asset fetch error", shortUrl(target), e?.message || e);
      if (!res.headersSent) res.status(502).send("bad gateway");
    }
  });

  mini.use(express.static(rootDir));
  return new Promise((resolve, reject) => {
    const s = mini.listen(0, "127.0.0.1", () => {
      const addr = s.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({ server: s, port, baseUrl: `http://127.0.0.1:${port}/` });
    });
    s.on("error", reject);
  });
}

async function runFfmpeg({ rid, framesDir, fps, audioPath, outputMp4, durationSec }) {
  const t0 = Date.now();
  const dur =
    typeof durationSec === "number" && durationSec > 0 ? durationSec : Number(durationSec) || 1;

  await new Promise((resolve, reject) => {
    let cmd = ffmpeg()
      .input(path.join(framesDir, "frame%05d.jpeg"))
      .inputFPS(fps)
      .videoCodec("libx264")
      .outputOptions([
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-preset",
        "fast",
        "-t",
        dur.toFixed(6),
      ]);

    /**
     * Do not use `-shortest`: template music tracks are often shorter than the full Lottie
     * timeline, which previously trimmed the exported video to audio length (~15s vs full comp).
     */
    if (audioPath && fs.existsSync(audioPath)) {
      cmd = cmd.input(audioPath).audioCodec("aac");
    }

    cmd
      .output(outputMp4)
      .on("start", (cmdLine) => {
        log(rid, "ffmpeg start:", cmdLine);
      })
      .on("end", () => {
        log(rid, "ffmpeg done", { ms: Date.now() - t0, output: outputMp4 });
        resolve();
      })
      .on("error", (err) => {
        log(rid, "ffmpeg error:", err?.message || err);
        reject(err);
      })
      .run();
  });
}

function checkSecret(req) {
  if (!RENDER_SECRET) return true;
  const h = (req.get("X-Render-Secret") || "").trim();
  const b = req.body && typeof req.body.renderSecret === "string" ? req.body.renderSecret.trim() : "";
  const q = typeof req.query?.secret === "string" ? req.query.secret.trim() : "";
  return h === RENDER_SECRET || b === RENDER_SECRET || q === RENDER_SECRET;
}

const jobs = new Map();
const activeBrowsers = new Map();

function activeRenderCount() {
  let n = 0;
  for (const j of jobs.values()) {
    if (!j.done) n += 1;
  }
  return n;
}

function activeBrowserCount() {
  return activeBrowsers.size;
}

async function closeOrphanBrowsers() {
  if (activeRenderCount() > 0) return;
  if (!activeBrowsers.size) return;
  const stale = Array.from(activeBrowsers.entries());
  for (const [id, b] of stale) {
    try {
      if (b && typeof b.close === "function") await b.close();
    } catch {
      /* ignore */
    } finally {
      activeBrowsers.delete(id);
    }
  }
}

function registerBrowser(jobId, browser) {
  if (!browser) return true;
  if (activeBrowsers.size >= MAX_BROWSER_INSTANCES) return false;
  activeBrowsers.set(jobId, browser);
  return true;
}

function unregisterBrowser(jobId) {
  activeBrowsers.delete(jobId);
}

function jobPatch(jobId, patch) {
  const j = jobs.get(jobId);
  if (!j) return;
  Object.assign(j, patch);
}

function createJob(jobId, rid) {
  jobs.set(jobId, {
    rid,
    phase: "queued",
    progress: 0,
    done: false,
    error: null,
    outputPath: null,
    jobDir: null,
    engine: DEFAULT_RENDER_ENGINE,
  });
}

function normalizeRenderEngine(raw) {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (v === "browser") return "browser";
  return "remotion";
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "80mb" }));

app.use((req, _res, next) => {
  if (req.method === "GET" && (req.path === "/health" || req.path.startsWith("/render/jobs/"))) {
    next();
    return;
  }
  log("", `${req.method} ${req.path}`, {
    ip: req.ip || req.socket?.remoteAddress,
    ua: (req.get("user-agent") || "").slice(0, 80),
  });
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/render/jobs/:jobId/file", async (req, res) => {
  if (!checkSecret(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  if (!job || !job.done) {
    res.status(409).json({ error: "Job not ready" });
    return;
  }
  if (job.error) {
    res.status(500).json({ error: job.error });
    return;
  }
  const outputMp4 = job.outputPath;
  if (!outputMp4 || !fs.existsSync(outputMp4)) {
    res.status(404).json({ error: "Output missing" });
    return;
  }
  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Disposition", 'attachment; filename="export.mp4"');
  const stream = fs.createReadStream(outputMp4);
  let cleaned = false;
  const cleanupOnce = async () => {
    if (cleaned) return;
    cleaned = true;
    const dir = job.jobDir;
    if (dir) {
      try {
        await fsp.rm(dir, { recursive: true, force: true });
        log(job.rid, "job file delivered; jobDir removed");
      } catch (e) {
        log(job.rid, "jobDir cleanup warn", e?.message || e);
      }
    }
    jobs.delete(jobId);
  };
  stream.on("error", (e) => {
    log(job.rid, "file stream error", e?.message || e);
    if (!res.headersSent) res.status(500).end();
    void cleanupOnce();
  });
  res.on("close", () => {
    void cleanupOnce();
  });
  stream.pipe(res);
});

app.get("/render/jobs/:jobId", (req, res) => {
  if (!checkSecret(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Unknown job" });
    return;
  }
  const body = {
    rid: job.rid,
    engine: job.engine || "browser",
    phase: job.phase,
    progress: job.progress,
    done: job.done,
    error: job.error,
  };
  if (job.done && job.error) {
    jobs.delete(req.params.jobId);
  }
  res.json(body);
});

/**
 * Multipart:
 * - Remotion/browser engines: animationData (JSON string), optional zip buffer, plateVideoUrl,
 *   audioUrl, previewFontUrls (JSON array string), renderSecret
 *
 * Returns 202 { jobId, rid } — poll GET /render/jobs/:jobId, then GET …/file for MP4.
 */
app.post("/render", upload.single("zip"), async (req, res) => {
  const rid = randomUUID().slice(0, 8);
  const authed = checkSecret(req);
  log(rid, "POST /render body", {
    authed,
    hasSecretHeader: Boolean((req.get("X-Render-Secret") || "").trim()),
    hasZip: Boolean(req.file?.buffer),
    zipBytes: req.file?.size ?? 0,
    contentLength: req.get("content-length"),
  });

  if (!authed) {
    log(rid, "reject 401 unauthorized");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const renderEngine = normalizeRenderEngine(req.body?.renderEngine || DEFAULT_RENDER_ENGINE);

  const rawAnim = req.body?.animationData;
  let lottieJson = null;
  if (renderEngine === "browser" || renderEngine === "remotion") {
    if (!rawAnim || typeof rawAnim !== "string") {
      log(rid, "reject 400 missing animationData");
      res.status(400).json({ error: "Missing animationData (JSON string)" });
      return;
    }
    try {
      lottieJson = JSON.parse(rawAnim);
    } catch (e) {
      log(rid, "reject 400 invalid JSON", e?.message || e);
      res.status(400).json({ error: "animationData is not valid JSON" });
      return;
    }
  }

  const w = lottieJson ? Number(lottieJson.w) || 1080 : 1080;
  const h = lottieJson ? Number(lottieJson.h) || 1920 : 1920;
  const fr = lottieJson ? Number(lottieJson.fr) || 30 : 30;
  const ip = lottieJson && Number.isFinite(Number(lottieJson.ip)) ? Number(lottieJson.ip) : 0;
  const op = lottieJson && Number.isFinite(Number(lottieJson.op)) ? Number(lottieJson.op) : ip + fr * 10 - 1;
  const totalFrames = Math.max(1, Math.floor(op - ip + 1));
  const maxFrames = Math.min(totalFrames, Math.floor(MAX_EXPORT_SECONDS * fr));

  const plateVideoUrl = typeof req.body.plateVideoUrl === "string" ? req.body.plateVideoUrl.trim() : "";
  const audioUrl = typeof req.body.audioUrl === "string" ? req.body.audioUrl.trim() : "";

  let previewFontUrls = [];
  if (typeof req.body.previewFontUrls === "string" && req.body.previewFontUrls.trim()) {
    try {
      previewFontUrls = JSON.parse(req.body.previewFontUrls);
    } catch {
      previewFontUrls = [];
    }
  }
  if (!Array.isArray(previewFontUrls)) previewFontUrls = [];

  await closeOrphanBrowsers();

  const active = activeRenderCount();
  if (active >= MAX_CONCURRENT_RENDERS) {
    log(rid, "reject 429 busy", { active, max: MAX_CONCURRENT_RENDERS });
    res.setHeader("Retry-After", "10");
    res.status(429).json({
      error: "Render server is busy. Please wait and retry.",
      activeRenders: active,
      maxConcurrentRenders: MAX_CONCURRENT_RENDERS,
    });
    return;
  }

  const jobId = randomUUID();
  const zipBuffer = req.file?.buffer ? Buffer.from(req.file.buffer) : null;
  const hasZip = Boolean(zipBuffer && zipBuffer.length);
  log(rid, "job accepted (async)", {
    jobId,
    engine: renderEngine,
    jsonChars: typeof rawAnim === "string" ? rawAnim.length : 0,
    comp: { w, h, fr, ip, op, totalFrames, maxFrames },
    plate: shortUrl(plateVideoUrl),
    audio: shortUrl(audioUrl),
    fontCount: previewFontUrls.length,
  });

  createJob(jobId, rid);
  jobPatch(jobId, { engine: renderEngine });

  const payload = {
    lottieJson,
    w,
    h,
    fr,
    ip,
    op,
    totalFrames,
    maxFrames,
    plateVideoUrl,
    audioUrl,
    previewFontUrls,
    zipBuffer,
    hasZip,
    rawAnimLength: typeof rawAnim === "string" ? rawAnim.length : 0,
    renderEngine,
  };

  const ctx = {
    jobId,
    rid,
    jobPatch,
    log,
    shortUrl,
    startStaticServer,
    rewriteLottieJsonForSameOriginProxy,
    toProxyAssetUrl,
    downloadToFile,
    findFileByExt,
    plateLocalFilename,
    registerBrowser,
    unregisterBrowser,
    runFfmpeg,
    FRAME_LOG_STEP,
    payload,
  };

  res.status(202).json({ jobId, rid });

  setImmediate(() => {
    const runner = renderEngine === "remotion" ? runRemotionPipeline : runRenderPipeline;
    runner(ctx).catch((e) => {
      console.error(e);
      jobPatch(jobId, {
        done: true,
        error: e instanceof Error ? e.message : String(e),
        phase: "error",
        progress: 0,
      });
    });
  });
});

app.listen(DEFAULT_PORT, () => {
  log("", "listening", { url: `http://127.0.0.1:${DEFAULT_PORT}`, frameLogStep: FRAME_LOG_STEP });
  log("", "MAX_CONCURRENT_RENDERS", MAX_CONCURRENT_RENDERS);
  log("", "MAX_BROWSER_INSTANCES", MAX_BROWSER_INSTANCES);
  log("", "RENDER_ENGINE default", DEFAULT_RENDER_ENGINE);
  if (RENDER_SECRET) log("", "RENDER_SECRET is set (X-Render-Secret, body renderSecret, or GET ?secret=)");
  if (ALLOW_FETCH_HOSTS.length) log("", "ALLOW_FETCH_HOSTS", ALLOW_FETCH_HOSTS.join(", "));
  log("", "tip: set RENDER_LOG_FRAME_STEP=1 to log every captured frame");
});
