"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Template } from "@/lib/templates";

type Props = {
  template: Template;
};

function MuteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor" aria-hidden>
      <path d="M5 9v6h4l5 5V4L9 9H5z" />
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.74 2.5-2.26 2.5-4.03z" />
      <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HoverPreviewSpinner() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center bg-black/25"
      role="status"
      aria-label="Loading preview"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
    </div>
  );
}

export function TemplateCard({ template }: Props) {
  const { id, title, category, subcategory, functions, duration, price, originalPrice, thumbnail, previewVideoUrl } = template;
  const fallbackThumb = "https://picsum.photos/seed/pixvite-template/400/711";
  const showFunctionsLine = functions >= 3;
  const showSubLine =
    subcategory &&
    subcategory !== title &&
    !title.toLowerCase().includes(subcategory.toLowerCase().slice(0, 8));

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hoverPreview, setHoverPreview] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [thumbSrc, setThumbSrc] = useState(thumbnail || fallbackThumb);

  useEffect(() => {
    setThumbSrc(thumbnail || fallbackThumb);
  }, [thumbnail]);

  const handlePointerEnter = useCallback(() => {
    if (!previewVideoUrl) return;
    setHoverPreview(true);
    setVideoReady(false);
  }, [previewVideoUrl]);

  const handlePointerLeave = useCallback(() => {
    setHoverPreview(false);
    setVideoReady(false);
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }, []);

  const handleVideoCanPlay = useCallback(() => {
    setVideoReady(true);
    const v = videoRef.current;
    if (v) void v.play().catch(() => {});
  }, []);

  const showHoverSpinner = Boolean(previewVideoUrl && hoverPreview && !videoReady);

  return (
    <Link
      href={`/templates/${id}`}
      className="group relative aspect-[9/16] w-full cursor-pointer overflow-hidden rounded-xl border border-[var(--border)]/50 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <Image
        src={thumbSrc || fallbackThumb}
        alt={title}
        fill
        unoptimized={Boolean(thumbSrc?.startsWith("http://localhost") || thumbSrc?.startsWith("http://127.0.0.1"))}
        onError={() => {
          if (thumbSrc !== fallbackThumb) setThumbSrc(fallbackThumb);
        }}
        className="object-cover transition-opacity duration-300 group-hover:scale-[1.02]"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />

      {previewVideoUrl && hoverPreview ? (
        <video
          ref={videoRef}
          src={previewVideoUrl}
          className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-300 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          muted
          playsInline
          loop
          preload="auto"
          aria-hidden
          onCanPlay={handleVideoCanPlay}
        />
      ) : null}

      {showHoverSpinner ? <HoverPreviewSpinner /> : null}

      <div
        className="absolute left-2 top-2 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 shadow-lg transition-all duration-200 group-hover:scale-110 active:scale-95 sm:left-2 sm:top-2"
        style={{ background: "rgba(0,0,0,0.45)" }}
        aria-hidden
      >
        <MuteIcon />
      </div>

      <div
        className="absolute right-2 top-2 z-20 max-w-[50%] truncate rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-foreground)] shadow-md backdrop-blur-sm sm:right-3 sm:top-3 sm:max-w-[60%] sm:px-2.5 sm:text-xs md:px-3 md:py-1.5"
        style={{ background: "var(--accent)" }}
      >
        {category.toUpperCase()}
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      <div className="absolute bottom-0 left-0 z-10 flex w-full flex-col gap-1 p-2 sm:gap-2 sm:p-3 md:p-4">
        <div
          className="pointer-events-auto line-clamp-2 cursor-pointer text-sm font-semibold text-white drop-shadow sm:text-base"
          style={{ fontFamily: "var(--font-header)" }}
        >
          {id} | {title}
        </div>
        {showSubLine ? (
          <p className="pointer-events-auto line-clamp-2 truncate text-xs text-white/80 drop-shadow">{subcategory}</p>
        ) : null}
        <div className="space-y-0.5 text-xs text-white/80">
          {showFunctionsLine ? <p className="pointer-events-auto">{functions} Functions</p> : null}
          <p className="pointer-events-auto">Dur: {duration}</p>
        </div>
        <div className="pointer-events-auto mt-auto flex min-w-0 items-end justify-start pt-1 sm:pt-2">
          <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
            <span className="flex-shrink-0 cursor-pointer text-xs text-white/60 line-through sm:text-sm">
              ₹{originalPrice.toFixed(2)}
            </span>
            <span
              className="flex-shrink-0 cursor-pointer whitespace-nowrap rounded-lg px-2 py-0.5 text-xs font-semibold text-[var(--accent-foreground)] drop-shadow sm:px-2.5 sm:py-1 sm:text-sm md:px-3"
              style={{ background: "var(--accent)" }}
            >
              ₹{price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
