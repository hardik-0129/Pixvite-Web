"use client";

import { useId } from "react";

const GRADIENT_STOPS = (
  <>
    <stop offset="0%" stopColor="#f09433" />
    <stop offset="25%" stopColor="#e6683c" />
    <stop offset="50%" stopColor="#dc2743" />
    <stop offset="75%" stopColor="#cc2366" />
    <stop offset="100%" stopColor="#bc1888" />
  </>
);

type Props = {
  className?: string;
};

export function InstagramSupportLink({ className = "" }: Props) {
  const raw = useId().replace(/:/g, "");
  const gid = `ig-${raw}`;

  return (
    <a
      href="https://www.instagram.com/pixvite/"
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-200 xs:gap-2 xs:px-3 xs:py-2 xs:text-sm sm:gap-2.5 sm:px-4 sm:py-2.5 ${className}`}
    >
      <span className="relative inline-flex flex-shrink-0 items-center justify-center">
        <svg width="0" height="0" className="absolute" aria-hidden>
          <defs>
            <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
              {GRADIENT_STOPS}
            </linearGradient>
          </defs>
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 xs:h-[18px] xs:w-[18px] sm:h-5 sm:w-5"
          aria-hidden
          style={{ stroke: `url(#${gid})`, fill: "none" }}
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      </span>
      <span className="whitespace-nowrap">Support</span>
    </a>
  );
}
