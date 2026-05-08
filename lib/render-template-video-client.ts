import type { AnimationItem } from "lottie-web";
import lottie from "lottie-web";
import { preloadLottieTemplateFonts } from "@/lib/lottie-export-fonts";

export type RenderVideoResult = {
  blob: Blob;
  extension: "mp4" | "webm";
  mimeType: string;
};

function pickRecorderMime(): { mimeType: string; extension: "mp4" | "webm" } {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Video recording is not supported in this browser.");
  }
  const candidates: Array<{ mimeType: string; extension: "mp4" | "webm" }> = [
    { mimeType: 'video/mp4; codecs="avc1.42E01E"', extension: "mp4" },
    { mimeType: "video/mp4", extension: "mp4" },
    { mimeType: "video/webm;codecs=vp9", extension: "webm" },
    { mimeType: "video/webm;codecs=vp8", extension: "webm" },
    { mimeType: "video/webm", extension: "webm" },
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mimeType)) return c;
  }
  return { mimeType: "", extension: "webm" };
}

/** Seek plate video; resolves immediately if already at target (avoids `seeked` never firing at 0). */
function seekVideoReliable(v: HTMLVideoElement, timeSeconds: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
      resolve();
      return;
    }
    const cap =
      Number.isFinite(v.duration) && v.duration > 0 ? Math.max(0, v.duration - 0.04) : timeSeconds;
    const target = Math.min(timeSeconds, cap);
    if (Math.abs(v.currentTime - target) < 0.0005) {
      resolve();
      return;
    }
    const done = () => {
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("error", onErr);
      clearTimeout(tid);
      resolve();
    };
    const onSeeked = () => done();
    const onErr = () => {
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("error", onErr);
      clearTimeout(tid);
      reject(new Error("Video failed while seeking."));
    };
    v.addEventListener("seeked", onSeeked, { once: true });
    v.addEventListener("error", onErr, { once: true });
    const tid = window.setTimeout(done, 3000);
    try {
      v.currentTime = target;
    } catch {
      clearTimeout(tid);
      reject(new Error("Could not seek video."));
    }
  });
}

function requestCanvasCaptureFrame(videoTrack: MediaStreamTrack) {
  const t = videoTrack as MediaStreamTrack & { requestFrame?: () => void };
  if (typeof t.requestFrame === "function") t.requestFrame();
}

const MAX_EXPORT_SECONDS = 380;

/**
 * Real-time composite: plate video + Lottie (canvas) + optional background music in the file.
 * - **Alpha** on the output canvas so transparent Lottie layers show the plate underneath.
 * - **Fonts** preloaded like the preview so canvas text matches.
 * - **Frame-index** Lottie (`ip`…`op`) stepped in sync with the plate; plate time clamps after its duration.
 * - **Audio** muxed via Web Audio (`MediaElementSource` → `MediaStreamDestination`); element is not wired to speakers.
 * - **Seek** resolves immediately when `currentTime` already matches (fixes multi-second stalls on frame 0 / repeats).
 */
export async function renderEditedTemplateVideo(opts: {
  animationData: unknown;
  plateVideoUrl: string;
  previewFontUrls?: string[] | null;
  audioUrl?: string | null;
  onProgress?: (ratio01: number) => void;
}): Promise<RenderVideoResult> {
  const data = opts.animationData as Record<string, unknown>;
  const w = Number(data.w) || 1080;
  const h = Number(data.h) || 1920;
  const fr = Number(data.fr) || 30;
  const ip = Number.isFinite(Number(data.ip)) ? Number(data.ip) : 0;
  const op = Number.isFinite(Number(data.op)) ? Number(data.op) : ip + fr * 10 - 1;
  const totalFrames = Math.max(1, Math.floor(op - ip + 1));
  const maxFrames = Math.min(totalFrames, Math.floor(MAX_EXPORT_SECONDS * fr));
  const compDurationSec = maxFrames / fr;

  const { mimeType, extension } = pickRecorderMime();

  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${w}px;height:${h}px;overflow:hidden;pointer-events:none;background:#000;`;
  document.body.appendChild(host);

  const mainCanvas = document.createElement("canvas");
  mainCanvas.width = w;
  mainCanvas.height = h;
  const ctx = mainCanvas.getContext("2d", { alpha: true });
  if (!ctx) {
    host.remove();
    throw new Error("Could not create canvas context.");
  }

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  video.src = opts.plateVideoUrl;

  await new Promise<void>((resolve, reject) => {
    const ok = () => {
      video.removeEventListener("loadeddata", ok);
      video.removeEventListener("error", bad);
      resolve();
    };
    const bad = () => {
      video.removeEventListener("loadeddata", ok);
      video.removeEventListener("error", bad);
      reject(new Error("Could not load plate video for export."));
    };
    video.addEventListener("loadeddata", ok, { once: true });
    video.addEventListener("error", bad, { once: true });
    if (video.readyState >= 2) ok();
  });

  let audioEl: HTMLAudioElement | null = null;
  let audioCtx: AudioContext | null = null;
  const audioUrl = typeof opts.audioUrl === "string" ? opts.audioUrl.trim() : "";
  if (audioUrl) {
    try {
      audioEl = document.createElement("audio");
      audioEl.crossOrigin = "anonymous";
      audioEl.preload = "auto";
      audioEl.src = audioUrl;
      await new Promise<void>((resolve, reject) => {
        const ok = () => {
          audioEl!.removeEventListener("canplaythrough", ok);
          audioEl!.removeEventListener("error", bad);
          resolve();
        };
        const bad = () => {
          audioEl!.removeEventListener("canplaythrough", ok);
          audioEl!.removeEventListener("error", bad);
          reject(new Error("audio load"));
        };
        audioEl!.addEventListener("canplaythrough", ok, { once: true });
        audioEl!.addEventListener("error", bad, { once: true });
        if (audioEl!.readyState >= 3) ok();
      });
    } catch {
      audioEl = null;
    }
  }

  await preloadLottieTemplateFonts(opts.animationData, opts.previewFontUrls ?? null);

  let anim: AnimationItem | null = null;
  try {
    anim = lottie.loadAnimation({
      container: host,
      renderer: "canvas",
      loop: false,
      autoplay: false,
      animationData: opts.animationData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
        clearCanvas: true,
        progressiveLoad: false,
      },
    });
    anim.resize(w, h);
    anim.setSubframe(false);

    const lottieCanvas = host.querySelector("canvas") as HTMLCanvasElement | null;
    if (!lottieCanvas) {
      throw new Error("Lottie canvas renderer did not create a canvas.");
    }

    const canvasStream = mainCanvas.captureStream(fr);
    const canvasTrack = canvasStream.getVideoTracks()[0];
    if (!canvasTrack) {
      throw new Error("Could not start canvas capture stream.");
    }

    const outStream = new MediaStream();
    canvasStream.getVideoTracks().forEach((t) => outStream.addTrack(t));

    if (audioEl) {
      try {
        audioCtx = new AudioContext();
        if (audioCtx.state === "suspended") await audioCtx.resume();
        const src = audioCtx.createMediaElementSource(audioEl);
        const dest = audioCtx.createMediaStreamDestination();
        src.connect(dest);
        dest.stream.getAudioTracks().forEach((t) => outStream.addTrack(t));
      } catch {
        if (audioCtx) void audioCtx.close().catch(() => undefined);
        audioCtx = null;
        audioEl = null;
      }
    }

    const recOpts: MediaRecorderOptions = {};
    if (mimeType) recOpts.mimeType = mimeType;
    (recOpts as { videoBitsPerSecond?: number }).videoBitsPerSecond = 8_000_000;
    if (outStream.getAudioTracks().length > 0) {
      (recOpts as { audioBitsPerSecond?: number }).audioBitsPerSecond = 192_000;
    }

    const rec = new MediaRecorder(outStream, recOpts);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const blobPromise = new Promise<Blob>((resolve, reject) => {
      rec.onerror = () => reject(new Error("Recorder error."));
      rec.onstop = () => {
        const type = rec.mimeType || mimeType || "video/webm";
        resolve(new Blob(chunks, { type }));
      };
    });

    video.pause();
    video.currentTime = 0;
    if (audioEl) audioEl.currentTime = 0;

    rec.start(500);

    const t0 = performance.now();
    const videoDur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : compDurationSec;

    let videoFailed = false;
    const onVideoError = () => {
      videoFailed = true;
    };
    video.addEventListener("error", onVideoError);

    try {
      if (audioEl) await audioEl.play().catch(() => undefined);

      for (let fi = 0; fi < maxFrames; fi += 1) {
        if (videoFailed) throw new Error("Plate video error during export.");

        const wall = fi / fr;
        opts.onProgress?.((fi + 1) / maxFrames);

        const vt = Math.min(wall, videoDur);
        await seekVideoReliable(video, vt);

        const frame = Math.min(op, ip + fi);
        anim.goToAndStop(frame, true);
        await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, w, h);
        if (video.readyState >= 2) {
          try {
            ctx.drawImage(video, 0, 0, w, h);
          } catch {
            /* ignore */
          }
        }
        ctx.globalCompositeOperation = "source-over";
        try {
          ctx.drawImage(lottieCanvas, 0, 0, w, h);
        } catch {
          /* ignore */
        }

        if (audioEl && !audioEl.paused && Math.abs(audioEl.currentTime - wall) > 0.22) {
          try {
            audioEl.currentTime = wall;
          } catch {
            /* ignore */
          }
        }

        requestCanvasCaptureFrame(canvasTrack);

        const nextDeadline = t0 + ((fi + 1) / fr) * 1000;
        const sleep = nextDeadline - performance.now();
        if (sleep > 0) {
          await new Promise<void>((r) => window.setTimeout(r, sleep));
        }
      }
    } finally {
      video.removeEventListener("error", onVideoError);
    }

    video.pause();
    if (audioEl) audioEl.pause();

    rec.stop();
    const blob = await blobPromise;
    const outMime = blob.type || mimeType || "video/webm";
    const outExt: "mp4" | "webm" = outMime.includes("mp4") ? "mp4" : extension;
    return { blob, extension: outExt, mimeType: outMime };
  } finally {
    anim?.destroy();
    video.pause();
    video.remove();
    if (audioEl) {
      audioEl.pause();
      audioEl.removeAttribute("src");
      audioEl.load();
    }
    if (audioCtx) void audioCtx.close().catch(() => undefined);
    host.remove();
  }
}
