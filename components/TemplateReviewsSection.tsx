"use client";

import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
// ── Types (mirrored from review-store — kept local to avoid server-module import) ──
type PublicReview = {
  id: string;
  templateId: string;
  name: string;
  rating: number;
  text: string;
  createdAt: string;
};

type ReviewStats = {
  average: number;
  total: number;
  distribution: { stars: number; count: number; percent: number }[];
};

// ── Avatar colour from first letter of name ───────────────────────────────────
const AVATAR_COLORS = [
  "#e85025", "#0d9488", "#9b59b6", "#d97706", "#0891b2", "#be185d",
];
function avatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

const EMPTY_STATS: ReviewStats = {
  average: 0,
  total: 0,
  distribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0, percent: 0 })),
};

// ── Star display ──────────────────────────────────────────────────────────────
function StarDisplay({ count, size = 18, color = "#FFB800" }: { count: number; size?: number; color?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= count ? color : "#e5e7eb"} aria-hidden>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// ── Single review card — matches TestimonialsSection design ──────────────────
function ReviewCard({ review }: { review: PublicReview }) {
  const [expanded, setExpanded] = useState(false);
  const PREVIEW = 160;
  const isLong = review.text.length > PREVIEW;
  const displayText = expanded || !isLong ? review.text : review.text.slice(0, PREVIEW) + "...";

  return (
    <div className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)] sm:p-7">
      {/* Stars */}
      <StarDisplay count={review.rating} size={16} color="#e85025" />

      {/* Quote */}
      <p className="flex-1 text-sm italic leading-relaxed sm:text-[15px]" style={{ color: "var(--text-secondary)" }}>
        &ldquo;{displayText}&rdquo;
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-1 not-italic font-semibold hover:underline"
            style={{ color: "#e85025" }}
          >
            {expanded ? "Read Less" : "Read More"}
          </button>
        )}
      </p>

      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: avatarColor(review.name) }}
        >
          {review.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {review.name}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Verified Customer
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
export function TemplateReviewsSection({ templateId }: { templateId: string }) {
  // Form state
  const [name, setName] = useState("");
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Data state
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [stats, setStats] = useState<ReviewStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  // Fetch this template's approved reviews on mount
  useEffect(() => {
    setLoading(true);
    fetch(`/api/reviews?templateId=${encodeURIComponent(templateId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.reviews)) setReviews(data.reviews);
        if (data.stats) setStats(data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [templateId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormMsg(null);

    if (!name.trim()) {
      setFormMsg({ type: "error", text: "Please enter your name." });
      return;
    }
    if (!reviewText.trim() || reviewText.trim().length < 10) {
      setFormMsg({ type: "error", text: "Review must be at least 10 characters." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          name: name.trim(),
          rating: selectedRating,
          text: reviewText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormMsg({ type: "error", text: data.error || "Something went wrong." });
      } else {
        setFormMsg({ type: "success", text: data.message || "Review submitted! Pending approval." });
        setName("");
        setReviewText("");
        setSelectedRating(5);
      }
    } catch {
      setFormMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className="py-16 sm:py-20"
      style={{
        background: "linear-gradient(170deg, #fff0f0 0%, #fff8f6 35%, #ffffff 70%)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="mb-10 text-center sm:mb-12">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "#e85025" }}>
            Reviews &amp; Ratings
          </p>
          <h2
            className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-header)" }}
          >
            Customer <span style={{ color: "#e85025" }}>Reviews</span>
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            See why thousands of customers love creating their perfect invitations with us.
          </p>
        </div>

        {/* ── Rating summary + Submit form ── */}
        <div className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-2">

          {/* Rating summary card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:p-8">
            <div className="mb-1 flex items-baseline gap-1">
              <span className="text-4xl font-bold" style={{ color: "#e85025" }}>
                {stats.average > 0 ? stats.average.toFixed(1) : "—"}
              </span>
              <span className="text-xl font-medium text-[var(--text-muted)]">&nbsp;/ 5</span>
            </div>
            <p className="mb-6 text-sm text-[var(--text-secondary)]">
              {stats.total === 0 ? (
                "No ratings yet — be the first!"
              ) : (
                <>
                  Based on{" "}
                  <span className="font-bold text-[var(--text-primary)]">{stats.total}</span>{" "}
                  customer {stats.total === 1 ? "rating" : "ratings"}
                </>
              )}
            </p>
            <div className="flex flex-col gap-3.5">
              {stats.distribution.map(({ stars, percent }: { stars: number; count: number; percent: number }) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="w-10 shrink-0 text-right text-xs text-[var(--text-secondary)]">
                    {stars} star
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${percent}%`,
                        background: percent > 0 ? "#e85025" : "transparent",
                      }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-xs text-[var(--text-secondary)]">
                    {percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit review card */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:p-8">
            {/* Decorative corner */}
            <div
              className="pointer-events-none absolute right-0 top-0 h-24 w-24"
              style={{
                background: "linear-gradient(225deg, #fce4ec 0%, transparent 65%)",
                clipPath: "polygon(100% 0, 0 0, 100% 100%)",
              }}
            />
            <div className="absolute right-4 top-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M22 2L11 13" stroke="#e85025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#e85025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Share Your Experience
            </h3>
            <p className="mt-1 mb-4 text-sm text-[var(--text-secondary)]">
              How was your invitation design?
            </p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
              {/* Star rating */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setSelectedRating(star)}
                    className="focus:outline-none"
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  >
                    <svg
                      width="30"
                      height="30"
                      viewBox="0 0 24 24"
                      fill={star <= (hoverRating || selectedRating) ? "#FFB800" : "#e5e7eb"}
                      className="transition-colors duration-150"
                      aria-hidden
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
              </div>

              {/* Name input */}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={60}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder:text-[var(--text-muted)] focus:border-[#e85025] focus:outline-none focus:ring-2 focus:ring-[#e85025]/20"
                style={{ color: "var(--text-primary)" }}
              />

              {/* Review textarea */}
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell us what you loved about this template..."
                rows={4}
                maxLength={1000}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder:text-[var(--text-muted)] focus:border-[#e85025] focus:outline-none focus:ring-2 focus:ring-[#e85025]/20"
                style={{ color: "var(--text-primary)" }}
              />

              {/* Feedback message */}
              {formMsg && (
                <p
                  className="rounded-lg px-3 py-2 text-xs font-medium"
                  style={{
                    background: formMsg.type === "success" ? "#f0fdf4" : "#fff1f0",
                    color: formMsg.type === "success" ? "#16a34a" : "#dc2626",
                    border: `1px solid ${formMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                  }}
                >
                  {formMsg.text}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: "#e85025", color: "#ffffff" }}
                >
                  {submitting ? "Submitting…" : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── What customers say ── */}
        <div className="mb-8 text-center">
          <h3 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
            What Customer Say About Us
          </h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            See why creators, planners, and families choose us for their most important celebrations.
          </p>
        </div>

        {/* ── Review carousel ── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              No reviews yet for this template. Be the first to share your experience!
            </p>
          </div>
        ) : (
          <Swiper
            modules={[Autoplay, Pagination]}
            slidesPerView={1}
            spaceBetween={24}
            loop={reviews.length > 3}
            autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            pagination={{ clickable: true }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="!pb-10"
          >
            {reviews.map((review) => (
              <SwiperSlide key={review.id} className="h-auto">
                <ReviewCard review={review} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>

      <style>{`
        .swiper-pagination-bullet { background: #d1d5db; opacity: 1; }
        .swiper-pagination-bullet-active { background: #e85025; }
      `}</style>
    </section>
  );
}
