"use client";

import { useOfferCountdown } from "./CountdownTimer";

export function AnnouncementBar() {
  const countdown = useOfferCountdown();

  return (
    <div
      className="flex h-9 w-full shrink-0 items-center justify-center px-3 text-center text-[13px] font-medium text-white"
      style={{
        background: "#e85025",
      }}
    >
      50% off &nbsp;•&nbsp; Limited Time Offer &nbsp;•&nbsp; Ends in{" "}
      <span className="ml-1 tabular-nums">{countdown}</span>
    </div>
  );
}
