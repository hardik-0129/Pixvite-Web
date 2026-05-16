import Image from "next/image";
import { sectionHeading } from "@/lib/sectionHeading";

const steps = [
  {
    title: "Pick a Template",
    description: "Choose from beautifully crafted video designs for every celebration.",
    image: "/how-it-works/step-1-template.png",
    alt: "Illustration of invitation template cards with floral accents",
  },
  {
    title: "Add Your Details",
    description: "Edit names, dates, venues & captions with our live preview editor.",
    image: "/how-it-works/step-2-editor.png",
    alt: "Illustration of a live preview editor with colors, text, and music",
  },
  {
    title: "Download in HD",
    description: "Pay only when satisfied and download your full-HD video instantly.",
    image: "/how-it-works/step-3-download.png",
    alt: "Illustration of a phone with a heart on screen and floating hearts",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 py-16 sm:py-20"
      style={{
        background:
          "radial-gradient(ellipse 85% 90% at 18% 45%, rgba(255, 94, 98, 0.09) 0%, transparent 52%), linear-gradient(180deg, #fffbfb 0%, #fff6f6 42%, #ffffff 100%)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6">
        <h2 className={`text-center leading-tight tracking-tight ${sectionHeading}`}>
          <span className="text-[var(--text-primary)]">Create Your Invite in </span>
          <span className="text-[#e85025]">3 Simple Steps</span>
        </h2>
        <div className="mt-12 grid gap-12 sm:mt-14 md:grid-cols-3 md:gap-10 lg:gap-14">
          {steps.map(({ title, description, image, alt }, i) => (
            <div key={title} className="flex flex-col items-center text-center">
              <div className="relative mb-6 aspect-square w-full max-w-[220px]">
                <Image
                  src={image}
                  alt={alt}
                  fill
                  sizes="(max-width: 768px) 70vw, 220px"
                  className="object-contain"
                  priority={i === 0}
                />
              </div>
              <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] sm:text-xl">{title}</h3>
              <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-[#666666] sm:max-w-none">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
