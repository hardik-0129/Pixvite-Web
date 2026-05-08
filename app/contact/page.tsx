import { ContactForm } from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <div className="max-w-full grow overflow-x-hidden bg-[#f9fafb]">
      <div className="mb-6 flex w-full justify-center border-b border-[var(--border)] bg-[var(--card)] px-4 py-10">
        <div className="w-full max-w-2xl">
          <h1 className="mb-2 text-center text-3xl font-semibold text-[var(--foreground)]">
            ⭐ CONTACT US — Pixvite
          </h1>
          <p className="mb-4 text-center text-[var(--foreground)]">We&apos;re here to help you!</p>
          <div className="mb-3 text-center text-[var(--foreground)]">
            For any support, revision request, billing question, or product issue — contact us:
          </div>
          <div className="mb-3 text-[var(--foreground)]">
            <strong>📩 Email</strong>
            <br />
            <a  
              href="mailto:hello@pixvite.com"
              className="underline"
              style={{ color: "var(--brand-end)" }}
            >
              hello@pixvite.com
            </a>
          </div>
          <div className="mb-3 text-[var(--foreground)]">
            <strong>📸 Instagram (Primary Support)</strong>
            <br />
            <span className="font-medium">@pixvite</span>
          </div>
          <div className="mb-3 text-[var(--foreground)]">We reply quickly on Instagram DMs, including:</div>
          <ul className="mx-auto mb-2 inline-block list-inside list-disc space-y-1 text-left text-[var(--foreground)]">
            <li>Revision requests</li>
            <li>Template queries</li>
            <li>Payment issues</li>
            <li>Technical help</li>
          </ul>
          <div className="mt-2 text-center text-xs text-[var(--muted-foreground)]">
            No phone or WhatsApp support is currently available.
          </div>
        </div>
      </div>

      <div className="w-full py-12">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2
              className="mb-4 font-heading text-3xl font-bold text-[var(--foreground)] md:text-4xl lg:text-5xl"
              style={{ fontFamily: "var(--font-header)" }}
            >
              Contact Us
            </h2>
            <p
              className="text-base md:text-lg"
              style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
            >
              Have a question or need help? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as
              soon as possible.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm md:p-8 lg:p-10">
            <ContactForm />
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
              <h3
                className="mb-3 text-xl font-semibold text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-header)" }}
              >
                Email Us
              </h3>
              <p style={{ color: "var(--muted-foreground)" }}>
                <a
                  href="mailto:hello@pixvite.com"
                  className="transition hover:opacity-80"
                  style={{ color: "var(--brand-end)" }}
                >
                  hello@pixvite.com
                </a>
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
              <h3
                className="mb-3 text-xl font-semibold text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-header)" }}
              >
                Response Time
              </h3>
              <p style={{ color: "var(--muted-foreground)" }}>
                We typically respond within 2–4 hours during business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
