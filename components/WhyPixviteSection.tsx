import type { ComponentType } from "react";
import { sectionHeading } from "@/lib/sectionHeading";

function IconBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${className ?? ""}`}
      style={{
        background: "linear-gradient(180deg, #ff9068 0%, #ff4b2b 100%)",
      }}
    >
      {children}
    </div>
  );
}

function IconEye() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconCard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function IconDollar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 3v12M8 11l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 21h16" strokeLinecap="round" />
    </svg>
  );
}

function IconHeadset() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1v-5h2a1 1 0 0 1 1 1v2Z" />
      <path d="M3 19a2 2 0 0 0 2 2h1v-5H4a1 1 0 0 0-1 1v2Z" />
    </svg>
  );
}

const topFeatures = [
  {
    title: "Instant Live Preview",
    description: "See every change in real-time before downloading your final HD video.",
    Icon: IconEye,
  },
  {
    title: "Edit First, Pay Later",
    description: "Make unlimited edits. Pay only when you're 100% satisfied.",
    Icon: IconCard,
  },
  {
    title: "Affordable Pricing",
    description: "Premium-quality video invites at a fraction of traditional design costs.",
    Icon: IconDollar,
  },
] as const;

const bottomFeatures = [
  {
    title: "HD Download",
    description: "Export crisp full-HD invites ready to share on Instagram & WhatsApp.",
    Icon: IconDownload,
  },
  {
    title: "24/7 Support",
    description: "Have questions? Our Insta support team is always available to help.",
    Icon: IconHeadset,
  },
] as const;

function CircleCard({
  title,
  description,
  Icon,
  zIndex,
  offsetBottom,
}: {
  title: string;
  description: string;
  Icon: ComponentType;
  zIndex: number;
  /** Pixels; used with `relative` for bottom-row overlap (e.g. HD Download, 24/7 Support) */
  offsetBottom?: number;
}) {
  return (
    <div
      className="relative flex h-[min(100vw-3rem,220px)] w-[min(100vw-3rem,220px)] shrink-0 flex-col items-center rounded-full border-2 bg-white px-5 pb-6 pt-7 text-center shadow-[0_6px_28px_rgba(0,0,0,0.07)] sm:h-56 sm:w-56 md:h-[232px] md:w-[232px] md:px-6 md:pb-7 md:pt-8"
      style={{
        borderColor: "#ffd3c4",
        zIndex,
        ...(offsetBottom != null ? { bottom: offsetBottom } : {}),
      }}
    >
      <IconBadge>
        <Icon />
      </IconBadge>
      <h3 className="font-heading mt-3 text-[15px] font-bold leading-snug text-[var(--text-primary)] sm:text-base">{title}</h3>
      <p className="mt-2 max-w-[13rem] text-[12px] leading-relaxed text-[#666666] sm:text-[13px]">{description}</p>
    </div>
  );
}

export function WhyPixviteSection() {
  return (
    <section className="bg-[#fafafa] py-14 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6">
        <h2 className={`text-center leading-tight tracking-tight ${sectionHeading}`}>
          <span className="text-[var(--text-primary)]">Why </span>
          <span style={{ color: "#ff5a5f" }}>Pixvite</span>
        </h2>

        <div className="mt-12 hidden md:flex md:flex-col md:items-center">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 lg:gap-x-10">
            {topFeatures.map((f, i) => (
              <CircleCard key={f.title} {...f} zIndex={10 + i} />
            ))}
          </div>
          <div className="-mt-11 flex flex-wrap justify-center gap-x-6 gap-y-4 lg:-mt-12 lg:gap-x-10">
            {bottomFeatures.map((f) => (
              <CircleCard key={f.title} {...f} zIndex={9} offsetBottom={30} />
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 justify-items-center gap-8 sm:grid-cols-2 md:hidden">
          {[...topFeatures, ...bottomFeatures].map((f, i) => (
            <CircleCard key={f.title} {...f} zIndex={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
