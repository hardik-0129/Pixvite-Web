"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = " InvitesMagic -offer-end";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function useOfferCountdown() {
  const [label, setLabel] = useState("00:00:00");

  useEffect(() => {
    let end = 0;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        end = parseInt(stored, 10);
      }
      if (!end || end < Date.now()) {
        end = Date.now() + 14 * 60 * 60 * 1000;
        sessionStorage.setItem(STORAGE_KEY, String(end));
      }
    } catch {
      end = Date.now() + 14 * 60 * 60 * 1000;
    }

    const tick = () => {
      setLabel(formatRemaining(end - Date.now()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return label;
}
