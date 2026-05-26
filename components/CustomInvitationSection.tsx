import Image from "next/image";
import Link from "next/link";

const steps = [
  {
    num: 1,
    title: "Choose The Invitation Type",
    details: [
      {
        label: "Event Type:",
        text: "Specify the event (e.g., wedding, birthday, corporate event, baby shower)",
      },
      {
        label: "Format:",
        text: "Select the format you want (e.g., digital, print, or both)",
      },
    ],
  },
  { num: 2, title: "Provide Event Details", details: [] },
  { num: 3, title: "Select Design Preferences", details: [] },
  { num: 4, title: "Payment & Delivery", details: [] },
];

export function CustomInvitationSection() {
  return (
    <section className="py-16 sm:py-20" style={{ background: "#ffffff" }}>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mb-10 text-center sm:mb-14">
          <h2 className="font-heading text-3xl font-extrabold uppercase leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            <span className="text-[var(--text-primary)]">Need </span>
            <span className="text-[#e85025]">a Custom Invitation?</span>
            <br />
            <span className="text-[var(--text-primary)]">Let Us Design It!</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            Looking for a unique and professionally designed invitation? Our expert team offers custom invitation
            services for any event. Provide your details, and we&apos;ll create a tailored digital or printed design
            that perfectly matches your vision.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: steps */}
          <div>
            <ul className="space-y-6">
              {steps.map(({ num, title, details }) => (
                <li key={num} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e85025] text-sm font-bold text-white shadow-md">
                    {num}
                  </div>
                  <div className="flex-1">
                    <h3
                      className="font-heading text-base font-bold sm:text-lg"
                      style={{ color: details.length > 0 ? "#e85025" : "var(--text-primary)" }}
                    >
                      {title}
                    </h3>
                    {details.length > 0 && (
                      <ul className="mt-2 space-y-1.5">
                        {details.map(({ label, text }) => (
                          <li key={label} className="text-sm leading-relaxed text-[var(--text-secondary)]">
                            <strong className="font-semibold text-[var(--text-primary)]">{label}</strong> {text}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/contact"
              className="mt-10 inline-flex items-center gap-2 rounded-full border-2 border-[#e85025] px-8 py-3 text-sm font-semibold text-[#e85025] transition hover:bg-[#e85025] hover:text-white"
            >
              <span aria-hidden>✦</span>
              Expert Create
            </Link>
          </div>

          {/* Right: visual mockup */}
          <div className="flex justify-center lg:justify-end">
            <div
              className="relative w-full max-w-lg rounded-3xl p-6 sm:p-8"
              style={{ background: "rgba(232, 80, 37, 0.08)" }}
            >
              {/* Decorative blob */}
              <div
                className="absolute -bottom-6 -right-6 h-40 w-40 rounded-full opacity-20 blur-3xl"
                style={{ background: "#e85025" }}
                aria-hidden
              />
              <div
                className="absolute -left-6 -top-6 h-32 w-32 rounded-full opacity-15 blur-2xl"
                style={{ background: "#e85025" }}
                aria-hidden
              />

              {/* Expert create flow image */}
              <div className="relative overflow-hidden rounded-2xl shadow-lg">
                <Image
                  src="/exper-create-flow.webp"
                  alt="Expert invitation creation flow"
                  width={540}
                  height={420}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
