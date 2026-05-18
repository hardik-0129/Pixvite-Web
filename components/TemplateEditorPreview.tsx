"use client";

import Image from "next/image";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyFieldValuesToLottie,
  fetchLottieJsonRewritten,
  isSafeLottieAnimationData,
} from "@/lib/lottie-apply-fields";
import type { FormField, PreviewVideoTextOverlay } from "@/lib/templates";
import { resolveTemplatePlateVideoUrl } from "@/lib/template-plate-url";

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
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lottieData, setLottieData] = useState<unknown | null>(null);
  const [lottieError, setLottieError] = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const baseLottieDataRef = useRef<unknown | null>(null);
  const seekingRef = useRef(false);
  const lottieCurrentTimeRef = useRef(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  /** Lottie plate: CMS `backgroundVideoUrl`, else `Alpha.mp4` beside Lottie JSON, else hover `previewVideoUrl`. */
  const plateVideoSrc = useMemo(
    () =>
      resolveTemplatePlateVideoUrl({
        backgroundVideoUrl,
        previewVideoUrl,
        lottiePreviewUrl,
      }).trim(),
    [backgroundVideoUrl, previewVideoUrl, lottiePreviewUrl]
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
    return lottieCurrentTimeRef.current;
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
      const id = requestAnimationFrame(() => {
        setLottieData(null);
        setLottieError(false);
      });
      return () => cancelAnimationFrame(id);
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLottieData(null);
      setLottieError(false);
    });
    void fetchLottieJsonRewritten(lottiePreviewUrl)
      .then((withFixedAssets) => {
        if (cancelled) return;
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
    const onEnded = () => {
      // Seek to last decodable frame so the player doesn't go blank at end
      if (Number.isFinite(v.duration) && v.duration > 0) {
        v.currentTime = Math.max(0, v.duration - 0.05);
      }
      setPlaying(false);
    };
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
    const onEnded = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        a.currentTime = Math.max(0, a.duration - 0.05);
      }
      setPlaying(false);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnded);
    };
  }, [previewAudioUrl, plateVideoSrc]);

  // Set duration from Lottie data for pure Lottie-only mode (no video, no audio clock)
  useEffect(() => {
    if (!useLottie || !lottieData || plateVideoSrc || previewAudioUrl) return;
    const d = lottieData as Record<string, unknown>;
    const fr = Number(d.fr) || 30;
    const op = Number(d.op) || 0;
    const ip = Number(d.ip) || 0;
    const lottieDuration = (op - ip) / fr;
    if (lottieDuration > 0) setDuration(lottieDuration);
  }, [useLottie, lottieData, plateVideoSrc, previewAudioUrl]);

  // Track currentTime from Lottie frames in pure Lottie-only mode
  useEffect(() => {
    if (!playing || !useLottie || !hasLottie) return;
    const id = window.setInterval(() => {
      const api = lottieRef.current;
      if (!api?.animationLoaded || !lottieData) return;
      const fr = Number((lottieData as Record<string, unknown>).fr) || 30;
      const item = (api as unknown as { animationItem?: { currentFrame?: number } }).animationItem;
      const frame = Number(item?.currentFrame ?? 0);
      const t = frame / fr;
      lottieCurrentTimeRef.current = t;
      setCurrentTime(t);
    }, 80);
    return () => window.clearInterval(id);
  }, [playing, useLottie, hasLottie, lottieData]);

  // Track fullscreen state for proper layout
  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  // Re-sync Lottie after the video has fully decoded the seeked frame
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !plateVideoSrc) return;
    const onSeeked = () => {
      seekingRef.current = false;
      const api = lottieRef.current;
      if (!api?.animationLoaded || !lottieData) return;
      const fr = Number((lottieData as Record<string, unknown>).fr) || 30;
      const targetFrame = v.currentTime * fr;
      if (playing) {
        api.goToAndPlay(targetFrame, true);
      } else {
        api.goToAndStop(targetFrame, true);
      }
    };
    v.addEventListener("seeked", onSeeked);
    return () => v.removeEventListener("seeked", onSeeked);
  }, [plateVideoSrc, lottieData, playing]);

  useEffect(() => {
    if (!playing || !hasLottie) return;
    // Lottie-only mode: no external master clock, so no drift correction needed
    if (useLottie) return;
    const api = lottieRef.current;
    const fr = Number((lottieData as Record<string, unknown> | null)?.fr) || 30;
    if (!api || !api.animationLoaded || !Number.isFinite(fr) || fr <= 0) return;

    const id = window.setInterval(() => {
      // Skip drift correction while a seek is in progress — the seeked event handles re-sync
      if (seekingRef.current) return;
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
  }, [playing, hasLottie, useLottie, lottieData, getMasterTime]);

  const syncLottiePlayback = useCallback(() => {
    const api = lottieRef.current;
    if (!api?.animationLoaded) return;
    const fr = Number((lottieData as Record<string, unknown> | null)?.fr) || 30;
    const masterTime = getMasterTime();
    if (playing) {
      if (Number.isFinite(fr) && fr > 0 && Number.isFinite(masterTime) && masterTime >= 0) {
        api.goToAndPlay(masterTime * fr, true);
      } else {
        api.play();
      }
    } else {
      api.pause();
      // Freeze at the current frame — not frame 0 — so the paused frame stays visible
      if (Number.isFinite(fr) && fr > 0 && Number.isFinite(masterTime) && masterTime >= 0) {
        api.goToAndStop(masterTime * fr, true);
      }
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
        const shouldPlay = anyPlayed || hasLottie;
        setPlaying(shouldPlay);
        // Force Lottie back to frame 0 even if playing state didn't change
        if (hasLottie && lottieRef.current && shouldPlay) {
          window.requestAnimationFrame(() => {
            lottieRef.current?.goToAndPlay(0, true);
          });
        }
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
        .then(() => {
          setPlaying(true);
          if (hasLottie && lottieRef.current) {
            window.requestAnimationFrame(() => {
              lottieRef.current?.goToAndPlay(0, true);
            });
          }
        })
        .catch(() => setPlaying(hasLottie));
      return;
    }
    const api = lottieRef.current;
    if (useLottie && api) {
      lottieCurrentTimeRef.current = 0;
      setCurrentTime(0);
      api.goToAndStop(0, true);
      api.play();
      setPlaying(true);
      return;
    }
    setPlaying(false);
  }, [plateVideoSrc, previewAudioUrl, useLottie, hasLottie]);

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleMuteToggle = useCallback(() => {
    const next = !isMuted;
    if (videoRef.current) videoRef.current.muted = next;
    if (audioRef.current) audioRef.current.muted = next;
    setIsMuted(next);
  }, [isMuted]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTo = ratio * duration;
    if (!videoRef.current) {
      // No plate video — video.seeked never fires, sync Lottie directly
      if (audioRef.current) audioRef.current.currentTime = seekTo;
      lottieCurrentTimeRef.current = seekTo;
      setCurrentTime(seekTo);
      const api = lottieRef.current;
      if (api?.animationLoaded && lottieData) {
        const fr = Number((lottieData as Record<string, unknown>).fr) || 30;
        if (playing) {
          api.goToAndPlay(seekTo * fr, true);
        } else {
          api.goToAndStop(seekTo * fr, true);
        }
      }
      return;
    }
    // Mark seeking so the drift-correction interval skips until video.seeked fires
    seekingRef.current = true;
    videoRef.current.currentTime = seekTo;
    if (audioRef.current) audioRef.current.currentTime = seekTo;
    setCurrentTime(seekTo);
    // Lottie re-sync happens in the video "seeked" event handler (after frame is decoded)
  }, [duration, lottieData, playing]);

  const handleFullscreen = useCallback(() => {
    const el = document.getElementById("template-editor-preview");
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen().catch(() => {});
    }
  }, []);

  return (
    <div
      id="template-editor-preview"
      className={`relative mx-auto w-full ${isFullscreen ? "flex h-full items-center justify-center bg-black" : "max-w-[300px] sm:max-w-[320px] lg:max-w-[360px]"}`}
    >
      <div className={`group relative aspect-[9/16] overflow-hidden bg-black shadow-[0_12px_40px_-8px_rgba(15,23,42,0.35)] ${isFullscreen ? "h-full w-auto rounded-none border-0 ring-0" : "w-full rounded-2xl border border-black/10 ring-1 ring-black/5"}`}>
        {hasAudio && previewAudioUrl ? <audio ref={audioRef} src={previewAudioUrl} preload="metadata" muted={isMuted} /> : null}
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
                muted={isMuted}
                aria-label={posterAlt}
              />
              {useComposite ? (
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
              <Lottie
                lottieRef={lottieRef}
                animationData={lottieData}
                loop
                autoplay={false}
                className="h-full w-full [&_svg]:mx-auto [&_svg]:max-h-full [&_svg]:w-auto"
                onDOMLoaded={syncLottiePlayback}
                onDataFailed={recoverLottieData}
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

        {/* Top controls: mute + fullscreen */}
        <div className="absolute left-0 right-0 top-0 z-50 flex items-start justify-between p-3">
          <button
            type="button"
            onClick={handleMuteToggle}
            aria-label={isMuted ? "Unmute" : "Mute"}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={handleFullscreen}
            aria-label="Toggle fullscreen"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>

        {/* Preview watermark */}
        <div className="pointer-events-none absolute bottom-[3.5rem] left-4 z-50 rounded-full bg-black/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white">
          Preview: low quality
        </div>

        {/* Seekable progress bar */}
        <div
          className="absolute bottom-[2.75rem] left-0 right-0 z-50 h-1 cursor-pointer bg-white/20"
          onClick={handleSeek}
          role="slider"
          aria-label="Seek video"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-[#e85025] transition-[width] duration-150"
            style={{ width: `${useVideo || useComposite || hasAudio || useLottie ? progressPct : 0}%` }}
          />
        </div>

        {/* Bottom controls bar */}
        <div className="absolute bottom-0 left-0 right-0 z-50 flex h-11 items-center justify-between bg-black/60 px-3 text-white">
          <div className="flex items-center gap-3">
            <button type="button" onClick={restart} aria-label="Restart preview" className="opacity-75 transition hover:opacity-100">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => void togglePlaybackFromUserGesture()}
              aria-label={playing ? "Pause" : "Play"}
              className="opacity-75 transition hover:opacity-100"
            >
              {playing ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M5 3l14 9-14 9V3z" />
                </svg>
              )}
            </button>
            <span className="tabular-nums text-xs text-white/60">
              {useVideo || useComposite || hasAudio || useLottie ? formatTime(currentTime) : "00:00"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
            <div className="h-1.5 w-4 rounded-full bg-white" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
