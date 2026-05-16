"use client";

import Link from "next/link";
import { sectionHeading } from "@/lib/sectionHeading";
import { useRouter } from "next/navigation";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import "swiper/css";

const marqueeRowForward: { label: string; color: string }[] = [
  { label: "Baby Shower Ceremony", color: "#e91e63" },
  { label: "Wedding Bells", color: "#16a085" },
  { label: "Haldi da Rang", color: "#00a8ff" },
  { label: "boat", color: "#5f27cd" },
  { label: "Big fat wedding", color: "#ffd1dc" },
  { label: "Sikh Wedding Invite", color: "#34495e" },
  { label: "Punjabi Wedding", color: "#ffe082" },
  { label: "Singh Family", color: "#00a8ff" },
  { label: "Sikh Family", color: "#ffc107" },
  { label: "DJ Night", color: "#98fb98" },
  { label: "Dhol", color: "#ff758f" },
  { label: "music", color: "#95a5a6" },
  { label: "Jain Invitation", color: "#ffc107" },
  { label: "Derasar", color: "#f06292" },
  { label: "Shah family", color: "#ffd54f" },
  { label: "Jain family", color: "#00a8ff" },
  { label: "Parna ritual", color: "#ffc107" },
  { label: "Jain Ritual", color: "#ff5252" },
  { label: "Parna", color: "#00a8ff" },
  { label: "Tapasvi", color: "#ffeb3b" },
  { label: "Phera", color: "#00a8ff" },
  { label: "Ring Ceremony", color: "#ff7043" },
  { label: "Haldi Hues", color: "#00a8ff" },
  { label: "Engagement Invitation", color: "#d500f9" },
  { label: "Radha Krishna", color: "#f06292" },
];

const marqueeRowReverse: { label: string; color: string }[] = [
  { label: "Baby Shower Invitation", color: "#ffd1dc" },
  { label: "Baby on board", color: "#1dd1a1" },
  { label: "Baby Shower", color: "#fff59d" },
  { label: "Date Reveal", color: "#fbc02d" },
  { label: "Muslim Wedding", color: "#00a8ff" },
  { label: "Sheikh Family", color: "#fff59d" },
  { label: "Walima", color: "#e056fd" },
  { label: "Nikah", color: "#2e86de" },
  { label: "Wedding Muhrat", color: "#ffc107" },
  { label: "Hast Milaap", color: "#ff9fdb" },
  { label: "Wedding Vows", color: "#00a8ff" },
  { label: "Barat", color: "#ff9fdb" },
  { label: "Baarat", color: "#ffe082" },
  { label: "Siya Mangal", color: "#ff7043" },
  { label: "Spiritual", color: "#10ac84" },
  { label: "Ayodhya", color: "#d500f9" },
  { label: "Ram Mandir", color: "#e85025" },
  { label: "Vivaah Mahotsav", color: "#ff9fdb" },
  { label: "Raas Utsav", color: "#00d2d3" },
  { label: "Mandapam Muhrat", color: "#fff59d" },
  { label: "Muhrat", color: "#ffc107" },
  { label: "Mandap Muhrat", color: "#f368e0" },
  { label: "Grah Pravesh", color: "#00b894" },
  { label: "House Warming Party", color: "#7b61ff" },
  { label: "House Warming", color: "#ff758f" },
];

function tagHref(label: string) {
  return `/templates?q=${encodeURIComponent(label)}`;
}

function TagPill({ label, color }: { label: string; color: string }) {
  return (
    <Link
      href={tagHref(label)}
      className="group/tag relative flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-xl sm:gap-2 sm:px-3 sm:py-1.5 md:gap-3 md:px-4 md:py-2 lg:px-5 lg:py-2.5"
      style={{
        background: "linear-gradient(135deg, var(--card), var(--muted))",
        border: "2px solid var(--border)",
      }}
    >
      <span
        className="text-lg transition-transform duration-300 group-hover/tag:scale-125 sm:text-xl md:text-2xl"
        style={{ color, transform: "translateY(-3px)" }}
        aria-hidden
      >
        #
      </span>
      <span className="-ml-1 font-heading text-xs font-semibold text-[var(--foreground)] transition-colors duration-300 sm:text-sm">
        {label}
      </span>
    </Link>
  );
}

function TagsSwiperRow({
  items,
  reverse,
}: {
  items: { label: string; color: string }[];
  reverse?: boolean;
}) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const loopItems = useMemo(() => [...items, ...items], [items]);

  return (
    <Swiper
      modules={[Autoplay]}
      slidesPerView="auto"
      spaceBetween={8}
      breakpoints={{ 640: { spaceBetween: 16 } }}
      loop={true}
      speed={4000}
      autoplay={{
        delay: 0,
        disableOnInteraction: false,
        pauseOnMouseEnter: false,
        reverseDirection: reverse, // 🔥 THIS controls direction
      }}
      allowTouchMove={false}
      className="popular-tags-swiper w-full !overflow-hidden "
      wrapperClass="items-center"
    >
      {loopItems.map(({ label, color }, index) => (
        <SwiperSlide
          key={`${reverse ? "r" : "f"}-${index}-${label}`}
          className="!w-auto"
        >
          <TagPill label={label} color={color} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

export function PopularTagsSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sort && sort !== "recent") params.set("sort", sort);
    const s = params.toString();
    router.push(s ? `/templates?${s}` : "/templates");
  }

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, rgba(255,153,102,0.08), rgba(255,94,98,0.08), var(--card))",
      }}
    >
      <div
        className="absolute left-1/4 top-0 -z-0 h-32 w-32 rounded-full opacity-20 blur-3xl sm:h-48 sm:w-48 md:h-64 md:w-64"
        style={{ backgroundColor: "var(--brand-start)" }}
        aria-hidden
      />
      <div
        className="absolute bottom-0 right-1/4 -z-0 h-32 w-32 rounded-full opacity-20 blur-3xl sm:h-48 sm:w-48 md:h-64 md:w-64"
        style={{ backgroundColor: "var(--brand-end)" }}
        aria-hidden
      />

      <div className="relative z-10 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="mx-auto mb-6 max-w-[1400px] px-2 sm:mb-8 sm:px-4 md:mb-10 md:px-6 lg:mb-12 lg:px-8">
          <div className="text-center">
            <h2
              className={`mb-3 px-2 sm:mb-4 md:mb-6 ${sectionHeading} uppercase tracking-tight text-[var(--foreground)]`}
            >
              OUR <span style={{ color: "var(--brand-end)" }}>POPULAR #</span>
            </h2>
            <p
              className="mx-auto max-w-3xl px-2 text-sm text-[var(--muted-foreground)] sm:text-base md:text-lg"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Dive into a world of limitless creative possibilities
            </p>
          </div>
        </div>

        <div className="relative flex w-full flex-col items-center justify-center gap-2 overflow-x-hidden sm:gap-8 ">
          <TagsSwiperRow items={marqueeRowForward} />
          <TagsSwiperRow items={marqueeRowReverse} reverse />

          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-20 w-1/4"
            style={{
              background: "linear-gradient(to right, var(--card), rgba(255,255,255,0.8), transparent)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-20 w-1/4"
            style={{
              background: "linear-gradient(to left, var(--card), rgba(255,255,255,0.8), transparent)",
            }}
            aria-hidden
          />
        </div>

        <form
          onSubmit={onSubmit}
          className="mx-auto mt-10 flex max-w-6xl flex-col gap-3 px-4 sm:mt-12 sm:flex-row sm:items-stretch sm:gap-3 md:mt-14 lg:px-8"
          role="search"
          aria-label="Search templates"
        >
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" strokeLinecap="round" />
              </svg>
            </span>
            <input
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates..."
              className="h-12 w-full rounded-2xl border border-[var(--border-card)] bg-white py-2 pl-11 pr-4 text-sm text-[var(--text-primary)] shadow-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20"
              autoComplete="off"
            />
          </div>
          <div className="flex gap-2 sm:shrink-0">
            <div className="relative min-w-0 flex-1 sm:min-w-[170px] sm:flex-initial">
              <select
                name="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-12 w-full cursor-pointer appearance-none rounded-2xl border border-[var(--border-card)] bg-white py-2 pl-4 pr-10 text-sm font-medium text-[var(--text-primary)] shadow-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                aria-label="Sort templates"
              >
                <option value="recent">Recently Added</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            <button
              type="submit"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-card)] bg-white text-[var(--text-primary)] shadow-sm transition hover:border-[var(--brand-primary)] hover:bg-[var(--brand-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25"
              aria-label="Apply search and sort"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 5l4-3 4 3M8 19l4 3 4-3" stroke="currentColor" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
