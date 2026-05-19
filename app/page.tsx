export const dynamic = "force-dynamic";

import Link from "next/link";
import { FAQAccordion } from "@/components/FAQAccordion";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { InvitationCategories } from "@/components/InvitationCategories";
import { PopularTagsSection } from "@/components/PopularTagsSection";
import { WhyPixviteSection } from "@/components/WhyPixviteSection";
import { TemplateCard } from "@/components/TemplateCard";
import { sectionHeading } from "@/lib/sectionHeading";
import { listTemplates } from "@/lib/template-store";

const showcaseIds = ["IM188", "IM187", "IM186", "IM185"];

export default async function HomePage() {
  const templates = await listTemplates();
  const showcased = showcaseIds.map((id) => templates.find((t) => t.id === id)).filter(Boolean) as typeof templates;
  const popular = [...showcased, ...templates.filter((t) => !showcaseIds.includes(t.id))].slice(0, 8);

  return (
    <>
      <section
        className="px-4 py-[clamp(3rem,6vw,6rem)] text-center text-[var(--text-primary)]"
        style={{
          background: "linear-gradient(to bottom, rgba(255, 153, 102, 0.15), rgba(255, 94, 98, 0.15), white)",
        }}
      >
        <div className="mx-auto max-w-5xl">
          <h1 className="font-heading px-2 text-[27px] font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
            <span className="block text-[var(--text-primary)]">Instant Video Invites at the</span>
            <span className="mt-1 block text-[#e8735a] sm:mt-1.5">Most Affordable Price</span>
          </h1>
          <p
            className="mx-auto mt-4 max-w-2xl px-2 text-[15px] leading-relaxed sm:mt-5 sm:text-base md:text-lg"
            style={{ color: "var(--foreground)" }}
          >
            Customize every detail with a live preview. Edit first, pay later only when satisfied, and download instantly in
            full HD.
          </p>
          <div className="mt-8 flex justify-center sm:mt-9">
            <Link
              href="/templates"
              className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-full px-9 py-3.5 font-heading text-sm font-bold text-white shadow-[0_8px_28px_-6px_rgba(255,100,90,0.45)] transition hover:brightness-[1.03] hover:shadow-[0_10px_32px_-6px_rgba(255,90,100,0.5)] active:scale-[0.99]"
              style={{
                background: "#e85025",
              }}
            >
              Browse Templates
              <span className="text-base leading-none" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      <InvitationCategories />
      <PopularTagsSection />

      <section className="bg-[#f9f9f9] py-12 sm:py-14 md:py-16">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center sm:mb-10 md:mb-12">
            <h2 className={`${sectionHeading} leading-tight tracking-tight`}>
              <span className="text-[var(--text-primary)]">All </span>
              <span style={{ color: "var(--brand-end)" }}>Templates</span>
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)] sm:text-[15px]">{templates.length} video invitations</p>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {popular.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
          <div className="mt-10 flex justify-center sm:mt-12">
            <Link
              href="/templates"
              className="rounded-full border-2 border-[var(--brand-primary)] bg-white px-8 py-3 font-heading text-sm font-semibold text-[var(--brand-primary)] shadow-sm transition hover:bg-[var(--brand-primary)] hover:text-white"
            >
              View All Templates →
            </Link>
          </div>
        </div>
      </section>
      <HowItWorksSection />

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
    </>
  );
}
