"use client";

import { useState } from "react";

export function VideoPlayer() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-xl bg-[#111] shadow-lg">
      <div className="relative aspect-[9/16] w-full">
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-amber-900/40 via-stone-900 to-black"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(255,200,120,0.25), transparent 45%), linear-gradient(180deg, #2a1810, #0a0a0a)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 flex flex-wrap content-center items-center justify-center gap-6 p-4 text-[10px] text-white/[0.12]">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i}> InvitesMagic .com</span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg text-[var(--text-primary)] shadow-md"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? "❚❚" : "▶"}
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-2 bg-black/60 px-2 py-2 text-xs text-white">
          <button type="button" className="px-1" aria-label="Restart">
            ↺
          </button>
          <button type="button" onClick={() => setPlaying(!playing)} className="px-1">
            {playing ? "❚❚" : "▶"}
          </button>
          <span className="tabular-nums text-white/80">00:00</span>
          <div className="h-1 flex-1 rounded-full bg-white/20">
            <div className="h-full w-1/3 rounded-full bg-[var(--brand-primary)]" />
          </div>
          <span className="text-white/70">🔊</span>
          <span className="text-white/70">⛶</span>
        </div>
      </div>
    </div>
  );
}
