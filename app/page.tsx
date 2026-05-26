export const dynamic = "force-dynamic";

import Link from "next/link";
import { FAQAccordion } from "@/components/FAQAccordion";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { InvitationCategories } from "@/components/InvitationCategories";
import { PopularTagsSection } from "@/components/PopularTagsSection";
import { WhyPixviteSection } from "@/components/WhyPixviteSection";
import { HomeTemplateGallery } from "@/components/HomeTemplateGallery";
import { CustomInvitationSection } from "@/components/CustomInvitationSection";
import { TrustStatsSection } from "@/components/TrustStatsSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { listTemplates, listSidebarCategories } from "@/lib/template-store";

export default async function HomePage() {
  const [templates, sidebarCategories] = await Promise.all([listTemplates(), listSidebarCategories()]);
  const categoryNames = sidebarCategories.map((c) => c.name);

  return (
    <>
      <section
        className="px-4 py-[clamp(3rem,6vw,6rem)] text-center text-[var(--text-primary)]"
        style={{ background: "#FBF8F3" }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex justify-center sm:mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary)]/30 bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--brand-primary)] shadow-sm backdrop-blur-sm">
              <span aria-hidden>✦</span>
              Edit &amp; Send in Minutes
            </span>
          </div>
          <h1 className="font-heading px-2 text-[32px] font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            <span className="block text-[var(--text-primary)]">
              Instant <em className="not-italic italic text-[#e85025]">Magical</em> Invitations
            </span>
            <span className="block text-[var(--text-primary)]">for Every Occasion</span>
          </h1>
          <p
            className="mx-auto mt-4 max-w-xl px-2 text-[15px] leading-relaxed sm:mt-5 sm:text-base md:text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            Pick a template. Personalise every detail. Send to your guests — no design skills needed.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:mt-9">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/templates"
                className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-full px-9 py-3.5 font-body text-sm font-bold text-white shadow-[0_8px_28px_-6px_rgba(255,100,90,0.45)] transition hover:brightness-[1.03] hover:shadow-[0_10px_32px_-6px_rgba(255,90,100,0.5)] active:scale-[0.99]"
                style={{ background: "#e85025" }}
              >
                <span aria-hidden>🔥</span>
                Start Designing Free
              </Link>
              <Link
                href="/templates"
                className="inline-flex min-w-[180px] items-center justify-center gap-1.5 rounded-full border border-gray-300 bg-white px-8 py-3.5 font-body text-sm font-semibold text-[var(--text-primary)] shadow-sm transition hover:border-gray-400 hover:bg-gray-50 active:scale-[0.99]"
              >
                Browse Templates
                <span className="text-base leading-none" aria-hidden>→</span>
              </Link>
            </div>
            <p className="text-xs text-[var(--text-muted)] sm:text-sm">
              <span className="text-green-600 font-medium">✓ No credit card required</span>
              <span className="mx-2 opacity-40">·</span>
              Free forever plan available
            </p>
          </div>
        </div>
      </section>

      <InvitationCategories />

       <HowItWorksSection />

       <PopularTagsSection />

      <HomeTemplateGallery templates={templates} categoryNames={categoryNames} />

      

      <WhyPixviteSection />


      {/* <section
        className="py-14 text-white sm:py-16"
        style={{
          background: "linear-gradient(135deg, var(--brand-gradient-start), var(--brand-gradient-end))",
        }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 md:grid-cols-4 md:gap-0 lg:px-6">
          {[
            ["50,000+", "Happy Customers"],
            ["80+", "Premium Templates"],
            ["HD", "Video Quality"],
            ["Instant", "Delivery"],
          ].map(([num, label], i) => (
            <div
              key={label}
              className={`flex flex-col items-center justify-center text-center ${
                i > 0 ? "md:border-l md:border-white/30" : ""
              }`}
            >
              <p className="font-heading text-3xl font-bold sm:text-4xl">{num}</p>
              <p className="mt-1 text-sm text-white/80">{label}</p>
            </div>
          ))}
        </div>
      </section> */}

      <FAQAccordion />

      <CustomInvitationSection />

      <TrustStatsSection />

      <TestimonialsSection />

    </>
  );
}
