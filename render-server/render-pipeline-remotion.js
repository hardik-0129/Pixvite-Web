"use strict";

const path = require("path");
const os = require("os");
const fsp = require("fs/promises");
const AdmZip = require("adm-zip");
const { bundle } = require("@remotion/bundler");
const { selectComposition, renderMedia } = require("@remotion/renderer");

let cachedServeUrlPromise = null;

function inferTemplateJsonBase(urlStr) {
  if (typeof urlStr !== "string" || !/^https?:\/\//i.test(urlStr.trim())) return "";
  try {
    const u = new URL(urlStr.trim());
    const idx = u.pathname.toLowerCase().lastIndexOf("/json/");
    if (idx >= 0) {
      u.pathname = `${u.pathname.slice(0, idx + 6)}`;
      u.search = "";
      u.hash = "";
      return u.toString();
    }
    u.pathname = `${u.pathname.replace(/\/[^/]*$/, "/")}`;
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return "";
  }
}

function buildInferredFontUrls(lottieJson, jsonBaseUrl) {
  if (!jsonBaseUrl) return [];
  const list = Array.isArray(lottieJson?.fonts?.list) ? lottieJson.fonts.list : [];
  const exts = [".ttf", ".otf", ".woff2", ".woff"];
  const urls = [];
  for (const f of list) {
    if (!f || typeof f !== "object") continue;
    const fName = typeof f.fName === "string" ? f.fName.trim() : "";
    if (!fName) continue;
    for (const ext of exts) {
      try {
        urls.push(new URL(`Fonts/${encodeURIComponent(fName)}${ext}`, jsonBaseUrl).toString());
      } catch {
        // ignore invalid URL joins
      }
    }
  }
  return [...new Set(urls)];
}

async function getServeUrl(log, rid) {
  if (cachedServeUrlPromise) return cachedServeUrlPromise;
  const entryPoint = path.join(__dirname, "remotion-src", "index.jsx");
  cachedServeUrlPromise = bundle({
    entryPoint,
    onProgress: () => undefined,
  });
  const serveUrl = await cachedServeUrlPromise;
  log(rid, "remotion bundle ready", serveUrl);
  return serveUrl;
}

module.exports = async function runRemotionPipeline(ctx) {
  const { jobId, rid, jobPatch, log, payload, startStaticServer, rewriteLottieJsonForSameOriginProxy, toProxyAssetUrl } = ctx;
  const { lottieJson, w, h, fr, maxFrames, plateVideoUrl, audioUrl, previewFontUrls, zipBuffer, hasZip } = payload;
  const targetWidth = Math.max(2, Number(process.env.REMOTION_OUTPUT_WIDTH) || w || 1080);
  const targetHeight = Math.max(2, Number(process.env.REMOTION_OUTPUT_HEIGHT) || h || 1920);
  const targetCrf = Math.max(10, Math.min(28, Number(process.env.REMOTION_CRF) || 18));
  let jobDir = "";
  let staticServer = null;
  try {
    jobPatch(jobId, { phase: "prepare", progress: 0.03 });
    jobDir = path.join(os.tmpdir(), `pixvite-render-${jobId}`);
    await fsp.mkdir(jobDir, { recursive: true });

    if (!lottieJson || typeof lottieJson !== "object") {
      throw new Error("Missing animationData for remotion render.");
    }

    if (hasZip && zipBuffer?.length) {
      log(rid, "remotion zip extract", { bytes: zipBuffer.length });
      const zip = new AdmZip(zipBuffer);
      zip.extractAllTo(jobDir, true);
      log(rid, "remotion zip extract done");
    } else {
      log(rid, "remotion no zip (remote assets only)");
    }

    jobPatch(jobId, { phase: "assets", progress: 0.08 });
    staticServer = await startStaticServer(jobDir, rid);
    const proxyBaseUrl = staticServer.baseUrl;
    const safeLottieJson = rewriteLottieJsonForSameOriginProxy(lottieJson, proxyBaseUrl);

    const jsonBaseFromPlate = inferTemplateJsonBase(plateVideoUrl || "");
    const incomingPreviewFonts = Array.isArray(previewFontUrls) ? previewFontUrls : [];
    const inferredFontUrls = incomingPreviewFonts.length === 0
      ? buildInferredFontUrls(safeLottieJson, jsonBaseFromPlate)
      : [];
    const mergedPreviewFontUrls = [...incomingPreviewFonts, ...inferredFontUrls];
    if (Array.isArray(safeLottieJson?.fonts?.list)) {
      for (const f of safeLottieJson.fonts.list) {
        if (!f || typeof f !== "object") continue;
        const fp = typeof f.fPath === "string" ? f.fPath.trim() : "";
        const fName = typeof f.fName === "string" ? f.fName.trim() : "";

        if (!fp) {
          if (fName) {
            const match = mergedPreviewFontUrls.find(
              (u) => typeof u === "string" && u.toLowerCase().includes(fName.toLowerCase())
            );
            if (match) {
              f.fPath = match;
              continue;
            }
          }
          continue;
        }

        // Enforce URL/API font sources only: do not map relative font paths to local static files.
        if (!/^https?:\/\//i.test(fp)) {
          if (jsonBaseFromPlate) {
            try {
              f.fPath = new URL(fp, jsonBaseFromPlate).toString();
              continue;
            } catch {
              // try matching by fName next
            }
          }
          if (fName) {
            const match = mergedPreviewFontUrls.find(
              (u) => typeof u === "string" && u.toLowerCase().includes(fName.toLowerCase())
            );
            if (match) {
              f.fPath = match;
              continue;
            }
          }
          f.fPath = "";
          continue;
        }
      }
    }
    if (Array.isArray(safeLottieJson?.fonts?.list)) {
      for (const f of safeLottieJson.fonts.list) {
        if (!f || typeof f !== "object") continue;
        const fp = typeof f.fPath === "string" ? f.fPath.trim() : "";
        if (!/^https?:\/\//i.test(fp)) continue;
        f.fPath = toProxyAssetUrl(fp, proxyBaseUrl);
      }
    }
    const proxiedPlateVideoUrl =
      typeof plateVideoUrl === "string" && /^https?:\/\//i.test(plateVideoUrl.trim())
        ? toProxyAssetUrl(plateVideoUrl.trim(), proxyBaseUrl)
        : plateVideoUrl || "";
    const proxiedAudioUrl =
      typeof audioUrl === "string" && /^https?:\/\//i.test(audioUrl.trim())
        ? toProxyAssetUrl(audioUrl.trim(), proxyBaseUrl)
        : audioUrl || "";
    const proxiedPreviewFontUrls = Array.isArray(mergedPreviewFontUrls)
      ? mergedPreviewFontUrls
          .filter((u) => typeof u === "string" && /^https?:\/\//i.test(u.trim()))
          .map((u) => toProxyAssetUrl(u.trim(), proxyBaseUrl))
      : [];

    jobPatch(jobId, { phase: "bundle", progress: 0.1 });
    const serveUrl = await getServeUrl(log, rid);

    const inputProps = {
      width: targetWidth,
      height: targetHeight,
      fps: fr,
      maxFrames,
      animationData: safeLottieJson,
      plateVideoUrl: proxiedPlateVideoUrl,
      audioUrl: proxiedAudioUrl,
      previewFontUrls: proxiedPreviewFontUrls,
    };

    jobPatch(jobId, { phase: "composition", progress: 0.16 });
    const composition = await selectComposition({
      serveUrl,
      id: "PixviteLottieMp4",
      inputProps,
    });

    const outputMp4 = path.join(jobDir, "output.mp4");
    jobPatch(jobId, { phase: "render", progress: 0.2 });
    let lastLogPct = -1;
    await renderMedia({
      serveUrl,
      composition,
      codec: "h264",
      crf: targetCrf,
      outputLocation: outputMp4,
      inputProps,
      frameRange: [0, Math.max(0, maxFrames - 1)],
      onBrowserLog: (browserLog) => {
        const txt = typeof browserLog?.text === "string" ? browserLog.text : JSON.stringify(browserLog);
        if (typeof txt === "string" && txt.includes("[font-debug]")) {
          log(rid, txt);
        }
      },
      onProgress: ({ progress }) => {
        const p = 0.2 + Math.min(1, Math.max(0, Number(progress) || 0)) * 0.78;
        jobPatch(jobId, { phase: "render", progress: p });
        const pct = Math.round((Number(progress) || 0) * 100);
        if (pct >= 0 && pct <= 100 && (pct === 100 || pct - lastLogPct >= 5)) {
          lastLogPct = pct;
          log(rid, "remotion render progress", `${pct}%`);
        }
      },
    });

    jobPatch(jobId, {
      phase: "done",
      progress: 1,
      done: true,
      error: null,
      outputPath: outputMp4,
      jobDir,
    });
    log(rid, "remotion job complete", { jobId, output: outputMp4 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Remotion render failed";
    jobPatch(jobId, { done: true, error: msg, phase: "error", progress: 0 });
    log(rid, "remotion job failed", msg);
    if (jobDir) {
      try {
        await fsp.rm(jobDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup issues
      }
    }
  } finally {
    if (staticServer && staticServer.server) {
      try {
        await new Promise((resolve) => staticServer.server.close(() => resolve()));
      } catch {
        // ignore close issues
      }
    }
  }
};
