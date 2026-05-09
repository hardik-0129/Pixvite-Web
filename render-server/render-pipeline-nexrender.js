"use strict";

const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const AdmZip = require("adm-zip");
const ffmpeg = require("fluent-ffmpeg");
const { render } = require("@nexrender/core");

function parseRenderProgress(parts) {
  const line = parts.map((x) => String(x ?? "")).join(" ");
  const m = /rendering progress\s+(\d+)%/i.exec(line);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, n));
}

async function transcodeToMp4(inputPath, outputPath, rid, log) {
  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions(["-pix_fmt", "yuv420p", "-movflags", "+faststart", "-preset", "fast"])
      .output(outputPath)
      .on("start", (cmdLine) => {
        log(rid, "ffmpeg transcode start:", cmdLine);
      })
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

/**
 * @param {object} ctx
 */
module.exports = async function runNexrenderPipeline(ctx) {
  const { jobId, rid, jobPatch, log, findFileByExt, payload } = ctx;
  const {
    zipBuffer,
    hasZip,
    aeTemplateUrl,
    aeComposition,
    aeAssets,
    aeOutputModule,
    aeOutputExt,
  } = payload;

  const targetOutputExt = (aeOutputExt || "mp4").trim().replace(/^\./, "") || "mp4";
  const workRoot = path.join(os.tmpdir(), "pixvite-nexrender");
  let jobDir = "";

  try {
    jobPatch(jobId, { phase: "prepare", progress: 0.03 });
    jobDir = path.join(os.tmpdir(), `pixvite-render-${jobId}`);
    await fsp.mkdir(jobDir, { recursive: true });
    await fsp.mkdir(workRoot, { recursive: true });

    if (hasZip && zipBuffer?.length) {
      log(rid, "ae zip extract", { bytes: zipBuffer.length });
      const zip = new AdmZip(zipBuffer);
      zip.extractAllTo(jobDir, true);
      log(rid, "ae zip extract done");
    }

    jobPatch(jobId, { phase: "assets", progress: 0.08 });

    const aepPathFromZip = findFileByExt(jobDir, ".aep");
    const templateSrc = aeTemplateUrl || aepPathFromZip || "";
    if (!templateSrc) {
      throw new Error("AE project missing. Provide aeTemplateUrl or zip with .aep.");
    }

    const normalizedAssets = Array.isArray(aeAssets)
      ? aeAssets.filter((x) => x && typeof x === "object" && typeof x.type === "string")
      : [];

    if (!aeComposition) {
      throw new Error("AE composition missing (aeComposition).");
    }

    log(rid, "ae render start", {
      jobId,
      template: templateSrc.length > 140 ? `${templateSrc.slice(0, 140)}...` : templateSrc,
      composition: aeComposition,
      assets: normalizedAssets.length,
      outputExt: targetOutputExt,
      outputModule: aeOutputModule || "(default)",
    });

    jobPatch(jobId, { phase: "render", progress: 0.12 });

    const settings = {
      workpath: workRoot,
      binary: (process.env.AERENDER_BINARY || "").trim() || undefined,
      addLicense: false,
      skipCleanup: true,
      debug: process.env.NEXRENDER_DEBUG === "1",
      noAnalytics: true,
      multiFrames: process.env.AERENDER_MULTI_FRAMES === "1",
      multiFramesCPU: Math.max(1, Math.min(100, Number(process.env.AERENDER_MULTI_FRAMES_CPU) || 90)),
      logger: {
        log: (...parts) => {
          log(rid, ...parts);
          const p = parseRenderProgress(parts);
          if (p != null) {
            const progress = 0.12 + (0.82 - 0.12) * (p / 100);
            jobPatch(jobId, { phase: "render", progress });
          }
        },
        warn: (...parts) => log(rid, "warn:", ...parts),
        error: (...parts) => log(rid, "error:", ...parts),
      },
    };

    const jobConfig = {
      uid: jobId,
      template: {
        src: templateSrc,
        composition: aeComposition,
        outputExt: targetOutputExt,
        ...(aeOutputModule ? { outputModule: aeOutputModule } : {}),
      },
      assets: normalizedAssets,
      actions: {
        postrender: [],
      },
    };

    const result = await render(jobConfig, settings);
    const renderedPath = result?.output;
    if (!renderedPath || !fs.existsSync(renderedPath)) {
      throw new Error("AE render finished but output file was not found.");
    }

    const outputMp4 = path.join(jobDir, "output.mp4");
    const renderedExt = path.extname(renderedPath).toLowerCase();
    if (renderedExt === ".mp4") {
      await fsp.copyFile(renderedPath, outputMp4);
    } else {
      jobPatch(jobId, { phase: "encode", progress: 0.88 });
      await transcodeToMp4(renderedPath, outputMp4, rid, log);
    }

    jobPatch(jobId, {
      phase: "done",
      progress: 1,
      done: true,
      error: null,
      outputPath: outputMp4,
      jobDir,
    });
    log(rid, "ae job complete", { output: outputMp4 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AE render failed";
    jobPatch(jobId, { done: true, error: msg, phase: "error", progress: 0 });
    log(rid, "ae job failed", msg);
    if (jobDir) {
      try {
        await fsp.rm(jobDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors
      }
    }
  }
};
