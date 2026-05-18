"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { sectionHeading } from "@/lib/sectionHeading";

type FAQItem = {
  q: string;
  a: ReactNode;
};

const items: FAQItem[] = [
  {
    q: "What is InvitesMagic and how does it work?",
    a: (
      <>
        InvitesMagic is an online platform where you can create{" "}
        <strong className="font-semibold text-[#333333]">beautiful HD video invitations</strong> for weddings,
        birthdays, and special events. Choose a template you love, personalize names, dates, and venues in our{" "}
        <strong className="font-semibold text-[#333333]">live preview editor</strong>, and when you&apos;re happy,{" "}
        <strong className="font-semibold text-[#333333]">download the full-HD video instantly</strong> — edit first,
        pay only when you&apos;re satisfied.
      </>
    ),
  },
  {
    q: "Can I edit my video invitation before paying?",
    a: (
      <>
        Yes. You can make unlimited edits in the preview until everything looks perfect. Payment is only required when
        you&apos;re ready to download your final high-definition video.
      </>
    ),
  },
  {
    q: "What format do I receive my invitation in?",
    a: "You get a crisp MP4 file in full HD, ideal for WhatsApp, Instagram, email, and sharing with guests on any device.",
  },
  {
    q: "How long does it take to make my video?",
    a: "Most invitations are ready within minutes after you confirm your details. Complex edits may take a little longer, but you&apos;ll see updates live in the editor.",
  },
  {
    q: "Do I need an account to use InvitesMagic?",
    a: "You can browse templates without signing up. Creating a draft, saving progress, and downloading may require a free account so we can deliver your video securely.",
  },
];

function ChevronUp({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      className="py-16 sm:py-20"
      style={{
        background: "linear-gradient(180deg, #fff8f6 0%, #fefcfa 45%, #faf8f6 100%)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-4">
        <h2 className={`text-center leading-tight tracking-tight ${sectionHeading}`}>
          <span className="text-[var(--text-primary)]">Frequently Asked </span>
          <span className="text-[#e85025]">Questions</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-[15px] leading-relaxed text-[#888888] sm:text-base">
          Everything you need to know about creating beautiful video invitations with InvitesMagic
        </p>
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">

        <ul className="mt-10 space-y-4 sm:mt-12">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q}>
                <div
                  className={`overflow-hidden rounded-2xl border bg-white shadow-[0_2px_14px_rgba(0,0,0,0.05)] transition-[border-color,box-shadow] duration-200 ${
                    isOpen ? "border-[#ffc9c0]" : "border-[#ebebeb]"
                  }`}
                >
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors sm:px-6 sm:py-5 ${
                      isOpen ? "bg-[#f5f5f5]" : "bg-white hover:bg-[#fafafa]"
                    }`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    <span
                      className="font-heading text-[15px] font-semibold leading-snug sm:text-base"
                      style={{ color: isOpen ? "#e85025" : "var(--text-primary)" }}
                    >
                      {item.q}
                    </span>
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                        isOpen ? "bg-[#e85025] text-white" : "bg-[#ececec] text-[#555555]"
                      }`}
                      aria-hidden
                    >
                      {isOpen ? <ChevronUp /> : <ChevronDown />}
                    </span>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-[#ebebeb] bg-white px-5 pb-5 pt-1 sm:px-6 sm:pb-6">
                        <p className="text-[15px] leading-relaxed text-[#555555]">{item.a}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        </div>
      </div>
    </section>
  );
}
