"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { TemplateCard } from "@/components/TemplateCard";
import { sectionHeading } from "@/lib/sectionHeading";
import type { Template } from "@/lib/templates";

type Props = { templates: Template[]; categoryNames?: string[] };

export function HomeTemplateGallery({ templates, categoryNames = [] }: Props) {
  const [active, setActive] = useState("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ dragging: false, startX: 0, scrollLeft: 0 });

  function onMouseDown(e: React.MouseEvent) {
    dragState.current = { dragging: true, startX: e.pageX, scrollLeft: scrollRef.current?.scrollLeft ?? 0 };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragState.current.dragging || !scrollRef.current) return;
    e.preventDefault();
    scrollRef.current.scrollLeft = dragState.current.scrollLeft - (e.pageX - dragState.current.startX);
  }
  function onMouseUp() { dragState.current.dragging = false; }

  const CATEGORIES = [
    { label: "All", value: "all" },
    ...[...new Set(categoryNames)].map((name) => ({ label: name, value: name })),
  ];

  const filtered =
    active === "all"
      ? templates.slice(0, 8)
      : templates.filter((t) => t.category === active).slice(0, 8);

  return (
    <section className="bg-white py-12 sm:py-14 md:py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--brand-primary)]">
              Template Gallery
            </p>
            <h2 className={`${sectionHeading} leading-tight tracking-tight`}>
              <span className="text-[var(--text-primary)]">1000+ Templates — Ready To </span>
              <em className="not-italic italic text-[#e85025]">Edit Now</em>
            </h2>
          </div>
          <Link
            href="/templates"
            className="shrink-0 text-sm font-semibold text-[#e85025] underline-offset-4 hover:underline sm:text-base"
          >
            View all templates →
          </Link>
        </div>

        {/* Category filter pills */}
        <div
          ref={scrollRef}
          className="mb-8 overflow-x-auto hide-scrollbar pb-1 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <div className="flex w-max gap-2">
            {CATEGORIES.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setActive(value)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active === value
                    ? "shadow-sm"
                    : "border border-gray-200 bg-white text-[var(--text-primary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                }`}
                style={active === value ? { background: "#e85025", color: "#ffffff" } : undefined}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Template grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-[var(--text-muted)]">No templates found in this category.</p>
        )}
      </div>
    </section>
  );
}
