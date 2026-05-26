"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const reviews = [
  {
    category: "Wedding",
    categoryColor: { bg: "#fff0eb", text: "#e85025" },
    stars: 5,
    quote:
      "I designed my wedding invites in under 20 minutes. Everyone kept asking which designer I hired. I just smiled and said InviteMagic!",
    name: "Priya Sharma",
    role: "Bride, Mumbai",
    avatarBg: "#e85025",
    initial: "P",
  },
  {
    category: "Festival",
    categoryColor: { bg: "#e6f7f4", text: "#0d9488" },
    stars: 5,
    quote:
      "We use InviteMagic for all our Diwali and Eid posts at the office. It's fast, beautiful and our clients love it. Worth every rupee.",
    name: "Rajan Mehta",
    role: "Marketing Manager, Delhi",
    avatarBg: "#e85025",
    initial: "R",
  },
  {
    category: "Birthday",
    categoryColor: { bg: "#e6f7f4", text: "#0d9488" },
    stars: 5,
    quote:
      "Sent my son's birthday video invite on WhatsApp and everyone loved the animation. The template was perfect and editing took 5 minutes flat.",
    name: "Anita Patel",
    role: "Mother of 2, Ahmedabad",
    avatarBg: "#0d9488",
    initial: "A",
  },
  {
    category: "Anniversary",
    categoryColor: { bg: "#fef3e2", text: "#d97706" },
    stars: 5,
    quote:
      "Made our 25th anniversary invite in minutes. Our family was blown away — they thought we hired a professional studio. Absolutely love this platform!",
    name: "Sunita Verma",
    role: "Homemaker, Jaipur",
    avatarBg: "#d97706",
    initial: "S",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#e85025" aria-hidden>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ category, categoryColor, stars, quote, name, role, avatarBg, initial }: typeof reviews[0]) {
  return (
    <div className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)] sm:p-7">
      <span
        className="w-fit rounded-full px-3 py-1 text-xs font-semibold"
        style={{ background: categoryColor.bg, color: categoryColor.text }}
      >
        {category}
      </span>
      <Stars count={stars} />
      <p className="flex-1 text-sm italic leading-relaxed sm:text-[15px]" style={{ color: "var(--text-secondary)" }}>
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: avatarBg }}
        >
          {initial}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{name}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{role}</p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-16 sm:py-20" style={{ background: "#FBF8F3" }}>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center sm:mb-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "#e85025" }}>
            Loved by Users
          </p>
          <h2
            className="font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: "var(--text-primary)" }}
          >
            Real people, real
            <br />
            celebrations
          </h2>
        </div>

        {/* Swiper slider */}
        <Swiper
          modules={[Autoplay, Pagination]}
          slidesPerView={1}
          spaceBetween={24}
          loop={true}
          autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="!pb-10"
        >
          {reviews.map((review) => (
            <SwiperSlide key={review.name} className="h-auto">
              <ReviewCard {...review} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style>{`
        .swiper-pagination-bullet { background: #d1d5db; opacity: 1; }
        .swiper-pagination-bullet-active { background: #e85025; }
      `}</style>
    </section>
  );
}
