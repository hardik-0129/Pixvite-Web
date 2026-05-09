"use strict";

const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const puppeteer = require("puppeteer");
const AdmZip = require("adm-zip");
const preloadLottieTemplateFontsInPage = require("./font-preload-browser");

function collectAssetLayersById(animationData) {
  const map = new Map();
  if (!animationData || typeof animationData !== "object") return map;
  const assets = Array.isArray(animationData.assets) ? animationData.assets : [];
  for (const a of assets) {
    if (!a || typeof a !== "object") continue;
    if (typeof a.id !== "string") continue;
    const layers = Array.isArray(a.layers) ? a.layers : [];
    map.set(a.id, layers);
  }
  return map;
}

function analyzeCanvasRisk(animationData) {
  const reasons = new Set();
  const assetLayers = collectAssetLayersById(animationData);
  const seenComps = new Set();

  function visitLayers(layers) {
    if (!Array.isArray(layers)) return;
    for (const l of layers) {
      if (!l || typeof l !== "object") continue;
      if (Array.isArray(l.masksProperties) && l.masksProperties.length) reasons.add("masks");
      if (typeof l.tt === "number" && l.tt > 0) reasons.add("track-matte");
      if (typeof l.td === "number" && l.td > 0) reasons.add("matte-destination");
      if (Array.isArray(l.ef) && l.ef.length) reasons.add("effects");
      if (l.ty === 5) reasons.add("text");
      if (l.ty === 4 && Array.isArray(l.shapes)) {
        for (const s of l.shapes) {
          if (!s || typeof s !== "object") continue;
          if (s.ty === "gf" || s.ty === "gs") reasons.add("gradient");
          if (s.ty === "tm") reasons.add("trim-path");
          if (s.ty === "rp") reasons.add("repeater");
        }
      }
      if (l.ty === 0 && typeof l.refId === "string") {
        const key = l.refId;
        if (seenComps.has(key)) continue;
        seenComps.add(key);
        visitLayers(assetLayers.get(key));
      }
    }
  }

  visitLayers(Array.isArray(animationData.layers) ? animationData.layers : []);
  return { risky: reasons.size > 0, reasons: Array.from(reasons) };
}

/**
 * @param {object} ctx
 * @param {string} ctx.jobId
 * @param {string} ctx.rid
 * @param {function} ctx.jobPatch
 * @param {function} ctx.log
 * @param {function} ctx.shortUrl
 * @param {function} ctx.startStaticServer
 * @param {function} ctx.rewriteLottieJsonForSameOriginProxy
 * @param {function} ctx.toProxyAssetUrl — absolute storefront URL → job /__asset?u=…
 * @param {function} ctx.downloadToFile
 * @param {function} ctx.findFileByExt
 * @param {function} ctx.plateLocalFilename
 * @param {function} ctx.registerBrowser
 * @param {function} ctx.unregisterBrowser
 * @param {function} ctx.runFfmpeg
 * @param {number} ctx.FRAME_LOG_STEP
 * @param {object} ctx.payload
 */
module.exports = async function runRenderPipeline(ctx) {
  const {
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
  } = ctx;

  const {
    lottieJson,
    w,
    h,
    fr,
    ip,
    op,
    maxFrames,
    plateVideoUrl,
    audioUrl,
    previewFontUrls,
    zipBuffer,
    hasZip,
    rawAnimLength,
  } = payload;
  const canvasRisk = analyzeCanvasRisk(lottieJson);
  const rendererMode = (process.env.RENDER_LOTTIE_RENDERER || "canvas").trim().toLowerCase() === "svg" ? "svg" : "canvas";

  let jobDir;
  let staticServer = null;
  let browser;

  try {
    jobPatch(jobId, { phase: "prepare", progress: 0.02 });

    jobDir = path.join(os.tmpdir(), `pixvite-render-${jobId}`);
    const framesDir = path.join(jobDir, "frames");
    await fsp.mkdir(framesDir, { recursive: true });
    log(rid, "job dir", jobDir);

    if (zipBuffer && zipBuffer.length) {
      log(rid, "zip extract", { bytes: zipBuffer.length });
      const zip = new AdmZip(zipBuffer);
      zip.extractAllTo(jobDir, true);
      log(rid, "zip extract done");
    } else {
      log(rid, "no zip (remote asset URLs only)");
    }
    jobPatch(jobId, { phase: "assets", progress: 0.06 });

    let plateDiskPath = null;
    if (plateVideoUrl) {
      const plateName = plateLocalFilename(plateVideoUrl);
      plateDiskPath = path.join(jobDir, plateName);
      log(
        rid,
        "download plate (same URL as web; saved beside job for stable seek — avoids /__asset Range ERR_ABORTED)",
        shortUrl(plateVideoUrl)
      );
      await downloadToFile(plateVideoUrl, plateDiskPath, "plate video");
      const pst = await fsp.stat(plateDiskPath);
      log(rid, "plate saved", { bytes: pst.size, file: plateName });
    } else {
      log(rid, "no plate video URL");
    }

    let audioDiskPath = findFileByExt(jobDir, ".mp3");
    if (audioDiskPath) log(rid, "audio from zip", audioDiskPath);
    if (!audioDiskPath && audioUrl) {
      const ext = audioUrl.toLowerCase().includes(".m4a") ? ".m4a" : path.extname(new URL(audioUrl).pathname) || ".mp3";
      const dest = path.join(jobDir, `audio${ext}`);
      log(rid, "download audio…", shortUrl(audioUrl));
      await downloadToFile(audioUrl, dest, "audio");
      audioDiskPath = dest;
      const st = await fsp.stat(dest);
      log(rid, "audio saved", { bytes: st.size });
    }
    if (!audioDiskPath) log(rid, "no audio track");

    jobPatch(jobId, { phase: "static", progress: 0.08 });

    staticServer = await startStaticServer(jobDir, rid);
    const { server, baseUrl } = staticServer;
    log(rid, "static asset server (+ /__asset CORS proxy)", { baseUrl, port: staticServer.port });

    const proxiedPreviewFontUrls = Array.isArray(previewFontUrls)
      ? previewFontUrls
          .filter((u) => typeof u === "string" && /^https?:\/\//i.test(u.trim()))
          .map((u) => toProxyAssetUrl(u.trim(), baseUrl))
      : [];
    log(rid, "headless font URLs (proxied same-origin)", { n: proxiedPreviewFontUrls.length });

    const lottieForPage = rewriteLottieJsonForSameOriginProxy(lottieJson, baseUrl);
    await fsp.writeFile(path.join(jobDir, "inject-anim.json"), JSON.stringify(lottieForPage), "utf8");
    log(rid, "wrote inject-anim.json (URLs rewritten to same-origin proxy)");

    const hasPlate = Boolean(plateDiskPath && fs.existsSync(plateDiskPath));
    const plateSrc = hasPlate ? `${baseUrl}${path.basename(plateDiskPath)}` : "";

    const assetsPath = hasZip ? (baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`) : "";
    log(rid, "lottie assetsPath", JSON.stringify(assetsPath), "hasPlate", hasPlate, "plateSrc", shortUrl(plateSrc || "(none)"));

    const playerHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
<style>
  html{height:100%;background:#000}
  body{margin:0;min-height:100%;background:#000;display:flex;align-items:center;justify-content:center}
  /* Only plate + Lottie here. Do NOT stack a full-size opaque canvas above #animHost — Chromium can skip
     raster updates to "fully occluded" canvases and you get half/missing Lottie (vertical slice). */
  #stage{position:relative;width:${w}px;height:${h}px;flex-shrink:0;background:#000;
    overflow:hidden;isolation:isolate}
  #plate{position:absolute;left:0;top:0;width:${w}px;height:${h}px;margin:0;padding:0;border:0;
    opacity:1;pointer-events:none;z-index:0;object-fit:fill;visibility:visible}
  #animHost{position:absolute;left:0;top:0;width:${w}px;height:${h}px;margin:0;padding:0;
    overflow:visible;opacity:1;pointer-events:none;z-index:1;visibility:visible;contain:none}
  /* Bitmap is w×h; CSS box is 1px and fixed in a corner so it never covers #animHost in the paint tree. */
  #out{position:fixed;right:0;bottom:0;width:1px;height:1px;visibility:hidden;pointer-events:none;overflow:hidden}
</style>
</head><body>
<div id="stage">
<video id="plate" muted playsinline preload="auto" ${plateSrc ? `src="${plateSrc}"` : ""}></video>
<div id="animHost"></div>
</div>
<canvas id="out" width="${w}" height="${h}"></canvas>
<script>
(function () {
  var assetsPath = ${JSON.stringify(assetsPath)};
  var W = ${w}, H = ${h};
  function createAnim(animationData) {
    if (window.anim) {
      try { window.anim.destroy(); } catch (e) {}
      window.anim = null;
    }
    var anim = lottie.loadAnimation({
      container: document.getElementById('animHost'),
      renderer: ${JSON.stringify(rendererMode)},
      loop: false,
      autoplay: false,
      animationData: animationData,
      assetsPath: assetsPath,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet', clearCanvas: true, progressiveLoad: false }
    });
    window.anim = anim;
    window.__animCanvas = null;
    anim.resize(W, H);
    anim.setSubframe(false);
    anim.addEventListener('DOMLoaded', function () {
      try { anim.resize(W, H); } catch (e) {}
      try {
        window.__animCanvas =
          anim &&
          anim.renderer &&
          anim.renderer.canvasContext &&
          anim.renderer.canvasContext.canvas
            ? anim.renderer.canvasContext.canvas
            : null;
      } catch (e) {
        window.__animCanvas = null;
      }
      window.__ready = true;
    });
    return anim;
  }
  window.__createAnim = createAnim;
  window.__rebuildAnimAfterFonts = function () {
    if (!window.__animationData) return;
    window.__ready = false;
    createAnim(window.__animationData);
  };
  fetch('./inject-anim.json').then(function (r) { return r.json(); }).then(function (animationData) {
    window.__animationData = animationData;
    createAnim(animationData);
  }).catch(function (e) { window.__loadErr = String(e); });
})();
</script>
</body></html>`;

    await fsp.writeFile(path.join(jobDir, "player.html"), playerHtml, "utf8");

    jobPatch(jobId, { phase: "browser", progress: 0.1 });

    log(rid, "job start (pipeline)", {
      jobId,
      jsonChars: rawAnimLength,
      comp: { w, h, fr, ip, op, maxFrames },
      plate: shortUrl(plateVideoUrl),
      audio: shortUrl(audioUrl),
      fontCount: previewFontUrls.length,
      canvasRisk: canvasRisk.risky ? canvasRisk.reasons : [],
    });

    log(rid, "puppeteer launch…");
    const tPup = Date.now();
    const launchArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ];
    if (process.env.RENDER_FORCE_SOFTWARE_RASTER === "1") {
      launchArgs.push("--disable-gpu");
    }
    /** Default CDP timeout is 180s; whole-frame-loop `evaluate` runs for many minutes — 0 disables. */
    let protocolTimeout = 0;
    const pts = (process.env.RENDER_PROTOCOL_TIMEOUT_MS || "").trim();
    if (pts) {
      const n = Number(pts);
      if (Number.isFinite(n) && n > 0) protocolTimeout = n;
    }
    browser = await puppeteer.launch({
      headless: "new",
      args: launchArgs,
      protocolTimeout,
    });
    if (!registerBrowser(jobId, browser)) {
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
      browser = null;
      throw new Error("Render worker busy (browser cap reached). Please retry.");
    }
    const page = await browser.newPage();
    /** One long `evaluate` for the whole frame loop (minutes); default 30s would abort. */
    page.setDefaultTimeout(0);
    page.on("console", (msg) => {
      try {
        log(rid, "page console", msg.type(), msg.text());
      } catch {
        /* ignore */
      }
    });
    page.on("pageerror", (err) => {
      log(rid, "page error", err?.message || err);
    });
    page.on("requestfailed", (req) => {
      log(rid, "request failed", req.url(), req.failure()?.errorText);
    });
    const seen404 = new Set();
    page.on("response", (resp) => {
      if (resp.status() !== 404) return;
      const u = resp.url();
      if (seen404.has(u)) return;
      seen404.add(u);
      log(rid, "http 404", u);
    });
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    const playerUrl = `${baseUrl}player.html`;
    log(rid, "page goto", playerUrl, "(waitUntil: domcontentloaded — avoid networkidle0 stalls on Lottie + video)");
    await page.goto(playerUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    log(rid, "page dom ready", { ms: Date.now() - tPup });

    log(rid, "wait Lottie DOMLoaded…");
    await page.waitForFunction(() => window.__ready === true || window.__loadErr, { timeout: 60000 });
    const loadErr = await page.evaluate(() => window.__loadErr);
    if (loadErr) throw new Error(`Lottie load failed: ${loadErr}`);
    log(rid, "Lottie ready");
    jobPatch(jobId, { phase: "lottie", progress: 0.12 });

    await page.waitForFunction(
      (mode) => {
        if (mode === "svg") return Boolean(document.querySelector("#animHost svg"));
        return Boolean(document.querySelector("#animHost canvas"));
      },
      { timeout: 60000 },
      rendererMode
    );
    log(rid, `Lottie ${rendererMode} layer present`);

    if (hasPlate) {
      log(rid, "wait plate video ready…");
      await page.waitForFunction(
        () => {
          const v = document.getElementById("plate");
          return v && v.readyState >= 2;
        },
        { timeout: 60000 }
      );
      log(rid, "plate video ready");
    }

    log(rid, "preload template fonts (parity with browser export)…");
    await page.evaluate(preloadLottieTemplateFontsInPage, lottieJson, proxiedPreviewFontUrls);
    log(rid, "fonts ready after FontFace preload");

    if (rendererMode === "svg") {
      // SVG renderer often locks text layout with fallback fonts if faces load late.
      // Rebuild animation once after font preload so glyph metrics/families re-bind correctly.
      await page.evaluate(() => {
        if (typeof window.__rebuildAnimAfterFonts === "function") {
          window.__rebuildAnimAfterFonts();
        }
      });
      await page.waitForFunction(() => window.__ready === true, { timeout: 60000 });
      log(rid, "Lottie rebuilt after font preload (svg)");
    }

    /**
     * Redraw current frame after FontFace preload so canvas text metrics match real fonts.
     * Do NOT call `anim.resize(w,h)` here: lottie-web 5.12 canvas path can throw `null.length`
     * when resize runs during renderer init/teardown.
     * Pass `{ ipVal }` as one object so `ipVal === 0` is never dropped between Node and Chromium.
     */
    await page.evaluate(async (opts) => {
      const ipVal =
        opts && typeof opts.ipVal === "number" ? opts.ipVal : Number(opts?.ipVal) || 0;
      const anim = window.anim;
      if (!anim) return;
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      anim.goToAndStop(ipVal, true);
      await raf2();
      anim.goToAndStop(ipVal, true);
      await raf2();

      // Cache the most likely render canvas from animHost (largest bitmap area).
      const list = Array.from(document.querySelectorAll("#animHost canvas"));
      if (list.length) {
        list.sort((a, b) => (b.width * b.height) - (a.width * a.height));
        window.__lottieCanvas = list[0];
      } else {
        window.__lottieCanvas = null;
      }
    }, { ipVal: ip });
    log(rid, "Lottie text redraw after fonts (goToAndStop ip only)");

    const jpegQuality = Math.min(
      1,
      Math.max(
        0.5,
        Number(process.env.RENDER_JPEG_QUALITY) || 0.94
      )
    );
    const captureModeRaw = (process.env.RENDER_CAPTURE_MODE || "auto").trim().toLowerCase();
    let captureMode = rendererMode === "svg" ? "stage" : (captureModeRaw === "stage" ? "stage" : "canvas");

    if (rendererMode === "canvas" && captureModeRaw === "auto" && canvasRisk.risky) {
      captureMode = "stage";
      log(rid, "auto fallback: canvas-risk template, forcing stage", canvasRisk.reasons);
    }

    if (rendererMode === "canvas" && captureModeRaw === "auto" && !canvasRisk.risky) {
      const canvasProbeOk = await page.evaluate(async ({ ipVal, opVal, frVal, usePlate, cw, ch }) => {
        const anim = window.anim;
        if (!anim) return false;
        const plate = document.getElementById("plate");
        const testFrames = [
          Math.max(ipVal, Math.min(opVal, ipVal + Math.floor(frVal * 1.0))),
          Math.max(ipVal, Math.floor((ipVal + opVal) / 2)),
          Math.max(ipVal, Math.min(opVal, opVal - 1)),
        ];
        const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const c =
          window.__lottieCanvas ||
          window.__animCanvas ||
          document.querySelector("#animHost canvas");
        if (!c) return false;
        const w = c.width || 0;
        const h = c.height || 0;
        if (w <= 0 || h <= 0) return false;

        const probe = document.createElement("canvas");
        probe.width = cw;
        probe.height = ch;
        const ctx = probe.getContext("2d", { willReadFrequently: true });
        if (!ctx) return false;

        const samplesX = 96;
        const samplesY = 96;
        const stepX = Math.max(1, Math.floor(cw / samplesX));
        const stepY = Math.max(1, Math.floor(ch / samplesY));

        const hasVisibleLottieAtFrame = async (frame) => {
          if (usePlate && plate) {
            const t = (frame - ipVal) / frVal;
            await new Promise((resolve, reject) => {
              const onSeeked = () => {
                plate.removeEventListener("seeked", onSeeked);
                plate.removeEventListener("error", onErr);
                resolve();
              };
              const onErr = () => {
                plate.removeEventListener("seeked", onSeeked);
                plate.removeEventListener("error", onErr);
                reject(new Error("probe seek error"));
              };
              plate.addEventListener("seeked", onSeeked, { once: true });
              plate.addEventListener("error", onErr, { once: true });
              if (Math.abs(plate.currentTime - t) < 0.0005) {
                plate.removeEventListener("seeked", onSeeked);
                plate.removeEventListener("error", onErr);
                resolve();
                return;
              }
              plate.currentTime = t;
            }).catch(() => undefined);
          }

          anim.goToAndStop(frame, true);
          await raf2();

          // Base layer: black + optional plate
          ctx.clearRect(0, 0, cw, ch);
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, cw, ch);
          if (usePlate && plate && plate.readyState >= 2) {
            try {
              ctx.drawImage(plate, 0, 0, cw, ch);
            } catch {
              /* ignore */
            }
          }
          const base = ctx.getImageData(0, 0, cw, ch).data;

          // Composite with lottie
          try {
            ctx.drawImage(c, 0, 0, w, h, 0, 0, cw, ch);
          } catch {
            return false;
          }
          const withLottie = ctx.getImageData(0, 0, cw, ch).data;

          let changed = 0;
          for (let y = 0; y < ch; y += stepY) {
            for (let x = 0; x < cw; x += stepX) {
              const i = (y * cw + x) * 4;
              const dr = Math.abs(withLottie[i] - base[i]);
              const dg = Math.abs(withLottie[i + 1] - base[i + 1]);
              const db = Math.abs(withLottie[i + 2] - base[i + 2]);
              const da = Math.abs(withLottie[i + 3] - base[i + 3]);
              if (dr + dg + db + da > 6) changed += 1;
            }
          }
          return changed > 8;
        };

        for (let i = 0; i < testFrames.length; i += 1) {
          if (await hasVisibleLottieAtFrame(testFrames[i])) return true;
        }
        return false;
      }, { ipVal: ip, opVal: op, frVal: fr, usePlate: hasPlate, cw: w, ch: h });
      if (!canvasProbeOk) {
        captureMode = "stage";
        log(rid, "auto fallback: canvas probe failed (lottie has no visible contribution), switching capture mode to stage");
      }
    }

    log(rid, "frame capture start", {
      rendererMode,
      mode: captureMode,
      maxFrames,
      frameLogStep: FRAME_LOG_STEP,
      jpegQuality,
    });
    const tFrames = Date.now();
    const captureLo = 0.12;
    const captureHi = 0.9;
    if (captureMode === "stage") {
      const stageHandle = await page.$("#stage");
      if (!stageHandle) throw new Error("Composite #stage missing");
      for (let fi = 0; fi < maxFrames; fi += 1) {
        const frameIndex = Math.min(op, ip + fi);
        const wall = fi / fr;
        await page.evaluate(
          async ({ frameIndex: f, wall: t, usePlate }) => {
            const plate = document.getElementById("plate");
            if (usePlate && plate) {
              await new Promise((resolve, reject) => {
                const onSeeked = () => {
                  plate.removeEventListener("seeked", onSeeked);
                  plate.removeEventListener("error", onErr);
                  resolve();
                };
                const onErr = () => {
                  plate.removeEventListener("seeked", onSeeked);
                  plate.removeEventListener("error", onErr);
                  reject(new Error("video seek error"));
                };
                plate.addEventListener("seeked", onSeeked, { once: true });
                plate.addEventListener("error", onErr, { once: true });
                if (Math.abs(plate.currentTime - t) < 0.0005) {
                  plate.removeEventListener("seeked", onSeeked);
                  plate.removeEventListener("error", onErr);
                  resolve();
                  return;
                }
                plate.currentTime = t;
              });
            }
            window.anim.goToAndStop(f, true);
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          },
          { frameIndex, wall, usePlate: hasPlate }
        );

        const fp = path.join(framesDir, `frame${String(fi).padStart(5, "0")}.jpeg`);
        await stageHandle.screenshot({ path: fp, type: "jpeg", quality: Math.round(jpegQuality * 100) });

        if (fi % 4 === 0 || fi === maxFrames - 1) {
          const p = captureLo + (captureHi - captureLo) * ((fi + 1) / maxFrames);
          jobPatch(jobId, { phase: "capture", progress: p });
        }
        if (fi > 0 && fi % FRAME_LOG_STEP === 0) {
          log(rid, "frame progress", { fi, maxFrames, ms: Date.now() - tFrames });
        }
      }
    } else {
      await page.exposeFunction("__pixviteWriteJpeg", async (index, dataUrl) => {
        const i = Number(index);
        const comma = typeof dataUrl === "string" ? dataUrl.indexOf(",") : -1;
        const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
        const fp = path.join(framesDir, `frame${String(i).padStart(5, "0")}.jpeg`);
        await fsp.writeFile(fp, Buffer.from(b64, "base64"));
      });
      await page.exposeFunction("__pixviteFrameTick", (fi, mf) => {
        const f = Number(fi);
        const m = Number(mf);
        if (Number.isNaN(f) || Number.isNaN(m)) return;
        if (f % 4 === 0 || f === m - 1) {
          const p = captureLo + (captureHi - captureLo) * ((f + 1) / m);
          jobPatch(jobId, { phase: "capture", progress: p });
        }
        if (f > 0 && f % FRAME_LOG_STEP === 0) {
          log(rid, "frame progress", { fi: f, maxFrames: m, ms: Date.now() - tFrames });
        }
      });

      await page.evaluate(
        async ({ mf, ipVal, opVal, frVal, usePlate, cw, ch, jpegQ }) => {
          const plate = document.getElementById("plate");
          const out = document.getElementById("out");
          const ctx2d = out && out.getContext("2d", { alpha: true });
          if (!ctx2d || !window.anim) throw new Error("missing canvas / anim");

          const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

          for (let fi = 0; fi < mf; fi += 1) {
            const f = Math.min(opVal, ipVal + fi);
            const t = fi / frVal;
            if (usePlate && plate) {
              await new Promise((resolve, reject) => {
                const onSeeked = () => {
                  plate.removeEventListener("seeked", onSeeked);
                  plate.removeEventListener("error", onErr);
                  resolve();
                };
                const onErr = () => {
                  plate.removeEventListener("seeked", onSeeked);
                  plate.removeEventListener("error", onErr);
                  reject(new Error("video seek error"));
                };
                plate.addEventListener("seeked", onSeeked, { once: true });
                plate.addEventListener("error", onErr, { once: true });
                if (Math.abs(plate.currentTime - t) < 0.0005) {
                  plate.removeEventListener("seeked", onSeeked);
                  plate.removeEventListener("error", onErr);
                  resolve();
                  return;
                }
                plate.currentTime = t;
              });
            }

            window.anim.goToAndStop(f, true);
            await raf2();

            ctx2d.globalCompositeOperation = "source-over";
            ctx2d.fillStyle = "#000000";
            ctx2d.fillRect(0, 0, cw, ch);
            if (usePlate && plate && plate.readyState >= 2) {
              try {
                ctx2d.drawImage(plate, 0, 0, cw, ch);
              } catch {
                /* ignore */
              }
            }
            const lc =
              window.__lottieCanvas ||
              window.__animCanvas ||
              document.querySelector("#animHost canvas");
            if (lc) {
              try {
                const sw = lc.width;
                const sh = lc.height;
                if (sw > 0 && sh > 0) {
                  ctx2d.drawImage(lc, 0, 0, sw, sh, 0, 0, cw, ch);
                }
              } catch {
                /* ignore */
              }
            }
            const dataUrl = out.toDataURL("image/jpeg", jpegQ);
            await window.__pixviteWriteJpeg(fi, dataUrl);
            await window.__pixviteFrameTick(fi, mf);
          }
        },
        {
          mf: maxFrames,
          ipVal: ip,
          opVal: op,
          frVal: fr,
          usePlate: hasPlate,
          cw: w,
          ch: h,
          jpegQ: jpegQuality,
        }
      );
    }

    log(rid, "frame capture done", { maxFrames, ms: Date.now() - tFrames });

    await browser.close();
    unregisterBrowser(jobId);
    browser = null;

    await new Promise((resolve) => server.close(() => resolve()));
    staticServer = null;

    jobPatch(jobId, { phase: "encode", progress: 0.92 });

    /** Match frame timeline; tiny epsilon avoids float edge cases dropping the last frame in FFmpeg. */
    const durationSec = maxFrames / fr + 1 / (2 * fr);
    log(rid, "ffmpeg mux (video length = full Lottie run; no -shortest)", {
      durationSec,
      maxFrames,
      fr,
    });

    const outputMp4 = path.join(jobDir, "output.mp4");
    await runFfmpeg({
      rid,
      framesDir,
      fps: fr,
      audioPath: audioDiskPath,
      outputMp4,
      durationSec,
    });

    jobPatch(jobId, {
      phase: "done",
      progress: 1,
      done: true,
      error: null,
      outputPath: outputMp4,
      jobDir,
    });
    log(rid, "job complete", { jobId, output: outputMp4 });
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? err.message : "Render failed";
    jobPatch(jobId, { done: true, error: msg, phase: "error", progress: 0 });
    log(rid, "job failed", msg);
    if (jobDir) {
      try {
        await fsp.rm(jobDir, { recursive: true, force: true });
        log(rid, "cleanup jobDir after error");
      } catch (e) {
        log(rid, "cleanup jobDir warn", e?.message || e);
      }
    }
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
      unregisterBrowser(jobId);
    }
    if (staticServer && staticServer.server) {
      try {
        await new Promise((resolve) => staticServer.server.close(() => resolve()));
      } catch {
        /* ignore */
      }
    }
  }
};
