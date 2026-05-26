import { sectionHeading } from "@/lib/sectionHeading";

const steps = [
  {
    title: "Choose a Template",
    description:
      "Browse 500+ beautifully crafted templates across every occasion — weddings, birthdays, corporate events, festivals, and more. Filter by style, colour, or mood to find your perfect match.",
  },
  {
    title: "Edit Every Detail",
    description:
      "Click any element to edit — change names, dates, venues, colours, fonts, and photos. Our drag-and-drop editor makes customising your invitation feel effortless and fun.",
  },
  {
    title: "Download & Send",
    description:
      "Download your finished invitation as a high-quality image or PDF. Share via WhatsApp, email, or post it directly to social media — your guests will be wowed.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 py-16 sm:py-20"
      style={{ background: "#FBF8F3" }}
    >
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6">
        <div className="mb-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-primary)]">How It Works</span>
        </div>
        <h2 className={`text-center leading-tight tracking-tight ${sectionHeading}`}>
          <span className="block text-[var(--text-primary)]">Create your invitation in</span>
          <em className="block not-italic italic text-[#e85025]">3 simple steps</em>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-[15px] leading-relaxed text-[var(--text-secondary)] sm:text-base">
          No design experience required. Choose, personalise, and send — it really is that simple.
        </p>
        <div className="relative mt-12 grid gap-6 sm:mt-14 md:grid-cols-3 md:gap-8">
          {steps.map(({ title, description }, i) => (
            <div key={title} className="relative flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-7 shadow-[var(--shadow-card)]">
              {i < steps.length - 1 && (
                <div className="absolute -right-4 top-10 z-10 hidden items-center md:flex">
                  <svg width="32" height="12" viewBox="0 0 32 12" fill="none">
                    <path d="M0 6h28M22 1l6 5-6 5" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e85025] text-sm font-bold text-white shadow-md">
                {i + 1}
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] sm:text-xl">{title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
