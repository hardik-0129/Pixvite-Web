"use client";

import Image from "next/image";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PreviewVideoTextOverlay } from "@/lib/templates";

type Props = {
  posterSrc: string;
  posterAlt: string;
  embedUrl?: string | null;
  /** MP4 (or other) URL for HTML5 preview — takes priority over Lottie and iframe. */
  previewVideoUrl?: string | null;
  /** Current form values — used with `videoTextOverlays` to draw text on the video. */
  fieldValues?: Record<string, string>;
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

export function TemplateEditorPreview({
  posterSrc,
  posterAlt,
  embedUrl,
  previewVideoUrl,
  fieldValues,
  videoTextOverlays,
  lottiePreviewUrl,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [lottieData, setLottieData] = useState<unknown | null>(null);
  const [lottieError, setLottieError] = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const useVideo = Boolean(previewVideoUrl);
  const useLottie = Boolean(!useVideo && lottiePreviewUrl && lottieData && !lottieError);
  const useIframe = Boolean(!useVideo && embedUrl && playing && !useLottie);

  useEffect(() => {
    if (!lottiePreviewUrl || previewVideoUrl) {
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
      .then((d) => {
        if (cancelled) return;
        if (!isSafeLottieAnimationData(d)) {
          setLottieData(null);
          setLottieError(true);
          setPlaying(false);
          return;
        }
        setLottieData(d);
        setLottieError(false);
      })
      .catch(() => {
        if (!cancelled) {
          setLottieData(null);
          setLottieError(true);
          setPlaying(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [lottiePreviewUrl, previewVideoUrl]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !previewVideoUrl) return;
    if (playing) {
      void v.play().catch(() => setPlaying(false));
    } else {
      v.pause();
    }
  }, [playing, previewVideoUrl]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !previewVideoUrl) return;
    const onTime = () => {
      setCurrentTime(v.currentTime);
      if (Number.isFinite(v.duration) && v.duration > 0) setDuration(v.duration);
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
  }, [previewVideoUrl]);

  const syncLottiePlayback = useCallback(() => {
    const api = lottieRef.current;
    if (!api?.animationLoaded) return;
    if (playing) api.play();
    else {
      api.pause();
      api.goToAndStop(0, true);
    }
  }, [playing]);

  useEffect(() => {
    syncLottiePlayback();
  }, [playing, lottieData, syncLottiePlayback]);

  const restart = useCallback(() => {
    if (previewVideoUrl && videoRef.current) {
      const v = videoRef.current;
      v.currentTime = 0;
      void v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
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
  }, [previewVideoUrl, useLottie]);

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div id="template-editor-preview" className="relative mx-auto w-full max-w-[300px] sm:max-w-[320px] lg:max-w-[360px]">
      <div className="group relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-black/10 bg-black shadow-[0_12px_40px_-8px_rgba(15,23,42,0.35)] ring-1 ring-black/5">
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
          ) : useVideo && previewVideoUrl ? (
            <div className="relative h-full w-full bg-neutral-950">
              <video
                key={previewVideoUrl}
                ref={videoRef}
                src={previewVideoUrl}
                poster={posterSrc}
                playsInline
                preload="metadata"
                className="absolute inset-0 z-10 h-full w-full object-cover"
                muted
                aria-label={posterAlt}
              />
              {!playing && (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
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
              <Lottie
                lottieRef={lottieRef}
                animationData={lottieData}
                loop
                className="h-full w-full [&_svg]:mx-auto [&_svg]:max-h-full [&_svg]:w-auto"
                onDOMLoaded={syncLottiePlayback}
                onDataFailed={() => {
                  setLottieData(null);
                  setLottieError(true);
                  setPlaying(false);
                }}
              />
              {!playing && (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
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
                  onClick={() => setPlaying(true)}
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
        previewVideoUrl &&
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
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <span className="tabular-nums text-white/80">
            {useVideo ? formatTime(currentTime) : "00:00"}
          </span>
          <div className="h-1 flex-1 rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-150"
              style={{ width: `${useVideo ? progressPct : 33}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
