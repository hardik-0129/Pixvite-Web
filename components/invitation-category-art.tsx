/** Decorative inline SVGs for homepage category tiles (no external assets). */

export function WeddingCategoryArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="100" cy="100" r="78" fill="#f5ebe0" />
      <path
        d="M100 28c-8 12-22 20-38 22 2 16-4 32-14 44 12 8 26 12 42 12s30-4 42-12c-10-12-16-28-14-44-16-2-30-10-38-22Z"
        fill="#7cb342"
        opacity={0.35}
      />
      <circle cx="100" cy="100" r="52" stroke="#8d6e63" strokeWidth="2.5" fill="none" opacity={0.45} />
      <ellipse cx="100" cy="100" rx="36" ry="36" stroke="#a1887f" strokeWidth="1.5" fill="none" opacity={0.35} />
      <path
        d="M64 100c12-20 28-32 36-32s24 12 36 32c-12 20-28 32-36 32s-24-12-36-32Z"
        fill="#e8f5e9"
        stroke="#558b2f"
        strokeWidth="1.2"
        opacity={0.9}
      />
      <path d="M100 88l6 12 13 2-9 9 2 13-12-7-12 7 2-13-9-9 13-2 6-12Z" fill="#fffde7" stroke="#333" strokeWidth="1.8" />
      <path d="M100 96v10M94 101h12" stroke="#333" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function BirthdayCategoryArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="200" height="200" fill="#fff8f0" rx="8" />
      <ellipse cx="52" cy="56" rx="14" ry="18" fill="#ff7043" opacity={0.85} />
      <ellipse cx="148" cy="52" rx="14" ry="18" fill="#42a5f5" opacity={0.85} />
      <ellipse cx="100" cy="48" rx="14" ry="18" fill="#ab47bc" opacity={0.85} />
      <rect x="78" y="118" width="44" height="28" rx="4" fill="#8d6e63" />
      <rect x="72" y="98" width="56" height="24" rx="4" fill="#ffcc80" />
      <rect x="68" y="78" width="64" height="24" rx="4" fill="#ffe0b2" />
      <rect x="96" y="62" width="8" height="20" fill="#ef5350" />
      <circle cx="100" cy="58" r="5" fill="#ffeb3b" stroke="#333" strokeWidth="1" />
      <path d="M40 120h120" stroke="#bdbdbd" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BabyCategoryArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="200" height="200" fill="#f3f8ff" rx="8" />
      <ellipse cx="56" cy="70" rx="22" ry="26" fill="#90caf9" opacity={0.9} />
      <ellipse cx="100" cy="58" rx="22" ry="26" fill="#ffab91" opacity={0.95} />
      <ellipse cx="144" cy="72" rx="22" ry="26" fill="#ce93d8" opacity={0.9} />
      <ellipse cx="100" cy="130" rx="38" ry="14" fill="#fff" stroke="#bdbdbd" strokeWidth="1.5" />
      <rect x="88" y="108" width="24" height="28" rx="6" fill="#ffecb3" stroke="#333" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="4" fill="#ff7043" />
    </svg>
  );
}

export function EngagementCategoryArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="200" height="200" fill="#fff5f8" rx="8" />
      <path
        d="M48 52c12-8 28-4 36 8M152 52c-12-8-28-4-36 8"
        stroke="#ffcdd2"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="70" cy="48" r="6" fill="#ef5350" opacity={0.85} />
      <circle cx="130" cy="44" r="5" fill="#ef5350" opacity={0.75} />
      <circle cx="150" cy="68" r="7" fill="#ef5350" opacity={0.9} />
      <circle cx="78" cy="120" r="22" fill="#ffe0b2" stroke="#333" strokeWidth="1.5" />
      <circle cx="122" cy="118" r="22" fill="#ffccbc" stroke="#333" strokeWidth="1.5" />
      <path d="M92 118c8 6 20 6 28 0" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M100 100c-6-10-6-22 0-32s18-8 24 2c6-10 18-12 24-2s6 22 0 32" fill="#ffcdd2" opacity={0.5} />
    </svg>
  );
}
