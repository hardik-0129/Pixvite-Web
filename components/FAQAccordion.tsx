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
    q: "How do I create my Video Invitation?",
    a: "Once you customize the video and enter all your details we will instantly generate a preview video (with a watermark) for you to check and verify the details before you make a final payment. Once you have made a payment, the video will be available to download. You can also download it from \"My Video\" at any preferred time.",
  },
  {
    q: "Can I get a Preview Video?",
    a: (
      <>
        Yes, we provide an instant preview of your generated video. This gives great confidence to our customers whether
        they need to go for a purchase or not. Our team works really hard in the background to provide you this real-time
        experience.
        <br /><br />
        None of our competitors provide a live preview and there are a lot of hidden costs involved when you go for a
        manual process with them. But here you can get it all done in less than 5 minutes and without any hidden cost.
      </>
    ),
  },
  {
    q: "Can I customize the video further?",
    a: (
      <>
        We create all videos as per the preview shown above. Any changes, addition or removal will be considered as a
        customization and charged based on designer effort required to complete the changes.
        <br /><br />
        For Customization Requests, contact our support at{" "}
        <a href="mailto:support@invitesmagic.com" className="text-[#e85025] underline underline-offset-2">
          support@invitesmagic.com
        </a>{" "}
        or contact us on WhatsApp before placing the order.
      </>
    ),
  },
  {
    q: "How to download my video invitation?",
    a: "After making the payment you will be redirected to the download video page instantly. From there you can download it, and for any later time the video will be available in your \"My Video\" section as per our privacy terms.",
  },
  {
    q: "Can I get a copy of the Video File?",
    a: "Of course. You can download a copy of the video once it is created. You can share it on WhatsApp, Facebook, etc. just like a regular video file.",
  },
  {
    q: "Is InvitesMagic secure?",
    a: "All your images are uploaded to our secure server. The images will be deleted automatically after creating the video within 10 days.",
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
      style={{ background: "#FBF8F3" }}
    >
      <div className="mx-auto max-w-[1400px] px-4">
        <h2 className={`text-center leading-tight tracking-tight ${sectionHeading}`}>
          <span className="text-[var(--text-primary)]">Frequently Asked </span>
          <span className="text-[#e85025]">Questions</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-[15px] leading-relaxed text-[#888888] sm:text-base">
          Everything you need to know about creating digital invitations
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
